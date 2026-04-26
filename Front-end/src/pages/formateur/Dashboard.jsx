import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./FormateurDashboard.css";

/* ─── constants ─────────────────────────────────────────────────────── */
const SEANCES = [
  { label: "Séance 1", horaire: "08:30-11:00" },
  { label: "Séance 2", horaire: "11:00-13:30" },
  { label: "Séance 3", horaire: "13:30-16:00" },
  { label: "Séance 4", horaire: "16:00-18:30" },
];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

/* ─── helpers ───────────────────────────────────────────────────────── */
function toStr(v) {
  if (v == null) return "";
  if (typeof v === "object") return v.intitule ?? v.code ?? v.nom ?? JSON.stringify(v);
  return String(v);
}
function countSeances(grille) {
  if (!grille) return 0;
  return JOURS.reduce((n, j) => n + (grille[j] ?? []).filter(Boolean).length, 0);
}
function distinctGroupes(grille) {
  if (!grille) return [];
  const s = new Set();
  JOURS.forEach(j => (grille[j] ?? []).forEach(c => c?.groupe && s.add(c.groupe)));
  return [...s];
}
function todayFR() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* ─── icons ─────────────────────────────────────────────────────────── */
const Ico = {
  logout:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  users:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  layers:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  print:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  close:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  sort:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  empty:    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>,
};

/* ─── print document (OFPPT format) ─────────────────────────────────── */
function PrintDoc({ nom, semestre, periodeDebut, grille }) {
  const TD  = { border: "1px solid #000", padding: "2px 5px", verticalAlign: "top", color: "#000", background: "#fff", fontSize: 9, fontFamily: "Arial, Helvetica, sans-serif" };
  const TBL = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" };
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 9, color: "#000", background: "#fff", padding: "6px 8px", boxSizing: "border-box", width: "100%" }}>
      {/* header */}
      <table style={TBL}>
        <colgroup><col style={{ width: "14%" }} /><col style={{ width: "56%" }} /><col style={{ width: "30%" }} /></colgroup>
        <tbody><tr>
          <td style={{ ...TD, textAlign: "center", verticalAlign: "middle", padding: "4px 6px" }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>OFPPT</div>
            <div style={{ fontSize: 7.5, direction: "rtl", lineHeight: 1.5 }}>مكتب التكوين المهني وإنعاش الشغل</div>
            <div style={{ fontSize: 7, color: "#555", direction: "rtl" }}>المملكة المغربية</div>
            <div style={{ marginTop: 2, fontWeight: 700, fontSize: 9 }}>CF SALE I</div>
          </td>
          <td style={{ ...TD, textAlign: "center", verticalAlign: "middle", padding: "5px 10px" }}>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2 }}>EMPLOI DU TEMPS</div>
            <div style={{ fontSize: 9, direction: "rtl", fontFamily: "serif", color: "#333", margin: "2px 0" }}>جدول التوقيت الأسبوعي</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Année de Formation 2025-2026</div>
          </td>
          <td style={{ ...TD, textAlign: "right", verticalAlign: "middle", padding: "4px 8px" }}>
            <div style={{ direction: "rtl", fontSize: 8.5, lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700 }}>مكتب التكوين المهني والتقني</div>
              <div>Office de la Formation Professionnelle</div>
              <div>et de la Promotion du Travail</div>
            </div>
          </td>
        </tr></tbody>
      </table>
      {/* EFP */}
      <table style={TBL}><tbody><tr>
        <td style={{ ...TD, padding: "2px 6px" }}>
          <span style={{ fontWeight: 700 }}>EFP : </span>ISTA HAY SALAM SALE
          <span style={{ float: "right", fontWeight: 700, textDecoration: "underline" }}>Version 1</span>
        </td>
      </tr></tbody></table>
      {/* cyan band */}
      <table style={TBL}><tbody><tr>
        <td style={{ border: "1px solid #000", padding: "3px 8px", background: "#00bcd4", textAlign: "center", fontWeight: 900, fontSize: 11 }}>
          Période d'application : A partir du {periodeDebut ?? "—"}
        </td>
      </tr></tbody></table>
      {/* formateur info */}
      <table style={TBL}><tbody><tr>
        <td style={{ ...TD, padding: "6px 10px" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 10 }}><tbody>
            {[
              ["Formateur :",          <strong key="f" style={{ fontSize: 11 }}>{nom}</strong>],
              ["Année de Formation :", "2025-2026"],
              ["Semestre :",           semestre],
            ].map(([k, v], i) => (
              <tr key={i}>
                <td style={{ paddingRight: 10, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 2, color: "#000" }}>{k}</td>
                <td style={{ lineHeight: 2, color: "#000" }}>{v}</td>
              </tr>
            ))}
          </tbody></table>
        </td>
      </tr></tbody></table>
      {/* grid */}
      <table style={TBL}>
        <colgroup>
          <col style={{ width: "7%" }} />
          {[0,1,2,3].map(i => <col key={i} style={{ width: "23.25%" }} />)}
        </colgroup>
        <thead><tr>
          <th style={{ ...TD, background: "#d0d8e8", textAlign: "center", fontWeight: 700, verticalAlign: "middle", padding: "2px 3px" }}>
            <div style={{ fontSize: 8.5 }}>Séances</div><div style={{ fontSize: 8.5 }}>Jours</div>
          </th>
          {SEANCES.map((s, i) => (
            <th key={i} style={{ ...TD, background: "#d0d8e8", textAlign: "center", fontWeight: 700, padding: "2px 4px" }}>
              <div style={{ fontSize: 9 }}>{s.label}</div>
              <div style={{ fontWeight: 400, fontSize: 8.5 }}>{s.horaire}</div>
            </th>
          ))}
        </tr></thead>
        <tbody>
          {JOURS.map(jour => {
            const seances = Array.isArray(grille?.[jour]) ? grille[jour] : [null,null,null,null];
            return (
              <tr key={jour}>
                <td style={{ ...TD, fontWeight: 700, fontSize: 9, textAlign: "center", verticalAlign: "middle", background: "#fafafa", padding: "2px 3px" }}>{jour}</td>
                {seances.map((s, i) =>
                  !s?.module
                    ? <td key={i} style={{ ...TD, padding: "2px 4px" }}><div style={{ minHeight: 32 }} /></td>
                    : <td key={i} style={{ ...TD, verticalAlign: "top", padding: "2px 4px" }}>
                        <div style={{ fontSize: 8, color: "#444", marginBottom: 1 }}>{SEANCES[i].horaire}</div>
                        <div style={{ fontWeight: 700, fontSize: 9, lineHeight: 1.25, marginBottom: 1 }}>{toStr(s.module)}</div>
                        <div style={{ fontSize: 8.5, color: "#555", marginBottom: 1 }}>Grp. {toStr(s.groupe)}</div>
                        <div style={{ fontSize: 8 }}>{s.mode === "DISTANCIEL" ? "Formation à distance" : `Présentiel${s.salle ? ` / ${s.salle}` : ""}`}</div>
                      </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* footer */}
      <table style={TBL}>
        <colgroup><col style={{ width: "35%" }} /><col style={{ width: "35%" }} /><col style={{ width: "30%" }} /></colgroup>
        <tbody><tr>
          <td style={{ ...TD, verticalAlign: "top", padding: "3px 6px" }}>
            <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: 2, fontSize: 9, color: "#000" }}>Emargements :</div>
            <div style={{ fontSize: 8.5, lineHeight: 1.7, color: "#000" }}>
              <div>Fait à Salé</div><div>Date : {periodeDebut ?? "—"}</div>
            </div>
            <div style={{ height: 22 }} />
          </td>
          <td style={{ ...TD, textAlign: "center", verticalAlign: "top", padding: "3px 6px" }}>
            <div style={{ fontWeight: 700, textDecoration: "underline", marginBottom: 3, fontSize: 9, color: "#000" }}>Le Directeur</div>
            <div style={{ height: 22 }} />
            <div style={{ fontSize: 8.5, color: "#0055aa", fontWeight: 700, lineHeight: 1.7 }}>
              <div>KADDOURI HICHAM</div><div>DIRECTEUR D'ETABLISSEMENT</div><div>ISTA HAY SALAM SALE</div>
            </div>
          </td>
          <td style={{ ...TD, textAlign: "center", verticalAlign: "middle", padding: "3px 6px" }}>
            <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 3, color: "#000" }}>DRRSK</div>
            <div style={{ fontSize: 8.5, lineHeight: 1.7, color: "#000" }}>
              <div>ISTA Hay Salam - CF SALE 1</div><div>Abd ABDELKRIM KHATABI</div><div>Hay Salam - Salé</div>
            </div>
          </td>
        </tr></tbody>
      </table>
    </div>
  );
}

/* ─── KPI card ───────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, unit, color }) {
  return (
    <div className="fmd-kpi-card" style={{
      flex: "1 1 160px", background: "#fff", borderRadius: 14, padding: "18px 20px",
      border: "1px solid #e4e4e7", boxShadow: "0 1px 4px rgba(0,0,0,.06)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#111", lineHeight: 1 }}>
          {value}<span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af", marginLeft: 4 }}>{unit}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── timetable grid (screen) ────────────────────────────────────────── */
function TimetableGrid({ grille }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 640 }}>
        <thead>
          <tr>
            <th style={{ background: "#111", color: "#fff", padding: "10px 14px", border: "1px solid #333", width: 84, fontSize: 11, fontWeight: 700 }}>Jour</th>
            {SEANCES.map((s, i) => (
              <th key={i} style={{ background: "#111", color: "#fff", padding: "8px 12px", textAlign: "center", border: "1px solid #333" }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{s.label}</div>
                <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.55 }}>{s.horaire}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {JOURS.map((jour, ji) => (
            <tr key={jour} style={{ background: ji % 2 === 0 ? "#fff" : "#f9fafb" }}>
              <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 12, border: "1px solid #e4e4e7", color: "#111" }}>{jour}</td>
              {[0,1,2,3].map(si => {
                const cell = (grille?.[jour] ?? [])[si];
                if (!cell) return (
                  <td key={si} style={{ padding: "12px", textAlign: "center", color: "#d1d5db", border: "1px solid #e4e4e7", fontSize: 20 }}>·</td>
                );
                return (
                  <td key={si} style={{ padding: "10px 12px", verticalAlign: "top", border: "1px solid #e4e4e7" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#111", marginBottom: 3 }}>{toStr(cell.module)}</div>
                    <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginBottom: 3 }}>Grp. {toStr(cell.groupe)}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>
                      {cell.mode === "DISTANCIEL"
                        ? <span style={{ color: "#0891b2" }}>En ligne</span>
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

/* ═══════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
export default function FormateurDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [emplois, setEmplois]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [filterSem, setFilterSem] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    axios.get("/formateur/emploi-du-temps")
      .then(r => {
        const list = r.data.data ?? [];
        setEmplois(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const handlePrint = () => {
    const el = document.getElementById("fmt-print-doc");
    if (!el) return;
    const win = window.open("", "_blank", "width=1200,height=850");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Emploi du temps — ${user?.name ?? ""}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; font-family: Arial, Helvetica, sans-serif; }
  @page { size: A4 landscape; margin: 5mm; }
  @media print {
    html { zoom: 0.82; }
    @supports not (zoom: 1) { body { transform: scale(0.82); transform-origin: top left; width: 122%; } }
  }
</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  /* sort + filter */
  const filtered = [...emplois]
    .filter(e => filterSem === "all" || e.semestre === filterSem)
    .sort((a, b) => sortOrder === "desc" ? b.id - a.id : a.id - b.id);

  /* stats from selected timetable */
  const seancesCount = countSeances(selected?.grille);
  const groupes      = distinctGroupes(selected?.grille);
  const heures       = seancesCount * 2.5;

  const initials = (user?.name ?? "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f5", fontFamily: "'Poppins', sans-serif" }}>

      {/* ══ NAVBAR ════════════════════════════════════════════════════ */}
      <nav className="fmd-nav" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#fff", borderBottom: "1px solid #e4e4e7",
        height: 58, display: "flex", alignItems: "center",
        padding: "0 28px", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)",
      }}>
        <div className="fmd-nav-brand" style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ height: 46, display: "flex", alignItems: "center", flexShrink: 0 }}>
            <img src="/logoOfppt.png" alt="OFPPT" style={{ height: "100%", width: "auto", objectFit: "contain", display: "block" }} onError={e => { e.target.style.display = "none"; }} />
          </div>
          <div className="fmd-nav-brand-text">
            <div style={{ fontWeight: 700, fontSize: 13, color: "#111", lineHeight: 1 }}>Espace Formateur</div>
            <div style={{ fontSize: 10, color: "#71717a", marginTop: 1 }}>ISTA Hay Salam · CF SALE I</div>
          </div>
        </div>
        <div className="fmd-nav-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="fmd-nav-username" style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{user?.name ?? "—"}</div>
            <div style={{ fontSize: 10, color: "#71717a" }}>Formateur</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#16a34a", flexShrink: 0 }}>
            {initials}
          </div>
          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #e4e4e7", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
            onMouseOver={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626"; }}
            onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e4e4e7"; e.currentTarget.style.color = "#374151"; }}
          >
            {Ico.logout} <span className="fmd-logout-text">Déconnexion</span>
          </button>
        </div>
      </nav>

      <div className="sp-container" style={{ paddingTop: 28, paddingBottom: 52 }}>

        {/* ══ WELCOME BANNER ════════════════════════════════════════ */}
        <div className="fmd-banner" style={{
          background: "linear-gradient(135deg, #111 0%, #1f2937 100%)",
          borderRadius: 16, padding: "28px 32px", marginBottom: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,.18)", flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Tableau de bord</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
              Bonjour, {user?.name?.split(" ")[0] ?? "Formateur"}
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af" }}>{todayFR()}</div>
          </div>
          <div className="fmd-banner-stat" style={{ background: "rgba(255,255,255,.07)", borderRadius: 12, padding: "16px 24px", border: "1px solid rgba(255,255,255,.12)", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Emplois enregistrés</div>
            <div style={{ fontSize: 38, fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>{emplois.length}</div>
          </div>
        </div>

        {/* ══ KPI CARDS ═════════════════════════════════════════════ */}
        <div className="fmd-kpis" style={{ display: "flex", gap: 14, marginBottom: 26, flexWrap: "wrap" }}>
          <KpiCard icon={Ico.layers}   label="Séances / semaine" value={seancesCount}    unit="séances" color="#7c3aed" />
          <KpiCard icon={Ico.clock}    label="Heures / semaine"  value={heures}          unit="h"       color="#0891b2" />
          <KpiCard icon={Ico.users}    label="Groupes"           value={groupes.length}  unit="grp"     color="#16a34a" />
          <KpiCard icon={Ico.calendar} label="Semestre actif"    value={selected?.semestre ?? "—"} unit="" color="#d97706" />
        </div>

        {/* ══ EMPLOIS SECTION ═══════════════════════════════════════ */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e4e4e7", boxShadow: "0 1px 6px rgba(0,0,0,.06)", overflow: "hidden", marginBottom: 24 }}>

          {/* toolbar */}
          <div className="fmd-toolbar" style={{ padding: "16px 22px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Mes emplois du temps</div>
              <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                {filtered.length} emploi{filtered.length > 1 ? "s" : ""}{filterSem !== "all" ? ` · ${filterSem}` : ""}
              </div>
            </div>
            <div className="fmd-toolbar-controls" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {/* semestre toggle */}
              <div style={{ display: "flex", background: "#f4f4f5", borderRadius: 9, padding: 3, gap: 2 }}>
                {["all", "S1", "S2"].map(s => (
                  <button key={s} onClick={() => setFilterSem(s)} style={{
                    padding: "5px 13px", borderRadius: 7, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, transition: "all .15s",
                    background: filterSem === s ? "#fff" : "transparent",
                    color: filterSem === s ? "#111" : "#6b7280",
                    boxShadow: filterSem === s ? "0 1px 3px rgba(0,0,0,.12)" : "none",
                  }}>
                    {s === "all" ? "Tous" : s}
                  </button>
                ))}
              </div>
              {/* sort button */}
              <button
                onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid #e4e4e7", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                {Ico.sort} {sortOrder === "desc" ? "Plus récent" : "Plus ancien"}
              </button>
            </div>
          </div>

          {/* body */}
          <div style={{ padding: "18px 22px" }}>
            {loading && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                <div style={{ width: 32, height: 32, border: "3px solid #e4e4e7", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
                Chargement…
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>
                <div style={{ marginBottom: 14, opacity: .4 }}>{Ico.empty}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#374151", marginBottom: 6 }}>Aucun emploi du temps</div>
                <div style={{ fontSize: 13 }}>
                  {filterSem !== "all"
                    ? `Aucun emploi enregistré pour le ${filterSem}.`
                    : "Votre emploi du temps n'a pas encore été généré par le pôle."}
                </div>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
                {filtered.map(e => {
                  const sc     = countSeances(e.grille);
                  const grps   = distinctGroupes(e.grille);
                  const active = selected?.id === e.id;
                  return (
                    <div key={e.id} onClick={() => setSelected(active ? null : e)} className="fmd-emploi-card" style={{
                      borderRadius: 12, padding: "16px 18px", cursor: "pointer",
                      border: `2px solid ${active ? "#22c55e" : "#e4e4e7"}`,
                      background: active ? "#f0fdf4" : "#fafafa",
                      boxShadow: active ? "0 2px 12px rgba(34,197,94,.2)" : "0 1px 3px rgba(0,0,0,.05)",
                      transform: active ? "translateY(-2px)" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                          background: e.semestre === "S1" ? "#eff6ff" : "#faf5ff",
                          color: e.semestre === "S1" ? "#1d4ed8" : "#7c3aed",
                          border: `1px solid ${e.semestre === "S1" ? "#bfdbfe" : "#e9d5ff"}`,
                        }}>{e.semestre}</span>
                        {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", marginTop: 4 }} />}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}>
                        {Ico.calendar} {e.created_at}
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: active ? "#16a34a" : "#111", lineHeight: 1 }}>{sc}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>séances</div>
                        </div>
                        <div style={{ width: 1, height: 32, background: "#e4e4e7" }} />
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: active ? "#16a34a" : "#111", lineHeight: 1 }}>{grps.length}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>groupes</div>
                        </div>
                        <div style={{ width: 1, height: 32, background: "#e4e4e7" }} />
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: active ? "#16a34a" : "#111", lineHeight: 1 }}>{(sc * 2.5).toFixed(0)}<span style={{ fontSize: 12 }}>h</span></div>
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>/ sem.</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ TIMETABLE VIEWER ══════════════════════════════════════ */}
        {selected && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e4e4e7", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,.08)" }}>

            {/* viewer header */}
            <div style={{ background: "#111", padding: "13px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                  {user?.name} · {selected.semestre}
                </div>
                <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 3 }}>
                  Sauvegardé le {selected.created_at} &nbsp;·&nbsp; {countSeances(selected.grille)} séances &nbsp;·&nbsp; {countSeances(selected.grille) * 2.5}h / semaine
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 13px", borderRadius: 8, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.08)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {Ico.print} Imprimer
                </button>
                <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 13px", borderRadius: 8, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.08)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {Ico.close} Fermer
                </button>
              </div>
            </div>

            {/* groups pill row */}
            {distinctGroupes(selected.grille).length > 0 && (
              <div style={{ padding: "10px 22px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Groupes :</span>
                {distinctGroupes(selected.grille).map(g => (
                  <span key={g} style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>{g}</span>
                ))}
              </div>
            )}

            {/* grid */}
            <div style={{ padding: "20px 22px" }}>
              <TimetableGrid grille={selected.grille} />
            </div>

            {/* hidden print div */}
            <div id="fmt-print-doc" style={{ display: "none" }}>
              <PrintDoc
                nom={user?.name ?? "—"}
                semestre={selected.semestre}
                periodeDebut={selected.created_at}
                grille={selected.grille}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
