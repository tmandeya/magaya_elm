// src/hooks/useTalent.ts
// Graduate trainees & attachment students: people, assessment schedules,
// sittings (batches), attempts and results. All writes go through RLS
// (talent staff only); candidates never touch these tables.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buildPaper, FORM_CODES, type BankItem } from "@/lib/testGenerators";

export type TraineeType = "graduate_trainee" | "attachment_student";
export type TraineeStatus = "pending" | "assessment" | "assessed" | "approved" | "active" | "completed" | "withdrawn" | "not_selected";

export const TYPE_LABEL: Record<string, string> = { graduate_trainee: "Graduate Trainee", attachment_student: "Attachment Student", mixed: "GTs & Students" };
export const STATUS_META: Record<TraineeStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: "Pending", bg: "#F5F5F5", fg: "#525252" },
  assessment: { label: "In assessment", bg: "#E8F2FA", fg: "#1E6BA3" },
  assessed: { label: "Awaiting decision", bg: "#FDF3E0", fg: "#C27A06" },
  approved: { label: "Approved", bg: "#E8F5EC", fg: "#1B7A43" },
  active: { label: "Active", bg: "#1B7A43", fg: "#FFFFFF" },
  completed: { label: "Completed", bg: "#000000", fg: "#EDC817" },
  withdrawn: { label: "Withdrawn", bg: "#F5F5F5", fg: "#9C9C9C" },
  not_selected: { label: "Not selected", bg: "#FEF2F2", fg: "#B91C1C" },
};
export const RISK_META: Record<string, { label: string; short: string; bg: string; fg: string }> = {
  low: { label: "Recommended — low risk", short: "Recommended", bg: "#E8F5EC", fg: "#1B7A43" },
  moderate: { label: "Recommended — moderate risk (development candidate)", short: "Moderate risk", bg: "#FDF3E0", fg: "#C27A06" },
  high: { label: "Not recommended — high risk", short: "Not recommended", bg: "#FEF2F2", fg: "#B91C1C" },
};

export interface Trainee {
  id: string; trainee_type: TraineeType; first_name: string; surname: string; full_name: string;
  email: string | null; phone: string | null; gender: string | null;
  institution: string | null; programme: string | null; year_of_study: number | null;
  site_id: string | null; department_id: string | null; site_name: string | null; department_name: string | null;
  supervisor_name: string | null; mentor_name: string | null; start_date: string | null; end_date: string | null;
  status: TraineeStatus; decision_notes: string | null; decision_at: string | null; notes: string | null; created_at: string;
  latest_attempt?: AttemptSummary | null;
}

export interface Schedule {
  id: string; name: string; trainee_type: string; form_mode: "rotate" | "fixed"; form_code: string | null;
  weights: Record<string, number>; low_risk_min: number; moderate_min: number; include_personality: boolean;
  status: "active" | "closed"; notes: string | null; created_at: string;
  sittings: Sitting[]; attempt_count: number; submitted_count: number;
}
export interface Sitting { id: string; schedule_id: string; label: string; starts_at: string | null; venue: string | null; capacity: number; status: "scheduled" | "open" | "closed"; }

export interface AttemptSummary {
  id: string; schedule_id: string; sitting_id: string | null; trainee_id: string; form_code: string; access_code: string;
  status: "assigned" | "in_progress" | "submitted" | "void"; started_at: string | null; submitted_at: string | null;
  current_seq: number; item_count: number; focus_lost: number; time_away_seconds: number; copy_paste: number; fullscreen_exits: number;
  section_scores: Record<string, { correct: number; total: number; pct: number }> | null;
  trait_scores: Record<string, number> | null; weighted_score: number | null; deception: number | null;
  risk: "low" | "moderate" | "high" | null; flags: string[] | null; ip: string | null;
  trainee?: Trainee;
}

const TRAINEE_SELECT = "*, sites(name), departments(name)";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapTrainee = (t: any): Trainee => ({ ...t, site_name: t.sites?.name ?? null, department_name: t.departments?.name ?? null });

export function useTalent() {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const [tr, sc, si, at, st, dp] = await Promise.all([
      supabase.from("trainees").select(TRAINEE_SELECT).order("created_at", { ascending: false }),
      supabase.from("assessment_schedules").select("*").order("created_at", { ascending: false }),
      supabase.from("assessment_sittings").select("*").order("starts_at", { ascending: true }),
      supabase.from("assessment_attempts").select("id, schedule_id, sitting_id, trainee_id, form_code, access_code, status, started_at, submitted_at, current_seq, item_count, focus_lost, time_away_seconds, copy_paste, fullscreen_exits, section_scores, trait_scores, weighted_score, deception, risk, flags, ip, created_at").order("created_at", { ascending: false }),
      supabase.from("sites").select("id, name").eq("is_active", true).order("name"),
      supabase.from("departments").select("id, name").eq("is_active", true).order("name"),
    ]);
    const err = tr.error ?? sc.error ?? si.error ?? at.error;
    if (err) { setError(err.message); setLoading(false); return; }
    const attempts = (at.data ?? []) as AttemptSummary[];
    const latestByTrainee: Record<string, AttemptSummary> = {};
    for (const a of attempts) if (!latestByTrainee[a.trainee_id]) latestByTrainee[a.trainee_id] = a;
    setTrainees((tr.data ?? []).map((t) => ({ ...mapTrainee(t), latest_attempt: latestByTrainee[t.id] ?? null })));
    const sittings = (si.data ?? []) as Sitting[];
    setSchedules(((sc.data ?? []) as Schedule[]).map((s) => ({
      ...s,
      sittings: sittings.filter((x) => x.schedule_id === s.id),
      attempt_count: attempts.filter((a) => a.schedule_id === s.id && a.status !== "void").length,
      submitted_count: attempts.filter((a) => a.schedule_id === s.id && a.status === "submitted").length,
    })));
    setSites(st.data ?? []);
    setDepartments(dp.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  // ---------- People ----------
  const addTrainees = useCallback(async (rows: Partial<Trainee>[]): Promise<string | null> => {
    const clean = rows.map((r) => ({
      trainee_type: r.trainee_type, first_name: r.first_name?.trim(), surname: r.surname?.trim(),
      email: r.email?.trim() || null, phone: r.phone?.trim() || null, gender: r.gender || null,
      institution: r.institution?.trim() || null, programme: r.programme?.trim() || null,
      year_of_study: r.year_of_study || null, site_id: r.site_id || null, department_id: r.department_id || null, notes: r.notes || null,
    }));
    for (let i = 0; i < clean.length; i += 200) {
      const { error: e } = await supabase.from("trainees").insert(clean.slice(i, i + 200));
      if (e) return e.message;
    }
    await refetch();
    return null;
  }, [refetch]);

  const updateTrainee = useCallback(async (id: string, patch: Partial<Trainee>): Promise<string | null> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { site_name, department_name, latest_attempt, full_name, ...rest } = patch as Trainee;
    const { error: e } = await supabase.from("trainees").update(rest).eq("id", id);
    if (e) return e.message;
    await refetch();
    return null;
  }, [refetch]);

  const decide = useCallback(async (id: string, status: TraineeStatus, notes: string, extra: Partial<Trainee> = {}): Promise<string | null> => {
    const { data: auth } = await supabase.auth.getUser();
    return updateTrainee(id, { ...extra, status, decision_notes: notes || null, decision_at: new Date().toISOString(), decision_by: auth.user?.id } as Partial<Trainee>);
  }, [updateTrainee]);

  // ---------- Schedules & sittings ----------
  const createSchedule = useCallback(async (s: Partial<Schedule>): Promise<{ id: string | null; error: string | null }> => {
    const { data, error: e } = await supabase.from("assessment_schedules").insert({
      name: s.name, trainee_type: s.trainee_type ?? "mixed", form_mode: s.form_mode ?? "rotate", form_code: s.form_code ?? null,
      weights: s.weights, low_risk_min: s.low_risk_min, moderate_min: s.moderate_min, include_personality: s.include_personality ?? true, notes: s.notes ?? null,
    }).select("id").single();
    if (e) return { id: null, error: e.message };
    await refetch();
    return { id: data.id, error: null };
  }, [refetch]);

  const updateSchedule = useCallback(async (id: string, patch: Partial<Schedule>): Promise<string | null> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sittings, attempt_count, submitted_count, ...rest } = patch as Schedule;
    const { error: e } = await supabase.from("assessment_schedules").update(rest).eq("id", id);
    if (e) return e.message;
    await refetch(); return null;
  }, [refetch]);

  const addSitting = useCallback(async (scheduleId: string, s: Partial<Sitting>): Promise<string | null> => {
    const { error: e } = await supabase.from("assessment_sittings").insert({ schedule_id: scheduleId, label: s.label, starts_at: s.starts_at || null, venue: s.venue || null, capacity: s.capacity ?? 20 });
    if (e) return e.message;
    await refetch(); return null;
  }, [refetch]);

  const setSittingStatus = useCallback(async (id: string, status: Sitting["status"]): Promise<string | null> => {
    if (status === "closed") {
      const { error: ce } = await supabase.rpc("fn_close_sitting", { p_sitting: id });
      if (ce) return ce.message;
      await refetch(); return null;
    }
    const patch: Record<string, unknown> = { status };
    if (status === "open") patch.opened_at = new Date().toISOString();
    const { error: e } = await supabase.from("assessment_sittings").update(patch).eq("id", id);
    if (e) return e.message;
    await refetch(); return null;
  }, [refetch]);

  /** Generate a personalised paper for each trainee and allocate them to sittings with free seats. */
  const assignCandidates = useCallback(async (schedule: Schedule, traineeIds: string[], onProgress?: (done: number, total: number) => void): Promise<string | null> => {
    const { data: bankRows, error: be } = await supabase.from("assessment_bank").select("section, kind, prompt, options, correct, trait, reverse, time_limit, form_code").eq("active", true);
    if (be) return be.message;
    const bank = (bankRows ?? []) as BankItem[];
    const { data: existing } = await supabase.from("assessment_attempts").select("sitting_id, status").eq("schedule_id", schedule.id);
    const seatsUsed: Record<string, number> = {};
    for (const e of existing ?? []) if (e.sitting_id && e.status !== "void") seatsUsed[e.sitting_id] = (seatsUsed[e.sitting_id] ?? 0) + 1;
    const openSittings = schedule.sittings.filter((s) => s.status !== "closed");
    let formCursor = (existing ?? []).length;

    for (let i = 0; i < traineeIds.length; i++) {
      const sitting = openSittings.find((s) => (seatsUsed[s.id] ?? 0) < s.capacity) ?? null;
      if (sitting) seatsUsed[sitting.id] = (seatsUsed[sitting.id] ?? 0) + 1;
      const form = schedule.form_mode === "fixed" && schedule.form_code ? schedule.form_code : FORM_CODES[formCursor++ % FORM_CODES.length];
      const paper = buildPaper(form, bank, schedule.include_personality);
      const { data: att, error: ae } = await supabase.from("assessment_attempts")
        .insert({ schedule_id: schedule.id, sitting_id: sitting?.id ?? null, trainee_id: traineeIds[i], form_code: form, item_count: paper.length })
        .select("id").single();
      if (ae) return ae.message.includes("duplicate") ? "One or more candidates are already in this exam." : ae.message;
      const rows = paper.map((it, idx) => ({ attempt_id: att.id, seq: idx + 1, section: it.section, kind: it.kind, prompt: it.prompt, stimulus: it.stimulus ?? null, options: it.options, correct: it.correct ?? null, trait: it.trait ?? null, reverse: it.reverse ?? false, time_limit: it.time_limit }));
      const { error: ie } = await supabase.from("assessment_items").insert(rows);
      if (ie) { await supabase.from("assessment_attempts").delete().eq("id", att.id); return ie.message; }
      await supabase.from("trainees").update({ status: "assessment" }).eq("id", traineeIds[i]).eq("status", "pending");
      onProgress?.(i + 1, traineeIds.length);
    }
    await refetch();
    return null;
  }, [refetch]);

  const moveAttempt = useCallback(async (attemptId: string, sittingId: string | null) => {
    const { error: e } = await supabase.from("assessment_attempts").update({ sitting_id: sittingId }).eq("id", attemptId);
    if (!e) await refetch();
    return e?.message ?? null;
  }, [refetch]);

  const removeAttempt = useCallback(async (a: AttemptSummary): Promise<string | null> => {
    const { error: e } = a.status === "assigned"
      ? await supabase.from("assessment_attempts").delete().eq("id", a.id)
      : await supabase.from("assessment_attempts").update({ status: "void" }).eq("id", a.id);
    if (e) return e.message;
    await refetch(); return null;
  }, [refetch]);

  const finaliseAttempt = useCallback(async (id: string): Promise<string | null> => {
    const { error: e } = await supabase.rpc("fn_finalise_attempt", { p_attempt: id });
    if (e) return e.message;
    await refetch(); return null;
  }, [refetch]);

  return { trainees, schedules, sites, departments, loading, error, refetch, addTrainees, updateTrainee, decide, createSchedule, updateSchedule, addSitting, setSittingStatus, assignCandidates, moveAttempt, removeAttempt, finaliseAttempt };
}

// ---------- Reviews (loaded per trainee) ----------
export interface Review { id: string; trainee_id: string; review_date: string; period_label: string | null; department: string | null; rating_technical: number | null; rating_attitude: number | null; rating_learning: number | null; rating_teamwork: number | null; strengths: string | null; improvements: string | null; reviewer: string | null; }

export async function loadReviews(traineeId: string): Promise<Review[]> {
  const { data } = await supabase.from("trainee_reviews").select("*").eq("trainee_id", traineeId).order("review_date", { ascending: false });
  return (data ?? []) as Review[];
}
export async function addReview(r: Partial<Review>): Promise<string | null> {
  const { error } = await supabase.from("trainee_reviews").insert(r);
  return error?.message ?? null;
}

/** Percentile of `value` within `values` (share of cohort scoring at or below). */
export function cohortPercentile(value: number, values: number[]): number {
  if (!values.length) return 0;
  const below = values.filter((v) => v < value).length, equal = values.filter((v) => v === value).length;
  return Math.round(((below + 0.5 * equal) / values.length) * 100);
}
export function band(pct: number): string {
  return pct >= 80 ? "Above average" : pct >= 60 ? "Upper average" : pct >= 40 ? "Average" : pct >= 20 ? "Lower average" : "Below average";
}
