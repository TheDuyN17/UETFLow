package com.vnu.uet.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PermissionManagementServiceTest {

    private PermissionManagementService permissionManagementService;

    @BeforeEach
    void setUp() {
        permissionManagementService = new PermissionManagementService();
    }

    @Test
    void testGetSystemRolesContainsRole3Updated() {
        List<Map<String, Object>> roles = permissionManagementService.getSystemRoles();
        
        boolean foundRole3 = false;
        for (Map<String, Object> role : roles) {
            if (role.get("id").equals(3)) {
                foundRole3 = true;
                assertEquals("Thiết kế quy trình (BI Admin - eFlow)", role.get("name"));
            }
        }
        assertTrue(foundRole3, "System roles must contain Role 3");
    }

    @Test
    void testAssignDefaultPermission() {
        permissionManagementService.assignDefaultPermission("test@vnu.uet");
        List<Integer> roles = permissionManagementService.getUserPermissions("test@vnu.uet");
        assertTrue(roles.contains(-1));
    }
}
