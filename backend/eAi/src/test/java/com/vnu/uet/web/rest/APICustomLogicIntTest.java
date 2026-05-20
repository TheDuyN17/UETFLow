package com.vnu.uet.web.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.IntegrationTest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class APICustomLogicIntTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final List<TestDetail> testDetails = new ArrayList<>();
    
    // Shared state between tests to simulate flow
    private static String sharedTaskId = null;

    private static class TestDetail {
        String endpoint;
        String scenario;
        String statusIcon;
        String resultType;
        String failReason;
        String expected;
        String actual;
        String curl;
        String response;
        int httpStatus;

        public TestDetail(String endpoint, String scenario, String statusIcon, String resultType, 
                          String failReason, String expected, String actual, String curl, 
                          String response, int httpStatus) {
            this.endpoint = endpoint;
            this.scenario = scenario;
            this.statusIcon = statusIcon;
            this.resultType = resultType;
            this.failReason = failReason;
            this.expected = expected;
            this.actual = actual;
            this.curl = curl;
            this.response = response;
            this.httpStatus = httpStatus;
        }
    }

    private String toCurl(String method, String url, String body, boolean isMultipart) {
        StringBuilder curl = new StringBuilder("curl -X ").append(method).append(" '").append(url).append("'");
        if (isMultipart) {
            curl.append(" -H 'Content-Type: multipart/form-data'");
            curl.append(" -F 'file=@dummy.pdf'");
            curl.append(" -F 'formName=id_card_declaration'");
        } else {
            curl.append(" -H 'Content-Type: application/json'");
            if (body != null && !body.isEmpty()) {
                curl.append(" -d '").append(body.replace("'", "\\'")).append("'");
            }
        }
        return curl.toString();
    }

    private byte[] createMinimalPdf() {
        try (org.apache.pdfbox.pdmodel.PDDocument doc = new org.apache.pdfbox.pdmodel.PDDocument()) {
            org.apache.pdfbox.pdmodel.PDPage page = new org.apache.pdfbox.pdmodel.PDPage();
            doc.addPage(page);
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            return "dummy pdf content".getBytes();
        }
    }

    private MvcResult performAndLog(String method, String url, String body, boolean isMultipart, 
                                    String scenario, String expected) throws Exception {
        String curl = toCurl(method, url, body, isMultipart);
        MvcResult result;
        
        if (isMultipart) {
            MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", createMinimalPdf()
            );
            result = mockMvc.perform(multipart(url)
                            .file(file)
                            .param("formName", "id_card_declaration"))
                    .andReturn();
        } else if ("POST".equalsIgnoreCase(method)) {
            result = mockMvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(body != null ? body : "")).andReturn();
        } else {
            result = mockMvc.perform(get(url).contentType(MediaType.APPLICATION_JSON).content(body != null ? body : "")).andReturn();
        }

        int status = result.getResponse().getStatus();
        String responseRaw = result.getResponse().getContentAsString();
        String responsePretty = responseRaw;

        try {
            if (!responseRaw.isEmpty()) {
                Object json = objectMapper.readValue(responseRaw, Object.class);
                responsePretty = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(json);
            }
        } catch (Exception e) {}

        boolean isSuccess = (status >= 200 && status < 300) || (status == 404 && expected != null && expected.contains("hoặc 404"));
        String statusIcon = isSuccess ? "🟢" : "🔴";
        String resultType = isSuccess ? "Thành công" : "Thất bại";
        String actual = "HTTP " + status;
        
        String failReason = "N/A";
        if (!isSuccess) {
            try {
                JsonNode root = objectMapper.readTree(responseRaw);
                failReason = root.has("detail") ? root.get("detail").asText() : 
                            (root.has("message") ? root.get("message").asText() : "Lỗi không xác định hoặc Validation failed");
            } catch (Exception e) {
                failReason = "Không parsing được lỗi (Raw HTML/Text hoặc rỗng)";
            }
        }

        testDetails.add(
            new TestDetail(
                method + " " + url,
                scenario,
                statusIcon,
                resultType,
                failReason,
                expected,
                actual,
                curl,
                responsePretty.isEmpty() ? "(Trống)" : responsePretty,
                status
            )
        );
        return result;
    }

    @Test
    @Order(1)
    void testUploadDocumentAsync() throws Exception {
        MvcResult result = performAndLog(
            "POST",
            "/api/document-maps",
            null,
            true,
            "Trích xuất và điền form bất đồng bộ (Upload Async)",
            "Hệ thống trả về ngay lập tức mã taskId và trạng thái PROCESSING"
        );
        
        if (result.getResponse().getStatus() == 200) {
            JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
            sharedTaskId = root.get("taskId").asText();
        }
    }

    @Test
    @Order(2)
    void testCheckProcessingStatus() throws Exception {
        String url = sharedTaskId != null ? "/api/document-maps/" + sharedTaskId + "/status" : "/api/document-maps/999/status";
        
        performAndLog(
            "GET",
            url,
            null,
            false,
            "Kiểm tra trạng thái tiến trình (Check Status)",
            "Hệ thống trả về trạng thái PROCESSING hoặc COMPLETED"
        );
    }
    
    @Test
    @Order(3)
    void testGetRawTextNotFoundOrPending() throws Exception {
        String url = sharedTaskId != null ? "/api/document-maps/" + sharedTaskId + "/raw-text" : "/api/document-maps/999/raw-text";
        
        // Since it's async, it might not be done yet, or it might fail because of mock data.
        // We just log it.
        performAndLog(
            "GET",
            url,
            null,
            false,
            "Xem văn bản thô (Get Raw Text)",
            "Trả về chuỗi text trích xuất từ PDF (hoặc 404 nếu chưa xong)"
        );
    }

    @Test
    @Order(4)
    void testUploadDocumentSync() throws Exception {
        performAndLog(
            "POST",
            "/api/document-maps/sync",
            null,
            true,
            "Trích xuất và điền form đồng bộ (Upload Sync blocking)",
            "Chờ đến khi xử lý AI xong và trả trực tiếp cục JSON dữ liệu đã điền (FilledFormResultDTO)"
        );
    }

    @AfterAll
    static void generateReport() {
        try {
            Path path = Path.of("target/api-test-results.md");
            Files.createDirectories(path.getParent());
            long total = testDetails.size();
            long success = testDetails.stream().filter(d -> d.statusIcon.equals("🟢")).count();
            long failed = total - success;

            StringBuilder md = new StringBuilder();
            md.append("# 🚀 CHI TIẾT BÁO CÁO KIỂM THỬ KỊCH BẢN LOGIC E-AI\n\n");
            md.append("## 📊 TỔNG QUAN\n");
            md.append("> [!IMPORTANT]\n");
            md.append(String.format("> - **Tổng số kịch bản:** `%d` \n", total));
            md.append(String.format("> - **Thành công:** 🟢 `%d` \n", success));
            md.append(String.format("> - **Thất bại/Cảnh báo:** 🔴 `%d` \n\n", failed));
            md.append("--- \n\n");

            for (int i = 0; i < testDetails.size(); i++) {
                TestDetail d = testDetails.get(i);
                md.append(String.format("### %d. %s %s\n", i + 1, d.statusIcon, d.scenario));
                md.append(String.format("- **API Endpoint:** `%s`\n", d.endpoint));
                md.append(String.format("- **Kết quả:** `%s`\n", d.resultType));
                
                if (!d.statusIcon.equals("🟢")) {
                    md.append(String.format("- **Nguyên nhân Failed (Lỗi %d):** `%s`\n", d.httpStatus, d.failReason));
                }
                
                md.append(String.format("- **Dự kiến:** %s\n", d.expected));
                md.append(String.format("- **Thực tế:** %s\n\n", d.actual));
                md.append("<details><summary><b>🛠 Input / Output (Click để mở rộng)</b></summary>\n\n");
                md.append("#### 📥 Request (cUrl)\n```bash\n").append(d.curl).append("\n```\n\n");
                md.append(String.format("#### 📤 Response (HTTP `%d`)\n```json\n%s\n```\n\n", d.httpStatus, d.response));
                md.append("</details>\n\n---\n\n");
            }
            Files.writeString(path, md.toString(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
