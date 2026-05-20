package com.vnu.uet.domain;


import javax.persistence.*;
import java.io.Serializable;
import java.time.Instant;

/**
 * A Procedures.
 */
@Entity
@Table(name = "procedures")
public class Procedures implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "form_id")
    private String formId;

    @Column(name = "procedure_id")
    private String procedureId;

    @Column(name = "procedure_name")
    private String procedureName;

    @Column(name = "step_id")
    private String stepId;

    @Column(name = "step_name")
    private String stepName;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "org_in")
    private String orgIn;

    @Column(name = "cust_id")
    private Long custId;

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "version_id")
    private String versionId;

    public String getVersionId() {
        return versionId;
    }

    public void setVersionId(String versionId) {
        this.versionId = versionId;
    }

    // jhipster-needle-entity-add-field - JHipster will add fields here
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFormId() {
        return formId;
    }

    public Procedures formId(String formId) {
        this.formId = formId;
        return this;
    }

    public void setFormId(String formId) {
        this.formId = formId;
    }

    public String getProcedureId() {
        return procedureId;
    }

    public Procedures procedureId(String procedureId) {
        this.procedureId = procedureId;
        return this;
    }

    public void setProcedureId(String procedureId) {
        this.procedureId = procedureId;
    }

    public String getProcedureName() {
        return procedureName;
    }

    public Procedures procedureName(String procedureName) {
        this.procedureName = procedureName;
        return this;
    }

    public void setProcedureName(String procedureName) {
        this.procedureName = procedureName;
    }

    public String getStepId() {
        return stepId;
    }

    public Procedures stepId(String stepId) {
        this.stepId = stepId;
        return this;
    }

    public void setStepId(String stepId) {
        this.stepId = stepId;
    }

    public String getStepName() {
        return stepName;
    }

    public Procedures stepName(String stepName) {
        this.stepName = stepName;
        return this;
    }

    public void setStepName(String stepName) {
        this.stepName = stepName;
    }

    public Long getUserId() {
        return userId;
    }

    public Procedures userId(Long userId) {
        this.userId = userId;
        return this;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public Procedures createdBy(String createdBy) {
        this.createdBy = createdBy;
        return this;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getOrgIn() {
        return orgIn;
    }

    public Procedures orgIn(String orgIn) {
        this.orgIn = orgIn;
        return this;
    }

    public void setOrgIn(String orgIn) {
        this.orgIn = orgIn;
    }

    public Long getCustId() {
        return custId;
    }

    public Procedures custId(Long custId) {
        this.custId = custId;
        return this;
    }

    public void setCustId(Long custId) {
        this.custId = custId;
    }

    public Instant getCreatedDate() {
        return createdDate;
    }

    public Procedures createdDate(Instant createdDate) {
        this.createdDate = createdDate;
        return this;
    }

    public void setCreatedDate(Instant createdDate) {
        this.createdDate = createdDate;
    }
    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Procedures)) {
            return false;
        }
        return id != null && id.equals(((Procedures) o).id);
    }

    @Override
    public int hashCode() {
        return 31;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Procedures{" +
            "id=" + getId() +
            ", formId=" + getFormId() +
            ", procedureId='" + getProcedureId() + "'" +
            ", procedureName='" + getProcedureName() + "'" +
            ", stepId='" + getStepId() + "'" +
            ", stepName='" + getStepName() + "'" +
            ", userId=" + getUserId() +
            ", createdBy='" + getCreatedBy() + "'" +
            ", orgIn='" + getOrgIn() + "'" +
            ", custId=" + getCustId() +
            ", createdDate='" + getCreatedDate() + "'" +
            "}";
    }
}
