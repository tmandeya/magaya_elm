import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [shakeField, setShakeField] = useState<string | null>(null);

  const shake = useCallback((field: string) => { setShakeField(field); setTimeout(() => setShakeField(null), 300); }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) { newErrors.email = "Email is required"; shake("email"); }
    if (!password.trim()) { newErrors.password = "Password is required"; shake("password"); }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!validate()) return;
    setLoading(true);
    const { error } = await login(email.trim(), password);
    setLoading(false);
    if (error) {
      setAuthError(error);
      shake("email");
      return;
    }
    navigate("/dashboard");
  };

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
        <p className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-white/35 z-10">&copy; 2026 Magaya Mining. All rights reserved.</p>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ backgroundColor: "#F4F3EF", backgroundImage: "radial-gradient(circle at center, #FAFAF8 0%, #F4F3EF 100%)" }}>
        <div className="w-full max-w-[420px] animate-fade-in-up">
          <h1 className="text-[28px] font-bold text-[#1A1A1A] mb-2 tracking-[-0.02em]">Welcome back</h1>
          <p className="text-[14px] text-[#525252] mb-8">Sign in with your Magaya ELMS account</p>
          {authError && (
            <div className="mb-5 px-4 py-3 rounded-lg border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{authError}</div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9C9C9C]" />
                <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) { const n = { ...errors }; delete n.email; setErrors(n); } }} placeholder="you@magaya.co.zw" className={cn("w-full h-[44px] pl-10 pr-4 rounded-lg border bg-white text-[14px] outline-none transition-all duration-150", (errors.email || authError) && shakeField === "email" ? "border-[#B91C1C] ring-2 ring-[rgba(185,28,28,0.15)] animate-shake" : "border-[#E5E4E0] focus:border-[#D4A017] focus:ring-[3px] focus:ring-[rgba(212,160,23,0.1)]")} />
              </div>
              {errors.email && <p className="text-[12px] text-[#B91C1C] mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9C9C9C]" />
                <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) { const n = { ...errors }; delete n.password; setErrors(n); } }} placeholder="Enter your password" className={cn("w-full h-[44px] pl-10 pr-10 rounded-lg border bg-white text-[14px] outline-none transition-all duration-150", errors.password && shakeField === "password" ? "border-[#B91C1C] ring-2 ring-[rgba(185,28,28,0.15)] animate-shake" : "border-[#E5E4E0] focus:border-[#D4A017] focus:ring-[3px] focus:ring-[rgba(212,160,23,0.1)]")} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9C9C] hover:text-[#525252] transition-colors">{showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}</button>
              </div>
              {errors.password && <p className="text-[12px] text-[#B91C1C] mt-1">{errors.password}</p>}
            </div>
            <div className="flex items-center justify-end mt-1">
              <button type="button" className="text-[13px] font-medium text-[#D4A017] hover:underline" onClick={() => setAuthError("Password resets are handled by IT. Contact the system administrator.")}>Forgot password?</button>
            </div>
            <button type="submit" disabled={loading} className={cn("w-full h-[48px] rounded-lg text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150", loading ? "bg-[#A67C0A] cursor-not-allowed" : "bg-[#D4A017] hover:bg-[#A67C0A] hover:scale-[1.01] active:scale-[0.98]")}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In<ArrowRight className="w-[18px] h-[18px]" /></>}
            </button>
          </form>
          <p className="text-center text-[11px] text-[#9C9C9C] mt-8">Access is provisioned by HQ IT. Your role and site are assigned to your account.</p>
          <p className="text-center text-[11px] text-[#9C9C9C] mt-2">ELMS v2.0</p>
        </div>
      </div>
    </div>
  );
}
