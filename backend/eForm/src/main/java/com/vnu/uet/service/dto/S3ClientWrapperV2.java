package com.vnu.uet.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.services.s3.S3Client;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class S3ClientWrapperV2 {
    private S3Client s3Client;
    private String endpointOverride;
}
