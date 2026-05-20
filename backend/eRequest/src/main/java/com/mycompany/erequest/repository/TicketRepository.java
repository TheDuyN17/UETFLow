package com.mycompany.erequest.repository;

import com.mycompany.erequest.domain.Ticket;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

@SuppressWarnings("unused")
@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findAllByCreatorEmail(String creatorEmail);

    List<Ticket> findAllByCreatorEmailAndStatus(String creatorEmail, Integer status);
}
