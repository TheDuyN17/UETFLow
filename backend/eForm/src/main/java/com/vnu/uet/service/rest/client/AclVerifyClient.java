package com.vnu.uet.service.rest.client;

import org.springframework.cloud.openfeign.FeignClient;
import com.vnu.uet.model.EndpointManage;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import javax.validation.Valid;
import java.util.List;

@FeignClient(name = "aclVerifyClient", url = "${application.uaa-name}")
public interface AclVerifyClient {
    @PostMapping(path = "/api/endpoint-manages", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<EndpointManage> registerOrUpdateEndpointManage(@Valid @RequestBody EndpointManage endpointManage);

    @PostMapping(path = "/api/list/endpoint-manages", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    ResponseEntity<EndpointManage> registerOrUpdateListEndpointManage(
            @Valid @RequestBody List<EndpointManage> lEndpointManage);
}
