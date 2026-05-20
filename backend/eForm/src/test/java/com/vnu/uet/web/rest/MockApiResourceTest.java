package com.vnu.uet.web.rest;

import com.vnu.uet.EformApp;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
public class MockApiResourceTest {

    @Autowired
    private MockMvc restMockMvc;

    @Test
    public void testGetProfile() throws Exception {
        restMockMvc.perform(get("/api/account/profile")
                .header("Authorization", "Bearer MOCK_TOKEN"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@vnu.uet"))
                .andExpect(jsonPath("$.phone").value("0912345678"))
                .andExpect(jsonPath("$.roles").isArray());
    }

    @Test
    public void testCheckAccess() throws Exception {
        String requestBody = "{\"email\": \"user@vnu.uet\", \"requiredRole\": 2}";

        restMockMvc.perform(post("/api/internal/permissions/check-access")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasAccess").value(true));
    }

    @Test
    public void testRefreshToken() throws Exception {
        String requestBody = "{\"expiredToken\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\", \"email\": \"kyta_ptsc@yopmail.com\"}";

        restMockMvc.perform(post("/api/internal/auth/refresh-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.expiresIn").value(3600))
                .andExpect(jsonPath("$.roles").isArray());
    }
}
