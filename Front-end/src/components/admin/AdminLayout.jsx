import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminLayout.css";
import { Icons } from "./Icons";

const NAV = [
  { to: "/directeur/dashboard",    label: "Tableau de bord", icon: "dashboard" },
  { to: "/directeur/formateurs",   label: "Formateurs",      icon: "users"     },
  { to: "/directeur/surveillants", label: "Surveillants",    icon: "eye"       },
  { to: "/directeur/groupes",      label: "Groupes",         icon: "groups"    },
  { to: "/directeur/modules",      label: "Modules",         icon: "book"      },
  { to: "/directeur/import",       label: "Import Excel",    icon: "upload"    },
];

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navStats, setNavStats] = useState(null);

  useEffect(() => {
    axios.get("/stats").then(r => setNavStats(r.data)).catch(() => {});
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <div className="aw">

      {/* ═══ SIDEBAR ═══ */}
      <aside className="sidebar">

        {/* Header */}
       <div className="brand">
          <div className="brand-logo">
            <img src="/logoOfppt.png" alt="logo OFPPT" />
          </div>
          <div className="brand-info">
            <span className="brand-name">OFPPT</span>
            <span className="brand-sub">Gestion Pédagogique</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              <div className="nav-icon-wrap">{Icons[item.icon]}</div>
              <span>{item.label}</span>
              {item.to === "/directeur/formateurs" && navStats?.total_formateurs > 0 && (
                <span className="nav-badge">{navStats.total_formateurs}</span>
              )}
              {item.to === "/directeur/groupes" && navStats?.total_groupes > 0 && (
                <span className="nav-badge">{navStats.total_groupes}</span>
              )}
              {item.to === "/directeur/modules" && navStats?.total_modules > 0 && (
                <span className="nav-badge">{navStats.total_modules}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Aperçu rapide */}
        {navStats && (
          <div className="sidebar-stats">
            <div className="sidebar-stats-label">Aperçu rapide</div>
            {[
              ["Formateurs",  navStats.total_formateurs],
              ["Groupes",     navStats.total_groupes],
              ["Modules",     navStats.total_modules],
              ["Filières",    navStats.total_filieres],
            ].map(([label, val]) => (
              <div key={label} className="sidebar-stat-row">
                <span>{label}</span>
                <span>{val ?? 0}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getInitials(user?.name)}</div>
            <div>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">Directeur</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            {Icons.logout}
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className="aw-main">

        {/* Topbar */}
        <header className="aw-navbar">
          <div className="aw-navbar-left">
            <span className="aw-navbar-title">Espace Directeur</span>
            {navStats && (
              <div className="navbar-kpis">
                <span className="kpi-pill kpi-avc">
                  {Icons.avc}
                  AVC {((navStats.avc_moyen_global || 0) * 100).toFixed(1)}%
                </span>
                <span className="kpi-pill kpi-mh">
                  {Icons.check}
                  {navStats.mh_realisee_totale?.toLocaleString()}h réalisées
                </span>
                <span className="kpi-pill kpi-rest">
                  {Icons.clock}
                  {navStats.mh_restante_totale?.toLocaleString()}h restantes
                </span>
                <span className="kpi-pill kpi-eff">
                  {Icons.people}
                  {navStats.effectif_total?.toLocaleString()} stagiaires
                </span>
              </div>
            )}
          </div>

          <div className="aw-navbar-right">
            <div className="navbar-user-btn">
              <div className="navbar-avatar">{getInitials(user?.name)}</div>
              <div>
                <div className="navbar-user-name">{user?.name}</div>
                <div className="navbar-user-role">{user?.email}</div>
              </div>
              <span className="navbar-badge">Directeur</span>
            </div>
          </div>
        </header>

        <main className="aw-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}