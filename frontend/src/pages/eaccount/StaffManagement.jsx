import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { eAccount } from "../../services/api";
import { showToast } from "../../utils/toast";
import { ArrowLeft, UserPlus, UserMinus, Copy, Check, AlertTriangle, X } from "lucide-react";

const TABS = [
  { key: "create", label: "Tạo tài khoản", Icon: UserPlus },
  { key: "delete", label: "Xóa tài khoản", Icon: UserMinus },
];

export default function StaffManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");

  // Create state
  const [createForm, setCreateForm] = useState({
    email: "", fullName: "", phone: "", department: "",
    dob: "", gender: "", position: "", job: "", avatar: "",
  });
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Delete state
  const [deleteEmail, setDeleteEmail]       = useState("");
  const [checking, setChecking]             = useState(false);
  const [deletable, setDeletable]           = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting]             = useState(false);

  const setC = (k, v) => setCreateForm(p => ({ ...p, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const body = { ...createForm };
      if (!body.dob) delete body.dob;
      if (!body.gender) delete body.gender;
      if (!body.position) delete body.position;
      if (!body.job) delete body.job;
      if (!body.avatar) delete body.avatar;
      if (body.dob) body.dob = new Date(body.dob).toISOString();
      const result = await eAccount.createUser(body);
      setCreateResult(result);
      setCreateForm({ email: "", fullName: "", phone: "", department: "", dob: "", gender: "", position: "", job: "", avatar: "" });
    } catch (err) {
      showToast(err.message || "Tạo tài khoản thất bại", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleCheck = async () => {
    if (!deleteEmail.trim()) { showToast("Vui lòng nhập email", "warning"); return; }
    setChecking(true);
    setDeletable(null);
    try {
      const r = await eAccount.checkDeletable(deleteEmail.trim());
      setDeletable(r.deletable ?? r);
    } catch (err) {
      showToast(err.message || "Không thể kiểm tra", "error");
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eAccount.deleteUser(deleteEmail.trim());
      showToast("Đã xóa tài khoản thành công", "success");
      setDeleteEmail("");
      setDeletable(null);
      setDeleteConfirmOpen(false);
    } catch (err) {
      showToast(err.message || "Xóa tài khoản thất bại", "error");
    } finally {
      setDeleting(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(createResult?.generatedPassword || "").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white";
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="eaccount" />

      <div className="flex flex-1 overflow-hidden">
        {/* Left taskbar */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100">
            <button onClick={() => navigate("/eaccount")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft size={15} />
              Quay lại
            </button>
          </div>
          <nav className="p-3 space-y-1">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === key
                    ? "text-green-700 bg-green-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-xl mx-auto">
            {activeTab === "create" ? (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Tạo tài khoản mới</h2>
                <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm p-7 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                      <input type="email" required value={createForm.email} onChange={e => setC("email", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Họ và tên <span className="text-red-500">*</span></label>
                      <input type="text" required value={createForm.fullName} onChange={e => setC("fullName", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Số điện thoại <span className="text-red-500">*</span></label>
                      <input type="tel" required value={createForm.phone} onChange={e => setC("phone", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Đơn vị trực thuộc <span className="text-red-500">*</span></label>
                      <input type="text" required value={createForm.department} onChange={e => setC("department", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Ngày sinh</label>
                      <input type="date" value={createForm.dob} onChange={e => setC("dob", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Giới tính</label>
                      <select value={createForm.gender} onChange={e => setC("gender", e.target.value)} className={inputCls}>
                        <option value="">-- Chọn --</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Vị trí</label>
                      <input type="text" value={createForm.position} onChange={e => setC("position", e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Công việc</label>
                      <input type="text" value={createForm.job} onChange={e => setC("job", e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>URL ảnh đại diện</label>
                    <input type="url" value={createForm.avatar} onChange={e => setC("avatar", e.target.value)} placeholder="https://..." className={inputCls} />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={creating}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}>
                      <UserPlus size={15} />
                      {creating ? "Đang tạo..." : "Tạo tài khoản"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Xóa tài khoản</h2>
                <div className="bg-white rounded-2xl shadow-sm p-7 space-y-4">
                  <div>
                    <label className={labelCls}>Email tài khoản cần xóa <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input type="email" value={deleteEmail} onChange={e => { setDeleteEmail(e.target.value); setDeletable(null); }}
                        placeholder="user@vnu.uet" className={`${inputCls} flex-1`} />
                      <button type="button" onClick={handleCheck} disabled={checking}
                        className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60 shrink-0"
                        style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}>
                        {checking ? "..." : "Kiểm tra"}
                      </button>
                    </div>
                  </div>

                  {deletable === false && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700">Tài khoản này không thể xóa vì đang tham gia vào một giao dịch đang thực hiện.</p>
                    </div>
                  )}

                  {deletable === true && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Check size={18} className="text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-green-700 font-medium">Tài khoản có thể xóa</p>
                        <p className="text-xs text-green-600 mt-0.5">Tài khoản không đang tham gia giao dịch nào.</p>
                      </div>
                    </div>
                  )}

                  {deletable === true && (
                    <div className="flex justify-end">
                      <button onClick={() => setDeleteConfirmOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                        <UserMinus size={15} />
                        Xác nhận xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create result modal */}
      {createResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[420px]">
            <div className="flex justify-end mb-2">
              <button onClick={() => setCreateResult(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={26} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Tạo tài khoản thành công</h3>
            </div>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-semibold text-gray-800">{createResult.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Mật khẩu tạm:</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm bg-white border border-gray-200 px-2 py-0.5 rounded">{createResult.generatedPassword}</code>
                  <button onClick={copyPassword} className="text-gray-400 hover:text-green-600 transition-colors">
                    {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">Hãy gửi thông tin đăng nhập cho người dùng qua kênh bảo mật.</p>
            <button onClick={() => setCreateResult(null)}
              className="w-full mt-5 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[420px]">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={26} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa tài khoản</h3>
              <p className="text-sm text-gray-500 text-center">
                Hành động này <span className="font-bold text-red-600">không thể hoàn tác</span>. Tài khoản <span className="font-semibold">{deleteEmail}</span> sẽ bị vô hiệu hóa.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-60">
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
