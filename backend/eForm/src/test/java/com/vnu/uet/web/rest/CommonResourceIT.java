package com.vnu.uet.web.rest;

import com.vnu.uet.EformApp;
import com.vnu.uet.service.rest.client.EflowClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import com.vnu.uet.domain.Form;
import com.vnu.uet.repository.FormRepository;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
public class CommonResourceIT {

    @Autowired
    private MockMvc restCommonMockMvc;

    @MockBean
    private EflowClient eflowClient;

    @MockBean
    private FormRepository formRepository;

    @Test
    public void testCheckEdit() throws Exception {
        // Mock form existence
        when(formRepository.existsById("test-id")).thenReturn(true);
        Form form = new Form();
        form.setFormId("test-id");
        form.setStatusForm(1L); // Draft
        form.setCreatedBy("admin");
        form.setTag("");
        when(formRepository.findFormByFormId("test-id")).thenReturn(form);
        when(formRepository.findById("test-id")).thenReturn(java.util.Optional.of(form));

        // Mock eFlow response to return true (releasing)
        when(eflowClient.isFormReleasing(anyString())).thenReturn(ResponseEntity.ok(true));

        restCommonMockMvc.perform(get("/api/common/check-edit?formId=test-id"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lockStructure").value(true));
    }

    @Test
    public void testGetAccount() throws Exception {
        restCommonMockMvc.perform(get("/api/account"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.login").value("admin"))
                .andExpect(jsonPath("$.orgId").value("1"))
                .andExpect(jsonPath("$.avatarUrl").exists());
    }
}
