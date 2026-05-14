import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { DocumentOFPPT, openPrintWindow } from "../components/PrintDocOFPPT";

/* ─── constants ─────────────────────────────────────────────────────── */
const JOURS   = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const SEANCES = [
  { label: "Séance 1", horaire: "08:30–11:00" },
  { label: "Séance 2", horaire: "11:00–13:30" },
  { label: "Séance 3", horaire: "13:30–16:00" },
  { label: "Séance 4", horaire: "16:00–18:30" },
];
const TABS = [
  { id: "overview", label: "Tableau de bord" },
  { id: "emploi",   label: "Emploi du temps" },
  { id: "modules",  label: "Modules"         },
  { id: "stage",    label: "Planning Stage"  },
];

/* ─── helpers ───────────────────────────────────────────────────────── */
function todayFR() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function countSeances(grille) {
  if (!grille) return 0;
  return JOURS.reduce((n, j) => n + (grille[j] ?? []).filter(Boolean).length, 0);
}

/* ─── icons ─────────────────────────────────────────────────────────── */
const Ico = {
  logout:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  calendar:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  book:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  clock:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  layers:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  briefcase: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  grid:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  search:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  print:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  empty:     <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

/* ─── KPI card ───────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, unit, color }) {
  return (
    <div style={{
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

/* ─── Spinner ────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e4e4e7", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
      Chargement…
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────── */
function Empty({ msg }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>
      <div style={{ marginBottom: 14, opacity: .4 }}>{Ico.empty}</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: "#374151", marginBottom: 6 }}>{msg}</div>
    </div>
  );
}

/* ─── Timetable grid ─────────────────────────────────────────────────── */
function TimetableGrid({ grille }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
        <thead>
          <tr>
            <th style={{ background: "#1e293b", color: "#fff", padding: "10px 14px", border: "1px solid #334155", width: 80, fontSize: 11, fontWeight: 700 }}>Jour</th>
            {SEANCES.map((s, i) => (
              <th key={i} style={{ background: "#1e293b", color: "#fff", padding: "8px 12px", textAlign: "center", border: "1px solid #334155" }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{s.label}</div>
                <div style={{ fontWeight: 400, fontSize: 10, opacity: .55 }}>{s.horaire}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {JOURS.map((jour, ji) => (
            <tr key={jour} style={{ background: ji % 2 === 0 ? "#fff" : "#f9fafb" }}>
              <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 12, border: "1px solid #e4e4e7", color: "#1e293b" }}>{jour}</td>
              {[0, 1, 2, 3].map(si => {
                const cell = (grille?.[jour] ?? [])[si];
                if (!cell?.module) return (
                  <td key={si} style={{ padding: 12, textAlign: "center", color: "#d1d5db", border: "1px solid #e4e4e7", fontSize: 20 }}>·</td>
                );
                const isOnline = cell.mode === "DISTANCIEL";
                return (
                  <td key={si} style={{ padding: "10px 12px", verticalAlign: "top", border: "1px solid #e4e4e7" }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#111", marginBottom: 3 }}>{cell.module}</div>
                    {cell.formateur && <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginBottom: 2 }}>{cell.formateur}</div>}
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

/* ─── Statut badge ───────────────────────────────────────────────────── */
function StatutBadge({ statut }) {
  const map = {
    planifie: { bg: "#eff6ff", color: "#1d4ed8", label: "Planifié"  },
    en_cours: { bg: "#fefce8", color: "#b45309", label: "En cours"  },
    termine:  { bg: "#f0fdf4", color: "#16a34a", label: "Terminé"   },
  };
  const s = map[statut] ?? { bg: "#f4f4f5", color: "#71717a", label: statut };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
  PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════════════ */
export default function EspaceStagiaire() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [groupes,  setGroupes]  = useState([]);
  const [groupeId, setGroupeId] = useState(() => {
    return localStorage.getItem("stg_groupe_id")
      || (user?.groupe_id ? String(user.groupe_id) : "");
  });

  const [emploi,   setEmploi]   = useState(null);
  const [modules,  setModules]  = useState([]);
  const [stages,   setStages]   = useState([]);

  const [activeTab,   setActiveTab]   = useState("overview");
  const [loadEmploi,  setLoadEmploi]  = useState(false);
  const [loadModules, setLoadModules] = useState(false);
  const [loadStages,  setLoadStages]  = useState(false);
  const [filterSem,   setFilterSem]   = useState("all");
  const [moduleSearch,setModuleSearch]= useState("");

  useEffect(() => {
    axios.get("/stagiaire/groupes").then(r => setGroupes(r.data.data ?? []));
  }, []);

  const loadAll = useCallback((gid) => {
    if (!gid) return;

    setLoadEmploi(true);
    axios.get(`/stagiaire/emploi?groupe_id=${gid}`)
      .then(r => setEmploi(r.data.data ?? null))
      .catch(() => setEmploi(null))
      .finally(() => setLoadEmploi(false));

    setLoadModules(true);
    axios.get(`/stagiaire/modules?groupe_id=${gid}`)
      .then(r => setModules(r.data.data ?? []))
      .catch(() => setModules([]))
      .finally(() => setLoadModules(false));

    setLoadStages(true);
    axios.get(`/stagiaire/stages?groupe_id=${gid}`)
      .then(r => setStages(r.data.data ?? []))
      .catch(() => setStages([]))
      .finally(() => setLoadStages(false));
  }, []);

  useEffect(() => {
    if (groupeId) {
      localStorage.setItem("stg_groupe_id", groupeId);
      loadAll(groupeId);
    } else {
      localStorage.removeItem("stg_groupe_id");
    }
  }, [groupeId, loadAll]);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const selectedGroupe  = groupes.find(g => String(g.id) === String(groupeId));
  const seancesCount    = countSeances(emploi?.grille);
  const stageProchain   = stages.find(s => s.statut === "en_cours") ?? stages.find(s => s.statut === "planifie");

  const filteredModules = modules.filter(m => {
    const okSem  = filterSem === "all" || m.semestre === filterSem;
    const okSrch = !moduleSearch ||
      m.intitule.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      m.code.toLowerCase().includes(moduleSearch.toLowerCase());
    return okSem && okSrch;
  });

  const initials = (user?.name ?? "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const handlePrint = () => {
    if (!emploi) return;
    openPrintWindow("stg-print-doc", `Emploi du temps — ${selectedGroupe?.nom ?? ""}`);
  };

  /* ── render ── */
  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f5", fontFamily: "'Poppins', sans-serif" }}>

      {/* ══ NAVBAR ════════════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#fff", borderBottom: "1px solid #e4e4e7",
        height: 58, display: "flex", alignItems: "center",
        padding: "0 28px", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#94a3b8", fontSize: 14 }}>{Ico.grid}</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#111", lineHeight: 1 }}>Espace Stagiaire</div>
            <div style={{ fontSize: 10, color: "#71717a", marginTop: 1 }}>ISTA Hay Salam · CF SALE I</div>
          </div>
        </div>

        {/* groupe selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, whiteSpace: "nowrap" }}>Groupe :</span>
          <select
            value={groupeId}
            onChange={e => setGroupeId(e.target.value)}
            style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 12, color: "#111", background: "#fff", fontFamily: "inherit", cursor: "pointer", maxWidth: 220 }}
          >
            <option value="">— Sélectionner —</option>
            {groupes.map(g => (
              <option key={g.id} value={g.id}>{g.nom}{g.filiere ? ` · ${g.filiere}` : ""}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{user?.name ?? "—"}</div>
            <div style={{ fontSize: 10, color: "#71717a" }}>Stagiaire</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#15803d", flexShrink: 0 }}>
            {initials}
          </div>
          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #e4e4e7", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            onMouseOver={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626"; }}
            onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e4e4e7"; e.currentTarget.style.color = "#374151"; }}
          >
            {Ico.logout} Déconnexion
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 52px" }}>

        {/* ══ BANNER ════════════════════════════════════════════════ */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: 16, padding: "28px 32px", marginBottom: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 4px 24px rgba(30,27,75,.25)", flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Tableau de bord</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
              Bonjour, {user?.name?.split(" ")[0] ?? "Stagiaire"}
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>{todayFR()}</div>
          </div>
          {selectedGroupe ? (
            <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "16px 24px", border: "1px solid rgba(255,255,255,.15)", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Groupe</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{selectedGroupe.nom}</div>
              {selectedGroupe.filiere && <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4 }}>{selectedGroupe.filiere}</div>}
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,.07)", borderRadius: 12, padding: "16px 24px", border: "1px solid rgba(255,255,255,.12)", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Sélectionnez votre groupe</div>
              <div style={{ fontSize: 11, color: "#22c55e", marginTop: 4 }}>dans la barre ci-dessus</div>
            </div>
          )}
        </div>

        {/* ══ TABS ══════════════════════════════════════════════════ */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#fff", borderRadius: 12, padding: 5, border: "1px solid #e4e4e7", width: "fit-content" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, transition: "all .15s", fontFamily: "inherit",
              background: activeTab === t.id ? "#1e293b" : "transparent",
              color: activeTab === t.id ? "#fff" : "#6b7280",
              boxShadow: activeTab === t.id ? "0 2px 8px rgba(30,27,75,.25)" : "none",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "flex", gap: 14, marginBottom: 26, flexWrap: "wrap" }}>
              <KpiCard icon={Ico.layers}    label="Séances / semaine" value={seancesCount}       unit="séances" color="#22c55e" />
              <KpiCard icon={Ico.clock}     label="Heures / semaine"  value={seancesCount * 2.5} unit="h"       color="#0891b2" />
              <KpiCard icon={Ico.book}      label="Modules"           value={modules.length}     unit="modules" color="#16a34a" />
              <KpiCard icon={Ico.briefcase} label="Stages planifiés"  value={stages.length}      unit="stages"  color="#d97706" />
            </div>

            {stageProchain && (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e4e4e7", padding: "20px 24px", marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 12 }}>Prochain stage</div>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <StatutBadge statut={stageProchain.statut} />
                  <div style={{ fontSize: 13, color: "#374151", display: "flex", gap: 8, alignItems: "center" }}>
                    {Ico.calendar} <strong>{stageProchain.date_debut}</strong> → <strong>{stageProchain.date_fin}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", display: "flex", gap: 6, alignItems: "center" }}>
                    {Ico.clock} {stageProchain.duree_semaines} semaine{stageProchain.duree_semaines !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            )}

            {emploi ? (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e4e4e7", overflow: "hidden" }}>
                <div style={{ background: "#1e293b", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
                    Aperçu Emploi du Temps · {emploi.semestre}
                  </div>
                  <button onClick={() => setActiveTab("emploi")} style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,.2)", background: "transparent", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    Voir complet →
                  </button>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <TimetableGrid grille={emploi.grille} />
                </div>
              </div>
            ) : (
              !groupeId && <Empty msg="Sélectionnez un groupe pour afficher votre tableau de bord" />
            )}
          </div>
        )}

        {/* ══ EMPLOI DU TEMPS ═══════════════════════════════════════ */}
        {activeTab === "emploi" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e4e4e7", overflow: "hidden" }}>
            <div style={{ background: "#1e293b", padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Emploi du Temps</div>
                {selectedGroupe && (
                  <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                    {selectedGroupe.nom} · {emploi?.semestre ?? "—"} · {seancesCount} séances / semaine
                  </div>
                )}
              </div>
              {emploi && (
                <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.08)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {Ico.print} Imprimer
                </button>
              )}
            </div>
            <div style={{ padding: "20px 22px" }}>
              {loadEmploi && <Spinner />}
              {!loadEmploi && !groupeId && <Empty msg="Sélectionnez un groupe pour voir l'emploi du temps" />}
              {!loadEmploi && groupeId && !emploi && <Empty msg="Aucun emploi du temps disponible pour ce groupe" />}
              {!loadEmploi && emploi && (
                <>
                  {emploi.formateur_parrain && (
                    <div style={{ marginBottom: 14, padding: "8px 14px", background: "#f0fdf4", borderRadius: 9, fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                      Formateur parrain : {emploi.formateur_parrain}
                    </div>
                  )}
                  <TimetableGrid grille={emploi.grille} />
                  <div id="stg-print-doc" style={{ display: "none" }}>
                    <DocumentOFPPT emploi={{
                      jours:            emploi.grille,
                      groupe:           selectedGroupe?.nom ?? "—",
                      filiere:          selectedGroupe?.filiere ?? "—",
                      annee:            "2025-2026",
                      periodeDebut:     emploi.periodeDebut ?? new Date().toLocaleDateString("fr-FR"),
                      formateur_parrain:emploi.formateur_parrain,
                      signataire_nom:   "",
                    }} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ MODULES ═══════════════════════════════════════════════ */}
        {activeTab === "modules" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e4e4e7", overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Modules de ma filière</div>
                <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                  {filteredModules.length} module{filteredModules.length !== 1 ? "s" : ""}
                  {filterSem !== "all" ? ` · ${filterSem}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>{Ico.search}</span>
                  <input
                    value={moduleSearch}
                    onChange={e => setModuleSearch(e.target.value)}
                    placeholder="Rechercher un module…"
                    style={{ paddingLeft: 30, paddingRight: 10, height: 34, border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 12, fontFamily: "inherit", outline: "none", width: 200 }}
                  />
                </div>
                <div style={{ display: "flex", background: "#f4f4f5", borderRadius: 9, padding: 3, gap: 2 }}>
                  {["all", "S1", "S2"].map(s => (
                    <button key={s} onClick={() => setFilterSem(s)} style={{
                      padding: "5px 13px", borderRadius: 7, border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 600, transition: "all .15s", fontFamily: "inherit",
                      background: filterSem === s ? "#fff" : "transparent",
                      color: filterSem === s ? "#111" : "#6b7280",
                      boxShadow: filterSem === s ? "0 1px 3px rgba(0,0,0,.12)" : "none",
                    }}>
                      {s === "all" ? "Tous" : s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: "18px 22px" }}>
              {loadModules && <Spinner />}
              {!loadModules && !groupeId && <Empty msg="Sélectionnez un groupe pour voir les modules" />}
              {!loadModules && groupeId && filteredModules.length === 0 && <Empty msg="Aucun module trouvé" />}
              {!loadModules && filteredModules.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        {["Code", "Module", "Semestre", "MH DRIF", "EG / ET", "Formateur"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: .4, borderBottom: "1px solid #e4e4e7" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredModules.map((m, i) => (
                        <tr key={m.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontFamily: "monospace", fontSize: 12, color: "#2563eb", fontWeight: 700 }}>{m.code}</td>
                          <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontWeight: 600, color: "#111" }}>{m.intitule}</td>
                          <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: m.semestre === "S1" ? "#eff6ff" : "#faf5ff", color: m.semestre === "S1" ? "#1d4ed8" : "#7c3aed" }}>
                              {m.semestre}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", color: "#374151" }}>{m.mh_drif ?? "—"}</td>
                          <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", color: "#374151" }}>{m.eg_et ?? "—"}</td>
                          <td style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", color: m.formateur ? "#16a34a" : "#d1d5db", fontWeight: m.formateur ? 600 : 400 }}>
                            {m.formateur || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ STAGE PLANNING ════════════════════════════════════════ */}
        {activeTab === "stage" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e4e4e7", overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Planning de Stage</div>
                <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                  {stages.length} stage{stages.length !== 1 ? "s" : ""} enregistré{stages.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div style={{ padding: "18px 22px" }}>
              {loadStages && <Spinner />}
              {!loadStages && !groupeId && <Empty msg="Sélectionnez un groupe pour voir le planning de stage" />}
              {!loadStages && groupeId && stages.length === 0 && <Empty msg="Aucun stage planifié pour ce groupe" />}
              {!loadStages && stages.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {stages.map(s => (
                    <div key={s.id} style={{
                      borderRadius: 12, border: "1px solid #e4e4e7", padding: "18px 22px",
                      background: s.statut === "en_cours" ? "#fffbeb" : s.statut === "termine" ? "#f0fdf4" : "#fff",
                      display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
                    }}>
                      <StatutBadge statut={s.statut} />
                      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#374151" }}>
                        <span style={{ color: "#6b7280" }}>{Ico.calendar}</span>
                        <strong>{s.date_debut}</strong>
                        <span style={{ color: "#d1d5db" }}>→</span>
                        <strong>{s.date_fin}</strong>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#6b7280" }}>
                        <span>{Ico.clock}</span>
                        {s.duree_semaines} semaine{s.duree_semaines !== 1 ? "s" : ""}
                      </div>
                      <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>{s.filiere}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
