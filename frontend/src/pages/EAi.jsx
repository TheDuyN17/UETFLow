import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { eRequest } from "../services/api";
import { Brain, FileText, Upload, ArrowRight, Loader2 } from "lucide-react";

export default function EAi() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    eRequest.getMyWorkflows()
      .then(data => setWorkflows(Array.isArray(data) ? data : []))
      .catch(() => setError("Không thể tải danh sách quy trình"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="eai" />

      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)" }}>
              <Brain size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">eAi — Trích xuất dữ liệu thông minh</h1>
              <p className="text-sm text-gray-500 mt-0.5">Tải lên tài liệu PDF và để AI điền tự động vào form</p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-gray-400">
              <Loader2 size={28} className="animate-spin" />
              <span className="text-sm">Đang tải danh sách quy trình...</span>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3">
              <FileText size={36} className="text-gray-300" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : workflows.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3">
              <FileText size={36} className="text-gray-300" />
              <p className="text-sm text-gray-500">Không có quy trình nào khả dụng</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-600 mb-4">Chọn quy trình để tải lên tài liệu PDF:</p>
              {workflows.map(wf => (
                <button
                  key={wf.flowId ?? wf.workflowId ?? wf.id}
                  onClick={() => navigate(`/eai/upload/${wf.flowId ?? wf.workflowId ?? wf.id}`)}
                  className="w-full flex items-center gap-4 bg-white rounded-xl shadow-sm px-5 py-4 hover:shadow-md transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#e9d5ff,#ddd6fe)" }}>
                    <FileText size={18} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{wf.workflowName ?? wf.name}</p>
                    {wf.description && <p className="text-xs text-gray-400 truncate mt-0.5">{wf.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-purple-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={15} />
                    <span className="text-xs font-semibold">Tải lên</span>
                    <ArrowRight size={15} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
