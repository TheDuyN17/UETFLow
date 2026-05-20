package com.vnu.uet.request;

import lombok.Data;

@Data
public class RequestAddForm {
    private String formCode;
    private String formName;
    private String describeForm;
    private String jsonForm;
    private String tag;
    private String beginTime;
    private String endTime;
}
