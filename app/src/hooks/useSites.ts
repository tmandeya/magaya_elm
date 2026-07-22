// src/hooks/useSites.ts
// Sites Management live data. All counts derive from the same tables the
// Dashboard and Employee Master Data read (employees, workflows), so the
// numbers agree across sections by construction.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface LiveSitePersonnel {
  [roleKey: string]: { name: string; code: string } | undefined;
}

export interface LiveSiteDetail {
  id: string;
  code: string;
  name: string;
  location: string;
  address: string;
  status: "Active" | "Inactive";
  established: string;
  employees: number;          // active headcount (matches Dashboard/Master Data)
  totalPeople: number;        // all non-archived records at the site
  workflows: { onboarding: number; offboarding: number; transfers: number };
  deptData: { name: string; value: number }[];
  statusData: { name: string; value: number }[];
  personnel: LiveSitePersonnel;
  personnelCount: number;
  hodEnabled: boolean;
  gmEnabled: boolean;
  approvalStages: number;     // 5 standard + HOD if enabled
}

// site_key_personnel.role_function -> UI role keys used by the page
const ROLE_FUNCTION_TO_KEY: Record<string, string> = {
  hr: "hr", site_hr: "hr",
  it: "it", site_it: "it",
  security: "security", site_security: "security",
  admin: "admin", site_admin: "admin",
  hod: "hod",
  gm: "gm", site_gm: "gm",
};

export function useSites() {
  const [sites, setSites] = useState<LiveSiteDetail[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const [siteRes, empRes, wfRes, cfgRes, kpRes, profRes] = await Promise.all([
      supabase.from("sites").select("id, code, name, location, address, is_active, created_at").order("name"),
      supabase.from("employees").select("site_id, status, departments(name)"),
      supabase.from("workflows").select("site_id, workflow_type, status").eq("status", "in_progress"),
      supabase.from("site_config").select("site_id, enable_hod_signoff, enable_site_gm_signoff"),
      supabase.from("site_key_personnel").select("site_id, role_function, is_active, profiles(id, full_name, email)").eq("is_active", true),
      supabase.from("profiles").select("id, full_name, role").eq("is_active", true),
    ]);

    if (siteRes.error) { setError(siteRes.error.message); setLoading(false); return; }

    const empBySite: Record<string, { active: number; total: number }> = {};
    const deptBySite: Record<string, Record<string, number>> = {};
    const statusBySite: Record<string, Record<string, number>> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const e of (empRes.data ?? []) as any[]) {
      if (!e.site_id) continue;
      empBySite[e.site_id] ??= { active: 0, total: 0 };
      if (e.status !== "archived") {
        empBySite[e.site_id].total++;
        const dept = e.departments?.name ?? "Unassigned";
        deptBySite[e.site_id] ??= {};
        deptBySite[e.site_id][dept] = (deptBySite[e.site_id][dept] ?? 0) + 1;
        statusBySite[e.site_id] ??= {};
        statusBySite[e.site_id][e.status] = (statusBySite[e.site_id][e.status] ?? 0) + 1;
      }
      if (e.status === "active") empBySite[e.site_id].active++;
    }

    const wfBySite: Record<string, { onboarding: number; offboarding: number; transfers: number }> = {};
    for (const w of wfRes.data ?? []) {
      if (!w.site_id) continue;
      wfBySite[w.site_id] ??= { onboarding: 0, offboarding: 0, transfers: 0 };
      if (w.workflow_type === "onboarding") wfBySite[w.site_id].onboarding++;
      else if (w.workflow_type === "offboarding") wfBySite[w.site_id].offboarding++;
      else if (w.workflow_type === "transfer") wfBySite[w.site_id].transfers++;
    }

    const cfgBySite: Record<string, { hod: boolean; gm: boolean }> = {};
    for (const c of cfgRes.data ?? []) cfgBySite[c.site_id] = { hod: !!c.enable_hod_signoff, gm: !!c.enable_site_gm_signoff };

    const kpBySite: Record<string, LiveSitePersonnel> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const k of (kpRes.data ?? []) as any[]) {
      const key = ROLE_FUNCTION_TO_KEY[k.role_function] ?? k.role_function;
      kpBySite[k.site_id] ??= {};
      kpBySite[k.site_id][key] = { name: k.profiles?.full_name ?? "—", code: k.profiles?.email ?? "" };
    }

    setSites((siteRes.data ?? []).map((s): LiveSiteDetail => {
      const cfg = cfgBySite[s.id] ?? { hod: false, gm: false };
      const personnel = kpBySite[s.id] ?? {};
      return {
        id: s.id,
        code: s.code,
        name: s.name,
        location: s.location ?? "",
        address: s.address ?? s.location ?? "",
        status: s.is_active ? "Active" : "Inactive",
        established: (s.created_at ?? "").slice(0, 10),
        employees: empBySite[s.id]?.active ?? 0,
        totalPeople: empBySite[s.id]?.total ?? 0,
        workflows: wfBySite[s.id] ?? { onboarding: 0, offboarding: 0, transfers: 0 },
        deptData: Object.entries(deptBySite[s.id] ?? {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        statusData: Object.entries(statusBySite[s.id] ?? {}).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })),
        personnel,
        personnelCount: Object.keys(personnel).length,
        hodEnabled: cfg.hod,
        gmEnabled: cfg.gm,
        approvalStages: 5 + (cfg.hod ? 1 : 0),
      };
    }));
    setProfiles((profRes.data ?? []).map((p) => ({ id: p.id, name: p.full_name, role: p.role })));
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const addSite = useCallback(async (input: { name: string; location: string; address?: string; active: boolean }): Promise<string | null> => {
    const base = input.name.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3) || "SIT";
    let code = base;
    for (let n = 2; n < 10; n++) {
      const { data } = await supabase.from("sites").select("id").eq("code", code).maybeSingle();
      if (!data) break;
      code = base.slice(0, 2) + n;
    }
    const { data: created, error: err } = await supabase.from("sites")
      .insert({ code, name: input.name.trim(), location: input.location.trim() || null, address: input.address?.trim() || null, is_active: input.active })
      .select("id").single();
    if (err) return err.message;
    if (created) await supabase.from("site_config").insert({ site_id: created.id });
    await refetch();
    return null;
  }, [refetch]);

  const setSiteActive = useCallback(async (siteId: string, active: boolean): Promise<string | null> => {
    const { error: err } = await supabase.from("sites").update({ is_active: active }).eq("id", siteId);
    if (err) return err.message;
    await refetch();
    return null;
  }, [refetch]);

  const setApprovalToggles = useCallback(async (siteId: string, hod: boolean, gm: boolean): Promise<string | null> => {
    const { error: err } = await supabase.from("site_config").update({ enable_hod_signoff: hod, enable_site_gm_signoff: gm, updated_at: new Date().toISOString() }).eq("site_id", siteId);
    if (err) return err.message;
    await refetch();
    return null;
  }, [refetch]);

  const assignPersonnel = useCallback(async (siteId: string, roleKey: string, profileId: string | null): Promise<string | null> => {
    // Deactivate any current holder of the role at the site, then assign.
    const { error: e1 } = await supabase.from("site_key_personnel").update({ is_active: false }).eq("site_id", siteId).eq("role_function", roleKey);
    if (e1) return e1.message;
    if (profileId) {
      const { error: e2 } = await supabase.from("site_key_personnel").insert({ site_id: siteId, role_function: roleKey, profile_id: profileId, is_active: true });
      if (e2) return e2.message;
    }
    await refetch();
    return null;
  }, [refetch]);

  return { sites, profiles, loading, error, refetch, addSite, setSiteActive, setApprovalToggles, assignPersonnel };
}
