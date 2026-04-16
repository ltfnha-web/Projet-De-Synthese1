// src/pages/pole/PoleLayout.jsx
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/stylePole.css";

export default function PoleLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname.includes(path);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "PC";

  return (
    <div className="al-wrap">

      {/* ── TOPBAR ── */}
      <header className="al-topbar">

        {/* Brand */}
        <div className="al-brand">
          <div className="al-brand-logo">
            <span style={{ fontSize: 13, fontWeight: 800, color: "white", fontFamily: "var(--font-hd)" }}>IS</span>
          </div>
          <div className="al-brand-info">
            <span className="al-brand-name">ISTA HAY SALAM</span>
            <span className="al-brand-sub">Espace Pôle</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="al-nav">
          <button
            className={`al-nav-item ${isActive("plannings") ? "active" : ""}`}
            onClick={() => navigate("/pole/plannings")}
          >
            <span className="al-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <span>Planning</span>
          </button>

          <button
            className={`al-nav-item ${isActive("emplois") ? "active" : ""}`}
            onClick={() => navigate("/pole/emplois")}
          >
            <span className="al-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </span>
            <span>Emplois du temps</span>
          </button>
        </nav>

        {/* Right */}
        <div className="al-topbar-right">

          {/* Badge pôle */}
          <span style={{
            fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.75)",
            background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.18)",
            borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap",
          }}>
            Pôle Dev Digital
          </span>

          {/* User dropdown */}
          <div className="al-user-wrap">
            <button className="al-user-btn" onClick={() => setMenuOpen(o => !o)}>
              <div className="al-avatar">{initials}</div>
              <div className="al-user-info">
                <span className="al-user-name">{user?.name || "Coordinateur"}</span>
                <span className="al-user-role">Coordinateur Pôle</span>
              </div>
              <span className="al-chevron">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </span>
            </button>

            {menuOpen && (
              <div className="al-user-menu" onClick={() => setMenuOpen(false)}>
                <div className="al-user-menu-header">
                  <div className="al-avatar" style={{ width: 38, height: 38, fontSize: 13, background: "var(--p0)", color: "var(--p6)" }}>
                    {initials}
                  </div>
                  <div>
                    <div className="al-user-menu-name">{user?.name || "Coordinateur"}</div>
                    <div className="al-user-menu-email">{user?.email || ""}</div>
                  </div>
                </div>
                <div className="al-user-menu-divider" />
                <button className="al-user-menu-item al-user-menu-logout" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Déconnexion
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── CONTENU ── */}
      <main className="al-content">
        <Outlet />
      </main>

    </div>
  );
}