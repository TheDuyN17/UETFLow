package com.vnu.uet.search;

import com.vnu.uet.converter.DateConverter;
import com.vnu.uet.domain.enums.StatusForm;
import lombok.Data;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Data
public class FormSearchShare {
    private String username;
    private String tag;
    private List<Long> createdByList = null;
    private Instant beginDate;
    private Instant endDate;
    private Instant beginTime;
    private Instant endTime;
    private String formName;
    private Long statusForm;

    public FormSearchShare(FormSearchShareDto formSearchShareDto) {
        List<String> emptyList = Collections.emptyList();
        if (formSearchShareDto.getCreatedByList() == null || formSearchShareDto.getCreatedByList().equals(emptyList)) {
            this.createdByList = null;
        } else {
            this.createdByList = formSearchShareDto.getCreatedByList();
        }

        this.tag = formSearchShareDto.getTag();
        if (!(formSearchShareDto.getBeginDate() == null || formSearchShareDto.getBeginDate().equals(""))) {
            this.beginDate = DateConverter.parseStringToZonedDateTime(formSearchShareDto.getBeginDate());
        }
        if (!(formSearchShareDto.getEndDate() == null || formSearchShareDto.getEndDate().equals(""))) {
            this.endDate = DateConverter.parseStringToZonedDateTime3(formSearchShareDto.getEndDate());
        }
        if (!(formSearchShareDto.getEndTime() == null || formSearchShareDto.getEndTime().equals(""))) {
            this.endTime = DateConverter.parseStringToZonedDateTime3(formSearchShareDto.getEndTime());
        }
        if (!(formSearchShareDto.getBeginTime() == null || formSearchShareDto.getBeginTime().equals(""))) {
            this.beginTime = DateConverter.parseStringToZonedDateTime(formSearchShareDto.getBeginTime());
        }
        this.formName = formSearchShareDto.getFormName();
        if (formSearchShareDto.getStatusForm() == null || formSearchShareDto.getStatusForm().equals("")) {
            this.statusForm = 0L;
        } else if (formSearchShareDto.getStatusForm().equals("releasing")) {
            this.statusForm = StatusForm.RELEASE.getValue();
        } else if (formSearchShareDto.getStatusForm().equals("draft")) {
            this.statusForm = StatusForm.DRAFT.getValue();
        } else if (formSearchShareDto.getStatusForm().equals("stop release")) {
            this.statusForm = StatusForm.WITHDRAW.getValue();
        } else if (formSearchShareDto.getStatusForm().equals("editing")) {
            this.statusForm = StatusForm.EDIT.getValue();
        }
    }
}
