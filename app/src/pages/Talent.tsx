// src/pages/Talent.tsx — Graduate Trainees & Attachment Students
import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Users, ClipboardCheck, BookOpen, Plus, Upload, Search, Printer, FileText, Play, Square, RefreshCw, Copy, ChevronRight, Star, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { buildPaper, COGNITIVE_SECTIONS, FORM_CODES, SECTION_LABELS, type BankItem, type GenItem } from "@/lib/testGenerators";
import { useTalent, loadReviews, addReview, STATUS_META, RISK_META, TYPE_LABEL, type Trainee, type TraineeStatus, type Schedule, type AttemptSummary, type Review } from "@/hooks/useTalent";
import { CandidateReport, ScheduleReport } from "@/components/talent/AssessmentReports";

const EXAM_URL = `${window.location.origin}/#/exam`;
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const fmtDT = (d?: string | null) => (d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "No time set");
const PIPELINE: TraineeStatus[] = ["pending", "assessment", "assessed", "approved", "active", "completed"];
const DEFAULT_WEIGHTS: Record<string, number> = { verbal: 18, numerical: 20, data: 12, logical: 16, mechanical: 12, spatial: 8, detail: 14 };

function Pill({ status }: { status: TraineeStatus }) { const m = STATUS_META[status]; return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ background: m.bg, color: m.fg }}>{m.label}</span>; }
function RiskPill({ risk }: { risk: string | null | undefined }) { if (!risk) return <span className="text-[#9C9C9C] text-[12px]">—</span>; const m = RISK_META[risk]; return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ background: m.bg, color: m.fg }}>{m.short}</span>; }
function Tile({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-4 relative overflow-hidden"><div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accent ?? "#EDC817" }} /><div className="text-[26px] font-bold text-black leading-none">{value}</div><div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B6B6B] mt-2">{label}</div>{sub && <div className="text-[11px] text-[#9C9C9C] mt-0.5">{sub}</div>}</div>;
}
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) { return <div className={className}><label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B6B6B] mb-1">{label}</label>{children}</div>; }

// ====================================================================
export default function Talent() {
  const t = useTalent();
  const [tab, setTab] = useState<"overview" | "people" | "assessments" | "library">("overview");
  const [personId, setPersonId] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const person = t.trainees.find((x) => x.id === personId) ?? null;

  if (t.loading) return <div className="py-32 flex flex-col items-center gap-3"><div className="w-8 h-8 border-[3px] border-[#DDDDDD] border-t-[#EDC817] rounded-full animate-spin" /><p className="text-[13px] text-[#9C9C9C]">Loading talent programmes…</p></div>;

  const tabs = [
    { key: "overview", label: "Overview", icon: GraduationCap },
    { key: "people", label: "Trainees & Students", icon: Users },
    { key: "assessments", label: "Assessments", icon: ClipboardCheck },
    { key: "library", label: "Test Library", icon: BookOpen },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-bold text-black tracking-[-0.02em]">Talent Programmes</h1>
        <p className="text-[13px] text-[#525252] mt-1">Graduate trainees and attachment students — vetting, sign-off and progress</p>
      </div>
      {t.error && <div className="px-4 py-3 rounded-[6px] border border-[#B91C1C]/30 bg-[#FEF2F2] text-[13px] text-[#B91C1C]">{t.error}</div>}
      <div className="flex gap-1 border-b border-[#DDDDDD]">
        {tabs.map((x) => (
          <button key={x.key} onClick={() => { setTab(x.key); setScheduleId(null); }} className={cn("px-4 py-2.5 text-[13px] font-medium flex items-center gap-2 border-b-[3px] -mb-px transition-colors", tab === x.key ? "border-[#EDC817] text-black font-semibold" : "border-transparent text-[#6B6B6B] hover:text-black")}>
            <x.icon className="w-4 h-4" />{x.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview t={t} onOpenPerson={setPersonId} onGo={(k, id) => { setTab(k); if (id) setScheduleId(id); }} />}
      {tab === "people" && <People t={t} onOpenPerson={setPersonId} />}
      {tab === "assessments" && (scheduleId ? <ScheduleDetail t={t} scheduleId={scheduleId} onBack={() => setScheduleId(null)} onOpenPerson={setPersonId} /> : <Schedules t={t} onOpen={setScheduleId} />)}
      {tab === "library" && <Library />}

      <PersonDrawer t={t} person={person} onClose={() => setPersonId(null)} />
    </div>
  );
}
type T = ReturnType<typeof useTalent>;

// ====================================================================
function Overview({ t, onOpenPerson, onGo }: { t: T; onOpenPerson: (id: string) => void; onGo: (k: "people" | "assessments", id?: string) => void }) {
  const count = (s: TraineeStatus, type?: string) => t.trainees.filter((x) => x.status === s && (!type || x.trainee_type === type)).length;
  const max = Math.max(1, ...PIPELINE.map((s) => count(s)));
  const decisions = t.trainees.filter((x) => x.status === "assessed");
  const upcoming = t.schedules.flatMap((s) => s.sittings.filter((x) => x.status !== "closed").map((x) => ({ ...x, scheduleName: s.name }))).slice(0, 6);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Tile label="Pending vetting" value={count("pending") + count("assessment")} accent="#9C9C9C" />
        <Tile label="Awaiting decision" value={count("assessed")} accent="#C27A06" />
        <Tile label="Active GTs" value={count("active", "graduate_trainee")} accent="#1B7A43" />
        <Tile label="Active students" value={count("active", "attachment_student")} accent="#1E6BA3" />
        <Tile label="Completed" value={count("completed")} accent="#000" />
        <Tile label="Open exams" value={t.schedules.filter((s) => s.status === "active").length} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white border border-[#DDDDDD] rounded-[6px] p-5">
          <h3 className="text-[14px] font-semibold mb-4">Programme pipeline</h3>
          <div className="space-y-2.5">
            {PIPELINE.map((s) => { const n = count(s); const m = STATUS_META[s]; return (
              <div key={s} className="grid grid-cols-[150px_1fr_40px] items-center gap-3 text-[13px]">
                <span className="text-[#525252]">{m.label}</span>
                <div className="h-7 bg-[#F5F5F5] rounded-[4px] overflow-hidden"><div className="h-full rounded-[4px] transition-all duration-500 flex items-center px-2 text-[11px] font-semibold" style={{ width: `${Math.max(n ? 6 : 0, (n / max) * 100)}%`, background: s === "active" ? "#1B7A43" : s === "completed" ? "#000" : "#EDC817", color: s === "active" || s === "completed" ? "#fff" : "#000" }}>{n > 0 && `${count(s, "graduate_trainee")} GT · ${count(s, "attachment_student")} St`}</div></div>
                <span className="text-right font-bold">{n}</span>
              </div>); })}
          </div>
        </div>
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-5">
          <h3 className="text-[14px] font-semibold mb-3">Upcoming sittings</h3>
          {upcoming.length === 0 ? <p className="text-[12px] text-[#9C9C9C] py-6 text-center">No sittings scheduled. Create an exam under Assessments.</p> : (
            <div className="space-y-2">{upcoming.map((u) => (
              <button key={u.id} onClick={() => onGo("assessments", u.schedule_id)} className="w-full text-left border border-[#DDDDDD] rounded-[6px] px-3 py-2 hover:border-[#EDC817] transition-colors">
                <div className="flex items-center justify-between"><span className="text-[13px] font-semibold">{u.label}</span>{u.status === "open" ? <span className="text-[10px] font-bold text-[#1B7A43] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1B7A43] animate-pulse" />LIVE</span> : <span className="text-[11px] text-[#9C9C9C]">{fmtDT(u.starts_at)}</span>}</div>
                <div className="text-[11px] text-[#6B6B6B]">{u.scheduleName}{u.venue ? ` · ${u.venue}` : ""}</div>
              </button>))}</div>)}
        </div>
      </div>
      <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-5">
        <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-semibold">Decisions waiting ({decisions.length})</h3>{decisions.length > 0 && <button onClick={() => onGo("people")} className="text-[12px] text-[#8C7600] font-medium hover:underline">View all</button>}</div>
        {decisions.length === 0 ? <p className="text-[12px] text-[#9C9C9C] py-4 text-center">Nobody is waiting for a decision.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">{decisions.slice(0, 9).map((p) => (
            <button key={p.id} onClick={() => onOpenPerson(p.id)} className="flex items-center justify-between border border-[#DDDDDD] rounded-[6px] px-3 py-2 hover:border-[#EDC817] text-left">
              <div><div className="text-[13px] font-semibold">{p.full_name}</div><div className="text-[11px] text-[#6B6B6B]">{TYPE_LABEL[p.trainee_type]} · score {p.latest_attempt?.weighted_score ?? "—"}</div></div>
              <RiskPill risk={p.latest_attempt?.risk} />
            </button>))}</div>)}
      </div>
    </div>
  );
}

// ====================================================================
function People({ t, onOpenPerson }: { t: T; onOpenPerson: (id: string) => void }) {
  const [q, setQ] = useState(""); const [type, setType] = useState("all"); const [status, setStatus] = useState<string>("all"); const [site, setSite] = useState("all");
  const [addOpen, setAddOpen] = useState(false); const [importOpen, setImportOpen] = useState(false);
  const rows = t.trainees.filter((p) => (type === "all" || p.trainee_type === type) && (status === "all" || p.status === status) && (site === "all" || p.site_id === site)
    && (!q || `${p.full_name} ${p.email ?? ""} ${p.institution ?? ""} ${p.programme ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", ...PIPELINE, "not_selected", "withdrawn"] as const).map((s) => { const n = s === "all" ? t.trainees.length : t.trainees.filter((p) => p.status === s).length; return (
          <button key={s} onClick={() => setStatus(s)} className={cn("px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors", status === s ? "bg-black text-white border-black" : "bg-white text-[#525252] border-[#DDDDDD] hover:border-black")}>
            {s === "all" ? "All" : STATUS_META[s].label} <span className={cn("ml-1", status === s ? "text-[#EDC817]" : "text-[#9C9C9C]")}>{n}</span>
          </button>); })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-[340px]"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, institution…" className="pl-9 h-9 text-[13px]" /></div>
        <Select value={type} onValueChange={setType}><SelectTrigger className="h-9 w-[180px] text-[13px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All programmes</SelectItem><SelectItem value="graduate_trainee">Graduate Trainees</SelectItem><SelectItem value="attachment_student">Attachment Students</SelectItem></SelectContent></Select>
        <Select value={site} onValueChange={setSite}><SelectTrigger className="h-9 w-[170px] text-[13px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sites</SelectItem>{t.sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => setImportOpen(true)} className="h-9 text-[13px]"><Upload className="w-4 h-4 mr-1.5" />Bulk import</Button>
        <Button onClick={() => setAddOpen(true)} className="h-9 text-[13px] bg-[#EDC817] hover:bg-[#D9B60F] text-black"><Plus className="w-4 h-4 mr-1.5" />Add person</Button>
      </div>
      <div className="bg-white border border-[#DDDDDD] rounded-[6px] overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-[#FAFAFA] text-[11px] uppercase tracking-[0.05em] text-[#6B6B6B]"><tr>{["Name", "Programme", "Institution / field", "Site", "Assessment", "Status", ""].map((h) => <th key={h} className="text-left font-semibold px-4 py-2.5">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#EEEEEE]">
            {rows.map((p) => (
              <tr key={p.id} onClick={() => onOpenPerson(p.id)} className="hover:bg-[#FAFAFA] cursor-pointer">
                <td className="px-4 py-2.5"><div className="font-semibold text-black">{p.full_name}</div><div className="text-[11px] text-[#9C9C9C]">{p.email ?? "No email"}</div></td>
                <td className="px-4">{p.trainee_type === "graduate_trainee" ? <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black text-[#EDC817]">GT</span> : <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E8F2FA] text-[#1E6BA3]">STUDENT</span>}</td>
                <td className="px-4"><div>{p.institution ?? "—"}</div><div className="text-[11px] text-[#9C9C9C]">{p.programme ?? ""}</div></td>
                <td className="px-4 text-[#525252]">{p.site_name ?? "—"}</td>
                <td className="px-4">{p.latest_attempt?.status === "submitted" ? <div className="flex items-center gap-2"><span className="font-bold">{p.latest_attempt.weighted_score}</span><RiskPill risk={p.latest_attempt.risk} /></div> : p.latest_attempt ? <span className="text-[12px] text-[#1E6BA3]">{p.latest_attempt.status === "in_progress" ? "Writing now" : "Scheduled"}</span> : <span className="text-[12px] text-[#9C9C9C]">Not assigned</span>}</td>
                <td className="px-4"><Pill status={p.status} /></td>
                <td className="px-4 text-[#C4C4C4]"><ChevronRight className="w-4 h-4" /></td>
              </tr>))}
            {rows.length === 0 && <tr><td colSpan={7} className="py-14 text-center text-[13px] text-[#9C9C9C]">{t.trainees.length === 0 ? "No trainees or students yet — add people one by one or bulk import your intake list." : "Nobody matches these filters."}</td></tr>}
          </tbody>
        </table>
      </div>
      <AddPersonDialog t={t} open={addOpen} onClose={() => setAddOpen(false)} />
      <ImportDialog t={t} open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function AddPersonDialog({ t, open, onClose }: { t: T; open: boolean; onClose: () => void }) {
  const blank = { trainee_type: "graduate_trainee" as const, first_name: "", surname: "", email: "", phone: "", institution: "", programme: "", gender: "", site_id: "" };
  const [f, setF] = useState<Record<string, string>>(blank); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => { setBusy(true); setErr(null); const e = await t.addTrainees([{ ...f, site_id: f.site_id || null } as Partial<Trainee>]); setBusy(false); if (e) setErr(e); else { setF(blank); onClose(); } };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[560px]" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>Add trainee or student</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3 py-1">
        <Field label="Programme" className="col-span-2"><div className="grid grid-cols-2 gap-2">{(["graduate_trainee", "attachment_student"] as const).map((x) => <button key={x} onClick={() => set("trainee_type", x)} className={cn("h-10 rounded-[6px] border-2 text-[13px] font-semibold", f.trainee_type === x ? "border-black bg-[#EDC817]" : "border-[#DDDDDD]")}>{TYPE_LABEL[x]}</button>)}</div></Field>
        <Field label="First name *"><Input value={f.first_name} onChange={(e) => set("first_name", e.target.value)} /></Field>
        <Field label="Surname *"><Input value={f.surname} onChange={(e) => set("surname", e.target.value)} /></Field>
        <Field label="Email"><Input value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Institution"><Input value={f.institution} onChange={(e) => set("institution", e.target.value)} placeholder="e.g. University of Zimbabwe" /></Field>
        <Field label="Degree / field of study"><Input value={f.programme} onChange={(e) => set("programme", e.target.value)} placeholder="e.g. BSc Mechanical Engineering" /></Field>
        <Field label="Gender"><Select value={f.gender || "na"} onValueChange={(v) => set("gender", v === "na" ? "" : v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="na">Not specified</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem></SelectContent></Select></Field>
        <Field label="Intended site"><Select value={f.site_id || "none"} onValueChange={(v) => set("site_id", v === "none" ? "" : v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not decided</SelectItem>{t.sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
      </div>
      {err && <p className="text-[12px] text-[#B91C1C]">{err}</p>}
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy || !f.first_name.trim() || !f.surname.trim()} onClick={() => void save()} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black">{busy ? "Saving…" : "Add — status Pending"}</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}

function ImportDialog({ t, open, onClose }: { t: T; open: boolean; onClose: () => void }) {
  const [type, setType] = useState<"graduate_trainee" | "attachment_student">("attachment_student");
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const parsed = useMemo(() => text.split(/\r?\n/).map((l) => l.split(/\t|,/).map((c) => c.trim())).filter((c) => c[0] && c[1] && !/^first/i.test(c[0]))
    .map((c) => ({ first_name: c[0], surname: c[1], email: c[2] || "", phone: c[3] || "", institution: c[4] || "", programme: c[5] || "", trainee_type: type })), [text, type]);
  const save = async () => { setBusy(true); setErr(null); const e = await t.addTrainees(parsed as Partial<Trainee>[]); setBusy(false); if (e) setErr(e); else { setText(""); onClose(); } };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[720px]" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>Bulk import an intake</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">{(["attachment_student", "graduate_trainee"] as const).map((x) => <button key={x} onClick={() => setType(x)} className={cn("h-10 rounded-[6px] border-2 text-[13px] font-semibold", type === x ? "border-black bg-[#EDC817]" : "border-[#DDDDDD]")}>{TYPE_LABEL[x]}s</button>)}</div>
        <p className="text-[12px] text-[#525252]">Copy rows from Excel and paste below. Column order: <strong>First name, Surname, Email, Phone, Institution, Field of study</strong> (only the first two are required; a header row is skipped automatically).</p>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} placeholder={"Tendai\tMoyo\ttendai@gmail.com\t0771234567\tNUST\tBSc Mining Engineering"} className="font-mono text-[12px]" />
        {parsed.length > 0 && <div className="border border-[#DDDDDD] rounded-[6px] max-h-[160px] overflow-y-auto text-[12px]"><table className="w-full"><tbody>{parsed.slice(0, 50).map((p, i) => <tr key={i} className="border-b border-[#EEEEEE]"><td className="px-2 py-1 text-[#9C9C9C]">{i + 1}</td><td className="px-2 font-semibold">{p.first_name} {p.surname}</td><td className="px-2 text-[#6B6B6B]">{p.email}</td><td className="px-2 text-[#6B6B6B]">{p.institution}</td><td className="px-2 text-[#6B6B6B]">{p.programme}</td></tr>)}</tbody></table></div>}
        {err && <p className="text-[12px] text-[#B91C1C]">{err}</p>}
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy || parsed.length === 0} onClick={() => void save()} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black">{busy ? "Importing…" : `Import ${parsed.length} ${parsed.length === 1 ? "person" : "people"}`}</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}

// ====================================================================
function PersonDrawer({ t, person, onClose }: { t: T; person: Trainee | null; onClose: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [decision, setDecision] = useState<null | "approve" | "reject" | "complete" | "withdraw">(null);
  const [notes, setNotes] = useState(""); const [plan, setPlan] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false); const [reportOpen, setReportOpen] = useState(false); const [cohort, setCohort] = useState<AttemptSummary[]>([]);
  useEffect(() => { if (person) { void loadReviews(person.id).then(setReviews); setPlan({ site_id: person.site_id ?? "", department_id: person.department_id ?? "", supervisor_name: person.supervisor_name ?? "", mentor_name: person.mentor_name ?? "", start_date: person.start_date ?? "", end_date: person.end_date ?? "" }); setDecision(null); setErr(null); } }, [person]);
  if (!person) return null;
  const a = person.latest_attempt;
  const schedule = a ? t.schedules.find((s) => s.id === a.schedule_id) : undefined;
  const elapsed = person.start_date && person.end_date ? Math.min(100, Math.max(0, ((Date.now() - +new Date(person.start_date)) / (+new Date(person.end_date) - +new Date(person.start_date))) * 100)) : null;
  const act = async () => {
    setBusy(true); setErr(null);
    const extra = Object.fromEntries(Object.entries(plan).map(([k, v]) => [k, v || null])) as Partial<Trainee>;
    const map = { approve: "active", reject: "not_selected", complete: "completed", withdraw: "withdrawn" } as const;
    const e = await t.decide(person.id, map[decision!], notes, decision === "approve" ? extra : {});
    setBusy(false); if (e) setErr(e); else { setDecision(null); setNotes(""); }
  };
  return (
    <Sheet open={!!person} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-[560px] overflow-y-auto p-0">
        <div className="bg-black border-b-4 border-[#EDC817] px-6 py-5">
          <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-[#EDC817] text-black font-bold flex items-center justify-center text-[16px]">{person.first_name[0]}{person.surname[0]}</div>
            <div><div className="text-white text-[18px] font-semibold">{person.full_name}</div><div className="text-[#CFCFCF] text-[12px]">{TYPE_LABEL[person.trainee_type]} · {person.institution ?? "Institution not set"}</div></div></div>
          <div className="mt-3 flex items-center gap-2"><Pill status={person.status} />{person.decision_at && <span className="text-[11px] text-[#9C9C9C]">decided {fmtDate(person.decision_at)}</span>}</div>
        </div>
        <div className="p-6 space-y-6">
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6B6B6B] mb-2">Assessment</h4>
            {!a ? <p className="text-[13px] text-[#9C9C9C]">Not yet assigned to an assessment. Add them to an exam under Assessments.</p> : a.status !== "submitted" ? (
              <p className="text-[13px] text-[#1E6BA3]">{a.status === "in_progress" ? `Writing now — question ${a.current_seq} of ${a.item_count}` : `Scheduled · access code ${a.access_code}`}</p>
            ) : (
              <div className="border border-[#DDDDDD] rounded-[6px] p-4">
                <div className="flex items-center justify-between"><div><div className="text-[28px] font-bold leading-none">{a.weighted_score}</div><div className="text-[11px] text-[#6B6B6B] mt-1">weighted cognitive score</div></div><RiskPill risk={a.risk} /></div>
                <div className="grid grid-cols-4 gap-1.5 mt-3">{COGNITIVE_SECTIONS.filter((s) => a.section_scores?.[s]).map((s) => <div key={s} className="text-center bg-[#FAFAFA] rounded-[4px] py-1.5"><div className="text-[13px] font-bold">{a.section_scores![s].pct}</div><div className="text-[9px] text-[#6B6B6B] leading-tight">{SECTION_LABELS[s].replace(" Reasoning", "").replace("Attention to ", "")}</div></div>)}</div>
                {(a.flags ?? []).length > 0 && <div className="mt-3 text-[12px] text-[#C27A06] flex gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0" />{a.flags!.join(" · ")}</div>}
                {schedule && <Button variant="outline" onClick={async () => { const { data } = await supabase.from("assessment_attempts").select("*").eq("schedule_id", schedule.id).eq("status", "submitted"); setCohort((data ?? []) as AttemptSummary[]); setReportOpen(true); }} className="mt-3 h-8 text-[12px] w-full"><FileText className="w-3.5 h-3.5 mr-1.5" />Open full report</Button>}
              </div>)}
          </section>

          {["assessed", "pending", "assessment", "approved"].includes(person.status) && (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6B6B6B] mb-2">Sign-off</h4>
              {!decision ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => setDecision("approve")} className="bg-[#1B7A43] hover:bg-[#14603a] text-white h-10"><CheckCircle2 className="w-4 h-4 mr-1.5" />Approve & activate</Button>
                  <Button variant="outline" onClick={() => setDecision("reject")} className="h-10 border-[#B91C1C] text-[#B91C1C]">Not selected</Button>
                </div>
              ) : (
                <div className="border border-[#DDDDDD] rounded-[6px] p-4 space-y-3">
                  {decision === "approve" && <div className="grid grid-cols-2 gap-3">
                    <Field label="Site"><Select value={plan.site_id || "none"} onValueChange={(v) => setPlan((p) => ({ ...p, site_id: v === "none" ? "" : v }))}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">—</SelectItem>{t.sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
                    <Field label="Department"><Select value={plan.department_id || "none"} onValueChange={(v) => setPlan((p) => ({ ...p, department_id: v === "none" ? "" : v }))}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">—</SelectItem>{t.departments.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
                    <Field label="Supervisor"><Input className="h-9" value={plan.supervisor_name} onChange={(e) => setPlan((p) => ({ ...p, supervisor_name: e.target.value }))} /></Field>
                    <Field label="Mentor"><Input className="h-9" value={plan.mentor_name} onChange={(e) => setPlan((p) => ({ ...p, mentor_name: e.target.value }))} /></Field>
                    <Field label="Start date"><Input type="date" className="h-9" value={plan.start_date} onChange={(e) => setPlan((p) => ({ ...p, start_date: e.target.value }))} /></Field>
                    <Field label="End date"><Input type="date" className="h-9" value={plan.end_date} onChange={(e) => setPlan((p) => ({ ...p, end_date: e.target.value }))} /></Field>
                  </div>}
                  <Field label="Decision notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={decision === "reject" ? "Reason (kept on record)" : "Optional"} /></Field>
                  {err && <p className="text-[12px] text-[#B91C1C]">{err}</p>}
                  <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button><Button disabled={busy || (decision === "approve" && !plan.start_date)} onClick={() => void act()} className={decision === "approve" ? "bg-[#1B7A43] text-white" : "bg-[#B91C1C] text-white"}>{busy ? "Saving…" : decision === "approve" ? `Sign off as ${TYPE_LABEL[person.trainee_type]}` : "Confirm not selected"}</Button></div>
                </div>)}
            </section>)}

          {(person.status === "active" || person.status === "completed") && (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6B6B6B] mb-2">Programme progress</h4>
              <div className="border border-[#DDDDDD] rounded-[6px] p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div><span className="text-[#6B6B6B]">Site:</span> <strong>{person.site_name ?? "—"}</strong></div><div><span className="text-[#6B6B6B]">Department:</span> <strong>{person.department_name ?? "—"}</strong></div>
                  <div><span className="text-[#6B6B6B]">Supervisor:</span> <strong>{person.supervisor_name ?? "—"}</strong></div><div><span className="text-[#6B6B6B]">Mentor:</span> <strong>{person.mentor_name ?? "—"}</strong></div>
                </div>
                {elapsed !== null && <div><div className="flex justify-between text-[11px] text-[#6B6B6B] mb-1"><span>{fmtDate(person.start_date)}</span><span className="font-semibold text-black">{Math.round(elapsed)}% through</span><span>{fmtDate(person.end_date)}</span></div><div className="h-2.5 bg-[#EEEEEE] rounded-full overflow-hidden"><div className="h-full bg-[#EDC817]" style={{ width: `${elapsed}%` }} /></div></div>}
                <div className="flex gap-2">{person.status === "active" && <><Button variant="outline" className="h-8 text-[12px]" onClick={() => setDecision("complete")}>Mark completed</Button><Button variant="outline" className="h-8 text-[12px]" onClick={() => setDecision("withdraw")}>Withdraw</Button></>}</div>
                {(decision === "complete" || decision === "withdraw") && <div className="space-y-2"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button><Button onClick={() => void act()} className="bg-black text-white">Confirm</Button></div></div>}
              </div>
              <div className="flex items-center justify-between mt-4 mb-2"><h4 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6B6B6B]">Progress reviews ({reviews.length})</h4><button onClick={() => setReviewOpen(true)} className="text-[12px] font-semibold text-[#8C7600] hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add review</button></div>
              {reviews.length === 0 ? <p className="text-[12px] text-[#9C9C9C]">No reviews yet. Record monthly or rotation-end reviews here.</p> : <div className="space-y-2">{reviews.map((r) => { const vals = [r.rating_technical, r.rating_attitude, r.rating_learning, r.rating_teamwork].filter(Boolean) as number[]; const avg = vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : 0; return (
                <div key={r.id} className="border border-[#DDDDDD] rounded-[6px] p-3 text-[12px]"><div className="flex items-center justify-between"><span className="font-semibold">{r.period_label ?? fmtDate(r.review_date)}{r.department ? ` · ${r.department}` : ""}</span><span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn("w-3.5 h-3.5", i <= Math.round(avg) ? "fill-[#EDC817] text-[#EDC817]" : "text-[#DDDDDD]")} />)}</span></div>
                  {r.strengths && <div className="mt-1"><span className="text-[#1B7A43] font-semibold">Strengths:</span> {r.strengths}</div>}{r.improvements && <div><span className="text-[#C27A06] font-semibold">Improve:</span> {r.improvements}</div>}<div className="text-[10px] text-[#9C9C9C] mt-1">{r.reviewer ?? ""} · {fmtDate(r.review_date)}</div></div>); })}</div>}
            </section>)}

          <section className="text-[12px] text-[#525252] grid grid-cols-2 gap-2 border-t border-[#EEEEEE] pt-4">
            <div><span className="text-[#9C9C9C]">Email</span><div>{person.email ?? "—"}</div></div><div><span className="text-[#9C9C9C]">Phone</span><div>{person.phone ?? "—"}</div></div>
            <div><span className="text-[#9C9C9C]">Field of study</span><div>{person.programme ?? "—"}</div></div><div><span className="text-[#9C9C9C]">Added</span><div>{fmtDate(person.created_at)}</div></div>
            {person.decision_notes && <div className="col-span-2"><span className="text-[#9C9C9C]">Decision notes</span><div>{person.decision_notes}</div></div>}
          </section>
        </div>
        <ReviewDialog open={reviewOpen} traineeId={person.id} onClose={() => setReviewOpen(false)} onSaved={() => void loadReviews(person.id).then(setReviews)} />
        {a && schedule && a.status === "submitted" && <CandidateReport open={reportOpen} onClose={() => setReportOpen(false)} attempt={a} trainee={person} schedule={schedule} cohort={cohort} />}
      </SheetContent>
    </Sheet>
  );
}

function ReviewDialog({ open, traineeId, onClose, onSaved }: { open: boolean; traineeId: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Record<string, string | number>>({ period_label: "", department: "", rating_technical: 3, rating_attitude: 3, rating_learning: 3, rating_teamwork: 3, strengths: "", improvements: "", reviewer: "" });
  const [busy, setBusy] = useState(false);
  const Stars = ({ k, label }: { k: string; label: string }) => <div className="flex items-center justify-between"><span className="text-[13px]">{label}</span><div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" onClick={() => setF((p) => ({ ...p, [k]: i }))}><Star className={cn("w-6 h-6 transition-colors", i <= Number(f[k]) ? "fill-[#EDC817] text-[#EDC817]" : "text-[#DDDDDD] hover:text-[#EDC817]")} /></button>)}</div></div>;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[480px]" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>Progress review</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3"><Field label="Period"><Input value={String(f.period_label)} onChange={(e) => setF((p) => ({ ...p, period_label: e.target.value }))} placeholder="e.g. Month 3 / Rotation 1" /></Field><Field label="Department"><Input value={String(f.department)} onChange={(e) => setF((p) => ({ ...p, department: e.target.value }))} /></Field></div>
        <div className="border border-[#DDDDDD] rounded-[6px] p-3 space-y-2"><Stars k="rating_technical" label="Technical skills" /><Stars k="rating_attitude" label="Attitude & discipline" /><Stars k="rating_learning" label="Learning agility" /><Stars k="rating_teamwork" label="Teamwork" /></div>
        <Field label="Strengths"><Textarea rows={2} value={String(f.strengths)} onChange={(e) => setF((p) => ({ ...p, strengths: e.target.value }))} /></Field>
        <Field label="Areas to improve"><Textarea rows={2} value={String(f.improvements)} onChange={(e) => setF((p) => ({ ...p, improvements: e.target.value }))} /></Field>
        <Field label="Reviewer"><Input value={String(f.reviewer)} onChange={(e) => setF((p) => ({ ...p, reviewer: e.target.value }))} placeholder="Supervisor name" /></Field>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={async () => { setBusy(true); const e = await addReview({ ...f, trainee_id: traineeId } as Partial<Review>); setBusy(false); if (!e) { onSaved(); onClose(); } }}>{busy ? "Saving…" : "Save review"}</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}

// ====================================================================
function Schedules({ t, onOpen }: { t: T; onOpen: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="text-[13px] text-[#525252]">An exam groups an intake. Split it into sittings to match the devices available.</p><Button onClick={() => setOpen(true)} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black h-9"><Plus className="w-4 h-4 mr-1.5" />New exam</Button></div>
      {t.schedules.length === 0 ? <div className="bg-white border border-dashed border-[#C4C4C4] rounded-[6px] py-16 text-center"><ClipboardCheck className="w-10 h-10 mx-auto text-[#C4C4C4]" /><p className="text-[14px] font-semibold mt-3">No exams yet</p><p className="text-[12px] text-[#9C9C9C] mt-1">Create one for your next intake, add sittings, then assign candidates.</p></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{t.schedules.map((s) => { const live = s.sittings.some((x) => x.status === "open"); const pct = s.attempt_count ? (s.submitted_count / s.attempt_count) * 100 : 0; return (
          <button key={s.id} onClick={() => onOpen(s.id)} className="text-left bg-white border border-[#DDDDDD] rounded-[6px] p-4 hover:border-[#EDC817] hover:shadow-sm transition-all">
            <div className="flex items-start justify-between"><div className="text-[15px] font-semibold text-black">{s.name}</div>{live ? <span className="text-[10px] font-bold text-[#1B7A43] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1B7A43] animate-pulse" />LIVE</span> : <span className={cn("text-[10px] font-bold uppercase", s.status === "closed" ? "text-[#9C9C9C]" : "text-[#8C7600]")}>{s.status}</span>}</div>
            <div className="text-[12px] text-[#6B6B6B] mt-0.5">{TYPE_LABEL[s.trainee_type]} · {s.sittings.length} sitting{s.sittings.length === 1 ? "" : "s"} · {s.form_mode === "rotate" ? "rotating forms" : `form ${s.form_code}`}</div>
            <div className="mt-3 flex items-center justify-between text-[12px]"><span>{s.submitted_count} of {s.attempt_count} completed</span><span className="text-[#9C9C9C]">{fmtDate(s.created_at)}</span></div>
            <div className="h-1.5 bg-[#EEEEEE] rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-black" style={{ width: `${pct}%` }} /></div>
          </button>); })}</div>)}
      <NewScheduleDialog t={t} open={open} onClose={() => setOpen(false)} onCreated={onOpen} />
    </div>
  );
}

function NewScheduleDialog({ t, open, onClose, onCreated }: { t: T; open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState(""); const [type, setType] = useState("mixed"); const [mode, setMode] = useState<"rotate" | "fixed">("rotate"); const [form, setForm] = useState("A");
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS); const [low, setLow] = useState(65); const [mod, setMod] = useState(45); const [pers, setPers] = useState(true);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const total = Object.values(weights).reduce((s, x) => s + x, 0);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[640px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>New exam</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Attachment intake — January 2027" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Candidates"><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mixed">GTs & students</SelectItem><SelectItem value="graduate_trainee">Graduate trainees</SelectItem><SelectItem value="attachment_student">Attachment students</SelectItem></SelectContent></Select></Field>
          <Field label="Test forms"><Select value={mode} onValueChange={(v) => setMode(v as "rotate" | "fixed")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rotate">Rotate A–J (recommended)</SelectItem><SelectItem value="fixed">One form for everyone</SelectItem></SelectContent></Select></Field>
        </div>
        {mode === "fixed" && <Field label="Form"><div className="flex gap-1.5">{FORM_CODES.map((c) => <button key={c} onClick={() => setForm(c)} className={cn("w-9 h-9 rounded-[4px] border-2 font-bold text-[13px]", form === c ? "border-black bg-[#EDC817]" : "border-[#DDDDDD]")}>{c}</button>)}</div></Field>}
        <div>
          <div className="flex items-center justify-between mb-1.5"><span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B6B6B]">Section weights</span><span className={cn("text-[12px] font-semibold", total === 100 ? "text-[#1B7A43]" : "text-[#B91C1C]")}>Total {total}%</span></div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2">{COGNITIVE_SECTIONS.map((s) => (
            <div key={s} className="flex items-center gap-2 text-[12px]"><span className="flex-1">{SECTION_LABELS[s]}</span><input type="range" min={0} max={40} value={weights[s]} onChange={(e) => setWeights((w) => ({ ...w, [s]: Number(e.target.value) }))} className="w-[110px] accent-[#EDC817]" /><span className="w-8 text-right font-semibold">{weights[s]}</span></div>))}</div>
          <p className="text-[11px] text-[#9C9C9C] mt-1.5">Tip: for non-engineering students, lower Mechanical and raise Verbal and Numerical.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Recommended (low risk) from"><Input type="number" value={low} onChange={(e) => setLow(Number(e.target.value))} /></Field>
          <Field label="Moderate risk from"><Input type="number" value={mod} onChange={(e) => setMod(Number(e.target.value))} /></Field>
        </div>
        <label className="flex items-center gap-2.5 text-[13px]"><Switch checked={pers} onCheckedChange={setPers} />Include personality questionnaire (46 items, about 10 minutes)</label>
        {err && <p className="text-[12px] text-[#B91C1C]">{err}</p>}
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy || !name.trim() || total !== 100 || mod >= low} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={async () => { setBusy(true); const r = await t.createSchedule({ name, trainee_type: type, form_mode: mode, form_code: mode === "fixed" ? form : null, weights, low_risk_min: low, moderate_min: mod, include_personality: pers }); setBusy(false); if (r.error) setErr(r.error); else { onClose(); onCreated(r.id!); } }}>{busy ? "Creating…" : "Create exam"}</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}

// ====================================================================
function ScheduleDetail({ t, scheduleId, onBack, onOpenPerson }: { t: T; scheduleId: string; onBack: () => void; onOpenPerson: (id: string) => void }) {
  const schedule = t.schedules.find((s) => s.id === scheduleId);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [assignOpen, setAssignOpen] = useState(false); const [sittingOpen, setSittingOpen] = useState(false);
  const [slips, setSlips] = useState<string | null>(null); const [report, setReport] = useState(false); const [cand, setCand] = useState<AttemptSummary | null>(null);
  const [filter, setFilter] = useState<string>("all"); const [msg, setMsg] = useState<string | null>(null);
  const load = async () => {
    const { data } = await supabase.from("assessment_attempts").select("*").eq("schedule_id", scheduleId).neq("status", "void");
    setAttempts((data ?? []) as AttemptSummary[]);
  };
  const live = schedule?.sittings.some((s) => s.status === "open");
  useEffect(() => { void load(); }, [scheduleId, t.trainees.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!live) return; const i = setInterval(() => void load(), 10000); return () => clearInterval(i); }, [live]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!schedule) return null;
  const byId = Object.fromEntries(t.trainees.map((x) => [x.id, x]));
  const visible = attempts.filter((a) => filter === "all" || a.sitting_id === filter || (filter === "none" && !a.sitting_id));
  const stat = (s: string) => attempts.filter((a) => a.status === s).length;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-[13px] text-[#8C7600] hover:underline">← All exams</button>
      <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px]"><h2 className="text-[20px] font-bold">{schedule.name}</h2><p className="text-[12px] text-[#6B6B6B]">{TYPE_LABEL[schedule.trainee_type]} · {schedule.form_mode === "rotate" ? "forms rotate A–J between neighbours" : `everyone writes form ${schedule.form_code}`} · recommended ≥ {schedule.low_risk_min}, moderate ≥ {schedule.moderate_min}</p></div>
        <div className="flex gap-4 text-center">{[["Assigned", stat("assigned"), "#9C9C9C"], ["Writing", stat("in_progress"), "#1E6BA3"], ["Completed", stat("submitted"), "#1B7A43"]].map(([l, v, c]) => <div key={l as string}><div className="text-[22px] font-bold" style={{ color: c as string }}>{v}</div><div className="text-[10px] uppercase tracking-[0.05em] text-[#6B6B6B]">{l}</div></div>)}</div>
        <div className="flex gap-2"><Button variant="outline" className="h-9 text-[13px]" onClick={() => setSlips("all")}><Printer className="w-4 h-4 mr-1.5" />Access slips</Button><Button disabled={!stat("submitted")} className="h-9 text-[13px] bg-black text-white hover:bg-[#222]" onClick={() => setReport(true)}><FileText className="w-4 h-4 mr-1.5" />Consolidated report</Button></div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2"><h3 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#6B6B6B]">Sittings</h3><button onClick={() => setSittingOpen(true)} className="text-[12px] font-semibold text-[#8C7600] hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add sitting</button></div>
        {schedule.sittings.length === 0 ? <div className="bg-[#FDF8DC] border-l-4 border-[#EDC817] px-4 py-3 text-[13px]">Add at least one sitting (date, venue, number of devices) before assigning candidates — sittings control when candidates can start.</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">{schedule.sittings.map((s) => { const n = attempts.filter((a) => a.sitting_id === s.id); const done = n.filter((a) => a.status === "submitted").length; const writing = n.filter((a) => a.status === "in_progress").length; return (
            <div key={s.id} className={cn("bg-white border-2 rounded-[6px] p-3.5", s.status === "open" ? "border-[#1B7A43]" : "border-[#DDDDDD]")}>
              <div className="flex items-center justify-between"><span className="text-[14px] font-semibold">{s.label}</span>{s.status === "open" ? <span className="text-[10px] font-bold text-[#1B7A43] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#1B7A43] animate-pulse" />OPEN</span> : <span className="text-[10px] font-bold uppercase text-[#9C9C9C]">{s.status}</span>}</div>
              <div className="text-[11px] text-[#6B6B6B]">{fmtDT(s.starts_at)}{s.venue ? ` · ${s.venue}` : ""}</div>
              <div className="flex items-center gap-1 mt-2.5">{Array.from({ length: s.capacity }).map((_, i) => <div key={i} className="flex-1 h-2 rounded-sm" style={{ background: i < done ? "#1B7A43" : i < done + writing ? "#1E6BA3" : i < n.length ? "#EDC817" : "#EEEEEE" }} />)}</div>
              <div className="text-[11px] text-[#6B6B6B] mt-1">{n.length}/{s.capacity} seats · {writing} writing · {done} done</div>
              <div className="flex gap-1.5 mt-3">
                {s.status === "scheduled" && <Button size="sm" className="h-7 text-[12px] bg-[#1B7A43] hover:bg-[#14603a] text-white flex-1" onClick={() => void t.setSittingStatus(s.id, "open")}><Play className="w-3 h-3 mr-1" />Open now</Button>}
                {s.status === "open" && <Button size="sm" className="h-7 text-[12px] bg-[#B91C1C] text-white flex-1" onClick={() => { if (confirm(`Close ${s.label}? Anyone still writing will be submitted with their answers so far.`)) void t.setSittingStatus(s.id, "closed"); }}><Square className="w-3 h-3 mr-1" />Close</Button>}
                {s.status === "closed" && <Button size="sm" variant="outline" className="h-7 text-[12px] flex-1" onClick={() => void t.setSittingStatus(s.id, "open")}>Re-open</Button>}
                <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => setSlips(s.id)}><Printer className="w-3 h-3" /></Button>
              </div>
            </div>); })}</div>)}
      </div>

      <div className="bg-white border border-[#DDDDDD] rounded-[6px]">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#DDDDDD]">
          <h3 className="text-[14px] font-semibold mr-2">Candidates ({attempts.length})</h3>
          <Select value={filter} onValueChange={setFilter}><SelectTrigger className="h-8 w-[170px] text-[12px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sittings</SelectItem>{schedule.sittings.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}<SelectItem value="none">No sitting</SelectItem></SelectContent></Select>
          {live && <span className="text-[11px] text-[#1B7A43] flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin [animation-duration:3s]" />live — refreshes every 10s</span>}
          <div className="flex-1" />
          {msg && <span className="text-[12px] text-[#1B7A43]">{msg}</span>}
          <Button variant="outline" className="h-8 text-[12px]" onClick={() => { void navigator.clipboard.writeText(attempts.map((a) => `${byId[a.trainee_id]?.full_name}\t${a.access_code}\t${EXAM_URL}/${a.access_code}`).join("\n")); setMsg("Codes copied — paste into Excel"); setTimeout(() => setMsg(null), 3000); }}><Copy className="w-3.5 h-3.5 mr-1" />Copy codes</Button>
          <Button className="h-8 text-[12px] bg-[#EDC817] hover:bg-[#D9B60F] text-black" disabled={schedule.sittings.length === 0} onClick={() => setAssignOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />Add candidates</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#FAFAFA] text-[11px] uppercase tracking-[0.05em] text-[#6B6B6B]"><tr>{["Candidate", "Sitting", "Code", "Form", "Progress", "Score", "Result", "Integrity", ""].map((h) => <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#EEEEEE]">
              {visible.sort((a, b) => (b.weighted_score ?? -1) - (a.weighted_score ?? -1)).map((a) => { const p = byId[a.trainee_id]; const flagged = (a.flags ?? []).length > 0 || a.focus_lost > 0 || a.copy_paste > 0; return (
                <tr key={a.id} className="hover:bg-[#FAFAFA]">
                  <td className="px-3 py-2"><button onClick={() => onOpenPerson(a.trainee_id)} className="font-semibold text-black hover:underline">{p?.full_name ?? "—"}</button><div className="text-[11px] text-[#9C9C9C]">{p ? TYPE_LABEL[p.trainee_type] : ""}</div></td>
                  <td className="px-3"><Select value={a.sitting_id ?? "none"} onValueChange={(v) => void t.moveAttempt(a.id, v === "none" ? null : v).then(load)} disabled={a.status !== "assigned"}><SelectTrigger className="h-7 w-[130px] text-[12px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">—</SelectItem>{schedule.sittings.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></td>
                  <td className="px-3 font-mono text-[12px]">{a.access_code}</td>
                  <td className="px-3 font-bold">{a.form_code}</td>
                  <td className="px-3 w-[140px]">{a.status === "submitted" ? <span className="text-[12px] text-[#1B7A43] font-semibold">Submitted</span> : a.status === "in_progress" ? <div><div className="h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden"><div className="h-full bg-[#1E6BA3]" style={{ width: `${((a.current_seq - 1) / a.item_count) * 100}%` }} /></div><div className="text-[10px] text-[#6B6B6B] mt-0.5">Q{a.current_seq}/{a.item_count}</div></div> : <span className="text-[12px] text-[#9C9C9C]">Not started</span>}</td>
                  <td className="px-3 font-bold">{a.weighted_score ?? "—"}</td>
                  <td className="px-3"><RiskPill risk={a.risk} /></td>
                  <td className="px-3">{flagged ? <span className="text-[11px] text-[#C27A06] font-semibold flex items-center gap-1" title={(a.flags ?? []).join("\n")}><AlertTriangle className="w-3.5 h-3.5" />{a.focus_lost} away · {a.copy_paste} copy</span> : <span className="text-[11px] text-[#1B7A43]">Clean</span>}</td>
                  <td className="px-3 whitespace-nowrap text-right">
                    {a.status === "submitted" && <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setCand(a)}>Report</Button>}
                    {a.status === "in_progress" && <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { if (confirm("Finalise now? Unanswered questions will be marked as not answered.")) void t.finaliseAttempt(a.id).then(load); }}>Finalise</Button>}
                    {a.status === "assigned" && <button className="text-[#9C9C9C] hover:text-[#B91C1C] ml-1" title="Remove from exam" onClick={() => void t.removeAttempt(a).then(load)}><X className="w-4 h-4" /></button>}
                  </td>
                </tr>); })}
              {visible.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-[13px] text-[#9C9C9C]">No candidates yet. Click “Add candidates”.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <AssignDialog t={t} schedule={schedule} open={assignOpen} onClose={() => setAssignOpen(false)} assigned={attempts.map((a) => a.trainee_id)} onDone={load} />
      <SittingDialog t={t} scheduleId={schedule.id} open={sittingOpen} onClose={() => setSittingOpen(false)} />
      <SlipsDialog open={!!slips} onClose={() => setSlips(null)} schedule={schedule} attempts={attempts.filter((a) => slips === "all" || a.sitting_id === slips)} byId={byId} />
      <ScheduleReport open={report} onClose={() => setReport(false)} schedule={schedule} attempts={attempts} trainees={t.trainees} />
      {cand && byId[cand.trainee_id] && <CandidateReport open onClose={() => setCand(null)} attempt={cand} trainee={byId[cand.trainee_id]} schedule={schedule} cohort={attempts} />}
    </div>
  );
}

function SittingDialog({ t, scheduleId, open, onClose }: { t: T; scheduleId: string; open: boolean; onClose: () => void }) {
  const [f, setF] = useState({ label: "", starts_at: "", venue: "", capacity: "20" }); const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[440px]" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>Add sitting</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Field label="Label"><Input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="e.g. Batch 1 — Monday 08:00" /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Starts"><Input type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} /></Field><Field label="Devices / seats"><Input type="number" min={1} max={100} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field></div>
        <Field label="Venue"><Input value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} placeholder="e.g. Head Office training room" /></Field>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy || !f.label.trim()} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={async () => { setBusy(true); const e = await t.addSitting(scheduleId, { label: f.label, starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null, venue: f.venue, capacity: Number(f.capacity) || 20 }); setBusy(false); if (!e) { setF({ label: "", starts_at: "", venue: "", capacity: f.capacity }); onClose(); } }}>Add sitting</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}

function AssignDialog({ t, schedule, open, onClose, assigned, onDone }: { t: T; schedule: Schedule; open: boolean; onClose: () => void; assigned: string[]; onDone: () => void }) {
  const eligible = t.trainees.filter((p) => !assigned.includes(p.id) && ["pending", "assessment"].includes(p.status) && (schedule.trainee_type === "mixed" || p.trainee_type === schedule.trainee_type));
  const [sel, setSel] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [prog, setProg] = useState<[number, number] | null>(null); const [err, setErr] = useState<string | null>(null);
  const free = schedule.sittings.filter((s) => s.status !== "closed").reduce((s, x) => s + x.capacity, 0) - assigned.length;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}><DialogContent className="max-w-[600px]" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>Add candidates</DialogTitle></DialogHeader>
      <p className="text-[12px] text-[#525252]">Each candidate gets their own randomised paper and access code, and fills the next free seat in your sittings ({Math.max(0, free)} seats free). Anyone beyond capacity is added without a sitting — add another sitting and move them.</p>
      <div className="flex items-center justify-between text-[12px]"><span>{eligible.length} eligible (pending, not already in this exam)</span><button className="font-semibold text-[#8C7600]" onClick={() => setSel(sel.length === eligible.length ? [] : eligible.map((e) => e.id))}>{sel.length === eligible.length ? "Clear" : "Select all"}</button></div>
      <div className="border border-[#DDDDDD] rounded-[6px] max-h-[300px] overflow-y-auto divide-y divide-[#EEEEEE]">
        {eligible.map((p) => <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[#FAFAFA] cursor-pointer"><Checkbox checked={sel.includes(p.id)} onCheckedChange={() => setSel((s) => s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id])} /><div className="flex-1"><div className="text-[13px] font-semibold">{p.full_name}</div><div className="text-[11px] text-[#9C9C9C]">{TYPE_LABEL[p.trainee_type]} · {p.institution ?? ""}</div></div></label>)}
        {eligible.length === 0 && <div className="py-8 text-center text-[12px] text-[#9C9C9C]">No pending people to add. Add or import trainees first.</div>}
      </div>
      {prog && <div><div className="h-2 bg-[#EEEEEE] rounded-full overflow-hidden"><div className="h-full bg-[#EDC817] transition-all" style={{ width: `${(prog[0] / prog[1]) * 100}%` }} /></div><p className="text-[11px] text-[#6B6B6B] mt-1">Generating papers… {prog[0]} of {prog[1]}</p></div>}
      {err && <p className="text-[12px] text-[#B91C1C]">{err}</p>}
      <DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy || sel.length === 0} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={async () => { setBusy(true); setErr(null); const e = await t.assignCandidates(schedule, sel, (d, n) => setProg([d, n])); setBusy(false); setProg(null); if (e) setErr(e); else { setSel([]); onDone(); onClose(); } }}>{busy ? "Working…" : `Add ${sel.length} & generate papers`}</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}

function SlipsDialog({ open, onClose, schedule, attempts, byId }: { open: boolean; onClose: () => void; schedule: Schedule; attempts: AttemptSummary[]; byId: Record<string, Trainee> }) {
  const sitting = (id: string | null) => schedule.sittings.find((s) => s.id === id);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[880px] max-h-[90vh] overflow-y-auto p-0" aria-describedby={undefined}>
      <style>{`@media print { body * { visibility: hidden !important; } #slips, #slips * { visibility: visible !important; } #slips { position: absolute; inset: 0; } @page { size: A4; margin: 1cm; } }`}</style>
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#DDDDDD] print:hidden"><span className="text-[14px] font-semibold">Access slips — print and cut</span><button onClick={() => window.print()} className="h-8 px-3 rounded-[4px] bg-[#EDC817] text-black text-[12px] font-semibold flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" />Print</button></div>
      <div id="slips" className="p-6 grid grid-cols-2 gap-3 bg-white">
        {attempts.map((a) => { const p = byId[a.trainee_id]; const s = sitting(a.sitting_id); return (
          <div key={a.id} className="border-2 border-dashed border-[#9C9C9C] rounded-[6px] p-4" style={{ breakInside: "avoid" }}>
            <div className="flex items-center justify-between border-b-2 border-[#EDC817] pb-1.5 mb-2"><img src="/magaya_logo.png" className="h-[24px]" alt="" /><span className="text-[10px] font-semibold text-[#6B6B6B]">CANDIDATE ACCESS SLIP</span></div>
            <div className="text-[15px] font-bold">{p?.full_name}</div>
            <div className="text-[11px] text-[#6B6B6B]">{s ? `${s.label}${s.venue ? " · " + s.venue : ""}` : "Sitting to be confirmed"}</div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.06em] text-[#6B6B6B]">Your access code</div>
            <div className="font-mono text-[22px] font-bold tracking-[0.2em]">{a.access_code}</div>
            <div className="text-[10px] text-[#525252] mt-1">Go to <strong>{EXAM_URL.replace(/^https?:\/\//, "")}</strong> and enter the code. Keep this slip private.</div>
          </div>); })}
        {attempts.length === 0 && <p className="col-span-2 text-center text-[13px] text-[#9C9C9C] py-10">No candidates in this selection.</p>}
      </div>
    </DialogContent></Dialog>
  );
}

// ====================================================================
function Library() {
  const [bank, setBank] = useState<BankItem[]>([]); const [form, setForm] = useState("A"); const [paper, setPaper] = useState<GenItem[]>([]); const [showAns, setShowAns] = useState(false);
  useEffect(() => { void supabase.from("assessment_bank").select("section, kind, prompt, options, correct, trait, reverse, time_limit, form_code").eq("active", true).then(({ data }) => setBank((data ?? []) as BankItem[])); }, []);
  useEffect(() => { if (bank.length) setPaper(buildPaper(form, bank, false)); }, [form, bank]);
  const mins = Math.round(paper.reduce((s, x) => s + x.time_limit, 0) / 60);
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
      <div className="space-y-4">
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-4">
          <h3 className="text-[14px] font-semibold mb-2">10 rotating forms</h3>
          <div className="grid grid-cols-5 gap-1.5">{FORM_CODES.map((c) => <button key={c} onClick={() => setForm(c)} className={cn("h-10 rounded-[4px] border-2 font-bold", form === c ? "border-black bg-[#EDC817]" : "border-[#DDDDDD] hover:border-black")}>{c}</button>)}</div>
          <p className="text-[12px] text-[#525252] mt-3">Each form has its own verbal passages and its own mix of question types. On top of that, every number, table, series and code is regenerated for each candidate.</p>
        </div>
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-4 text-[12px] space-y-2">
          <h3 className="text-[14px] font-semibold">How cheating is made hard</h3>
          {["Questions are sent one at a time from the server; answer keys never reach the candidate's device.", "Every question has its own short timer, enforced by the server (not the browser).", "Numbers are unique to each candidate, so shared answers are useless.", "Neighbours get different forms when rotation is on.", "No going back; refreshing does not stop the clock.", "Full screen is required; leaving the window, copy/paste and print shortcuts are blocked or recorded.", "A watermark with the candidate's name and code covers the screen.", "Sittings only open when you press “Open now”, so tests are written under supervision."].map((x) => <div key={x} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#1B7A43] shrink-0" />{x}</div>)}
          <p className="text-[11px] text-[#6B6B6B] pt-1 border-t border-[#EEEEEE]">No online test is fully AI-proof. Supervised sittings with phones put away remain the strongest control; the timers make looking things up very costly.</p>
        </div>
      </div>
      <div className="bg-white border border-[#DDDDDD] rounded-[6px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#DDDDDD]">
          <div><h3 className="text-[14px] font-semibold">Sample paper — Form {form}</h3><p className="text-[11px] text-[#6B6B6B]">{paper.length} aptitude questions · about {mins} minutes + 46 personality items · this preview is regenerated each time</p></div>
          <div className="flex items-center gap-3"><label className="flex items-center gap-2 text-[12px]"><Switch checked={showAns} onCheckedChange={setShowAns} />Show answers</label><Button variant="outline" className="h-8 text-[12px]" onClick={() => setPaper(buildPaper(form, bank, false))}><RefreshCw className="w-3.5 h-3.5 mr-1" />New sample</Button></div>
        </div>
        <div className="divide-y divide-[#EEEEEE] max-h-[70vh] overflow-y-auto">
          {paper.map((it, i) => (
            <div key={i} className="px-4 py-3 text-[13px]">
              <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded bg-[#F5F5F5] text-[#525252]">{SECTION_LABELS[it.section]}</span><span className="text-[10px] text-[#9C9C9C]">{it.time_limit}s</span></div>
              <div className="whitespace-pre-line">{i + 1}. {it.prompt}</div>
              {it.stimulus && <table className="mt-2 text-[11px] border-collapse font-mono">{(it.stimulus as { rows: (string | number)[][] }).rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} className="border border-[#DDDDDD] px-2 py-0.5">{c}</td>)}</tr>)}</table>}
              <div className="flex flex-wrap gap-1.5 mt-2">{it.options.map((o) => <span key={o} className={cn("px-2 py-0.5 rounded border text-[12px]", showAns && o === it.correct ? "border-[#1B7A43] bg-[#E8F5EC] text-[#1B7A43] font-semibold" : "border-[#DDDDDD]")}>{o}</span>)}</div>
            </div>))}
        </div>
      </div>
    </div>
  );
}
