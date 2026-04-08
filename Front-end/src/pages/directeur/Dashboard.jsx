import { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { Icons } from "../../components/admin/Icons";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ── Palette professionnelle cohérente ──
const C = {
  blue:    "#1a5276",
  blueL:   "#d5e4f1",
  blue2:   "#2e86c1",
  green:   "#1e8449",
  greenL:  "#d5f5e3",
  red:     "#c0392b",
  redL:    "#fadbd8",
  amber:   "#d68910",
  amberL:  "#fef9e7",
  sky:     "#1a7fa0",
  skyL:    "#d6eaf8",
  purple:  "#7d3c98",
  purpleL: "#f4ecf7",
  slate:   "#64748b",
  border:  "#e2e8f0",
  bg:      "#f8fafc",
};

// ── Helpers ──
const avcColor = v =>
  v >= 70 ? C.green : v >= 50 ? C.blue2 : v >= 30 ? C.amber : C.red;

const avcBadge = v => {
  if (v >= 70)  return { bg: C.greenL,  color: C.green,  label: "Bon" };
  if (v >= 50)  return { bg: C.skyL,    color: C.sky,    label: "Moyen" };
  if (v >= 30)  return { bg: C.amberL,  color: C.amber,  label: "Faible" };
  return              { bg: C.redL,    color: C.red,    label: "Critique" };
};

// ── Composant progress bar inline ──
function AvcBar({ value, max = 110 }) {
  const pct   = Math.min((value / max) * 100, 100);
  const color = avcColor(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width .4s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 38, textAlign: "right" }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

export default function DirecteurDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/stats").then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loader"><div className="loader-spinner" /><span>Chargement des statistiques...</span></div>
  );

  const noData = !stats || (stats.total_formateurs === 0 && stats.total_groupes === 0);
  if (noData) return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Tableau de bord</div>
          <div className="pg-subtitle">ISTA Hay Salam — 2025/2026</div>
        </div>
      </div>
      <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 14, border: `1px solid ${C.border}` }}>
        <div className="empty-icon" style={{ margin: "0 auto 16px", width: 56, height: 56 }}>{Icons.upload}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Aucune donnée disponible</div>
        <div style={{ color: C.slate, fontSize: 13, marginBottom: 24 }}>Importez le fichier BASE PLATE Excel pour afficher les statistiques</div>
        <a href="/directeur/import" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {Icons.upload} Importer le fichier
        </a>
      </div>
    </div>
  );

  const avcPct  = parseFloat(((stats.avc_moyen_global || 0) * 100).toFixed(1));
  const dist    = stats.distribution_groupes || {};
  const sectData = stats.avc_par_secteur || [];
  const mhData   = (stats.mh_par_filiere || []).slice(0, 8);
  const nivData  = stats.groupes_par_niveau || [];

  // ── KPI cards ──
  const cards = [
    {
      icon: "avc", label: "AVC Moyen Global", value: avcPct + "%",
      sub: `${stats.total_groupes} groupes suivis`,
      accent: avcColor(avcPct), accentL: avcPct >= 70 ? C.greenL : avcPct >= 50 ? C.skyL : avcPct >= 30 ? C.amberL : C.redL,
    },
    {
      icon: "check", label: "MH Réalisées", value: (stats.mh_realisee_totale || 0).toLocaleString() + "h",
      sub: `/ ${(stats.mh_drif_totale || 0).toLocaleString()}h planifiées`,
      accent: C.green, accentL: C.greenL,
    },
    {
      icon: "clock", label: "MH Restantes", value: (stats.mh_restante_totale || 0).toLocaleString() + "h",
      sub: `${(100 - avcPct).toFixed(1)}% du programme restant`,
      accent: C.red, accentL: C.redL,
    },
    {
      icon: "people", label: "Effectif Total", value: (stats.effectif_total || 0).toLocaleString(),
      sub: "stagiaires inscrits",
      accent: C.blue, accentL: C.blueL,
    },
    {
      icon: "users", label: "Formateurs", value: stats.total_formateurs || 0,
      sub: `${stats.formateurs_actifs || 0} actifs · ${stats.formateurs_inactifs || 0} inactifs`,
      accent: C.sky, accentL: C.skyL,
    },
    {
      icon: "groups", label: "Groupes", value: stats.total_groupes || 0,
      sub: `${dist.critique || 0} critiques · ${dist.faible || 0} faibles`,
      accent: C.blue2, accentL: C.blueL,
    },
    {
      icon: "book", label: "Modules", value: stats.total_modules || 0,
      sub: `${stats.total_filieres || 0} filières · ${stats.total_secteurs || 0} secteurs`,
      accent: C.purple, accentL: C.purpleL,
    },
    {
      icon: "alert", label: "Groupes Critiques", value: dist.critique || 0,
      sub: "AVC < 30% — intervention requise",
      accent: C.red, accentL: C.redL,
    },
  ];

  // ── Chart: AVC par secteur (horizontal bars) ──
  const barSect = {
    labels: sectData.map(s => s.secteur.length > 24 ? s.secteur.slice(0, 22) + "…" : s.secteur),
    datasets: [{
      data: sectData.map(s => parseFloat((s.avc_moyen * 100).toFixed(1))),
      backgroundColor: sectData.map(s => avcColor(s.avc_moyen * 100)),
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const optsH = {
    responsive: true,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: ctx => ` AVC : ${ctx.parsed.x.toFixed(1)}%` },
        bodyFont: { family: "'DM Sans', sans-serif", size: 12 },
        titleFont: { family: "'DM Sans', sans-serif", size: 12 },
        backgroundColor: "#1e293b", padding: 10, cornerRadius: 8,
      },
    },
    scales: {
      x: {
        max: 115,
        ticks: { callback: v => v + "%", font: { size: 11, family: "'DM Sans', sans-serif" }, color: C.slate },
        grid: { color: "#f1f5f9" },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { size: 11, family: "'DM Sans', sans-serif" }, color: "#334155" },
      },
    },
  };

  // ── Chart: Distribution donut ──
  const doughnutData = {
    labels: ["< 30% Critique", "30–50% Faible", "50–70% Moyen", "70–100% Bon", "> 100% Dépassé"],
    datasets: [{
      data: [dist.critique || 0, dist.faible || 0, dist.moyen || 0, dist.bon || 0, dist.depasse || 0],
      backgroundColor: [C.red, C.amber, C.sky, C.green, C.purple],
      borderWidth: 3,
      borderColor: "#fff",
      hoverOffset: 8,
    }],
  };

  const optsDoughnut = {
    responsive: true,
    cutout: "68%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          font: { family: "'DM Sans', sans-serif", size: 11 },
          padding: 14,
          usePointStyle: true,
          pointStyleWidth: 8,
          color: "#475569",
          generateLabels: chart => {
            const data = chart.data;
            return data.labels.map((label, i) => ({
              text: `${label}  (${data.datasets[0].data[i]})`,
              fillStyle: data.datasets[0].backgroundColor[i],
              pointStyle: "rectRounded",
              index: i,
            }));
          },
        },
      },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.parsed} groupes` },
        bodyFont: { family: "'DM Sans', sans-serif" },
        backgroundColor: "#1e293b", padding: 10, cornerRadius: 8,
      },
    },
  };

  // ── Chart: MH DRIF vs Réalisée ──
  const barMh = {
    labels: mhData.map(f => f.filiere.length > 15 ? f.filiere.slice(0, 13) + "…" : f.filiere),
    datasets: [
      { label: "MH DRIF",     data: mhData.map(f => f.mh_drif),     backgroundColor: C.blueL,  borderRadius: 3, borderSkipped: false },
      { label: "MH Réalisée", data: mhData.map(f => f.mh_realisee), backgroundColor: C.blue,   borderRadius: 3, borderSkipped: false },
    ],
  };

  const optsMh = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { font: { family: "'DM Sans', sans-serif", size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 8, color: "#475569" },
      },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.dataset.label} : ${ctx.parsed.y.toLocaleString()}h` },
        bodyFont: { family: "'DM Sans', sans-serif" },
        backgroundColor: "#1e293b", padding: 10, cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10, family: "'DM Sans', sans-serif" }, color: C.slate } },
      y: { grid: { color: "#f1f5f9" }, border: { display: false }, ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+"k" : v, font: { size: 11 }, color: C.slate } },
    },
  };

  // ── Chart: Groupes par niveau ──
  const barNiv = {
    labels: nivData.map(n => `Année ${n.annee}`),
    datasets: [{
      label: "Groupes",
      data: nivData.map(n => n.total),
      backgroundColor: [C.blue, C.green, C.amber, C.sky],
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const optsNiv = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.parsed.y} groupes` },
        bodyFont: { family: "'DM Sans', sans-serif" },
        backgroundColor: "#1e293b", padding: 10, cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 12, family: "'DM Sans', sans-serif" }, color: "#334155" } },
      y: { grid: { color: "#f1f5f9" }, border: { display: false }, ticks: { font: { size: 11 }, color: C.slate, stepSize: 1 } },
    },
  };

  // ── Style helpers ──
  const S = {
    section: { marginBottom: 20 },
    card: {
      background: "white",
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      padding: "18px 20px",
      boxShadow: "0 1px 4px rgba(15,23,42,.06)",
    },
    cardTitle: { fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4, letterSpacing: "-.1px" },
    cardSub:   { fontSize: 11, color: C.slate, marginBottom: 16 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 },
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Tableau de bord</div>
          <div className="pg-subtitle">Avancement Programme 2025–2026 — ISTA Hay Salam</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
          <span style={{ fontSize: 12, color: C.slate }}>Source : fichier Excel importé</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={S.grid4}>
        {cards.map((c, i) => (
          <div key={i} style={{ ...S.card, borderTop: `3px solid ${c.accent}`, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: c.accentL, display: "flex", alignItems: "center", justifyContent: "center", color: c.accent, flexShrink: 0 }}>
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
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>AVC par Secteur</div>
          <div style={S.cardSub}>Taux d'avancement MH réalisée / MH DRIF × 100</div>
          {sectData.length > 0
            ? <Bar data={barSect} options={optsH} />
            : <div className="empty"><div className="empty-icon">{Icons.chartBar}</div><div className="empty-title">Aucune donnée</div></div>
          }
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Distribution des Groupes</div>
          <div style={S.cardSub}>Répartition par tranche AVC</div>
          {Object.values(dist).some(v => v > 0)
            ? <Doughnut data={doughnutData} options={optsDoughnut} />
            : <div className="empty"><div className="empty-icon">{Icons.target}</div><div className="empty-title">Aucune donnée</div></div>
          }
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>MH DRIF vs MH Réalisée</div>
          <div style={S.cardSub}>Comparaison par filière — top 8</div>
          {mhData.length > 0
            ? <Bar data={barMh} options={optsMh} />
            : <div className="empty"><div className="empty-icon">{Icons.chartBar}</div><div className="empty-title">Aucune donnée</div></div>
          }
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Groupes par Année de Formation</div>
          <div style={S.cardSub}>Répartition des effectifs actifs</div>
          {nivData.length > 0
            ? <Bar data={barNiv} options={optsNiv} />
            : <div className="empty"><div className="empty-icon">{Icons.groups}</div><div className="empty-title">Aucune donnée</div></div>
          }
        </div>
      </div>
    </div>
  );
}