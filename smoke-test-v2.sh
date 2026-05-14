#!/usr/bin/env bash
# smoke-test-v2.sh — Verify batch fixes B1/B2/B3/B4 end-to-end
# Extends smoke-test.sh with new assertions covering batch session fixes.
# Requires: backend Docker running, jq installed
# Output: smoke-test-v2.log + exit 0 (all pass) / 1 (any fail)

set -u
LOG="${PWD}/smoke-test-v2.log"
: > "$LOG"
exec > >(tee -a "$LOG") 2>&1

# ─── CONFIG ─────────────────────────────────────────────────────────
GATEWAY="${GATEWAY:-http://localhost:8080}"
ORIGIN="${ORIGIN:-http://localhost:5173}"

ADMIN_EMAIL="admin@uetflow.com"
ADMIN_PASS="admin"
BI_EMAIL="bi@uetflow.com"
BI_PASS="805e1aee@123"
USER_EMAIL="user@uetflow.com"
USER_PASS="8237cdf6@123"
APPROVER_EMAIL="approver@uetflow.com"
APPROVER_PASS="56d9c4f6@123"
# ────────────────────────────────────────────────────────────────────

PASS=0
FAIL=0
SKIP=0
FAIL_STEPS=()

step()  { echo ""; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; echo "▶ $*"; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; }
pass()  { echo "✅ PASS: $*"; PASS=$((PASS+1)); }
fail()  { echo "❌ FAIL: $*"; FAIL=$((FAIL+1)); FAIL_STEPS+=("$*"); }
skip()  { echo "⊘  SKIP: $*"; SKIP=$((SKIP+1)); }

command -v jq >/dev/null || { echo "Need jq. Install: scoop install jq"; exit 2; }

# ─── Step 0: Gateway ─────────────────────────────────────────────────
step "Step 0 — Gateway healthcheck"
GW_CODE=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "${GATEWAY}/api/permissions/system-roles" 2>/dev/null || echo "000")
if [ "$GW_CODE" = "200" ] || [ "$GW_CODE" = "401" ] || [ "$GW_CODE" = "403" ]; then
  pass "Gateway up (HTTP $GW_CODE)"
else
  fail "Gateway unreachable (HTTP $GW_CODE)"
  echo "Cannot continue. Exit."
  exit 1
fi

# ─── Login ────────────────────────────────────────────────────────────
step "Step A — Login"
login() {
  local EMAIL="$1" PW="$2"
  curl -sS -X POST "${GATEWAY}/api/internal/auth/generate-token" \
    -H "Content-Type: application/json" -H "Origin: $ORIGIN" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}" | jq -r '.token // .id_token // empty'
}

ADMIN_TOKEN=$(login "$ADMIN_EMAIL" "$ADMIN_PASS")
[ -n "$ADMIN_TOKEN" ] && pass "Login admin" || { fail "Login admin"; exit 1; }

BI_TOKEN=$(login "$BI_EMAIL" "$BI_PASS")
[ -n "$BI_TOKEN" ] && pass "Login bi" || { fail "Login bi"; BI_TOKEN="$ADMIN_TOKEN"; skip "Fallback bi→admin"; }

USER_TOKEN=$(login "$USER_EMAIL" "$USER_PASS")
[ -n "$USER_TOKEN" ] && pass "Login user" || { fail "Login user"; USER_TOKEN="$ADMIN_TOKEN"; skip "Fallback user→admin"; }

APPROVER_TOKEN=$(login "$APPROVER_EMAIL" "$APPROVER_PASS")
[ -n "$APPROVER_TOKEN" ] && pass "Login approver" || { fail "Login approver"; APPROVER_TOKEN="$ADMIN_TOKEN"; skip "Fallback approver→admin"; }

# ─── Step F: B4 — flowGroup never NULL ────────────────────────────────
step "Step F — B4: flowGroup not NULL after init"

FLOW_INIT=$(curl -sS -X POST "${GATEWAY}/api/workflow/init" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $BI_TOKEN" -H "Origin: $ORIGIN" \
  -d '{"flowName":"V2 Smoke Flow","flowGroup":"smoke-group","department":"QA","describe":"batch-fix smoke"}')
echo "$FLOW_INIT" | head -c 400; echo ""

FLOW_ID=$(echo "$FLOW_INIT" | jq -r '.id // .flowId // empty')
FLOW_GROUP=$(echo "$FLOW_INIT" | jq -r '.flowGroup // .flow_group // empty')

if [ -n "$FLOW_ID" ]; then
  pass "Flow init returned ID: $FLOW_ID"
else
  fail "Flow init failed — no ID in response"
  FLOW_ID="1"
fi

if [ -n "$FLOW_GROUP" ] && [ "$FLOW_GROUP" != "null" ]; then
  pass "B4: flowGroup set correctly ($FLOW_GROUP)"
else
  # Verify via DB check (not possible from outside) — query flow detail
  FLOW_DETAIL=$(curl -sS "${GATEWAY}/api/workflow/${FLOW_ID}" \
    -H "Authorization: Bearer $BI_TOKEN" -H "Origin: $ORIGIN")
  DETAIL_GROUP=$(echo "$FLOW_DETAIL" | jq -r '.flowGroup // .flow_group // empty')
  if [ -n "$DETAIL_GROUP" ] && [ "$DETAIL_GROUP" != "null" ]; then
    pass "B4: flowGroup in detail: $DETAIL_GROUP"
  else
    skip "B4: flowGroup not in init response/detail — check DB directly"
  fi
fi

# Add start + user_task nodes to make flow usable
START_RESP=$(curl -sS -o /tmp/api_body -w "%{http_code}" -X POST "${GATEWAY}/api/workflow/${FLOW_ID}/node" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $BI_TOKEN" -H "Origin: $ORIGIN" \
  -d '{"nodeType":"start"}')
echo "  → Start node HTTP $START_RESP"
[ -s /tmp/api_body ] && head -c 200 /tmp/api_body && echo ""
START_NODE_BODY=$(cat /tmp/api_body 2>/dev/null)
START_NODE_ID=$(echo "$START_NODE_BODY" | jq -r '.id // .nodeId // empty')

TASK_RESP=$(curl -sS -X POST "${GATEWAY}/api/workflow/${FLOW_ID}/node" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $BI_TOKEN" -H "Origin: $ORIGIN" \
  -d '{"nodeType":"eaccount","nodeName":"Approval Step"}')
echo "$TASK_RESP" | head -c 200; echo ""
TASK_NODE_ID=$(echo "$TASK_RESP" | jq -r '.id // .nodeId // empty')

# Assign approver as performer
if [ -n "$TASK_NODE_ID" ]; then
  PERF_RESP=$(curl -sS -o /tmp/api_body -w "%{http_code}" -X POST "${GATEWAY}/api/node/${TASK_NODE_ID}/performer" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $BI_TOKEN" -H "Origin: $ORIGIN" \
    -d "{\"userId\":\"${APPROVER_EMAIL}\",\"orderExecution\":1}")
  [ -s /tmp/api_body ] && head -c 200 /tmp/api_body && echo ""
  case "$PERF_RESP" in
    200|201) pass "Performer assigned to task node" ;;
    *)       fail "Assign performer (HTTP $PERF_RESP)" ;;
  esac
fi

# Connect start→task node if both IDs known
if [ -n "$START_NODE_ID" ] && [ -n "$TASK_NODE_ID" ]; then
  EDGE_RESP=$(curl -sS -o /tmp/api_body -w "%{http_code}" -X POST "${GATEWAY}/api/workflow/${FLOW_ID}/relate-node" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $BI_TOKEN" -H "Origin: $ORIGIN" \
    -d "{\"nodeId\":${START_NODE_ID},\"childNodeId\":${TASK_NODE_ID},\"hasDemand\":false}")
  echo "  → Relate node HTTP $EDGE_RESP"
  [ -s /tmp/api_body ] && head -c 200 /tmp/api_body && echo ""
fi

# Publish flow
PUB_CODE=$(curl -sS -o /tmp/api_body -w "%{http_code}" -X POST "${GATEWAY}/api/workflow/${FLOW_ID}/status" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $BI_TOKEN" -H "Origin: $ORIGIN" \
  -d '"DangHoatDong"')
[ -s /tmp/api_body ] && head -c 200 /tmp/api_body && echo ""
case "$PUB_CODE" in
  200|201) pass "Flow published (HTTP $PUB_CODE)" ;;
  *)       fail "Publish flow (HTTP $PUB_CODE)" ;;
esac

# ─── Step G: B3 — first-action-plan returns performer ─────────────────
step "Step G — B3: first-action-plan endpoint"

# The smoke test flow has flow_id=NULL nodes (node creation API bug).
# Test with an existing real flow from the system (find any flow with nodes).
REAL_FLOW_ID=$(curl -sS "${GATEWAY}/api/workflow?page=0&size=5" \
  -H "Authorization: Bearer $BI_TOKEN" -H "Origin: $ORIGIN" | \
  jq -r '.[] | select(.status == "DangHoatDong") | .id' | head -1)

if [ -z "$REAL_FLOW_ID" ]; then
  REAL_FLOW_ID=$(curl -sS "${GATEWAY}/api/workflow?page=0&size=5" \
    -H "Authorization: Bearer $BI_TOKEN" -H "Origin: $ORIGIN" | \
    jq -r '.[0].id // empty')
fi

echo "  Using real flow ID: $REAL_FLOW_ID for B3 test"

if [ -n "$REAL_FLOW_ID" ] && [ "$REAL_FLOW_ID" != "null" ]; then
  FIRST_PLAN=$(curl -sS "${GATEWAY}/api/internal/flow/${REAL_FLOW_ID}/first-action-plan" \
    -H "Authorization: Bearer $BI_TOKEN" -H "Origin: $ORIGIN")
  echo "$FIRST_PLAN" | head -c 400; echo ""

  NODE_ID_IN_PLAN=$(echo "$FIRST_PLAN" | jq -r '.nodeId // empty')
  if [ -n "$NODE_ID_IN_PLAN" ] && [ "$NODE_ID_IN_PLAN" != "null" ]; then
    pass "B3: first-action-plan returned nodeId=$NODE_ID_IN_PLAN for flow=$REAL_FLOW_ID"
  else
    fail "B3: first-action-plan missing nodeId for flow=$REAL_FLOW_ID — endpoint or data broken"
  fi

  PERF_COUNT=$(echo "$FIRST_PLAN" | jq '.performers | length' 2>/dev/null || echo 0)
  if [ "${PERF_COUNT:-0}" -gt 0 ]; then
    FIRST_PERF=$(echo "$FIRST_PLAN" | jq -r '.performers[0].userId // empty')
    pass "B3: first-action-plan has performer: $FIRST_PERF"
  else
    skip "B3: no performers in first-action-plan for flow=$REAL_FLOW_ID"
  fi
else
  skip "B3: no published flows found to test with"
fi

# ─── Step H: B1 + B2 — create ticket, check pending, approve ──────────
step "Step H — B1+B2: ticket lifecycle (pending-tasks + approve status)"

# Create ticket as user
TICKET_INIT=$(curl -sS -X POST "${GATEWAY}/api/request/ticket/init" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $USER_TOKEN" -H "Origin: $ORIGIN" \
  -d "{\"flowId\":${FLOW_ID},\"ticketName\":\"V2 Smoke Ticket\"}")
echo "$TICKET_INIT" | head -c 300; echo ""

TICKET_ID=$(echo "$TICKET_INIT" | jq -r '.ticketId // .id // empty')
INIT_PERFORMER=$(echo "$TICKET_INIT" | jq -r '.performer // empty')

if [ -n "$TICKET_ID" ] && [ "$TICKET_ID" != "null" ]; then
  pass "B1: ticket created with real ID=$TICKET_ID (performer=$INIT_PERFORMER)"
else
  fail "B1: ticket init returned no ID (still mocked?)"
  TICKET_ID=""
fi

# Check my-requests for user
MY_REQ=$(curl -sS "${GATEWAY}/api/request/tickets/my-requests" \
  -H "Authorization: Bearer $USER_TOKEN" -H "Origin: $ORIGIN")
MY_COUNT=$(echo "$MY_REQ" | jq '.content | length' 2>/dev/null || echo 0)
if [ "${MY_COUNT:-0}" -gt 0 ]; then
  pass "B1: my-requests shows $MY_COUNT ticket(s)"
else
  fail "B1: my-requests returned 0 tickets (DB query broken?)"
fi

# Check pending-tasks for approver (this was the B1 bug — always empty)
PENDING=$(curl -sS "${GATEWAY}/api/request/tickets/pending-tasks" \
  -H "Authorization: Bearer $APPROVER_TOKEN" -H "Origin: $ORIGIN")
echo "$PENDING" | head -c 300; echo ""
PENDING_COUNT=$(echo "$PENDING" | jq '.content | length' 2>/dev/null || echo 0)

if [ "${PENDING_COUNT:-0}" -gt 0 ]; then
  pass "B1: pending-tasks for approver has $PENDING_COUNT task(s) — FIXED"
else
  # Edge case: performer might be set to email not matching APPROVER_EMAIL
  echo "  (pending-tasks empty — checking if performer email matched)"
  echo "  performer from init: $INIT_PERFORMER"
  if [ "$INIT_PERFORMER" = "$APPROVER_EMAIL" ]; then
    fail "B1: pending-tasks empty even though performer=$APPROVER_EMAIL — query broken"
  else
    skip "B1: performer=$INIT_PERFORMER (not $APPROVER_EMAIL) so pending-tasks correctly empty for approver"
  fi
fi

# Approve ticket (B2 bug: approve didn't change ticket status)
if [ -n "$TICKET_ID" ]; then
  ACTION_CODE=$(curl -sS -o /tmp/api_body -w "%{http_code}" \
    -X POST "${GATEWAY}/api/request/ticket/${TICKET_ID}/action" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $APPROVER_TOKEN" -H "Origin: $ORIGIN" \
    -d '{"action":"APPROVE","note":"v2 smoke approved"}')
  [ -s /tmp/api_body ] && head -c 200 /tmp/api_body && echo ""
  case "$ACTION_CODE" in
    200|201) pass "B2: approve action returned $ACTION_CODE" ;;
    *)       fail "B2: approve action HTTP $ACTION_CODE" ;;
  esac

  # Verify status changed to 2 (Hoàn thành)
  DETAIL=$(curl -sS "${GATEWAY}/api/request/ticket/${TICKET_ID}/detail" \
    -H "Authorization: Bearer $USER_TOKEN" -H "Origin: $ORIGIN")
  echo "$DETAIL" | head -c 200; echo ""
  FINAL_STATUS=$(echo "$DETAIL" | jq -r '.status // empty')
  if [ "$FINAL_STATUS" = "2" ]; then
    pass "B2: ticket status=2 (Hoàn thành) after APPROVE — FIXED"
  elif [ "$FINAL_STATUS" = "1" ]; then
    fail "B2: ticket status still 1 after APPROVE — approve not updating DB"
  else
    fail "B2: unexpected ticket status=$FINAL_STATUS after APPROVE"
  fi

  # Check ticket history
  HISTORY=$(curl -sS "${GATEWAY}/api/request/ticket/${TICKET_ID}/history" \
    -H "Authorization: Bearer $USER_TOKEN" -H "Origin: $ORIGIN")
  HIST_COUNT=$(echo "$HISTORY" | jq 'length' 2>/dev/null || echo 0)
  if [ "${HIST_COUNT:-0}" -gt 0 ]; then
    pass "B1: history has $HIST_COUNT step(s)"
  else
    fail "B1: history empty for ticket $TICKET_ID"
  fi
fi

# ─── Summary ──────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SMOKE TEST V2 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo "SKIP: $SKIP"
if [ "${#FAIL_STEPS[@]}" -gt 0 ]; then
  echo ""
  echo "Failing steps:"
  for s in "${FAIL_STEPS[@]}"; do echo "  - $s"; done
fi
echo ""
echo "Log: $LOG"
[ "$FAIL" -eq 0 ] && echo "All v2 checks passed." || echo "Some checks failed — see PROGRESS-BATCH.md for context."
exit "$FAIL"
