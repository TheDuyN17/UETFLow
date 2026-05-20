import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

const SEARCH_INDEX = [
  { label: "eForm — Quản lý biểu mẫu",           keywords: "eform bieu mau form quan ly thiet ke template",   path: "/eform",            icon: "📝", category: "Module" },
  { label: "eFlow — Quản lý quy trình",           keywords: "eflow quy trinh workflow flow thiet ke process",  path: "/eflow",            icon: "🔀", category: "Module" },
  { label: "eRequest — Yêu cầu / Ticket",         keywords: "erequest yeu cau ticket request giao dich",      path: "/erequest",         icon: "📥", category: "Module" },
  { label: "eAi — Trích xuất PDF bằng AI",        keywords: "eai ai trich xuat pdf gemini upload tai len",    path: "/eai",              icon: "🤖", category: "Module" },
  { label: "eAccount — Quản lý tài khoản",        keywords: "eaccount tai khoan account user quan ly nhan vien", path: "/eaccount",      icon: "👥", category: "Module" },
  { label: "Tạo biểu mẫu mới",                   keywords: "tao bieu mau moi form new create them",           path: "/eform",            icon: "➕", category: "eForm" },
  { label: "Tạo quy trình mới",                   keywords: "tao quy trinh moi flow new them workflow",       path: "/eflow",            icon: "➕", category: "eFlow" },
  { label: "Giao dịch cần xử lý (Phê duyệt)",    keywords: "phe duyet can xu ly approve pending kanban giao dich xu ly", path: "/erequest", icon: "✅", category: "eRequest" },
  { label: "Tải lên PDF / Trích xuất AI",         keywords: "tai len upload pdf trich xuat extract ai scan", path: "/eai",              icon: "📤", category: "eAi" },
  { label: "Hồ sơ cá nhân",                       keywords: "ho so ca nhan profile tai khoan account setting", path: "/eaccount/profile", icon: "👤", category: "eAccount" },
  { label: "Quản lý nhân viên",                   keywords: "quan ly nhan vien staff user management",        path: "/eaccount/staff",   icon: "👔", category: "eAccount" },
];

// Normalize: lowercase + strip Vietnamese diacritics
const normalize = (str) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");

export default function GlobalSearch() {
  const [query, setQuery]         = useState("");
  const [open, setOpen]           = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate      = useNavigate();
  const containerRef  = useRef(null);
  const inputRef      = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = normalize(query);
    return SEARCH_INDEX.filter(
      (item) => normalize(item.label).includes(q) || normalize(item.keywords).includes(q)
    ).slice(0, 8);
  }, [query]);

  useEffect(() => { setActiveIdx(0); }, [results.length]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const select = (item) => {
    navigate(item.path);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); select(results[activeIdx]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={containerRef} className="relative w-full" data-testid="global-search">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Tìm kiếm chức năng"
        className="w-full pl-9 pr-4 py-1.5 rounded-md bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
        data-testid="global-search-input"
        autoComplete="off"
      />

      {open && results.length > 0 && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-[9999]"
          data-testid="global-search-dropdown"
        >
          {results.map((item, idx) => (
            <button
              key={item.path + item.label}
              type="button"
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-gray-50 last:border-b-0 transition-colors ${
                idx === activeIdx ? "bg-orange-50" : "hover:bg-gray-50"
              }`}
              onClick={() => select(item)}
              onMouseEnter={() => setActiveIdx(idx)}
              data-testid={`global-search-item-${idx}`}
            >
              <span className="text-xl w-6 text-center shrink-0">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-800 truncate">{item.label}</div>
                <div className="text-xs text-gray-400">{item.category}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-lg shadow-xl border border-gray-100 px-4 py-5 text-sm text-gray-400 text-center z-[9999]"
          data-testid="global-search-empty"
        >
          Không tìm thấy chức năng nào phù hợp
        </div>
      )}
    </div>
  );
}
