package com.vnu.uet.security;


import com.vnu.uet.web.rest.errors.ErrorConstants;

//@SuppressWarnings("serial")
public class AppException extends RuntimeException {
    private String code = ErrorConstants.ERR_DEFAULT;

    public AppException() {}

    public AppException(String code) {
        super(code);
        this.code = code;
    }

    public AppException(String code, String message) {
        super(message);
        this.code = code;
    }

    public AppException(Throwable t) {
        super(t);
    }

    public AppException(String code, Throwable t) {
        super(code, t);
        this.code = code;
    }

    public AppException(String code, String message, Throwable t) {
        super(message, t);
        this.code = code;
    }

    public String getCode() {
        return this.code;
    }

}
