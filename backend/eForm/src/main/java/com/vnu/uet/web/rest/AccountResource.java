package com.vnu.uet.web.rest;

import com.vnu.uet.security.SecurityUtils;
import com.vnu.uet.security.UserInFoDetails;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AccountResource {
    private final Gson gson = new Gson();

    @GetMapping("/account")
    public ResponseEntity<String> getAccount() {
        UserInFoDetails currentUser = SecurityUtils.getInfoCurrentUserLogin();
        return ResponseEntity.ok(gson.toJson(currentUser));
    }
}
