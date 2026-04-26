import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/stylePole.css";

const NAV_ITEMS = [
  {
    to: "/pole/plannings",
    label: "Planning",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    to: "/pole/planning-stage",
    label: "Stages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="8" y1="14" x2="16" y2="14"/>
        <line x1="8" y1="18" x2="13" y2="18"/>
      </svg>
    ),
  },
  {
    to: "/pole/emplois",
    label: "Emplois du temps",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

export default function PoleLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const initials = (user?.name ?? "PC")
    .split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="al-wrap">

      <header className="al-topbar">

        {/* ── Brand ── */}
        <div className="al-brand">
          <div className="al-brand-logo">
            <img
              src="/logoOfppt.png"
              alt="OFPPT"
              onError={e => { e.target.style.display = "none"; }}
            />
          </div>
          <div className="al-brand-info">
            <span className="al-brand-name">ISTA Hay Salam</span>
            <span className="al-brand-sub">Espace Pôle</span>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="al-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => "al-nav-item" + (isActive ? " active" : "")}
            >
              <span className="al-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Right ── */}
        <div className="al-topbar-right">
          <div className="al-user-wrap" ref={menuRef}>
            <button className="al-user-btn" onClick={() => setMenuOpen(o => !o)}>
              <div className="al-avatar">{initials}</div>
              <div className="al-user-info">
                <span className="al-user-name">{user?.name || "Coordinateur"}</span>
                <span className="al-user-role">Coordinateur Pôle</span>
              </div>
              <span
                className="al-chevron"
                style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </span>
            </button>

            {menuOpen && (
              <div className="al-user-menu">
                <div className="al-user-menu-header">
                  <div className="al-avatar al-avatar-lg">{initials}</div>
                  <div>
                    <div className="al-user-menu-name">{user?.name || "Coordinateur"}</div>
                    <div className="al-user-menu-email">{user?.email || ""}</div>
                  </div>
                </div>
                <div className="al-user-menu-divider" />
                <button
                  className="al-user-menu-item al-user-menu-logout"
                  onClick={handleLogout}
                >
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

      <main className="al-content">
        <Outlet />
      </main>

    </div>
  );
}
