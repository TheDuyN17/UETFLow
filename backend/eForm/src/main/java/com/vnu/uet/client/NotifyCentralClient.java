package com.vnu.uet.client;

import com.vnu.uet.service.dto.NotifyCentralDTO;
import com.vnu.uet.request.NotifyCentralForm;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "notifyCentralClient", url = "${xform-central.url}")
public interface NotifyCentralClient {
    // @PostMapping(value = "/api/internal/idaas-notify")
    // String sendNotification(@RequestBody NotifyCentralForm notifyCentralForm);

    @PostMapping(value = "/api/v2/idaas-notify")
    String sendNotification(@RequestBody NotifyCentralDTO notifyCentralDTO);
}
