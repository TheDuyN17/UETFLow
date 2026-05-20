package com.vnu.uet.service.dto;

import lombok.Data;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
@Data
public class ProcedureDto {
    private String assignTime;
    private String procedure_name;
    private String step_name;
    private String versionName;
    private String versionId;
    private String procedure_id;
    private String step_id;


    public ProcedureDto(Instant assignTime, String procedure_name, String step_name, String versionId, String procedure_id, String step_id) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        this.assignTime = formatter.format(assignTime);
        this.procedure_name = procedure_name;
        this.step_name = step_name;
        this.versionId = versionId;
        this.procedure_id = procedure_id;
        this.step_id = step_id;
    }

    public ProcedureDto() {
    }
}
