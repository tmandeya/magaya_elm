// src/hooks/useDashboard.ts
// Live dashboard aggregates from the v2 schema. All queries run under RLS,
// so site-scoped roles automatically see only their site's numbers.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface DashboardKpi {
  activeEmployees: number;
  onboardingInProgress: number;
  offboardingPending: number;
  transfersThisMonth: number;
  pendingApprovals: number;
}

export interface WorkflowStats {
  onboarding: number;
  offboarding: number;
  transfers: number;
  completed: number;
  completedToday: number;
  inProgress: number;
  overdue: number;
}

export interface PendingTask {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  workflowType: string;
  workflowId: string | null;
}

export interface RecentWorkflowItem {
  id: string;
  employee: string;
  site: string;
  progress: number;
  createdAt: string;
}

export interface SiteOverviewRow {
  site: string;
  active: number;
  onboarding: number;
  offboarding: number;
  transfers: number;
}

export function useDashboard() {
  const { user } = useAuth();
  const [kpi, setKpi] = useState<DashboardKpi>({ activeEmployees: 0, onboardingInProgress: 0, offboardingPending: 0, transfersThisMonth: 0, pendingApprovals: 0 });
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats>({ onboarding: 0, offboarding: 0, transfers: 0, completed: 0, completedToday: 0, inProgress: 0, overdue: 0 });
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [recentOnboarding, setRecentOnboarding] = useState<RecentWorkflowItem[]>([]);
  const [recentOffboarding, setRecentOffboarding] = useState<RecentWorkflowItem[]>([]);
  const [siteOverview, setSiteOverview] = useState<SiteOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [empRes, wfRes, taskRes, headRes] = await Promise.all([
      supabase.from("employees").select("status"),
      supabase.from("workflows").select(`
        id, workflow_type, status, created_at, completed_at, offboarding_deadline,
        employees!workflows_employee_id_fkey ( full_name ),
        workflow_stages ( status )
      `).order("created_at", { ascending: false }),
      user
        ? supabase.from("workflow_tasks").select("id, task_label, status, created_at, workflow_id, workflows(workflow_type, employees!workflows_employee_id_fkey(full_name))").eq("assigned_to", user.id).in("status", ["pending", "in_progress"]).order("created_at", { ascending: false }).limit(10)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("v_site_headcount").select("*"),
    ]);

    if (empRes.error) { setError(empRes.error.message); setLoading(false); return; }

    // KPIs from employee statuses (RLS-scoped)
    const statusCounts: Record<string, number> = {};
    for (const r of empRes.data ?? []) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;

    // Workflow aggregates
    const wf = wfRes.data ?? [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const stats: WorkflowStats = { onboarding: 0, offboarding: 0, transfers: 0, completed: 0, completedToday: 0, inProgress: 0, overdue: 0 };
    let transfersThisMonth = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progressOf = (w: any) => {
      const stages = w.workflow_stages ?? [];
      if (stages.length === 0) return 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const done = stages.filter((s: any) => s.status === "completed").length;
      return Math.round((done / stages.length) * 100);
    };
    for (const w of wf) {
      if (w.status === "completed") {
        stats.completed++;
        if (w.completed_at && new Date(w.completed_at) >= today) stats.completedToday++;
      } else if (w.status === "in_progress") {
        stats.inProgress++;
        if (w.workflow_type === "onboarding") stats.onboarding++;
        else if (w.workflow_type === "offboarding") {
          stats.offboarding++;
          if (w.offboarding_deadline && new Date(w.offboarding_deadline) < today) stats.overdue++;
        } else if (w.workflow_type === "transfer") stats.transfers++;
      }
      if (w.workflow_type === "transfer" && new Date(w.created_at) >= monthStart) transfersThisMonth++;
    }

    const tasks = (taskRes.data ?? []) as unknown[];
    setKpi({
      activeEmployees: statusCounts["active"] ?? 0,
      onboardingInProgress: statusCounts["onboarding"] ?? 0,
      offboardingPending: statusCounts["offboarding"] ?? 0,
      transfersThisMonth,
      pendingApprovals: tasks.length,
    });
    setWorkflowStats(stats);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setPendingTasks(tasks.map((t: any) => ({
      id: t.id,
      title: t.task_label,
      description: t.workflows?.employees?.full_name ? `${t.workflows.employees.full_name} · ${t.workflows.workflow_type}` : (t.workflows?.workflow_type ?? ""),
      createdAt: t.created_at,
      workflowType: t.workflows?.workflow_type ?? "approval",
      workflowId: t.workflow_id ?? null,
    })));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRecent = (w: any): RecentWorkflowItem => ({
      id: w.id,
      employee: w.employees?.full_name ?? "Unknown",
      site: "",
      progress: progressOf(w),
      createdAt: w.created_at,
    });
    setRecentOnboarding(wf.filter((w) => w.workflow_type === "onboarding").slice(0, 5).map(toRecent));
    setRecentOffboarding(wf.filter((w) => w.workflow_type === "offboarding").slice(0, 5).map(toRecent));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSiteOverview(((headRes.data ?? []) as any[]).map((s) => ({
      site: s.site_name,
      active: s.active_count ?? 0,
      onboarding: s.onboarding_count ?? 0,
      offboarding: s.offboarding_count ?? 0,
      transfers: s.transferred_count ?? 0,
    })));

    setLoading(false);
  }, [user]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { kpi, workflowStats, pendingTasks, recentOnboarding, recentOffboarding, siteOverview, loading, error, refetch };
}
