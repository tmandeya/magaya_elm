// src/lib/sheet.ts
// All spreadsheet reading/writing goes through here. Uses ExcelJS (maintained)
// instead of the abandoned npm "xlsx" package, which has unpatched prototype-
// pollution and ReDoS flaws triggered by malicious files.

import ExcelJS from "exceljs";

export type Cell = string | number | boolean | Date | null;

const MAX_ROWS = 20000;

function cellValue(v: ExcelJS.CellValue): Cell {
  if (v === null || v === undefined) return null;
  if (v instanceof Date || typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
  if (typeof v === "object") {
    const o = v as unknown as Record<string, unknown>;
    if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map((t) => t.text).join("");
    if ("result" in o) return cellValue(o.result as ExcelJS.CellValue);      // formula: use computed value
    if ("text" in o) return String(o.text);                                    // hyperlink
    if ("error" in o) return null;
  }
  return String(v);
}

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, CRLF). */
function parseCsv(text: string): Cell[][] {
  const rows: Cell[][] = []; let row: Cell[] = []; let f = ""; let q = false;
  const s = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; continue; }
    if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; if (rows.length > MAX_ROWS) break; }
    else f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows;
}

/**
 * Read a workbook or CSV into a grid (array of rows). Picks the sheet named
 * `prefer` (case-insensitive) if present, otherwise the first sheet not in `skip`.
 */
export async function readGrid(buf: ArrayBuffer, fileName: string, opts: { prefer?: string; skip?: string[] } = {}): Promise<Cell[][]> {
  if (/\.csv$/i.test(fileName)) return parseCsv(new TextDecoder("utf-8").decode(buf));
  if (!/\.xlsx$/i.test(fileName)) throw new Error("Please save the file as .xlsx (Excel Workbook) or .csv and try again.");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const skip = (opts.skip ?? []).map((x) => x.toLowerCase());
  const ws = wb.worksheets.find((w) => w.name.toLowerCase() === opts.prefer?.toLowerCase())
    ?? wb.worksheets.find((w) => !skip.includes(w.name.toLowerCase()) && w.state !== "hidden")
    ?? wb.worksheets[0];
  if (!ws) return [];
  const grid: Cell[][] = [];
  ws.eachRow({ includeEmpty: false }, (r) => {
    if (grid.length > MAX_ROWS) return;
    const vals = r.values as ExcelJS.CellValue[];        // 1-based
    const out: Cell[] = [];
    for (let i = 1; i < vals.length; i++) out.push(cellValue(vals[i]));
    grid.push(out);
  });
  return grid;
}

/** Grid -> array of objects keyed by the header row (first non-empty row). */
export function gridToObjects(grid: Cell[][]): Record<string, Cell>[] {
  const headerIdx = grid.findIndex((r) => r.some((c) => c !== null && String(c).trim() !== ""));
  if (headerIdx < 0) return [];
  const header = grid[headerIdx].map((h) => String(h ?? "").trim());
  return grid.slice(headerIdx + 1)
    .filter((r) => r.some((c) => c !== null && String(c).trim() !== ""))
    .map((r) => {
      const o: Record<string, Cell> = Object.create(null);  // no prototype: header names like "__proto__" are inert
      header.forEach((h, i) => { if (h) o[h] = r[i] ?? ""; });
      return o;
    });
}

/** Download a one-sheet workbook containing just a header row. */
export async function downloadHeaderTemplate(headers: string[], sheetName: string, fileName: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.addRow(headers).font = { bold: true };
  headers.forEach((h, i) => { ws.getColumn(i + 1).width = Math.max(12, h.length + 2); });
  const blob = new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fileName; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
