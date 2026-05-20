package com.vnu.uet.search;

import lombok.Data;

import java.util.List;

@Data
public class FormSearchShareDto {
    //    public String createdBy;
    private String tag;
    private String beginDate;
    private String endDate;
    private String beginTime;
    private String endTime;
    private String formName;
    private List<Long> createdByList;
    private String statusForm;

}

