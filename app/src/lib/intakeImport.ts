// src/lib/intakeImport.ts
// Reads the Talent Programmes intake template (or any similar sheet), maps
// columns by header name, and validates every row before anything is saved.
import * as XLSX from "xlsx";

export interface IntakeRow {
  line: number; // spreadsheet row number, for messages
  trainee_type: "graduate_trainee" | "attachment_student" | null;
  first_name: string; surname: string; email: string; phone: string; gender: string;
  institution: string; programme: string; year_of_study: number | null; site_name: string; site_id: string | null; notes: string;
  errors: string[]; warnings: string[]; skip: "duplicate" | "example" | null;
}

const ALIASES: Record<string, string[]> = {
  trainee_type: ["programme", "program", "type", "category", "trainee type"],
  first_name: ["first name", "firstname", "name", "given name", "forename"],
  surname: ["surname", "last name", "lastname", "family name"],
  email: ["email", "email address", "e-mail"],
  phone: ["phone", "phone number", "mobile", "cell", "contact number"],
  gender: ["gender", "sex"],
  institution: ["institution", "university", "college", "school"],
  programme: ["field of study", "degree", "course", "qualification", "discipline"],
  year_of_study: ["year of study", "year", "level"],
  site_name: ["intended site", "site", "location"],
  notes: ["notes", "comments", "comment"],
};
const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[*:]/g, "").replace(/\s+/g, " ").trim();
const clean = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();
const title = (s: string) => s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase());

export function parseIntake(
  data: ArrayBuffer,
  opts: { defaultType: "graduate_trainee" | "attachment_student" | null; sites: { id: string; name: string }[]; existingEmails: Set<string> },
): { rows: IntakeRow[]; sheetError: string | null } {
  let wb: XLSX.WorkBook;
  try { wb = XLSX.read(data, { type: "array" }); } catch { return { rows: [], sheetError: "This file could not be read. Save it as .xlsx or .csv and try again." }; }
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === "candidates") ?? wb.SheetNames.find((n) => n.toLowerCase() !== "instructions" && n.toLowerCase() !== "lists") ?? wb.SheetNames[0];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, blankrows: false, defval: "" });
  if (!grid.length) return { rows: [], sheetError: "The sheet is empty." };

  // Header = first row that contains a recognisable first-name column
  const headerIdx = grid.findIndex((r) => r.some((c) => ALIASES.first_name.includes(norm(c))));
  if (headerIdx < 0) return { rows: [], sheetError: "No header row found. Use the template, or make sure the first row has First Name and Surname columns." };
  const header = grid[headerIdx].map(norm);
  const col: Record<string, number> = {};
  for (const [key, names] of Object.entries(ALIASES)) {
    const i = header.findIndex((h) => names.includes(h));
    if (i >= 0) col[key] = i;
  }
  if (col.surname === undefined) return { rows: [], sheetError: "No Surname column found." };

  const siteByName = new Map(opts.sites.map((s) => [s.name.toLowerCase(), s.id]));
  const seen = new Map<string, number>();
  const rows: IntakeRow[] = [];
  grid.slice(headerIdx + 1).forEach((r, i) => {
    const get = (k: string) => (col[k] === undefined ? "" : clean(r[col[k]]));
    if (!get("first_name") && !get("surname") && !get("email")) return; // blank line
    const line = headerIdx + i + 2;
    const errors: string[] = [], warnings: string[] = [];
    const typeRaw = norm(get("trainee_type"));
    let trainee_type: IntakeRow["trainee_type"] =
      /grad|gt/.test(typeRaw) ? "graduate_trainee" : /attach|student|intern/.test(typeRaw) ? "attachment_student" : null;
    if (!trainee_type && typeRaw) errors.push(`Programme "${get("trainee_type")}" not recognised`);
    if (!trainee_type && !typeRaw) { if (opts.defaultType) trainee_type = opts.defaultType; else errors.push("Programme missing"); }
    const first_name = title(get("first_name")), surname = title(get("surname"));
    if (!first_name) errors.push("First name missing");
    if (!surname) errors.push("Surname missing");
    const email = get("email").toLowerCase();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push("Email looks invalid");
    let skip: IntakeRow["skip"] = null;
    if (email.endsWith("@example.com")) skip = "example";
    else if (email && opts.existingEmails.has(email)) { skip = "duplicate"; warnings.push("Already in ELMS — will be skipped"); }
    else if (email && seen.has(email)) errors.push(`Same email as row ${seen.get(email)}`);
    if (email && !seen.has(email)) seen.set(email, line);
    const g = norm(get("gender"));
    const gender = g.startsWith("f") ? "Female" : g.startsWith("m") ? "Male" : "";
    if (g && !gender) warnings.push(`Gender "${get("gender")}" ignored`);
    const yRaw = get("year_of_study"); const y = yRaw ? Number(yRaw.replace(/\D/g, "")) : null;
    if (yRaw && (!y || y < 1 || y > 6)) warnings.push(`Year of study "${yRaw}" ignored`);
    const site_name = get("site_name"); const site_id = site_name ? siteByName.get(site_name.toLowerCase()) ?? null : null;
    if (site_name && !site_id) warnings.push(`Site "${site_name}" not found — imported without a site`);
    rows.push({ line, trainee_type, first_name, surname, email, phone: get("phone"), gender, institution: get("institution"), programme: get("programme"),
      year_of_study: y && y >= 1 && y <= 6 ? y : null, site_name, site_id, notes: get("notes"), errors, warnings, skip });
  });
  if (!rows.length) return { rows, sheetError: "No people found under the header row." };
  if (rows.length > 500) return { rows: [], sheetError: `This file has ${rows.length} rows. Please split it into files of 500 or fewer.` };
  return { rows, sheetError: null };
}
