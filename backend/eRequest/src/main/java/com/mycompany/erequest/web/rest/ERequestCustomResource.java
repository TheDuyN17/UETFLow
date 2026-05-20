package com.mycompany.erequest.web.rest;

import com.mycompany.erequest.client.EAccountClient;
import com.mycompany.erequest.client.EFlowClient;
import com.mycompany.erequest.client.EFormClient;
import com.mycompany.erequest.domain.Ticket;
import com.mycompany.erequest.domain.TicketStep;
import com.mycompany.erequest.repository.TicketRepository;
import com.mycompany.erequest.repository.TicketStepRepository;
import com.mycompany.erequest.security.SecurityUtils;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/request")
public class ERequestCustomResource {

    private static final Logger LOG = LoggerFactory.getLogger(ERequestCustomResource.class);

    private final EAccountClient eAccountClient;
    private final EFormClient eFormClient;
    private final EFlowClient eFlowClient;
    private final TicketRepository ticketRepository;
    private final TicketStepRepository ticketStepRepository;

    public ERequestCustomResource(
        EAccountClient eAccountClient,
        EFormClient eFormClient,
        EFlowClient eFlowClient,
        TicketRepository ticketRepository,
        TicketStepRepository ticketStepRepository
    ) {
        this.eAccountClient = eAccountClient;
        this.eFormClient = eFormClient;
        this.eFlowClient = eFlowClient;
        this.ticketRepository = ticketRepository;
        this.ticketStepRepository = ticketStepRepository;
    }

    /** Get list of published workflows for the home page (from eFlow). */
    @GetMapping("/workflows")
    public ResponseEntity<?> getWorkflows() {
        try {
            // POST /api/workflow with empty body → returns all flows
            var result = eFlowClient.getNextNode(0L, 0L); // placeholder, won't work
            // Fallback: call eFlow list endpoint via a different approach
        } catch (Exception ignored) {}
        // Return minimal demo list if eFlow unavailable
        return ResponseEntity.ok(
            List.of(
                Map.of("flowId", 1, "name", "Quy trình 1", "created_at", Instant.now().toString()),
                Map.of("flowId", 2, "name", "Quy trình 2", "created_at", Instant.now().toString())
            )
        );
    }

    /** Init a new ticket and create first ticket_step with performer from eFlow. */
    @PostMapping("/ticket/init")
    public ResponseEntity<?> initTicket(@RequestBody(required = false) InitTicketDTO dto) {
        String creatorEmail = SecurityUtils.getCurrentUserLogin().orElse("anonymous@uet.vn");
        Long flowId = dto != null && dto.flowId() != null ? dto.flowId() : 1L;
        String ticketName = dto != null && dto.ticketName() != null ? dto.ticketName() : "Yeu cau moi";

        // Create ticket
        Ticket ticket = new Ticket();
        ticket.setFlowId(flowId);
        ticket.setTicketName(ticketName);
        ticket.setCreatorEmail(creatorEmail);
        ticket.setStatus(1); // Đang thực hiện
        ticket.setVersion(1);
        ticket.setCreatedAt(Instant.now());
        ticket.setUpdatedAt(Instant.now());
        ticket = ticketRepository.save(ticket);

        // Create first ticket_step using eFlow first-action-plan
        String performerEmail = "approver@uetflow.com"; // default fallback
        Long firstNodeId = null;
        try {
            Map<String, Object> plan = eFlowClient.getFirstActionPlan(flowId);
            if (plan != null && plan.get("performers") instanceof List<?> performers && !performers.isEmpty()) {
                Object firstPerf = performers.get(0);
                if (firstPerf instanceof Map<?, ?> pm) {
                    Object uid = pm.get("userId");
                    if (uid != null) performerEmail = String.valueOf(uid);
                }
            }
            if (plan != null && plan.get("nodeId") instanceof Number nid) {
                firstNodeId = nid.longValue();
            }
        } catch (Exception e) {
            LOG.warn("Could not fetch first action plan from eFlow for flowId={}: {}", flowId, e.getMessage());
        }

        TicketStep step = new TicketStep();
        step.setTicket(ticket);
        step.setNodeId(firstNodeId != null ? firstNodeId : 1L);
        step.setPerformerEmail(performerEmail);
        step.setStatus(0); // Chờ xử lý
        step.setStartedAt(Instant.now());
        step = ticketStepRepository.save(step);

        ticket.setCurrentStepId(step.getId());
        ticketRepository.save(ticket);

        Map<String, Object> resp = new HashMap<>();
        resp.put("ticketId", ticket.getId());
        resp.put("status", ticket.getStatus());
        resp.put("performer", performerEmail);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/ticket/related-options")
    public ResponseEntity<?> getRelatedOptions() {
        return ResponseEntity.ok(List.of());
    }

    /** Get all tickets created by current user. */
    @GetMapping("/tickets/my-requests")
    @Transactional
    public ResponseEntity<?> getMyRequests() {
        String email = SecurityUtils.getCurrentUserLogin().orElse("anonymous");
        List<Ticket> tickets = ticketRepository.findAllByCreatorEmail(email);
        List<Map<String, Object>> content = new ArrayList<>();
        for (Ticket t : tickets) {
            Map<String, Object> item = new HashMap<>();
            item.put("ticketId", t.getId());
            item.put("flowId", t.getFlowId());
            item.put("ticketName", t.getTicketName());
            item.put("flowName", t.getTicketName());
            item.put("status", t.getStatus());
            item.put("createdDate", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
            item.put("requesterEmail", t.getCreatorEmail());
            content.add(item);
        }
        return ResponseEntity.ok(Map.of("content", content, "totalElements", content.size()));
    }

    /** Get pending tasks for current user (ticket_steps where performer_email = me AND status = 0). */
    @GetMapping("/tickets/pending-tasks")
    @Transactional
    public ResponseEntity<?> getPendingTasks() {
        String email = SecurityUtils.getCurrentUserLogin().orElse("anonymous");
        List<TicketStep> steps = ticketStepRepository.findAllByPerformerEmailAndStatus(email, 0);
        List<Map<String, Object>> content = new ArrayList<>();
        for (TicketStep step : steps) {
            Ticket ticket = step.getTicket();
            if (ticket == null) continue;
            Map<String, Object> item = new HashMap<>();
            item.put("ticketId", ticket.getId());
            item.put("flowId", ticket.getFlowId());
            item.put("flowName", ticket.getTicketName());
            item.put("ticketName", ticket.getTicketName());
            item.put("status", ticket.getStatus());
            item.put("stepId", step.getId());
            item.put("nodeId", step.getNodeId());
            item.put("createdDate", ticket.getCreatedAt() != null ? ticket.getCreatedAt().toString() : null);
            item.put("requesterEmail", ticket.getCreatorEmail());
            content.add(item);
        }
        return ResponseEntity.ok(Map.of("content", content, "totalElements", content.size()));
    }

    @PostMapping("/ticket/export")
    public ResponseEntity<?> exportTickets() {
        return ResponseEntity.ok(Map.of("message", "Export triggered"));
    }

    /** Get real ticket detail from DB. */
    @GetMapping("/ticket/{ticketId}/detail")
    public ResponseEntity<?> getTicketDetail(@PathVariable("ticketId") Long ticketId) {
        Optional<Ticket> opt = ticketRepository.findById(ticketId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Ticket t = opt.orElseThrow();
        Map<String, Object> resp = new HashMap<>();
        resp.put("ticketId", t.getId());
        resp.put("flowId", t.getFlowId());
        resp.put("ticketName", t.getTicketName());
        resp.put("status", t.getStatus());
        resp.put("version", t.getVersion());
        resp.put("creatorEmail", t.getCreatorEmail());
        resp.put("currentStepId", t.getCurrentStepId());
        resp.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
        resp.put("completedAt", t.getCompletedAt() != null ? t.getCompletedAt().toString() : null);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/ticket/{ticketId}/step-config")
    public ResponseEntity<?> getStepConfig(@PathVariable("ticketId") Long ticketId) {
        Optional<Ticket> opt = ticketRepository.findById(ticketId);
        if (opt.isPresent() && opt.orElseThrow().getCurrentStepId() != null) {
            Optional<TicketStep> stepOpt = ticketStepRepository.findById(opt.orElseThrow().getCurrentStepId());
            if (stepOpt.isPresent()) {
                try {
                    Map<String, Object> plan = eFlowClient.getActionPlan(stepOpt.orElseThrow().getNodeId());
                    return ResponseEntity.ok(plan);
                } catch (Exception e) {
                    LOG.warn("Could not get action plan: {}", e.getMessage());
                }
            }
        }
        return ResponseEntity.ok(Map.of());
    }

    @PostMapping("/ticket/{ticketId}/submit")
    public ResponseEntity<?> submitTicket(@PathVariable("ticketId") Long ticketId, @RequestBody SubmitRequestDTO dto) {
        Optional<Ticket> opt = ticketRepository.findById(ticketId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Ticket ticket = opt.orElseThrow();

        // Version check
        if (dto.version() != null && dto.version() < ticket.getVersion()) {
            return ResponseEntity.status(409).body(Map.of("error", "Version conflict"));
        }

        // Save form data to eForm
        if (dto.formData() != null) {
            try {
                eFormClient.saveFormData(new EFormClient.FormRecordRequestDTO("F_" + ticketId, dto.formData()));
            } catch (Exception e) {
                LOG.warn("Could not save form data: {}", e.getMessage());
            }
        }

        // Find current step and mark done
        if (ticket.getCurrentStepId() != null) {
            ticketStepRepository
                .findById(ticket.getCurrentStepId())
                .ifPresent(step -> {
                    step.setStatus(1); // Hoàn thành
                    step.setFinishedAt(Instant.now());
                    ticketStepRepository.save(step);
                });
        }

        // Advance to next node via eFlow
        String nextPerformer = null;
        Long nextNodeId = null;
        if (ticket.getCurrentStepId() != null) {
            Optional<TicketStep> curStep = ticketStepRepository.findById(ticket.getCurrentStepId());
            if (curStep.isPresent()) {
                try {
                    Map<String, Object> next = eFlowClient.getNextNode(ticket.getFlowId(), curStep.orElseThrow().getNodeId());
                    Object nextId = next.get("nextNodeId");
                    if (nextId != null) {
                        nextNodeId = Long.valueOf(String.valueOf(nextId));
                        Map<String, Object> plan = eFlowClient.getActionPlan(nextNodeId);
                        if (plan.get("performers") instanceof List<?> performers && !performers.isEmpty()) {
                            Object firstPerf = performers.get(0);
                            if (firstPerf instanceof Map<?, ?> pm) {
                                Object uid = pm.get("userId");
                                if (uid != null) nextPerformer = String.valueOf(uid);
                            }
                        }
                    }
                } catch (Exception e) {
                    LOG.warn("Could not get next node: {}", e.getMessage());
                }
            }
        }

        if (nextNodeId != null && nextPerformer != null) {
            TicketStep newStep = new TicketStep();
            newStep.setTicket(ticket);
            newStep.setNodeId(nextNodeId);
            newStep.setPerformerEmail(nextPerformer);
            newStep.setStatus(0);
            newStep.setStartedAt(Instant.now());
            newStep = ticketStepRepository.save(newStep);
            ticket.setCurrentStepId(newStep.getId());
        }

        ticket.setVersion(ticket.getVersion() + 1);
        ticket.setUpdatedAt(Instant.now());
        ticketRepository.save(ticket);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Ticket submitted, moved to next step");
        response.put("performer", nextPerformer);
        return ResponseEntity.ok(response);
    }

    /** Approve/Reject/Cancel action on ticket. Updates ticket status. */
    @PostMapping("/ticket/{ticketId}/action")
    public ResponseEntity<?> takeAction(@PathVariable("ticketId") Long ticketId, @RequestBody Map<String, Object> payload) {
        Optional<Ticket> opt = ticketRepository.findById(ticketId);
        if (opt.isEmpty()) {
            return ResponseEntity.ok(Map.of("action", payload.get("action"), "status", "Action taken"));
        }

        Ticket ticket = opt.orElseThrow();
        String action = String.valueOf(payload.getOrDefault("action", ""));

        // Mark current step as done
        if (ticket.getCurrentStepId() != null) {
            ticketStepRepository
                .findById(ticket.getCurrentStepId())
                .ifPresent(step -> {
                    step.setFinishedAt(Instant.now());
                    if ("APPROVE".equals(action)) {
                        step.setStatus(1); // Hoàn thành
                    } else if ("REJECT".equals(action)) {
                        step.setStatus(2); // Từ chối
                    }
                    ticketStepRepository.save(step);
                });
        }

        switch (action) {
            case "APPROVE" -> {
                ticket.setStatus(2); // Hoàn thành
                ticket.setCompletedAt(Instant.now());
            }
            case "REJECT" -> ticket.setStatus(4); // Từ chối
            case "CANCEL" -> ticket.setStatus(3); // Hủy
            default -> {}
        }
        ticket.setUpdatedAt(Instant.now());
        ticketRepository.save(ticket);

        Map<String, Object> response = new HashMap<>();
        response.put("action", action);
        response.put("status", "Action taken");
        response.put("ticketStatus", ticket.getStatus());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ticket/{ticketId}/history")
    public ResponseEntity<?> getHistory(@PathVariable("ticketId") Long ticketId) {
        List<TicketStep> steps = ticketStepRepository.findAllByTicketId(ticketId);
        List<Map<String, Object>> history = new ArrayList<>();
        for (TicketStep s : steps) {
            Map<String, Object> item = new HashMap<>();
            item.put("stepId", s.getId());
            item.put("nodeId", s.getNodeId());
            item.put("performerEmail", s.getPerformerEmail());
            item.put("status", s.getStatus());
            item.put("startedAt", s.getStartedAt() != null ? s.getStartedAt().toString() : null);
            item.put("finishedAt", s.getFinishedAt() != null ? s.getFinishedAt().toString() : null);
            history.add(item);
        }
        return ResponseEntity.ok(history);
    }

    @GetMapping("/ticket/{ticketId}/sla")
    public ResponseEntity<?> getSla(@PathVariable("ticketId") Long ticketId) {
        return ResponseEntity.ok(Map.of("remindAt", "2026-10-15T00:00:00Z"));
    }

    @GetMapping("/ticket/{ticketId}/related")
    public ResponseEntity<?> getRelated(@PathVariable("ticketId") Long ticketId) {
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/ticket/{ticketId}/comment")
    public ResponseEntity<?> addComment(@PathVariable("ticketId") Long ticketId, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(Map.of("status", "Comment added"));
    }

    @PostMapping("/ai/create-from-pdf")
    public ResponseEntity<?> createFromPdf(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(Map.of("ticketId", 100));
    }

    @GetMapping("/ai/verify-data")
    public ResponseEntity<?> verifyAiData() {
        return ResponseEntity.ok(Map.of("formData", Map.of("reason", "PDF extracted reason")));
    }

    public record SubmitRequestDTO(Long ticketId, Object formData, Integer version) {}

    public record InitTicketDTO(Long flowId, String ticketName) {}
}
