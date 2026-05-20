import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { eAi, eRequest } from "../services/api";
import { showToast } from "../utils/toast";
import {
  ArrowLeft, Upload, FileText, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, RefreshCw, Brain, GitBranch, Sparkles,
} from "lucide-react";

const STEPS = [
  { key: "idle",       label: "Chờ tải lên"     },
  { key: "processing", label: "AI đang xử lý..." },
  { key: "done",       label: "Hoàn thành"       },
  { key: "error",      label: "Lỗi"              },
];

function StepIndicator({ phase }) {
  const phaseIndex = STEPS.findIndex(s => s.key === phase);
  const showSteps = STEPS.filter(s => s.key !== "error");
  return (
    <div className="flex items-center gap-0 mb-8">
      {showSteps.map((s, i) => {
        const idx = STEPS.findIndex(x => x.key === s.key);
        const done = phaseIndex > idx;
        const active = phaseIndex === idx;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done   ? "bg-purple-600 text-white" :
                active ? "bg-purple-100 text-purple-600 border-2 border-purple-400" :
                         "bg-gray-100 text-gray-400"
              }`}>
                {done ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? "text-purple-600" : done ? "text-purple-500" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
            {i < showSteps.length - 1 && (
              <div className={`h-0.5 w-16 mx-1 mt-[-18px] ${done ? "bg-purple-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function parseFilledData(filledData) {
  if (!filledData) return [];
  try {
    const obj = typeof filledData === "string" ? JSON.parse(filledData) : filledData;
    return Object.entries(obj).map(([k, v]) => ({ fieldName: k, value: v != null ? String(v) : "" }));
  } catch {
    return [];
  }
}

function FieldTable({ fields, editable, onChange }) {
  const [expanded, setExpanded] = useState({});
  if (!fields || fields.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Không có dữ liệu trích xuất</p>;
  }
  return (
    <div className="space-y-2">
      {fields.map((f, i) => {
        const isObj = f.value && typeof f.value === "object";
        const isOpen = expanded[i];
        return (
          <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
            <div
              className={`flex items-center gap-3 px-4 py-3 ${isObj ? "cursor-pointer hover:bg-gray-50" : ""}`}
              onClick={() => isObj && setExpanded(p => ({ ...p, [i]: !p[i] }))}
            >
              <span className="text-xs font-semibold text-purple-600 w-40 shrink-0 flex items-center gap-1">
                <Sparkles size={11} />
                {f.fieldName ?? `Trường ${i + 1}`}
              </span>
              {!isObj && !editable && (
                <span className="text-sm text-gray-800 flex-1 truncate">{String(f.value ?? "—")}</span>
              )}
              {!isObj && editable && (
                <input
                  type="text"
                  value={f.value ?? ""}
                  onChange={e => onChange && onChange(f.fieldName, e.target.value)}
                  className="text-sm text-gray-800 flex-1 border-b border-gray-200 focus:outline-none focus:border-purple-400 bg-transparent py-0.5 px-1"
                />
              )}
              {isObj && (
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium flex-1">Object</span>
              )}
              {isObj && (isOpen ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />)}
            </div>
            {isObj && isOpen && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                <pre className="text-xs text-gray-600 overflow-auto">{JSON.stringify(f.value, null, 2)}</pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function EAiUpload() {
  const { flowId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase]         = useState("idle");
  const [file, setFile]           = useState(null);
  const [formName, setFormName]   = useState("");
  const [result, setResult]       = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const [rawText, setRawText]     = useState(null);
  const [showRaw, setShowRaw]     = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWf, setSelectedWf] = useState(flowId ?? "");
  const [creating, setCreating]   = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editedFields, setEditedFields] = useState([]);
  const fileInputRef = useRef(null);

  // Load workflows if flowId param is provided
  useEffect(() => {
    if (flowId) setSelectedWf(flowId);
  }, [flowId]);

  const handleUpload = async () => {
    if (!file) { showToast("Vui lòng chọn file PDF", "warning"); return; }
    if (!formName.trim()) { showToast("Vui lòng nhập tên form", "warning"); return; }
    setPhase("processing");
    setErrorMsg("");
    setResult(null);
    setEditedFields([]);
    try {
      const res = await eAi.submitSync(file, formName.trim());
      setResult(res);
      setEditedFields(parseFilledData(res?.filledData));
      setPhase("done");
    } catch (err) {
      setPhase("error");
      setErrorMsg(err.message || "Tải lên thất bại");
    }
  };

  const handleFetchRaw = async () => {
    if (result?.rawText) {
      setRawText(result.rawText);
      setShowRaw(true);
      return;
    }
    showToast("Không có văn bản thô", "warning");
  };

  const handleReset = () => {
    setPhase("idle");
    setFile(null);
    setFormName("");
    setResult(null);
    setEditedFields([]);
    setErrorMsg("");
    setRawText(null);
    setShowRaw(false);
    setShowCreateModal(false);
  };

  const handleOpenCreate = async () => {
    setShowCreateModal(true);
    if (workflows.length === 0) {
      try {
        const wfs = await eRequest.getMyWorkflows();
        setWorkflows(Array.isArray(wfs) ? wfs : []);
      } catch {}
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setEditedFields(prev => prev.map(f => f.fieldName === fieldName ? { ...f, value } : f));
  };

  const handleCreateTicket = () => {
    if (!selectedWf) return;
    setCreating(true);

    const filledDataObj = {};
    editedFields.forEach(f => { filledDataObj[f.fieldName] = f.value; });

    const prefillPayload = {
      formName: result?.formName || formName,
      filledData: filledDataObj,
      confidence: result?.confidence,
      missingFields: result?.missingFields,
    };

    try {
      const prefillBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(prefillPayload))));
      setShowCreateModal(false);
      navigate(`/erequest/new?flowId=${selectedWf}&prefill=${prefillBase64}`);
    } catch (err) {
      showToast("Lỗi encode dữ liệu: " + err.message, "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="eai" />

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate("/eai")} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Brain size={20} className="text-purple-600" />
              <h1 className="text-xl font-bold text-gray-800">Trích xuất dữ liệu từ PDF</h1>
            </div>
          </div>

          <StepIndicator phase={phase} />

          <div className="bg-white rounded-2xl shadow-sm p-7 space-y-5">
            {/* Form name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tên form <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                disabled={phase !== "idle"}
                placeholder="Nhập tên form cần trích xuất (vd: Đơn xin nghỉ phép)..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {/* File picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                File PDF <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => phase === "idle" && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-colors ${
                  phase !== "idle" ? "bg-gray-50 border-gray-200 cursor-not-allowed" :
                  file ? "border-purple-300 bg-purple-50 cursor-pointer" : "border-gray-300 hover:border-purple-400 hover:bg-purple-50 cursor-pointer"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  disabled={phase !== "idle"}
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <>
                    <FileText size={32} className="text-purple-500" />
                    <p className="text-sm font-semibold text-purple-700">{file.name}</p>
                    <p className="text-xs text-purple-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-400" />
                    <p className="text-sm text-gray-500">Nhấn để chọn file PDF</p>
                    <p className="text-xs text-gray-400">Chỉ hỗ trợ định dạng .pdf</p>
                  </>
                )}
              </div>
            </div>

            {/* Upload button */}
            {phase === "idle" && (
              <button
                onClick={handleUpload}
                className="w-full py-3 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}
              >
                <Upload size={16} />
                Tải lên và xử lý bằng AI
              </button>
            )}

            {/* Processing indicator */}
            {phase === "processing" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 size={36} className="text-purple-500 animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">🤖 AI đang phân tích tài liệu...</p>
                  <p className="text-xs text-gray-400 mt-1">Vui lòng chờ, quá trình này có thể mất 5-15 giây</p>
                </div>
              </div>
            )}

            {/* Error */}
            {phase === "error" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Xử lý thất bại</p>
                    <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
                  </div>
                </div>
                <button onClick={handleReset}
                  className="w-full py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2">
                  <RefreshCw size={15} />
                  Thử lại
                </button>
              </div>
            )}

            {/* Results — Preview Phase */}
            {phase === "done" && result && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-semibold">Trích xuất thành công ✨</span>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Độ tin cậy: <strong>{((result.confidence ?? 0) * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                {/* Extracted fields — editable */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Sparkles size={12} className="text-purple-400" />
                    Dữ liệu AI trích xuất (có thể sửa)
                  </p>
                  <FieldTable
                    fields={editedFields}
                    editable
                    onChange={handleFieldChange}
                  />
                </div>

                {result.missingFields && result.missingFields.trim() && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ⚠️ Không trích xuất được: {result.missingFields}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {result.rawText && (
                    <button onClick={handleFetchRaw}
                      className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">
                      Xem văn bản thô
                    </button>
                  )}
                  <button onClick={handleOpenCreate}
                    className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
                    <GitBranch size={14} />
                    Tạo yêu cầu →
                  </button>
                </div>
                <button onClick={handleReset}
                  className="w-full py-2.5 text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50">
                  <RefreshCw size={15} />
                  Tải lên file khác
                </button>
              </div>
            )}
          </div>

          {/* Create ticket modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-800">Tạo yêu cầu từ PDF</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-gray-500">
                    Dữ liệu AI trích xuất sẽ được điền sẵn vào form. Bạn có thể xem lại và chỉnh sửa trước khi gửi.
                  </p>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chọn quy trình</label>
                    <select
                      value={selectedWf}
                      onChange={e => setSelectedWf(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                    >
                      <option value="">-- Chọn quy trình --</option>
                      {workflows.map(wf => (
                        <option key={wf.flowId ?? wf.id} value={wf.flowId ?? wf.id}>
                          {wf.workflowName ?? wf.flowName ?? wf.name ?? `Quy trình ${wf.flowId ?? wf.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl">Hủy</button>
                    <button
                      onClick={handleCreateTicket}
                      disabled={!selectedWf || creating}
                      className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}
                    >
                      {creating ? "Đang xử lý..." : "Tiếp tục →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raw text modal */}
          {showRaw && rawText && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-800">Văn bản thô từ PDF (OCR)</h3>
                  <button onClick={() => setShowRaw(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">{rawText}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
