// Settings: every tab is live against the database. No mock or local-only state.
import { useMemo, useState } from "react";
import { Database, Users as UsersIcon, List, Clock, Bell, Info, Plus, Loader2, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import DataMigration from "@/components/DataMigration";
import { useAdminSettings, type AdminUser, type LookupItem } from "@/hooks/useAdminSettings";
import { useDashboard } from "@/hooks/useDashboard";
import { ROLE_LABELS, DB_ROLE_TO_UI, type DbAppRole } from "@/types/db";

const TABS = [
  { key: "migration", label: "Data Migration", icon: Database },
  { key: "users", label: "User Management", icon: UsersIcon },
  { key: "dropdowns", label: "Dropdown Config", icon: List },
  { key: "retention", label: "Retention Policy", icon: Clock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "system", label: "System", icon: Info },
];

const DB_ROLES = Object.keys(DB_ROLE_TO_UI) as DbAppRole[];
const roleLabel = (r: DbAppRole) => ROLE_LABELS[DB_ROLE_TO_UI[r]];
const SITE_SCOPED_ROLES: DbAppRole[] = ["site_administrator", "site_hr", "site_security", "site_it_administrator"];
const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never");

function LookupSection({ title, items, onAdd, onToggle, addFields, busy }: {
  title: string;
  items: LookupItem[];
  onAdd: (values: Record<string, string>) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
  addFields: { key: string; placeholder: string; select?: { id: string; name: string }[] }[];
  busy: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [showInactive, setShowInactive] = useState(false);
  const visible = items.filter((i) => showInactive || i.isActive);
  return (
    <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-[#1A1A1A]">{title} <span className="text-[#9C9C9C] font-normal">({items.filter((i) => i.isActive).length} active)</span></h3>
        <label className="flex items-center gap-2 text-[12px] text-[#737373]"><Switch checked={showInactive} onCheckedChange={setShowInactive} /> Show inactive</label>
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {addFields.map((f) => f.select ? (
          <Select key={f.key} value={values[f.key] ?? ""} onValueChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}>
            <SelectTrigger className="h-[36px] text-[13px] w-[200px]"><SelectValue placeholder={f.placeholder} /></SelectTrigger>
            <SelectContent>{f.select.map((o) => <SelectItem key={o.id} value={o.id} className="text-[13px]">{o.name}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Input key={f.key} value={values[f.key] ?? ""} onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="h-[36px] text-[13px] w-[200px]" />
        ))}
        <Button size="sm" disabled={busy || !addFields.every((f) => f.select ? true : (values[f.key] ?? "").trim() || f.key.startsWith("_opt_"))}
          onClick={async () => { await onAdd(values); setValues({}); }}
          className="h-[36px] bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
      </div>
      <div className="max-h-[260px] overflow-y-auto divide-y divide-[#F0EFEB] border-t border-[#F0EFEB]">
        {visible.map((i) => (
          <div key={i.id} className="flex items-center justify-between py-2">
            <div>
              <span className={cn("text-[13px]", i.isActive ? "text-[#1A1A1A]" : "text-[#9C9C9C] line-through")}>{i.label}</span>
              {i.sub && <span className="text-[11px] text-[#9C9C9C] ml-2">{i.sub}</span>}
            </div>
            <Switch checked={i.isActive} disabled={busy} onCheckedChange={(v) => void onToggle(i.id, v)} />
          </div>
        ))}
        {visible.length === 0 && <p className="py-4 text-center text-[12px] text-[#9C9C9C]">Nothing here</p>}
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState("migration");
  const s = useAdminSettings();
  const { workflowStats } = useDashboard();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // User management state
  const [userSearch, setUserSearch] = useState("");
  const [userDialog, setUserDialog] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [uEmail, setUEmail] = useState("");
  const [uName, setUName] = useState("");
  const [uPhone, setUPhone] = useState("");
  const [uRole, setURole] = useState<DbAppRole | "">("");
  const [uSite, setUSite] = useState<string>("");

  const [retentionAll, setRetentionAll] = useState("");

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return s.users.filter((u) => !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [s.users, userSearch]);

  const openAdd = () => { setUEmail(""); setUName(""); setUPhone(""); setURole(""); setUSite(""); setEditing(null); setUserDialog("add"); setActionError(null); };
  const openEdit = (u: AdminUser) => { setEditing(u); setUName(u.fullName); setUPhone(u.phone ?? ""); setURole(u.role); setUSite(u.siteId ?? ""); setUserDialog("edit"); setActionError(null); };

  const submitUser = async () => {
    if (!uName.trim() || !uRole) return;
    const needsSite = SITE_SCOPED_ROLES.includes(uRole as DbAppRole);
    if (needsSite && !uSite) { setActionError("Site-scoped roles require a site."); return; }
    setBusy(true);
    setActionError(null);
    const err = userDialog === "add"
      ? await s.createUser({ email: uEmail.trim(), fullName: uName.trim(), role: uRole as DbAppRole, siteId: uSite || null, phone: uPhone.trim() || undefined })
      : await s.updateUser(editing!.id, { fullName: uName.trim(), role: uRole as DbAppRole, siteId: uSite || null, phone: uPhone.trim() || undefined });
    setBusy(false);
    if (err) { setActionError(err); return; }
    if (userDialog === "add") setNotice(`User created. Tell them to open the login page, use "Forgot password" with ${uEmail.trim()}, and set their own password.`);
    setUserDialog(null);
  };

  if (s.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#E5E4E0] border-t-[#D4A017] rounded-full animate-spin" />
        <p className="text-[13px] text-[#9C9C9C]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-[#1A1A1A] tracking-[-0.02em]">Settings</h1>
        <p className="text-[13px] text-[#525252] mt-1">System configuration and administrative preferences</p>
      </div>

      {s.error && <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{s.error}</div>}
      {notice && (
        <div className="px-4 py-3 rounded-[10px] border border-[#1B7A43]/30 bg-[#1B7A43]/5 text-[13px] text-[#1B7A43] flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[12px] font-medium">Dismiss</button>
        </div>
      )}

      <div className="flex gap-5 items-start flex-col lg:flex-row">
        <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-2 w-full lg:w-[220px] shrink-0">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left",
                tab === t.key ? "bg-[#FDF6E3] text-[#A67C0A] border-l-2 border-[#D4A017]" : "text-[#525252] hover:bg-[#FAFAF8]")}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0 w-full space-y-4">
          {tab === "migration" && (
            <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6"><DataMigration /></div>
          )}

          {tab === "users" && (
            <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#1A1A1A]">User Management</h2>
                  <p className="text-[12px] text-[#525252]">Platform users, their roles and site scope. New users set their own password via "Forgot password".</p>
                </div>
                <Button onClick={openAdd} className="bg-[#D4A017] hover:bg-[#A67C0A] text-white"><Plus className="w-4 h-4 mr-1.5" /> Add User</Button>
              </div>
              <div className="relative mb-4 max-w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C9C9C]" />
                <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users..." className="pl-9 h-[38px] text-[13px]" />
              </div>
              <div className="border border-[#E5E4E0] rounded-[10px] overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-[#FAFAF8]">
                    <tr>
                      {["User", "Role", "Site", "Status", "Last Login", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[#525252]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4E0]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#D4A017] text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
                              {u.fullName.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-[#1A1A1A]">{u.fullName}</div>
                              <div className="text-[11px] text-[#9C9C9C]">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-[#E8F2FA] text-[#1E6BA3] text-[11px] font-semibold">{roleLabel(u.role)}</span></td>
                        <td className="px-4 py-3 text-[#525252]">{u.siteName ?? "All Sites"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", u.isActive ? "bg-[#E8F5EC] text-[#1B7A43]" : "bg-[#F5F5F5] text-[#737373]")}>{u.isActive ? "Active" : "Disabled"}</span>
                        </td>
                        <td className="px-4 py-3 text-[#737373] text-[12px]">{fmtDateTime(u.lastLoginAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => openEdit(u)} className="text-[#1E6BA3] hover:underline text-[12px] font-medium flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                            <button disabled={busy} onClick={async () => { setBusy(true); const err = await s.setUserActive(u.id, !u.isActive); setBusy(false); if (err) setActionError(err); }}
                              className={cn("text-[12px] font-medium hover:underline", u.isActive ? "text-[#B91C1C]" : "text-[#1B7A43]")}>{u.isActive ? "Disable" : "Enable"}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-[#9C9C9C]">No users found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "dropdowns" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <LookupSection title="Departments" items={s.departments} busy={busy}
                addFields={[{ key: "name", placeholder: "Department name" }, { key: "code", placeholder: "Code (e.g. GEO)" }]}
                onAdd={async (v) => { setBusy(true); const err = await s.addLookup("departments", { name: v.name?.trim(), code: v.code?.trim().toUpperCase() }); setBusy(false); if (err) setActionError(err); }}
                onToggle={async (id, a) => { const err = await s.toggleLookup("departments", id, a); if (err) setActionError(err); }} />
              <LookupSection title="Job Titles" items={s.jobTitles} busy={busy}
                addFields={[{ key: "title", placeholder: "Job title" }, { key: "department_id", placeholder: "Department (optional)", select: s.departments.filter((d) => d.isActive).map((d) => ({ id: d.id, name: d.label })) }]}
                onAdd={async (v) => { setBusy(true); const err = await s.addLookup("jobTitles", { title: v.title?.trim(), department_id: v.department_id || null }); setBusy(false); if (err) setActionError(err); }}
                onToggle={async (id, a) => { const err = await s.toggleLookup("jobTitles", id, a); if (err) setActionError(err); }} />
              <LookupSection title="Hardware Catalog" items={s.hardware} busy={busy}
                addFields={[{ key: "category", placeholder: "Category (e.g. Laptop)" }, { key: "make", placeholder: "Make" }, { key: "model", placeholder: "Model" }]}
                onAdd={async (v) => { setBusy(true); const err = await s.addLookup("hardware", { category: v.category?.trim(), make: v.make?.trim(), model: v.model?.trim() }); setBusy(false); if (err) setActionError(err); }}
                onToggle={async (id, a) => { const err = await s.toggleLookup("hardware", id, a); if (err) setActionError(err); }} />
              <LookupSection title="Software Catalog" items={s.software} busy={busy}
                addFields={[{ key: "name", placeholder: "Software name" }, { key: "license_type", placeholder: "License type" }]}
                onAdd={async (v) => { setBusy(true); const err = await s.addLookup("software", { name: v.name?.trim(), license_type: v.license_type?.trim() || null }); setBusy(false); if (err) setActionError(err); }}
                onToggle={async (id, a) => { const err = await s.toggleLookup("software", id, a); if (err) setActionError(err); }} />
              <LookupSection title="Security Clearance Levels" items={s.clearance} busy={busy}
                addFields={[{ key: "name", placeholder: "Level name" }, { key: "description", placeholder: "Description" }]}
                onAdd={async (v) => { setBusy(true); const err = await s.addLookup("clearance", { name: v.name?.trim(), description: v.description?.trim() || null, sort_order: s.clearance.length + 1 }); setBusy(false); if (err) setActionError(err); }}
                onToggle={async (id, a) => { const err = await s.toggleLookup("clearance", id, a); if (err) setActionError(err); }} />
            </div>
          )}

          {tab === "retention" && (
            <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6">
              <h2 className="text-[18px] font-semibold text-[#1A1A1A]">Retention Policy</h2>
              <p className="text-[12px] text-[#525252] mb-4">Days a departed employee's record stays in Former Employees before archive eligibility. Configured per site in the workflow engine.</p>
              <div className="flex items-center gap-2 mb-5">
                <Input value={retentionAll} onChange={(e) => setRetentionAll(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 90" className="h-[38px] w-[120px] text-[13px]" />
                <Button size="sm" disabled={busy || !retentionAll}
                  onClick={async () => { setBusy(true); const err = await s.saveRetention("all", Number(retentionAll)); setBusy(false); if (err) setActionError(err); else { setNotice(`Retention set to ${retentionAll} days for all sites.`); setRetentionAll(""); } }}
                  className="h-[38px] bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]">Apply to all sites</Button>
              </div>
              <div className="border border-[#E5E4E0] rounded-[10px] divide-y divide-[#E5E4E0] max-h-[420px] overflow-y-auto">
                {s.retention.map((r) => (
                  <div key={r.siteId} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[13px] text-[#1A1A1A]">{r.siteName}</span>
                    <div className="flex items-center gap-2">
                      <Input defaultValue={String(r.retentionDays)} onBlur={async (e) => {
                        const v = Number(e.target.value);
                        if (!Number.isFinite(v) || v === r.retentionDays || v < 0) return;
                        const err = await s.saveRetention(r.siteId, v);
                        if (err) setActionError(err);
                      }} className="h-[32px] w-[90px] text-[13px] text-right" />
                      <span className="text-[12px] text-[#9C9C9C]">days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6 max-w-[560px]">
              <h2 className="text-[18px] font-semibold text-[#1A1A1A]">Notifications</h2>
              <p className="text-[12px] text-[#525252] mb-5">Which notifications you receive is decided by your role and site — the workflow engine routes them. Here you choose how you receive yours.</p>
              <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Delivery preference</label>
              <Select value={s.notifPref} onValueChange={async (v) => { const err = await s.saveNotifPref(v); if (err) setActionError(err); else setNotice("Notification preference saved."); }}>
                <SelectTrigger className="h-[40px] text-[13px] w-[260px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app" className="text-[13px]">In-app only</SelectItem>
                  <SelectItem value="email" className="text-[13px]">Email only</SelectItem>
                  <SelectItem value="both" className="text-[13px]">In-app and email</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[#9C9C9C] mt-3">Email delivery requires the company SMTP configuration (pending M365 integration).</p>
            </div>
          )}

          {tab === "system" && (
            <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-6">
              <h2 className="text-[18px] font-semibold text-[#1A1A1A] mb-4">System</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Platform Users", value: s.users.length },
                  { label: "Active Users", value: s.users.filter((u) => u.isActive).length },
                  { label: "Workflows In Progress", value: workflowStats.inProgress },
                  { label: "Workflows Completed", value: workflowStats.completed },
                ].map((c) => (
                  <div key={c.label} className="bg-[#FAFAF8] rounded-lg border border-[#E5E4E0] p-4">
                    <div className="text-[22px] font-bold text-[#1A1A1A]">{c.value}</div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9C9C9C] mt-1">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 text-[12px] text-[#737373] space-y-1">
                <p>Application: Magaya ELMS v2 · Backend: Supabase (magaya-elm_platform, eu-west-2) · Hosting: Vercel</p>
                <p>Authentication: email/password with recovery · Access control: role-based, database-enforced (RLS)</p>
              </div>
            </div>
          )}

          {actionError && (
            <div className="px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C] flex items-center justify-between">
              <span>{actionError}</span>
              <button onClick={() => setActionError(null)} className="text-[12px] font-medium">Dismiss</button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit user dialog */}
      <Dialog open={userDialog !== null} onOpenChange={(o) => !o && setUserDialog(null)}>
        <DialogContent className="max-w-[480px]" aria-describedby={undefined}>
          <DialogHeader><DialogTitle className="text-[18px]">{userDialog === "add" ? "Add User" : "Edit User"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {userDialog === "add" && (
              <div>
                <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Email *</label>
                <Input value={uEmail} onChange={(e) => setUEmail(e.target.value)} placeholder="name@magayamining.com" className="h-[40px] text-[13px]" />
              </div>
            )}
            <div>
              <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Full Name *</label>
              <Input value={uName} onChange={(e) => setUName(e.target.value)} placeholder="First Surname" className="h-[40px] text-[13px]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Phone</label>
              <Input value={uPhone} onChange={(e) => setUPhone(e.target.value)} placeholder="Optional" className="h-[40px] text-[13px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Role *</label>
                <Select value={uRole} onValueChange={(v) => setURole(v as DbAppRole)}>
                  <SelectTrigger className="h-[40px] text-[13px]"><SelectValue placeholder="Select role..." /></SelectTrigger>
                  <SelectContent>{DB_ROLES.map((r) => <SelectItem key={r} value={r} className="text-[13px]">{roleLabel(r)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#525252] mb-1.5">Site {SITE_SCOPED_ROLES.includes(uRole as DbAppRole) ? "*" : "(HQ roles: leave blank)"}</label>
                <Select value={uSite || "none"} onValueChange={(v) => setUSite(v === "none" ? "" : v)}>
                  <SelectTrigger className="h-[40px] text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-[13px]">All Sites (HQ)</SelectItem>
                    {s.sites.map((x) => <SelectItem key={x.id} value={x.id} className="text-[13px]">{x.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {userDialog === "add" && (
              <p className="text-[11px] text-[#9C9C9C]">No password is set here. The user opens the login page, clicks "Forgot password", and sets their own — access stays out of chat, email, and screenshots.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog(null)} className="text-[13px]">Cancel</Button>
            <Button disabled={busy || !uName.trim() || !uRole || (userDialog === "add" && !uEmail.trim())} onClick={() => void submitUser()} className="bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : userDialog === "add" ? "Create User" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
