package com.vnu.uet.service;

import com.vnu.uet.client.ERequestClient;
import com.vnu.uet.domain.UserProfile;
import com.vnu.uet.repository.UserProfileRepository;
import com.vnu.uet.service.dto.ProfileDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountManagementServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private PermissionManagementService permissionManagementService;

    @Mock
    private ERequestClient eRequestClient;

    @InjectMocks
    private AccountManagementService accountManagementService;

    private UserProfile profile;

    @BeforeEach
    void setUp() {
        profile = new UserProfile();
        profile.setEmail("test@vnu.uet");
        profile.setIsActive(true);
    }

    @Test
    void testCreateEmployee() {
        ProfileDTO dto = new ProfileDTO();
        dto.setEmail("new@vnu.uet");
        dto.setFirstName("New User");

        when(userProfileRepository.findOneByEmail(anyString())).thenReturn(Optional.empty());

        String rawPassword = accountManagementService.createEmployee(dto);

        assertNotNull(rawPassword);
        verify(userProfileRepository, times(1)).save(any(UserProfile.class));
        verify(permissionManagementService, times(1)).assignDefaultPermission("new@vnu.uet");
    }

    @Test
    void testCreateEmployee_EmailAlreadyExists() {
        ProfileDTO dto = new ProfileDTO();
        dto.setEmail("test@vnu.uet");

        when(userProfileRepository.findOneByEmail("test@vnu.uet")).thenReturn(Optional.of(profile));

        assertThrows(RuntimeException.class, () -> accountManagementService.createEmployee(dto));
    }

    @Test
    void testCheckIfDeletable_BlockedByERequest() {
        when(eRequestClient.isUserAssociatedWithActiveRequests("user@vnu.uet")).thenReturn(true);
        boolean deletable = accountManagementService.checkIfDeletable("user@vnu.uet", "admin@vnu.uet");
        assertFalse(deletable);
    }
    
    @Test
    void testCheckIfDeletable_Success() {
        when(eRequestClient.isUserAssociatedWithActiveRequests("user@vnu.uet")).thenReturn(false);
        when(permissionManagementService.isManager("user@vnu.uet")).thenReturn(false);
        boolean deletable = accountManagementService.checkIfDeletable("user@vnu.uet", "admin@vnu.uet");
        assertTrue(deletable);
    }

    @Test
    void testCheckIfDeletable_Level1CannotDeleteManager() {
        when(eRequestClient.isUserAssociatedWithActiveRequests("target@vnu.uet")).thenReturn(false);
        when(permissionManagementService.isManager("target@vnu.uet")).thenReturn(true);
        when(permissionManagementService.hasPermission("requester@vnu.uet", 4)).thenReturn(false);
        boolean deletable = accountManagementService.checkIfDeletable("target@vnu.uet", "requester@vnu.uet");
        assertFalse(deletable);
    }

    @Test
    void testDeleteUserAccount() {
        when(userProfileRepository.findOneByEmail("test@vnu.uet")).thenReturn(Optional.of(profile));

        accountManagementService.deleteUserAccount("test@vnu.uet");

        verify(userProfileRepository, never()).delete(any());
        verify(userProfileRepository, times(1)).save(profile);
        assertFalse(profile.getIsActive());
    }
}
