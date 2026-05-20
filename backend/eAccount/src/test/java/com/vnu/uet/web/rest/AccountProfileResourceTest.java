package com.vnu.uet.web.rest;

import com.vnu.uet.domain.UserProfile;
import com.vnu.uet.service.AccountManagementService;
import com.vnu.uet.service.UserProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AccountProfileResourceTest {

    private MockMvc mockMvc;

    @Mock
    private UserProfileService userProfileService;

    @Mock
    private AccountManagementService accountManagementService;

    @InjectMocks
    private AccountProfileResource accountProfileResource;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(accountProfileResource).build();
    }

    @Test
    void testGetProfile() throws Exception {
        UserProfile profile = new UserProfile();
        profile.setEmail("test@vnu.uet");
        profile.setFirstName("John Doe");
        profile.setPhone("0912345678");

        when(userProfileService.getUserProfileByEmail(anyString())).thenReturn(Optional.of(profile));

        mockMvc.perform(get("/api/account/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@vnu.uet"))
                .andExpect(jsonPath("$.firstName").value("John Doe"))
                .andExpect(jsonPath("$.phone").value("0912345678"))
                .andExpect(jsonPath("$.roles").isArray());
    }
}
