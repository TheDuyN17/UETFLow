package com.vnu.uet.domain;

import static com.vnu.uet.domain.DocumentExtractionTestSamples.*;
import static com.vnu.uet.domain.FilledFormTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.vnu.uet.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class FilledFormTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(FilledForm.class);
        FilledForm filledForm1 = getFilledFormSample1();
        FilledForm filledForm2 = new FilledForm();
        assertThat(filledForm1).isNotEqualTo(filledForm2);

        filledForm2.setId(filledForm1.getId());
        assertThat(filledForm1).isEqualTo(filledForm2);

        filledForm2 = getFilledFormSample2();
        assertThat(filledForm1).isNotEqualTo(filledForm2);
    }

    @Test
    void documentTest() {
        FilledForm filledForm = getFilledFormRandomSampleGenerator();
        DocumentExtraction documentExtractionBack = getDocumentExtractionRandomSampleGenerator();

        filledForm.setDocument(documentExtractionBack);
        assertThat(filledForm.getDocument()).isEqualTo(documentExtractionBack);

        filledForm.document(null);
        assertThat(filledForm.getDocument()).isNull();
    }
}
