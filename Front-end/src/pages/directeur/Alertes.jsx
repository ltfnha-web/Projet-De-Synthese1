import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";
import { openPrintWindow } from "../../components/PrintDocOFPPT";

const TYPE_CONFIG = {
  critique: { label: "Critique",      color: "#9f1239", bg: "#fff1f2", border: "#fecdd3", icon: Icons.alert   },
  warning:  { label: "Avertissement", color: "#92400e", bg: "#fffbeb", border: "#fde68a", icon: Icons.warning },
  info:     { label: "À surveiller",  color: "#1e40af", bg: "var(--p0)", border: "var(--p1)", icon: Icons.shield },
};

const CODE_LABELS = {
  EFM_RETARD:         "EFM prévu — retard critique",
  AVC_CRITIQUE:       "AVC très faible (< 30%)",
  MODULE_NON_DEMARRE: "Module non démarré",
  AVC_FAIBLE:         "AVC à surveiller (30–50%)",
};

const EG_ET_STYLE = {
  EG: { bg: "#eff6ff", color: "#1d4ed8" },
  ET: { bg: "#fefce8", color: "#92400e" },
};

export default function Alertes() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [secteurs, setSecteurs] = useState([]);
  const [filieres, setFilieres] = useState([]);

  const [filterType,    setFilterType]    = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");
  const [filterFiliere, setFilterFiliere] = useState("");
  const [filterCode,    setFilterCode]    = useState("");
  const [filterCreneau, setFilterCreneau] = useState("");
  const [search,        setSearch]        = useState("");
  const [moduleSearch,  setModuleSearch]  = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/alertes", {
      params: {
        type:       filterType,
        secteur_id: filterSecteur,
        filiere_id: filterFiliere,
      }
    })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterType, filterSecteur, filterFiliere]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    axios.get("/pole").then(r => setSecteurs(r.data)).catch(() => {});
    axios.get("/filieres-list").then(r => setFilieres(r.data)).catch(() => {});
  }, []);

  // Filter filières by selected secteur
  const filteredFilieres = filterSecteur
    ? filieres.filter(f => String(f.secteur_id) === String(filterSecteur))
    : filieres;

  const alertes = (data?.alertes || []).filter(a => {
    if (filterCode    && a.code    !== filterCode)    return false;
    if (filterCreneau && a.creneau !== filterCreneau) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.groupe.toLowerCase().includes(q) &&
          !a.filiere.toLowerCase().includes(q) &&
          !a.secteur.toLowerCase().includes(q)) return false;
    }
    if (moduleSearch) {
      const q = moduleSearch.toLowerCase();
      const modules = a.modules || [];
      const matchesModule = modules.some(
        m => m.code?.toLowerCase().includes(q) || m.intitule?.toLowerCase().includes(q)
      );
      if (!matchesModule) return false;
    }
    return true;
  });

  const hasFilters = filterType || filterSecteur || filterFiliere || filterCode || filterCreneau || search || moduleSearch;

  const resetFilters = () => {
    setFilterType(""); setFilterSecteur(""); setFilterFiliere("");
    setFilterCode(""); setFilterCreneau(""); setSearch(""); setModuleSearch("");
  };

  const activeCount = [filterType, filterSecteur, filterFiliere, filterCode, filterCreneau, search, moduleSearch].filter(Boolean).length;

  const summaryCards = [
    { label: "Critiques",      count: data?.critique || 0, color: "#ef4444", bg: "#fff1f2", icon: Icons.alert,   key: "critique" },
    { label: "Avertissements", count: data?.warning  || 0, color: "#f59e0b", bg: "#fffbeb", icon: Icons.warning, key: "warning"  },
    { label: "À surveiller",   count: data?.info     || 0, color: "#1a5276", bg: "var(--p0)", icon: Icons.shield, key: "info"   },
    { label: "Total alertes",  count: data?.total    || 0, color: "var(--sl6)", bg: "var(--sl1)", icon: Icons.filter, key: "" },
  ];

  const handlePrint = () => openPrintWindow("alertes-print-doc", "Rapport des Alertes Pédagogiques");

  return (
    <div>
      {/* ── Header ── */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Alertes Pédagogiques</div>
          <div className="pg-subtitle">
            Groupes et modules nécessitant une intervention — générées automatiquement
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" onClick={fetchData}>{Icons.filter} Actualiser</button>
          <button className="btn-secondary" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Icône imprimante */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Imprimer
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
          {summaryCards.map((c, i) => (
            <div key={i} style={{
              background: c.bg,
              border: `1px solid ${c.color}22`,
              borderRadius: 12,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: c.key ? "pointer" : "default",
              outline: filterType === c.key ? `2px solid ${c.color}` : "none",
              transition: "outline .15s, transform .15s",
              transform: filterType === c.key ? "translateY(-1px)" : "none",
            }}
              onClick={() => c.key && setFilterType(filterType === c.key ? "" : c.key)}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: c.color + "20",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: c.color, flexShrink: 0,
              }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: c.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{c.count}</div>
                <div style={{ fontSize: 12, color: "var(--sl5)", marginTop: 2 }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter panel ── */}
      <div className="filter-panel" style={{ marginBottom: 16 }}>
        <div className="filter-panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--sl5)", display: "flex" }}>{Icons.filter}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sl7)" }}>Filtres</span>
            {activeCount > 0 && (
              <span style={{
                background: "var(--g4)", color: "#111",
                fontSize: 10, fontWeight: 700,
                padding: "2px 7px", borderRadius: 20,
              }}>{activeCount}</span>
            )}
          </div>
          {hasFilters && (
            <button className="btn-reset" onClick={resetFilters}>
              {Icons.close} Réinitialiser
            </button>
          )}
        </div>

        <div className="filter-row">
          {/* Recherche groupe/filière/secteur */}
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
            <span className="search-icon">{Icons.search}</span>
            <input className="search-input filter-input" placeholder="Groupe, filière, secteur..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Recherche module */}
          <div style={{ position: "relative", flex: "1 1 180px", minWidth: 150 }}>
            <span className="search-icon">{Icons.book}</span>
            <input className="search-input filter-input" placeholder="Code ou intitulé module..."
              style={{ paddingLeft: 32 }}
              value={moduleSearch} onChange={e => setModuleSearch(e.target.value)} />
          </div>

          {/* Secteur */}
          <select className="form-select filter-select" value={filterSecteur}
            onChange={e => { setFilterSecteur(e.target.value); setFilterFiliere(""); }}>
            <option value="">Tous les secteurs</option>
            {secteurs.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>

          {/* Filière */}
          <select className="form-select filter-select" value={filterFiliere}
            onChange={e => setFilterFiliere(e.target.value)}>
            <option value="">Toutes les filières</option>
            {filteredFilieres.map(f => <option key={f.id} value={f.id}>{f.intitule}</option>)}
          </select>

          {/* Code alerte */}
          <select className="form-select filter-select" value={filterCode}
            onChange={e => setFilterCode(e.target.value)}>
            <option value="">Tous les codes</option>
            {Object.entries(CODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          {/* Créneau */}
          <select className="form-select filter-select" value={filterCreneau}
            onChange={e => setFilterCreneau(e.target.value)}>
            <option value="">Tous créneaux</option>
            <option value="CDJ">Cours du Jour (CDJ)</option>
            <option value="CDS">Cours du Soir (CDS)</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
          <span className="results-count">{alertes.length} alerte(s) affichée(s)</span>
        </div>
      </div>

      {/* ── Alert list ── */}
      {loading ? (
        <div className="loader"><div className="loader-spinner" /><span>Analyse en cours...</span></div>
      ) : alertes.length === 0 ? (
        <div className="empty" style={{ background: "white", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div className="empty-icon">{Icons.check}</div>
          <div className="empty-title">Aucune alerte</div>
          <div className="empty-desc">Tous les groupes sont dans les normes selon les filtres sélectionnés</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alertes.map((a, i) => {
            const cfg = TYPE_CONFIG[a.type];
            const modules = a.modules || [];
            return (
              <div key={i} style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                animation: `slideUp .3s ease ${i * .03}s both`,
              }}>
                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 9,
                  background: cfg.color + "18",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: cfg.color, flexShrink: 0,
                }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: cfg.color }}>{a.titre}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: cfg.color, color: "white",
                      padding: "2px 8px", borderRadius: 20,
                    }}>
                      {CODE_LABELS[a.code] || a.code}
                    </span>
                  </div>

                  {/* Message */}
                  <p style={{ fontSize: 13, color: "var(--sl7)", lineHeight: 1.55, marginBottom: 10 }}>{a.message}</p>

                  {/* Module badges */}
                  {modules.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      {modules.map((m, j) => {
                        const egStyle = EG_ET_STYLE[m.eg_et] || { bg: "var(--sl1)", color: "var(--sl5)" };
                        return (
                          <span key={j} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "4px 10px",
                            background: egStyle.bg,
                            color: egStyle.color,
                            border: `1px solid ${egStyle.color}30`,
                            borderRadius: 8,
                            fontSize: 11,
                          }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                              {m.code}
                            </span>
                            {m.intitule && (
                              <span style={{
                                fontFamily: "var(--font)",
                                fontWeight: 500,
                                color: egStyle.color + "cc",
                                fontSize: 11,
                              }}>
                                — {m.intitule}
                              </span>
                            )}
                            {m.eg_et && (
                              <span style={{
                                fontSize: 9, fontWeight: 700,
                                background: egStyle.color + "20",
                                padding: "1px 5px", borderRadius: 10,
                                fontFamily: "var(--font)",
                                flexShrink: 0,
                              }}>{m.eg_et}</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Meta info */}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {a.avc > 0 && (
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: cfg.color }}>
                        AVC : {a.avc}%
                      </span>
                    )}
                    {a.mh_restante > 0 && (
                      <span style={{ fontSize: 11.5, color: "var(--sl5)" }}>
                        MH restante : {a.mh_restante}h / {a.mh_drif}h
                      </span>
                    )}
                    {a.effectif && (
                      <span style={{ fontSize: 11.5, color: "var(--sl5)" }}>Effectif : {a.effectif}</span>
                    )}
                    {a.creneau && (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: a.creneau === "CDS" ? "#fef3c7" : "#eff6ff",
                        color: a.creneau === "CDS" ? "#92400e" : "#1d4ed8",
                        padding: "2px 8px", borderRadius: 20,
                      }}>
                        {a.creneau === "CDS" ? "Cours du Soir" : "Cours du Jour"}
                      </span>
                    )}
                    <span style={{ fontSize: 11.5, color: "var(--sl4)" }}>{a.secteur}</span>
                  </div>
                </div>

                {/* Right meta */}
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: 120 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sl8)", marginBottom: 4 }}>{a.groupe}</div>
                  <div style={{ fontSize: 11, color: "var(--sl5)", marginBottom: 6 }}>{a.filiere}</div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: cfg.color + "15", color: cfg.color,
                    padding: "2px 8px", borderRadius: 20, border: `1px solid ${cfg.color}30`,
                  }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Hidden print document ── */}
      <div id="alertes-print-doc" style={{ display: "none" }}>
        <AlertesPrintDoc
          alertes={alertes}
          summary={{ critique: data?.critique || 0, warning: data?.warning || 0, info: data?.info || 0, total: data?.total || 0 }}
          date={new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
        />
      </div>
    </div>
  );
}

const TYPE_PRINT_COLOR = { critique: "#9f1239", warning: "#92400e", info: "#1e40af" };

function AlertesPrintDoc({ alertes, summary, date }) {
  const NAVY = "#1a3a5c";
  const thStyle = {
    padding: "7px 10px", textAlign: "left",
    background: NAVY, color: "white",
    fontSize: 11, fontWeight: 700,
    borderRight: "1px solid #2d5080",
  };
  const tdStyle = (bold = false) => ({
    padding: "5px 9px", fontSize: 11,
    verticalAlign: "top",
    fontWeight: bold ? 700 : 400,
    borderBottom: "1px solid #e2e8f0",
  });

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111", padding: "20px 24px" }}>

      {/* ── Header OFPPT ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `3px solid ${NAVY}`, paddingBottom: 10, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: "#555" }}>المملكة المغربية — وزارة التعليم المهني</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>OFPPT — ISTA Hay Salam</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, letterSpacing: "-.3px" }}>Rapport des Alertes Pédagogiques</div>
          <div style={{ fontSize: 10, color: "#666", marginTop: 3 }}>Généré le {date}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11 }}>
          <div style={{ fontWeight: 700, color: NAVY }}>Année 2025–2026</div>
          <div style={{ color: "#666", marginTop: 2 }}>{alertes.length} alerte(s) affichée(s)</div>
        </div>
      </div>

      {/* ── Résumé ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
        {[
          { label: "Critiques",      count: summary.critique, color: "#9f1239", bg: "#fff1f2" },
          { label: "Avertissements", count: summary.warning,  color: "#92400e", bg: "#fffbeb" },
          { label: "À surveiller",   count: summary.info,     color: "#1e40af", bg: "#eff6ff" },
          { label: "Total alertes",  count: summary.total,    color: NAVY,      bg: "#f1f5f9" },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: "8px 12px", borderRadius: 6,
            background: s.bg, border: `1px solid ${s.color}30`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Groupe</th>
            <th style={thStyle}>Filière</th>
            <th style={thStyle}>Secteur</th>
            <th style={{ ...thStyle, textAlign: "center" }}>AVC</th>
            <th style={thStyle}>Code alerte</th>
            <th style={{ ...thStyle, minWidth: 180 }}>Message</th>
            <th style={{ ...thStyle, borderRight: "none" }}>Modules concernés</th>
          </tr>
        </thead>
        <tbody>
          {alertes.map((a, i) => {
            const typeColor = TYPE_PRINT_COLOR[a.type] || "#334155";
            const rowBg = i % 2 === 0 ? "#fff" : "#f8fafc";
            return (
              <tr key={i} style={{ background: rowBg }}>
                <td style={{ ...tdStyle(true), color: typeColor }}>
                  {TYPE_CONFIG[a.type]?.label || a.type}
                </td>
                <td style={tdStyle(true)}>{a.groupe}</td>
                <td style={tdStyle()}>{a.filiere}</td>
                <td style={tdStyle()}>{a.secteur}</td>
                <td style={{ ...tdStyle(true), textAlign: "center", color: typeColor }}>
                  {a.avc > 0 ? `${a.avc}%` : "—"}
                </td>
                <td style={{ ...tdStyle(), fontSize: 10 }}>{CODE_LABELS[a.code] || a.code}</td>
                <td style={{ ...tdStyle(), fontSize: 10, lineHeight: 1.4 }}>{a.message}</td>
                <td style={{ ...tdStyle(), fontSize: 10 }}>
                  {(a.modules || []).map(m => m.code).join(", ") || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Footer ── */}
      <div style={{ marginTop: 20, paddingTop: 8, borderTop: `1px solid ${NAVY}`, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888" }}>
        <span>ISTA Hay Salam — Système de Gestion Pédagogique</span>
        <span>Document généré automatiquement</span>
      </div>
    </div>
  );
}
