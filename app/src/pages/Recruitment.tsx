// src/pages/Recruitment.tsx — in-house recruitment & CV repository
import { useEffect, useMemo, useState } from "react";
import { Briefcase, LayoutDashboard, Columns3, Database, Plus, Search, Star, FileText, Linkedin, Copy, ExternalLink, Upload, Calendar, MessageSquare, TrendingUp, Trophy, Users, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRecruitment, loadActivity, loadInterviews, STAGES, STAGE_META, SOURCES, DROP_REASONS, careersUrl, linkedInShare, daysSince, type Applicant, type Application, type Job, type Stage, type Activity, type Interview } from "@/hooks/useRecruitment";

type R = ReturnType<typeof useRecruitment>;
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const initials = (a: Applicant) => `${a.first_name[0] ?? ""}${a.surname[0] ?? ""}`.toUpperCase();
const AVATAR = ["#EDC817", "#1E6BA3", "#1B7A43", "#7C3AED", "#C27A06", "#000000"];
const avatarColor = (id: string) => AVATAR[id.charCodeAt(0) % AVATAR.length];

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) { return <div className={className}><label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6B6B6B] mb-1">{label}</label>{children}</div>; }
function Stars({ value, onChange, size = 14 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return <span className="inline-flex">{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" disabled={!onChange} onClick={(e) => { e.stopPropagation(); onChange?.(i === value ? 0 : i); }} className={onChange ? "cursor-pointer" : "cursor-default"}><Star style={{ width: size, height: size }} className={i <= value ? "fill-[#EDC817] text-[#EDC817]" : "text-[#DDDDDD]"} /></button>)}</span>;
}
function Avatar({ a, size = 32 }: { a: Applicant; size?: number }) {
  const bg = avatarColor(a.id);
  return <div className="rounded-full flex items-center justify-center font-bold shrink-0" style={{ width: size, height: size, background: bg, color: bg === "#EDC817" ? "#000" : "#fff", fontSize: size * 0.38 }}>{initials(a)}</div>;
}

// ====================================================================
export default function Recruitment() {
  const r = useRecruitment();
  const [tab, setTab] = useState<"dashboard" | "pipeline" | "pool" | "jobs">("dashboard");
  const [openId, setOpenId] = useState<string | null>(null);
  const [jobFocus, setJobFocus] = useState<string | null>(null);
  if (r.loading) return <div className="py-32 flex flex-col items-center gap-3"><div className="w-8 h-8 border-[3px] border-[#DDDDDD] border-t-[#EDC817] rounded-full animate-spin" /><p className="text-[13px] text-[#9C9C9C]">Loading recruitment…</p></div>;
  const tabs = [{ k: "dashboard", l: "Dashboard", i: LayoutDashboard }, { k: "pipeline", l: "Pipeline", i: Columns3 }, { k: "pool", l: "Talent Pool", i: Database }, { k: "jobs", l: "Jobs", i: Briefcase }] as const;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-[26px] font-bold text-black tracking-[-0.02em]">Recruitment</h1><p className="text-[13px] text-[#525252] mt-1">Our own CV repository and hiring pipeline — every candidate we meet stays findable</p></div>
        <a href={careersUrl()} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-[#8C7600] hover:underline flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" />View public careers page</a>
      </div>
      {r.error && <div className="px-4 py-3 rounded-[6px] border border-[#B91C1C]/30 bg-[#FEF2F2] text-[13px] text-[#B91C1C]">{r.error}</div>}
      <div className="flex gap-1 border-b border-[#DDDDDD]">{tabs.map((x) => <button key={x.k} onClick={() => setTab(x.k)} className={cn("px-4 py-2.5 text-[13px] font-medium flex items-center gap-2 border-b-[3px] -mb-px", tab === x.k ? "border-[#EDC817] text-black font-semibold" : "border-transparent text-[#6B6B6B] hover:text-black")}><x.i className="w-4 h-4" />{x.l}</button>)}</div>
      {tab === "dashboard" && <Dashboard r={r} onOpen={setOpenId} onJob={(id) => { setJobFocus(id); setTab("pipeline"); }} />}
      {tab === "pipeline" && <Pipeline r={r} onOpen={setOpenId} jobId={jobFocus} setJobId={setJobFocus} />}
      {tab === "pool" && <Pool r={r} onOpen={setOpenId} />}
      {tab === "jobs" && <Jobs r={r} onPipeline={(id) => { setJobFocus(id); setTab("pipeline"); }} />}
      <CandidateDrawer r={r} applicantId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

// ====================================================================
function Dashboard({ r, onOpen, onJob }: { r: R; onOpen: (id: string) => void; onJob: (id: string) => void }) {
  const [fee, setFee] = useState(String(r.agencyFee || ""));
  const year = new Date().getFullYear();
  const hires = r.applications.filter((a) => a.stage === "hired" && new Date(a.stage_changed_at).getFullYear() === year);
  const directHires = hires.filter((a) => !a.via_agency).length;
  const active = r.applications.filter((a) => !["hired", "rejected", "withdrawn"].includes(a.stage));
  const reached = (s: Stage) => r.applications.filter((a) => STAGES.indexOf(a.stage as (typeof STAGES)[number]) >= STAGES.indexOf(s as (typeof STAGES)[number])).length;
  const funnel = STAGES.map((s) => ({ s, n: reached(s) }));
  const max = Math.max(1, funnel[0].n);
  const sources = SOURCES.map((s) => ({ s, n: r.applicants.filter((a) => a.source === s).length, h: r.applications.filter((ap) => ap.stage === "hired" && r.applicants.find((a) => a.id === ap.applicant_id)?.source === s).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const smax = Math.max(1, ...sources.map((s) => s.n));
  const drops = DROP_REASONS.map((d) => ({ d, n: r.applications.filter((a) => a.stage === "rejected" && a.outcome_reason === d).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  const timeToHire = hires.length ? Math.round(hires.reduce((s, a) => s + (+new Date(a.stage_changed_at) - +new Date(a.created_at)) / 86400000, 0) / hires.length) : null;
  const recent = r.applicants.slice(0, 6);
  const openJobs = r.jobs.filter((j) => j.status === "open");
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[["Open jobs", openJobs.length, Briefcase, "#EDC817"], ["In pipeline", active.length, Columns3, "#1E6BA3"], ["Talent pool", r.applicants.filter((a) => a.talent_pool).length, Database, "#7C3AED"], [`Hires ${year}`, hires.length, Trophy, "#1B7A43"], ["Avg days to hire", timeToHire ?? "—", TrendingUp, "#C27A06"], ["Candidates", r.applicants.length, Users, "#000"]].map(([l, v, Icon, c]) => {
          const I = Icon as typeof Briefcase; return (
          <div key={l as string} className="bg-white border border-[#DDDDDD] rounded-[6px] p-4"><div className="flex items-center justify-between"><div className="text-[26px] font-bold leading-none">{v as number}</div><div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${c}22` }}><I className="w-4 h-4" style={{ color: c === "#EDC817" ? "#8C7600" : (c as string) }} /></div></div><div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B6B6B] mt-2">{l as string}</div></div>); })}
      </div>

      <div className="bg-black rounded-[6px] p-5 flex flex-wrap items-center gap-6 border-b-4 border-[#EDC817]">
        <div className="flex-1 min-w-[260px]"><div className="text-[#EDC817] text-[11px] font-bold uppercase tracking-[0.08em]">Placement fees avoided in {year}</div>
          <div className="text-white text-[34px] font-bold leading-tight">USD {(directHires * (Number(fee) || 0)).toLocaleString()}</div>
          <div className="text-[#CFCFCF] text-[12px]">{directHires} direct hire{directHires === 1 ? "" : "s"} (not via agency) × average agency fee</div></div>
        <div className="flex items-end gap-2"><Field label=""><div className="text-[11px] text-[#CFCFCF] mb-1">Average agency fee per hire (USD)</div><Input value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ""))} className="h-9 w-[150px] bg-[#111] border-[#333] text-white" /></Field><Button onClick={() => void r.saveAgencyFee(Number(fee) || 0)} className="h-9 bg-[#EDC817] hover:bg-[#D9B60F] text-black">Save</Button></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-5">
          <h3 className="text-[14px] font-semibold mb-4">Hiring funnel <span className="text-[12px] font-normal text-[#9C9C9C]">— all jobs, candidates who reached each stage</span></h3>
          <div className="space-y-1.5">{funnel.map(({ s, n }, i) => { const w = Math.max(n ? 8 : 2, (n / max) * 100); const conv = i > 0 && funnel[i - 1].n ? Math.round((n / funnel[i - 1].n) * 100) : null; return (
            <div key={s} className="flex items-center gap-3"><span className="w-[90px] text-[12px] text-[#525252]">{STAGE_META[s].label}</span>
              <div className="flex-1 flex justify-center"><div className="h-8 rounded-[4px] flex items-center justify-center text-[12px] font-bold transition-all duration-500" style={{ width: `${w}%`, background: STAGE_META[s].color, color: s === "offer" ? "#000" : "#fff" }}>{n}</div></div>
              <span className="w-[54px] text-right text-[11px] text-[#9C9C9C]">{conv !== null ? `${conv}%` : ""}</span></div>); })}</div>
        </div>
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-5">
          <h3 className="text-[14px] font-semibold mb-4">Where candidates come from</h3>
          {sources.length === 0 ? <p className="text-[12px] text-[#9C9C9C] py-8 text-center">No candidates yet.</p> : <div className="space-y-2">{sources.map((x) => (
            <div key={x.s} className="grid grid-cols-[110px_1fr_70px] items-center gap-3 text-[12px]"><span>{x.s}</span><div className="h-5 bg-[#F5F5F5] rounded-[3px] overflow-hidden relative"><div className="h-full bg-[#EDC817]" style={{ width: `${(x.n / smax) * 100}%` }} /><div className="absolute inset-y-0 left-0 bg-[#1B7A43]" style={{ width: `${(x.h / smax) * 100}%` }} /></div><span className="text-right"><strong>{x.n}</strong>{x.h > 0 && <span className="text-[#1B7A43]"> · {x.h} hired</span>}</span></div>))}</div>}
          {drops.length > 0 && <><h4 className="text-[12px] font-semibold mt-5 mb-2 text-[#6B6B6B]">Top reasons candidates were dropped</h4><div className="flex flex-wrap gap-1.5">{drops.slice(0, 5).map((d) => <span key={d.d} className="text-[11px] px-2 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C]">{d.d} · {d.n}</span>)}</div></>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-5"><h3 className="text-[14px] font-semibold mb-3">Newest candidates</h3>
          {recent.length === 0 ? <p className="text-[12px] text-[#9C9C9C] py-6 text-center">Applications from the careers page appear here.</p> : <div className="divide-y divide-[#EEEEEE]">{recent.map((a) => <button key={a.id} onClick={() => onOpen(a.id)} className="w-full flex items-center gap-3 py-2 text-left hover:bg-[#FAFAFA]"><Avatar a={a} /><div className="flex-1 min-w-0"><div className="text-[13px] font-semibold truncate">{a.full_name}</div><div className="text-[11px] text-[#6B6B6B] truncate">{a.current_title ?? a.field_of_study ?? "—"} · {a.source}</div></div><span className="text-[11px] text-[#9C9C9C]">{fmtDate(a.created_at)}</span></button>)}</div>}</div>
        <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-5"><h3 className="text-[14px] font-semibold mb-3">Open jobs</h3>
          {openJobs.length === 0 ? <p className="text-[12px] text-[#9C9C9C] py-6 text-center">No open jobs. Create one under Jobs.</p> : <div className="space-y-2">{openJobs.map((j) => { const apps = r.applications.filter((a) => a.job_id === j.id); return (
            <button key={j.id} onClick={() => onJob(j.id)} className="w-full text-left border border-[#DDDDDD] rounded-[6px] px-3 py-2 hover:border-[#EDC817]"><div className="flex justify-between"><span className="text-[13px] font-semibold">{j.title}</span><span className="text-[11px] text-[#6B6B6B]">{apps.length} applicants</span></div>
              <div className="flex h-1.5 rounded-full overflow-hidden mt-1.5 bg-[#EEEEEE]">{STAGES.map((s) => { const n = apps.filter((a) => a.stage === s).length; return n ? <div key={s} style={{ width: `${(n / apps.length) * 100}%`, background: STAGE_META[s].color }} /> : null; })}</div>
              <div className="text-[11px] text-[#9C9C9C] mt-1">{j.site_name ?? "Any site"}{j.closing_date ? ` · closes ${fmtDate(j.closing_date)}` : ""}</div></button>); })}</div>}</div>
      </div>
    </div>
  );
}

// ====================================================================
function Pipeline({ r, onOpen, jobId, setJobId }: { r: R; onOpen: (id: string) => void; jobId: string | null; setJobId: (id: string | null) => void }) {
  const jobs = r.jobs.filter((j) => j.status !== "draft");
  const job = jobs.find((j) => j.id === jobId) ?? jobs.find((j) => j.status === "open") ?? jobs[0];
  const [drag, setDrag] = useState<string | null>(null); const [over, setOver] = useState<string | null>(null);
  const [dropFor, setDropFor] = useState<{ id: string; stage: Stage } | null>(null); const [reason, setReason] = useState(DROP_REASONS[0]);
  const [addOpen, setAddOpen] = useState(false); const [showClosed, setShowClosed] = useState(false);
  if (!job) return <div className="bg-white border border-dashed border-[#C4C4C4] rounded-[6px] py-16 text-center"><Columns3 className="w-10 h-10 mx-auto text-[#C4C4C4]" /><p className="text-[14px] font-semibold mt-3">No jobs to show</p><p className="text-[12px] text-[#9C9C9C]">Create and open a job under the Jobs tab.</p></div>;
  const apps = r.applications.filter((a) => a.job_id === job.id);
  const byId = Object.fromEntries(r.applicants.map((a) => [a.id, a]));
  const drop = (stage: Stage) => { if (!drag) return; const app = apps.find((a) => a.id === drag); setDrag(null); setOver(null); if (!app || app.stage === stage) return; if (stage === "rejected" || stage === "withdrawn") setDropFor({ id: app.id, stage }); else void r.moveStage(app.id, stage); };
  const col = (stage: Stage, compact = false) => { const list = apps.filter((a) => a.stage === stage); return (
    <div key={stage} onDragOver={(e) => { e.preventDefault(); setOver(stage); }} onDragLeave={() => setOver(null)} onDrop={() => drop(stage)}
      className={cn("rounded-[6px] flex flex-col transition-colors", compact ? "min-w-[200px]" : "min-w-[230px] flex-1", over === stage ? "bg-[#FDF8DC] ring-2 ring-[#EDC817]" : "bg-[#F2F2F2]")}>
      <div className="px-3 py-2.5 flex items-center justify-between"><span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.05em]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STAGE_META[stage].color }} />{STAGE_META[stage].label}</span><span className="text-[11px] font-bold bg-white rounded-full px-2 py-0.5">{list.length}</span></div>
      <div className="px-2 pb-2 space-y-2 min-h-[80px] max-h-[62vh] overflow-y-auto">
        {list.map((ap) => { const a = byId[ap.applicant_id]; if (!a) return null; const d = daysSince(ap.stage_changed_at); return (
          <div key={ap.id} draggable onDragStart={() => setDrag(ap.id)} onDragEnd={() => { setDrag(null); setOver(null); }} onClick={() => onOpen(a.id)}
            className={cn("bg-white rounded-[6px] border border-[#DDDDDD] p-2.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-[#C4C4C4] transition-all group", drag === ap.id && "opacity-40")}>
            <div className="flex items-start gap-2"><Avatar a={a} size={28} /><div className="flex-1 min-w-0"><div className="text-[13px] font-semibold truncate">{a.full_name}</div><div className="text-[11px] text-[#6B6B6B] truncate">{a.current_title ?? a.highest_qualification ?? "—"}</div></div><GripVertical className="w-4 h-4 text-[#DDDDDD] group-hover:text-[#9C9C9C]" /></div>
            <div className="flex items-center justify-between mt-2"><Stars value={a.rating ?? 0} size={11} /><div className="flex items-center gap-1.5">{a.cv_path && <FileText className="w-3 h-3 text-[#9C9C9C]" />}<span className={cn("text-[10px] font-semibold", d > 14 && !["hired", "rejected", "withdrawn"].includes(stage) ? "text-[#B91C1C]" : "text-[#9C9C9C]")}>{d}d</span></div></div>
            {compact && ap.outcome_reason && <div className="text-[10px] text-[#B91C1C] mt-1 truncate">{ap.outcome_reason}</div>}
          </div>); })}
        {list.length === 0 && <div className="text-[11px] text-[#C4C4C4] text-center py-5">Drop here</div>}
      </div>
    </div>); };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={job.id} onValueChange={setJobId}><SelectTrigger className="h-9 w-[300px] text-[13px] font-semibold"><SelectValue /></SelectTrigger><SelectContent>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}{j.site_name ? ` — ${j.site_name}` : ""}{j.status !== "open" ? ` (${j.status})` : ""}</SelectItem>)}</SelectContent></Select>
        <span className="text-[12px] text-[#6B6B6B]">{apps.length} candidates · drag cards between stages · red day counts = stuck over 2 weeks</span>
        <div className="flex-1" />
        <Button variant="outline" className="h-9 text-[13px]" onClick={() => setShowClosed((v) => !v)}>{showClosed ? "Hide" : "Show"} dropped ({apps.filter((a) => a.stage === "rejected" || a.stage === "withdrawn").length})</Button>
        <Button className="h-9 text-[13px] bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1" />Add from talent pool</Button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((s) => col(s))}
        <div className={cn("flex gap-3", !showClosed && !drag && "hidden")}>{col("rejected", true)}{col("withdrawn", true)}</div>
      </div>
      <Dialog open={!!dropFor} onOpenChange={(o) => !o && setDropFor(null)}><DialogContent className="max-w-[420px]" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>{dropFor?.stage === "withdrawn" ? "Candidate withdrew" : "Drop candidate"}</DialogTitle></DialogHeader>
        <p className="text-[12px] text-[#525252]">They stay in the talent pool for future roles. Recording the reason helps you see where candidates fall out.</p>
        <Select value={reason} onValueChange={setReason}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DROP_REASONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
        <DialogFooter><Button variant="outline" onClick={() => setDropFor(null)}>Cancel</Button><Button className="bg-[#B91C1C] text-white" onClick={() => { if (dropFor) void r.moveStage(dropFor.id, dropFor.stage, reason); setDropFor(null); }}>Confirm</Button></DialogFooter>
      </DialogContent></Dialog>
      <AddToJobDialog r={r} job={job} open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function AddToJobDialog({ r, job, open, onClose }: { r: R; job: Job; open: boolean; onClose: () => void }) {
  const [q, setQ] = useState(""); const [agency, setAgency] = useState(false);
  const inJob = new Set(r.applications.filter((a) => a.job_id === job.id).map((a) => a.applicant_id));
  const list = r.applicants.filter((a) => !inJob.has(a.id) && !a.do_not_contact && (!q || `${a.full_name} ${a.current_title ?? ""} ${a.skills.join(" ")} ${a.field_of_study ?? ""}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 40);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[560px]" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>Add to “{job.title}”</DialogTitle></DialogHeader>
      <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]" /><Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, title, skill…" className="pl-9" /></div>
      <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={agency} onChange={(e) => setAgency(e.target.checked)} className="accent-[#EDC817]" />This candidate came through an agency (a placement fee would apply)</label>
      <div className="border border-[#DDDDDD] rounded-[6px] max-h-[320px] overflow-y-auto divide-y divide-[#EEEEEE]">
        {list.map((a) => <button key={a.id} onClick={() => void r.addToJob(a.id, job.id, agency).then(onClose)} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#FAFAFA]"><Avatar a={a} size={28} /><div className="flex-1 min-w-0"><div className="text-[13px] font-semibold">{a.full_name}</div><div className="text-[11px] text-[#6B6B6B] truncate">{a.current_title ?? "—"} · {a.skills.slice(0, 3).join(", ")}</div></div><Plus className="w-4 h-4 text-[#8C7600]" /></button>)}
        {list.length === 0 && <div className="py-8 text-center text-[12px] text-[#9C9C9C]">No matching candidates. Add new candidates in the Talent Pool.</div>}
      </div>
    </DialogContent></Dialog>
  );
}

// ====================================================================
function latestStage(r: R, id: string): Stage | "pool" {
  const apps = r.applications.filter((a) => a.applicant_id === id && a.job_id).sort((a, b) => +new Date(b.stage_changed_at) - +new Date(a.stage_changed_at));
  if (apps.some((a) => a.stage === "hired")) return "hired";
  return apps[0]?.stage ?? "pool";
}

function Pool({ r, onOpen }: { r: R; onOpen: (id: string) => void }) {
  const [q, setQ] = useState(""); const [site, setSite] = useState("all"); const [status, setStatus] = useState("all"); const [source, setSource] = useState("all"); const [role, setRole] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const jobsById = Object.fromEntries(r.jobs.map((j) => [j.id, j]));
  const rows = useMemo(() => r.applicants.map((a) => {
    const apps = r.applications.filter((x) => x.applicant_id === a.id);
    return { a, apps, stage: latestStage(r, a.id), jobTitles: apps.map((x) => (x.job_id ? jobsById[x.job_id]?.title : null)).filter(Boolean) as string[], sites: apps.map((x) => (x.job_id ? jobsById[x.job_id]?.site_id : null)) };
  }).filter(({ a, stage, jobTitles, sites }) => {
    const hay = `${a.full_name} ${a.email ?? ""} ${a.current_title ?? ""} ${a.current_employer ?? ""} ${a.field_of_study ?? ""} ${a.highest_qualification ?? ""} ${a.skills.join(" ")} ${a.tags.join(" ")} ${a.location ?? ""}`.toLowerCase();
    return (!q || q.toLowerCase().split(/\s+/).every((w) => hay.includes(w)))
      && (!role || `${a.current_title ?? ""} ${jobTitles.join(" ")}`.toLowerCase().includes(role.toLowerCase()))
      && (site === "all" || a.preferred_site_id === site || sites.includes(site))
      && (status === "all" || (status === "interviewed" ? ["interview", "offer", "hired"].includes(stage) || r.applications.some((x) => x.applicant_id === a.id && x.stage === "rejected" && x.outcome_reason === "Failed interview") : stage === status))
      && (source === "all" || a.source === source);
  }), [r, q, role, site, status, source, jobsById]);
  const exportCsv = () => {
    const head = ["Name", "Email", "Phone", "Current title", "Employer", "Qualification", "Field", "Years exp", "Skills", "Source", "Latest status", "Applied for", "Rating", "Added"];
    const body = [head, ...rows.map(({ a, stage, jobTitles }) => [a.full_name, a.email, a.phone, a.current_title, a.current_employer, a.highest_qualification, a.field_of_study, a.years_experience, a.skills.join("; "), a.source, stage === "pool" ? "Talent pool" : STAGE_META[stage].label, jobTitles.join("; "), a.rating, fmtDate(a.created_at)])].map((r2) => r2.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const el = document.createElement("a"); el.href = URL.createObjectURL(new Blob([body], { type: "text/csv" })); el.download = "talent_pool.csv"; el.click();
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[260px] max-w-[420px]"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search anything — e.g. “metallurgist CIL 5 years”" className="pl-9 h-9 text-[13px]" /></div>
        <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="h-9 w-[150px] text-[13px]" />
        <Select value={site} onValueChange={setSite}><SelectTrigger className="h-9 w-[150px] text-[13px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sites</SelectItem>{r.sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 w-[160px] text-[13px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any status</SelectItem><SelectItem value="pool">Talent pool only</SelectItem><SelectItem value="interviewed">Was interviewed</SelectItem>{[...STAGES, "rejected", "withdrawn"].map((s) => <SelectItem key={s} value={s}>{STAGE_META[s as Stage].label}</SelectItem>)}</SelectContent></Select>
        <Select value={source} onValueChange={setSource}><SelectTrigger className="h-9 w-[140px] text-[13px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any source</SelectItem>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <div className="flex-1" />
        <Button variant="outline" className="h-9 text-[13px]" onClick={exportCsv}>Export</Button>
        <Button className="h-9 text-[13px] bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1" />Add candidate</Button>
      </div>
      <div className="text-[12px] text-[#6B6B6B]">{rows.length} of {r.applicants.length} candidates</div>
      <div className="bg-white border border-[#DDDDDD] rounded-[6px] overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-[#FAFAFA] text-[11px] uppercase tracking-[0.05em] text-[#6B6B6B]"><tr>{["Candidate", "Background", "Skills", "Status", "Source", "Rating", "CV", "Added"].map((h) => <th key={h} className="text-left font-semibold px-3 py-2.5">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#EEEEEE]">
            {rows.slice(0, 300).map(({ a, stage, jobTitles }) => (
              <tr key={a.id} onClick={() => onOpen(a.id)} className="hover:bg-[#FAFAFA] cursor-pointer">
                <td className="px-3 py-2"><div className="flex items-center gap-2.5"><Avatar a={a} /><div><div className="font-semibold">{a.full_name}{a.do_not_contact && <span className="ml-1.5 text-[10px] text-[#B91C1C]">DO NOT CONTACT</span>}</div><div className="text-[11px] text-[#9C9C9C]">{a.email ?? a.phone ?? "—"}</div></div></div></td>
                <td className="px-3"><div>{a.current_title ?? "—"}</div><div className="text-[11px] text-[#9C9C9C]">{[a.highest_qualification, a.years_experience !== null ? `${a.years_experience} yrs` : null].filter(Boolean).join(" · ")}</div></td>
                <td className="px-3"><div className="flex flex-wrap gap-1 max-w-[220px]">{a.skills.slice(0, 3).map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F5]">{s}</span>)}{a.skills.length > 3 && <span className="text-[10px] text-[#9C9C9C]">+{a.skills.length - 3}</span>}</div></td>
                <td className="px-3">{stage === "pool" ? <span className="text-[11px] text-[#7C3AED] font-semibold">Talent pool</span> : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${STAGE_META[stage].color}22`, color: STAGE_META[stage].color === "#EDC817" ? "#8C7600" : STAGE_META[stage].color }}>{STAGE_META[stage].label}</span>}<div className="text-[10px] text-[#9C9C9C] truncate max-w-[160px]">{jobTitles[0] ?? ""}</div></td>
                <td className="px-3 text-[12px] text-[#525252]">{a.source}</td>
                <td className="px-3"><Stars value={a.rating ?? 0} size={12} /></td>
                <td className="px-3">{a.cv_path ? <FileText className="w-4 h-4 text-[#1B7A43]" /> : <span className="text-[#C4C4C4]">—</span>}</td>
                <td className="px-3 text-[12px] text-[#9C9C9C] whitespace-nowrap">{fmtDate(a.created_at)}</td>
              </tr>))}
            {rows.length === 0 && <tr><td colSpan={8} className="py-14 text-center text-[13px] text-[#9C9C9C]">{r.applicants.length === 0 ? "Your repository is empty. Add CVs you already hold, or share the careers page link so candidates add themselves." : "No candidates match."}</td></tr>}
          </tbody>
        </table>
      </div>
      <ApplicantDialog r={r} open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function ApplicantDialog({ r, open, onClose, existing }: { r: R; open: boolean; onClose: () => void; existing?: Applicant }) {
  const blank: Partial<Applicant> = { first_name: "", surname: "", email: "", phone: "", location: "", current_title: "", current_employer: "", highest_qualification: "", field_of_study: "", source: "Other", skills: [], tags: [], linkedin_url: "", talent_pool: true };
  const [f, setF] = useState<Partial<Applicant>>(existing ?? blank); const [skills, setSkills] = useState((existing?.skills ?? []).join(", "));
  const [cv, setCv] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (open) { setF(existing ?? blank); setSkills((existing?.skills ?? []).join(", ")); setCv(null); setErr(null); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof Applicant, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => { setBusy(true); setErr(null); const res = await r.saveApplicant({ ...f, skills: skills.split(",").map((s) => s.trim()).filter(Boolean), years_experience: f.years_experience === null || (f.years_experience as unknown) === "" ? null : Number(f.years_experience) }, cv); setBusy(false); if (res.error) setErr(res.error); else onClose(); };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[640px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{existing ? "Edit candidate" : "Add candidate to repository"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name *"><Input value={f.first_name ?? ""} onChange={(e) => set("first_name", e.target.value)} /></Field>
        <Field label="Surname *"><Input value={f.surname ?? ""} onChange={(e) => set("surname", e.target.value)} /></Field>
        <Field label="Email"><Input value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Phone"><Input value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Current / last title"><Input value={f.current_title ?? ""} onChange={(e) => set("current_title", e.target.value)} /></Field>
        <Field label="Employer"><Input value={f.current_employer ?? ""} onChange={(e) => set("current_employer", e.target.value)} /></Field>
        <Field label="Highest qualification"><Input value={f.highest_qualification ?? ""} onChange={(e) => set("highest_qualification", e.target.value)} placeholder="e.g. BSc Hons" /></Field>
        <Field label="Field of study"><Input value={f.field_of_study ?? ""} onChange={(e) => set("field_of_study", e.target.value)} placeholder="e.g. Metallurgy" /></Field>
        <Field label="Years of experience"><Input type="number" value={f.years_experience ?? ""} onChange={(e) => set("years_experience", e.target.value)} /></Field>
        <Field label="Location"><Input value={f.location ?? ""} onChange={(e) => set("location", e.target.value)} /></Field>
        <Field label="Source"><Select value={f.source ?? "Other"} onValueChange={(v) => set("source", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Preferred site"><Select value={f.preferred_site_id ?? "none"} onValueChange={(v) => set("preferred_site_id", v === "none" ? null : v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Any</SelectItem>{r.sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Skills (comma separated)" className="col-span-2"><Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="CIL, elution, AutoCAD, Python…" /></Field>
        <Field label="LinkedIn profile" className="col-span-2"><Input value={f.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)} /></Field>
        <Field label={existing?.cv_path ? "Replace CV" : "CV (PDF or Word, max 5 MB)"} className="col-span-2">
          <label className="flex items-center gap-3 border-2 border-dashed border-[#DDDDDD] rounded-[6px] px-4 py-3 cursor-pointer hover:border-[#EDC817]"><Upload className="w-5 h-5 text-[#9C9C9C]" /><span className="text-[13px] text-[#525252]">{cv ? cv.name : "Choose a file…"}</span><input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCv(e.target.files?.[0] ?? null)} /></label>
        </Field>
      </div>
      {err && <p className="text-[12px] text-[#B91C1C]">{err}</p>}
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy || !f.first_name?.trim() || !f.surname?.trim()} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={() => void save()}>{busy ? "Saving…" : "Save"}</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}

// ====================================================================
function CandidateDrawer({ r, applicantId, onClose }: { r: R; applicantId: string | null; onClose: () => void }) {
  const a = r.applicants.find((x) => x.id === applicantId) ?? null;
  const [activity, setActivity] = useState<Activity[]>([]); const [interviews, setInterviews] = useState<Interview[]>([]);
  const [note, setNote] = useState(""); const [edit, setEdit] = useState(false); const [ivFor, setIvFor] = useState<Application | null>(null); const [jobPick, setJobPick] = useState("");
  const apps = a ? r.applications.filter((x) => x.applicant_id === a.id) : [];
  const refresh = async () => { if (!a) return; setActivity(await loadActivity(a.id)); setInterviews(await loadInterviews(apps.map((x) => x.id))); };
  useEffect(() => { void refresh(); setNote(""); }, [applicantId, r.applications.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!a) return null;
  const jobsById = Object.fromEntries(r.jobs.map((j) => [j.id, j]));
  const openCv = async () => { if (!a.cv_path) return; const url = await r.cvUrl(a.cv_path); if (url) window.open(url, "_blank"); };
  const availableJobs = r.jobs.filter((j) => j.status === "open" && !apps.some((x) => x.job_id === j.id));
  return (
    <Sheet open={!!a} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto p-0">
        <div className="bg-black border-b-4 border-[#EDC817] px-6 py-5">
          <div className="flex items-start gap-3"><Avatar a={a} size={52} /><div className="flex-1 min-w-0"><div className="text-white text-[19px] font-semibold">{a.full_name}</div><div className="text-[#CFCFCF] text-[12px]">{[a.current_title, a.current_employer].filter(Boolean).join(" at ") || "—"}</div>
            <div className="mt-1.5 flex items-center gap-3"><Stars value={a.rating ?? 0} size={16} onChange={(v) => void r.saveApplicant({ id: a.id, rating: v })} /><span className="text-[11px] text-[#9C9C9C]">via {a.source}</span></div></div></div>
          <div className="flex flex-wrap gap-2 mt-4">
            {a.cv_path && <Button onClick={() => void openCv()} className="h-8 text-[12px] bg-[#EDC817] hover:bg-[#D9B60F] text-black"><FileText className="w-3.5 h-3.5 mr-1.5" />Open CV</Button>}
            {a.linkedin_url && <a href={a.linkedin_url} target="_blank" rel="noreferrer" className="h-8 px-3 rounded-md text-[12px] font-medium bg-[#0A66C2] text-white flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5" />LinkedIn</a>}
            <Button variant="outline" onClick={() => setEdit(true)} className="h-8 text-[12px] bg-transparent text-white border-[#555] hover:bg-[#222] hover:text-white">Edit</Button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <section className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
            {[["Email", a.email], ["Phone", a.phone], ["Qualification", a.highest_qualification], ["Field", a.field_of_study], ["Experience", a.years_experience !== null ? `${a.years_experience} years` : null], ["Location", a.location], ["Preferred site", r.sites.find((s) => s.id === a.preferred_site_id)?.name], ["CV received", a.cv_uploaded_at ? fmtDate(a.cv_uploaded_at) : null]].map(([l, v]) => <div key={l as string}><div className="text-[#9C9C9C]">{l}</div><div className="font-medium">{v ?? "—"}</div></div>)}
            {a.skills.length > 0 && <div className="col-span-2"><div className="text-[#9C9C9C] mb-1">Skills</div><div className="flex flex-wrap gap-1">{a.skills.map((s) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-[#FDF8DC] border border-[#EDC817]/50">{s}</span>)}</div></div>}
            <div className="col-span-2 flex gap-4 pt-1"><label className="flex items-center gap-1.5"><input type="checkbox" className="accent-[#EDC817]" checked={a.talent_pool} onChange={(e) => void r.saveApplicant({ id: a.id, talent_pool: e.target.checked })} />Keep in talent pool</label><label className="flex items-center gap-1.5 text-[#B91C1C]"><input type="checkbox" className="accent-[#B91C1C]" checked={a.do_not_contact} onChange={(e) => void r.saveApplicant({ id: a.id, do_not_contact: e.target.checked })} />Do not contact</label></div>
          </section>

          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6B6B6B] mb-2">Applications</h4>
            {apps.filter((x) => x.job_id).length === 0 && <p className="text-[12px] text-[#9C9C9C] mb-2">Not linked to a job yet — in the talent pool.</p>}
            <div className="space-y-2">{apps.filter((x) => x.job_id).map((ap) => { const j = jobsById[ap.job_id!]; const ivs = interviews.filter((i) => i.application_id === ap.id); return (
              <div key={ap.id} className="border border-[#DDDDDD] rounded-[6px] p-3">
                <div className="flex items-center justify-between gap-2"><div><div className="text-[13px] font-semibold">{j?.title ?? "Job"}</div><div className="text-[11px] text-[#9C9C9C]">{j?.site_name ?? ""} · applied {fmtDate(ap.created_at)}{ap.via_agency ? " · via agency" : ""}</div></div>
                  <Select value={ap.stage} onValueChange={(v) => { if (v === "rejected" || v === "withdrawn") { const why = prompt("Reason?", DROP_REASONS[0]); if (why !== null) void r.moveStage(ap.id, v as Stage, why); } else void r.moveStage(ap.id, v as Stage); }}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px] font-semibold" style={{ color: STAGE_META[ap.stage].color === "#EDC817" ? "#8C7600" : STAGE_META[ap.stage].color }}><SelectValue /></SelectTrigger>
                    <SelectContent>{[...STAGES, "rejected", "withdrawn"].map((s) => <SelectItem key={s} value={s}>{STAGE_META[s as Stage].label}</SelectItem>)}</SelectContent></Select></div>
                {ap.outcome_reason && <div className="text-[11px] text-[#B91C1C] mt-1">Reason: {ap.outcome_reason}</div>}
                <div className="flex gap-1 mt-2">{STAGES.map((s) => <div key={s} className="flex-1 h-1.5 rounded-full" style={{ background: STAGES.indexOf(s) <= STAGES.indexOf(ap.stage as (typeof STAGES)[number]) ? STAGE_META[s].color : "#EEEEEE" }} />)}</div>
                {ivs.map((iv) => <div key={iv.id} className="mt-2 text-[11px] flex items-center gap-2 bg-[#FAFAFA] rounded px-2 py-1.5"><Calendar className="w-3.5 h-3.5 text-[#9C9C9C]" /><span className="flex-1">{iv.interview_type} · {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "date TBC"}{iv.panel ? ` · ${iv.panel}` : ""}</span>
                  {iv.outcome === "pending" ? <span className="flex gap-1">{(["passed", "failed", "no_show"] as const).map((o) => <button key={o} onClick={() => void r.saveInterview({ id: iv.id, application_id: ap.id, outcome: o }, a.id).then(refresh)} className="px-1.5 py-0.5 rounded border border-[#DDDDDD] hover:border-black capitalize">{o.replace("_", "-")}</button>)}</span> : <span className={cn("font-semibold capitalize", iv.outcome === "passed" ? "text-[#1B7A43]" : "text-[#B91C1C]")}>{iv.outcome.replace("_", "-")}</span>}</div>)}
                <button onClick={() => setIvFor(ap)} className="mt-2 text-[11px] font-semibold text-[#8C7600] hover:underline">+ Schedule interview</button>
              </div>); })}</div>
            {availableJobs.length > 0 && <div className="flex gap-2 mt-2"><Select value={jobPick} onValueChange={setJobPick}><SelectTrigger className="h-8 text-[12px] flex-1"><SelectValue placeholder="Consider for another open job…" /></SelectTrigger><SelectContent>{availableJobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent></Select><Button disabled={!jobPick} className="h-8 text-[12px] bg-black text-white" onClick={() => void r.addToJob(a.id, jobPick).then(() => setJobPick(""))}>Add</Button></div>}
          </section>

          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6B6B6B] mb-2">Notes & timeline</h4>
            <div className="flex gap-2"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (call outcome, impressions, salary expectation…)" className="text-[13px]" /><Button disabled={!note.trim()} className="h-auto bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={async () => { await r.addNote(a.id, note.trim()); setNote(""); void refresh(); }}><MessageSquare className="w-4 h-4" /></Button></div>
            <div className="mt-3 relative pl-5 space-y-3 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-[#DDDDDD]">
              {activity.map((x) => <div key={x.id} className="relative text-[12px]"><span className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-white" style={{ background: x.kind === "note" ? "#EDC817" : x.kind === "stage" ? "#1E6BA3" : x.kind === "interview" ? "#C27A06" : "#9C9C9C" }} /><div className={x.kind === "note" ? "bg-[#FDF8DC] rounded px-2 py-1" : ""}>{x.detail}</div><div className="text-[10px] text-[#9C9C9C]">{new Date(x.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div></div>)}
              {activity.length === 0 && <p className="text-[12px] text-[#9C9C9C]">No activity yet.</p>}
            </div>
          </section>
          {a.consent_at && <p className="text-[10px] text-[#9C9C9C] border-t border-[#EEEEEE] pt-3">Data consent given {fmtDate(a.consent_at)} via careers page.</p>}
        </div>
        <ApplicantDialog r={r} open={edit} onClose={() => setEdit(false)} existing={a} />
        <InterviewDialog app={ivFor} onClose={() => setIvFor(null)} onSave={async (iv) => { await r.saveInterview(iv, a.id); if (ivFor && ["applied", "screening", "shortlisted"].includes(ivFor.stage)) await r.moveStage(ivFor.id, "interview"); setIvFor(null); void refresh(); }} />
      </SheetContent>
    </Sheet>
  );
}

function InterviewDialog({ app, onClose, onSave }: { app: Application | null; onClose: () => void; onSave: (iv: Partial<Interview>) => Promise<void> }) {
  const [f, setF] = useState({ scheduled_at: "", interview_type: "Panel", panel: "" });
  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[420px]" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>Schedule interview</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Field label="Date & time"><Input type="datetime-local" value={f.scheduled_at} onChange={(e) => setF({ ...f, scheduled_at: e.target.value })} /></Field>
        <Field label="Type"><Select value={f.interview_type} onValueChange={(v) => setF({ ...f, interview_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Phone screen", "Panel", "Technical", "Online (Teams)", "Site visit", "Final"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Panel"><Input value={f.panel} onChange={(e) => setF({ ...f, panel: e.target.value })} placeholder="Names of interviewers" /></Field>
        <p className="text-[11px] text-[#9C9C9C]">Earlier-stage candidates move to “Interview” automatically.</p>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={() => void onSave({ application_id: app!.id, scheduled_at: f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null, interview_type: f.interview_type, panel: f.panel || null })}>Schedule</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}

// ====================================================================
function Jobs({ r, onPipeline }: { r: R; onPipeline: (id: string) => void }) {
  const [edit, setEdit] = useState<Partial<Job> | null>(null); const [copied, setCopied] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><p className="text-[13px] text-[#525252]">Open jobs appear on the public careers page. Share the link on LinkedIn, WhatsApp or email — applications land straight in the pipeline.</p><Button className="h-9 bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={() => setEdit({ title: "", employment_type: "Permanent", openings: 1, status: "draft" })}><Plus className="w-4 h-4 mr-1" />New job</Button></div>
      {r.jobs.length === 0 ? <div className="bg-white border border-dashed border-[#C4C4C4] rounded-[6px] py-16 text-center"><Briefcase className="w-10 h-10 mx-auto text-[#C4C4C4]" /><p className="text-[14px] font-semibold mt-3">No jobs yet</p></div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{r.jobs.map((j) => { const apps = r.applications.filter((a) => a.job_id === j.id); const hired = apps.filter((a) => a.stage === "hired").length; return (
          <div key={j.id} className="bg-white border border-[#DDDDDD] rounded-[6px] p-4">
            <div className="flex items-start justify-between gap-2"><div><div className="text-[15px] font-semibold">{j.title}</div><div className="text-[12px] text-[#6B6B6B]">{[j.site_name, j.department_name, j.employment_type].filter(Boolean).join(" · ")}</div></div>
              <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", j.status === "open" ? "bg-[#E8F5EC] text-[#1B7A43]" : j.status === "draft" ? "bg-[#F5F5F5] text-[#6B6B6B]" : "bg-black text-[#EDC817]")}>{j.status}</span></div>
            <div className="flex items-center gap-4 mt-3 text-[12px]"><span><strong>{apps.length}</strong> applicants</span><span><strong>{apps.filter((a) => !["hired", "rejected", "withdrawn", "applied"].includes(a.stage)).length}</strong> in progress</span><span><strong>{hired}</strong>/{j.openings} hired</span>{j.closing_date && <span className="text-[#9C9C9C]">closes {fmtDate(j.closing_date)}</span>}</div>
            <div className="flex h-1.5 rounded-full overflow-hidden mt-2 bg-[#EEEEEE]">{STAGES.map((s) => { const n = apps.filter((a) => a.stage === s).length; return n ? <div key={s} style={{ width: `${(n / apps.length) * 100}%`, background: STAGE_META[s].color }} /> : null; })}</div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Button size="sm" className="h-7 text-[11px] bg-black text-white" onClick={() => onPipeline(j.id)}>Pipeline</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setEdit(j)}>Edit</Button>
              {j.status !== "open" ? <Button size="sm" variant="outline" className="h-7 text-[11px] text-[#1B7A43] border-[#1B7A43]" onClick={() => void r.saveJob({ id: j.id, status: "open" })}>Publish</Button> : <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => void r.saveJob({ id: j.id, status: "closed" })}>Close</Button>}
              {j.status === "open" && <>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { void navigator.clipboard.writeText(careersUrl(j.slug)); setCopied(j.id); setTimeout(() => setCopied(null), 2000); }}><Copy className="w-3 h-3 mr-1" />{copied === j.id ? "Copied!" : "Copy link"}</Button>
                <a href={linkedInShare(j.slug)} target="_blank" rel="noreferrer" className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-[#0A66C2] text-white flex items-center gap-1"><Linkedin className="w-3 h-3" />Share on LinkedIn</a>
              </>}
            </div>
          </div>); })}</div>)}
      <JobDialog r={r} job={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function JobDialog({ r, job, onClose }: { r: R; job: Partial<Job> | null; onClose: () => void }) {
  const [f, setF] = useState<Partial<Job>>({}); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (job) { setF(job); setErr(null); } }, [job]);
  const set = (k: keyof Job, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-[640px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>{job?.id ? "Edit job" : "New job"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Job title *" className="col-span-2"><Input value={f.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Site"><Select value={f.site_id ?? "none"} onValueChange={(v) => set("site_id", v === "none" ? null : v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Any / multiple</SelectItem>{r.sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Department"><Select value={f.department_id ?? "none"} onValueChange={(v) => set("department_id", v === "none" ? null : v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">—</SelectItem>{r.departments.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Employment type"><Select value={f.employment_type ?? "Permanent"} onValueChange={(v) => set("employment_type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Permanent", "Fixed-term contract", "Graduate trainee", "Attachment", "Casual"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
        <div className="grid grid-cols-2 gap-2"><Field label="Openings"><Input type="number" min={1} value={f.openings ?? 1} onChange={(e) => set("openings", Number(e.target.value) || 1)} /></Field><Field label="Closing date"><Input type="date" value={f.closing_date ?? ""} onChange={(e) => set("closing_date", e.target.value || null)} /></Field></div>
        <Field label="About the role" className="col-span-2"><Textarea rows={5} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Purpose of the role and key responsibilities" /></Field>
        <Field label="Requirements" className="col-span-2"><Textarea rows={4} value={f.requirements ?? ""} onChange={(e) => set("requirements", e.target.value)} placeholder="Qualifications, experience, certifications" /></Field>
      </div>
      {err && <p className="text-[12px] text-[#B91C1C]">{err}</p>}
      <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button>
        {!f.id && <Button variant="outline" disabled={busy || !f.title?.trim()} onClick={async () => { setBusy(true); const e = await r.saveJob({ ...f, status: "draft" }); setBusy(false); if (e) setErr(e); else onClose(); }}>Save draft</Button>}
        <Button disabled={busy || !f.title?.trim()} className="bg-[#EDC817] hover:bg-[#D9B60F] text-black" onClick={async () => { setBusy(true); const e = await r.saveJob(f.id ? f : { ...f, status: "open" }); setBusy(false); if (e) setErr(e); else onClose(); }}>{f.id ? "Save" : "Publish now"}</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}
