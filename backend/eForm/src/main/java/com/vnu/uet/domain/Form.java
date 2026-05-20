package com.vnu.uet.domain;


import lombok.Data;

import javax.persistence.*;
import java.io.Serializable;
import java.time.Instant;

/**
 * A Form.
 */
@Data
@Entity
@Table(name = "form")
public class Form implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "form_id")
    private String formId;

    @Column(name = "form_name")
    private String formName;

    @Column(name = "form_code")
    private String formCode;

    @Column(name = "description")
    private String description;

    @Column(name = "json_form")
    private String jsonForm;
    @Column(name = "variable_arr")
    private String variableArr;

    @Column(name = "status_form")
    private Long statusForm;

    @Column(name = "tag")
    private String tag;

    @Column(name = "begin_time")
    private Instant beginTime;

    @Column(name = "end_time")
    private Instant endTime;

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

    @Column(name = "last_modified_by")
    private String lastModifiedBy;

    @Column(name = "last_modified_date")
    private Instant lastModifiedDate;

    @Column(name = "json_form_condition")
    private String jsonFormCondition;

    @Column(name = "code_json")
    private String codeJson;

    @Column(name = "config_writer")
    private String configWriter;

}
