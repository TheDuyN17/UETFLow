package com.vnu.uet.service.dto;

import com.vnu.uet.domain.Form;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentNotify {
    private String userName;
    private String formName;
    private String formNameOld;
    private String formNameNew;
    private String timeDuration;
    private String formCodeOld;
    private String formCodeNew;
    private String tagOld;
    private String tagNew;
    private String tag;
    private String element;
    private String createDate;
    private Form form;
}
