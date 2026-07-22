// src/hooks/useEmployeeProfile.ts
// Single-employee profile: every imported field, documents (named types),
// profile photo, and payroll/banking (whose visibility the database
// restricts to HR roles via RLS — non-HR users simply receive no row).

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface ProfileDocument {
  id: string;
  category: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  expiryDate: string | null;
  uploadedAt: string;
  signedUrl?: string;
}

export interface EmployeeFinancials {
  payment_basis: string | null;
  payment_method: string | null;
  payment_point: string | null;
  payroll_name: string | null;
  payroll_name_2: string | null;
  payroll_period: string | null;
  tax_summary_no: string | null;
  tax_table_type: string | null;
  taxation_method: string | null;
  annual_basic_salary: number | null;
  innbucks_account: string | null;
  zig_account: string | null;
  bank_account: string | null;
  bank_name: string | null;
  bank_branch_name: string | null;
  bank_branch_code: string | null;
}

// Named document types per the platform requirements
export const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: "identity", label: "ID Document" },
  { value: "drivers_license", label: "Driver's Licence" },
  { value: "medical_aid", label: "Medical Aid" },
  { value: "insurance", label: "Insurance" },
  { value: "education", label: "Education Certificate" },
  { value: "contract", label: "Employment Contract" },
  { value: "work_authorization", label: "Work Authorization" },
  { value: "other", label: "Other" },
];

export const DOCUMENT_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((d) => [d.value, d.label])
);

const EMPLOYEE_FULL_SELECT = `
  *,
  sites ( id, name, code ),
  departments ( id, name ),
  job_titles ( id, title )
`;

export function useEmployeeProfile(employeeId: string | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employee, setEmployee] = useState<any | null>(null);
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [financials, setFinancials] = useState<EmployeeFinancials | null>(null);
  const [financialsRestricted, setFinancialsRestricted] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!employeeId) return;
    setError(null);
    const [empRes, docRes, finRes] = await Promise.all([
      supabase.from("employees").select(EMPLOYEE_FULL_SELECT).eq("id", employeeId).maybeSingle(),
      supabase.from("employee_documents").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }),
      supabase.from("employee_financials").select("*").eq("employee_id", employeeId).maybeSingle(),
    ]);

    if (empRes.error) { setError(empRes.error.message); setLoading(false); return; }
    if (!empRes.data) { setNotFound(true); setLoading(false); return; }
    setEmployee(empRes.data);

    // Photo: stored as a storage path -> signed URL (bucket is private)
    if (empRes.data.photo_url) {
      const { data: signed } = await supabase.storage.from("employee-files").createSignedUrl(empRes.data.photo_url, 3600);
      setPhotoUrl(signed?.signedUrl ?? null);
    } else {
      setPhotoUrl(null);
    }

    const docs: ProfileDocument[] = (docRes.data ?? []).map((d) => ({
      id: d.id,
      category: d.category,
      fileName: d.file_name,
      filePath: d.file_path,
      fileSize: d.file_size_bytes,
      mimeType: d.mime_type,
      description: d.description,
      expiryDate: d.expiry_date,
      uploadedAt: d.created_at,
    }));
    // Signed URLs for viewing
    if (docs.length > 0) {
      const { data: signed } = await supabase.storage.from("employee-files").createSignedUrls(docs.map((d) => d.filePath), 3600);
      signed?.forEach((s, i) => { if (s.signedUrl) docs[i].signedUrl = s.signedUrl; });
    }
    setDocuments(docs);

    // Financials: RLS returns no row for non-HR users
    if (finRes.error) {
      setFinancialsRestricted(true);
    } else if (finRes.data) {
      setFinancials(finRes.data as EmployeeFinancials);
      setFinancialsRestricted(false);
    } else {
      // No row could mean: none exists, or RLS filtered it. Distinguish by
      // asking for a bare count with the caller's rights on ANY row.
      setFinancials(null);
      const { count } = await supabase.from("employee_financials").select("id", { count: "exact", head: true });
      setFinancialsRestricted((count ?? 0) === 0);
    }

    setLoading(false);
  }, [employeeId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    if (!employeeId) return "No employee";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `photos/${employeeId}/profile.${ext}`;
    const { error: upErr } = await supabase.storage.from("employee-files").upload(path, file, { upsert: true });
    if (upErr) return upErr.message;
    const { error: dbErr } = await supabase.from("employees").update({ photo_url: path }).eq("id", employeeId);
    if (dbErr) return dbErr.message;
    await refetch();
    return null;
  }, [employeeId, refetch]);

  const uploadDocument = useCallback(async (file: File, category: string, description: string, expiryDate: string | null): Promise<string | null> => {
    if (!employeeId) return "No employee";
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
    const path = `documents/${employeeId}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage.from("employee-files").upload(path, file);
    if (upErr) return upErr.message;
    const { error: dbErr } = await supabase.from("employee_documents").insert({
      employee_id: employeeId,
      category,
      file_name: file.name,
      file_path: path,
      file_size_bytes: file.size,
      mime_type: file.type || null,
      description: description || null,
      expiry_date: expiryDate,
    });
    if (dbErr) return dbErr.message;
    await refetch();
    return null;
  }, [employeeId, refetch]);

  const removeDocument = useCallback(async (doc: ProfileDocument): Promise<string | null> => {
    const { error: dbErr } = await supabase.from("employee_documents").delete().eq("id", doc.id);
    if (dbErr) return dbErr.message;
    await supabase.storage.from("employee-files").remove([doc.filePath]);
    await refetch();
    return null;
  }, [refetch]);

  return { employee, documents, financials, financialsRestricted, photoUrl, loading, notFound, error, refetch, uploadPhoto, uploadDocument, removeDocument };
}
