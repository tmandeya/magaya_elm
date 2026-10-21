import { OAUTH_ERROR_KEY } from "@/lib/supabase";
import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function Login() {
  const { loginWithMicrosoft, authNotice } = useAuth();
  const [ssoLoading, setSsoLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(() => {
    const e = sessionStorage.getItem(OAUTH_ERROR_KEY);
    if (!e) return null;
    sessionStorage.removeItem(OAUTH_ERROR_KEY);
    return `Microsoft sign-in did not complete: ${e}. Please send this message to IT.`;
  });
  const loading = false;
  const shownError = authError ?? authNotice;

  return (
    <div className="flex min-h-[100dvh]">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: "#000000" }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(/login_bg.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(237, 200, 23, 0.06) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 overflow-hidden">
          <svg className="absolute bottom-0 w-full animate-float" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: "100%" }}>
            <path fill="#222222" d="M0,320 L0,200 L200,100 L400,180 L600,80 L800,160 L1000,60 L1200,140 L1440,40 L1440,320 Z" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center px-12 animate-fade-in-up">
          <img src="/magaya_logo_white.png" alt="Magaya Mining" className="w-[176px] h-auto mb-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]" />
          <h2 className="text-[22px] font-semibold text-white mb-2">Employee Lifecycle Management System</h2>
          <p className="text-[14px] text-white/60 mb-12">Streamlining workforce operations across all Magaya sites</p>
          <div className="flex flex-col gap-5 text-left">
            {["Comprehensive onboarding & offboarding workflows", "Cross-site employee transfers", "Role-based access & audit compliance"].map((text, i) => (
              <div key={i} className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-[#EDC817] shrink-0" /><span className="text-[13px] text-white/70">{text}</span></div>
            ))}
          </div>
        </div>
        <p className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-white/35 z-10">&copy; 2026 Magaya Mining. All rights reserved.</p>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ backgroundColor: "#F9F9F9", backgroundImage: "radial-gradient(circle at center, #FAFAFA 0%, #F9F9F9 100%)" }}>
        <div className="w-full max-w-[420px] animate-fade-in-up">
          <h1 className="text-[28px] font-bold text-[#000000] mb-2 tracking-[-0.02em]">Welcome back</h1>
          <p className="text-[14px] text-[#525252] mb-8">Sign in with your Magaya Microsoft 365 account</p>
          {shownError && (
            <div className="mb-5 px-4 py-3 rounded-lg border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{shownError}</div>
          )}

        <button type="button" disabled={ssoLoading || loading}
          onClick={async () => {
            setAuthError(null);
            setSsoLoading(true);
            const err = await loginWithMicrosoft();
            if (err) { setAuthError(err); setSsoLoading(false); }
            // on success the browser navigates to Microsoft; no state reset needed
          }}
          className={cn(
            "w-full h-[46px] rounded-lg border border-[#DDDDDD] bg-white flex items-center justify-center gap-2.5",
            "text-[14px] font-medium text-[#000000] transition-colors hover:bg-[#FAFAFA]",
            (ssoLoading || loading) && "opacity-60 cursor-not-allowed"
          )}>
          <svg width="17" height="17" viewBox="0 0 21 21" aria-hidden="true">
            <rect x="0" y="0" width="10" height="10" fill="#F25022" />
            <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
            <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
            <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
          </svg>
          {ssoLoading ? "Redirecting to Microsoft..." : "Sign in with Microsoft"}
        </button>
        <p className="text-[11px] text-[#9C9C9C] text-center mt-3">Access requires an ELMS account set up by IT. HR and administrator accounts also confirm a 6-digit code from an authenticator app.</p>
          <p className="text-center text-[11px] text-[#9C9C9C] mt-8">Access is provisioned by HQ IT. Your role and site are assigned to your account.</p>
          <p className="text-center text-[11px] text-[#9C9C9C] mt-2">ELMS v2.0</p>
        </div>
      </div>
    </div>
  );
}
