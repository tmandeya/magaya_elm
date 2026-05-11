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
import { mockOnboardingWorkflows, pendingEmployees, getOnboardingById } from "@/data/workflowData";
import type { OnboardingWorkflow, OnboardingStage } from "@/types/workflow";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  ChevronLeft,
  Download,
  Check,
  UserPlus,
  Calendar,
  MapPin,
  Building,
} from "lucide-react";

const STAGE_COLORS: Record<string, string> = {
  "HR Initiation": "bg-[#E8F2FA] text-[#1E6BA3]",
  "Security Clearance": "bg-[#FDF3E0] text-[#C27A06]",
  "IT Provisioning": "bg-[#FDF3E0] text-[#C27A06]",
  "Admin Setup": "bg-[#FDF3E0] text-[#C27A06]",
  "HOD Acknowledgment": "bg-[#FDF3E0] text-[#C27A06]",
  "HR Completion": "bg-[#E8F5EC] text-[#1B7A43]",
};

const STEPS = ["Select Employee", "Security Setup", "IT Provisioning", "Admin Setup", "Review & Submit"];

// ====================================================================
// ONBOARDING LIST VIEW
// ====================================================================

function OnboardingList({
  onNewOnboarding,
  onViewDetail,
}: {
  onNewOnboarding: () => void;
  onViewDetail: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [stageFilter, setStageFilter] = useState<string>("All");
  const [workflows] = useState<OnboardingWorkflow[]>(mockOnboardingWorkflows);

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      const matchSearch =
        !search ||
        w.employee.name.toLowerCase().includes(search.toLowerCase()) ||
        w.reference.toLowerCase().includes(search.toLowerCase()) ||
        w.employee.code.toLowerCase().includes(search.toLowerCase());
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
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1A1A] tracking-[-0.02em]">
            Onboarding Hub
          </h1>
          <p className="text-[13px] text-[#525252] mt-0.5">
            Track and manage employee onboarding workflows across all sites
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
            onClick={onNewOnboarding}
            className="h-10 gap-1.5 text-[13px] bg-[#D4A017] hover:bg-[#A67C0A] text-white"
          >
            <Plus className="w-4 h-4" />
            New Onboarding
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
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] w-[120px]">
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
                Stage
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] w-[120px]">
                Progress
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252]">
                Initiated By
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] w-[80px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((workflow) => (
              <TableRow
                key={workflow.id}
                className="h-[52px] cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                onClick={() => onViewDetail(workflow.id)}
              >
                <TableCell>
                  <span className="text-[13px] font-semibold text-[#D4A017]">
                    {workflow.reference}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[11px] font-semibold">
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
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#525252]">
                  {workflow.employee.site}
                </TableCell>
                <TableCell className="text-[13px] text-[#525252]">
                  {workflow.employee.department}
                </TableCell>
                <TableCell className="text-[12px] text-[#525252]">
                  {workflow.initiatedDate}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[11px] font-medium h-6",
                      STAGE_COLORS[workflow.currentStage] ?? "bg-[#F4F3EF] text-[#525252]"
                    )}
                  >
                    {workflow.currentStage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-[80px] h-1.5 bg-[#E5E4E0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4A017] rounded-full transition-all duration-500"
                        style={{ width: `${workflow.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#737373] font-medium">
                      {workflow.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-[12px] text-[#525252]">
                  {workflow.initiatedBy}
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
                    <UserPlus className="w-12 h-12 text-[#9C9C9C] opacity-40 mb-3" />
                    <div className="text-[14px] font-medium text-[#1A1A1A] mb-1">
                      No onboarding workflows found
                    </div>
                    <div className="text-[12px] text-[#525252] mb-4">
                      Try adjusting your filters or create a new onboarding.
                    </div>
                    <Button
                      onClick={onNewOnboarding}
                      className="bg-[#D4A017] hover:bg-[#A67C0A] text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Onboarding
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
// ONBOARDING DETAIL VIEW
// ====================================================================

function OnboardingDetail({
  workflow,
  onBack,
}: {
  workflow: OnboardingWorkflow;
  onBack: () => void;
}) {
  const [expandedStage, setExpandedStage] = useState<number | null>(
    workflow.stages.findIndex((s) => s.status === "in-progress")
  );
  const [stages, setStages] = useState<OnboardingStage[]>(workflow.stages);
  const [activityLog] = useState(workflow.activityLog);
  const [signOffStage, setSignOffStage] = useState<number | null>(null);

  const handleTaskToggle = (stageIndex: number, taskIndex: number) => {
    setStages((prev) => {
      const updated = [...prev];
      const stage = { ...updated[stageIndex] };
      if (stage.tasks) {
        const tasks = [...stage.tasks];
        tasks[taskIndex] = { ...tasks[taskIndex], completed: !tasks[taskIndex].completed };
        stage.tasks = tasks;
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

      // Advance next stage
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

  const currentStageIndex = stages.findIndex((s) => s.status === "in-progress");
  const progressPercent = Math.round(
    ((stages.filter((s) => s.status === "completed").length + (currentStageIndex >= 0 ? 0.5 : 0)) /
      stages.length) *
      100
  );

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
        Back to Onboarding Hub
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-[#D4A017] rounded-full">
              <span className="text-white text-[14px] font-bold">{workflow.reference}</span>
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
                <Calendar className="w-3 h-3" />
                Started {workflow.initiatedDate}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[14px] font-semibold text-[#D4A017]">
                {progressPercent}% complete
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
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <WorkflowProgressBar stages={progressStages} accentColor="gold" />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-5">
        {/* Left: Stage Details */}
        <div className="space-y-3">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-2">Stage Details</h3>
          {stages.map((stage, index) => (
            <div key={stage.name}>
              <WorkflowStageCard
                stage={stage}
                stageIndex={index}
                isExpanded={expandedStage === index}
                onToggle={() =>
                  setExpandedStage(expandedStage === index ? null : index)
                }
                onTaskToggle={handleTaskToggle}
              />
              {expandedStage === index &&
                stage.status === "in-progress" &&
                signOffStage === index && (
                  <SignOffForm
                    stageName={stage.name}
                    onSignOff={(notes) => handleSignOff(index, notes)}
                    onCancel={() => setSignOffStage(null)}
                  />
                )}
              {expandedStage === index &&
                stage.status === "in-progress" &&
                signOffStage !== index && (
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[12px] h-8"
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

        {/* Right: Employee Snapshot */}
        <div>
          <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5 sticky top-4">
            <h3 className="text-[14px] font-semibold text-[#1A1A1A] mb-4">
              Employee Snapshot
            </h3>
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[18px] font-bold mb-2">
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
                className="mt-2 bg-[#FDF3E0] text-[#C27A06] text-[11px]"
              >
                Onboarding
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
                <span className="text-[12px] text-[#737373]">Initiated</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">
                  {workflow.initiatedDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-[#737373]">Expected Completion</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">
                  {workflow.expectedCompletion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-[#737373]">Initiated By</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">
                  {workflow.initiatedBy}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="mt-5 bg-white rounded-[10px] border border-[#E5E4E0] p-5">
        <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Activity Log</h3>
        <div className="relative pl-4">
          {/* Timeline line */}
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
                    <div className="text-[13px] font-medium text-[#1A1A1A]">
                      {entry.message}
                    </div>
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
// NEW ONBOARDING WIZARD
// ====================================================================

function NewOnboardingWizard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expectedCompletion, setExpectedCompletion] = useState("");
  const [notes, setNotes] = useState("");

  // Step 1: Security
  const [needsIdCard, setNeedsIdCard] = useState(true);
  const [needsVehicleCard, setNeedsVehicleCard] = useState(false);
  const [clearanceLevel, setClearanceLevel] = useState("Level 2");

  // Step 2: IT
  const [m365Needed, setM365Needed] = useState(true);
  const [selectedHardware, setSelectedHardware] = useState<string[]>(["Laptop"]);
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>(["Office 365"]);

  // Step 3: Admin
  const [parkingNeeded, setParkingNeeded] = useState(false);
  const [lockerNeeded, setLockerNeeded] = useState(false);
  const [inductionNeeded, setInductionNeeded] = useState(true);

  // Step 4: Confirm
  const [confirmed, setConfirmed] = useState(false);

  const resetForm = () => {
    setStep(0);
    setSelectedEmployee("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setExpectedCompletion("");
    setNotes("");
    setNeedsIdCard(true);
    setNeedsVehicleCard(false);
    setClearanceLevel("Level 2");
    setM365Needed(true);
    setSelectedHardware(["Laptop"]);
    setSelectedSoftware(["Office 365"]);
    setParkingNeeded(false);
    setLockerNeeded(false);
    setInductionNeeded(true);
    setConfirmed(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedEmpData = pendingEmployees.find((e) => e.id === selectedEmployee);

  const toggleHardware = (item: string) => {
    setSelectedHardware((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleSoftware = (item: string) => {
    setSelectedSoftware((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const canProceed = () => {
    if (step === 0) return selectedEmployee && startDate;
    if (step === 4) return confirmed;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[800px] max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E5E4E0]">
          <DialogTitle className="text-[18px] font-semibold">New Onboarding</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <WizardStepper steps={STEPS} currentStep={step} />

          {/* Step 1: Employee Selection */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                  Select Employee <span className="text-[#B91C1C]">*</span>
                </label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="h-10 text-[13px]">
                    <SelectValue placeholder="Choose a pending employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-[13px]">
                        {emp.name} ({emp.code}) — {emp.site}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmpData && (
                <div className="p-3 bg-[#FAFAF8] border border-[#E5E4E0] rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center text-white text-[13px] font-bold">
                    {selectedEmpData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#1A1A1A]">
                      {selectedEmpData.name}
                    </div>
                    <div className="text-[11px] text-[#737373]">
                      {selectedEmpData.code} · {selectedEmpData.site} ·{" "}
                      {selectedEmpData.department}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                    Start Date <span className="text-[#B91C1C]">*</span>
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                    Expected Completion
                  </label>
                  <Input
                    type="date"
                    value={expectedCompletion}
                    onChange={(e) => setExpectedCompletion(e.target.value)}
                    className="h-10 text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                  Notes
                </label>
                <Textarea
                  placeholder="Optional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px] text-[13px]"
                />
              </div>
            </div>
          )}

          {/* Step 2: Security */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <h3 className="text-[14px] font-semibold text-[#1A1A1A]">
                Security Clearance Requirements
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox checked={needsIdCard} onCheckedChange={(c) => setNeedsIdCard(!!c)} />
                  <span className="text-[13px]">Employee needs ID card</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={needsVehicleCard}
                    onCheckedChange={(c) => setNeedsVehicleCard(!!c)}
                  />
                  <span className="text-[13px]">Employee needs Vehicle card</span>
                </label>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-1.5 block">
                  Clearance Level
                </label>
                <Select value={clearanceLevel} onValueChange={setClearanceLevel}>
                  <SelectTrigger className="h-10 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Level 1", "Level 2", "Level 3", "Level 4"].map((l) => (
                      <SelectItem key={l} value={l} className="text-[13px]">
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-[#E8F2FA] rounded-lg text-[12px] text-[#1E6BA3]">
                Security officer will be automatically assigned based on selected employee&apos;s
                site.
              </div>
            </div>
          )}

          {/* Step 3: IT */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <h3 className="text-[14px] font-semibold text-[#1A1A1A]">IT Provisioning</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={m365Needed} onCheckedChange={(c) => setM365Needed(!!c)} />
                <span className="text-[13px]">M365 account needed</span>
              </label>

              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-2 block">
                  Hardware Required
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Laptop", "Desktop", "Monitor", "Phone", "Printer", "Radio"].map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleHardware(item)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[12px] font-medium border transition-all",
                        selectedHardware.includes(item)
                          ? "bg-[#D4A017] border-[#D4A017] text-white"
                          : "bg-white border-[#E5E4E0] text-[#525252] hover:border-[#C4C3BF]"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#525252] mb-2 block">
                  Software Required
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Office 365", "ERP", "Security Software", "AutoCAD", "SAP"].map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleSoftware(item)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[12px] font-medium border transition-all",
                        selectedSoftware.includes(item)
                          ? "bg-[#D4A017] border-[#D4A017] text-white"
                          : "bg-white border-[#E5E4E0] text-[#525252] hover:border-[#C4C3BF]"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Admin */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <h3 className="text-[14px] font-semibold text-[#1A1A1A]">Administrative Setup</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={parkingNeeded}
                    onCheckedChange={(c) => setParkingNeeded(!!c)}
                  />
                  <span className="text-[13px]">Parking bay needed</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={lockerNeeded}
                    onCheckedChange={(c) => setLockerNeeded(!!c)}
                  />
                  <span className="text-[13px]">Locker needed</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={inductionNeeded}
                    onCheckedChange={(c) => setInductionNeeded(!!c)}
                  />
                  <span className="text-[13px]">Building induction required</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 4 && (
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
                    <span className="text-[#737373]">Code</span>
                    <span className="font-medium text-[#1A1A1A]">{selectedEmpData.code}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#737373]">Site</span>
                    <span className="font-medium text-[#1A1A1A]">{selectedEmpData.site}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#737373]">Department</span>
                    <span className="font-medium text-[#1A1A1A]">
                      {selectedEmpData.department}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#737373]">Start Date</span>
                    <span className="font-medium text-[#1A1A1A]">{startDate}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 border border-[#E5E4E0] rounded-lg">
                  <div className="text-[11px] font-semibold text-[#C27A06] mb-1.5">
                    Security
                  </div>
                  <div className="text-[11px] text-[#525252] space-y-0.5">
                    <div>ID Card: {needsIdCard ? "Yes" : "No"}</div>
                    <div>Vehicle Card: {needsVehicleCard ? "Yes" : "No"}</div>
                    <div>Level: {clearanceLevel}</div>
                  </div>
                </div>
                <div className="p-3 border border-[#E5E4E0] rounded-lg">
                  <div className="text-[11px] font-semibold text-[#7C3AED] mb-1.5">IT</div>
                  <div className="text-[11px] text-[#525252] space-y-0.5">
                    <div>M365: {m365Needed ? "Yes" : "No"}</div>
                    <div>Hardware: {selectedHardware.join(", ") || "None"}</div>
                    <div>Software: {selectedSoftware.join(", ") || "None"}</div>
                  </div>
                </div>
                <div className="p-3 border border-[#E5E4E0] rounded-lg">
                  <div className="text-[11px] font-semibold text-[#525252] mb-1.5">Admin</div>
                  <div className="text-[11px] text-[#525252] space-y-0.5">
                    <div>Parking: {parkingNeeded ? "Yes" : "No"}</div>
                    <div>Locker: {lockerNeeded ? "Yes" : "No"}</div>
                    <div>Induction: {inductionNeeded ? "Yes" : "No"}</div>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <Checkbox checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} />
                <span className="text-[12px] text-[#525252]">
                  I confirm all details are accurate and the onboarding process is ready to begin.
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
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={() => {
                handleClose();
              }}
              disabled={!canProceed()}
              className="bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[13px]"
            >
              Submit & Initiate
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ====================================================================
// MAIN ONBOARDING PAGE
// ====================================================================

export default function Onboarding() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);

  // Detail view
  if (id) {
    const workflow = getOnboardingById(id);
    if (!workflow) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-[16px] font-semibold text-[#1A1A1A] mb-2">
            Onboarding not found
          </div>
          <div className="text-[13px] text-[#525252] mb-4">
            The onboarding workflow you are looking for does not exist.
          </div>
          <Button
            onClick={() => navigate("/onboarding")}
            className="bg-[#D4A017] hover:bg-[#A67C0A] text-white"
          >
            Back to Onboarding Hub
          </Button>
        </div>
      );
    }
    return <OnboardingDetail workflow={workflow} onBack={() => navigate("/onboarding")} />;
  }

  // List view
  return (
    <>
      <OnboardingList
        onNewOnboarding={() => setWizardOpen(true)}
        onViewDetail={(workflowId) => navigate(`/onboarding/${workflowId}`)}
      />
      <NewOnboardingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}
