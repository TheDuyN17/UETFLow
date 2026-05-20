package com.vnu.uet.web.rest.errors;

import java.net.URI;

public final class ErrorConstants {

	public static final String ERR_CONCURRENCY_FAILURE = "error.concurrencyFailure";
	public static final String ERR_VALIDATION = "error.validation";
	public static final String PROBLEM_BASE_URL = "https://www.jhipster.tech/problem";
	public static final URI DEFAULT_TYPE = URI.create(PROBLEM_BASE_URL + "/problem-with-message");
	public static final URI CONSTRAINT_VIOLATION_TYPE = URI.create(PROBLEM_BASE_URL + "/constraint-violation");
	public static final URI ENTITY_NOT_FOUND_TYPE = URI.create(PROBLEM_BASE_URL + "/entity-not-found");
	public static final URI INVALID_PASSWORD_TYPE = URI.create(PROBLEM_BASE_URL + "/invalid-password");
	public static final URI EMAIL_ALREADY_USED_TYPE = URI.create(PROBLEM_BASE_URL + "/email-already-used");
	public static final URI LOGIN_ALREADY_USED_TYPE = URI.create(PROBLEM_BASE_URL + "/login-already-used");
	public static final URI EMAIL_NOT_FOUND_TYPE = URI.create(PROBLEM_BASE_URL + "/email-not-found");
	public static final String ERR_DEFAULT = "error.default";
	public static final String ERR_FORBIDEN = "error.forbiden";

	public static final String ERR_PERMISSION_DENIED = "error.permissionDenied";

	/*
	 * elastic serach UAA
	 */
	public static final String ERR_NOT_CLEAR_INDEX_ELASTIC = "error.notClearIndexElastic";
	public static final String ERR_NOT_UPDATE_INDEX_ELASTIC = "error.notUpdateIndexElastic";


	/*
	 * move user
	 */
	public static final String ERR_USER_EXISTS_RESOURCE = "error.userExistsResource";



	/*
	 * change and reset password
	 */


	public static final String ERR_USER_POLICY_PASSWORD_DUPLICATE = "error.userPolicyPasswordDuplicate";



	/*
	 * err to s3 storage
	 */


	public static final String ERR_DOWNLOAD_DOCUMENT_TO_S3_IS_NOT_EXISTS = "error.downloadDocumentToS3IsNotExists";
	public static final String ERR_UPLOAD_DOCUMENT_TO_S3_ERROR = "error.uploadDocumentToS3Error";
	public static final String ERR_DOWNLOAD_DOCUMENT_TO_S3_ERROR = "error.downloadDocumentToS3Error";


	private ErrorConstants() {
	}
}
