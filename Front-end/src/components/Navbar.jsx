import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

// Menus par rôle
const MENUS = {
  directeur: [
    { label: "Dashboard",          path: "/directeur/dashboard",   icon: "📊" },
    { label: "Utilisateurs",       path: "/directeur/utilisateurs",icon: "👥" },
    { label: "Formateurs",         path: "/directeur/formateurs",  icon: "🎓" },
    { label: "Groupes",            path: "/directeur/groupes",     icon: "🏫" },
    { label: "Salles",             path: "/directeur/salles",      icon: "🚪" },
    { label: "Modules",            path: "/directeur/modules",     icon: "📚" },
    { label: "Planification",      path: "/directeur/planification",icon: "📅" },
    { label: "Emploi du Temps",    path: "/directeur/emploi-temps",icon: "🗓️" },
    { label: "Suivi Pédagogique",  path: "/directeur/suivi",       icon: "📈" },
  ],
  surveillant: [
    { label: "Planning",        path: "/surveillant/planning",      icon: "📋" },
    { label: "Emploi du Temps", path: "/surveillant/emploi-temps",  icon: "🗓️" },
    { label: "Suivi",           path: "/surveillant/suivi",         icon: "📈" },
  ],
  formateur: [
    { label: "Mes Séances",  path: "/formateur/seances",  icon: "📖" },
    { label: "Validation",   path: "/formateur/validation",icon: "✅" },
  ],
};

const ROLE_LABELS = {
  directeur:   "Directeur",
  surveillant: "Surveillant Général",
  formateur:   "Formateur",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  if (!user) return null;

  const menuItems = MENUS[user.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* Logo / Titre */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🏛️</span>
          <span className="logo-text">OFPPT</span>
        </div>
        <p className="sidebar-subtitle">Gestion Pédagogique</p>
      </div>

      {/* Infos utilisateur */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <p className="user-name">{user.name}</p>
          <span className={`role-badge role-${user.role}`}>
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item--active" : ""}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}