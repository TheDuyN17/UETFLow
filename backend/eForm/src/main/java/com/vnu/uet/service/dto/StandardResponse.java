package com.vnu.uet.service.dto;

import lombok.Data;

@Data
public class StandardResponse {
    private String message;
    private Object data;

    public StandardResponse(String message, Object data) {
        this.message = message;
        this.data = data;
    }

}
