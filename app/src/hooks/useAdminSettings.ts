// src/hooks/useAdminSettings.ts
// Settings administration: real users, real lookup tables, real retention
// config, real notification preference. No local-only state.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { DbAppRole } from "@/types/db";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: DbAppRole;
  siteId: string | null;
  siteName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LookupItem {
  id: string;
  label: string;
  sub: string | null;
  isActive: boolean;
}

export interface RetentionRow {
  siteId: string;
  siteName: string;
  retentionDays: number;
}

export function useAdminSettings() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [jobTitles, setJobTitles] = useState<LookupItem[]>([]);
  const [hardware, setHardware] = useState<LookupItem[]>([]);
  const [software, setSoftware] = useState<LookupItem[]>([]);
  const [clearance, setClearance] = useState<LookupItem[]>([]);
  const [retention, setRetention] = useState<RetentionRow[]>([]);
  const [notifPref, setNotifPref] = useState<string>("in_app");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const [profRes, siteRes, deptRes, jobRes, hwRes, swRes, clRes, cfgRes, meRes] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, phone, role, site_id, is_active, last_login_at, created_at, sites(name)").order("full_name"),
      supabase.from("sites").select("id, name").eq("is_active", true).order("name"),
      supabase.from("departments").select("id, name, code, is_active").order("name"),
      supabase.from("job_titles").select("id, title, is_active, departments(name)").order("title"),
      supabase.from("hardware_catalog").select("id, category, make, model, is_active").order("category"),
      supabase.from("software_catalog").select("id, name, license_type, is_active").order("name"),
      supabase.from("clearance_levels").select("id, name, description, is_active, sort_order").order("sort_order"),
      supabase.from("site_config").select("site_id, retention_days, sites!inner(name, is_active)").order("site_id"),
      supabase.from("profiles").select("notification_preference").eq("id", user?.id ?? "").maybeSingle(),
    ]);

    if (profRes.error) { setError(profRes.error.message); setLoading(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setUsers(((profRes.data ?? []) as any[]).map((p) => ({
      id: p.id, email: p.email, fullName: p.full_name, phone: p.phone,
      role: p.role, siteId: p.site_id, siteName: p.sites?.name ?? null,
      isActive: p.is_active, lastLoginAt: p.last_login_at, createdAt: p.created_at,
    })));
    setSites(siteRes.data ?? []);
    setDepartments((deptRes.data ?? []).map((d) => ({ id: d.id, label: d.name, sub: d.code, isActive: d.is_active })));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setJobTitles(((jobRes.data ?? []) as any[]).map((j) => ({ id: j.id, label: j.title, sub: j.departments?.name ?? null, isActive: j.is_active })));
    setHardware((hwRes.data ?? []).map((h) => ({ id: h.id, label: `${h.make} ${h.model}`, sub: h.category, isActive: h.is_active })));
    setSoftware((swRes.data ?? []).map((s) => ({ id: s.id, label: s.name, sub: s.license_type, isActive: s.is_active })));
    setClearance((clRes.data ?? []).map((c) => ({ id: c.id, label: c.name, sub: c.description, isActive: c.is_active })));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRetention(((cfgRes.data ?? []) as any[]).filter((c) => c.sites?.is_active).map((c) => ({ siteId: c.site_id, siteName: c.sites?.name ?? "", retentionDays: c.retention_days ?? 90 })).sort((a, b) => a.siteName.localeCompare(b.siteName)));
    if (meRes.data?.notification_preference) setNotifPref(meRes.data.notification_preference);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { void refetch(); }, [refetch]);

  // ── Users ──
  const createUser = useCallback(async (input: { email: string; fullName: string; role: DbAppRole; siteId: string | null; phone?: string }): Promise<string | null> => {
    const { error: err } = await supabase.rpc("fn_admin_create_user", {
      p_email: input.email, p_full_name: input.fullName, p_role: input.role,
      p_site_id: input.siteId, p_phone: input.phone ?? null,
    });
    if (err) return err.message;
    await refetch();
    return null;
  }, [refetch]);

  const updateUser = useCallback(async (id: string, input: { fullName: string; role: DbAppRole; siteId: string | null; phone?: string }): Promise<string | null> => {
    const { error: err } = await supabase.from("profiles").update({
      full_name: input.fullName, role: input.role, site_id: input.siteId, phone: input.phone ?? null,
    }).eq("id", id);
    if (err) return err.message;
    await refetch();
    return null;
  }, [refetch]);

  const setUserActive = useCallback(async (id: string, active: boolean): Promise<string | null> => {
    const { error: err } = await supabase.from("profiles").update({ is_active: active }).eq("id", id);
    if (err) return err.message;
    await refetch();
    return null;
  }, [refetch]);

  // ── Lookups ──
  const TABLES: Record<string, string> = { departments: "departments", jobTitles: "job_titles", hardware: "hardware_catalog", software: "software_catalog", clearance: "clearance_levels" };

  const addLookup = useCallback(async (kind: string, values: Record<string, unknown>): Promise<string | null> => {
    const { error: err } = await supabase.from(TABLES[kind]).insert(values);
    if (err) return err.message;
    await refetch();
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch]);

  const toggleLookup = useCallback(async (kind: string, id: string, active: boolean): Promise<string | null> => {
    const { error: err } = await supabase.from(TABLES[kind]).update({ is_active: active }).eq("id", id);
    if (err) return err.message;
    await refetch();
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch]);

  // ── Retention ──
  const saveRetention = useCallback(async (siteId: string | "all", days: number): Promise<string | null> => {
    const q = supabase.from("site_config").update({ retention_days: days, updated_at: new Date().toISOString() });
    const { error: err } = siteId === "all" ? await q.gte("retention_days", 0) : await q.eq("site_id", siteId);
    if (err) return err.message;
    await refetch();
    return null;
  }, [refetch]);

  // ── Notification preference (own) ──
  const saveNotifPref = useCallback(async (pref: string): Promise<string | null> => {
    if (!user) return "Not signed in";
    const { error: err } = await supabase.from("profiles").update({ notification_preference: pref }).eq("id", user.id);
    if (err) return err.message;
    setNotifPref(pref);
    return null;
  }, [user]);

  return {
    users, sites, departments, jobTitles, hardware, software, clearance, retention, notifPref,
    loading, error, refetch,
    createUser, updateUser, setUserActive,
    addLookup, toggleLookup, saveRetention, saveNotifPref,
  };
}
