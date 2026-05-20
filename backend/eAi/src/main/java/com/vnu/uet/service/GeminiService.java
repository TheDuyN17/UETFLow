package com.vnu.uet.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.service.dto.FilledFormResultDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class GeminiService {

    private final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key:dummy-api-key}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public FilledFormResultDTO processDocumentExtraction(String rawText, String formName, String formTemplateJson) {
        log.info("Sending document data to Gemini AI for processing. Form: {}", formName);
        
        try {
            if ("dummy-api-key".equals(apiKey)) {
                log.warn("Gemini API key is not configured. Returning mock data.");
                return generateMockFilledFormResult(formName);
            }

            // TODO: Integrate com.google.genai SDK
            // Example hypothetical usage:
            /*
             * GenerativeModel model = GenerativeModel.builder().apiKey(apiKey).modelName("gemini-2.0-flash").build();
             * String prompt = createSystemPrompt() + "\nRaw Text:\n" + rawText + "\nTemplate JSON:\n" + formTemplateJson;
             * GenerateContentResponse response = model.generateContent(prompt);
             * String jsonResult = extractJsonFromResponse(response.getText());
             * return parseJsonResult(jsonResult);
             */

            return generateMockFilledFormResult(formName);
        } catch (Exception e) {
            log.error("Failed to process document with Gemini AI", e);
            throw new RuntimeException("Gemini Processing Failed", e);
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
