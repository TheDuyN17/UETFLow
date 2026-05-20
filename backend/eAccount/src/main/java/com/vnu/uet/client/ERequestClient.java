package com.vnu.uet.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "erequest", url = "${application.client.erequest.url:http://localhost:8048}")
public interface ERequestClient {

    @GetMapping("/api/internal/requests/check-performer")
    boolean isUserAssociatedWithActiveRequests(@RequestParam("email") String email);
}
