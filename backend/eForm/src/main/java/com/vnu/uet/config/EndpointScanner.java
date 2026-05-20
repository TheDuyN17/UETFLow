package com.vnu.uet.config;

import com.vnu.uet.model.EndpointManage;
import com.vnu.uet.service.rest.client.AclVerifyClient;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.ApplicationContextEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class EndpointScanner {

    private final ApplicationContext applicationContext;
    private final AclVerifyClient aclVerifyClient;

    @Value("${spring.application.name}")
    private String applicationName;

    @EventListener(ApplicationContextEvent.class)
    public void getAllEndpoints() {
        RequestMappingHandlerMapping mapping = applicationContext.getBean(RequestMappingHandlerMapping.class);
        Map<RequestMappingInfo, HandlerMethod> handlerMethods = mapping.getHandlerMethods();

        List<EndpointManage> list = new ArrayList<>();
        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMethods.entrySet()) {
            RequestMappingInfo mappingInfo = entry.getKey();
            Set<String> path = mappingInfo.getPatternsCondition().getPatterns();
            Set<RequestMethod> method = mappingInfo.getMethodsCondition().getMethods();

            for (String p : path) {
                if (!method.isEmpty()) {
                    EndpointManage endpointManage = new EndpointManage();
                    String rs = DigestUtils.sha256Hex(applicationName + method.stream().findFirst().get() + p);
                    endpointManage.setId(rs);
                    endpointManage.setMethod(method.toArray()[0].toString());
                    endpointManage.setServiceId(11);
                    endpointManage.setServiceName(applicationName);
                    endpointManage.setPath(p);
                    endpointManage.setActive(true);
                    endpointManage.setCreatedBy("SYSTEM");
                    endpointManage.setCreatedDate(Instant.now());
                    endpointManage.setLastModifiedBy("SYSTEM");
                    endpointManage.setLastModifiedDate(Instant.now());
                    list.add(endpointManage);
                } else {
                    System.out.println(path + " error method empty.");
                }
            }
        }
        try {
            aclVerifyClient.registerOrUpdateListEndpointManage(list);
        } catch (Exception e) {
            System.err.println("Could not register endpoints to UAA: " + e.getMessage());
        }
    }
}
