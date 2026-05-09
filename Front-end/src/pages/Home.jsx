import { Link } from "react-router-dom";
import "../styles/Home.css";

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="8" y1="14" x2="16" y2="14"/>
      </svg>
    ),
    title: "Planning de Formation",
    desc: "Planifiez et distribuez les heures par module, suivez l'avancement en temps réel et visualisez les semaines encore disponibles.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: "Emplois du Temps",
    desc: "Créez les emplois du temps des groupes et des formateurs. Consultez, imprimez et partagez en quelques clics.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    title: "Alertes Pédagogiques",
    desc: "Détectez automatiquement les modules en retard, les risques d'avancement insuffisant et les groupes à surveiller.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Gestion du Personnel",
    desc: "Gérez formateurs, absences, filières, groupes et salles depuis un tableau de bord centralisé et sécurisé.",
  },
];

export default function Home() {
  return (
    <div className="home-page">

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-dot" />
          <div className="brand-info">
            <span className="brand-name">ISTA Hay Salam</span>
            <span className="brand-sub">CF SALÉ I · OFPPT</span>
          </div>
        </div>
        <Link to="/login" className="nav-cta-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Se connecter
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            Plateforme numérique · Année 2025–2026
          </div>
          <h1 className="hero-title">
            Gestion Pédagogique<br />
            <span>Centralisée</span>
          </h1>
          <p className="hero-desc">
            Plannings, emplois du temps, alertes et suivi de formation — tout en un seul endroit pour l'ensemble du personnel de l'établissement.
          </p>
          <Link to="/login" className="btn-hero">
            Accéder à la plateforme
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>

        <div className="hero-decor decor-1" />
        <div className="hero-decor decor-2" />
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div className="features-header">
          <h2 className="features-title">Ce que la plateforme permet</h2>
          <p className="features-sub">Des outils pensés pour la direction, les coordinateurs pôle et les formateurs.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon-wrap">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <span>OFPPT — ISTA Hay Salam © {new Date().getFullYear()}</span>
        <span style={{ color: "#d1d5db" }}>·</span>
        <span>CF SALÉ I</span>
      </footer>

    </div>
  );
}
