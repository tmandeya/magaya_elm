export type EmployeeStatus = "Active" | "Onboarding" | "Transferred" | "Offboarding" | "Terminated" | "Archived";
export type Department = "Human Resources" | "Security" | "Information Technology" | "Operations" | "Finance" | "Engineering" | "Administration" | "Health & Safety" | "Mining" | "Geology" | "Processing" | "Maintenance";
export type WorkflowType = "onboarding" | "offboarding" | "transfer";
export type WorkflowStatus = "In Progress" | "Completed" | "Pending Approval" | "On Hold" | "Rejected";
export type StageStatus = "Pending" | "In Progress" | "Completed" | "Overdue" | "Rejected";
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VIEW" | "APPROVE" | "REJECT" | "EXPORT" | "LOGIN" | "LOGOUT" | "TRANSFER" | "ASSIGN" | "COMPLETE";
export type NotificationType = "workflow" | "approval" | "alert" | "info" | "transfer" | "security" | "it";
export type UserRole = "site_admin" | "site_hr" | "site_security" | "site_it" | "hq_hr" | "hod_hr" | "hq_admin" | "hod_security" | "hq_it" | "hod_it";
export type Permission = "employees:read" | "employees:write" | "employees:delete" | "onboarding:read" | "onboarding:write" | "onboarding:approve" | "offboarding:read" | "offboarding:write" | "offboarding:approve" | "transfers:read" | "transfers:write" | "transfers:approve" | "sites:read" | "sites:write" | "reports:read" | "reports:write" | "audit:read" | "settings:read" | "settings:write" | "admin:all";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeNumber: string;
  siteId: number;
  department: Department;
  role: string;
  jobTitle: string;
  status: EmployeeStatus;
  hireDate: string;
  reportingManagerId?: string;
  photoUrl?: string;
  initials: string;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: number;
  name: string;
  location: string;
  fullName: string;
  employeeCount: number;
  keyPersonnel?: { siteManager?: string; hrManager?: string; securityManager?: string; itManager?: string };
  status: "Active" | "Inactive";
}

export interface WorkflowStage {
  id: number;
  name: string;
  department: string;
  assigneeRole: string;
  status: StageStatus;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
  dueDate?: string;
}

export interface Workflow {
  id: string;
  type: WorkflowType;
  employeeId: string;
  employeeName: string;
  siteId: number;
  siteName: string;
  status: WorkflowStatus;
  currentStage: number;
  stages: WorkflowStage[];
  initiatedBy: string;
  initiatedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  details: string;
  siteId?: number;
  ipAddress?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  link?: string;
  actorName?: string;
  actorAvatar?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  siteId?: number;
  siteName?: string;
  avatarUrl?: string;
  initials: string;
}

export interface RoleDefinition {
  id: UserRole;
  label: string;
  siteRequired: boolean;
  permissions: Permission[];
  navItems: string[];
}

export interface DashboardData {
  kpi: { activeEmployees: number; activeEmployeesTrend: number; onboardingInProgress: number; onboardingTrend: number; offboardingPending: number; offboardingTrend: number; transfersPending: number; transfersTrend: number; pendingApprovals: number; approvalsTrend: number };
  workflowStatus: { onboarding: number; offboarding: number; transfers: number; completed: number };
  pendingTasks: { id: number; type: string; title: string; description: string; timeAgo: string; actionLink: string }[];
  recentOnboarding: { id: string; employee: string; site: string; stage: string; progress: number }[];
  recentOffboarding: { id: string; employee: string; site: string; stage: string; progress: number }[];
  siteOverview: { site: string; active: number; onboarding: number; offboarding: number; transfers: number; itPending: number; securityPending: number }[];
}
