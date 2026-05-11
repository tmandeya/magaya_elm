import { useState } from "react";
import { List, Clock, Bell, Settings as SettingsIcon, Users, Shield, Plus, Pencil, EyeOff, Search, Save, RotateCcw, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
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
  type RetentionPolicy,
  type NotificationEvent,
} from "@/data/adminData";

interface TabDef { key: string; label: string; icon: React.ElementType; }

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
  actions?: ((rowIndex: number) => React.ReactNode)[];
}

function InlineTable({ columns, rows, actions }: InlineTableProps) {
  return (
    <div className="border border-[#E5E4E0] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[#FAFAF8] border-b border-[#E5E4E0]">
            {columns.map((col) => (
              <th key={col} className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#525252]">{col}</th>
            ))}
            {actions && <th className="w-[80px]"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#E5E4E0] hover:bg-[#FAFAF8]" style={{ height: "44px" }}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-[13px] text-[#1A1A1A]">{cell}</td>
              ))}
              {actions && (
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {actions.map((action, k) => (
                      <span key={k}>{action(i)}</span>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-6 text-[#9C9C9C] text-[13px]">No items found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("dropdowns");
  const [hasChanges, setHasChanges] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [userStatusFilter, setUserStatusFilter] = useState("All");

  const [depts, setDepts] = useState(mockDepartments);
  const [jobs] = useState(mockJobTitles);
  const [hardware] = useState(mockHardwareCatalog);
  const [software] = useState(mockSoftwareList);
  const [clearance] = useState(mockClearanceLevels);
  const [docTypes] = useState(mockDocumentTypes);
  const [empTypes] = useState(mockEmploymentTypes);
  const [nationalities] = useState(mockNationalities);
  const [retentionPolicies] = useState<RetentionPolicy[]>(mockRetentionPolicies);
  const [notifEvents, setNotifEvents] = useState<NotificationEvent[]>(mockNotificationEvents);

  const [addingDept, setAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  const filteredUsers = mockSystemUsers.filter((u) => {
    if (userSearch && !u.name.toLowerCase().includes(userSearch.toLowerCase()) && !u.email.toLowerCase().includes(userSearch.toLowerCase())) return false;
    if (userRoleFilter !== "All" && u.roleLabel !== userRoleFilter) return false;
    if (userStatusFilter !== "All" && u.status !== userStatusFilter) return false;
    return true;
  });

  function toggleNotifChannel(eventId: number, channel: keyof NotificationEvent) {
    setNotifEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, [channel]: !e[channel] } : e));
    setHasChanges(true);
  }

  function toggleAllNotifChannel(channel: keyof NotificationEvent, value: boolean) {
    setNotifEvents((prev) => prev.map((e) => ({ ...e, [channel]: value })));
    setHasChanges(true);
  }

  function addDept() {
    if (!newDeptName.trim()) return;
    setDepts((prev) => [...prev, { id: prev.length + 1, name: newDeptName, status: "Active" }]);
    setNewDeptName("");
    setAddingDept(false);
    setHasChanges(true);
  }

  return (
    <div className="p-6 space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] leading-tight tracking-[-0.02em]">Settings</h1>
          <p className="text-[13px] text-[#525252] mt-1">System configuration and administrative preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-[40px] text-[13px] gap-2 text-[#B91C1C] border-[#B91C1C] hover:bg-[#FEF2F2]">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button disabled={!hasChanges} className={cn("h-[40px] text-[13px] gap-2 text-white", hasChanges ? "bg-[#D4A017] hover:bg-[#A67C0A]" : "bg-[#E5E4E0] text-[#9C9C9C]")}>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Layout: Left tabs + Right content */}
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
          {/* Tab 1: Dropdown Configuration */}
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
                    actions={[
                      () => <Button key="edit" variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#D4A017]"><Pencil className="w-3.5 h-3.5" /></Button>,
                      () => <Button key="deact" variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#B91C1C]"><EyeOff className="w-3.5 h-3.5" /></Button>,
                    ]}
                  />
                  {addingDept ? (
                    <div className="flex items-center gap-2 mt-3">
                      <Input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="Department name" className="h-[32px] text-[13px] border-[#E5E4E0]" />
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
                    actions={[
                      () => <Button key="edit" variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#D4A017]"><Pencil className="w-3.5 h-3.5" /></Button>,
                      () => <Button key="deact" variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#B91C1C]"><EyeOff className="w-3.5 h-3.5" /></Button>,
                    ]}
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
                    actions={[
                      () => <Button key="edit" variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#D4A017]"><Pencil className="w-3.5 h-3.5" /></Button>,
                    ]}
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
                    actions={[
                      () => <Button key="edit" variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#D4A017]"><Pencil className="w-3.5 h-3.5" /></Button>,
                    ]}
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
                    actions={[
                      () => <Button key="edit" variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#D4A017]"><Pencil className="w-3.5 h-3.5" /></Button>,
                    ]}
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
                    actions={[
                      () => <Button key="edit" variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#D4A017]"><Pencil className="w-3.5 h-3.5" /></Button>,
                    ]}
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
                    actions={[
                      () => <Button key="edit" variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#D4A017]"><Pencil className="w-3.5 h-3.5" /></Button>,
                    ]}
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
                    actions={[
                      () => <Button key="edit" variant="ghost" size="icon" className="w-7 h-7 text-[#9C9C9C] hover:text-[#D4A017]"><Pencil className="w-3.5 h-3.5" /></Button>,
                    ]}
                  />
                </DropdownSection>
              </Accordion>
            </div>
          )}

          {/* Tab 2: Retention Policy */}
          {activeTab === "retention" && (
            <div>
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold text-[#1A1A1A]">Data Retention Policy</h2>
                <p className="text-[12px] text-[#525252]">Configure how long different data types are retained</p>
              </div>
              {/* Warning Banner */}
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
                          <Select defaultValue={policy.period}>
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

          {/* Tab 3: Notification Preferences */}
          {activeTab === "notifications" && (
            <div>
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold text-[#1A1A1A]">Notification Preferences</h2>
                <p className="text-[12px] text-[#525252]">Configure who receives notifications and for what events</p>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {/* Left: Event matrix */}
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

                {/* Right: Settings */}
                <div className="col-span-2 space-y-4">
                  <div className="bg-white rounded-lg border border-[#E5E4E0] p-4">
                    <h3 className="text-[14px] font-semibold text-[#1A1A1A] mb-3">Notification Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] font-medium text-[#525252] block mb-1">Email sender name</label>
                        <Input defaultValue="Magaya Mining ELMS" className="h-[36px] text-[13px] border-[#E5E4E0]" />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-[#525252] block mb-1">Email footer</label>
                        <Textarea defaultValue="This is an automated message from Magaya Mining ELMS." className="min-h-[60px] text-[13px] border-[#E5E4E0]" />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-[#525252] block mb-1">Digest frequency</label>
                        <Select defaultValue="daily">
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
                        <Input type="time" defaultValue="08:00" className="h-[36px] text-[13px] border-[#E5E4E0]" />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-[#525252] block mb-1">Max retries</label>
                        <Input type="number" defaultValue={3} className="h-[36px] text-[13px] border-[#E5E4E0] w-[80px]" />
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

          {/* Tab 4: System Settings */}
          {activeTab === "system" && (
            <div className="space-y-5">
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold text-[#1A1A1A]">System Settings</h2>
                <p className="text-[12px] text-[#525252]">General system configuration</p>
              </div>
              {/* General */}
              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">General</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">System Name</label>
                    <Input defaultValue="Magaya Mining ELMS" className="h-[40px] text-[13px] border-[#E5E4E0]" />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Timezone</label>
                    <Select defaultValue="harare">
                      <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="harare">Africa/Harare</SelectItem>
                        <SelectItem value="johannesburg">Africa/Johannesburg</SelectItem>
                        <SelectItem value="london">Europe/London</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Date Format</label>
                    <Select defaultValue="ddmmyyyy">
                      <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ddmmyyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mmddyyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyymmdd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Currency</label>
                    <Select defaultValue="usd">
                      <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="zwl">ZWL</SelectItem>
                        <SelectItem value="zar">ZAR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Branding */}
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
                    <Select defaultValue="25">
                      <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0] w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
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

              {/* Backup */}
              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Backup & Maintenance</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch defaultChecked />
                    <span className="text-[13px] text-[#1A1A1A]">Auto-backup</span>
                    <Select defaultValue="daily">
                      <SelectTrigger className="h-[32px] text-[12px] border-[#E5E4E0] w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
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

          {/* Tab 5: User Management */}
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
              {/* Filters */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]" />
                  <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9 w-[200px] h-[36px] text-[13px] border-[#E5E4E0]" />
                </div>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-[150px] h-[36px] text-[13px] border-[#E5E4E0]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    {Array.from(new Set(mockSystemUsers.map((u) => u.roleLabel))).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                  <SelectTrigger className="w-[140px] h-[36px] text-[13px] border-[#E5E4E0]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Users Table */}
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
                    {filteredUsers.map((u) => (
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
                            <Button variant="ghost" size="sm" className="h-[28px] text-[11px] text-[#D4A017]">Edit</Button>
                            <Button variant="ghost" size="sm" className="h-[28px] text-[11px] text-[#B91C1C]">Disable</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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

          {/* Tab 6: Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-5">
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold text-[#1A1A1A]">Security Settings</h2>
                <p className="text-[12px] text-[#525252]">Password policy, session management, and access control</p>
              </div>

              {/* Password Policy */}
              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Password Policy</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Minimum Length</label>
                    <Input type="number" defaultValue={8} className="h-[40px] text-[13px] border-[#E5E4E0] w-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox defaultChecked className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" />
                      <span className="text-[13px] text-[#1A1A1A]">Require uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox defaultChecked className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" />
                      <span className="text-[13px] text-[#1A1A1A]">Require lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox defaultChecked className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" />
                      <span className="text-[13px] text-[#1A1A1A]">Require number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox className="data-[state=checked]:bg-[#D4A017] data-[state=checked]:border-[#D4A017]" />
                      <span className="text-[13px] text-[#1A1A1A]">Require special character</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session & Login */}
              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Session & Login</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Session Timeout</label>
                    <Select defaultValue="30">
                      <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0]">
                        <SelectValue />
                      </SelectTrigger>
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
                    <Input type="number" defaultValue={5} className="h-[40px] text-[13px] border-[#E5E4E0] w-[80px]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch />
                    <span className="text-[13px] text-[#1A1A1A]">Require 2FA</span>
                  </div>
                </div>
              </div>

              {/* IP Whitelist */}
              <div className="bg-white rounded-lg border border-[#E5E4E0] p-5">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">IP Whitelist</h3>
                <Textarea placeholder="Enter one IP per line...&#10;192.168.1.0/24&#10;10.0.0.0/8" className="min-h-[100px] text-[13px] border-[#E5E4E0] font-mono" />
                <p className="text-[11px] text-[#9C9C9C] mt-2">Leave empty to allow all IPs. One IP or CIDR range per line.</p>
              </div>

              {/* API Keys */}
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
