// src/pages/ExamPortal.tsx
// Public candidate test page (no login). The server serves ONE question at a
// time with its own time limit and holds every answer key; this page only
// renders, counts down and reports integrity events (tab switches, leaving
// full screen, copy/paste) which appear in the administrator's report.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { SECTION_LABELS } from "@/lib/testGenerators";

interface Q { state: string; seq: number; total: number; section: string; kind: "mcq" | "likert"; prompt: string; stimulus: { type: string; caption?: string; columns: string[]; rows: (string | number)[][] } | null; options: string[]; time_limit: number; remaining: number; }
interface OpenState { state: string; name?: string; full_name?: string; schedule?: string; item_count?: number; current_seq?: number; minutes?: number; sections?: Record<string, number>; sitting?: string; starts_at?: string; }

const LIKERT = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
const clean = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");

function Shell({ children, name, code }: { children: React.ReactNode; name?: string; code?: string }) {
  const marks = useMemo(() => Array.from({ length: 24 }), []);
  return (
    <div className="min-h-[100dvh] bg-[#F9F9F9] select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="bg-black border-b-4 border-[#EDC817] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/magaya_logo_white.png" alt="Magaya Mining" className="h-[34px] w-auto" />
          <div><div className="text-white text-[16px] font-semibold">Candidate Assessment</div><div className="text-[#CFCFCF] text-[11px]">Magaya Mining — Graduate Trainee & Attachment Programmes</div></div>
        </div>
        {name && <div className="text-right"><div className="text-white text-[13px] font-medium">{name}</div>{code && <div className="text-[#9C9C9C] text-[11px] font-mono">{code}</div>}</div>}
      </div>
      {name && code && (
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0 opacity-[0.045] flex flex-wrap content-start gap-x-24 gap-y-16 p-10 rotate-[-18deg] scale-125">
          {marks.map((_, i) => <span key={i} className="text-[18px] font-bold whitespace-nowrap">{name} · {code}</span>)}
        </div>
      )}
      <div className="relative z-10 max-w-[860px] mx-auto px-5 py-8">{children}</div>
    </div>
  );
}

export default function ExamPortal() {
  const { code: routeCode } = useParams();
  const navigate = useNavigate();
  const [codeInput, setCodeInput] = useState(routeCode ?? "");
  const [code, setCode] = useState(routeCode ? clean(routeCode) : "");
  const [info, setInfo] = useState<OpenState | null>(null);
  const [q, setQ] = useState<Q | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fsWarning, setFsWarning] = useState(false);
  const awayAt = useRef<number | null>(null);
  const qRef = useRef<Q | null>(null); qRef.current = q;
  const selRef = useRef<string | null>(null); selRef.current = selected;
  const inTest = q?.state === "question";

  const event = useCallback((kind: string, seconds = 0) => { if (code) void supabase.rpc("fn_exam_event", { p_code: code, p_kind: kind, p_seconds: seconds }); }, [code]);

  const open = useCallback(async (c: string) => {
    setError(null); setBusy(true);
    const { data, error: e } = await supabase.rpc("fn_exam_open", { p_code: c });
    setBusy(false);
    if (e) { setError(e.message); return; }
    setCode(c); setInfo(data as OpenState);
    if (!routeCode) navigate(`/exam/${c}`, { replace: true });
  }, [navigate, routeCode]);

  useEffect(() => { if (routeCode) void open(clean(routeCode)); }, [routeCode, open]);

  // Waiting room: poll until the supervisor opens the sitting
  useEffect(() => {
    if (info?.state !== "not_open") return;
    const t = setInterval(() => void open(code), 10000);
    return () => clearInterval(t);
  }, [info?.state, code, open]);

  const applyQ = (data: Q) => {
    if (data.state !== "question") { setQ(data); if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); return; }
    setQ(data); setSelected(null); setRemaining(data.remaining);
  };

  const start = async () => {
    setBusy(true); setError(null);
    try { await document.documentElement.requestFullscreen(); } catch { /* some browsers refuse; logged below if they leave */ }
    const { data, error: e } = await supabase.rpc("fn_exam_start", { p_code: code, p_user_agent: navigator.userAgent });
    setBusy(false);
    if (e) { setError(e.message); return; }
    if ((data as Q).state === "question") applyQ(data as Q); else setInfo(data as OpenState);
  };

  const submit = useCallback(async (answer: string | null) => {
    const cur = qRef.current; if (!cur || cur.state !== "question") return;
    setBusy(true);
    const { data, error: e } = await supabase.rpc("fn_exam_answer", { p_code: code, p_seq: cur.seq, p_answer: answer ?? "" });
    setBusy(false);
    if (e) { setError("Connection problem — your answer may not have saved. Retrying…"); setTimeout(() => void submit(answer), 2000); return; }
    setError(null); applyQ(data as Q);
  }, [code]);

  // Countdown; auto-submit at zero
  useEffect(() => {
    if (!inTest) return;
    const t = setInterval(() => setRemaining((r) => {
      if (r <= 1) { clearInterval(t); void submit(selRef.current); return 0; }
      return r - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [inTest, q?.seq, submit]);

  // Integrity monitoring while the test is running
  useEffect(() => {
    if (!inTest) return;
    const onHide = () => { if (awayAt.current === null) { awayAt.current = Date.now(); event("blur"); } };
    const onShow = () => { if (awayAt.current !== null) { event("return", Math.round((Date.now() - awayAt.current) / 1000)); awayAt.current = null; } };
    const onVis = () => (document.hidden ? onHide() : onShow());
    const block = (kind: string) => (e: Event) => { e.preventDefault(); event(kind); };
    const onCopy = block("copy"), onPaste = block("paste"), onCut = block("cut");
    const onCtx = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "p", "s", "u", "a"].includes(k)) { e.preventDefault(); event(k === "v" ? "paste" : "copy"); }
      if (k === "printscreen" || k === "f12") { e.preventDefault(); event("copy"); }
    };
    const onFs = () => { if (!document.fullscreenElement) { setFsWarning(true); event("fullscreen_exit"); } else setFsWarning(false); };
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    document.addEventListener("visibilitychange", onVis); window.addEventListener("blur", onHide); window.addEventListener("focus", onShow);
    document.addEventListener("copy", onCopy); document.addEventListener("paste", onPaste); document.addEventListener("cut", onCut);
    document.addEventListener("contextmenu", onCtx); document.addEventListener("keydown", onKey); document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVis); window.removeEventListener("blur", onHide); window.removeEventListener("focus", onShow);
      document.removeEventListener("copy", onCopy); document.removeEventListener("paste", onPaste); document.removeEventListener("cut", onCut);
      document.removeEventListener("contextmenu", onCtx); document.removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [inTest, event]);

  // ---------------- Screens ----------------
  if (!info) {
    return (
      <Shell>
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-8 max-w-[440px] mx-auto mt-10">
          <h1 className="text-[22px] font-bold text-black mb-1">Enter your access code</h1>
          <p className="text-[13px] text-[#6B6B6B] mb-5">Your code is on the slip given to you by the supervisor.</p>
          <form onSubmit={(e) => { e.preventDefault(); void open(clean(codeInput)); }}>
            <input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} autoFocus placeholder="e.g. K7Q4MX2PAB" maxLength={14}
              className="w-full h-[52px] text-center text-[22px] font-mono tracking-[0.25em] border-2 border-[#DDDDDD] rounded-[6px] focus:border-[#EDC817] outline-none" />
            {error && <p className="text-[13px] text-[#B91C1C] mt-3">{error}</p>}
            <button disabled={busy || clean(codeInput).length < 8} className="w-full h-[48px] mt-4 bg-[#EDC817] text-black font-semibold rounded-[6px] disabled:opacity-50">{busy ? "Checking…" : "Continue"}</button>
          </form>
        </div>
      </Shell>
    );
  }

  const name = info.name;

  if (q?.state === "done" || info.state === "submitted") {
    return (
      <Shell name={name}>
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-10 text-center mt-10">
          <div className="w-14 h-14 rounded-full bg-[#1B7A43] text-white text-[28px] flex items-center justify-center mx-auto mb-4">✓</div>
          <h1 className="text-[22px] font-bold text-black">Thank you, {name}</h1>
          <p className="text-[14px] text-[#525252] mt-2">Your assessment has been submitted. The Human Resources team will be in touch about the next steps.</p>
          <p className="text-[12px] text-[#9C9C9C] mt-6">You may now close this window and hand the device back to the supervisor.</p>
        </div>
      </Shell>
    );
  }

  if (info.state === "not_open" || info.state === "closed") {
    return (
      <Shell name={name}>
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-10 text-center mt-10">
          <h1 className="text-[20px] font-bold text-black">{info.state === "closed" ? "This session has closed" : `Welcome, ${name}`}</h1>
          <p className="text-[14px] text-[#525252] mt-2">
            {info.state === "closed" ? "Please speak to the supervisor." : <>Your session{info.sitting ? <> (<strong>{info.sitting}</strong>)</> : null} has not been opened yet. Please wait — this page refreshes automatically when the supervisor starts the session.</>}
          </p>
          {info.state === "not_open" && <div className="mt-6 inline-flex items-center gap-2 text-[12px] text-[#6B6B6B]"><span className="w-2 h-2 rounded-full bg-[#EDC817] animate-pulse" /> Waiting for the supervisor…</div>}
        </div>
      </Shell>
    );
  }

  if (!inTest) {
    const resuming = info.state === "in_progress";
    return (
      <Shell name={name} code={code}>
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-8">
          <h1 className="text-[22px] font-bold text-black">{resuming ? `Welcome back, ${name}` : `Welcome, ${name}`}</h1>
          <p className="text-[13px] text-[#525252] mt-1">{info.schedule} · {info.item_count} questions · about {info.minutes} minutes</p>
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(info.sections ?? {}).map(([s, n]) => (
              <div key={s} className="border border-[#DDDDDD] rounded-[6px] px-3 py-2"><div className="text-[12px] font-semibold text-black">{SECTION_LABELS[s] ?? s}</div><div className="text-[11px] text-[#6B6B6B]">{n} questions</div></div>
            ))}
          </div>
          <div className="mt-6 border-l-4 border-[#EDC817] bg-[#FDF8DC] px-4 py-3 text-[13px] text-black space-y-1.5">
            <div className="font-semibold">Before you start</div>
            <div>• Each question has its own timer. When it reaches zero, your selected answer is submitted automatically.</div>
            <div>• You cannot go back to a previous question.</div>
            <div>• The test runs in full screen. Leaving the test, switching windows or copying text is recorded and reported.</div>
            <div>• Phones, calculators, notes, AI tools and help from others are not permitted.</div>
            <div>• The personality section has no right or wrong answers — answer honestly.</div>
          </div>
          <label className="flex items-start gap-3 mt-5 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 accent-[#EDC817]" />
            <span className="text-[13px] text-[#525252]">I confirm I am <strong className="text-black">{info.full_name}</strong>, I will complete this assessment on my own, and I agree to the rules above.</span>
          </label>
          {error && <p className="text-[13px] text-[#B91C1C] mt-3">{error}</p>}
          <button disabled={!agreed || busy} onClick={() => void start()} className="mt-5 h-[48px] px-8 bg-[#EDC817] text-black font-semibold rounded-[6px] disabled:opacity-50">
            {busy ? "Starting…" : resuming ? "Resume assessment" : "Start assessment"}
          </button>
        </div>
      </Shell>
    );
  }

  // Question screen
  const pct = (q.remaining > 0 ? remaining / q.time_limit : 0) * 100;
  const urgent = remaining <= 10;
  return (
    <Shell name={name} code={code}>
      {fsWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <div className="bg-white rounded-[6px] p-8 max-w-[420px] text-center">
            <h2 className="text-[18px] font-bold text-black">You left full screen</h2>
            <p className="text-[13px] text-[#525252] mt-2">This has been recorded. Return to full screen to continue — your timer is still running.</p>
            <button onClick={() => void document.documentElement.requestFullscreen().catch(() => setFsWarning(false))} className="mt-5 h-[44px] px-6 bg-[#EDC817] text-black font-semibold rounded-[6px]">Return to full screen</button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6B6B6B]">{SECTION_LABELS[q.section] ?? q.section}</div>
        <div className="text-[12px] text-[#6B6B6B]">Question {q.seq} of {q.total}</div>
      </div>
      <div className="h-1.5 bg-[#DDDDDD] rounded-full overflow-hidden mb-6"><div className="h-full bg-black transition-all" style={{ width: `${((q.seq - 1) / q.total) * 100}%` }} /></div>

      <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-7">
        <div className="flex items-start justify-between gap-6">
          <div className="text-[16px] leading-relaxed text-black whitespace-pre-line flex-1">
            {q.kind === "likert" && <div className="text-[12px] text-[#6B6B6B] mb-2">How well does this statement describe you?</div>}
            {q.prompt}
          </div>
          <div className="shrink-0 relative w-[62px] h-[62px]">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90"><circle cx="18" cy="18" r="16" fill="none" stroke="#EEEEEE" strokeWidth="3" /><circle cx="18" cy="18" r="16" fill="none" stroke={urgent ? "#B91C1C" : "#EDC817"} strokeWidth="3" strokeDasharray={`${pct} 100`} pathLength={100} strokeLinecap="round" /></svg>
            <div className={`absolute inset-0 flex items-center justify-center text-[15px] font-bold ${urgent ? "text-[#B91C1C]" : "text-black"}`}>{remaining}</div>
          </div>
        </div>

        {q.stimulus && (
          <div className="mt-5 overflow-x-auto">
            {q.stimulus.caption && <div className="text-[12px] font-semibold text-[#6B6B6B] mb-1.5">{q.stimulus.caption}</div>}
            <table className={`border-collapse text-[14px] ${q.stimulus.type === "pairs" ? "font-mono" : ""}`}>
              <thead><tr>{q.stimulus.columns.map((c) => <th key={c} className="border border-[#DDDDDD] bg-[#FAFAFA] px-3 py-1.5 text-left font-semibold">{c}</th>)}</tr></thead>
              <tbody>{q.stimulus.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border border-[#DDDDDD] px-3 py-1.5">{typeof c === "number" ? c.toLocaleString() : c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}

        {q.kind === "likert" ? (
          <div className="mt-6 grid grid-cols-5 gap-2">
            {q.options.map((o, i) => (
              <button key={o} onClick={() => setSelected(o)} className={`rounded-[6px] border-2 px-2 py-3 text-[12px] font-medium transition-colors ${selected === o ? "border-black bg-[#EDC817] text-black" : "border-[#DDDDDD] bg-white text-[#525252] hover:border-[#9C9C9C]"}`}>
                <div className="text-[18px] font-bold mb-0.5">{o}</div>{LIKERT[i]}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-2">
            {q.options.map((o, i) => (
              <button key={o} onClick={() => setSelected(o)} className={`text-left rounded-[6px] border-2 px-4 py-3 text-[15px] transition-colors flex items-center gap-3 ${selected === o ? "border-black bg-[#EDC817] text-black font-semibold" : "border-[#DDDDDD] bg-white text-black hover:border-[#9C9C9C]"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${selected === o ? "bg-black text-[#EDC817]" : "bg-[#EEEEEE] text-[#525252]"}`}>{String.fromCharCode(65 + i)}</span>{o}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[12px] text-[#9C9C9C]">{error ?? (selected ? "Answer selected — press Next to confirm." : "Select an answer.")}</span>
          <button disabled={!selected || busy} onClick={() => void submit(selected)} className="h-[46px] px-8 bg-black text-white font-semibold rounded-[6px] disabled:opacity-40">{busy ? "Saving…" : q.seq === q.total ? "Finish" : "Next →"}</button>
        </div>
      </div>
    </Shell>
  );
}
