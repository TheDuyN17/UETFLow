import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Panel,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AppHeader from "../components/AppHeader";
import IconSidebar from "../components/IconSidebar";
import { eRequest, eFlow } from "../services/api";
import { showToast } from "../utils/toast";
import { getAuth } from "../utils/auth";
import {
  Home,
  User,
  Users,
  Settings,
  RefreshCw,
  FileText,
  GitBranch,
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
  Minus,
  Plus,
  Maximize2,
  Loader2,
  Trash2,
} from "lucide-react";

// ─── React Flow custom nodes ──────────────────────────────────────────────────

function StartNode() {
  return (
    <>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#16a34a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 11,
          fontWeight: 700,
          boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
        }}
      >
        Start
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#16a34a", width: 8, height: 8 }}
      />
    </>
  );
}

function EndNode() {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#1f2937", width: 8, height: 8 }}
      />
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 11,
          fontWeight: 700,
          boxShadow: "0 2px 8px rgba(31,41,55,0.3)",
        }}
      >
        End
      </div>
    </>
  );
}

function StepNode({ data }) {
  const { label, status } = data;
  const isCompleted  = status === "completed";
  const isInProgress = status === "inProgress";

  const theme = isCompleted
    ? { bg: "#f0fdf4", border: "#16a34a", text: "#15803d", badgeBg: "#dcfce7", badgeText: "#16a34a" }
    : isInProgress
    ? { bg: "#faf5ff", border: "#7c3aed", text: "#6d28d9", badgeBg: "#ede9fe", badgeText: "#7c3aed" }
    : { bg: "#f8fafc", border: "#c4b5fd", text: "#6b7280", badgeBg: "#f3f4f6", badgeText: "#9ca3af" };

  const statusLabel = isCompleted ? "Đã duyệt" : isInProgress ? "Đang thực hiện" : "Chưa thực hiện";

  const IconComp = isCompleted ? CheckCircle2 : isInProgress ? Clock : Circle;
  const iconColor = isCompleted ? "#16a34a" : isInProgress ? "#7c3aed" : "#d1d5db";

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: theme.border, width: 8, height: 8 }}
      />
      <div
        style={{
          background: theme.bg,
          border: `2px solid ${theme.border}`,
          borderRadius: 10,
          padding: "10px 12px",
          width: 175,
          fontFamily: "'Inter','Segoe UI',sans-serif",
          boxShadow: isInProgress ? `0 0 0 3px ${theme.border}22` : "none",
        }}
      >
        {/* Status row */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
          <IconComp size={13} color={iconColor} strokeWidth={2.5} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              background: theme.badgeBg,
              color: theme.badgeText,
              padding: "1px 8px",
              borderRadius: 99,
            }}
          >
            {statusLabel}
          </span>
        </div>
        {/* Label */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: theme.text,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {label}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: theme.border, width: 8, height: 8 }}
      />
    </>
  );
}

const nodeTypes = {
  startNode: StartNode,
  endNode:   EndNode,
  stepNode:  StepNode,
};

// ─── Node / edge data ─────────────────────────────────────────────────────────

const Y_CIRCLE = 84;
const Y_STEP   = 44;
const STEP_W   = 199; // node width + gap

const initialNodes = [
  { id: "start", type: "startNode", position: { x: 0,             y: Y_CIRCLE }, data: {} },
  { id: "s1",    type: "stepNode",  position: { x: 80,            y: Y_STEP   }, data: { label: "1. Xem sáng kiến chờ tiếp nhận", status: "completed"  } },
  { id: "s2",    type: "stepNode",  position: { x: 80 + STEP_W,   y: Y_STEP   }, data: { label: "2. Cập nhật thẻ cải tiến",       status: "completed"  } },
  { id: "s3",    type: "stepNode",  position: { x: 80 + STEP_W*2, y: Y_STEP   }, data: { label: "3. Đánh giá sáng kiến",           status: "completed"  } },
  { id: "s4",    type: "stepNode",  position: { x: 80 + STEP_W*3, y: Y_STEP   }, data: { label: "4. Phê duyệt sáng kiến",          status: "completed"  } },
  { id: "s5",    type: "stepNode",  position: { x: 80 + STEP_W*4, y: Y_STEP   }, data: { label: "5. Triển khai & Lập phiếu nghiệm thu", status: "inProgress" } },
  { id: "s6",    type: "stepNode",  position: { x: 80 + STEP_W*5, y: Y_STEP   }, data: { label: "6. Đánh giá/Chấm điểm",          status: "notStarted" } },
  { id: "s7",    type: "stepNode",  position: { x: 80 + STEP_W*6, y: Y_STEP   }, data: { label: "7. Rà soát & xác nhận",           status: "notStarted" } },
  { id: "s8",    type: "stepNode",  position: { x: 80 + STEP_W*7, y: Y_STEP   }, data: { label: "8. Cập nhật lại thông tin",       status: "notStarted" } },
  { id: "end",   type: "endNode",   position: { x: 80 + STEP_W*8, y: Y_CIRCLE }, data: {} },
];

const edgeOpts = {
  type: "smoothstep",
  style: { stroke: "#3b82f6", strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6", width: 16, height: 16 },
  animated: false,
};

const initialEdges = [
  { id: "e0",  source: "start", target: "s1", ...edgeOpts },
  { id: "e1",  source: "s1",    target: "s2", ...edgeOpts },
  { id: "e2",  source: "s2",    target: "s3", ...edgeOpts },
  { id: "e3",  source: "s3",    target: "s4", ...edgeOpts },
  { id: "e4",  source: "s4",    target: "s5", ...edgeOpts },
  { id: "e5",  source: "s5",    target: "s6", ...edgeOpts },
  { id: "e6",  source: "s6",    target: "s7", ...edgeOpts },
  { id: "e7",  source: "s7",    target: "s8", ...edgeOpts },
  { id: "e8",  source: "s8",    target: "end",...edgeOpts },
];

// ─── Zoom controls (must live inside ReactFlowProvider) ───────────────────────

function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  return (
    <Panel position="bottom-right">
      <div
        className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-md px-2 py-1.5"
        style={{ fontFamily: "'Inter',sans-serif" }}
      >
        <button
          onClick={() => zoomOut({ duration: 200 })}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-600"
          title="Thu nhỏ"
        >
          <Minus size={13} />
        </button>
        <span className="text-xs font-semibold text-gray-600 w-10 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => zoomIn({ duration: 200 })}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-600"
          title="Phóng to"
        >
          <Plus size={13} />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button
          onClick={() => fitView({ duration: 300, padding: 0.15 })}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-600"
          title="Vừa màn hình"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    </Panel>
  );
}

// ─── Workflow diagram ─────────────────────────────────────────────────────────

const TYPE_MAP = {
  start: "startNode",
  end: "endNode",
  eaccount: "stepNode",
  user_task: "stepNode",
  approval: "stepNode",
};

function buildReactFlowNodes(backendNodes, historySteps, currentNodeId) {
  if (!backendNodes || backendNodes.length === 0) return initialNodes;
  const completedIds = new Set((historySteps ?? []).filter(s => s.status === 1).map(s => s.nodeId));
  const X_START = 40; const Y = 84; const STEP_Y = 44; const GAP = 220;
  let xPos = X_START;
  return backendNodes.map((n, i) => {
    const type = TYPE_MAP[n.nodeType?.toLowerCase()] ?? "stepNode";
    const isStart = type === "startNode"; const isEnd = type === "endNode";
    const status = completedIds.has(n.id) ? "completed"
      : n.id === currentNodeId ? "inProgress" : "notStarted";
    const pos = { x: xPos, y: (isStart || isEnd) ? Y : STEP_Y };
    xPos += GAP;
    return {
      id: `n-${n.id}`,
      type,
      position: pos,
      data: { label: n.nodeType ?? `Bước ${i + 1}`, status },
    };
  });
}

function buildReactFlowEdges(backendEdges) {
  if (!backendEdges || backendEdges.length === 0) return initialEdges;
  return backendEdges.map(e => ({
    id: `e-${e.id}`,
    source: `n-${e.node?.id ?? e.nodeId}`,
    target: `n-${e.childNodeId}`,
    ...edgeOpts,
  }));
}

function WorkflowDiagram({ definition, history, currentNodeId }) {
  const rfNodes = definition?.nodes?.length > 0
    ? buildReactFlowNodes(definition.nodes, history, currentNodeId)
    : initialNodes;
  const rfEdges = definition?.edges?.length > 0
    ? buildReactFlowEdges(definition.edges)
    : (definition?.nodes?.length > 0 ? [] : initialEdges);

  const [nodes, , onNodesChange] = useNodesState(rfNodes);
  const [edges, , onEdgesChange] = useEdgesState(rfEdges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      defaultViewport={{ x: 40, y: 60, zoom: 0.6 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag
      zoomOnScroll
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e5e7eb" gap={20} size={1} />
      <ZoomControls />
    </ReactFlow>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: "overview",   label: "Tổng quan" },
  { key: "history",    label: "Lịch sử giao dịch" },
  { key: "comment",    label: "Bình luận" },
  { key: "related",    label: "Giao dịch liên quan" },
  { key: "sla",        label: "Thông tin SLA" },
  { key: "documents",  label: "Form và tài liệu" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

const fmt = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
};

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [activeTab,    setActiveTab]    = useState("overview");
  const [ticket,       setTicket]       = useState(null);
  const [history,      setHistory]      = useState([]);
  const [sla,          setSla]          = useState(null);
  const [related,      setRelated]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [actioning,    setActioning]    = useState(false);
  const [commentText,  setCommentText]  = useState("");
  const [commenting,   setCommenting]   = useState(false);
  const [stepConfig,   setStepConfig]   = useState(null);
  const [flowDef,      setFlowDef]      = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.allSettled([
      eRequest.getTicketDetail(id),
      eRequest.getHistory(id),
      eRequest.getSLA(id),
      eRequest.getRelated(id),
      eRequest.getStepConfig(id),
    ]).then(([t, h, s, r, sc]) => {
      if (t.status === "fulfilled") setTicket(t.value);
      if (h.status === "fulfilled") setHistory(Array.isArray(h.value) ? h.value : []);
      if (s.status === "fulfilled") setSla(s.value);
      if (r.status === "fulfilled") setRelated(Array.isArray(r.value) ? r.value : []);
      if (sc.status === "fulfilled") setStepConfig(sc.value);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!ticket?.flowId) return;
    eFlow.getDefinition(ticket.flowId)
      .then(def => setFlowDef(def))
      .catch(() => {});
  }, [ticket?.flowId]);

  return (
    <div
      className="min-h-screen bg-[#f2f5f8] flex flex-col"
      style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}
    >
      {/* ── HEADER ── */}
      <AppHeader service="erequest" />

      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR ── */}
        <IconSidebar items={[
          { key: "home",     Icon: Home,      title: "Trang chủ",  onClick: () => navigate("/erequest"), active: false },
          { key: "user",     Icon: User,      title: "Cá nhân",    onClick: () => navigate("/eaccount/profile"), active: false },
          { key: "users",    Icon: Users,     title: "Tài khoản",  onClick: () => navigate("/eaccount"), active: false },
          { key: "settings", Icon: Settings,  title: "Cài đặt",    onClick: () => {}, active: false },
          { key: "sync",     Icon: RefreshCw, title: "Đồng bộ",   onClick: () => {}, active: false },
        ]} />

        {/* ── CONTENT ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sub-sidebar */}
          <div className="bg-white border-r border-gray-200 overflow-y-auto shrink-0" style={{ width: 250 }}>
            <div className="px-4 pt-5 pb-3">
              <p className="text-sm font-bold text-gray-800 leading-snug">Quản lý giao dịch cần xử lý</p>
            </div>
            <nav className="px-2 pb-4">
              <button onClick={() => navigate("/erequest")} className="w-full text-left text-sm px-3 py-2 rounded-lg font-medium text-purple-700 bg-purple-50 transition-colors">
                Giao dịch cần xử lý
              </button>
            </nav>
          </div>

          {/* Detail */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#f2f5f8]">
            {loading ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-gray-400">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm">Đang tải giao dịch...</span>
              </div>
            ) : (
              <>
                {/* Header area */}
                <div className="bg-white border-b border-gray-100 px-6 pt-5 pb-0 shrink-0">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                    <button onClick={() => navigate("/erequest")} className="hover:text-purple-600 transition-colors">
                      Giao dịch cần xử lý
                    </button>
                    <ChevronRight size={12} />
                    <span className="text-gray-600 font-medium">{ticket?.ticketTitle ?? ticket?.title ?? id}</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{ticket?.ticketTitle ?? ticket?.title ?? "Chi tiết giao dịch"}</h1>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 mb-5">
                    <button
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                          await eRequest.submitTicket(id, { ticketId: Number(id), formData: {}, version: ticket?.version ?? 0 });
                          showToast("Đã gửi giao dịch thành công", "success");
                          const updated = await eRequest.getTicketDetail(id);
                          if (updated) setTicket(updated);
                        } catch (e) {
                          showToast(e.message || "Gửi thất bại", "error");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      disabled={submitting}
                      className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                      style={{ backgroundColor: submitting ? "#a855f7" : "#7c3aed" }}
                    >
                      {submitting ? "Đang gửi..." : "Gửi"}
                    </button>
                    <button
                      onClick={async () => {
                        setActioning(true);
                        try {
                          const note = window.prompt("Ghi chú (tuỳ chọn):") ?? "";
                          await eRequest.actionTicket(id, { action: "APPROVE", note });
                          showToast("Đã phê duyệt thành công", "success");
                          const updated = await eRequest.getTicketDetail(id);
                          if (updated) setTicket(updated);
                        } catch (e) {
                          showToast(e.message || "Phê duyệt thất bại", "error");
                        } finally {
                          setActioning(false);
                        }
                      }}
                      disabled={actioning}
                      className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                      style={{ backgroundColor: actioning ? "#15803d" : "#16a34a" }}
                    >
                      {actioning ? "Đang xử lý..." : "Phê duyệt"}
                    </button>
                    <button
                      onClick={async () => {
                        const note = window.prompt("Lý do từ chối (bắt buộc):");
                        if (!note?.trim()) return;
                        setActioning(true);
                        try {
                          await eRequest.actionTicket(id, { action: "REJECT", note: note.trim() });
                          showToast("Đã từ chối", "success");
                          const updated = await eRequest.getTicketDetail(id);
                          if (updated) setTicket(updated);
                        } catch (e) {
                          showToast(e.message || "Từ chối thất bại", "error");
                        } finally {
                          setActioning(false);
                        }
                      }}
                      disabled={actioning}
                      className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                      style={{ backgroundColor: actioning ? "#b91c1c" : "#dc2626" }}
                    >
                      Từ chối
                    </button>
                  </div>

                  {/* Info row */}
                  <div className="grid grid-cols-5 gap-4 mb-5">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Người tạo</p>
                      <p className="text-sm text-gray-700 truncate">{ticket?.creatorName ?? ticket?.creator ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</p>
                      <p className="text-sm text-gray-700 truncate">{ticket?.creatorEmail ?? ticket?.email ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Quy trình</p>
                      <p className="text-sm text-gray-700 truncate">{ticket?.workflowName ?? ticket?.workflow ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Ngày tạo</p>
                      <p className="text-sm text-gray-700">{fmt(ticket?.createdAt ?? ticket?.createdDate)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Trạng thái</p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ color: "#2563eb", borderColor: "#93c5fd", backgroundColor: "#eff6ff" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                        {ticket?.status ?? "Đang thực hiện"}
                      </span>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-end -mx-6 px-6 border-b border-gray-200">
                    {TABS.map((tab) => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.key ? "text-purple-700" : "text-gray-500 hover:text-gray-700"}`}
                      >
                        {tab.label}
                        {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ backgroundColor: "#7c3aed" }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-auto">
                  {activeTab === "overview" && (
                    <div className="p-5 h-full flex flex-col" style={{ minHeight: 0 }}>
                      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white" style={{ minHeight: 420 }}>
                        <ReactFlowProvider>
                          <WorkflowDiagram
                            definition={flowDef}
                            history={history}
                            currentNodeId={ticket?.currentNodeId}
                          />
                        </ReactFlowProvider>
                      </div>
                    </div>
                  )}

                  {activeTab === "history" && (
                    <div className="p-5">
                      {history.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-gray-400"><p className="text-sm">Chưa có dữ liệu lịch sử giao dịch</p></div>
                      ) : (
                        <div className="space-y-3">
                          {history.map((h, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-gray-800">{h.action ?? h.stepName ?? `Bước ${i + 1}`}</span>
                                <span className="text-xs text-gray-400">{fmt(h.createdAt ?? h.timestamp)}</span>
                              </div>
                              <p className="text-xs text-gray-500">{h.performerName ?? h.actor ?? "—"} · {h.comment ?? ""}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "related" && (
                    <div className="p-5">
                      {related.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-gray-400"><p className="text-sm">Không có giao dịch liên quan</p></div>
                      ) : (
                        <div className="space-y-3">
                          {related.map((r, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/erequest/transaction/${r.ticketId ?? r.id}`)}>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{r.ticketTitle ?? r.title ?? "Giao dịch " + (i + 1)}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{fmt(r.createdAt)}</p>
                              </div>
                              <ChevronRight size={16} className="text-gray-400 shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "sla" && (
                    <div className="p-5">
                      {!sla ? (
                        <div className="flex flex-col items-center py-16 text-gray-400"><p className="text-sm">Chưa có thông tin SLA</p></div>
                      ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                            <p className="text-sm font-bold text-gray-700">Thông tin SLA</p>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {Object.entries(sla).map(([k, v]) => (
                              <div key={k} className="flex items-center px-5 py-3 text-sm">
                                <span className="w-44 text-gray-500 shrink-0">{k}</span>
                                <span className="font-medium text-gray-800">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "comment" && (() => {
                    const { user } = getAuth();
                    const comments = ticket?.ticketComments ?? ticket?.comments ?? [];
                    return (
                      <div className="p-4 space-y-4">
                        {/* Existing comments */}
                        {comments.length > 0 && (
                          <div className="space-y-3">
                            {comments.map((c, i) => (
                              <div key={c.id ?? i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-gray-700">{c.creatorEmail ?? c.email ?? "—"}</span>
                                    <span className="text-xs text-gray-400">{fmt(c.createdAt ?? c.createdDate)}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.content ?? c.comment ?? c.text ?? ""}</p>
                                </div>
                                {c.id && (c.creatorEmail ?? c.email) === user?.email && (
                                  <button
                                    title="Xóa bình luận"
                                    onClick={async () => {
                                      try {
                                        await eRequest.deleteComment(c.id);
                                        setTicket(prev => {
                                          const filter = arr => Array.isArray(arr) ? arr.filter(x => x.id !== c.id) : arr;
                                          return { ...prev, ticketComments: filter(prev.ticketComments), comments: filter(prev.comments) };
                                        });
                                        showToast("Đã xóa bình luận", "success");
                                      } catch (err) {
                                        showToast(err.message || "Xóa thất bại", "error");
                                      }
                                    }}
                                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Add comment */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700">Thêm bình luận</p>
                          <textarea
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                            rows={4}
                            placeholder="Nhập nội dung bình luận..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                          />
                          <button
                            onClick={async () => {
                              if (!commentText.trim()) return;
                              setCommenting(true);
                              try {
                                const newComment = await eRequest.commentTicket(id, { content: commentText.trim() });
                                showToast("Đã gửi bình luận", "success");
                                setCommentText("");
                                if (newComment?.id) {
                                  setTicket(prev => ({
                                    ...prev,
                                    ticketComments: [...(prev.ticketComments ?? []), newComment],
                                    comments: [...(prev.comments ?? []), newComment],
                                  }));
                                }
                              } catch (err) {
                                showToast(err.message || "Gửi thất bại", "error");
                              } finally {
                                setCommenting(false);
                              }
                            }}
                            disabled={commenting || !commentText.trim()}
                            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60"
                            style={{ backgroundColor: "#7c3aed" }}
                          >
                            {commenting ? "Đang gửi..." : "Gửi bình luận"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {activeTab === "documents" && (
                    <div className="p-5">
                      {!stepConfig ? (
                        <div className="flex flex-col items-center py-16 text-gray-400">
                          <FileText size={32} className="mb-2 opacity-30" />
                          <p className="text-sm">Chưa có cấu hình form cho bước này</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Step info */}
                          {(stepConfig.nodeName ?? stepConfig.stepName ?? stepConfig.name) && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bước hiện tại</p>
                              <p className="text-sm font-bold text-gray-800">{stepConfig.nodeName ?? stepConfig.stepName ?? stepConfig.name}</p>
                              {stepConfig.nodeType && (
                                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">{stepConfig.nodeType}</span>
                              )}
                            </div>
                          )}

                          {/* Performers */}
                          {Array.isArray(stepConfig.performers) && stepConfig.performers.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                                <p className="text-sm font-bold text-gray-700">Người thực hiện</p>
                              </div>
                              <div className="divide-y divide-gray-50">
                                {stepConfig.performers.map((p, i) => (
                                  <div key={i} className="px-5 py-3 flex items-center gap-3 text-sm">
                                    <User size={14} className="text-gray-400 shrink-0" />
                                    <span className="text-gray-700">{p.userId ?? p.email ?? p.name ?? String(p)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Form fields / raw config */}
                          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                              <p className="text-sm font-bold text-gray-700">Cấu hình bước</p>
                            </div>
                            <div className="divide-y divide-gray-50">
                              {Object.entries(stepConfig)
                                .filter(([k]) => !["performers","nodeName","stepName","name","nodeType"].includes(k))
                                .map(([k, v]) => (
                                <div key={k} className="flex items-center px-5 py-3 text-sm">
                                  <span className="w-44 text-gray-400 shrink-0 font-medium">{k}</span>
                                  <span className="text-gray-700 break-all">{typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
