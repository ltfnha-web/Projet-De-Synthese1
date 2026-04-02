import { useState } from "react";
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
    } catch (err) {
      setError("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-logo">
            <img src="logoOfppt.png" alt="logo" />
          </div>
        </div>

        <div className="nav-right">
          <div className="nav-item">
            <button className="nav-icon-btn">
              <i className="bx bxs-home"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="main-content">
        
        {/* HERO LEFT */}
        <div className="hero">
          <h1 className="hero-title">
            Plateforme de <br />
            <span>Gestion Pédagogique</span>
          </h1>
          <p className="hero-desc">
            Organisez vos cours, vos étudiants et vos ressources dans une seule plateforme.
          </p>
          <a href="#" className="btn-primary">
            Service Stagiaire
          </a>
        </div>

        {/* LOGIN RIGHT */}
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

          <a href="#" className="forgot-link">
            Mot de passe oublié ?
          </a>
        </div>

      </main>
    </>
  );
}