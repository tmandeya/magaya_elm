// src/hooks/useTransfers.ts
// Transfer workflows: origin/destination routing on the same engine.
// Stages carry their own site_id (origin IT clears, destination IT preps),
// so the detail view shows which site each stage belongs to.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ActivityLogEntry } from "@/types/workflow";
import type { LiveTask } from "@/hooks/useOnboarding";

export interface LiveTransferStage {
  id: string;
  stageKey: string;
  name: string;
  status: "completed" | "in-progress" | "pending";
  assignedTo: string;
  siteName: string | null;
  siteRole: "origin" | "destination" | "shared";
  completedBy: string | null;
  completedDate: string | null;
  notes: string | null;
  tasks?: LiveTask[];
  items?: LiveTask[];
}

export interface LiveTransferWorkflow {
  id: string;
  reference: string;
  employee: { id: string; name: string; code: string; avatar: string | null; department: string };
  employeeUuid: string;
  originSite: string;
  destinationSite: string;
  effectiveDate: string;
  reason: string;
  initiatedDate: string;
  initiatedBy: string;
  currentStage: string;
  progress: number;
  status: "In Progress" | "Completed";
  stages: LiveTransferStage[];
  activityLog: ActivityLogEntry[];
}

export interface TransferCandidate {
  id: string;
  name: string;
  code: string;
  site: string;
  siteId: string;
  department: string;
}

const ROLE_LABEL: Record<string, string> = {
  site_hr: "Site HR", site_security: "Site Security",
  site_it_administrator: "Site IT", site_administrator: "Site Administrator",
  hq_hr: "HQ HR",
};

const WORKFLOW_SELECT = `
  id, workflow_type, status, notes, created_at, completed_at, initiated_by,
  transfer_reason, transfer_effective_date,
  origin_site:sites!workflows_origin_site_id_fkey ( id, name ),
  destination_site:sites!workflows_destination_site_id_fkey ( id, name ),
  employees!workflows_employee_id_fkey ( id, employee_id, full_name, photo_url, departments(name) ),
  workflow_stages (
    id, stage_key, stage_label, stage_order, status, assigned_to_role, site_id,
    started_at, completed_at, completed_by, notes, sites ( name ),
    workflow_tasks (
      id, task_key, task_label, status, is_required, is_blocked, blocked_reason,
      task_data, notes, completed_at, completed_by
    )
  )
`;

export function useTransfers() {
  const [workflows, setWorkflows] = useState<LiveTransferWorkflow[]>([]);
  const [candidates, setCandidates] = useState<TransferCandidate[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const [wfRes, profRes, candRes, siteRes] = await Promise.all([
      supabase.from("workflows").select(WORKFLOW_SELECT).eq("workflow_type", "transfer").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("employees").select("id, employee_id, full_name, site_id, sites(name), departments(name)").eq("status", "active").order("surname"),
      supabase.from("sites").select("id, name").eq("is_active", true).order("name"),
    ]);

    if (wfRes.error) { setError(wfRes.error.message); setLoading(false); return; }

    const names: Record<string, string> = {};
    for (const p of profRes.data ?? []) names[p.id] = p.full_name;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setWorkflows(((wfRes.data ?? []) as any[]).map((w): LiveTransferWorkflow => {
      const originId = w.origin_site?.id;
      const destId = w.destination_site?.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stages: LiveTransferStage[] = (w.workflow_stages ?? []).sort((a: any, b: any) => a.stage_order - b.stage_order)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((s: any): LiveTransferStage => ({
          id: s.id,
          stageKey: s.stage_key,
          name: s.stage_label,
          status: s.status === "completed" ? "completed" : s.status === "in_progress" ? "in-progress" : "pending",
          assignedTo: s.assigned_to_role ? (ROLE_LABEL[s.assigned_to_role] ?? s.assigned_to_role) : "HR / Admin",
          siteName: s.sites?.name ?? null,
          siteRole: s.site_id === originId && s.site_id !== destId ? "origin" : s.site_id === destId && s.site_id !== originId ? "destination" : "shared",
          completedBy: s.completed_by ? (names[s.completed_by] ?? "User") : null,
          completedDate: s.completed_at ? s.completed_at.slice(0, 10) : null,
          notes: s.notes ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: undefined as unknown as LiveTask[], // set below (alias of tasks)
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
      for (const st of stages) st.items = st.tasks;
      const done = stages.filter((s) => s.status === "completed").length;
      const current = stages.find((s) => s.status === "in-progress");
      return {
        id: w.id,
        reference: "TRF-" + w.id.slice(0, 8).toUpperCase(),
        employee: {
          id: w.employees?.id ?? "", name: w.employees?.full_name ?? "Unknown",
          code: w.employees?.employee_id ?? "", avatar: w.employees?.photo_url ?? null,
          department: w.employees?.departments?.name ?? "—",
        },
        employeeUuid: w.employees?.id ?? "",
        originSite: w.origin_site?.name ?? "—",
        destinationSite: w.destination_site?.name ?? "—",
        effectiveDate: w.transfer_effective_date ?? "",
        reason: w.transfer_reason ?? "",
        initiatedDate: (w.created_at ?? "").slice(0, 10),
        initiatedBy: names[w.initiated_by] ?? "—",
        currentStage: w.status === "completed" ? "Completed" : (current?.name ?? "Pending"),
        progress: stages.length ? Math.round((done / stages.length) * 100) : 0,
        status: w.status === "completed" ? "Completed" : "In Progress",
        stages,
        activityLog: [
          { type: "create", message: `Transfer initiated: ${w.origin_site?.name ?? "?"} → ${w.destination_site?.name ?? "?"}`, timestamp: w.created_at, user: names[w.initiated_by] ?? "HR" },
          ...stages.filter((s) => s.completedDate).map((s): ActivityLogEntry => ({ type: "complete", message: `${s.name} completed${s.siteName ? ` (${s.siteName})` : ""}`, timestamp: s.completedDate ?? "", user: s.completedBy ?? "" })),
          ...(w.completed_at ? [{ type: "approve" as const, message: "Transfer complete — employee moved to destination site", timestamp: w.completed_at, user: "System" }] : []),
        ],
      };
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCandidates(((candRes.data ?? []) as any[]).map((e) => ({
      id: e.id, name: e.full_name, code: e.employee_id,
      site: e.sites?.name ?? "—", siteId: e.site_id, department: e.departments?.name ?? "—",
    })));
    setSites(siteRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const startTransfer = useCallback(async (input: {
    employeeId: string;
    destinationSiteId: string;
    effectiveDate: string;
    reason: string;
  }): Promise<{ id: string | null; error: string | null }> => {
    const { data, error: err } = await supabase.rpc("fn_start_workflow", {
      p_type: "transfer",
      p_employee_id: input.employeeId,
      p_destination_site_id: input.destinationSiteId,
      p_transfer_reason: input.reason || null,
      p_transfer_effective_date: input.effectiveDate || null,
    });
    if (err) return { id: null, error: err.message };
    await refetch();
    return { id: data as string, error: null };
  }, [refetch]);

  const setTaskStatus = useCallback(async (taskId: string, status: LiveTask["dbStatus"], notes?: string): Promise<string | null> => {
    const { error: err } = await supabase.rpc("fn_set_task_status", {
      p_task_id: taskId, p_status: status, p_notes: notes ?? null,
    });
    if (err) return err.message;
    await refetch();
    return null;
  }, [refetch]);

  return { workflows, candidates, sites, loading, error, refetch, startTransfer, setTaskStatus };
}
