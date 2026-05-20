import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { findForms, duplicateForm, publishForm, getForm, deleteForm } from "../services/eformApi";
import { eForm } from "../services/api";
import { eAccount } from "../services/api";
import { getAuth } from "../utils/auth";
import { showToast } from "../utils/toast";
import AppHeader from "../components/AppHeader";
import IconSidebar from "../components/IconSidebar";
import {
  Home,
  Settings,
  FileText,
  Search,
  Filter,
  Eye,
  Pencil,
  Copy,
  CheckCircle,
  Clock,
  Users,
  Cog,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Download,
  Trash2,
  Send,
  X,
} from "lucide-react";

const mapStatus = (s) => {
  if (s === "editing") return "Đang phát triển";
  if (s === 1) return "Bản nháp";
  if (s === 2) return "Hoạt động";
  if (s === 3) return "Ngừng phát hành";
  return s || "Bản nháp";
};

const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
};

const mapApiItem = (item) => ({
  id: item.formId,
  name: item.formName,
  dateRange: [formatDate(item.beginTime), formatDate(item.endTime)],
  tags: item.tag || [],
  status: mapStatus(item.statusForm),
  createdDate: formatDate(item.createdDate),
});

const statusConfig = {
  "Đang phát triển": { bg: "bg-orange-50", text: "text-orange-500", border: "border-orange-200" },
  "Bản nháp":        { bg: "bg-purple-50", text: "text-purple-500", border: "border-purple-200" },
  "Hoạt động":       { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200" },
};

function PreviewBlock({ block }) {
  const { type } = block;
  const label = block.label || block.title || block.name || "";
  const placeholder = block.placeholder || "";

  switch (type) {
    case "text":
      return <input type="text" readOnly placeholder={placeholder || "Nhập text..."} className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-500" />;
    case "heading-1":
      return <p className="text-2xl font-bold text-gray-800">{label || "Heading 1"}</p>;
    case "heading-2":
      return <p className="text-xl font-bold text-gray-700">{label || "Heading 2"}</p>;
    case "heading-3":
      return <p className="text-lg font-semibold text-gray-700">{label || "Heading 3"}</p>;
    case "bulleted-list":
    case "multiline":
    case "multi-input":
      return <textarea readOnly rows={3} placeholder={placeholder || "Nhập text..."} className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm resize-none bg-gray-50 text-gray-500" />;
    case "button":
      return <button disabled className="px-4 py-1.5 bg-orange-300 text-white text-sm rounded cursor-not-allowed">{label || "Button"}</button>;
    case "input-text":
      return (
        <div className="space-y-1">
          {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
          <input type="text" readOnly placeholder={placeholder || "Nhập text..."} className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-500" />
        </div>
      );
    case "number":
      return (
        <div className="space-y-1">
          {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
          <input type="number" readOnly placeholder="0" className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-500" />
        </div>
      );
    case "date":
      return (
        <div className="space-y-1">
          {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
          <input type="date" readOnly className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-500" />
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled className="w-4 h-4 accent-orange-500" />
          <span className="text-sm text-gray-600">{label || "Checkbox"}</span>
        </label>
      );
    case "dropdown":
      return (
        <div className="space-y-1">
          {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
          <select disabled className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-400 bg-gray-50">
            <option>-- Chọn --</option>
          </select>
        </div>
      );
    case "file-upload":
      return (
        <div className="space-y-1">
          {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
          <div className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-400 bg-gray-50 w-fit">
            Tải lên tệp
          </div>
        </div>
      );
    case "divider":
      return <hr className="border-gray-200 my-1" />;
    case "row":
    case "column":
    case "step":
    case "tab":
    case "splitter":
      return (
        <div className="border border-dashed border-gray-300 rounded p-4 min-h-10 bg-gray-50">
          <span className="text-xs text-gray-400 uppercase tracking-wider">{type}</span>
          {Array.isArray(block.children) && block.children.length > 0 && (
            <div className="mt-2 space-y-2">
              {block.children.map((child) => <PreviewBlock key={child.id} block={child} />)}
            </div>
          )}
        </div>
      );
    default:
      return label ? <p className="text-sm text-gray-600">{label}</p> : null;
  }
}

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {status}
    </span>
  );
};

function InteractiveBlock({ block, values, onChange }) {
  const { type, id } = block;
  const label = block.label || block.title || block.name || "";
  const placeholder = block.placeholder || "";
  const val = values[id] ?? "";
  const cls = "w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400";

  switch (type) {
    case "text":
    case "input-text":
      return (
        <div className="space-y-1">
          {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
          <input type="text" value={val} onChange={e => onChange(id, e.target.value)} placeholder={placeholder || "Nhập text..."} className={cls} />
        </div>
      );
    case "number":
      return (
        <div className="space-y-1">
          {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
          <input type="number" value={val} onChange={e => onChange(id, e.target.value)} placeholder="0" className={cls} />
        </div>
      );
    case "date":
      return (
        <div className="space-y-1">
          {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
          <input type="date" value={val} onChange={e => onChange(id, e.target.value)} className={cls} />
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!val} onChange={e => onChange(id, e.target.checked)} className="w-4 h-4 accent-orange-500" />
          <span className="text-sm text-gray-600">{label || "Checkbox"}</span>
        </label>
      );
    case "dropdown":
      return (
        <div className="space-y-1">
          {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
          <select value={val} onChange={e => onChange(id, e.target.value)} className={cls}>
            <option value="">-- Chọn --</option>
            {Array.isArray(block.options) && block.options.map((opt, i) => (
              <option key={i} value={opt.value ?? opt}>{opt.label ?? opt}</option>
            ))}
          </select>
        </div>
      );
    case "bulleted-list":
    case "multiline":
    case "multi-input":
      return (
        <div className="space-y-1">
          {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
          <textarea rows={3} value={val} onChange={e => onChange(id, e.target.value)} placeholder={placeholder || "Nhập text..."} className={`${cls} resize-none`} />
        </div>
      );
    case "heading-1":
      return <p className="text-2xl font-bold text-gray-800">{label || "Heading 1"}</p>;
    case "heading-2":
      return <p className="text-xl font-bold text-gray-700">{label || "Heading 2"}</p>;
    case "heading-3":
      return <p className="text-lg font-semibold text-gray-700">{label || "Heading 3"}</p>;
    case "divider":
      return <hr className="border-gray-200 my-1" />;
    case "row":
    case "column":
    case "step":
    case "tab":
    case "splitter":
      return (
        <div className="border border-dashed border-gray-300 rounded p-4 min-h-10 bg-gray-50">
          <span className="text-xs text-gray-400 uppercase tracking-wider">{type}</span>
          {Array.isArray(block.children) && block.children.length > 0 && (
            <div className="mt-2 space-y-2">
              {block.children.map((child) => <InteractiveBlock key={child.id} block={child} values={values} onChange={onChange} />)}
            </div>
          )}
        </div>
      );
    default:
      return label ? <p className="text-sm text-gray-600">{label}</p> : null;
  }
}

const ActionIcons = ({ status, onView, onEdit, onCopy, onPublish, onRenew, onPerm, onConfig, onDelete }) => {
  const isPublished = status === "Hoạt động";
  return (
    <div className="flex items-center justify-center gap-2">
      {[
        { Icon: Eye,         title: "Xem",        onClick: onView,    cls: "text-gray-400 hover:text-gray-600" },
        { Icon: Pencil,      title: "Sửa",        onClick: onEdit,    cls: "text-gray-400 hover:text-gray-600" },
        { Icon: Copy,        title: "Sao chép",   onClick: onCopy,    cls: "text-gray-400 hover:text-gray-600" },
        { Icon: CheckCircle, title: "Phát hành",  onClick: onPublish, cls: "text-gray-400 hover:text-gray-600" },
        { Icon: Clock,       title: "Gia hạn",    onClick: onRenew,   cls: "text-gray-400 hover:text-gray-600" },
        { Icon: Users,       title: "Phân quyền", onClick: onPerm,    cls: "text-gray-400 hover:text-gray-600" },
        { Icon: Cog,         title: "Cấu hình",   onClick: onConfig,  cls: "text-gray-400 hover:text-gray-600" },
      ].map(({ Icon, title, onClick, cls }, i) => (
        <button key={i} title={title} onClick={onClick ?? undefined} className={`${cls} transition-colors`}>
          <Icon size={15} />
        </button>
      ))}
      <button
        title={isPublished ? "Không thể xóa biểu mẫu đang phát hành" : "Xóa"}
        onClick={isPublished ? undefined : onDelete}
        disabled={isPublished}
        className={`transition-colors ${isPublished ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-red-500"}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

export default function EFormTemplate() {
  const navigate = useNavigate();
  const [menuExpanded, setMenuExpanded] = useState({ process: true });

  const [activeSection, setActiveSection] = useState("my-forms");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading,    setLoading]    = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const { user } = getAuth();
    if (!user?.email) return;
    eAccount.checkAccess(user.email, 2)
      .then(r => { if (r?.hasAccess === false) setAccessDenied(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeSection === "shared-forms") return;
    setLoading(true);
    findForms({}, currentPage - 1, 8)
      .then(data => {
        setFormData((data.content || []).map(mapApiItem));
        setTotalItems(data.totalElements ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => { setFormData([]); setTotalItems(0); setTotalPages(1); })
      .finally(() => setLoading(false));
  }, [currentPage, activeSection, refreshKey]);

  const [formData,     setFormData]     = useState([]);
  const [viewModal,    setViewModal]    = useState({ open: false, item: null });
  const [previewBlocks,  setPreviewBlocks]  = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError,   setPreviewError]   = useState(false);
  const [formValues,   setFormValues]   = useState({});
  const [submittingForm, setSubmittingForm] = useState(false);
  const [copyModal,    setCopyModal]    = useState({ open: false, item: null });
  const [publishModal, setPublishModal] = useState({ open: false, item: null });
  const [renewModal,   setRenewModal]   = useState({ open: false, item: null, startDate: "", endDate: "" });
  const [permModal,    setPermModal]    = useState({ open: false, item: null });
  const [configModal,  setConfigModal]  = useState({ open: false, item: null });
  const [deleteModal,  setDeleteModal]  = useState({ open: false, item: null });
  const [deleting,     setDeleting]     = useState(false);

  const isShared  = activeSection === "shared-forms";
  const tableData = isShared ? [] : formData;
  const PAGE_SIZE = 8;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem   = Math.min(currentPage * PAGE_SIZE, totalItems);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAll(false);
    setSearchQuery("");
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(tableData.map((t) => t.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleExport = (rows) => {
    const data = rows ?? formData;
    const header = "formId,formName,status";
    const csv = [header, ...data.map(f => `${f.id},"${f.name}",${f.status}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forms.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const windowStart = Math.max(1, Math.min(currentPage - 1, totalPages - 3));
  const pages = isShared ? [] : Array.from(
    { length: Math.min(4, totalPages) },
    (_, i) => windowStart + i
  );

  if (accessDenied) return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="eform" />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
          <Settings size={28} className="text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Không có quyền truy cập</h2>
        <p className="text-sm text-gray-500">Bạn không có quyền sử dụng dịch vụ eForm.</p>
        <button onClick={() => navigate("/erequest")} className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
          Quay lại trang chủ
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#f2f5f8] flex flex-col"
      style={{ fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif" }}
    >
      {/* ========== TOP NAVBAR ========== */}
      <AppHeader service="eform" />

      <div className="flex flex-1 overflow-hidden">
        {/* ========== SIDEBAR ========== */}
        <aside className="flex shrink-0" style={{ width: 339 }}>
          {/* Left icon strip */}
          <IconSidebar items={[
            { key: "home",     Icon: Home,     title: "Trang chủ",  onClick: () => navigate("/erequest"), active: false },
            { key: "settings", Icon: Settings, title: "Cài đặt",    onClick: () => {},                   active: true  },
          ]} />

          {/* Right nav */}
          <div className="flex-1 bg-white border-r border-gray-200 overflow-y-auto">
            <nav className="p-3 space-y-1">

              {/* Biểu mẫu quy trình */}
              <div>
                <button
                  onClick={() => setMenuExpanded((p) => ({ ...p, process: !p.process }))}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={15} />
                    <span>Biểu mẫu quy trình</span>
                  </div>
                  {menuExpanded.process ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {menuExpanded.process && (
                  <div className="ml-5 mt-0.5 space-y-0.5">
                    {[
                      { key: "my-forms",     label: "Biểu mẫu của tôi" },
                      { key: "shared-forms", label: "Biểu mẫu được chia sẻ" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleSectionChange(key)}
                        className={`w-full text-left text-sm rounded-lg transition-colors relative ${
                          activeSection === key
                            ? "text-orange-500 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {activeSection === key && (
                          <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-orange-500" />
                        )}
                        <span className={`block py-2 ${activeSection === key ? "pl-4 pr-3" : "px-3"}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </nav>
          </div>
        </aside>

        {/* ========== MAIN CONTENT ========== */}
        <main className="flex-1 overflow-auto p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold" style={{ color: "#00204d" }}>
              {isShared ? "Biểu mẫu được chia sẻ" : "Quản lý biểu mẫu"}
            </h1>
            <div className="flex items-center gap-2">
              {!isShared && (
                <button
                  onClick={() => navigate("/eform/form-builder/new")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded"
                  style={{ background: "radial-gradient(675.45% 140.67% at 98.93% 0%, #f3a23c 0%, #f2513c 100%)" }}
                >
                  <Plus size={15} />
                  Thêm mới
                </button>
              )}
              <button
                onClick={() => handleExport()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
              >
                <Download size={15} />
                Xuất dữ liệu
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative" style={{ width: 320 }}>
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={isShared ? "Nhập tên biểu mẫu, tags, người tạo" : "Nhập tên biểu mẫu, tags"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 bg-white"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors border border-gray-200 bg-white">
              <span>Bộ lọc</span>
              <Filter size={13} />
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200" style={{ backgroundColor: "#fdf1ec" }}>
                    <th className="w-10 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                      />
                    </th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-semibold text-gray-600">STT</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Tên biểu mẫu</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Ngày hiệu lực</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Tags</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Trạng thái</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Ngày tạo</th>
                    {isShared && (
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Người tạo</th>
                    )}
                    <th
                      className="px-3 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap sticky right-0"
                      style={{ backgroundColor: "#fdf1ec" }}
                    >
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={isShared ? 8 : 7} className="py-8 text-center text-gray-400 text-sm">
                        Đang tải...
                      </td>
                    </tr>
                  )}
                  {!loading && tableData.length === 0 && (
                    <tr>
                      <td colSpan={isShared ? 8 : 7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          {/* Illustration: person with magnifying glass searching document */}
                          <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Document stack background */}
                            <rect x="20" y="30" width="72" height="88" rx="6" fill="#ede9fe" />
                            <rect x="26" y="24" width="72" height="88" rx="6" fill="#ddd6fe" />
                            <rect x="32" y="18" width="72" height="88" rx="6" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="1.5"/>
                            {/* Document lines */}
                            <rect x="44" y="36" width="36" height="4" rx="2" fill="#c4b5fd"/>
                            <rect x="44" y="46" width="48" height="3" rx="1.5" fill="#ddd6fe"/>
                            <rect x="44" y="54" width="40" height="3" rx="1.5" fill="#ddd6fe"/>
                            <rect x="44" y="62" width="44" height="3" rx="1.5" fill="#ddd6fe"/>
                            {/* Person body */}
                            <ellipse cx="108" cy="115" rx="18" ry="8" fill="#fed7aa" opacity="0.5"/>
                            <rect x="96" y="85" width="24" height="32" rx="8" fill="#fb923c"/>
                            {/* Person head */}
                            <circle cx="108" cy="72" r="14" fill="#fdba74"/>
                            {/* Person hair */}
                            <path d="M94 68 Q98 58 108 56 Q118 58 122 68" fill="#92400e"/>
                            {/* Person eyes */}
                            <circle cx="104" cy="70" r="2" fill="#7c3aed"/>
                            <circle cx="112" cy="70" r="2" fill="#7c3aed"/>
                            {/* Magnifying glass handle */}
                            <line x1="88" y1="105" x2="76" y2="118" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round"/>
                            {/* Magnifying glass circle */}
                            <circle cx="96" cy="97" r="14" stroke="#7c3aed" strokeWidth="3" fill="white" fillOpacity="0.9"/>
                            <circle cx="96" cy="97" r="14" stroke="#a78bfa" strokeWidth="1.5" fill="none"/>
                            {/* Search lines inside magnifier */}
                            <rect x="89" y="94" width="14" height="2.5" rx="1.25" fill="#bfdbfe"/>
                            <rect x="89" y="99" width="10" height="2.5" rx="1.25" fill="#bfdbfe"/>
                            {/* Sparkles / stars */}
                            <circle cx="38" cy="20" r="3" fill="#fbbf24" opacity="0.7"/>
                            <circle cx="135" cy="40" r="2" fill="#a78bfa" opacity="0.7"/>
                            <circle cx="145" cy="70" r="3" fill="#93c5fd" opacity="0.7"/>
                            <circle cx="25" cy="95" r="2" fill="#fb923c" opacity="0.6"/>
                          </svg>
                          <p className="text-base font-bold text-gray-600">Không có kết quả tìm kiếm phù hợp</p>
                          <p className="text-sm text-gray-400">Hãy thử tìm kiếm từ khóa khác</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {tableData.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-50 hover:bg-orange-50/20 transition-colors ${
                        selectedRows.includes(item.id) ? "bg-orange-50/40" : ""
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(item.id)}
                          onChange={() => toggleRow(item.id)}
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3 text-gray-500 text-center">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-3 py-3 text-gray-800 font-medium max-w-xs">
                        <span>{item.name}</span>
                      </td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                        {item.dateRange[0]} – {item.dateRange[1]}
                      </td>
                      <td className="px-3 py-3 text-gray-400">
                        <div className="flex gap-1">{item.tags}</div>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{item.createdDate}</td>
                      {isShared && (
                        <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{item.createdBy}</td>
                      )}
                      <td className="px-3 py-3 sticky right-0 bg-white">
                        <ActionIcons
                          status={item.status}
                          onView={() => {
                            setViewModal({ open: true, item });
                            setPreviewBlocks([]);
                            setPreviewError(false);
                            setPreviewLoading(true);
                            setFormValues({});
                            getForm(item.id)
                              .then(data => {
                                try {
                                  const raw = Array.isArray(data?.components)
                                    ? data.components
                                    : JSON.parse(data?.jsonForm ?? "[]");
                                  setPreviewBlocks(Array.isArray(raw) ? raw : []);
                                } catch {
                                  setPreviewBlocks([]);
                                }
                              })
                              .catch(() => setPreviewError(true))
                              .finally(() => setPreviewLoading(false));
                          }}
                          onEdit={()    => navigate(`/eform/form-builder/${item.id}`)}
                          onCopy={()    => setCopyModal({ open: true, item })}
                          onPublish={()  => setPublishModal({ open: true, item })}
                          onRenew={()   => setRenewModal({ open: true, item, startDate: item.dateRange[0], endDate: item.dateRange[1] })}
                          onPerm={()    => setPermModal({ open: true, item })}
                          onConfig={()  => setConfigModal({ open: true, item })}
                          onDelete={()  => setDeleteModal({ open: true, item })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end px-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500 mr-2">
                  {totalItems === 0
                    ? "Không có dữ liệu"
                    : `Hiển thị ${startItem} - ${endItem} trên tổng ${totalItems}`}
                </span>
                <button
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                {pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    disabled={currentPage === p}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                      currentPage === p
                        ? "text-orange-500 font-semibold cursor-default"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {!isShared && pages.length > 0 && pages[pages.length - 1] < totalPages && (
                  <>
                    {pages[pages.length - 1] < totalPages - 1 && (
                      <span className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 flex items-center justify-center rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========== MODAL: XEM TRƯỚC / NHẬP DỮ LIỆU ========== */}
      {viewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setViewModal({ open: false, item: null })}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: "90%", maxWidth: 900, maxHeight: "85vh" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">{viewModal.item?.name}</h2>
              <button onClick={() => setViewModal({ open: false, item: null })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 320 }}>
              {previewLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : previewError ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  Không thể tải nội dung biểu mẫu.
                </div>
              ) : previewBlocks.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  Không có nội dung để xem trước.
                </div>
              ) : (
                <div className="space-y-3 max-w-2xl mx-auto">
                  {previewBlocks.map((block) => (
                    <InteractiveBlock
                      key={block.id}
                      block={block}
                      values={formValues}
                      onChange={(id, val) => setFormValues(prev => ({ ...prev, [id]: val }))}
                    />
                  ))}
                </div>
              )}
            </div>
            {!previewLoading && !previewError && previewBlocks.length > 0 && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
                <button onClick={() => setViewModal({ open: false, item: null })}
                  className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Đóng
                </button>
                <button
                  disabled={submittingForm}
                  onClick={async () => {
                    setSubmittingForm(true);
                    try {
                      await eForm.submitFormData({ formId: viewModal.item?.id, data: formValues });
                      showToast("Đã gửi dữ liệu biểu mẫu", "success");
                      setViewModal({ open: false, item: null });
                      setFormValues({});
                    } catch (err) {
                      showToast(err.message || "Gửi thất bại", "error");
                    } finally {
                      setSubmittingForm(false);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60 transition-colors"
                  style={{ background: "radial-gradient(675.45% 140.67% at 98.93% 0%, #f3a23c 0%, #f2513c 100%)" }}
                >
                  <Send size={14} />
                  {submittingForm ? "Đang gửi..." : "Gửi dữ liệu"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== MODAL: SAO CHÉP (NHÂN BẢN) ========== */}
      {copyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setCopyModal({ open: false, item: null })}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 450 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-end px-5 pt-4 pb-0">
              <button onClick={() => setCopyModal({ open: false, item: null })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center px-8 pb-6 pt-2">
              <div className="flex items-center justify-center rounded-full mb-5 shrink-0"
                style={{ width: 60, height: 60, background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="17" r="0.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">Nhân bản biểu mẫu?</h2>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Bạn có chắc chắn muốn nhân bản biểu mẫu{" "}
                <span className="font-bold text-gray-700">"{copyModal.item?.name}"</span>
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setCopyModal({ open: false, item: null })}
                className="flex-1 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-bl-2xl"
                style={{ background: "#f1f5f9" }}>
                Hủy
              </button>
              <button
                onClick={async () => {
                  const src = copyModal.item;
                  setCopyModal({ open: false, item: null });
                  try {
                    await duplicateForm(src?.id);
                    setRefreshKey(k => k + 1);
                  } catch {
                    setFormData(prev => [...prev, {
                      ...src,
                      id: Date.now(),
                      name: `${src.name} - Bản sao`,
                      status: "Bản nháp",
                      createdDate: new Date().toLocaleDateString("vi-VN"),
                    }]);
                  }
                }}
                className="flex-1 py-3.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors rounded-br-2xl">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: PHÁT HÀNH ========== */}
      {publishModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setPublishModal({ open: false, item: null })}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 450 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-end px-5 pt-4 pb-0">
              <button onClick={() => setPublishModal({ open: false, item: null })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center px-8 pb-6 pt-2">
              <div className="flex items-center justify-center rounded-full mb-5 shrink-0"
                style={{ width: 60, height: 60, background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                  <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">Phát hành biểu mẫu?</h2>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Bạn có chắc chắn muốn phát hành biểu mẫu{" "}
                <span className="font-bold text-gray-700">"{publishModal.item?.name}"</span>
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setPublishModal({ open: false, item: null })}
                className="flex-1 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-bl-2xl"
                style={{ background: "#f1f5f9" }}>
                Hủy
              </button>
              <button
                onClick={async () => {
                  const item = publishModal.item;
                  setPublishModal({ open: false, item: null });
                  try {
                    await publishForm(item?.id);
                    setRefreshKey(k => k + 1);
                  } catch {
                    setFormData(prev => prev.map(r => r.id === item?.id ? { ...r, status: "Hoạt động" } : r));
                  }
                }}
                className="flex-1 py-3.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors rounded-br-2xl">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: GIA HẠN ========== */}
      {renewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setRenewModal({ open: false, item: null, startDate: "", endDate: "" })}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 450 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Gia hạn hiệu lực</h2>
              <button onClick={() => setRenewModal({ open: false, item: null, startDate: "", endDate: "" })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4 px-6 py-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày bắt đầu</label>
                <input type="date" value={renewModal.startDate}
                  onChange={e => setRenewModal(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngày kết thúc</label>
                <input type="date" value={renewModal.endDate}
                  onChange={e => setRenewModal(p => ({ ...p, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400" />
              </div>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setRenewModal({ open: false, item: null, startDate: "", endDate: "" })}
                className="flex-1 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-bl-2xl"
                style={{ background: "#f1f5f9" }}>
                Hủy
              </button>
              <button
                onClick={() => {
                  const id = renewModal.item?.id;
                  setFormData(prev => prev.map(r => r.id === id ? { ...r, dateRange: [renewModal.startDate, renewModal.endDate] } : r));
                  setRenewModal({ open: false, item: null, startDate: "", endDate: "" });
                }}
                className="flex-1 py-3.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors rounded-br-2xl">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: PHÂN QUYỀN ========== */}
      {permModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setPermModal({ open: false, item: null })}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 480 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Phân quyền biểu mẫu</h2>
              <button onClick={() => setPermModal({ open: false, item: null })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4 px-6 py-5">
              <div className="flex gap-2">
                <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400">
                  <option value="">Chọn người dùng</option>
                </select>
                <button className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                  Thêm
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg" style={{ minHeight: 160 }}>
                <div className="flex items-center justify-center h-40 text-gray-400">
                  <div className="text-center">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Chưa có người dùng</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end px-6 pb-5">
              <button onClick={() => setPermModal({ open: false, item: null })}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: CẤU HÌNH ========== */}
      {configModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setConfigModal({ open: false, item: null })}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 480 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Cấu hình biểu mẫu</h2>
              <button onClick={() => setConfigModal({ open: false, item: null })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-0 px-6 py-5">
              {[
                { label: "Mã biểu mẫu",    value: `BM-${String(configModal.item?.id).padStart(4, "0")}` },
                { label: "Tên biểu mẫu",   value: configModal.item?.name },
                { label: "Ngày tạo",        value: configModal.item?.createdDate },
                { label: "Trạng thái",      value: configModal.item?.status },
                { label: "Ngày hiệu lực",   value: configModal.item ? `${configModal.item.dateRange[0]} – ${configModal.item.dateRange[1]}` : "" },
              ].map(({ label, value }, i) => (
                <div key={i} className={`flex items-start py-3 ${i < 4 ? "border-b border-gray-100" : ""}`}>
                  <span className="w-36 text-sm font-semibold text-gray-500 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end px-6 pb-5">
              <button onClick={() => setConfigModal({ open: false, item: null })}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: XÓA BIỂU MẪU ========== */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => !deleting && setDeleteModal({ open: false, item: null })}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 450 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-end px-5 pt-4 pb-0">
              <button onClick={() => setDeleteModal({ open: false, item: null })} disabled={deleting} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center px-8 pb-6 pt-2">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4 shrink-0">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Xóa biểu mẫu?</h2>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Hành động này <span className="font-bold text-red-500">không thể hoàn tác</span>. Biểu mẫu{" "}
                <span className="font-bold text-gray-700">"{deleteModal.item?.name}"</span> và tất cả phiên bản sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setDeleteModal({ open: false, item: null })} disabled={deleting}
                className="flex-1 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-bl-2xl"
                style={{ background: "#f1f5f9" }}>
                Hủy
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteForm(deleteModal.item?.id);
                    showToast("Đã xóa biểu mẫu", "success");
                    setFormData(prev => prev.filter(f => f.id !== deleteModal.item?.id));
                    setSelectedRows(prev => prev.filter(id => id !== deleteModal.item?.id));
                    setDeleteModal({ open: false, item: null });
                  } catch (err) {
                    const msg = err.message || "Xóa thất bại";
                    if (msg.includes("đang phát hành") || msg.includes("409") || err.status === 409) {
                      showToast("Không thể xóa biểu mẫu đang được sử dụng hoặc đã phát hành", "error");
                    } else {
                      showToast(msg, "error");
                    }
                    setDeleteModal({ open: false, item: null });
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-3.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors rounded-br-2xl disabled:opacity-60">
                {deleting ? "Đang xóa..." : "Xóa biểu mẫu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating action bar */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 px-5 py-3 bg-slate-700 rounded-xl shadow-2xl">
            <span className="text-white text-sm font-medium whitespace-nowrap">
              Đã chọn ({selectedRows.length}):
            </span>
            <button
              onClick={() => handleExport(formData.filter(f => selectedRows.includes(f.id)))}
              className="flex items-center gap-1.5 text-white text-sm hover:text-orange-300 transition-colors"
            >
              <Download size={15} />
              Xuất dữ liệu
            </button>
            <button
              onClick={() => { setSelectedRows([]); setSelectAll(false); }}
              className="text-white hover:text-gray-300 transition-colors ml-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
