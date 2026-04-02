import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

const ROLE_REDIRECTS = {
  directeur: "/directeur/dashboard",
  surveillant: "/surveillant/planning",
  formateur: "/formateur/seances",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      const redirect = ROLE_REDIRECTS[user.role] || "/";
      navigate(redirect);
    } catch {
      setError("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  // Fermer dropdown si clic à l’extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-logo">
            <img src="logoOfppt.png" alt="logo OFPPT" />
          </div>
        </div>

        <div className="nav-right" ref={dropdownRef}>
          <div className="nav-item">
            <button
              className={`nav-icon-btn ${dropdownOpen ? "active" : ""}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {/* SVG maison */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3l10 9h-3v9h-6v-6H11v6H5v-9H2l10-9z"/>
              </svg>
            </button>

            {dropdownOpen && (
              <div className="dropdown-panel open">
                <div className="dropdown-label">Navigation</div>
                <a href="#" className="dropdown-item active-item">
                  {/* SVG maison */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3l10 9h-3v9h-6v-6H11v6H5v-9H2l10-9z"/>
                  </svg>
                  <span>Home</span>
                </a>
                <a href="#" className="dropdown-item">
                  {/* SVG utilisateur */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V22h19.2v-2.8c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                  <span>Stagiaires</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        {/* Hero */}
        <div className="hero">
          <h1 className="hero-title">
            Plateforme de <br />
            <span>Gestion Pédagogique</span>
          </h1>
          <p className="hero-desc">
            Organisez vos cours, vos étudiants et vos ressources dans une seule plateforme.
          </p>
          <a href="#" className="btn-stg">Service Stagiaire</a>
        </div>

        {/* Login Form */}
        <div className="login-card">
          <h2 className="login-title">Connexion</h2>

          {error && <div style={{ color: "red", textAlign: "center" }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                className="form-input"
                placeholder="directeur@ofppt.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button className="btn-connect" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <a href="#" className="forgot-link">Mot de passe oublié ?</a>
        </div>
      </main>
    </>
  );
}