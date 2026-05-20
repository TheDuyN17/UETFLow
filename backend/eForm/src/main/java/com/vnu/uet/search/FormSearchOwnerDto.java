package com.vnu.uet.search;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.List;

@Data
public class FormSearchOwnerDto {
    private String createdBy;
    private String tag;
    private List<String> statusForm;
    private String formName;
    private String beginDate;
    private String endDate;
    private String beginTime;
    private String endTime;
}
