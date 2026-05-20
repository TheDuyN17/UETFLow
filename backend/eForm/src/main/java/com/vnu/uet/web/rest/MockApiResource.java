package com.vnu.uet.web.rest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MockApiResource {

    /**
     * Mock API for GET /api/account/profile
     */
    @GetMapping("/account/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Map<String, Object> response = new HashMap<>();
        response.put("email", "user@vnu.uet");
        response.put("firstName", "Nguyễn Văn A");
        response.put("phone", "0912345678");
        response.put("dob", "1995-10-15T00:00:00Z");
        response.put("gender", "MALE");
        response.put("position", "Nhân viên");
        response.put("job", "Kế toán");
        response.put("department", "Phòng BI");
        response.put("avatar", "https://s3.cloud/eaccount/avatars/user_a.png");
        response.put("roles", Arrays.asList(-1, 2, 3));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Mock API for POST /api/internal/permissions/check-access
     */
    @PostMapping("/internal/permissions/check-access")
    public ResponseEntity<Map<String, Object>> checkAccess(@RequestBody Map<String, Object> requestBody) {
        // You could use requestBody here to validate email and requiredRole
        // String email = (String) requestBody.get("email");
        // Integer requiredRole = (Integer) requestBody.get("requiredRole");
        
        Map<String, Object> response = new HashMap<>();
        response.put("hasAccess", true);
        
        return ResponseEntity.ok(response);
    }
    /**
     * Mock API for POST /api/internal/auth/refresh-token
     */
    @PostMapping("/internal/auth/refresh-token")
    public ResponseEntity<Map<String, Object>> refreshToken(@RequestBody Map<String, Object> requestBody) {
        Map<String, Object> response = new HashMap<>();
        response.put("token", "eyJhbGciOiJIUzI1NiJ_NEW_REFRESHED_TOKEN_2026...");
        response.put("roles", Arrays.asList(-1, 2, 3));
        response.put("expiresIn", 3600);
        
        return ResponseEntity.ok(response);
    }
}
