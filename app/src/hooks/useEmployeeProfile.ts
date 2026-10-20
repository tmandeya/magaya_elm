// src/hooks/useEmployeeProfile.ts
// Single-employee profile: every imported field, documents (named types),
// and profile photo (visibility is enforced by the database
// restricts to HR roles via RLS — non-HR users simply receive no row).

import { useState, useEffect, useCallback } from "react";
import { supabase, getEmployeeIdentity } from "@/lib/supabase";

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!employeeId) return;
    setError(null);
    const [empRes, docRes] = await Promise.all([
      supabase.from("employees").select(EMPLOYEE_FULL_SELECT).eq("id", employeeId).maybeSingle(),
      supabase.from("employee_documents").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }),
    ]);

    if (empRes.error) { setError(empRes.error.message); setLoading(false); return; }
    if (!empRes.data) { setNotFound(true); setLoading(false); return; }
    const idn = await getEmployeeIdentity(employeeId);
    setEmployee({ ...empRes.data, national_id: idn?.national_id ?? null, passport_number: idn?.passport_number ?? null,
      home_address: idn?.home_address ?? null, identity_restricted: idn === null });

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

  return { employee, documents, photoUrl, loading, notFound, error, refetch, uploadPhoto, uploadDocument, removeDocument };
}
