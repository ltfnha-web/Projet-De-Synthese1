import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";

const ROLE_REDIRECTS = {
  directeur: "/directeur/dashboard",
  surveillant: "/surveillant/planning",
  formateur: "/formateur/seances",
  stagiaire: "/stagiaire/espace",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <div className="login-page">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="brand">
          <div className="brand-logo">
            <img src="/logoOfppt.png" alt="logo OFPPT" />
          </div>
          <div className="brand-info">
            <span className="brand-name">OFPPT</span>
            <span className="brand-sub">Gestion Pédagogique</span>
          </div>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-text-link">Accueil</Link>
        </div>
      </nav>

      {/* Login Content */}
      <main className="login-main">
        {/* Left decoration panel */}
        <div className="login-left">
          <div className="login-left-inner">
            <div className="login-badge">
              <div className="badge-dot"></div>
              Plateforme officielle OFPPT
            </div>
            <h1 className="login-hero-title">
              Bienvenue sur votre<br />
              <span>espace personnel</span>
            </h1>
            <p className="login-hero-desc">
              Connectez-vous pour accéder à vos cours, votre planning et vos ressources pédagogiques.
            </p>
            <div className="login-features">
              <div className="login-feature">
                <div className="feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <span>Support disponible 24h/24</span>
              </div>
              <div className="login-feature">
                <div className="feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span>Connexion sécurisée SSL 256 bits</span>
              </div>
              <div className="login-feature">
                <div className="feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <span>Accès en temps réel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-card-header">
              <div className="login-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <h2 className="login-title">Connexion</h2>
              <p className="login-subtitle">Accédez à votre espace personnel</p>
            </div>

            {error && (
              <div className="login-error">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Adresse e-mail</label>
                <div className="input-wrapper">
                  
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <div className="input-wrapper">
                
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="forgot-row">
                  <a href="#" className="forgot-link">Mot de passe oublié ?</a>
                </div>
              </div>

              <button className="btn-connect" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10 17 15 12 10 7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Se connecter
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Connexion sécurisée — vos données sont protégées
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}