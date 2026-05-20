package com.vnu.uet.service.dto;

import lombok.Data;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Data
public class FormEflow {
    private String formId;
    private String jsonForm;
    private String formName;
    private String statusForm;
//    private String listProcedure;
    private String createdDate;
    private String createdBy;
    private String[] tag = {};
    private String beginTime;
    private String endTime;
    private Boolean duplicate = true;
    private String avatar = null;
    private String fullName = null;
    private String describeForm;
    private String effect = "true";
    private String versionId;
    private String versionName;
    private String formCode;
    private String jsonFormCondition;
    private String userTaskId;

    public FormEflow(String formId, String formName, String createdBy, Long statusForm, Instant createdDate, String tag, Instant beginTime, Instant endTime, String jsonForm, String describeForm, String effect, String versionId, String versionName, String formCode, String jsonFormCondition, String userTaskId) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        this.userTaskId = userTaskId;
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
        ;
        if (!tag.equals("")) {
            this.tag = tag.split(",");
        }
        this.beginTime = formatter.format(beginTime);
        ;
        this.endTime = formatter.format(endTime);
        ;
        this.formId = formId;
        this.duplicate = true;
        this.effect = effect;
        this.describeForm = describeForm;
        this.versionId = versionId;
        this.versionName = versionName;
    }
}
