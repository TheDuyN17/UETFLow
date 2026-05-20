package com.vnu.uet.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class MockInternalService {

    private final Logger log = LoggerFactory.getLogger(MockInternalService.class);

    /**
     * Mocks a call to eForm to fetch the structure of the target form.
     */
    public String fetchFormTemplate(String formName) {
        log.info("Fetching form template from eForm for: {}", formName);
        // Simulate HTTP call
        return "{\n" +
                "  \"ho_ten\": \"string\",\n" +
                "  \"so_cccd\": \"string\",\n" +
                "  \"ngay_sinh\": \"string\",\n" +
                "  \"gioi_tinh\": \"string\"\n" +
                "}";
    }

    /**
     * Mocks a call to eRequest to create a draft ticket from the extracted data.
     */
    public void createTicketInERequest(String formName, String filledJson, String s3Key) {
        log.info("Mock internal API call to eRequest /api/request/ai/create-from-pdf");
        log.debug("Form Name: {}", formName);
        log.debug("S3 Key: {}", s3Key);
        log.debug("Filled Data: {}", filledJson);
        // In a real scenario, this would use RestTemplate or WebClient
    }
}
