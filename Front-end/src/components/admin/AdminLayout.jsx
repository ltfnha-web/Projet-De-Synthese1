import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Icons } from "./Icons";
import "./AdminLayout.css";

/* ── Nav items ── */
const NAV_MAIN = [
  { to: "/directeur/dashboard",    label: "Tableau de bord", icon: "dashboard" },
  { to: "/directeur/formateurs",   label: "Formateurs",      icon: "users"     },
  { to: "/directeur/pole",         label: "Pôle",            icon: "target"    },
  { to: "/directeur/groupes",      label: "Groupes",         icon: "groups"    },
  { to: "/directeur/modules",      label: "Modules",         icon: "book"      },
  { to: "/directeur/alertes",      label: "Alertes",         icon: "alert",    badge: true },
  { to: "/directeur/import",       label: "Import",          icon: "upload"    },
];

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [navStats, setNavStats]   = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    axios.get("/stats").then(r => setNavStats(r.data)).catch(() => {});
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const alertCount = navStats?.alertes_count || 0;

  return (
    <div className="al-wrap">

      {/* ══════════════════════════════════════════
          TOPBAR (horizontal, matches login navbar)
      ══════════════════════════════════════════ */}
      <header className="al-topbar">

        {/* Brand — same as login */}
        <div className="al-brand">
          <div className="al-brand-logo">
            <img src="/logoOfppt.png" alt="ISTA" onError={e => { e.target.style.display = "none"; }} />
          </div>
          <div className="al-brand-info">
            <span className="al-brand-name">ISTA Hay Salam</span>
            <span className="al-brand-sub">Espace Directeur</span>
          </div>
        </div>

        {/* Nav links — horizontal */}
        <nav className="al-nav">
          {NAV_MAIN.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => "al-nav-item" + (isActive ? " active" : "")}
            >
              <span className="al-nav-icon">{Icons[item.icon]}</span>
              <span>{item.label}</span>
              {item.badge && alertCount > 0 && (
                <span className="al-nav-badge">{alertCount > 99 ? "99+" : alertCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right — KPIs + user */}
        <div className="al-topbar-right">

          {/* KPI pills */}
          {navStats && (
            <div className="al-kpis">
              <span className="al-kpi al-kpi-blue">
                {Icons.avc}
                {((navStats.avc_moyen_global || 0) * 100).toFixed(1)}% AVC
              </span>
              <span className="al-kpi al-kpi-green">
                {Icons.check}
                {navStats.mh_realisee_totale?.toLocaleString()}h
              </span>
              {alertCount > 0 && (
                <span className="al-kpi al-kpi-red">
                  {Icons.alert}
                  {alertCount} alerte{alertCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          {/* User menu */}
          <div className="al-user-wrap" ref={menuRef}>
            <button
              className="al-user-btn"
              onClick={() => setUserMenuOpen(p => !p)}
            >
              <div className="al-avatar">{getInitials(user?.name)}</div>
              <div className="al-user-info">
                <span className="al-user-name">{user?.name}</span>
                <span className="al-user-role">Directeur</span>
              </div>
              <span className="al-chevron" style={{ transform: userMenuOpen ? "rotate(180deg)" : "none", transition: ".2s" }}>
                {Icons.chevronDown}
              </span>
            </button>

            {userMenuOpen && (
              <div className="al-user-menu">
                <div className="al-user-menu-header">
                  <div className="al-avatar al-avatar-lg">{getInitials(user?.name)}</div>
                  <div>
                    <div className="al-user-menu-name">{user?.name}</div>
                    <div className="al-user-menu-email">{user?.email}</div>
                  </div>
                </div>
                <div className="al-user-menu-divider" />
                <button className="al-user-menu-item al-user-menu-logout" onClick={handleLogout}>
                  {Icons.logout}
                  Déconnexion
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ══════════════════════════════════════════
          PAGE CONTENT
      ══════════════════════════════════════════ */}
      <main className="al-content">
        <Outlet />
      </main>

    </div>
  );
}