import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";

const TYPE_CONFIG = {
  critique: { label: "Critique",     color: "#9f1239", bg: "#fff1f2", border: "#fecdd3", icon: Icons.alert   },
  warning:  { label: "Avertissement",color: "#92400e", bg: "#fffbeb", border: "#fde68a", icon: Icons.warning },
  info:     { label: "À surveiller", color: "#1e40af", bg: "var(--p0)", border: "var(--p1)", icon: Icons.shield },
};

const CODE_LABELS = {
  EFM_RETARD:          "EFM prévu — retard critique",
  AVC_CRITIQUE:        "AVC très faible (< 30%)",
  MODULE_NON_DEMARRE:  "Module non démarré",
  AVC_FAIBLE:          "AVC à surveiller (30–50%)",
};

export default function Alertes() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [secteurs, setSecteurs] = useState([]);

  // Filtres
  const [filterType, setFilterType]       = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");
  const [filterCode, setFilterCode]       = useState("");
  const [filterCreneau, setFilterCreneau] = useState("");
  const [search, setSearch]               = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/alertes", {
      params: { type: filterType, secteur_id: filterSecteur }
    })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterType, filterSecteur]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    axios.get("/pole").then(r => setSecteurs(r.data)).catch(() => {});
  }, []);

  const alertes = (data?.alertes || []).filter(a => {
    if (filterCode   && a.code    !== filterCode)   return false;
    if (filterCreneau && a.creneau !== filterCreneau) return false;
    if (search && !a.groupe.toLowerCase().includes(search.toLowerCase())
               && !a.filiere.toLowerCase().includes(search.toLowerCase())
               && !a.secteur.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const summaryCards = [
    { label: "Critiques",       count: data?.critique || 0, color: "#ef4444", bg: "#fff1f2", icon: Icons.alert   },
    { label: "Avertissements",  count: data?.warning  || 0, color: "#f59e0b", bg: "#fffbeb", icon: Icons.warning },
    { label: "À surveiller",    count: data?.info     || 0, color: "#1a5276", bg: "var(--p0)", icon: Icons.shield },
    { label: "Total alertes",   count: data?.total    || 0, color: "var(--sl6)", bg: "var(--sl1)", icon: Icons.filter },
  ];

  return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Alertes Pédagogiques</div>
          <div className="pg-subtitle">
            Groupes et modules nécessitant une intervention — générées automatiquement depuis les données importées
          </div>
        </div>
        <button className="btn-secondary" onClick={fetchData}>{Icons.filter} Actualiser</button>
      </div>

      {/* Summary cards */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
          {summaryCards.map((c, i) => (
            <div key={i} style={{
              background: c.bg, border: `1px solid ${c.color}22`,
              borderRadius: 12, padding: "16px 18px",
              display: "flex", alignItems: "center", gap: 14,
              cursor: i < 3 ? "pointer" : "default",
              outline: filterType === ["critique","warning","info"][i] ? `2px solid ${c.color}` : "none",
              transition: "outline .15s",
            }}
              onClick={() => {
                if (i < 3) {
                  const types = ["critique", "warning", "info"];
                  setFilterType(filterType === types[i] ? "" : types[i]);
                }
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: c.color + "20", display: "flex", alignItems: "center", justifyContent: "center", color: c.color, flexShrink: 0 }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: c.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{c.count}</div>
                <div style={{ fontSize: 12, color: "var(--sl5)", marginTop: 2 }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div style={{ background: "white", borderRadius: 12, border: "1px solid var(--border)", padding: "14px 18px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--sl4)", display: "flex", pointerEvents: "none" }}>{Icons.search}</span>
          <input className="search-input" style={{ paddingLeft: 32, width: 220 }} placeholder="Groupe, filière, secteur..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 180, height: 36 }} value={filterSecteur}
          onChange={e => { setFilterSecteur(e.target.value); }}>
          <option value="">Tous les secteurs</option>
          {secteurs.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <select className="form-select" style={{ width: 190, height: 36 }} value={filterCode}
          onChange={e => setFilterCode(e.target.value)}>
          <option value="">Tous les types</option>
          {Object.entries(CODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="form-select" style={{ width: 150, height: 36 }} value={filterCreneau}
          onChange={e => setFilterCreneau(e.target.value)}>
          <option value="">Tous les créneaux</option>
          <option value="CDJ">Cours du Jour (CDJ)</option>
          <option value="CDS">Cours du Soir (CDS)</option>
        </select>
        {(filterType || filterSecteur || filterCode || filterCreneau || search) && (
          <button className="btn-secondary" style={{ fontSize: 12, height: 36 }}
            onClick={() => { setFilterType(""); setFilterSecteur(""); setFilterCode(""); setFilterCreneau(""); setSearch(""); }}>
            {Icons.close} Réinitialiser
          </button>
        )}
        <span className="results-count" style={{ marginLeft: "auto" }}>{alertes.length} alerte(s)</span>
      </div>

      {/* Liste alertes */}
      {loading ? (
        <div className="loader"><div className="loader-spinner" /><span>Analyse en cours...</span></div>
      ) : alertes.length === 0 ? (
        <div className="empty" style={{ background: "white", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div className="empty-icon">{Icons.check}</div>
          <div className="empty-title">Aucune alerte</div>
          <div className="empty-desc">Tous les groupes sont dans les normes selon les filtres sélectionnés</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alertes.map((a, i) => {
            const cfg = TYPE_CONFIG[a.type];
            return (
              <div key={i} style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: 12,
                padding: "14px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                animation: `slideUp .3s ease ${i * .03}s both`,
              }}>
                {/* Icon */}
                <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.color + "18", display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: cfg.color }}>{a.titre}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, background: cfg.color, color: "white", padding: "2px 8px", borderRadius: 20 }}>
                      {CODE_LABELS[a.code] || a.code}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--sl7)", lineHeight: 1.55, marginBottom: 8 }}>{a.message}</p>
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
                      <span style={{ fontSize: 11.5, color: "var(--sl5)" }}>
                        {a.creneau === "CDS" ? "Cours du Soir" : "Cours du Jour"}
                      </span>
                    )}
                    <span style={{ fontSize: 11.5, color: "var(--sl4)" }}>{a.secteur}</span>
                  </div>
                </div>

                {/* Right meta */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sl7)", marginBottom: 4 }}>{a.groupe}</div>
                  <div style={{ fontSize: 11, color: "var(--sl5)" }}>{a.filiere}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}