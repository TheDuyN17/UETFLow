import { useNavigate } from "react-router-dom";

export default function NotFound() {
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
        .anim-float   { animation: float 3.6s ease-in-out infinite; }
        .anim-fade-1  { animation: fadeUp 0.55s ease both; animation-delay: 0.1s; opacity: 0; }
        .anim-fade-2  { animation: fadeUp 0.55s ease both; animation-delay: 0.25s; opacity: 0; }
        .anim-fade-3  { animation: fadeUp 0.55s ease both; animation-delay: 0.40s; opacity: 0; }
        .anim-fade-4  { animation: fadeUp 0.55s ease both; animation-delay: 0.55s; opacity: 0; }
        .btn-primary:hover  { transform: scale(1.05); box-shadow: 0 12px 32px rgba(124,58,237,0.35); }
        .btn-secondary:hover { transform: scale(1.03); background: #f8fafc; }
        .btn-primary, .btn-secondary { transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
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

          {/* ── 404 number ── */}
          <div className="anim-float" style={{ lineHeight: 1, marginBottom: 8 }}>
            <span
              style={{
                fontSize: "clamp(100px, 20vw, 160px)",
                fontWeight: 900,
                letterSpacing: "-4px",
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #f97316 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block",
                userSelect: "none",
              }}
            >
              404
            </span>
          </div>

          {/* ── SVG illustration ── */}
          <div className="anim-fade-1" style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
            <svg width="220" height="140" viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Ground shadow */}
              <ellipse cx="110" cy="132" rx="70" ry="8" fill="#f1f5f9" />

              {/* Map */}
              <rect x="60" y="60" width="80" height="62" rx="6" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2" />
              <path d="M80 75 L100 85 L120 72 L120 118 L100 108 L80 120Z" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="1.2" />
              <circle cx="100" cy="90" r="5" fill="#f97316" />
              <path d="M100 90 L100 72" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2" />
              {/* Map folds */}
              <line x1="100" y1="60" x2="100" y2="122" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.3" />

              {/* Person body */}
              <circle cx="158" cy="42" r="14" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
              {/* Face */}
              <circle cx="154" cy="40" r="1.5" fill="#92400e" />
              <circle cx="162" cy="40" r="1.5" fill="#92400e" />
              {/* Confused mouth */}
              <path d="M154 46 Q158 43 162 46" stroke="#92400e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              {/* Question mark above head */}
              <text x="166" y="28" fontSize="14" fontWeight="800" fill="#7c3aed" fontFamily="Inter,sans-serif">?</text>
              {/* Body */}
              <rect x="150" y="57" width="16" height="24" rx="5" fill="#7c3aed" />
              {/* Arms - one pointing at map */}
              <path d="M150 63 L130 72" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
              <path d="M166 63 L172 58" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
              {/* Legs */}
              <path d="M153 81 L150 106" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" />
              <path d="M163 81 L165 106" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" />
              {/* Shoes */}
              <rect x="143" y="104" width="12" height="6" rx="3" fill="#1e1b4b" />
              <rect x="161" y="104" width="12" height="6" rx="3" fill="#1e1b4b" />

              {/* Floating dots decoration */}
              <circle cx="32" cy="50" r="5" fill="#f97316" opacity="0.4" />
              <circle cx="20" cy="80" r="3" fill="#7c3aed" opacity="0.3" />
              <circle cx="190" cy="30" r="4" fill="#a855f7" opacity="0.4" />
              <circle cx="200" cy="90" r="6" fill="#f97316" opacity="0.2" />
              <circle cx="45" cy="110" r="4" fill="#7c3aed" opacity="0.25" />
            </svg>
          </div>

          {/* ── Title ── */}
          <h1
            className="anim-fade-2"
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#1e293b",
              margin: "0 0 14px",
              lineHeight: 1.2,
            }}
          >
            Oops! Trang không tồn tại
          </h1>

          {/* ── Description ── */}
          <p
            className="anim-fade-3"
            style={{
              fontSize: 16,
              color: "#64748b",
              lineHeight: 1.65,
              margin: "0 auto 36px",
              maxWidth: 420,
            }}
          >
            Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
          </p>

          {/* ── Buttons ── */}
          <div
            className="anim-fade-4"
            style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}
          >
            <button
              className="btn-primary"
              onClick={() => navigate("/erequest")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #f97316 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                borderRadius: 50,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(124,58,237,0.28)",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Quay về trang chủ
            </button>

            <button
              className="btn-secondary"
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
            className="anim-fade-4"
            style={{ marginTop: 40, fontSize: 13, color: "#94a3b8" }}
          >
            Mã lỗi: <code style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>404 Not Found</code>
          </p>

        </div>
      </div>
    </>
  );
}
