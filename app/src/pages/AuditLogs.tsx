import { useState, useMemo } from "react";
import { Search, Download, ChevronDown, ChevronUp, Eye, Plus, Pencil, Trash2, Check, X, LogIn, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockExtendedAuditLogs, actionBadgeColors } from "@/data/adminData";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

const actionIconMap: Record<string, React.ElementType> = {
  Create: Plus,
  Update: Pencil,
  Delete: Trash2,
  Approve: Check,
  Reject: X,
  Login: LogIn,
  Logout: LogOut,
  Export: Download,
  View: Eye,
};

const moduleColors: Record<string, { bg: string; text: string }> = {
  "Employee Master": { bg: "#E8F2FA", text: "#1E6BA3" },
  "Onboarding": { bg: "#E8F5EC", text: "#1B7A43" },
  "Offboarding": { bg: "#FEF2F2", text: "#B91C1C" },
  "Transfer": { bg: "#FDF3E0", text: "#C27A06" },
  "Settings": { bg: "#FFF7ED", text: "#C27A06" },
  "Authentication": { bg: "#F5F5F5", text: "#737373" },
  "Site": { bg: "#E8F2FA", text: "#1E6BA3" },
  "Report": { bg: "#F3E8FF", text: "#7C3AED" },
  "Workflow": { bg: "#E8F5EC", text: "#1B7A43" },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [userFilter, setUserFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const allLogs = mockExtendedAuditLogs;

  const filteredLogs = useMemo(() => {
    let logs = [...allLogs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      logs = logs.filter((l) =>
        l.user.name.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        (l.employee?.name.toLowerCase().includes(q) ?? false)
      );
    }
    if (dateFrom) {
      logs = logs.filter((l) => l.timestamp >= new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      logs = logs.filter((l) => l.timestamp <= new Date(dateTo + "T23:59:59").toISOString());
    }
    if (userFilter !== "All") {
      logs = logs.filter((l) => l.user.name === userFilter);
    }
    if (actionFilter !== "All") {
      logs = logs.filter((l) => l.action === actionFilter);
    }
    if (moduleFilter !== "All") {
      logs = logs.filter((l) => l.module === moduleFilter);
    }
    return logs;
  }, [allLogs, searchQuery, dateFrom, dateTo, userFilter, actionFilter, moduleFilter]);

  const totalLogs = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalLogs);
  const pageLogs = filteredLogs.slice(startIdx, endIdx);

  // Summary stats
  const stats = useMemo(() => {
    return {
      total: filteredLogs.length,
      create: filteredLogs.filter((l) => l.action === "Create").length,
      update: filteredLogs.filter((l) => l.action === "Update").length,
      delete: filteredLogs.filter((l) => l.action === "Delete").length,
      login: filteredLogs.filter((l) => l.action === "Login" || l.action === "Logout").length,
      export: filteredLogs.filter((l) => l.action === "Export").length,
    };
  }, [filteredLogs]);

  const uniqueUsers = Array.from(new Set(allLogs.map((l) => l.user.name)));
  const uniqueModules = Array.from(new Set(allLogs.map((l) => l.module)));

  function toggleRow(id: string) {
    setExpandedRow((prev) => (prev === id ? null : id));
  }

  return (
    <div className="p-6 space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] leading-tight tracking-[-0.02em]">Audit Logs</h1>
          <p className="text-[13px] text-[#525252] mt-1">Comprehensive system activity and compliance logging</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[11px] text-[#9C9C9C] border-[#E5E4E0] h-[28px] px-3">
            Retention: 7 years
          </Badge>
          <Button variant="outline" className="h-[40px] text-[13px] gap-2 border-[#E5E4E0]" onClick={() => setExportOpen(true)}>
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="flex items-center gap-6 bg-white rounded-lg border border-[#E5E4E0] px-5 py-3">
        <div>
          <div className="text-[16px] font-bold text-[#1A1A1A]">{stats.total}</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[#737373]">Total Events</div>
        </div>
        <div className="w-px h-8 bg-[#E5E4E0]" />
        <div>
          <div className="text-[16px] font-bold text-[#1B7A43]">{stats.create}</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[#737373]">Create</div>
        </div>
        <div className="w-px h-8 bg-[#E5E4E0]" />
        <div>
          <div className="text-[16px] font-bold text-[#1E6BA3]">{stats.update}</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[#737373]">Update</div>
        </div>
        <div className="w-px h-8 bg-[#E5E4E0]" />
        <div>
          <div className="text-[16px] font-bold text-[#B91C1C]">{stats.delete}</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[#737373]">Delete</div>
        </div>
        <div className="w-px h-8 bg-[#E5E4E0]" />
        <div>
          <div className="text-[16px] font-bold text-[#737373]">{stats.login}</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[#737373]">Login/Logout</div>
        </div>
        <div className="w-px h-8 bg-[#E5E4E0]" />
        <div>
          <div className="text-[16px] font-bold text-[#7C3AED]">{stats.export}</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[#737373]">Export</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-[10px] border border-[#E5E4E0]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C]" />
          <Input placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-[200px] h-[36px] border-[#E5E4E0] text-[13px]" />
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-[36px] text-[12px] border-[#E5E4E0] w-[140px]" />
          <span className="text-[#9C9C9C] text-[12px]">to</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-[36px] text-[12px] border-[#E5E4E0] w-[140px]" />
        </div>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[160px] h-[36px] text-[13px] border-[#E5E4E0]">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Users</SelectItem>
            {uniqueUsers.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px] h-[36px] text-[13px] border-[#E5E4E0]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Actions</SelectItem>
            {["Create", "Update", "Delete", "Approve", "Reject", "Login", "Logout", "Export", "View"].map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[160px] h-[36px] text-[13px] border-[#E5E4E0]">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Modules</SelectItem>
            {uniqueModules.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="h-[32px] text-[12px] text-[#9C9C9C] ml-auto" onClick={() => {
          setSearchQuery(""); setDateFrom(""); setDateTo(""); setUserFilter("All"); setActionFilter("All"); setModuleFilter("All");
        }}>
          Clear all
        </Button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#E5E4E0]">
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Timestamp</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">User</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Action</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Module</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Employee Affected</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">Details</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#525252]">IP Address</th>
                <th className="w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {pageLogs.map((log) => {
                const actionColors = actionBadgeColors[log.action] || { bg: "#F5F5F5", text: "#737373" };
                const ActionIcon = actionIconMap[log.action] || Eye;
                const modColors = moduleColors[log.module] || { bg: "#F5F5F5", text: "#737373" };
                const isExpanded = expandedRow === log.id;

                return (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => toggleRow(log.id)}
                      className={cn(
                        "border-b border-[#E5E4E0] hover:bg-[#FAFAF8] cursor-pointer transition-colors",
                        log.action === "Delete" && "border-l-2 border-l-[#B91C1C]",
                        log.action === "Login" || log.action === "Logout" ? "bg-[#FAFAFA]" : "bg-white"
                      )}
                      style={{ height: "56px" }}
                    >
                      <td className="px-4 py-3 text-[12px] font-medium text-[#1A1A1A] whitespace-nowrap">
                        {format(parseISO(log.timestamp), "dd MMM yyyy, HH:mm")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[10px] font-semibold">
                            {getInitials(log.user.name)}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-[#1A1A1A] leading-tight">{log.user.name}</div>
                            <div className="text-[10px] text-[#9C9C9C]">{log.user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[11px] font-semibold h-[22px] border-0 gap-1" style={{ backgroundColor: actionColors.bg, color: actionColors.text }}>
                          <ActionIcon className="w-3 h-3" /> {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[11px] h-[22px] border-0" style={{ backgroundColor: modColors.bg, color: modColors.text }}>
                          {log.module}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#1A1A1A]">
                        {log.employee ? (
                          <span className="text-[#D4A017] hover:underline">{log.employee.name} <span className="text-[#9C9C9C] text-[11px]">({log.employee.code})</span></span>
                        ) : (
                          <span className="text-[#9C9C9C]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#525252] max-w-[200px] truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#9C9C9C] font-mono whitespace-nowrap">{log.ipAddress}</td>
                      <td className="px-2 py-3">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#9C9C9C]" /> : <ChevronDown className="w-4 h-4 text-[#9C9C9C]" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-4 py-3 bg-[#FAFAF8]">
                          <div className="bg-white rounded-lg border border-[#E5E4E0] p-4 space-y-3">
                            {/* Full details */}
                            <div>
                              <h4 className="text-[13px] font-semibold text-[#1A1A1A] mb-1">Full Details</h4>
                              <p className="text-[12px] text-[#525252]">{log.details}</p>
                            </div>
                            {/* Before/After comparison */}
                            {log.previousValue !== null && log.newValue !== null && (
                              <div>
                                <h4 className="text-[13px] font-semibold text-[#1A1A1A] mb-2">Change Comparison</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-[#FEF2F2] rounded-lg p-3 border border-[#B91C1C]/20">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#B91C1C] mb-1">Previous Value</div>
                                    <div className="text-[13px] text-[#1A1A1A]">{log.previousValue}</div>
                                  </div>
                                  <div className="bg-[#E8F5EC] rounded-lg p-3 border border-[#1B7A43]/20">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1B7A43] mb-1">New Value</div>
                                    <div className="text-[13px] text-[#1A1A1A]">{log.newValue}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Metadata */}
                            <div className="flex items-center gap-6 text-[11px] text-[#9C9C9C] pt-2 border-t border-[#E5E4E0]">
                              <span>Session: <span className="font-mono">{log.sessionId}</span></span>
                              <span>Log ID: <span className="font-mono">{log.id}</span></span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {pageLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-[#9C9C9C] opacity-40" />
                    <p className="text-[16px] font-semibold text-[#1A1A1A]">No audit logs found</p>
                    <p className="text-[13px] text-[#525252]">Try adjusting your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E4E0]">
          <div className="text-[12px] text-[#525252]">
            Showing {startIdx + 1}-{endIdx} of {totalLogs} results
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-[32px] text-[12px]" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={currentPage === p ? "default" : "outline"}
                  size="sm"
                  className={cn("h-[32px] w-[32px] text-[12px] p-0", currentPage === p ? "bg-[#D4A017] hover:bg-[#A67C0A] text-white" : "border-[#E5E4E0]")}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" className="h-[32px] text-[12px]" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </Button>
          </div>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-[80px] h-[32px] text-[12px] border-[#E5E4E0]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Export Modal */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-[520px] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-[#E5E4E0]">
            <DialogTitle className="text-[20px] font-semibold">Export Audit Logs</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Format</label>
              <div className="flex gap-3">
                {["CSV", "Excel", "PDF"].map((fmt) => (
                  <button key={fmt} className={cn("px-4 py-2 rounded-lg border text-[13px] font-medium transition-colors", fmt === "CSV" ? "border-[#D4A017] bg-[rgba(212,160,23,0.1)] text-[#D4A017]" : "border-[#E5E4E0] text-[#525252] hover:border-[#C4C3BF]")}>
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Date Range (From)</label>
                <Input type="date" className="h-[40px] text-[13px] border-[#E5E4E0]" />
              </div>
              <div>
                <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Date Range (To)</label>
                <Input type="date" className="h-[40px] text-[13px] border-[#E5E4E0]" />
              </div>
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Filter Scope</label>
              <Select defaultValue="filtered">
                <SelectTrigger className="h-[40px] text-[13px] border-[#E5E4E0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filtered">Currently filtered logs ({totalLogs})</SelectItem>
                  <SelectItem value="all">All logs ({allLogs.length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-[#E5E4E0] flex justify-end gap-3">
            <Button variant="outline" onClick={() => setExportOpen(false)} className="h-[40px] text-[13px]">Cancel</Button>
            <Button onClick={() => setExportOpen(false)} className="h-[40px] bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px] gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
