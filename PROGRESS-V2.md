# PROGRESS-V2.md — Đợt 3: Fix Full Business End-to-End Flow

**Ngày:** 2026-05-20  
**Kết quả:** ✅ PASS — 8/8 V2 acceptance tests + 10/10 regression tests

---

## Task Summary

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| Phase 0 | Probe current state | ✅ DONE | Tất cả containers up, 7/7 + 3/3 tests pass |
| Phase 1 | B4/B5/B6 analysis | ✅ DONE | Đã fix trước session này (EFlowWorkflow.jsx) |
| Phase 2 | Fix edge creation format | ✅ DONE | `node: { id }` thay vì `nodeId` — fix NULL flow_id |
| Phase 3 | Fix TransactionDetail diagram | ✅ DONE | Load real flow definition, highlight completion |
| Phase 4 | Write V2 acceptance tests | ✅ DONE | 8 tests: B1, B2, C1, D, E, F1, F2, G |
| Phase 5 | Run tests — fix strict-mode | ✅ DONE | 8/8 pass (fix B1 getByText collision) |
| Phase 6 | Regression check + docs | ✅ DONE | 18/18 tổng cộng |

---

## Files đã sửa

### Frontend (`frontend/src/`)
- `pages/WorkflowDesigner.jsx` — Fix edge creation body: `{ node: { id }, childNodeId, flow: { id } }`
- `pages/TransactionDetail.jsx` — Load real flow definition via `eFlow.getDefinition()`, build ReactFlow nodes/edges từ backend format, highlight completed steps

### Tests (`frontend/e2e/`)
- `e2e/v2-acceptance.spec.cjs` — New: 8 acceptance tests covering full B→F flow

---

## Root Causes Fixed

### 1. Edge creation leaving `flow_id=NULL` và `node_id=NULL` trong relate_node table

**Triệu chứng:** Flow diagram không hiển thị edges; `GET /workflow/{id}/definition` trả về empty edges.

**Root cause:** WorkflowDesigner.jsx gửi body:
```javascript
eFlow.addEdge(flowId, { nodeId: fromNode.backendId, childNodeId: target.backendId })
```
`RelateNodeDTO` (backend) không có field `nodeId` — chỉ có `node: NodeDTO`. Jackson silently ignore `nodeId`. Kết quả: `flow_id=NULL` và `node_id=NULL` trong DB.

`DiagramService.getFlowDefinition()` filter edges by `e.getFlow() != null && e.getFlow().getId().equals(flowId)` — nên edges với `flow_id=NULL` bị loại bỏ hoàn toàn.

**Fix:** Gửi đúng format:
```javascript
eFlow.addEdge(flowId, {
  node: { id: fromNode.backendId },
  childNodeId: target.backendId,
  flow: { id: Number(flowId) },
})
```

### 2. TransactionDetail hiển thị hardcoded diagram

**Triệu chứng:** Diagram trong TransactionDetail luôn hiện 3 nodes cố định, không phản ánh flow thực.

**Root cause:** `WorkflowDiagram` component dùng hardcoded `initialNodes` và `initialEdges`.

**Fix:** Load real definition via `eFlow.getDefinition(ticket.flowId)`. Convert backend format → ReactFlow format với completion status highlighting dựa trên ticket history.

---

## Playwright Test Results

```
V2 acceptance (v2-acceptance.spec.cjs):  8/8 PASS
  ✅ B1: EFlow modal has flowGroup field and creates flow (26.8s)
  ✅ B2: EFlow list shows group tabs and flows (1.4s)
  ✅ C1: WorkflowDesigner has Biểu mẫu tab in node config panel (2.1s)
  ✅ D: Published flow appears in eRequest home (4.5s)
  ✅ E: User creates ticket from published flow (7.2s)
  ✅ F1: Approver sees pending tasks in Kanban board (2.3s)
  ✅ F2: Approver can approve ticket → status becomes 2 (3.1s)
  ✅ G: TransactionDetail shows workflow diagram and action buttons (2.8s)

Regression (business-flow.spec.cjs):     7/7 PASS
Regression (eai-flow.spec.cjs):          3/3 PASS
─────────────────────────────────────────────────
TOTAL:                                  18/18 PASS
```

---

## Verify Commands

```bash
# Run all tests
cd E:/Du_an/frontend
npx playwright test e2e/v2-acceptance.spec.cjs --reporter=line
npx playwright test e2e/business-flow.spec.cjs e2e/eai-flow.spec.cjs --reporter=line

# Verify edge fix in DB (edges should have non-null flow_id)
# Create a new flow + node + edge through the UI, then check:
docker exec uetflow-mysql mysql -u root -proot eflow \
  -e "SELECT id, flow_id, node_id, child_node_id FROM relate_node ORDER BY id DESC LIMIT 5;"
```

---

## Known Limitations (unchanged from Đợt 2)

1. Old edges (created before this fix) still have `flow_id=NULL` — they won't show in flow definition
2. Async document-map endpoint still broken (MultipartFile cleanup) — use sync endpoint
3. S3 storage simulated, not real
4. Gemini 15 RPM rate limit applies
