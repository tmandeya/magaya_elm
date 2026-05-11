import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, User, Settings, MapPin, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { notifications, sites } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TopbarProps { title: string; breadcrumb?: { label: string; path?: string }[]; }

export default function Topbar({ title, breadcrumb }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState(sites[0]);
  const [unreadCount, setUnreadCount] = useState(notifications.filter((n) => !n.read).length);
  const siteRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (siteRef.current && !siteRef.current.contains(event.target as Node)) setSiteDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifDropdownOpen(false);
      if (userRef.current && !userRef.current.contains(event.target as Node)) setUserDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadgeColors = (role: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      site_admin: { bg: "#1A1A1A", text: "#D4A017" }, site_hr: { bg: "#FEF2F2", text: "#B91C1C" },
      site_security: { bg: "#E8F2FA", text: "#1E6BA3" }, site_it: { bg: "#F3E8FF", text: "#7C3AED" },
      hq_hr: { bg: "#FEF2F2", text: "#991B1B" }, hod_hr: { bg: "#FFF7ED", text: "#C27A06" },
      hq_admin: { bg: "#F0FDF4", text: "#166534" }, hod_security: { bg: "#E8F2FA", text: "#1E4A73" },
      hq_it: { bg: "#F3E8FF", text: "#6D28D9" }, hod_it: { bg: "#EFF6FF", text: "#1D4ED8" },
    };
    return colors[role] ?? { bg: "#F4F3EF", text: "#525252" };
  };
  const roleColors = getRoleBadgeColors(user?.role ?? "");

  return (
    <header className="h-topbar bg-white border-b border-[#E5E4E0] flex items-center px-6 justify-between shrink-0 z-50">
      <div className="flex flex-col">
        <h1 className="text-[28px] font-bold text-[#1A1A1A] leading-tight tracking-[-0.02em]">{title}</h1>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 text-[12px] text-[#9C9C9C] mt-0.5">
            {breadcrumb.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <span className="text-[#9C9C9C] mx-0.5">/</span>}
                {crumb.path ? <button onClick={() => crumb.path && navigate(crumb.path)} className="text-[#D4A017] hover:underline cursor-pointer">{crumb.label}</button> : <span className="text-[#1A1A1A]">{crumb.label}</span>}
              </span>
            ))}
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative" ref={siteRef}>
          <button onClick={() => setSiteDropdownOpen(!siteDropdownOpen)} className={cn("flex items-center gap-2 px-3 h-[36px] rounded-md border text-[13px] transition-all duration-150", siteDropdownOpen ? "border-[#D4A017] bg-[#FAFAF8]" : "border-[#E5E4E0] bg-[#FAFAF8] hover:border-[#C4C3BF]")}>
            <MapPin className="w-4 h-4 text-[#1E6BA3]" />
            <span className="text-[#1A1A1A] font-medium truncate max-w-[160px]">{currentSite.fullName}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-[#9C9C9C] transition-transform", siteDropdownOpen && "rotate-180")} />
          </button>
          {siteDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-[240px] bg-white rounded-lg border border-[#E5E4E0] shadow-dropdown z-50 py-1 max-h-[360px] overflow-y-auto">
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#9C9C9C]">Select Site</div>
              {sites.map((site) => (
                <button key={site.id} onClick={() => { setCurrentSite(site); setSiteDropdownOpen(false); }} className={cn("w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#FAFAF8] transition-colors", currentSite.id === site.id ? "text-[#D4A017] font-medium" : "text-[#1A1A1A]")}>
                  <MapPin className="w-3.5 h-3.5 text-[#9C9C9C]" /><span className="truncate">{site.fullName}</span>{currentSite.id === site.id && <Check className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifDropdownOpen(!notifDropdownOpen)} className="relative w-[36px] h-[36px] flex items-center justify-center rounded-md hover:bg-[#FAFAF8] transition-colors">
            <Bell className="w-5 h-5 text-[#525252]" />
            {unreadCount > 0 && <><span className="absolute top-1 right-1 w-4 h-4 bg-[#B91C1C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span><span className="absolute top-1 right-1 w-4 h-4 bg-[#B91C1C] rounded-full animate-pulse-ring" /></>}
          </button>
          {notifDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-[360px] bg-white rounded-lg border border-[#E5E4E0] shadow-dropdown z-50 max-h-[420px] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E4E0]">
                <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Notifications</h3>
                {unreadCount > 0 && <button onClick={() => setUnreadCount(0)} className="text-[11px] text-[#D4A017] font-medium hover:underline">Mark all as read</button>}
              </div>
              <div className="flex-1 overflow-y-auto max-h-[340px]">
                {notifications.map((notif) => {
                  const iconColors: Record<string, string> = { workflow: "#C27A06", approval: "#1B7A43", alert: "#B91C1C", info: "#1E6BA3", transfer: "#7C3AED", security: "#1E4A73", it: "#6D28D9" };
                  return (
                    <button key={notif.id} onClick={() => { if (notif.link) navigate(notif.link); setNotifDropdownOpen(false); }} className={cn("w-full flex items-start gap-3 px-4 py-3 hover:bg-[#FAFAF8] transition-colors border-b border-[#F4F3EF] text-left", !notif.read && "bg-[rgba(212,160,23,0.03)]")}>
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: iconColors[notif.type] ?? "#9C9C9C" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#1A1A1A] leading-snug">{notif.title}</p>
                        <p className="text-[12px] text-[#525252] mt-0.5 leading-snug">{notif.message}</p>
                        <p className="text-[11px] text-[#9C9C9C] mt-1">{formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}</p>
                      </div>
                      {!notif.read && <span className="w-2 h-2 bg-[#D4A017] rounded-full mt-1.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="relative" ref={userRef}>
          <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center gap-2.5 hover:bg-[#FAFAF8] rounded-md px-2 py-1.5 transition-colors">
            <div className="w-9 h-9 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[13px] font-semibold shrink-0">{user?.initials ?? "U"}</div>
            <div className="flex flex-col items-start">
              <span className="text-[13px] font-medium text-[#1A1A1A] leading-tight">{user?.name ?? "User"}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5" style={{ backgroundColor: roleColors.bg, color: roleColors.text }}>{user?.roleLabel ?? "Guest"}</span>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-[#9C9C9C] transition-transform", userDropdownOpen && "rotate-180")} />
          </button>
          {userDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-[200px] bg-white rounded-lg border border-[#E5E4E0] shadow-dropdown z-50 py-1">
              <button onClick={() => setUserDropdownOpen(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors"><User className="w-4 h-4 text-[#9C9C9C]" />Profile</button>
              <button onClick={() => { setUserDropdownOpen(false); navigate("/settings"); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors"><Settings className="w-4 h-4 text-[#9C9C9C]" />Settings</button>
              <div className="border-t border-[#E5E4E0] my-1" />
              <button onClick={() => { setUserDropdownOpen(false); logout(); navigate("/login"); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"><LogOut className="w-4 h-4" />Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
