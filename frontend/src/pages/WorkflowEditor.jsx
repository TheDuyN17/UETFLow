import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { eFlow } from "../services/api";
import { showToast } from "../utils/toast";
import {
  X,
  Info,
  Clock,
  Settings,
  Search,
  Upload,
  Check,
  Plus,
  Minus,
  FileText,
  Layers,
  Zap,
} from "lucide-react";

const DAYS = [
  { label: "Thứ 2", active: true },
  { label: "Thứ 3", active: true },
  { label: "Thứ 4", active: true },
  { label: "Thứ 5", active: true },
  { label: "Thứ 6", active: true },
  { label: "Thứ 7", active: false },
  { label: "CN",    active: false },
];

const ADVANCED_ITEMS = [
  { id: "mail",        icon: FileText, label: "Cấu hình mẫu mail quy trình" },
  { id: "permission",  icon: Layers,   label: "Phân quyền quy trình" },
  { id: "ebuilder",   icon: Settings,  label: "Cấu hình eBuilder" },
  { id: "hidden",     icon: Zap,       label: "Lưu thông tin các trường ẩn" },
  { id: "init",       icon: Zap,       label: "Cấu hình khởi tạo giao dịch" },
  { id: "batch",      icon: Layers,    label: "Chọn bước hiển thị duyệt lô" },
];

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={18} className="text-blue-500 shrink-0" />
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function SelectField({ placeholder }) {
  return (
    <select
      defaultValue=""
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600 bg-white"
    >
      <option value="" disabled>{placeholder}</option>
    </select>
  );
}

function TimeInput({ label }) {
  const [val, setVal] = useState(0);
  return (
    <div className="flex flex-col items-center gap-1">
      <input
        type="number"
        min={0}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-14 text-center px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

export default function WorkflowEditor() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [activeTab,   setActiveTab]   = useState("eRequest");
  const [workflowName, setWorkflowName] = useState("Tạm ứng");
  const [identifier,  setIdentifier]  = useState("a");
  const [description, setDescription] = useState("");
  const [days,        setDays]        = useState(DAYS);
  const [openItems,   setOpenItems]   = useState({});

  const toggleDay  = (i) => setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, active: !d.active } : d));
  const toggleItem = (id) => setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const tabs = [
    { id: "eRequest", icon: FileText },
    { id: "eCLM",     icon: Layers   },
    { id: "eBL",      icon: Zap      },
  ];

  return (
    <div
      className="min-h-screen bg-[#f2f5f8] flex flex-col pb-20"
      style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}
    >
      {/* ========== PAGE HEADER ========== */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-8 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Chỉnh sửa quy trình</h1>
        <button
          onClick={() => navigate("/eflow")}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6 space-y-6">

        {/* ========== THÔNG TIN CHUNG ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon={Info} title="Thông tin chung" />

          {/* Row 1: Chọn loại modeler */}
          <div className="mb-5">
            <FieldLabel required>Chọn loại modeler</FieldLabel>
            <div className="flex gap-2 mt-1">
              {tabs.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border-2 transition-colors font-medium ${
                    activeTab === id
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Icon size={14} />
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Tên quy trình / Người theo dõi / Đính kèm biểu mẫu */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <FieldLabel required>Tên quy trình</FieldLabel>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <FieldLabel>Người theo dõi</FieldLabel>
              <SelectField placeholder="Chọn người theo dõi" />
            </div>
            <div>
              <FieldLabel required>Đính kèm biểu mẫu vào luồng quy trình</FieldLabel>
              <SelectField placeholder="Chọn biểu mẫu" />
              <button className="text-xs text-blue-500 hover:underline mt-1">
                Cấu hình quy trình liên quan
              </button>
            </div>
          </div>

          {/* Row 3: Nhóm quy trình / Người quản lý / eWriter */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <FieldLabel>Nhóm quy trình</FieldLabel>
              <SelectField placeholder="Chọn nhóm quy trình" />
            </div>
            <div>
              <FieldLabel>Người quản lý</FieldLabel>
              <SelectField placeholder="Chọn người quản lý" />
            </div>
            <div>
              <FieldLabel>Đính kèm biểu mẫu eWriter</FieldLabel>
              <SelectField placeholder="Chọn biểu mẫu" />
            </div>
          </div>

          {/* Row 4: Phòng ban / Mô tả / Upload */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <FieldLabel>Phòng ban</FieldLabel>
              <SelectField placeholder="Chọn phòng ban" />
            </div>
            <div>
              <FieldLabel>Mô tả</FieldLabel>
              <div className="relative">
                <textarea
                  placeholder="Nhập mô tả"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                />
                <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {description.length}/500
                </span>
              </div>
            </div>
            <div>
              <FieldLabel>Tải lên luồng quy trình mẫu (nếu có)</FieldLabel>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 h-[88px] cursor-pointer hover:border-blue-400 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                  <Upload size={15} className="text-blue-500" />
                </div>
                <p className="text-xs font-bold text-gray-700">Chọn hoặc kéo file</p>
                <p className="text-xs text-blue-500">(.bpmn)</p>
              </div>
            </div>
          </div>

          {/* Row 5: Tên định danh */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <FieldLabel required>Tên định danh</FieldLabel>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* ========== THỜI GIAN THỰC HIỆN ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon={Clock} title="Thời gian thực hiện" />

          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-6 mb-5">
            {/* Tổng thời gian */}
            <div>
              <FieldLabel required>Tổng thời gian thực hiện</FieldLabel>
              <div className="flex items-end gap-2 mt-1">
                <TimeInput label="Ngày" />
                <TimeInput label="Giờ" />
                <TimeInput label="Phút" />
                <span className="text-gray-400 pb-5">=</span>
                <div className="flex-1 bg-gray-100 rounded px-2 py-1.5 text-xs text-gray-600 whitespace-nowrap pb-5 flex items-end">
                  4 Ngày 0 Giờ 0 Phút
                </div>
              </div>
            </div>

            {/* Ngày làm việc */}
            <div>
              <FieldLabel required>Ngày làm việc</FieldLabel>
              <div className="flex gap-1 mt-1 flex-wrap">
                {days.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`flex items-center gap-0.5 px-2 py-1.5 text-xs rounded border transition-colors font-medium ${
                      d.active
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-gray-300 text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    {d.active && <Check size={10} />}
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Giờ làm việc */}
            <div>
              <FieldLabel required>Giờ làm việc</FieldLabel>
              <div className="flex items-center gap-2 mt-1">
                <div className="relative">
                  <input
                    type="time"
                    defaultValue="08:00"
                    className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <Clock size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <span className="text-gray-400 text-sm">→</span>
                <div className="relative">
                  <input
                    type="time"
                    defaultValue="17:00"
                    className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <Clock size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Thời gian nhắc */}
          <div>
            <FieldLabel>Thời gian nhắc trước hạn</FieldLabel>
            <div className="flex items-end gap-2 mt-1" style={{ width: "fit-content" }}>
              <TimeInput label="Ngày" />
              <TimeInput label="Giờ" />
              <TimeInput label="Phút" />
              <span className="text-gray-400 pb-5">=</span>
              <div className="bg-gray-100 rounded px-3 py-1.5 text-xs text-gray-600 whitespace-nowrap pb-5 flex items-end">
                0 Ngày 0 Giờ 0 Phút
              </div>
            </div>
          </div>
        </div>

        {/* ========== CẤU HÌNH NÂNG CAO ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon={Settings} title="Cấu hình nâng cao" />
          <div className="space-y-2">
            {ADVANCED_ITEMS.map(({ id, icon: Icon, label }) => (
              <div key={id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleItem(id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 transition-colors ${
                      openItems[id] ? "bg-blue-400" : "bg-blue-500"
                    }`}
                  >
                    {openItems[id] ? <Minus size={12} /> : <Plus size={12} />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </button>
                {openItems[id] && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-400">
                    Chưa có cấu hình
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== FOOTER FIXED ========== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-3 flex items-center justify-between z-30">
        <button
          onClick={() => navigate("/eflow")}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={async () => {
            if (id && id !== "new") {
              try {
                await eFlow.updateInfo(id, { id: Number(id), flowName: workflowName, describe: description });
              } catch (err) {
                showToast(err.message || "Lưu thông tin thất bại", "error");
                return;
              }
            }
            navigate(`/eflow/designer/${id}`);
          }}
          className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Tiếp tục sửa
        </button>
      </div>
    </div>
  );
}
