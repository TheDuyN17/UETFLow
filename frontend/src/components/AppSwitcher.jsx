import { useNavigate } from "react-router-dom";
import { FileText, GitBranch, ClipboardList, UserCog, Sparkles } from "lucide-react";

const SERVICES = [
  {
    key: "eform",
    label: "eForm",
    desc: "Tạo và cấu hình biểu mẫu",
    path: "/eform",
    gradient: "linear-gradient(135deg, #f97316, #ef4444)",
    Icon: FileText,
  },
  {
    key: "eflow",
    label: "eFlow",
    desc: "Tự động hóa quy trình",
    path: "/eflow",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    Icon: GitBranch,
  },
  {
    key: "erequest",
    label: "eRequest",
    desc: "Quản lý yêu cầu dịch vụ",
    path: "/erequest",
    gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    Icon: ClipboardList,
  },
  {
    key: "eaccount",
    label: "eAccount",
    desc: "Quản lý tài khoản",
    path: "/eaccount",
    gradient: "linear-gradient(135deg, #16a34a, #059669)",
    Icon: UserCog,
  },
  {
    key: "eai",
    label: "eAi",
    desc: "Điền form bằng AI",
    path: "/eai",
    gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    Icon: Sparkles,
  },
];

const ACCENT_COLOR = {
  eform: "#f97316",
  eflow: "#3b82f6",
  erequest: "#7c3aed",
  eaccount: "#16a34a",
  eai: "#ec4899",
};

export default function AppSwitcher({ currentService, onClose }) {
  const navigate = useNavigate();
  const accent = ACCENT_COLOR[currentService] || "#7c3aed";

  return (
    <div
      className="absolute left-0 top-10 bg-white rounded-xl border border-gray-100 z-50 overflow-hidden flex"
      style={{ width: 350, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
    >
      {/* Left branding */}
      <div
        className="flex flex-col justify-center px-3 py-4 bg-gray-50"
        style={{ width: "40%", borderLeft: `3px solid ${accent}` }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: accent }}>UET Flow</span>
          <span className="text-gray-300 text-xs ml-1">—</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 leading-snug">Toàn trình vòng đời hợp đồng</p>
      </div>

      {/* Right service list */}
      <div className="flex flex-col py-2" style={{ width: "60%" }}>
        {SERVICES.map(({ key, label, desc, path, gradient, Icon }) => (
          <button
            key={key}
            onClick={() => { onClose(); navigate(path); }}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: gradient }}
            >
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
