import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

export default function MotDePasseOublie() {
  const [loginEmail, setLoginEmail]       = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [loading, setLoading]             = useState(false);
  const [errors, setErrors]               = useState({});
  const [sent, setSent]                   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await axios.post("/forgot-password", {
        login_email:    loginEmail,
        personal_email: personalEmail,
      });
      setSent(true);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) {
        setErrors(errs);
      } else {
        setErrors({ general: err.response?.data?.message || "Une erreur est survenue. Veuillez réessayer." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* Navbar */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-logo">
            <img src="/logoOfppt.png" alt="OFPPT"
              onError={e => { e.target.style.display = "none"; }} />
          </div>
          <div className="brand-info">
            <span className="brand-name">ISTA Hay Salam</span>
            <span className="brand-sub">CF SALE I</span>
          </div>
        </div>
        <div className="nav-links">
          <Link to="/login" className="nav-cta-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3H19a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H15"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Se connecter
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="login-main" style={{ gridTemplateColumns: "1fr" }}>
        <div className="login-right" style={{ flex: 1 }}>
          <div className="login-card" style={{ maxWidth: 420 }}>

            {/* Icon */}
            <div className="login-card-header">
              <div className="login-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h1 className="login-title">Mot de passe oublié</h1>
              <p className="login-subtitle">
                Entrez votre email de connexion et votre email personnel.
                Votre mot de passe vous sera envoyé sur votre email personnel.
              </p>
            </div>

            {/* Sent confirmation */}
            {sent ? (
              <div style={{
                background: "#f0fdf4", border: "1.5px solid #86efac",
                borderRadius: 12, padding: "20px 18px", textAlign: "center",
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                  stroke="#16a34a" strokeWidth="2" style={{ marginBottom: 12 }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12
                    19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72
                    12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91
                    a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45
                    12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <p style={{ fontWeight: 700, fontSize: 15, color: "#15803d", marginBottom: 6 }}>
                  Email envoyé !
                </p>
                <p style={{ fontSize: 13, color: "#52525b", lineHeight: 1.6, marginBottom: 20 }}>
                  Consultez votre boîte de réception. Le lien expire dans <strong>1 heure</strong>.
                </p>
                <Link to="/login" className="btn-connect" style={{ textDecoration: "none", display: "flex" }}>
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <form className="login-form" onSubmit={handleSubmit}>

                {errors.general && (
                  <div className="login-error">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errors.general}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email de connexion</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      className="form-input"
                      placeholder="votre.email@ista.ma"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                      disabled={loading}
                      style={{ paddingLeft: 14 }}
                    />
                  </div>
                  {errors.login_email && (
                    <div className="login-error" style={{ marginTop: 6 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {errors.login_email[0]}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Email personnel</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      className="form-input"
                      placeholder="votre@gmail.com"
                      value={personalEmail}
                      onChange={e => setPersonalEmail(e.target.value)}
                      required
                      disabled={loading}
                      style={{ paddingLeft: 14 }}
                    />
                  </div>
                  {errors.personal_email && (
                    <div className="login-error" style={{ marginTop: 6 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {errors.personal_email[0]}
                    </div>
                  )}
                </div>

                <button className="btn-connect" type="submit" disabled={loading}>
                  {loading ? (
                    <><span className="spinner" /> Envoi en cours...</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      Envoyer les instructions
                    </>
                  )}
                </button>

                <div style={{ textAlign: "center", marginTop: 4 }}>
                  <Link to="/login" className="forgot-link">
                    Retour à la connexion
                  </Link>
                </div>

              </form>
            )}

          </div>
        </div>
      </main>

    </div>
  );
}
