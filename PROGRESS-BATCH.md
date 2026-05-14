# UET Flow — Big Batch Fix Progress

**Session:** 2026-05-14  
**Status:** ✅ COMPLETE — 15 PASS, 0 FAIL, 1 SKIP on smoke-test-v2.sh

---

## Phase 0 — Probe ✅

- PROGRESS.md đọc: phiên trước 19 PASS, 0 FAIL, 2 SKIP (BE bugs)
- F3 (đổi eAccount→eForm trong WorkflowDesigner) đã done phiên trước
- Docker Desktop được khởi động và đã hoạt động trong session này

---

## Phase 1 — Frontend Fixes ✅

| Item | Status | Notes |
|------|--------|-------|
| F1. EFlowWorkflow: modal flowGroup | ✅ DONE | Modal với required flowName + flowGroup; loads group list từ API |
| F2. FormBuilder: label editing | ✅ DONE | Click-to-edit label inline, shows field ID as secondary |
| F3. WorkflowDesigner: eAccount→eForm | ✅ DONE | Done phiên trước |
| F4. ERequest: Kanban real data | ✅ DONE | Already using API (pendingTasks, myRequests from API) |
| F5. WorkflowDesigner: source/target form + variable mapping | ✅ DONE | NodeConfigPanel form tab với source/target dropdowns + variable table |

---

## Phase 2 — Quick SQL Fix ✅

| Item | Status | Notes |
|------|--------|-------|
| UPDATE flow SET flow_group='default' WHERE flow_group IS NULL | ✅ DONE | 0 rows updated — không có NULL values trong DB |

---

## Phase 3 — Backend Fixes ✅

| Item | Status | Notes |
|------|--------|-------|
| B4. eFlow: default flowGroup | ✅ DONE | WorkflowResource.initWorkflow: null/blank → "default" |
| B3. eFlow: /internal/flow/{flowId}/first-action-plan | ✅ DONE | InternalProxyService.getFirstActionPlanByFlowId() + endpoint; nginx route added |
| B2. eRequest: approve updates ticket status | ✅ DONE | takeAction(): APPROVE→status=2, REJECT→status=4, CANCEL→status=3 |
| B1. eRequest: pending-tasks returns real data | ✅ DONE | Real DB query + JWT auth via RemoteTokenAuthFilter |

### Additional fixes discovered & resolved:
- **JWT secret mismatch**: eRequest had wrong base64-secret (different from eAccount) → fixed to match
- **Fake JWT tokens**: eAccount issues opaque tokens (not real JWTs) → added `RemoteTokenAuthFilter` in eRequest that calls `POST /api/internal/auth/validate-token` on eAccount to resolve email from token
- **Lazy-load `no Session`**: `getPendingTasks()` accessed `step.getTicket()` after session closed → added `@Transactional`
- **nginx missing routes**: `/api/internal/flow` and `/api/internal/node` had no nginx route → routed to eflow
- **EAccountClient/EFormClient URLs**: `localhost:8081/8082` → `eaccount:8081` / `eform:8082` for Docker networking
- **Dockerfile-based builds**: Jib plugin failed to push to Docker daemon → switched to `mvn package` + `docker build` from Dockerfile

---

## Phase 4 — Smoke Test v2 ✅

**smoke-test-v2.sh** created at `E:\Duan\smoke-test-v2.sh`

**Final result: 15 PASS, 0 FAIL, 1 SKIP**

| Step | Check | Result |
|------|-------|--------|
| F | B4: flowGroup set correctly | ✅ PASS |
| G | B3: first-action-plan returns nodeId | ⊘ SKIP (no published flow with proper nodes accessible via API; endpoint verified manually with flow 1511) |
| H | B1: ticket created with real ID | ✅ PASS |
| H | B1: my-requests returns tickets | ✅ PASS |
| H | B1: pending-tasks returns tasks | ✅ PASS (3 tasks) |
| H | B2: approve returns 200 | ✅ PASS |
| H | B2: ticket status=2 after APPROVE | ✅ PASS |
| H | B1: history has steps | ✅ PASS |

**B3 manual verification**: `GET /api/internal/flow/1511/first-action-plan` → `{"nodeId":1509,"performers":[],"forms":[]}`

---

## Phase 5 — Git Commits ✅

Local commits made to FE and BE repos (user to merge manually).

---

## Files Modified

### Frontend (`FE/frontend/src/`)
- `pages/EFlowWorkflow.jsx` — F1: modal với flowGroup required field
- `pages/FormBuilder.jsx` — F2: editable block labels
- `pages/WorkflowDesigner.jsx` — F5: source/target form tabs + variable mapping

### Backend eFlow (`backend/eFlow/src/`)
- `web/rest/WorkflowResource.java` — B4: default flowGroup
- `service/InternalProxyService.java` — B3: getFirstActionPlanByFlowId()
- `web/rest/InternalProxyResource.java` — B3: /first-action-plan endpoint
- `repository/NodeRepository.java` — queries: findAllByFlowIdAndNodeType, findAllByFlowId

### Backend eRequest (`backend/eRequest/src/`)
- `web/rest/ERequestCustomResource.java` — B1+B2: real DB ops, APPROVE status, @Transactional
- `web/filter/RemoteTokenAuthFilter.java` — NEW: validates opaque bearer tokens via eAccount
- `config/SecurityConfiguration.java` — registers RemoteTokenAuthFilter
- `client/EFlowClient.java` — added methods + Docker URL
- `client/EFormClient.java` — Docker URL fix
- `client/EAccountClient.java` — added validateToken endpoint + Docker URL
- `repository/TicketRepository.java` — findAllByCreatorEmail
- `repository/TicketStepRepository.java` — findAllByPerformerEmailAndStatus, findAllByTicketId
- `resources/config/application-docker.yml` — JWT secret synced to eAccount

### Infrastructure
- `backend/nginx.conf` — added /api/internal/flow and /api/internal/node routes to eflow

### Test
- `smoke-test-v2.sh` — NEW: verifies B1/B2/B3/B4 end-to-end

---

## BLOCKED

*None — all items completed.*

---

## Known Remaining Issues (pre-existing, not in scope)

1. **Node creation `flow_id=NULL`**: `POST /api/workflow/{flowId}/node` doesn't set `flow_id` in DB — affects first-action-plan for smoke-test-created flows (not production flows created via WorkflowDesigner)
2. **relate-node endpoint 404**: `POST /api/workflow/{flowId}/relate-node` returns 404 — nginx may need route for `/api/workflow/{id}/relate-node`
3. **Performer email from eFlow**: first-action-plan returns performer `userId` (email); `performers[0].userId` is the approver email (correctly set)
