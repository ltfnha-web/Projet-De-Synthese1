/**
 * Shared OFPPT print documents — same model used across all spaces.
 * Exports: DocumentOFPPT, DocumentFormateurOFPPT, openPrintWindow
 */

export const NAVY = "#1a3a5f";
const FF          = "Arial, Helvetica, sans-serif";
const TBL_BASE    = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" };
const JOURS       = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const SLOT_TIMES  = [["08:30","11:00"],["11:00","13:30"],["13:30","16:00"],["16:00","18:30"]];

function toStr(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    if (value.intitule) return toStr(value.intitule);
    if (value.code)     return toStr(value.code);
    if (value.nom)      return toStr(value.nom);
    if (value.label)    return toStr(value.label);
    return JSON.stringify(value);
  }
  return String(value);
}

function calcNbHeures(jours) {
  if (!jours) return 0;
  let count = 0;
  Object.values(jours).forEach(seances => {
    if (Array.isArray(seances)) seances.forEach(s => { if (s && s.module) count++; });
  });
  return count * 2.5;
}

function isEGTS(module) { return /egts/i.test(toStr(module)); }
function cellAcc(s) {
  return isEGTS(s?.module)
    ? { bg: "#fff3e0", accent: "#e65100" }
    : { bg: "#e8f0fe", accent: "#1565c0" };
}
function td(extra = {}) {
  return {
    border: "1px solid #bbb", padding: "3px 6px", fontSize: 8.5,
    fontFamily: FF, color: "#000", verticalAlign: "middle", ...extra,
  };
}

/* ── Shared visual blocks ──────────────────────────────────────────── */

function DocHeader({ title }) {
  return (
    <div style={{ background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 10px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 0.5, fontFamily: FF }}>{title}</div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,.6)", marginTop: 2, fontFamily: FF }}>
          Année de Formation 2025–2026 &nbsp;|&nbsp; CF SALÉ I
        </div>
      </div>
    </div>
  );
}

function DocGrid({ jours, renderCell }) {
  return (
    <table style={{ ...TBL_BASE, marginTop: 1 }}>
      <colgroup>
        <col style={{ width: "9%" }} />
        {SLOT_TIMES.map((_, i) => <col key={i} style={{ width: "22.75%" }} />)}
      </colgroup>
      <thead>
        <tr>
          <th style={td({ background: NAVY, color: "#fff", textAlign: "center", fontSize: 8, fontWeight: 700, padding: "4px 2px" })}>
            Jour /<br />Séance
          </th>
          {SLOT_TIMES.map(([a, b], i) => (
            <th key={i} style={td({ background: NAVY, color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 10, padding: "4px 6px" })}>
              {a} – {b}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {JOURS.map(jour => (
          <tr key={jour}>
            <td style={td({ background: NAVY, color: "#fff", fontWeight: 700, textAlign: "center", fontSize: 9, padding: "3px 2px" })}>
              {jour}
            </td>
            {(Array.isArray(jours?.[jour]) ? jours[jour] : [null,null,null,null]).map((s, i) => {
              if (!s?.module) return (
                <td key={i} style={td({ textAlign: "center", color: "#aaa", fontSize: 15, background: "#fff", padding: "2px" })}>—</td>
              );
              const cc = cellAcc(s);
              return (
                <td key={i} style={td({ background: cc.bg, textAlign: "center", verticalAlign: "middle", padding: "4px 5px", border: "1px solid #ddd" })}>
                  {renderCell(s, cc)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DocLegend() {
  return (
    <div style={{ display: "flex", gap: 20, padding: "3px 8px", borderTop: "1px solid #ddd", fontSize: 7.5, fontFamily: FF, color: "#333" }}>
      <span><span style={{ color: "#1565c0", fontWeight: 700 }}>■</span> Modules techniques</span>
      <span><span style={{ color: "#e65100", fontWeight: 700 }}>■</span> EGTS — Modules transversaux</span>
      <span>■ FAD — Formation à distance</span>
      <span>■ Prés. — Formation en présentiel</span>
    </div>
  );
}

function DocBottomBar({ label }) {
  return (
    <div style={{ background: NAVY, display: "flex", justifyContent: "space-between", padding: "3px 8px", marginTop: 1 }}>
      <span style={{ fontSize: 7, color: "rgba(255,255,255,.75)", fontFamily: FF }}>
        OFPPT — Office de la Formation Professionnelle et de la Promotion du Travail
      </span>
      <span style={{ fontSize: 7, color: "rgba(255,255,255,.75)", fontFamily: FF }}>
        Version 1 — {label} • Année de Formation 2025-2026
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   DOCUMENT OFPPT — Emploi du Temps GROUPE
   Props: emploi = { jours, groupe, filiere, annee, niveau,
                     formateur_parrain, periodeDebut, signataire_nom, nb_heures }
══════════════════════════════════════════════════════════════════════ */
export function DocumentOFPPT({ emploi }) {
  if (!emploi) return null;
  const heuresHebdo = emploi.nb_heures ?? calcNbHeures(emploi.jours);
  const periode     = toStr(emploi.periodeDebut ?? emploi.periode_debut ?? "—");

  return (
    <div style={{ fontFamily: FF, fontSize: 9, color: "#000", background: "#fff", width: "100%" }}>
      <DocHeader title="EMPLOI DU TEMPS" />

      <table style={{ ...TBL_BASE, border: "1px solid #aaa" }}>
        <colgroup>
          <col style={{ width: "8%" }} /><col style={{ width: "17%" }} />
          <col style={{ width: "9%" }} /><col style={{ width: "31%" }} />
          <col style={{ width: "12%" }} /><col style={{ width: "23%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>EFP :</td>
            <td style={td({ fontWeight: 700 })}>ISTA HAY SALAM SALÉ</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>Filière :</td>
            <td style={td()}>{toStr(emploi.filiere ?? "—")}</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>Version :</td>
            <td style={td({ fontWeight: 700 })}>1</td>
          </tr>
          <tr>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>CF :</td>
            <td style={td({ fontWeight: 700 })}>CF SALÉ I</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>Année :</td>
            <td style={td()}>
              {toStr(emploi.annee ?? "—")} &nbsp;—&nbsp; Groupe : <strong>{toStr(emploi.groupe)}</strong>
            </td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>Période :</td>
            <td style={td()}>À partir du {periode}</td>
          </tr>
          <tr>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>Niveau :</td>
            <td style={td()}>{toStr(emploi.niveau ?? "Technicien Spécialisé")}</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700, fontSize: 8 })}>Formateur Parrain :</td>
            <td style={td()}>{toStr(emploi.formateur_parrain) || "______________________"}</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700, fontSize: 8 })}>Nb. heures / sem. :</td>
            <td style={td({ fontWeight: 700 })}>{heuresHebdo} heures</td>
          </tr>
        </tbody>
      </table>

      <DocGrid
        jours={emploi.jours}
        renderCell={(s, cc) => (
          <>
            <div style={{ fontWeight: 800, fontSize: 9, color: cc.accent, lineHeight: 1.35 }}>{toStr(s.module)}</div>
            {s.intitule && <div style={{ fontWeight: 700, fontSize: 8.5, color: cc.accent, lineHeight: 1.3 }}>{toStr(s.intitule)}</div>}
            <div style={{ fontSize: 8, color: "#555", lineHeight: 1.5 }}>{toStr(s.formateur)}</div>
            <div style={{ fontSize: 8, color: "#333", lineHeight: 1.3 }}>■ {s.salle || "—"} • {s.mode === "DISTANCIEL" ? "FAD" : "Présentiel"}</div>
          </>
        )}
      />

      <DocLegend />

      <table style={{ ...TBL_BASE, marginTop: 1, border: "1px solid #bbb" }}>
        <colgroup><col style={{ width: "55%" }} /><col style={{ width: "45%" }} /></colgroup>
        <tbody>
          <tr>
            <td style={td({ padding: "6px 10px", verticalAlign: "top" })}>
              <div style={{ fontSize: 8.5 }}>Nom &amp; Prénom : <span style={{ borderBottom: "1px solid #000", minWidth: 160, display: "inline-block", paddingBottom: 1 }}>{toStr(emploi.signataire_nom)}</span></div>
              <div style={{ fontSize: 8.5, marginTop: 10 }}>Signature :</div>
            </td>
            <td style={td({ padding: "6px 10px", fontWeight: 700, verticalAlign: "top" })}>
              <div>KADDOURI HICHAM</div>
              <div style={{ fontWeight: 400, fontSize: 8, marginTop: 2 }}>Directeur d'Établissement ISTA HAY SALAM SALÉ</div>
              <div style={{ fontWeight: 400, fontSize: 8, marginTop: 3 }}>Fait à Salé — Le : {periode}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <DocBottomBar label="EMPLOI DU TEMPS GROUPE" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   DOCUMENT OFPPT — Emploi du Temps FORMATEUR
   Props: nom, annee, semestre, periodeDebut, grille, signataire
══════════════════════════════════════════════════════════════════════ */
export function DocumentFormateurOFPPT({ nom, annee, semestre, periodeDebut, grille, signataire }) {
  const THRESH = 26;

  const recapMap = {};
  JOURS.forEach(jour => {
    (grille?.[jour] ?? []).forEach(s => {
      if (!s?.module) return;
      const key = toStr(s.module);
      if (!recapMap[key]) recapMap[key] = { module: key, count: 0 };
      recapMap[key].count++;
    });
  });
  const recapRows  = Object.values(recapMap).map(r => ({ ...r, hours: r.count * 2.5 }));
  const totalH     = recapRows.reduce((s, r) => s + r.hours, 0);
  const totalHSup  = Math.max(0, totalH - THRESH);

  let cumul = 0;
  const recap = recapRows.map(r => {
    const statut = cumul >= THRESH ? "H. Sup." : "Statutaire";
    cumul += r.hours;
    return { ...r, statut };
  });

  const fmtH = h => (h % 1 === 0 ? h : h.toFixed(1)) + " h";

  return (
    <div style={{ fontFamily: FF, fontSize: 9, color: "#000", background: "#fff", width: "100%" }}>
      <DocHeader title="EMPLOI DU TEMPS" />

      <table style={{ ...TBL_BASE, border: "1px solid #aaa" }}>
        <colgroup>
          <col style={{ width: "8%" }} /><col style={{ width: "17%" }} />
          <col style={{ width: "9%" }} /><col style={{ width: "31%" }} />
          <col style={{ width: "12%" }} /><col style={{ width: "23%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>EFP :</td>
            <td style={td({ fontWeight: 700 })}>ISTA HAY SALAM SALÉ</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>Formateur :</td>
            <td style={td({ fontWeight: 700 })}>Mr {toStr(nom ?? "—")}</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>Matricule :</td>
            <td style={td({ fontWeight: 700 })}>—</td>
          </tr>
          <tr>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>CF :</td>
            <td style={td({ fontWeight: 700 })}>CF SALÉ I</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>Statut :</td>
            <td style={td({ fontSize: 8 })}>■ Statutaire &nbsp;■ Vacataire &nbsp;■ Coopérant &nbsp;■ Contrat de Service</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700, fontSize: 8 })}>Masse horaire :</td>
            <td style={td({ fontWeight: 700 })}>{totalH > 0 ? fmtH(totalH) + " / sem." : "— h / sem."}</td>
          </tr>
          <tr>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>Version :</td>
            <td style={td({ fontWeight: 700 })}>1</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700 })}>Période :</td>
            <td style={td()}>À partir du {periodeDebut ?? "—"}</td>
            <td style={td({ background: "#f0f0f0", fontWeight: 700, fontSize: 8 })}>dont H.Sup. :</td>
            <td style={td({ fontWeight: 700, color: totalHSup > 0 ? "#e65100" : "#000" })}>
              {totalHSup > 0 ? fmtH(totalHSup) : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <DocGrid
        jours={grille}
        renderCell={(s, cc) => (
          <>
            <div style={{ fontWeight: 800, fontSize: 9, color: cc.accent, lineHeight: 1.35 }}>{toStr(s.module)}</div>
            {s.intitule && <div style={{ fontWeight: 700, fontSize: 8.5, color: cc.accent, lineHeight: 1.3 }}>{toStr(s.intitule)}</div>}
            <div style={{ fontSize: 8, color: "#333", lineHeight: 1.5 }}>■ {toStr(s.groupe)}</div>
            <div style={{ fontSize: 8, color: "#333", lineHeight: 1.3 }}>■ {s.salle || "—"} • {s.mode === "DISTANCIEL" ? "FAD" : "Présentiel"}</div>
          </>
        )}
      />

      <table style={{ ...TBL_BASE, marginTop: 1, border: "1px solid #bbb" }}>
        <colgroup>
          <col style={{ width: "38%" }} /><col style={{ width: "31%" }} /><col style={{ width: "31%" }} />
        </colgroup>
        <thead>
          <tr>
            <th style={td({ background: "#e8eef8", fontWeight: 700, textAlign: "center", padding: "3px 6px" })}>RÉCAPITULATIF VOLUME HORAIRE</th>
            <th style={td({ background: "#e8eef8", fontWeight: 700, textAlign: "center", padding: "3px 6px" })}>Le Formateur</th>
            <th style={td({ background: "#e8eef8", fontWeight: 700, textAlign: "center", padding: "3px 6px" })}>Le Directeur d'Établissement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...td({ padding: 0, verticalAlign: "top" }) }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8.5, fontFamily: FF }}>
                <thead>
                  <tr>
                    <th style={{ padding: "2px 5px", background: "#f5f7fb", fontWeight: 700, borderBottom: "1px solid #bbb", borderRight: "1px solid #ddd", textAlign: "left" }}>Module</th>
                    <th style={{ padding: "2px 5px", background: "#f5f7fb", fontWeight: 700, borderBottom: "1px solid #bbb", borderRight: "1px solid #ddd", textAlign: "center", width: "18%" }}>H/sem.</th>
                    <th style={{ padding: "2px 5px", background: "#f5f7fb", fontWeight: 700, borderBottom: "1px solid #bbb", textAlign: "center", width: "22%" }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recap.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "2px 5px", borderRight: "1px solid #ddd" }}>{r.module}</td>
                      <td style={{ padding: "2px 5px", textAlign: "center", fontWeight: 700, borderRight: "1px solid #ddd" }}>{fmtH(r.hours)}</td>
                      <td style={{ padding: "2px 5px", textAlign: "center", fontWeight: r.statut === "H. Sup." ? 700 : 400, color: r.statut === "H. Sup." ? "#e65100" : "#15803d" }}>{r.statut}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "1px solid #999", background: "#f5f5f5" }}>
                    <td style={{ padding: "3px 5px", fontWeight: 800, borderRight: "1px solid #ddd" }}>TOTAL</td>
                    <td style={{ padding: "3px 5px", textAlign: "center", fontWeight: 800, borderRight: "1px solid #ddd" }}>{fmtH(totalH)}</td>
                    <td style={{ padding: "3px 5px", textAlign: "center", fontWeight: 700, color: totalHSup > 0 ? "#e65100" : "#15803d" }}>
                      {totalHSup > 0 ? `dont ${fmtH(totalHSup)} H.Sup.` : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={td({ verticalAlign: "top", padding: "8px 10px" })}>
              <div style={{ fontSize: 7.5, color: "#666", fontStyle: "italic", marginBottom: 6 }}>(Pour avoir reçu l'emploi du temps)</div>
              <div style={{ fontSize: 8.5, marginBottom: 4 }}>
                Nom &amp; Prénom :&nbsp;
                <span style={{ borderBottom: "1px solid #000", minWidth: 130, display: "inline-block", paddingBottom: 1 }}>{signataire ?? ""}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, fontSize: 8.5, marginBottom: 10, marginTop: 10 }}>
                <span>Date :</span><div style={{ flex: 1, borderBottom: "1px solid #000" }} />
              </div>
              <div style={{ fontSize: 8.5 }}>Signature :</div>
            </td>
            <td style={td({ verticalAlign: "top", padding: "8px 10px" })}>
              <div style={{ fontWeight: 700, fontSize: 9 }}>KADDOURI HICHAM</div>
              <div style={{ fontSize: 8, marginTop: 2 }}>Directeur d'Établissement</div>
              <div style={{ fontSize: 8 }}>ISTA HAY SALAM SALÉ</div>
              <div style={{ fontSize: 8, marginTop: 6 }}>Fait à Salé — Le : {periodeDebut ?? "—"}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <DocBottomBar label="EMPLOI DU TEMPS FORMATEUR" />
    </div>
  );
}

/* ── Shared print window opener ────────────────────────────────────── */
export function openPrintWindow(elementId, title) {
  const docEl = document.getElementById(elementId);
  if (!docEl) return;
  const win = window.open("", "_blank", "width=1200,height=850");
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box; margin: 0; padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body { background: #fff; font-family: Arial, Helvetica, sans-serif; }
    @page { size: A4 landscape; margin: 5mm; }
    @media print {
      html { zoom: 0.82; }
      @supports not (zoom: 1) {
        body { transform: scale(0.82); transform-origin: top left; width: 122%; }
      }
    }
  </style>
</head>
<body>${docEl.innerHTML}</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}
