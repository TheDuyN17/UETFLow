package com.vnu.uet.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotifyCentralForm {
    @JsonProperty("emailList")
    private List<String> emailList;

    @JsonProperty("userIdList")
    private List<Long> userIdList;

    @JsonProperty("content")
    private Object content;

    @JsonProperty("system")
    private String system;

    @JsonProperty("type")
    private String type;
}
