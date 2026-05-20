import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { eAccount } from "../../services/api";
import { showToast } from "../../utils/toast";
import { ArrowLeft, Search, ShieldCheck, Save, X, AlertTriangle, ShieldOff } from "lucide-react";

const FALLBACK_ROLES = [
  { id: -1, name: "Người dùng hệ thống" },
  { id: 1,  name: "Quản lý nhân sự" },
  { id: 2,  name: "Khai báo thông tin Form" },
  { id: 3,  name: "Thiết kế quy trình (BI Admin - eFlow)" },
  { id: 4,  name: "Quản lý tài khoản" },
  { id: 5,  name: "Quản trị hệ thống (Permissions)" },
];

export default function PermissionManagement() {
  const navigate = useNavigate();
  const [email, setEmail]           = useState("");
  const [searching, setSearching]   = useState(false);
  const [userRoles, setUserRoles]   = useState(null);
  const [systemRoles, setSystemRoles] = useState(FALLBACK_ROLES);
  const [selected, setSelected]     = useState([]);
  const [notFound, setNotFound]     = useState(false);
  const [saveModal, setSaveModal]   = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [revokeModal, setRevokeModal] = useState(false);
  const [revoking, setRevoking]     = useState(false);

  useEffect(() => {
    eAccount.getSystemRoles()
      .then(roles => { if (Array.isArray(roles) && roles.length) setSystemRoles(roles); })
      .catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!email.trim()) { showToast("Vui lòng nhập email", "warning"); return; }
    setSearching(true);
    setUserRoles(null);
    setNotFound(false);
    try {
      const data = await eAccount.searchUserRoles(email.trim());
      const roles = data.roles ?? data;
      setUserRoles(roles);
      setSelected(Array.isArray(roles) ? roles.map(Number) : []);
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const toggleRole = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await eAccount.syncRoles(email.trim(), []);
      showToast("Đã thu hồi tất cả quyền", "success");
      setRevokeModal(false);
      setSelected([]);
      setUserRoles([]);
    } catch (err) {
      showToast(err.message || "Thu hồi thất bại", "error");
    } finally {
      setRevoking(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await eAccount.syncRoles(email.trim(), selected);
      showToast("Cập nhật quyền thành công", "success");
      setSaveModal(false);
      setUserRoles(selected);
    } catch (err) {
      showToast(err.message || "Cập nhật thất bại", "error");
    } finally {
      setSaving(false);
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
            <h1 className="text-xl font-bold text-gray-800">Quản lý phân quyền</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-7 space-y-5">
            {/* Search */}
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-3">Tìm tài khoản theo email</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setUserRoles(null); setNotFound(false); }}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="user@vnu.uet"
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                />
                <button onClick={handleSearch} disabled={searching}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60 shrink-0"
                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}>
                  <Search size={15} />
                  {searching ? "..." : "Tìm"}
                </button>
              </div>
            </div>

            {notFound && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <X size={18} className="text-red-500" />
                <p className="text-sm text-red-600 font-medium">Không tìm thấy tài khoản với email này</p>
              </div>
            )}

            {userRoles !== null && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Phân quyền cho <span className="text-green-600">{email}</span>
                </p>
                <div className="space-y-2 border border-gray-200 rounded-xl overflow-hidden">
                  {systemRoles.map(role => {
                    const isOn = selected.includes(Number(role.id));
                    return (
                      <label key={role.id}
                        className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${isOn ? "bg-green-50" : "hover:bg-gray-50"}`}>
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => toggleRole(Number(role.id))}
                          className="w-4 h-4 accent-green-600 cursor-pointer"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{role.name}</p>
                          <p className="text-xs text-gray-400">Role ID: {role.id}</p>
                        </div>
                        {isOn && <ShieldCheck size={16} className="text-green-500 ml-auto shrink-0" />}
                      </label>
                    );
                  })}
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setCancelModal(true)}
                    className="py-2.5 px-4 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">
                    Hủy thay đổi
                  </button>
                  <button onClick={() => setRevokeModal(true)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600">
                    <ShieldOff size={15} />
                    Thu hồi quyền
                  </button>
                  <button onClick={() => setSaveModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl"
                    style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}>
                    <Save size={15} />
                    Lưu quyền
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Save confirm */}
      {saveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[400px]">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck size={22} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Xác nhận lưu quyền</h3>
              <p className="text-sm text-gray-500 text-center">
                Cập nhật danh sách quyền cho <span className="font-semibold">{email}</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSaveModal(false)} disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}>
                {saving ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke confirm */}
      {revokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[400px]">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldOff size={22} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Thu hồi tất cả quyền?</h3>
              <p className="text-sm text-gray-500 text-center">
                Tài khoản <span className="font-semibold">{email}</span> sẽ mất toàn bộ quyền truy cập hệ thống.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRevokeModal(false)} disabled={revoking}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl">Hủy</button>
              <button onClick={handleRevoke} disabled={revoking}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-60">
                {revoking ? "Đang thu hồi..." : "Thu hồi quyền"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[400px]">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={22} className="text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Hủy thay đổi?</h3>
              <p className="text-sm text-gray-500 text-center">Các thay đổi chưa lưu sẽ bị mất.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl">Tiếp tục chỉnh sửa</button>
              <button onClick={() => { setCancelModal(false); setUserRoles(null); setSelected([]); }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl">
                Hủy thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
