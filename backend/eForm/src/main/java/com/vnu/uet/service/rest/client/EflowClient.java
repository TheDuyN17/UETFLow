package com.vnu.uet.service.rest.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "eflowClient", url = "${application.eflow-url:http://eflow:8080}")
public interface EflowClient {

    @GetMapping(path = "/api/eflow/check-form-releasing", produces = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<Boolean> isFormReleasing(@RequestParam("formId") String formId);
}
