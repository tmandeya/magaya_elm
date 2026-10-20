// src/lib/supabase.ts
// Install: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Capture an OAuth error returned by Microsoft/Supabase BEFORE the client and the
// hash router consume the URL, so the login page can show the real reason.
export const OAUTH_ERROR_KEY = 'elms_oauth_error';
(() => {
  try {
    const raw = `${window.location.search.slice(1)}&${window.location.hash.replace(/^#\/?/, '').replace(/^[^?]*\?/, '')}`;
    const p = new URLSearchParams(raw);
    const desc = p.get('error_description') || p.get('error');
    if (desc) {
      sessionStorage.setItem(OAUTH_ERROR_KEY, `${desc.replace(/\+/g, ' ')}${p.get('error_code') ? ` (${p.get('error_code')})` : ''}`);
      window.history.replaceState(null, '', `${window.location.pathname}#/login`);
    }
  } catch { /* never block app start */ }
})();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ============================
// AUTH FUNCTIONS
// ============================

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ============================
// FETCH ALL ROWS (beyond the 1,000-row PostgREST cap)
// ============================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAllRows<T = any>(
  table: string,
  select: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modify?: (q: any) => any
): Promise<{ data: T[]; error: string | null }> {
  const PAGE = 1000;
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select(select).range(from, from + PAGE - 1);
    if (modify) q = modify(q);
    const { data, error } = await q;
    if (error) return { data: all, error: error.message };
    all.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return { data: all, error: null };
}

// ============================
// PROFILES (v2 schema — auth-linked users)
// ============================

export async function fetchMyProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, sites(id, name, code)')
    .eq('id', userId)
    .single();
  return { data, error };
}

/** Fire-and-forget: stamp last login on own profile (RLS: profiles_update_own). */
export function touchLastLogin(userId: string) {
  void supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.warn('last_login_at update failed:', error.message);
    });
}

// ============================
// EMPLOYEE CRUD
// ⚠️ LEGACY: the functions below target the OLD v1 schema
// (employee_code, phone_number, config_* tables). They compile but will
// fail at runtime against the live v2 database. Each will be rewritten
// as its page is wired. Do not call from new code.
// ============================

export async function getEmployeeById(id: string) {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      site:sites(id, name, code),
      department:departments(id, name, code),
      documents:employee_documents(*)
    `)
    .eq('id', id)
    .single();
  return { data, error };
}

export async function createEmployee(employee: any) {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();
  return { data, error };
}

export async function updateEmployee(id: string, updates: any) {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

// ============================
// WORKFLOW CRUD
// ============================

export async function getWorkflows(filters?: {
  type?: string;
  status?: string;
  site_id?: string;
}) {
  let query = supabase
    .from('workflows')
    .select(`
      *,
      employee:employees(id, first_name, surname, employee_code, site_id, department_id),
      origin_site:sites!workflows_origin_site_id_fkey(id, name),
      destination_site:sites!workflows_destination_site_id_fkey(id, name)
    `);

  if (filters?.type) query = query.eq('workflow_type', filters.type);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query.order('initiated_at', { ascending: false });
  return { data, error };
}

export async function getWorkflowById(id: string) {
  const { data, error } = await supabase
    .from('workflows')
    .select(`
      *,
      employee:employees(id, first_name, surname, employee_code),
      stages:workflow_stages(*),
      checklists:workflow_checklists(*)
    `)
    .eq('id', id)
    .single();
  return { data, error };
}

// ============================
// FILE STORAGE
// ============================

// ============================
// SITES & CONFIG
// ============================

// ============================
// AUDIT LOGS
// ============================

// ============================
// REALTIME SUBSCRIPTIONS
// ============================


// Identity fields (national ID, passport, home address) are encrypted at rest.
// They can only be read through this guarded, logged server function, which
// allows HR and administrators for their own sites. Returns null if not allowed.
export interface EmployeeIdentity { national_id: string | null; passport_number: string | null; home_address: string | null; }
export async function getEmployeeIdentity(employeeId: string): Promise<EmployeeIdentity | null> {
  const { data, error } = await supabase.rpc("fn_get_employee_identity", { p_employee_id: employeeId });
  return error ? null : (data as EmployeeIdentity | null);
}
