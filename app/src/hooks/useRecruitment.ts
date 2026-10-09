// src/hooks/useRecruitment.ts — in-house recruitment & CV repository
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const STAGES = ["applied", "screening", "shortlisted", "interview", "offer", "hired"] as const;
export const CLOSED_STAGES = ["rejected", "withdrawn"] as const;
export type Stage = (typeof STAGES)[number] | (typeof CLOSED_STAGES)[number];
export const STAGE_META: Record<Stage, { label: string; color: string }> = {
  applied: { label: "Applied", color: "#9C9C9C" }, screening: { label: "Screening", color: "#1E6BA3" },
  shortlisted: { label: "Shortlisted", color: "#7C3AED" }, interview: { label: "Interview", color: "#C27A06" },
  offer: { label: "Offer", color: "#EDC817" }, hired: { label: "Hired", color: "#1B7A43" },
  rejected: { label: "Dropped", color: "#B91C1C" }, withdrawn: { label: "Withdrew", color: "#6B6B6B" },
};
export const SOURCES = ["LinkedIn", "Careers page", "Referral", "Walk-in", "Email", "Agency", "Job board", "University", "Other"];
export const DROP_REASONS = ["Did not meet minimum requirements", "Weaker than other candidates", "Failed interview", "Failed assessment", "Salary expectations", "Location / relocation", "No response from candidate", "Position filled", "Other"];

export interface Job { id: string; title: string; site_id: string | null; department_id: string | null; site_name: string | null; department_name: string | null; employment_type: string; description: string | null; requirements: string | null; openings: number; closing_date: string | null; status: "draft" | "open" | "closed" | "filled"; slug: string; created_at: string; }
export interface Applicant { id: string; first_name: string; surname: string; full_name: string; email: string | null; phone: string | null; location: string | null; current_title: string | null; current_employer: string | null; years_experience: number | null; highest_qualification: string | null; field_of_study: string | null; skills: string[]; tags: string[]; source: string; source_detail: string | null; linkedin_url: string | null; preferred_site_id: string | null; cv_path: string | null; cv_filename: string | null; cv_uploaded_at: string | null; consent_at: string | null; rating: number | null; talent_pool: boolean; do_not_contact: boolean; notes: string | null; created_at: string; }
export interface Application { id: string; applicant_id: string; job_id: string | null; stage: Stage; stage_changed_at: string; outcome_reason: string | null; via_agency: boolean; created_at: string; }
export interface Activity { id: string; applicant_id: string; application_id: string | null; kind: string; detail: string | null; actor: string | null; created_at: string; }
export interface Interview { id: string; application_id: string; scheduled_at: string | null; interview_type: string | null; panel: string | null; outcome: "pending" | "passed" | "failed" | "no_show"; score: number | null; notes: string | null; created_at: string; }

export const careersUrl = (slug?: string) => `${window.location.origin}/#/careers${slug ? `/${slug}` : ""}`;
export const linkedInShare = (slug: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(careersUrl(slug))}`;
export const daysSince = (d: string) => Math.max(0, Math.floor((Date.now() - +new Date(d)) / 86400000));

export function useRecruitment() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [agencyFee, setAgencyFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const [j, a, ap, st, dp, rs] = await Promise.all([
      supabase.from("job_openings").select("*, sites(name), departments(name)").order("created_at", { ascending: false }),
      supabase.from("applicants").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("*"),
      supabase.from("sites").select("id, name").eq("is_active", true).order("name"),
      supabase.from("departments").select("id, name").eq("is_active", true).order("name"),
      supabase.from("recruitment_settings").select("agency_fee_usd").maybeSingle(),
    ]);
    const err = j.error ?? a.error ?? ap.error;
    if (err) { setError(err.message); setLoading(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setJobs((j.data ?? []).map((x: any) => ({ ...x, site_name: x.sites?.name ?? null, department_name: x.departments?.name ?? null })));
    setApplicants((a.data ?? []) as Applicant[]);
    setApplications((ap.data ?? []) as Application[]);
    setSites(st.data ?? []); setDepartments(dp.data ?? []);
    setAgencyFee(Number(rs.data?.agency_fee_usd ?? 0));
    setLoading(false);
  }, []);
  useEffect(() => { void refetch(); }, [refetch]);

  const run = useCallback(async (p: PromiseLike<{ error: { message: string } | null }>): Promise<string | null> => {
    const { error: e } = await p; if (e) return e.message; await refetch(); return null;
  }, [refetch]);

  const saveJob = useCallback((job: Partial<Job>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, site_name, department_name, slug, created_at, ...rest } = job as Job;
    return run(id ? supabase.from("job_openings").update(rest).eq("id", id) : supabase.from("job_openings").insert(rest));
  }, [run]);

  const uploadCv = useCallback(async (file: File): Promise<{ path: string | null; error: string | null }> => {
    if (file.size > 5 * 1024 * 1024) return { path: null, error: "CV must be 5 MB or smaller." };
    const ext = (file.name.split(".").pop() ?? "pdf").toLowerCase();
    const path = `applications/${crypto.randomUUID()}.${ext}`;
    const { error: e } = await supabase.storage.from("cvs").upload(path, file, { contentType: file.type || "application/pdf", upsert: false });
    return e ? { path: null, error: e.message } : { path, error: null };
  }, []);

  const saveApplicant = useCallback(async (a: Partial<Applicant>, cv?: File | null): Promise<{ id: string | null; error: string | null }> => {
    const patch: Record<string, unknown> = { ...a };
    delete patch.full_name; delete patch.created_at;
    if (cv) { const up = await uploadCv(cv); if (up.error) return { id: null, error: up.error }; patch.cv_path = up.path; patch.cv_filename = cv.name; patch.cv_uploaded_at = new Date().toISOString(); }
    if (typeof patch.email === "string") patch.email = (patch.email as string).trim().toLowerCase() || null;
    const q = a.id ? supabase.from("applicants").update(patch).eq("id", a.id).select("id").single() : supabase.from("applicants").insert(patch).select("id").single();
    const { data, error: e } = await q;
    if (e) return { id: null, error: e.message.includes("applicants_email_uniq") ? "A candidate with this email already exists — search the talent pool instead." : e.message };
    if (cv) await supabase.from("recruit_activity").insert({ applicant_id: data.id, kind: "cv", detail: `CV uploaded: ${cv.name}` });
    await refetch();
    return { id: data.id, error: null };
  }, [refetch, uploadCv]);

  const addToJob = useCallback((applicantId: string, jobId: string, viaAgency = false) =>
    run(supabase.from("applications").insert({ applicant_id: applicantId, job_id: jobId, via_agency: viaAgency })), [run]);

  const moveStage = useCallback((applicationId: string, stage: Stage, reason?: string) => {
    // optimistic: the board moves instantly
    setApplications((prev) => prev.map((x) => (x.id === applicationId ? { ...x, stage, stage_changed_at: new Date().toISOString(), outcome_reason: reason ?? x.outcome_reason } : x)));
    return run(supabase.from("applications").update({ stage, outcome_reason: reason ?? null }).eq("id", applicationId));
  }, [run]);

  const addNote = useCallback(async (applicantId: string, text: string, applicationId?: string | null) => {
    const { error: e } = await supabase.from("recruit_activity").insert({ applicant_id: applicantId, application_id: applicationId ?? null, kind: "note", detail: text });
    return e?.message ?? null;
  }, []);

  const saveInterview = useCallback(async (iv: Partial<Interview>, applicantId: string) => {
    const { error: e } = iv.id
      ? await supabase.from("interviews").update({ outcome: iv.outcome, score: iv.score, notes: iv.notes }).eq("id", iv.id)
      : await supabase.from("interviews").insert(iv);
    if (e) return e.message;
    await supabase.from("recruit_activity").insert({ applicant_id: applicantId, application_id: iv.application_id ?? null, kind: "interview",
      detail: iv.id ? `Interview outcome: ${iv.outcome}${iv.score ? ` (${iv.score}/5)` : ""}` : `Interview scheduled${iv.scheduled_at ? " for " + new Date(iv.scheduled_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}` });
    return null;
  }, []);

  const cvUrl = useCallback(async (path: string) => {
    const { data } = await supabase.storage.from("cvs").createSignedUrl(path, 300);
    return data?.signedUrl ?? null;
  }, []);

  const saveAgencyFee = useCallback((fee: number) => { setAgencyFee(fee); return run(supabase.from("recruitment_settings").update({ agency_fee_usd: fee }).eq("id", 1)); }, [run]);

  return { jobs, applicants, applications, sites, departments, agencyFee, loading, error, refetch, saveJob, saveApplicant, addToJob, moveStage, addNote, saveInterview, cvUrl, saveAgencyFee, uploadCv };
}

export async function loadActivity(applicantId: string): Promise<Activity[]> {
  const { data } = await supabase.from("recruit_activity").select("*").eq("applicant_id", applicantId).order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as Activity[];
}
export async function loadInterviews(applicationIds: string[]): Promise<Interview[]> {
  if (!applicationIds.length) return [];
  const { data } = await supabase.from("interviews").select("*").in("application_id", applicationIds).order("scheduled_at", { ascending: false });
  return (data ?? []) as Interview[];
}
