// Audit Logs: live compliance trail from the immutable audit_logs table.
import { useState } from "react";
import { ChevronDown, ShieldCheck, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuditLogs, AUDIT_TABLES, type AuditRow } from "@/hooks/useAuditLogs";

const ACTION_STYLE: Record<string, string> = {
  INSERT: "bg-[#E8F5EC] text-[#1B7A43]",
  UPDATE: "bg-[#E8F2FA] text-[#1E6BA3]",
  DELETE: "bg-[#FEF2F2] text-[#B91C1C]",
};
const MODULE_LABEL: Record<string, string> = {
  employees: "Employees", employee_financials: "Payroll & Banking", employee_documents: "Documents",
  workflows: "Workflows", workflow_stages: "Workflow Stages", workflow_tasks: "Workflow Tasks",
  workflow_signoffs: "Sign-offs", profiles: "Users", sites: "Sites", departments: "Departments",
  site_key_personnel: "Key Personnel", site_config: "Site Config",
};
const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function DiffBlock({ row }: { row: AuditRow }) {
  const changed: { key: string; before: string; after: string }[] = [];
  if (row.action === "UPDATE" && row.oldData && row.newData) {
    for (const k of Object.keys(row.newData)) {
      const b = JSON.stringify(row.oldData[k] ?? null);
      const a = JSON.stringify(row.newData[k] ?? null);
      if (b !== a && k !== "updated_at") changed.push({ key: k, before: b, after: a });
    }
  }
  return (
    <div className="px-5 py-4 bg-[#FAFAF8] border-t border-[#E5E4E0] text-[12px] space-y-2">
      <div className="text-[#737373]">Record: <span className="font-mono text-[11px]">{row.recordId ?? "—"}</span>{row.siteName ? ` · Site: ${row.siteName}` : ""}</div>
      {row.action === "UPDATE" ? (
        changed.length > 0 ? (
          <div className="space-y-1">
            {changed.slice(0, 12).map((c) => (
              <div key={c.key} className="flex gap-2 flex-wrap">
                <span className="font-medium text-[#1A1A1A] min-w-[160px]">{c.key}</span>
                <span className="text-[#B91C1C] line-through break-all">{c.before}</span>
                <span className="text-[#1B7A43] break-all">{c.after}</span>
              </div>
            ))}
            {changed.length > 12 && <div className="text-[#9C9C9C]">…and {changed.length - 12} more fields</div>}
          </div>
        ) : <div className="text-[#9C9C9C]">No field-level differences (timestamp-only update)</div>
      ) : (
        <pre className="whitespace-pre-wrap break-all font-mono text-[11px] text-[#525252] max-h-[220px] overflow-y-auto">
          {JSON.stringify(row.action === "DELETE" ? row.oldData : row.newData, null, 2)?.slice(0, 2500)}
        </pre>
      )}
    </div>
  );
}

export default function AuditLogs() {
  const { rows, total, stats, page, setPage, pageSize, filters, setFilters, profiles, loading, error } = useAuditLogs();
  const [expanded, setExpanded] = useState<string | null>(null);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const exportCsv = () => {
    const header = "Timestamp,User,Action,Module,Subject,Record ID\n";
    const body = rows.map((r) => [fmt(r.createdAt), r.performedByName, r.action, MODULE_LABEL[r.tableName] ?? r.tableName, (r.subject ?? "").replace(/,/g, " "), r.recordId ?? ""].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit_logs_page${page + 1}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] tracking-[-0.02em]">Audit Logs</h1>
          <p className="text-[13px] text-[#525252] mt-1">Immutable system activity and compliance trail</p>
        </div>
        <Button variant="outline" onClick={exportCsv} className="text-[13px]"><Download className="w-4 h-4 mr-1.5" /> Export page (CSV)</Button>
      </div>

      {error && <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: total, color: "#1A1A1A" },
          { label: "Creates", value: stats.inserts, color: "#1B7A43" },
          { label: "Updates", value: stats.updates, color: "#1E6BA3" },
          { label: "Deletes", value: stats.deletes, color: "#B91C1C" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-[10px] border border-[#E5E4E0] p-4">
            <div className="text-[24px] font-bold" style={{ color: c.color }}>{c.value.toLocaleString()}</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9C9C9C] mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-4 flex items-center gap-3 flex-wrap">
        <Select value={filters.action || "all"} onValueChange={(v) => setFilters({ ...filters, action: v === "all" ? "" : v })}>
          <SelectTrigger className="h-[38px] text-[13px] w-[150px]"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All Actions</SelectItem>
            {["INSERT", "UPDATE", "DELETE"].map((a) => <SelectItem key={a} value={a} className="text-[13px]">{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.table || "all"} onValueChange={(v) => setFilters({ ...filters, table: v === "all" ? "" : v })}>
          <SelectTrigger className="h-[38px] text-[13px] w-[190px]"><SelectValue placeholder="All Modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All Modules</SelectItem>
            {AUDIT_TABLES.map((t) => <SelectItem key={t} value={t} className="text-[13px]">{MODULE_LABEL[t] ?? t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.userId || "all"} onValueChange={(v) => setFilters({ ...filters, userId: v === "all" ? "" : v })}>
          <SelectTrigger className="h-[38px] text-[13px] w-[190px]"><SelectValue placeholder="All Users" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All Users</SelectItem>
            {profiles.map((p) => <SelectItem key={p.id} value={p.id} className="text-[13px]">{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="h-[38px] text-[13px] w-[160px]" />
        <span className="text-[12px] text-[#9C9C9C]">to</span>
        <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="h-[38px] text-[13px] w-[160px]" />
        {(filters.action || filters.table || filters.userId || filters.from || filters.to) && (
          <button onClick={() => setFilters({ action: "", table: "", userId: "", from: "", to: "" })} className="text-[12px] text-[#D4A017] font-medium hover:underline">Clear all</button>
        )}
      </div>

      <div className="bg-white rounded-[10px] border border-[#E5E4E0] overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-[3px] border-[#E5E4E0] border-t-[#D4A017] rounded-full animate-spin" />
            <p className="text-[13px] text-[#9C9C9C]">Loading audit trail...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center">
            <ShieldCheck className="w-8 h-8 text-[#C4C3BF] mx-auto mb-2" />
            <p className="text-[13px] text-[#9C9C9C]">No audit events match these filters</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E4E0]">
            <div className="grid grid-cols-[170px_180px_100px_150px_1fr_40px] gap-3 px-5 py-2.5 bg-[#FAFAF8] text-[11px] font-semibold uppercase tracking-[0.05em] text-[#525252]">
              <span>Timestamp</span><span>User</span><span>Action</span><span>Module</span><span>Subject</span><span></span>
            </div>
            {rows.map((r) => (
              <div key={r.id}>
                <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="w-full grid grid-cols-[170px_180px_100px_150px_1fr_40px] gap-3 px-5 py-3 items-center text-left hover:bg-[#FAFAF8] transition-colors">
                  <span className="text-[12px] text-[#525252]">{fmt(r.createdAt)}</span>
                  <span className="text-[13px] text-[#1A1A1A] truncate">{r.performedByName}</span>
                  <span><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", ACTION_STYLE[r.action])}>{r.action}</span></span>
                  <span className="text-[12px] text-[#525252]">{MODULE_LABEL[r.tableName] ?? r.tableName}</span>
                  <span className="text-[13px] text-[#1A1A1A] truncate">{r.subject ?? <span className="text-[#C4C3BF] font-mono text-[11px]">{r.recordId?.slice(0, 8) ?? "—"}</span>}</span>
                  <ChevronDown className={cn("w-4 h-4 text-[#9C9C9C] transition-transform", expanded === r.id && "rotate-180")} />
                </button>
                {expanded === r.id && <DiffBlock row={r} />}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E4E0]">
          <span className="text-[12px] text-[#9C9C9C]">Showing {rows.length ? page * pageSize + 1 : 0}–{page * pageSize + rows.length} of {total.toLocaleString()} events</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="h-8 text-[12px]">Previous</Button>
            <span className="text-[12px] text-[#525252]">Page {page + 1} of {pages.toLocaleString()}</span>
            <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="h-8 text-[12px]">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
