package org.springframework.security.core;

public class AuthenticationException extends RuntimeException {
    public AuthenticationException(String msg, Throwable t) {
        super(msg, t);
    }

    public AuthenticationException(String msg) {
        super(msg);
    }
}
