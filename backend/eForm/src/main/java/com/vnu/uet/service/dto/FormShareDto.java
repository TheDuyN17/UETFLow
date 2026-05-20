package com.vnu.uet.service.dto;

import lombok.Data;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Data
public class FormShareDto {
    private String formId;
    private String jsonForm;
    private String formCode;
    private String formName;
    private String statusForm;
    private String listProcedure;
    private String createdDate;
    private String createdBy;
    private String[] tag = {};
    private String beginTime;
    private String endTime;
    private Boolean duplicate;
    private String avatar = null;
    private String fullName = null;
    private String describeForm;
    private String effect;
    private String versionId;
    private String variableArr;
    private String jsonFormCondition;
    private String codeJson;
    private String configWriter;

    public FormShareDto(String formId, String formName, String createdBy, Long statusForm, Instant createdDate, String tag, Instant beginTime, Instant endTime, String jsonForm, String describeForm, String formCode, String variableArr, String jsonFormCondition, String codeJson, String configWriter) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        this.formCode = formCode;
        this.jsonForm = jsonForm;
        this.createdBy = createdBy;
        this.formName = formName;
        this.jsonFormCondition = jsonFormCondition;
        if (statusForm == 1L) {
            this.statusForm = "draft";
        } else if (statusForm == 2L) {
            this.statusForm = "releasing";
        } else if (statusForm == 4L) {
            this.statusForm = "editing";
        } else if (statusForm == 3L) {
            this.statusForm = "stop release";
        }
        this.createdDate = formatter.format(createdDate);
        if (!tag.equals("")) {
            this.tag = tag.split(",");
        }
        this.beginTime = formatter.format(beginTime);
        this.endTime = formatter.format(endTime);
        this.formId = formId;
        this.duplicate = true;
        this.describeForm = describeForm;
        this.variableArr = variableArr;
        this.codeJson = codeJson;
        this.configWriter = configWriter;
    }

    public FormShareDto(
        String formId,
        String formName,
        String createdBy,
        Long statusForm,
        Instant createdDate,
        String tag,
        Instant beginTime,
        Instant endTime,
        String describeForm,
        String formCode,
        String variableArr,
        String jsonFormCondition,
        String codeJson,
        String configWriter) {

        this(formId, formName, createdBy, statusForm, createdDate, tag, beginTime, endTime,
            null,
            describeForm, formCode, variableArr, jsonFormCondition, codeJson, configWriter);
    }

    public FormShareDto(String formId, String formName, String createdBy, Long statusForm, Instant createdDate, String tag, Instant beginTime, Instant endTime, String jsonForm, String describeForm, String effect, String formCode, String versionId, String variableArr, String jsonFormCondition, String codeJson, String configWriter) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        this.variableArr = variableArr;
        this.versionId = versionId;
        this.formCode = formCode;
        this.jsonForm = jsonForm;
        this.createdBy = createdBy;
        this.formName = formName;
        this.jsonFormCondition = jsonFormCondition;
        if (statusForm == 1L) {
            this.statusForm = "draft";
        } else if (statusForm == 2L) {
            this.statusForm = "releasing";
        } else if (statusForm == 4L) {
            this.statusForm = "editing";
        } else {
            this.statusForm = "stop release";
        }
        this.createdDate = formatter.format(createdDate);
        if (!tag.equals("")) {
            this.tag = tag.split(",");
        }
        this.beginTime = formatter.format(beginTime);
        this.endTime = formatter.format(endTime);
        this.formId = formId;
        this.duplicate = true;
        this.describeForm = describeForm;
        this.effect = effect;
        this.codeJson = codeJson;
        this.configWriter = configWriter;
    }

    public FormShareDto(String formId, String formName, String createdBy, Long statusForm, Instant createdDate, String tag, Instant beginTime, Instant endTime, String jsonForm, String describeForm, String formCode, String versionId, String variableArr, String jsonFormCondition, String codeJson, String configWriter) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        this.variableArr = variableArr;
        this.versionId = versionId;
        this.formCode = formCode;
        this.jsonForm = jsonForm;
        this.createdBy = createdBy;
        this.formName = formName;
        this.jsonFormCondition = jsonFormCondition;
        if (statusForm == 1L) {
            this.statusForm = "draft";
        } else if (statusForm == 2L) {
            this.statusForm = "releasing";
        } else if (statusForm == 4L) {
            this.statusForm = "editing";
        } else {
            this.statusForm = "stop release";
        }
        this.createdDate = formatter.format(createdDate);
        if (!tag.equals("")) {
            this.tag = tag.split(",");
        }
        this.beginTime = formatter.format(beginTime);
        this.endTime = formatter.format(endTime);
        this.formId = formId;
        this.duplicate = true;
        this.describeForm = describeForm;
        this.codeJson = codeJson;
        this.configWriter = configWriter;
    }

}

