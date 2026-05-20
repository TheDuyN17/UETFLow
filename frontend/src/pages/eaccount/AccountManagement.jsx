import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { eAccount } from "../../services/api";
import { showToast } from "../../utils/toast";
import { ArrowLeft, Search, UserMinus, AlertTriangle, Check, X } from "lucide-react";

export default function AccountManagement() {
  const navigate = useNavigate();
  const [email, setEmail]           = useState("");
  const [searching, setSearching]   = useState(false);
  const [result, setResult]         = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [deletable, setDeletable]   = useState(null);
  const [checking, setChecking]     = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) { showToast("Vui lòng nhập email", "warning"); return; }
    setSearching(true);
    setResult(null);
    setNotFound(false);
    setDeletable(null);
    try {
      const data = await eAccount.searchUser(email.trim());
      if (!data || (!data.email && !data.fullName)) { setNotFound(true); }
      else { setResult(data); }
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const handleCheckDeletable = async () => {
    setChecking(true);
    try {
      const r = await eAccount.checkDeletable(email.trim());
      setDeletable(r.deletable ?? r);
    } catch (err) {
      showToast(err.message || "Kiểm tra thất bại", "error");
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eAccount.deleteUser(email.trim());
      showToast("Đã xóa tài khoản thành công", "success");
      setResult(null);
      setEmail("");
      setDeletable(null);
      setConfirmOpen(false);
    } catch (err) {
      showToast(err.message || "Xóa thất bại", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="eaccount" />

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate("/eaccount")} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Quản lý tài khoản</h1>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-600">Tìm kiếm tài khoản theo email</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setResult(null); setNotFound(false); setDeletable(null); }}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="user@vnu.uet"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
              />
              <button onClick={handleSearch} disabled={searching}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60 shrink-0"
                style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}>
                <Search size={15} />
                {searching ? "..." : "Tìm kiếm"}
              </button>
            </div>

            {notFound && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <X size={18} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-600 font-medium">Không tìm thấy tài khoản với email này</p>
              </div>
            )}

            {result && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Thông tin tài khoản</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    ["Email",            result.email],
                    ["Họ và tên",        result.fullName || result.firstName],
                    ["Số điện thoại",    result.phone],
                    ["Đơn vị",           result.department],
                    ["Trạng thái",       result.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"],
                    ["Quyền",            Array.isArray(result.roles) ? result.roles.join(", ") : result.roles],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center px-4 py-3 text-sm">
                      <span className="w-36 text-gray-500 shrink-0">{k}</span>
                      <span className={`font-medium ${k === "Trạng thái" ? (result.isActive ? "text-green-600" : "text-red-500") : "text-gray-800"}`}>{v || "—"}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                  {deletable === null && (
                    <button onClick={handleCheckDeletable} disabled={checking}
                      className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors underline">
                      {checking ? "Đang kiểm tra..." : "Kiểm tra khả năng xóa"}
                    </button>
                  )}
                  {deletable === false && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <AlertTriangle size={15} />
                      <span>Không thể xóa — đang trong giao dịch</span>
                    </div>
                  )}
                  {deletable === true && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <Check size={15} />
                      <span>Có thể xóa</span>
                    </div>
                  )}
                  {deletable === true && (
                    <button onClick={() => setConfirmOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                      <UserMinus size={14} />
                      Xóa tài khoản
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[420px]">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={26} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa tài khoản</h3>
              <p className="text-sm text-gray-500 text-center">
                Hành động này <span className="font-bold text-red-600">không thể hoàn tác</span>. Tài khoản <span className="font-semibold">{email}</span> sẽ bị vô hiệu hóa.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">Hủy</button>
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
