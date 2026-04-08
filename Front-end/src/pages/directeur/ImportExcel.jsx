import { useState, useRef } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";

const ENTITIES = [
  { key: "secteurs",   label: "Secteurs",    desc: "Domaines d'activité",          color: "#7c3aed" },
  { key: "filieres",   label: "Filières",    desc: "Programmes de formation",       color: "#1a5276" },
  { key: "formateurs", label: "Formateurs",  desc: "Enseignants avec matricule",    color: "#059669" },
  { key: "groupes",    label: "Groupes",     desc: "Groupes avec créneau et mode",  color: "#d97706" },
  { key: "modules",    label: "Modules",     desc: "MH, EFM, régional, semestre",  color: "#dc2626" },
];

const COLUMNS_INFO = [
  { col: "Secteur",              desc: "Nom du secteur" },
  { col: "Code Filière",         desc: "Identifiant filière" },
  { col: "Créneau",              desc: "CDJ ou CDS" },
  { col: "Type de formation",    desc: "Diplômante / Qualifiante" },
  { col: "Formateur Présentiel", desc: "Nom + Matricule" },
  { col: "MH DRIF",             desc: "Masse horaire planifiée" },
  { col: "MH Réalisée Globale", desc: "Heures effectuées" },
  { col: "Séance EFM",          desc: "Oui / Non" },
  { col: "Régional",            desc: "O = régional, N = local" },
];

export default function ImportExcel() {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const inputRef                = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".xlsx")) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await axios.post("/import/base-plate", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult({ success: true, ...data });
      setFile(null);
    } catch (e) {
      const d = e.response?.data;
      setResult({
        success: false,
        message: d?.message || "Erreur lors de l'import.",
        erreurs: d?.erreurs || [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Import BASE PLATE</div>
          <div className="pg-subtitle">
            Chargez le fichier Excel source — remplit automatiquement toutes les tables de la base de données
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

        {/* ── COLONNE GAUCHE ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Données importées */}
          <div className="table-card">
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--sl0)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sl7)" }}>Données extraites du fichier</div>
            </div>
            <div style={{ padding: "4px 0" }}>
              {ENTITIES.map((e, i) => (
                <div key={e.key} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 18px",
                  borderBottom: i < ENTITIES.length - 1 ? "1px solid var(--sl1)" : "none",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: e.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--sl8)" }}>{e.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--sl5)", marginTop: 1 }}>{e.desc}</div>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: 10.5 }}>Auto</span>
                </div>
              ))}
            </div>
          </div>

          {/* Colonnes utilisées */}
          <div className="table-card">
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--sl0)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sl7)" }}>Colonnes principales utilisées</div>
            </div>
            <div style={{ padding: "4px 0" }}>
              {COLUMNS_INFO.map((c, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 18px",
                  borderBottom: i < COLUMNS_INFO.length - 1 ? "1px solid var(--sl1)" : "none",
                }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--sl7)", fontFamily: "var(--font-mono)" }}>
                    {c.col}
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--sl5)" }}>{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COLONNE DROITE ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>

          {/* Zone upload */}
          <div className="table-card">
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--sl0)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sl7)" }}>Uploader le fichier Excel</div>
            </div>
            <div style={{ padding: "20px 18px" }}>

              {/* Drop zone */}
              <div
                style={{
                  border: `2px dashed ${file ? "#059669" : dragging ? "var(--p6)" : "var(--sl3)"}`,
                  borderRadius: 10,
                  padding: "36px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: file ? "#f0fdf4" : dragging ? "var(--p0)" : "var(--sl0)",
                  marginBottom: 14,
                  transition: "all .2s",
                }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx"
                  style={{ display: "none" }}
                  onChange={e => setFile(e.target.files[0])}
                />

                {file ? (
                  <>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#15803d" }}>
                      {Icons.check}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#15803d", marginBottom: 4 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: "var(--sl5)" }}>Cliquer pour changer le fichier</div>
                  </>
                ) : (
                  <>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--sl2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "var(--sl5)" }}>
                      {Icons.upload}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sl7)", marginBottom: 6 }}>
                      Glissez votre fichier ici
                    </div>
                    <div style={{ fontSize: 12, color: "var(--sl5)" }}>ou cliquez pour parcourir — .xlsx uniquement</div>
                  </>
                )}
              </div>

              {/* Warning */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 14 }}>
                <div style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}>{Icons.warning}</div>
                <div style={{ fontSize: 12, color: "#92400e" }}>
                  L'import <strong>efface et remplace</strong> toutes les données existantes (secteurs, filières, formateurs, groupes, modules).
                </div>
              </div>

              {/* Bouton import */}
              <button
                className="btn-primary"
                style={{ width: "100%", height: 42, fontSize: 14, justifyContent: "center", opacity: (!file || loading) ? .6 : 1, cursor: (!file || loading) ? "not-allowed" : "pointer" }}
                onClick={handleSubmit}
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <div className="loader-spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: "white" }} />
                    Importation en cours...
                  </>
                ) : (
                  <>
                    {Icons.upload}
                    Lancer l'import
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Résultat */}
          <div className="table-card">
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--sl0)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sl7)" }}>Résultat de l'import</div>
            </div>
            <div style={{ padding: "20px 18px" }}>

              {/* Empty state */}
              {!result && !loading && (
                <div className="empty" style={{ padding: "40px 0" }}>
                  <div className="empty-icon">{Icons.chartBar}</div>
                  <div className="empty-title">En attente</div>
                  <div className="empty-desc">Le rapport s'affichera ici après l'import</div>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="empty" style={{ padding: "40px 0" }}>
                  <div className="loader-spinner" style={{ marginBottom: 12 }} />
                  <div className="empty-title">Traitement en cours</div>
                  <div className="empty-desc">Lecture et insertion des données...</div>
                </div>
              )}

              {/* Résultat */}
              {result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Banner */}
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "14px 16px", borderRadius: 10,
                    background: result.success ? "#f0fdf4" : "#fff1f2",
                    border: `1px solid ${result.success ? "#bbf7d0" : "#fecdd3"}`,
                  }}>
                    <div style={{ color: result.success ? "#15803d" : "#dc2626", flexShrink: 0 }}>
                      {result.success ? Icons.check : Icons.alert}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: result.success ? "#15803d" : "#dc2626", marginBottom: 3 }}>
                        {result.success ? "Import réussi" : "Import échoué"}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--sl6)" }}>{result.message}</div>
                    </div>
                  </div>

                  {/* Stats par entité */}
                  {result.success && result.imported && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {ENTITIES.map(e => (
                        <div key={e.key} style={{
                          background: "var(--sl0)", borderRadius: 8, padding: "12px 14px",
                          border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10,
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: e.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                              {result.imported[e.key] ?? 0}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--sl5)", marginTop: 2 }}>{e.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Erreurs */}
                  {result.erreurs?.length > 0 && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        {Icons.warning}
                        {result.erreurs.length} ligne(s) ignorée(s)
                      </div>
                      <ul style={{ listStyle: "none", maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                        {result.erreurs.map((e, i) => (
                          <li key={i} style={{ fontSize: 11.5, color: "#78350f", padding: "5px 8px", background: "#fef3c7", borderRadius: 5 }}>
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reset */}
                  <button className="btn-secondary" style={{ alignSelf: "flex-start", fontSize: 12 }}
                    onClick={() => { setResult(null); setFile(null); }}>
                    {Icons.filter} Nouvel import
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}