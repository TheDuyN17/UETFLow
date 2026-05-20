package com.vnu.uet.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class FilledFormTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static FilledForm getFilledFormSample1() {
        return new FilledForm().id(1L).formName("formName1").geminiModel("geminiModel1").missingFields("missingFields1");
    }

    public static FilledForm getFilledFormSample2() {
        return new FilledForm().id(2L).formName("formName2").geminiModel("geminiModel2").missingFields("missingFields2");
    }

    public static FilledForm getFilledFormRandomSampleGenerator() {
        return new FilledForm()
            .id(longCount.incrementAndGet())
            .formName(UUID.randomUUID().toString())
            .geminiModel(UUID.randomUUID().toString())
            .missingFields(UUID.randomUUID().toString());
    }
}
