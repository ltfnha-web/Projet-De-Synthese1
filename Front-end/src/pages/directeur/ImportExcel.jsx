import { useState, useRef } from "react";
import axios from "axios";

export default function ImportExcel() {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const inputRef                = useRef();

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setResult(null);
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
      setResult({ success: false, message: d?.message || "Erreur lors de l'import.", erreurs: d?.erreurs || [] });
    } finally { setLoading(false); }
  };

  const s = {
    layout:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" },
    left:      { display: "flex", flexDirection: "column", gap: 20 },
    card:      { background: "white", borderRadius: 14, padding: "26px 28px", boxShadow: "0 4px 24px rgba(79,70,229,.08)" },
    cardTitle: { fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 },
    dropZone: (dragging, hasFile) => ({
      border: `2.5px dashed ${hasFile ? "#10b981" : dragging ? "#4f46e5" : "#d0cff5"}`,
      borderRadius: 14, padding: "40px 20px", textAlign: "center",
      cursor: "pointer",
      background: hasFile ? "#f0fdf8" : dragging ? "#f0efff" : "#fafafe",
      marginBottom: 16, transition: "all .3s",
    }),
    btnImport: (disabled) => ({
      width: "100%", background: disabled ? "#a5b4fc" : "#4f46e5",
      color: "white", border: "none", padding: 16,
      borderRadius: 10, fontSize: 16, fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer",
    }),
    resultEmpty: {
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "50px 20px",
      color: "#bbb", fontSize: 14, textAlign: "center", minHeight: 220,
    },
    banner: (ok) => ({
      display: "flex", alignItems: "flex-start", gap: 14,
      padding: "16px 18px", borderRadius: 10,
      background: ok ? "#d1fae5" : "#fee2e2",
      border: `1px solid ${ok ? "#a7f3d0" : "#fecaca"}`,
      marginBottom: 16,
    }),
  };

  // Entités importées avec icônes
  const ENTITIES = [
    { key: "secteurs",   label: "Secteurs",   icon: "🏢", color: "#7c3aed" },
    { key: "filieres",   label: "Filières",   icon: "🎓", color: "#2563eb" },
    { key: "formateurs", label: "Formateurs", icon: "👨‍🏫", color: "#059669" },
    { key: "groupes",    label: "Groupes",    icon: "👥", color: "#d97706" },
    { key: "modules",    label: "Modules",    icon: "📚", color: "#4f46e5" },
  ];

  return (
    <div>
      <div className="pg-header">
        <div>
          <div className="pg-title">📥 Import Base Plate</div>
          <div className="pg-subtitle">Importez le fichier Excel BASE_PLATE — remplit toutes les tables</div>
        </div>
      </div>

      <div style={s.layout}>

        {/* ── LEFT ── */}
        <div style={s.left}>

          {/* Info colonnes */}
          <div style={s.card}>
            <div style={s.cardTitle}>📋 Données importées depuis le fichier</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ENTITIES.map(e => (
                <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f8f8ff", borderRadius: 8 }}>
                  <span style={{ fontSize: 20 }}>{e.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{e.label}</span>
                  <span style={{ fontSize: 12, color: "#888", marginLeft: "auto" }}>extrait automatiquement</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div style={s.card}>
            <div style={s.cardTitle}>📂 Uploader le fichier Excel</div>
            <div
              style={s.dropZone(dragging, !!file)}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current.click()}
            >
              <input
                ref={inputRef} type="file" accept=".xlsx"
                style={{ display: "none" }}
                onChange={e => setFile(e.target.files[0])}
              />
              {file ? (
                <>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>Cliquer pour changer</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📂</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#333", marginBottom: 6 }}>Glissez votre fichier ici</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>ou cliquez pour parcourir (.xlsx)</div>
                </>
              )}
            </div>

            {file && (
              <button style={s.btnImport(loading)} onClick={handleSubmit} disabled={loading}>
                {loading ? "⏳ Importation en cours..." : "🚀 Importer le fichier BASE PLATE"}
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT — résultat ── */}
        <div style={{ position: "sticky", top: 100 }}>
          <div style={{ ...s.card, minHeight: 340 }}>
            <div style={s.cardTitle}>Résultat de l'import</div>

            {!result && !loading && (
              <div style={s.resultEmpty}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div>Le rapport s'affichera ici après l'import</div>
              </div>
            )}

            {loading && (
              <div style={s.resultEmpty}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
                <div>Traitement en cours... (peut prendre quelques secondes)</div>
              </div>
            )}

            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Banner succès / erreur */}
                <div style={s.banner(result.success)}>
                  <span style={{ fontSize: 24 }}>{result.success ? "✅" : "❌"}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>
                      {result.success ? "Import réussi !" : "Import échoué"}
                    </div>
                    <div style={{ fontSize: 13, color: "#555" }}>{result.message}</div>
                  </div>
                </div>

                {/* Stats par entité — result.imported est un object */}
                {result.success && result.imported && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {ENTITIES.map(e => (
                      <div key={e.key} style={{
                        background: "#f8f8ff", borderRadius: 10, padding: "14px 16px",
                        display: "flex", alignItems: "center", gap: 12,
                        border: `1px solid #e8e8ff`,
                      }}>
                        <span style={{ fontSize: 24 }}>{e.icon}</span>
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: e.color }}>
                            {result.imported[e.key] ?? 0}
                          </div>
                          <div style={{ fontSize: 11, color: "#888" }}>{e.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Erreurs */}
                {result.erreurs?.length > 0 && (
                  <div style={{ background: "#fff8f0", border: "1px solid #fcd9a4", borderRadius: 10, padding: "16px 18px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 10 }}>
                      ⚠️ {result.erreurs.length} ligne(s) ignorée(s) :
                    </div>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                      {result.erreurs.map((e, i) => (
                        <li key={i} style={{ fontSize: 12, color: "#78350f", padding: "6px 10px", background: "#fef3c7", borderRadius: 6 }}>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  style={{ background: "#f4f4f4", color: "#555", border: "none", padding: "11px 22px", borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: "pointer", alignSelf: "flex-start" }}
                  onClick={() => { setResult(null); setFile(null); }}
                >
                  🔄 Nouvel import
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}