// src/pages/Careers.tsx — public careers page (no login). Applications and CVs
// flow into the Recruitment repository. Candidates can upload but never read files.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Briefcase, Calendar, Search, Upload, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PublicJob { slug: string; title: string; site: string | null; department: string | null; employment_type: string; description: string | null; requirements: string | null; closing_date: string | null; posted: string; }
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");
const SOURCES = ["LinkedIn", "Company website", "Referral by an employee", "Facebook / WhatsApp", "University / college", "Job board", "Other"];

function Header() {
  return (
    <div className="bg-black border-b-4 border-[#EDC817]">
      <div className="max-w-[1040px] mx-auto px-5 py-5 flex items-center gap-4">
        <img src="/magaya_logo_white.png" alt="Magaya Mining" className="h-[40px] w-auto" />
        <div><div className="text-white text-[18px] font-semibold">Careers at Magaya Mining</div><div className="text-[#CFCFCF] text-[12px]">Build your career with us across our operations in Zimbabwe</div></div>
      </div>
    </div>
  );
}

export default function Careers() {
  const { slug } = useParams(); const navigate = useNavigate();
  const [jobs, setJobs] = useState<PublicJob[] | null>(null); const [q, setQ] = useState(""); const [site, setSite] = useState("all");
  const [general, setGeneral] = useState(false);
  useEffect(() => { void supabase.rpc("fn_public_jobs").then(({ data }) => setJobs((data ?? []) as PublicJob[])); }, []);
  const job = slug ? jobs?.find((j) => j.slug === slug) : undefined;
  const sites = useMemo(() => Array.from(new Set((jobs ?? []).map((j) => j.site).filter(Boolean))) as string[], [jobs]);
  const list = (jobs ?? []).filter((j) => (site === "all" || j.site === site) && (!q || `${j.title} ${j.department ?? ""} ${j.description ?? ""}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="min-h-[100dvh] bg-[#F9F9F9]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />
      <div className="max-w-[1040px] mx-auto px-5 py-8">
        {jobs === null ? <div className="py-24 flex justify-center"><div className="w-8 h-8 border-[3px] border-[#DDDDDD] border-t-[#EDC817] rounded-full animate-spin" /></div>
        : slug ? (job ? <JobView job={job} onBack={() => navigate("/careers")} /> : <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-10 text-center"><h2 className="text-[18px] font-bold">This vacancy is no longer open</h2><button onClick={() => navigate("/careers")} className="mt-4 text-[13px] font-semibold text-[#8C7600] hover:underline">See current vacancies</button></div>)
        : general ? <ApplyForm onBack={() => setGeneral(false)} />
        : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="relative flex-1 min-w-[240px]"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vacancies" className="w-full h-11 pl-9 pr-3 border border-[#DDDDDD] rounded-[6px] text-[14px] bg-white outline-none focus:border-[#EDC817]" /></div>
              {sites.length > 1 && <select value={site} onChange={(e) => setSite(e.target.value)} className="h-11 px-3 border border-[#DDDDDD] rounded-[6px] text-[14px] bg-white"><option value="all">All locations</option>{sites.map((s) => <option key={s}>{s}</option>)}</select>}
            </div>
            <div className="text-[13px] text-[#6B6B6B] mb-3">{list.length} open position{list.length === 1 ? "" : "s"}</div>
            <div className="space-y-3">
              {list.map((j) => (
                <button key={j.slug} onClick={() => navigate(`/careers/${j.slug}`)} className="w-full text-left bg-white border border-[#DDDDDD] rounded-[6px] p-5 hover:border-[#EDC817] hover:shadow-sm transition-all group">
                  <div className="flex items-start justify-between gap-4"><div><h3 className="text-[17px] font-semibold text-black group-hover:underline">{j.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12px] text-[#6B6B6B]">{j.site && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{j.site}</span>}<span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{j.employment_type}{j.department ? ` · ${j.department}` : ""}</span>{j.closing_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Closes {fmt(j.closing_date)}</span>}</div></div>
                    <span className="shrink-0 h-9 px-4 rounded-[6px] bg-[#EDC817] text-black text-[13px] font-semibold flex items-center">View & apply</span></div>
                  {j.description && <p className="text-[13px] text-[#525252] mt-2 line-clamp-2">{j.description}</p>}
                </button>))}
              {list.length === 0 && <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-10 text-center text-[14px] text-[#6B6B6B]">There are no open vacancies matching your search right now.</div>}
            </div>
            <div className="mt-8 bg-black rounded-[6px] p-6 flex flex-wrap items-center justify-between gap-4 border-b-4 border-[#EDC817]">
              <div><div className="text-white text-[16px] font-semibold">Don't see the right role?</div><div className="text-[#CFCFCF] text-[13px]">Join our talent pool and we'll consider you for future vacancies.</div></div>
              <button onClick={() => setGeneral(true)} className="h-10 px-5 rounded-[6px] bg-[#EDC817] text-black text-[13px] font-semibold">Submit your CV</button>
            </div>
          </>)}
      </div>
    </div>
  );
}

function JobView({ job, onBack }: { job: PublicJob; onBack: () => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
      <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-7">
        <button onClick={onBack} className="text-[13px] text-[#8C7600] font-semibold flex items-center gap-1 mb-4 hover:underline"><ArrowLeft className="w-4 h-4" />All vacancies</button>
        <h1 className="text-[24px] font-bold text-black">{job.title}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[13px] text-[#6B6B6B]">{job.site && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.site}</span>}<span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{job.employment_type}</span>{job.closing_date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Closes {fmt(job.closing_date)}</span>}</div>
        {job.description && <><h2 className="text-[13px] font-bold uppercase tracking-[0.06em] border-b-2 border-[#EDC817] pb-1 mt-6 mb-2">About the role</h2><p className="text-[14px] text-[#333] whitespace-pre-line leading-relaxed">{job.description}</p></>}
        {job.requirements && <><h2 className="text-[13px] font-bold uppercase tracking-[0.06em] border-b-2 border-[#EDC817] pb-1 mt-6 mb-2">Requirements</h2><p className="text-[14px] text-[#333] whitespace-pre-line leading-relaxed">{job.requirements}</p></>}
      </div>
      <ApplyForm job={job} />
    </div>
  );
}

function ApplyForm({ job, onBack }: { job?: PublicJob; onBack?: () => void }) {
  const [f, setF] = useState<Record<string, string>>({ first_name: "", surname: "", email: "", phone: "", location: "", current_title: "", highest_qualification: "", field_of_study: "", years_experience: "", linkedin_url: "", source: "", website: "" });
  const [cv, setCv] = useState<File | null>(null); const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null); const [done, setDone] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (!cv) { setErr("Please attach your CV."); return; }
    if (cv.size > 5 * 1024 * 1024) { setErr("Your CV must be 5 MB or smaller."); return; }
    if (!/\.(pdf|docx?)$/i.test(cv.name)) { setErr("Please upload a PDF or Word document."); return; }
    setBusy(true);
    const path = `applications/${crypto.randomUUID()}.${cv.name.split(".").pop()!.toLowerCase()}`;
    const up = await supabase.storage.from("cvs").upload(path, cv, { contentType: cv.type || "application/pdf", upsert: false });
    if (up.error) { setBusy(false); setErr("We couldn't upload your CV. Please check the file and try again."); return; }
    const { error } = await supabase.rpc("fn_public_apply", { p_slug: job?.slug ?? null, p: { ...f, consent }, p_cv_path: path, p_cv_filename: cv.name });
    setBusy(false);
    if (error) setErr(error.message); else setDone(true);
  };
  const input = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label className="block text-[12px] font-semibold text-[#525252] mb-1">{label}</label><input value={f[k]} onChange={(e) => set(k, e.target.value)} className="w-full h-10 px-3 border border-[#DDDDDD] rounded-[6px] text-[14px] outline-none focus:border-[#EDC817]" {...props} /></div>);
  if (done) return (
    <div className="bg-white border border-[#DDDDDD] rounded-[6px] p-8 text-center"><CheckCircle2 className="w-12 h-12 text-[#1B7A43] mx-auto" /><h2 className="text-[20px] font-bold mt-3">Application received</h2><p className="text-[14px] text-[#525252] mt-2">Thank you, {f.first_name}. {job ? `Your application for ${job.title} has been received.` : "Your CV has been added to our talent pool."} If your profile matches our needs, our recruitment team will contact you.</p></div>);
  return (
    <form onSubmit={(e) => void submit(e)} className="bg-white border border-[#DDDDDD] rounded-[6px] p-6 space-y-3 lg:sticky lg:top-4">
      {onBack && <button type="button" onClick={onBack} className="text-[13px] text-[#8C7600] font-semibold flex items-center gap-1 hover:underline"><ArrowLeft className="w-4 h-4" />Back</button>}
      <div><h2 className="text-[17px] font-bold">{job ? "Apply for this role" : "Join our talent pool"}</h2><p className="text-[12px] text-[#6B6B6B]">Fields marked * are required. It takes about 3 minutes.</p></div>
      <div className="grid grid-cols-2 gap-3">{input("first_name", "First name *", { required: true })}{input("surname", "Surname *", { required: true })}</div>
      {input("email", "Email *", { type: "email", required: true })}
      <div className="grid grid-cols-2 gap-3">{input("phone", "Phone *", { required: true })}{input("location", "Town / city")}</div>
      {input("current_title", "Current or most recent job title")}
      <div className="grid grid-cols-2 gap-3">{input("highest_qualification", "Highest qualification")}{input("field_of_study", "Field of study")}</div>
      <div className="grid grid-cols-2 gap-3">{input("years_experience", "Years of experience", { type: "number", min: 0, max: 50 })}{input("linkedin_url", "LinkedIn profile (optional)")}</div>
      <div><label className="block text-[12px] font-semibold text-[#525252] mb-1">How did you hear about us?</label><select value={f.source} onChange={(e) => set("source", e.target.value)} className="w-full h-10 px-3 border border-[#DDDDDD] rounded-[6px] text-[14px] bg-white"><option value="">Select…</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></div>
      <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} className="hidden" aria-hidden />
      <label className="flex items-center gap-3 border-2 border-dashed border-[#DDDDDD] rounded-[6px] px-4 py-4 cursor-pointer hover:border-[#EDC817]"><Upload className="w-6 h-6 text-[#9C9C9C]" /><div><div className="text-[14px] font-semibold">{cv ? cv.name : "Upload your CV *"}</div><div className="text-[11px] text-[#9C9C9C]">PDF or Word, up to 5 MB</div></div><input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCv(e.target.files?.[0] ?? null)} /></label>
      <label className="flex items-start gap-2.5 text-[12px] text-[#525252]"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#EDC817]" /><span>I consent to Magaya Mining (Private) Limited storing and processing the personal information in this application and my CV for recruitment purposes, including considering me for future vacancies. I can ask for my information to be removed at any time.</span></label>
      {err && <p className="text-[13px] text-[#B91C1C]">{err}</p>}
      <button disabled={busy || !consent} className="w-full h-11 rounded-[6px] bg-[#EDC817] text-black font-semibold disabled:opacity-50">{busy ? "Submitting…" : job ? "Submit application" : "Submit CV"}</button>
    </form>
  );
}
