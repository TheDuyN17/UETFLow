package com.vnu.uet.domain;


import javax.persistence.*;
import java.io.Serializable;
import java.time.Instant;

/**
 * A Acl.
 */
@Entity
@Table(name = "acl")
public class Acl implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "id_acl")
    private String idAcl;

    @Column(name = "form_id")
    private String formId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "email")
    private String email;

    @Column(name = "status")
    private Long status;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "role")
    private Long role;

    @Column(name = "org_in")
    private String orgIn;

    @Column(name = "cust_id")
    private Long custId;

    @Column(name = "created_date")
    private Instant createdDate;

    @Column(name = "last_modified_by")
    private String lastModifiedBy;

    @Column(name = "last_modified_date")
    private Instant lastModifiedDate;


    // jhipster-needle-entity-add-field - JHipster will add fields here

    public String getIdAcl() {
        return idAcl;
    }

    public Acl idAcl(String idAcl) {
        this.idAcl = idAcl;
        return this;
    }

    public void setIdAcl(String idAcl) {
        this.idAcl = idAcl;
    }

    public String getFormId() {
        return formId;
    }

    public Acl formId(String formId) {
        this.formId = formId;
        return this;
    }

    public void setFormId(String formId) {
        this.formId = formId;
    }

    public Long getUserId() {
        return userId;
    }

    public Acl userId(Long userId) {
        this.userId = userId;
        return this;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public Acl email(String email) {
        this.email = email;
        return this;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getStatus() {
        return status;
    }

    public Acl status(Long status) {
        this.status = status;
        return this;
    }

    public void setStatus(Long status) {
        this.status = status;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public Acl createdBy(String createdBy) {
        this.createdBy = createdBy;
        return this;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Long getRole() {
        return role;
    }

    public Acl role(Long role) {
        this.role = role;
        return this;
    }

    public void setRole(Long role) {
        this.role = role;
    }

    public String getOrgIn() {
        return orgIn;
    }

    public Acl orgIn(String orgIn) {
        this.orgIn = orgIn;
        return this;
    }

    public void setOrgIn(String orgIn) {
        this.orgIn = orgIn;
    }

    public Long getCustId() {
        return custId;
    }

    public Acl custId(Long custId) {
        this.custId = custId;
        return this;
    }

    public void setCustId(Long custId) {
        this.custId = custId;
    }

    public Instant getCreatedDate() {
        return createdDate;
    }

    public Acl createdDate(Instant createdDate) {
        this.createdDate = createdDate;
        return this;
    }

    public void setCreatedDate(Instant createdDate) {
        this.createdDate = createdDate;
    }

    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public Acl lastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
        return this;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    public Instant getLastModifiedDate() {
        return lastModifiedDate;
    }

    public Acl lastModifiedDate(Instant lastModifiedDate) {
        this.lastModifiedDate = lastModifiedDate;
        return this;
    }

    public void setLastModifiedDate(Instant lastModifiedDate) {
        this.lastModifiedDate = lastModifiedDate;
    }
    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Acl)) {
            return false;
        }
        return idAcl != null && idAcl.equals(((Acl) o).idAcl);
    }

    @Override
    public int hashCode() {
        return 31;
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Acl{" +
            ", idAcl=" + getIdAcl() +
            ", formId=" + getFormId() +
            ", userId=" + getUserId() +
            ", email='" + getEmail() + "'" +
            ", status=" + getStatus() +
            ", createdBy='" + getCreatedBy() + "'" +
            ", role=" + getRole() +
            ", orgIn='" + getOrgIn() + "'" +
            ", custId=" + getCustId() +
            ", createdDate='" + getCreatedDate() + "'" +
            ", lastModifiedBy='" + getLastModifiedBy() + "'" +
            ", lastModifiedDate='" + getLastModifiedDate() + "'" +
            "}";
    }

}
