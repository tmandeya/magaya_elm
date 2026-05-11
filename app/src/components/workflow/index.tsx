import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronDown, ChevronUp, Lock } from "lucide-react";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface Stage {
  name: string;
  status: "completed" | "in-progress" | "pending";
  assignedTo: string;
  site?: string;
}

export interface WorkflowProgressBarProps {
  stages: Stage[];
  accentColor?: "gold" | "danger" | "info";
  onStageClick?: (index: number) => void;
  selectedStage?: number | null;
  twoRowLayout?: boolean;
  row1Count?: number;
}

export interface WizardStepperProps {
  steps: string[];
  currentStep: number;
}

export interface SignOffFormProps {
  onSignOff: (notes: string) => void;
  onCancel: () => void;
  stageName: string;
  canSignOff?: boolean;
}

export interface WorkflowStageCardProps {
  stage: Stage & {
    completedBy?: string | null;
    completedDate?: string | null;
    notes?: string | null;
    tasks?: { label: string; completed: boolean }[];
  };
  stageIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onTaskToggle?: (stageIndex: number, taskIndex: number) => void;
}

// ------------------------------------------------------------------
// WizardStepper
// ------------------------------------------------------------------

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="flex items-start justify-between mb-8 px-2">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div key={label} className="flex-1 flex flex-col items-center relative">
            {/* Connector line */}
            {index > 0 && (
              <div
                className={cn(
                  "absolute top-[14px] left-0 right-0 h-[2px] -translate-x-1/2",
                  index <= currentStep ? "bg-[#1B7A43]" : "bg-[#E5E4E0]"
                )}
                style={{ width: "100%" }}
              />
            )}

            {/* Circle */}
            <div
              className={cn(
                "relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold border-2 transition-all duration-200",
                isCompleted && "bg-[#1B7A43] border-[#1B7A43] text-white",
                isCurrent && "bg-[#D4A017] border-[#D4A017] text-white",
                isUpcoming && "bg-white border-[#E5E4E0] text-[#9C9C9C]"
              )}
            >
              {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
            </div>

            {/* Label */}
            <span
              className={cn(
                "mt-2 text-[11px] font-medium text-center leading-tight max-w-[80px]",
                isCompleted || isCurrent ? "text-[#1A1A1A]" : "text-[#9C9C9C]"
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------
// WorkflowProgressBar
// ------------------------------------------------------------------

export function WorkflowProgressBar({
  stages,
  accentColor = "gold",
  onStageClick,
  selectedStage,
  twoRowLayout = false,
  row1Count = 5,
}: WorkflowProgressBarProps) {
  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const activeSelection = selectedStage !== undefined ? selectedStage : localSelected;

  const handleClick = (index: number) => {
    if (onStageClick) {
      onStageClick(index);
    } else {
      setLocalSelected(activeSelection === index ? null : index);
    }
  };

  const completedCount = stages.filter((s) => s.status === "completed").length;
  const inProgressIndex = stages.findIndex((s) => s.status === "in-progress");
  const progressPercent =
    inProgressIndex >= 0
      ? ((completedCount + 0.5) / stages.length) * 100
      : (completedCount / stages.length) * 100;

  const accent = {
    gold: { fill: "bg-[#D4A017]", pulse: "ring-[#D4A017]" },
    danger: { fill: "bg-[#B91C1C]", pulse: "ring-[#B91C1C]" },
    info: { fill: "bg-[#1E6BA3]", pulse: "ring-[#1E6BA3]" },
  }[accentColor];

  const StageRow = ({
    rowStages,
    offset,
    showLabel,
  }: {
    rowStages: Stage[];
    offset: number;
    showLabel?: string;
  }) => (
    <div className="mb-4 last:mb-0">
      {showLabel && (
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] mb-3">
          {showLabel}
        </div>
      )}
      <div className="flex items-start justify-between relative">
        {/* Background track */}
        <div className="absolute top-[5px] left-0 right-0 h-[2px] bg-[#E5E4E0] rounded" />
        <div
          className={cn("absolute top-[5px] left-0 h-[2px] rounded transition-all duration-500", accent.fill)}
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />

        {rowStages.map((stage, i) => {
          const globalIndex = offset + i;
          const isCompleted = stage.status === "completed";
          const isInProgress = stage.status === "in-progress";
          const isPending = stage.status === "pending";
          const isSelected = activeSelection === globalIndex;
          const isClickable = isCompleted || isInProgress;

          return (
            <div
              key={stage.name + globalIndex}
              className={cn(
                "flex flex-col items-center relative z-10 flex-1",
                isClickable && "cursor-pointer"
              )}
              onClick={() => isClickable && handleClick(globalIndex)}
            >
              {/* Dot */}
              <div
                className={cn(
                  "w-3 h-3 rounded-full border-2 transition-all duration-200",
                  isCompleted && "bg-[#1B7A43] border-[#1B7A43]",
                  isInProgress && cn("bg-[#D4A017] border-[#D4A017]", accentColor === "danger" && "bg-[#B91C1C] border-[#B91C1C]", accentColor === "info" && "bg-[#1E6BA3] border-[#1E6BA3]"),
                  isPending && "bg-white border-[#E5E4E0]",
                  isInProgress && "ring-2 ring-offset-1 animate-pulse",
                  isInProgress && accent.pulse,
                  isSelected && "ring-2 ring-offset-2 ring-[#D4A017]"
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-[11px] font-semibold text-center leading-tight max-w-[90px]",
                  isCompleted && "text-[#1B7A43]",
                  isInProgress && "text-[#C27A06]",
                  isPending && "text-[#9C9C9C]"
                )}
              >
                {stage.name}
              </span>

              {/* Detail */}
              <span className="mt-0.5 text-[10px] text-[#737373] text-center max-w-[90px] leading-tight">
                {stage.assignedTo}
              </span>

              {stage.site && (
                <span className="mt-0.5 text-[10px] text-[#1E6BA3] font-medium">{stage.site}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (twoRowLayout) {
    const row1 = stages.slice(0, row1Count);
    const row2 = stages.slice(row1Count);
    return (
      <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5">
        <StageRow rowStages={row1} offset={0} showLabel="Clearance & Preparation" />
        <div className="border-t border-[#E5E4E0] my-4" />
        <StageRow rowStages={row2} offset={row1Count} showLabel="Approvals" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[10px] border border-[#E5E4E0] p-5">
      <StageRow rowStages={stages} offset={0} />
    </div>
  );
}

// ------------------------------------------------------------------
// WorkflowStageCard
// ------------------------------------------------------------------

export function WorkflowStageCard({
  stage,
  stageIndex,
  isExpanded,
  onToggle,
  onTaskToggle,
}: WorkflowStageCardProps) {
  const statusColors = {
    completed: { dot: "bg-[#1B7A43]", text: "text-[#1B7A43]" },
    "in-progress": { dot: "bg-[#C27A06]", text: "text-[#C27A06]" },
    pending: { dot: "bg-[#9C9C9C]", text: "text-[#9C9C9C]" },
  };

  const colors = statusColors[stage.status];

  return (
    <div className="bg-white rounded-[10px] border border-[#E5E4E0] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[#FAFAF8] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot, stage.status === "in-progress" && "ring-2 ring-offset-1 animate-pulse")} />
          <div>
            <div className="text-[13px] font-semibold text-[#1A1A1A]">{stage.name}</div>
            <div className="text-[11px] text-[#737373]">
              {stage.assignedTo}
              {stage.site && ` · ${stage.site}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stage.status === "completed" && stage.completedBy && (
            <span className="text-[11px] text-[#1B7A43] font-medium">
              Done by {stage.completedBy}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#9C9C9C]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#9C9C9C]" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[#E5E4E0]">
          {/* Completed info */}
          {stage.status === "completed" && stage.completedBy && (
            <div className="mt-3 p-3 bg-[#E8F5EC] rounded-lg">
              <div className="flex items-center gap-2 text-[12px] text-[#1B7A43]">
                <Check className="w-3.5 h-3.5" />
                <span className="font-medium">
                  Completed by {stage.completedBy}
                </span>
                {stage.completedDate && (
                  <span className="text-[#737373]">on {stage.completedDate}</span>
                )}
              </div>
              {stage.notes && (
                <p className="mt-1.5 text-[11px] text-[#525252] italic">{stage.notes}</p>
              )}
            </div>
          )}

          {/* Tasks */}
          {stage.tasks && stage.tasks.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#525252]">
                Tasks
              </div>
              {stage.tasks.map((task, taskIndex) => (
                <label
                  key={task.label + taskIndex}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onTaskToggle?.(stageIndex, taskIndex)}
                  />
                  <span
                    className={cn(
                      "text-[12px] transition-colors",
                      task.completed
                        ? "text-[#737373] line-through"
                        : "text-[#1A1A1A] group-hover:text-[#525252]"
                    )}
                  >
                    {task.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {stage.status === "pending" && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-[#9C9C9C]">
              <Lock className="w-3.5 h-3.5" />
              <span>Awaiting previous stage completion</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// SignOffForm
// ------------------------------------------------------------------

export function SignOffForm({ onSignOff, onCancel, stageName, canSignOff = true }: SignOffFormProps) {
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (!canSignOff) return null;

  return (
    <div className="mt-4 p-4 bg-[#FAFAF8] rounded-lg border border-[#E5E4E0]">
      <div className="text-[13px] font-semibold text-[#1A1A1A] mb-3">
        Sign Off {stageName}
      </div>

      <Textarea
        placeholder="Add notes (optional)..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="min-h-[80px] text-[13px] mb-3"
      />

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <Checkbox checked={confirmed} onCheckedChange={(checked) => setConfirmed(!!checked)} />
        <span className="text-[12px] text-[#525252]">
          I confirm all tasks for this stage are complete
        </span>
      </label>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-[#D4A017] hover:bg-[#A67C0A] text-white text-[12px]"
          disabled={!confirmed}
          onClick={() => {
            onSignOff(notes);
            setNotes("");
            setConfirmed(false);
          }}
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          Sign Off
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-[12px]"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
