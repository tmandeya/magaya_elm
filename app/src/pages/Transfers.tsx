import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { WizardStepper, WorkflowProgressBar, WorkflowStageCard, SignOffForm } from "@/components/workflow";
import { mockTransferWorkflows, activeEmployeesForOffboarding, allSites, getTransferById } from "@/data/workflowData";
import type { TransferWorkflow, TransferStage } from "@/types/workflow";
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

const TRANSFER_STEPS = [
  "Transfer Details",
  "IT Clearance",
  "Security Setup",
  "Approval Chain",
  "Review & Submit",
];

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
  onNewTransfer,
  onViewDetail,
}: {
  onNewTransfer: () => void;
  onViewDetail: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState<string>("All");
  const [destFilter, setDestFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [workflows] = useState<TransferWorkflow[]>(mockTransferWorkflows);

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
}: {
  workflow: TransferWorkflow;
  onBack: () => void;
}) {
  const [expandedStage, setExpandedStage] = useState<number | null>(
    workflow.stages.findIndex((s) => s.status === "in-progress")
  );
  const [stages, setStages] = useState<TransferStage[]>(workflow.stages);
  const [activityLog] = useState(workflow.activityLog);
  const [signOffStage, setSignOffStage] = useState<number | null>(null);

  const handleTaskToggle = (stageIndex: number, taskIndex: number) => {
    setStages((prev) => {
      const updated = [...prev];
      const stage = { ...updated[stageIndex] };
      if (stage.items) {
        const items = [...stage.items];
        items[taskIndex] = { ...items[taskIndex], completed: !items[taskIndex].completed };
        stage.items = items;
      }
      updated[stageIndex] = stage;
      return updated;
    });
  };

  const handleSignOff = (stageIndex: number, notes: string) => {
    setStages((prev) => {
      const updated = [...prev];
      const stage = { ...updated[stageIndex] };
      stage.status = "completed";
      stage.completedBy = "Current User";
      stage.completedDate = new Date().toISOString().split("T")[0];
      stage.notes = notes || "Stage signed off.";
      updated[stageIndex] = stage;
      if (stageIndex + 1 < updated.length) {
        const next = { ...updated[stageIndex + 1] };
        if (next.status === "pending") {
          next.status = "in-progress";
          updated[stageIndex + 1] = next;
        }
      }
      return updated;
    });
    setSignOffStage(null);
  };

  const progressStages = stages.map((s) => ({
    name: s.name,
    status: s.status as "completed" | "in-progress" | "pending",
    assignedTo: s.assignedTo,
    site: s.site,
  }));

  // Split stages for dual-panel view
  const originStages = stages.filter(
    (s) =>
      s.name.includes("Origin") ||
      s.name === "HR Initiation" ||
      (s.name === "HQ HR Final Approval" && s.site === "HQ")
  );
  const destStages = stages.filter((s) => s.name.includes("Destination"));
  const approvalStages = stages.filter(
    (s) => s.name.includes("HOD") || s.name === "Origin Site HR" || s.name === "HQ HR Final Approval"
  );

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
              <div className="text-[10px] text-[#737373] mt-0.5">{stage.site}</div>
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

function NewTransferWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [destinationSite, setDestinationSite] = useState("");
  const [destinationDept, setDestinationDept] = useState("");
  const [destinationPosition, setDestinationPosition] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [transferReason, setTransferReason] = useState("");

  // Step 2: IT Hardware
  const [hardwareDecisions, setHardwareDecisions] = useState([
    { item: "Dell Latitude 5520", assetTag: "DELL-2024-001", decision: "return" as string },
    { item: "HP LaserJet Printer", assetTag: "HP-2024-001", decision: "return" as string },
    { item: "Motorola Radio", assetTag: "RADIO-2024-001", decision: "return" as string },
  ]);
  const [m365Decision, setM365Decision] = useState("transfer");

  // Step 3: Security
  const [newIdCard, setNewIdCard] = useState(true);
  const [newVehicleCard, setNewVehicleCard] = useState(false);

  // Step 5: Confirm
  const [confirmed, setConfirmed] = useState(false);

  const resetForm = () => {
    setStep(0);
    setSelectedEmployee("");
    setDestinationSite("");
    setDestinationDept("");
    setDestinationPosition("");
    setEffectiveDate("");
    setTransferReason("");
    setConfirmed(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedEmpData = activeEmployeesForOffboarding.find((e) => e.id === selectedEmployee);
  const originSite = selectedEmpData?.site || "";

  const canProceed = () => {
    if (step === 0) return selectedEmployee && destinationSite && effectiveDate;
    if (step === 4) return confirmed;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[900px] max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E5E4E0]">
          <DialogTitle className="text-[18px] font-semibold">New Transfer</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <WizardStepper steps={TRANSFER_STEPS} currentStep={step} />

          {/* Step 1: Transfer Details */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                  Select Employee <span className="text-[#B91C1C]">*</span>
                </label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="h-10 text-[13px]">
                    <SelectValue placeholder="Choose an active employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployeesForOffboarding.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-[13px]">
                        {emp.name} ({emp.code}) — {emp.site}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmpData && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAFAF8] border border-[#E5E4E0] rounded-lg">
                  <div>
                    <div className="text-[10px] uppercase text-[#737373] font-medium">Current Site</div>
                    <div className="text-[13px] font-medium text-[#1A1A1A]">{selectedEmpData.site}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#737373] font-medium">Department</div>
                    <div className="text-[13px] font-medium text-[#1A1A1A]">{selectedEmpData.department}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                    Destination Site <span className="text-[#B91C1C]">*</span>
                  </label>
                  <Select value={destinationSite} onValueChange={setDestinationSite}>
                    <SelectTrigger className="h-10 text-[13px]">
                      <SelectValue placeholder="Select site..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allSites
                        .filter((s) => s !== originSite)
                        .map((s) => (
                          <SelectItem key={s} value={s} className="text-[13px]">
                            {s}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                    Destination Department
                  </label>
                  <Input
                    placeholder="e.g. Engineering"
                    value={destinationDept}
                    onChange={(e) => setDestinationDept(e.target.value)}
                    className="h-10 text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                    New Position
                  </label>
                  <Input
                    placeholder="e.g. Senior Engineer"
                    value={destinationPosition}
                    onChange={(e) => setDestinationPosition(e.target.value)}
                    className="h-10 text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                    Effective Date <span className="text-[#B91C1C]">*</span>
                  </label>
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="h-10 text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                  Transfer Reason
                </label>
                <Textarea
                  placeholder="Optional reason for the transfer..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="min-h-[60px] text-[13px]"
                />
              </div>
            </div>
          )}

          {/* Step 2: IT Hardware Decision */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <h3 className="text-[14px] font-semibold text-[#1A1A1A]">IT Hardware Decision</h3>
              <p className="text-[12px] text-[#525252]">
                For each hardware item, decide whether the employee moves with it or returns it to
                the origin site.
              </p>

              <div className="space-y-3">
                {hardwareDecisions.map((hw, i) => (
                  <div key={hw.assetTag} className="p-3 border border-[#E5E4E0] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-[13px] font-medium text-[#1A1A1A]">{hw.item}</div>
                        <div className="text-[10px] text-[#737373]">{hw.assetTag}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {["return", "move"].map((decision) => (
                        <button
                          key={decision}
                          onClick={() => {
                            const updated = [...hardwareDecisions];
                            updated[i] = { ...hw, decision };
                            setHardwareDecisions(updated);
                          }}
                          className={cn(
                            "flex-1 py-1.5 rounded-md text-[11px] font-medium border transition-all",
                            hw.decision === decision
                              ? decision === "return"
                                ? "bg-[#FEF2F2] border-[#B91C1C] text-[#B91C1C]"
                                : "bg-[#E8F5EC] border-[#1B7A43] text-[#1B7A43]"
                              : "bg-white border-[#E5E4E0] text-[#525252] hover:border-[#C4C3BF]"
                          )}
                        >
                          {decision === "return" ? "Return to Origin" : "Move with Employee"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-2 block">
                  M365 Account
                </label>
                <div className="flex gap-2">
                  {["transfer", "new"].map((decision) => (
                    <button
                      key={decision}
                      onClick={() => setM365Decision(decision)}
                      className={cn(
                        "flex-1 py-2 rounded-md text-[12px] font-medium border transition-all",
                        m365Decision === decision
                          ? "bg-[#E8F2FA] border-[#1E6BA3] text-[#1E6BA3]"
                          : "bg-white border-[#E5E4E0] text-[#525252] hover:border-[#C4C3BF]"
                      )}
                    >
                      {decision === "transfer" ? "Transfer Account" : "Disable & Create New"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Security */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Security Requirements</h3>

              <div className="grid grid-cols-2 gap-5">
                <div className="p-4 border border-[#E5E4E0] rounded-lg">
                  <div className="text-[12px] font-semibold text-[#B91C1C] mb-3">
                    Origin Site
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                      <Checkbox defaultChecked />
                      Collect existing ID card
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                      <Checkbox defaultChecked />
                      Collect existing vehicle card
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                      <Checkbox defaultChecked />
                      Revoke all origin access zones
                    </label>
                  </div>
                </div>

                <div className="p-4 border border-[#E5E4E0] rounded-lg">
                  <div className="text-[12px] font-semibold text-[#1B7A43] mb-3">
                    Destination Site
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                      <Checkbox checked={newIdCard} onCheckedChange={(c) => setNewIdCard(!!c)} />
                      Issue new ID card
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                      <Checkbox
                        checked={newVehicleCard}
                        onCheckedChange={(c) => setNewVehicleCard(!!c)}
                      />
                      Issue new vehicle card
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[12px]">
                      <Checkbox defaultChecked />
                      Configure destination access zones
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Approval Chain Preview */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Approval Chain</h3>
              <p className="text-[12px] text-[#525252]">
                This transfer will go through the following 9-stage approval process:
              </p>

              <div className="space-y-2">
                {[
                  { stage: "HR Initiation", site: "HQ", role: "HQ HR" },
                  { stage: "Origin IT Clearance", site: originSite || "Origin", role: "Site IT" },
                  { stage: "Origin Security Clearance", site: originSite || "Origin", role: "Site Security" },
                  { stage: "Destination IT Preparation", site: destinationSite || "Destination", role: "Site IT" },
                  { stage: "Destination Security Preparation", site: destinationSite || "Destination", role: "Site Security" },
                  { stage: "Origin HOD Sign-off", site: originSite || "Origin", role: "HOD" },
                  { stage: "Destination HOD Sign-off", site: destinationSite || "Destination", role: "HOD" },
                  { stage: "Origin Site HR", site: originSite || "Origin", role: "Site HR" },
                  { stage: "HQ HR Final Approval", site: "HQ", role: "HQ HR" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 bg-[#FAFAF8] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#E5E4E0] flex items-center justify-center text-[10px] font-bold text-[#525252]">
                        {i + 1}
                      </div>
                      <div className="text-[12px] font-medium text-[#1A1A1A]">{item.stage}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] h-5 bg-[#F4F3EF]">
                        {item.site}
                      </Badge>
                      <span className="text-[11px] text-[#737373]">{item.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Review & Submit</h3>

              {selectedEmpData && (
                <div className="p-4 bg-[#FAFAF8] border border-[#E5E4E0] rounded-lg space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#737373]">Employee</span>
                    <span className="font-medium text-[#1A1A1A]">{selectedEmpData.name}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#737373]">Transfer</span>
                    <span className="font-medium text-[#1A1A1A]">
                      {originSite} &rarr; {destinationSite}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#737373]">Effective Date</span>
                    <span className="font-medium text-[#1A1A1A]">{effectiveDate}</span>
                  </div>
                  {destinationPosition && (
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#737373]">New Position</span>
                      <span className="font-medium text-[#1A1A1A]">{destinationPosition}</span>
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} />
                <span className="text-[12px] text-[#525252]">
                  I confirm all details are accurate and the transfer is authorized.
                </span>
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[#E5E4E0]">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="text-[13px]">
              Back
            </Button>
          )}
          {step < TRANSFER_STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleClose}
              disabled={!canProceed()}
              className="bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]"
            >
              Submit Transfer Request
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ====================================================================
// MAIN TRANSFER PAGE
// ====================================================================

export default function Transfers() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (id) {
    const workflow = getTransferById(id);
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
    return <TransferDetail workflow={workflow} onBack={() => navigate("/transfers")} />;
  }

  return (
    <>
      <TransferList
        onNewTransfer={() => setWizardOpen(true)}
        onViewDetail={(workflowId) => navigate(`/transfers/${workflowId}`)}
      />
      <NewTransferWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}
