package com.vnu.uet.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class DocumentExtractionTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static DocumentExtraction getDocumentExtractionSample1() {
        return new DocumentExtraction().id(1L).s3Key("s3Key1").formName("formName1").status("status1");
    }

    public static DocumentExtraction getDocumentExtractionSample2() {
        return new DocumentExtraction().id(2L).s3Key("s3Key2").formName("formName2").status("status2");
    }

    public static DocumentExtraction getDocumentExtractionRandomSampleGenerator() {
        return new DocumentExtraction()
            .id(longCount.incrementAndGet())
            .s3Key(UUID.randomUUID().toString())
            .formName(UUID.randomUUID().toString())
            .status(UUID.randomUUID().toString());
    }
}
