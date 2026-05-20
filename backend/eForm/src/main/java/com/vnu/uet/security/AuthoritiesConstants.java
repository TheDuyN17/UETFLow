package com.vnu.uet.security;

/**
 * Constants for Spring Security authorities.
 */
public final class 	AuthoritiesConstants {
    // for admin
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_SUPPORT = "ROLE_SUPPORT";
    public static final String ROLE_ANONYMOUS = "ROLE_ANONYMOUS";

    // for customer
    public static final String ROLE_USER = "ROLE_USER";
    public static final String ROLE_ORG_ADMIN = "ROLE_ORG_ADMIN";
    public static final String ROLE_CUST_STAFF = "ROLE_CUST_STAFF";
    public static final String ROLE_USER_RESTRICT = "ROLE_USER_RESTRICT";
    public static final String ROLE_CUST_DOC = "ROLE_CUST_DOC";
    public static final String ROLE_CUST_REPORT = "ROLE_CUST_REPORT";
    public static final String ROLE_CUST_USER_FREE = "ROLE_CUST_USER_FREE";
    public static final String ROLE_CUST_IT = "ROLE_CUST_IT";
    public static final String ROLE_CUST_VIEWER = "ROLE_CUST_VIEWER";

    private AuthoritiesConstants() {
    }
}
