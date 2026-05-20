package com.vnu.uet.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StorageServiceConfigDTO implements Serializable {

    private Long id;

    private String beanName;

    private String accessKeyId;

    private String secretAccessKey;

    private String endpointOverride;

    private String regionString;

    private String serviceName;

    private Boolean active;

    private Long custId;

    private String orgIn;

    private Instant createdDate;

    private String createdBy;

    private Instant lastModifiedDate;

    private String lastModifiedBy;
}
