import { useState, useCallback } from "react";
import { List, Clock, Bell, Settings as SettingsIcon, Users, Shield, Plus, Pencil, EyeOff, Eye, Search, Save, RotateCcw, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  mockDepartments,
  mockJobTitles,
  mockHardwareCatalog,
  mockSoftwareList,
  mockClearanceLevels,
  mockDocumentTypes,
  mockEmploymentTypes,
  mockNationalities,
  mockRetentionPolicies,
  mockNotificationEvents,
  mockSystemUsers,
  type DropdownItem,
  type HardwareItem,
  type SoftwareItem,
  type ClearanceLevelItem,
  type DocumentTypeItem,
  type RetentionPolicy,
  type NotificationEvent,
  type SystemUser,
} from "@/data/adminData";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface TabDef { key: string; label: string; icon: React.ElementType; }

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "checkbox" | "textarea";
  options?: string[];
  required?: boolean;
}

interface EditModalState {
  open: boolean;
  section: string;
  index: number;
  fields: FieldDef[];
  values: Record<string, unknown>;
}

const INITIAL_EDIT: EditModalState = { open: false, section: "", index: -1, fields: [], values: {} };

// ──────────────────────────────────────────────
// Field schemas per dropdown section
// ──────────────────────────────────────────────

const SECTION_FIELDS: Record<string, FieldDef[]> = {
  departments: [
    { key: "name", label: "Department Name", type: "text", required: true },
  ],
  jobs: [
    { key: "name", label: "Job Title", type: "text", required: true },
    { key: "department", label: "Department", type: "text" },
  ],
  hardware: [
    { key: "type", label: "Type", type: "text", required: true },
    { key: "model", label: "Model", type: "text", required: true },
    { key: "defaultSite", label: "Default Site", type: "text" },
  ],
  software: [
    { key: "name", label: "Software Name", type: "text", required: true },
    { key: "version", label: "Version", type: "text" },
    { key: "licenseType", label: "License Type", type: "select", options: ["Enterprise", "Per-user", "Floating", "Free"] },
  ],
  clearance: [
    { key: "name", label: "Level Name", type: "text", required: true },
    { key: "description", label: "Description", type: "text" },
    { key: "accessZones", label: "Access Zones (comma-separated)", type: "text" },
  ],
  docTypes: [
    { key: "name", label: "Document Type", type: "text", required: true },
    { key: "category", label: "Category", type: "select", options: ["Personal", "Medical", "Security", "Employment", "Academic"] },
    { key: "expiryWarningDays", label: "Warning Days", type: "number" },
    { key: "required", label: "Required", type: "checkbox" },
  ],
  empTypes: [
    { key: "name", label: "Employment Type", type: "text", required: true },
  ],
  nationalities: [
    { key: "name", label: "Nationality", type: "text", required: true },
  ],
  users: [
    { key: "name", label: "Full Name", type: "text", required: true },
    { key: "email", label: "Email", type: "text", required: true },
    { key: "site", label: "Site", type: "text" },
  ],
};

// ──────────────────────────────────────────────
// Tab config
// ──────────────────────────────────────────────

const tabs: TabDef[] = [
  { key: "dropdowns", label: "Dropdown Config", icon: List },
  { key: "retention", label: "Retention Policy", icon: Clock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "system", label: "System", icon: SettingsIcon },
  { key: "users", label: "User Management", icon: Users },
  { key: "security", label: "Security", icon: Shield },
];

const retentionPeriods = ["Indefinite", "1 year", "3 years", "5 years", "7 years", "10 years", "Custom"];

function getSeverityBorder(severity: string) {
  if (severity === "green") return "border-l-[#1B7A43]";
  if (severity === "amber") return "border-l-[#C27A06]";
  return "border-l-[#B91C1C]";
}

function getSeverityDot(severity: string) {
  if (severity === "green") return "bg-[#1B7A43]";
  if (severity === "amber") return "bg-[#C27A06]";
  return "bg-[#B91C1C]";
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

interface DropdownSectionProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  count: number;
  children: React.ReactNode;
}

function DropdownSection({ title, icon: Icon, iconColor, count, children }: DropdownSectionProps) {
  return (
    <AccordionItem value={title.toLowerCase().replace(/\s/g, "-")} className="border border-[#E5E4E0] rounded-lg mb-3 overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:no-underline bg-[#FAFAF8] [&[data-state=open]]:rounded-b-none">
        <div className="flex items-center gap-3 flex-1">
          <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
          <span className="text-[14px] font-semibold text-[#1A1A1A]">{title}</span>
          <Badge variant="outline" className="bg-[rgba(212,160,23,0.1)] text-[#D4A017] border-0 text-[11px]">{count}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 border-t border-[#E5E4E0]">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

interface InlineTableProps {
  columns: string[];
  rows: (string | React.ReactNode)[][];
  onEdit?: (rowIndex: number) => void;
  onToggleStatus?: (rowIndex: number) => void;
  showToggle?: boolean;
}

function InlineTable({ columns, rows, onEdit, onToggleStatus, showToggle = true }: InlineTableProps) {
  return (
    <div className="border border-[#E5E4E0] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[#FAFAF8] border-b border-[#E5E4E0]">
            {columns.map((col) => (
              <th key={col} className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#525252]">{col}</th>
            ))}
            {(onEdit || onToggleStatus) && <th className="w-[80px]"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#E5E4E0] hover:bg-[#FAFAF8]" style={{ height: "44px" }}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-[13px] text-[#1A1A1A]">{cell}</td>
              ))}
              {(onEdit || onToggleStatus) && (
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#D4A017]" onClick={() => onEdit(i)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {onToggleStatus && showToggle && (
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#B91C1C]" onClick={() => onToggleStatus(i)}>
                        <EyeOff className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + ((onEdit || onToggleStatus) ? 1 : 0)} className="text-center py-6 text-[#9C9C9C] text-[13px]">No items found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

export default function Settings() {
  const [activeTab, setActiveTab] = useState("dropdowns");
  const [hasChanges, setHasChanges] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [userStatusFilter, setUserStatusFilter] = useState("All");

  // ── Dropdown data (all mutable) ──
  const [depts, setDepts] = useState<DropdownItem[]>(mockDepartments);
  const [jobs, setJobs] = useState<DropdownItem[]>(mockJobTitles);
  const [hardware, setHardware] = useState<HardwareItem[]>(mockHardwareCatalog);
  const [software, setSoftware] = useState<SoftwareItem[]>(mockSoftwareList);
  const [clearance, setClearance] = useState<ClearanceLevelItem[]>(mockClearanceLevels);
  const [docTypes, setDocTypes] = useState<DocumentTypeItem[]>(mockDocumentTypes);
  const [empTypes, setEmpTypes] = useState<DropdownItem[]>(mockEmploymentTypes);
  const [nationalities, setNationalities] = useState<DropdownItem[]>(mockNationalities);
  const [retentionPolicies] = useState<RetentionPolicy[]>(mockRetentionPolicies);
  const [notifEvents, setNotifEvents] = useState<NotificationEvent[]>(mockNotificationEvents);
  const [users, setUsers] = useState<SystemUser[]>(mockSystemUsers);

  // ── Add department inline ──
  const [addingDept, setAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  // ── Edit modal ──
  const [edit, setEdit] = useState<EditModalState>(INITIAL_EDIT);

  // ──────────────────────────────────────────────
  // Helpers: get setter + data by section key
  // ──────────────────────────────────────────────

  const sectionMap: Record<string, { data: any[]; setter: (fn: (prev: any[]) => any[]) => void }> = {
    departments: { data: depts, setter: setDepts },
    jobs: { data: jobs, setter: setJobs },
    hardware: { data: hardware, setter: setHardware },
    software: { data: software, setter: setSoftware },
    clearance: { data: clearance, setter: setClearance },
    docTypes: { data: docTypes, setter: setDocTypes },
    empTypes: { data: empTypes, setter: setEmpTypes },
    nationalities: { data: nationalities, setter: setNationalities },
    users: { data: users, setter: setUsers as any },
  };

  // ──────────────────────────────────────────────
  // Edit modal handlers
  // ──────────────────────────────────────────────

  const openEdit = useCallback((section: string, index: number) => {
    const fields = SECTION_FIELDS[section] || [];
    const item = sectionMap[section]?.data[index];
    if (!item) return;

    const values: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = item[f.key];
      // Convert arrays to comma-separated for text fields
      values[f.key] = Array.isArray(raw) ? raw.join(", ") : raw ?? "";
    }
    setEdit({ open: true, section, index, fields, values });
  }, [depts, jobs, hardware, software, clearance, docTypes, empTypes, nationalities, users]);

  function updateEditValue(key: string, value: unknown) {
    setEdit((prev) => ({ ...prev, values: { ...prev.values, [key]: value } }));
  }

  function saveEdit() {
    const { section, index, values } = edit;
    const entry = sectionMap[section];
    if (!entry) return;

    entry.setter((prev: any[]) =>
      prev.map((item: any, i: number) => {
        if (i !== index) return item;
        const updated = { ...item };
        for (const [k, v] of Object.entries(values)) {
          // Convert comma-separated strings back to arrays for accessZones
          if (k === "accessZones" && typeof v === "string") {
            updated[k] = v.split(",").map((s: string) => s.trim()).filter(Boolean);
          } else if (k === "expiryWarningDays") {
            updated[k] = Number(v) || 0;
          } else {
            updated[k] = v;
          }
        }
        return updated;
      })
    );
    setHasChanges(true);
    setEdit(INITIAL_EDIT);
  }

  // ──────────────────────────────────────────────
  // Toggle status (Active ↔ Inactive)
  // ──────────────────────────────────────────────

  function toggleStatus(section: string, index: number) {
    const entry = sectionMap[section];
    if (!entry) return;
    entry.setter((prev: any[]) =>
      prev.map((item: any, i: number) =>
        i === index ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } : item
      )
    );
    setHasChanges(true);
  }

  // ──────────────────────────────────────────────
  // Notification helpers
  // ──────────────────────────────────────────────

  function toggleNotifChannel(eventId: number, channel: keyof NotificationEvent) {
    setNotifEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, [channel]: !e[channel] } : e));
    setHasChanges(true);
  }

  function toggleAllNotifChannel(channel: keyof NotificationEvent, value: boolean) {
    setNotifEvents((prev) => prev.map((e) => ({ ...e, [channel]: value })));
    setHasChanges(true);
  }

  // ──────────────────────────────────────────────
  // Add department
  // ──────────────────────────────────────────────

  function addDept() {
    if (!newDeptName.trim()) return;
    setDepts((prev) => [...prev, { id: prev.length + 1, name: newDeptName, status: "Active" }]);
    setNewDeptName("");
    setAddingDept(false);
    setHasChanges(true);
  }

  // ──────────────────────────────────────────────
  // Save / Reset
  // ──────────────────────────────────────────────

  function handleSave() {
    // TODO: persist to Supabase when wired up
    setHasChanges(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  }

  function handleReset() {
    setDepts(mockDepartments);
    setJobs(mockJobTitles);
    setHardware(mockHardwareCatalog);
    setSoftware(mockSoftwareList);
    setClearance(mockClearanceLevels);
    setDocTypes(mockDocumentTypes);
    setEmpTypes(mockEmploymentTypes);
    setNationalities(mockNationalities);
    setNotifEvents(mockNotificationEvents);
    setUsers(mockSystemUsers);
    setHasChanges(false);
  }

  // ──────────────────────────────────────────────
  // User Management filters
  // ──────────────────────────────────────────────

  const filteredUsers = users.filter((u) => {
    if (userSearch && !u.name.toLowerCase().includes(userSearch.toLowerCase()) && !u.email.toLowerCase().includes(userSearch.toLowerCase())) return false;
    if (userRoleFilter !== "All" && u.roleLabel !== userRoleFilter) return false;
    if (userStatusFilter !== "All" && u.status !== userStatusFilter) return false;
    return true;
  });

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5">
      {/* ── Save toast ── */}
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#1B7A43] text-white px-4 py-2.5 rounded-lg shadow-lg text-[13px] font-medium animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" /> Settings saved successfully
        </div>
      )}

      {/* ── Edit Modal ── */}
      <Dialog open={edit.open} onOpenChange={(open) => !open && setEdit(INITIAL_EDIT)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[#1A1A1A]">
              Edit {edit.section.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {edit.fields.map((field) => (
              <div key={field.key}>
                <label className="text-[13px] font-medium text-[#525252] block mb-1.5">{field.label}</label>
                {field.type === "text" && (
                  <Input
                    value={String(edit.values[field.key] ?? "")}
                    onChange={(e) => updateEditValue(field.key, e.target.value)}
                    className="h-[40px] text-[13px] border-[#E5E4E0]"
                    required={field.required}
                  />
                )}
                {field.type === "number" && (
                  <Input
                    type="number"
                    value={String(edit.values[field.key] ?? "")}
                    onChange={(e) => updateEditValue(field.key, e.target.value)}
                    className="h-[40px] text-[13px] border-[#E5E4E0] w-[120px]"
                  />
                )}
                {field.type === "select" && (
                  <Select value={String(edit.values[field.key] ?? "")} onValueChange={(v) => updateEditValue(field.key, v)}>
                    <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.type === "checkbox" && (
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      checked={!!edit.values[field.key]}
                      onCheckedChange={(v) => updateEditValue(field.key, !!v)}
                      className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]"
                    />
                    <span className="text-[13px] text-[#1A1A1A]">Yes</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-[36px] text-[13px]" onClick={() => setEdit(INITIAL_EDIT)}>
              Cancel
            </Button>
            <Button className="h-[36px] text-[13px] bg-[#D4A017] hover:bg-[#A67C0A] text-white" onClick={saveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] leading-tight tracking-[-0.02em]">Settings</h1>
          <p className="text-[13px] text-[#525252] mt-1">System configuration and administrative preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-[40px] text-[13px] gap-2 text-[#B91C1C] border-[#B91C1C] hover:bg-[#FEF2F2]" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button
            disabled={!hasChanges}
            className={cn("h-[40px] text-[13px] gap-2 text-white", hasChanges ? "bg-[#D4A017] hover:bg-[#A67C0A]" : "bg-[#E5E4E0] text-[#9C9C9C]")}
            onClick={handleSave}
          >
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </div>

      {/* ── Settings Layout: Left tabs + Right content ── */}
      <div className="flex gap-4">
        {/* Left Tab Panel */}
        <div className="w-[220px] shrink-0 bg-white rounded-[10px] border border-[#E5E4E0] p-2 self-start">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 mb-0.5",
                  active ? "bg-[rgba(212,160,23,0.1)] text-[#D4A017] border-l-[3px] border-[#D4A017]" : "text-[#525252] hover:bg-[#FAFAF8] border-l-[3px] border-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 min-w-0">
          {/* ════════ Tab 1: Dropdown Configuration ════════ */}
          {activeTab === "dropdowns" && (
            <div>
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold text-[#1A1A1A]">Dropdown Configuration</h2>
                <p className="text-[12px] text-[#525252]">Manage values for all system dropdowns</p>
              </div>
              <Accordion type="multiple" className="w-full">
                {/* Departments */}
                <DropdownSection title="Departments" icon={List} iconColor="#1E6BA3" count={depts.length}>
                  <InlineTable
                    columns={["#", "Department Name", "Status"]}
                    rows={depts.map((d) => [
                      String(d.id),
                      d.name,
                      <Badge key={d.id} variant="outline" className={cn("text-[11px] border-0", d.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>{d.status}</Badge>,
                    ])}
                    onEdit={(i) => openEdit("departments", i)}
                    onToggleStatus={(i) => toggleStatus("departments", i)}
                  />
                  {addingDept ? (
                    <div className="flex items-center gap-2 mt-3">
                      <Input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="Department name" className="h-[32px] text-[13px] border-[#E5E4E0]" onKeyDown={(e) => e.key === "Enter" && addDept()} />
                      <Button size="sm" className="h-[32px] bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[12px]" onClick={addDept}>Save</Button>
                      <Button size="sm" variant="outline" className="h-[32px] text-[12px]" onClick={() => { setAddingDept(false); setNewDeptName(""); }}>Cancel</Button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingDept(true)} className="flex items-center gap-1 mt-3 text-[13px] text-[#D4A017] font-medium hover:underline">
                      <Plus className="w-4 h-4" /> Add Department
                    </button>
                  )}
                </DropdownSection>

                {/* Job Titles */}
                <DropdownSection title="Job Titles" icon={List} iconColor="#7C3AED" count={jobs.length}>
                  <InlineTable
                    columns={["#", "Job Title", "Department", "Status"]}
                    rows={jobs.map((j) => [
                      String(j.id),
                      j.name,
                      (j as Record<string, unknown>).department as string || "—",
                      <Badge key={j.id} variant="outline" className={cn("text-[11px] border-0", j.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>{j.status}</Badge>,
                    ])}
                    onEdit={(i) => openEdit("jobs", i)}
                    onToggleStatus={(i) => toggleStatus("jobs", i)}
                  />
                </DropdownSection>

                {/* Hardware Catalog */}
                <DropdownSection title="Hardware Catalog" icon={List} iconColor="#166534" count={hardware.length}>
                  <InlineTable
                    columns={["#", "Hardware Type", "Model", "Default Site", "Status"]}
                    rows={hardware.map((h) => [
                      String(h.id),
                      h.type,
                      h.model,
                      h.defaultSite,
                      <Badge key={h.id} variant="outline" className={cn("text-[11px] border-0", h.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>{h.status}</Badge>,
                    ])}
                    onEdit={(i) => openEdit("hardware", i)}
                    onToggleStatus={(i) => toggleStatus("hardware", i)}
                  />
                </DropdownSection>

                {/* Software List */}
                <DropdownSection title="Software List" icon={List} iconColor="#1D4ED8" count={software.length}>
                  <InlineTable
                    columns={["#", "Software Name", "Version", "License Type", "Status"]}
                    rows={software.map((s) => [
                      String(s.id),
                      s.name,
                      s.version,
                      s.licenseType,
                      <Badge key={s.id} variant="outline" className={cn("text-[11px] border-0", s.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>{s.status}</Badge>,
                    ])}
                    onEdit={(i) => openEdit("software", i)}
                    onToggleStatus={(i) => toggleStatus("software", i)}
                  />
                </DropdownSection>

                {/* Clearance Levels */}
                <DropdownSection title="Clearance Levels" icon={List} iconColor="#C27A06" count={clearance.length}>
                  <InlineTable
                    columns={["#", "Level", "Description", "Access Zones", "Status"]}
                    rows={clearance.map((c) => [
                      String(c.id),
                      c.name,
                      c.description,
                      c.accessZones.join(", "),
                      <Badge key={c.id} variant="outline" className={cn("text-[11px] border-0", c.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>{c.status}</Badge>,
                    ])}
                    onEdit={(i) => openEdit("clearance", i)}
                    onToggleStatus={(i) => toggleStatus("clearance", i)}
                  />
                </DropdownSection>

                {/* Document Types */}
                <DropdownSection title="Document Types" icon={List} iconColor="#B91C1C" count={docTypes.length}>
                  <InlineTable
                    columns={["#", "Document Type", "Category", "Warning (days)", "Required", "Status"]}
                    rows={docTypes.map((d) => [
                      String(d.id),
                      d.name,
                      d.category,
                      String(d.expiryWarningDays),
                      d.required ? <Check className="w-4 h-4 text-[#1B7A43]" /> : "—",
                      <Badge key={d.id} variant="outline" className={cn("text-[11px] border-0", d.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>{d.status}</Badge>,
                    ])}
                    onEdit={(i) => openEdit("docTypes", i)}
                    onToggleStatus={(i) => toggleStatus("docTypes", i)}
                  />
                </DropdownSection>

                {/* Employment Types */}
                <DropdownSection title="Employment Types" icon={List} iconColor="#1E6BA3" count={empTypes.length}>
                  <InlineTable
                    columns={["#", "Type", "Status"]}
                    rows={empTypes.map((e) => [
                      String(e.id),
                      e.name,
                      <Badge key={e.id} variant="outline" className={cn("text-[11px] border-0", e.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>{e.status}</Badge>,
                    ])}
                    onEdit={(i) => openEdit("empTypes", i)}
                    onToggleStatus={(i) => toggleStatus("empTypes", i)}
                  />
                </DropdownSection>

                {/* Nationalities */}
                <DropdownSection title="Nationalities" icon={List} iconColor="#6D28D9" count={nationalities.length}>
                  <InlineTable
                    columns={["#", "Nationality", "Status"]}
                    rows={nationalities.map((n) => [
                      String(n.id),
                      n.name,
                      <Badge key={n.id} variant="outline" className={cn("text-[11px] border-0", n.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>{n.status}</Badge>,
                    ])}
                    onEdit={(i) => openEdit("nationalities", i)}
                    onToggleStatus={(i) => toggleStatus("nationalities", i)}
                  />
                </DropdownSection>
              </Accordion>
            </div>
          )}

          {/* ════════ Tab 2: Retention Policy ════════ */}
          {activeTab === "retention" && (
            <div>
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold text-[#1A1A1A]">Data Retention Policy</h2>
                <p className="text-[12px] text-[#525252]">Configure how long different data types are retained</p>
              </div>
              <div className="flex items-start gap-3 bg-[#FDF3E0] border border-[#C27A06] rounded-lg p-4 mb-5">
                <AlertTriangle className="w-[18px] h-[18px] text-[#C27A06] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#C27A06]">Changes to retention policies affect all historical data. Consult legal compliance before modifying.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {retentionPolicies.map((policy) => (
                  <div key={policy.id} className={cn("bg-white rounded-lg border border-[#E5E4E0] p-4 border-l-[3px]", getSeverityBorder(policy.severity))}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("w-2 h-2 rounded-full", getSeverityDot(policy.severity))} />
                          <span className="text-[14px] font-semibold text-[#1A1A1A]">{policy.dataType}</span>
                        </div>
                        <p className="text-[12px] text-[#525252] mb-2">{policy.description}</p>
                        <div className="flex items-center gap-3">
                          <Select defaultValue={policy.period} onValueChange={() => setHasChanges(true)}>
                            <SelectTrigger className="w-[180px] h-[32px] text-[12px] border-[#E5E4E0]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {retentionPeriods.map((p) => (
                                <SelectItem key={p} value={p.toLowerCase().replace(/\s/g, "-")}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-[11px] text-[#9C9C9C]">Last changed: {policy.lastChanged.split("T")[0]} by {policy.changedBy}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════ Tab 3: Notification Preferences ════════ */}
          {activeTab === "notifications" && (
            <div>
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold text-[#1A1A1A]">Notification Preferences</h2>
                <p className="text-[12px] text-[#525252]">Configure who receives notifications and for what events</p>
              </div>
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-3 bg-white rounded-lg border border-[#E5E4E0] overflow-hidden">
                  <div className="grid grid-cols-5 gap-0 border-b border-[#E5E4E0] bg-[#FAFAF8] px-4 py-2.5">
                    <div className="col-span-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Event</div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#525252] text-center">In-App</div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#525252] text-center">Email</div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#525252] text-center">SMS</div>
                  </div>
                  {notifEvents.map((event) => (
                    <div key={event.id} className="grid grid-cols-5 gap-0 px-4 py-2.5 border-b border-[#E5E4E0] hover:bg-[#FAFAF8]">
                      <div className="col-span-2 text-[13px] text-[#1A1A1A]">{event.event}</div>
                      <div className="flex justify-center">
                        <Checkbox checked={event.inApp} disabled className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" />
                      </div>
                      <div className="flex justify-center">
                        <Checkbox checked={event.email} onCheckedChange={() => toggleNotifChannel(event.id, "email")} className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" />
                      </div>
                      <div className="flex justify-center">
                        <Checkbox checked={event.sms} onCheckedChange={() => toggleNotifChannel(event.id, "sms")} className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 px-4 py-2.5 bg-[#FAFAF8]">
                    <span className="text-[12px] text-[#525252]">Toggle all:</span>
                    <Button variant="ghost" size="sm" className="h-[28px] text-[11px] text-[#D4A017]" onClick={() => toggleAllNotifChannel("email", true)}>Email On</Button>
                    <Button variant="ghost" size="sm" className="h-[28px] text-[11px] text-[#737373]" onClick={() => toggleAllNotifChannel("email", false)}>Email Off</Button>
                    <Button variant="ghost" size="sm" className="h-[28px] text-[11px] text-[#D4A017]" onClick={() => toggleAllNotifChannel("sms", true)}>SMS On</Button>
                    <Button variant="ghost" size="sm" className="h-[28px] text-[11px] text-[#737373]" onClick={() => toggleAllNotifChannel("sms", false)}>SMS Off</Button>
                  </div>
                </div>

                <div className="col-span-2 space-y-4">
                  <div className="bg-white rounded-lg border border-[#E5E4E0] p-4">
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A] mb-3">Notification Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] font-medium text-[#525252] block mb-1">Email sender name</label>
                        <Input defaultValue="Magaya Mining ELMS" className="h-[36px] text-[13px] border-[#E5E4E0]" onChange={() => setHasChanges(true)} />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-[#525252] block mb-1">Email footer</label>
                        <Textarea defaultValue="This is an automated message from Magaya Mining ELMS." className="min-h-[60px] text-[13px] border-[#E5E4E0]" onChange={() => setHasChanges(true)} />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-[#525252] block mb-1">Digest frequency</label>
                        <Select defaultValue="daily" onValueChange={() => setHasChanges(true)}>
                          <SelectTrigger className="h-[36px] text-[13px] border-[#E5E4E0]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-[#525252] block mb-1">Digest time</label>
                        <Input type="time" defaultValue="08:00" className="h-[36px] text-[13px] border-[#E5E4E0]" onChange={() => setHasChanges(true)} />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-[#525252] block mb-1">Max retries</label>
                        <Input type="number" defaultValue={3} className="h-[36px] text-[13px] border-[#E5E4E0] w-[80px]" onChange={() => setHasChanges(true)} />
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-[12px] h-[36px]">
                    Send Test Notification
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ════════ Tab 4: System Settings ════════ */}
          {activeTab === "system" && (
            <div className="space-y-5">
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold text-[#1A1A1A]">System Settings</h2>
                <p className="text-[12px] text-[#525252]">General system configuration</p>
              </div>
              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">General</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">System Name</label>
                    <Input defaultValue="Magaya Mining ELMS" className="h-[40px] text-[13px] border-[#E5E4E0]" onChange={() => setHasChanges(true)} />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Timezone</label>
                    <Select defaultValue="harare" onValueChange={() => setHasChanges(true)}>
                      <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="harare">Africa/Harare</SelectItem>
                        <SelectItem value="johannesburg">Africa/Johannesburg</SelectItem>
                        <SelectItem value="london">Europe/London</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Date Format</label>
                    <Select defaultValue="ddmmyyyy" onValueChange={() => setHasChanges(true)}>
                      <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ddmmyyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mmddyyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyymmdd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Currency</label>
                    <Select defaultValue="usd" onValueChange={() => setHasChanges(true)}>
                      <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="zwl">ZWL</SelectItem>
                        <SelectItem value="zar">ZAR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Branding</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Company Logo</label>
                    <div className="border-2 border-dashed border-[#E5E4E0] rounded-lg p-6 text-center hover:border-[#D4A017] hover:bg-[rgba(212,160,23,0.03)] transition-colors cursor-pointer">
                      <div className="text-[12px] text-[#525252]">Drag & drop or click to upload</div>
                      <div className="text-[11px] text-[#9C9C9C] mt-1">PNG, JPG up to 2MB</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#D4A017] border border-[#E5E4E0] cursor-pointer" title="Gold" />
                      <div className="w-10 h-10 rounded-lg bg-[#1E6BA3] border border-[#E5E4E0] cursor-pointer" title="Blue" />
                      <div className="w-10 h-10 rounded-lg bg-[#1B7A43] border border-[#E5E4E0] cursor-pointer" title="Green" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Default Page Size</label>
                    <Select defaultValue="25" onValueChange={() => setHasChanges(true)}>
                      <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0] w-[120px]"><SelectValue /></SelectTrigger>
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

              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Backup & Maintenance</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch defaultChecked />
                    <span className="text-[13px] text-[#1A1A1A]">Auto-backup</span>
                    <Select defaultValue="daily">
                      <SelectTrigger className="h-[32px] text-[12px] border-[#E5E4E0] w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch />
                    <span className="text-[13px] text-[#1A1A1A]">Maintenance mode</span>
                    <span className="text-[11px] text-[#B91C1C]">(Danger - restricts access)</span>
                  </div>
                  <p className="text-[12px] text-[#9C9C9C]">Last backup: 2024-01-28 03:00 AM</p>
                </div>
              </div>
            </div>
          )}

          {/* ════════ Tab 5: User Management ════════ */}
          {activeTab === "users" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[20px] font-semibold text-[#1A1A1A]">User Management</h2>
                  <p className="text-[12px] text-[#525252]">Manage system users and their roles</p>
                </div>
                <Button className="bg-[#D4A017] hover:bg-[#A67C0A] text-white h-[36px] text-[13px] gap-2">
                  <Plus className="w-4 h-4" /> Add User
                </Button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]" />
                  <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9 w-[200px] h-[36px] text-[13px] border-[#E5E4E0]" />
                </div>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-[150px] h-[36px] text-[13px] border-[#E5E4E0]"><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    {Array.from(new Set(users.map((u) => u.roleLabel))).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                  <SelectTrigger className="w-[140px] h-[36px] text-[13px] border-[#E5E4E0]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-white rounded-lg border border-[#E5E4E0] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAFAF8] border-b border-[#E5E4E0]">
                      <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">User</th>
                      <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Role</th>
                      <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Site</th>
                      <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Status</th>
                      <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Last Login</th>
                      <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      // Find the real index in the full users array for editing
                      const realIndex = users.findIndex((usr) => usr.id === u.id);
                      return (
                        <tr key={u.id} className="border-b border-[#E5E4E0] hover:bg-[#FAFAF8]" style={{ height: "52px" }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[11px] font-semibold">
                                {u.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div>
                                <div className="text-[13px] font-medium text-[#1A1A1A]">{u.name}</div>
                                <div className="text-[11px] text-[#9C9C9C]">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[11px] border-0 bg-[#E8F2FA] text-[#1E6BA3]">{u.roleLabel}</Badge>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-[#525252]">{u.site}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("text-[11px] border-0", u.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>{u.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-[#9C9C9C]">{u.lastLogin ? u.lastLogin.replace("T", " ").substring(0, 16) : "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-[28px] text-[11px] text-[#D4A017]" onClick={() => openEdit("users", realIndex)}>Edit</Button>
                              <Button variant="ghost" size="sm" className="h-[28px] text-[11px] text-[#B91C1C]" onClick={() => toggleStatus("users", realIndex)}>
                                {u.status === "Active" ? "Disable" : "Enable"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-[#9C9C9C]">No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════ Tab 6: Security Settings ════════ */}
          {activeTab === "security" && (
            <div className="space-y-5">
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold text-[#1A1A1A]">Security Settings</h2>
                <p className="text-[12px] text-[#525252]">Password policy, session management, and access control</p>
              </div>

              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Password Policy</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Minimum Length</label>
                    <Input type="number" defaultValue={8} className="h-[40px] text-[13px] border-[#E5E4E0] w-[80px]" onChange={() => setHasChanges(true)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox defaultChecked className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" onCheckedChange={() => setHasChanges(true)} />
                      <span className="text-[13px] text-[#1A1A1A]">Require uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox defaultChecked className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" onCheckedChange={() => setHasChanges(true)} />
                      <span className="text-[13px] text-[#1A1A1A]">Require lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox defaultChecked className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" onCheckedChange={() => setHasChanges(true)} />
                      <span className="text-[13px] text-[#1A1A1A]">Require number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" onCheckedChange={() => setHasChanges(true)} />
                      <span className="text-[13px] text-[#1A1A1A]">Require special character</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Session & Login</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Session Timeout</label>
                    <Select defaultValue="30" onValueChange={() => setHasChanges(true)}>
                      <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Max Login Attempts</label>
                    <Input type="number" defaultValue={5} className="h-[40px] text-[13px] border-[#E5E4E0] w-[80px]" onChange={() => setHasChanges(true)} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch onCheckedChange={() => setHasChanges(true)} />
                    <span className="text-[13px] text-[#1A1A1A]">Require 2FA</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">IP Whitelist</h3>
                <Textarea placeholder={"Enter one IP per line...\n192.168.1.0/24\n10.0.0.0/8"} className="min-h-[100px] text-[13px] border-[#E5E4E0] font-mono" onChange={() => setHasChanges(true)} />
                <p className="text-[11px] text-[#9C9C9C] mt-2">Leave empty to allow all IPs. One IP or CIDR range per line.</p>
              </div>

              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">API Keys</h3>
                <div className="flex items-center gap-3">
                  <Input defaultValue="magaya_prod_••••••••••••a3f8" readOnly className="h-[40px] text-[13px] border-[#E5E4E0] bg-[#FAFAF8] font-mono flex-1" type="password" />
                  <Button variant="outline" size="sm" className="h-[36px] text-[12px]">Show</Button>
                  <Button variant="outline" size="sm" className="h-[36px] text-[12px] text-[#B91C1C] border-[#B91C1C] hover:bg-[#FEF2F2]">Regenerate</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
