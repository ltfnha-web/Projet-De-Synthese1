import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

export default function ReinitialisationMotDePasse() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get("token") || "";
  const email                   = searchParams.get("email") || "";

  const [oldPassword, setOldPassword]   = useState("");
  const [newPassword, setNewPassword]   = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState("");
  const [linkError, setLinkError]       = useState("");
  const [success, setSuccess]           = useState(false);

  /* Fetch old password from API on mount */
  useEffect(() => {
    if (!token || !email) {
      setLinkError("Lien invalide. Veuillez refaire une demande.");
      setLoading(false);
      return;
    }
    axios.get("/forgot-password/info", { params: { token, email } })
      .then(r => {
        setOldPassword(r.data.old_password || "");
        setLoading(false);
      })
      .catch(err => {
        setLinkError(
          err.response?.data?.error || "Lien invalide ou expiré."
        );
        setLoading(false);
      });
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("/reset-password", {
        token,
        email,
        password:               newPassword,
        password_confirmation:  confirm,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) {
        const first = Object.values(errs)[0];
        setError(Array.isArray(first) ? first[0] : first);
      } else {
        setError(err.response?.data?.error || "Une erreur est survenue.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", color: "#71717a" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #e4e4e7",
            borderTopColor: "#22c55e", borderRadius: "50%",
            animation: "spin .8s linear infinite", margin: "0 auto 14px" }} />
          Vérification du lien…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  /* ── Invalid link ── */
  if (linkError) {
    return (
      <div className="login-page">
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
        </header>
        <main className="login-main" style={{ gridTemplateColumns: "1fr" }}>
          <div className="login-right" style={{ flex: 1 }}>
            <div className="login-card" style={{ maxWidth: 420, textAlign: "center" }}>
              <div style={{ width: 52, height: 52, background: "#fee2e2",
                borderRadius: 14, display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="#dc2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 className="login-title" style={{ marginBottom: 8 }}>Lien invalide</h2>
              <p className="login-subtitle" style={{ marginBottom: 24 }}>{linkError}</p>
              <Link to="/mot-de-passe-oublie" className="btn-connect"
                style={{ textDecoration: "none", display: "flex" }}>
                Refaire une demande
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Success ── */
  if (success) {
    return (
      <div className="login-page">
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
        </header>
        <main className="login-main" style={{ gridTemplateColumns: "1fr" }}>
          <div className="login-right" style={{ flex: 1 }}>
            <div className="login-card" style={{ maxWidth: 420, textAlign: "center" }}>
              <div style={{ width: 56, height: 56,
                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                borderRadius: 16, display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 16px",
                boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="login-title" style={{ marginBottom: 8 }}>
                Mot de passe modifié !
              </h2>
              <p className="login-subtitle" style={{ marginBottom: 24 }}>
                Votre mot de passe a été mis à jour avec succès.<br/>
                Redirection vers la connexion…
              </p>
              <Link to="/login" className="btn-connect"
                style={{ textDecoration: "none", display: "flex" }}>
                Se connecter maintenant
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div className="login-page">

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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M15 3H19a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H15"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Se connecter
          </Link>
        </div>
      </header>

      <main className="login-main" style={{ gridTemplateColumns: "1fr" }}>
        <div className="login-right" style={{ flex: 1 }}>
          <div className="login-card" style={{ maxWidth: 440 }}>

            <div className="login-card-header">
              <div className="login-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h1 className="login-title">Nouveau mot de passe</h1>
              <p className="login-subtitle">
                Définissez votre nouveau mot de passe ci-dessous.
              </p>
            </div>

            {error && (
              <div className="login-error">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>

              {/* Ancien mot de passe — pré-rempli, lecture seule */}
              <div className="form-group">
                <label className="form-label">Ancien mot de passe</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    value={oldPassword}
                    readOnly
                    style={{ background: "#f4f4f5", color: "#52525b",
                      cursor: "default", fontFamily: "monospace",
                      letterSpacing: 1, paddingLeft: 14 }}
                  />
                </div>
              </div>

              {/* Nouveau mot de passe */}
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <div className="input-wrapper">
                  <input
                    type={showNew ? "text" : "password"}
                    className="form-input"
                    placeholder="Minimum 6 caractères"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    disabled={submitting}
                    style={{ paddingLeft: 14 }}
                  />
                  <button type="button" className="input-toggle"
                    onClick={() => setShowNew(v => !v)}>
                    {showNew ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
                          a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4
                          c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07
                          a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmer mot de passe */}
              <div className="form-group">
                <label className="form-label">Confirmer le mot de passe</label>
                <div className="input-wrapper">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="form-input"
                    placeholder="Répétez le mot de passe"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    disabled={submitting}
                    style={{ paddingLeft: 14 }}
                  />
                  <button type="button" className="input-toggle"
                    onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
                          a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4
                          c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07
                          a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button className="btn-connect" type="submit" disabled={submitting}>
                {submitting ? (
                  <><span className="spinner" /> Modification en cours…</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Modifier le mot de passe
                  </>
                )}
              </button>

              <div style={{ textAlign: "center", marginTop: 4 }}>
                <Link to="/login" className="forgot-link">
                  Annuler et retourner à la connexion
                </Link>
              </div>

            </form>
          </div>
        </div>
      </main>

    </div>
  );
}
