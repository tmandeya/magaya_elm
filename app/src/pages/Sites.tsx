import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Eye, Building2, UserCircle2, Shield, Monitor, UserCog, Briefcase, Crown, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { personnelRoles, roleRingColors } from "@/data/adminData";
import { useSites, type LiveSiteDetail as SiteDetail } from "@/hooks/useSites";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const GENDER_DATA = [
  { name: "Male", value: 68, color: "#1E6BA3" },
  { name: "Female", value: 30, color: "#D4A017" },
  { name: "Not Specified", value: 2, color: "#E5E4E0" },
];





function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function Sites() {
  const { sites: liveSites, profiles, loading, error: loadError, addSite, setSiteActive, setApprovalToggles, assignPersonnel } = useSites();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [personnelFilter, setPersonnelFilter] = useState("All");
  const [selectedSite, setSelectedSite] = useState<SiteDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pendingAssign, setPendingAssign] = useState<Record<string, string>>({});
  const [addOpen, setAddOpen] = useState(false);

  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteLocation, setNewSiteLocation] = useState("");
  const [newSiteAddress, setNewSiteAddress] = useState("");
  const [newSiteStatus, setNewSiteStatus] = useState(true);
  const sitesList = liveSites;

  const filteredSites = useMemo(() => {
    let list = [...sitesList];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (personnelFilter === "Complete") {
      list = list.filter((s) => s.personnelCount === 6);
    }
    if (personnelFilter === "Incomplete") {
      list = list.filter((s) => s.personnelCount < 6);
    }
    return list;
  }, [sitesList, searchQuery, statusFilter, personnelFilter]);

  function openDetail(site: SiteDetail) {
    setSelectedSite(site);
    setDetailOpen(true);
  }

  async function handleAddSite() {
    if (!newSiteName.trim() || busy) return;
    setBusy(true);
    setActionError(null);
    const err = await addSite({ name: newSiteName, location: newSiteLocation, address: newSiteAddress, active: newSiteStatus });
    setBusy(false);
    if (err) { setActionError(err); return; }
    setAddOpen(false);
    setNewSiteName("");
    setNewSiteLocation("");
    setNewSiteAddress("");
  }

  const roleIcons: Record<string, React.ElementType> = {
    hr: UserCircle2,
    it: Monitor,
    security: Shield,
    admin: UserCog,
    hod: Briefcase,
    gm: Crown,
  };

  return (
    <div className="p-6 space-y-5">
      {loading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[#E5E4E0] bg-white">
          <div className="w-5 h-5 border-[3px] border-[#E5E4E0] border-t-[#D4A017] rounded-full animate-spin" />
          <span className="text-[13px] text-[#9C9C9C]">Loading sites...</span>
        </div>
      )}
      {loadError && (
        <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">Failed to load sites: {loadError}</div>
      )}
      {actionError && (
        <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C] flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[#B91C1C] hover:text-[#991B1B] text-[12px] font-medium">Dismiss</button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] leading-tight tracking-[-0.02em]">Sites Management</h1>
          <p className="text-[13px] text-[#525252] mt-1">Manage operational sites, key personnel, and approval configurations</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-[#D4A017] hover:bg-[#A67C0A] text-white h-[40px] px-4 gap-2">
          <Plus className="w-4 h-4" /> Add Site
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-[10px] border border-[#E5E4E0]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]" />
          <Input placeholder="Search by site name, location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-[240px] h-[36px] border-[#E5E4E0] text-[13px]" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-[36px] text-[13px] border-[#E5E4E0]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={personnelFilter} onValueChange={setPersonnelFilter}>
          <SelectTrigger className="w-[160px] h-[36px] text-[13px] border-[#E5E4E0]">
            <SelectValue placeholder="Personnel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Personnel</SelectItem>
            <SelectItem value="Complete">Complete (6 roles)</SelectItem>
            <SelectItem value="Incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sites Table */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#E5E4E0]">
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Site Name</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Location</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Employees</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Key Personnel</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Approval Stages</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Status</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => {
                const personnel = site.personnel;
                const assignedCount = personnel ? Object.keys(personnel).length : 0;
                return (
                  <tr key={site.id} className="border-b border-[#E5E4E0] hover:bg-[#FAFAF8] transition-colors" style={{ height: "64px" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-[#1A1A1A]">{site.name}</span>
                      </div>
                      <span className="text-[11px] text-[#9C9C9C]">{site.address}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#525252]">{site.location || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-[14px] font-semibold text-[#1A1A1A]">{site.employees}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center -space-x-2">
                        {personnelRoles.map((role) => {
                          const assigned = personnel?.[role.key];
                          if (assigned) {
                            return (
                              <div key={role.key} className={cn("relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ring-2 ring-white", roleRingColors[role.color])} style={{ backgroundColor: role.color === "gm" ? "#1A1A1A" : undefined }} title={`${role.label}: ${assigned.name}`}>
                                {getInitials(assigned.name)}
                              </div>
                            );
                          }
                          return (
                            <div key={role.key} className="w-7 h-7 rounded-full bg-[#E5E4E0] flex items-center justify-center ring-2 ring-white" title={`${role.label}: Not assigned`}>
                              <span className="text-[#9C9C9C] text-[10px]">+</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {assignedCount === 6 ? <Check className="w-3.5 h-3.5 text-[#1B7A43]" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#C27A06]" />}
                        <span className="text-[12px] text-[#1B7A43]">{site.approvalStages} stages configured</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[11px] font-semibold h-[24px] border-0", site.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>
                        {site.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-[#9C9C9C] hover:text-[#D4A017]" onClick={() => openDetail(site)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-[#9C9C9C] hover:text-[#D4A017]" onClick={() => openDetail(site)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSites.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#9C9C9C]">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-[16px] font-semibold text-[#1A1A1A]">No sites found</p>
                    <p className="text-[13px] text-[#525252]">Try adjusting your search or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Site Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-[960px] max-h-[85vh] overflow-y-auto p-0 gap-0">
          {selectedSite && (
            <>
              <DialogHeader className="px-6 py-4 border-b border-[#E5E4E0]">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-[20px] font-semibold">{selectedSite.name}</DialogTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn("text-[11px] font-semibold h-[24px] border-0", selectedSite.status === "Active" ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>
                      {selectedSite.status}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              <div className="px-6 py-4">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full border-b border-[#E5E4E0] rounded-none h-auto p-0 bg-transparent">
                    {["overview", "personnel", "approval", "statistics"].map((tab) => (
                      <TabsTrigger key={tab} value={tab} className="flex-1 capitalize text-[13px] font-medium py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4A017] data-[state=active]:text-[#D4A017] data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                        {tab === "overview" ? "Overview" : tab === "personnel" ? "Key Personnel" : tab === "approval" ? "Approval Config" : "Statistics"}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-4">
                    <div className="grid grid-cols-5 gap-6">
                      <div className="col-span-3 space-y-4">
                        <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Site Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Site Name</label>
                            <Input defaultValue={selectedSite.name} className="h-[40px] border-[#E5E4E0] text-[13px]" />
                          </div>
                          <div>
                            <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Location</label>
                            <Input defaultValue={selectedSite.location} className="h-[40px] border-[#E5E4E0] text-[13px]" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Address</label>
                            <Input defaultValue={selectedSite.address} className="h-[40px] border-[#E5E4E0] text-[13px]" />
                          </div>

                          <div>
                            <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Date Added</label>
                            <Input type="date" defaultValue={selectedSite.established} readOnly className="h-[40px] border-[#E5E4E0] text-[13px] bg-[#FAFAF8]" />
                          </div>
                          <div className="col-span-2 flex items-center gap-3">
                            <label className="text-[13px] font-medium text-[#525252]">Status</label>
                            <Switch checked={selectedSite.status === "Active"} disabled={busy}
                              onCheckedChange={async (v) => { setBusy(true); const err = await setSiteActive(selectedSite.id, v); setBusy(false); if (err) setActionError(err); else setSelectedSite({ ...selectedSite, status: v ? "Active" : "Inactive" }); }} />
                            <span className="text-[13px] text-[#525252]">{selectedSite.status === "Active" ? "Active" : "Inactive"}</span>
                          </div>

                        </div>
                      </div>
                      <div className="col-span-2 space-y-3">
                        <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Quick Stats</h3>
                        <div className="bg-[#FAFAF8] rounded-lg p-4 border-l-[3px] border-[#D4A017]">
                          <div className="text-[12px] text-[#525252] uppercase tracking-wider">Active Employees</div>
                          <div className="text-[24px] font-bold text-[#1B7A43] mt-1">{selectedSite.employees}</div>
                        </div>
                        <div className="bg-[#FAFAF8] rounded-lg p-4 border-l-[3px] border-[#C27A06]">
                          <div className="text-[12px] text-[#525252] uppercase tracking-wider">Open Workflows</div>
                          <div className="text-[13px] text-[#C27A06] mt-1 font-medium">
                            {selectedSite.workflows.onboarding} onboarding, {selectedSite.workflows.offboarding} offboarding, {selectedSite.workflows.transfers} transfer
                          </div>
                        </div>
                        <div className="bg-[#FAFAF8] rounded-lg p-4 border-l-[3px] border-[#1E6BA3]">
                          <div className="text-[12px] text-[#525252] uppercase tracking-wider">Personnel Assigned</div>
                          <div className="text-[13px] text-[#1E6BA3] mt-1 font-medium">
                            {selectedSite.personnelCount} of 6 roles
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Personnel Tab */}
                  <TabsContent value="personnel" className="mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      {personnelRoles.map((role) => {
                        const assigned = selectedSite.personnel[role.key];
                        const RoleIcon = roleIcons[role.color] || UserCircle2;
                        return (
                          <div key={role.key} className="bg-[#FAFAF8] rounded-lg border border-[#E5E4E0] p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", role.color === "hr" ? "bg-[#FEF2F2]" : role.color === "it" ? "bg-[#F3E8FF]" : role.color === "security" ? "bg-[#E8F2FA]" : role.color === "admin" ? "bg-[#F0FDF4]" : role.color === "hod" ? "bg-[#FFF7ED]" : "bg-[#1A1A1A]")}>
                                <RoleIcon className={cn("w-5 h-5", role.color === "gm" ? "text-[#D4A017]" : role.color === "hr" ? "text-[#B91C1C]" : role.color === "it" ? "text-[#7C3AED]" : role.color === "security" ? "text-[#1E6BA3]" : role.color === "admin" ? "text-[#166534]" : "text-[#C27A06]")} />
                              </div>
                              <span className="text-[14px] font-semibold text-[#1A1A1A]">{role.label}</span>
                            </div>
                            {assigned ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[13px] font-semibold">
                                    {getInitials(assigned.name)}
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-medium text-[#1A1A1A]">{assigned.name}</div>
                                    <div className="text-[11px] text-[#9C9C9C]">{assigned.code}</div>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" disabled={busy} className="w-full text-[12px] h-[32px] text-[#B91C1C] border-[#B91C1C] hover:bg-[#FEF2F2]"
                                  onClick={async () => { setBusy(true); const err = await assignPersonnel(selectedSite.id, role.key, null); setBusy(false); if (err) setActionError(err); else setSelectedSite({ ...selectedSite, personnel: { ...selectedSite.personnel, [role.key]: undefined }, personnelCount: selectedSite.personnelCount - 1 }); }}>
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-[12px] text-[#9C9C9C]">Not assigned</p>
                                <Select value={pendingAssign[role.key] ?? ""} onValueChange={(v) => setPendingAssign((p) => ({ ...p, [role.key]: v }))}>
                                  <SelectTrigger className="h-[32px] text-[12px] border-[#E5E4E0]">
                                    <SelectValue placeholder="Select user..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {profiles.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" disabled={busy || !pendingAssign[role.key]} className="w-full text-[12px] h-[32px] bg-[#D4A017] hover:bg-[#A67C0A] text-white"
                                  onClick={async () => {
                                    const pid = pendingAssign[role.key];
                                    if (!pid) return;
                                    setBusy(true);
                                    const err = await assignPersonnel(selectedSite.id, role.key, pid);
                                    setBusy(false);
                                    if (err) { setActionError(err); return; }
                                    const prof = profiles.find((p) => p.id === pid);
                                    setSelectedSite({ ...selectedSite, personnel: { ...selectedSite.personnel, [role.key]: { name: prof?.name ?? "User", code: "" } }, personnelCount: selectedSite.personnelCount + 1 });
                                  }}>
                                  Assign
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* Approval Config Tab */}
                  <TabsContent value="approval" className="mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Approval Chain Configuration</h3>
                        <span className="text-[12px] text-[#525252]">{selectedSite.approvalStages} stages configured</span>
                      </div>
                      {[
                        { n: 1, name: "HR Initiation", dept: "Human Resources", always: true },
                        { n: 2, name: "Security Clearance", dept: "Security", always: true },
                        { n: 3, name: "IT Provisioning / Clearance", dept: "Information Technology", always: true },
                        { n: 4, name: "Admin Setup / Clearance", dept: "Administration", always: true },
                        { n: 5, name: "HOD Sign-off", dept: "Head of Department", always: false, toggle: "hod" },
                        { n: 6, name: "HR Completion", dept: "Human Resources", always: true },
                      ].map((stage) => {
                        const enabled = stage.always || (stage.toggle === "hod" ? selectedSite.hodEnabled : false);
                        return (
                          <div key={stage.n} className={cn("flex items-center gap-4 rounded-lg p-4 border", enabled ? "bg-[#FAFAF8] border-[#E5E4E0]" : "bg-white border-dashed border-[#E5E4E0] opacity-60")}>
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0", enabled ? "bg-[#D4A017]" : "bg-[#C4C3BF]")}>{stage.n}</div>
                            <div className="flex-1">
                              <div className="text-[14px] font-semibold text-[#1A1A1A]">{stage.name}</div>
                              <div className="text-[12px] text-[#525252]">{stage.dept}</div>
                            </div>
                            {stage.always ? (
                              <div className="flex items-center gap-1 text-[12px] text-[#1B7A43]"><Check className="w-3.5 h-3.5" /> Standard</div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] text-[#525252]">{enabled ? "Enabled" : "Disabled"}</span>
                                <Switch checked={selectedSite.hodEnabled} disabled={busy}
                                  onCheckedChange={async (v) => { setBusy(true); const err = await setApprovalToggles(selectedSite.id, v, selectedSite.gmEnabled); setBusy(false); if (err) setActionError(err); else setSelectedSite({ ...selectedSite, hodEnabled: v, approvalStages: 5 + (v ? 1 : 0) }); }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex items-center gap-4 rounded-lg p-4 border bg-[#FAFAF8] border-[#E5E4E0] mt-2">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#D4A017] text-[13px] font-bold shrink-0">GM</div>
                        <div className="flex-1">
                          <div className="text-[14px] font-semibold text-[#1A1A1A]">Site GM Approval (Transfers)</div>
                          <div className="text-[12px] text-[#525252]">Required before HR finalises a transfer at this site</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-[#525252]">{selectedSite.gmEnabled ? "Enabled" : "Disabled"}</span>
                          <Switch checked={selectedSite.gmEnabled} disabled={busy}
                            onCheckedChange={async (v) => { setBusy(true); const err = await setApprovalToggles(selectedSite.id, selectedSite.hodEnabled, v); setBusy(false); if (err) setActionError(err); else setSelectedSite({ ...selectedSite, gmEnabled: v }); }} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Statistics Tab */}
                  <TabsContent value="statistics" className="mt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg border border-[#E5E4E0] p-4">
                        <h4 className="text-[13px] font-semibold text-[#525252] mb-3">Employees by Department</h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={selectedSite.deptData.map((d) => ({ name: d.name, count: d.value }))} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#525252" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                            <Bar dataKey="count" fill="#D4A017" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-white rounded-lg border border-[#E5E4E0] p-4">
                        <h4 className="text-[13px] font-semibold text-[#525252] mb-3">Gender Distribution</h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={GENDER_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                              {GENDER_DATA.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                              ))}
                            </Pie>
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-white rounded-lg border border-[#E5E4E0] p-4">
                        <h4 className="text-[13px] font-semibold text-[#525252] mb-3">Employee Status</h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={selectedSite.statusData.map((d) => ({ name: d.name, count: d.value }))}>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#525252" }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {selectedSite.statusData.map((entry, index) => (
                                <Cell key={index} fill={{ Active: "#1B7A43", Onboarding: "#C27A06", Offboarding: "#B91C1C", Transferred: "#1E6BA3", Terminated: "#737373" }[entry.name] ?? "#D4A017"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-[#FAFAF8] rounded-lg p-4 border-l-[3px] border-[#D4A017]">
                        <div className="text-[12px] text-[#525252] uppercase tracking-wider">Avg Onboarding</div>
                        <div className="text-[20px] font-bold text-[#1A1A1A] mt-1">8.5 days</div>
                      </div>
                      <div className="bg-[#FAFAF8] rounded-lg p-4 border-l-[3px] border-[#1E6BA3]">
                        <div className="text-[12px] text-[#525252] uppercase tracking-wider">Avg Offboarding</div>
                        <div className="text-[20px] font-bold text-[#1A1A1A] mt-1">12.3 days</div>
                      </div>
                      <div className="bg-[#FAFAF8] rounded-lg p-4 border-l-[3px] border-[#1B7A43]">
                        <div className="text-[12px] text-[#525252] uppercase tracking-wider">Transfers In</div>
                        <div className="text-[20px] font-bold text-[#1A1A1A] mt-1">3 this month</div>
                      </div>
                      <div className="bg-[#FAFAF8] rounded-lg p-4 border-l-[3px] border-[#C27A06]">
                        <div className="text-[12px] text-[#525252] uppercase tracking-wider">Transfers Out</div>
                        <div className="text-[20px] font-bold text-[#1A1A1A] mt-1">1 this month</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Site Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[640px] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-[#E5E4E0]">
            <DialogTitle className="text-[20px] font-semibold">Add New Site</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Site Name <span className="text-[#B91C1C]">*</span></label>
              <Input value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} placeholder="e.g. Gwanda Operations" className="h-[40px] border-[#E5E4E0] text-[13px]" />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Location</label>
              <Input value={newSiteLocation} onChange={(e) => setNewSiteLocation(e.target.value)} placeholder="e.g. Matabeleland South" className="h-[40px] border-[#E5E4E0] text-[13px]" />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Full Address</label>
              <Textarea value={newSiteAddress} onChange={(e) => setNewSiteAddress(e.target.value)} placeholder="Full street address..." className="min-h-[60px] border-[#E5E4E0] text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Site Code (auto)</label>
                <Input value={newSiteName ? newSiteName.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3) : ""} readOnly className="h-[40px] border-[#E5E4E0] text-[13px] bg-[#FAFAF8] text-[#9C9C9C]" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[13px] font-medium text-[#525252]">Status</label>
              <Switch checked={newSiteStatus} onCheckedChange={setNewSiteStatus} />
              <span className="text-[13px] text-[#525252]">{newSiteStatus ? "Active" : "Inactive"}</span>
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Description</label>

            </div>
          </div>
          <div className="px-6 py-4 border-t border-[#E5E4E0] flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAddOpen(false)} className="h-[40px] text-[13px]">Cancel</Button>
            <Button onClick={handleAddSite} className="h-[40px] bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]">Create Site</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
