package com.mycompany.erequest.repository;

import com.mycompany.erequest.domain.TicketStep;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@SuppressWarnings("unused")
@Repository
public interface TicketStepRepository extends JpaRepository<TicketStep, Long> {
    List<TicketStep> findAllByPerformerEmailAndStatus(String performerEmail, Integer status);

    @Query("SELECT ts FROM TicketStep ts WHERE ts.ticket.id = :ticketId")
    List<TicketStep> findAllByTicketId(@Param("ticketId") Long ticketId);
}
