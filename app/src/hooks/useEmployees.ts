// src/hooks/useEmployees.ts
// Live employee data from the v2 Supabase schema, mapped to the shapes the
// Employees page renders. RLS on the server decides which rows the signed-in
// user can see (can_see_site) and edit (is_hr_role/is_admin).

import { useState, useEffect, useCallback } from "react";
import { supabase, fetchAllRows } from "@/lib/supabase";
import type { EmployeeStatus } from "@/types";

// ── Shapes the UI consumes ──────────────────────────────────────────────────

export interface LiveEmployee {
  id: string;               // UUID
  code: string;             // employee_id e.g. MAG0001 / TEST0001
  firstName: string;
  lastName: string;
  initials: string;
  email: string;            // work_email
  personalEmail?: string;
  phone: string;
  siteId: string;           // UUID
  siteName: string;
  department: string;       // department display name
  departmentId: string | null;
  jobTitle: string;         // job_titles.title ?? job_title_custom
  position?: string;
  status: EmployeeStatus;   // UI-cased: "Active" | ...
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  nationalId?: string;
  nationality?: string;
  homeAddress?: string;
  photoUrl?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  employeeType?: "Permanent" | "Contract" | "Intern";
  jobGrade?: string;
  contractStart?: string;
  contractEnd?: string | null;
  costCentre?: string;
  yearsOfExperience?: number;
  academicQualifications?: string;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveSite {
  id: string;      // UUID
  name: string;
  fullName: string;
  code: string;
}

export interface EmployeeFormInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  siteId?: string;          // site NAME from the form select; resolved here
  department?: string;      // department name; resolved here
  jobTitle?: string;
  status?: EmployeeStatus;
  gender?: string;
  dateOfBirth?: string;
  nationalId?: string;
  nationality?: string;
  homeAddress?: string;
  photoUrl?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  employeeType?: string;
  jobGrade?: string;
  contractStart?: string;
  contractEnd?: string | null;
  costCentre?: string;
  yearsOfExperience?: number | string;
  academicQualifications?: string;
}

// ── Enum mapping (DB lowercase <-> UI capitalized) ──────────────────────────

const STATUS_DB_TO_UI: Record<string, EmployeeStatus> = {
  active: "Active", onboarding: "Onboarding", transferred: "Transferred",
  offboarding: "Offboarding", terminated: "Terminated", archived: "Archived",
};
const statusToDb = (s?: string) => (s ?? "Active").toLowerCase();

const GENDER_DB_TO_UI: Record<string, "Male" | "Female" | "Other"> = {
  male: "Male", female: "Female", other: "Other", prefer_not_to_say: "Other",
};
const genderToDb = (g?: string) => (g ? g.toLowerCase() : null);

const EMPTYPE_DB_TO_UI: Record<string, "Permanent" | "Contract" | "Intern"> = {
  permanent: "Permanent", contract: "Contract", intern: "Intern",
};
const empTypeToDb = (t?: string) => (t ? t.toLowerCase() : "permanent");

// ── Row mapping ──────────────────────────────────────────────────────────────

const EMPLOYEE_SELECT = `
  id, employee_id, first_name, surname, initials, date_of_birth, gender,
  national_id, nationality, home_address, photo_url,
  emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
  site_id, department_id, job_title_custom, position, employment_type, job_grade,
  contract_start_date, contract_end_date, date_of_engagement, status,
  work_email, personal_email, phone, cost_centre, years_of_experience,
  academic_qualifications, created_at, updated_at,
  sites ( id, name, code ),
  departments ( id, name ),
  job_titles ( id, title )
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): LiveEmployee {
  const first = r.first_name ?? "";
  const last = r.surname ?? "";
  return {
    id: r.id,
    code: r.employee_id ?? "",
    firstName: first,
    lastName: last,
    initials: r.initials || `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase(),
    email: r.work_email ?? "",
    personalEmail: r.personal_email ?? undefined,
    phone: r.phone ?? "",
    siteId: r.site_id ?? "",
    siteName: r.sites?.name ?? "Unknown",
    department: r.departments?.name ?? "—",
    departmentId: r.department_id ?? null,
    jobTitle: r.job_titles?.title ?? r.job_title_custom ?? "",
    position: r.position ?? r.job_titles?.title ?? r.job_title_custom ?? "",
    status: STATUS_DB_TO_UI[r.status] ?? "Active",
    gender: r.gender ? GENDER_DB_TO_UI[r.gender] : undefined,
    dateOfBirth: r.date_of_birth ?? undefined,
    nationalId: r.national_id ?? undefined,
    nationality: r.nationality ?? undefined,
    homeAddress: r.home_address ?? undefined,
    photoUrl: r.photo_url ?? undefined,
    emergencyContactName: r.emergency_contact_name ?? undefined,
    emergencyContactPhone: r.emergency_contact_phone ?? undefined,
    emergencyContactRelationship: r.emergency_contact_relationship ?? undefined,
    employeeType: r.employment_type ? EMPTYPE_DB_TO_UI[r.employment_type] : undefined,
    jobGrade: r.job_grade ?? undefined,
    contractStart: r.contract_start_date ?? undefined,
    contractEnd: r.contract_end_date ?? null,
    costCentre: r.cost_centre ?? undefined,
    yearsOfExperience: r.years_of_experience != null ? Number(r.years_of_experience) : undefined,
    academicQualifications: r.academic_qualifications ?? undefined,
    hireDate: r.date_of_engagement ?? r.contract_start_date ?? r.created_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useEmployees() {
  const [employees, setEmployees] = useState<LiveEmployee[]>([]);
  const [sites, setSites] = useState<LiveSite[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    const [empRes, siteRes, deptRes] = await Promise.all([
      fetchAllRows("employees", EMPLOYEE_SELECT, (q) => q.order("surname", { ascending: true })),
      supabase.from("sites").select("id, name, code").eq("is_active", true).order("name"),
      supabase.from("departments").select("id, name").order("name"),
    ]);
    if (empRes.error) { setError(empRes.error); setLoading(false); return; }
    setEmployees((empRes.data ?? []).map(mapRow));
    if (!siteRes.error) setSites((siteRes.data ?? []).map((s) => ({ id: s.id, name: s.name, fullName: s.name, code: s.code })));
    if (!deptRes.error) setDepartments(deptRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const resolveIds = useCallback((form: EmployeeFormInput) => {
    // Form selects store display names; resolve to UUIDs.
    const site = sites.find((s) => s.name === form.siteId || s.id === form.siteId);
    const dept = departments.find((d) => d.name === form.department || d.id === form.department);
    return { site_id: site?.id ?? null, department_id: dept?.id ?? null };
  }, [sites, departments]);

  const formToDb = useCallback((form: EmployeeFormInput) => {
    const { site_id, department_id } = resolveIds(form);
    return {
      first_name: form.firstName?.trim(),
      surname: form.lastName?.trim(),
      initials: `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase() || null,
      work_email: form.email?.trim() || null,
      personal_email: form.personalEmail?.trim() || null,
      phone: form.phone?.trim() || null,
      site_id,
      department_id,
      job_title_custom: form.jobTitle?.trim() || null,
      position: form.jobTitle?.trim() || null,
      status: statusToDb(form.status),
      gender: genderToDb(form.gender),
      date_of_birth: form.dateOfBirth || null,
      national_id: form.nationalId?.trim() || null,
      nationality: form.nationality || null,
      home_address: form.homeAddress || null,
      photo_url: form.photoUrl || null,
      emergency_contact_name: form.emergencyContactName || null,
      emergency_contact_phone: form.emergencyContactPhone || null,
      emergency_contact_relationship: form.emergencyContactRelationship || null,
      employment_type: empTypeToDb(form.employeeType),
      job_grade: form.jobGrade || null,
      contract_start_date: form.contractStart || null,
      contract_end_date: form.contractEnd || null,
      date_of_engagement: form.contractStart || null,
      cost_centre: form.costCentre || null,
      years_of_experience: form.yearsOfExperience != null && form.yearsOfExperience !== "" ? Number(form.yearsOfExperience) : null,
      academic_qualifications: form.academicQualifications || null,
    };
  }, [resolveIds]);

  const createEmployee = useCallback(async (form: EmployeeFormInput): Promise<string | null> => {
    // employee_id is auto-generated by the DB trigger (fn_auto_employee_id)
    const { error: err } = await supabase.from("employees").insert(formToDb(form));
    if (err) return err.message;
    await refetch();
    return null;
  }, [formToDb, refetch]);

  const updateEmployee = useCallback(async (id: string, form: EmployeeFormInput): Promise<string | null> => {
    const { error: err } = await supabase.from("employees").update(formToDb(form)).eq("id", id);
    if (err) return err.message;
    await refetch();
    return null;
  }, [formToDb, refetch]);

  /** Business rule: employees are never hard-deleted. Archive instead. */
  const archiveEmployee = useCallback(async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from("employees").update({ status: "archived" }).eq("id", id);
    if (err) return err.message;
    await refetch();
    return null;
  }, [refetch]);

  return { employees, sites, departments, loading, error, refetch, createEmployee, updateEmployee, archiveEmployee };
}
