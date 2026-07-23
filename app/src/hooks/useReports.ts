// src/hooks/useReports.ts
// Reports & Analytics: every figure derives from the same live tables the
// rest of the app reads (employees, workflows, employee_documents), so
// reports always agree with the Dashboard and Sites pages.

import { useState, useEffect, useCallback } from "react";
import { supabase, fetchAllRows } from "@/lib/supabase";

export interface NameCount { name: string; count: number }

export interface WorkflowTypeReport {
  total: number;
  inProgress: number;
  completed: number;
  avgCycleDays: number | null;
  bySite: NameCount[];
  rows: { id: string; employee: string; code: string; site: string; extra: string; status: string; started: string }[];
}

export interface ReportsData {
  census: {
    total: number;
    active: number;
    newThisMonth: number;
    departedThisMonth: number;
    bySite: NameCount[];
    byDepartment: NameCount[];
    byGender: NameCount[];
    byEmploymentType: NameCount[];
  };
  onboarding: WorkflowTypeReport;
  offboarding: WorkflowTypeReport;
  transfers: WorkflowTypeReport;
  itAccounts: { m365: NameCount[]; withWorkEmail: number; withoutWorkEmail: number };
  documents: {
    total: number;
    expired: number;
    within30: number;
    within60: number;
    within90: number;
    byCategory: NameCount[];
    expiring: { employee: string; code: string; category: string; fileName: string; expiryDate: string }[];
  };
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function toCounts(map: Record<string, number>): NameCount[] {
  return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function useReports(rangeDays: number | null) {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const since = rangeDays ? new Date(Date.now() - rangeDays * 86400000).toISOString() : null;
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartIso = monthStart.toISOString().slice(0, 10);

    const wfQuery = () => {
      let q = supabase.from("workflows").select(`
        id, workflow_type, status, created_at, completed_at,
        transfer_effective_date, last_working_day, offboarding_reason, transfer_reason,
        employees!workflows_employee_id_fkey ( full_name, employee_id ),
        sites!workflows_site_id_fkey ( name ),
        destination_site:sites!workflows_destination_site_id_fkey ( name )
      `).order("created_at", { ascending: false });
      if (since) q = q.gte("created_at", since);
      return q;
    };

    const [empAll, wfRes, docRes, cntNew, cntDeparted] = await Promise.all([
      fetchAllRows("employees", "status, gender, employment_type, m365_account_status, work_email, sites(name), departments(name)", (q) => q.neq("status", "archived")),
      wfQuery(),
      supabase.from("employee_documents").select("category, file_name, expiry_date, employees(full_name, employee_id)"),
      supabase.from("employees").select("id", { count: "exact", head: true }).gte("date_of_engagement", monthStartIso),
      supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "terminated").gte("termination_date", monthStartIso),
    ]);

    if (empAll.error) { setError(empAll.error); setLoading(false); return; }
    if (wfRes.error) { setError(wfRes.error.message); setLoading(false); return; }

    // Census
    const bySite: Record<string, number> = {};
    const byDept: Record<string, number> = {};
    const byGender: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const m365: Record<string, number> = {};
    let active = 0, withEmail = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const e of empAll.data as any[]) {
      if (e.status === "active") active++;
      bySite[e.sites?.name ?? "Unassigned"] = (bySite[e.sites?.name ?? "Unassigned"] ?? 0) + 1;
      byDept[e.departments?.name ?? "Unassigned"] = (byDept[e.departments?.name ?? "Unassigned"] ?? 0) + 1;
      byGender[e.gender ? cap(e.gender) : "Not recorded"] = (byGender[e.gender ? cap(e.gender) : "Not recorded"] ?? 0) + 1;
      byType[e.employment_type ? cap(e.employment_type) : "Not recorded"] = (byType[e.employment_type ? cap(e.employment_type) : "Not recorded"] ?? 0) + 1;
      m365[e.m365_account_status ?? "None"] = (m365[e.m365_account_status ?? "None"] ?? 0) + 1;
      if (e.work_email) withEmail++;
    }

    // Workflows per type
    const mkReport = (type: string): WorkflowTypeReport => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = ((wfRes.data ?? []) as any[]).filter((w) => w.workflow_type === type);
      const completed = list.filter((w) => w.status === "completed");
      const cycles = completed.filter((w) => w.completed_at).map((w) => (new Date(w.completed_at).getTime() - new Date(w.created_at).getTime()) / 86400000);
      const siteAgg: Record<string, number> = {};
      for (const w of list) siteAgg[w.sites?.name ?? "—"] = (siteAgg[w.sites?.name ?? "—"] ?? 0) + 1;
      return {
        total: list.length,
        inProgress: list.filter((w) => w.status === "in_progress").length,
        completed: completed.length,
        avgCycleDays: cycles.length ? Math.round((cycles.reduce((a, b) => a + b, 0) / cycles.length) * 10) / 10 : null,
        bySite: toCounts(siteAgg),
        rows: list.slice(0, 50).map((w) => ({
          id: w.id,
          employee: w.employees?.full_name ?? "—",
          code: w.employees?.employee_id ?? "",
          site: w.sites?.name ?? "—",
          extra: type === "transfer" ? `→ ${w.destination_site?.name ?? "?"} (${w.transfer_effective_date ?? "tbc"})`
            : type === "offboarding" ? (w.last_working_day ? `Last day ${w.last_working_day}` : (w.offboarding_reason ?? ""))
            : "",
          status: w.status === "completed" ? "Completed" : "In Progress",
          started: (w.created_at ?? "").slice(0, 10),
        })),
      };
    };

    // Documents
    const today = new Date();
    const byCat: Record<string, number> = {};
    let expired = 0, w30 = 0, w60 = 0, w90 = 0;
    const expiring: ReportsData["documents"]["expiring"] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const d of (docRes.data ?? []) as any[]) {
      byCat[d.category] = (byCat[d.category] ?? 0) + 1;
      if (d.expiry_date) {
        const days = (new Date(d.expiry_date).getTime() - today.getTime()) / 86400000;
        if (days < 0) expired++;
        else if (days <= 30) w30++;
        else if (days <= 60) w60++;
        else if (days <= 90) w90++;
        if (days <= 90) expiring.push({
          employee: d.employees?.full_name ?? "—", code: d.employees?.employee_id ?? "",
          category: d.category, fileName: d.file_name, expiryDate: d.expiry_date,
        });
      }
    }
    expiring.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

    setData({
      census: {
        total: empAll.data.length,
        active,
        newThisMonth: cntNew.count ?? 0,
        departedThisMonth: cntDeparted.count ?? 0,
        bySite: toCounts(bySite),
        byDepartment: toCounts(byDept),
        byGender: toCounts(byGender),
        byEmploymentType: toCounts(byType),
      },
      onboarding: mkReport("onboarding"),
      offboarding: mkReport("offboarding"),
      transfers: mkReport("transfer"),
      itAccounts: { m365: toCounts(m365), withWorkEmail: withEmail, withoutWorkEmail: empAll.data.length - withEmail },
      documents: { total: (docRes.data ?? []).length, expired, within30: w30, within60: w60, within90: w90, byCategory: toCounts(byCat), expiring: expiring.slice(0, 50) },
    });
    setLoading(false);
  }, [rangeDays]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
