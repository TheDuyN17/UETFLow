package com.vnu.uet.web.rest.errors;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class FormNotPermission extends RuntimeException {

    public FormNotPermission(String message) {
        super(message);
    }
}
