import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, UserMinus, ArrowLeftRight, ClipboardCheck, RefreshCw, Download, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { dashboardData } from "@/data/mockData";
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
        <span className={cn("text-[12px] font-medium", trend > 0 ? "text-[#1B7A43]" : trend < 0 ? "text-[#B91C1C]" : "text-[#737373]")}>{trend > 0 ? "+" : ""}{trend}%</span>
        <span className="text-[11px] text-[#9C9C9C] ml-0.5">vs last period</span>
      </div>
    </button>
  );
}

const DONUT_COLORS = { onboarding: "#D4A017", offboarding: "#B91C1C", transfers: "#1E6BA3", completed: "#1B7A43" };
const pieData = [
  { name: "Onboarding", value: dashboardData.workflowStatus.onboarding, color: DONUT_COLORS.onboarding },
  { name: "Offboarding", value: dashboardData.workflowStatus.offboarding, color: DONUT_COLORS.offboarding },
  { name: "Transfers", value: dashboardData.workflowStatus.transfers, color: DONUT_COLORS.transfers },
  { name: "Completed", value: dashboardData.workflowStatus.completed, color: DONUT_COLORS.completed },
];

function getKPICards(role: UserRole | null, navigate: ReturnType<typeof useNavigate>): KPICardProps[] {
  const base: KPICardProps[] = [
    { title: "Active Employees", value: dashboardData.kpi.activeEmployees, trend: dashboardData.kpi.activeEmployeesTrend, icon: Users, iconBg: "#E8F5EC", iconColor: "#1B7A43", valueColor: "#1A1A1A", onClick: () => navigate("/employees"), delay: 0 },
    { title: "Onboarding in Progress", value: dashboardData.kpi.onboardingInProgress, trend: dashboardData.kpi.onboardingTrend, icon: UserPlus, iconBg: "#FDF3E0", iconColor: "#C27A06", valueColor: "#C27A06", onClick: () => navigate("/onboarding"), delay: 80 },
    { title: "Pending Offboardings", value: dashboardData.kpi.offboardingPending, trend: dashboardData.kpi.offboardingTrend, icon: UserMinus, iconBg: "#FEF2F2", iconColor: "#B91C1C", valueColor: "#B91C1C", onClick: () => navigate("/offboarding"), delay: 160 },
    { title: "Transfers This Month", value: dashboardData.kpi.transfersPending, trend: dashboardData.kpi.transfersTrend, icon: ArrowLeftRight, iconBg: "#E8F2FA", iconColor: "#1E6BA3", valueColor: "#1E6BA3", onClick: () => navigate("/transfers"), delay: 240 },
    { title: "Pending Approvals", value: dashboardData.kpi.pendingApprovals, trend: dashboardData.kpi.approvalsTrend, icon: ClipboardCheck, iconBg: "rgba(212,160,23,0.12)", iconColor: "#D4A017", valueColor: "#D4A017", onClick: () => navigate("/onboarding"), delay: 320 },
  ];
  if (role === "site_security") return base.map(c => c.title === "Transfers This Month" ? { ...c, title: "Security Clearance Pending", value: 7, trend: 1.2, icon: ShieldCheck, iconBg: "#E8F2FA", iconColor: "#1E6BA3", valueColor: "#1E6BA3" } : c);
  if (role === "site_it") return base.map(c => c.title === "Transfers This Month" ? { ...c, title: "IT Provisioning Pending", value: 9, trend: 3.1, icon: Monitor, iconBg: "#F3E8FF", iconColor: "#7C3AED", valueColor: "#7C3AED" } : c);
  return base;
}

const onboardingStageColors: Record<string, string> = { "HR Initiation": "#E8F5EC", "Security Clearance": "#E8F2FA", "IT Provisioning": "#F3E8FF", "Admin Setup": "#FDF3E0", "HOD Acknowledgment": "#FFF7ED", "HR Completion": "#E8F5EC" };
const onboardingTextColors: Record<string, string> = { "HR Initiation": "#1B7A43", "Security Clearance": "#1E6BA3", "IT Provisioning": "#7C3AED", "Admin Setup": "#C27A06", "HOD Acknowledgment": "#C27A06", "HR Completion": "#1B7A43" };
const offboardingStageColors: Record<string, string> = { "HR Initiation": "#E8F5EC", "IT Clearance": "#F3E8FF", "Security Clearance": "#E8F2FA", "Admin Clearance": "#FDF3E0", "HOD Sign-off": "#FFF7ED", "HR Final Clearance": "#E8F5EC" };
const offboardingTextColors: Record<string, string> = { "HR Initiation": "#1B7A43", "IT Clearance": "#7C3AED", "Security Clearance": "#1E6BA3", "Admin Clearance": "#C27A06", "HOD Sign-off": "#C27A06", "HR Final Clearance": "#1B7A43" };

export default function Dashboard() {
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "90d">("30d");
  const kpiCards = useMemo(() => getKPICards(currentRole, navigate), [currentRole, navigate]);
  const totalWorkflows = pieData.reduce((sum, d) => sum + d.value, 0);
  const hqRoles: UserRole[] = ["hq_hr", "hod_hr", "hq_admin", "hod_security", "hq_it", "hod_it"];
  const showSiteOverview = currentRole ? hqRoles.includes(currentRole) : false;
  const dateRanges = [{ key: "today" as const, label: "Today" }, { key: "7d" as const, label: "Last 7 Days" }, { key: "30d" as const, label: "Last 30 Days" }, { key: "90d" as const, label: "Last 90 Days" }];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-2">
          {dateRanges.map((range) => (
            <button key={range.key} onClick={() => setDateRange(range.key)} className={cn("px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150", dateRange === range.key ? "bg-[#D4A017] text-white border border-[#D4A017]" : "bg-transparent text-[#525252] border border-[#E5E4E0] hover:bg-[#FAFAF8]")}>{range.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-[#525252] hover:bg-[#FAFAF8] hover:text-[#D4A017] transition-colors" onClick={() => window.location.reload()}><RefreshCw className="w-[18px] h-[18px]" /></button>
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
            {pieData.map((item) => <div key={item.name} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-[12px] text-[#525252]">{item.name}</span><span className="text-[12px] font-semibold text-[#1A1A1A]">{item.value}</span></div>)}
          </div>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#E5E4E0]">
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#1B7A43]" /><span className="text-[12px] text-[#525252]">Completed today: <strong className="text-[#1A1A1A]">8</strong></span></div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#C27A06]" /><span className="text-[12px] text-[#525252]">In progress: <strong className="text-[#1A1A1A]">12</strong></span></div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" /><span className="text-[12px] text-[#525252]">Overdue: <strong className="text-[#B91C1C]">3</strong></span></div>
          </div>
        </div>

        <div className="flex-[2] bg-white border border-[#E5E4E0] rounded-card p-5 animate-fade-in-up" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Pending Your Action</h3>
            {dashboardData.pendingTasks.length > 0 && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF2F2] text-[#B91C1C]">{dashboardData.pendingTasks.length}</span>}
          </div>
          <div className="max-h-[340px] overflow-y-auto pr-1">
            <div className="divide-y divide-[#E5E4E0]">
              {dashboardData.pendingTasks.map((task, index) => {
                const iconConfig: Record<string, { icon: React.ElementType; bg: string; color: string }> = { onboarding: { icon: UserPlus, bg: "#FDF3E0", color: "#C27A06" }, offboarding: { icon: UserMinus, bg: "#FEF2F2", color: "#B91C1C" }, transfer: { icon: ArrowLeftRight, bg: "#E8F2FA", color: "#1E6BA3" }, security: { icon: ShieldCheck, bg: "#E8F2FA", color: "#1E6BA3" }, it: { icon: Monitor, bg: "#F3E8FF", color: "#7C3AED" }, approval: { icon: ClipboardCheck, bg: "rgba(212,160,23,0.12)", color: "#D4A017" } };
                const cfg = iconConfig[task.type] ?? iconConfig.approval;
                const TaskIcon = cfg.icon;
                return (
                  <div key={task.id} className="flex items-start gap-3 py-3 animate-fade-in-up" style={{ animationDelay: `${500 + index * 60}ms`, animationFillMode: "backwards" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cfg.bg }}><TaskIcon className="w-4 h-4" style={{ color: cfg.color }} /></div>
                    <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-[#1A1A1A] leading-snug">{task.title}</p><p className="text-[12px] text-[#525252] mt-0.5">{task.description}</p><p className="text-[11px] text-[#9C9C9C] mt-0.5">{task.timeAgo}</p></div>
                    <button onClick={() => navigate(task.actionLink)} className="text-[11px] font-semibold text-[#D4A017] hover:underline shrink-0 mt-0.5">Review</button>
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
          <div className="divide-y divide-[#E5E4E0]">
            {dashboardData.recentOnboarding.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#FAFAF8] transition-colors cursor-pointer animate-fade-in-up" style={{ animationDelay: `${600 + index * 50}ms`, animationFillMode: "backwards" }} onClick={() => navigate(`/onboarding/${item.id}`)}>
                <div className="w-7 h-7 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[10px] font-semibold shrink-0">{item.employee.split(" ").map((n) => n[0]).join("")}</div>
                <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-[#1A1A1A] truncate">{item.employee}</p><p className="text-[12px] text-[#525252]">{item.site}</p></div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0" style={{ backgroundColor: onboardingStageColors[item.stage] ?? "#F4F3EF", color: onboardingTextColors[item.stage] ?? "#525252" }}>{item.stage}</span>
                <div className="w-[60px] shrink-0"><div className="h-1 bg-[#E5E4E0] rounded-full overflow-hidden"><div className="h-full bg-[#D4A017] rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }} /></div></div>
                <button className="text-[11px] text-[#D4A017] font-semibold hover:underline shrink-0">View</button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-white border border-[#E5E4E0] rounded-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "550ms", animationFillMode: "backwards" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E0]"><h3 className="text-[16px] font-semibold text-[#1A1A1A]">Recent Offboarding</h3><button onClick={() => navigate("/offboarding")} className="text-[12px] text-[#D4A017] font-medium hover:underline">View all</button></div>
          <div className="divide-y divide-[#E5E4E0]">
            {dashboardData.recentOffboarding.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#FAFAF8] transition-colors cursor-pointer animate-fade-in-up" style={{ animationDelay: `${650 + index * 50}ms`, animationFillMode: "backwards" }} onClick={() => navigate(`/offboarding/${item.id}`)}>
                <div className="w-7 h-7 rounded-full bg-[#B91C1C] flex items-center justify-center text-white text-[10px] font-semibold shrink-0">{item.employee.split(" ").map((n) => n[0]).join("")}</div>
                <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-[#1A1A1A] truncate">{item.employee}</p><p className="text-[12px] text-[#525252]">{item.site}</p></div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0" style={{ backgroundColor: offboardingStageColors[item.stage] ?? "#F4F3EF", color: offboardingTextColors[item.stage] ?? "#525252" }}>{item.stage}</span>
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
                {dashboardData.siteOverview.map((site, index) => (
                  <tr key={site.site} className="hover:bg-[#FAFAF8] transition-colors animate-fade-in-up" style={{ animationDelay: `${700 + index * 30}ms`, animationFillMode: "backwards" }}>
                    <td className="px-3 py-2.5 text-[12px] text-[#1A1A1A] font-medium">{site.site}</td>
                    <td className="text-center px-3 py-2.5"><button onClick={() => navigate("/employees")} className="text-[12px] font-semibold text-[#1B7A43] hover:underline">{site.active}</button></td>
                    <td className="text-center px-3 py-2.5"><button onClick={() => navigate("/onboarding")} className={cn("text-[12px] font-semibold hover:underline", site.onboarding > 0 ? "text-[#C27A06]" : "text-[#9C9C9C]")}>{site.onboarding}</button></td>
                    <td className="text-center px-3 py-2.5"><button onClick={() => navigate("/offboarding")} className={cn("text-[12px] font-semibold hover:underline", site.offboarding > 0 ? "text-[#B91C1C]" : "text-[#9C9C9C]")}>{site.offboarding}</button></td>
                    <td className="text-center px-3 py-2.5"><button onClick={() => navigate("/transfers")} className={cn("text-[12px] font-semibold hover:underline", site.transfers > 0 ? "text-[#1E6BA3]" : "text-[#9C9C9C]")}>{site.transfers}</button></td>
                    <td className="text-center px-3 py-2.5"><span className={cn("text-[12px] font-semibold", site.itPending > 0 ? "text-[#7C3AED]" : "text-[#9C9C9C]")}>{site.itPending}</span></td>
                    <td className="text-center px-3 py-2.5"><span className={cn("text-[12px] font-semibold", site.securityPending > 0 ? "text-[#1E4A73]" : "text-[#9C9C9C]")}>{site.securityPending}</span></td>
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
