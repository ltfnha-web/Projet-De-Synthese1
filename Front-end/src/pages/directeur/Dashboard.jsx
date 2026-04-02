import { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { Icons } from "../../components/admin/Icons";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const CHART_COLORS = { indigo: "#6366f1", emerald: "#10b981", amber: "#f59e0b", red: "#ef4444", sky: "#0ea5e9", purple: "#8b5cf6" };

export default function DirecteurDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { axios.get("/stats").then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return (
    <div className="loader">
      <div className="loader-spinner" />
      <span>Chargement des statistiques...</span>
    </div>
  );

  const noData = !stats || (stats.total_formateurs === 0 && stats.total_groupes === 0);
  if (noData) return (
    <div>
      <div className="pg-header"><div className="pg-header-left"><div className="pg-title">Tableau de bord</div><div className="pg-subtitle">ISTA Hay Salam — 2025/2026</div></div></div>
      <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 14, border: "1px solid var(--border)" }}>
        <div className="empty-icon" style={{ margin: "0 auto 16px", width: 56, height: 56 }}>{Icons.upload}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--slate-800)", marginBottom: 6 }}>Aucune donnée disponible</div>
        <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>Importez le fichier BASE PLATE Excel pour afficher les statistiques</div>
        <a href="/directeur/import" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {Icons.upload} Importer le fichier
        </a>
      </div>
    </div>
  );

  const avcPct = ((stats.avc_moyen_global || 0) * 100).toFixed(1);
  const dist   = stats.distribution_groupes || {};

  const cards = [
    { icon: "avc",    label: "AVC Moyen Global",    value: avcPct + "%",                              cls: "stat-indigo", sub: `${stats.total_groupes} groupes` },
    { icon: "check",  label: "MH Réalisées",         value: stats.mh_realisee_totale?.toLocaleString() + "h", cls: "stat-green",  sub: `/ ${stats.mh_drif_totale?.toLocaleString()}h planifiées` },
    { icon: "clock",  label: "MH Restantes",         value: stats.mh_restante_totale?.toLocaleString() + "h", cls: "stat-red",    sub: `${(100 - parseFloat(avcPct)).toFixed(1)}% restant` },
    { icon: "people", label: "Effectif Total",       value: stats.effectif_total?.toLocaleString(),    cls: "stat-amber",  sub: "stagiaires" },
    { icon: "users",  label: "Formateurs",           value: stats.total_formateurs,                    cls: "stat-sky",    sub: `${stats.formateurs_actifs} actifs` },
    { icon: "groups", label: "Groupes",              value: stats.total_groupes,                       cls: "stat-indigo", sub: `${dist.critique || 0} critiques` },
    { icon: "book",   label: "Modules",              value: stats.total_modules,                       cls: "stat-purple", sub: `${stats.total_filieres} filières` },
    { icon: "alert",  label: "Groupes Critiques",    value: dist.critique || 0,                        cls: "stat-red",    sub: "AVC < 30%" },
  ];

  // AVC par secteur
  const sectData = stats.avc_par_secteur || [];
  const barSect = {
    labels: sectData.map(s => s.secteur.length > 22 ? s.secteur.slice(0, 20) + "…" : s.secteur),
    datasets: [{
      data: sectData.map(s => parseFloat((s.avc_moyen * 100).toFixed(1))),
      backgroundColor: sectData.map(s => {
        const v = s.avc_moyen * 100;
        return v >= 70 ? CHART_COLORS.emerald : v >= 30 ? CHART_COLORS.amber : CHART_COLORS.red;
      }),
      borderRadius: 4, borderSkipped: false,
    }],
  };

  // Distribution
  const doughnutData = {
    labels: ["< 30% Critique", "30–50% Faible", "50–70% Moyen", "70–100% Bon", "> 100% Dépassé"],
    datasets: [{
      data: [dist.critique || 0, dist.faible || 0, dist.moyen || 0, dist.bon || 0, dist.depasse || 0],
      backgroundColor: [CHART_COLORS.red, CHART_COLORS.amber, CHART_COLORS.sky, CHART_COLORS.emerald, CHART_COLORS.purple],
      borderWidth: 2, borderColor: "#fff", hoverOffset: 6,
    }],
  };

  // MH par filière
  const mhData = (stats.mh_par_filiere || []).slice(0, 8);
  const barMh = {
    labels: mhData.map(f => f.filiere.length > 16 ? f.filiere.slice(0, 14) + "…" : f.filiere),
    datasets: [
      { label: "MH DRIF",     data: mhData.map(f => f.mh_drif),     backgroundColor: "#e0e7ff", borderRadius: 3 },
      { label: "MH Réalisée", data: mhData.map(f => f.mh_realisee), backgroundColor: CHART_COLORS.indigo, borderRadius: 3 },
    ],
  };

  // Niveaux
  const nivData = stats.groupes_par_niveau || [];
  const barNiv = {
    labels: nivData.map(n => `Année ${n.annee}`),
    datasets: [{ label: "Groupes", data: nivData.map(n => n.total), backgroundColor: [CHART_COLORS.indigo, CHART_COLORS.emerald, CHART_COLORS.amber, CHART_COLORS.sky], borderRadius: 6 }],
  };

  const opts = (legend = true) => ({
    responsive: true,
    plugins: {
      legend: legend ? { position: "bottom", labels: { font: { family: "'DM Sans', sans-serif", size: 11 }, padding: 14, usePointStyle: true, pointStyleWidth: 8 } } : { display: false },
      tooltip: { bodyFont: { family: "'DM Sans', sans-serif" }, titleFont: { family: "'DM Sans', sans-serif" } },
    },
    scales: legend ? undefined : { x: { grid: { display: false } }, y: { grid: { color: "#f1f5f9" } } },
  });

  const optsH = {
    ...opts(false),
    indexAxis: "y",
    scales: { x: { max: 120, ticks: { callback: v => v + "%", font: { size: 11 } }, grid: { color: "#f1f5f9" } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } },
  };

  return (
    <div>
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Tableau de bord</div>
          <div className="pg-subtitle">Avancement Programme 2025–2026 — ISTA Hay Salam</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--slate-100)", padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)" }}>
          Source : fichier Excel importé
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {cards.map((c, i) => (
          <div className={`stat-card ${c.cls}`} key={i}>
            <div className="stat-card-header">
              <div className="stat-card-icon">{Icons[c.icon]}</div>
            </div>
            <div className="stat-value">{c.value ?? 0}</div>
            <div className="stat-label">{c.label}</div>
            {c.sub && <div style={{ fontSize: 11, color: "var(--text-light)" }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* CHARTS ROW 1 */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <div><div className="chart-title">AVC par Secteur</div><div className="chart-subtitle">MH Réalisée / MH DRIF × 100</div></div>
          </div>
          {sectData.length > 0 ? <Bar data={barSect} options={optsH} /> : <div className="empty"><div className="empty-icon">{Icons.chartBar}</div><div className="empty-title">Aucune donnée</div></div>}
        </div>
        <div className="chart-card">
          <div className="chart-card-header">
            <div><div className="chart-title">Distribution Groupes</div><div className="chart-subtitle">Tranches AVC</div></div>
          </div>
          {Object.values(dist).some(v => v > 0) ? <Doughnut data={doughnutData} options={opts()} /> : <div className="empty"><div className="empty-icon">{Icons.target}</div><div className="empty-title">Aucune donnée</div></div>}
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <div><div className="chart-title">MH DRIF vs Réalisée</div><div className="chart-subtitle">Top 8 filières</div></div>
          </div>
          {mhData.length > 0 ? <Bar data={barMh} options={opts()} /> : <div className="empty"><div className="empty-icon">{Icons.chartBar}</div><div className="empty-title">Aucune donnée</div></div>}
        </div>
        <div className="chart-card">
          <div className="chart-card-header">
            <div><div className="chart-title">Groupes par Année de Formation</div><div className="chart-subtitle">Répartition des effectifs</div></div>
          </div>
          {nivData.length > 0 ? <Bar data={barNiv} options={opts(false)} /> : <div className="empty"><div className="empty-icon">{Icons.groups}</div><div className="empty-title">Aucune donnée</div></div>}
        </div>
      </div>
    </div>
  );
}