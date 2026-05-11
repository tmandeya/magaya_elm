import { useState, useMemo, useCallback, useRef } from "react";
import {
  Users, UserPlus, UserMinus, ArrowLeftRight, Monitor, AlertTriangle,
  Download, FileText, FileSpreadsheet, FileCode, X,
  Check, Bell, TrendingUp, TrendingDown, BarChart3
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  Area, AreaChart
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import {
  censusBySite, censusSummary, departmentDistribution, genderDistribution,
  employmentTypeData, onboardingVolume, onboardingBySite, onboardingSummary,
  recentOnboardings, offboardingVolume, offboardingBySite, offboardingSummary,
  recentOffboardings, transferVolume, transferSummary, recentTransfers,
  hardwareSummary, hardwareByType, hardwareBySite, hardwareInventory,
  m365Status, documentExpiryAlerts, documentSeveritySummary
} from "@/data/reportData";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

// ─── Role-based helpers ───────────────────────────────────────────────────────
const EXPORT_ROLES: UserRole[] = ["hq_hr", "hq_admin"];
const HOD_EXPORT_ROLES: UserRole[] = ["hod_hr"];
function canExport(role: UserRole | null): boolean {
  if (!role) return false;
  return EXPORT_ROLES.includes(role) || HOD_EXPORT_ROLES.includes(role);
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const tabs = [
  { id: "census", label: "Employee Census", icon: Users },
  { id: "onboarding", label: "Onboarding", icon: UserPlus },
  { id: "offboarding", label: "Offboarding", icon: UserMinus },
  { id: "transfers", label: "Transfers", icon: ArrowLeftRight },
  { id: "hardware", label: "Hardware & IT", icon: Monitor },
  { id: "documents", label: "Document Expiry", icon: AlertTriangle },
];

// ─── Period selector types ────────────────────────────────────────────────────
type Period = "7d" | "30d" | "90d" | "YTD" | "Custom";
const periods: Period[] = ["7d", "30d", "90d", "YTD", "Custom"];

// ─── Toast helper ─────────────────────────────────────────────────────────────
interface Toast { id: number; message: string; type: "success" | "error" | "info"; }
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const add = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

// ─── Sort helper ──────────────────────────────────────────────────────────────
type SortDir = "asc" | "desc";
interface SortState { col: string; dir: SortDir }
function useSort(defaultCol: string): [SortState, (col: string) => void] {
  const [sort, setSort] = useState<SortState>({ col: defaultCol, dir: "asc" });
  const toggle = useCallback((col: string) => {
    setSort((s) => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
  }, []);
  return [sort, toggle];
}

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-[6px] shadow-lg border border-[#E5E4E0] px-3 py-2">
      <p className="text-[12px] font-semibold text-[#1A1A1A] mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px] text-[#525252]">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}: <strong className="text-[#1A1A1A]">{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
}

// ─── Custom Donut Tooltip ─────────────────────────────────────────────────────
function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white rounded-[6px] shadow-lg border border-[#E5E4E0] px-3 py-2">
      <div className="flex items-center gap-2 text-[12px] text-[#525252]">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.payload.color }} />
        <span>{p.name}: <strong className="text-[#1A1A1A]">{p.value}</strong></span>
      </div>
    </div>
  );
}

// ─── Stat Card Component ──────────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: string | number; icon: React.ElementType;
  iconBg: string; iconColor: string; delay?: number; subtext?: string; subtextColor?: string;
}
function StatCard({ label, value, icon: Icon, iconBg, iconColor, delay = 0, subtext, subtextColor }: StatCardProps) {
  return (
    <div className="flex-1 min-w-[180px] bg-white border border-[#E5E4E0] rounded-[10px] p-5 hover:border-[#C4C3BF] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: iconBg }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <span className="text-[28px] font-bold leading-none tracking-[-0.02em] text-[#1A1A1A]">{value}</span>
      </div>
      <p className="text-[12px] text-[#737373] uppercase tracking-[0.08em]">{label}</p>
      {subtext && <p className={cn("text-[11px] mt-1", subtextColor || "text-[#737373]")}>{subtext}</p>}
    </div>
  );
}

// ─── Export Modal ─────────────────────────────────────────────────────────────
interface ExportModalProps { onClose: () => void; onExport: () => void; }
function ExportModal({ onClose, onExport }: ExportModalProps) {
  const [format, setFormat] = useState<"PDF" | "CSV" | "Excel">("PDF");
  const [dateRange, setDateRange] = useState<"current" | "all">("current");
  const [includeCharts, setIncludeCharts] = useState(true);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(26,26,26,0.5)]" onClick={onClose} />
      <div className="relative bg-white rounded-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-[480px] mx-4 overflow-hidden" style={{ animation: "scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4E0]">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Export Report</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#F4F3EF] transition-colors"><X className="w-4 h-4 text-[#737373]" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-[13px] font-medium text-[#525252] mb-2 block">Format</label>
            <div className="flex gap-3">
              {(["PDF", "CSV", "Excel"] as const).map((f) => (
                <button key={f} onClick={() => setFormat(f)} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-[13px] font-medium transition-all", format === f ? "border-[#D4A017] bg-[rgba(212,160,23,0.08)] text-[#D4A017]" : "border-[#E5E4E0] text-[#525252] hover:border-[#C4C3BF]")}>
                  {f === "PDF" && <FileText className="w-4 h-4" />}
                  {f === "CSV" && <FileCode className="w-4 h-4" />}
                  {f === "Excel" && <FileSpreadsheet className="w-4 h-4" />}
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium text-[#525252] mb-2 block">Date Range</label>
            <div className="flex gap-3">
              {(["current", "all"] as const).map((r) => (
                <button key={r} onClick={() => setDateRange(r)} className={cn("flex-1 py-2.5 rounded-lg border text-[13px] font-medium transition-all", dateRange === r ? "border-[#D4A017] bg-[rgba(212,160,23,0.08)] text-[#D4A017]" : "border-[#E5E4E0] text-[#525252] hover:border-[#C4C3BF]")}>
                  {r === "current" ? "Current Period" : "All Time"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIncludeCharts(!includeCharts)} className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all", includeCharts ? "bg-[#D4A017] border-[#D4A017]" : "border-[#E5E4E0]")}>
              {includeCharts && <Check className="w-3 h-3 text-white" />}
            </button>
            <label className="text-[13px] text-[#525252] cursor-pointer" onClick={() => setIncludeCharts(!includeCharts)}>Include charts in export</label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E4E0] bg-[#FAFAF8]">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-[#525252] hover:text-[#1A1A1A] transition-colors">Cancel</button>
          <button onClick={onExport} className="px-5 py-2 bg-[#D4A017] text-white text-[13px] font-semibold rounded-lg hover:bg-[#A67C0A] transition-colors">Export {format}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Table Header ────────────────────────────────────────────────────
function TableHeader({ label, sortKey, sort, onSort }: { label: string; sortKey: string; sort: SortState; onSort: (k: string) => void }) {
  const active = sort.col === sortKey;
  return (
    <th onClick={() => onSort(sortKey)} className="cursor-pointer select-none px-4 py-3 text-left text-[12px] font-semibold text-[#525252] uppercase tracking-[0.05em] hover:text-[#1A1A1A] transition-colors whitespace-nowrap">
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={cn("inline-flex flex-col text-[9px] leading-none", active ? "opacity-100" : "opacity-30")}>
          <span className={cn(active && sort.dir === "asc" ? "text-[#D4A017]" : "text-[#9C9C9C]")}>▲</span>
          <span className={cn(active && sort.dir === "desc" ? "text-[#D4A017]" : "text-[#9C9C9C]")}>▼</span>
        </span>
      </span>
    </th>
  );
}

// ─── Sortable Table Component ─────────────────────────────────────────────────
interface Column<T> { key: string; label: string; render?: (row: T) => React.ReactNode }
function SortableTable<T extends Record<string, unknown>>({ columns, rows, sort, onSort, keyExtractor }: { columns: Column<T>[]; rows: T[]; sort: SortState; onSort: (k: string) => void; keyExtractor: (row: T) => string }) {
  const sorted = useMemo(() => {
    if (!sort.col) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sort.col] as number | string;
      const bv = b[sort.col] as number | string;
      if (typeof av === "number" && typeof bv === "number") return sort.dir === "asc" ? av - bv : bv - av;
      return sort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [rows, sort]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-[#FAFAF8] border-b border-[#E5E4E0]">
            {columns.map((c) => (
              <TableHeader key={c.key} label={c.label} sortKey={c.key} sort={sort} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={keyExtractor(row)} className="border-b border-[#E5E4E0] hover:bg-[#FAFAF8] transition-colors">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-[#1A1A1A] whitespace-nowrap">
                  {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN REPORTS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Reports() {
  const { currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState("census");
  const [period, setPeriod] = useState<Period>("YTD");
  const [exportOpen, setExportOpen] = useState(false);
  const { toasts, add, remove } = useToast();

  const handleExport = useCallback(() => {
    setExportOpen(false);
    setTimeout(() => add("Report exported successfully", "success"), 400);
  }, [add]);

  const exportAllowed = canExport(currentRole);

  // ─── Toast notifications ────────────────────────────────────────────────────
  const toastElements = (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1)] border-l-4 bg-white min-w-[300px] animate-slide-in-right")} style={{ borderLeftColor: t.type === "success" ? "#1B7A43" : t.type === "error" ? "#B91C1C" : "#1E6BA3" }}>
          {t.type === "success" && <Check className="w-4 h-4 text-[#1B7A43] shrink-0" />}
          {t.type === "error" && <X className="w-4 h-4 text-[#B91C1C] shrink-0" />}
          {t.type === "info" && <Bell className="w-4 h-4 text-[#1E6BA3] shrink-0" />}
          <p className="text-[13px] text-[#1A1A1A] flex-1">{t.message}</p>
          <button onClick={() => remove(t.id)} className="w-5 h-5 flex items-center justify-center"><X className="w-3 h-3 text-[#9C9C9C]" /></button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {toastElements}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] tracking-[-0.02em]">Reports &amp; Analytics</h1>
          <p className="text-[13px] text-[#525252] mt-1">Comprehensive workforce analytics and exportable reports</p>
        </div>
        {exportAllowed ? (
          <button onClick={() => setExportOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] text-white text-[13px] font-semibold rounded-lg hover:bg-[#A67C0A] transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        ) : (
          <div className="relative group">
            <button disabled className="flex items-center gap-2 px-4 py-2.5 bg-[#E5E4E0] text-[#9C9C9C] text-[13px] font-semibold rounded-lg cursor-not-allowed">
              <Download className="w-4 h-4" /> Export Report
            </button>
            <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-[#1A1A1A] text-white text-[12px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Requires HQ role to export
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} onExport={handleExport} />}

      {/* Main Content: Left Tabs + Right Content */}
      <div className="flex gap-4">
        {/* Left Vertical Tabs */}
        <div className="w-[200px] shrink-0 bg-white border border-[#E5E4E0] rounded-[10px] p-2 h-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 rounded-[6px] text-[13px] font-medium transition-all duration-150 mb-1 last:mb-0",
                  isActive
                    ? "bg-[rgba(212,160,23,0.1)] text-[#D4A017] border-l-[3px] border-[#D4A017]"
                    : "text-[#525252] hover:bg-[#FAFAF8] border-l-[3px] border-transparent"
                )}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="leading-tight text-left">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {/* Period Selector */}
          <div className="flex items-center gap-2 mb-4">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[12px] font-medium transition-all",
                  period === p
                    ? "bg-[#D4A017] text-white"
                    : "bg-white border border-[#E5E4E0] text-[#525252] hover:border-[#C4C3BF]"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "census" && <CensusTab />}
          {activeTab === "onboarding" && <OnboardingTab />}
          {activeTab === "offboarding" && <OffboardingTab />}
          {activeTab === "transfers" && <TransfersTab />}
          {activeTab === "hardware" && <HardwareTab />}
          {activeTab === "documents" && <DocumentsTab addToast={add} />}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slide-in-right { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in-right { animation: slide-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 1 — EMPLOYEE CENSUS
// ═══════════════════════════════════════════════════════════════════════════════
function CensusTab() {
  const [sort, setSort] = useSort("site");
  const siteBarData = useMemo(() => censusBySite.map((s) => ({ name: s.site, count: s.total })), []);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total Employees" value={censusSummary.totalEmployees} icon={Users} iconBg="rgba(212,160,23,0.12)" iconColor="#D4A017" delay={0} />
        <StatCard label="Active Employees" value={censusSummary.activeEmployees} icon={Users} iconBg="#E8F5EC" iconColor="#1B7A43" delay={80} subtext={`${Math.round((censusSummary.activeEmployees / censusSummary.totalEmployees) * 100)}% of total`} subtextColor="text-[#1B7A43]" />
        <StatCard label="New This Month" value={censusSummary.newThisMonth} icon={UserPlus} iconBg="#E8F2FA" iconColor="#1E6BA3" delay={160} subtext="Onboarding in progress" subtextColor="text-[#1E6BA3]" />
        <StatCard label="Departed This Month" value={censusSummary.departedThisMonth} icon={UserMinus} iconBg="#FEF2F2" iconColor="#B91C1C" delay={240} subtext="Offboarding initiated" subtextColor="text-[#B91C1C]" />
        <StatCard label="Avg Tenure" value={`${censusSummary.averageTenure}y`} icon={BarChart3} iconBg="#FDF3E0" iconColor="#C27A06" delay={320} subtext="Years of service" />
      </div>

      {/* Charts Row 1 */}
      <div className="flex gap-4 flex-wrap lg:flex-nowrap">
        {/* Employee Count by Site */}
        <div className="flex-[55] min-w-[400px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Employee Count by Site</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteBarData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#737373" }} angle={-30} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12, fill: "#737373" }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Employees" fill="rgba(212,160,23,0.7)" stroke="#D4A017" strokeWidth={1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="flex-[45] min-w-[300px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Department Distribution</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="name"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {departmentDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center -mt-2 mb-2">
            <span className="text-[24px] font-bold text-[#1A1A1A]">{censusSummary.totalEmployees}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
            {departmentDistribution.slice(0, 6).map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-[#525252]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name} ({d.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="flex gap-4 flex-wrap lg:flex-nowrap">
        {/* Gender Distribution */}
        <div className="flex-1 min-w-[300px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Gender Distribution</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" strokeWidth={2} stroke="#fff">
                  {genderDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<DonutTooltip />} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", color: "#525252" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employment Type */}
        <div className="flex-1 min-w-[300px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Employment Type</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={employmentTypeData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#737373" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#737373" }} width={80} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="rgba(27,122,67,0.7)" stroke="#1B7A43" strokeWidth={1} radius={[0, 4, 4, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white border border-[#E5E4E0] rounded-[10px] p-5">
        <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Detailed Census by Site</h3>
        <SortableTable
          columns={[
            { key: "site", label: "Site" },
            { key: "total", label: "Total" },
            { key: "active", label: "Active" },
            { key: "onboarding", label: "Onboarding" },
            { key: "offboarding", label: "Offboarding" },
            { key: "transferred", label: "Transferred" },
            { key: "terminated", label: "Terminated" },
            { key: "male", label: "Male" },
            { key: "female", label: "Female" },
            { key: "permanent", label: "Permanent" },
            { key: "contract", label: "Contract" },
            { key: "casual", label: "Casual" },
            { key: "departments", label: "Depts" },
          ]}
          rows={censusBySite as unknown as Record<string, unknown>[]}
          sort={sort}
          onSort={setSort}
          keyExtractor={(row) => (row as unknown as CensusBySite).site}
        />
        <div className="flex items-center justify-between px-4 py-3 bg-[rgba(212,160,23,0.06)] border-t border-[#E5E4E0] font-semibold text-[#1A1A1A] text-[13px]">
          <span>Total</span>
          <span className="pl-4">{censusSummary.totalEmployees}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 2 — ONBOARDING PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════
function OnboardingTab() {
  const [sort, setSort] = useSort("employee");

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Avg Completion Time" value={`${onboardingSummary.avgCompletionDays}d`} icon={TrendingUp} iconBg="#E8F5EC" iconColor="#1B7A43" delay={0} subtext="Target: 14 days" subtextColor="text-[#1B7A43]" />
        <StatCard label="In Progress" value={onboardingSummary.inProgress} icon={UserPlus} iconBg="#E8F2FA" iconColor="#1E6BA3" delay={80} subtext="Currently onboarding" subtextColor="text-[#1E6BA3]" />
        <StatCard label="Completed This Month" value={onboardingSummary.completedThisMonth} icon={Check} iconBg="#E8F5EC" iconColor="#1B7A43" delay={160} subtext="Successfully onboarded" subtextColor="text-[#1B7A43]" />
        <StatCard label="Overdue" value={onboardingSummary.overdue} icon={AlertTriangle} iconBg="#FEF2F2" iconColor="#B91C1C" delay={240} subtext="Past due date" subtextColor="text-[#B91C1C]" />
      </div>

      {/* Charts */}
      <div className="flex gap-4 flex-wrap lg:flex-nowrap">
        <div className="flex-[60] min-w-[400px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Onboarding Volume (Last 12 Months)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={onboardingVolume} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="onbGold" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4A017" stopOpacity={0.15} /><stop offset="95%" stopColor="#D4A017" stopOpacity={0} /></linearGradient>
                  <linearGradient id="onbGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1B7A43" stopOpacity={0.15} /><stop offset="95%" stopColor="#1B7A43" stopOpacity={0} /></linearGradient>
                  <linearGradient id="onbRed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#B91C1C" stopOpacity={0.15} /><stop offset="95%" stopColor="#B91C1C" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#737373" }} />
                <YAxis tick={{ fontSize: 12, fill: "#737373" }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="initiated" stroke="#D4A017" strokeWidth={2} fill="url(#onbGold)" name="Initiated" />
                <Area type="monotone" dataKey="completed" stroke="#1B7A43" strokeWidth={2} fill="url(#onbGreen)" name="Completed" />
                <Area type="monotone" dataKey="overdue" stroke="#B91C1C" strokeWidth={2} fill="url(#onbRed)" name="Overdue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-[40] min-w-[300px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Avg Completion Time by Site (days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={onboardingBySite} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#737373" }} domain={[0, 14]} />
                <YAxis type="category" dataKey="site" tick={{ fontSize: 10, fill: "#737373" }} width={55} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="avgDays" name="Avg Days" fill="rgba(27,122,67,0.7)" stroke="#1B7A43" strokeWidth={1} radius={[0, 4, 4, 0]}>
                  {onboardingBySite.map((entry, index) => (
                    <Cell key={index} fill={entry.avgDays > 14 ? "rgba(185,28,28,0.7)" : entry.avgDays > 10 ? "rgba(194,122,6,0.7)" : "rgba(27,122,67,0.7)"} stroke={entry.avgDays > 14 ? "#B91C1C" : entry.avgDays > 10 ? "#C27A06" : "#1B7A43"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Onboardings Table */}
      <div className="bg-white border border-[#E5E4E0] rounded-[10px] p-5">
        <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Recent Onboardings</h3>
        <SortableTable
          columns={[
            { key: "employee", label: "Employee" },
            { key: "site", label: "Site" },
            { key: "initiatedDate", label: "Initiated Date" },
            { key: "completedDate", label: "Completed Date", render: (r) => <span>{(r as unknown as OnboardingRecord).completedDate ?? "—"}</span> },
            { key: "duration", label: "Duration (days)", render: (r) => <span>{(r as unknown as OnboardingRecord).duration ?? "—"}</span> },
            { key: "status", label: "Status", render: (r) => {
              const status = (r as unknown as OnboardingRecord).status;
              const colors: Record<string, string> = { "Completed": "text-[#1B7A43] bg-[#E8F5EC]", "In Progress": "text-[#C27A06] bg-[#FDF3E0]", "Pending Approval": "text-[#1E6BA3] bg-[#E8F2FA]", "Overdue": "text-[#B91C1C] bg-[#FEF2F2]" };
              return <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", colors[status] || "text-[#737373] bg-[#F4F3EF]")}>{status}</span>;
            }},
          ]}
          rows={recentOnboardings as unknown as Record<string, unknown>[]}
          sort={sort}
          onSort={setSort}
          keyExtractor={(row) => (row as unknown as OnboardingRecord).employee + (row as unknown as OnboardingRecord).initiatedDate}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 3 — OFFBOARDING PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════
function OffboardingTab() {
  const [sort, setSort] = useSort("employee");

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Avg Clearance Time" value={`${offboardingSummary.avgClearanceDays}d`} icon={TrendingDown} iconBg="#FDF3E0" iconColor="#C27A06" delay={0} subtext="Target: 21 days" subtextColor="text-[#C27A06]" />
        <StatCard label="Pending IT Clearance" value={offboardingSummary.pendingIT} icon={Monitor} iconBg="#F3E8FF" iconColor="#7C3AED" delay={80} subtext="Awaiting device return" subtextColor="text-[#7C3AED]" />
        <StatCard label="Pending Security" value={offboardingSummary.pendingSecurity} icon={AlertTriangle} iconBg="#E8F2FA" iconColor="#1E6BA3" delay={160} subtext="Access revocation" subtextColor="text-[#1E6BA3]" />
        <StatCard label="Completed This Month" value={offboardingSummary.completedThisMonth} icon={Check} iconBg="#E8F5EC" iconColor="#1B7A43" delay={240} subtext="Successfully cleared" subtextColor="text-[#1B7A43]" />
      </div>

      {/* Charts */}
      <div className="flex gap-4 flex-wrap lg:flex-nowrap">
        <div className="flex-[60] min-w-[400px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Offboarding Volume (Last 12 Months)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={offboardingVolume} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="ofbGold" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#B91C1C" stopOpacity={0.15} /><stop offset="95%" stopColor="#B91C1C" stopOpacity={0} /></linearGradient>
                  <linearGradient id="ofbGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1B7A43" stopOpacity={0.15} /><stop offset="95%" stopColor="#1B7A43" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#737373" }} />
                <YAxis tick={{ fontSize: 12, fill: "#737373" }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="initiated" stroke="#B91C1C" strokeWidth={2} fill="url(#ofbGold)" name="Initiated" />
                <Area type="monotone" dataKey="completed" stroke="#1B7A43" strokeWidth={2} fill="url(#ofbGreen)" name="Completed" />
                <Area type="monotone" dataKey="overdue" stroke="#737373" strokeWidth={2} fill="rgba(115,115,115,0.1)" name="Overdue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-[40] min-w-[300px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Avg Clearance Time by Site (days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={offboardingBySite} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#737373" }} />
                <YAxis type="category" dataKey="site" tick={{ fontSize: 10, fill: "#737373" }} width={55} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="avgDays" name="Avg Days" fill="rgba(185,28,28,0.7)" stroke="#B91C1C" strokeWidth={1} radius={[0, 4, 4, 0]}>
                  {offboardingBySite.map((entry, index) => (
                    <Cell key={index} fill={entry.avgDays > 21 ? "rgba(185,28,28,0.7)" : "rgba(194,122,6,0.7)"} stroke={entry.avgDays > 21 ? "#B91C1C" : "#C27A06"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Offboardings Table */}
      <div className="bg-white border border-[#E5E4E0] rounded-[10px] p-5">
        <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Recent Offboardings</h3>
        <SortableTable
          columns={[
            { key: "employee", label: "Employee" },
            { key: "site", label: "Site" },
            { key: "initiatedDate", label: "Initiated Date" },
            { key: "lastWorkingDay", label: "Last Working Day" },
            { key: "currentStage", label: "Current Stage" },
            { key: "daysInProcess", label: "Days in Process" },
          ]}
          rows={recentOffboardings as unknown as Record<string, unknown>[]}
          sort={sort}
          onSort={setSort}
          keyExtractor={(row) => (row as unknown as OffboardingRecord).employee + (row as unknown as OffboardingRecord).initiatedDate}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 4 — TRANSFERS
// ═══════════════════════════════════════════════════════════════════════════════
function TransfersTab() {
  const [sort, setSort] = useSort("employee");

  // Build site-to-site flow matrix data
  const siteNames = ["Head Office", "Harare", "Walden", "Peladillo", "Pickstone", "Chanton", "Amaveni", "Commoner", "Amatola", "Shamva", "Carry"];
  const shortNames = ["HO", "HR", "WD", "PL", "PK", "CH", "AM", "CM", "AT", "SH", "CY"];

  // Create transfer flow counts
  const flowData = [
    { from: "Head Office", to: "Pickstone", count: 2 },
    { from: "Head Office", to: "Peladillo", count: 1 },
    { from: "Amatola", to: "Peladillo", count: 2 },
    { from: "Pickstone", to: "Chanton", count: 2 },
    { from: "Pickstone", to: "Amaveni", count: 1 },
    { from: "Amaveni", to: "Pickstone", count: 2 },
    { from: "Harare", to: "Carry", count: 1 },
    { from: "Walden", to: "Harare", count: 1 },
    { from: "Peladillo", to: "Chanton", count: 1 },
    { from: "Peladillo", to: "Pickstone", count: 1 },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total This Year" value={transferSummary.totalThisYear} icon={ArrowLeftRight} iconBg="#E8F2FA" iconColor="#1E6BA3" delay={0} subtext="Cross-site movements" subtextColor="text-[#1E6BA3]" />
        <StatCard label="Pending Approval" value={transferSummary.pendingApproval} icon={AlertTriangle} iconBg="#FDF3E0" iconColor="#C27A06" delay={80} subtext="Awaiting clearance" subtextColor="text-[#C27A06]" />
        <StatCard label="Avg Processing Time" value={`${transferSummary.avgProcessingDays}d`} icon={TrendingUp} iconBg="#E8F5EC" iconColor="#1B7A43" delay={160} subtext="Target: 21 days" subtextColor="text-[#1B7A43]" />
      </div>

      {/* Charts */}
      <div className="flex gap-4 flex-wrap lg:flex-nowrap">
        <div className="flex-[60] min-w-[400px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Transfer Volume by Month</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transferVolume} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="trfBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1E6BA3" stopOpacity={0.15} /><stop offset="95%" stopColor="#1E6BA3" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#737373" }} />
                <YAxis tick={{ fontSize: 12, fill: "#737373" }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="initiated" stroke="#1E6BA3" strokeWidth={2} fill="url(#trfBlue)" name="Initiated" />
                <Area type="monotone" dataKey="completed" stroke="#1B7A43" strokeWidth={2} fill="rgba(27,122,67,0.1)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transfer Flow Matrix */}
        <div className="flex-[40] min-w-[300px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Transfer Flow (Origin → Destination)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#E5E4E0]">
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-[#525252]">From \ To</th>
                  {shortNames.map((s) => (
                    <th key={s} className="px-1 py-2 text-center text-[10px] font-semibold text-[#525252]">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {siteNames.map((from, i) => (
                  <tr key={from} className="border-b border-[#E5E4E0] hover:bg-[#FAFAF8]">
                    <td className="px-2 py-1.5 font-medium text-[#1A1A1A] whitespace-nowrap" title={from}>{shortNames[i]}</td>
                    {siteNames.map((to, _j) => {
                      const flow = flowData.find((f) => f.from === from && f.to === to);
                      const count = flow?.count ?? 0;
                      return (
                        <td key={to} className={cn("px-1 py-1.5 text-center", count > 0 ? "font-bold text-[#1A1A1A] bg-[rgba(30,107,163,0.15)]" : "text-[#9C9C9C]")}>
                          {count > 0 ? count : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[10px] text-[#525252]">
              {siteNames.map((s, i) => (
                <span key={s}><strong>{shortNames[i]}</strong> = {s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transfers Table */}
      <div className="bg-white border border-[#E5E4E0] rounded-[10px] p-5">
        <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Recent Transfers</h3>
        <SortableTable
          columns={[
            { key: "employee", label: "Employee" },
            { key: "originSite", label: "Origin Site" },
            { key: "destinationSite", label: "Destination Site" },
            { key: "initiatedDate", label: "Initiated Date" },
            { key: "status", label: "Status", render: (r) => {
              const status = (r as unknown as TransferRecord).status;
              return <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", status === "Completed" ? "text-[#1B7A43] bg-[#E8F5EC]" : "text-[#1E6BA3] bg-[#E8F2FA]")}>{status}</span>;
            }},
            { key: "daysInProcess", label: "Days in Process" },
          ]}
          rows={recentTransfers as unknown as Record<string, unknown>[]}
          sort={sort}
          onSort={setSort}
          keyExtractor={(row) => (row as unknown as TransferRecord).employee + (row as unknown as TransferRecord).initiatedDate}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 5 — HARDWARE & IT
// ═══════════════════════════════════════════════════════════════════════════════
function HardwareTab() {
  const [sort, setSort] = useSort("type");

  // Transform hardwareBySite for stacked bar
  const stackedHardwareData = useMemo(() => {
    return hardwareBySite.map((s) => ({
      site: s.site,
      Laptop: s.laptops,
      Monitor: s.monitors,
      Phone: s.phones,
      Printer: s.printers,
      Radio: s.radios,
      Other: s.other,
    }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total Hardware" value={hardwareSummary.totalItems} icon={Monitor} iconBg="rgba(212,160,23,0.12)" iconColor="#D4A017" delay={0} subtext="All IT assets" />
        <StatCard label="Laptops Assigned" value={hardwareSummary.laptopsAssigned} icon={Monitor} iconBg="#E8F2FA" iconColor="#1E6BA3" delay={80} subtext={`${Math.round((hardwareSummary.laptopsAssigned / hardwareSummary.totalItems) * 100)}% of inventory`} subtextColor="text-[#1E6BA3]" />
        <StatCard label="Phones Assigned" value={hardwareSummary.phonesAssigned} icon={Monitor} iconBg="#E8F5EC" iconColor="#1B7A43" delay={160} subtext="Active devices" />
        <StatCard label="Pending Provisioning" value={hardwareSummary.pendingProvisioning} icon={AlertTriangle} iconBg="#FDF3E0" iconColor="#C27A06" delay={240} subtext="Awaiting setup" subtextColor="text-[#C27A06]" />
        <StatCard label="Due for Return" value={hardwareSummary.devicesDueReturn} icon={UserMinus} iconBg="#FEF2F2" iconColor="#B91C1C" delay={320} subtext="Offboarding employees" subtextColor="text-[#B91C1C]" />
      </div>

      {/* Charts */}
      <div className="flex gap-4 flex-wrap lg:flex-nowrap">
        <div className="flex-1 min-w-[350px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Hardware by Type</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hardwareByType} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" />
                <XAxis dataKey="type" tick={{ fontSize: 12, fill: "#737373" }} />
                <YAxis tick={{ fontSize: 12, fill: "#737373" }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                  {hardwareByType.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.7} stroke={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-1 min-w-[350px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Hardware by Site</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedHardwareData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" />
                <XAxis dataKey="site" tick={{ fontSize: 10, fill: "#737373" }} angle={-30} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 12, fill: "#737373" }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Laptop" stackId="hw" fill="rgba(212,160,23,0.7)" stroke="#D4A017" />
                <Bar dataKey="Monitor" stackId="hw" fill="rgba(30,107,163,0.7)" stroke="#1E6BA3" />
                <Bar dataKey="Phone" stackId="hw" fill="rgba(27,122,67,0.7)" stroke="#1B7A43" />
                <Bar dataKey="Printer" stackId="hw" fill="rgba(194,122,6,0.7)" stroke="#C27A06" />
                <Bar dataKey="Radio" stackId="hw" fill="rgba(185,28,28,0.7)" stroke="#B91C1C" />
                <Bar dataKey="Other" stackId="hw" fill="rgba(156,156,156,0.7)" stroke="#9C9C9C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* M365 + Table Row */}
      <div className="flex gap-4 flex-wrap lg:flex-nowrap">
        <div className="w-[300px] shrink-0 bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">M365 Account Status</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={m365Status} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" strokeWidth={2} stroke="#fff">
                  {m365Status.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<DonutTooltip />} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hardware Inventory Table */}
        <div className="flex-1 min-w-[400px] bg-white border border-[#E5E4E0] rounded-[10px] p-5">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Hardware Inventory</h3>
          <SortableTable
            columns={[
              { key: "type", label: "Item Type" },
              { key: "employee", label: "Assigned To" },
              { key: "serial", label: "Serial Number" },
              { key: "site", label: "Site" },
              { key: "issueDate", label: "Issue Date" },
              { key: "status", label: "Status", render: (r) => {
                const status = (r as unknown as HardwareItem).status;
                return <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", status === "Active" ? "text-[#1B7A43] bg-[#E8F5EC]" : status === "Due for return" ? "text-[#B91C1C] bg-[#FEF2F2]" : "text-[#737373] bg-[#F4F3EF]")}>{status}</span>;
              }},
            ]}
            rows={hardwareInventory as unknown as Record<string, unknown>[]}
            sort={sort}
            onSort={setSort}
            keyExtractor={(row) => (row as unknown as HardwareItem).serial}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 6 — DOCUMENT EXPIRY ALERTS
// ═══════════════════════════════════════════════════════════════════════════════
function DocumentsTab({ addToast }: { addToast: (msg: string, type: Toast["type"]) => void }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useSort("daysRemaining");

  const filtered = useMemo(() => {
    let data = [...documentExpiryAlerts];
    if (statusFilter !== "all") {
      data = data.filter((d) => {
        if (statusFilter === "critical") return d.severity === "critical";
        if (statusFilter === "warning") return d.severity === "warning";
        if (statusFilter === "good") return d.severity === "good";
        if (statusFilter === "unknown") return d.severity === "unknown";
        return true;
      });
    }
    return data;
  }, [statusFilter]);

  const severityCounts = documentSeveritySummary;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return { text: "Expired", class: "text-[#B91C1C] bg-[#FEF2F2]" };
      case "warning": return { text: "Expiring Soon", class: "text-[#C27A06] bg-[#FDF3E0]" };
      case "good": return { text: "Valid", class: "text-[#1B7A43] bg-[#E8F5EC]" };
      case "unknown": return { text: "Not Uploaded", class: "text-[#737373] bg-[#F4F3EF]" };
      default: return { text: severity, class: "text-[#737373] bg-[#F4F3EF]" };
    }
  };

  const getDaysColor = (days: number, severity: string) => {
    if (severity === "unknown") return "text-[#737373]";
    if (days < 0) return "text-[#B91C1C]";
    if (days <= 30) return "text-[#C27A06]";
    return "text-[#1B7A43]";
  };

  return (
    <div className="space-y-4">
      {/* Severity Summary Cards */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[150px] bg-white border border-[#B91C1C] rounded-[10px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
            <span className="text-[24px] font-bold text-[#B91C1C]">{severityCounts.critical}</span>
          </div>
          <p className="text-[12px] text-[#737373] uppercase tracking-[0.08em]">Critical (Expired)</p>
        </div>
        <div className="flex-1 min-w-[150px] bg-white border border-[#C27A06] rounded-[10px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-[#C27A06]" />
            <span className="text-[24px] font-bold text-[#C27A06]">{severityCounts.warning}</span>
          </div>
          <p className="text-[12px] text-[#737373] uppercase tracking-[0.08em]">Warning (&lt; 30 days)</p>
        </div>
        <div className="flex-1 min-w-[150px] bg-white border border-[#1B7A43] rounded-[10px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-[#1B7A43]" />
            <span className="text-[24px] font-bold text-[#1B7A43]">{severityCounts.good}</span>
          </div>
          <p className="text-[12px] text-[#737373] uppercase tracking-[0.08em]">Good (Valid)</p>
        </div>
        <div className="flex-1 min-w-[150px] bg-white border border-[#9C9C9C] rounded-[10px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <X className="w-5 h-5 text-[#9C9C9C]" />
            <span className="text-[24px] font-bold text-[#9C9C9C]">{severityCounts.unknown}</span>
          </div>
          <p className="text-[12px] text-[#737373] uppercase tracking-[0.08em]">Unknown (No Doc)</p>
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-white border border-[#E5E4E0] rounded-[10px] p-5">
        <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Document Alerts</h3>
        <div className="space-y-3">
          {documentExpiryAlerts.filter((d) => d.severity === "critical" || d.severity === "warning").map((alert) => {
            const badge = getSeverityBadge(alert.severity);
            return (
              <div key={alert.code + alert.documentType} className={cn("flex items-start gap-4 p-4 rounded-lg border bg-white", alert.severity === "critical" ? "border-l-4 border-l-[#B91C1C]" : "border-l-4 border-l-[#C27A06]")}>
                <div className="w-10 h-10 rounded-full bg-[rgba(212,160,23,0.12)] flex items-center justify-center shrink-0 text-[14px] font-bold text-[#D4A017]">
                  {alert.employee.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-semibold text-[#1A1A1A]">{alert.employee}</span>
                    <span className="text-[11px] text-[#9C9C9C]">{alert.code}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", badge.class)}>{badge.text}</span>
                  </div>
                  <p className="text-[13px] text-[#525252] mb-1">{alert.documentType} expires <span className="font-medium">{alert.expiryDate}</span> <span className={cn("font-semibold", getDaysColor(alert.daysRemaining, alert.severity))}>({alert.daysRemaining < 0 ? `${Math.abs(alert.daysRemaining)} days overdue` : `${alert.daysRemaining} days remaining`})</span></p>
                  <p className="text-[12px] text-[#9C9C9C]">{alert.site} · {alert.department}</p>
                </div>
                <button onClick={() => addToast(`Notification sent to ${alert.employee}`, "success")} className="px-3 py-1.5 text-[12px] font-medium text-[#D4A017] border border-[#D4A017] rounded-md hover:bg-[rgba(212,160,23,0.08)] transition-colors shrink-0 flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Notify
                </button>
              </div>
            );
          })}
          {documentExpiryAlerts.filter((d) => d.severity === "critical" || d.severity === "warning").length === 0 && (
            <div className="text-center py-8 text-[#9C9C9C]">No alerts to display</div>
          )}
        </div>
      </div>

      {/* Full Table with Filters */}
      <div className="bg-white border border-[#E5E4E0] rounded-[10px] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A]">All Document Statuses</h3>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-[36px] px-3 text-[13px] border border-[#E5E4E0] rounded-md bg-[#FAFAF8] text-[#525252] focus:border-[#D4A017] focus:outline-none">
            <option value="all">All Statuses</option>
            <option value="critical">Expired</option>
            <option value="warning">Expiring Soon</option>
            <option value="good">Valid</option>
            <option value="unknown">Not Uploaded</option>
          </select>
        </div>
        <SortableTable
          columns={[
            { key: "employee", label: "Employee" },
            { key: "documentType", label: "Document Type" },
            { key: "uploadDate", label: "Upload Date", render: (r) => <span>{(r as unknown as DocumentExpiryAlert).uploadDate || "—"}</span> },
            { key: "expiryDate", label: "Expiry Date", render: (r) => <span>{(r as unknown as DocumentExpiryAlert).expiryDate || "—"}</span> },
            { key: "daysRemaining", label: "Days Remaining", render: (r) => {
              const d = r as unknown as DocumentExpiryAlert;
              return <span className={cn("font-medium", getDaysColor(d.daysRemaining, d.severity))}>{d.severity === "unknown" ? "—" : d.daysRemaining < 0 ? `${d.daysRemaining}` : d.daysRemaining}</span>;
            }},
            { key: "severity", label: "Status", render: (r) => {
              const badge = getSeverityBadge((r as unknown as DocumentExpiryAlert).severity);
              return <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", badge.class)}>{badge.text}</span>;
            }},
          ]}
          rows={filtered as unknown as Record<string, unknown>[]}
          sort={sort}
          onSort={setSort}
          keyExtractor={(row) => (row as unknown as DocumentExpiryAlert).code + (row as unknown as DocumentExpiryAlert).documentType}
        />
      </div>
    </div>
  );
}

// Type imports needed for the SortableTable
import type { OnboardingRecord, OffboardingRecord, TransferRecord, HardwareItem, DocumentExpiryAlert, CensusBySite } from "@/data/reportData";
