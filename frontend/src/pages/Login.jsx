import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoUET from "../assets/logo-uet.png";
import { eAccount, ApiError } from "../services/api";
import { setAuth } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, roles } = await eAccount.login(email, password);
      let profile = null;
      try {
        // Lấy profile sau khi có token — gán tạm để request() gắn header
        localStorage.setItem("auth_token", token);
        profile = await eAccount.getProfile();
      } catch {
        // Nếu getProfile lỗi, vẫn đăng nhập được với thông tin cơ bản
      }
      // TODO: bỏ khi backend issue token với đủ roles
      // setAuth({ token, email, roles, profile });
      setAuth({ token, email, roles: [-1, 1, 2, 3, 4, 5], profile });
      navigate("/erequest");
    } catch (err) {
      localStorage.removeItem("auth_token");
      if (err instanceof ApiError) {
        setError(err.message || "Email hoặc mật khẩu không đúng");
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── LEFT: Gradient + Logo ── */}
      <div
        className="hidden md:flex w-1/2 relative flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(145deg, #6d28d9 0%, #7c3aed 50%, #4f46e5 100%)" }}
      >
        {/* Bokeh circles */}
        <div className="absolute w-72 h-72 rounded-full" style={{ top: "-60px",   left: "-60px",   background: "rgba(255,255,255,0.07)" }} />
        <div className="absolute w-48 h-48 rounded-full" style={{ top: "30px",    right: "20px",   background: "rgba(255,255,255,0.06)" }} />
        <div className="absolute w-96 h-96 rounded-full" style={{ bottom: "-80px",right: "-80px",  background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute w-32 h-32 rounded-full" style={{ bottom: "120px",left: "30px",    background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute w-20 h-20 rounded-full" style={{ top: "160px",   left: "80px",    background: "rgba(255,255,255,0.1)"  }} />
        <div className="absolute w-16 h-16 rounded-full" style={{ bottom: "60px", right: "100px",  background: "rgba(255,255,255,0.09)" }} />

        {/* Logo + text */}
        <div className="z-10 flex flex-col items-center gap-5">
          <img src={logoUET} alt="UET Flow" className="w-[200px] h-[200px] rounded-full object-cover shadow-xl ring-4 ring-white/30" />
          <p className="font-bold text-white" style={{ fontSize: 56, marginBottom: 32 }}>UET Flow</p>
          <p className="text-center" style={{ color: "rgba(255,255,255,0.8)", fontSize: 20 }}>
            Nền tảng biểu mẫu số thông minh
          </p>
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div className="flex flex-col w-full md:w-1/2 bg-white">
        <div className="flex-1 flex items-center justify-center px-16">
          <div className="w-full max-w-md">

            {/* Welcome heading */}
            <h1 className="font-bold text-slate-800 mb-2" style={{ fontSize: 32 }}>Chào mừng trở lại!</h1>
            <p className="text-gray-500 mb-8" style={{ fontSize: 16 }}>Đăng nhập để quản lý biểu mẫu của bạn</p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email"
                  required
                  className="w-full px-4 py-3 text-sm rounded-xl border-2 focus:outline-none transition-all"
                  style={{ borderColor: "#e9d5ff" }}
                  onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "#e9d5ff"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full px-4 py-3 text-sm rounded-xl border-2 focus:outline-none transition-all"
                  style={{ borderColor: "#e9d5ff" }}
                  onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "#e9d5ff"; e.target.style.boxShadow = "none"; }}
                />
                <div className="flex justify-start" style={{ marginTop: 8 }}>
                  <button type="button" className="text-xs font-medium" style={{ color: "#7c3aed" }}>
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-70 transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                  boxShadow: "0 4px 15px rgba(124,58,237,0.35)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(124,58,237,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(124,58,237,0.35)";
                }}
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
