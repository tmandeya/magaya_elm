import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, UserPlus, UserMinus, ArrowLeftRight, Building2, BarChart3, ShieldCheck, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { roleDefinitions } from "@/lib/uiConstants";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem { label: string; icon: React.ElementType; path: string; navKey: string; }
interface NavSection { label: string; items: NavItem[]; }

const navSections: NavSection[] = [
  { label: "Main", items: [{ label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", navKey: "dashboard" }] },
  { label: "Employee Lifecycle", items: [
    { label: "Employee Master Data", icon: Users, path: "/employees", navKey: "employees" },
    { label: "Onboarding Hub", icon: UserPlus, path: "/onboarding", navKey: "onboarding" },
    { label: "Offboarding Hub", icon: UserMinus, path: "/offboarding", navKey: "offboarding" },
    { label: "Transfer Hub", icon: ArrowLeftRight, path: "/transfers", navKey: "transfers" },
  ]},
  { label: "Administration", items: [
    { label: "Sites", icon: Building2, path: "/sites", navKey: "sites" },
    { label: "Reports", icon: BarChart3, path: "/reports", navKey: "reports" },
    { label: "Audit Logs", icon: ShieldCheck, path: "/audit-logs", navKey: "audit-logs" },
    { label: "Settings", icon: Settings, path: "/settings", navKey: "settings" },
  ]},
];

function getRoleNavItems(role: UserRole | null): string[] {
  if (!role) return [];
  const roleDef = roleDefinitions.find((r) => r.id === role);
  return roleDef?.navItems ?? [];
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { currentRole } = useAuth();
  const location = useLocation();
  const allowedNavKeys = useMemo(() => getRoleNavItems(currentRole), [currentRole]);
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside className={cn("shrink-0 bg-[#1A1A1A] flex flex-col transition-all duration-300 ease-sidebar overflow-hidden self-stretch", collapsed ? "w-sidebar-collapsed" : "w-sidebar")}>
      <div className="h-[56px] bg-white flex items-center justify-center shrink-0 border-b border-[#E5E4E0]">
        <img src="/magaya_logo.png" alt="Magaya Mining" className={cn("h-[40px] object-contain transition-all duration-300", collapsed ? "w-[40px]" : "w-auto")} />
      </div>
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => allowedNavKeys.includes(item.navKey));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label} className="mb-6">
              {!collapsed && <p className="px-4 mb-2 text-[10px] font-medium uppercase tracking-wider text-[#9C9C9C]">{section.label}</p>}
              <ul>
                {visibleItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <Link to={item.path} className={cn("relative flex items-center transition-all duration-200 group", collapsed ? "justify-center px-0 py-3" : "px-4 py-3", active ? "bg-[rgba(212,160,23,0.12)] text-white" : "text-[#9C9C9C] hover:bg-[rgba(212,160,23,0.08)] hover:text-white")} title={collapsed ? item.label : undefined}>
                        {active && <span className="absolute left-0 top-0 h-full w-[3px] bg-[#D4A017]" />}
                        <item.icon className={cn("shrink-0 transition-colors duration-200", active ? "text-[#D4A017]" : "text-[#9C9C9C] group-hover:text-[#D4A017]", collapsed ? "w-5 h-5" : "w-[18px] h-[18px] mr-3")} />
                        {!collapsed && <span className="text-[13px] font-medium leading-tight truncate">{item.label}</span>}
                        {collapsed && <span className="absolute left-full ml-2 px-2 py-1 bg-[#2A2A2A] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <button onClick={() => setCollapsed(!collapsed)} className="h-[40px] bg-[#222222] flex items-center justify-center text-[#9C9C9C] hover:text-white hover:bg-[#2A2A2A] transition-colors duration-200 shrink-0" title={collapsed ? "Expand" : "Collapse"}>
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-2"><ChevronLeft className="w-4 h-4" /><span className="text-xs">Collapse</span></div>}
      </button>
    </aside>
  );
}
