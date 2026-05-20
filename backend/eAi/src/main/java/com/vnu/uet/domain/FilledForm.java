package com.vnu.uet.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.time.Instant;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A FilledForm.
 */
@Entity
@Table(name = "filled_form")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class FilledForm implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @Size(max = 100)
    @Column(name = "form_name", length = 100, nullable = false)
    private String formName;

    @Lob
    @Column(name = "filled_data")
    private String filledData;

    @Column(name = "confidence")
    private Double confidence;

    @Size(max = 50)
    @Column(name = "gemini_model", length = 50)
    private String geminiModel;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Size(max = 1000)
    @Column(name = "missing_fields", length = 1000)
    private String missingFields;

    @ManyToOne(fetch = FetchType.LAZY)
    private DocumentExtraction document;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public FilledForm id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFormName() {
        return this.formName;
    }

    public FilledForm formName(String formName) {
        this.setFormName(formName);
        return this;
    }

    public void setFormName(String formName) {
        this.formName = formName;
    }

    public String getFilledData() {
        return this.filledData;
    }

    public FilledForm filledData(String filledData) {
        this.setFilledData(filledData);
        return this;
    }

    public void setFilledData(String filledData) {
        this.filledData = filledData;
    }

    public Double getConfidence() {
        return this.confidence;
    }

    public FilledForm confidence(Double confidence) {
        this.setConfidence(confidence);
        return this;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getGeminiModel() {
        return this.geminiModel;
    }

    public FilledForm geminiModel(String geminiModel) {
        this.setGeminiModel(geminiModel);
        return this;
    }

    public void setGeminiModel(String geminiModel) {
        this.geminiModel = geminiModel;
    }

    public Instant getProcessedAt() {
        return this.processedAt;
    }

    public FilledForm processedAt(Instant processedAt) {
        this.setProcessedAt(processedAt);
        return this;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }

    public String getMissingFields() {
        return this.missingFields;
    }

    public FilledForm missingFields(String missingFields) {
        this.setMissingFields(missingFields);
        return this;
    }

    public void setMissingFields(String missingFields) {
        this.missingFields = missingFields;
    }

    public DocumentExtraction getDocument() {
        return this.document;
    }

    public void setDocument(DocumentExtraction documentExtraction) {
        this.document = documentExtraction;
    }

    public FilledForm document(DocumentExtraction documentExtraction) {
        this.setDocument(documentExtraction);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof FilledForm)) {
            return false;
        }
        return getId() != null && getId().equals(((FilledForm) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "FilledForm{" +
            "id=" + getId() +
            ", formName='" + getFormName() + "'" +
            ", filledData='" + getFilledData() + "'" +
            ", confidence=" + getConfidence() +
            ", geminiModel='" + getGeminiModel() + "'" +
            ", processedAt='" + getProcessedAt() + "'" +
            ", missingFields='" + getMissingFields() + "'" +
            "}";
    }
}
