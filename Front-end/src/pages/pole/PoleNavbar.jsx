import React from 'react';

const PoleNavbar = ({ activePage, setActivePage }) => {
  return (
    <nav className="pole-navbar">
      <div className="pole-navbar__brand">
        <div className="pole-navbar__logo">IS</div>
        <div>
          <div className="pole-navbar__name">ISTA HAY SALAM</div>
          <div className="pole-navbar__role">Espace Pôle</div>
        </div>
      </div>

      <div className="pole-navbar__links">
        <button
          className={`pole-nav-link ${activePage === 'planning' ? 'active' : ''}`}
          onClick={() => setActivePage('planning')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Planning
        </button>

        <button
          className={`pole-nav-link ${activePage === 'emplois' ? 'active' : ''}`}
          onClick={() => setActivePage('emplois')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Emplois du temps
        </button>
      </div>

      <div className="pole-navbar__right">
        <span className="pole-navbar__badge">Pôle Dev Digital</span>
        <div className="pole-navbar__user">
          <div className="pole-navbar__avatar">PC</div>
          <div>
            <div className="pole-navbar__username">Ahmed Coordinateur</div>
            <div className="pole-navbar__userrole">Coordinateur</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PoleNavbar;