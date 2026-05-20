import { useNavigate } from "react-router-dom";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-18px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-float-403   { animation: float 3.6s ease-in-out infinite; }
        .anim-fade-403-1  { animation: fadeUp 0.55s ease both; animation-delay: 0.1s;  opacity: 0; }
        .anim-fade-403-2  { animation: fadeUp 0.55s ease both; animation-delay: 0.25s; opacity: 0; }
        .anim-fade-403-3  { animation: fadeUp 0.55s ease both; animation-delay: 0.40s; opacity: 0; }
        .anim-fade-403-4  { animation: fadeUp 0.55s ease both; animation-delay: 0.55s; opacity: 0; }
        .btn-403-primary:hover   { transform: scale(1.05); box-shadow: 0 12px 32px rgba(220,38,38,0.35); }
        .btn-403-secondary:hover { transform: scale(1.03); background: #f8fafc; }
        .btn-403-primary, .btn-403-secondary { transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          fontFamily: "'Inter','Segoe UI','Roboto',sans-serif",
          padding: "32px 16px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 580, width: "100%" }}>

          {/* ── 403 number ── */}
          <div className="anim-float-403" style={{ lineHeight: 1, marginBottom: 8 }}>
            <span
              style={{
                fontSize: "clamp(100px, 20vw, 160px)",
                fontWeight: 900,
                letterSpacing: "-4px",
                background: "linear-gradient(135deg, #dc2626 0%, #ef4444 40%, #f97316 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block",
                userSelect: "none",
              }}
            >
              403
            </span>
          </div>

          {/* ── SVG illustration: Shield with lock ── */}
          <div className="anim-fade-403-1" style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
            <svg width="220" height="140" viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Ground shadow */}
              <ellipse cx="110" cy="132" rx="60" ry="7" fill="#fef2f2" />

              {/* Shield body */}
              <path
                d="M110 18 L148 32 L148 72 Q148 102 110 120 Q72 102 72 72 L72 32 Z"
                fill="#fef2f2"
                stroke="#dc2626"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Shield inner */}
              <path
                d="M110 28 L140 40 L140 72 Q140 97 110 112 Q80 97 80 72 L80 40 Z"
                fill="#fee2e2"
                stroke="#ef4444"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              {/* Lock body */}
              <rect x="96" y="72" width="28" height="22" rx="4" fill="#dc2626" />
              {/* Lock shackle */}
              <path
                d="M100 72 L100 63 Q100 54 110 54 Q120 54 120 63 L120 72"
                stroke="#dc2626"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Lock keyhole */}
              <circle cx="110" cy="81" r="4" fill="#fff" opacity="0.8" />
              <rect x="108" y="82" width="4" height="6" rx="1" fill="#fff" opacity="0.8" />

              {/* Warning triangle top-left */}
              <path d="M42 45 L52 28 L62 45 Z" fill="#f97316" opacity="0.85" />
              <line x1="52" y1="34" x2="52" y2="40" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="52" cy="43" r="1.5" fill="#fff" />

              {/* X mark top-right */}
              <circle cx="172" cy="36" r="12" fill="#fecaca" />
              <line x1="166" y1="30" x2="178" y2="42" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="178" y1="30" x2="166" y2="42" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />

              {/* Floating dots decoration */}
              <circle cx="32" cy="70" r="5" fill="#f97316" opacity="0.4" />
              <circle cx="20" cy="95" r="3" fill="#dc2626" opacity="0.3" />
              <circle cx="192" cy="65" r="4" fill="#ef4444" opacity="0.4" />
              <circle cx="200" cy="100" r="6" fill="#f97316" opacity="0.2" />
              <circle cx="45" cy="110" r="4" fill="#dc2626" opacity="0.25" />
            </svg>
          </div>

          {/* ── Title ── */}
          <h1
            className="anim-fade-403-2"
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#1e293b",
              margin: "0 0 14px",
              lineHeight: 1.2,
            }}
          >
            Truy cập bị từ chối!
          </h1>

          {/* ── Description ── */}
          <p
            className="anim-fade-403-3"
            style={{
              fontSize: 16,
              color: "#64748b",
              lineHeight: 1.65,
              margin: "0 auto 36px",
              maxWidth: 420,
            }}
          >
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
          </p>

          {/* ── Buttons ── */}
          <div
            className="anim-fade-403-4"
            style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}
          >
            <button
              className="btn-403-primary"
              onClick={() => navigate("/erequest")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                background: "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f97316 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                borderRadius: 50,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(220,38,38,0.28)",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Quay về trang chủ
            </button>

            <button
              className="btn-403-secondary"
              onClick={() => navigate(-1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                background: "#fff",
                color: "#475569",
                fontWeight: 600,
                fontSize: 15,
                border: "1.5px solid #e2e8f0",
                borderRadius: 50,
                cursor: "pointer",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Quay lại trang trước
            </button>
          </div>

          {/* ── Footer hint ── */}
          <p
            className="anim-fade-403-4"
            style={{ marginTop: 40, fontSize: 13, color: "#94a3b8" }}
          >
            Mã lỗi: <code style={{ fontFamily: "monospace", background: "#fef2f2", padding: "2px 6px", borderRadius: 4 }}>403 Forbidden</code>
          </p>

        </div>
      </div>
    </>
  );
}
