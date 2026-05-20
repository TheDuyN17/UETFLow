package com.vnu.uet.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class NotifyCentralDTO {

    @JsonProperty("notifyEmails")
    private List<ReceiverDTO> notifyEmails;

    @JsonProperty("notifyUsers")
    private List<ReceiverDTO> notifyUsers;

    @JsonProperty("content")
    private ContentNotify content;

    @JsonProperty("system")
    private String system = "E_FORM";

    @JsonProperty("type")
    private String type;
}
