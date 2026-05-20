package com.vnu.uet.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.UUID;

@Service
public class S3Service {

    private final Logger log = LoggerFactory.getLogger(S3Service.class);

    @Value("${aws.s3.access-key:dummy-access-key}")
    private String accessKey;

    @Value("${aws.s3.secret-key:dummy-secret-key}")
    private String secretKey;

    @Value("${aws.s3.region:ap-southeast-1}")
    private String region;

    @Value("${aws.s3.bucket:docform-bucket}")
    private String bucketName;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        try {
            AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
            this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
            log.info("S3 Client initialized.");
        } catch (Exception e) {
            log.warn("Failed to initialize S3 Client. Check API keys.", e);
        }
    }

    /**
     * Uploads file to S3 and returns the object key.
     */
    public String uploadFile(MultipartFile file, String formName) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") ? 
            originalFilename.substring(originalFilename.lastIndexOf(".")) : ".pdf";
        
        String s3Key = "documents/" + UUID.randomUUID().toString() + "/" + formName + extension;
        
        log.info("Uploading file to S3: {}", s3Key);
        
        try {
            if (s3Client != null && !accessKey.equals("dummy-access-key")) {
                PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(s3Key)
                        .contentType(file.getContentType())
                        .build();

                s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            } else {
                log.warn("S3 Client is not fully configured. Simulating upload success.");
            }
        } catch (Exception e) {
            log.error("Failed to upload to S3", e);
            throw new IOException("S3 Upload Failed", e);
        }
        
        return s3Key;
    }
}
