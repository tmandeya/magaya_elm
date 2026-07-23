import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkflowProgressBar, WorkflowStageCard, SignOffForm } from "@/components/workflow";
import { useTransfers, type LiveTransferWorkflow, type TransferCandidate } from "@/hooks/useTransfers";
import type { LiveTask } from "@/hooks/useOnboarding";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  ChevronLeft,
  Download,
  Check,
  ArrowLeftRight,
  ArrowRight,
  Calendar,
  Building,
} from "lucide-react";


const STAGE_COLORS: Record<string, string> = {
  "HR Initiation": "bg-[#E8F2FA] text-[#1E6BA3]",
  "Origin IT Clearance": "bg-[#F3E8FF] text-[#7C3AED]",
  "Origin Security Clearance": "bg-[#E8F2FA] text-[#1E6BA3]",
  "Destination IT Preparation": "bg-[#F3E8FF] text-[#7C3AED]",
  "Destination Security Preparation": "bg-[#E8F2FA] text-[#1E6BA3]",
  "Origin HOD Sign-off": "bg-[#FDF3E0] text-[#C27A06]",
  "Destination HOD Sign-off": "bg-[#FDF3E0] text-[#C27A06]",
  "Origin Site HR": "bg-[#FEF2F2] text-[#B91C1C]",
  "HQ HR Final Approval": "bg-[#E8F5EC] text-[#1B7A43]",
};

// ====================================================================
// TRANSFER LIST VIEW
// ====================================================================

function TransferList({
  workflows,
  loadError,
  onNewTransfer,
  onViewDetail,
}: {
  workflows: LiveTransferWorkflow[];
  loadError: string | null;
  onNewTransfer: () => void;
  onViewDetail: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState<string>("All");
  const [destFilter, setDestFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      const matchSearch =
        !search ||
        w.employee.name.toLowerCase().includes(search.toLowerCase()) ||
        w.reference.toLowerCase().includes(search.toLowerCase());
      const matchOrigin = originFilter === "All" || w.originSite === originFilter;
      const matchDest = destFilter === "All" || w.destinationSite === destFilter;
      const matchStatus = statusFilter === "All" || w.status === statusFilter;
      return matchSearch && matchOrigin && matchDest && matchStatus;
    });
  }, [workflows, search, originFilter, destFilter, statusFilter]);

  const uniqueSites = useMemo(() => {
    const s = new Set<string>();
    workflows.forEach((w) => {
      s.add(w.originSite);
      s.add(w.destinationSite);
    });
    return ["All", ...Array.from(s)];
  }, [workflows]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">Failed to load transfers: {loadError}</div>
      )}
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] tracking-[-0.02em]">
            Transfer Hub
          </h1>
          <p className="text-[13px] text-[#525252] mt-0.5">
            Manage cross-site employee transfers and dual-site clearances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10 gap-1.5 text-[13px] border-[#E5E4E0]"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={onNewTransfer}
            className="h-10 gap-1.5 text-[13px] bg-[#D4A017] hover:bg-[#A67C0A] text-white"
          >
            <Plus className="w-4 h-4" />
            New Transfer
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-[#E5E4E0]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C9C9C]" />
          <Input
            placeholder="Search by name, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[260px] h-9 text-[13px]"
          />
        </div>

        <Select value={originFilter} onValueChange={setOriginFilter}>
          <SelectTrigger className="w-[140px] h-9 text-[13px]">
            <SelectValue placeholder="Origin Site" />
          </SelectTrigger>
          <SelectContent>
            {uniqueSites.map((s) => (
              <SelectItem key={s} value={s} className="text-[13px]">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={destFilter} onValueChange={setDestFilter}>
          <SelectTrigger className="w-[140px] h-9 text-[13px]">
            <SelectValue placeholder="Dest. Site" />
          </SelectTrigger>
          <SelectContent>
            {uniqueSites.map((s) => (
              <SelectItem key={s} value={s} className="text-[13px]">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-[13px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {["All", "In Progress", "Completed", "On Hold"].map((s) => (
              <SelectItem key={s} value={s} className="text-[13px]">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto text-[12px] text-[#737373]">
          Showing {filtered.length} result{filtered.length !== 1 && "s"}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FAFAF8] hover:bg-[#FAFAF8] h-11">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] w-[110px]">
                Reference
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252]">
                Employee
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252]">
                Origin &rarr; Destination
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252]">
                Department
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252]">
                Initiated
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252]">
                Stage
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] w-[100px]">
                Progress
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] w-[70px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((workflow) => (
              <TableRow
                key={workflow.id}
                className="h-[56px] cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                onClick={() => onViewDetail(workflow.id)}
              >
                <TableCell>
                  <span className="text-[12px] font-semibold text-[#1E6BA3]">
                    {workflow.reference}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1E6BA3] flex items-center justify-center text-white text-[11px] font-semibold">
                      {workflow.employee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#1A1A1A]">
                        {workflow.employee.name}
                      </div>
                      <div className="text-[11px] text-[#737373]">{workflow.employee.code}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className="bg-[#FEF2F2] text-[#B91C1C] text-[10px] h-5 font-medium"
                    >
                      {workflow.originSite}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9C9C9C]" />
                    <Badge
                      variant="secondary"
                      className="bg-[#E8F5EC] text-[#1B7A43] text-[10px] h-5 font-medium"
                    >
                      {workflow.destinationSite}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-[12px] text-[#525252]">
                  {workflow.employee.department}
                </TableCell>
                <TableCell className="text-[12px] text-[#525252]">
                  {workflow.initiatedDate}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-medium h-6",
                      STAGE_COLORS[workflow.currentStage] ?? "bg-[#F4F3EF] text-[#525252]"
                    )}
                  >
                    {workflow.currentStage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-[70px] h-1.5 bg-[#E5E4E0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1E6BA3] rounded-full transition-all duration-500"
                        style={{ width: `${workflow.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#737373] font-medium">
                      {workflow.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail(workflow.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-[#F4F3EF] text-[#737373] hover:text-[#1A1A1A] transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-[#F4F3EF] text-[#737373] hover:text-[#1A1A1A] transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <ArrowLeftRight className="w-12 h-12 text-[#9C9C9C] opacity-40 mb-3" />
                    <div className="text-[14px] font-medium text-[#1A1A1A] mb-1">
                      No transfer workflows found
                    </div>
                    <div className="text-[12px] text-[#525252] mb-4">
                      Try adjusting your filters or create a new transfer.
                    </div>
                    <Button
                      onClick={onNewTransfer}
                      className="bg-[#D4A017] hover:bg-[#A67C0A] text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Transfer
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ====================================================================
// TRANSFER DETAIL VIEW
// ====================================================================

function TransferDetail({
  workflow,
  onBack,
  onTaskStatus,
}: {
  workflow: LiveTransferWorkflow;
  onBack: () => void;
  onTaskStatus: (taskId: string, status: LiveTask["dbStatus"], notes?: string) => Promise<string | null>;
}) {
  const [expandedStage, setExpandedStage] = useState<number | null>(
    workflow.stages.findIndex((s) => s.status === "in-progress")
  );
  const stages = workflow.stages;
  const activityLog = workflow.activityLog;
  const [signOffStage, setSignOffStage] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleTaskToggle = async (stageIndex: number, taskIndex: number) => {
    const task = stages[stageIndex]?.items?.[taskIndex];
    if (!task || busy) return;
    setBusy(true);
    setActionError(null);
    const err = await onTaskStatus(task.id, task.completed ? "pending" : "completed");
    setBusy(false);
    if (err) setActionError(err);
  };

  const handleSignOff = async (stageIndex: number, notes: string) => {
    const stage = stages[stageIndex];
    if (!stage?.items || busy) return;
    setBusy(true);
    setActionError(null);
    for (const t of stage.items) {
      if (t.required && !t.completed) {
        const err = await onTaskStatus(t.id, "completed", notes || undefined);
        if (err) { setActionError(err); setBusy(false); return; }
      }
    }
    setBusy(false);
    setSignOffStage(null);
  };

  const progressStages = stages.map((s) => ({
    name: s.name,
    status: s.status as "completed" | "in-progress" | "pending",
    assignedTo: s.assignedTo,
    site: s.siteName ?? undefined,
  }));

  // Split stages for dual-panel view
  const originStages = stages.filter((s) => s.siteRole === "origin");
  const destStages = stages.filter((s) => s.siteRole === "destination");
  const approvalStages = stages.filter((s) => s.siteRole === "shared");

  return (
    <div className="animate-in fade-in duration-300">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] text-[#D4A017] hover:underline mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Transfer Hub
      </button>
      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{actionError}</div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-[#E8F2FA] border border-[#1E6BA3] rounded-full">
              <span className="text-[#1E6BA3] text-[14px] font-bold">{workflow.reference}</span>
            </div>
            <div>
              <div className="text-[18px] font-semibold text-[#1A1A1A]">
                {workflow.employee.name}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[#525252] mt-0.5">
                <Badge variant="secondary" className="bg-[#FEF2F2] text-[#B91C1C] text-[10px] h-5">
                  {workflow.originSite}
                </Badge>
                <ArrowRight className="w-3.5 h-3.5 text-[#9C9C9C]" />
                <Badge variant="secondary" className="bg-[#E8F5EC] text-[#1B7A43] text-[10px] h-5">
                  {workflow.destinationSite}
                </Badge>
                <span className="text-[#9C9C9C]">·</span>
                <Building className="w-3 h-3" />
                {workflow.employee.department}
                <span className="text-[#9C9C9C]">·</span>
                <Calendar className="w-3 h-3" />
                Effective {workflow.effectiveDate}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[14px] font-semibold text-[#1E6BA3]">
              {workflow.progress}% complete
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "mt-1",
                workflow.status === "In Progress"
                  ? "bg-[#FDF3E0] text-[#C27A06]"
                  : "bg-[#E8F5EC] text-[#1B7A43]"
              )}
            >
              {workflow.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar — 9 stages, two-row layout */}
      <div className="mb-5">
        <WorkflowProgressBar
          stages={progressStages}
          accentColor="info"
          twoRowLayout
          row1Count={5}
        />
      </div>

      {/* Dual-Site Panels */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Origin Panel */}
        <div className="bg-white rounded-[10px] border border-[#E5E4E0] overflow-hidden">
          <div className="p-4 border-l-[3px] border-l-[#B91C1C] border-b border-[#E5E4E0] bg-[#FAFAF8]">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[#FEF2F2] text-[#B91C1C] text-[10px] h-5">
                Origin
              </Badge>
              <span className="text-[14px] font-semibold text-[#1A1A1A]">
                {workflow.originSite}
              </span>
            </div>
            <div className="text-[11px] text-[#737373] mt-1">Clearance activities</div>
          </div>
          <div className="p-4 space-y-3">
            {originStages
              .filter((s) => s.status !== "pending" || s.name === workflow.currentStage)
              .map((stage) => (
                <div key={stage.name} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      stage.status === "completed"
                        ? "bg-[#1B7A43]"
                        : stage.status === "in-progress"
                        ? "bg-[#C27A06]"
                        : "bg-[#E5E4E0]"
                    )}
                  />
                  <div>
                    <div className="text-[12px] font-medium text-[#1A1A1A]">{stage.name}</div>
                    <div className="text-[11px] text-[#737373]">
                      {stage.assignedTo}
                      {stage.completedBy && ` · Completed by ${stage.completedBy}`}
                    </div>
                    {stage.items && stage.items.some((it) => it.completed) && (
                      <div className="mt-1 text-[10px] text-[#1B7A43]">
                        {stage.items.filter((it) => it.completed).length} of {stage.items.length}{" "}
                        items done
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Destination Panel */}
        <div className="bg-white rounded-[10px] border border-[#E5E4E0] overflow-hidden">
          <div className="p-4 border-l-[3px] border-l-[#1B7A43] border-b border-[#E5E4E0] bg-[#FAFAF8]">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[#E8F5EC] text-[#1B7A43] text-[10px] h-5">
                Destination
              </Badge>
              <span className="text-[14px] font-semibold text-[#1A1A1A]">
                {workflow.destinationSite}
              </span>
            </div>
            <div className="text-[11px] text-[#737373] mt-1">Preparation activities</div>
          </div>
          <div className="p-4 space-y-3">
            {destStages.map((stage) => (
              <div key={stage.name} className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    stage.status === "completed"
                      ? "bg-[#1B7A43]"
                      : stage.status === "in-progress"
                      ? "bg-[#C27A06]"
                      : "bg-[#E5E4E0]"
                  )}
                />
                <div>
                  <div className="text-[12px] font-medium text-[#1A1A1A]">{stage.name}</div>
                  <div className="text-[11px] text-[#737373]">
                    {stage.assignedTo}
                    {stage.completedBy && ` · Completed by ${stage.completedBy}`}
                  </div>
                </div>
              </div>
            ))}
            {destStages.length === 0 && (
              <div className="text-[11px] text-[#9C9C9C] italic">
                Awaiting origin clearance completion...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Chain */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5 mb-5">
        <h3 className="text-[14px] font-semibold text-[#1A1A1A] mb-4">Approval Chain</h3>
        <div className="grid grid-cols-4 gap-3">
          {approvalStages.map((stage) => (
            <div
              key={stage.name}
              className={cn(
                "p-3 rounded-lg border",
                stage.status === "completed"
                  ? "border-[#1B7A43] bg-[#E8F5EC]"
                  : stage.status === "in-progress"
                  ? "border-[#1E6BA3] bg-[#E8F2FA]"
                  : "border-[#E5E4E0] bg-[#FAFAF8]"
              )}
            >
              <div className="text-[11px] font-medium text-[#1A1A1A]">{stage.name}</div>
              <div className="text-[10px] text-[#737373] mt-0.5">{stage.siteName}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-5 h-5 rounded-full bg-[#E5E4E0] flex items-center justify-center text-[8px] font-bold text-[#525252]">
                  {(stage.assignedTo || "?")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <span className="text-[10px] text-[#525252]">
                  {stage.completedBy || stage.assignedTo}
                </span>
              </div>
              {stage.status === "completed" && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#1B7A43]">
                  <Check className="w-3 h-3" />
                  Approved
                </div>
              )}
              {stage.status === "in-progress" && (
                <div className="mt-1.5 text-[10px] text-[#1E6BA3] font-medium animate-pulse">
                  Pending approval...
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All Stages */}
      <div className="mb-5">
        <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-3">All Stages</h3>
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.name}>
              <WorkflowStageCard
                stage={stage}
                stageIndex={index}
                isExpanded={expandedStage === index}
                onToggle={() => setExpandedStage(expandedStage === index ? null : index)}
                onTaskToggle={handleTaskToggle}
              />
              {expandedStage === index && stage.status === "in-progress" && signOffStage === index && (
                <SignOffForm
                  stageName={stage.name}
                  onSignOff={(notes) => handleSignOff(index, notes)}
                  onCancel={() => setSignOffStage(null)}
                />
              )}
              {expandedStage === index && stage.status === "in-progress" && signOffStage !== index && (
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    className="bg-[#1E6BA3] hover:bg-[#164e73] text-white text-[12px] h-8"
                    onClick={() => setSignOffStage(index)}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Complete Stage
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5">
        <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Activity Log</h3>
        <div className="relative pl-4">
          <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-[#E5E4E0]" />
          <div className="space-y-4">
            {activityLog.map((entry, index) => {
              const dotColor =
                entry.type === "complete"
                  ? "bg-[#1B7A43]"
                  : entry.type === "stage-start"
                  ? "bg-[#C27A06]"
                  : entry.type === "create"
                  ? "bg-[#1E6BA3]"
                  : "bg-[#9C9C9C]";
              return (
                <div key={index} className="relative flex gap-3">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 shrink-0 mt-0.5",
                      dotColor
                    )}
                  />
                  <div>
                    <div className="text-[13px] font-medium text-[#1A1A1A]">{entry.message}</div>
                    <div className="text-[11px] text-[#737373] mt-0.5">
                      {entry.user} ·{" "}
                      {new Date(entry.timestamp).toLocaleString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// NEW TRANSFER WIZARD
// ====================================================================

function NewTransferWizard({ open, onClose, candidates, sites, onSubmit }: {
  open: boolean;
  onClose: () => void;
  candidates: TransferCandidate[];
  sites: { id: string; name: string }[];
  onSubmit: (input: { employeeId: string; destinationSiteId: string; effectiveDate: string; reason: string }) => Promise<{ id: string | null; error: string | null }>;
}) {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [destinationSiteId, setDestinationSiteId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emp = candidates.find((c) => c.id === selectedEmployee);

  const handleClose = () => {
    setSelectedEmployee(""); setDestinationSiteId(""); setEffectiveDate(""); setTransferReason(""); setError(null);
    onClose();
  };

  const submit = async () => {
    if (!selectedEmployee || !destinationSiteId || !effectiveDate || busy) return;
    setBusy(true);
    setError(null);
    const res = await onSubmit({ employeeId: selectedEmployee, destinationSiteId, effectiveDate, reason: transferReason.trim() });
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    handleClose();
    if (res.id) navigate(`/transfers/${res.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-[560px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-[18px]">Initiate Transfer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <div className="px-3 py-2.5 rounded-lg border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{error}</div>}
          <div>
            <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">Employee <span className="text-[#B91C1C]">*</span></label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="h-10 text-[13px]"><SelectValue placeholder="Select employee..." /></SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[13px]">{c.name} ({c.code}) — {c.site}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {candidates.length === 0 && <p className="text-[11px] text-[#9C9C9C] mt-1.5">No active employees available.</p>}
          </div>
          {emp && (
            <div className="bg-[#FAFAF8] rounded-lg border border-[#E5E4E0] px-4 py-3 text-[12px] text-[#525252]">
              Origin site: <strong className="text-[#1A1A1A]">{emp.site}</strong> · Department: <strong className="text-[#1A1A1A]">{emp.department}</strong>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">Destination Site <span className="text-[#B91C1C]">*</span></label>
              <Select value={destinationSiteId} onValueChange={setDestinationSiteId}>
                <SelectTrigger className="h-10 text-[13px]"><SelectValue placeholder="Select site..." /></SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {sites.filter((s) => s.id !== emp?.siteId).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-[13px]">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">Effective Date <span className="text-[#B91C1C]">*</span></label>
              <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="h-10 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">Transfer Reason</label>
            <Textarea value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="e.g. Operational requirement at destination site..." className="min-h-[70px] text-[13px]" />
          </div>
          <p className="text-[11px] text-[#9C9C9C]">
            On submission the engine opens the full clearance chain: Origin IT (hardware move/hand-in) and Origin Security (card decision) in parallel, then Destination IT/Security preparation, HOD release/acceptance, both Site HRs, and HQ HR final sign-off. Hardware and card decisions are made by those departments inside the workflow.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="text-[13px]">Cancel</Button>
          <Button disabled={busy || !selectedEmployee || !destinationSiteId || !effectiveDate} onClick={() => void submit()} className="bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]">
            {busy ? "Initiating..." : "Submit & Initiate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Transfers() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { workflows, candidates, sites, loading, error: loadError, startTransfer, setTaskStatus } = useTransfers();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#E5E4E0] border-t-[#D4A017] rounded-full animate-spin" />
        <p className="text-[13px] text-[#9C9C9C]">Loading transfers...</p>
      </div>
    );
  }

  if (id) {
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-[16px] font-semibold text-[#1A1A1A] mb-2">Transfer not found</div>
          <div className="text-[13px] text-[#525252] mb-4">
            The transfer workflow you are looking for does not exist.
          </div>
          <Button
            onClick={() => navigate("/transfers")}
            className="bg-[#D4A017] hover:bg-[#A67C0A] text-white"
          >
            Back to Transfer Hub
          </Button>
        </div>
      );
    }
    return <TransferDetail workflow={workflow} onBack={() => navigate("/transfers")} onTaskStatus={setTaskStatus} />;
  }

  return (
    <>
      <TransferList
        workflows={workflows}
        loadError={loadError}
        onNewTransfer={() => setWizardOpen(true)}
        onViewDetail={(workflowId) => navigate(`/transfers/${workflowId}`)}
      />
      <NewTransferWizard open={wizardOpen} onClose={() => setWizardOpen(false)} candidates={candidates} sites={sites} onSubmit={startTransfer} />
    </>
  );
}
