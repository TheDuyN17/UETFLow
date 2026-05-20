import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { eAi, eRequest } from "../services/api";
import { showToast } from "../utils/toast";
import {
  ArrowLeft, Upload, FileText, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, RefreshCw, Brain, ShieldCheck, GitBranch,
} from "lucide-react";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

const STEPS = [
  { key: "idle",       label: "Chờ tải lên"     },
  { key: "uploading",  label: "Đang tải lên..."  },
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
        const isError = phase === "error";
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isError && active ? "bg-red-100 text-red-600 border-2 border-red-400" :
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
              <div className={`h-0.5 w-12 mx-1 mt-[-18px] ${done ? "bg-purple-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldTable({ fields }) {
  const [expanded, setExpanded] = useState({});
  if (!fields || fields.length === 0) return <p className="text-sm text-gray-400 text-center py-4">Không có dữ liệu</p>;
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
              <span className="text-sm font-semibold text-gray-700 w-48 shrink-0">{f.fieldName ?? f.label ?? `Trường ${i + 1}`}</span>
              {!isObj && <span className="text-sm text-gray-800 flex-1 truncate">{String(f.value ?? "—")}</span>}
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
  const [taskId, setTaskId]       = useState(null);
  const [result, setResult]       = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const [rawText, setRawText]     = useState(null);
  const [showRaw, setShowRaw]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWf, setSelectedWf] = useState("");
  const [creating, setCreating]   = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pollRef = useRef(null);
  const attemptsRef = useRef(0);
  const fileInputRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = useCallback((id) => {
    attemptsRef.current = 0;
    pollRef.current = setInterval(async () => {
      attemptsRef.current++;
      if (attemptsRef.current > POLL_MAX_ATTEMPTS) {
        stopPolling();
        setPhase("error");
        setErrorMsg("Hết thời gian chờ. Vui lòng thử lại.");
        return;
      }
      try {
        const status = await eAi.getStatus(id);
        if (status?.status === "completed") {
          stopPolling();
          const res = await eAi.getResult(id);
          setResult(res);
          setPhase("done");
        } else if (status?.status === "failed") {
          stopPolling();
          setPhase("error");
          setErrorMsg(status?.message || "Xử lý thất bại");
        }
      } catch {
        // keep polling
      }
    }, POLL_INTERVAL_MS);
  }, []);

  const handleUpload = async () => {
    if (!file) { showToast("Vui lòng chọn file PDF", "warning"); return; }
    if (!formName.trim()) { showToast("Vui lòng nhập tên form", "warning"); return; }
    setPhase("uploading");
    setErrorMsg("");
    setResult(null);
    try {
      const res = await eAi.uploadDocument(file, formName.trim());
      const id = res?.taskId ?? res?.id ?? res;
      setTaskId(id);
      setPhase("processing");
      startPolling(id);
    } catch (err) {
      setPhase("error");
      setErrorMsg(err.message || "Tải lên thất bại");
    }
  };

  const handleFetchRaw = async () => {
    if (!taskId) return;
    try {
      const txt = await eAi.getRawText(taskId);
      setRawText(typeof txt === "string" ? txt : JSON.stringify(txt, null, 2));
      setShowRaw(true);
    } catch {
      showToast("Không thể tải văn bản thô", "error");
    }
  };

  const handleReset = () => {
    stopPolling();
    setPhase("idle");
    setFile(null);
    setFormName("");
    setTaskId(null);
    setResult(null);
    setErrorMsg("");
    setRawText(null);
    setShowRaw(false);
    setVerifyResult(null);
    setShowCreateModal(false);
  };

  const handleVerify = async () => {
    if (!taskId) return;
    setVerifying(true);
    try {
      const data = await eAi.verifyAiData(taskId);
      setVerifyResult(data);
      showToast("Đã xác minh dữ liệu", "success");
    } catch (err) {
      showToast(err.message || "Xác minh thất bại", "error");
    } finally { setVerifying(false); }
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

  const handleCreateTicket = async () => {
    if (!selectedWf) return;
    setCreating(true);
    try {
      await eAi.createFromPdf({ taskId, workflowId: selectedWf });
      showToast("Đã tạo giao dịch từ PDF", "success");
      setShowCreateModal(false);
      navigate("/erequest");
    } catch (err) {
      showToast(err.message || "Tạo thất bại", "error");
    } finally { setCreating(false); }
  };

  const fields = result?.fields ?? result?.data ?? (Array.isArray(result) ? result : null);

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="eai" />

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Back */}
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
                placeholder="Nhập tên form cần trích xuất..."
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
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-colors cursor-pointer ${
                  phase !== "idle" ? "bg-gray-50 border-gray-200 cursor-not-allowed" :
                  file ? "border-purple-300 bg-purple-50" : "border-gray-300 hover:border-purple-400 hover:bg-purple-50"
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
                Tải lên và xử lý
              </button>
            )}

            {/* Processing indicator */}
            {(phase === "uploading" || phase === "processing") && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 size={36} className="text-purple-500 animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">
                    {phase === "uploading" ? "Đang tải file lên máy chủ..." : "AI đang phân tích tài liệu..."}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Vui lòng chờ, quá trình này có thể mất vài giây</p>
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

            {/* Results */}
            {phase === "done" && result && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-semibold">Trích xuất thành công</span>
                </div>

                {fields && <FieldTable fields={Array.isArray(fields) ? fields : Object.entries(fields).map(([k, v]) => ({ fieldName: k, value: v }))} />}

                {verifyResult && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <ShieldCheck size={16} className="text-green-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-green-700">
                      <p className="font-semibold mb-1">Kết quả xác minh</p>
                      <pre className="whitespace-pre-wrap">{typeof verifyResult === "string" ? verifyResult : JSON.stringify(verifyResult, null, 2)}</pre>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={handleVerify} disabled={verifying}
                    className="flex-1 py-2.5 text-sm font-semibold text-green-700 border border-green-300 rounded-xl hover:bg-green-50 flex items-center justify-center gap-2 disabled:opacity-60">
                    {verifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    {verifying ? "Đang xác minh..." : "Xác minh dữ liệu"}
                  </button>
                  <button onClick={handleOpenCreate}
                    className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
                    <GitBranch size={14} />
                    Tạo giao dịch
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleFetchRaw}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">
                    Xem văn bản thô
                  </button>
                  <button onClick={handleReset}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50">
                    <RefreshCw size={15} />
                    Tải lên file khác
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Create ticket modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base font-bold text-gray-800">Tạo giao dịch từ PDF</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                </div>
                <div className="p-6 space-y-4">
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
                      {creating ? "Đang tạo..." : "Tạo giao dịch"}
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
                  <h3 className="text-base font-bold text-gray-800">Văn bản thô từ PDF</h3>
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
