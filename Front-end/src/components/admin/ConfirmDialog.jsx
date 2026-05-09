import { useEffect } from "react";

const ICONS = {
  danger: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  ),
  warning: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

const VARIANT_CFG = {
  danger:  { iconBg: "#fff1f2", iconColor: "#dc2626", iconBorder: "#fecdd3", titleColor: "#9f1239",  btnBg: "#dc2626", btnHover: "#b91c1c" },
  warning: { iconBg: "#fffbeb", iconColor: "#d97706", iconBorder: "#fde68a", titleColor: "#92400e",  btnBg: "#d97706", btnHover: "#b45309" },
  info:    { iconBg: "#eff6ff", iconColor: "#2563eb", iconBorder: "#bfdbfe", titleColor: "#1e40af",  btnBg: "#2563eb", btnHover: "#1d4ed8" },
};

export default function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = "Confirmer",
  cancelLabel  = "Annuler",
  variant      = "danger",
  onConfirm,
  onCancel,
}) {
  const cfg = VARIANT_CFG[variant] ?? VARIANT_CFG.danger;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="confirm-overlay"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div className="confirm-dialog" role="alertdialog" aria-modal="true">

        {/* Icon */}
        <div
          className="confirm-icon-wrap"
          style={{
            background:   cfg.iconBg,
            color:        cfg.iconColor,
            border:       `1.5px solid ${cfg.iconBorder}`,
          }}
        >
          {ICONS[variant] ?? ICONS.danger}
        </div>

        {/* Text */}
        <div className="confirm-body">
          <div className="confirm-title" style={{ color: cfg.titleColor }}>
            {title}
          </div>
          {message && (
            <div className="confirm-message">{message}</div>
          )}
          {detail && (
            <div className="confirm-detail">{detail}</div>
          )}
        </div>

        {/* Buttons */}
        <div className="confirm-footer">
          <button className="confirm-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className="confirm-btn-confirm"
            style={{ background: cfg.btnBg, "--confirm-hover": cfg.btnHover }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
