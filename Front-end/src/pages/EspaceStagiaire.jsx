import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/Stagiaire.css";

const SEANCES = [
  { label: "Séance 1", horaire: "08:30–11:00" },
  { label: "Séance 2", horaire: "11:00–13:30" },
  { label: "Séance 3", horaire: "13:30–16:00" },
  { label: "Séance 4", horaire: "16:00–18:30" },
];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function toStr(v) {
  if (v == null) return "";
  if (typeof v === "object") return v.intitule ?? v.code ?? v.nom ?? "";
  return String(v);
}

/* ── Timetable grid ─────────────────────────────────────────────── */
function EmploiGrid({ grille }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
        <thead>
          <tr>
            <th style={{ background: "#0f172a", color: "#fff", padding: "11px 14px", border: "1px solid #1e293b", width: 86, fontSize: 11, fontWeight: 700, textAlign: "left" }}>
              Jour
            </th>
            {SEANCES.map((s, i) => (
              <th key={i} style={{ background: "#0f172a", color: "#fff", padding: "9px 14px", textAlign: "center", border: "1px solid #1e293b" }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{s.label}</div>
                <div style={{ fontWeight: 400, fontSize: 10, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{s.horaire}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {JOURS.map((jour, ji) => (
            <tr key={jour} style={{ background: ji % 2 === 0 ? "#fff" : "#f8fafc" }}>
              <td style={{ padding: "10px 14px", fontWeight: 800, fontSize: 12, border: "1px solid #e4e4e7", color: "#0f172a", letterSpacing: .3 }}>
                {jour}
              </td>
              {[0, 1, 2, 3].map(si => {
                const cell = (grille?.[jour] ?? [])[si];
                if (!cell?.module) return (
                  <td key={si} style={{ padding: "14px", textAlign: "center", color: "#d1d5db", border: "1px solid #e4e4e7", fontSize: 20 }}>·</td>
                );
                const isOnline = cell.mode === "DISTANCIEL";
                return (
                  <td key={si} style={{ padding: "10px 13px", verticalAlign: "top", border: "1px solid #e4e4e7", background: isOnline ? "#ecfeff" : "#f0fdf4" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#111", marginBottom: 3 }}>{toStr(cell.module)}</div>
                    {cell.formateur && (
                      <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginBottom: 3 }}>{toStr(cell.formateur)}</div>
                    )}
                    <div style={{ fontSize: 10, color: "#6b7280" }}>
                      {isOnline
                        ? <span style={{ color: "#0891b2", fontWeight: 600 }}>En ligne</span>
                        : <>{cell.salle || "—"} · Présentiel</>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Print doc ──────────────────────────────────────────────────── */
function PrintDoc({ groupe, semestre, periodeDebut, formateurParrain, grille }) {
  const TD  = { border: "1px solid #000", padding: "2px 5px", verticalAlign: "top", color: "#000", background: "#fff", fontSize: 9, fontFamily: "Arial, Helvetica, sans-serif" };
  const TBL = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" };
  const NAVY = "#1a3a5f";
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 9, color: "#000", background: "#fff", width: "100%" }}>
      <div style={{ background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 10px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 0.5 }}>EMPLOI DU TEMPS</div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,.6)", marginTop: 2 }}>
            Année de Formation 2025–2026 &nbsp;|&nbsp; CF SALÉ I
          </div>
        </div>
      </div>
      <table style={{ ...TBL, border: "1px solid #aaa" }}>
        <tbody>
          <tr>
            <td style={{ ...TD, background: "#f0f0f0", fontWeight: 700, width: "9%" }}>EFP :</td>
            <td style={{ ...TD, fontWeight: 700, width: "17%" }}>ISTA HAY SALAM SALÉ</td>
            <td style={{ ...TD, background: "#f0f0f0", fontWeight: 700, width: "9%" }}>Groupe :</td>
            <td style={{ ...TD, fontWeight: 700, width: "31%" }}>{groupe}</td>
            <td style={{ ...TD, background: "#f0f0f0", fontWeight: 700, width: "11%" }}>Semestre :</td>
            <td style={{ ...TD, fontWeight: 700, width: "23%" }}>{semestre}</td>
          </tr>
          <tr>
            <td style={{ ...TD, background: "#f0f0f0", fontWeight: 700 }}>CF :</td>
            <td style={{ ...TD, fontWeight: 700 }}>CF SALÉ I</td>
            <td style={{ ...TD, background: "#f0f0f0", fontWeight: 700 }}>Période :</td>
            <td style={{ ...TD }}>À partir du {periodeDebut ?? "—"}</td>
            <td style={{ ...TD, background: "#f0f0f0", fontWeight: 700, fontSize: 8 }}>Form. Parrain :</td>
            <td style={{ ...TD }}>{formateurParrain || "—"}</td>
          </tr>
        </tbody>
      </table>
      <table style={{ ...TBL, marginTop: 1 }}>
        <colgroup>
          <col style={{ width: "9%" }} />
          {SEANCES.map((_, i) => <col key={i} style={{ width: "22.75%" }} />)}
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...TD, background: NAVY, color: "#fff", textAlign: "center", fontSize: 8, fontWeight: 700 }}>Jour / Séance</th>
            {SEANCES.map((s, i) => (
              <th key={i} style={{ ...TD, background: NAVY, color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 10 }}>
                {s.horaire}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {JOURS.map(jour => (
            <tr key={jour}>
              <td style={{ ...TD, background: NAVY, color: "#fff", fontWeight: 700, textAlign: "center", fontSize: 9 }}>{jour}</td>
              {(Array.isArray(grille?.[jour]) ? grille[jour] : [null,null,null,null]).map((s, i) => {
                if (!s?.module) return <td key={i} style={{ ...TD, textAlign: "center", color: "#aaa", fontSize: 14 }}>—</td>;
                return (
                  <td key={i} style={{ ...TD, background: "#e8f0fe", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 9, color: "#1565c0" }}>{toStr(s.module)}</div>
                    {s.formateur && <div style={{ fontSize: 8, color: "#555" }}>{toStr(s.formateur)}</div>}
                    <div style={{ fontSize: 8, color: "#333" }}>■ {s.salle || "—"} · {s.mode === "DISTANCIEL" ? "FAD" : "Prés."}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ background: NAVY, display: "flex", justifyContent: "space-between", padding: "3px 8px", marginTop: 1 }}>
        <span style={{ fontSize: 7, color: "rgba(255,255,255,.75)", fontFamily: "Arial" }}>OFPPT — Office de la Formation Professionnelle et de la Promotion du Travail</span>
        <span style={{ fontSize: 7, color: "rgba(255,255,255,.75)", fontFamily: "Arial" }}>Version 1 — EMPLOI DU TEMPS GROUPE · Année 2025-2026</span>
      </div>
    </div>
  );
}

const SERVICES = [
  {
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    title: "Emploi du Temps",
    desc: "Consultez votre planning hebdomadaire, vos séances, salles et formateurs en temps réel.",
    color: "blue",
    href: "#emploi",
  },
  {
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    title: "Modules & Cours",
    desc: "Accédez aux ressources pédagogiques, supports de cours et documents de vos modules.",
    color: "teal",
    soon: true,
  },
  {
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    title: "Attestations",
    desc: "Téléchargez vos attestations de scolarité et documents administratifs officiels.",
    color: "coral",
    soon: true,
  },
];

const STEPS = [
  { num: "01", title: "Choisissez votre groupe", desc: "Sélectionnez votre groupe dans la liste déroulante de la section emploi du temps." },
  { num: "02", title: "Consultez le planning", desc: "Votre emploi du temps s'affiche instantanément avec salles, formateurs et horaires." },
  { num: "03", title: "Imprimez ou restez informé", desc: "Imprimez votre planning ou consultez-le chaque semaine — il est mis à jour en temps réel." },
];

export default function EspaceStagiaire() {
  const [groupes, setGroupes]       = useState([]);
  const [groupeId, setGroupeId]     = useState("");
  const [emploi, setEmploi]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [notFound, setNotFound]     = useState(false);
  const [search, setSearch]         = useState("");
  const emploiRef = useRef(null);

  useEffect(() => {
    axios.get("/public-groupes")
      .then(r => setGroupes(r.data.data ?? []))
      .catch(() => {});
  }, []);

  const handleSelectGroupe = async (id) => {
    setGroupeId(id);
    setEmploi(null);
    setNotFound(false);
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/public-emploi?groupe_id=${id}`);
      if (data.data) {
        setEmploi(data.data);
        setTimeout(() => emploiRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const el = document.getElementById("stg-print-doc");
    if (!el) return;
    const win = window.open("", "_blank", "width=1200,height=850");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Emploi du temps — ${emploi?.groupe ?? ""}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { background: #fff; font-family: Arial, Helvetica, sans-serif; }
  @page { size: A4 landscape; margin: 5mm; }
  @media print { html { zoom: 0.85; } }
</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const filteredGroupes = groupes.filter(g =>
    !search || toStr(g.nom).toLowerCase().includes(search.toLowerCase()) ||
    toStr(g.filiere).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="stg-page">

      {/* Navbar */}
      <nav className="navbar">
        <Link to="/home" className="brand">
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
            <a href="#services" className="btn-outline">Découvrir les services</a>
          </div>
        </div>

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
              <div className="fc-sub">Notes &amp; progression</div>
            </div>
          </div>
          <div className="float-card fc-3">
            <div className="fc-icon green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <div className="fc-title">Groupes actifs</div>
              <div className="fc-sub">{groupes.length} groupes disponibles</div>
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
                <a href={s.href ?? "#emploi"} className="sc-link">
                  Accéder
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
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

      {/* ══ EMPLOI DU TEMPS SECTION ════════════════════════════════════ */}
      <section id="emploi" style={{ padding: "60px 0", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: "#16a34a", background: "rgba(34,197,94,.1)", padding: "4px 14px", borderRadius: 20, letterSpacing: .5, marginBottom: 12, textTransform: "uppercase" }}>
              Emploi du temps
            </span>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
              Consultez votre planning
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 520, margin: "0 auto" }}>
              Sélectionnez votre groupe pour afficher votre emploi du temps hebdomadaire.
            </p>
          </div>

          {/* Search + select card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,.07)", padding: "28px 32px", marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 260px" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, textTransform: "uppercase", letterSpacing: .4 }}>
                  Rechercher un groupe
                </label>
                <input
                  type="text"
                  placeholder="Nom du groupe ou filière…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", transition: "border-color .15s" }}
                  onFocus={e => e.target.style.borderColor = "#22c55e"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
              <div style={{ flex: "1 1 260px" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 7, textTransform: "uppercase", letterSpacing: .4 }}>
                  Groupe *
                </label>
                <select
                  value={groupeId}
                  onChange={e => handleSelectGroupe(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", background: "#fff", transition: "border-color .15s" }}
                  onFocus={e => e.target.style.borderColor = "#22c55e"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                >
                  <option value="">— Sélectionnez votre groupe —</option>
                  {filteredGroupes.map(g => (
                    <option key={g.id} value={g.id}>
                      {toStr(g.nom)}{g.filiere ? ` — ${toStr(g.filiere)}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {groupes.length === 0 && (
              <div style={{ marginTop: 14, fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Chargement des groupes…
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
              <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 14px" }} />
              Chargement de l'emploi du temps…
            </div>
          )}

          {/* Not found */}
          {notFound && !loading && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #fde68a", padding: "28px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#92400e", marginBottom: 6 }}>Aucun emploi du temps disponible</div>
              <div style={{ fontSize: 13, color: "#b45309" }}>
                L'emploi du temps de ce groupe n'a pas encore été publié. Revenez plus tard ou contactez votre établissement.
              </div>
            </div>
          )}

          {/* Timetable result */}
          {emploi && !loading && (
            <div ref={emploiRef} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,.08)", overflow: "hidden" }}>

              {/* Header bar */}
              <div style={{ background: "#0f172a", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
                    {emploi.groupe} &nbsp;·&nbsp; {emploi.semestre}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 3 }}>
                    À partir du {emploi.periodeDebut ?? "—"}
                    {emploi.formateur_parrain && <>&nbsp;·&nbsp; Formateur Parrain : <strong style={{ color: "#86efac" }}>{emploi.formateur_parrain}</strong></>}
                  </div>
                </div>
                <button
                  onClick={handlePrint}
                  style={{ display: "flex", alignItems: "center", gap: 7, height: 34, padding: "0 16px", borderRadius: 9, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.08)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Imprimer
                </button>
              </div>

              {/* Grid */}
              <div style={{ padding: "22px 24px" }}>
                <EmploiGrid grille={emploi.grille} />
              </div>

              {/* Hidden print content */}
              <div id="stg-print-doc" style={{ display: "none" }}>
                <PrintDoc
                  groupe={emploi.groupe}
                  semestre={emploi.semestre}
                  periodeDebut={emploi.periodeDebut}
                  formateurParrain={emploi.formateur_parrain}
                  grille={emploi.grille}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="stg-footer">
        <div className="footer-brand">
          <span>OFPPT © {new Date().getFullYear()} — Tous droits réservés</span>
        </div>
        <div className="footer-links">
          <a href="#">Mentions légales</a>
          <a href="#">Contact</a>
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
