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
import { useOffboarding, type LiveOffboardingWorkflow, type OffboardingCandidate } from "@/hooks/useOffboarding";
import type { LiveTask } from "@/hooks/useOnboarding";
import OffboardingLetter from "@/components/OffboardingLetter";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  ChevronLeft,
  Download,
  Check,
  UserMinus,
  MonitorOff,
  ShieldOff,
  Wrench,
  MapPin,
  Building,
  AlertTriangle,
} from "lucide-react";

const STAGE_COLORS: Record<string, string> = {
  "HR Initiation": "bg-[#E8F2FA] text-[#1E6BA3]",
  "IT Clearance": "bg-[#F3E8FF] text-[#7C3AED]",
  "Security Clearance": "bg-[#E8F2FA] text-[#1E6BA3]",
  "Admin Clearance": "bg-[#F5F5F5] text-[#737373]",
  "HOD Sign-off": "bg-[#FDF3E0] text-[#C27A06]",
  "HR Final Clearance": "bg-[#FEF2F2] text-[#B91C1C]",
};

const TYPE_COLORS: Record<string, string> = {
  Resignation: "bg-[#E8F2FA] text-[#1E6BA3]",
  "Contract End": "bg-[#F5F5F5] text-[#737373]",
  Retirement: "bg-[#E8F5EC] text-[#1B7A43]",
  Termination: "bg-[#FEF2F2] text-[#B91C1C]",
  Redundancy: "bg-[#FDF3E0] text-[#C27A06]",
};

const OFFBOARDING_STEPS = ["Select Employee", "Clearance Requirements", "Review & Submit"];

// ====================================================================
// OFFBOARDING LIST VIEW
// ====================================================================

function OffboardingList({
  workflows,
  loadError,
  onNewOffboarding,
  onViewDetail,
}: {
  workflows: LiveOffboardingWorkflow[];
  loadError: string | null;
  onNewOffboarding: () => void;
  onViewDetail: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [stageFilter, setStageFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      const matchSearch =
        !search ||
        w.employee.name.toLowerCase().includes(search.toLowerCase()) ||
        w.reference.toLowerCase().includes(search.toLowerCase());
      const matchSite = siteFilter === "All" || w.employee.site === siteFilter;
      const matchStatus = statusFilter === "All" || w.status === statusFilter;
      const matchStage = stageFilter === "All" || w.currentStage === stageFilter;
      return matchSearch && matchSite && matchStatus && matchStage;
    });
  }, [workflows, search, siteFilter, statusFilter, stageFilter]);

  const uniqueSites = useMemo(() => {
    const s = new Set(workflows.map((w) => w.employee.site));
    return ["All", ...Array.from(s)];
  }, [workflows]);

  const uniqueStages = useMemo(() => {
    const s = new Set(workflows.map((w) => w.currentStage));
    return ["All", ...Array.from(s)];
  }, [workflows]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">Failed to load workflows: {loadError}</div>
      )}
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] tracking-[-0.02em]">
            Offboarding Hub
          </h1>
          <p className="text-[13px] text-[#525252] mt-0.5">
            Manage employee exits and clearance workflows across all sites
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
            onClick={onNewOffboarding}
            className="h-10 gap-1.5 text-[13px] bg-[#D4A017] hover:bg-[#A67C0A] text-white"
          >
            <Plus className="w-4 h-4" />
            New Offboarding
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

        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-[140px] h-9 text-[13px]">
            <SelectValue placeholder="Site" />
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

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px] h-9 text-[13px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            {uniqueStages.map((s) => (
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
                Site
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252]">
                Department
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252]">
                Initiated
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252]">
                Last Working Day
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
                  <span className="text-[12px] font-semibold text-[#B91C1C]">
                    {workflow.reference}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#B91C1C] flex items-center justify-center text-white text-[11px] font-semibold">
                      {workflow.employee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#1A1A1A]">
                        {workflow.employee.name}
                      </div>
                      <div className="text-[11px] text-[#737373]">
                        {workflow.employee.code}
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mt-0.5 text-[10px] h-5",
                          TYPE_COLORS[workflow.offboardingType] ?? "bg-[#F5F5F5] text-[#737373]"
                        )}
                      >
                        {workflow.offboardingType}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-[12px] text-[#525252]">
                  {workflow.employee.site}
                </TableCell>
                <TableCell className="text-[12px] text-[#525252]">
                  {workflow.employee.department}
                </TableCell>
                <TableCell className="text-[12px] text-[#525252]">
                  {workflow.initiatedDate}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-[12px] font-medium",
                      new Date(workflow.lastWorkingDate) < new Date(Date.now() + 7 * 86400000)
                        ? "text-[#B91C1C]"
                        : "text-[#525252]"
                    )}
                  >
                    {workflow.lastWorkingDate}
                  </span>
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
                        className="h-full bg-[#B91C1C] rounded-full transition-all duration-500"
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
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <UserMinus className="w-12 h-12 text-[#9C9C9C] opacity-40 mb-3" />
                    <div className="text-[14px] font-medium text-[#1A1A1A] mb-1">
                      No offboarding workflows found
                    </div>
                    <div className="text-[12px] text-[#525252] mb-4">
                      Try adjusting your filters or create a new offboarding.
                    </div>
                    <Button
                      onClick={onNewOffboarding}
                      className="bg-[#D4A017] hover:bg-[#A67C0A] text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Offboarding
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
// OFFBOARDING DETAIL VIEW
// ====================================================================

function OffboardingDetail({
  workflow,
  onBack,
  onTaskStatus,
}: {
  workflow: LiveOffboardingWorkflow;
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
  const [letterOpen, setLetterOpen] = useState(false);

  const daysRemaining = Math.ceil(
    (new Date(workflow.lastWorkingDate).getTime() - Date.now()) / 86400000
  );

  const handleTaskToggle = async (stageIndex: number, taskIndex: number) => {
    const task = stages[stageIndex]?.tasks?.[taskIndex];
    if (!task || busy) return;
    setBusy(true);
    setActionError(null);
    const err = await onTaskStatus(task.id, task.completed ? "pending" : "completed");
    setBusy(false);
    if (err) setActionError(err);
  };

  const handleSignOff = async (stageIndex: number, notes: string) => {
    const stage = stages[stageIndex];
    if (!stage?.tasks || busy) return;
    setBusy(true);
    setActionError(null);
    for (const t of stage.tasks) {
      if (t.required && !t.completed) {
        const err = await onTaskStatus(t.id, "completed", notes || undefined);
        if (err) { setActionError(err); setBusy(false); return; }
      }
    }
    setBusy(false);
    setSignOffStage(null);
  }

  const progressStages = stages.map((s) => ({
    name: s.name,
    status: s.status as "completed" | "in-progress" | "pending",
    assignedTo: s.assignedTo,
  }));

  return (
    <div className="animate-in fade-in duration-300">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] text-[#D4A017] hover:underline mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Offboarding Hub
      </button>
      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-[10px] border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{actionError}</div>
      )}
      {workflow.status === "Completed" && (
        <div className="mb-4 px-4 py-3 rounded-[10px] border border-[#1B7A43]/30 bg-[#1B7A43]/5 flex items-center justify-between">
          <span className="text-[13px] text-[#1B7A43] font-medium">Offboarding complete — all departmental clearances obtained.</span>
          <Button size="sm" onClick={() => setLetterOpen(true)} className="bg-[#1B7A43] hover:bg-[#14603a] text-white text-[12px] h-8">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Offboarding Letter
          </Button>
        </div>
      )}
      <OffboardingLetter workflow={workflow} open={letterOpen} onClose={() => setLetterOpen(false)} />

      {/* Header Card */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-[#FEF2F2] border border-[#B91C1C] rounded-full">
              <span className="text-[#B91C1C] text-[14px] font-bold">{workflow.reference}</span>
            </div>
            <div>
              <div className="text-[18px] font-semibold text-[#1A1A1A]">
                {workflow.employee.name}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[#525252] mt-0.5">
                <MapPin className="w-3 h-3" />
                {workflow.employee.site}
                <span className="text-[#9C9C9C]">·</span>
                <Building className="w-3 h-3" />
                {workflow.employee.department}
                <span className="text-[#9C9C9C]">·</span>
                <span className={cn(
                  "font-medium",
                  daysRemaining < 7 ? "text-[#B91C1C]" : daysRemaining < 14 ? "text-[#C27A06]" : "text-[#1B7A43]"
                )}>
                  {daysRemaining > 0 ? `${daysRemaining} days until departure` : "Last working day passed"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[14px] font-semibold text-[#B91C1C]">
                {workflow.progress}% cleared
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
        <div className="mt-3 flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn("text-[10px] h-5", TYPE_COLORS[workflow.offboardingType])}
          >
            {workflow.offboardingType}
          </Badge>
          <span className="text-[11px] text-[#737373]">
            Last working day: <span className="font-medium text-[#1A1A1A]">{workflow.lastWorkingDate}</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <WorkflowProgressBar stages={progressStages} accentColor="danger" />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-5">
        {/* Left: Stage Details */}
        <div className="space-y-3">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-2">Clearance Stages</h3>
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
                    className="bg-[#B91C1C] hover:bg-[#991B1B] text-white text-[12px] h-8"
                    onClick={() => setSignOffStage(index)}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Clear Stage
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: Employee Snapshot */}
        <div>
          <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5 sticky top-4">
            <h3 className="text-[14px] font-semibold text-[#1A1A1A] mb-4">
              Employee Snapshot
            </h3>
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#B91C1C] flex items-center justify-center text-white text-[18px] font-bold mb-2">
                {workflow.employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="text-[15px] font-semibold text-[#1A1A1A]">
                {workflow.employee.name}
              </div>
              <div className="text-[12px] text-[#737373]">{workflow.employee.code}</div>
              <Badge
                variant="secondary"
                className="mt-2 bg-[#FEF2F2] text-[#B91C1C] text-[11px]"
              >
                Offboarding
              </Badge>
            </div>

            <div className="space-y-3 border-t border-[#E5E4E0] pt-4">
              <div className="flex justify-between">
                <span className="text-[12px] text-[#737373]">Site</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">
                  {workflow.employee.site}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-[#737373]">Department</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">
                  {workflow.employee.department}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-[#737373]">Type</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">
                  {workflow.offboardingType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-[#737373]">Initiated</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">
                  {workflow.initiatedDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-[#737373]">Last Working Day</span>
                <span
                  className={cn(
                    "text-[12px] font-medium",
                    daysRemaining < 7 ? "text-[#B91C1C]" : "text-[#1A1A1A]"
                  )}
                >
                  {workflow.lastWorkingDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-[#737373]">Initiated By</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">
                  {workflow.initiatedBy}
                </span>
              </div>
            </div>

            {daysRemaining < 7 && daysRemaining > 0 && (
              <div className="mt-4 p-3 bg-[#FEF2F2] rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#B91C1C]">
                  <span className="font-semibold">Urgent:</span> Less than {daysRemaining} days
                  remaining. Ensure all clearances are completed on time.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="mt-5 bg-white rounded-[10px] border border-[#E5E4E0] p-5">
        <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Activity Log</h3>
        <div className="relative pl-4">
          <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-[#E5E4E0]" />
          <div className="space-y-4">
            {activityLog.map((entry, index) => {
              const dotColor =
                entry.type === "complete"
                  ? "bg-[#1B7A43]"
                  : entry.type === "stage-start"
                  ? "bg-[#B91C1C]"
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
// NEW OFFBOARDING WIZARD
// ====================================================================

function NewOffboardingWizard({ open, onClose, candidates, onSubmit }: {
  open: boolean;
  onClose: () => void;
  candidates: OffboardingCandidate[];
  onSubmit: (input: { employeeId: string; terminationType: string; lastWorkingDay: string; reason?: string }) => Promise<{ id: string | null; error: string | null }>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [terminationType, setTerminationType] = useState("");
  const [lastWorkingDate, setLastWorkingDate] = useState("");
  const [reason, setReason] = useState("");

  // Step 2: Clearance
  const [itItems, setItItems] = useState([
    { label: "Disable M365 account", checked: true },
    { label: "Collect company laptop", checked: true },
    { label: "Collect mobile phone", checked: true },
    { label: "Revoke system access", checked: true },
    { label: "Return access cards", checked: true },
  ]);
  const [securityItems, setSecurityItems] = useState([
    { label: "Collect ID card", checked: true },
    { label: "Collect vehicle card", checked: true },
    { label: "Revoke site access", checked: true },
  ]);
  const [adminItems, setAdminItems] = useState([
    { label: "Return keys", checked: true },
    { label: "Clear locker", checked: true },
    { label: "Vacate parking bay", checked: true },
  ]);

  // Step 3: Confirm
  const [confirmed, setConfirmed] = useState(false);

  const resetForm = () => {
    setStep(0);
    setSelectedEmployee("");
    setTerminationType("");
    setLastWorkingDate("");
    setReason("");
    setConfirmed(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedEmpData = candidates.find((e) => e.id === selectedEmployee);

  const canProceed = () => {
    if (step === 0) return selectedEmployee && terminationType && lastWorkingDate;
    if (step === 2) return confirmed;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E5E4E0]">
          <DialogTitle className="text-[18px] font-semibold">New Offboarding</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <WizardStepper steps={OFFBOARDING_STEPS} currentStep={step} />

          {/* Step 1: Employee & Reason */}
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
                    {candidates.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-[13px]">
                        {emp.name} ({emp.code}) — {emp.site}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmpData && (
                <div className="p-3 bg-[#FAFAF8] border border-[#E5E4E0] rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#B91C1C] flex items-center justify-center text-white text-[13px] font-bold">
                    {selectedEmpData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#1A1A1A]">{selectedEmpData.name}</div>
                    <div className="text-[11px] text-[#737373]">
                      {selectedEmpData.code} · {selectedEmpData.site} · {selectedEmpData.department}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                  Termination Type <span className="text-[#B91C1C]">*</span>
                </label>
                <Select value={terminationType} onValueChange={setTerminationType}>
                  <SelectTrigger className="h-10 text-[13px]">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["Resignation", "Contract End", "Retirement", "Termination", "Redundancy"].map(
                      (t) => (
                        <SelectItem key={t} value={t} className="text-[13px]">
                          {t}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                  Last Working Date <span className="text-[#B91C1C]">*</span>
                </label>
                <Input
                  type="date"
                  value={lastWorkingDate}
                  onChange={(e) => setLastWorkingDate(e.target.value)}
                  className="h-10 text-[13px]"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                  Reason / Notes
                </label>
                <Textarea
                  placeholder="Optional context for the offboarding..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[80px] text-[13px]"
                />
              </div>
            </div>
          )}

          {/* Step 2: Clearance Requirements */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              {/* IT */}
              <div>
                <h4 className="text-[13px] font-semibold text-[#7C3AED] mb-2 flex items-center gap-1.5">
                  <MonitorOff className="w-3.5 h-3.5" />
                  IT Clearance
                </h4>
                <div className="space-y-2 pl-5">
                  {itItems.map((item, i) => (
                    <label key={i} className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={(c) => {
                          const updated = [...itItems];
                          updated[i] = { ...item, checked: !!c };
                          setItItems(updated);
                        }}
                      />
                      <span className="text-[12px] text-[#525252]">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Security */}
              <div>
                <h4 className="text-[13px] font-semibold text-[#1E6BA3] mb-2 flex items-center gap-1.5">
                  <ShieldOff className="w-3.5 h-3.5" />
                  Security Clearance
                </h4>
                <div className="space-y-2 pl-5">
                  {securityItems.map((item, i) => (
                    <label key={i} className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={(c) => {
                          const updated = [...securityItems];
                          updated[i] = { ...item, checked: !!c };
                          setSecurityItems(updated);
                        }}
                      />
                      <span className="text-[12px] text-[#525252]">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Admin */}
              <div>
                <h4 className="text-[13px] font-semibold text-[#525252] mb-2 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Admin Clearance
                </h4>
                <div className="space-y-2 pl-5">
                  {adminItems.map((item, i) => (
                    <label key={i} className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={(c) => {
                          const updated = [...adminItems];
                          updated[i] = { ...item, checked: !!c };
                          setAdminItems(updated);
                        }}
                      />
                      <span className="text-[12px] text-[#525252]">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Review & Submit</h3>

              {selectedEmpData && (
                <div className="p-4 bg-[#FAFAF8] border border-[#E5E4E0] rounded-lg space-y-2">
                  <div className="text-[13px] font-medium text-[#1A1A1A] mb-2">
                    Employee Summary
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#737373]">Name</span>
                    <span className="font-medium text-[#1A1A1A]">{selectedEmpData.name}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#737373]">Type</span>
                    <span className="font-medium text-[#1A1A1A]">{terminationType}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#737373]">Last Working Day</span>
                    <span className="font-medium text-[#1A1A1A]">{lastWorkingDate}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 border border-[#E5E4E0] rounded-lg">
                  <div className="text-[11px] font-semibold text-[#7C3AED] mb-1">IT</div>
                  <div className="text-[11px] text-[#525252]">
                    {itItems.filter((i) => i.checked).length} items to clear
                  </div>
                </div>
                <div className="p-3 border border-[#E5E4E0] rounded-lg">
                  <div className="text-[11px] font-semibold text-[#1E6BA3] mb-1">Security</div>
                  <div className="text-[11px] text-[#525252]">
                    {securityItems.filter((i) => i.checked).length} items to clear
                  </div>
                </div>
                <div className="p-3 border border-[#E5E4E0] rounded-lg">
                  <div className="text-[11px] font-semibold text-[#525252] mb-1">Admin</div>
                  <div className="text-[11px] text-[#525252]">
                    {adminItems.filter((i) => i.checked).length} items to clear
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} />
                <span className="text-[12px] text-[#525252]">
                  I confirm this offboarding is authorized and all details are accurate.
                </span>
              </label>
            </div>
          )}
        </div>

        {submitError && (
          <div className="mx-6 mb-2 px-4 py-3 rounded-lg border border-[#B91C1C]/30 bg-[#B91C1C]/5 text-[13px] text-[#B91C1C]">{submitError}</div>
        )}
        <DialogFooter className="px-6 py-4 border-t border-[#E5E4E0]">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="text-[13px]">
              Back
            </Button>
          )}
          {step < OFFBOARDING_STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={async () => {
                setSubmitting(true);
                setSubmitError(null);
                const res = await onSubmit({
                  employeeId: selectedEmployee,
                  terminationType: terminationType,
                  lastWorkingDay: lastWorkingDate,
                  reason: reason || undefined,
                });
                setSubmitting(false);
                if (res.error) { setSubmitError(res.error); return; }
                handleClose();
              }}
              disabled={!canProceed() || submitting}
              className="bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]"
            >
              {submitting ? "Initiating..." : "Submit & Initiate"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ====================================================================
// MAIN OFFBOARDING PAGE
// ====================================================================

export default function Offboarding() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { workflows, candidates, loading, error, startOffboarding, setTaskStatus } = useOffboarding();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#E5E4E0] border-t-[#D4A017] rounded-full animate-spin" />
        <p className="text-[13px] text-[#9C9C9C]">Loading offboarding workflows...</p>
      </div>
    );
  }

  if (id) {
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-[16px] font-semibold text-[#1A1A1A] mb-2">Offboarding not found</div>
          <div className="text-[13px] text-[#525252] mb-4">
            The offboarding workflow you are looking for does not exist.
          </div>
          <Button
            onClick={() => navigate("/offboarding")}
            className="bg-[#D4A017] hover:bg-[#A67C0A] text-white"
          >
            Back to Offboarding Hub
          </Button>
        </div>
      );
    }
    return <OffboardingDetail workflow={workflow} onBack={() => navigate("/offboarding")} onTaskStatus={setTaskStatus} />;
  }

  return (
    <>
      <OffboardingList
        workflows={workflows}
        loadError={error}
        onNewOffboarding={() => setWizardOpen(true)}
        onViewDetail={(workflowId) => navigate(`/offboarding/${workflowId}`)}
      />
      <NewOffboardingWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        candidates={candidates}
        onSubmit={async (input) => {
          const res = await startOffboarding(input);
          if (res.id) navigate(`/offboarding/${res.id}`);
          return res;
        }}
      />
    </>
  );
}
