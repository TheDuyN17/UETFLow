import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { eRequest } from "../services/api";
import { showToast } from "../utils/toast";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

export default function NewTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get("workflowId");

  const [title,     setTitle]     = useState("");
  const [note,      setNote]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [wfName,    setWfName]    = useState("Gửi yêu cầu mới");

  useEffect(() => {
    if (!workflowId) return;
  }, [workflowId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { showToast("Vui lòng nhập tiêu đề yêu cầu", "warning"); return; }
    setSubmitting(true);
    try {
      const res = await eRequest.initTicket({ workflowId, title: title.trim(), note: note.trim() });
      showToast("Đã tạo yêu cầu thành công", "success");
      navigate(`/erequest/transaction/${res?.ticketId ?? res?.id ?? ""}`, { replace: true });
    } catch (err) {
      showToast(err.message || "Tạo yêu cầu thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="erequest" />

      <main className="flex-1 p-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate("/erequest")} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-800">{wfName}</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-7 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Tiêu đề yêu cầu <span className="text-red-500">*</span>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ghi chú</label>
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
