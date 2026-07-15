// src/components/DataMigration.tsx
// Employee data migration: upload the HR master-data export (.xlsx/.csv),
// auto-map its columns, validate, preview (financial values masked), and
// import in batches via the server-side fn_import_employees RPC.

import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertTriangle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useEmployees } from "@/hooks/useEmployees";

// Template header -> import key. Keys match fn_import_employees.
const HEADER_MAP: Record<string, string> = {
  "code": "code", "firstname": "first_name", "surname": "surname", "initial": "initials",
  "costcentrecode": "cost_centre_code", "costcentre": "cost_centre",
  "dateofbirth": "date_of_birth", "dateofengagement": "date_of_engagement",
  "departmentcode": "department_code", "department": "department",
  "gender": "gender", "nationalidentification": "national_id", "nationality": "nationality",
  "occupation": "occupation", "phoneno": "phone", "position": "position",
  "email": "email", "jobgrade": "job_grade", "necgrade": "nec_grade",
  "leavebalance": "leave_balance", "employeetype": "employment_type",
  "contractstartdate": "contract_start_date", "contractenddate": "contract_end_date",
  "status": "status", "academicqualifications": "academic_qualifications",
  "combinedyearsofexperience": "years_of_experience", "experience": "experience_detail",
  "comments": "comments", "company": "company", "site": "site",
  // Financial fields -> restricted employee_financials table
  "paymentbasis": "payment_basis", "paymentmethod": "payment_method", "paymentpoint": "payment_point",
  "payroll": "payroll_name", "payroll2": "payroll_name_2", "payrollperiod": "payroll_period",
  "taxsummaryno": "tax_summary_no", "taxtabletypename": "tax_table_type", "taxationmethod": "taxation_method",
  "annualbasicsalary": "annual_basic_salary",
  "innbucks_accountnumber": "innbucks_account", "zig_accountnumber": "zig_account",
  "bank_accountnumber": "bank_account", "bank_name": "bank_name",
  "bank_branchname": "bank_branch_name", "bank_branchcode": "bank_branch_code",
  // Ignored (derived in DB)
  "fullname": "", "employee": "",
};

const FINANCIAL_KEYS = new Set(["payment_basis","payment_method","payment_point","payroll_name","payroll_name_2","payroll_period","tax_summary_no","tax_table_type","taxation_method","annual_basic_salary","innbucks_account","zig_account","bank_account","bank_name","bank_branch_name","bank_branch_code"]);
const DATE_KEYS = new Set(["date_of_birth","date_of_engagement","contract_start_date","contract_end_date","payroll_period"]);

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9_]/g, "");

function excelDateToISO(v: unknown): string {
  if (v == null || v === "") return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Excel serial date
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? String(v) : d.toISOString().slice(0, 10);
}

interface RowIssue { row: number; code: string; message: string }
interface ImportResult { inserted: number; updated: number; skipped: number; errors: RowIssue[]; warnings: RowIssue[] }

export default function DataMigration() {
  const { sites } = useEmployees();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [unmappedHeaders, setUnmappedHeaders] = useState<string[]>([]);
  const [defaultSite, setDefaultSite] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const validation = useMemo(() => {
    const problems: string[] = [];
    let missingRequired = 0;
    const seen = new Set<string>();
    let dupes = 0;
    for (const r of rows) {
      if (!r.code?.trim() || !r.first_name?.trim() || !r.surname?.trim()) missingRequired++;
      if (r.code) {
        if (seen.has(r.code)) dupes++;
        seen.add(r.code);
      }
    }
    if (missingRequired) problems.push(`${missingRequired} row(s) missing Code, FirstName or Surname — these will be rejected`);
    if (dupes) problems.push(`${dupes} duplicate code(s) within the file — later rows will overwrite earlier ones in 'update' mode`);
    const hasFinancials = rows.some((r) => FINANCIAL_KEYS.size && Array.from(FINANCIAL_KEYS).some((k) => r[k]));
    return { problems, hasFinancials };
  }, [rows]);

  const handleFile = async (file: File) => {
    setParsing(true);
    setParseError(null);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (raw.length === 0) { setParseError("The file has no data rows."); setParsing(false); return; }

      const headers = Object.keys(raw[0]);
      const unmapped: string[] = [];
      const mapped = raw.map((r) => {
        const out: Record<string, string> = {};
        for (const h of headers) {
          const key = HEADER_MAP[norm(h)];
          if (key === undefined) { if (!unmapped.includes(h)) unmapped.push(h); continue; }
          if (key === "") continue; // deliberately ignored
          const v = r[h];
          out[key] = DATE_KEYS.has(key) ? excelDateToISO(v) : String(v ?? "").trim();
        }
        return out;
      });
      setRows(mapped);
      setUnmappedHeaders(unmapped);
      setFileName(file.name);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Could not parse the file.");
    }
    setParsing(false);
  };

  const runImport = async () => {
    if (!defaultSite || rows.length === 0) return;
    setImporting(true);
    setProgress(0);
    const totals: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [], warnings: [] };

    // Whole-file duplicate blocking (Employee ID + National ID) before batching,
    // so a duplicate in a later batch cannot masquerade as an "existing" record.
    const seenCodes = new Map<string, number>();
    const seenNids = new Map<string, number>();
    const unique: { row: Record<string, string>; fileRow: number }[] = [];
    rows.forEach((r, idx) => {
      const fileRow = idx + 1;
      const code = r.code?.trim();
      const nid = r.national_id?.trim();
      if (code && seenCodes.has(code)) {
        totals.errors.push({ row: fileRow, code, message: `Duplicate in file: Employee ID ${code} first appears at row ${seenCodes.get(code)}` });
        return;
      }
      if (nid && seenNids.has(nid)) {
        totals.errors.push({ row: fileRow, code: code ?? "?", message: `Duplicate in file: National ID first appears at row ${seenNids.get(nid)}` });
        return;
      }
      if (code) seenCodes.set(code, fileRow);
      if (nid) seenNids.set(nid, fileRow);
      unique.push({ row: r, fileRow });
    });

    const BATCH = 200;
    for (let i = 0; i < unique.length; i += BATCH) {
      const batch = unique.slice(i, i + BATCH);
      const { data, error } = await supabase.rpc("fn_import_employees", {
        p_rows: batch.map((b) => b.row),
        p_default_site_id: defaultSite,
        p_mode: "update",
      });
      if (error) {
        totals.errors.push({ row: batch[0].fileRow, code: "BATCH", message: error.message });
      } else if (data) {
        const d = data as ImportResult;
        totals.inserted += d.inserted;
        totals.updated += d.updated;
        totals.skipped += d.skipped;
        const toFileRow = (n: number) => batch[n - 1]?.fileRow ?? n;
        totals.errors.push(...(d.errors ?? []).map((e) => ({ ...e, row: toFileRow(e.row) })));
        totals.warnings.push(...(d.warnings ?? []).map((w) => ({ ...w, row: toFileRow(w.row) })));
      }
      setProgress(Math.min(100, Math.round(((i + batch.length) / unique.length) * 100)));
    }
    totals.errors.sort((a, b) => a.row - b.row);
    setResult(totals);
    setImporting(false);
  };

  const downloadTemplate = () => {
    const headers = ["Code","FirstName","Surname","Initial","CostCentreCode","CostCentre","DateofBirth","DateofEngagement","DepartmentCode","Department","Gender","NationalIdentification","Nationality","Occupation","PaymentBasis","PaymentMethod","PaymentPoint","Payroll","PayrollPeriod","PhoneNo","Position","TaxSummaryNo","TaxTableTypeName","TaxationMethod","AnnualBasicSalary","InnBucks_AccountNumber","ZiG_AccountNumber","Bank_AccountNumber","Bank_Name","Bank_BranchName","Bank_BranchCode","Company","Email","Job Grade","NEC Grade","Leave Balance","Employee Type","Contract Start Date","Contract End Date","Payroll2","Status","Academic Qualifications","Combined Years of Experience","Comments","Experience","Site"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Magaya_ELMS_Import_Template.xlsx");
  };

  const previewCols = useMemo(() => {
    if (rows.length === 0) return [];
    const keys = Object.keys(rows[0]);
    const lead = ["code", "first_name", "surname", "department", "position", "status"].filter((k) => keys.includes(k));
    return [...lead, ...keys.filter((k) => !lead.includes(k))].slice(0, 10);
  }, [rows]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Employee Data Migration</h3>
        <p className="text-[13px] text-[#525252] mt-1">
          Upload the HR master-data export (.xlsx or .csv). Columns are matched to the approved field template automatically.
          Payroll and banking fields are stored in a restricted table visible to HR roles only.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />
        <Button onClick={() => fileRef.current?.click()} disabled={parsing || importing} className="bg-[#D4A017] hover:bg-[#A67C0A] text-white">
          {parsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {fileName ? "Choose a different file" : "Choose file"}
        </Button>
        <Button variant="outline" onClick={downloadTemplate} className="text-[#525252]">
          <Download className="w-4 h-4 mr-2" /> Download template
        </Button>
        {fileName && (
          <span className="flex items-center gap-2 text-[13px] text-[#1A1A1A]"><FileSpreadsheet className="w-4 h-4 text-[#1B7A43]" /> {fileName} · {rows.length} row{rows.length === 1 ? "" : "s"}</span>
        )}
      </div>

      {parseError && <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{parseError}</div>}

      {rows.length > 0 && !result && (
        <>
          {unmappedHeaders.length > 0 && (
            <div className="px-4 py-3 rounded-[10px] border border-[#C27A06]/30 bg-[#FDF3E0] text-[13px] text-[#C27A06]">
              Unrecognised columns (will be ignored): {unmappedHeaders.join(", ")}
            </div>
          )}
          {validation.problems.map((p, i) => (
            <div key={i} className="px-4 py-3 rounded-[10px] border border-[#C27A06]/30 bg-[#FDF3E0] text-[13px] text-[#C27A06] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {p}
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Default site (for rows without a Site column) *</label>
              <Select value={defaultSite} onValueChange={setDefaultSite}>
                <SelectTrigger className="h-[40px] text-[13px]"><SelectValue placeholder="Select site..." /></SelectTrigger>
                <SelectContent>
                  {sites.map((s) => <SelectItem key={s.id} value={s.id} className="text-[13px]">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <p className="text-[12px] text-[#9C9C9C] leading-relaxed pb-1">
                Duplicates are blocked on Employee ID and National ID. Records matching an existing employee are updated automatically.
              </p>
            </div>
            <div className="flex items-end">
              <Button onClick={() => void runImport()} disabled={!defaultSite || importing} className="bg-[#1B7A43] hover:bg-[#14603a] text-white w-full h-[40px]">
                {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing... {progress}%</> : `Import ${rows.length} row${rows.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>

          <div className="border border-[#E5E4E0] rounded-[10px] overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[#FAFAF8]">
                <tr>{previewCols.map((c) => <th key={c} className="px-3 py-2 text-left font-semibold text-[#525252] uppercase tracking-[0.04em] whitespace-nowrap">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4E0]">
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i}>
                    {previewCols.map((c) => (
                      <td key={c} className="px-3 py-2 text-[#1A1A1A] whitespace-nowrap">
                        {FINANCIAL_KEYS.has(c) && r[c] ? "•••••" : (r[c] || <span className="text-[#C4C3BF]">—</span>)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 8 && <div className="px-3 py-2 text-[12px] text-[#9C9C9C] border-t border-[#E5E4E0]">…and {rows.length - 8} more rows</div>}
          </div>
        </>
      )}

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="px-4 py-4 rounded-[10px] border border-[#1B7A43]/30 bg-[#1B7A43]/5 text-center">
              <div className="text-[26px] font-bold text-[#1B7A43]">{result.inserted}</div>
              <div className="text-[12px] font-medium text-[#525252] uppercase tracking-[0.05em] mt-1">New records added</div>
            </div>
            <div className="px-4 py-4 rounded-[10px] border border-[#1E6BA3]/30 bg-[#1E6BA3]/5 text-center">
              <div className="text-[26px] font-bold text-[#1E6BA3]">{result.updated}</div>
              <div className="text-[12px] font-medium text-[#525252] uppercase tracking-[0.05em] mt-1">Updated</div>
            </div>
            <div className="px-4 py-4 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-center">
              <div className="text-[26px] font-bold text-[#B91C1C]">{result.errors.length}</div>
              <div className="text-[12px] font-medium text-[#525252] uppercase tracking-[0.05em] mt-1">Failed</div>
            </div>
          </div>
          {result.warnings.length > 0 && (
            <div className="border border-[#C27A06]/30 rounded-[10px] overflow-hidden">
              <div className="px-4 py-2 bg-[#FDF3E0] text-[13px] font-semibold text-[#C27A06]">Matched by National ID (updated, existing Employee ID kept)</div>
              <div className="max-h-[180px] overflow-y-auto divide-y divide-[#E5E4E0]">
                {result.warnings.map((w, i) => (
                  <div key={i} className="px-4 py-2 text-[12px] text-[#1A1A1A]">Row {w.row} ({w.code}): <span className="text-[#C27A06]">{w.message}</span></div>
                ))}
              </div>
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="border border-[#B91C1C]/30 rounded-[10px] overflow-hidden">
              <div className="px-4 py-2 bg-[#B91C1C]/5 text-[13px] font-semibold text-[#B91C1C]">Rows that could not be imported</div>
              <div className="max-h-[240px] overflow-y-auto divide-y divide-[#E5E4E0]">
                {result.errors.map((e, i) => (
                  <div key={i} className="px-4 py-2 text-[12px] text-[#1A1A1A]">Row {e.row} ({e.code}): <span className="text-[#B91C1C]">{e.message}</span></div>
                ))}
              </div>
            </div>
          )}
          <Button variant="outline" onClick={() => { setRows([]); setFileName(null); setResult(null); }} className="text-[#525252]">Import another file</Button>
        </div>
      )}
    </div>
  );
}
