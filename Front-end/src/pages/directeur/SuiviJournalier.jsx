import { useState, useEffect } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { openPrintWindow } from "../../components/PrintDocOFPPT";

const JOURS    = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const NAVY     = "#1a3a5c";

function getCurrentJour() {
  const map = { 1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi" };
  return map[new Date().getDay()] || "Lundi";
}

/* ── Print document — exact replica of the PDF ── */
function SuiviPrintDoc({ jour, rows, date }) {
  const thS = {
    padding: "7px 10px", background: NAVY, color: "white",
    fontSize: 11, fontWeight: 700, border: "1px solid #2d5080", textAlign: "left",
  };
  const tdS = { padding: "7px 9px", border: "1px solid #dee2e6", fontSize: 11, height: 34 };
  const empty = Math.max(0, 8 - rows.length);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#000", padding: "20px 28px" }}>

      {/* OFPPT header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18 }}>
        <div style={{
          width: 72, height: 72, border: "2px solid #c00", borderRadius: 4,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", flexShrink: 0, padding: 4,
        }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#c00", letterSpacing: 1 }}>OFPPT</div>
          <div style={{ width: 46, height: 1, background: "#c00", margin: "3px 0" }} />
          <div style={{ fontSize: 6, color: "#444", textAlign: "center", lineHeight: 1.4 }}>
            مكتب التكوين المهني<br/>و إنعاش الشغل
          </div>
        </div>
        <div style={{ fontSize: 9, color: "#555", lineHeight: 1.6 }}>
          مكتب التكوين المهني و إنعاش الشغل<br/>
          Office de la Formation Professionnelle<br/>
          et de la Promotion du Travail
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>CF SALE 1</div>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 18 }}>ISTA HAY SALAM</div>

      {/* Title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Suivi journalier de la formation</div>
        </div>
        <div style={{ display: "flex", border: "1px solid #000", fontSize: 11, flexShrink: 0 }}>
          <div style={{ padding: "5px 12px", fontWeight: 700, borderRight: "1px solid #000", background: "#f1f5f9" }}>Date/jour</div>
          <div style={{ padding: "5px 64px" }}>{date}</div>
        </div>
      </div>

      {/* Table */}
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
            <tr key={`e${i}`}>
              {Array(8).fill(null).map((__, j) => <td key={j} style={tdS} />)}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 20, paddingTop: 8, borderTop: `1px solid ${NAVY}`, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888" }}>
        <span>ISTA Hay Salam — Suivi Journalier de la Formation</span>
        <span>{jour} — {date}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function SuiviJournalier() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeJour,setActiveJour]= useState(getCurrentJour());
  const [printDate, setPrintDate] = useState(
    new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
  );

  useEffect(() => {
    axios.get("/suivi-journalier")
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rows         = data?.[activeJour] || [];
  const totalSeances = data ? JOURS.reduce((n, j) => n + (data[j]?.length || 0), 0) : 0;

  const handlePrint = () => openPrintWindow("suivi-print-doc", `Suivi Journalier — ${activeJour}`);

  return (
    <div>
      {/* ── Header ── */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Suivi Journalier de la Formation</div>
          <div className="pg-subtitle">
            Vue hebdomadaire depuis les emplois du temps — {totalSeances} séance(s) planifiée(s) cette semaine
          </div>
        </div>
        <div className="pg-actions">
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
          const count  = data?.[j]?.length || 0;
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
              {count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                  background: active ? "rgba(0,0,0,.15)" : "var(--g1)",
                  color:      active ? "#111"             : "var(--g6)",
                }}>{count}</span>
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
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--sl8)" }}>
              {activeJour} — {rows.length} séance{rows.length !== 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 12, color: "var(--sl5)", marginTop: 2 }}>
              Données extraites automatiquement des emplois du temps
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
        ) : rows.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{Icons.clock}</div>
            <div className="empty-title">Aucune séance ce jour</div>
            <div className="empty-desc">Aucune séance enregistrée pour le {activeJour} dans les emplois du temps</div>
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
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--g6)", whiteSpace: "nowrap" }}>
                        {r.horaire}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--sl8)" }}>{r.formateur}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: "var(--g0)", color: "var(--g6)" }}>
                        {r.groupe}
                      </span>
                    </td>
                    <td style={{ color: "var(--sl6)" }}>{r.salle}</td>
                    <td style={{ fontSize: 12, color: "var(--sl5)", maxWidth: 220 }}>{r.module}</td>
                    <td>
                      {r.mode === "DISTANCIEL"
                        ? <span className="badge badge-info">En ligne</span>
                        : <span className="badge badge-ok">Présentiel</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Hidden print div ── */}
      <div id="suivi-print-doc" style={{ display: "none" }}>
        <SuiviPrintDoc jour={activeJour} rows={rows} date={printDate} />
      </div>
    </div>
  );
}
