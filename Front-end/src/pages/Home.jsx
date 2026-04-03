import { Link } from "react-router-dom";
import "../styles/Home.css";

const STATS = [
  { num: "350+", label: "Établissements" },
  { num: "92k", label: "Stagiaires" },
  { num: "8k+", label: "Formateurs" },
  { num: "120+", label: "Filières" },
];

const SERVICES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Espace Stagiaire",
    desc: "Consultez vos cours, absences, notes et planning en temps réel.",
    link: "/stagiaire/espace",
    color: "teal",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: "Espace Formateur",
    desc: "Gérez vos séances, ressources pédagogiques et évaluations.",
    link: "/login",
    color: "blue",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    title: "Administration",
    desc: "Superviser les établissements, directeurs et ressources humaines.",
    link: "/login",
    color: "amber",
  },
];

export default function Home() {
  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-logo">
            <img src="/logoOfppt.png" alt="logo OFPPT" />
          </div>
          <div className="brand-info">
            <span className="brand-name">OFPPT</span>
            <span className="brand-sub">Gestion Pédagogique</span>
          </div>
        </div>
        <div className="nav-links">
          <a href="#services" className="nav-text-link">Services</a>
          <Link to="/login" className="nav-cta-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Se connecter
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <div className="badge-dot"></div>
            Plateforme officielle OFPPT
          </div>
          <h1 className="hero-title">
            Plateforme de<br />
            <span>Gestion Pédagogique</span>
          </h1>
          <p className="hero-desc">
            Organisez vos cours, vos stagiaires et vos ressources dans une seule plateforme unifiée, sécurisée et accessible partout.
          </p>
          <div className="hero-actions">
            <Link to="/stagiaire/espace" className="btn" >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              Espace Stagiaire
            </Link>
            <Link to="/login" className="btn-outline">
              Accès Personnel
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          {STATS.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Decorative shapes */}
        <div className="hero-decor decor-1"></div>
        <div className="hero-decor decor-2"></div>
      </section>

      {/* Services Section */}
      <section className="services-section" id="services">
        <div className="section-header">
          <span className="section-tag">Nos espaces</span>
          <h2 className="section-title">Choisissez votre espace</h2>
          <p className="section-desc">Chaque profil dispose d'un accès personnalisé à la plateforme.</p>
        </div>
        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <Link to={s.link} className={`service-card service-${s.color}`} key={i}>
              <div className="service-icon">{s.icon}</div>
              <h3 className="service-title">{s.title}</h3>
              <p className="service-desc">{s.desc}</p>
              <div className="service-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-brand">
          <div className="brand-logo small">
            <img src="/logoOfppt.png" alt="OFPPT" />
          </div>
          <span>OFPPT © {new Date().getFullYear()} — Tous droits réservés</span>
        </div>
        <div className="footer-links">
          <a href="#">Mentions légales</a>
          <a href="#">Politique de confidentialité</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}