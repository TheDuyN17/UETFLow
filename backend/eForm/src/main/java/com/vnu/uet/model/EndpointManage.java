package com.vnu.uet.model;

import lombok.Data;

import java.time.Instant;

@Data
public class EndpointManage {
    private String id;
    private Integer serviceId;
    private String serviceName;
    private String method;
    private String path;
    private Boolean active;
    private String createdBy;
    private Instant createdDate;
    private String lastModifiedBy;
    private Instant lastModifiedDate;
}

