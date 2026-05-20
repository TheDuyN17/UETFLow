package com.vnu.uet.request;

import lombok.Data;

@Data
public class RequestFormDto {
    private String formName;
    private String formId;
    private String beginTime;
    private String endTime;
    private String jsonForm;
    private String tag;
    private String describeForm;
    private String formCode;
    private String jsonFormCondition;
    private Variable[] variableArr;
}
