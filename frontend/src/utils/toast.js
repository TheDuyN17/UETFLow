export function showToast(message, type = "info") {
  const existing = document.getElementById("__toast_container__");
  const container = existing || (() => {
    const el = document.createElement("div");
    el.id = "__toast_container__";
    el.style.cssText = "position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;";
    document.body.appendChild(el);
    return el;
  })();

  const colors = {
    success: { bg: "#f0fdf4", border: "#22c55e", text: "#15803d" },
    error:   { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c" },
    warning: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" },
    info:    { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8" },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement("div");
  toast.style.cssText = `
    background:${c.bg};border:1px solid ${c.border};color:${c.text};
    padding:10px 16px;border-radius:8px;font-size:13px;font-weight:500;
    max-width:340px;box-shadow:0 4px 12px rgba(0,0,0,0.1);
    pointer-events:auto;opacity:0;transition:opacity 0.2s;
    font-family:'Inter','Segoe UI',sans-serif;
  `;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => { toast.style.opacity = "1"; });

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}
