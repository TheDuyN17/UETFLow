//package com.vnu.uet.config;
//
//import com.amazonaws.auth.AWSStaticCredentialsProvider;
//import com.amazonaws.auth.BasicAWSCredentials;
//import com.amazonaws.client.builder.AwsClientBuilder;
//import com.amazonaws.services.s3.AmazonS3;
//import com.amazonaws.services.s3.AmazonS3ClientBuilder;
//import lombok.Builder;
//import lombok.Data;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//@Data
//@Configuration
//public class S3ObjectStorageConfiguration {
//    @Value("${fptcloud.s3.access_key_id}")
//    private String awsId;
//
//    @Value("${fptcloud.s3.secret_access_key}")
//    private String awsKey;
//
//    @Value("${fptcloud.s3.region}")
//    private String region;
//
//    @Value("${fptcloud.s3.endpoint}")
//    private String endPoint;
//
//    @Bean
//    public AmazonS3 s3client() {
//        BasicAWSCredentials awsCreds = new BasicAWSCredentials(awsId, awsKey);
//        return AmazonS3ClientBuilder.standard()
//            .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(endPoint, region))
//            .withCredentials(new AWSStaticCredentialsProvider(awsCreds))
//            .build();
//    }
//}
