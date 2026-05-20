package com.vnu.uet.search;

import lombok.Data;

@Data
public class FormSearchOwnerExcelDto {
    private String createdBy;
    private String tag;
    private String statusForm;
    private String formName;
    private String beginDate;
    private String endDate;
    private String beginTime;
    private String endTime;
}
