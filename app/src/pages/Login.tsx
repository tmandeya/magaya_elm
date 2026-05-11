import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Shield, MapPin, ArrowRight, CheckCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sites } from "@/data/mockData";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

const roleOptions: { id: UserRole; label: string; color: string }[] = [
  { id: "hq_hr", label: "HQ HR", color: "#991B1B" },
  { id: "hq_admin", label: "HQ Administrator", color: "#166534" },
  { id: "hod_hr", label: "HOD HR", color: "#C27A06" },
  { id: "hod_security", label: "HOD Security", color: "#1E4A73" },
  { id: "hq_it", label: "HQ IT", color: "#6D28D9" },
  { id: "hod_it", label: "HOD IT", color: "#1D4ED8" },
  { id: "site_admin", label: "Site Administrator", color: "#D4A017" },
  { id: "site_hr", label: "Site HR", color: "#B91C1C" },
  { id: "site_security", label: "Site Security", color: "#1E6BA3" },
  { id: "site_it", label: "Site IT Administrator", color: "#7C3AED" },
];

const isHqRole = (role: UserRole) => ["hq_hr", "hq_admin", "hod_hr", "hod_security", "hq_it", "hod_it"].includes(role);

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("demo.user@magaya.co.zw");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeField, setShakeField] = useState<string | null>(null);

  const shake = useCallback((field: string) => { setShakeField(field); setTimeout(() => setShakeField(null), 300); }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) { newErrors.username = "Email or username is required"; shake("username"); }
    if (!password.trim()) { newErrors.password = "Password is required"; shake("password"); }
    if (!selectedRole) { newErrors.role = "Please select a role"; shake("role"); }
    if (selectedRole && !isHqRole(selectedRole) && !selectedSite) { newErrors.site = "Please select a site"; shake("site"); }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (selectedRole) { login(selectedRole, selectedSite ?? undefined); navigate("/dashboard"); }
    setLoading(false);
  };

  const selectedRoleLabel = roleOptions.find((r) => r.id === selectedRole);
  const selectedSiteName = sites.find((s) => s.id === selectedSite);

  return (
    <div className="flex min-h-[100dvh]">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(/login_bg.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(212, 160, 23, 0.06) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 overflow-hidden">
          <svg className="absolute bottom-0 w-full animate-float" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: "100%" }}>
            <path fill="#222222" d="M0,320 L0,200 L200,100 L400,180 L600,80 L800,160 L1000,60 L1200,140 L1440,40 L1440,320 Z" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center px-12 animate-fade-in-up">
          <img src="/magaya_logo.png" alt="Magaya Mining" className="w-[200px] h-auto mb-8" />
          <h2 className="text-[22px] font-semibold text-white mb-2">Employee Lifecycle Management System</h2>
          <p className="text-[14px] text-white/60 mb-12">Streamlining workforce operations across 11 sites</p>
          <div className="flex flex-col gap-5 text-left">
            {["Comprehensive onboarding & offboarding workflows", "Cross-site employee transfers", "Role-based access & audit compliance"].map((text, i) => (
              <div key={i} className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#D4A017] shrink-0" /><span className="text-[13px] text-white/70">{text}</span></div>
            ))}
          </div>
        </div>
        <p className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-white/35 z-10">&copy; 2024 Magaya Mining. All rights reserved.</p>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ backgroundColor: "#F4F3EF", backgroundImage: "radial-gradient(circle at center, #FAFAF8 0%, #F4F3EF 100%)" }}>
        <div className="w-full max-w-[420px] animate-fade-in-up">
          <h1 className="text-[28px] font-bold text-[#1A1A1A] mb-2 tracking-[-0.02em]">Welcome back</h1>
          <p className="text-[14px] text-[#525252] mb-8">Sign in to access your dashboard</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Email or Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9C9C9C]" />
                <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); if (errors.username) { const n = { ...errors }; delete n.username; setErrors(n); } }} placeholder="Enter your email" className={cn("w-full h-[44px] pl-10 pr-4 rounded-lg border bg-white text-[14px] outline-none transition-all duration-150", errors.username && shakeField === "username" ? "border-[#B91C1C] ring-2 ring-[rgba(185,28,28,0.15)] animate-shake" : "border-[#E5E4E0] focus:border-[#D4A017] focus:ring-[3px] focus:ring-[rgba(212,160,23,0.1)]")} />
              </div>
              {errors.username && <p className="text-[12px] text-[#B91C1C] mt-1">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9C9C9C]" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) { const n = { ...errors }; delete n.password; setErrors(n); } }} placeholder="Enter your password" className={cn("w-full h-[44px] pl-10 pr-10 rounded-lg border bg-white text-[14px] outline-none transition-all duration-150", errors.password && shakeField === "password" ? "border-[#B91C1C] ring-2 ring-[rgba(185,28,28,0.15)] animate-shake" : "border-[#E5E4E0] focus:border-[#D4A017] focus:ring-[3px] focus:ring-[rgba(212,160,23,0.1)]")} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9C9C] hover:text-[#525252] transition-colors">{showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}</button>
              </div>
              {errors.password && <p className="text-[12px] text-[#B91C1C] mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Sign in as</label>
              <button type="button" onClick={() => setRoleDropdownOpen(!roleDropdownOpen)} className={cn("w-full h-[44px] px-4 rounded-lg border bg-white text-[14px] outline-none transition-all duration-150 flex items-center justify-between", errors.role && shakeField === "role" ? "border-[#B91C1C] ring-2 ring-[rgba(185,28,28,0.15)] animate-shake" : "border-[#E5E4E0] hover:border-[#C4C3BF]")}>
                <div className="flex items-center gap-2"><Shield className="w-[18px] h-[18px] text-[#D4A017]" /><span className={selectedRoleLabel ? "text-[#1A1A1A]" : "text-[#9C9C9C]"}>{selectedRoleLabel?.label ?? "Select your role"}</span></div>
                <ChevronDown className={cn("w-4 h-4 text-[#9C9C9C] transition-transform", roleDropdownOpen && "rotate-180")} />
              </button>
              {roleDropdownOpen && (
                <div className="mt-1 bg-white rounded-lg border border-[#E5E4E0] shadow-dropdown z-50 py-1 max-h-[280px] overflow-y-auto">
                  {roleOptions.map((role) => (
                    <button key={role.id} type="button" onClick={() => { setSelectedRole(role.id); setRoleDropdownOpen(false); if (isHqRole(role.id)) setSelectedSite(null); if (errors.role) { const n = { ...errors }; delete n.role; setErrors(n); } }} className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-[#FAFAF8] transition-colors", selectedRole === role.id ? "bg-[rgba(212,160,23,0.06)]" : "")}>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: role.color }} /><span className="text-[#1A1A1A]">{role.label}</span>{selectedRole === role.id && <CheckCircle className="w-3.5 h-3.5 text-[#D4A017] ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
              {errors.role && <p className="text-[12px] text-[#B91C1C] mt-1">{errors.role}</p>}
            </div>
            {selectedRole && !isHqRole(selectedRole) && (
              <div className="animate-fade-in-up">
                <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Site</label>
                <button type="button" onClick={() => setSiteDropdownOpen(!siteDropdownOpen)} className={cn("w-full h-[44px] px-4 rounded-lg border bg-white text-[14px] outline-none transition-all duration-150 flex items-center justify-between", errors.site && shakeField === "site" ? "border-[#B91C1C] ring-2 ring-[rgba(185,28,28,0.15)] animate-shake" : "border-[#E5E4E0] hover:border-[#C4C3BF]")}>
                  <div className="flex items-center gap-2"><MapPin className="w-[18px] h-[18px] text-[#1E6BA3]" /><span className={selectedSiteName ? "text-[#1A1A1A]" : "text-[#9C9C9C]"}>{selectedSiteName?.fullName ?? "Select your site"}</span></div>
                  <ChevronDown className={cn("w-4 h-4 text-[#9C9C9C] transition-transform", siteDropdownOpen && "rotate-180")} />
                </button>
                {siteDropdownOpen && (
                  <div className="mt-1 bg-white rounded-lg border border-[#E5E4E0] shadow-dropdown z-50 py-1 max-h-[280px] overflow-y-auto">
                    {sites.map((site) => (
                      <button key={site.id} type="button" onClick={() => { setSelectedSite(site.id); setSiteDropdownOpen(false); if (errors.site) { const n = { ...errors }; delete n.site; setErrors(n); } }} className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-[#FAFAF8] transition-colors", selectedSite === site.id ? "bg-[rgba(212,160,23,0.06)]" : "")}>
                        <MapPin className="w-3.5 h-3.5 text-[#9C9C9C]" /><span className="text-[#1A1A1A]">{site.fullName}</span>{selectedSite === site.id && <CheckCircle className="w-3.5 h-3.5 text-[#D4A017] ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
                {errors.site && <p className="text-[12px] text-[#B91C1C] mt-1">{errors.site}</p>}
              </div>
            )}
            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-[#E5E4E0] text-[#D4A017] accent-[#D4A017]" /><span className="text-[13px] text-[#525252]">Remember me</span></label>
              <button type="button" className="text-[13px] font-medium text-[#D4A017] hover:underline" onClick={() => alert("Demo: Password reset would be sent to your email.")}>Forgot password?</button>
            </div>
            <button type="submit" disabled={loading} className={cn("w-full h-[48px] rounded-lg text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150", loading ? "bg-[#A67C0A] cursor-not-allowed" : "bg-[#D4A017] hover:bg-[#A67C0A] hover:scale-[1.01] active:scale-[0.98]")}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In<ArrowRight className="w-[18px] h-[18px]" /></>}
            </button>
          </form>
          <div className="mt-6 text-center">
            <span className="inline-block text-[12px] text-[#9C9C9C] px-3 py-2 rounded-md" style={{ backgroundColor: "rgba(212, 160, 23, 0.06)" }}>This is a demo environment. Select any role to explore the system.</span>
          </div>
          <p className="text-center text-[11px] text-[#9C9C9C] mt-6">ELMS v1.0 — Demo Build</p>
        </div>
      </div>
    </div>
  );
}
