import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, ArcElement, Tooltip, Legend,
} from "chart.js";
import { Icons } from "../../components/admin/Icons";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ── Palette ──
const C = {
  blue:   "#1a5276", blueL:   "#d5e4f1",
  blue2:  "#2e86c1",
  green:  "#1e8449", greenL:  "#d5f5e3",
  red:    "#c0392b", redL:    "#fadbd8",
  amber:  "#d68910", amberL:  "#fef9e7",
  sky:    "#1a7fa0", skyL:    "#d6eaf8",
  purple: "#7d3c98", purpleL: "#f4ecf7",
  slate:  "#64748b", border:  "#e2e8f0",
};

const avcColor = v => v >= 70 ? C.green : v >= 50 ? C.blue2 : v >= 30 ? C.amber : C.red;
const avcLabel = v => v >= 70 ? "Bon" : v >= 50 ? "Moyen" : v >= 30 ? "Faible" : "Critique";

const tooltipBase = {
  backgroundColor: "#1e293b", padding: 10, cornerRadius: 8,
  bodyFont: { family: "'DM Sans', sans-serif", size: 12 },
  titleFont: { family: "'DM Sans', sans-serif", size: 12 },
};

// ── Filtre Dropdown ──
function FilterSelect({ label, value, onChange, options }) {
  const active = !!value;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 170 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: ".07em" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%", height: 36, paddingLeft: 10, paddingRight: 28,
            border: `1.5px solid ${active ? C.blue : C.border}`,
            borderRadius: 8, fontSize: 12.5, fontFamily: "'DM Sans', sans-serif",
            color: active ? C.blue : "#334155",
            background: active ? C.blueL : "white",
            appearance: "none", outline: "none", cursor: "pointer",
            fontWeight: active ? 600 : 400, transition: "all .15s",
          }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: active ? C.blue : C.slate, display: "flex" }}>
          {Icons.chevronDown}
        </span>
      </div>
    </div>
  );
}

// ── Badge filtre actif ──
function Chip({ label, onRemove }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: C.blueL, color: C.blue, border: `1px solid ${C.blue}44`,
      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
    }}>
      {label}
      <span onClick={onRemove} style={{ cursor: "pointer", display: "flex", opacity: .7 }}>
        {Icons.close}
      </span>
    </span>
  );
}

// ── Card wrapper ──
const Card = ({ children, style = {} }) => (
  <div style={{
    background: "white", borderRadius: 14,
    border: `1px solid ${C.border}`,
    padding: "18px 20px",
    boxShadow: "0 1px 4px rgba(15,23,42,.06)",
    ...style,
  }}>
    {children}
  </div>
);

// ── Chart header avec explication ──
function ChartHeader({ title, explication, badge }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{title}</span>
        {badge}
      </div>
      <p style={{ fontSize: 11, color: C.slate, lineHeight: 1.5, margin: 0 }}>{explication}</p>
    </div>
  );
}

export default function DirecteurDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Filtres (envoyés au backend) ──
  const [fSecteur,  setFSecteur]  = useState("");
  const [fCreneau,  setFCreneau]  = useState("");
  const [fAnnee,    setFAnnee]    = useState("");
  const [fSeuil,    setFSeuil]    = useState("");
  const [fGroupe,   setFGroupe]   = useState("");
  const [fModule,   setFModule]   = useState("");
  const [fExamType, setFExamType] = useState(""); // Filtre par type d'examen

  // ── Fetch avec params ──
  const fetchStats = useCallback(() => {
    setLoading(true);
    const params = {};
    if (fSecteur)  params.secteur_id = fSecteur;
    if (fCreneau)  params.creneau    = fCreneau;
    if (fAnnee)    params.annee      = fAnnee;
    if (fSeuil)    params.seuil      = fSeuil;
    if (fGroupe)   params.groupe_id  = fGroupe;
    if (fModule)   params.module_id  = fModule;
    if (fExamType) params.exam_type  = fExamType;

    axios.get("/stats", { params })
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fSecteur, fCreneau, fAnnee, fSeuil, fGroupe, fModule, fExamType]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── No data ──
  if (!loading && (!stats || (stats.total_formateurs === 0 && stats.total_groupes === 0))) return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Tableau de bord</div>
          <div className="pg-subtitle">ISTA Hay Salam — 2025/2026</div>
        </div>
      </div>
      <Card style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="empty-icon" style={{ margin: "0 auto 16px", width: 56, height: 56 }}>{Icons.upload}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Aucune donnée disponible</div>
        <div style={{ color: C.slate, fontSize: 13, marginBottom: 24 }}>Importez le fichier BASE PLATE Excel pour afficher les statistiques</div>
        <a href="/directeur/import" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {Icons.upload} Importer
        </a>
      </Card>
    </div>
  );

  const avcPct   = parseFloat(((stats?.avc_moyen_global || 0) * 100).toFixed(1));
  const dist     = stats?.distribution_groupes || {};
  const secteurs = stats?.avc_par_secteur      || [];
  const mhFil    = (stats?.mh_par_filiere      || []).slice(0, 8);
  const niveaux  = stats?.groupes_par_niveau   || [];

  // Options dropdown secteurs depuis API
  const secteurOpts = [
    { value: "", label: "Tous les secteurs" },
    ...(stats?.secteurs_list || []).map(s => ({ value: s.id, label: s.nom })),
  ];
  const creneauOpts = [
    { value: "", label: "CDJ + CDS (tous)" },
    { value: "CDJ", label: " Cours du Jour (CDJ)" },
    { value: "CDS", label: " Cours du Soir (CDS)" },
  ];
  const anneeOpts = [
    { value: "", label: "Toutes les années" },
    { value: "1", label: "1ère année" },
    { value: "2", label: "2ème année" },
    { value: "3", label: "3ème année" },
  ];
  const seuilOpts = [
    { value: "",         label: "Tous les niveaux AVC" },
    { value: "critique", label: "🔴 Critiques seulement (< 30%)" },
    { value: "risque",   label: "🟠 À risque (AVC < 50%)" },
  ];

  // Reset groupes/modules cascades
  const handleSecteurChange = (v) => { setFSecteur(v); setFGroupe(""); setFModule(""); };
  const handleGroupeChange  = (v) => { setFGroupe(v);  setFModule(""); };

  const EXAM_LABELS = {
    EFF: "Fin de Formation (EFF)", "Fin de Formation": "Fin de Formation",
    "Fin Formation": "Fin de Formation",
    EFP: "Passage (EFP)", Passage: "Passage",
    Qualifiante: "Qualifiante", Diplômante: "Diplômante",
    EFM: "EFM", "1A": "1ère Année", "2A": "2ème Année", Aucun: "Aucun",
  };
  const examTypeOpts = [
    { value: "", label: "Tous types d'examen" },
    ...(stats?.exam_types_list || []).map(t => ({ value: t, label: EXAM_LABELS[t] || t })),
  ];

  const hasFilters = fSecteur || fCreneau || fAnnee || fSeuil || fGroupe || fModule || fExamType;
  const resetAll   = () => { setFSecteur(""); setFCreneau(""); setFAnnee(""); setFSeuil(""); setFGroupe(""); setFModule(""); setFExamType(""); };

  // ── KPI Cards ──
  const avcAccent = avcColor(avcPct);
  const avcAccentL = avcPct >= 70 ? C.greenL : avcPct >= 50 ? C.skyL : avcPct >= 30 ? C.amberL : C.redL;

  const cards = [
    { icon: "avc",    label: "AVC Moyen",         value: avcPct + "%",                                        sub: avcLabel(avcPct) + " — " + (stats?.total_groupes || 0) + " groupes", accent: avcAccent, accentL: avcAccentL },
    { icon: "check",  label: "MH Réalisées",       value: (stats?.mh_realisee_totale || 0).toLocaleString()+"h", sub: `sur ${(stats?.mh_drif_totale || 0).toLocaleString()}h planifiées`,    accent: C.green,   accentL: C.greenL  },
    { icon: "clock",  label: "MH Restantes",       value: (stats?.mh_restante_totale || 0).toLocaleString()+"h", sub: `${(100 - avcPct).toFixed(1)}% du programme restant`,               accent: C.red,     accentL: C.redL    },
    { icon: "people", label: "Effectif",           value: (stats?.effectif_total || 0).toLocaleString(),          sub: "stagiaires inscrits",                                               accent: C.blue,    accentL: C.blueL   },
    { icon: "users",  label: "Formateurs",         value: stats?.total_formateurs || 0,                           sub: `${stats?.formateurs_actifs || 0} actifs`,                           accent: C.sky,     accentL: C.skyL    },
    { icon: "groups", label: "Groupes",            value: stats?.total_groupes || 0,                              sub: `${dist.critique || 0} critiques (AVC < 30%)`,                      accent: C.blue2,   accentL: C.blueL   },
    { icon: "book",   label: "Modules",            value: stats?.total_modules || 0,                              sub: `${stats?.total_filieres || 0} filières`,                            accent: C.purple,  accentL: C.purpleL },
    { icon: "alert",  label: "Groupes Critiques",  value: dist.critique || 0,                                     sub: "nécessitent une intervention",                                      accent: C.red,     accentL: C.redL    },
  ];

  // ── Chart: AVC par secteur ──
  const barSect = {
    labels: secteurs.map(s => s.secteur.length > 26 ? s.secteur.slice(0, 24)+"…" : s.secteur),
    datasets: [{
      data: secteurs.map(s => parseFloat((s.avc_moyen * 100).toFixed(1))),
      backgroundColor: secteurs.map(s => avcColor(s.avc_moyen * 100)),
      borderRadius: 5, borderSkipped: false,
    }],
  };

  const optsH = {
    responsive: true, indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        callbacks: {
          label: ctx => ` AVC : ${ctx.parsed.x.toFixed(1)}%  —  ${avcLabel(ctx.parsed.x)}`,
          afterLabel: ctx => {
            const s = secteurs[ctx.dataIndex];
            if (!s) return "";
            return ` MH réalisée : ${Math.round(s.mh_realisee).toLocaleString()}h / ${Math.round(s.mh_drif).toLocaleString()}h`;
          },
        },
      },
    },
    scales: {
      x: {
        min: 0, max: 115,
        ticks: { callback: v => v + "%", font: { size: 11 } },
        grid: { color: "#f1f5f9" }, border: { display: false },
      },
      y: {
        grid: { display: false }, border: { display: false },
        ticks: { font: { size: 11 }, color: "#334155" },
      },
    },
  };

  // ── Chart: Distribution donut ──
  const totalGroupes = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
  const doughnutData = {
    labels: ["Critique (< 30%)", "Faible (30–50%)", "Moyen (50–70%)", "Bon (70–100%)", "Dépassé (> 100%)"],
    datasets: [{
      data: [dist.critique || 0, dist.faible || 0, dist.moyen || 0, dist.bon || 0, dist.depasse || 0],
      backgroundColor: [C.red, C.amber, C.sky, C.green, C.purple],
      borderWidth: 3, borderColor: "#fff", hoverOffset: 8,
    }],
  };

  const optsDoughnut = {
    responsive: true, cutout: "65%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          font: { family: "'DM Sans', sans-serif", size: 11 },
          padding: 12, usePointStyle: true, pointStyleWidth: 8, color: "#475569",
          generateLabels: chart => chart.data.labels.map((label, i) => {
            const val = chart.data.datasets[0].data[i];
            const pct = ((val / totalGroupes) * 100).toFixed(0);
            return {
              text: `${label}  —  ${val} (${pct}%)`,
              fillStyle: chart.data.datasets[0].backgroundColor[i],
              pointStyle: "rectRounded", index: i,
            };
          }),
        },
      },
      tooltip: {
        ...tooltipBase,
        callbacks: {
          label: ctx => {
            const pct = ((ctx.parsed / totalGroupes) * 100).toFixed(1);
            return ` ${ctx.parsed} groupes (${pct}% du total)`;
          },
        },
      },
    },
  };

  // ── Chart: MH par filière ──
  const barMh = {
    labels: mhFil.map(f => f.filiere.length > 18 ? f.filiere.slice(0, 16)+"…" : f.filiere),
    datasets: [
      { label: "MH Planifiée (DRIF)", data: mhFil.map(f => f.mh_drif),     backgroundColor: C.blueL,  borderRadius: 3, borderSkipped: false },
      { label: "MH Réalisée",         data: mhFil.map(f => f.mh_realisee), backgroundColor: C.blue,   borderRadius: 3, borderSkipped: false },
    ],
  };

  const optsMh = {
    responsive: true,
    plugins: {
      legend: {
        position: "top", align: "end",
        labels: { font: { family: "'DM Sans', sans-serif", size: 11 }, padding: 14, usePointStyle: true, pointStyleWidth: 8, color: "#475569" },
      },
      tooltip: {
        ...tooltipBase,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label} : ${ctx.parsed.y.toLocaleString()}h`,
          afterBody: (items) => {
            const i = items[0]?.dataIndex;
            if (i === undefined) return "";
            const f = mhFil[i];
            if (!f || !f.mh_drif) return "";
            const avc = ((f.mh_realisee / f.mh_drif) * 100).toFixed(1);
            return [``, ` AVC filière : ${avc}%  —  ${avcLabel(parseFloat(avc))}`];
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 }, color: C.slate, maxRotation: 35 } },
      y: {
        grid: { color: "#f1f5f9" }, border: { display: false },
        ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+"k" : v, font: { size: 11 }, color: C.slate },
      },
    },
  };

  // ── Chart: Groupes par niveau ──
  const barNiv = {
    labels: niveaux.map(n => `${n.annee}ère année`),
    datasets: [{
      label: "Nombre de groupes",
      data: niveaux.map(n => n.total),
      backgroundColor: [C.blue, C.green, C.amber],
      borderRadius: 7, borderSkipped: false,
    }],
  };

  const optsNiv = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        callbacks: { label: ctx => ` ${ctx.parsed.y} groupes en ${ctx.label}` },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 13, family: "'DM Sans', sans-serif" }, color: "#334155" } },
      y: { grid: { color: "#f1f5f9" }, border: { display: false }, ticks: { font: { size: 11 }, color: C.slate, stepSize: 5 } },
    },
  };

  return (
    <div>

      {/* ── Header ── */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Tableau de bord</div>
          <div className="pg-subtitle">Avancement Programme 2025–2026 — ISTA Hay Salam</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {loading && <div className="loader-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green }} />
          <span style={{ fontSize: 12, color: C.slate }}>Source : fichier Excel importé</span>
        </div>
      </div>

      {/* ══════════════════════════════════════
          BARRE FILTRES
      ══════════════════════════════════════ */}
      <Card style={{ marginBottom: 18, padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <FilterSelect label="Secteur"         value={fSecteur}  onChange={handleSecteurChange} options={secteurOpts}  />
          <FilterSelect label="Créneau"         value={fCreneau}  onChange={setFCreneau}          options={creneauOpts}  />
          <FilterSelect label="Année"           value={fAnnee}    onChange={setFAnnee}            options={anneeOpts}    />
          <FilterSelect label="Niveau AVC"      value={fSeuil}    onChange={setFSeuil}            options={seuilOpts}    />
          <FilterSelect label="Type d'examen"   value={fExamType} onChange={setFExamType}         options={examTypeOpts} />

          {/* Groupe — apparaît seulement si secteur sélectionné */}
          {fSecteur && (stats?.groupes_list?.length > 0) && (
            <FilterSelect
              label="Groupe"
              value={fGroupe}
              onChange={handleGroupeChange}
              options={[
                { value: "", label: "Tous les groupes" },
                ...(stats.groupes_list || []).map(g => ({ value: g.id, label: g.nom + (g.creneau ? " ("+g.creneau+")" : "") })),
              ]}
            />
          )}

          {/* Module — apparaît seulement si secteur sélectionné */}
          {fSecteur && (stats?.modules_list?.length > 0) && (
            <FilterSelect
              label="Module"
              value={fModule}
              onChange={setFModule}
              options={[
                { value: "", label: "Tous les modules" },
                ...(stats.modules_list || []).map(m => ({ value: m.id, label: m.code + " — " + (m.intitule.length > 30 ? m.intitule.slice(0,28)+"…" : m.intitule) })),
              ]}
            />
          )}

          {hasFilters && (
            <button
              onClick={resetAll}
              style={{
                height: 36, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 6,
                background: C.redL, color: C.red, border: `1px solid ${C.red}44`,
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", alignSelf: "flex-end",
              }}
            >
              {Icons.close} Réinitialiser
            </button>
          )}

          <div style={{ marginLeft: "auto", alignSelf: "flex-end", fontSize: 11, color: C.slate, paddingBottom: 6 }}>
            {loading ? "Chargement…" : `${secteurs.length} secteur(s) · ${mhFil.length} filière(s)`}
          </div>
        </div>

        {hasFilters && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 11, color: C.slate, alignSelf: "center" }}>Filtres actifs :</span>
            {fSecteur   && <Chip label={secteurOpts.find(o => o.value == fSecteur)?.label || fSecteur}  onRemove={() => { setFSecteur(""); setFGroupe(""); setFModule(""); }} />}
            {fCreneau   && <Chip label={fCreneau === "CDJ" ? "Cours du Jour" : "Cours du Soir"}          onRemove={() => setFCreneau("")}   />}
            {fAnnee     && <Chip label={`${fAnnee}ère année`}                                             onRemove={() => setFAnnee("")}     />}
            {fSeuil     && <Chip label={fSeuil === "critique" ? "Critiques < 30%" : "À risque < 50%"}    onRemove={() => setFSeuil("")}     />}
            {fExamType  && <Chip label={`Type : ${fExamType}`}                                            onRemove={() => setFExamType("")}  />}
            {fGroupe    && <Chip label={`Groupe : ${(stats?.groupes_list || []).find(g => String(g.id) === String(fGroupe))?.nom || fGroupe}`} onRemove={() => { setFGroupe(""); setFModule(""); }} />}
            {fModule    && <Chip label={`Module : ${(stats?.modules_list || []).find(m => String(m.id) === String(fModule))?.code || fModule}`} onRemove={() => setFModule("")} />}
          </div>
        )}
      </Card>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            background: "white", borderRadius: 14, border: `1px solid ${C.border}`,
            borderTop: `3px solid ${c.accent}`, padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(15,23,42,.06)",
            opacity: loading ? .6 : 1, transition: "opacity .2s",
          }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: c.accentL, display: "flex", alignItems: "center", justifyContent: "center", color: c.accent }}>
                <span style={{ display: "flex", width: 18, height: 18 }}>{Icons[c.icon]}</span>
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-.5px", lineHeight: 1, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>
              {c.value ?? 0}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 3 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: C.slate }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        <Card>
          <ChartHeader
            title="AVC par Secteur"
            explication="L'AVC (Avancement du Cours) mesure ce qui a été enseigné vs ce qui était prévu. 100% = programme terminé. Rouge = moins de 30% = urgent."
            badge={
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: C.amberL, color: C.amber }}>
                % réalisé / planifié
              </span>
            }
          />
          {/* Légende couleurs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            {[["#c0392b","< 30% Critique"],["#d68910","30–50% Faible"],["#2e86c1","50–70% Moyen"],["#1e8449","≥ 70% Bon"]].map(([color, label]) => (
              <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.slate }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
                {label}
              </span>
            ))}
          </div>
          {secteurs.length > 0
            ? <Bar data={barSect} options={optsH} />
            : <div className="empty"><div className="empty-icon">{Icons.chartBar}</div><div className="empty-title">Aucun secteur pour ces filtres</div></div>
          }
        </Card>

        <Card>
          <ChartHeader
            title="Répartition des Groupes par Niveau AVC"
            explication="Montre combien de groupes sont en danger. Idéalement, la majorité doit être dans les tranches Bon (vert) ou Moyen (bleu). Rouge = intervention requise."
          />
          {Object.values(dist).some(v => v > 0)
            ? <Doughnut data={doughnutData} options={optsDoughnut} />
            : <div className="empty"><div className="empty-icon">{Icons.target}</div><div className="empty-title">Aucune donnée pour ces filtres</div></div>
          }
        </Card>

      </div>

      {/* ── Charts Row 2 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        <Card>
          <ChartHeader
            title="Heures Planifiées vs Réalisées par Filière"
            explication="Compare les heures DRIF (ce qui était prévu) aux heures réellement dispensées. Plus la barre bleue foncée se rapproche de la barre claire, mieux c'est."
          />
          {mhFil.length > 0
            ? <Bar data={barMh} options={optsMh} />
            : <div className="empty"><div className="empty-icon">{Icons.chartBar}</div><div className="empty-title">Aucune filière pour ces filtres</div></div>
          }
        </Card>

        <Card>
          <ChartHeader
            title="Groupes par Année de Formation"
            explication="Nombre de groupes actifs par année. Passez la souris sur une barre pour voir le détail."
          />
          {niveaux.length > 0
            ? <Bar data={barNiv} options={optsNiv} />
            : <div className="empty"><div className="empty-icon">{Icons.groups}</div><div className="empty-title">Aucun groupe pour ces filtres</div></div>
          }
        </Card>

      </div>

    </div>
  );
}