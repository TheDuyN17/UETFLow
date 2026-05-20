package com.vnu.uet.client;

import com.vnu.uet.service.dto.StorageServiceConfigDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "centralConfigClient", url = "${xform-central.url}")
public interface CentralConfigClients {
    @GetMapping(value = "/api/storage-service-configs/internal/{serviceName}")
    List<StorageServiceConfigDTO> findByServiceName(@PathVariable(value = "serviceName") String serviceName);
}
