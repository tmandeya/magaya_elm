// src/pages/MfaGate.tsx — ELMS authenticator code (TOTP) for HR and administrator roles.
// The database refuses these roles any data until the session is at assurance level aal2.
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Smartphone, LogOut, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function MfaGate() {
  const { user, mfaState, refreshMfa, logout } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) { setErr(error.message); return; }
      const verified = data.totp.find((f) => f.status === "verified");
      if (verified) { setFactorId(verified.id); return; }
      // Clear half-finished setups, then start a fresh one
      for (const f of data.all.filter((x) => x.factor_type === "totp" && x.status !== "verified")) await supabase.auth.mfa.unenroll({ factorId: f.id });
      const en = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `ELMS ${new Date().toISOString().slice(0, 10)}` });
      if (en.error) { setErr(en.error.message); return; }
      setFactorId(en.data.id); setQr(en.data.totp.qr_code); setSecret(en.data.totp.secret);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (error) { setErr("That code didn't work. Codes change every 30 seconds — enter the current one."); setCode(""); return; }
    await refreshMfa();
  };

  const enrolling = mfaState === "enroll";
  return (
    <div className="min-h-[100dvh] bg-[#F9F9F9]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="bg-black border-b-4 border-[#EDC817] px-6 py-4 flex items-center justify-between">
        <img src="/magaya_logo_white.png" alt="Magaya Mining" className="h-[34px] w-auto" />
        <button onClick={() => void logout()} className="text-[#CFCFCF] hover:text-white text-[13px] flex items-center gap-1.5"><LogOut className="w-4 h-4" />Sign out</button>
      </div>
      <div className="max-w-[460px] mx-auto px-5 py-10">
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-7">
          <div className="w-12 h-12 rounded-full bg-[#FDF8DC] flex items-center justify-center mb-4"><ShieldCheck className="w-6 h-6 text-[#8C7600]" /></div>
          <h1 className="text-[20px] font-bold text-black">{enrolling ? "Set up your ELMS code" : "Enter your ELMS code"}</h1>
          <p className="text-[13px] text-[#525252] mt-1">
            {enrolling
              ? `Hi ${user?.name?.split(" ")[0] ?? ""}, your role can see sensitive employee information, so ELMS needs a second check each time you sign in.`
              : "Open your authenticator app and enter the 6-digit code for Magaya ELMS."}
          </p>

          {enrolling && (
            <div className="mt-5 space-y-3">
              <div className="flex gap-2 text-[13px]"><span className="w-5 h-5 rounded-full bg-black text-[#EDC817] text-[11px] font-bold flex items-center justify-center shrink-0">1</span><span>Open <strong>Microsoft Authenticator</strong> (or Google Authenticator) on your phone and choose <strong>Add account</strong>, then <strong>Other account</strong>.</span></div>
              <div className="flex gap-2 text-[13px]"><span className="w-5 h-5 rounded-full bg-black text-[#EDC817] text-[11px] font-bold flex items-center justify-center shrink-0">2</span><span>Scan this code:</span></div>
              <div className="flex justify-center py-2">{qr ? <img src={qr} alt="Authenticator setup QR code" className="w-[180px] h-[180px] border border-[#DDDDDD] rounded-[6px] p-2 bg-white" /> : <div className="w-[180px] h-[180px] bg-[#F5F5F5] rounded-[6px] animate-pulse" />}</div>
              {secret && (
                <div className="text-[11px] text-[#6B6B6B] text-center">Can't scan? Enter this key manually:
                  <div className="mt-1 flex items-center justify-center gap-2"><code className="font-mono text-[12px] text-black bg-[#F5F5F5] px-2 py-1 rounded select-all break-all">{secret}</code>
                    <button type="button" onClick={() => { void navigator.clipboard.writeText(secret); setCopied(true); }} className="text-[#6B6B6B] hover:text-black">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button></div>
                </div>)}
              <div className="flex gap-2 text-[13px]"><span className="w-5 h-5 rounded-full bg-black text-[#EDC817] text-[11px] font-bold flex items-center justify-center shrink-0">3</span><span>Enter the 6-digit code it shows:</span></div>
            </div>
          )}

          <form onSubmit={(e) => void submit(e)} className="mt-4">
            <div className="relative">
              <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]" />
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="000000"
                className="w-full h-[52px] pl-10 pr-3 text-[24px] tracking-[0.4em] font-mono border-2 border-[#DDDDDD] rounded-[6px] outline-none focus:border-[#EDC817]" />
            </div>
            {err && <p className="text-[12px] text-[#B91C1C] mt-2">{err}</p>}
            <button disabled={busy || code.length !== 6 || !factorId} className="w-full h-[46px] mt-4 bg-[#EDC817] hover:bg-[#D9B60F] text-black font-semibold rounded-[6px] disabled:opacity-50">
              {busy ? "Checking…" : enrolling ? "Confirm and continue" : "Continue"}
            </button>
          </form>
          <p className="text-[11px] text-[#9C9C9C] mt-4">{enrolling ? "You'll enter a code from this app each time you sign in to ELMS." : "Lost or changed your phone? Ask IT to reset your ELMS code, then sign in again to set it up."}</p>
        </div>
      </div>
    </div>
  );
}
