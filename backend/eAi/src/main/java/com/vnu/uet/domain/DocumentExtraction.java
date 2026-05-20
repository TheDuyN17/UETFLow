package com.vnu.uet.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.time.Instant;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A DocumentExtraction.
 */
@Entity
@Table(name = "document_extraction")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class DocumentExtraction implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @Size(max = 500)
    @Column(name = "s_3_key", length = 500, nullable = false)
    private String s3Key;

    @NotNull
    @Size(max = 100)
    @Column(name = "form_name", length = 100, nullable = false)
    private String formName;

    @Lob
    @Column(name = "raw_text")
    private String rawText;

    @Size(max = 20)
    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "extracted_at")
    private Instant extractedAt;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public DocumentExtraction id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String gets3Key() {
        return this.s3Key;
    }

    public DocumentExtraction s3Key(String s3Key) {
        this.sets3Key(s3Key);
        return this;
    }

    public void sets3Key(String s3Key) {
        this.s3Key = s3Key;
    }

    public String getFormName() {
        return this.formName;
    }

    public DocumentExtraction formName(String formName) {
        this.setFormName(formName);
        return this;
    }

    public void setFormName(String formName) {
        this.formName = formName;
    }

    public String getRawText() {
        return this.rawText;
    }

    public DocumentExtraction rawText(String rawText) {
        this.setRawText(rawText);
        return this;
    }

    public void setRawText(String rawText) {
        this.rawText = rawText;
    }

    public String getStatus() {
        return this.status;
    }

    public DocumentExtraction status(String status) {
        this.setStatus(status);
        return this;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getExtractedAt() {
        return this.extractedAt;
    }

    public DocumentExtraction extractedAt(Instant extractedAt) {
        this.setExtractedAt(extractedAt);
        return this;
    }

    public void setExtractedAt(Instant extractedAt) {
        this.extractedAt = extractedAt;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof DocumentExtraction)) {
            return false;
        }
        return getId() != null && getId().equals(((DocumentExtraction) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "DocumentExtraction{" +
            "id=" + getId() +
            ", s3Key='" + gets3Key() + "'" +
            ", formName='" + getFormName() + "'" +
            ", rawText='" + getRawText() + "'" +
            ", status='" + getStatus() + "'" +
            ", extractedAt='" + getExtractedAt() + "'" +
            "}";
    }
}
