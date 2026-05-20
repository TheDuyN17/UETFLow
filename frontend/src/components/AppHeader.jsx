import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid3X3, Search, ArrowLeftRight, LogOut,
  FileText, GitBranch, ClipboardList, UserCog, Sparkles,
} from "lucide-react";
import logoUET from "../assets/logo-uet.png";
import AppSwitcher from "./AppSwitcher";
import { getAuth, clearAuth } from "../utils/auth";

const SERVICE_CONFIG = {
  eform: {
    gradient: "radial-gradient(675.45% 140.67% at 98.93% 0%, #f3a23c 0%, #f2513c 100%)",
    label: "eForm",
    Icon: FileText,
  },
  eflow: {
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    label: "eFlow",
    Icon: GitBranch,
  },
  erequest: {
    gradient: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
    label: "eRequest",
    Icon: ClipboardList,
  },
  eaccount: {
    gradient: "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
    label: "eAccount",
    Icon: UserCog,
  },
  eai: {
    gradient: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    label: "eAi",
    Icon: Sparkles,
  },
};

function userInitials(user) {
  if (!user) return "U";
  const name = user.fullName || user.firstName || "";
  if (!name) return (user.email || "U").charAt(0).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function userDisplayName(user) {
  if (!user) return "UET Flow";
  return user.fullName || user.firstName || user.email || "UET Flow";
}

export default function AppHeader({ service }) {
  const navigate = useNavigate();
  const { user } = getAuth();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const avatarRef = useRef(null);
  const appMenuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
      if (appMenuRef.current && !appMenuRef.current.contains(e.target)) setShowAppMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const cfg = SERVICE_CONFIG[service] || SERVICE_CONFIG.erequest;
  const { gradient, label, Icon } = cfg;

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <header
      className="h-14 flex items-center px-4 shadow-sm z-30 shrink-0"
      style={{ background: gradient }}
    >
      {/* Left: app switcher + service name */}
      <div className="flex items-center gap-4 w-[339px] shrink-0">
        <div className="relative shrink-0" ref={appMenuRef}>
          <button
            onClick={() => setShowAppMenu((o) => !o)}
            className="text-white hover:bg-white/20 p-1.5 rounded transition-colors"
          >
            <Grid3X3 size={20} />
          </button>
          {showAppMenu && (
            <AppSwitcher
              currentService={service}
              onClose={() => setShowAppMenu(false)}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Icon size={22} className="text-white" />
          <span className="text-white font-bold text-lg tracking-wide">{label}</span>
        </div>
      </div>

      {/* Center: global search */}
      <div className="flex-1 flex justify-center px-6">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm chức năng"
            className="w-full pl-9 pr-4 py-1.5 rounded-md bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      {/* Right: avatar */}
      <div className="flex items-center relative" ref={avatarRef}>
        <button
          onClick={() => setAvatarOpen((o) => !o)}
          className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white hover:opacity-90 transition-opacity"
        >
          {userInitials(user)}
        </button>

        {avatarOpen && (
          <div className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {/* Top gradient section */}
            <div
              className="px-4 py-4"
              style={{ background: "linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <img src={logoUET} alt="UET Flow" className="w-[60px] h-[60px] rounded-full object-cover shadow shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 mb-1">A member of UET</p>
                  <span
                    className="inline-block text-[10px] font-medium px-2 py-0.5 rounded border"
                    style={{ color: "#ea632e", borderColor: "#ea632e" }}
                  >
                    Tài khoản tổ chức
                  </span>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-800 leading-snug truncate">
                {userDisplayName(user)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email || ""}</p>
            </div>

            <div className="border-t border-gray-100" />

            <div className="py-1">
              <button
                onClick={() => { setAvatarOpen(false); navigate("/eaccount/profile"); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>Chuyển đổi tài khoản</span>
                <ArrowLeftRight size={15} className="text-gray-400" />
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>Đăng xuất</span>
                <LogOut size={15} className="text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
