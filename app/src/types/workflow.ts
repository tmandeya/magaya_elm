// ------------------------------------------------------------------
// Workflow-specific TypeScript types
// ------------------------------------------------------------------

export interface WorkflowEmployee {
  id: string;
  name: string;
  code: string;
  avatar: string | null;
  site: string;
  department: string;
}

export interface WorkflowTask {
  label: string;
  completed: boolean;
}

export interface OnboardingStage {
  name: string;
  status: "completed" | "in-progress" | "pending";
  assignedTo: string;
  completedBy: string | null;
  completedDate: string | null;
  notes: string | null;
  tasks?: WorkflowTask[];
}

export interface OffboardingStage {
  name: string;
  status: "completed" | "in-progress" | "pending";
  assignedTo: string;
  completedBy: string | null;
  completedDate: string | null;
  notes: string | null;
  tasks?: WorkflowTask[];
}

export interface TransferStage {
  name: string;
  status: "completed" | "in-progress" | "pending";
  site: string;
  assignedTo: string;
  completedBy: string | null;
  completedDate: string | null;
  notes: string | null;
  items?: WorkflowTask[];
}

export interface ActivityLogEntry {
  type: "stage-start" | "complete" | "comment" | "create" | "update" | "approve";
  message: string;
  timestamp: string;
  user: string;
}

export interface ITHardwareDecision {
  item: string;
  assetTag: string;
  decision: "return-to-origin" | "move-with-employee";
}

export interface OnboardingWorkflow {
  id: string;
  reference: string;
  employee: WorkflowEmployee;
  initiatedDate: string;
  expectedCompletion: string;
  currentStage: string;
  progress: number;
  initiatedBy: string;
  status: "In Progress" | "Completed" | "On Hold" | "Overdue";
  stages: OnboardingStage[];
  activityLog: ActivityLogEntry[];
}

export interface OffboardingWorkflow {
  id: string;
  reference: string;
  employee: WorkflowEmployee;
  initiatedDate: string;
  lastWorkingDate: string;
  offboardingType: string;
  currentStage: string;
  progress: number;
  initiatedBy: string;
  status: "In Progress" | "Completed" | "On Hold" | "Overdue";
  stages: OffboardingStage[];
  activityLog: ActivityLogEntry[];
}

export interface TransferWorkflow {
  id: string;
  reference: string;
  employee: WorkflowEmployee;
  originSite: string;
  destinationSite: string;
  destinationDepartment: string;
  destinationPosition: string;
  initiatedDate: string;
  effectiveDate: string;
  currentStage: string;
  progress: number;
  initiatedBy: string;
  status: "In Progress" | "Completed" | "On Hold" | "Overdue";
  transferReason: string;
  stages: TransferStage[];
  itHardwareDecisions: ITHardwareDecision[];
  m365Decision: string;
  activityLog: ActivityLogEntry[];
}
