package com.vnu.uet.config;

import com.vnu.uet.client.CentralConfigClients;
import com.vnu.uet.service.dto.S3ClientWrapperV2;
import com.vnu.uet.service.dto.StorageServiceConfigDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.BeanFactoryAware;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;
import java.util.List;

@Component
public class ObjectStorageConfig implements CommandLineRunner, BeanFactoryAware {
    private final Logger log = LoggerFactory.getLogger(ObjectStorageConfig.class);

    private BeanFactory beanFactory;

    private final CentralConfigClients centralConfigClients;

    @Value("${spring.application.name}")
    private String serviceName;

    public ObjectStorageConfig(CentralConfigClients centralConfigClients) {
        this.centralConfigClients = centralConfigClients;
    }

    @Override
    public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
        this.beanFactory = beanFactory;
    }

    @Override
    public void run(String... args) throws Exception {
        // List<StorageServiceConfigDTO> storageServiceConfigs =
        // centralConfigClients.findByServiceName("eform");
        try {
            List<StorageServiceConfigDTO> storageServiceConfigs = centralConfigClients.findByServiceName(serviceName);
            if (!CollectionUtils.isEmpty(storageServiceConfigs)) {
                ConfigurableBeanFactory configurableBeanFactory = (ConfigurableBeanFactory) beanFactory;

                storageServiceConfigs.forEach(config -> {
                    String beanName = config.getBeanName();
                    log.error("START INIT BEAN WITH NAME: {}", beanName);

                    S3ClientWrapperV2 s3Client = configS3Client(config);
                    S3Presigner s3Presigner = s3Presigner(config);
                    configurableBeanFactory.registerSingleton(beanName + "preSigner", s3Presigner);
                    configurableBeanFactory.registerSingleton(beanName, s3Client);

                });
            }
        } catch (Exception e) {
            log.error("Error fetching storage config from central service for {}: {}", serviceName, e.getMessage());
            log.info("Continuing startup without central storage configuration.");
        }
    }

    public S3ClientWrapperV2 configS3Client(StorageServiceConfigDTO dto) {

        String accessKeyId = dto.getAccessKeyId();
        String secretAccessKey = dto.getSecretAccessKey();
        String endpointOverride = dto.getEndpointOverride();
        String regionString = dto.getRegionString();

        final AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
        final StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);
        S3Client s3Client = S3Client.builder().credentialsProvider(credentialsProvider)
                .endpointOverride(URI.create(String.format(endpointOverride))).region(Region.of(regionString)).build();
        return new S3ClientWrapperV2(s3Client, endpointOverride);
    }

    public S3Presigner s3Presigner(StorageServiceConfigDTO dto) {
        String accessKeyId = dto.getAccessKeyId();
        String secretAccessKey = dto.getSecretAccessKey();
        String endpointOverride = dto.getEndpointOverride();
        String regionString = dto.getRegionString();

        final AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
        final StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);
        return S3Presigner.builder()
                .credentialsProvider(credentialsProvider)
                .endpointOverride(URI.create(endpointOverride))
                .region(Region.of(regionString))
                .build();
    }
}
