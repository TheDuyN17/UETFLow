package com.vnu.uet.service;

import com.vnu.uet.client.NotifyCentralClient;
import com.vnu.uet.request.NotifyCentralForm;
import com.vnu.uet.service.dto.ContentNotify;
import com.vnu.uet.service.dto.NotifyCentralDTO;
import com.vnu.uet.service.dto.ReceiverDTO;
import com.vnu.uet.web.rest.errors.BadRequestAlertException;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class NotifyService {
    private final NotifyCentralClient notifyCentralClient;
    public void sendNotify(List<ReceiverDTO> notifyUsers,
                           List<ReceiverDTO> notifyEmails,
                           ContentNotify content,
                           String type) {

        try {
            NotifyCentralDTO notifyCentralDTO = new NotifyCentralDTO();
            notifyCentralDTO.setType(type);
            notifyCentralDTO.setNotifyUsers(notifyUsers);
            notifyCentralDTO.setNotifyEmails(notifyEmails);
            notifyCentralDTO.setContent(content);
            notifyCentralDTO.setSystem("E_FORM");

            String status = notifyCentralClient.sendNotification(notifyCentralDTO);

            if (!"ok".equalsIgnoreCase(status)) {
                log.warn("NotifyCentral returned non-ok status: {}", status);
            }

        } catch (Exception e) {
            log.warn("NotifyCentral call failed. Skip notification. Type={}", type, e);
        }
    }
}
