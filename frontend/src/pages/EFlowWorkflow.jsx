import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import IconSidebar from "../components/IconSidebar";
import { eAccount, eFlow } from "../services/api";
import { getAuth } from "../utils/auth";
import { showToast } from "../utils/toast";
import {
  Home,
  Settings,
  GitBranch,
  Search,
  Filter,
  Share2,
  Copy,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Layers,
  FolderOpen,
  X,
} from "lucide-react";

const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
};

const mapFlowStatus = (s) => {
  if (!s) return "Ngừng áp dụng";
  const u = String(s).toUpperCase();
  if (u === "ACTIVE" || u === "1" || u === "TRUE" || u === "DANGHOATDONG") return "Áp dụng";
  return "Ngừng áp dụng";
};

const StatusBadge = ({ status }) => {
  const isActive = status === "Áp dụng";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        isActive
          ? "bg-blue-50 text-blue-600 border-blue-200"
          : "bg-orange-50 text-orange-500 border-orange-200"
      }`}
    >
      {status}
    </span>
  );
};

const ActionIcons = ({ status, onShare, onToggleStatus, onCopy, onEdit, onDelete }) => {
  const isActive = status === "Áp dụng";
  return (
    <div className="flex items-center justify-center gap-2">
      <button title="Phân quyền"    onClick={onShare}        className="text-gray-400 hover:text-gray-600 transition-colors"><Share2      size={15} /></button>
      <button title={isActive ? "Ngừng áp dụng" : "Áp dụng"} onClick={onToggleStatus}
        className={isActive ? "text-orange-400 hover:text-orange-600 transition-colors" : "text-green-500 hover:text-green-700 transition-colors"}>
        {isActive ? <Ban size={15} /> : <CheckCircle size={15} />}
      </button>
      <button title="Sao chép"      onClick={onCopy}         className="text-gray-400 hover:text-gray-600 transition-colors"><Copy        size={15} /></button>
      <button title="Sửa"           onClick={onEdit}         className="text-gray-400 hover:text-gray-600 transition-colors"><Pencil      size={15} /></button>
      <button title="Xóa"           onClick={onDelete}       className="text-gray-400 hover:text-red-500  transition-colors"><Trash2      size={15} /></button>
    </div>
  );
};

const INIT_FORM_DEFAULT = { flowName: "", flowGroup: "", department: "", describe: "" };

export default function EFlowWorkflow() {
  const navigate = useNavigate();
  const [menuExpanded, setMenuExpanded] = useState({ manage: true, category: false });
  const [searchQuery, setSearchQuery]   = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll]       = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const [gotoPage, setGotoPage]         = useState("");
  const [activeMenu, setActiveMenu]     = useState("all");
  const [flowData,    setFlowData]    = useState([]);
  const [shareModal,  setShareModal]  = useState({ open: false, name: "" });
  const [editModal,   setEditModal]   = useState({ open: false, id: null, name: "" });
  const [statusModal, setStatusModal] = useState({ open: false, id: null, name: "", currentStatus: "" });
  const [copyModal,   setCopyModal]   = useState({ open: false, id: null, name: "" });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [orgSearch, setOrgSearch]       = useState("");
  const [userSearch, setUserSearch]     = useState("");
  const [sharedSearch, setSharedSearch] = useState("");
  const [initModal, setInitModal]       = useState({ open: false });
  const [initForm, setInitForm]         = useState(INIT_FORM_DEFAULT);
  const [initGroups, setInitGroups]     = useState([]);
  const [initSubmitting, setInitSubmitting] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null); // null = not yet loaded
  const [groups, setGroups]               = useState([]);

  const [accessDenied, setAccessDenied] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const { user } = getAuth();
    if (!user?.email) return;
    eAccount.checkAccess(user.email, 3)
      .then(r => { if (r?.hasAccess === false) setAccessDenied(true); })
      .catch(() => {});
  }, []);

  // Load groups on mount or refreshKey change
  useEffect(() => {
    eFlow.getWorkflowGroup()
      .then(d => {
        const gs = Array.isArray(d) ? d : [];
        setGroups(gs);
        if (gs.length > 0) {
          setSelectedGroup(prev => prev ?? gs[0]);
        } else {
          setSelectedGroup(""); // trigger load-all when no groups
        }
      })
      .catch(() => setSelectedGroup(""));
  }, [refreshKey]);

  // Load flows when group or page changes
  useEffect(() => {
    if (selectedGroup === null) return; // wait for groups to load
    const body = selectedGroup ? { flow_group_name: selectedGroup } : {};
    eFlow.listWorkflows(body)
      .then(data => {
        if (!data) return;
        const items = data.content ?? data.items ?? data;
        if (Array.isArray(items)) {
          setFlowData(items.map(w => ({
            id: w.id ?? w.flowId ?? w.workflowId,
            name: w.flowName ?? w.workflowName ?? w.name ?? "",
            group: w.flowGroup ?? w.groupName ?? selectedGroup ?? "",
            type: w.type ?? "Quy trình số hóa",
            createdDate: formatDate(w.flowStartDate ?? w.createdAt ?? w.createdDate),
            status: mapFlowStatus(w.status),
            appliedDate: formatDate(w.appliedAt),
            avatar: (w.ownerName ?? w.creatorName ?? "").substring(0, 2).toUpperCase() || "?",
            avatarColor: "#6d28d9",
            userName: w.ownerName ?? w.creatorName ?? "",
            userEmail: w.creatorEmail ?? "",
          })));
          setTotalItems(data.totalElements ?? items.length);
          setTotalPages(Math.max(1, data.totalPages ?? Math.ceil((data.totalElements ?? items.length) / 8)));
        }
      })
      .catch(() => {});
  }, [selectedGroup, currentPage, refreshKey]);

  const pages = Array.from({ length: Math.min(4, totalPages) }, (_, i) => i + 1);

  const toggleSelectAll = () => {
    if (selectAll) setSelectedRows([]);
    else setSelectedRows(flowData.map((r) => r.id));
    setSelectAll(!selectAll);
  };

  const toggleRow = (id) =>
    setSelectedRows((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);

  if (accessDenied) return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="eflow" />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <Settings size={28} className="text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Không có quyền truy cập</h2>
        <p className="text-sm text-gray-500">Bạn không có quyền sử dụng dịch vụ eFlow.</p>
        <button onClick={() => navigate("/erequest")} className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}>
          Quay lại trang chủ
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>

      {/* ========== HEADER ========== */}
      <AppHeader service="eflow" />

      <div className="flex flex-1 overflow-hidden">
        {/* ========== SIDEBAR ========== */}
        <aside className="flex shrink-0" style={{ width: 339 }}>
          {/* Left icon strip */}
          <IconSidebar items={[
            { key: "home",     Icon: Home,     title: "Trang chủ", onClick: () => navigate("/erequest"), active: false },
            { key: "settings", Icon: Settings, title: "Cài đặt",   onClick: () => {},                   active: true, activeColor: "text-blue-500", activeBg: "bg-blue-50" },
          ]} />

          {/* Right nav */}
          <div className="flex-1 bg-white border-r border-gray-200 overflow-y-auto">
            <nav className="p-3 space-y-1">

              {/* Quản lý quy trình */}
              <div>
                <button
                  onClick={() => setMenuExpanded((p) => ({ ...p, manage: !p.manage }))}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers size={15} />
                    <span>Quản lý quy trình</span>
                  </div>
                  {menuExpanded.manage ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {menuExpanded.manage && (
                  <div className="ml-5 mt-0.5 space-y-0.5">
                    {[
                      { key: "all",  label: "Tất cả quy trình" },
                      { key: "mine", label: "Quản lý quy trình của tôi" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setActiveMenu(key)}
                        className={`w-full text-left text-sm rounded-lg transition-colors relative ${
                          activeMenu === key
                            ? "text-blue-600 font-medium bg-blue-50"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {activeMenu === key && (
                          <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-blue-500" />
                        )}
                        <span className={`block py-2 ${activeMenu === key ? "pl-4 pr-3" : "px-3"}`}>
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
              {activeMenu === "mine" ? "Quản lý quy trình của tôi" : "Tất cả quy trình"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded bg-blue-500 hover:bg-blue-600 transition-colors"
                onClick={() => {
                  setInitForm({ ...INIT_FORM_DEFAULT, flowGroup: groups[0] ?? "" });
                  setInitGroups(groups);
                  setInitModal({ open: true });
                }}
              >
                <Plus size={15} />
                Thêm mới
              </button>
            </div>
          </div>

          {/* Group filter tabs */}
          {groups.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Nhóm:</span>
              {groups.map(g => (
                <button
                  key={g}
                  onClick={() => { setSelectedGroup(g); setCurrentPage(1); }}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selectedGroup === g
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Search & Filter */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative" style={{ width: 320 }}>
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập tên quy trình, người tạo"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors border border-gray-200 bg-white">
              <span>Bộ lọc</span>
              <Filter size={13} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-blue-50">
                    <th className="w-10 px-3 py-3 text-center">
                      <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="w-4 h-4 accent-blue-500 cursor-pointer" />
                    </th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-semibold text-blue-600">STT</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Tên quy trình</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Nhóm quy trình</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Loại quy trình</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Ngày tạo</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Trạng thái áp dụng</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Ngày áp dụng</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">Người tạo</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap sticky right-0 bg-blue-50">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flowData.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-gray-400 text-sm">
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                  {flowData.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-50 hover:bg-blue-50/20 transition-colors ${
                        selectedRows.includes(item.id) ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" checked={selectedRows.includes(item.id)} onChange={() => toggleRow(item.id)} className="w-4 h-4 accent-blue-500 cursor-pointer" />
                      </td>
                      <td className="px-3 py-3 text-gray-500 text-center">{(currentPage - 1) * 8 + index + 1}</td>
                      <td className="px-3 py-3 max-w-xs">
                        <button className="text-blue-600 hover:underline font-medium text-left" onClick={() => setEditModal({ open: true, id: item.id, name: item.name })}>{item.name}</button>
                      </td>
                      <td className="px-3 py-3 text-gray-400">{item.group}</td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{item.type}</td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{item.createdDate}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{item.appliedDate}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: item.avatarColor }}
                          >
                            {item.avatar}
                          </div>
                          {item.userName && (
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-700 truncate">{item.userName}</p>
                              <p className="text-xs text-gray-400 truncate">{item.userEmail}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 sticky right-0 bg-white">
                        <ActionIcons
                          status={item.status}
                          onShare={()        => setShareModal ({ open: true, name: item.name })}
                          onToggleStatus={()  => setStatusModal({ open: true, id: item.id, name: item.name, currentStatus: item.status })}
                          onCopy={()         => setCopyModal  ({ open: true, id: item.id, name: item.name })}
                          onEdit={()         => setEditModal  ({ open: true, id: item.id, name: item.name })}
                          onDelete={()       => setDeleteModal({ open: true, id: item.id, name: item.name })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              {/* Left: per page + count */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <select className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option>8</option>
                  <option>16</option>
                  <option>32</option>
                </select>
                <span>trong {totalItems} bản ghi</span>
              </div>

              {/* Right: page nav + goto */}
              <div className="flex items-center gap-1">
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
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                      currentPage === p
                        ? "text-blue-500 font-semibold cursor-default"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-sm text-gray-500">Đến trang</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={gotoPage}
                    onChange={(e) => setGotoPage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const p = Math.min(totalPages, Math.max(1, Number(gotoPage)));
                        setCurrentPage(p);
                        setGotoPage("");
                      }
                    }}
                    className="w-12 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========== SHARE MODAL ========== */}
      {shareModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShareModal({ open: false, name: "" })}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: "90%", maxWidth: 1200, height: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Chia sẻ quy trình</h2>
              <button
                onClick={() => setShareModal({ open: false, name: "" })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-1 overflow-hidden">

              {/* LEFT 60% */}
              <div className="flex flex-col gap-4 p-6 border-r border-gray-100 overflow-y-auto" style={{ width: "60%" }}>

                {/* Dropdown tổ chức / phòng ban */}
                <div>
                  <label className="block text-sm font-bold text-blue-600 mb-1.5">Tổ chức/ Phòng ban</label>
                  <select
                    className="w-full px-3 py-2 text-sm border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-500 text-gray-700"
                    defaultValue=""
                  >
                    <option value="" disabled>Chọn tổ chức/ phòng ban</option>
                  </select>
                </div>

                {/* 2 cột danh sách */}
                <div className="flex gap-4 flex-1 min-h-0">

                  {/* Cột 1: Danh sách người dùng */}
                  <div className="flex flex-col flex-1 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-3 pt-3 pb-2 shrink-0">
                      <p className="text-sm font-bold text-gray-700 mb-2">Danh sách người dùng và nhóm người dùng</p>
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                    <div className="border-t border-gray-100" />
                    {/* Empty list area */}
                    <div className="flex-1 overflow-y-auto" />
                    {/* Footer */}
                    <div className="px-3 py-2 border-t border-gray-100 flex justify-end shrink-0">
                      <button className="text-xs font-medium text-blue-500 border border-blue-400 px-3 py-1 rounded hover:bg-blue-50 transition-colors">
                        Chọn tất cả
                      </button>
                    </div>
                  </div>

                  {/* Cột 2: nút thêm / xóa */}
                  <div className="flex flex-col justify-end gap-2 shrink-0 pb-2">
                    <button className="text-xs font-medium text-blue-500 border border-blue-400 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors whitespace-nowrap">
                      Xóa tất cả
                    </button>
                    <button className="text-xs font-medium text-blue-500 border border-blue-400 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors">
                      Thêm
                    </button>
                  </div>
                </div>

                {/* Checkbox phân quyền */}
                <div className="flex items-center gap-2 shrink-0">
                  <input type="checkbox" id="external-perm" className="w-4 h-4 accent-blue-500 cursor-pointer" />
                  <label htmlFor="external-perm" className="text-sm text-gray-700 cursor-pointer">
                    Phân quyền ngoài hệ thống
                  </label>
                </div>
              </div>

              {/* RIGHT 40% */}
              <div className="flex flex-col p-6 overflow-y-auto" style={{ width: "40%" }}>
                <p className="text-sm font-bold text-blue-600 mb-3">Người dùng đã chia sẻ</p>

                {/* Search */}
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm"
                    value={sharedSearch}
                    onChange={(e) => setSharedSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                {/* Empty state */}
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3 opacity-30">
                    <rect x="10" y="20" width="60" height="45" rx="4" stroke="#94a3b8" strokeWidth="3" fill="none"/>
                    <path d="M10 32h60" stroke="#94a3b8" strokeWidth="2"/>
                    <rect x="20" y="40" width="20" height="3" rx="1.5" fill="#94a3b8"/>
                    <rect x="20" y="48" width="30" height="3" rx="1.5" fill="#94a3b8"/>
                    <rect x="20" y="56" width="15" height="3" rx="1.5" fill="#94a3b8"/>
                  </svg>
                  <p className="text-sm">Không có dữ liệu</p>
                </div>

                {/* Xóa tất cả */}
                <div className="flex justify-end pt-3 border-t border-gray-100 shrink-0">
                  <button className="text-xs font-medium text-blue-500 border border-blue-400 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors">
                    Xóa tất cả
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TOGGLE STATUS MODAL ========== */}
      {statusModal.open && (() => {
        const stopping = statusModal.currentStatus === "Áp dụng";
        const close = () => setStatusModal({ open: false, id: null, name: "", currentStatus: "" });
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={close}>
            <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 450 }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-end px-5 pt-4 pb-0">
                <button onClick={close} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
              <div className="flex flex-col items-center px-8 pb-6 pt-2">
                <div className="flex items-center justify-center rounded-full mb-5 shrink-0"
                  style={{ width: 60, height: 60, background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}>
                  {stopping ? (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                      <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                      <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  {stopping ? "Ngừng áp dụng quy trình?" : "Áp dụng quy trình?"}
                </h2>
                <p className="text-sm text-gray-500 text-center leading-relaxed">
                  {stopping ? "Bạn có chắc chắn muốn ngừng áp dụng quy trình" : "Bạn có chắc chắn muốn áp dụng quy trình"}{" "}
                  <span className="font-bold text-gray-700">"{statusModal.name}"</span>
                </p>
              </div>
              <div className="flex border-t border-gray-100">
                <button onClick={close}
                  className="flex-1 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-bl-2xl"
                  style={{ background: "#f1f5f9" }}>
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    const newStatus = stopping ? "Ngừng áp dụng" : "Áp dụng";
                    try {
                      await eFlow.setStatus(statusModal.id, stopping ? "INACTIVE" : "ACTIVE");
                      setFlowData(prev => prev.map(r => r.id === statusModal.id ? { ...r, status: newStatus, appliedDate: !stopping ? new Date().toLocaleDateString("vi-VN") : "" } : r));
                    } catch (err) {
                      showToast(err.message || "Cập nhật trạng thái thất bại", "error");
                    }
                    close();
                  }}
                  className="flex-1 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-br-2xl">
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========== COPY MODAL ========== */}
      {copyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setCopyModal({ open: false, id: null, name: "" })}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 450 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-end px-5 pt-4 pb-0">
              <button onClick={() => setCopyModal({ open: false, id: null, name: "" })} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex flex-col items-center px-8 pb-6 pt-2">
              <div className="flex items-center justify-center rounded-full mb-5 shrink-0"
                style={{ width: 60, height: 60, background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="17" r="0.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">Nhân bản quy trình?</h2>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Bạn có chắc chắn muốn nhân bản quy trình{" "}
                <span className="font-bold text-gray-700">"{copyModal.name}"</span>
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setCopyModal({ open: false, id: null, name: "" })}
                className="flex-1 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-bl-2xl"
                style={{ background: "#f1f5f9" }}>
                Hủy
              </button>
              <button
                onClick={async () => {
                  try {
                    await eFlow.initWorkflow({ sourceId: copyModal.id, name: `${copyModal.name} - Bản sao` });
                    showToast("Nhân bản thành công", "success");
                    setRefreshKey(k => k + 1);
                  } catch (err) {
                    showToast(err.message || "Nhân bản thất bại", "error");
                  }
                  setCopyModal({ open: false, id: null, name: "" });
                }}
                className="flex-1 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-br-2xl">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DELETE MODAL ========== */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setDeleteModal({ open: false, id: null, name: "" })}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 450 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-end px-5 pt-4 pb-0">
              <button onClick={() => setDeleteModal({ open: false, id: null, name: "" })} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="flex flex-col items-center px-8 pb-6 pt-2">
              <div className="flex items-center justify-center rounded-full mb-5 shrink-0"
                style={{ width: 60, height: 60, background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                  <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">Xóa quy trình?</h2>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Bạn có chắc chắn muốn xóa quy trình{" "}
                <span className="font-bold text-gray-700">"{deleteModal.name}"</span>
                ? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
                className="flex-1 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-bl-2xl"
                style={{ background: "#f1f5f9" }}>
                Hủy
              </button>
              <button
                onClick={async () => {
                  try {
                    await eFlow.deleteWorkflow(deleteModal.id);
                    setFlowData(prev => prev.filter(r => r.id !== deleteModal.id));
                    setSelectedRows(prev => prev.filter(id => id !== deleteModal.id));
                    showToast("Đã xóa quy trình", "success");
                  } catch (err) {
                    showToast(err.message || "Xóa thất bại", "error");
                  }
                  setDeleteModal({ open: false, id: null, name: "" });
                }}
                className="flex-1 py-3.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors rounded-br-2xl">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== EDIT CONFIRM MODAL ========== */}
      {editModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setEditModal({ open: false, id: null, name: "" })}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: 450 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex justify-end px-5 pt-4 pb-0">
              <button
                onClick={() => setEditModal({ open: false, id: null, name: "" })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col items-center px-8 pb-6 pt-2">
              {/* Question icon */}
              <div
                className="flex items-center justify-center rounded-full mb-5 shrink-0"
                style={{ width: 60, height: 60, background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="17" r="0.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">Sửa quy trình?</h2>

              {/* Description */}
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Bạn có chắc chắn muốn Sửa quy trình{" "}
                <span className="font-bold text-gray-700">"{editModal.name}"</span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setEditModal({ open: false, id: null, name: "" })}
                className="flex-1 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-bl-2xl"
                style={{ background: "#f1f5f9" }}
              >
                Quay lại
              </button>
              <button
                onClick={() => {
                  setEditModal({ open: false, id: null, name: "" });
                  navigate(`/eflow/edit/${editModal.id}`);
                }}
                className="flex-1 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-br-2xl"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== INIT WORKFLOW MODAL ========== */}
      {initModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setInitModal({ open: false })}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Tạo quy trình mới</h2>
              <button onClick={() => setInitModal({ open: false })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* flowName */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tên quy trình <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={initForm.flowName}
                  onChange={e => setInitForm(f => ({ ...f, flowName: e.target.value }))}
                  placeholder="Nhập tên quy trình"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>

              {/* flowGroup */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nhóm quy trình <span className="text-red-500">*</span>
                </label>
                {initGroups.length > 0 ? (
                  <select
                    value={initForm.flowGroup}
                    onChange={e => setInitForm(f => ({ ...f, flowGroup: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                  >
                    <option value="">-- Chọn nhóm --</option>
                    {initGroups.map((g, i) => (
                      <option key={i} value={g.groupName ?? g.name ?? g}>{g.groupName ?? g.name ?? g}</option>
                    ))}
                    <option value="__custom__">Nhóm mới...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={initForm.flowGroup}
                    onChange={e => setInitForm(f => ({ ...f, flowGroup: e.target.value }))}
                    placeholder="Nhập tên nhóm (vd: default)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                )}
                {initForm.flowGroup === "__custom__" && (
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nhập tên nhóm mới"
                    onChange={e => setInitForm(f => ({ ...f, flowGroup: e.target.value }))}
                    className="mt-2 w-full px-3 py-2 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                )}
              </div>

              {/* department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phòng ban</label>
                <input
                  type="text"
                  value={initForm.department}
                  onChange={e => setInitForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Nhập phòng ban"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>

              {/* describe */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả</label>
                <textarea
                  rows={3}
                  value={initForm.describe}
                  onChange={e => setInitForm(f => ({ ...f, describe: e.target.value }))}
                  placeholder="Nhập mô tả quy trình"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setInitModal({ open: false })}
                className="flex-1 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-bl-2xl"
                style={{ background: "#f1f5f9" }}
              >
                Hủy
              </button>
              <button
                disabled={!initForm.flowName.trim() || !initForm.flowGroup.trim() || initForm.flowGroup === "__custom__" || initSubmitting}
                onClick={async () => {
                  setInitSubmitting(true);
                  try {
                    const data = await eFlow.initWorkflow({
                      flowName: initForm.flowName.trim(),
                      flowGroup: initForm.flowGroup.trim() || "default",
                      department: initForm.department.trim(),
                      describe: initForm.describe.trim(),
                    });
                    const newId = data?.id ?? data?.workflowId ?? data?.flowId;
                    const newGroup = data?.flowGroup ?? (initForm.flowGroup.trim() || "default");
                    setInitModal({ open: false });
                    setSelectedGroup(newGroup);
                    setRefreshKey(k => k + 1);
                    if (newId) navigate(`/eflow/edit/${newId}`);
                    else navigate("/eflow/edit/new");
                  } catch (err) {
                    showToast(err.message || "Không thể tạo quy trình", "error");
                  } finally {
                    setInitSubmitting(false);
                  }
                }}
                className="flex-1 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-br-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {initSubmitting ? "Đang tạo..." : "Tạo quy trình"}
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
              className="flex items-center gap-1.5 text-white text-sm hover:text-red-300 transition-colors"
              onClick={async () => {
                const ids = [...selectedRows];
                for (const rowId of ids) {
                  try { await eFlow.deleteWorkflow(rowId); } catch {}
                }
                setFlowData(prev => prev.filter(r => !ids.includes(r.id)));
                setSelectedRows([]);
                setSelectAll(false);
                showToast(`Đã xóa ${ids.length} quy trình`, "success");
              }}
            >
              <Trash2 size={15} />
              Xóa
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
