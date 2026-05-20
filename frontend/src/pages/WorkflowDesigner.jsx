import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { eFlow } from "../services/api";
import { clearAuth } from "../utils/auth";
import { showToast } from "../utils/toast";
import {
  GitBranch,
  Search,
  ArrowLeftRight,
  LogOut,
  Save,
  ChevronRight,
  ChevronLeft,
  Scissors,
  Copy,
  Undo2,
  Redo2,
  Hand,
  ShieldCheck,
  Bot,
  Minus,
  Plus,
  Settings,
  Grid3X3,
  X,
  User,
  FileText,
  Loader2,
} from "lucide-react";

// ─── BPMN SVG icons ───────────────────────────────────────────────────────────

const IconStart = () => (
  <svg width="26" height="26" viewBox="0 0 26 26">
    <circle cx="13" cy="13" r="10" fill="#fef2f2" stroke="#dc2626" strokeWidth="1.5" />
  </svg>
);

const IconEnd = () => (
  <svg width="26" height="26" viewBox="0 0 26 26">
    <circle cx="13" cy="13" r="10" fill="#faf5ff" stroke="#7c3aed" strokeWidth="3" />
  </svg>
);

const IconEForm = () => (
  <svg width="26" height="26" viewBox="0 0 26 26">
    <rect x="3" y="2" width="16" height="22" rx="2" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.8" />
    <path d="M21 6l2 2-8 8-3 1 1-3 8-8z" fill="none" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 9h8M7 13h6M7 17h4" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const IconAIAgent = () => (
  <svg width="26" height="26" viewBox="0 0 26 26">
    <rect x="2" y="4" width="22" height="18" rx="3" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.8" />
    <rect x="8" y="8" width="10" height="8" rx="2" fill="none" stroke="#2563eb" strokeWidth="1.2" />
    <circle cx="10.5" cy="12" r="1" fill="#2563eb" />
    <circle cx="15.5" cy="12" r="1" fill="#2563eb" />
    <path d="M11 16.5h4" stroke="#2563eb" strokeWidth="1" strokeLinecap="round" />
    <line x1="13" y1="8" x2="13" y2="6" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
    <text x="13" y="21.5" textAnchor="middle" fontSize="4" fontWeight="800" fill="#2563eb" fontFamily="Inter,sans-serif">AI</text>
  </svg>
);

const IconBranch = () => (
  <svg width="26" height="26" viewBox="0 0 26 26">
    <polygon points="13,2 24,13 13,24 2,13" fill="#fdf4ff" stroke="#7c3aed" strokeWidth="1.5" />
    <path d="M9 9l8 8M17 9l-8 8" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconParallel = () => (
  <svg width="26" height="26" viewBox="0 0 26 26">
    <polygon points="13,2 24,13 13,24 2,13" fill="#fdf4ff" stroke="#7c3aed" strokeWidth="1.5" />
    <path d="M13 7v12M7 13h12" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconNote = () => (
  <svg width="26" height="26" viewBox="0 0 26 26">
    <path d="M5 4h12l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
    <path d="M17 4v4h4" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
    <path d="M8 12h10M8 15.5h8M8 19h5" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// ─── Block palette grouped data ───────────────────────────────────────────────

const BLOCK_GROUPS = [
  {
    label: "Sự kiện", accentColor: "#f97316",
    blocks: [
      { type: "start", label: "Bắt đầu",  title: "Bắt đầu sự kiện quy trình",  Icon: IconStart },
      { type: "end",   label: "Kết thúc", title: "Sự kiện kết thúc quy trình", Icon: IconEnd },
    ],
  },
  {
    label: "Hoạt động", accentColor: "#2563eb",
    blocks: [
      { type: "eaccount", label: "eForm",    title: "Bước điền / phê duyệt form",  Icon: IconEForm },
      { type: "aiagent",  label: "AI Agent",  title: "Tác vụ xử lý bởi AI",       Icon: IconAIAgent },
    ],
  },
  {
    label: "Cổng", accentColor: "#7c3aed",
    blocks: [
      { type: "branch",   label: "Rẽ nhánh (Hoặc)", title: "Rẽ nhánh chọn một luồng chạy", Icon: IconBranch },
      { type: "parallel", label: "Đồng thời",        title: "Các luồng chạy song song",     Icon: IconParallel },
    ],
  },
  {
    label: "Khác", accentColor: "#94a3b8",
    blocks: [
      { type: "note", label: "Ghi chú", title: "Thêm ghi chú vào quy trình", Icon: IconNote },
    ],
  },
];

// ─── Node theme for canvas ────────────────────────────────────────────────────

const NODE_THEME = {
  start:    { render: "circle",  bg: "#fef2f2", stroke: "#dc2626", strokeW: 1.5, label: "#dc2626" },
  end:      { render: "circle",  bg: "#faf5ff", stroke: "#7c3aed", strokeW: 3,   label: "#7c3aed" },
  eaccount: { render: "rect",    bg: "#eff6ff", stroke: "#2563eb", strokeW: 2,   label: "#1d4ed8" },
  aiagent:  { render: "rect",    bg: "#eff6ff", stroke: "#2563eb", strokeW: 2,   label: "#1d4ed8" },
  branch:   { render: "diamond", bg: "#fdf4ff", stroke: "#7c3aed", strokeW: 1.5, label: "#6d28d9" },
  parallel: { render: "diamond", bg: "#fdf4ff", stroke: "#7c3aed", strokeW: 1.5, label: "#6d28d9" },
  note:     { render: "rect",    bg: "#f8fafc", stroke: "#94a3b8", strokeW: 1.5, label: "#475569" },
};

// ─── Node size helper ─────────────────────────────────────────────────────────

function getNodeSize(type) {
  const render = NODE_THEME[type]?.render;
  if (render === "circle")  return { w: 56, h: 56 };
  if (render === "diamond") return { w: 52, h: 52 };
  return { w: 140, h: 36 };
}

// All 4 connection ports of a node in world coordinates
function getNodePorts(node) {
  if (!node) return {};
  const { w, h } = getNodeSize(node.type);
  return {
    right:  { x: node.x + w,     y: node.y + h / 2 },
    left:   { x: node.x,         y: node.y + h / 2 },
    top:    { x: node.x + w / 2, y: node.y          },
    bottom: { x: node.x + w / 2, y: node.y + h      },
  };
}

// Find the pair of ports (one from each node) with the smallest distance
function nearestPortPair(fromNode, toNode, fixedFromSide) {
  const fromPorts = getNodePorts(fromNode);
  const toPorts   = getNodePorts(toNode);
  let best = { fromSide: fixedFromSide ?? "right", toSide: "left", dist: Infinity };
  const fromEntries = fixedFromSide
    ? [[fixedFromSide, fromPorts[fixedFromSide]]]
    : Object.entries(fromPorts);
  for (const [fSide, fPt] of fromEntries) {
    for (const [tSide, tPt] of Object.entries(toPorts)) {
      const dist = Math.hypot(tPt.x - fPt.x, tPt.y - fPt.y);
      if (dist < best.dist) best = { fromSide: fSide, toSide: tSide, dist };
    }
  }
  return best;
}

// CSS position config for each side's dot (relative to node container)
const DOT_CONFIGS = [
  { side: "right",  pos: { right: 0,    top: "50%",  transform: "translate(50%, -50%)"  } },
  { side: "left",   pos: { left: 0,     top: "50%",  transform: "translate(-50%, -50%)" } },
  { side: "top",    pos: { left: "50%", top: 0,      transform: "translate(-50%, -50%)" } },
  { side: "bottom", pos: { left: "50%", bottom: 0,   transform: "translate(-50%, 50%)"  } },
];

// ─── Canvas node component ────────────────────────────────────────────────────

function CanvasNode({ node, onMouseDown, selected, onClick, onConnectStart, isConnecting }) {
  const [hovered, setHovered] = useState(false);
  const t = NODE_THEME[node.type] ?? NODE_THEME.eaccount;

  const base = {
    position: "absolute",
    left: node.x,
    top:  node.y,
    cursor: "grab",
    userSelect: "none",
    fontFamily: "'Inter',sans-serif",
    overflow: "visible",
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    onMouseDown(e, node.id);
  };

  const ring = selected ? "0 0 0 2px #2563eb" : "0 2px 6px rgba(0,0,0,0.12)";

  // 4 connection dots — always in DOM, visibility via CSS (avoids mouseleave race condition)
  const showDots = hovered && !isConnecting;
  const connectDots = DOT_CONFIGS.map(({ side, pos }) => (
    <div
      key={side}
      onMouseEnter={() => setHovered(true)}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onConnectStart(e, node, side);
      }}
      title="Kéo để nối"
      style={{
        position: "absolute",
        ...pos,
        width: 10, height: 10,
        borderRadius: "50%",
        border: "2px solid #2563eb",
        background: "white",
        cursor: "crosshair",
        zIndex: 20,
        opacity: showDots ? 1 : 0,
        pointerEvents: showDots ? "all" : "none",
        transition: "opacity 0.12s",
      }}
    />
  ));

  if (t.render === "circle") {
    return (
      <div
        onMouseDown={handleMouseDown}
        onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...base,
          width: 56, height: 56, borderRadius: "50%",
          background: t.bg,
          border: `${t.strokeW * 1.2}px solid ${t.stroke}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, color: t.label,
          boxShadow: ring,
        }}
      >
        {node.label}
        {connectDots}
      </div>
    );
  }

  if (t.render === "diamond") {
    return (
      <div
        onMouseDown={handleMouseDown}
        onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...base,
          width: 52, height: 52,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <div style={{
          width: 46, height: 46,
          background: t.bg,
          border: `${t.strokeW}px solid ${t.stroke}`,
          transform: "rotate(45deg)",
          boxShadow: ring,
        }} />
        <div style={{
          position: "absolute", color: t.label,
          fontSize: 16, fontWeight: 900, pointerEvents: "none",
        }}>
          {node.type === "parallel" ? "+" : "×"}
        </div>
        {connectDots}
      </div>
    );
  }

  // rect
  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...base,
        padding: "9px 14px",
        background: t.bg,
        border: `${t.strokeW}px solid ${t.stroke}`,
        borderRadius: 8,
        width: 140,
        fontSize: 12, fontWeight: 700, color: t.label,
        whiteSpace: "nowrap",
        boxShadow: ring,
      }}
    >
      {node.label}
      {connectDots}
    </div>
  );
}

// ─── Node config right panel ─────────────────────────────────────────────────

function NodeConfigPanel({ node, onClose }) {
  const [tab, setTab]               = useState("performers");
  const [performers, setPerformers] = useState([]);
  const [forms, setForms]           = useState([]);
  const [userQuery, setUserQuery]   = useState("");
  const [userResults, setUserResults] = useState([]);
  const [loadingPerf, setLoadingPerf]   = useState(false);
  const [adding, setAdding]             = useState(false);

  // form tab state
  const [sourceFormId, setSourceFormId] = useState("");
  const [targetFormId, setTargetFormId] = useState("");
  const [sourceVars, setSourceVars]     = useState([]);
  const [targetVars, setTargetVars]     = useState([]);
  const [varMapping, setVarMapping]     = useState({});
  const [savingForm, setSavingForm]     = useState(false);

  useEffect(() => {
    if (!node?.backendId) return;
    setLoadingPerf(true);
    eFlow.getPerformers(node.backendId)
      .then(d => setPerformers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingPerf(false));
    eFlow.proxyPublishedForms()
      .then(d => setForms(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [node?.backendId]);

  // extract variables from a form object
  const extractVars = (form) => {
    if (!form) return [];
    const raw = form.variableArr ?? form.variables ?? [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw) ?? []; } catch { return []; }
  };

  const handleSourceFormChange = (fid) => {
    setSourceFormId(fid);
    setVarMapping({});
    const form = forms.find(f => String(f.formId ?? f.id) === String(fid));
    setSourceVars(extractVars(form));
  };

  const handleTargetFormChange = (fid) => {
    setTargetFormId(fid);
    setVarMapping({});
    const form = forms.find(f => String(f.formId ?? f.id) === String(fid));
    setTargetVars(extractVars(form));
  };

  const handleSearch = async () => {
    if (!userQuery.trim()) return;
    try {
      const d = await eFlow.proxyUsers(userQuery.trim());
      setUserResults(Array.isArray(d) ? d : []);
    } catch { setUserResults([]); }
  };

  const handleAddPerformer = async (userId) => {
    setAdding(true);
    try {
      const p = await eFlow.addPerformer(node.backendId, {
        userId, orderExecution: performers.length + 1,
        node: { id: node.backendId },
      });
      setPerformers(prev => [...prev, p]);
      setUserResults([]);
      setUserQuery("");
      showToast("Đã thêm người thực hiện", "success");
    } catch (err) {
      showToast(err.message || "Thêm thất bại", "error");
    } finally { setAdding(false); }
  };

  const handleDeletePerformer = async (performerId) => {
    try {
      await eFlow.deletePerformer(performerId);
      setPerformers(prev => prev.filter(p => p.id !== performerId));
      showToast("Đã xóa", "success");
    } catch (err) {
      showToast(err.message || "Xóa thất bại", "error");
    }
  };

  const handleSaveFormMapping = async () => {
    if (!targetFormId) return;
    setSavingForm(true);
    try {
      const mapResp = await eFlow.mapForm(node.backendId, {
        sourceFormId: sourceFormId || null,
        targetFormId,
        node: { id: node.backendId },
      });
      const mapFormId = mapResp?.id ?? mapResp?.mapFormId;
      if (mapFormId) {
        const entries = Object.entries(varMapping).filter(([, tv]) => tv);
        for (const [svId, tvId] of entries) {
          await eFlow.mapVariable(mapFormId, {
            sourceVariableId: svId,
            targetVariableId: tvId,
          }).catch(() => {});
        }
      }
      showToast("Đã lưu cấu hình biểu mẫu", "success");
    } catch (err) {
      showToast(err.message || "Lưu thất bại", "error");
    } finally { setSavingForm(false); }
  };

  const formSelect = (value, onChange, placeholder) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
    >
      <option value="">{placeholder}</option>
      {forms.map(f => (
        <option key={f.formId ?? f.id} value={f.formId ?? f.id}>
          {f.formName ?? f.name ?? f.formId ?? f.id}
        </option>
      ))}
    </select>
  );

  return (
    <div className="bg-white border-l border-gray-200 shrink-0 flex flex-col" style={{ width: 300, fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{node.label}</p>
          <p className="text-xs text-gray-400 capitalize">{node.type}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-2">
          <X size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 shrink-0">
        {[
          { key: "performers", label: "Người thực hiện", Icon: User },
          { key: "form",       label: "Biểu mẫu",        Icon: FileText },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === key ? "text-blue-600 border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {!node.backendId && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-gray-400 text-center">Thêm node và lưu quy trình để cấu hình</p>
        </div>
      )}

      {node.backendId && tab === "performers" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loadingPerf ? (
            <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-gray-300" /></div>
          ) : performers.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">Chưa có người thực hiện</p>
          ) : (
            <div className="space-y-1">
              {performers.map(p => (
                <div key={p.id} className="flex items-center justify-between px-2.5 py-2 bg-blue-50 rounded-lg">
                  <span className="text-xs text-gray-700 truncate flex-1">{p.userId}</span>
                  <button onClick={() => handleDeletePerformer(p.id)} className="text-red-400 hover:text-red-600 shrink-0 ml-2">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Thêm người thực hiện</p>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Tìm theo email..."
                className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <button
                onClick={handleSearch}
                className="px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg shrink-0"
              >
                Tìm
              </button>
            </div>
            {userResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {userResults.map((u, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddPerformer(u.email ?? u.userId ?? u.login ?? String(u.id))}
                    disabled={adding}
                    className="w-full text-left px-2.5 py-1.5 text-xs bg-gray-50 hover:bg-blue-50 rounded-lg text-gray-700 hover:text-blue-700 disabled:opacity-60"
                  >
                    {u.email ?? u.name ?? u.login ?? `User ${i + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {node.backendId && tab === "form" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {forms.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">Không có biểu mẫu đã phát hành</p>
          ) : (
            <>
              {/* Source form */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Form nguồn (kế thừa từ)</p>
                {formSelect(sourceFormId, handleSourceFormChange, "-- Chọn form nguồn --")}
              </div>

              {/* Target form */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Form đích (sẽ điền) <span className="text-red-400">*</span></p>
                {formSelect(targetFormId, handleTargetFormChange, "-- Chọn form đích --")}
              </div>

              {/* Variable mapping — only shown if source has variables */}
              {sourceFormId && sourceVars.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Ánh xạ biến</p>
                  <div className="space-y-2">
                    {sourceVars.map(sv => {
                      const svId = String(sv.id ?? sv.code ?? sv.variableName);
                      return (
                        <div key={svId} className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-600 truncate flex-1 min-w-0" title={sv.variableName ?? sv.code ?? svId}>
                            {sv.variableName ?? sv.code ?? svId}
                          </span>
                          <span className="text-gray-300 text-xs shrink-0">→</span>
                          <select
                            value={varMapping[svId] ?? ""}
                            onChange={e => setVarMapping(m => ({ ...m, [svId]: e.target.value }))}
                            className="flex-1 min-w-0 text-xs border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                          >
                            <option value="">-- biến đích --</option>
                            {targetVars.map(tv => {
                              const tvId = String(tv.id ?? tv.code ?? tv.variableName);
                              return (
                                <option key={tvId} value={tvId}>
                                  {tv.variableName ?? tv.code ?? tvId}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveFormMapping}
                disabled={!targetFormId || savingForm}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {savingForm ? "Đang lưu..." : "Lưu cấu hình biểu mẫu"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Toolbar buttons ──────────────────────────────────────────────────────────

const TOOLBAR = [
  { Icon: Undo2,      title: "Hoàn tác (Ctrl+Z)" },
  { Icon: Redo2,      title: "Làm lại (Ctrl+Y)" },
  { Icon: Scissors,   title: "Cắt (Ctrl+X)" },
  { Icon: Copy,       title: "Sao chép (Ctrl+C)" },
  { Icon: Hand,       title: "Di chuyển (Space)" },
  { Icon: ShieldCheck,title: "Xác thực luồng" },
  { Icon: Bot,        title: "AI hỗ trợ" },
];

// ─── Designer canvas ──────────────────────────────────────────────────────────

function DesignerCanvas({ flowId, onNodeSelect }) {
  const [nodes,       setNodes]       = useState([
    { id: "n-start", type: "start", label: "Bắt đầu", x: 80, y: 160 },
  ]);
  // connections: array of { id, fromId, toId } — all plain strings, no nested refs
  const [connections, setConnections] = useState([]);
  const [zoom,        setZoom]        = useState(1);
  const [pan,         setPan]         = useState({ x: 60, y: 40 });
  const [selected,    setSelected]    = useState(null);
  // connecting: null or { fromId, fromX, fromY, mouseX, mouseY } — for temp line rendering
  const [connecting,  setConnecting]  = useState(null);

  const canvasRef     = useRef(null);
  const draggingNode  = useRef(null);
  const panning       = useRef(null);
  // connectingRef mirrors connecting state so event handlers always see the latest value
  const connectingRef = useRef(null);

  // Always-current refs — written every render, read in memoized callbacks
  const nodesRef = useRef(nodes);
  const panRef   = useRef(pan);
  const zoomRef  = useRef(zoom);
  nodesRef.current = nodes;
  panRef.current   = pan;
  zoomRef.current  = zoom;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const screenToWorld = useCallback((clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const p = panRef.current;
    const z = zoomRef.current;
    const wx = (clientX - rect.left - p.x) / z;
    const wy = (clientY - rect.top  - p.y) / z;
    return (isFinite(wx) && isFinite(wy)) ? { x: wx, y: wy } : null;
  }, []);

  // ── Drop from sidebar ──────────────────────────────────────────────────────
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const type  = e.dataTransfer.getData("application/workflow-block");
    const label = e.dataTransfer.getData("application/workflow-label");
    if (!type) return;
    const pos = screenToWorld(e.clientX, e.clientY);
    if (!pos) return;
    const localId = `node-${Date.now()}`;
    setNodes(prev => [...prev, { id: localId, type, label, x: pos.x, y: pos.y }]);
    if (flowId) {
      eFlow.addNode(flowId, { nodeType: type, flow: { id: Number(flowId) } })
        .then(data => {
          if (data?.id) {
            setNodes(prev => prev.map(n => n.id === localId ? { ...n, backendId: data.id } : n));
          }
        })
        .catch(() => {});
    }
  }, [screenToWorld, flowId]);

  // ── Start drawing a connection (called from node's connect dot) ────────────
  const onConnectStart = useCallback((e, node, side = "right") => {
    if (!node?.id) return;
    const ports = getNodePorts(node);
    const from  = ports[side] ?? ports.right;
    if (!isFinite(from.x) || !isFinite(from.y)) return;
    const pos = screenToWorld(e.clientX, e.clientY);
    const mouseX = pos?.x ?? from.x;
    const mouseY = pos?.y ?? from.y;
    const c = { fromId: node.id, fromSide: side, fromX: from.x, fromY: from.y, mouseX, mouseY };
    connectingRef.current = c;
    setConnecting(c);
  }, [screenToWorld]);

  // ── Node drag ──────────────────────────────────────────────────────────────
  const onNodeMouseDown = useCallback((e, nodeId) => {
    if (connectingRef.current) return; // block drag while connecting
    const node = nodesRef.current.find(n => n?.id === nodeId);
    if (!node) return;
    draggingNode.current = {
      id: nodeId,
      startX: e.clientX, startY: e.clientY,
      origX: node.x, origY: node.y,
    };
  }, []);

  // ── Canvas pan ─────────────────────────────────────────────────────────────
  const onCanvasMouseDown = useCallback((e) => {
    if (connectingRef.current) return; // block pan while connecting
    setSelected(null);
    onNodeSelect?.(null);
    const p = panRef.current;
    panning.current = { startX: e.clientX, startY: e.clientY, origPanX: p.x, origPanY: p.y };
  }, []);

  // ── Mouse move ────────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e) => {
    if (connectingRef.current) {
      const pos = screenToWorld(e.clientX, e.clientY);
      if (!pos) return;
      setConnecting(c => c ? { ...c, mouseX: pos.x, mouseY: pos.y } : null);
      return;
    }

    if (draggingNode.current) {
      const drag = draggingNode.current; // snapshot — safe for updater closure
      const z    = zoomRef.current;
      const dx   = (e.clientX - drag.startX) / z;
      const dy   = (e.clientY - drag.startY) / z;
      setNodes(prev => prev.map(n =>
        n?.id === drag.id ? { ...n, x: drag.origX + dx, y: drag.origY + dy } : n
      ));
      return;
    }

    if (panning.current) {
      setPan({
        x: panning.current.origPanX + (e.clientX - panning.current.startX),
        y: panning.current.origPanY + (e.clientY - panning.current.startY),
      });
    }
  }, [screenToWorld]);

  // ── Mouse up: finalize connection OR end drag/pan ─────────────────────────
  const onMouseUp = useCallback((e) => {
    const snap = connectingRef.current;
    if (snap) {
      // Always clear connecting state first
      connectingRef.current = null;
      setConnecting(null);

      // Then try to find a target node at the release position
      const pos = e ? screenToWorld(e.clientX, e.clientY) : null;
      if (pos && snap.fromId) {
        const target = nodesRef.current.find(node => {
          if (!node?.id || node.id === snap.fromId) return false;
          const { w, h } = getNodeSize(node.type);
          return pos.x >= node.x && pos.x <= node.x + w
              && pos.y >= node.y && pos.y <= node.y + h;
        });

        if (target?.id) {
          const fromNode = nodesRef.current.find(n => n?.id === snap.fromId);
          const { fromSide, toSide } = nearestPortPair(fromNode, target, snap.fromSide);
          const fromId = String(snap.fromId);
          const toId   = String(target.id);
          setConnections(prev => {
            // Prevent duplicate
            if (prev.some(c => c?.fromId === fromId && c?.toId === toId)) return prev;
            // Persist edge to backend if both nodes have backendId
            if (flowId && fromNode?.backendId && target?.backendId) {
              eFlow.addEdge(flowId, {
                node: { id: fromNode.backendId },
                childNodeId: target.backendId,
                flow: { id: Number(flowId) },
              }).catch(() => {});
            }
            return [...prev, { id: `conn-${Date.now()}`, fromId, fromSide, toId, toSide }];
          });
        }
      }
      return;
    }

    draggingNode.current = null;
    panning.current      = null;
  }, [screenToWorld]);

  // Cancel connecting when mouse leaves canvas
  const onMouseLeave = useCallback(() => {
    if (connectingRef.current) {
      connectingRef.current = null;
      setConnecting(null);
    }
    draggingNode.current = null;
    panning.current      = null;
  }, []);

  // ── Wheel zoom (zoom toward cursor) ───────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const delta  = e.deltaY > 0 ? -0.08 : 0.08;
    const rect   = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setZoom(z => {
      const next = Math.min(3, Math.max(0.15, parseFloat((z + delta).toFixed(2))));
      setPan(p => ({
        x: mouseX - (mouseX - p.x) * (next / z),
        y: mouseY - (mouseY - p.y) * (next / z),
      }));
      return next;
    });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // ── Dot grid ───────────────────────────────────────────────────────────────
  const dot = 20 * zoom;
  const bgStyle = {
    backgroundImage: "radial-gradient(circle, #c8d3e0 1.5px, transparent 1.5px)",
    backgroundSize:     `${dot}px ${dot}px`,
    backgroundPosition: `${((pan.x % dot) + dot) % dot}px ${((pan.y % dot) + dot) % dot}px`,
    cursor: connecting ? "crosshair" : undefined,
  };

  const zoomPct = Math.round(zoom * 100);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative overflow-hidden bg-white"
      style={bgStyle}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* SVG overlay — sits ABOVE the world layer, covers full canvas.
          Coordinates are in canvas space: canvasX = worldX * zoom + pan.x */}
      <svg
        style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
          overflow: "visible",
          zIndex: 5,
        }}
      >
        <defs>
          <marker
            id="wf-arrow"
            markerWidth="10" markerHeight="7"
            refX="9" refY="3.5"
            orient="auto"
          >
            <polygon points="0 0,10 3.5,0 7" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Permanent connection lines — world coords → canvas coords */}
        {connections.map(conn => {
          if (!conn?.fromId || !conn?.toId) return null;
          const fromNode = nodes.find(n => n?.id === conn.fromId);
          const toNode   = nodes.find(n => n?.id === conn.toId);
          if (!fromNode || !toNode) return null;
          const fromPorts = getNodePorts(fromNode);
          const toPorts   = getNodePorts(toNode);
          const from = fromPorts[conn.fromSide] ?? fromPorts.right;
          const to   = toPorts[conn.toSide]     ?? toPorts.left;
          const x1 = from.x * zoom + pan.x;
          const y1 = from.y * zoom + pan.y;
          const x2 = to.x   * zoom + pan.x;
          const y2 = to.y   * zoom + pan.y;
          if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) return null;
          return (
            <line
              key={conn.id}
              x1={x1} y1={y1}
              x2={x2} y2={y2}
              stroke="#3b82f6"
              strokeWidth={2}
              markerEnd="url(#wf-arrow)"
            />
          );
        })}

        {/* Temporary dashed line while dragging */}
        {connecting
         && isFinite(connecting.fromX) && isFinite(connecting.fromY)
         && isFinite(connecting.mouseX) && isFinite(connecting.mouseY)
         && (
          <line
            x1={connecting.fromX * zoom + pan.x}
            y1={connecting.fromY * zoom + pan.y}
            x2={connecting.mouseX * zoom + pan.x}
            y2={connecting.mouseY * zoom + pan.y}
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {/* World layer — all node coordinates are in world space */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        transformOrigin: "0 0",
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      }}>
        {/* Nodes */}
        {nodes.map(node => (
          <CanvasNode
            key={node.id}
            node={node}
            onMouseDown={onNodeMouseDown}
            selected={selected === node.id}
            onClick={(nodeId) => {
                setSelected(nodeId);
                const n = nodesRef.current.find(x => x?.id === nodeId);
                onNodeSelect?.(n ?? null);
              }}
            onConnectStart={onConnectStart}
            isConnecting={!!connecting}
          />
        ))}
      </div>

      {/* ── Controls bottom-right ── */}
      <div
        className="absolute bottom-4 right-4 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-md px-2 py-1.5"
        style={{ fontFamily: "'Inter',sans-serif", zIndex: 10 }}
      >
        <button title="Cài đặt canvas" className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-500">
          <Settings size={13} />
        </button>
        <button title="Hiển thị lưới" className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-500">
          <Grid3X3 size={13} />
        </button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button
          title="Thu nhỏ"
          onClick={() => setZoom(z => Math.max(0.15, parseFloat((z - 0.1).toFixed(2))))}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-600"
        >
          <Minus size={13} />
        </button>
        <span className="text-xs font-semibold text-gray-600 w-10 text-center select-none tabular-nums">
          {zoomPct}%
        </span>
        <button
          title="Phóng to"
          onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.1).toFixed(2))))}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-gray-600"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WorkflowDesigner() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [avatarOpen,    setAvatarOpen]    = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [wfName,        setWfName]        = useState("Tạm ứng");
  const [saving,        setSaving]        = useState(false);
  const [selectedNode,  setSelectedNode]  = useState(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    eFlow.getDefinition(id)
      .then(data => {
        if (data?.workflowName ?? data?.name) setWfName(data.workflowName ?? data.name);
      })
      .catch(() => {});
  }, [id]);

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}
    >
      {/* ══ HEADER ══ */}
      <header
        className="h-14 flex items-center px-4 shadow-sm z-30 shrink-0"
        style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
      >
        <div className="flex items-center gap-2 shrink-0" style={{ width: 220 }}>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <GitBranch size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">eFlow</span>
        </div>

        <div className="flex-1 flex justify-center px-6">
          <div className="relative w-full max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm chức năng"
              className="w-full pl-9 pr-4 py-1.5 rounded-md bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={async () => {
              if (!id || id === "new") { showToast("Không có ID quy trình để lưu", "warning"); return; }
              setSaving(true);
              try {
                await eFlow.updateInfo(id, { id: Number(id), flowName: wfName });
                showToast("Đã lưu quy trình", "success");
              } catch (err) {
                showToast(err.message || "Lưu thất bại", "error");
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-blue-700 font-semibold text-sm rounded-lg hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen(o => !o)}
              className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white hover:opacity-90 transition-opacity"
            >
              TD
            </button>
            {avatarOpen && (
              <div className="absolute right-0 top-10 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <p className="text-sm font-bold text-gray-800">UET Flow</p>
                  <p className="text-xs text-gray-500">theduynguyen27@gmail.com</p>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <span>Chuyển đổi tài khoản</span>
                    <ArrowLeftRight size={14} className="text-gray-400" />
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <span>Đăng xuất</span>
                    <LogOut size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══ SUB-HEADER ══ */}
      <div className="bg-white border-b border-gray-200 px-5 shrink-0" style={{ paddingTop: 10, paddingBottom: 0 }}>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <button onClick={() => navigate("/eflow")} className="hover:text-blue-600 transition-colors font-medium">
            Quản lý quy trình
          </button>
          <ChevronRight size={12} />
          <span className="text-gray-600 font-medium">Tạo</span>
        </div>

        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-5">
            <div>
              <span className="text-base font-bold text-gray-900">{wfName}</span>
              <span className="text-xs text-gray-400 ml-3">Lưu lần cuối 06/03/2026 09:09:44</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {TOOLBAR.map(({ Icon, title }, i) => (
              <button
                key={i}
                title={title}
                className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          <div style={{ width: 140 }} />
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT SIDEBAR ══ */}
        <aside
          className="bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden transition-all duration-200"
          style={{ width: sidebarOpen ? 220 : 40 }}
        >
          {sidebarOpen && (
            <>
              <div className="px-3 pt-3 pb-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm phần tử"
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-gray-50"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-3">
                {BLOCK_GROUPS.map(group => (
                  <div key={group.label}>
                    <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: group.accentColor }} />
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: group.accentColor }}>
                        {group.label}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 pl-1">
                      {group.blocks.map(block => (
                        <div
                          key={block.type}
                          draggable
                          title={block.title}
                          onDragStart={e => {
                            e.dataTransfer.setData("application/workflow-block", block.type);
                            e.dataTransfer.setData("application/workflow-label", block.label);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing transition-colors select-none hover:bg-gray-50"
                          style={{ borderColor: group.accentColor + "40", borderLeftWidth: 2, borderLeftColor: group.accentColor }}
                        >
                          <block.Icon />
                          <span className="text-xs font-medium text-gray-700 leading-snug">{block.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-gray-100 p-2 flex justify-center shrink-0">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              title={sidebarOpen ? "Thu gọn" : "Mở rộng"}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            </button>
          </div>
        </aside>

        {/* ══ CANVAS ══ */}
        <div className="flex-1 overflow-hidden">
          <DesignerCanvas flowId={id} onNodeSelect={setSelectedNode} />
        </div>

        {/* ══ RIGHT PANEL — Node config ══ */}
        {selectedNode && (
          <NodeConfigPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}

      </div>
    </div>
  );
}
