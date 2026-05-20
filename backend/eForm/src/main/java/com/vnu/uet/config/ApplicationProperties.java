package com.vnu.uet.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Properties specific to Eform.
 * <p>
 * Properties are configured in the {@code application.yml} file.
 * See {@link io.github.jhipster.config.JHipsterProperties} for a good example.
 */

@Data
@AllArgsConstructor
@NoArgsConstructor
@ConfigurationProperties(prefix = "application", ignoreUnknownFields = true)
public class ApplicationProperties {
    private String path;
    private String urlExCall;
    private String getTempAndStructureSelector;
    private String s3BeanSecond = "s3ClientSecond";
    private String s3BeanDefault = "s3Client" ;
    private S3 s3 = new S3();

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class S3 {
        private String accessKeyId;
        private String secretAccessKey;
        private String endpointOverride;
        private String regionString;
        private String bucketPrefix;
        private Boolean reUpload;
        private Boolean reInit;
        private Boolean transferEnvelope = false;
        private Boolean transferAgreement = false;
    }
}
