import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Pencil, User, Briefcase, Monitor, Shield,
  Building2, FileText, MessageSquare, Check, CheckSquare, Clock,
  Copy, Upload, Download, Eye, Trash2, Send
} from "lucide-react";
import { employees as baseEmployees, sites, onboardingWorkflows, offboardingWorkflows, transferWorkflows } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import type { Employee, EmployeeStatus, Department } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ── Extended type ──────────────────────────────────────────────────────────
interface ExtendedEmployee extends Employee {
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  nationalId?: string;
  nationality?: string;
  code?: string;
  position?: string;
  homeAddress?: string;
  maritalStatus?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  personalEmail?: string;
  employeeType?: "Permanent" | "Contract" | "Casual" | "Intern";
  jobGrade?: string;
  contractStart?: string;
  contractEnd?: string | null;
  costCentre?: string;
  yearsOfExperience?: number;
  academicQualifications?: string;
  reportingLineName?: string;
  // IT
  m365Status?: string;
  mobileWiFi?: string;
  hardware?: { item: string; location: string; purpose: string; specialSoftware: string[]; status: string }[];
  softwareTraining?: string;
  softwareInstalled?: string[];
  // Security
  clearanceLevel?: string;
  clearanceStatus?: string;
  idCardNumber?: string;
  vehicleCardNumber?: string;
  clearanceExpiry?: string;
  accessZones?: { zone: string; accessLevel: string; status: string }[];
  vehicleAccess?: { registration: string; type: string; parkingZone: string; cardStatus: string };
  // Admin
  parkingBay?: string;
  lockerNumber?: string;
  inductionStatus?: string;
  inductionDate?: string;
  ppeIssued?: string[];
  officeLocation?: string;
  deskPhone?: string;
  mealCard?: string;
  uniformSize?: string;
  medicalClearance?: string;
  inductionChecklist?: { item: string; completed: boolean; date: string }[];
  // Documents
  documents?: Record<string, { name: string; type: string; size: string; uploaded: string }[]>;
  // Comments
  comments?: { id: number; author: string; role: string; text: string; timestamp: string }[];
}

const STATUS_COLORS: Record<EmployeeStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-[#E8F5EC]", text: "text-[#1B7A43]", dot: "bg-[#1B7A43]" },
  Onboarding: { bg: "bg-[#FDF3E0]", text: "text-[#C27A06]", dot: "bg-[#C27A06]" },
  Transferred: { bg: "bg-[#E8F2FA]", text: "text-[#1E6BA3]", dot: "bg-[#1E6BA3]" },
  Offboarding: { bg: "bg-[#FFF1F0]", text: "text-[#B91C1C]", dot: "bg-[#B91C1C]" },
  Terminated: { bg: "bg-[#F5F5F5]", text: "text-[#737373]", dot: "bg-[#737373]" },
  Archived: { bg: "bg-[#FAFAFA]", text: "text-[#9C9C9C]", dot: "bg-[#9C9C9C]" },
};

// ── Extended mock data for profiles ────────────────────────────────────────
const PROFILE_DATA: Record<string, Partial<ExtendedEmployee>> = {
  "EMP-2024-001": {
    gender: "Male", dateOfBirth: "1985-03-15", nationalId: "88-1234567A88", nationality: "Zimbabwean",
    code: "MM-2024-0042", position: "Senior Mechanical Engineer", homeAddress: "45 Harare Drive, Harare, Zimbabwe",
    maritalStatus: "Married", emergencyContactName: "Sarah Mutasa", emergencyContactPhone: "+263 772 999 888",
    emergencyContactRelationship: "Spouse", personalEmail: "tendai.mutasa@gmail.com",
    employeeType: "Permanent", jobGrade: "Grade 7", contractStart: "2024-01-10", contractEnd: null,
    costCentre: "CC-001", yearsOfExperience: 12,
    academicQualifications: "BSc Mechanical Engineering (UZ), MSc (Wits)", reportingLineName: "Kudakwashe Mupini",
    m365Status: "Active", mobileWiFi: "Enabled",
    hardware: [
      { item: "Dell Latitude 5520", location: "Pickstone — Workshop", purpose: "Design & Engineering", specialSoftware: ["AutoCAD 2024", "SolidWorks 2023"], status: "Assigned" },
      { item: "HP LaserJet Printer", location: "Pickstone — Office", purpose: "Document printing", specialSoftware: [], status: "Assigned" },
      { item: "Motorola Radio", location: "Pickstone — Mine Floor", purpose: "Communication", specialSoftware: [], status: "Assigned" },
    ],
    softwareTraining: "Completed", softwareInstalled: ["AutoCAD 2024", "SolidWorks 2023", "Microsoft Office 365", "SAP ERP"],
    clearanceLevel: "Level 3 — Mine Floor Access", clearanceStatus: "Approved",
    idCardNumber: "MAG-2024-0042", vehicleCardNumber: "VMAG-2024-0187", clearanceExpiry: "2025-01-10",
    accessZones: [
      { zone: "Head Office — Main Gate", accessLevel: "24/7", status: "Active" },
      { zone: "Head Office — Office Block", accessLevel: "Business Hours", status: "Active" },
      { zone: "Pickstone — Main Gate", accessLevel: "24/7", status: "Active" },
      { zone: "Pickstone — Mine Floor", accessLevel: "Shift Hours", status: "Active" },
      { zone: "Pickstone — Workshop", accessLevel: "Business Hours", status: "Active" },
      { zone: "Pickstone — Stores", accessLevel: "Business Hours", status: "Active" },
    ],
    vehicleAccess: { registration: "ABC-1234", type: "Company Truck", parkingZone: "Pickstone — Zone B", cardStatus: "Active" },
    parkingBay: "B-042", lockerNumber: "LK-156", inductionStatus: "Completed", inductionDate: "2024-01-15",
    ppeIssued: ["Hard hat", "Safety boots", "Gloves", "Reflective vest"],
    officeLocation: "Pickstone — Admin Block, Office 12", deskPhone: "+263 772 999 042",
    mealCard: "Assigned — Card #042", uniformSize: "L", medicalClearance: "Passed — 12 Jan 2024",
    inductionChecklist: [
      { item: "Company Orientation", completed: true, date: "2024-01-10" },
      { item: "Safety Briefing", completed: true, date: "2024-01-11" },
      { item: "Mine Site Induction", completed: true, date: "2024-01-12" },
      { item: "Emergency Procedures", completed: true, date: "2024-01-13" },
      { item: "IT Security Training", completed: true, date: "2024-01-14" },
      { item: "Department Introduction", completed: true, date: "2024-01-15" },
    ],
    documents: {
      personal: [
        { name: "National ID Scan", type: "PDF", size: "1.2MB", uploaded: "2024-01-10" },
        { name: "Passport Scan", type: "PDF", size: "2.1MB", uploaded: "2024-01-10" },
        { name: "Marriage Certificate", type: "PDF", size: "0.8MB", uploaded: "2024-01-12" },
      ],
      employment: [
        { name: "Employment Contract", type: "PDF", size: "0.5MB", uploaded: "2024-01-10" },
        { name: "Job Description", type: "PDF", size: "0.3MB", uploaded: "2024-01-10" },
        { name: "Grade Approval", type: "PDF", size: "0.2MB", uploaded: "2024-01-10" },
        { name: "Probation Review", type: "PDF", size: "0.4MB", uploaded: "2024-07-10" },
      ],
      academic: [
        { name: "BSc Certificate", type: "PDF", size: "1.5MB", uploaded: "2024-01-10" },
        { name: "MSc Certificate", type: "PDF", size: "1.8MB", uploaded: "2024-01-10" },
      ],
      medical: [
        { name: "Medical Report", type: "PDF", size: "0.6MB", uploaded: "2024-01-12" },
        { name: "Police Clearance", type: "PDF", size: "0.4MB", uploaded: "2024-01-11" },
      ],
    },
    comments: [
      { id: 1, author: "Rudo Mupfumi", role: "Site HR", text: "Completed all onboarding steps successfully. Employee is fully integrated into the Engineering team. Performance review due in 6 months.", timestamp: "2024-07-15T10:30:00" },
      { id: 2, author: "Blessing Mhlanga", role: "Site IT", text: "All hardware provisioned. M365 account activated. Software training completed on 14 Jan 2024. All systems operational.", timestamp: "2024-01-14T16:00:00" },
      { id: 3, author: "Nyasha Gomo", role: "Site Security", text: "Security clearance approved at Level 3. ID card and vehicle card issued on 11 Jan 2024. All access zones configured for Pickstone and Head Office.", timestamp: "2024-01-11T14:30:00" },
    ],
  },
};

// Generate profile data for all employees from base data
function buildExtendedEmployee(base: Employee): ExtendedEmployee {
  const profile = PROFILE_DATA[base.id];
  const gender: "Male" | "Female" | "Other" = profile?.gender || (base.id.charCodeAt(base.id.length - 1) % 2 === 0 ? "Female" : "Male");
  const site = sites.find((s) => s.id === base.siteId);
  return {
    ...base,
    gender,
    dateOfBirth: profile?.dateOfBirth || "1990-01-01",
    nationalId: profile?.nationalId || "00-0000000X00",
    nationality: profile?.nationality || "Zimbabwean",
    code: profile?.code || base.employeeNumber,
    position: profile?.position || base.jobTitle,
    homeAddress: profile?.homeAddress || "Harare, Zimbabwe",
    maritalStatus: profile?.maritalStatus || "Single",
    emergencyContactName: profile?.emergencyContactName || "—",
    emergencyContactPhone: profile?.emergencyContactPhone || "—",
    emergencyContactRelationship: profile?.emergencyContactRelationship || "—",
    personalEmail: profile?.personalEmail || "",
    employeeType: profile?.employeeType || "Permanent",
    jobGrade: profile?.jobGrade || "Grade 5",
    contractStart: profile?.contractStart || base.hireDate,
    contractEnd: profile?.contractEnd ?? null,
    costCentre: profile?.costCentre || "CC-001",
    yearsOfExperience: profile?.yearsOfExperience || 5,
    academicQualifications: profile?.academicQualifications || "—",
    reportingLineName: profile?.reportingLineName || "—",
    m365Status: profile?.m365Status || "Active",
    mobileWiFi: profile?.mobileWiFi || "Enabled",
    hardware: profile?.hardware || [],
    softwareTraining: profile?.softwareTraining || "Not Started",
    softwareInstalled: profile?.softwareInstalled || [],
    clearanceLevel: profile?.clearanceLevel || "Level 1 — General Access",
    clearanceStatus: profile?.clearanceStatus || "Approved",
    idCardNumber: profile?.idCardNumber || `MAG-${base.employeeNumber}`,
    vehicleCardNumber: profile?.vehicleCardNumber || "",
    clearanceExpiry: profile?.clearanceExpiry || "2025-12-31",
    accessZones: profile?.accessZones || [{ zone: `${site?.fullName || "Site"} — Main Gate`, accessLevel: "Business Hours", status: "Active" }],
    vehicleAccess: profile?.vehicleAccess,
    parkingBay: profile?.parkingBay || "—",
    lockerNumber: profile?.lockerNumber || "—",
    inductionStatus: profile?.inductionStatus || "Not Started",
    inductionDate: profile?.inductionDate,
    ppeIssued: profile?.ppeIssued || [],
    officeLocation: profile?.officeLocation || `${site?.fullName || "Site"} — Main Office`,
    deskPhone: profile?.deskPhone || "—",
    mealCard: profile?.mealCard || "Not Assigned",
    uniformSize: profile?.uniformSize || "M",
    medicalClearance: profile?.medicalClearance || "Pending",
    inductionChecklist: profile?.inductionChecklist || [
      { item: "Company Orientation", completed: false, date: "" },
      { item: "Safety Briefing", completed: false, date: "" },
      { item: "Mine Site Induction", completed: false, date: "" },
      { item: "Emergency Procedures", completed: false, date: "" },
      { item: "IT Security Training", completed: false, date: "" },
      { item: "Department Introduction", completed: false, date: "" },
    ],
    documents: profile?.documents || {},
    comments: profile?.comments || [],
  };
}

const DEPARTMENTS: Department[] = [
  "Human Resources", "Security", "Information Technology", "Operations",
  "Finance", "Engineering", "Administration", "Health & Safety",
  "Mining", "Geology", "Processing", "Maintenance"
];

const STATUSES: EmployeeStatus[] = ["Active", "Onboarding", "Transferred", "Offboarding", "Terminated", "Archived"];

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: EmployeeStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold", c.bg, c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {status}
    </span>
  );
}

// ── Inline Field ───────────────────────────────────────────────────────────
function InlineField({ label, value, editable = true, onChange, type = "text", options }: {
  label: string; value: string; editable?: boolean; onChange?: (v: string) => void; type?: string; options?: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  if (isEditing && editable) {
    return (
      <div className="mb-3 bg-[#FAFAF8] p-3 rounded-lg">
        <Label className="text-[12px] text-[#525252] mb-1 block">{label}</Label>
        {type === "select" && options ? (
          <Select value={value} onValueChange={(v) => { onChange?.(v); setIsEditing(false); }}>
            <SelectTrigger className="h-[36px] text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        ) : type === "textarea" ? (
          <Textarea value={value} onChange={(e) => onChange?.(e.target.value)} onBlur={() => setIsEditing(false)} autoFocus className="text-[13px] min-h-[60px]" />
        ) : (
          <Input value={value} onChange={(e) => onChange?.(e.target.value)} onBlur={() => setIsEditing(false)} autoFocus className="h-[36px] text-[13px]" />
        )}
      </div>
    );
  }
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[#F0EFEA] group hover:bg-[#FAFAF8] px-2 -mx-2 rounded transition-colors cursor-pointer" onClick={() => editable && setIsEditing(true)}>
      <div className="flex-1">
        <p className="text-[12px] text-[#525252] font-medium">{label}</p>
        <p className="text-[13px] text-[#1A1A1A] mt-0.5">{value || "—"}</p>
      </div>
      {editable && <Pencil className="w-3.5 h-3.5 text-[#9C9C9C] opacity-0 group-hover:opacity-100 transition-opacity mt-1" />}
    </div>
  );
}

// ── Tab config ─────────────────────────────────────────────────────────────
const TAB_CONFIG = [
  { id: "personal", label: "Personal", icon: User },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "it", label: "IT", icon: Monitor },
  { id: "security", label: "Security", icon: Shield },
  { id: "admin", label: "Admin", icon: Building2 },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "comments", label: "Comments", icon: MessageSquare },
];

// ── Main Component ─────────────────────────────────────────────────────────
export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [editMode, setEditMode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Build extended employee
  const baseEmployee = useMemo(() => baseEmployees.find((e) => e.id === id), [id]);
  const employee = useMemo(() => baseEmployee ? buildExtendedEmployee(baseEmployee) : null, [baseEmployee]);

  // Find related workflows
  const empWorkflows = useMemo(() => {
    if (!employee) return [];
    return [
      ...onboardingWorkflows.filter((w) => w.employeeId === employee.id),
      ...offboardingWorkflows.filter((w) => w.employeeId === employee.id),
      ...transferWorkflows.filter((w) => w.employeeId === employee.id),
    ];
  }, [employee]);

  // Role-based tab visibility
  const visibleTabs = useMemo(() => {
    if (!currentRole) return TAB_CONFIG.filter((t) => t.id === "personal");
    if (currentRole === "hq_hr") return TAB_CONFIG;
    if (currentRole === "site_it" || currentRole === "hq_it" || currentRole === "hod_it") return TAB_CONFIG.filter((t) => t.id === "it");
    if (currentRole === "site_security" || currentRole === "hod_security") return TAB_CONFIG.filter((t) => t.id === "security");
    if (currentRole === "site_admin" || currentRole === "hq_admin") return TAB_CONFIG.filter((t) => t.id === "admin");
    if (currentRole.startsWith("hod_")) return TAB_CONFIG.filter((t) => t.id === "employment" || t.id === "comments");
    return TAB_CONFIG;
  }, [currentRole]);

  // Local state for editable fields
  const [localData, setLocalData] = useState<Partial<ExtendedEmployee>>({});

  const updateField = useCallback((_field: string, _value: string) => {
    setLocalData((p) => ({ ...p, [_field]: _value }));
  }, []);

  const handleAddComment = () => {
    if (!newComment.trim() || !employee) return;
    const comment = {
      id: (employee.comments?.length || 0) + 1,
      author: user?.name || "Current User",
      role: user?.roleLabel || "User",
      text: newComment,
      timestamp: new Date().toISOString(),
    };
    employee.comments = [...(employee.comments || []), comment];
    setNewComment("");
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 rounded-full bg-[#F4F3EF] flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-[#9C9C9C] opacity-40" />
        </div>
        <h2 className="text-[16px] font-semibold text-[#1A1A1A] mb-1">Employee Not Found</h2>
        <p className="text-[13px] text-[#525252] mb-4">The employee you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/employees")} className="h-[36px]">Back to Employees</Button>
      </div>
    );
  }

  const mergedData: ExtendedEmployee = { ...employee, ...localData };
  const siteName = sites.find((s) => s.id === mergedData.siteId)?.fullName || "Unknown";

  return (
    <div className="flex flex-col gap-5">
      {/* ── Profile Header ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6 flex items-center gap-5">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-[96px] h-[96px] rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[28px] font-bold border-[3px] border-[#D4A017] shadow-[0_4px_16px_rgba(212,160,23,0.15)] overflow-hidden">
            {mergedData.photoUrl ? <img src={mergedData.photoUrl} alt="" className="w-full h-full object-cover" /> : mergedData.initials}
          </div>
          <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Upload className="w-5 h-5 text-white mb-1" />
            <span className="text-[10px] text-white">Change Photo</span>
          </div>
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-bold text-[#1A1A1A] leading-tight">{mergedData.firstName} {mergedData.lastName}</h1>
          <div className="flex items-center gap-2 mt-1 text-[13px] text-[#525252]">
            <button onClick={() => handleCopyCode(mergedData.code || "")} className="flex items-center gap-1 hover:text-[#D4A017] transition-colors group" title="Click to copy">
              <span>{mergedData.code || mergedData.employeeNumber}</span>
              {copiedCode ? <Check className="w-3 h-3 text-[#1B7A43]" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
            </button>
            <span>·</span>
            <span>{mergedData.position || mergedData.jobTitle}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={mergedData.status} />
            <span className="w-1 h-1 rounded-full bg-[#9C9C9C]" />
            <span className="text-[13px] text-[#525252]">{mergedData.department}</span>
            <span className="w-1 h-1 rounded-full bg-[#9C9C9C]" />
            <span className="text-[13px] text-[#525252]">{siteName}</span>
            <span className="w-1 h-1 rounded-full bg-[#9C9C9C]" />
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(212,160,23,0.08)] text-[#D4A017]">{mergedData.jobGrade}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="h-[36px] border-[#E5E4E0] text-[#525252] hover:border-[#D4A017] hover:text-[#D4A017]" onClick={() => setEditMode(!editMode)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> {editMode ? "Done" : "Edit"}
          </Button>
          <Button variant="outline" className="h-[36px] border-[#E5E4E0] text-[#525252] hover:border-[#D4A017] hover:text-[#D4A017]" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] px-4 sticky top-0 z-10">
        <div className="flex gap-0 border-b border-[#E5E4E0]">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-5 py-3 text-[13px] font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.id
                  ? "text-[#D4A017] border-[#D4A017]"
                  : "text-[#525252] border-transparent hover:text-[#1A1A1A] hover:bg-[rgba(212,160,23,0.03)]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "documents" && mergedData.documents && Object.keys(mergedData.documents).length > 0 && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-[#D4A017] text-white text-[10px] flex items-center justify-center font-bold">{Object.values(mergedData.documents).flat().length}</span>
              )}
              {tab.id === "comments" && mergedData.comments && mergedData.comments.length > 0 && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-[#D4A017] text-white text-[10px] flex items-center justify-center font-bold">{mergedData.comments.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6">
        {/* Personal Tab */}
        {activeTab === "personal" && (
          <div className="grid grid-cols-[55%_45%] gap-6">
            <div>
              <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Personal Information</h3>
              <InlineField label="Full Name" value={`${mergedData.firstName} ${mergedData.lastName}`} editable={editMode} onChange={() => {}} />
              <InlineField label="First Name" value={mergedData.firstName} editable={editMode} onChange={(v) => updateField("firstName", v)} />
              <InlineField label="Surname" value={mergedData.lastName} editable={editMode} onChange={(v) => updateField("lastName", v)} />
              <InlineField label="Initial" value={mergedData.initials} editable={editMode} onChange={(v) => updateField("initials", v)} />
              <InlineField label="Date of Birth" value={mergedData.dateOfBirth || ""} editable={editMode} onChange={(v) => updateField("dateOfBirth", v)} type="date" />
              <InlineField label="Age" value={mergedData.dateOfBirth ? `${Math.floor((Date.now() - new Date(mergedData.dateOfBirth).getTime()) / 31557600000)} years` : "—"} editable={false} />
              <InlineField label="National ID" value={mergedData.nationalId || ""} editable={editMode} onChange={(v) => updateField("nationalId", v)} />
              <InlineField label="Nationality" value={mergedData.nationality || ""} editable={editMode} onChange={(v) => updateField("nationality", v)} type="select" options={["Zimbabwean", "South African", "Zambian", "Botswanan", "Other"]} />
              <InlineField label="Gender" value={mergedData.gender || ""} editable={editMode} onChange={(v) => updateField("gender", v)} type="select" options={["Male", "Female", "Other"]} />
              <InlineField label="Marital Status" value={mergedData.maritalStatus || ""} editable={editMode} onChange={(v) => updateField("maritalStatus", v)} type="select" options={["Single", "Married", "Divorced", "Widowed"]} />
              <InlineField label="Phone Number" value={mergedData.phone} editable={editMode} onChange={(v) => updateField("phone", v)} />
              <InlineField label="Work Email" value={mergedData.email} editable={editMode} onChange={(v) => updateField("email", v)} />
              <InlineField label="Home Address" value={mergedData.homeAddress || ""} editable={editMode} onChange={(v) => updateField("homeAddress", v)} type="textarea" />
            </div>
            <div>
              <div className="flex flex-col items-center mb-6">
                <div className="w-[160px] h-[160px] rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[28px] font-bold border-[3px] border-[#D4A017] shadow-[0_4px_16px_rgba(212,160,23,0.15)] overflow-hidden">
                  {mergedData.photoUrl ? <img src={mergedData.photoUrl} alt="" className="w-full h-full object-cover" /> : mergedData.initials}
                </div>
                <button className="mt-2 text-[12px] text-[#D4A017] hover:underline font-medium">Change Photo</button>
              </div>
              <div className="border-t border-[#E5E4E0] pt-4">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-3">Emergency Contact</h3>
                <InlineField label="Contact Name" value={mergedData.emergencyContactName || "—"} editable={editMode} onChange={(v) => updateField("emergencyContactName", v)} />
                <InlineField label="Phone" value={mergedData.emergencyContactPhone || "—"} editable={editMode} onChange={(v) => updateField("emergencyContactPhone", v)} />
                <InlineField label="Relationship" value={mergedData.emergencyContactRelationship || "—"} editable={editMode} onChange={(v) => updateField("emergencyContactRelationship", v)} />
              </div>
            </div>
          </div>
        )}

        {/* Employment Tab */}
        {activeTab === "employment" && (
          <div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Employment Information</h3>
                <InlineField label="Employee Code" value={mergedData.code || mergedData.employeeNumber} editable={false} />
                <InlineField label="Job Title" value={mergedData.jobTitle} editable={editMode} onChange={(v) => updateField("jobTitle", v)} />
                <InlineField label="Department" value={mergedData.department} editable={editMode} onChange={(v) => updateField("department", v)} type="select" options={DEPARTMENTS} />
                <InlineField label="Site" value={siteName} editable={false} />
                <InlineField label="Employment Type" value={mergedData.employeeType || "—"} editable={editMode} onChange={(v) => updateField("employeeType", v)} type="select" options={["Permanent", "Contract", "Casual", "Intern"]} />
                <InlineField label="Job Grade" value={mergedData.jobGrade || "—"} editable={editMode} onChange={(v) => updateField("jobGrade", v)} type="select" options={Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`)} />
                <InlineField label="Cost Centre" value={mergedData.costCentre || "—"} editable={editMode} onChange={(v) => updateField("costCentre", v)} />
                <InlineField label="Contract Start Date" value={mergedData.contractStart || "—"} editable={editMode} onChange={(v) => updateField("contractStart", v)} type="date" />
                <InlineField label="Contract End Date" value={mergedData.contractEnd || "— (Permanent)"} editable={editMode} onChange={(v) => updateField("contractEnd", v)} type="date" />
                <InlineField label="Status" value={mergedData.status} editable={editMode} onChange={(v) => updateField("status", v as EmployeeStatus)} type="select" options={STATUSES} />
                <InlineField label="Years of Experience" value={`${mergedData.yearsOfExperience || 0} years`} editable={editMode} onChange={(v) => updateField("yearsOfExperience", v)} />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Reporting Structure</h3>
                <div className="bg-[#FAFAF8] rounded-lg p-4 mb-4">
                  <p className="text-[12px] text-[#525252] font-medium mb-2">Reports to</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[13px] font-bold">
                      {mergedData.reportingLineName?.split(" ").map((n) => n[0]).join("") || "?"}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#1A1A1A]">{mergedData.reportingLineName || "Not assigned"}</p>
                      <p className="text-[11px] text-[#9C9C9C]">{mergedData.department} Manager</p>
                    </div>
                  </div>
                </div>
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Employment Timeline</h3>
                <div className="relative pl-4 border-l-2 border-[#E5E4E0]">
                  <div className="mb-4 relative">
                    <div className="absolute -left-[21px] w-2 h-2 rounded-full bg-[#1B7A43]" />
                    <p className="text-[13px] text-[#1A1A1A]">Joined — {mergedData.contractStart ? new Date(mergedData.contractStart).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
                  </div>
                  {mergedData.status === "Transferred" && (
                    <div className="mb-4 relative">
                      <div className="absolute -left-[21px] w-2 h-2 rounded-full bg-[#1E6BA3]" />
                      <p className="text-[13px] text-[#1A1A1A]">Transferred to {siteName}</p>
                    </div>
                  )}
                  <div className="relative">
                    <div className="absolute -left-[21px] w-2 h-2 rounded-full bg-[#1B7A43] animate-pulse" />
                    <p className="text-[13px] text-[#1A1A1A]">Present — {mergedData.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IT Tab */}
        {activeTab === "it" && (
          <div>
            <div className="pb-5 mb-5 border-b border-[#D9D8D4]">
              <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">M365 & Accounts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-[#525252] font-medium">M365 Account</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[#1A1A1A]">{mergedData.m365Status === "Active" ? `${mergedData.firstName.toLowerCase()}.${mergedData.lastName.toLowerCase()}@magayamining.co.zw` : "Not Created"}</span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1B7A43]"><span className="w-1.5 h-1.5 rounded-full bg-[#1B7A43]" />{mergedData.m365Status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-[#525252] font-medium">Mobile WiFi</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-[#1A1A1A]">{mergedData.mobileWiFi}</span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1B7A43]"><span className="w-1.5 h-1.5 rounded-full bg-[#1B7A43]" />Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-5 mb-5 border-b border-[#D9D8D4]">
              <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Hardware Assigned</h3>
              {mergedData.hardware && mergedData.hardware.length > 0 ? (
                <div className="space-y-2">
                  {mergedData.hardware.map((h, i) => (
                    <div key={i} className="bg-[#FAFAF8] rounded-lg p-4 flex items-start gap-3">
                      <Monitor className="w-5 h-5 text-[#1E6BA3] mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-semibold text-[#1A1A1A]">{h.item}</p>
                          <Badge className="bg-[#E8F5EC] text-[#1B7A43] text-[11px]">{h.status}</Badge>
                        </div>
                        <p className="text-[12px] text-[#525252] mt-0.5">{h.location} · {h.purpose}</p>
                        {h.specialSoftware.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {h.specialSoftware.map((sw) => (
                              <span key={sw} className="px-2 py-0.5 rounded-full text-[11px] bg-[rgba(30,107,163,0.08)] text-[#1E6BA3]">{sw}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#9C9C9C]">
                  <Monitor className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-[13px] font-medium text-[#525252]">No IT assets assigned</p>
                  <p className="text-[12px]">IT provisioning will appear here once initiated.</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Software & Training</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {mergedData.softwareInstalled?.map((sw) => (
                  <span key={sw} className="px-2.5 py-1 rounded-full text-[12px] bg-[rgba(30,107,163,0.08)] text-[#1E6BA3]">{sw}</span>
                )) || <span className="text-[13px] text-[#9C9C9C]">No software recorded</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#525252]">Software Training:</span>
                <Badge className={cn("text-[11px]", mergedData.softwareTraining === "Completed" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#FDF3E0] text-[#C27A06]")}>{mergedData.softwareTraining}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Security Clearance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[13px] text-[#525252] font-medium">Clearance Level</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#1A1A1A]">{mergedData.clearanceLevel}</span>
                    <Badge className="bg-[#E8F5EC] text-[#1B7A43] text-[11px]">{mergedData.clearanceStatus}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[13px] text-[#525252] font-medium">ID Card Number</span>
                  <Badge className="bg-[#E8F5EC] text-[#1B7A43] text-[11px]">{mergedData.idCardNumber}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[13px] text-[#525252] font-medium">Vehicle Card Number</span>
                  <Badge className={mergedData.vehicleCardNumber ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#9C9C9C]"} style={{ fontSize: 11 }}>{mergedData.vehicleCardNumber || "Not Issued"}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[13px] text-[#525252] font-medium">Clearance Expiry</span>
                  <Badge className={cn("text-[11px]", mergedData.clearanceExpiry && new Date(mergedData.clearanceExpiry) < new Date(Date.now() + 30 * 86400000) ? "bg-[#FDF3E0] text-[#C27A06]" : "bg-[#E8F5EC] text-[#1B7A43]")}>{mergedData.clearanceExpiry}</Badge>
                </div>
              </div>

              {/* ID Card Preview */}
              <div className="mt-6 p-4 rounded-lg border border-[#E5E4E0] bg-gradient-to-br from-white to-[#FAFAF8] max-w-[280px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded bg-[#1A1A1A] flex items-center justify-center">
                    <span className="text-[#D4A017] text-[8px] font-bold">MM</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#1A1A1A]">MAGAYA MINING</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[14px] font-bold">{mergedData.initials}</div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#1A1A1A]">{mergedData.firstName} {mergedData.lastName}</p>
                    <p className="text-[10px] text-[#525252]">{mergedData.idCardNumber}</p>
                    <p className="text-[9px] text-[#9C9C9C]">Expires: {mergedData.clearanceExpiry}</p>
                  </div>
                </div>
                <div className="mt-3 h-6 bg-[repeating-linear-gradient(90deg,#1A1A1A_0px,#1A1A1A_2px,transparent_2px,transparent_4px)] rounded opacity-30" />
              </div>
            </div>

            <div>
              <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Access Zones</h3>
              <div className="space-y-2">
                {mergedData.accessZones?.map((z, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-[#FAFAF8] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#1E6BA3]" />
                      <span className="text-[13px] text-[#1A1A1A]">{z.zone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[rgba(30,107,163,0.08)] text-[#1E6BA3] text-[10px]">{z.accessLevel}</Badge>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1B7A43]" />
                    </div>
                  </div>
                ))}
              </div>

              {mergedData.vehicleAccess && (
                <div className="mt-6">
                  <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-3">Vehicle Access</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-[#F0EFEA]"><span className="text-[13px] text-[#525252]">Registration</span><span className="text-[13px] text-[#1A1A1A]">{mergedData.vehicleAccess.registration}</span></div>
                    <div className="flex justify-between py-1.5 border-b border-[#F0EFEA]"><span className="text-[13px] text-[#525252]">Type</span><span className="text-[13px] text-[#1A1A1A]">{mergedData.vehicleAccess.type}</span></div>
                    <div className="flex justify-between py-1.5 border-b border-[#F0EFEA]"><span className="text-[13px] text-[#525252]">Parking Zone</span><span className="text-[13px] text-[#1A1A1A]">{mergedData.vehicleAccess.parkingZone}</span></div>
                    <div className="flex justify-between py-1.5"><span className="text-[13px] text-[#525252]">Card Status</span><Badge className="bg-[#E8F5EC] text-[#1B7A43] text-[11px]">{mergedData.vehicleAccess.cardStatus}</Badge></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === "admin" && (
          <div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Administrative Setup</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-[#F0EFEA]">
                    <div className="flex items-center gap-2"><span className="text-[13px] text-[#525252] font-medium">Parking Bay</span></div>
                    <Badge className={mergedData.parkingBay !== "—" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#9C9C9C]"} style={{ fontSize: 11 }}>{mergedData.parkingBay !== "—" ? `Assigned (${mergedData.parkingBay})` : "Not Assigned"}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#F0EFEA]">
                    <span className="text-[13px] text-[#525252] font-medium">Locker Number</span>
                    <Badge className={mergedData.lockerNumber !== "—" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#9C9C9C]"} style={{ fontSize: 11 }}>{mergedData.lockerNumber !== "—" ? `Assigned (${mergedData.lockerNumber})` : "Not Assigned"}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#F0EFEA]">
                    <span className="text-[13px] text-[#525252] font-medium">Induction Status</span>
                    <Badge className={mergedData.inductionStatus === "Completed" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#FDF3E0] text-[#C27A06]"} style={{ fontSize: 11 }}>{mergedData.inductionStatus}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#F0EFEA]">
                    <span className="text-[13px] text-[#525252] font-medium">Induction Date</span>
                    <span className="text-[13px] text-[#1A1A1A]">{mergedData.inductionDate || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px] text-[#525252] font-medium">PPE Issued</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {mergedData.ppeIssued?.map((ppe) => (
                        <Badge key={ppe} className="bg-[#E8F5EC] text-[#1B7A43] text-[10px]">{ppe}</Badge>
                      )) || <span className="text-[13px] text-[#9C9C9C]">None</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Office & Facilities</h3>
                <div className="space-y-3">
                  <InlineField label="Office Location" value={mergedData.officeLocation || "—"} editable={editMode} onChange={(v) => updateField("officeLocation", v)} />
                  <InlineField label="Desk Phone" value={mergedData.deskPhone || "—"} editable={editMode} onChange={(v) => updateField("deskPhone", v)} />
                  <InlineField label="Meal Card" value={mergedData.mealCard || "—"} editable={editMode} onChange={(v) => updateField("mealCard", v)} />
                  <InlineField label="Uniform Size" value={mergedData.uniformSize || "—"} editable={editMode} onChange={(v) => updateField("uniformSize", v)} />
                  <div className="flex items-center justify-between py-2 border-b border-[#F0EFEA]">
                    <span className="text-[13px] text-[#525252] font-medium">Medical Clearance</span>
                    <Badge className={mergedData.medicalClearance?.startsWith("Passed") ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#FDF3E0] text-[#C27A06]"} style={{ fontSize: 11 }}>{mergedData.medicalClearance}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Induction Checklist */}
            <div className="mt-6 pt-6 border-t border-[#D9D8D4]">
              <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Induction Checklist</h3>
              <div className="space-y-2">
                {mergedData.inductionChecklist?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 bg-[#FAFAF8] rounded-lg">
                    {item.completed ? <CheckSquare className="w-4 h-4 text-[#1B7A43]" /> : <div className="w-4 h-4 rounded-[3px] border-2 border-[#C4C3BF]" />}
                    <span className={cn("text-[13px] flex-1", item.completed ? "text-[#1A1A1A]" : "text-[#9C9C9C]")}>{item.item}</span>
                    {item.completed && <span className="text-[11px] text-[#9C9C9C]">{item.date}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Documents</h3>
              <Button className="h-[32px] bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]"><Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Document</Button>
            </div>
            {mergedData.documents && Object.keys(mergedData.documents).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(mergedData.documents).map(([category, docs]) => (
                  <div key={category} className="border border-[#E5E4E0] rounded-lg overflow-hidden">
                    <div className="bg-[#FAFAF8] px-4 py-2.5 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D4A017]" />
                      <span className="text-[14px] font-semibold text-[#1A1A1A] capitalize">{category} Documents</span>
                      <span className="ml-1 w-5 h-5 rounded-full bg-[#D4A017] text-white text-[10px] flex items-center justify-center font-bold">{docs.length}</span>
                    </div>
                    <div className="divide-y divide-[#E5E4E0]">
                      {docs.map((doc, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF8] transition-colors">
                          <FileText className="w-4 h-4 text-[#1E6BA3] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[#1A1A1A] truncate">{doc.name}</p>
                            <p className="text-[11px] text-[#9C9C9C]">{doc.type} · {doc.size} · Uploaded {doc.uploaded}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded hover:bg-[#E5E4E0] text-[#525252] hover:text-[#D4A017] transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 rounded hover:bg-[#E5E4E0] text-[#525252] hover:text-[#D4A017] transition-colors" title="Download"><Download className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#9C9C9C]">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-[13px] font-medium text-[#525252]">No documents uploaded</p>
                <p className="text-[12px]">Upload your first document to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === "comments" && (
          <div className="grid grid-cols-[60%_40%] gap-6">
            <div>
              <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Comments & Notes</h3>
              <div className="space-y-4 mb-6">
                {mergedData.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {comment.author.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-[#1A1A1A]">{comment.author}</span>
                        <span className="text-[11px] text-[#9C9C9C]">{comment.role}</span>
                        <span className="text-[11px] text-[#9C9C9C]">·</span>
                        <span className="text-[11px] text-[#9C9C9C]">{new Date(comment.timestamp).toLocaleDateString("en-GB")}</span>
                      </div>
                      <div className="bg-[#FAFAF8] rounded-lg p-3">
                        <p className="text-[13px] text-[#525252]">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                </div>
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] text-[13px] border-[#E5E4E0] mb-2"
                  />
                  <Button className="h-[32px] bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]" onClick={handleAddComment}>
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Post Comment
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Experience & Performance</h3>
              <div className="bg-[#FAFAF8] rounded-lg p-4 mb-4">
                <p className="text-[12px] text-[#525252] font-medium uppercase tracking-wider mb-1">Years of Experience</p>
                <p className="text-[28px] font-bold text-[#1A1A1A]">{mergedData.yearsOfExperience || 0}</p>
              </div>
              <div className="mb-4">
                <p className="text-[12px] text-[#525252] font-medium mb-2">Academic Qualifications</p>
                <div className="flex flex-wrap gap-1">
                  {mergedData.academicQualifications?.split(",").map((q) => (
                    <span key={q} className="px-2 py-1 rounded-full text-[11px] bg-[rgba(30,107,163,0.08)] text-[#1E6BA3]">{q.trim()}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[12px] text-[#525252] font-medium mb-2">Performance Notes</p>
                <Textarea
                  placeholder="Add performance notes..."
                  className="min-h-[80px] text-[12px] border-[#E5E4E0]"
                  defaultValue="Employee performing well. Exceeds expectations in technical tasks."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Workflow History Sidebar ─────────────────────────────────────── */}
      {empWorkflows.length > 0 && (
        <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Workflow History</h3>
          <div className="space-y-3">
            {empWorkflows.map((wf) => (
              <div key={wf.id} className="flex items-start gap-3 p-3 bg-[#FAFAF8] rounded-lg">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  wf.type === "onboarding" ? "bg-[#E8F5EC] text-[#1B7A43]" :
                  wf.type === "offboarding" ? "bg-[#FFF1F0] text-[#B91C1C]" : "bg-[#E8F2FA] text-[#1E6BA3]")}>
                  {wf.type === "onboarding" ? <Briefcase className="w-4 h-4" /> : wf.type === "offboarding" ? <FileText className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[#1A1A1A]">{wf.id}</p>
                    <Badge className={cn("text-[10px]",
                      wf.status === "Completed" ? "bg-[#E8F5EC] text-[#1B7A43]" :
                      wf.status === "In Progress" ? "bg-[#FDF3E0] text-[#C27A06]" : "bg-[#E8F2FA] text-[#1E6BA3]")}>{wf.status}</Badge>
                  </div>
                  <p className="text-[12px] text-[#525252] capitalize">{wf.type} · {wf.siteName}</p>
                  <p className="text-[11px] text-[#9C9C9C] mt-0.5">Initiated by {wf.initiatedBy} on {new Date(wf.initiatedAt).toLocaleDateString("en-GB")}</p>
                  <div className="mt-2">
                    <div className="h-1.5 bg-[#E5E4E0] rounded-full overflow-hidden">
                      <div className="h-full bg-[#D4A017] rounded-full transition-all" style={{ width: `${(wf.stages.filter((s) => s.status === "Completed").length / wf.stages.length) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-[#9C9C9C] mt-1">{wf.stages.filter((s) => s.status === "Completed").length} of {wf.stages.length} stages completed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Delete Modal ─────────────────────────────────────────────────── */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold text-[#B91C1C]">Delete Employee Record</DialogTitle>
            <DialogDescription className="text-[14px] text-[#525252]">
              Are you sure you want to delete <strong>{mergedData.firstName} {mergedData.lastName}</strong>? This action cannot be undone and will remove all associated data including documents, comments, and workflow history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#B91C1C] hover:bg-[#991B1B] text-white" onClick={() => { navigate("/employees"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
