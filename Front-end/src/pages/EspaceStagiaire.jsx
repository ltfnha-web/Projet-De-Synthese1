import { Link } from "react-router-dom";
import "../styles/Stagiaire.css";

const SERVICES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: "Emploi du Temps",
    desc: "Consultez votre planning hebdomadaire, vos séances, salles et formateurs en temps réel.",
    color: "blue",
    soon: false,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: "Modules & Cours",
    desc: "Accédez aux ressources pédagogiques, supports de cours et documents de vos modules.",
    color: "teal",
    soon: true,
  },
  
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: "Attestations",
    desc: "Téléchargez vos attestations de scolarité et documents administratifs officiels.",
    color: "coral",
    soon: true,
  },

];

const STEPS = [
  { num: "01", title: "Accédez à la plateforme", desc: "Rendez-vous sur la page d'accueil de la plateforme OFPPT." },
  { num: "02", title: "Consultez l'emploi du temps", desc: "Cliquez sur 'Emploi du Temps' pour voir votre planning de la semaine." },
  { num: "03", title: "Restez informé", desc: "Les mises à jour sont en temps réel — vérifiez régulièrement." },
];

export default function EspaceStagiaire() {
  return (
    <div className="stg-page">

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/home" className="brand">
          <div className="brand-logo">
            <img src="/logoOfppt.png" alt="OFPPT" />
          </div>
          <div className="brand-info">
            <span className="brand-name">OFPPT</span>
            <span className="brand-sub">Espace Stagiaire</span>
          </div>
        </Link>
        <div className="nav-links">
          <Link to="/home" className="nav-text-link">Accueil</Link>
          <Link to="/login" className="nav-cta-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Connexion Personnel
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="stg-hero">
        <div className="stg-hero-content">
          <div className="stg-badge">
            <div className="badge-dot"></div>
            Espace dédié aux stagiaires
          </div>
          <h1 className="stg-title">
            Votre espace<br />
            <span>étudiant en ligne</span>
          </h1>
          <p className="stg-desc">
            Accédez à tous vos services académiques depuis un seul endroit — emploi du temps, notes, absences et bien plus encore.
          </p>
          <div className="stg-actions">
            <a href="#emploi" className="btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Voir l'emploi du temps
            </a>
            <a href="#services" className="btn-outline">
              Découvrir les services
            </a>
          </div>
        </div>

        {/* Floating cards decoration */}
        <div className="stg-hero-visual">
          <div className="float-card fc-1">
            <div className="fc-icon teal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div className="fc-title">Emploi du Temps</div>
              <div className="fc-sub">Mis à jour en temps réel</div>
            </div>
          </div>
          <div className="float-card fc-2">
            <div className="fc-icon blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div>
              <div className="fc-title">Suivi académique</div>
              <div className="fc-sub">Notes & progression</div>
            </div>
          </div>
          <div className="float-card fc-3">
            <div className="fc-icon green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <div className="fc-title">92k+ Stagiaires</div>
              <div className="fc-sub">Font confiance à OFPPT</div>
            </div>
          </div>
        </div>

        <div className="hero-decor d1"></div>
        <div className="hero-decor d2"></div>
      </section>

      {/* Services Grid */}
      <section className="stg-services" id="services">
        <div className="section-header">
          <span className="section-tag">Nos services</span>
          <h2 className="section-title">Tout ce dont vous avez besoin</h2>
          <p className="section-desc">Des outils pensés pour simplifier votre parcours académique.</p>
        </div>

        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <div className={`service-card sc-${s.color} ${s.soon ? "sc-soon" : ""}`} key={i}>
              {s.soon && <div className="soon-badge">Bientôt disponible</div>}
              <div className={`sc-icon icon-${s.color}`}>{s.icon}</div>
              <h3 className="sc-title">{s.title}</h3>
              <p className="sc-desc">{s.desc}</p>
              {!s.soon && (
                <a href="#emploi" className="sc-link">
                  Accéder
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="stg-steps">
        <div className="section-header">
          <span className="section-tag">Comment ça marche</span>
          <h2 className="section-title">Simple et rapide</h2>
        </div>
        <div className="steps-row">
          {STEPS.map((step, i) => (
            <div className="step-card" key={i}>
              <div className="step-num">{step.num}</div>
              <h4 className="step-title">{step.title}</h4>
              <p className="step-desc">{step.desc}</p>
              {i < STEPS.length - 1 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="stg-cta" id="emploi">
        <div className="cta-inner">
          <h2>Consultez votre emploi du temps</h2>
          <p>Votre planning mis à jour en temps réel par votre établissement.</p>
          <div className="cta-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Cette fonctionnalité sera disponible prochainement. Contactez votre établissement pour plus d'informations.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="stg-footer">
        <div className="footer-brand">
          <div className="brand-logo small">
            <img src="/logoOfppt.png" alt="OFPPT" />
          </div>
          <span>OFPPT © {new Date().getFullYear()} — Tous droits réservés</span>
        </div>
        <div className="footer-links">
          <a href="#">Mentions légales</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}