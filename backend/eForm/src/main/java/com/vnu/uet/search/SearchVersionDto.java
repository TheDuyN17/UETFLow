package com.vnu.uet.search;

import lombok.Data;

@Data
public class SearchVersionDto {
    public String formId;
    public String version;
    public String start;
    public String end;
    public int sort;
}
