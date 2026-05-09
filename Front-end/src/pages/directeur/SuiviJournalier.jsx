import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { openPrintWindow } from "../../components/PrintDocOFPPT";
import { useConfirm } from "../../hooks/useConfirm";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const NAVY  = "#1a3a5c";

function getCurrentJour() {
  const map = { 1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi" };
  return map[new Date().getDay()] || "Lundi";
}

function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ── Unique key for a row so we can track removals ── */
function rowKey(jour, r) {
  return `${jour}__${r.horaire}__${r.formateur}__${r.groupe}`;
}

/* ─────────────────────────────────────────────────────────────
   Print document — exact replica of the PDF
───────────────────────────────────────────────────────────── */
function SuiviPrintDoc({ jour, rows, date }) {
  const thS   = { padding: "7px 10px", background: NAVY, color: "white", fontSize: 11, fontWeight: 700, border: "1px solid #2d5080", textAlign: "left" };
  const tdS   = { padding: "7px 9px", border: "1px solid #dee2e6", fontSize: 11, height: 34 };
  const empty = Math.max(0, 8 - rows.length);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#000", padding: "20px 28px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18 }}>
        <div style={{ width: 72, height: 72, border: "2px solid #c00", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#c00", letterSpacing: 1 }}>OFPPT</div>
          <div style={{ width: 46, height: 1, background: "#c00", margin: "3px 0" }} />
          <div style={{ fontSize: 6, color: "#444", textAlign: "center", lineHeight: 1.4 }}>مكتب التكوين المهني<br/>و إنعاش الشغل</div>
        </div>
        <div style={{ fontSize: 9, color: "#555", lineHeight: 1.6 }}>
          مكتب التكوين المهني و إنعاش الشغل<br/>
          Office de la Formation Professionnelle<br/>
          et de la Promotion du Travail
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>CF SALE 1</div>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 18 }}>ISTA HAY SALAM</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Suivi journalier de la formation</div>
        </div>
        <div style={{ display: "flex", border: "1px solid #000", fontSize: 11, flexShrink: 0 }}>
          <div style={{ padding: "5px 12px", fontWeight: 700, borderRight: "1px solid #000", background: "#f1f5f9" }}>Date/jour</div>
          <div style={{ padding: "5px 64px" }}>{date}</div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thS}>Horaire</th>
            <th style={thS}>Formateur</th>
            <th style={thS}>Groupe</th>
            <th style={thS}>Salle</th>
            <th style={{ ...thS, minWidth: 72 }}>Emargement</th>
            <th style={{ ...thS, minWidth: 72 }}>Validation</th>
            <th style={{ ...thS, minWidth: 84 }}>Saisie sur Enote</th>
            <th style={{ ...thS, minWidth: 84 }}>Observation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
              <td style={{ ...tdS, fontWeight: 700, whiteSpace: "nowrap", color: NAVY }}>{r.horaire}</td>
              <td style={tdS}>{r.formateur}</td>
              <td style={{ ...tdS, fontWeight: 600 }}>{r.groupe}</td>
              <td style={tdS}>{r.salle}</td>
              <td style={tdS} />
              <td style={tdS} />
              <td style={tdS} />
              <td style={tdS} />
            </tr>
          ))}
          {Array.from({ length: empty }).map((_, i) => (
            <tr key={`e${i}`}>{Array(8).fill(null).map((__, j) => <td key={j} style={tdS} />)}</tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 20, paddingTop: 8, borderTop: `1px solid ${NAVY}`, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888" }}>
        <span>ISTA Hay Salam — Suivi Journalier de la Formation</span>
        <span>{jour} — {date}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Absent banner shown inside each absent row
───────────────────────────────────────────────────────────── */
function AbsencePill({ absence }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      marginTop: 4,
      padding: "3px 9px 3px 7px",
      borderRadius: 20,
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      fontSize: 11, color: "#c2410c",
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
      Absent{absence.cause ? ` — ${absence.cause}` : ""}
      {" · "}
      {fmtDate(absence.date_debut)}
      {absence.date_debut !== absence.date_fin && <> → {fmtDate(absence.date_fin)}</>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function SuiviJournalier() {
  const [data,               setData]          = useState(null);
  const [meta,               setMeta]          = useState(null);
  const [semainesDispo,      setSemainesDispo]  = useState([]); // available week snapshots
  const [semaineFilter,      setSemaineFilter]  = useState(null); // null = latest
  const [loading,            setLoading]        = useState(true);
  const [activeJour,         setActiveJour]     = useState(getCurrentJour());
  const [removedKeys,        setRemovedKeys]    = useState(new Set());
  const [printDate,          setPrintDate]      = useState(
    new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
  );

  const [confirm, ConfirmDialog] = useConfirm();

  const load = (semNum = null) => {
    setLoading(true);
    const url = semNum ? `/suivi-journalier?semaine_num=${semNum}` : "/suivi-journalier";
    axios.get(url)
      .then(r => {
        setData(r.data.data);
        setMeta({
          is_active:        r.data.is_active,
          semaine:          r.data.semaine,
          semaine_courante: r.data.semaine_courante,
          annee_scolaire:   r.data.annee_scolaire,
          has_emplois:      r.data.has_emplois,
          filter_semaine_num: r.data.filter_semaine_num ?? null,
        });
        if (r.data.semaines_disponibles?.length) {
          setSemainesDispo(r.data.semaines_disponibles);
        }
        setRemovedKeys(new Set());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilterChange = (val) => {
    const num = val === "" ? null : Number(val);
    setSemaineFilter(num);
    load(num);
  };

  /* Rows for the active day, split by absent/removed state */
  const allRows     = data?.[activeJour] || [];
  const visibleRows = useMemo(
    () => allRows.filter(r => !removedKeys.has(rowKey(activeJour, r))),
    [allRows, removedKeys, activeJour]
  );

  /* Stats per day for tab badges */
  const dayStats = useMemo(() => {
    if (!data) return {};
    const stats = {};
    for (const jour of JOURS) {
      const rows   = data[jour] || [];
      const absent = rows.filter(r => r.absent).length;
      const total  = rows.length;
      stats[jour]  = { total, absent };
    }
    return stats;
  }, [data]);

  const totalSeances   = data ? JOURS.reduce((n, j) => n + (data[j]?.length || 0), 0) : 0;
  const absentsCeJour  = allRows.filter(r => r.absent).length;
  const removedCeJour  = allRows.filter(r => removedKeys.has(rowKey(activeJour, r))).length;

  /* Remove a row after confirmation */
  const handleRemove = async (r) => {
    const key = rowKey(activeJour, r);
    const ok  = await confirm({
      title:        `Retirer ${r.formateur} de la liste ?`,
      message:      `Ce formateur est absent ${r.absence?.cause ? `(${r.absence.cause}) ` : ""}du ${fmtDate(r.absence?.date_debut)} au ${fmtDate(r.absence?.date_fin)}. Sa séance sera masquée dans le tableau et exclue de l'impression.`,
      detail:       `Séance concernée : ${r.horaire} · Groupe ${r.groupe} · ${r.module ?? ""}`,
      confirmLabel: "Retirer de la liste",
      cancelLabel:  "Annuler",
      variant:      "warning",
    });
    if (!ok) return;
    setRemovedKeys(prev => new Set([...prev, key]));
  };

  /* Restore all removed rows for this day */
  const handleRestoreAll = () => {
    const keysThisDay = new Set(
      allRows.map(r => rowKey(activeJour, r))
    );
    setRemovedKeys(prev => {
      const next = new Set(prev);
      keysThisDay.forEach(k => next.delete(k));
      return next;
    });
  };

  const handlePrint = () => openPrintWindow("suivi-print-doc", `Suivi Journalier — ${activeJour}`);

  return (
    <div>
      {/* ── Header ── */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Suivi Journalier de la Formation</div>
          <div className="pg-subtitle">
            {meta?.semaine
              ? <>
                  Semaine {meta.semaine.num} · {meta.annee_scolaire}
                  {meta.filter_semaine_num && meta.filter_semaine_num !== meta.semaine_courante?.num
                    ? <span style={{ marginLeft: 7, padding: "1px 8px", background: "#fef3c7", color: "#92400e", borderRadius: 10, fontSize: 11, fontWeight: 700, border: "1px solid #fde68a" }}>Historique</span>
                    : null
                  }
                  {" — "}{totalSeances} séance(s) planifiée(s)
                </>
              : meta && !meta.is_active
              ? <>Année scolaire {meta.annee_scolaire} — hors période active</>
              : <>Vue hebdomadaire depuis les emplois du temps</>
            }
          </div>
        </div>
        <div className="pg-actions">
          <button className="btn-secondary" onClick={() => load(semaineFilter)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Actualiser
          </button>
          <button className="btn-secondary" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Imprimer {activeJour}
          </button>
        </div>
      </div>

      {/* ── Day tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "#fff", borderRadius: 12, padding: 5, border: "1px solid var(--border)", width: "fit-content", flexWrap: "wrap" }}>
        {JOURS.map(j => {
          const { total = 0, absent = 0 } = dayStats[j] || {};
          const active = activeJour === j;
          return (
            <button key={j} onClick={() => setActiveJour(j)} style={{
              padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all .15s",
              background: active ? "var(--g4)" : "transparent",
              color:      active ? "#111"       : "var(--sl5)",
              boxShadow:  active ? "0 2px 8px rgba(34,197,94,.2)" : "none",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {j}
              {total > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                  background: active ? "rgba(0,0,0,.15)" : "var(--g1)",
                  color:      active ? "#111"             : "var(--g6)",
                }}>{total}</span>
              )}
              {absent > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                  background: active ? "#92400e" : "#fff7ed",
                  color:      active ? "#fff"    : "#c2410c",
                  border:     active ? "none"    : "1px solid #fed7aa",
                }}>
                  {absent} absent{absent > 1 ? "s" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Table card ── */}
      <div className="table-card">

        {/* Toolbar */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: "var(--sl0)" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--sl8)", display: "flex", alignItems: "center", gap: 10 }}>
              {activeJour} — {visibleRows.length} séance{visibleRows.length !== 1 ? "s" : ""}
              {absentsCeJour > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "3px 10px", borderRadius: 20,
                  background: "#fff7ed", border: "1px solid #fed7aa",
                  fontSize: 12, color: "#c2410c", fontWeight: 600,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  {absentsCeJour} formateur{absentsCeJour > 1 ? "s" : ""} absent{absentsCeJour > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--sl5)", marginTop: 2 }}>
              Données extraites automatiquement des emplois du temps
              {removedCeJour > 0 && (
                <span style={{ marginLeft: 8, color: "#c2410c" }}>
                  · {removedCeJour} séance{removedCeJour > 1 ? "s" : ""} masquée{removedCeJour > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {removedCeJour > 0 && (
              <button
                onClick={handleRestoreAll}
                style={{
                  height: 34, padding: "0 12px", borderRadius: 8,
                  border: "1.5px solid #fed7aa", background: "#fff7ed",
                  color: "#c2410c", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "inherit",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.99"/>
                </svg>
                Restaurer les {removedCeJour} masquée{removedCeJour > 1 ? "s" : ""}
              </button>
            )}

            {/* ── Week filter ── */}
            {semainesDispo.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sl5)" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <label style={{ fontSize: 12, color: "var(--sl5)", fontWeight: 600, whiteSpace: "nowrap" }}>Semaine :</label>
                <select
                  value={semaineFilter ?? ""}
                  onChange={e => handleFilterChange(e.target.value)}
                  style={{
                    height: 34, padding: "0 28px 0 10px", border: `1.5px solid ${semaineFilter ? "#fbbf24" : "var(--border)"}`,
                    borderRadius: 8, fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer",
                    background: semaineFilter ? "#fffbeb" : "#fff",
                    color: semaineFilter ? "#92400e" : "inherit",
                    fontWeight: semaineFilter ? 700 : 400,
                    appearance: "none", WebkitAppearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center",
                  }}
                >
                  <option value="">Dernier emploi créé</option>
                  {semainesDispo.map(s => {
                    const dateFmt = s.date_lundi
                      ? new Date(s.date_lundi).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
                      : null;
                    return (
                      <option key={s.num} value={s.num}>
                        Semaine {s.num}{s.semestre ? ` (${s.semestre})` : ""}{dateFmt ? ` — ${dateFmt}` : ""} · {s.emploi_count} groupe{s.emploi_count > 1 ? "s" : ""}
                      </option>
                    );
                  })}
                </select>
                {semaineFilter && (
                  <button
                    onClick={() => handleFilterChange("")}
                    title="Revenir au dernier emploi"
                    style={{
                      height: 34, width: 34, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1.5px solid #fbbf24", borderRadius: 8, background: "#fffbeb",
                      color: "#92400e", cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            )}

            <label style={{ fontSize: 12, color: "var(--sl5)", fontWeight: 600 }}>Date impression :</label>
            <input
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              onChange={e => {
                const d = new Date(e.target.value);
                if (!isNaN(d)) setPrintDate(d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }));
              }}
              style={{ height: 34, padding: "0 10px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loader"><div className="loader-spinner" /><span>Chargement...</span></div>

        ) : !meta?.is_active ? (
          /* ── Outside the school year ── */
          <div className="empty" style={{ padding: "60px 24px" }}>
            <div className="empty-icon" style={{ width: 56, height: 56, background: "#eff6ff", borderRadius: 14 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.7">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="empty-title" style={{ color: "#1e40af" }}>Hors période scolaire</div>
            <div className="empty-desc" style={{ maxWidth: 380 }}>
              Aucune semaine active pour l'année scolaire <strong>{meta?.annee_scolaire}</strong>.
              La formation reprend en septembre.
            </div>
          </div>

        ) : !meta?.has_emplois ? (
          /* ── No emplois at all ── */
          <div className="empty" style={{ padding: "60px 24px" }}>
            <div className="empty-icon" style={{ width: 56, height: 56, background: "#fafafa", borderRadius: 14 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.7">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div className="empty-title">Aucun emploi du temps configuré</div>
            <div className="empty-desc" style={{ maxWidth: 380 }}>
              Aucun emploi du temps n'a encore été créé pour la période en cours
              ({meta?.annee_scolaire}).
              Créez les emplois du temps depuis la section <strong>Pôle → Emplois</strong>.
            </div>
          </div>

        ) : meta?.filter_semaine_num && totalSeances === 0 ? (
          /* ── Filter active but no emplois match that week ── */
          <div className="empty" style={{ padding: "60px 24px" }}>
            <div className="empty-icon" style={{ width: 56, height: 56, background: "#fffbeb", borderRadius: 14 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.7">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="empty-title" style={{ color: "#92400e" }}>Aucun emploi pour la semaine {meta.filter_semaine_num}</div>
            <div className="empty-desc" style={{ maxWidth: 380 }}>
              Aucun emploi du temps n'a été créé pour la semaine {meta.filter_semaine_num}.
            </div>
            <button
              onClick={() => handleFilterChange("")}
              style={{ marginTop: 10, height: 34, padding: "0 16px", borderRadius: 8, border: "1.5px solid #fbbf24", background: "#fffbeb", color: "#92400e", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Revenir au dernier emploi créé
            </button>
          </div>

        ) : visibleRows.length === 0 && allRows.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{Icons.clock}</div>
            <div className="empty-title">Aucune séance ce jour</div>
            <div className="empty-desc">Aucune séance enregistrée pour le {activeJour} dans les emplois du temps</div>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="empty">
            <div className="empty-icon" style={{ background: "#fff7ed" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </div>
            <div className="empty-title">Toutes les séances ont été masquées</div>
            <div className="empty-desc">
              Les {allRows.length} séance{allRows.length > 1 ? "s" : ""} de ce jour ont été retirées de la liste.
            </div>
            <button
              onClick={handleRestoreAll}
              style={{
                marginTop: 8, height: 36, padding: "0 16px", borderRadius: 8,
                border: "1.5px solid #fed7aa", background: "#fff7ed",
                color: "#c2410c", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Restaurer toutes les séances
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Horaire</th>
                  <th>Formateur</th>
                  <th>Groupe</th>
                  <th>Salle</th>
                  <th>Module</th>
                  <th>Mode</th>
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r, i) => (
                  <tr
                    key={i}
                    style={r.absent ? {
                      background: "linear-gradient(to right, #fff7ed 0%, #fff 60%)",
                      borderLeft: "3px solid #fb923c",
                    } : {}}
                  >
                    {/* Horaire */}
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: r.absent ? "#c2410c" : "var(--g6)", whiteSpace: "nowrap" }}>
                        {r.horaire}
                      </span>
                    </td>

                    {/* Formateur */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 600, color: r.absent ? "#9a3412" : "var(--sl8)" }}>
                          {r.formateur}
                        </span>
                        {r.absent && r.absence && (
                          <AbsencePill absence={r.absence} />
                        )}
                      </div>
                    </td>

                    {/* Groupe */}
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: r.absent ? "#ffedd5" : "var(--g0)", color: r.absent ? "#c2410c" : "var(--g6)" }}>
                        {r.groupe}
                      </span>
                    </td>

                    {/* Salle */}
                    <td style={{ color: "var(--sl6)" }}>{r.salle}</td>

                    {/* Module */}
                    <td style={{ fontSize: 12, color: "var(--sl5)", maxWidth: 220 }}>{r.module}</td>

                    {/* Mode */}
                    <td>
                      {r.mode === "DISTANCIEL"
                        ? <span className="badge badge-info">En ligne</span>
                        : <span className="badge badge-ok">Présentiel</span>
                      }
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: "center", padding: "0 6px" }}>
                      {r.absent && (
                        <button
                          onClick={() => handleRemove(r)}
                          title="Retirer de la liste"
                          style={{
                            width: 28, height: 28,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            borderRadius: 6,
                            border: "1px solid #fed7aa",
                            background: "#fff7ed",
                            color: "#c2410c",
                            cursor: "pointer",
                            transition: "all .15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#ffedd5"; e.currentTarget.style.borderColor = "#fb923c"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#fff7ed"; e.currentTarget.style.borderColor = "#fed7aa"; }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {ConfirmDialog}

      {/* ── Hidden print div — uses only visible (non-removed) rows ── */}
      <div id="suivi-print-doc" style={{ display: "none" }}>
        <SuiviPrintDoc jour={activeJour} rows={visibleRows} date={printDate} />
      </div>
    </div>
  );
}
