// ============================================================
// src/pages/pole/PoleLayout.jsx
// NOUVEAU FICHIER — Layout du Pôle avec Outlet
// Compatible avec ton App.js qui utilise <Outlet />
// ============================================================
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/stylePole.css";

export default function PoleLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const isActive = (path) => location.pathname.includes(path);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="pole-wrapper">
      {/* ── Navbar ── */}
      <nav className="pole-navbar">
        <div className="pole-navbar__brand">
          <div className="pole-navbar__logo">IS</div>
          <div>
            <div className="pole-navbar__name">ISTA HAY SALAM</div>
            <div className="pole-navbar__role">Espace Pôle</div>
          </div>
        </div>

        <div className="pole-navbar__links">
          <button
            className={`pole-nav-link ${isActive("plannings") ? "active" : ""}`}
            onClick={() => navigate("/pole/plannings")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Planning
          </button>

          <button
            className={`pole-nav-link ${isActive("emplois") ? "active" : ""}`}
            onClick={() => navigate("/pole/emplois")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Emplois du temps
          </button>
        </div>

        <div className="pole-navbar__right">
          <span className="pole-navbar__badge">Pôle Dev Digital</span>
          <div className="pole-navbar__user">
            <div className="pole-navbar__avatar">
              {user?.name ? user.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() : "PC"}
            </div>
            <div>
              <div className="pole-navbar__username">{user?.name || "Coordinateur"}</div>
              <div className="pole-navbar__userrole">Coordinateur</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="pole-nav-link"
            style={{ marginLeft: 8, opacity: 0.7 }}
            title="Déconnexion"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Contenu (Plannings ou Emplois) ── */}
      <main className="pole-main">
        <Outlet />
      </main>
    </div>
  );
}