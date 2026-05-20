package com.vnu.uet.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.service.dto.FilledFormResultDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class GeminiService {

    private final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key:dummy-api-key}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-2.0-flash}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public FilledFormResultDTO processDocumentExtraction(String rawText, String formName, String formTemplateJson) {
        log.info("Processing extraction with Gemini AI. Form: {}, rawText length: {}",
                formName, rawText == null ? 0 : rawText.length());

        if (apiKey == null || apiKey.isBlank() || "dummy-api-key".equals(apiKey) || "dummy".equals(apiKey)) {
            log.warn("Gemini API key is not configured. Returning mock data.");
            return generateMockFilledFormResult(formName);
        }

        try {
            String prompt = buildPrompt(rawText, formName, formTemplateJson);
            String responseText = callGeminiApi(prompt);
            return parseGeminiResponse(responseText, formName);
        } catch (Exception e) {
            log.error("Gemini API call failed, falling back to mock data", e);
            return generateMockFilledFormResult(formName);
        }
    }

    private String buildPrompt(String rawText, String formName, String formTemplateJson) {
        return "Bạn là AI trợ lý trích xuất thông tin từ văn bản tiếng Việt.\n\n"
                + "NHIỆM VỤ: Phân tích văn bản (từ OCR PDF) và trích xuất thông tin theo form đã cho.\n\n"
                + "FORM NAME: " + (formName == null ? "Unknown" : formName) + "\n\n"
                + "FORM SCHEMA:\n" + (formTemplateJson == null ? "{}" : formTemplateJson) + "\n\n"
                + "RAW TEXT (từ OCR PDF):\n" + (rawText == null ? "(trống)" : rawText) + "\n\n"
                + "YÊU CẦU OUTPUT (chỉ JSON, không markdown, không giải thích):\n"
                + "{\n"
                + "  \"confidence\": <số từ 0.0 đến 1.0>,\n"
                + "  \"filledData\": { <field_name: value đã trích xuất> },\n"
                + "  \"missingFields\": \"<các field không tìm thấy, phân cách bằng dấu phẩy>\"\n"
                + "}\n\n"
                + "CHÚ Ý:\n"
                + "- Trích xuất MỌI thông tin có trong văn bản (họ tên, ngày sinh, CCCD, phòng ban, lý do, ngày nghỉ...)\n"
                + "- Format ngày: dd/MM/yyyy\n"
                + "- Tên người: Viết hoa chữ cái đầu mỗi từ\n"
                + "- Chỉ trả JSON thuần, không có ```json``` hay bất kỳ markdown nào";
    }

    private String callGeminiApi(String prompt) throws Exception {
        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                model, apiKey);

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", new Object[]{part});

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("temperature", 0.1);
        generationConfig.put("maxOutputTokens", 1024);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", new Object[]{content});
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        log.info("Calling Gemini API: model={}, prompt length={}", model, prompt.length());
        String response = restTemplate.postForObject(url, request, String.class);
        log.debug("Gemini raw response: {}", response);

        JsonNode root = objectMapper.readTree(response);
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && candidates.size() > 0) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isArray() && parts.size() > 0) {
                String text = parts.get(0).path("text").asText();
                log.info("Gemini returned text length: {}", text.length());
                return text;
            }
        }
        throw new RuntimeException("Empty or unexpected Gemini response: " + response);
    }

    private FilledFormResultDTO parseGeminiResponse(String responseText, String formName) {
        try {
            // Strip any accidental markdown fences
            String cleaned = responseText.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
            }

            JsonNode root = objectMapper.readTree(cleaned);

            FilledFormResultDTO dto = new FilledFormResultDTO();
            dto.setFormName(formName);
            dto.setConfidence(root.path("confidence").asDouble(0.85));
            dto.setMissingFields(root.path("missingFields").asText(""));

            JsonNode filledData = root.path("filledData");
            dto.setFilledData(objectMapper.writeValueAsString(filledData));

            log.info("Gemini extraction complete. Confidence: {}, Fields: {}",
                    dto.getConfidence(), filledData.size());
            return dto;
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", responseText, e);
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }

    private FilledFormResultDTO generateMockFilledFormResult(String formName) {
        FilledFormResultDTO dto = new FilledFormResultDTO();
        dto.setFormName(formName);
        dto.setConfidence(0.95);
        dto.setMissingFields("ngay_cap, noi_cap");

        Map<String, String> mockData = new HashMap<>();
        mockData.put("ho_ten", "NGUYEN VAN A");
        mockData.put("so_cccd", "012345678901");
        mockData.put("ngay_sinh", "01/01/1990");
        mockData.put("gioi_tinh", "Nam");

        try {
            dto.setFilledData(objectMapper.writeValueAsString(mockData));
        } catch (Exception e) {
            dto.setFilledData("{}");
        }

        return dto;
    }
}
