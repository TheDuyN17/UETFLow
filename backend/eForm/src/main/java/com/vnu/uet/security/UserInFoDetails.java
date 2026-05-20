package com.vnu.uet.security;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserInFoDetails {

	private Long id;
	private String login;
	private String email;
	private Long custId;
	private String orgIn;
	private String orgId; // ID phẳng theo chuẩn eAccount
	private String avatarUrl; // URL từ S3
	private String signatureUrl; // URL từ S3
}
