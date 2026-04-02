import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

// Redirection selon le rôle après connexion
const ROLE_REDIRECTS = {
  directeur:   "/directeur/dashboard",
  surveillant: "/surveillant/planning",
  formateur:   "/formateur/seances",
};

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();     // empêche le rechargement de la page
    setError("");
    setLoading(true);

    try {
      const user     = await login(email, password); // appel API Laravel
      const redirect = ROLE_REDIRECTS[user.role] || "/";
      navigate(redirect, { replace: true });         // redirection selon rôle
    } catch (err) {
      const msg = err.response?.data?.message || "Email ou mot de passe incorrect.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">

      {/* ── Navbar ────────────────────────────── */}
      <nav className="navbar">
        <h2 className="logo">🎓 PedagoSys</h2>
      </nav>

      {/* ── Hero ──────────────────────────────── */}
      <div className="hero">

        {/* Gauche : présentation */}
        <div className="hero-left">
          <h1>
            Plateforme de <span>Gestion Pédagogique</span>
          </h1>
          <p>
            Organisez vos cours, vos étudiants et vos ressources
            dans une seule plateforme.
          </p>
          <button className="start-btn">
            Service Stagiaire
          </button>
        </div>

        {/* Droite : formulaire */}
        <div className="hero-right">
          <div className="login-card">

            <h3>Connexion</h3>

            {/* Affichage erreur si mauvais identifiants */}
            {error && (
              <div className="login-error">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              <button
                type="submit"
                className="connect-btn"
                disabled={loading}
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </button>

            </form>

            <p className="forgot">Mot de passe oublié ?</p>

          </div>
        </div>

      </div>
    </div>
  );
}