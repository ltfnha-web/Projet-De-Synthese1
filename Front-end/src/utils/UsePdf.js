export function downloadTablePdf(tableId, title = "Export") {
  const table = document.getElementById(tableId);
  if (!table) return;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #0f172a; padding: 32px; }
    .header { margin-bottom: 24px; border-bottom: 2px solid #4f46e5; padding-bottom: 14px; }
    .header h1 { font-size: 18px; font-weight: 700; color: #1e293b; }
    .header p  { font-size: 11px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #1e293b; color: #fff; padding: 9px 12px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
    tbody td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11.5px; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: right; }
  </style></head><body>
  <div class="header">
    <h1>${title}</h1>
    <p>Exporté le ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} — PedagoSys / ISTA Hay Salam</p>
  </div>
  <table>${table.innerHTML}</table>
  <div class="footer">PedagoSys — ISTA Hay Salam © ${new Date().getFullYear()}</div>
  </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 400);
}