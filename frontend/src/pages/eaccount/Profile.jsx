import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { eAccount } from "../../services/api";
import { setAuth, getAuth } from "../../utils/auth";
import { showToast } from "../../utils/toast";
import { ArrowLeft, Save, User } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({
    fullName: "", phone: "", dob: "", gender: "MALE",
    position: "", job: "", department: "", avatar: "", password: "",
  });

  useEffect(() => {
    eAccount.getProfile()
      .then(data => {
        setForm({
          fullName:   data.fullName   || data.firstName || "",
          phone:      data.phone      || "",
          dob:        data.dob        ? data.dob.substring(0, 10) : "",
          gender:     data.gender     || "MALE",
          position:   data.position   || "",
          job:        data.job        || "",
          department: data.department || "",
          avatar:     data.avatar     || "",
          password:   "",
        });
      })
      .catch(() => showToast("Không tải được thông tin cá nhân", "error"))
      .finally(() => setLoading(false));
  }, []);

  const [avatarFileName, setAvatarFileName] = useState("");
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert("Ảnh quá lớn, chọn file dưới 500KB");
      e.target.value = "";
      return;
    }
    setAvatarFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => set("avatar", ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    set("avatar", "");
    setAvatarFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form };
      if (!body.password) delete body.password;
      if (body.dob) body.dob = new Date(body.dob).toISOString();
      await eAccount.updateProfile(body);
      const { token, roles } = getAuth();
      setAuth({ token, email: getAuth().user?.email, roles, profile: body });
      showToast("Cập nhật thành công", "success");
    } catch (err) {
      showToast(err.message || "Cập nhật thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = "text", required = false) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        required={required}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="eaccount" />

      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h1>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">Đang tải...</div>
          ) : (
            <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-8 space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                {/* Circle preview */}
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                  {form.avatar
                    ? <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" onError={e => { e.target.style.display = "none"; }} />
                    : <User size={28} className="text-gray-400" />
                  }
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ảnh đại diện</label>

                  {form.avatar.startsWith("data:") ? (
                    /* After file chosen — show filename + inline preview + clear/change buttons */
                    <div className="flex items-center gap-2">
                      <img
                        src={form.avatar}
                        alt="preview"
                        className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                      />
                      <span className="flex-1 text-sm text-gray-500 truncate">{avatarFileName}</span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors shrink-0"
                      >
                        Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={clearAvatar}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                      >
                        Xóa
                      </button>
                    </div>
                  ) : (
                    /* Default — URL input + Chọn ảnh button */
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.avatar}
                        onChange={e => set("avatar", e.target.value)}
                        placeholder="https://... hoặc chọn ảnh từ máy"
                        className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg shrink-0 transition-colors"
                        style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}
                      >
                        Chọn ảnh
                      </button>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-gray-400 mt-1">Tối đa 500 KB. Hỗ trợ JPG, PNG, GIF, WebP.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {field("Họ và tên", "fullName", "text", true)}
                {field("Số điện thoại", "phone", "tel")}
                {field("Ngày sinh", "dob", "date")}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giới tính</label>
                  <div className="flex gap-6 mt-1">
                    {[["MALE", "Nam"], ["FEMALE", "Nữ"]].map(([val, lbl]) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" value={val} checked={form.gender === val} onChange={() => set("gender", val)}
                          className="accent-green-600" />
                        <span className="text-sm text-gray-700">{lbl}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {field("Vị trí", "position")}
                {field("Công việc", "job")}
                {field("Đơn vị trực thuộc", "department")}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Mật khẩu mới <span className="text-gray-400 font-normal">(để trống nếu không đổi)</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => set("password", e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => navigate(-1)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60 transition-colors"
                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}>
                  <Save size={15} />
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
