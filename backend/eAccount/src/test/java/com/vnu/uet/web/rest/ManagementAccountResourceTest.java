package com.vnu.uet.web.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vnu.uet.domain.UserProfile;
import com.vnu.uet.service.AccountManagementService;
import com.vnu.uet.service.PermissionManagementService;
import com.vnu.uet.service.dto.EmailRequestDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ManagementAccountResourceTest {

    private MockMvc mockMvc;

    @Mock
    private AccountManagementService accountManagementService;

    @Mock
    private PermissionManagementService permissionManagementService;

    @InjectMocks
    private ManagementAccountResource managementAccountResource;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(managementAccountResource).build();
    }

    @Test
    void testSearchAccount() throws Exception {
        UserProfile profile = new UserProfile();
        profile.setEmail("test@vnu.uet");
        profile.setFirstName("Test User");
        profile.setDepartment("IT");
        profile.setIsActive(true);

        when(accountManagementService.searchUserBasicInfo("test@vnu.uet")).thenReturn(Optional.of(profile));
        when(permissionManagementService.getUserPermissions("test@vnu.uet")).thenReturn(List.of(-1, 1));

        EmailRequestDTO dto = new EmailRequestDTO();
        dto.setEmail("test@vnu.uet");

        mockMvc.perform(post("/api/management/account/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@vnu.uet"))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.roles").isArray());
    }

    @Test
    void testCheckDeletable() throws Exception {
        when(accountManagementService.checkIfDeletable(eq("test@vnu.uet"), anyString())).thenReturn(true);

        EmailRequestDTO dto = new EmailRequestDTO();
        dto.setEmail("test@vnu.uet");

        mockMvc.perform(post("/api/management/account/check-deletable")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deletable").value(true));
    }
}
