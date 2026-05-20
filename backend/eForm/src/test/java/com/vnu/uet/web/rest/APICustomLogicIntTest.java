package com.vnu.uet.web.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.EformApp;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Integration tests for API Logic and detailed reporting.
 * This class generates a rich Markdown report in target/api-test-results.md
 */
@SpringBootTest(classes = EformApp.class, properties = {
    "spring.liquibase.enabled=false",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "application.uaa-name=http://mock-uaa",
    "application.eflow-url=http://mock-eflow"
})
@AutoConfigureMockMvc
@WithMockUser(username = "admin", roles = {"ADMIN"})
class APICustomLogicIntTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final List<TestDetail> testDetails = new ArrayList<>();
    private static String createdFormId;

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

        public TestDetail(String endpoint, String scenario, String statusIcon, String resultType, String expected, String actual, String curl, String response, int httpStatus) {
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
            // Escape single quotes for bash
            String escapedBody = body.replace("'", "'\\''");
            curl.append(" -d '").append(escapedBody).append("'");
        }
        return curl.toString();
    }

    private MvcResult performAndLog(String method, String url, String body, String scenario, String expected) throws Exception {
        String curl = toCurl(method, url, body);
        MvcResult result;
        if ("POST".equalsIgnoreCase(method)) {
            result = mockMvc.perform(post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body != null ? body : ""))
                .andReturn();
        } else if ("PUT".equalsIgnoreCase(method)) {
            result = mockMvc.perform(put(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body != null ? body : ""))
                .andReturn();
        } else if ("DELETE".equalsIgnoreCase(method)) {
            result = mockMvc.perform(delete(url)
                .contentType(MediaType.APPLICATION_JSON))
                .andReturn();
        } else {
            result = mockMvc.perform(get(url)
                .contentType(MediaType.APPLICATION_JSON))
                .andReturn();
        }

        int status = result.getResponse().getStatus();
        String responseRaw = result.getResponse().getContentAsString();
        String responsePretty = responseRaw;

        try {
            if (!responseRaw.isEmpty()) {
                Object json = objectMapper.readValue(responseRaw, Object.class);
                responsePretty = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(json);
            }
        } catch (Exception e) {
            // Fallback to raw if not JSON
        }

        boolean isSuccess = status >= 200 && status < 300;
        String statusIcon = isSuccess ? "🟢" : "🔴";
        String resultType = isSuccess ? "Thành Công" : "Lỗi Hệ Thống";
        String actual = isSuccess ? "HTTP " + status : "Lỗi HTTP " + status;

        testDetails.add(new TestDetail(
            method + " " + url, 
            scenario, 
            statusIcon, 
            resultType, 
            expected, 
            actual, 
            curl, 
            responsePretty.isEmpty() ? "(Trống)" : responsePretty, 
            status
        ));
        return result;
    }

    // ============================================================
    // NHÓM 1: Thông tin tài khoản & Phân quyền
    // ============================================================

    @Test
    void test01_GetAccount_BasicLogic() throws Exception {
        performAndLog("GET", "/api/account", null,
            "[/account] Lấy thông tin tài khoản hiện tại",
            "Trả về thông tin user đang đăng nhập với HTTP 200");
    }

    // ============================================================
    // NHÓM 2: Tạo mới biểu mẫu (POST /api/owner/form)
    // ============================================================

    @Test
    void test02_CreateForm_HappyPath() throws Exception {
        String body = "{" +
            "\"formCode\":\"TEST_FORM_001\"," +
            "\"formName\":\"Biểu mẫu kiểm thử số 1\"," +
            "\"describeForm\":\"Biểu mẫu dùng cho mục đích kiểm thử tự động\"," +
            "\"jsonForm\":\"[]\"," +
            "\"tag\":\"test\"," +
            "\"beginTime\":\"2026-01-01\"," +
            "\"endTime\":\"2049-12-31\"" +
            "}";
        MvcResult result = performAndLog("POST", "/api/owner/form", body,
            "[POST /api/owner/form] Tạo mới biểu mẫu với đầy đủ thông tin hợp lệ",
            "Biểu mẫu được tạo thành công, trả về formId mới sinh (HTTP 200)");
        
        if (result.getResponse().getStatus() == 200) {
            String responseBody = result.getResponse().getContentAsString();
            JsonNode jsonNode = objectMapper.readTree(responseBody);
            if (jsonNode.has("formId")) {
                createdFormId = jsonNode.get("formId").asText();
            }
        }
    }

    @Test
    void test03_CreateForm_MissingFormName() throws Exception {
        String body = "{" +
            "\"formCode\":\"TEST_FORM_NONAME\"," +
            "\"describeForm\":\"Thiếu trường formName\"," +
            "\"jsonForm\":\"[]\"," +
            "\"beginTime\":\"2026-01-01 00:00:00\"," +
            "\"endTime\":\"2049-12-31 23:59:59\"" +
            "}";
        performAndLog("POST", "/api/owner/form", body,
            "[POST /api/owner/form] Tạo biểu mẫu thiếu trường formName bắt buộc",
            "Hệ thống từ chối request (HTTP 400 Bad Request hoặc thông báo lỗi validation)");
    }

    @Test
    void test04_CreateForm_InvalidDateRange() throws Exception {
        String body = "{" +
            "\"formCode\":\"TEST_FORM_BADDATE\"," +
            "\"formName\":\"Form ngày không hợp lệ\"," +
            "\"jsonForm\":\"[]\"," +
            "\"beginTime\":\"2049-12-31 23:59:59\"," +
            "\"endTime\":\"2026-01-01 00:00:00\"" +
            "}";
        performAndLog("POST", "/api/owner/form", body,
            "[POST /api/owner/form] Tạo biểu mẫu với ngày bắt đầu > ngày kết thúc",
            "Hệ thống trả lỗi vì khoảng thời gian hiệu lực không hợp lệ (HTTP 400 hoặc 500)");
    }

    // ============================================================
    // NHÓM 3: Lấy thông tin biểu mẫu (GET /api/owner/form)
    // ============================================================

    @Test
    void test05_GetForm_ValidId() throws Exception {
        String url = "/api/owner/form?formId=" + (createdFormId != null ? createdFormId : "test-form-123");
        performAndLog("GET", url, null,
            "[GET /api/owner/form] Lấy thông tin form với formId hợp lệ",
            "Trả về toàn bộ thông tin biểu mẫu (HTTP 200)");
    }

    @Test
    void test06_GetForm_InvalidId() throws Exception {
        performAndLog("GET", "/api/owner/form?formId=nonexistent-form-xyz", null,
            "[GET /api/owner/form] Truy xuất thông tin form không tồn tại trong hệ thống",
            "Trả về thông báo lỗi 'FormId not exist' (HTTP 200 với data=false hoặc HTTP 404)");
    }

    @Test
    void test07_GetForm_EmptyFormId() throws Exception {
        performAndLog("GET", "/api/owner/form?formId=", null,
            "[GET /api/owner/form] Tham số formId để trống (empty string)",
            "Hệ thống trả lỗi validation, không cho phép formId rỗng");
    }

    // ============================================================
    // NHÓM 4: Cập nhật biểu mẫu (PUT /api/owner/form)
    // ============================================================

    @Test
    void test08_UpdateForm_HappyPath() throws Exception {
        String body = "{" +
            "\"formId\":\"" + (createdFormId != null ? createdFormId : "test-form-123") + "\"," +
            "\"formCode\":\"TF-123-UPDATED\"," +
            "\"formName\":\"Biểu mẫu đã cập nhật\"," +
            "\"describeForm\":\"Mô tả mới sau khi cập nhật\"," +
            "\"jsonForm\":\"[{\\\"id\\\":\\\"row-1\\\",\\\"type\\\":\\\"row\\\"}]\"," +
            "\"jsonFormCondition\":\"[]\"," +
            "\"tag\":\"updated\"," +
            "\"beginTime\":\"2026-01-01\"," +
            "\"endTime\":\"2049-12-31\"," +
            "\"variableArr\":[{\"code\":\"row-1\",\"variableName\":\"row\",\"variableType\":\"row\"}]" +
            "}";
        performAndLog("PUT", "/api/owner/form", body,
            "[PUT /api/owner/form] Cập nhật nội dung biểu mẫu (formName, jsonForm, variableArr)",
            "Biểu mẫu được cập nhật thành công với thông tin mới (HTTP 200)");
    }

    @Test
    void test09_UpdateForm_NonExistentId() throws Exception {
        String body = "{" +
            "\"formId\":\"form-does-not-exist-999\"," +
            "\"formName\":\"Cập nhật form không tồn tại\"," +
            "\"beginTime\":\"2026-01-01 00:00:00\"," +
            "\"endTime\":\"2049-12-31 23:59:59\"" +
            "}";
        performAndLog("PUT", "/api/owner/form", body,
            "[PUT /api/owner/form] Cập nhật form với formId không tồn tại trong hệ thống",
            "Hệ thống phải trả lỗi 'FormId not exist' (HTTP 200 data=false hoặc HTTP 404/400)");
    }

    // ============================================================
    // NHÓM 5: Tìm kiếm danh sách biểu mẫu (POST /api/owner/find-form)
    // ============================================================

    @Test
    void test10_FindForm_DefaultSearch() throws Exception {
        String body = "{}";
        performAndLog("POST", "/api/owner/find-form?page=0&size=20&sort=createdDate,desc", body,
            "[POST /api/owner/find-form] Tìm kiếm biểu mẫu với bộ lọc mặc định (rỗng), phân trang trang đầu",
            "Trả về danh sách biểu mẫu phân trang, page 0, size 20 (HTTP 200)");
    }

    @Test
    void test11_FindForm_FilterByStatus() throws Exception {
        String body = "{\"statusForm\":[\"editing\"]}";
        performAndLog("POST", "/api/owner/find-form?page=0&size=8&sort=createdDate,desc", body,
            "[POST /api/owner/find-form] Lọc biểu mẫu theo trạng thái 'editing' (đang soạn thảo)",
            "Kết quả chỉ chứa các form có statusForm=editing (HTTP 200)");
    }

    @Test
    void test12_FindForm_FilterByDateRange() throws Exception {
        String body = "{" +
            "\"beginDate\":\"2026-01-01\"," +
            "\"endDate\":\"2026-12-31\"" +
            "}";
        performAndLog("POST", "/api/owner/find-form?page=0&size=20&sort=createdDate,desc", body,
            "[POST /api/owner/find-form] Lọc biểu mẫu theo khoảng thời gian tạo (năm 2026)",
            "Kết quả chỉ chứa các form được tạo trong năm 2026 (HTTP 200)");
    }

    @Test
    void test13_FindForm_FilterByFormName() throws Exception {
        String body = "{\"formName\":\"Biên bản\"}";
        performAndLog("POST", "/api/owner/find-form?page=0&size=20&sort=createdDate,desc", body,
            "[POST /api/owner/find-form] Tìm kiếm biểu mẫu theo từ khóa tên 'Biên bản'",
            "Trả về danh sách form có tên chứa từ khóa 'Biên bản' (HTTP 200)");
    }

    // ============================================================
    // NHÓM 6: Nhân bản biểu mẫu (POST /api/owner/duplicate-form)
    // ============================================================

    @Test
    void test14_DuplicateForm_ValidId() throws Exception {
        String body = "{" +
            "\"formCode\":\"TEST_FORM_COPY\"," +
            "\"formName\":\"Biểu mẫu kiểm thử - Copy\"," +
            "\"describeForm\":\"Bản sao nhân bản từ form kiểm thử\"," +
            "\"jsonForm\":\"[]\"," +
            "\"tag\":\"copy\"," +
            "\"beginTime\":\"2026-01-01\"," +
            "\"endTime\":\"2049-12-31\"" +
            "}";
        String url = "/api/owner/duplicate-form?formId=" + (createdFormId != null ? createdFormId : "test-form-123");
        performAndLog("POST", url, body,
            "[POST /api/owner/duplicate-form] Nhân bản biểu mẫu đang tồn tại trong hệ thống",
            "Biểu mẫu mới được tạo ra giống hệt bản gốc, trả về formId mới (HTTP 200)");
    }

    @Test
    void test15_DuplicateForm_NonExistentId() throws Exception {
        String body = "{" +
            "\"formCode\":\"GHOST_COPY\"," +
            "\"formName\":\"Nhân bản form ma\"," +
            "\"jsonForm\":\"[]\"," +
            "\"beginTime\":\"2026-01-01 00:00:00\"," +
            "\"endTime\":\"2049-12-31 23:59:59\"" +
            "}";
        performAndLog("POST", "/api/owner/duplicate-form?formId=ghost-form-xyz", body,
            "[POST /api/owner/duplicate-form] Nhân bản biểu mẫu với formId không tồn tại",
            "Hệ thống trả lỗi vì form gốc không tồn tại (HTTP 400/404)");
    }

    // ============================================================
    // NHÓM 7: Kiểm tra quyền chỉnh sửa (GET /api/common/check-edit)
    // ============================================================

    @Test
    void test16_CheckEdit_FormNotInActiveFlow() throws Exception {
        String url = "/api/common/check-edit?formId=" + (createdFormId != null ? createdFormId : "test-form-123");
        performAndLog("GET", url, null,
            "[GET /api/common/check-edit] Kiểm tra quyền chỉnh sửa biểu mẫu không thuộc luồng đang Phát hành",
            "Trả về cho phép chỉnh sửa đầy đủ (cả variable code lẫn element) - HTTP 200");
    }

    @Test
    void test17_CheckEdit_FormInActiveFlow() throws Exception {
        // Theo nghiệp vụ (eForm.txt): form đang trong luồng Phát hành thì bị khóa variable code
        performAndLog("GET", "/api/common/check-edit?formId=published-form-locked", null,
            "[GET /api/common/check-edit] Kiểm tra quyền chỉnh sửa form đang ở luồng Phát hành (locked)",
            "Trả về chỉ được chỉnh label/CSS, không được đổi variable code hay xóa element cũ (HTTP 200)");
    }

    @Test
    void test18_CheckEdit_EmptyFormId() throws Exception {
        performAndLog("GET", "/api/common/check-edit?formId=", null,
            "[GET /api/common/check-edit] Tham số formId để trống",
            "Hệ thống trả lỗi validation, không xử lý với formId rỗng");
    }

    // ============================================================
    // NHÓM 8: Phát hành biểu mẫu (GET /api/owner/form/change-status)
    // ============================================================

    @Test
    void test19_PublishForm_ValidId() throws Exception {
        String url = "/api/owner/form/change-status?formId=" + (createdFormId != null ? createdFormId : "test-form-123");
        performAndLog("GET", url, null,
            "[GET /api/owner/form/change-status] Phát hành biểu mẫu hợp lệ (statusForm: editing → published)",
            "Form chuyển sang trạng thái Phát hành (statusForm=2), trả về thông tin form mới (HTTP 200)");
    }

    @Test
    void test20_PublishForm_AlreadyPublished() throws Exception {
        performAndLog("GET", "/api/owner/form/change-status?formId=already-published-form", null,
            "[GET /api/owner/form/change-status] Phát hành biểu mẫu đã ở trạng thái Phát hành",
            "Hệ thống trả lỗi hoặc thông báo form đã được phát hành rồi (HTTP 400/409)");
    }

    @Test
    void test21_PublishForm_NonExistentId() throws Exception {
        performAndLog("GET", "/api/owner/form/change-status?formId=no-such-form", null,
            "[GET /api/owner/form/change-status] Phát hành biểu mẫu không tồn tại trong hệ thống",
            "Hệ thống trả lỗi 'FormId not exist' (HTTP 400/404)");
    }

    // ============================================================
    // NHÓM 9: Ngừng phát hành biểu mẫu (DELETE /api/owner/form/change-status)
    // ============================================================

    @Test
    void test22_UnpublishForm_ValidId() throws Exception {
        String url = "/api/owner/form/change-status?formId=" + (createdFormId != null ? createdFormId : "test-form-123");
        performAndLog("DELETE", url, null,
            "[DELETE /api/owner/form/change-status] Ngừng phát hành biểu mẫu đang ở trạng thái Phát hành",
            "Form chuyển sang trạng thái Ngừng phát hành (statusForm=3), trả về thông tin form (HTTP 200)");
    }

    @Test
    void test23_UnpublishForm_NotPublished() throws Exception {
        performAndLog("DELETE", "/api/owner/form/change-status?formId=draft-form-456", null,
            "[DELETE /api/owner/form/change-status] Ngừng phát hành biểu mẫu đang ở trạng thái 'editing'",
            "Hệ thống phải từ chối vì chỉ form đang Phát hành mới được ngừng phát hành (HTTP 400)");
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
            md.append("# 🚀 CHI TIẾT KẾT QUẢ KIỂM THỬ API LOGIC - EFORM\n\n");
            md.append("## 📊 TỔNG QUAN\n");
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
                
                md.append("<details><summary><b>🛠 DIAGNOSTIC (cURL & Response)</b></summary>\n\n");
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
