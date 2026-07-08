import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, ChevronDown, ChevronUp, ChevronsUpDown, Download,
  Eye, Pencil, Trash2, X, Columns3, Check
} from "lucide-react";
import { useEmployees, type LiveEmployee } from "@/hooks/useEmployees";
import type { EmployeeStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ExtendedEmployee = LiveEmployee;

const GRADES = ["A", "B", "C", "D", "E", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"];

// ── Constants ──────────────────────────────────────────────────────────────
// Departments and sites now come from the database (useEmployees hook).

const STATUSES: EmployeeStatus[] = ["Active", "Onboarding", "Transferred", "Offboarding", "Terminated", "Archived"];

const STATUS_COLORS: Record<EmployeeStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-[#E8F5EC]", text: "text-[#1B7A43]", dot: "bg-[#1B7A43]" },
  Onboarding: { bg: "bg-[#FDF3E0]", text: "text-[#C27A06]", dot: "bg-[#C27A06]" },
  Transferred: { bg: "bg-[#E8F2FA]", text: "text-[#1E6BA3]", dot: "bg-[#1E6BA3]" },
  Offboarding: { bg: "bg-[#FFF1F0]", text: "text-[#B91C1C]", dot: "bg-[#B91C1C]" },
  Terminated: { bg: "bg-[#F5F5F5]", text: "text-[#737373]", dot: "bg-[#737373]" },
  Archived: { bg: "bg-[#FAFAFA]", text: "text-[#9C9C9C]", dot: "bg-[#9C9C9C]" },
};

type SortField = "code" | "fullName" | "site" | "department" | "position" | "status" | "phone" | "email" | "gender";
type SortDir = "asc" | "desc";

interface Filters {
  search: string;
  siteIds: string[];
  departments: string[];
  statuses: EmployeeStatus[];
  gender: string;
  grade: string[];
}

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

// ── Avatar ─────────────────────────────────────────────────────────────────
function EmpAvatar({ emp, size = 32 }: { emp: ExtendedEmployee; size?: number }) {
  if (emp.photoUrl) {
    return <img src={emp.photoUrl} alt={emp.firstName} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full bg-[#D4A017] flex items-center justify-center text-white font-semibold" style={{ width: size, height: size, fontSize: size < 36 ? 11 : 14 }}>
      {emp.initials}
    </div>
  );
}

// ── Sort Icon ──────────────────────────────────────────────────────────────
function SortIcon({ field, currentField, dir }: { field: SortField; currentField: SortField; dir: SortDir }) {
  if (field !== currentField) return <ChevronsUpDown className="w-3 h-3 text-[#C4C3BF] opacity-0 group-hover:opacity-100 transition-opacity" />;
  return dir === "asc" ? <ChevronUp className="w-3 h-3 text-[#D4A017]" /> : <ChevronDown className="w-3 h-3 text-[#D4A017]" />;
}

// ── Filter Pill ────────────────────────────────────────────────────────────
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.2)] text-[#D4A017]">
      {label}
      <button onClick={onRemove} className="hover:text-[#A67C0A] transition-colors"><X className="w-3 h-3" /></button>
    </span>
  );
}

// ── Column visibility default ──────────────────────────────────────────────
const DEFAULT_VISIBLE_COLS: Record<string, boolean> = {
  code: true, photo: true, fullName: true, site: true, department: true,
  position: true, status: true, phone: true, email: true, gender: true, actions: true,
};

// ── Main Page Component ────────────────────────────────────────────────────
export default function Employees() {
  const navigate = useNavigate();
  const { employees: liveEmployees, sites, departments, loading, error, createEmployee, updateEmployee, archiveEmployee } = useEmployees();
  const DEPARTMENTS = useMemo(() => departments.map((d) => d.name), [departments]);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── State ────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>({
    search: "", siteIds: [], departments: [], statuses: ["Active"], gender: "All", grade: [],
  });
  const [sortField, setSortField] = useState<SortField>("fullName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE_COLS);
  const [colDropdownOpen, setColDropdownOpen] = useState(false);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<ExtendedEmployee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<ExtendedEmployee | null>(null);

  // Form state (simplified for new/edit)
  const [formTab, setFormTab] = useState("personal");
  const [formData, setFormData] = useState<Partial<ExtendedEmployee>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Derived data ─────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    let data = [...liveEmployees];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter((e) =>
        e.firstName.toLowerCase().includes(q) || e.lastName.toLowerCase().includes(q) ||
        (e.code && e.code.toLowerCase().includes(q)) || e.email.toLowerCase().includes(q) ||
        e.phone.includes(q)
      );
    }
    if (filters.siteIds.length > 0) data = data.filter((e) => filters.siteIds.includes(e.siteId));
    if (filters.departments.length > 0) data = data.filter((e) => filters.departments.includes(e.department));
    if (filters.statuses.length > 0) data = data.filter((e) => filters.statuses.includes(e.status));
    if (filters.gender !== "All") data = data.filter((e) => e.gender === filters.gender);

    data.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortField) {
        case "code": return ((a.code ?? "") > (b.code ?? "") ? 1 : -1) * dir;
        case "fullName": return ((a.firstName + " " + a.lastName) > (b.firstName + " " + b.lastName) ? 1 : -1) * dir;
        case "site": return ((getSiteName(a.siteId) ?? "") > (getSiteName(b.siteId) ?? "") ? 1 : -1) * dir;
        case "department": return (a.department > b.department ? 1 : -1) * dir;
        case "position": return ((a.position ?? a.jobTitle) > (b.position ?? b.jobTitle) ? 1 : -1) * dir;
        case "status": return (a.status > b.status ? 1 : -1) * dir;
        case "phone": return (a.phone > b.phone ? 1 : -1) * dir;
        case "email": return (a.email > b.email ? 1 : -1) * dir;
        case "gender": return ((a.gender ?? "") > (b.gender ?? "") ? 1 : -1) * dir;
        default: return 0;
      }
    });
    return data;
  }, [liveEmployees, filters, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getSiteName = useCallback((siteId: string) => sites.find((s) => s.id === siteId)?.name ?? "Unknown", [sites]);

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedEmployees.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedEmployees.map((e) => e.id)));
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const clearFilters = () => setFilters({ search: "", siteIds: [], departments: [], statuses: [], gender: "All", grade: [] });

  const activeFilterCount = (filters.siteIds.length > 0 ? 1 : 0) + (filters.departments.length > 0 ? 1 : 0) + (filters.statuses.length !== 1 || filters.statuses[0] !== "Active" ? 1 : 0) + (filters.gender !== "All" ? 1 : 0) + filters.grade.length;

  const openNewModal = () => {
    setFormData({ status: "Active", employeeType: "Permanent", nationality: "Zimbabwean" });
    setFormErrors({});
    setFormTab("personal");
    setIsNewModalOpen(true);
  };

  const openEditModal = (emp: ExtendedEmployee) => {
    setEditingEmployee(emp);
    setFormData({ ...emp });
    setFormErrors({});
    setFormTab("personal");
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (emp: ExtendedEmployee) => {
    setDeletingEmployee(emp);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    setSaving(true);
    const err = await archiveEmployee(deletingEmployee.id);
    setSaving(false);
    if (err) { setActionError(err); return; }
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(deletingEmployee.id); return n; });
    setDeletingEmployee(null);
    setIsDeleteModalOpen(false);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.firstName?.trim()) errs.firstName = "First name is required";
    if (!formData.lastName?.trim()) errs.lastName = "Surname is required";
    if (!formData.email?.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+$/.test(formData.email)) errs.email = "Invalid email";
    if (!formData.phone?.trim()) errs.phone = "Phone is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveNew = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setActionError(null);
    const err = await createEmployee(formData);
    setSaving(false);
    if (err) { setActionError(err); return; }
    setIsNewModalOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!validateForm() || !editingEmployee) return;
    setSaving(true);
    setActionError(null);
    const err = await updateEmployee(editingEmployee.id, formData);
    setSaving(false);
    if (err) { setActionError(err); return; }
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const handleExportCSV = () => {
    const rows = selectedIds.size > 0 ? liveEmployees.filter((e) => selectedIds.has(e.id)) : filteredEmployees;
    const csv = [
      ["Employee Code", "First Name", "Last Name", "Site", "Department", "Position", "Status", "Phone", "Email", "Gender"].join(","),
      ...rows.map((e) => [
        e.code || "", e.firstName, e.lastName, getSiteName(e.siteId), e.department,
        e.position || e.jobTitle, e.status, e.phone, e.email, e.gender || ""
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "employees.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Form Field Helpers ───────────────────────────────────────────────────
  const FormField = ({ label, name, type = "text", required = false, placeholder = "", options }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; options?: string[] }) => (
    <div className="mb-4">
      <Label className="text-[13px] font-medium text-[#525252] mb-1.5 block">{label}{required && <span className="text-[#B91C1C] ml-0.5">*</span>}</Label>
      {type === "select" && options ? (
        <Select value={String(formData[name as keyof typeof formData] ?? "")} onValueChange={(v) => setFormData((p) => ({ ...p, [name]: v }))}>
          <SelectTrigger className="h-[40px] border-[#E5E4E0] rounded-md text-[14px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      ) : type === "textarea" ? (
        <Textarea value={String(formData[name as keyof typeof formData] ?? "")} onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))} placeholder={placeholder} className="border-[#E5E4E0] rounded-md text-[14px] min-h-[80px]" />
      ) : type === "date" ? (
        <Input type="date" value={String(formData[name as keyof typeof formData] ?? "")} onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))} className="h-[40px] border-[#E5E4E0] rounded-md text-[14px]" />
      ) : (
        <Input type={type} value={String(formData[name as keyof typeof formData] ?? "")} onChange={(e) => setFormData((p) => ({ ...p, [name]: e.target.value }))} placeholder={placeholder} className={cn("h-[40px] border-[#E5E4E0] rounded-md text-[14px]", formErrors[name] && "border-[#B91C1C] ring-1 ring-[rgba(185,28,28,0.15)]")} />
      )}
      {formErrors[name] && <p className="text-[12px] text-[#B91C1C] mt-1">{formErrors[name]}</p>}
    </div>
  );

  const EmployeeForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div>
      <Tabs value={formTab} onValueChange={setFormTab}>
        <TabsList className="mb-4 bg-[#FAFAF8] border border-[#E5E4E0] rounded-lg">
          <TabsTrigger value="personal" className="text-[13px] data-[state=active]:text-[#D4A017] data-[state=active]:border-b-2 data-[state=active]:border-[#D4A017] rounded-none">Personal</TabsTrigger>
          <TabsTrigger value="employment" className="text-[13px] data-[state=active]:text-[#D4A017] data-[state=active]:border-b-2 data-[state=active]:border-[#D4A017] rounded-none">Employment</TabsTrigger>
          <TabsTrigger value="contact" className="text-[13px] data-[state=active]:text-[#D4A017] data-[state=active]:border-b-2 data-[state=active]:border-[#D4A017] rounded-none">Contact</TabsTrigger>
        </TabsList>
        <TabsContent value="personal" className="mt-0">
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              {FormField({ label: "First Name", name: "firstName", required: true })}
              {FormField({ label: "Surname", name: "lastName", required: true })}
              {FormField({ label: "Date of Birth", name: "dateOfBirth", type: "date" })}
              {FormField({ label: "Gender", name: "gender", type: "select", options: ["Male", "Female", "Other"] })}
              {FormField({ label: "National ID", name: "nationalId", placeholder: "e.g. 88-1234567A88" })}
              {FormField({ label: "Nationality", name: "nationality", type: "select", options: ["Zimbabwean", "South African", "Zambian", "Botswanan", "Other"] })}
            </div>
            <div>
              <FormField label="Photo URL" name="photoUrl" placeholder="https://..." />
              {FormField({ label: "Home Address", name: "homeAddress", type: "textarea", placeholder: "Full residential address" })}
              <div className="border-t border-[#E5E4E0] pt-3 mt-2">
                <p className="text-[13px] font-semibold text-[#525252] mb-2">Emergency Contact</p>
                {FormField({ label: "Contact Name", name: "emergencyContactName" })}
                {FormField({ label: "Relationship", name: "emergencyContactRelationship" })}
                {FormField({ label: "Contact Phone", name: "emergencyContactPhone" })}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="employment" className="mt-0">
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <div className="mb-4">
                <Label className="text-[13px] font-medium text-[#525252] mb-1.5 block">Employee Code</Label>
                <Input value={isEdit ? (formData.code || "") : "Auto-generated on save"} disabled className="h-[40px] bg-[#F5F5F5] text-[#9C9C9C] rounded-md text-[14px]" />
              </div>
              {FormField({ label: "Job Title", name: "jobTitle", required: true })}
              {FormField({ label: "Department", name: "department", type: "select", options: DEPARTMENTS, required: true })}
              <FormField label="Site" name="siteId" type="select" options={sites.map((s) => s.fullName)} required />
              {FormField({ label: "Employment Type", name: "employeeType", type: "select", options: ["Permanent", "Contract", "Intern"] })}
            </div>
            <div>
              {FormField({ label: "Job Grade", name: "jobGrade", type: "select", options: GRADES })}
              {FormField({ label: "Contract Start Date", name: "contractStart", type: "date" })}
              {FormField({ label: "Contract End Date", name: "contractEnd", type: "date" })}
              {FormField({ label: "Status", name: "status", type: "select", options: STATUSES, required: true })}
              {FormField({ label: "Cost Centre", name: "costCentre" })}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="contact" className="mt-0">
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              {FormField({ label: "Work Email", name: "email", type: "email", required: true, placeholder: "name@magayamining.co.zw" })}
              {FormField({ label: "Personal Email", name: "personalEmail", type: "email" })}
              {FormField({ label: "Phone", name: "phone", required: true, placeholder: "+263 77X XXX XXX" })}
              {FormField({ label: "Years of Experience", name: "yearsOfExperience", type: "number" })}
            </div>
            <div>
              {FormField({ label: "Academic Qualifications", name: "academicQualifications", type: "textarea" })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] tracking-[-0.02em]">Employee Master Data</h1>
          <p className="text-[13px] text-[#525252] mt-1">Manage and view all employee records</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-[40px] border-[#E5E4E0] text-[#525252] hover:border-[#D4A017] hover:text-[#D4A017]" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button className="h-[40px] bg-[#D4A017] hover:bg-[#A67C0A] text-white font-semibold shadow-[0_4px_12px_rgba(212,160,23,0.25)]" onClick={openNewModal}>
            <Plus className="w-4 h-4 mr-1.5" /> New Employee
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">Failed to load employees: {error}</div>
      )}
      {actionError && (
        <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C] flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-3 hover:text-[#991B1B]"><X className="w-4 h-4" /></button>
        </div>
      )}
      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C9C9C]" />
            <Input
              placeholder="Search by name, code, email, phone..."
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className="pl-9 h-[36px] border-[#E5E4E0] text-[14px]"
            />
          </div>
          <Select value={filters.siteIds.length === 1 ? String(filters.siteIds[0]) : filters.siteIds.length > 1 ? "multiple" : "all"} onValueChange={(v) => setFilters((p) => ({ ...p, siteIds: v === "all" || v === "multiple" ? [] : [v] }))}>
            <SelectTrigger className="h-[36px] min-w-[160px] border-[#E5E4E0] text-[14px]"><SelectValue placeholder="All Sites" /></SelectTrigger>
            <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.fullName}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.departments.length === 1 ? filters.departments[0] : filters.departments.length > 1 ? "multiple" : "all"} onValueChange={(v) => setFilters((p) => ({ ...p, departments: v === "all" || v === "multiple" ? [] : [v] }))}>
            <SelectTrigger className="h-[36px] min-w-[160px] border-[#E5E4E0] text-[14px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.statuses.length === 1 ? filters.statuses[0] : filters.statuses.length > 1 ? "multiple" : "all"} onValueChange={(v) => setFilters((p) => ({ ...p, statuses: v === "all" || v === "multiple" ? [] : [v as EmployeeStatus] }))}>
            <SelectTrigger className="h-[36px] min-w-[160px] border-[#E5E4E0] text-[14px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.gender} onValueChange={(v) => setFilters((p) => ({ ...p, gender: v }))}>
            <SelectTrigger className="h-[36px] min-w-[120px] border-[#E5E4E0] text-[14px]"><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setColDropdownOpen(!colDropdownOpen)} className="h-[36px] px-3 border border-[#E5E4E0] rounded-md text-[14px] text-[#525252] hover:border-[#D4A017] transition-colors flex items-center gap-1.5">
                <Columns3 className="w-4 h-4" /> Columns
              </button>
              {colDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-[180px] bg-white border border-[#E5E4E0] rounded-lg shadow-dropdown z-20 py-1">
                  {Object.keys(DEFAULT_VISIBLE_COLS).map((col) => (
                    <button key={col} onClick={() => { setVisibleCols((p) => ({ ...p, [col]: !p[col] })); }} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#FAFAF8] transition-colors text-left">
                      <div className={cn("w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors", visibleCols[col] ? "bg-[#D4A017] border-[#D4A017]" : "border-[#C4C3BF]")}>
                        {visibleCols[col] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="capitalize">{col === "fullName" ? "Full Name" : col === "code" ? "Code" : col}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active filter pills */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#E5E4E0]">
            {filters.siteIds.length > 0 && <FilterPill label={`Site: ${sites.find((s) => s.id === filters.siteIds[0])?.name}${filters.siteIds.length > 1 ? ` +${filters.siteIds.length - 1}` : ""}`} onRemove={() => setFilters((p) => ({ ...p, siteIds: [] }))} />}
            {filters.departments.length > 0 && <FilterPill label={`Dept: ${filters.departments[0]}${filters.departments.length > 1 ? ` +${filters.departments.length - 1}` : ""}`} onRemove={() => setFilters((p) => ({ ...p, departments: [] }))} />}
            {filters.statuses.length > 0 && !(filters.statuses.length === 1 && filters.statuses[0] === "Active") && <FilterPill label={`Status: ${filters.statuses[0]}${filters.statuses.length > 1 ? ` +${filters.statuses.length - 1}` : ""}`} onRemove={() => setFilters((p) => ({ ...p, statuses: ["Active"] }))} />}
            {filters.gender !== "All" && <FilterPill label={`Gender: ${filters.gender}`} onRemove={() => setFilters((p) => ({ ...p, gender: "All" }))} />}
            <button onClick={clearFilters} className="text-[12px] text-[#D4A017] hover:underline ml-1">Clear all filters</button>
          </div>
        )}
      </div>

      {/* ── Bulk Actions Bar ─────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="h-[40px] bg-[#D4A017] rounded-lg flex items-center px-4 gap-3 text-white">
          <span className="text-[13px] font-semibold">{selectedIds.size} employee{selectedIds.size > 1 ? "s" : ""} selected</span>
          <div className="w-px h-5 bg-white/30" />
          <button onClick={handleExportCSV} className="text-[13px] font-medium hover:underline flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Export</button>
          <button onClick={() => { const ids = Array.from(selectedIds); const toDelete = liveEmployees.find((e) => ids[0] === e.id); if (toDelete) openDeleteModal(toDelete); }} className="text-[13px] font-medium hover:underline flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Archive</button>
        </div>
      )}

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAF8] sticky top-0 z-10">
              <tr className="border-b border-[#E5E4E0]">
                <th className="w-[40px] px-4 py-3"><Checkbox checked={paginatedEmployees.length > 0 && selectedIds.size === paginatedEmployees.length} onCheckedChange={toggleSelectAll} aria-label="Select all" /></th>
                {visibleCols.code && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("code")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Code <SortIcon field="code" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.photo && <th className="w-[56px] px-2 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Photo</th>}
                {visibleCols.fullName && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("fullName")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Full Name <SortIcon field="fullName" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.site && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("site")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Site <SortIcon field="site" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.department && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("department")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Department <SortIcon field="department" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.position && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("position")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Position <SortIcon field="position" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.status && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("status")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Status <SortIcon field="status" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.phone && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("phone")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Phone <SortIcon field="phone" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.email && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("email")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Email <SortIcon field="email" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.gender && <th className="px-4 py-3 text-left"><button onClick={() => handleSort("gender")} className="group flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Gender <SortIcon field="gender" currentField={sortField} dir={sortDir} /></button></th>}
                {visibleCols.actions && <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map((emp) => {
                const isSelected = selectedIds.has(emp.id);
                return (
                  <tr
                    key={emp.id}
                    className={cn(
                      "border-b border-[#E5E4E0] h-[56px] cursor-pointer transition-colors duration-100",
                      isSelected ? "bg-[rgba(212,160,23,0.06)] border-l-[3px] border-l-[#D4A017]" : "hover:bg-[#FAFAF8]"
                    )}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectRow(emp.id)} aria-label={`Select ${emp.firstName}`} />
                    </td>
                    {visibleCols.code && <td className="px-4 py-3 text-[13px] text-[#1A1A1A] font-medium whitespace-nowrap">{emp.code || "—"}</td>}
                    {visibleCols.photo && <td className="px-2 py-3"><EmpAvatar emp={emp} size={32} /></td>}
                    {visibleCols.fullName && <td className="px-4 py-3 text-[13px] text-[#1A1A1A] font-medium hover:text-[#D4A017] hover:underline transition-colors">{emp.firstName} {emp.lastName}</td>}
                    {visibleCols.site && <td className="px-4 py-3 text-[13px] text-[#525252]">{getSiteName(emp.siteId)}</td>}
                    {visibleCols.department && <td className="px-4 py-3 text-[13px] text-[#525252]">{emp.department}</td>}
                    {visibleCols.position && <td className="px-4 py-3 text-[13px] text-[#525252] max-w-[150px] truncate">{emp.position || emp.jobTitle}</td>}
                    {visibleCols.status && <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>}
                    {visibleCols.phone && <td className="px-4 py-3 text-[13px] text-[#525252] whitespace-nowrap">{emp.phone}</td>}
                    {visibleCols.email && <td className="px-4 py-3 text-[13px] text-[#525252] max-w-[180px] truncate">{emp.email}</td>}
                    {visibleCols.gender && <td className="px-4 py-3 text-[13px] text-[#525252]">{emp.gender}</td>}
                    {visibleCols.actions && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/employees/${emp.id}`)} className="p-1.5 rounded-md hover:bg-[#FAFAF8] text-[#525252] hover:text-[#D4A017] transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEditModal(emp)} className="p-1.5 rounded-md hover:bg-[#FAFAF8] text-[#525252] hover:text-[#1E6BA3] transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => openDeleteModal(emp)} className="p-1.5 rounded-md hover:bg-[#FAFAF8] text-[#525252] hover:text-[#B91C1C] transition-colors" title="Archive"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {loading && (
                <tr><td colSpan={11} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-[3px] border-[#E5E4E0] border-t-[#D4A017] rounded-full animate-spin" />
                    <p className="text-[13px] text-[#9C9C9C]">Loading employees...</p>
                  </div>
                </td></tr>
              )}
              {!loading && paginatedEmployees.length === 0 && (
                <tr><td colSpan={11} className="py-16 text-center text-[#9C9C9C]">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-10 h-10 opacity-40" />
                    <p className="text-[16px] font-semibold text-[#1A1A1A]">No records found</p>
                    <p className="text-[13px] text-[#525252]">Try adjusting your filters</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E4E0] bg-white">
          <span className="text-[13px] text-[#525252]">Showing {Math.min((page - 1) * pageSize + 1, filteredEmployees.length)}-{Math.min(page * pageSize, filteredEmployees.length)} of {filteredEmployees.length} results</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md border border-[#E5E4E0] text-[#525252] hover:border-[#D4A017] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronDown className="w-4 h-4 rotate-90" /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5 && page > 3) p = page - 3 + i;
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)} className={cn("w-8 h-8 rounded-md text-[13px] font-medium transition-colors", p === page ? "bg-[#D4A017] text-white" : "text-[#525252] hover:bg-[#FAFAF8]")}>{p}</button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md border border-[#E5E4E0] text-[#525252] hover:border-[#D4A017] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronDown className="w-4 h-4 -rotate-90" /></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#525252]">Per page:</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-[32px] w-[70px] border-[#E5E4E0] text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── New Employee Modal ───────────────────────────────────────────── */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[20px] font-semibold">Create New Employee Record</DialogTitle></DialogHeader>
          {EmployeeForm({})}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#D4A017] hover:bg-[#A67C0A] text-white" disabled={saving} onClick={handleSaveNew}>{saving ? "Creating..." : "Create Employee"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Employee Modal ──────────────────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[20px] font-semibold">Edit Employee: {editingEmployee?.firstName} {editingEmployee?.lastName}</DialogTitle></DialogHeader>
          {EmployeeForm({ isEdit: true })}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#D4A017] hover:bg-[#A67C0A] text-white" disabled={saving} onClick={handleSaveEdit}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold text-[#B91C1C]">Archive Employee</DialogTitle>
            <DialogDescription className="text-[14px] text-[#525252]">
              Are you sure you want to archive <strong>{deletingEmployee?.firstName} {deletingEmployee?.lastName}</strong>? The record is retained (employees are never deleted) and can be viewed under the Archived status filter.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#B91C1C] hover:bg-[#991B1B] text-white" disabled={saving} onClick={handleDelete}>{saving ? "Archiving..." : "Archive"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
