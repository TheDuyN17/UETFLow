package com.vnu.uet.service.dto;

import lombok.Data;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
@Data
public class VersionDto {
    public String versionId;
    public String createdAt;
    public String updateAt;
    public String infoFix;

    public String jsonForm;
    public String numberVersion;

    public String statusVersion;
    public String statusForm;
    public String formCode;
    public String jsonFormCondition;
    public String codeJson;
    private String configWriter;

    public VersionDto(String versionId, Instant createdAt, String infoFix, String jsonForm, Boolean statusVersion, String numberVersion, Instant updateAt, Long statusForm, String formCode, String jsonFormCondition, String codeJson, String configWriter) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        this.jsonFormCondition = jsonFormCondition;
        this.versionId = versionId;
        this.createdAt = formatter.format(createdAt);
        this.infoFix = infoFix;
        this.jsonForm = jsonForm;
        if(statusVersion) {
            this.statusVersion = "current version";
        }
        else{
            this.statusVersion = "";
        }
        this.numberVersion = numberVersion;
        this.updateAt = formatter.format(updateAt);
        if(statusForm==1L){
            this.statusForm = "draft";
        }
        else if(statusForm==2L){
            this.statusForm = "releasing";
        } else if (statusForm==4L){
            this.statusForm = "editing";
        }
        else{
            this.statusForm = "stop release";
        }
        this.formCode = formCode;
        this.codeJson = codeJson;
        this.configWriter = configWriter;
    }
}
