import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { eForm } from "../services/api";
import { showToast } from "../utils/toast";
import {
  ChevronRight,
  Rows2,
  Columns2,
  StepForward,
  Layers,
  SplitSquareHorizontal,
  Minus,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  AlignLeft,
  MousePointerClick,
  TextCursorInput,
  Hash,
  Calendar,
  ToggleLeft,
  ChevronDown as ChevronDropdown,
  Upload,
  Hand,
  X,
  Plus,
  Download,
  Search,
  SlidersHorizontal,
  ChevronsUpDown,
  ClipboardList,
} from "lucide-react";

// ─── Block type registry ───────────────────────────────────────────────────────
const BLOCK_MAP = {
  row:             { label: "Row",            Icon: Rows2 },
  column:          { label: "Column",         Icon: Columns2 },
  step:            { label: "Step",           Icon: StepForward },
  tab:             { label: "Tab",            Icon: Layers },
  splitter:        { label: "Splitter",       Icon: SplitSquareHorizontal },
  divider:         { label: "Divider",        Icon: Minus },
  text:            { label: "Text",           Icon: Type },
  "heading-1":     { label: "Heading 1",      Icon: Heading1 },
  "heading-2":     { label: "Heading 2",      Icon: Heading2 },
  "heading-3":     { label: "Heading 3",      Icon: Heading3 },
  "bulleted-list": { label: "Bulleted list",  Icon: List },
  multiline:       { label: "Multiline text", Icon: AlignLeft },
  button:          { label: "Button",         Icon: MousePointerClick },
  "input-text":    { label: "Input text",     Icon: TextCursorInput },
  "multi-input":   { label: "Multiline text", Icon: AlignLeft },
  number:          { label: "Number",         Icon: Hash },
  date:            { label: "Date",           Icon: Calendar },
  checkbox:        { label: "Checkbox",       Icon: ToggleLeft },
  dropdown:        { label: "Dropdown",       Icon: ChevronDropdown },
  "file-upload":   { label: "File upload",    Icon: Upload },
};

const LAYOUT_TYPES = ["row", "column", "step", "tab", "splitter", "divider"];
const BASIC_TYPES  = ["text", "heading-1", "heading-2", "heading-3", "bulleted-list", "multiline", "button"];
const INPUT_TYPES  = ["input-text", "multi-input", "number", "date", "checkbox", "dropdown", "file-upload"];

const TABS      = ["Thiết lập biểu mẫu", "Thông tin chung", "Phiên bản lịch sử", "Cấu hình điều kiện"];
const FORM_NAME = "PTSC_phase1_QLSD_phương tiện vận chuyển";
const SAVED_AT  = "21/08/2025 • 11:16:43";

// ─── Block content renderer ────────────────────────────────────────────────────
function BlockContent({ type }) {
  switch (type) {
    case "text":
      return <input type="text" placeholder="Nhập text..." className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400" />;
    case "heading-1":
      return <input type="text" placeholder="Heading 1" className="w-full border-0 outline-none text-2xl font-bold text-gray-800 placeholder-gray-300 bg-transparent" />;
    case "heading-2":
      return <input type="text" placeholder="Heading 2" className="w-full border-0 outline-none text-xl font-bold text-gray-700 placeholder-gray-300 bg-transparent" />;
    case "heading-3":
      return <input type="text" placeholder="Heading 3" className="w-full border-0 outline-none text-lg font-semibold text-gray-700 placeholder-gray-300 bg-transparent" />;
    case "bulleted-list":
      return <textarea placeholder={"- Mục 1\n- Mục 2"} rows={3} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm resize-none focus:outline-none focus:border-orange-400" />;
    case "multiline":
    case "multi-input":
      return <textarea placeholder="Nhập text..." rows={3} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm resize-none focus:outline-none focus:border-orange-400" />;
    case "button":
      return <button className="px-4 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors">Button</button>;
    case "input-text":
      return (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Label</label>
          <input type="text" placeholder="Nhập text..." className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400" />
        </div>
      );
    case "number":
      return (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Số</label>
          <input type="number" placeholder="0" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400" />
        </div>
      );
    case "date":
      return (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Ngày</label>
          <input type="date" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400" />
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-orange-500" />
          <span className="text-sm text-gray-700">Checkbox label</span>
        </label>
      );
    case "dropdown":
      return (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Chọn</label>
          <select className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-500 focus:outline-none focus:border-orange-400">
            <option>-- Chọn --</option>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </div>
      );
    case "file-upload":
      return (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">Tệp</label>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Upload size={13} /> Tải lên tệp
          </button>
        </div>
      );
    case "divider":
      return <hr className="border-gray-300 my-1" />;
    case "row":
      return (
        <div className="border border-dashed border-gray-400 rounded p-4 min-h-14 bg-gray-50">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Row</span>
        </div>
      );
    case "column":
      return (
        <div className="grid grid-cols-2 gap-2">
          {["Column 1", "Column 2"].map((c) => (
            <div key={c} className="border border-dashed border-gray-400 rounded p-4 min-h-14 bg-gray-50 flex items-center justify-center">
              <span className="text-xs text-gray-400">{c}</span>
            </div>
          ))}
        </div>
      );
    case "step":
      return (
        <div>
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {["Step 1", "Step 2", "Step 3"].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</div>
                <span className="text-xs text-gray-600">{s}</span>
                {i < 2 && <div className="w-6 h-px bg-gray-300 mx-1" />}
              </div>
            ))}
            <button className="ml-2 flex items-center gap-0.5 text-xs text-orange-500 hover:underline">
              <Plus size={11} /> Thêm bước
            </button>
          </div>
          <div className="border border-dashed border-gray-300 rounded p-3 min-h-10 bg-gray-50">
            <span className="text-xs text-gray-400">Nội dung Step 1</span>
          </div>
        </div>
      );
    case "tab":
      return (
        <div>
          <div className="flex items-center gap-0 border-b border-gray-200 mb-2">
            {["Tab 1", "Tab 2", "Tab 3"].map((t, i) => (
              <div key={i} className={`px-3 py-1.5 text-xs cursor-pointer border-b-2 -mb-px ${i === 0 ? "border-orange-500 text-orange-500 font-medium" : "border-transparent text-gray-500"}`}>{t}</div>
            ))}
            <button className="ml-2 flex items-center gap-0.5 text-xs text-orange-500 pb-1">
              <Plus size={11} /> Thêm tab
            </button>
          </div>
          <div className="border border-dashed border-gray-300 rounded p-3 min-h-10 bg-gray-50">
            <span className="text-xs text-gray-400">Nội dung Tab 1</span>
          </div>
        </div>
      );
    case "splitter":
      return (
        <div className="flex gap-1 min-h-14">
          <div className="flex-1 border border-dashed border-gray-400 rounded p-3 bg-gray-50 flex items-center justify-center">
            <span className="text-xs text-gray-400">Panel 1</span>
          </div>
          <div className="w-1.5 bg-gray-300 rounded cursor-col-resize hover:bg-orange-300 transition-colors" />
          <div className="flex-1 border border-dashed border-gray-400 rounded p-3 bg-gray-50 flex items-center justify-center">
            <span className="text-xs text-gray-400">Panel 2</span>
          </div>
        </div>
      );
    default:
      return <span className="text-sm text-gray-500">{type}</span>;
  }
}

// ─── Sidebar draggable item ────────────────────────────────────────────────────
function SidebarItem({ type }) {
  const { label, Icon } = BLOCK_MAP[type];

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ source: "sidebar", type }));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-2.5 px-3 py-2 border border-gray-200 rounded-lg cursor-grab hover:border-orange-300 hover:bg-orange-50 transition-colors select-none"
    >
      <Icon size={16} className="text-gray-500 shrink-0" />
      <span className="text-xs text-gray-700">{label}</span>
    </div>
  );
}

function SidebarGroup({ title, types }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1.5 mb-1 bg-white sticky top-0 z-10">
        {title}
      </p>
      <div className="flex flex-col gap-0.5">
        {types.map((t) => <SidebarItem key={t} type={t} />)}
      </div>
    </div>
  );
}

// ─── Canvas block (draggable for reorder, drop target for insertion before) ───
function CanvasBlock({ block, onDelete, onDrop, onLabelChange }) {
  const [isOver, setIsOver] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(block.label ?? BLOCK_MAP[block.type]?.label ?? block.type);

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ source: "canvas", id: block.id }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  };

  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      onDrop(data, block.id);
    } catch {}
  };

  const commitLabel = () => {
    setEditingLabel(false);
    onLabelChange(block.id, labelDraft);
  };

  const isInputBlock = INPUT_TYPES.includes(block.type) || BASIC_TYPES.includes(block.type);

  return (
    <div
      draggable={!editingLabel}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative border border-dashed rounded-lg bg-white transition-all ${
        isOver ? "border-blue-400 ring-2 ring-blue-200" : "border-blue-200 hover:border-blue-400"
      }`}
    >
      {/* Drag handle indicator */}
      <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-lg leading-none select-none">
        ⠿
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(block.id)}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500"
      >
        <X size={10} />
      </button>

      <div className="p-3">
        {/* Editable label row — shown for input/basic blocks */}
        {isInputBlock && (
          <div className="flex items-center gap-2 mb-2">
            {editingLabel ? (
              <input
                autoFocus
                type="text"
                value={labelDraft}
                onChange={e => setLabelDraft(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={e => { if (e.key === "Enter") commitLabel(); if (e.key === "Escape") { setLabelDraft(block.label ?? BLOCK_MAP[block.type]?.label ?? block.type); setEditingLabel(false); } }}
                className="flex-1 border border-orange-400 rounded px-2 py-0.5 text-sm font-medium focus:outline-none"
              />
            ) : (
              <button
                onClick={() => setEditingLabel(true)}
                title="Nhấn để sửa nhãn"
                className="flex-1 text-left text-sm font-semibold text-gray-700 hover:text-orange-600 truncate"
              >
                {block.label ?? labelDraft}
              </button>
            )}
            <span className="text-[10px] text-gray-400 shrink-0">ID: {block.id.replace(/^block-/, "").replace(/-\d+$/, "")}</span>
          </div>
        )}
        <BlockContent type={block.type} />
      </div>
    </div>
  );
}

// ─── General Info Tab ──────────────────────────────────────────────────────────
function GeneralInfoTab({ navigate }) {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) setTags((prev) => [...prev, val]);
    setTagInput("");
    setShowTagInput(false);
  };

  const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

  const labelClass = "block text-sm font-semibold mb-1.5";
  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-auto py-8 px-6 flex justify-center">
        <div className="w-full max-w-[700px] space-y-5">

          {/* Mã biểu mẫu */}
          <div>
            <label className={labelClass} style={{ color: "#00204d" }}>
              Mã biểu mẫu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              defaultValue="PTSC_QLSD_PTVC"
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              Quy tắc đặt tên: Không dấu, không khoảng cách, chữ cách nhau bằng dấu '_'
            </p>
          </div>

          {/* Tên biểu mẫu */}
          <div>
            <label className={labelClass} style={{ color: "#00204d" }}>
              Tên biểu mẫu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              defaultValue="PTSC_phase1_QLSD_phương tiện vận chuyển"
              className={inputClass}
            />
          </div>

          {/* Ngày hiệu lực */}
          <div>
            <label className={labelClass} style={{ color: "#00204d" }}>
              Ngày hiệu lực <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                defaultValue="2025-08-21"
                className={`flex-1 ${inputClass}`}
              />
              <span className="text-gray-400 text-lg shrink-0">→</span>
              <input
                type="date"
                defaultValue="2040-07-21"
                className={`flex-1 ${inputClass}`}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass} style={{ color: "#00204d" }}>Tags</label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{ backgroundColor: "#fff3ee", borderColor: "#ea632e", color: "#ea632e" }}
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-600">
                    <X size={10} />
                  </button>
                </span>
              ))}
              {showTagInput ? (
                <input
                  autoFocus
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addTag(); if (e.key === "Escape") setShowTagInput(false); }}
                  onBlur={addTag}
                  className="border border-dashed border-orange-400 rounded-full px-3 py-1 text-xs focus:outline-none w-28"
                  placeholder="Nhập tag..."
                />
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="flex items-center gap-1 px-3 py-1 border border-dashed border-gray-400 rounded-full text-xs text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
                >
                  <Plus size={11} /> Tag
                </button>
              )}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className={labelClass} style={{ color: "#00204d" }}>Mô tả</label>
            <textarea
              rows={5}
              placeholder="Nhập mô tả"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-orange-400 bg-white"
            />
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <button
          onClick={() => navigate("/eform")}
          className="text-sm font-medium px-3 py-1.5 rounded"
          style={{ color: "#E14337", background: "transparent" }}
        >
          Quay lại
        </button>
        <div className="flex items-center gap-2">
          <button className="text-sm font-medium px-4 py-1.5 rounded" style={{ color: "rgba(0,32,77,0.7)", backgroundColor: "#F2F5F8" }}>
            Xem trước
          </button>
          <button className="text-sm font-medium px-4 py-1.5 rounded opacity-50 cursor-not-allowed" style={{ color: "rgba(0,32,77,0.7)", backgroundColor: "#F2F5F8" }} disabled>
            Hủy thay đổi
          </button>
          <button className="text-sm font-medium px-4 py-1.5 rounded text-white" style={{ backgroundColor: "#ea632e" }}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Condition Tab ─────────────────────────────────────────────────────────────
function ConditionTab({ navigate }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-auto p-6">

        {/* Header section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#ea632e" }}
            >
              {/* Person icon (SVG inline for simplicity) */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wide" style={{ color: "#1e293b" }}>
                Điều kiện
              </h2>
              <p className="text-sm text-gray-500">Thêm logic có điều kiện vào biểu mẫu của bạn.</p>
            </div>
          </div>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#ea632e" }}
          >
            <Plus size={15} />
            Thêm điều kiện
          </button>
        </div>

        {/* Content area */}
        <div className="bg-white border border-gray-200 rounded-xl flex items-center justify-center" style={{ minHeight: 300 }}>
          <p className="text-sm text-gray-400 font-medium">Không có dữ liệu!</p>
        </div>

      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <button
          onClick={() => navigate("/eform")}
          className="text-sm font-medium px-3 py-1.5 rounded"
          style={{ color: "#E14337", background: "transparent" }}
        >
          Quay lại
        </button>
        <div className="flex items-center gap-2">
          <button className="text-sm font-medium px-4 py-1.5 rounded" style={{ color: "rgba(0,32,77,0.7)", backgroundColor: "#F2F5F8" }}>
            Xem trước
          </button>
          <button className="text-sm font-medium px-4 py-1.5 rounded opacity-50 cursor-not-allowed" style={{ color: "rgba(0,32,77,0.7)", backgroundColor: "#F2F5F8" }} disabled>
            Hủy thay đổi
          </button>
          <button className="text-sm font-medium px-4 py-1.5 rounded text-white" style={{ backgroundColor: "#ea632e" }}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab({ navigate }) {
  const [search, setSearch] = useState("");

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-auto">

        {/* Header section */}
        <div className="bg-white px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#1e293b" }}>Phiên bản lịch sử</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Biểu mẫu được tạo ngày 21/08/2025 • 11:16:38
            </p>
          </div>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-orange-50"
            style={{ borderColor: "#ea632e", color: "#ea632e" }}
          >
            <Download size={15} />
            Xuất Excel
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập số version"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400"
            />
          </div>
          <div className="w-px h-7 bg-gray-200 mx-4" />
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
            <SlidersHorizontal size={15} />
            Bộ lọc
          </button>
        </div>

        {/* Table */}
        <div className="mx-6 mt-5 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#fff7f5" }}>
                <th className={thClass}>
                  <div className="flex items-center gap-1">
                    Version
                    <ChevronsUpDown size={13} className="text-gray-400" />
                  </div>
                </th>
                <th className={thClass}>Ngày thay đổi</th>
                <th className={thClass}>Nội dung thay đổi</th>
                <th className={thClass}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ClipboardList size={48} className="text-gray-200" />
                    <p className="text-sm font-medium text-gray-400">Không có dữ liệu</p>
                    <p className="text-xs text-gray-300">Lịch sử phiên bản sẽ xuất hiện ở đây</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="h-6" />
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <button
          onClick={() => navigate("/eform")}
          className="text-sm font-medium px-3 py-1.5 rounded"
          style={{ color: "#E14337", background: "transparent" }}
        >
          Quay lại
        </button>
        <div className="flex items-center gap-2">
          <button className="text-sm font-medium px-4 py-1.5 rounded" style={{ color: "rgba(0,32,77,0.7)", backgroundColor: "#F2F5F8" }}>
            Xem trước
          </button>
          <button className="text-sm font-medium px-4 py-1.5 rounded opacity-50 cursor-not-allowed" style={{ color: "rgba(0,32,77,0.7)", backgroundColor: "#F2F5F8" }} disabled>
            Hủy thay đổi
          </button>
          <button className="text-sm font-medium px-4 py-1.5 rounded text-white" style={{ backgroundColor: "#ea632e" }}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function FormBuilder() {
  const navigate = useNavigate();
  const { id: urlId } = useParams();
  const [formId, setFormId]             = useState(urlId === "new" ? null : urlId);
  const [activeTab, setActiveTab]       = useState(0);
  const [published, setPublished]       = useState(false);
  const [canvasBlocks, setCanvasBlocks] = useState([]);
  const [isDragOver, setIsDragOver]     = useState(false);
  const [formName, setFormName]         = useState(FORM_NAME);
  const [savedAt, setSavedAt]           = useState(SAVED_AT);
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    if (!formId) return;
    eForm.getForm(formId)
      .then(data => {
        if (data?.formName) setFormName(data.formName);
        if (data?.statusForm === 2) setPublished(true);
        if (data?.updatedDate) {
          const d = new Date(data.updatedDate);
          setSavedAt(`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} • ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`);
        }
        const raw = Array.isArray(data?.components)
          ? data.components
          : (() => { try { return JSON.parse(data?.jsonForm ?? "[]"); } catch { return []; } })();
        if (raw.length) {
          setCanvasBlocks(raw.map(c => ({ id: `block-${c.id ?? Math.random()}`, type: c.type ?? "text", ...c })));
        }
      })
      .catch(() => {});
  }, [formId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const jsonForm = JSON.stringify(canvasBlocks);
      if (!formId) {
        const saved = await eForm.createForm({ formName, jsonForm });
        const newId = saved?.formId ?? saved?.id;
        if (newId) {
          setFormId(String(newId));
          navigate(`/eform/form-builder/${newId}`, { replace: true });
        }
      } else {
        await eForm.updateForm({ formId, jsonForm });
      }
      const now = new Date();
      setSavedAt(`${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()} • ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`);
      showToast("Đã lưu biểu mẫu", "success");
    } catch (err) {
      showToast(err.message || "Lưu thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!formId) { setPublished(p => !p); return; }
    try {
      if (published) {
        await eForm.unpublishForm(formId);
        setPublished(false);
        showToast("Đã ngừng phát hành", "success");
      } else {
        await eForm.publishForm(formId);
        setPublished(true);
        showToast("Đã phát hành biểu mẫu", "success");
      }
    } catch (err) {
      showToast(err.message || "Thao tác thất bại", "error");
    }
  };

  // Called when something is dropped — either on the canvas zone or on a block
  const handleDrop = (data, beforeId = null) => {
    if (data.source === "sidebar") {
      const newBlock = {
        id: `block-${Date.now()}-${Math.random()}`,
        type: data.type,
        label: BLOCK_MAP[data.type]?.label ?? data.type,
      };
      if (beforeId) {
        setCanvasBlocks((prev) => {
          const idx = prev.findIndex((b) => b.id === beforeId);
          const arr = [...prev];
          arr.splice(idx, 0, newBlock);
          return arr;
        });
      } else {
        setCanvasBlocks((prev) => [...prev, newBlock]);
      }
    } else if (data.source === "canvas" && beforeId && data.id !== beforeId) {
      setCanvasBlocks((prev) => {
        const from = prev.findIndex((b) => b.id === data.id);
        const to   = prev.findIndex((b) => b.id === beforeId);
        if (from === -1 || to === -1) return prev;
        const arr = [...prev];
        const [removed] = arr.splice(from, 1);
        arr.splice(to, 0, removed);
        return arr;
      });
    }
  };

  const deleteBlock = (id) => setCanvasBlocks((prev) => prev.filter((b) => b.id !== id));

  const updateBlockLabel = (id, label) =>
    setCanvasBlocks((prev) => prev.map((b) => b.id === id ? { ...b, label } : b));

  // Canvas drop zone handlers (empty state or tail drop)
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleCanvasDragLeave = (e) => {
    // Only clear if leaving the canvas container itself
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      handleDrop(data, null); // append to end
    } catch {}
  };

  const isEmpty = canvasBlocks.length === 0;

  return (
    <div
      className="h-screen flex flex-col bg-white overflow-hidden"
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}
    >
      {/* ===== HEADER ===== */}
      <div className="px-6 pt-5 pb-0 border-b border-gray-200 shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs" style={{ color: "#00204d99" }}>Quản lý biểu mẫu</span>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-xs font-medium truncate max-w-xs" style={{ color: "#ea632e" }}>{formName}</span>
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold mb-1 break-words" style={{ color: "#00204d" }}>{formName}</h1>

        {/* Saved + status */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs" style={{ color: "#00204d99" }}>Đã lưu lúc {savedAt}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "#7c3aed", backgroundColor: "#ede9fe" }}>
            Bản nháp
          </span>
        </div>

        {/* Tabs row + toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-0">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === i
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-2">
            <span className="text-sm text-gray-700 font-medium">Phát hành</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={published} onChange={handleTogglePublish} />
              <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-orange-500 transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </div>
      </div>

      {/* ===== BODY ===== */}
      {activeTab === 0 ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-52 shrink-0 border-r border-gray-200 overflow-y-auto p-3 bg-white">
            <SidebarGroup title="Layout"             types={LAYOUT_TYPES} />
            <SidebarGroup title="Basic blocks"       types={BASIC_TYPES}  />
            <SidebarGroup title="Basic input blocks"  types={INPUT_TYPES}  />
          </aside>

          {/* Canvas */}
          <main className="flex-1 overflow-auto bg-[#f2f5f8] flex flex-col">
            <div
              className="flex-1 p-6"
              onDragOver={handleCanvasDragOver}
              onDragLeave={handleCanvasDragLeave}
              onDrop={handleCanvasDrop}
            >
              {isEmpty ? (
                <div className={`w-full h-full min-h-64 flex flex-col items-center justify-center gap-3 rounded-xl transition-all ${
                  isDragOver
                    ? "border-2 border-dashed border-blue-400 bg-blue-50"
                    : "border-2 border-dashed border-gray-300 bg-white"
                }`}>
                  <Hand size={40} className={isDragOver ? "text-blue-300" : "text-gray-300"} />
                  <p className="text-base font-semibold text-gray-500">Bắt đầu tạo biểu mẫu</p>
                  <p className="text-sm text-gray-400 text-center max-w-xs">
                    Kéo các trường thông tin mà bạn muốn từ cột bên phải vào đây.
                  </p>
                </div>
              ) : (
                <div className={`space-y-3 min-h-24 pl-5 rounded-xl transition-all ${
                  isDragOver ? "ring-2 ring-blue-300 ring-dashed bg-blue-50/30 p-3" : ""
                }`}>
                  {canvasBlocks.map((block) => (
                    <CanvasBlock
                      key={block.id}
                      block={block}
                      onDelete={deleteBlock}
                      onDrop={handleDrop}
                      onLabelChange={updateBlockLabel}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
              <button
                onClick={() => navigate("/eform")}
                className="text-sm font-medium px-3 py-1.5 rounded"
                style={{ color: "#E14337", background: "transparent" }}
              >
                Quay lại
              </button>
              <div className="flex items-center gap-2">
                <button className="text-sm font-medium px-4 py-1.5 rounded" style={{ color: "rgba(0,32,77,0.7)", backgroundColor: "#F2F5F8" }}>
                  Xem trước
                </button>
                <button className="text-sm font-medium px-4 py-1.5 rounded opacity-50 cursor-not-allowed" style={{ color: "rgba(0,32,77,0.7)", backgroundColor: "#F2F5F8" }} disabled>
                  Hủy thay đổi
                </button>
                <button onClick={handleSave} disabled={saving} className="text-sm font-medium px-4 py-1.5 rounded text-white disabled:opacity-60" style={{ backgroundColor: "#ea632e" }}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </main>
        </div>
      ) : activeTab === 1 ? (
        <GeneralInfoTab navigate={navigate} />
      ) : activeTab === 2 ? (
        <HistoryTab navigate={navigate} />
      ) : activeTab === 3 ? (
        <ConditionTab navigate={navigate} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Nội dung tab "{TABS[activeTab]}" chưa được triển khai.
        </div>
      )}
    </div>
  );
}
