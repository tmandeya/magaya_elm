// src/hooks/useOnboarding.ts
// Live onboarding workflows from the v2 engine, mapped to the shapes the
// Onboarding page renders. Actions call the server-side workflow engine
// (fn_start_workflow / fn_set_task_status) so progression, sign-offs,
// notifications, status flips and audit logging are enforced in the database.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { OnboardingWorkflow, OnboardingStage, ActivityLogEntry } from "@/types/workflow";

/** Task shape rendered by the page — superset of WorkflowTask with live fields. */
export interface LiveTask {
  label: string;
  completed: boolean;
  id: string;
  dbStatus: "pending" | "in_progress" | "completed" | "skipped" | "blocked" | "not_applicable";
  blocked: boolean;
  blockedReason: string | null;
  required: boolean;
  requestData: Record<string, unknown> | null;
  notes: string | null;
}

export interface LiveOnboardingStage extends OnboardingStage {
  id: string;
  stageKey: string;
  tasks?: LiveTask[];
}

export interface LiveOnboardingWorkflow extends OnboardingWorkflow {
  stages: LiveOnboardingStage[];
  employeeUuid: string;
}

export interface OnboardingCandidate {
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
  employees!workflows_employee_id_fkey ( id, employee_id, full_name, photo_url, sites(name), departments(name) ),
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
function mapWorkflow(w: any, profileNames: Record<string, string>): LiveOnboardingWorkflow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stages: LiveOnboardingStage[] = (w.workflow_stages ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.stage_order - b.stage_order)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any): LiveOnboardingStage => ({
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

  const activityLog: ActivityLogEntry[] = [
    { type: "create", message: "Onboarding initiated", timestamp: w.created_at, user: profileNames[w.initiated_by] ?? "HR" },
    ...stages
      .filter((s) => s.completedDate)
      .map((s): ActivityLogEntry => ({
        type: "complete",
        message: `${s.name} completed`,
        timestamp: s.completedDate ?? "",
        user: s.completedBy ?? "",
      })),
    ...(w.completed_at ? [{ type: "approve" as const, message: "Onboarding fully confirmed — employee is now active", timestamp: w.completed_at, user: "System" }] : []),
  ];

  return {
    id: w.id,
    reference: "ONB-" + w.id.slice(0, 8).toUpperCase(),
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
    expectedCompletion: "",
    currentStage: w.status === "completed" ? "Completed" : (current?.name ?? "Pending"),
    progress: stages.length ? Math.round((completedCount / stages.length) * 100) : 0,
    initiatedBy: profileNames[w.initiated_by] ?? "—",
    status: w.status === "completed" ? "Completed" : "In Progress",
    stages,
    activityLog,
  };
}

export function useOnboarding() {
  const [workflows, setWorkflows] = useState<LiveOnboardingWorkflow[]>([]);
  const [candidates, setCandidates] = useState<OnboardingCandidate[]>([]);
  const [hardwareOptions, setHardwareOptions] = useState<string[]>([]);
  const [softwareOptions, setSoftwareOptions] = useState<string[]>([]);
  const [clearanceOptions, setClearanceOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const [wfRes, profRes, candRes, hwRes, swRes, clRes] = await Promise.all([
      supabase.from("workflows").select(WORKFLOW_SELECT).eq("workflow_type", "onboarding").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("employees").select("id, employee_id, full_name, status, sites(name), departments(name)").eq("status", "onboarding"),
      supabase.from("hardware_catalog").select("make, model, category").eq("is_active", true).order("category"),
      supabase.from("software_catalog").select("name").eq("is_active", true).order("name"),
      supabase.from("clearance_levels").select("*"),
    ]);

    if (wfRes.error) { setError(wfRes.error.message); setLoading(false); return; }

    const profileNames: Record<string, string> = {};
    for (const p of profRes.data ?? []) profileNames[p.id] = p.full_name;

    const mapped = (wfRes.data ?? []).map((w) => mapWorkflow(w, profileNames));
    setWorkflows(mapped);

    const inFlight = new Set(mapped.filter((m) => m.status === "In Progress").map((m) => m.employeeUuid));
    setCandidates(((candRes.data ?? []) as unknown[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((e: any) => ({ id: e.id, name: e.full_name, code: e.employee_id, site: e.sites?.name ?? "—", department: e.departments?.name ?? "—" }))
      .filter((c) => !inFlight.has(c.id)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setHardwareOptions(((hwRes.data ?? []) as any[]).map((h) => `${h.make} ${h.model}`));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSoftwareOptions(((swRes.data ?? []) as any[]).map((s) => s.name));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cl = ((clRes.data ?? []) as any[]).map((c) => c.name ?? c.level_name ?? c.label).filter(Boolean);
    setClearanceOptions(cl.length ? cl : ["General", "Restricted", "High Security"]);

    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const startOnboarding = useCallback(async (input: {
    employeeId: string;
    notes?: string;
    hardware: string[];
    software: string[];
    clearanceLevel: string;
    vehicleCard: boolean;
    parking: boolean;
    adminNotes?: string;
  }): Promise<{ id: string | null; error: string | null }> => {
    const { data, error: err } = await supabase.rpc("fn_start_workflow", {
      p_type: "onboarding",
      p_employee_id: input.employeeId,
      p_notes: input.notes ?? null,
    });
    if (err) return { id: null, error: err.message };
    const wfId = data as string;

    const { error: reqErr } = await supabase.rpc("fn_set_onboarding_requests", {
      p_workflow_id: wfId,
      p_hardware: input.hardware,
      p_software: input.software,
      p_clearance_level: input.clearanceLevel,
      p_vehicle_card: input.vehicleCard,
      p_parking: input.parking,
      p_admin_notes: input.adminNotes ?? null,
    });
    if (reqErr) console.warn("Failed to attach requests:", reqErr.message);

    await refetch();
    return { id: wfId, error: null };
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

  return { workflows, candidates, hardwareOptions, softwareOptions, clearanceOptions, loading, error, refetch, startOnboarding, setTaskStatus };
}
