package com.vnu.uet.web.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.IntegrationTest;
import com.vnu.uet.domain.UserProfile;
import com.vnu.uet.repository.UserProfileRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class APICustomLogicIntTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserProfileRepository userProfileRepository;

    private static final List<TestDetail> testDetails = new ArrayList<>();

    private static class TestDetail {
        String endpoint;
        String scenario;
        String statusIcon;
        String resultType;
        String expected;
        String actual;
        String curl;
        String response;
        int httpStatus;

        public TestDetail(
            String endpoint,
            String scenario,
            String statusIcon,
            String resultType,
            String expected,
            String actual,
            String curl,
            String response,
            int httpStatus
        ) {
            this.endpoint = endpoint;
            this.scenario = scenario;
            this.statusIcon = statusIcon;
            this.resultType = resultType;
            this.expected = expected;
            this.actual = actual;
            this.curl = curl;
            this.response = response;
            this.httpStatus = httpStatus;
        }
    }

    private String toCurl(String method, String url, String body) {
        StringBuilder curl = new StringBuilder("curl -X ").append(method).append(" '").append(url).append("'");
        curl.append(" -H 'Content-Type: application/json'");
        if (body != null && !body.isEmpty()) {
            curl.append(" -d '").append(body.replace("'", "\\'")).append("'");
        }
        return curl.toString();
    }

    @BeforeEach
    void seedMinimalData() {
        userProfileRepository
            .findOneByEmail("admin@vnu.uet")
            .orElseGet(() -> {
                UserProfile admin = new UserProfile();
                admin.setEmail("admin@vnu.uet");
                admin.setFirstName("Admin");
                admin.setPhone("0900000000");
                admin.setDepartment("IT");
                admin.setIsActive(true);
                admin.setPassword("ENCODED_admin");
                return userProfileRepository.save(admin);
            });
    }

    private MvcResult performAndLog(String method, String url, String body, String scenario, String expected) throws Exception {
        String curl = toCurl(method, url, body);
        MvcResult result;
        if ("POST".equalsIgnoreCase(method)) {
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

        boolean isSuccess = status >= 200 && status < 300;
        String statusIcon = isSuccess ? "🟢" : "🔴";
        String resultType = isSuccess ? "Thành công" : "Lỗi hệ thống";
        String actual = isSuccess ? "HTTP " + status : "Lỗi HTTP " + status;

        testDetails.add(
            new TestDetail(
                method + " " + url,
                scenario,
                statusIcon,
                resultType,
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
    @Transactional
    void testVerifyCredentials_Success() throws Exception {
        Map<String, String> creds = new HashMap<>();
        creds.put("email", "admin@vnu.uet");
        creds.put("password", "admin");
        String payload = objectMapper.writeValueAsString(creds);

        performAndLog(
            "POST",
            "/api/internal/auth/generate-token",
            payload,
            "Xác thực Internal: Email & mật khẩu đúng",
            "Trả về token và danh sách quyền của User (nếu xác thực thành công)"
        );
    }

    @Test
    @Transactional
    void testCreateEmployee_Success() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("email", "new_emp@vnu.uet");
        request.put("firstName", "New Employee");
        request.put("phone", "0123456789");
        request.put("department", "HR");
        String payload = objectMapper.writeValueAsString(request);

        performAndLog(
            "POST",
            "/api/account/profile",
            payload,
            "Tạo nhân sự mới (Quyền 1)",
            "Tạo tài khoản thành công và trả về email kèm mật khẩu khởi tạo"
        );
    }

    @Test
    @Transactional
    void testSearchAccount_AndCheckDeletable() throws Exception {
        Map<String, String> searchReq = new HashMap<>();
        searchReq.put("email", "admin@vnu.uet");
        String payload = objectMapper.writeValueAsString(searchReq);

        performAndLog(
            "POST",
            "/api/management/account/search",
            payload,
            "Tìm kiếm tài khoản (Quyền 4)",
            "Trả về thông tin chi tiết tài khoản và danh sách quyền hiện tại"
        );

        performAndLog(
            "POST",
            "/api/management/account/check-deletable",
            payload,
            "Kiểm tra thẩm quyền xóa",
            "Đánh giá đúng mô hình Quyền Âm/Dương để xác nhận có thể xóa hay không"
        );
    }

    @Test
    @Transactional
    void testAssignPermission_ModelAmDuong() throws Exception {
        Map<String, Object> assignReq = new HashMap<>();
        assignReq.put("email", "user@vnu.uet");
        assignReq.put("roles", List.of(-1, 2));
        String payload = objectMapper.writeValueAsString(assignReq);

        performAndLog(
            "POST",
            "/api/permissions/sync",
            payload,
            "Phân quyền: Gán quyền Dương (Quyền 5)",
            "Cập nhật danh sách quyền của user theo mô hình Quyền Âm/Dương"
        );
    }

    @AfterAll
    static void generateReport() {
        try {
            Path path = Paths.get("target/api-test-results.md");
            Files.createDirectories(path.getParent());
            long total = testDetails.size();
            long success = testDetails.stream().filter(d -> d.statusIcon.equals("🟢")).count();
            long failed = total - success;

            StringBuilder md = new StringBuilder();
            md.append("# 🚀 CHI TIẾT KẾT QUẢ KIỂM THỬ API LOGIC - EACCOUNT\n\n");
            md.append("## 📊 TỔNG QUAN HỆ THỐNG\n");
            md.append("> [!IMPORTANT]\n");
            md.append(String.format("> - **Tổng số kịch bản:** `%d` \n", total));
            md.append(String.format("> - **Thành công:** 🟢 `%d` \n", success));
            md.append(String.format("> - **Thất bại/Cảnh báo:** 🔴 `%d` \n\n", failed));
            md.append("--- \n\n");

            for (int i = 0; i < testDetails.size(); i++) {
                TestDetail d = testDetails.get(i);
                md.append(String.format("### %d. %s %s\n", i + 1, d.statusIcon, d.scenario));
                md.append(String.format("- **Endpoint:** `%s`\n", d.endpoint));
                md.append(String.format("- **Kết quả:** `%s`\n", d.resultType));
                md.append(String.format("- **Dự đoán:** %s\n", d.expected));
                md.append(String.format("- **Thực tế:** %s\n\n", d.actual));
                md.append("<details><summary><b>🛠 DIAGNOSTIC</b></summary>\n\n");
                md.append("#### 📥 Input (cUrl)\n```bash\n").append(d.curl).append("\n```\n\n");
                md.append(String.format("#### 📤 Output (Response) - HTTP `%d`\n```json\n%s\n```\n\n", d.httpStatus, d.response));
                md.append("</details>\n\n---\n\n");
            }
            Files.writeString(path, md.toString(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

