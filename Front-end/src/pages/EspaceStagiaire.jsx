import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
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
    href: "#emploi",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: "Modules & Cours",
    desc: "Consultez la liste de vos modules, formateurs, heures et semestres pour votre filière.",
    color: "teal",
    href: "#modules",
  },
];

const STEPS = [
  { num: "01", title: "Choisissez votre filière", desc: "Sélectionnez votre filière de formation dans la liste." },
  { num: "02", title: "Consultez vos services", desc: "Accédez à l'emploi du temps ou à la liste de vos modules." },
  { num: "03", title: "Restez informé", desc: "Les données sont mises à jour en temps réel par votre établissement." },
];

const JOURS   = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const SEANCES = [
  { label: 'Séance 1', horaire: '08:30-11:00' },
  { label: 'Séance 2', horaire: '11:00-13:30' },
  { label: 'Séance 3', horaire: '13:30-16:00' },
  { label: 'Séance 4', horaire: '16:00-18:30' },
];

/* ─── Official OFPPT print document ─────────────── */
function DocumentStagiaireOFPPT({ emploi, groupeName, filiereName, annee }) {
  const TD  = { border: '1px solid #000', padding: '2px 5px', verticalAlign: 'top', color: '#000', background: '#fff', fontSize: 9, fontFamily: 'Arial, Helvetica, sans-serif' };
  const TBL = { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' };
  const grille = emploi.grille || {};

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 9, color: '#000', background: '#fff', padding: '6px 8px', boxSizing: 'border-box', width: '100%' }}>

      {/* ══ EN-TÊTE ══ */}
      <table style={TBL}>
        <colgroup><col style={{ width: '14%' }}/><col style={{ width: '56%' }}/><col style={{ width: '30%' }}/></colgroup>
        <tbody><tr>
          <td style={{ ...TD, textAlign: 'center', verticalAlign: 'middle', padding: '4px 6px' }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>OFPPT</div>
            <div style={{ fontSize: 7.5, direction: 'rtl', lineHeight: 1.5 }}>مكتب التكوين المهني وإنعاش الشغل</div>
            <div style={{ fontSize: 7, color: '#555', direction: 'rtl' }}>المملكة المغربية</div>
            <div style={{ marginTop: 2, fontWeight: 700, fontSize: 9 }}>CF SALE I</div>
          </td>
          <td style={{ ...TD, textAlign: 'center', verticalAlign: 'middle', padding: '5px 10px' }}>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, color: '#000' }}>EMPLOI DU TEMPS</div>
            <div style={{ fontSize: 9, direction: 'rtl', fontFamily: 'serif', color: '#333', margin: '2px 0' }}>جدول التوقيت الأسبوعي</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#000' }}>Année de Formation 2025-2026</div>
          </td>
          <td style={{ ...TD, textAlign: 'right', verticalAlign: 'middle', padding: '4px 8px' }}>
            <div style={{ direction: 'rtl', fontSize: 8.5, lineHeight: 1.7, color: '#000' }}>
              <div style={{ fontWeight: 700 }}>مكتب التكوين المهني والتقني</div>
              <div>Office de la Formation Professionnelle</div>
              <div>et de la Promotion du Travail</div>
            </div>
          </td>
        </tr></tbody>
      </table>

      {/* ══ EFP ══ */}
      <table style={TBL}><tbody><tr>
        <td style={{ ...TD, padding: '2px 6px' }}>
          <span style={{ fontWeight: 700 }}>EFP : </span>ISTA HAY SALAM SALE
          <span style={{ float: 'right', fontWeight: 700, textDecoration: 'underline' }}>Version 1</span>
        </td>
      </tr></tbody></table>

      {/* ══ BANDEAU CYAN ══ */}
      <table style={TBL}><tbody><tr>
        <td style={{ border: '1px solid #000', padding: '3px 8px', background: '#00bcd4', textAlign: 'center', fontWeight: 900, fontSize: 11, color: '#000' }}>
          Période d'application : A partir du {emploi.periode_debut ?? '—'}
        </td>
      </tr></tbody></table>

      {/* ══ INFOS GROUPE ══ */}
      <table style={TBL}><tbody><tr>
        <td style={{ ...TD, padding: '4px 8px' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 9 }}><tbody>
            {[
              ['Filière :', filiereName || '—'],
              ['Année :', annee ? `Année ${annee}` : '—'],
              ['Groupe :', <strong key="g">{groupeName || '—'}</strong>],
              ['Semestre :', emploi.semestre ?? '—'],
            ].map(([k, v], i) => (
              <tr key={i}>
                <td style={{ paddingRight: 6, fontWeight: 700, whiteSpace: 'nowrap', verticalAlign: 'top', lineHeight: 1.65, color: '#000' }}>{k}</td>
                <td style={{ lineHeight: 1.65, color: '#000' }}>{v}</td>
              </tr>
            ))}
          </tbody></table>
        </td>
      </tr></tbody></table>

      {/* ══ GRILLE HORAIRE ══ */}
      <table style={TBL}>
        <colgroup>
          <col style={{ width: '7%' }}/>
          <col style={{ width: '23.25%' }}/><col style={{ width: '23.25%' }}/>
          <col style={{ width: '23.25%' }}/><col style={{ width: '23.25%' }}/>
        </colgroup>
        <thead><tr>
          <th style={{ ...TD, background: '#d0d8e8', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle', padding: '2px 3px' }}>
            <div style={{ color: '#000', fontSize: 8.5 }}>Séances</div>
            <div style={{ color: '#000', fontSize: 8.5 }}>Jours</div>
          </th>
          {SEANCES.map((s, i) => (
            <th key={i} style={{ ...TD, background: '#d0d8e8', textAlign: 'center', fontWeight: 700, padding: '2px 4px' }}>
              <div style={{ color: '#000', fontSize: 9 }}>{s.label}</div>
              <div style={{ color: '#000', fontWeight: 400, fontSize: 8.5 }}>{s.horaire}</div>
            </th>
          ))}
        </tr></thead>
        <tbody>
          {JOURS.map(jour => {
            const seances = Array.isArray(grille[jour]) ? grille[jour] : [null,null,null,null];
            return (
              <tr key={jour}>
                <td style={{ ...TD, fontWeight: 700, fontSize: 9, textAlign: 'center', verticalAlign: 'middle', background: '#fafafa', color: '#000', padding: '2px 3px' }}>{jour}</td>
                {seances.map((s, i) => {
                  if (!s?.module) return <td key={i} style={{ ...TD, background: '#fff', padding: '2px 4px' }}><div style={{ minHeight: 32 }}/></td>;
                  return (
                    <td key={i} style={{ ...TD, background: '#fff', verticalAlign: 'top', padding: '2px 4px' }}>
                      <div style={{ fontSize: 8, color: '#444', marginBottom: 1 }}>{SEANCES[i].horaire}</div>
                      <div style={{ fontWeight: 700, fontSize: 9, color: '#000', lineHeight: 1.25, marginBottom: 1 }}>{s.module}</div>
                      <div style={{ fontSize: 8.5, color: '#000', marginBottom: 1 }}>{s.formateur || ''}</div>
                      <div style={{ fontSize: 8, color: '#000' }}>
                        {s.mode === 'DISTANCIEL' ? 'Formation à distance' : `Présentiel${s.salle ? ` / ${s.salle}` : ''}`}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ══ PIED DE PAGE ══ */}
      <table style={TBL}>
        <colgroup><col style={{ width: '35%' }}/><col style={{ width: '35%' }}/><col style={{ width: '30%' }}/></colgroup>
        <tbody><tr>
          <td style={{ ...TD, verticalAlign: 'top', padding: '3px 6px' }}>
            <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: 2, fontSize: 9, color: '#000' }}>Emargements :</div>
            <div style={{ fontSize: 8.5, lineHeight: 1.7, color: '#000' }}>
              <div>Fait à Salé</div>
              <div>Date : {emploi.periode_debut ?? '—'}</div>
            </div>
            <div style={{ height: 22 }}/>
          </td>
          <td style={{ ...TD, textAlign: 'center', verticalAlign: 'top', padding: '3px 6px' }}>
            <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: 3, fontSize: 9, color: '#000' }}>Le Directeur</div>
            <div style={{ height: 22 }}/>
            <div style={{ fontSize: 8.5, color: '#0055aa', fontWeight: 700, lineHeight: 1.7 }}>
              <div>KADDOURI HICHAM</div>
              <div>DIRECTEUR D'ETABLISSEMENT</div>
              <div>ISTA HAY SALAM SALE</div>
            </div>
          </td>
          <td style={{ ...TD, textAlign: 'center', verticalAlign: 'middle', padding: '3px 6px' }}>
            <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 3, color: '#000' }}>DRRSK</div>
            <div style={{ fontSize: 8.5, lineHeight: 1.7, color: '#000' }}>
              <div>ISTA Hay Salam - CF SALE 1</div>
              <div>Abd ABDELKRIM KHATABI</div>
              <div>Hay Salam - Salé</div>
            </div>
          </td>
        </tr></tbody>
      </table>
    </div>
  );
}

/* ─── On-screen timetable (pole/emploi style) ────── */
function EmploiGrid({ emploi, groupeName, filiereName, annee }) {
  const grille = emploi.grille || {};
  const hasAny = JOURS.some(j => grille[j]?.some(s => s?.module));

  if (!hasAny) {
    return <div className="stg-state-empty"><p>L'emploi du temps est vide pour ce groupe.</p></div>;
  }

  const handlePrint = () => {
    const docEl = document.getElementById('stg-ofppt-doc');
    if (!docEl) return;
    const win = window.open('', '_blank', 'width=1200,height=850');
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<title>Emploi du temps — ${groupeName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; font-family: Arial, Helvetica, sans-serif; }
  @page { size: A4 landscape; margin: 5mm; }
  @media print {
    html { zoom: 0.82; }
    @supports not (zoom: 1) { body { transform: scale(0.82); transform-origin: top left; width: 122%; } }
  }
</style></head>
<body>${docEl.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', background: '#fff', border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>

      {/* Action bar */}
      <div style={{ background: '#18181b', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
          {groupeName} · Semestre {emploi.semestre}
          {emploi.periode_debut && <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 12, marginLeft: 10 }}>À partir du {emploi.periode_debut}</span>}
        </span>
        <button onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', borderRadius: 7, padding: '6px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.20)'}
          onMouseOut={e  => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Imprimer / PDF
        </button>
      </div>

      {/* On-screen table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ background: '#18181b', color: '#a1a1aa', padding: '10px 14px', border: '1px solid #333', width: 90, fontSize: 11, fontWeight: 700, textAlign: 'left' }}>Jour</th>
              {SEANCES.map((s, i) => (
                <th key={i} style={{ background: '#18181b', color: '#fff', padding: '8px 12px', textAlign: 'center', border: '1px solid #333' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</div>
                  <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.55 }}>{s.horaire}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {JOURS.map((jour, ji) => (
              <tr key={jour} style={{ background: ji % 2 === 0 ? '#fff' : '#f4f4f5' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13, border: '1px solid #e4e4e7' }}>{jour}</td>
                {[0,1,2,3].map(si => {
                  const s = (grille[jour] ?? [])[si];
                  if (!s?.module) return (
                    <td key={si} style={{ padding: '10px 14px', textAlign: 'center', color: '#a1a1aa', border: '1px solid #e4e4e7' }}>—</td>
                  );
                  const dist = s.mode === 'DISTANCIEL';
                  return (
                    <td key={si} style={{ padding: '10px 14px', verticalAlign: 'top', border: '1px solid #e4e4e7' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: '#18181b', lineHeight: 1.3 }}>{s.module}</div>
                      {s.formateur && <div style={{ fontSize: 12, color: '#16a34a', marginBottom: 3, fontWeight: 500 }}>{s.formateur}</div>}
                      <div style={{ fontSize: 11, color: '#71717a' }}>
                        {s.salle ? `${s.salle} · ` : ''}{dist ? 'Distanciel' : 'Présentiel'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden OFPPT document for print */}
      <div id="stg-ofppt-doc" style={{ display: 'none' }}>
        <DocumentStagiaireOFPPT emploi={emploi} groupeName={groupeName} filiereName={filiereName} annee={annee} />
      </div>
    </div>
  );
}

/* ─── Modules table ──────────────────────────────── */
function ModulesTable({ modules }) {
  const bySemestre = modules.reduce((acc, m) => {
    const key = m.semestre ?? 'Non défini';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="stg-mod-content">
      {Object.entries(bySemestre).map(([sem, mods]) => (
        <div key={sem} className="stg-sem-block">
          <div className="stg-sem-header">
            <div className="stg-sem-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Semestre {sem}
            </div>
            <span className="stg-sem-count">{mods.length} module{mods.length > 1 ? 's' : ''}</span>
          </div>
          <div className="stg-mod-scroll">
            <table className="stg-mod-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Intitulé du module</th>
                  <th>Formateur</th>
                  <th>Heures</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {mods.map((m, i) => (
                  <tr key={m.id ?? i} className={i % 2 === 0 ? 'stg-mod-row-even' : ''}>
                    <td>
                      <span className="stg-mod-code">{m.code || '—'}</span>
                    </td>
                    <td className="stg-mod-intitule">{m.intitule}</td>
                    <td className="stg-mod-formateur">
                      {m.formateur ? (
                        <span className="stg-mod-formateur-inner">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          {m.formateur}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="stg-mod-heures">
                      {m.mh_drif ? (
                        <span className="stg-mod-h-badge">{m.mh_drif}h</span>
                      ) : '—'}
                    </td>
                    <td>
                      {m.eg_et ? (
                        <span className="stg-mod-type-badge">{m.eg_et}</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Shared filter select ───────────────────────── */
function FilterSelect({ label, icon, value, onChange, disabled, children }) {
  return (
    <div className="stg-filter-group">
      <label className="stg-filter-label">
        {icon}
        {label}
      </label>
      <select
        className="stg-filter-select"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────── */
export default function EspaceStagiaire() {
  const [filieres, setFilieres] = useState([]);

  // Emploi state
  const [edtFiliereId, setEdtFiliereId] = useState('');
  const [edtAnnees, setEdtAnnees]       = useState([]);
  const [edtAnnee, setEdtAnnee]         = useState('');
  const [edtGroupes, setEdtGroupes]     = useState([]);
  const [edtGroupeId, setEdtGroupeId]   = useState('');
  const [emploi, setEmploi]             = useState(null);
  const [edtLoading, setEdtLoading]     = useState(false);
  const [edtError, setEdtError]         = useState('');

  // Modules state
  const [modFiliereId, setModFiliereId] = useState('');
  const [modAnnees, setModAnnees]       = useState([]);
  const [modAnnee, setModAnnee]         = useState('');
  const [modules, setModules]           = useState(null);
  const [modLoading, setModLoading]     = useState(false);
  const [modError, setModError]         = useState('');

  // Load shared filieres once
  useEffect(() => {
    axios.get('/stagiaire/filieres').then(r => setFilieres(r.data.data)).catch(() => {});
  }, []);

  // Emploi — cascading loads
  useEffect(() => {
    if (!edtFiliereId) { setEdtAnnees([]); return; }
    axios.get('/stagiaire/annees', { params: { filiere_id: edtFiliereId } })
      .then(r => setEdtAnnees(r.data.data)).catch(() => {});
  }, [edtFiliereId]);

  useEffect(() => {
    if (!edtFiliereId || !edtAnnee) { setEdtGroupes([]); return; }
    axios.get('/stagiaire/groupes', { params: { filiere_id: edtFiliereId, annee: edtAnnee } })
      .then(r => setEdtGroupes(r.data.data)).catch(() => {});
  }, [edtFiliereId, edtAnnee]);

  useEffect(() => {
    if (!edtGroupeId) { setEmploi(null); return; }
    setEdtLoading(true); setEdtError('');
    axios.get('/stagiaire/emploi', { params: { groupe_id: edtGroupeId } })
      .then(r => setEmploi(r.data.data))
      .catch(() => setEdtError("Impossible de charger l'emploi du temps."))
      .finally(() => setEdtLoading(false));
  }, [edtGroupeId]);

  // Modules — cascading loads
  useEffect(() => {
    if (!modFiliereId) { setModAnnees([]); return; }
    axios.get('/stagiaire/annees', { params: { filiere_id: modFiliereId } })
      .then(r => setModAnnees(r.data.data)).catch(() => {});
  }, [modFiliereId]);

  useEffect(() => {
    if (!modFiliereId || !modAnnee) { setModules(null); return; }
    setModLoading(true); setModError('');
    axios.get('/stagiaire/modules', { params: { filiere_id: modFiliereId, annee: modAnnee } })
      .then(r => setModules(r.data.data))
      .catch(() => setModError('Impossible de charger les modules.'))
      .finally(() => setModLoading(false));
  }, [modFiliereId, modAnnee]);

  const resetEdtFromFiliere = useCallback((v) => {
    setEdtFiliereId(v); setEdtAnnee(''); setEdtGroupeId('');
    setEmploi(null); setEdtError('');
  }, []);

  const resetEdtFromAnnee = useCallback((v) => {
    setEdtAnnee(v); setEdtGroupeId('');
    setEmploi(null); setEdtError('');
  }, []);

  const resetModFromFiliere = useCallback((v) => {
    setModFiliereId(v); setModAnnee('');
    setModules(null); setModError('');
  }, []);

  const groupeName  = edtGroupes.find(g => String(g.id) === String(edtGroupeId))?.nom || '';
  const filiereName = filieres.find(f => String(f.id) === String(edtFiliereId))?.intitule || '';

  const filierIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
  const anneeIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
  const groupeIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );

  return (
    <div className="stg-page">

      {/* ── Navbar ── */}
      <nav className="navbar stg-no-print">
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

      {/* ── Hero ── */}
      <section className="stg-hero stg-no-print">
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
            Accédez à tous vos services académiques depuis un seul endroit — emploi du temps, modules et bien plus encore.
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
              <div className="fc-title">Modules & Cours</div>
              <div className="fc-sub">Tous vos modules</div>
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

      {/* ── Services ── */}
      <section className="stg-services stg-no-print" id="services">
        <div className="section-header">
          <span className="section-tag">Nos services</span>
          <h2 className="section-title">Tout ce dont vous avez besoin</h2>
          <p className="section-desc">Des outils pensés pour simplifier votre parcours académique.</p>
        </div>
        <div className="services-grid services-grid-2">
          {SERVICES.map((s, i) => (
            <div className={`service-card sc-${s.color}`} key={i}>
              <div className={`sc-icon icon-${s.color}`}>{s.icon}</div>
              <h3 className="sc-title">{s.title}</h3>
              <p className="sc-desc">{s.desc}</p>
              <a href={s.href} className="sc-link">
                Accéder
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="stg-steps stg-no-print">
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

      {/* ── Emploi du Temps ── */}
      <section className="stg-emploi stg-no-print" id="emploi">
        <div className="section-header">
          <span className="section-tag">Emploi du temps</span>
          <h2 className="section-title">Consultez votre planning</h2>
          <p className="section-desc">
            Sélectionnez votre filière, année et groupe pour afficher votre emploi du temps.
          </p>
        </div>

        <div className="stg-filter-card">
          <FilterSelect label="Filière" icon={filierIcon} value={edtFiliereId} onChange={resetEdtFromFiliere}>
            <option value="">Sélectionner une filière</option>
            {filieres.map(f => <option key={f.id} value={f.id}>{f.intitule || f.code}</option>)}
          </FilterSelect>
          <FilterSelect label="Année de formation" icon={anneeIcon} value={edtAnnee} onChange={resetEdtFromAnnee} disabled={!edtFiliereId || edtAnnees.length === 0}>
            <option value="">Sélectionner une année</option>
            {edtAnnees.map(a => <option key={a} value={a}>Année {a}</option>)}
          </FilterSelect>
          <FilterSelect label="Groupe" icon={groupeIcon} value={edtGroupeId} onChange={setEdtGroupeId} disabled={!edtAnnee || edtGroupes.length === 0}>
            <option value="">Sélectionner un groupe</option>
            {edtGroupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </FilterSelect>
        </div>

        {edtLoading && (
          <div className="stg-state-loading">
            <div className="stg-spinner"></div>
            Chargement de l'emploi du temps…
          </div>
        )}
        {edtError && <div className="stg-state-error"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{edtError}</div>}
        {!edtLoading && !edtError && edtGroupeId && emploi === null && (
          <div className="stg-state-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>Aucun emploi du temps disponible pour ce groupe.</p>
          </div>
        )}
        {!edtLoading && emploi && <EmploiGrid emploi={emploi} groupeName={groupeName} filiereName={filiereName} annee={edtAnnee} />}
      </section>

      {/* ── Modules & Cours ── */}
      <section className="stg-modules stg-no-print" id="modules">
        <div className="section-header">
          <span className="section-tag">Modules & Cours</span>
          <h2 className="section-title">Votre programme de formation</h2>
          <p className="section-desc">
            Sélectionnez votre filière et votre année pour consulter tous vos modules.
          </p>
        </div>

        <div className="stg-filter-card stg-filter-card-2">
          <FilterSelect label="Filière" icon={filierIcon} value={modFiliereId} onChange={resetModFromFiliere}>
            <option value="">Sélectionner une filière</option>
            {filieres.map(f => <option key={f.id} value={f.id}>{f.intitule || f.code}</option>)}
          </FilterSelect>
          <FilterSelect label="Année de formation" icon={anneeIcon} value={modAnnee} onChange={v => { setModAnnee(v); setModules(null); setModError(''); }} disabled={!modFiliereId || modAnnees.length === 0}>
            <option value="">Sélectionner une année</option>
            {modAnnees.map(a => <option key={a} value={a}>Année {a}</option>)}
          </FilterSelect>
        </div>

        {modLoading && (
          <div className="stg-state-loading">
            <div className="stg-spinner"></div>
            Chargement des modules…
          </div>
        )}
        {modError && <div className="stg-state-error"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{modError}</div>}
        {!modLoading && !modError && modAnnee && modules !== null && modules.length === 0 && (
          <div className="stg-state-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <p>Aucun module disponible pour cette sélection.</p>
          </div>
        )}
        {!modLoading && modules && modules.length > 0 && <ModulesTable modules={modules} />}
      </section>

      {/* ── Footer ── */}
      <footer className="stg-footer stg-no-print">
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
