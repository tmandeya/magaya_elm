// Reports & Analytics: live workforce and workflow analytics with CSV export.
import { useMemo, useState } from "react";
import { Users, UserPlus, UserMinus, ArrowLeftRight, Monitor, AlertTriangle, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReports, type NameCount, type WorkflowTypeReport } from "@/hooks/useReports";

const CATEGORIES = [
  { key: "census", label: "Employee Census", icon: Users },
  { key: "onboarding", label: "Onboarding", icon: UserPlus },
  { key: "offboarding", label: "Offboarding", icon: UserMinus },
  { key: "transfers", label: "Transfers", icon: ArrowLeftRight },
  { key: "it", label: "IT & Accounts", icon: Monitor },
  { key: "documents", label: "Document Expiry", icon: AlertTriangle },
];
const RANGES = [
  { key: "7", label: "7d", days: 7 },
  { key: "30", label: "30d", days: 30 },
  { key: "90", label: "90d", days: 90 },
  { key: "all", label: "All time", days: null as number | null },
];
const PIE_COLORS = ["#D4A017", "#1E6BA3", "#1B7A43", "#B91C1C", "#7C3AED", "#C27A06", "#0F766E", "#9C9C9C"];

function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5">
      <div className="text-[26px] font-bold text-[#1A1A1A]">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9C9C9C] mt-1">{label}</div>
      {sub && <div className="text-[11px] text-[#737373] mt-0.5">{sub}</div>}
    </div>
  );
}

function BarPanel({ title, data, height = 260, horizontal = false }: { title: string; data: NameCount[]; height?: number; horizontal?: boolean }) {
  return (
    <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5">
      <h3 className="text-[14px] font-semibold text-[#1A1A1A] mb-3">{title}</h3>
      {data.length === 0 ? <p className="text-[12px] text-[#9C9C9C] py-8 text-center">No data yet</p> : (
        <ResponsiveContainer width="100%" height={height}>
          {horizontal ? (
            <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#525252" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="count" fill="#D4A017" radius={[0, 4, 4, 0]} />
            </BarChart>
          ) : (
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#525252" }} angle={-35} textAnchor="end" height={70} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#525252" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="count" fill="#D4A017" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}

function PiePanel({ title, data }: { title: string; data: NameCount[] }) {
  return (
    <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5">
      <h3 className="text-[14px] font-semibold text-[#1A1A1A] mb-3">{title}</h3>
      {data.length === 0 ? <p className="text-[12px] text-[#9C9C9C] py-8 text-center">No data yet</p> : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function WorkflowReport({ title, r }: { title: string; r: WorkflowTypeReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={`Total ${title}`} value={r.total} />
        <KpiCard label="In Progress" value={r.inProgress} />
        <KpiCard label="Completed" value={r.completed} />
        <KpiCard label="Avg Cycle (days)" value={r.avgCycleDays ?? "—"} sub={r.avgCycleDays == null ? "No completed workflows yet" : undefined} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarPanel title={`${title} by Site`} data={r.bySite} horizontal height={Math.max(160, r.bySite.length * 34)} />
        <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5">
          <h3 className="text-[14px] font-semibold text-[#1A1A1A] mb-3">Recent {title}</h3>
          {r.rows.length === 0 ? (
            <p className="text-[12px] text-[#9C9C9C] py-8 text-center">No {title.toLowerCase()} workflows in this period — initiate one from the {title} Hub to see it here.</p>
          ) : (
            <div className="divide-y divide-[#F0EFEB] max-h-[300px] overflow-y-auto">
              {r.rows.map((row) => (
                <div key={row.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] text-[#1A1A1A] truncate">{row.employee} <span className="text-[#9C9C9C]">({row.code})</span></div>
                    <div className="text-[11px] text-[#737373] truncate">{row.site}{row.extra ? ` · ${row.extra}` : ""} · started {row.started}</div>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0", row.status === "Completed" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#FDF3E0] text-[#C27A06]")}>{row.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const csv = [header.join(","), ...rows.map((r) => r.map((v) => String(v).replace(/,/g, " ")).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

export default function Reports() {
  const [category, setCategory] = useState("census");
  const [range, setRange] = useState("all");
  const rangeDays = RANGES.find((r) => r.key === range)?.days ?? null;
  const { data, loading, error } = useReports(rangeDays);

  const exportCurrent = useMemo(() => () => {
    if (!data) return;
    if (category === "census") downloadCsv("employee_census.csv", ["Site", "Employees"], data.census.bySite.map((s) => [s.name, s.count]));
    else if (category === "it") downloadCsv("it_accounts.csv", ["M365 Status", "Employees"], data.itAccounts.m365.map((s) => [s.name, s.count]));
    else if (category === "documents") downloadCsv("document_expiry.csv", ["Employee", "Code", "Category", "File", "Expiry"], data.documents.expiring.map((d) => [d.employee, d.code, d.category, d.fileName, d.expiryDate]));
    else {
      const r = category === "onboarding" ? data.onboarding : category === "offboarding" ? data.offboarding : data.transfers;
      downloadCsv(`${category}_report.csv`, ["Employee", "Code", "Site", "Detail", "Status", "Started"], r.rows.map((x) => [x.employee, x.code, x.site, x.extra, x.status, x.started]));
    }
  }, [data, category]);

  const workflowCategory = ["onboarding", "offboarding", "transfers"].includes(category);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] tracking-[-0.02em]">Reports & Analytics</h1>
          <p className="text-[13px] text-[#525252] mt-1">Live workforce analytics and exportable reports</p>
        </div>
        <Button variant="outline" onClick={exportCurrent} disabled={!data} className="text-[13px]"><Download className="w-4 h-4 mr-1.5" /> Export CSV</Button>
      </div>

      {error && <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{error}</div>}

      <div className="flex gap-5 items-start flex-col lg:flex-row">
        <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-2 w-full lg:w-[210px] shrink-0">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left",
                category === c.key ? "bg-[#FDF6E3] text-[#A67C0A] border-l-2 border-[#D4A017]" : "text-[#525252] hover:bg-[#FAFAF8]")}>
              <c.icon className="w-4 h-4" /> {c.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0 w-full space-y-4">
          {workflowCategory && (
            <div className="flex items-center gap-2">
              {RANGES.map((r) => (
                <button key={r.key} onClick={() => setRange(r.key)}
                  className={cn("px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors",
                    range === r.key ? "bg-[#D4A017] text-white border-[#D4A017]" : "bg-white text-[#525252] border-[#E5E4E0] hover:border-[#D4A017]")}>
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {loading || !data ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
              <div className="w-8 h-8 border-[3px] border-[#E5E4E0] border-t-[#D4A017] rounded-full animate-spin" />
              <p className="text-[13px] text-[#9C9C9C]">Building report from live data...</p>
            </div>
          ) : category === "census" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Total Employees" value={data.census.total} />
                <KpiCard label="Active Employees" value={data.census.active} sub={`${data.census.total ? Math.round((data.census.active / data.census.total) * 100) : 0}% of total`} />
                <KpiCard label="New This Month" value={data.census.newThisMonth} sub="By engagement date" />
                <KpiCard label="Departed This Month" value={data.census.departedThisMonth} sub="By termination date" />
              </div>
              <BarPanel title="Employee Count by Site" data={data.census.bySite} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarPanel title="Department Distribution" data={data.census.byDepartment} horizontal height={Math.max(240, data.census.byDepartment.length * 26)} />
                <div className="space-y-4">
                  <PiePanel title="Gender Split" data={data.census.byGender} />
                  <PiePanel title="Employment Type" data={data.census.byEmploymentType} />
                </div>
              </div>
            </div>
          ) : category === "onboarding" ? (
            <WorkflowReport title="Onboarding" r={data.onboarding} />
          ) : category === "offboarding" ? (
            <WorkflowReport title="Offboarding" r={data.offboarding} />
          ) : category === "transfers" ? (
            <WorkflowReport title="Transfers" r={data.transfers} />
          ) : category === "it" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <KpiCard label="With Work Email" value={data.itAccounts.withWorkEmail} />
                <KpiCard label="Without Work Email" value={data.itAccounts.withoutWorkEmail} />
              </div>
              <PiePanel title="M365 Account Status" data={data.itAccounts.m365} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard label="Total Documents" value={data.documents.total} />
                <KpiCard label="Expired" value={data.documents.expired} />
                <KpiCard label="Within 30 days" value={data.documents.within30} />
                <KpiCard label="31–60 days" value={data.documents.within60} />
                <KpiCard label="61–90 days" value={data.documents.within90} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarPanel title="Documents by Category" data={data.documents.byCategory} horizontal height={Math.max(180, data.documents.byCategory.length * 34)} />
                <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5">
                  <h3 className="text-[14px] font-semibold text-[#1A1A1A] mb-3">Expiring / Expired (next 90 days)</h3>
                  {data.documents.expiring.length === 0 ? (
                    <p className="text-[12px] text-[#9C9C9C] py-8 text-center">No documents expiring — attach documents with expiry dates on employee profiles to track them here.</p>
                  ) : (
                    <div className="divide-y divide-[#F0EFEB] max-h-[300px] overflow-y-auto">
                      {data.documents.expiring.map((d, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] text-[#1A1A1A] truncate">{d.employee} <span className="text-[#9C9C9C]">({d.code})</span></div>
                            <div className="text-[11px] text-[#737373] truncate">{d.category} · {d.fileName}</div>
                          </div>
                          <span className={cn("text-[11px] font-semibold shrink-0", new Date(d.expiryDate) < new Date() ? "text-[#B91C1C]" : "text-[#C27A06]")}>{d.expiryDate}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
