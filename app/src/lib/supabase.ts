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

// ============== EMPLOYEES ==============
export async function getEmployees(filters?: any) {
  let query = supabase.from('employees').select(`*, site:sites(id, name, code), department:departments(id, name, code)`);
  if (filters?.site_id) query = query.eq('site_id', filters.site_id);
  if (filters?.department_id) query = query.eq('department_id', filters.department_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,surname.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`);
  }
  return await query.order('created_at', { ascending: false });
}

export async function getEmployeeById(id: string) {
  return await supabase.from('employees').select(`*, site:sites(id, name, code), department:departments(id, name, code), documents:employee_documents(*)`).eq('id', id).single();
}

export async function createEmployee(employee: any) {
  return await supabase.from('employees').insert(employee).select().single();
}

export async function updateEmployee(id: string, updates: any) {
  return await supabase.from('employees').update(updates).eq('id', id).select().single();
}

// ============== WORKFLOWS ==============
export async function getWorkflows(filters?: any) {
  let query = supabase.from('workflows').select(`*, employee:employees(id, first_name, surname, employee_code), origin_site:sites!workflows_origin_site_id_fkey(id, name), destination_site:sites!workflows_destination_site_id_fkey(id, name)`);
  if (filters?.type) query = query.eq('workflow_type', filters.type);
  if (filters?.status) query = query.eq('status', filters.status);
  return await query.order('initiated_at', { ascending: false });
}

export async function getWorkflowById(id: string) {
  return await supabase.from('workflows').select(`*, employee:employees(id, first_name, surname, employee_code), stages:workflow_stages(*), checklists:workflow_checklists(*)`).eq('id', id).single();
}

// ============== SITES & CONFIG ==============
export async function getSites() {
  return await supabase.from('sites').select('*').eq('status', 'active').order('name');
}

export async function getDepartments() {
  return await supabase.from('departments').select('*').order('name');
}

// ============== FILE UPLOADS ==============
export async function uploadEmployeePhoto(employeeId: string, file: File) {
  const filePath = `${employeeId}/photo_${Date.now()}.${file.name.split('.').pop()}`;
  const { error } = await supabase.storage.from('employee-photos').upload(filePath, file, { upsert: true });
  if (error) return { data: null, error };
  const { data } = supabase.storage.from('employee-photos').getPublicUrl(filePath);
  return { data: data.publicUrl, error: null };
}

// ============== AUTH ==============
export async function signInWithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
