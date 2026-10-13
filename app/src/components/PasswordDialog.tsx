// src/components/PasswordDialog.tsx — set a password (own account or, for admins, another user's)
import { useEffect, useState } from "react";
import { Eye, EyeOff, Wand2, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
function generate() {
  const b = new Uint32Array(14); crypto.getRandomValues(b);
  let s = Array.from(b, (x) => CHARS[x % CHARS.length]).join("");
  if (!/\d/.test(s)) s = s.slice(0, 13) + String(b[0] % 10);
  return s;
}

export default function PasswordDialog({ open, onClose, title, subtitle, onSubmit, showGenerate = false }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  onSubmit: (password: string) => Promise<string | null>; showGenerate?: boolean;
}) {
  const [pw, setPw] = useState(""); const [confirm, setConfirm] = useState(""); const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null); const [done, setDone] = useState(false); const [copied, setCopied] = useState(false);
  useEffect(() => { if (open) { setPw(""); setConfirm(""); setShow(false); setErr(null); setDone(false); setCopied(false); } }, [open]);
  const checks = [
    { ok: pw.length >= 10, label: "At least 10 characters" },
    { ok: /[A-Za-z]/.test(pw) && /\d/.test(pw), label: "Letters and numbers" },
    { ok: pw.length > 0 && pw === confirm, label: "Both entries match" },
  ];
  const valid = checks.every((c) => c.ok);
  const save = async () => { setBusy(true); setErr(null); const e = await onSubmit(pw); setBusy(false); if (e) setErr(e); else setDone(true); };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[440px]" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      {done ? (
        <div className="space-y-3">
          <div className="px-4 py-3 rounded-[6px] bg-[#E8F5EC] text-[13px] text-[#1B7A43] font-semibold">Password set.</div>
          {showGenerate && <>
            <p className="text-[12px] text-[#525252]">Give the password to the user privately (in person or by phone, not by email), and ask them to change it after signing in via their name menu, then <strong>Set my password</strong>.</p>
            <div className="flex items-center gap-2"><code className="flex-1 px-3 py-2 rounded-[6px] bg-[#F5F5F5] font-mono text-[14px] select-all">{pw}</code><Button variant="outline" className="h-9" onClick={() => { void navigator.clipboard.writeText(pw); setCopied(true); }}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button></div>
          </>}
          <DialogFooter><Button onClick={onClose} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black">Done</Button></DialogFooter>
        </div>
      ) : (
        <div className="space-y-3">
          {subtitle && <p className="text-[12px] text-[#525252]">{subtitle}</p>}
          <div className="relative">
            <Input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" autoComplete="new-password" className="pr-20" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              {showGenerate && <button type="button" title="Generate a strong password" onClick={() => { const g = generate(); setPw(g); setConfirm(g); setShow(true); }} className="p-1 text-[#6B6B6B] hover:text-black"><Wand2 className="w-4 h-4" /></button>}
              <button type="button" onClick={() => setShow((s) => !s)} className="p-1 text-[#6B6B6B] hover:text-black">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <Input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" autoComplete="new-password" />
          <div className="space-y-1">{checks.map((c) => <div key={c.label} className={`text-[12px] flex items-center gap-1.5 ${c.ok ? "text-[#1B7A43]" : "text-[#9C9C9C]"}`}>{c.ok ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-block" />}{c.label}</div>)}</div>
          {err && <p className="text-[12px] text-[#B91C1C]">{err}</p>}
          <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!valid || busy} onClick={() => void save()} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black">{busy ? "Saving…" : "Set password"}</Button></DialogFooter>
        </div>
      )}
    </DialogContent></Dialog>
  );
}
