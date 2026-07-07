import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, UserMinus, ArrowLeftRight, ClipboardCheck, RefreshCw, Download, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>;
}
function Monitor(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>;
}

interface KPICardProps { title: string; value: number; trend: number; icon: React.ElementType; iconBg: string; iconColor: string; valueColor: string; onClick: () => void; delay: number; }

function KPICard({ title, value, trend, icon: Icon, iconBg, iconColor, valueColor, onClick, delay }: KPICardProps) {
  const [count, setCount] = useState(0);
  useState(() => {
    const duration = 800, steps = 30, increment = value / steps;
    let current = 0;
    const timer = setInterval(() => { current += increment; if (current >= value) { setCount(value); clearInterval(timer); } else setCount(Math.floor(current)); }, duration / steps);
    return () => clearInterval(timer);
  });
  return (
    <button onClick={onClick} className="flex-1 min-w-[200px] bg-white border border-[#E5E4E0] rounded-card p-5 text-left hover:border-[#C4C3BF] hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 ease-out animate-fade-in-up" style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: iconBg }}><Icon className="w-5 h-5" style={{ color: iconColor }} /></div>
        <span className="text-[32px] font-bold leading-none tracking-[-0.02em]" style={{ color: valueColor }}>{count}</span>
      </div>
      <p className="text-[12px] text-[#737373] uppercase tracking-[0.08em] mb-2">{title}</p>
      <div className="flex items-center gap-1">
        {trend > 0 ? <TrendingUp className="w-3 h-3 text-[#1B7A43]" /> : trend < 0 ? <TrendingDown className="w-3 h-3 text-[#B91C1C]" /> : null}
        {trend !== 0 ? (
          <><span className={cn("text-[12px] font-medium", trend > 0 ? "text-[#1B7A43]" : "text-[#B91C1C]")}>{trend > 0 ? "+" : ""}{trend}%</span><span className="text-[11px] text-[#9C9C9C] ml-0.5">vs last period</span></>
        ) : (
          <span className="text-[11px] text-[#9C9C9C]">Live from database</span>
        )}
      </div>
    </button>
  );
}

const DONUT_COLORS = { onboarding: "#D4A017", offboarding: "#B91C1C", transfers: "#1E6BA3", completed: "#1B7A43" };


function getKPICards(_role: UserRole | null, navigate: ReturnType<typeof useNavigate>, kpi: { activeEmployees: number; onboardingInProgress: number; offboardingPending: number; transfersThisMonth: number; pendingApprovals: number }): KPICardProps[] {
  const base: KPICardProps[] = [
    { title: "Active Employees", value: kpi.activeEmployees, trend: 0, icon: Users, iconBg: "#E8F5EC", iconColor: "#1B7A43", valueColor: "#1A1A1A", onClick: () => navigate("/employees"), delay: 0 },
    { title: "Onboarding in Progress", value: kpi.onboardingInProgress, trend: 0, icon: UserPlus, iconBg: "#FDF3E0", iconColor: "#C27A06", valueColor: "#C27A06", onClick: () => navigate("/onboarding"), delay: 80 },
    { title: "Pending Offboardings", value: kpi.offboardingPending, trend: 0, icon: UserMinus, iconBg: "#FEF2F2", iconColor: "#B91C1C", valueColor: "#B91C1C", onClick: () => navigate("/offboarding"), delay: 160 },
    { title: "Transfers This Month", value: kpi.transfersThisMonth, trend: 0, icon: ArrowLeftRight, iconBg: "#E8F2FA", iconColor: "#1E6BA3", valueColor: "#1E6BA3", onClick: () => navigate("/transfers"), delay: 240 },
    { title: "Pending Approvals", value: kpi.pendingApprovals, trend: 0, icon: ClipboardCheck, iconBg: "rgba(212,160,23,0.12)", iconColor: "#D4A017", valueColor: "#D4A017", onClick: () => navigate("/onboarding"), delay: 320 },
  ];
  return base;
}


export default function Dashboard() {
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const { kpi, workflowStats, pendingTasks, recentOnboarding, recentOffboarding, siteOverview, loading, refetch } = useDashboard();
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "90d">("30d");
  const kpiCards = useMemo(() => getKPICards(currentRole, navigate, kpi), [currentRole, navigate, kpi]);
  const totalWorkflows = workflowStats.onboarding + workflowStats.offboarding + workflowStats.transfers + workflowStats.completed;
  const pieData = totalWorkflows > 0 ? [
    { name: "Onboarding", value: workflowStats.onboarding, color: DONUT_COLORS.onboarding },
    { name: "Offboarding", value: workflowStats.offboarding, color: DONUT_COLORS.offboarding },
    { name: "Transfers", value: workflowStats.transfers, color: DONUT_COLORS.transfers },
    { name: "Completed", value: workflowStats.completed, color: DONUT_COLORS.completed },
  ] : [{ name: "No workflows yet", value: 1, color: "#E5E4E0" }];
  const hqRoles: UserRole[] = ["hq_hr", "hod_hr", "hq_admin", "hod_security", "hq_it", "hod_it"];
  const showSiteOverview = currentRole ? hqRoles.includes(currentRole) : false;
  const dateRanges = [{ key: "today" as const, label: "Today" }, { key: "7d" as const, label: "Last 7 Days" }, { key: "30d" as const, label: "Last 30 Days" }, { key: "90d" as const, label: "Last 90 Days" }];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#E5E4E0] border-t-[#D4A017] rounded-full animate-spin" />
        <p className="text-[13px] text-[#9C9C9C]">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-2">
          {dateRanges.map((range) => (
            <button key={range.key} onClick={() => setDateRange(range.key)} className={cn("px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150", dateRange === range.key ? "bg-[#D4A017] text-white border border-[#D4A017]" : "bg-transparent text-[#525252] border border-[#E5E4E0] hover:bg-[#FAFAF8]")}>{range.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-[#525252] hover:bg-[#FAFAF8] hover:text-[#D4A017] transition-colors" onClick={() => { void refetch(); }}><RefreshCw className="w-[18px] h-[18px]" /></button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E4E0] text-[12px] font-medium text-[#525252] hover:border-[#D4A017] hover:text-[#D4A017] transition-colors"><Download className="w-[14px] h-[14px]" />Export</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {kpiCards.map((card) => <KPICard key={card.title} {...card} />)}
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        <div className="flex-[3] bg-white border border-[#E5E4E0] rounded-card p-5 animate-fade-in-up relative" style={{ animationDelay: "300ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Workflow Status</h3>
            <button onClick={() => navigate("/reports")} className="text-[12px] text-[#D4A017] font-medium hover:underline">View all</button>
          </div>
          <div className="h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270} animationBegin={300} animationDuration={800}>{pieData.map((entry, index) => <Cell key={index} fill={entry.color} strokeWidth={0} />)}</Pie></PieChart></ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-[24px] font-bold text-[#1A1A1A]">{totalWorkflows}</span><span className="text-[11px] text-[#737373]">Total</span></div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            {totalWorkflows > 0 ? pieData.map((item) => <div key={item.name} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-[12px] text-[#525252]">{item.name}</span><span className="text-[12px] font-semibold text-[#1A1A1A]">{item.value}</span></div>) : <span className="text-[12px] text-[#9C9C9C]">No workflows yet — they will appear here once onboarding, offboarding or transfers begin</span>}
          </div>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#E5E4E0]">
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1B7A43]" /><span className="text-[12px] text-[#525252]">Completed today: <strong className="text-[#1A1A1A]">{workflowStats.completedToday}</strong></span></div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#C27A06]" /><span className="text-[12px] text-[#525252]">In progress: <strong className="text-[#1A1A1A]">{workflowStats.inProgress}</strong></span></div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" /><span className="text-[12px] text-[#525252]">Overdue: <strong className="text-[#B91C1C]">{workflowStats.overdue}</strong></span></div>
          </div>
        </div>

        <div className="flex-[2] bg-white border border-[#E5E4E0] rounded-card p-5 animate-fade-in-up" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Pending Your Action</h3>
            {pendingTasks.length > 0 && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF2F2] text-[#B91C1C]">{pendingTasks.length}</span>}
          </div>
          <div className="max-h-[340px] overflow-y-auto pr-1">
            {pendingTasks.length === 0 && (
              <div className="py-10 text-center">
                <ClipboardCheck className="w-8 h-8 text-[#C4C3BF] mx-auto mb-2" />
                <p className="text-[13px] font-medium text-[#1A1A1A]">You're all caught up</p>
                <p className="text-[12px] text-[#9C9C9C] mt-0.5">Tasks assigned to you will appear here</p>
              </div>
            )}
            <div className="divide-y divide-[#E5E4E0]">
              {pendingTasks.map((task, index) => {
                const iconConfig: Record<string, { icon: React.ElementType; bg: string; color: string }> = { onboarding: { icon: UserPlus, bg: "#FDF3E0", color: "#C27A06" }, offboarding: { icon: UserMinus, bg: "#FEF2F2", color: "#B91C1C" }, transfer: { icon: ArrowLeftRight, bg: "#E8F2FA", color: "#1E6BA3" }, security: { icon: ShieldCheck, bg: "#E8F2FA", color: "#1E6BA3" }, it: { icon: Monitor, bg: "#F3E8FF", color: "#7C3AED" }, approval: { icon: ClipboardCheck, bg: "rgba(212,160,23,0.12)", color: "#D4A017" } };
                const cfg = iconConfig[task.workflowType] ?? iconConfig.approval;
                const TaskIcon = cfg.icon;
                return (
                  <div key={task.id} className="flex items-start gap-3 py-3 animate-fade-in-up" style={{ animationDelay: `${500 + index * 60}ms`, animationFillMode: "backwards" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cfg.bg }}><TaskIcon className="w-4 h-4" style={{ color: cfg.color }} /></div>
                    <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-[#1A1A1A] leading-snug">{task.title}</p><p className="text-[12px] text-[#525252] mt-0.5">{task.description}</p><p className="text-[11px] text-[#9C9C9C] mt-0.5">{new Date(task.createdAt).toLocaleString()}</p></div>
                    <button onClick={() => navigate(task.workflowType === "offboarding" ? "/offboarding" : task.workflowType === "transfer" ? "/transfers" : "/onboarding")} className="text-[11px] font-semibold text-[#D4A017] hover:underline shrink-0 mt-0.5">Review</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        <div className="flex-1 bg-white border border-[#E5E4E0] rounded-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "500ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E0]"><h3 className="text-[16px] font-semibold text-[#1A1A1A]">Recent Onboarding</h3><button onClick={() => navigate("/onboarding")} className="text-[12px] text-[#D4A017] font-medium hover:underline">View all</button></div>
          {recentOnboarding.length === 0 && (
            <div className="py-10 text-center"><p className="text-[13px] text-[#9C9C9C]">No onboarding workflows yet</p></div>
          )}
          <div className="divide-y divide-[#E5E4E0]">
            {recentOnboarding.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#FAFAF8] transition-colors cursor-pointer animate-fade-in-up" style={{ animationDelay: `${600 + index * 50}ms`, animationFillMode: "backwards" }} onClick={() => navigate(`/onboarding/${item.id}`)}>
                <div className="w-7 h-7 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[10px] font-semibold shrink-0">{item.employee.split(" ").map((n) => n[0]).join("")}</div>
                <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-[#1A1A1A] truncate">{item.employee}</p><p className="text-[12px] text-[#525252]">{item.site}</p></div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 bg-[#FDF3E0] text-[#C27A06]">{item.progress}%</span>
                <div className="w-[60px] shrink-0"><div className="h-1 bg-[#E5E4E0] rounded-full overflow-hidden"><div className="h-full bg-[#D4A017] rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }} /></div></div>
                <button className="text-[11px] text-[#D4A017] font-semibold hover:underline shrink-0">View</button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-white border border-[#E5E4E0] rounded-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "550ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E0]"><h3 className="text-[16px] font-semibold text-[#1A1A1A]">Recent Offboarding</h3><button onClick={() => navigate("/offboarding")} className="text-[12px] text-[#D4A017] font-medium hover:underline">View all</button></div>
          {recentOffboarding.length === 0 && (
            <div className="py-10 text-center"><p className="text-[13px] text-[#9C9C9C]">No offboarding workflows yet</p></div>
          )}
          <div className="divide-y divide-[#E5E4E0]">
            {recentOffboarding.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#FAFAF8] transition-colors cursor-pointer animate-fade-in-up" style={{ animationDelay: `${650 + index * 50}ms`, animationFillMode: "backwards" }} onClick={() => navigate(`/offboarding/${item.id}`)}>
                <div className="w-7 h-7 rounded-full bg-[#B91C1C] flex items-center justify-center text-white text-[10px] font-semibold shrink-0">{item.employee.split(" ").map((n) => n[0]).join("")}</div>
                <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-[#1A1A1A] truncate">{item.employee}</p><p className="text-[12px] text-[#525252]">{item.site}</p></div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 bg-[#FFF1F0] text-[#B91C1C]">{item.progress}%</span>
                <div className="w-[60px] shrink-0"><div className="h-1 bg-[#E5E4E0] rounded-full overflow-hidden"><div className="h-full bg-[#B91C1C] rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }} /></div></div>
                <button className="text-[11px] text-[#D4A017] font-semibold hover:underline shrink-0">View</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSiteOverview && (
        <div className="bg-white border border-[#E5E4E0] rounded-card p-5 animate-fade-in-up" style={{ animationDelay: "600ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between mb-4"><h3 className="text-[16px] font-semibold text-[#1A1A1A]">Site Overview</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-[#FAFAF8]">
                <th className="text-left px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Site</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1B7A43]">Active</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#C27A06]">Onboarding</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#B91C1C]">Offboarding</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1E6BA3]">Transfers</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#7C3AED]">IT Pending</th>
                <th className="text-center px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#1E4A73]">Security</th>
              </tr></thead>
              <tbody className="divide-y divide-[#E5E4E0]">
                {siteOverview.map((site, index) => (
                  <tr key={site.site} className="hover:bg-[#FAFAF8] transition-colors animate-fade-in-up" style={{ animationDelay: `${700 + index * 30}ms`, animationFillMode: "backwards" }}>
                    <td className="px-3 py-2.5 text-[12px] text-[#1A1A1A] font-medium">{site.site}</td>
                    <td className="text-center px-3 py-2.5"><button onClick={() => navigate("/employees")} className="text-[12px] font-semibold text-[#1B7A43] hover:underline">{site.active}</button></td>
                    <td className="text-center px-3 py-2.5"><button onClick={() => navigate("/onboarding")} className={cn("text-[12px] font-semibold hover:underline", site.onboarding > 0 ? "text-[#C27A06]" : "text-[#9C9C9C]")}>{site.onboarding}</button></td>
                    <td className="text-center px-3 py-2.5"><button onClick={() => navigate("/offboarding")} className={cn("text-[12px] font-semibold hover:underline", site.offboarding > 0 ? "text-[#B91C1C]" : "text-[#9C9C9C]")}>{site.offboarding}</button></td>
                    <td className="text-center px-3 py-2.5"><button onClick={() => navigate("/transfers")} className={cn("text-[12px] font-semibold hover:underline", site.transfers > 0 ? "text-[#1E6BA3]" : "text-[#9C9C9C]")}>{site.transfers}</button></td>
                    <td className="text-center px-3 py-2.5"><span className={cn("text-[12px] font-semibold", false ? "text-[#7C3AED]" : "text-[#9C9C9C]")}>0</span></td>
                    <td className="text-center px-3 py-2.5"><span className={cn("text-[12px] font-semibold", false ? "text-[#1E4A73]" : "text-[#9C9C9C]")}>0</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
