package com.vnu.uet.request;

import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class FormIdListRequest {
    private List<String> formIds;
    private String searchText;
    private Instant createdDate;
}

