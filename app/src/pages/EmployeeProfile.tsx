// Employee Profile: every field from the master data, arranged for reading.
// Documents with named types, profile photo, payroll/banking restricted to HR.
import { useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Camera, Upload, FileText, Trash2, Lock, Loader2, ExternalLink, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEmployeeProfile, DOCUMENT_TYPES, DOCUMENT_TYPE_LABEL, type ProfileDocument } from "@/hooks/useEmployeeProfile";
import { useAuth } from "@/hooks/useAuth";

// Module-level (never inside the component — preserves input focus)
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9C9C9C]">{label}</div>
      <div className="text-[14px] text-[#1A1A1A] mt-0.5 break-words">{value ?? <span className="text-[#C4C3BF]">—</span>}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6">
      <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">{children}</div>
    </div>
  );
}

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null);
const fmtBytes = (n?: number | null) => (n == null ? "" : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const STATUS_STYLE: Record<string, string> = {
  active: "bg-[#E8F5EC] text-[#1B7A43]", onboarding: "bg-[#FDF3E0] text-[#C27A06]",
  offboarding: "bg-[#FEF2F2] text-[#B91C1C]", transferred: "bg-[#E8F2FA] text-[#1E6BA3]",
  terminated: "bg-[#F5F5F5] text-[#737373]", archived: "bg-[#F5F5F5] text-[#737373]",
};

const TABS = ["Personal", "Employment", "Contact & Emergency", "Qualifications", "Payroll & Banking", "Documents"] as const;

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRole } = useAuth();
  const { employee: e, documents, financials, financialsRestricted, photoUrl, loading, notFound, error, uploadPhoto, uploadDocument, removeDocument } = useEmployeeProfile(id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Personal");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docExpiry, setDocExpiry] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const age = useMemo(() => {
    if (!e?.date_of_birth) return null;
    const dob = new Date(e.date_of_birth);
    return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
  }, [e]);

  const isHr = currentRole === "site_hr" || currentRole === "hq_hr" || currentRole === "hod_hr";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#E5E4E0] border-t-[#D4A017] rounded-full animate-spin" />
        <p className="text-[13px] text-[#9C9C9C]">Loading employee profile...</p>
      </div>
    );
  }
  if (notFound || !e) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <UserIcon className="w-10 h-10 text-[#C4C3BF]" />
        <p className="text-[16px] font-semibold text-[#1A1A1A]">Employee Not Found</p>
        <Button variant="outline" onClick={() => navigate("/employees")}>Back to Employees</Button>
      </div>
    );
  }

  const handleDocUpload = async () => {
    if (!pendingFile || !docType || busy) return;
    setBusy(true);
    setActionError(null);
    const err = await uploadDocument(pendingFile, docType, docDescription, docExpiry || null);
    setBusy(false);
    if (err) { setActionError(err); return; }
    setPendingFile(null); setDocType(""); setDocDescription(""); setDocExpiry("");
  };

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/employees")} className="flex items-center gap-1 text-[13px] text-[#525252] hover:text-[#1A1A1A] transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Employee Master Data
      </button>

      {error && <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{error}</div>}
      {actionError && (
        <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C] flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[12px] font-medium hover:text-[#991B1B]">Dismiss</button>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6 flex items-start gap-6 flex-wrap">
        <div className="relative group">
          {photoUrl ? (
            <img src={photoUrl} alt={e.full_name} className="w-[96px] h-[96px] rounded-full object-cover border-2 border-[#E5E4E0]" />
          ) : (
            <div className="w-[96px] h-[96px] rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[28px] font-semibold">
              {(e.initials || `${e.first_name?.[0] ?? ""}${e.surname?.[0] ?? ""}`).slice(0, 2).toUpperCase()}
            </div>
          )}
          <button onClick={() => photoRef.current?.click()} disabled={busy}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center border-2 border-white hover:bg-[#333] transition-colors" title="Upload photo">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={async (ev) => { const f = ev.target.files?.[0]; ev.target.value = ""; if (!f) return; setBusy(true); const err = await uploadPhoto(f); setBusy(false); if (err) setActionError(err); }} />
        </div>
        <div className="flex-1 min-w-[260px]">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[24px] font-bold text-[#1A1A1A] tracking-[-0.02em]">{e.full_name}</h1>
            <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize", STATUS_STYLE[e.status] ?? "bg-[#F5F5F5] text-[#737373]")}>{e.status}</span>
          </div>
          <p className="text-[14px] text-[#525252] mt-1">
            {e.job_titles?.title ?? e.job_title_custom ?? e.position ?? "—"} · {e.departments?.name ?? "—"} · {e.sites?.name ?? "—"}
          </p>
          <div className="flex items-center gap-4 mt-3 text-[12px] text-[#737373] flex-wrap">
            <span>Employee ID: <strong className="text-[#1A1A1A]">{e.employee_id}</strong></span>
            {e.internal_id && <span>Internal ID: <strong className="text-[#1A1A1A]">{e.internal_id}</strong></span>}
            {e.job_grade && <span>Grade: <strong className="text-[#1A1A1A]">{e.job_grade}</strong></span>}
            {e.nec_grade && <span>NEC: <strong className="text-[#1A1A1A]">{e.nec_grade}</strong></span>}
            <span>Engaged: <strong className="text-[#1A1A1A]">{fmtDate(e.date_of_engagement) ?? "—"}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5E4E0] overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              tab === t ? "border-[#D4A017] text-[#1A1A1A]" : "border-transparent text-[#737373] hover:text-[#1A1A1A]")}>
            {t}{t === "Documents" ? ` (${documents.length})` : ""}{t === "Payroll & Banking" && financialsRestricted ? " 🔒" : ""}
          </button>
        ))}
      </div>

      {tab === "Personal" && (
        <Section title="Personal Information">
          <Field label="First Name" value={e.first_name} />
          <Field label="Surname" value={e.surname} />
          <Field label="Initials" value={e.initials} />
          <Field label="Date of Birth" value={e.date_of_birth ? `${fmtDate(e.date_of_birth)}${age != null ? ` (${age} yrs)` : ""}` : null} />
          <Field label="Gender" value={e.gender ? e.gender.charAt(0).toUpperCase() + e.gender.slice(1) : null} />
          <Field label="National ID" value={e.national_id} />
          <Field label="Nationality" value={e.nationality} />
          <Field label="Passport Number" value={e.passport_number} />
          <Field label="Home Address" value={e.home_address} />
        </Section>
      )}

      {tab === "Employment" && (
        <div className="space-y-5">
          <Section title="Role & Placement">
            <Field label="Occupation" value={e.occupation} />
            <Field label="Position" value={e.position} />
            <Field label="Job Title" value={e.job_titles?.title ?? e.job_title_custom} />
            <Field label="Site" value={e.sites?.name} />
            <Field label="Department" value={e.departments?.name} />
            <Field label="Department Code (legacy)" value={e.department_code} />
            <Field label="Cost Centre" value={e.cost_centre} />
            <Field label="Cost Centre Code" value={e.cost_centre_code} />
            <Field label="Company" value={e.company} />
          </Section>
          <Section title="Contract & Service">
            <Field label="Employment Type" value={e.employment_type ? e.employment_type.charAt(0).toUpperCase() + e.employment_type.slice(1) : null} />
            <Field label="Date of Engagement" value={fmtDate(e.date_of_engagement)} />
            <Field label="Contract Start" value={fmtDate(e.contract_start_date)} />
            <Field label="Contract End" value={fmtDate(e.contract_end_date)} />
            <Field label="Job Grade" value={e.job_grade} />
            <Field label="NEC Grade" value={e.nec_grade} />
            <Field label="Leave Balance (days)" value={e.leave_balance != null ? Number(e.leave_balance).toFixed(2) : null} />
            <Field label="M365 Account" value={e.m365_account_status} />
            <Field label="Status" value={<span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize", STATUS_STYLE[e.status])}>{e.status}</span>} />
          </Section>
        </div>
      )}

      {tab === "Contact & Emergency" && (
        <div className="space-y-5">
          <Section title="Contact">
            <Field label="Phone" value={e.phone} />
            <Field label="Work Email" value={e.work_email} />
            <Field label="Personal Email" value={e.personal_email} />
          </Section>
          <Section title="Emergency Contact">
            <Field label="Name" value={e.emergency_contact_name} />
            <Field label="Phone" value={e.emergency_contact_phone} />
            <Field label="Relationship" value={e.emergency_contact_relationship} />
          </Section>
        </div>
      )}

      {tab === "Qualifications" && (
        <Section title="Qualifications & Experience">
          <Field label="Academic Qualifications" value={e.academic_qualifications} />
          <Field label="Years of Experience" value={e.years_of_experience != null ? Number(e.years_of_experience).toString() : null} />
          <Field label="Experience Detail" value={e.experience_detail} />
          <Field label="Comments" value={e.comments} />
        </Section>
      )}

      {tab === "Payroll & Banking" && (
        financialsRestricted || (!financials && !isHr) ? (
          <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FAFAF8] border border-[#E5E4E0] flex items-center justify-center"><Lock className="w-5 h-5 text-[#9C9C9C]" /></div>
            <p className="text-[15px] font-semibold text-[#1A1A1A]">Restricted to Human Resources</p>
            <p className="text-[13px] text-[#737373] max-w-[420px]">Payroll and banking details are visible to HR roles only. This restriction is enforced by the database, not just hidden in the interface.</p>
          </div>
        ) : financials ? (
          <div className="space-y-5">
            <Section title="Payroll">
              <Field label="Payment Basis" value={financials.payment_basis} />
              <Field label="Payment Method" value={financials.payment_method} />
              <Field label="Payment Point" value={financials.payment_point} />
              <Field label="Payroll" value={financials.payroll_name} />
              <Field label="Payroll 2" value={financials.payroll_name_2} />
              <Field label="Payroll Period" value={fmtDate(financials.payroll_period)} />
              <Field label="Annual Basic Salary" value={financials.annual_basic_salary != null ? `USD ${Number(financials.annual_basic_salary).toLocaleString()}` : null} />
              <Field label="Tax Summary No" value={financials.tax_summary_no} />
              <Field label="Tax Table" value={financials.tax_table_type} />
              <Field label="Taxation Method" value={financials.taxation_method} />
            </Section>
            <Section title="Banking">
              <Field label="Bank" value={financials.bank_name} />
              <Field label="Account Number" value={financials.bank_account} />
              <Field label="Branch" value={financials.bank_branch_name} />
              <Field label="Branch Code" value={financials.bank_branch_code} />
              <Field label="InnBucks Account" value={financials.innbucks_account} />
              <Field label="ZiG Account" value={financials.zig_account} />
            </Section>
          </div>
        ) : (
          <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-10 text-center text-[13px] text-[#737373]">No payroll record for this employee yet.</div>
        )
      )}

      {tab === "Documents" && (
        <div className="space-y-5">
          <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6">
            <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-4">Attach a Document</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1.5">Document Type *</label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="h-[40px] text-[13px]"><SelectValue placeholder="Name what this is..." /></SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((d) => <SelectItem key={d.value} value={d.value} className="text-[13px]">{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1.5">Description</label>
                <Input value={docDescription} onChange={(ev) => setDocDescription(ev.target.value)} placeholder="Optional note" className="h-[40px] text-[13px]" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1.5">Expiry Date</label>
                <Input type="date" value={docExpiry} onChange={(ev) => setDocExpiry(ev.target.value)} className="h-[40px] text-[13px]" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => docRef.current?.click()} className="h-[40px] flex-1 text-[13px]">
                  <Upload className="w-4 h-4 mr-1.5" /> {pendingFile ? pendingFile.name.slice(0, 18) + (pendingFile.name.length > 18 ? "…" : "") : "Choose file"}
                </Button>
                <Button onClick={() => void handleDocUpload()} disabled={!pendingFile || !docType || busy} className="h-[40px] bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Attach"}
                </Button>
              </div>
            </div>
            <input ref={docRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden"
              onChange={(ev) => { const f = ev.target.files?.[0]; ev.target.value = ""; if (f) setPendingFile(f); }} />
            <p className="text-[11px] text-[#9C9C9C] mt-3">PDF, images, or Word documents up to 10 MB. Every upload must be named with a document type.</p>
          </div>

          <div className="bg-white rounded-[10px] border border-[#E5E4E0] overflow-hidden">
            {documents.length === 0 ? (
              <div className="py-14 text-center">
                <FileText className="w-8 h-8 text-[#C4C3BF] mx-auto mb-2" />
                <p className="text-[13px] text-[#9C9C9C]">No documents attached yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E4E0]">
                {documents.map((d: ProfileDocument) => (
                  <div key={d.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#FAFAF8] border border-[#E5E4E0] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#D4A017]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-[#1A1A1A]">{DOCUMENT_TYPE_LABEL[d.category] ?? d.category}</span>
                        {d.expiryDate && new Date(d.expiryDate) < new Date() && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FEF2F2] text-[#B91C1C]">EXPIRED</span>}
                      </div>
                      <div className="text-[12px] text-[#9C9C9C] truncate">{d.fileName} · {fmtBytes(d.fileSize)}{d.description ? ` · ${d.description}` : ""}{d.expiryDate ? ` · expires ${fmtDate(d.expiryDate)}` : ""}</div>
                    </div>
                    {d.signedUrl && (
                      <a href={d.signedUrl} target="_blank" rel="noreferrer" className="text-[#1E6BA3] hover:text-[#164e78]" title="View"><ExternalLink className="w-4 h-4" /></a>
                    )}
                    <button disabled={busy} onClick={async () => { setBusy(true); const err = await removeDocument(d); setBusy(false); if (err) setActionError(err); }}
                      className="text-[#9C9C9C] hover:text-[#B91C1C] transition-colors" title="Remove"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
