package com.vnu.uet.service.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.converter.DateConverter;
import com.vnu.uet.domain.Form;
import com.vnu.uet.domain.enums.StatusForm;
import com.vnu.uet.request.RequestAddForm;
import com.vnu.uet.request.RequestFormDto;
import com.vnu.uet.service.dto.FormDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZonedDateTime;

/**
 * Mapper for converting between Form entity and DTOs.
 */
@Component
@RequiredArgsConstructor
public class FormMapper {

    private final ObjectMapper objectMapper;

    public Form toForm(RequestAddForm requestAddForm, Long userId, String login, String orgIn, Long custId, String formId, Instant currentTime) {
        Form form = new Form();
        form.setFormId(formId);
        form.setFormName(requestAddForm.getFormName());
        form.setFormCode(requestAddForm.getFormCode());
        form.setTag(requestAddForm.getTag());
        form.setBeginTime(DateConverter.parseStringToZonedDateTime(requestAddForm.getBeginTime()));
        form.setEndTime(DateConverter.parseStringToZonedDateTime3(requestAddForm.getEndTime()));
        form.setDescription(requestAddForm.getDescribeForm());
        form.setJsonForm(requestAddForm.getJsonForm() != null ? requestAddForm.getJsonForm() : "[]");
        form.setJsonFormCondition("[]");
        form.setCreatedBy(login.trim());
        form.setOrgIn(orgIn);
        form.setCustId(custId);
        form.setUserId(userId);
        form.setCreatedDate(currentTime);
        form.setLastModifiedDate(currentTime);
        form.setLastModifiedBy(login.trim());
        form.setStatusForm(StatusForm.DRAFT.getValue());
        return form;
    }

    public void updateForm(RequestFormDto requestForm, Form form, String login, Instant currentTime) throws JsonProcessingException {
        if (requestForm.getFormName() != null && !requestForm.getFormName().isEmpty()) {
            form.setFormName(requestForm.getFormName());
        }
        if (requestForm.getFormCode() != null && !requestForm.getFormCode().isEmpty()) {
            form.setFormCode(requestForm.getFormCode());
        }
        if (requestForm.getBeginTime() != null) {
            form.setBeginTime(DateConverter.parseStringToZonedDateTime(requestForm.getBeginTime()));
        }
        if (requestForm.getEndTime() != null) {
            form.setEndTime(DateConverter.parseStringToZonedDateTime3(requestForm.getEndTime()));
        }
        if (requestForm.getDescribeForm() != null) {
            form.setDescription(requestForm.getDescribeForm());
        }
        if (requestForm.getJsonForm() != null && !requestForm.getJsonForm().isEmpty()) {
            form.setJsonForm(requestForm.getJsonForm());
        }
        if (requestForm.getJsonFormCondition() != null && !requestForm.getJsonFormCondition().isEmpty()) {
            form.setJsonFormCondition(requestForm.getJsonFormCondition());
        }
        if (requestForm.getTag() != null) {
            form.setTag(requestForm.getTag());
        }
        if (requestForm.getVariableArr() != null) {
            form.setVariableArr(objectMapper.writeValueAsString(requestForm.getVariableArr()));
        }
        form.setLastModifiedDate(currentTime);
        form.setLastModifiedBy(login.trim());
    }

    public void updateFormTime(RequestFormDto requestForm, Form form, String login, Instant currentTime) {
        if (requestForm.getBeginTime() != null) {
            form.setBeginTime(DateConverter.parseStringToZonedDateTime(requestForm.getBeginTime()));
        }
        if (requestForm.getEndTime() != null) {
            form.setEndTime(DateConverter.parseStringToZonedDateTime3(requestForm.getEndTime()));
        }
        form.setLastModifiedDate(currentTime);
        form.setLastModifiedBy(login.trim());
    }

    public Form toDuplicateForm(Form sourceForm, RequestAddForm requestAddForm, Long userId, String login, String orgIn, Long custId, String formId, Instant currentTime) {
        Form form = new Form();
        form.setFormId(formId);
        form.setFormName(requestAddForm.getFormName());
        form.setFormCode(requestAddForm.getFormCode());
        form.setTag(requestAddForm.getTag());
        form.setBeginTime(DateConverter.parseStringToZonedDateTime(requestAddForm.getBeginTime()));
        form.setEndTime(DateConverter.parseStringToZonedDateTime3(requestAddForm.getEndTime()));
        form.setDescription(requestAddForm.getDescribeForm());
        form.setJsonForm(sourceForm.getJsonForm());
        form.setJsonFormCondition(sourceForm.getJsonFormCondition());
        form.setCodeJson(sourceForm.getCodeJson());
        form.setConfigWriter(sourceForm.getConfigWriter());
        form.setVariableArr(sourceForm.getVariableArr());
        form.setCreatedBy(login.trim());
        form.setOrgIn(orgIn);
        form.setCustId(custId);
        form.setUserId(userId);
        form.setCreatedDate(currentTime);
        form.setLastModifiedDate(currentTime);
        form.setLastModifiedBy(login.trim());
        form.setStatusForm(StatusForm.DRAFT.getValue());
        return form;
    }
}
