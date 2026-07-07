import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { completePasswordRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => {
      completePasswordRecovery();
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-6" style={{ backgroundColor: "#F4F3EF", backgroundImage: "radial-gradient(circle at center, #FAFAF8 0%, #F4F3EF 100%)" }}>
      <div className="w-full max-w-[420px] bg-white rounded-[10px] border border-[#E5E4E0] p-8 shadow-sm animate-fade-in-up">
        <img src="/magaya_logo.png" alt="Magaya Mining" className="w-[140px] h-auto mb-6" />
        {done ? (
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle className="w-10 h-10 text-[#1B7A43] mb-3" />
            <h1 className="text-[20px] font-semibold text-[#1A1A1A] mb-1">Password updated</h1>
            <p className="text-[13px] text-[#525252]">Taking you to your dashboard...</p>
          </div>
        ) : (
          <>
            <h1 className="text-[22px] font-bold text-[#1A1A1A] mb-1 tracking-[-0.02em]">Set a new password</h1>
            <p className="text-[13px] text-[#525252] mb-6">Choose a new password for your ELMS account.</p>
            {error && <div className="mb-4 px-4 py-3 rounded-lg border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{error}</div>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#525252] mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9C9C9C]" />
                  <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="w-full h-[44px] pl-10 pr-10 rounded-lg border bg-white text-[14px] outline-none transition-all duration-150 border-[#E5E4E0] focus:border-[#D4A017] focus:ring-[3px] focus:ring-[rgba(212,160,23,0.1)]" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9C9C] hover:text-[#525252] transition-colors">{showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9C9C9C]" />
                  <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter the password" className="w-full h-[44px] pl-10 pr-4 rounded-lg border bg-white text-[14px] outline-none transition-all duration-150 border-[#E5E4E0] focus:border-[#D4A017] focus:ring-[3px] focus:ring-[rgba(212,160,23,0.1)]" />
                </div>
              </div>
              <button type="submit" disabled={loading} className={cn("w-full h-[48px] rounded-lg text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150 mt-1", loading ? "bg-[#A67C0A] cursor-not-allowed" : "bg-[#D4A017] hover:bg-[#A67C0A] hover:scale-[1.01] active:scale-[0.98]")}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
