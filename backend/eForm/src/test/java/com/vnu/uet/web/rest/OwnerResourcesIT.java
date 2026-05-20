package com.vnu.uet.web.rest;

import com.vnu.uet.EformApp;
import com.vnu.uet.domain.Form;
import com.vnu.uet.repository.FormRepository;
import com.vnu.uet.request.RequestAddForm;
import com.vnu.uet.request.RequestFormDto;
import com.vnu.uet.search.FormSearchOwnerDto;
import com.vnu.uet.service.OwnerService;
import com.vnu.uet.service.dto.CommonInfo;
import com.vnu.uet.service.dto.FormDto;
import com.google.gson.Gson;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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
public class OwnerResourcesIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FormRepository formRepository;

    @MockBean
    private OwnerService ownerService;

    private Gson gson = new Gson();
    private Form mockForm;

    @BeforeEach
    public void setup() {
        Instant now = Instant.now();
        mockForm = new Form();
        mockForm.setFormId("test-form-123");
        mockForm.setFormName("Test Form Name");
        mockForm.setFormCode("TF-123");
        mockForm.setStatusForm(1L);
        mockForm.setTag("");
        mockForm.setBeginTime(now);
        mockForm.setEndTime(now.plus(1, ChronoUnit.DAYS));
        mockForm.setCreatedDate(now);
        mockForm.setLastModifiedDate(now);
    }

    @Test
    public void testSaveForm() throws Exception {
        RequestAddForm request = new RequestAddForm();
        request.setFormName("Test Form Name");
        request.setFormCode("TF-123");
        request.setBeginTime("2024-01-01 00:00:00");
        request.setEndTime("2024-12-31 23:59:59");

        when(ownerService.saveForm(any(RequestAddForm.class))).thenReturn(mockForm);

        mockMvc.perform(post("/api/owner/form")
                .contentType(MediaType.APPLICATION_JSON)
                .content(gson.toJson(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.formId").value("test-form-123"))
                .andExpect(jsonPath("$.formName").value("Test Form Name"));
    }

    @Test
    public void testGetCommonInfo() throws Exception {
        when(formRepository.existsByFormId("test-form-123")).thenReturn(true);
        
        Form tempForm = new Form();
        tempForm.setFormId("test-form-123");
        tempForm.setFormName("Test Form Name");
        tempForm.setTag("");
        tempForm.setBeginTime(Instant.now());
        tempForm.setEndTime(Instant.now().plus(1, ChronoUnit.DAYS));
        tempForm.setCreatedDate(Instant.now());
        tempForm.setLastModifiedDate(Instant.now());
        
        CommonInfo info = new CommonInfo(tempForm);
        when(ownerService.getCommonInfo("test-form-123")).thenReturn(info);

        mockMvc.perform(get("/api/owner/form?formId=test-form-123"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.formId").value("test-form-123"))
                .andExpect(jsonPath("$.formName").value("Test Form Name"));
    }

    @Test
    public void testGetCommonInfoFormNotFound() throws Exception {
        when(formRepository.existsByFormId("invalid-id")).thenReturn(false);

        mockMvc.perform(get("/api/owner/form?formId=invalid-id"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(false))
                .andExpect(jsonPath("$.message").value("FormId not exist"));
    }

    @Test
    public void testUpdateForm() throws Exception {
        RequestFormDto request = new RequestFormDto();
        request.setFormId("test-form-123");
        request.setFormName("Updated Form Name");
        request.setBeginTime("2024-01-01 00:00:00");
        request.setEndTime("2024-12-31 23:59:59");

        when(formRepository.existsByFormId("test-form-123")).thenReturn(true);
        
        Instant now = Instant.now();
        Form updatedForm = new Form();
        updatedForm.setFormId("test-form-123");
        updatedForm.setFormName("Updated Form Name");
        updatedForm.setTag("");
        updatedForm.setBeginTime(now);
        updatedForm.setEndTime(now.plus(1, ChronoUnit.DAYS));
        updatedForm.setCreatedDate(now);
        updatedForm.setLastModifiedDate(now);
        updatedForm.setStatusForm(1L);
        updatedForm.setCreatedBy("admin");
        updatedForm.setUserId(1L);
        updatedForm.setOrgIn("/1/1");
        updatedForm.setCustId(1L);
        
        when(ownerService.updateForm(any(RequestFormDto.class))).thenReturn(updatedForm);

        mockMvc.perform(put("/api/owner/form")
                .contentType(MediaType.APPLICATION_JSON)
                .content(gson.toJson(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.formId").value("test-form-123"))
                .andExpect(jsonPath("$.formName").value("Updated Form Name"));
    }

    @Test
    public void testFindFormOwner() throws Exception {
        FormSearchOwnerDto searchDto = new FormSearchOwnerDto();
        
        List<FormDto> dtoList = new ArrayList<>();
        FormDto dto = new FormDto();
        dto.setFormId("test-form-123");
        dtoList.add(dto);
        Page<FormDto> page = new PageImpl<>(dtoList, PageRequest.of(0, 10), 1);
        
        when(ownerService.findFormOwner1(any(FormSearchOwnerDto.class), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(post("/api/owner/find-form")
                .contentType(MediaType.APPLICATION_JSON)
                .content(gson.toJson(searchDto)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].formId").value("test-form-123"));
    }
}
