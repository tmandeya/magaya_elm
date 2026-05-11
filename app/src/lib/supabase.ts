// src/lib/supabase.ts
// Install: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ============================
// EMPLOYEE CRUD
// ============================

export async function getEmployees(filters?: {
  site_id?: string;
  department_id?: string;
  status?: string;
  search?: string;
}) {
  let query = supabase
    .from('employees')
    .select(`
      *,
      site:sites(id, name, code),
      department:departments(id, name, code)
    `);

  if (filters?.site_id) query = query.eq('site_id', filters.site_id);
  if (filters?.department_id) query = query.eq('department_id', filters.department_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,surname.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%,work_email.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
}

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

export async function createWorkflow(workflow: any) {
  const { data, error } = await supabase
    .from('workflows')
    .insert(workflow)
    .select()
    .single();
  return { data, error };
}

export async function updateStage(stageId: string, updates: any) {
  const { data, error } = await supabase
    .from('workflow_stages')
    .update(updates)
    .eq('id', stageId)
    .select()
    .single();
  return { data, error };
}

// ============================
// FILE STORAGE
// ============================

export async function uploadEmployeePhoto(employeeId: string, file: File) {
  const filePath = `${employeeId}/photo_${Date.now()}.${file.name.split('.').pop()}`;
  const { data, error } = await supabase.storage
    .from('employee-photos')
    .upload(filePath, file, { upsert: true });
  
  if (error) return { data: null, error };
  
  const { data: urlData } = supabase.storage
    .from('employee-photos')
    .getPublicUrl(filePath);
    
  return { data: urlData.publicUrl, error: null };
}

export async function uploadEmployeeDocument(employeeId: string, file: File, documentType: string) {
  const filePath = `${employeeId}/${documentType}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('employee-documents')
    .upload(filePath, file);
  
  if (error) return { data: null, error };
  
  const { data: urlData } = supabase.storage
    .from('employee-documents')
    .getPublicUrl(filePath);
    
  return { data: urlData.publicUrl, error: null };
}

// ============================
// SITES & CONFIG
// ============================

export async function getSites() {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('status', 'active')
    .order('name');
  return { data, error };
}

export async function getDepartments() {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  return { data, error };
}

// ============================
// AUDIT LOGS
// ============================

export async function getAuditLogs(filters?: {
  action?: string;
  user_id?: string;
  module?: string;
  limit?: number;
}) {
  let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
  
  if (filters?.action) query = query.eq('action', filters.action);
  if (filters?.user_id) query = query.eq('user_id', filters.user_id);
  if (filters?.module) query = query.eq('module', filters.module);
  if (filters?.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  return { data, error };
}

export async function logAudit(auditEntry: any) {
  const { data, error } = await supabase.from('audit_logs').insert(auditEntry);
  return { data, error };
}

// ============================
// REALTIME SUBSCRIPTIONS
// ============================

export function subscribeToWorkflowUpdates(callback: (payload: any) => void) {
  return supabase
    .channel('workflow_updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workflows' }, callback)
    .subscribe();
}

export function subscribeToNotifications(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` }, callback)
    .subscribe();
}
