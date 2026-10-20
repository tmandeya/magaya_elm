// src/lib/safe.ts — output encoding helpers. Anything typed by a user (including
// the public careers form) must pass through these before becoming a link, HTML,
// or a spreadsheet cell.

/** Only allow plain web links; blocks javascript:, data:, vbscript: etc. */
export function safeUrl(u: string | null | undefined): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch { return undefined; }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * One CSV cell, safe for Excel: values starting with = + - @ (or tab/CR) are
 * prefixed with ' so they are shown as text, never run as a formula
 * (CSV/formula injection). Always quoted so commas and line breaks stay in place.
 */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: unknown[][]): string {
  return "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");  // BOM so Excel reads UTF-8 names correctly
}

export function downloadCsv(fileName: string, rows: unknown[][]) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
  a.download = fileName; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
