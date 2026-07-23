// src/hooks/useAuditLogs.ts
// Live audit trail: server-side pagination + filters over audit_logs
// (15k+ rows and growing — never fetch the whole table client-side).

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface AuditRow {
  id: string;
  createdAt: string;
  tableName: string;
  recordId: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  performedBy: string | null;
  performedByName: string;
  siteName: string | null;
  subject: string | null;      // human reference from row data (e.g. employee name/code)
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
}

export interface AuditFilters {
  action: string;      // "" | INSERT | UPDATE | DELETE
  table: string;       // "" | table name
  userId: string;      // "" | profile id
  from: string;        // "" | yyyy-mm-dd
  to: string;
}

export const AUDIT_TABLES = [
  "employees", "employee_financials", "employee_documents",
  "workflows", "workflow_stages", "workflow_tasks", "workflow_signoffs",
  "profiles", "sites", "departments", "site_key_personnel", "site_config",
];

const PAGE_SIZE = 50;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function subjectOf(row: any): string | null {
  const d = row.new_data ?? row.old_data;
  if (!d) return null;
  if (row.table_name === "employees") return [d.employee_id, d.full_name ?? `${d.first_name ?? ""} ${d.surname ?? ""}`.trim()].filter(Boolean).join(" — ") || null;
  if (row.table_name === "profiles") return d.full_name ?? d.email ?? null;
  if (row.table_name === "sites") return d.name ?? null;
  if (row.table_name === "departments") return d.name ?? null;
  if (row.table_name === "workflows") return d.workflow_type ?? null;
  if (row.table_name === "workflow_tasks") return d.task_label ?? null;
  if (row.table_name === "workflow_stages") return d.stage_label ?? null;
  return null;
}

export function useAuditLogs() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ inserts: 0, updates: 0, deletes: 0 });
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<AuditFilters>({ action: "", table: "", userId: "", from: "", to: "" });
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyFilters = useCallback(<T,>(q: T): T => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = q as any;
    if (filters.action) query = query.eq("action", filters.action);
    if (filters.table) query = query.eq("table_name", filters.table);
    if (filters.userId) query = query.eq("performed_by", filters.userId);
    if (filters.from) query = query.gte("created_at", filters.from + "T00:00:00Z");
    if (filters.to) query = query.lte("created_at", filters.to + "T23:59:59Z");
    return query as T;
  }, [filters]);

  const refetch = useCallback(async () => {
    setError(null);
    const base = () => supabase.from("audit_logs");
    const [listRes, countRes, insRes, updRes, delRes, profRes] = await Promise.all([
      applyFilters(base().select("*, sites(name)")).order("created_at", { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1),
      applyFilters(base().select("id", { count: "exact", head: true })),
      applyFilters(base().select("id", { count: "exact", head: true }).eq("action", "INSERT")),
      applyFilters(base().select("id", { count: "exact", head: true }).eq("action", "UPDATE")),
      applyFilters(base().select("id", { count: "exact", head: true }).eq("action", "DELETE")),
      supabase.from("profiles").select("id, full_name"),
    ]);

    if (listRes.error) { setError(listRes.error.message); setLoading(false); return; }

    const nameById: Record<string, string> = {};
    for (const p of profRes.data ?? []) nameById[p.id] = p.full_name;
    setProfiles((profRes.data ?? []).map((p) => ({ id: p.id, name: p.full_name })));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setRows(((listRes.data ?? []) as any[]).map((r): AuditRow => ({
      id: r.id,
      createdAt: r.created_at,
      tableName: r.table_name,
      recordId: r.record_id,
      action: r.action,
      performedBy: r.performed_by,
      performedByName: r.performed_by ? (nameById[r.performed_by] ?? "Unknown user") : "System / Import",
      siteName: r.sites?.name ?? null,
      subject: subjectOf(r),
      oldData: r.old_data,
      newData: r.new_data,
    })));
    setTotal(countRes.count ?? 0);
    setStats({ inserts: insRes.count ?? 0, updates: updRes.count ?? 0, deletes: delRes.count ?? 0 });
    setLoading(false);
  }, [applyFilters, page]);

  useEffect(() => { void refetch(); }, [refetch]);
  useEffect(() => { setPage(0); }, [filters]);

  return { rows, total, stats, page, setPage, pageSize: PAGE_SIZE, filters, setFilters, profiles, loading, error, refetch };
}
