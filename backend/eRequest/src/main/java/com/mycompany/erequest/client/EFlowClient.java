package com.mycompany.erequest.client;

import java.util.Map;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "eFlowClient", url = "${application.client.eflow.url:http://eflow:8083}")
public interface EFlowClient {
    @GetMapping("/api/workflow/node/{nodeId}/config")
    NodeConfigDTO getNodeConfig(@PathVariable("nodeId") Long nodeId);

    @GetMapping("/api/internal/node/{nodeId}/action-plan")
    Map<String, Object> getActionPlan(@PathVariable("nodeId") Long nodeId);

    @GetMapping("/api/internal/flow/{flowId}/next-node")
    Map<String, Object> getNextNode(@PathVariable("flowId") Long flowId, @RequestParam("currentNodeId") Long currentNodeId);

    @GetMapping("/api/internal/flow/{flowId}/first-action-plan")
    Map<String, Object> getFirstActionPlan(@PathVariable("flowId") Long flowId);

    record NodeConfigDTO(
        Long nodeId,
        String nodeType,
        Long flowId,
        PerformerDTO performer,
        MapFormDTO mapForm,
        String relateDemand,
        String superviserName
    ) {}
    record PerformerDTO(Long userId, String email, Integer orderExecution) {}
    record MapFormDTO(String targetFormId, String sourceFormId) {}
}
