package com.vnu.uet.domain;

import static com.vnu.uet.domain.DocumentExtractionTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.vnu.uet.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class DocumentExtractionTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(DocumentExtraction.class);
        DocumentExtraction documentExtraction1 = getDocumentExtractionSample1();
        DocumentExtraction documentExtraction2 = new DocumentExtraction();
        assertThat(documentExtraction1).isNotEqualTo(documentExtraction2);

        documentExtraction2.setId(documentExtraction1.getId());
        assertThat(documentExtraction1).isEqualTo(documentExtraction2);

        documentExtraction2 = getDocumentExtractionSample2();
        assertThat(documentExtraction1).isNotEqualTo(documentExtraction2);
    }
}
