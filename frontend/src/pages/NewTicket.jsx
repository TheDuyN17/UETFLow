import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { eRequest } from "../services/api";
import { showToast } from "../utils/toast";
import { ArrowLeft, Send, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export default function NewTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Accept both ?workflowId= and ?flowId= (eAi sends flowId)
  const workflowId = searchParams.get("workflowId") ?? searchParams.get("flowId");
  const prefillBase64 = searchParams.get("prefill");

  const [title,      setTitle]      = useState("");
  const [note,       setNote]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  const [showPrefill, setShowPrefill] = useState(false);

  useEffect(() => {
    if (!prefillBase64) return;
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(prefillBase64))));
      setPrefillData(decoded);

      // Auto-fill title from formName + main field (ho_ten)
      const hoTen = decoded.filledData?.ho_ten || decoded.filledData?.ten || "";
      const formName = decoded.formName || "";
      if (formName && !title) {
        setTitle(hoTen ? `${formName} - ${hoTen}` : formName);
      }
      // Auto-fill note with summary
      if (decoded.filledData && !note) {
        const summary = Object.entries(decoded.filledData)
          .slice(0, 5)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        setNote(`[AI Extract] ${summary}`);
      }
    } catch (e) {
      console.error("Failed to decode prefill param", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillBase64]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { showToast("Vui lòng nhập tiêu đề yêu cầu", "warning"); return; }
    setSubmitting(true);
    try {
      const res = await eRequest.initTicket({
        flowId: Number(workflowId) || 0,
        ticketName: title.trim(),
        note: note.trim() || undefined,
      });
      showToast("Đã tạo yêu cầu thành công", "success");
      navigate(`/erequest/transaction/${res?.ticketId ?? res?.id ?? ""}`, { replace: true });
    } catch (err) {
      showToast(err.message || "Tạo yêu cầu thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const prefillFields = prefillData?.filledData ? Object.entries(prefillData.filledData) : [];

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="erequest" />

      <main className="flex-1 p-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              {prefillData ? `${prefillData.formName || "Gửi yêu cầu mới"}` : "Gửi yêu cầu mới"}
            </h1>
          </div>

          {/* AI prefill summary banner */}
          {prefillData && prefillFields.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl mb-5 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPrefill(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-purple-500" />
                  <span className="text-sm font-semibold text-purple-700">
                    AI đã trích xuất {prefillFields.length} trường thông tin
                  </span>
                  {prefillData.confidence && (
                    <span className="text-xs text-purple-400 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                      Độ tin cậy: {(prefillData.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                {showPrefill ? <ChevronUp size={15} className="text-purple-400" /> : <ChevronDown size={15} className="text-purple-400" />}
              </button>

              {showPrefill && (
                <div className="border-t border-purple-200 bg-white px-4 py-3 space-y-1.5">
                  {prefillFields.map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-purple-600 w-36 shrink-0">{k}</span>
                      <span className="text-gray-700 truncate">{String(v)}</span>
                    </div>
                  ))}
                  {prefillData.missingFields && (
                    <p className="text-xs text-amber-600 pt-1 border-t border-gray-100 mt-1">
                      ⚠️ Không trích xuất được: {prefillData.missingFields}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-7 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tiêu đề yêu cầu <span className="text-red-500">*</span>
                {prefillData && <span className="ml-2 text-xs font-normal text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">✨ AI đề xuất</span>}
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề yêu cầu..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Ghi chú
                {prefillData && <span className="ml-2 text-xs font-normal text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">✨ AI đề xuất</span>}
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={4}
                placeholder="Nhập ghi chú (không bắt buộc)..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
