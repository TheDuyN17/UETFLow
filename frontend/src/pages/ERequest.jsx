import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import IconSidebar from "../components/IconSidebar";
import { eRequest } from "../services/api";
import { showToast } from "../utils/toast";
import {
  Home,
  User,
  Users,
  Settings,
  RefreshCw,
  FileText,
  GitBranch,
  Grid3X3,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Calendar,
  ArrowRight,
  LayoutGrid,
  List,
  Plus,
  Download,
  Filter,
  Table2,
  MessageSquare,
  Paperclip,
} from "lucide-react";

const CARDS = [
  { id: 1,  name: "Tạm ứng",                          desc: "Quy trình phê duyệt tạm ứng kinh phí",           color: "#f97316" },
  { id: 2,  name: "Quy trình sáng kiến cải tiến",      desc: "Đề xuất và phê duyệt sáng kiến cải tiến",        color: "#16a34a" },
  { id: 3,  name: "Biên bản nghiệm thu",               desc: "Nghiệm thu kết quả thực hiện công việc",          color: "#d97706" },
  { id: 4,  name: "Phiếu đánh giá nhà cung cấp",       desc: "Đánh giá năng lực và chất lượng nhà cung cấp",   color: "#f97316" },
  { id: 5,  name: "Báo cáo kết quả kiểm định",         desc: "Kiểm định thiết bị và báo cáo kết quả",          color: "#16a34a" },
  { id: 6,  name: "Phiếu yêu cầu mua hàng",           desc: "Yêu cầu mua sắm vật tư, thiết bị",               color: "#d97706" },
  { id: 7,  name: "Biên bản bàn giao tài sản",         desc: "Bàn giao và tiếp nhận tài sản cố định",          color: "#0891b2" },
  { id: 8,  name: "Đơn xin nghỉ phép",                desc: "Đề nghị nghỉ phép và phê duyệt",                  color: "#16a34a" },
  { id: 9,  name: "Thẻ cải tiến",                     desc: "Ghi nhận và theo dõi thẻ cải tiến quy trình",     color: "#d97706" },
  { id: 10, name: "Quy trình phê duyệt ngân sách",     desc: "Lập và phê duyệt kế hoạch ngân sách",            color: "#f97316" },
  { id: 11, name: "Quy trình lập báo cáo PTSC",        desc: "Báo cáo định kỳ theo tiêu chuẩn PTSC",           color: "#16a34a" },
];

function KanbanCard({ name, received, creator, step, stepColor, color, fileCount = 0, commentCount = 0, attachCount = 0, transactionId = 1 }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/erequest/transaction/${transactionId}`)}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {/* Name */}
      <p className="text-sm font-bold text-gray-800 leading-snug mb-2">{name}</p>

      {/* Date received */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
        <Calendar size={11} className="shrink-0" />
        <span>Ngày tiếp nhận: {received}</span>
      </div>

      {/* Creator */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-2.5 truncate">
        <User size={11} className="shrink-0" />
        <span className="truncate">{creator}</span>
      </div>

      {/* Step badge */}
      <span
        className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3"
        style={{ backgroundColor: `${stepColor}18`, color: stepColor }}
      >
        {step}
      </span>

      {/* Icon counters + workflow icon */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#d97706" }}>
            <FileText size={12} style={{ color: "#d97706" }} />
            {fileCount}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#7c3aed" }}>
            <MessageSquare size={12} style={{ color: "#7c3aed" }} />
            {commentCount}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
            <Paperclip size={12} />
            {attachCount}
          </span>
        </div>
        <div className="flex items-center justify-center">
          <GitBranch size={13} className="text-gray-300" />
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ label, count, color, cards }) {
  return (
    <div
      className="flex flex-col bg-white rounded-xl shadow-sm shrink-0 overflow-hidden"
      style={{
        width: 280,
        border: `1px solid #e5e7eb`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0 bg-white">
        <span className="text-sm font-bold text-gray-700">{label}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {count}
        </span>
      </div>
      {/* Cards — fixed max height with scroll */}
      <div className="overflow-y-auto p-3 space-y-2 bg-gray-50" style={{ maxHeight: "70vh" }}>
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300">
            <Table2 size={28} className="mb-2 opacity-40" />
            <p className="text-xs">Không có dữ liệu</p>
          </div>
        ) : (
          cards.map((card, i) => <KanbanCard key={i} {...card} color={color} />)
        )}
      </div>
    </div>
  );
}

export default function ERequest() {
  const navigate = useNavigate();
  const [searchQuery,  setSearchQuery]  = useState("");
  const [viewMode,     setViewMode]     = useState("grid");
  const [activeIcon,   setActiveIcon]   = useState("home");
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [cards, setCards] = useState(CARDS);
  const [myRequests, setMyRequests] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [searchForm, setSearchForm] = useState({
    creator: "", name: "", ticketId: "", processId: "", fromDate: "", toDate: "",
  });

  useEffect(() => {
    eRequest.getMyRequests()
      .then(data => {
        const items = data?.content ?? (Array.isArray(data) ? data : []);
        setMyRequests(items);
      })
      .catch(() => {});
    eRequest.getPendingTasks()
      .then(data => {
        const items = data?.content ?? (Array.isArray(data) ? data : []);
        setPendingTasks(items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    eRequest.getMyWorkflows()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const COLORS = ["#f97316","#16a34a","#d97706","#0891b2","#7c3aed","#ec4899","#2563eb","#059669"];
          setCards(data.map((wf, i) => ({
            id: wf.flowId ?? wf.workflowId ?? wf.id ?? i,
            name: wf.workflowName ?? wf.name ?? "Quy trình",
            desc: wf.description ?? "",
            color: COLORS[i % COLORS.length],
          })));
        }
      })
      .catch(() => {});
  }, []);

  const filtered = cards.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="min-h-screen bg-[#f2f5f8] flex flex-col"
      style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}
    >
      {/* ========== HEADER ========== */}
      <AppHeader service="erequest" />

      <div className="flex flex-1 overflow-hidden">
        {/* ========== SIDEBAR (icon only) ========== */}
        <IconSidebar items={[
          { key: "home",     Icon: Home,      title: "Trang chủ",       onClick: () => setActiveIcon("home"),     active: activeIcon === "home",     activeColor: "text-white", activeBg: "bg-blue-500"   },
          { key: "user",     Icon: User,      title: "Cá nhân",         onClick: () => navigate("/eaccount/profile"),                                 active: false },
          { key: "users",    Icon: Users,     title: "Quản lý tài khoản", onClick: () => navigate("/eaccount"),                                       active: false },
          { key: "settings", Icon: Settings,  title: "Cài đặt",         onClick: () => setActiveIcon("settings"), active: activeIcon === "settings", activeColor: "text-white", activeBg: "bg-blue-500"   },
          { key: "sync",     Icon: RefreshCw, title: "Đồng bộ",         onClick: () => setActiveIcon("sync"),     active: activeIcon === "sync",     activeColor: "text-white", activeBg: "bg-purple-600" },
        ]} />

        {/* ========== MAIN CONTENT ========== */}
        {activeIcon === "sync" ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Sub-sidebar */}
            <div className="bg-white border-r border-gray-200 overflow-y-auto shrink-0" style={{ width: 250 }}>
              <div className="px-4 pt-5 pb-3">
                <p className="text-sm font-bold text-gray-800 leading-snug">Quản lý giao dịch nâng cao</p>
              </div>
              <nav className="px-2 pb-4">
                <button className="w-full text-left text-sm px-3 py-2 rounded-lg font-medium text-purple-700 bg-purple-50 transition-colors">
                  Chạy lại giao dịch
                </button>
              </nav>
            </div>

            {/* Right content */}
            <div className="flex-1 overflow-auto p-6">
              <h1 className="text-xl font-bold text-gray-800 mb-5">Chạy lại giao dịch</h1>

              {/* Search form */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Form header */}
                <button
                  onClick={() => setFormCollapsed((c) => !c)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-800">Tìm kiếm giao dịch</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Chưa tìm kiếm</span>
                    {formCollapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                  </div>
                </button>

                {!formCollapsed && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-3">
                    {/* Người tạo giao dịch */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Người tạo giao dịch</label>
                      <input
                        type="text"
                        placeholder="Nhập email người tạo giao dịch"
                        value={searchForm.creator}
                        onChange={(e) => setSearchForm((f) => ({ ...f, creator: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                      />
                    </div>

                    {/* Tên giao dịch */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tên giao dịch</label>
                      <input
                        type="text"
                        placeholder="Nhập tên giao dịch"
                        value={searchForm.name}
                        onChange={(e) => setSearchForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                      />
                    </div>

                    {/* ID ticket */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">ID ticket</label>
                      <input
                        type="text"
                        placeholder="Nhập ID ticket"
                        value={searchForm.ticketId}
                        onChange={(e) => setSearchForm((f) => ({ ...f, ticketId: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                      />
                    </div>

                    {/* ID quy trình */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">ID quy trình</label>
                      <input
                        type="text"
                        placeholder="Nhập ID quy trình"
                        value={searchForm.processId}
                        onChange={(e) => setSearchForm((f) => ({ ...f, processId: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                      />
                    </div>

                    {/* Từ ngày */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Từ ngày</label>
                      <div className="relative">
                        <input
                          type="date"
                          placeholder="DD/MM/YYYY"
                          value={searchForm.fromDate}
                          onChange={(e) => setSearchForm((f) => ({ ...f, fromDate: e.target.value }))}
                          className="w-full px-3 py-2 pr-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                        />
                        <Calendar size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Đến ngày */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Đến ngày</label>
                      <div className="relative">
                        <input
                          type="date"
                          placeholder="DD/MM/YYYY"
                          value={searchForm.toDate}
                          onChange={(e) => setSearchForm((f) => ({ ...f, toDate: e.target.value }))}
                          className="w-full px-3 py-2 pr-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                        />
                        <Calendar size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-1">
                      <button
                        className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                        onClick={async () => {
                          try {
                            const params = {};
                            if (searchForm.creator) params.creator = searchForm.creator;
                            if (searchForm.name) params.name = searchForm.name;
                            if (searchForm.ticketId) params.ticketId = searchForm.ticketId;
                            if (searchForm.fromDate) params.fromDate = searchForm.fromDate;
                            if (searchForm.toDate) params.toDate = searchForm.toDate;
                            await eRequest.getMyRequests(params);
                            showToast("Tìm kiếm thành công", "success");
                          } catch (err) {
                            showToast(err.message || "Tìm kiếm thất bại", "error");
                          }
                        }}
                      >
                        Tìm kiếm
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeIcon === "user" ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Sub-sidebar */}
            <div className="bg-white border-r border-gray-200 overflow-y-auto shrink-0" style={{ width: 250 }}>
              <div className="px-4 pt-5 pb-3">
                <p className="text-sm font-bold text-gray-800 leading-snug">Quản lý giao dịch cần xử lý</p>
              </div>
              <nav className="px-2 pb-4">
                <button className="w-full text-left text-sm px-3 py-2 rounded-lg font-medium text-purple-700 bg-purple-50 transition-colors">
                  Giao dịch cần xử lý
                </button>
              </nav>
            </div>

            {/* Right content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Page header */}
              <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
                <h1 className="text-xl font-bold text-gray-800">Danh sách giao dịch cần xử lý</h1>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                    onClick={() => navigate("/erequest/new")}
                  >
                    <Plus size={15} />
                    Thêm mới
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={async () => {
                      try {
                        await eRequest.exportTickets({});
                        showToast("Đã xuất dữ liệu thành công", "success");
                      } catch (err) {
                        showToast(err.message || "Xuất dữ liệu thất bại", "error");
                      }
                    }}
                  >
                    <Download size={15} />
                    Xuất dữ liệu
                  </button>
                </div>
              </div>

              {/* Search + filter bar */}
              <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 shrink-0">
                <div className="relative" style={{ width: 300 }}>
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm giao dịch"
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                  />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                  <Filter size={13} />
                  Bộ lọc
                </button>
                <div className="flex items-center gap-1.5 ml-auto text-sm text-gray-500">
                  <span>Dạng xem:</span>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-400 text-purple-600 bg-purple-50 text-sm font-medium">
                    <Table2 size={14} />
                    Bảng
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>

              {/* Kanban board */}
              <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#f2f5f8]">
                <div className="flex gap-4 p-5 h-full" style={{ minWidth: "max-content" }}>

                  {/* COT 1: Giao dịch chờ tôi xử lý */}
                  <KanbanColumn
                    label="Giao dịch chờ tôi xử lý"
                    count={pendingTasks.length}
                    color="#ef4444"
                    cards={pendingTasks.map(t => ({
                      transactionId: t.ticketId ?? t.id,
                      name: t.flowName ?? t.ticketTitle ?? `Ticket #${t.ticketId ?? t.id}`,
                      received: t.createdDate ?? t.created_at ?? "—",
                      creator: t.requesterEmail ?? t.createdBy ?? "—",
                      step: t.currentNodeName ?? t.status ?? "Chờ xử lý",
                      stepColor: "#ef4444",
                    }))}
                  />

                  {/* COT 2: Giao dịch đang thực hiện */}
                  <KanbanColumn
                    label="Giao dịch đang thực hiện"
                    count={myRequests.length}
                    color="#f97316"
                    cards={myRequests.map(t => ({
                      transactionId: t.ticketId ?? t.id,
                      name: t.flowName ?? t.name ?? `Ticket #${t.ticketId}`,
                      received: t.createdDate ?? t.created_at ?? "—",
                      creator: t.requesterEmail ?? t.createdBy ?? "—",
                      step: t.currentNodeName ?? t.status ?? "Đang xử lý",
                      stepColor: "#f97316",
                    }))}
                  />

                  {/* COT 3: Giao dịch hoàn thành */}
                  <KanbanColumn
                    label="Giao dịch hoàn thành"
                    count={myRequests.filter(t => t.status === 2 || t.status === "COMPLETED").length}
                    color="#16a34a"
                    cards={myRequests.filter(t => t.status === 2 || t.status === "COMPLETED").map(t => ({
                      transactionId: t.ticketId ?? t.id,
                      name: t.flowName ?? t.name ?? `Ticket #${t.ticketId ?? t.id}`,
                      received: t.createdDate ?? t.created_at ?? "—",
                      creator: t.requesterEmail ?? t.createdBy ?? "—",
                      step: t.currentNodeName ?? "Hoàn thành",
                      stepColor: "#16a34a",
                    }))}
                  />

                  {/* COT 4: Giao dịch đã ủy quyền */}
                  <KanbanColumn
                    label="Giao dịch đã ủy quyền"
                    count={0}
                    color="#d97706"
                    cards={[]}
                  />

                  {/* COT 5: Giao dịch hủy */}
                  <KanbanColumn
                    label="Giao dịch hủy"
                    count={0}
                    color="#7c3aed"
                    cards={[]}
                  />

                  {/* COT 6: Giao dịch từ chối */}
                  <KanbanColumn
                    label="Giao dịch từ chối"
                    count={0}
                    color="#ec4899"
                    cards={[]}
                  />

                </div>
              </div>
            </div>
          </div>
        ) : (
        <main className="flex-1 overflow-auto p-8">
          {/* Welcome text */}
          <div className="text-center mb-6">
            <p className="text-xl font-bold text-gray-800">
              Xin chào! Bạn vui lòng chọn dịch vụ cần thực hiện bên dưới
            </p>
          </div>

          {/* Search + view toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="relative" style={{ width: 480 }}>
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm dịch vụ hoặc quy trình"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 bg-white shadow-sm"
              />
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-sm text-gray-500 mr-1">Dạng xem:</span>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  viewMode === "grid"
                    ? "border-purple-400 text-purple-600 bg-purple-50"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <LayoutGrid size={14} />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  viewMode === "list"
                    ? "border-purple-400 text-purple-600 bg-purple-50"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <List size={14} />
                List
              </button>
            </div>
          </div>

          {/* Cards grid */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-4 gap-5">
              {filtered.map((card) => (
                <button
                  key={card.id}
                  onClick={() => navigate(`/erequest/new?workflowId=${card.id}`)}
                  className="relative flex flex-col justify-between p-5 rounded-2xl text-left hover:scale-[1.02] transition-transform shadow-md hover:shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${card.color}ee, ${card.color}bb)`, minHeight: 140 }}
                >
                  {/* Circle icon top right */}
                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Grid3X3 size={16} className="text-white" />
                  </div>

                  <div className="pr-10">
                    <p className="text-white font-bold text-base leading-snug mb-2">{card.name}</p>
                    <p className="text-white/80 text-xs leading-relaxed">{card.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((card) => (
                <button
                  key={card.id}
                  onClick={() => navigate(`/erequest/new?workflowId=${card.id}`)}
                  className="flex items-center gap-4 px-5 py-3.5 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-colors text-left shadow-sm"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: card.color }}
                  >
                    <Grid3X3 size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{card.name}</p>
                    <p className="text-xs text-gray-500">{card.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search size={48} className="mb-3 opacity-20" />
              <p className="text-base font-bold text-gray-500">Không tìm thấy dịch vụ phù hợp</p>
              <p className="text-sm mt-1">Hãy thử từ khóa khác</p>
            </div>
          )}
        </main>
        )}
      </div>
    </div>
  );
}
