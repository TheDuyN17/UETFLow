package com.vnu.uet.service.dto;

import com.vnu.uet.domain.Form;
import com.vnu.uet.domain.Version;
import lombok.Data;

import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Data
public class CommonInfo {
    public String formCode;
    public String formName;
    public String formId;
    public String beginTime;
    public String endTime;
    public String describeForm;
    public String createdDate;
    public Long statusForm;
    public String updateAt;
    public String[] tag = {};
    public String jsonForm;
    public String variableArr;
    public String jsonFormCondition;
    private String codeJson;
    private String configWriter;
    private String versionId;

    public CommonInfo(Form form) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        ;
        this.formName = form.getFormName();
        this.formId = form.getFormId();
        this.describeForm = form.getDescription();
        if (form.getTag() != null && !form.getTag().isEmpty()) {
            this.tag = form.getTag().split(",");
        }
        this.formCode = form.getFormCode();
        this.beginTime = form.getBeginTime() != null ? formatter.format(form.getBeginTime()) : null;
        this.endTime = form.getEndTime() != null ? formatter.format(form.getEndTime()) : null;
        this.jsonForm = form.getJsonForm();
        this.statusForm = form.getStatusForm();
        this.updateAt = form.getLastModifiedDate() != null ? formatter.format(form.getLastModifiedDate()) : null;
        this.createdDate = form.getCreatedDate() != null ? formatter.format(form.getCreatedDate()) : null;
        this.variableArr = form.getVariableArr();
        this.jsonFormCondition = form.getJsonFormCondition();
        this.codeJson = form.getCodeJson();
        this.configWriter = form.getConfigWriter();

    }

    public CommonInfo(Form form, String versionId) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        ;
        this.formName = form.getFormName();
        this.formId = form.getFormId();
        this.describeForm = form.getDescription();
        if (form.getTag() != null && !form.getTag().isEmpty()) {
            this.tag = form.getTag().split(",");
        }
        this.formCode = form.getFormCode();
        this.beginTime = form.getBeginTime() != null ? formatter.format(form.getBeginTime()) : null;
        this.endTime = form.getEndTime() != null ? formatter.format(form.getEndTime()) : null;
        this.jsonForm = form.getJsonForm();
        this.statusForm = form.getStatusForm();
        this.updateAt = form.getLastModifiedDate() != null ? formatter.format(form.getLastModifiedDate()) : null;
        this.createdDate = form.getCreatedDate() != null ? formatter.format(form.getCreatedDate()) : null;
        this.variableArr = form.getVariableArr();
        this.jsonFormCondition = form.getJsonFormCondition();
        this.codeJson = form.getCodeJson();
        this.configWriter = form.getConfigWriter();
        this.versionId = versionId;

    }

    public CommonInfo(Version version) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        ;
        this.formName = version.getFormName();
        this.formId = version.getFormId();
        this.describeForm = version.getDescription();
        if (version.getTag() != null && !version.getTag().isEmpty()) {
            this.tag = version.getTag().split(",");
        }
        this.formCode = version.getFormCode();
        this.beginTime = version.getBeginTime() != null ? formatter.format(version.getBeginTime()) : null;
        this.endTime = version.getEndTime() != null ? formatter.format(version.getEndTime()) : null;
        this.jsonForm = version.getJsonForm();
        this.statusForm = version.getStatusForm();
        this.updateAt = version.getLastModifiedDate() != null ? formatter.format(version.getLastModifiedDate()) : null;
        this.createdDate = version.getCreatedDate() != null ? formatter.format(version.getCreatedDate()) : null;
        this.variableArr = version.getVariableArr();
        this.jsonFormCondition = version.getJsonFormCondition();
        this.codeJson = version.getCodeJson();
        this.configWriter = version.getConfigWriter();
        this.versionId = version.getVersionId();
    }
}
