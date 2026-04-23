import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Icons } from "../../components/admin/Icons";

/* ════════════════════════════════════════
   CONFIG RÔLES
════════════════════════════════════════ */
const ROLE_CFG = {
  directeur: { label: "Directeur", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", emoji: "🛡️" },
  formateur: { label: "Formateur", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", emoji: "👨‍🏫" },
  pole:      { label: "Pôle",      bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff", emoji: "🎯" },
};

const AV_COLORS = {
  directeur: { bg: "var(--g0)",  color: "var(--g6)"  },
  formateur: { bg: "var(--p0)",  color: "var(--p6)"  },
  pole:      { bg: "#faf5ff",    color: "#7c3aed"     },
};

/* ── Helpers ── */
function RoleBadge({ role }) {
  const c = ROLE_CFG[role] || { label: role, bg: "var(--n1)", color: "var(--n6)", border: "var(--border)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontSize: 11, fontWeight: 700, letterSpacing: .3,
    }}>
      {c.label}
    </span>
  );
}

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ════════════════════════════════════════
   COMPOSANT PRINCIPAL
════════════════════════════════════════ */
export default function Utilisateurs() {
  const [data, setData]       = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filterRole, setRole] = useState("");
  const [page, setPage]       = useState(1);
  const [alert, setAlert]     = useState(null);

  /* Modal */
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});
  const [form, setForm] = useState({
    name: "", email: "",
    password: "", password_confirmation: "",
    role: "formateur",
    formateur_id: "", secteur_id: "",
  });

  /* Options dropdowns */
  const [options, setOptions] = useState({ formateurs: [], secteurs: [] });

  /* ── Utilitaires ── */
  const flash = (msg, type = "ok") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  /* ── Données ── */
  const fetchData = useCallback(() => {
    setLoading(true);
    axios.get("/users", { params: { search, role: filterRole, page } })
      .then(r => { setData(r.data.data || []); setMeta(r.data); })
      .catch(() => flash("Erreur de chargement.", "err"))
      .finally(() => setLoading(false));
  }, [search, filterRole, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchOptions = () => {
    axios.get("/users/options").then(r => setOptions(r.data)).catch(() => {});
  };

  /* ── Modal ── */
  const openAdd = () => {
    fetchOptions();
    setEditing(null);
    setForm({ name: "", email: "", password: "", password_confirmation: "", role: "formateur", formateur_id: "", secteur_id: "" });
    setErrors({});
    setModal(true);
  };

  const openEdit = (u) => {
    fetchOptions();
    setEditing(u);
    setForm({
      name: u.name, email: u.email,
      password: "", password_confirmation: "",
      role: u.role,
      formateur_id: u.formateur_id || "",
      secteur_id:   u.secteur_id   || "",
    });
    setErrors({});
    setModal(true);
  };

  const submit = async () => {
    setSaving(true); setErrors({});
    try {
      if (editing) {
        await axios.put(`/users/${editing.id}`, form);
        flash("Utilisateur mis à jour.");
      } else {
        await axios.post("/users", form);
        flash("Utilisateur créé avec succès.");
      }
      setModal(false);
      fetchData();
    } catch (e) {
      if (e.response?.status === 422) setErrors(e.response.data.errors || {});
      else flash(e.response?.data?.message || "Erreur.", "err");
    } finally { setSaving(false); }
  };

  const remove = async (u) => {
    if (!window.confirm(`Supprimer le compte de ${u.name} ?`)) return;
    try {
      await axios.delete(`/users/${u.id}`);
      flash("Utilisateur supprimé.");
      fetchData();
    } catch (e) { flash(e.response?.data?.message || "Erreur.", "err"); }
  };

  /* ── Filtres ── */
  const hasFilters   = !!(search || filterRole);
  const activeCount  = [search, filterRole].filter(Boolean).length;
  const resetFilters = () => { setSearch(""); setRole(""); setPage(1); };

  /* ════════════════════════════════════════
     RENDU
  ════════════════════════════════════════ */
  return (
    <div>

      {/* ── Header ── */}
      <div className="pg-header">
        <div className="pg-header-left">
          <div className="pg-title">Utilisateurs</div>
          <div className="pg-subtitle">
            {meta?.total ?? "—"} compte(s) enregistré(s) — gestion des accès par rôle
          </div>
        </div>
        <div className="pg-actions">
          <button className="btn-primary" onClick={openAdd}>
            {Icons.plus} Ajouter un utilisateur
          </button>
        </div>
      </div>

      {/* ── Alert flash ── */}
      {alert && (
        <div className={`al-alert al-alert-${alert.type}`}>
          {alert.type === "ok" ? Icons.check : Icons.alert}
          {alert.msg}
        </div>
      )}

      {/* ── KPI cards rôles (cliquables pour filtrer) ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(ROLE_CFG).map(([role, cfg]) => (
          <div key={role}
            onClick={() => setRole(filterRole === role ? "" : role)}
            style={{
              flex: "1 1 150px", display: "flex", alignItems: "center", gap: 12,
              padding: "14px 18px", borderRadius: 12, cursor: "pointer",
              background: cfg.bg,
              border: `1.5px solid ${filterRole === role ? cfg.color : cfg.border}`,
              outline: filterRole === role ? `2px solid ${cfg.color}` : "2px solid transparent",
              transform: filterRole === role ? "translateY(-2px)" : "none",
              boxShadow: filterRole === role ? `0 4px 14px ${cfg.color}22` : "none",
              transition: "all .15s", userSelect: "none",
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: cfg.color + "20", color: cfg.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>
              {cfg.emoji}
            </div>
            <div>
              <div style={{
                fontSize: 26, fontWeight: 800, color: cfg.color, lineHeight: 1,
                fontFamily: "var(--font-hd)", fontVariantNumeric: "tabular-nums",
              }}>
                {meta ? data.filter(u => u.role === role).length : "—"}
              </div>
              <div style={{ fontSize: 12, color: "var(--sl5)", marginTop: 2, fontWeight: 500 }}>
                {cfg.label}s
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="table-card">

        {/* Filtres */}
        <div className="filter-panel-inline">
          <div className="filter-panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--sl5)", display: "flex" }}>{Icons.search}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sl7)" }}>Recherche & Filtres</span>
              {activeCount > 0 && (
                <span style={{
                  background: "var(--g4)", color: "#111",
                  fontSize: 10, fontWeight: 700,
                  padding: "2px 7px", borderRadius: 20,
                }}>
                  {activeCount}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {hasFilters && (
                <button className="btn-reset" onClick={resetFilters}>
                  {Icons.close} Réinitialiser
                </button>
              )}
              <span className="results-count">{meta?.total ?? 0} résultat(s)</span>
            </div>
          </div>

          <div className="filter-row">
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 170 }}>
              <span className="search-icon">{Icons.search}</span>
              <input
                className="search-input filter-input"
                placeholder="Nom ou email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="form-select filter-select"
              style={{ height: 36, width: 170 }}
              value={filterRole}
              onChange={e => { setRole(e.target.value); setPage(1); }}
            >
              <option value="">Tous les rôles</option>
              <option value="directeur">Directeur</option>
              <option value="formateur">Formateur</option>
              <option value="pole">Pôle</option>
            </select>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="loader">
            <div className="loader-spinner" />
            <span>Chargement...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{Icons.users}</div>
            <div className="empty-title">Aucun utilisateur trouvé</div>
            <div className="empty-desc">
              Créez des comptes pour vos formateurs et responsables de pôle
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Lié à</th>
                  <th>Statut</th>
                  <th style={{ width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u, i) => {
                  const av = AV_COLORS[u.role] || { bg: "var(--n1)", color: "var(--n5)" };
                  return (
                    <tr key={u.id}>
                      <td style={{ color: "var(--sl4)", fontVariantNumeric: "tabular-nums" }}>
                        {(page - 1) * 15 + i + 1}
                      </td>

                      {/* Nom */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                            background: av.bg, color: av.color,
                            border: `1.5px solid ${av.color}30`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700, fontFamily: "var(--font-hd)",
                          }}>
                            {getInitials(u.name)}
                          </div>
                          <strong style={{ color: "var(--sl8)", fontSize: 13.5 }}>{u.name}</strong>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <span style={{ fontSize: 12.5, color: "var(--sl5)", fontFamily: "var(--font-mono)" }}>
                          {u.email}
                        </span>
                      </td>

                      {/* Rôle */}
                      <td><RoleBadge role={u.role} /></td>

                      {/* Lié à */}
                      <td style={{ fontSize: 12.5, color: "var(--sl6)" }}>
                        {u.role === "formateur" && u.formateur ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "var(--sl4)", display: "flex" }}>{Icons.users}</span>
                            {u.formateur.nom}
                            <span style={{ color: "var(--sl4)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                              · {u.formateur.mle}
                            </span>
                          </span>
                        ) : u.role === "pole" && u.secteur ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "var(--sl4)", display: "flex" }}>{Icons.target}</span>
                            {u.secteur.nom}
                          </span>
                        ) : (
                          <span style={{ color: "var(--sl3)", fontStyle: "italic", fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Statut */}
                      <td>
                        <span className={`badge ${u.statut === "actif" ? "badge-ok" : "badge-off"}`}>
                          {u.statut === "actif" ? "Actif" : "Inactif"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <button className="btn-icon btn-icon-edit" title="Modifier" onClick={() => openEdit(u)}>
                          {Icons.edit}
                        </button>
                        <button className="btn-icon btn-icon-del" title="Supprimer" onClick={() => remove(u)}>
                          {Icons.trash}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta?.last_page > 1 && (
          <div className="pagination">
            <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              ‹
            </button>
            {Array.from({ length: meta.last_page }, (_, i) => i + 1)
              .filter(p => p === 1 || p === meta.last_page || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span style={{ padding: "0 4px", color: "var(--sl4)" }}>…</span>
                  )}
                  <button
                    className={`pg-btn ${page === p ? "active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button className="pg-btn" onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}>
              ›
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          MODAL — Créer / Modifier utilisateur
      ════════════════════════════════════════ */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ width: 540 }}>

            <div className="modal-header">
              <div className="modal-title">
                {editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </div>
              <button className="modal-close" onClick={() => setModal(false)}>{Icons.close}</button>
            </div>

            {/* ── Rôle selector ── */}
            <div className="form-group">
              <label className="form-label">Rôle *</label>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(ROLE_CFG).map(([role, cfg]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, role, formateur_id: "", secteur_id: "" }))}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                      border: `2px solid ${form.role === role ? cfg.color : "var(--border)"}`,
                      background: form.role === role ? cfg.bg : "var(--n0)",
                      color: form.role === role ? cfg.color : "var(--n5)",
                      fontWeight: 600, fontSize: 12, transition: "all .15s",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                      boxShadow: form.role === role ? `0 2px 10px ${cfg.color}22` : "none",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Nom + Email ── */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input className="form-input" placeholder="Ex: AMINE MAJID"
                  value={form.name} onChange={set("name")} />
                {errors.name && <div className="field-err">{errors.name[0]}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="email@ista.ma"
                  value={form.email} onChange={set("email")} />
                {errors.email && <div className="field-err">{errors.email[0]}</div>}
              </div>
            </div>

            {/* ── Password ── */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Mot de passe{" "}
                  {editing
                    ? <span style={{ color: "var(--sl4)", fontWeight: 400, textTransform: "none" }}>(vide = inchangé)</span>
                    : "*"}
                </label>
                <input className="form-input" type="password" placeholder="••••••••"
                  value={form.password} onChange={set("password")} />
                {errors.password && <div className="field-err">{errors.password[0]}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer</label>
                <input className="form-input" type="password" placeholder="••••••••"
                  value={form.password_confirmation} onChange={set("password_confirmation")} />
              </div>
            </div>

            {/* ── Formateur link ── */}
            {form.role === "formateur" && (
              <div className="form-group">
                <label className="form-label">Formateur lié *</label>
                {options.formateurs.length === 0 ? (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "#fffbeb", border: "1px solid #fde68a",
                    fontSize: 12, color: "#92400e",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    {Icons.warning}
                    Tous les formateurs actifs ont déjà un compte utilisateur.
                  </div>
                ) : (
                  <select className="form-select" value={form.formateur_id} onChange={set("formateur_id")}>
                    <option value="">— Sélectionner un formateur —</option>
                    {options.formateurs.map(f => (
                      <option key={f.id} value={f.id}>{f.nom} · {f.mle}</option>
                    ))}
                  </select>
                )}
                {errors.formateur_id && <div className="field-err">{errors.formateur_id[0]}</div>}
              </div>
            )}

            {/* ── Secteur link ── */}
            {form.role === "pole" && (
              <div className="form-group">
                <label className="form-label">Secteur / Pôle lié *</label>
                {options.secteurs.length === 0 ? (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "#fffbeb", border: "1px solid #fde68a",
                    fontSize: 12, color: "#92400e",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    {Icons.warning}
                    Tous les secteurs ont déjà un responsable de pôle.
                  </div>
                ) : (
                  <select className="form-select" value={form.secteur_id} onChange={set("secteur_id")}>
                    <option value="">— Sélectionner un secteur —</option>
                    {options.secteurs.map(s => (
                      <option key={s.id} value={s.id}>{s.nom}</option>
                    ))}
                  </select>
                )}
                {errors.secteur_id && <div className="field-err">{errors.secteur_id[0]}</div>}
              </div>
            )}

            {/* ── Directeur info ── */}
            {form.role === "directeur" && (
              <div style={{
                padding: "11px 14px", borderRadius: 9, marginBottom: 14,
                background: "var(--g0)", border: "1px solid var(--g1)",
                fontSize: 12.5, color: "var(--g6)",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {Icons.shield}
                Ce compte aura accès complet au tableau de bord directeur.
              </div>
            )}

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={submit} disabled={saving}>
                {saving ? "Enregistrement…" : editing ? "Mettre à jour" : "Créer l'utilisateur"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}