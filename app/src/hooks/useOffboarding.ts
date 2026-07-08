// src/hooks/useOffboarding.ts
// Live offboarding workflows from the v2 engine, mapped to the shapes the
// Offboarding page renders. Same engine as onboarding: fn_start_workflow /
// fn_set_task_status enforce progression, sign-offs, notifications, the
// employee status flip to terminated, and audit logging server-side.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { OffboardingWorkflow, ActivityLogEntry } from "@/types/workflow";
import type { LiveTask } from "@/hooks/useOnboarding";

export interface LiveOffboardingStage {
  id: string;
  stageKey: string;
  name: string;
  status: "completed" | "in-progress" | "pending";
  assignedTo: string;
  completedBy: string | null;
  completedDate: string | null;
  notes: string | null;
  tasks?: LiveTask[];
}

export interface LiveOffboardingWorkflow extends OffboardingWorkflow {
  stages: LiveOffboardingStage[];
  employeeUuid: string;
  /** Extra details for the generated offboarding letter */
  letter: {
    jobTitle: string;
    engagementDate: string | null;
    nationalId: string | null;
    completedAt: string | null;
  };
}

export interface OffboardingCandidate {
  id: string;
  name: string;
  code: string;
  site: string;
  department: string;
}

const ROLE_LABEL: Record<string, string> = {
  site_hr: "Site HR",
  site_security: "Site Security",
  site_it_administrator: "Site IT",
  site_administrator: "Site Administrator",
};

const WORKFLOW_SELECT = `
  id, workflow_type, status, notes, created_at, completed_at, initiated_by,
  last_working_day, offboarding_reason, offboarding_deadline,
  employees!workflows_employee_id_fkey (
    id, employee_id, full_name, photo_url, national_id, date_of_engagement,
    job_title_custom, job_titles(title), sites(name), departments(name)
  ),
  workflow_stages (
    id, stage_key, stage_label, stage_order, status, assigned_to_role,
    started_at, completed_at, completed_by, notes,
    workflow_tasks (
      id, task_key, task_label, status, is_required, is_blocked, blocked_reason,
      task_data, notes, completed_at, completed_by
    )
  )
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWorkflow(w: any, profileNames: Record<string, string>): LiveOffboardingWorkflow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stages: LiveOffboardingStage[] = (w.workflow_stages ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.stage_order - b.stage_order)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any): LiveOffboardingStage => ({
      id: s.id,
      stageKey: s.stage_key,
      name: s.stage_label,
      status: s.status === "completed" ? "completed" : s.status === "in_progress" ? "in-progress" : "pending",
      assignedTo: s.assigned_to_role ? (ROLE_LABEL[s.assigned_to_role] ?? s.assigned_to_role) : "System",
      completedBy: s.completed_by ? (profileNames[s.completed_by] ?? "User") : null,
      completedDate: s.completed_at ? s.completed_at.slice(0, 10) : null,
      notes: s.notes ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasks: (s.workflow_tasks ?? []).map((t: any): LiveTask => ({
        id: t.id,
        label: t.task_label,
        completed: ["completed", "not_applicable", "skipped"].includes(t.status),
        dbStatus: t.status,
        blocked: t.status === "blocked",
        blockedReason: t.blocked_reason ?? null,
        required: t.is_required,
        requestData: t.task_data && Object.keys(t.task_data).length > 0 ? t.task_data : null,
        notes: t.notes ?? null,
      })),
    }));

  const completedCount = stages.filter((s) => s.status === "completed").length;
  const current = stages.find((s) => s.status === "in-progress");
  const reason: string = w.offboarding_reason ?? "";
  const offboardingType = reason.includes(" — ") ? reason.split(" — ")[0] : (reason || "—");

  const activityLog: ActivityLogEntry[] = [
    { type: "create", message: "Offboarding initiated", timestamp: w.created_at, user: profileNames[w.initiated_by] ?? "HR" },
    ...stages
      .filter((s) => s.completedDate)
      .map((s): ActivityLogEntry => ({ type: "complete", message: `${s.name} completed`, timestamp: s.completedDate ?? "", user: s.completedBy ?? "" })),
    ...(w.completed_at ? [{ type: "approve" as const, message: "Offboarding fully cleared — employee moved to Former Employees", timestamp: w.completed_at, user: "System" }] : []),
  ];

  const overdue = w.status === "in_progress" && w.offboarding_deadline && new Date(w.offboarding_deadline) < new Date();

  return {
    id: w.id,
    reference: "OFF-" + w.id.slice(0, 8).toUpperCase(),
    employee: {
      id: w.employees?.id ?? "",
      name: w.employees?.full_name ?? "Unknown",
      code: w.employees?.employee_id ?? "",
      avatar: w.employees?.photo_url ?? null,
      site: w.employees?.sites?.name ?? "—",
      department: w.employees?.departments?.name ?? "—",
    },
    employeeUuid: w.employees?.id ?? "",
    initiatedDate: (w.created_at ?? "").slice(0, 10),
    lastWorkingDate: w.last_working_day ?? "",
    offboardingType,
    currentStage: w.status === "completed" ? "Completed" : (current?.name ?? "Pending"),
    progress: stages.length ? Math.round((completedCount / stages.length) * 100) : 0,
    initiatedBy: profileNames[w.initiated_by] ?? "—",
    status: w.status === "completed" ? "Completed" : overdue ? "Overdue" : "In Progress",
    stages,
    activityLog,
    letter: {
      jobTitle: w.employees?.job_titles?.title ?? w.employees?.job_title_custom ?? "—",
      engagementDate: w.employees?.date_of_engagement ?? null,
      nationalId: w.employees?.national_id ?? null,
      completedAt: w.completed_at ? w.completed_at.slice(0, 10) : null,
    },
  };
}

export function useOffboarding() {
  const [workflows, setWorkflows] = useState<LiveOffboardingWorkflow[]>([]);
  const [candidates, setCandidates] = useState<OffboardingCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const [wfRes, profRes, candRes] = await Promise.all([
      supabase.from("workflows").select(WORKFLOW_SELECT).eq("workflow_type", "offboarding").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("employees").select("id, employee_id, full_name, sites(name), departments(name)").eq("status", "active").order("surname"),
    ]);

    if (wfRes.error) { setError(wfRes.error.message); setLoading(false); return; }

    const profileNames: Record<string, string> = {};
    for (const p of profRes.data ?? []) profileNames[p.id] = p.full_name;

    setWorkflows((wfRes.data ?? []).map((w) => mapWorkflow(w, profileNames)));
    setCandidates(((candRes.data ?? []) as unknown[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((e: any) => ({ id: e.id, name: e.full_name, code: e.employee_id, site: e.sites?.name ?? "—", department: e.departments?.name ?? "—" })));

    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const startOffboarding = useCallback(async (input: {
    employeeId: string;
    terminationType: string;
    lastWorkingDay: string;
    reason?: string;
  }): Promise<{ id: string | null; error: string | null }> => {
    const { data, error: err } = await supabase.rpc("fn_start_workflow", {
      p_type: "offboarding",
      p_employee_id: input.employeeId,
      p_last_working_day: input.lastWorkingDay,
      p_offboarding_reason: input.reason ? `${input.terminationType} — ${input.reason}` : input.terminationType,
    });
    if (err) return { id: null, error: err.message };
    await refetch();
    return { id: data as string, error: null };
  }, [refetch]);

  const setTaskStatus = useCallback(async (taskId: string, status: LiveTask["dbStatus"], notes?: string): Promise<string | null> => {
    const { error: err } = await supabase.rpc("fn_set_task_status", {
      p_task_id: taskId,
      p_status: status,
      p_notes: notes ?? null,
    });
    if (err) return err.message;
    await refetch();
    return null;
  }, [refetch]);

  return { workflows, candidates, loading, error, refetch, startOffboarding, setTaskStatus };
}
