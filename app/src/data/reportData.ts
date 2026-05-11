// Report-specific mock data for the Reports & Analytics page

export interface CensusBySite {
  site: string;
  total: number;
  active: number;
  onboarding: number;
  offboarding: number;
  transferred: number;
  terminated: number;
  male: number;
  female: number;
  permanent: number;
  contract: number;
  casual: number;
  intern: number;
  departments: number;
}

export const censusBySite: CensusBySite[] = [
  { site: "Head Office — Harare", total: 45, active: 42, onboarding: 3, offboarding: 0, transferred: 0, terminated: 0, male: 28, female: 17, permanent: 38, contract: 7, casual: 0, intern: 0, departments: 6 },
  { site: "Harare — 207 Sam Nujoma", total: 67, active: 60, onboarding: 5, offboarding: 2, transferred: 0, terminated: 0, male: 42, female: 25, permanent: 52, contract: 15, casual: 0, intern: 0, departments: 7 },
  { site: "Walden", total: 34, active: 32, onboarding: 2, offboarding: 0, transferred: 0, terminated: 0, male: 28, female: 6, permanent: 29, contract: 5, casual: 0, intern: 0, departments: 5 },
  { site: "Peladillo", total: 89, active: 84, onboarding: 4, offboarding: 1, transferred: 0, terminated: 0, male: 65, female: 24, permanent: 72, contract: 17, casual: 0, intern: 0, departments: 7 },
  { site: "Pickstone", total: 112, active: 105, onboarding: 3, offboarding: 2, transferred: 2, terminated: 0, male: 78, female: 34, permanent: 89, contract: 18, casual: 5, intern: 0, departments: 8 },
  { site: "Chanton", total: 78, active: 75, onboarding: 1, offboarding: 1, transferred: 1, terminated: 0, male: 54, female: 24, permanent: 62, contract: 14, casual: 2, intern: 0, departments: 7 },
  { site: "Amaveni", total: 56, active: 52, onboarding: 2, offboarding: 1, transferred: 1, terminated: 0, male: 40, female: 16, permanent: 45, contract: 10, casual: 1, intern: 0, departments: 6 },
  { site: "Commoner", total: 92, active: 88, onboarding: 3, offboarding: 1, transferred: 0, terminated: 0, male: 64, female: 28, permanent: 74, contract: 15, casual: 3, intern: 0, departments: 7 },
  { site: "Amatola", total: 104, active: 98, onboarding: 4, offboarding: 2, transferred: 0, terminated: 0, male: 71, female: 33, permanent: 82, contract: 17, casual: 5, intern: 0, departments: 7 },
  { site: "Shamva", total: 87, active: 85, onboarding: 0, offboarding: 1, transferred: 1, terminated: 0, male: 62, female: 25, permanent: 70, contract: 14, casual: 3, intern: 0, departments: 7 },
  { site: "Carry", total: 83, active: 78, onboarding: 3, offboarding: 2, transferred: 0, terminated: 0, male: 55, female: 28, permanent: 69, contract: 12, casual: 2, intern: 0, departments: 7 },
];

export const censusSummary = {
  totalEmployees: 847,
  activeEmployees: 799,
  newThisMonth: 24,
  departedThisMonth: 8,
  averageTenure: 3.7,
};

export const departmentDistribution = [
  { name: "Mining", count: 234, color: "#D4A017" },
  { name: "Engineering", count: 156, color: "#1E6BA3" },
  { name: "Operations", count: 98, color: "#1B7A43" },
  { name: "Security", count: 67, color: "#B91C1C" },
  { name: "Logistics", count: 52, color: "#C27A06" },
  { name: "IT", count: 42, color: "#7C3AED" },
  { name: "Geology", count: 38, color: "#1E4A73" },
  { name: "HR", count: 34, color: "#C2185B" },
  { name: "Health & Safety", count: 31, color: "#166534" },
  { name: "Administration", count: 28, color: "#9C9C9C" },
  { name: "Environmental", count: 22, color: "#0284C7" },
  { name: "Finance", count: 45, color: "#D97706" },
];

export const genderDistribution = [
  { name: "Male", value: 587, color: "#1E6BA3" },
  { name: "Female", value: 260, color: "#C2185B" },
];

export const employmentTypeData = [
  { name: "Permanent", count: 682, percentage: 80.5, color: "#1B7A43" },
  { name: "Contract", count: 136, percentage: 16.1, color: "#C27A06" },
  { name: "Casual", count: 29, percentage: 3.4, color: "#1E6BA3" },
  { name: "Intern", count: 0, percentage: 0, color: "#9C9C9C" },
];

// Onboarding data
export interface MonthlyVolume {
  month: string;
  initiated: number;
  completed: number;
  overdue: number;
}

export const onboardingVolume: MonthlyVolume[] = [
  { month: "Jan", initiated: 6, completed: 5, overdue: 1 },
  { month: "Feb", initiated: 8, completed: 7, overdue: 0 },
  { month: "Mar", initiated: 4, completed: 4, overdue: 0 },
  { month: "Apr", initiated: 7, completed: 6, overdue: 1 },
  { month: "May", initiated: 5, completed: 5, overdue: 0 },
  { month: "Jun", initiated: 9, completed: 8, overdue: 1 },
  { month: "Jul", initiated: 5, completed: 4, overdue: 1 },
  { month: "Aug", initiated: 8, completed: 7, overdue: 0 },
  { month: "Sep", initiated: 6, completed: 5, overdue: 1 },
  { month: "Oct", initiated: 9, completed: 8, overdue: 0 },
  { month: "Nov", initiated: 7, completed: 7, overdue: 0 },
  { month: "Dec", initiated: 4, completed: 4, overdue: 0 },
];

export const onboardingBySite = [
  { site: "Pickstone", avgDays: 7.2 },
  { site: "Amatola", avgDays: 8.1 },
  { site: "Head Office", avgDays: 5.5 },
  { site: "Harare", avgDays: 6.8 },
  { site: "Walden", avgDays: 9.5 },
  { site: "Peladillo", avgDays: 8.3 },
  { site: "Chanton", avgDays: 10.2 },
  { site: "Amaveni", avgDays: 7.8 },
  { site: "Commoner", avgDays: 9.1 },
  { site: "Shamva", avgDays: 11.5 },
  { site: "Carry", avgDays: 8.7 },
];

export const onboardingSummary = {
  totalInitiated: 78,
  avgCompletionDays: 8.5,
  completionRate: 94,
  overdue: 3,
  inProgress: 24,
  completedThisMonth: 8,
};

export interface OnboardingRecord {
  employee: string;
  site: string;
  initiatedDate: string;
  completedDate: string | null;
  duration: number | null;
  status: string;
}

export const recentOnboardings: OnboardingRecord[] = [
  { employee: "Rudo Mupfumi", site: "Walden", initiatedDate: "2024-11-25", completedDate: null, duration: null, status: "In Progress" },
  { employee: "Chengeto Mupambwa", site: "Head Office — Harare", initiatedDate: "2024-11-20", completedDate: "2024-12-02", duration: 12, status: "Completed" },
  { employee: "Blessing Mhlanga", site: "Commoner", initiatedDate: "2024-11-22", completedDate: null, duration: null, status: "In Progress" },
  { employee: "Kudakwashe Mushonga", site: "Peladillo", initiatedDate: "2024-11-28", completedDate: null, duration: null, status: "In Progress" },
  { employee: "Munashe Chingwara", site: "Peladillo", initiatedDate: "2024-11-15", completedDate: "2024-11-26", duration: 11, status: "Completed" },
  { employee: "Shamiso Mashaya", site: "Chanton", initiatedDate: "2024-12-01", completedDate: null, duration: null, status: "In Progress" },
  { employee: "Farai Machingura", site: "Harare — 207 Sam Nujoma", initiatedDate: "2024-12-03", completedDate: null, duration: null, status: "In Progress" },
  { employee: "Tinotenda Gorejena", site: "Carry", initiatedDate: "2024-12-04", completedDate: null, duration: null, status: "Pending Approval" },
];

// Offboarding data
export const offboardingVolume: MonthlyVolume[] = [
  { month: "Jan", initiated: 2, completed: 2, overdue: 0 },
  { month: "Feb", initiated: 3, completed: 3, overdue: 0 },
  { month: "Mar", initiated: 1, completed: 1, overdue: 0 },
  { month: "Apr", initiated: 4, completed: 3, overdue: 1 },
  { month: "May", initiated: 2, completed: 2, overdue: 0 },
  { month: "Jun", initiated: 3, completed: 2, overdue: 1 },
  { month: "Jul", initiated: 1, completed: 1, overdue: 0 },
  { month: "Aug", initiated: 2, completed: 2, overdue: 0 },
  { month: "Sep", initiated: 3, completed: 3, overdue: 0 },
  { month: "Oct", initiated: 2, completed: 1, overdue: 1 },
  { month: "Nov", initiated: 4, completed: 3, overdue: 1 },
  { month: "Dec", initiated: 2, completed: 1, overdue: 1 },
];

export const offboardingBySite = [
  { site: "Pickstone", avgDays: 12.5 },
  { site: "Amatola", avgDays: 15.2 },
  { site: "Head Office", avgDays: 10.0 },
  { site: "Harare", avgDays: 18.3 },
  { site: "Walden", avgDays: 22.1 },
  { site: "Peladillo", avgDays: 16.8 },
  { site: "Chanton", avgDays: 19.5 },
  { site: "Amaveni", avgDays: 14.2 },
  { site: "Commoner", avgDays: 17.1 },
  { site: "Shamva", avgDays: 20.4 },
  { site: "Carry", avgDays: 13.8 },
];

export const offboardingSummary = {
  totalInitiated: 29,
  avgClearanceDays: 16.3,
  clearanceRate: 87,
  pendingClearances: 8,
  pendingIT: 3,
  pendingSecurity: 2,
  completedThisMonth: 5,
};

export interface OffboardingRecord {
  employee: string;
  site: string;
  initiatedDate: string;
  lastWorkingDay: string;
  currentStage: string;
  daysInProcess: number;
}

export const recentOffboardings: OffboardingRecord[] = [
  { employee: "Samantha Mhondera", site: "Harare — 207 Sam Nujoma", initiatedDate: "2024-11-10", lastWorkingDay: "2024-12-15", currentStage: "HR Final Clearance", daysInProcess: 26 },
  { employee: "Tatenda Marufu", site: "Harare — 207 Sam Nujoma", initiatedDate: "2024-11-20", lastWorkingDay: "2024-12-31", currentStage: "HOD Sign-off", daysInProcess: 16 },
  { employee: "Peter Chirwa", site: "Walden", initiatedDate: "2024-11-25", lastWorkingDay: "2025-01-15", currentStage: "Admin Clearance", daysInProcess: 11 },
  { employee: "Patience Mupindu", site: "Commoner", initiatedDate: "2024-11-28", lastWorkingDay: "2025-01-10", currentStage: "Security Clearance", daysInProcess: 8 },
  { employee: "Tanaka Mudzviti", site: "Shamva", initiatedDate: "2024-12-01", lastWorkingDay: "2025-01-31", currentStage: "IT Clearance", daysInProcess: 5 },
];

// Transfer data
export const transferVolume: MonthlyVolume[] = [
  { month: "Jan", initiated: 2, completed: 2, overdue: 0 },
  { month: "Feb", initiated: 3, completed: 2, overdue: 0 },
  { month: "Mar", initiated: 1, completed: 1, overdue: 0 },
  { month: "Apr", initiated: 4, completed: 3, overdue: 1 },
  { month: "May", initiated: 2, completed: 2, overdue: 0 },
  { month: "Jun", initiated: 5, completed: 4, overdue: 1 },
  { month: "Jul", initiated: 3, completed: 3, overdue: 0 },
  { month: "Aug", initiated: 2, completed: 1, overdue: 1 },
  { month: "Sep", initiated: 4, completed: 4, overdue: 0 },
  { month: "Oct", initiated: 3, completed: 2, overdue: 1 },
  { month: "Nov", initiated: 4, completed: 3, overdue: 0 },
  { month: "Dec", initiated: 2, completed: 1, overdue: 1 },
];

export const transferSummary = {
  totalThisYear: 35,
  pendingApproval: 6,
  avgProcessingDays: 14.8,
  crossSiteTransfers: 28,
};

export interface TransferRecord {
  employee: string;
  originSite: string;
  destinationSite: string;
  initiatedDate: string;
  status: string;
  daysInProcess: number;
}

export const recentTransfers: TransferRecord[] = [
  { employee: "Simba Katsande", originSite: "Head Office — Harare", destinationSite: "Pickstone", initiatedDate: "2024-11-15", status: "In Progress", daysInProcess: 21 },
  { employee: "Anesu Mupfuti", originSite: "Amatola", destinationSite: "Peladillo", initiatedDate: "2024-11-22", status: "In Progress", daysInProcess: 14 },
  { employee: "Tinashe Makoni", originSite: "Pickstone", destinationSite: "Chanton", initiatedDate: "2024-11-10", status: "In Progress", daysInProcess: 26 },
  { employee: "Paidamoyo Sibanda", originSite: "Amaveni", destinationSite: "Pickstone", initiatedDate: "2024-12-02", status: "In Progress", daysInProcess: 4 },
];

export const transferMatrix = [
  { origin: "Head Office — Harare", destinations: ["Pickstone", "2"], "Harare": "", "Walden": "", "Peladillo": "1", "Pickstone": "2", "Chanton": "", "Amaveni": "", "Commoner": "", "Amatola": "", "Shamva": "", "Carry": "" },
  { origin: "Harare", destinations: [""], "Head Office": "", "Walden": "", "Peladillo": "", "Pickstone": "", "Chanton": "", "Amaveni": "", "Commoner": "", "Amatola": "", "Shamva": "", "Carry": "1" },
  { origin: "Walden", destinations: [""], "Head Office": "", "Harare": "1", "Peladillo": "", "Pickstone": "", "Chanton": "", "Amaveni": "", "Commoner": "", "Amatola": "", "Shamva": "", "Carry": "" },
  { origin: "Peladillo", destinations: [""], "Head Office": "", "Harare": "", "Walden": "", "Pickstone": "1", "Chanton": "1", "Amaveni": "", "Commoner": "", "Amatola": "", "Shamva": "", "Carry": "" },
  { origin: "Pickstone", destinations: ["Chanton", "Amaveni"], "Head Office": "", "Harare": "", "Walden": "", "Peladillo": "", "Chanton": "2", "Amaveni": "1", "Commoner": "", "Amatola": "", "Shamva": "", "Carry": "" },
  { origin: "Chanton", destinations: [""], "Head Office": "", "Harare": "", "Walden": "", "Peladillo": "", "Pickstone": "", "Amaveni": "", "Commoner": "", "Amatola": "", "Shamva": "", "Carry": "" },
  { origin: "Amaveni", destinations: ["Pickstone"], "Head Office": "", "Harare": "", "Walden": "", "Peladillo": "", "Pickstone": "2", "Chanton": "", "Commoner": "", "Amatola": "", "Shamva": "", "Carry": "" },
  { origin: "Commoner", destinations: [""], "Head Office": "", "Harare": "", "Walden": "", "Peladillo": "", "Pickstone": "", "Chanton": "", "Amaveni": "", "Amatola": "", "Shamva": "", "Carry": "" },
  { origin: "Amatola", destinations: ["Peladillo"], "Head Office": "", "Harare": "", "Walden": "", "Peladillo": "2", "Pickstone": "", "Chanton": "", "Amaveni": "", "Commoner": "", "Shamva": "", "Carry": "" },
  { origin: "Shamva", destinations: [""], "Head Office": "", "Harare": "", "Walden": "", "Peladillo": "", "Pickstone": "", "Chanton": "", "Amaveni": "", "Commoner": "", "Amatola": "", "Carry": "" },
  { origin: "Carry", destinations: [""], "Head Office": "", "Harare": "", "Walden": "", "Peladillo": "", "Pickstone": "", "Chanton": "", "Amaveni": "", "Commoner": "", "Amatola": "", "Shamva": "" },
];

// Hardware data
export interface HardwareItem {
  type: string;
  employee: string;
  serial: string;
  site: string;
  issueDate: string;
  status: string;
}

export const hardwareInventory: HardwareItem[] = [
  { type: "Laptop", employee: "Tendai Mutasa", serial: "LAP-HP-0045", site: "Pickstone", issueDate: "2023-03-15", status: "Active" },
  { type: "Monitor", employee: "Tendai Mutasa", serial: "MON-DL-0123", site: "Pickstone", issueDate: "2023-03-15", status: "Active" },
  { type: "Phone", employee: "Tendai Mutasa", serial: "PHN-SM-0098", site: "Pickstone", issueDate: "2023-04-01", status: "Active" },
  { type: "Laptop", employee: "Simba Katsande", serial: "LAP-LN-0078", site: "Head Office — Harare", issueDate: "2022-07-01", status: "Due for return" },
  { type: "Radio", employee: "Simba Katsande", serial: "RAD-MT-0041", site: "Head Office — Harare", issueDate: "2022-07-01", status: "Active" },
  { type: "Laptop", employee: "Faith Dube", serial: "LAP-HP-0123", site: "Head Office — Harare", issueDate: "2020-02-01", status: "Active" },
  { type: "Phone", employee: "Faith Dube", serial: "PHN-SM-0156", site: "Head Office — Harare", issueDate: "2023-01-15", status: "Active" },
  { type: "Printer", employee: "Admin Pool", serial: "PRN-HP-0023", site: "Pickstone", issueDate: "2022-01-10", status: "Active" },
  { type: "Laptop", employee: "Nyasha Gomo", serial: "LAP-AP-0090", site: "Amatola", issueDate: "2021-03-01", status: "Active" },
  { type: "Monitor", employee: "Nyasha Gomo", serial: "MON-DL-0345", site: "Amatola", issueDate: "2023-06-15", status: "Active" },
  { type: "Laptop", employee: "Peter Chirwa", serial: "LAP-HP-0067", site: "Walden", issueDate: "2019-09-01", status: "Due for return" },
  { type: "Phone", employee: "Peter Chirwa", serial: "PHN-SM-0078", site: "Walden", issueDate: "2022-11-01", status: "Due for return" },
  { type: "Radio", employee: "Tatenda Marufu", serial: "RAD-MT-0056", site: "Harare — 207 Sam Nujoma", issueDate: "2021-03-15", status: "Due for return" },
  { type: "Laptop", employee: "Tafadzwa Mhembere", serial: "LAP-LN-0091", site: "Shamva", issueDate: "2022-05-01", status: "Active" },
  { type: "Monitor", employee: "Tafadzwa Mhembere", serial: "MON-DL-0189", site: "Shamva", issueDate: "2022-05-01", status: "Active" },
  { type: "Laptop", employee: "Grace Ncube", serial: "LAP-AP-0034", site: "Head Office — Harare", issueDate: "2020-06-01", status: "Active" },
  { type: "Phone", employee: "Grace Ncube", serial: "PHN-SM-0123", site: "Head Office — Harare", issueDate: "2023-03-10", status: "Active" },
  { type: "Printer", employee: "Admin Pool", serial: "PRN-HP-0045", site: "Amatola", issueDate: "2023-02-01", status: "Active" },
  { type: "Laptop", employee: "Rudo Chikwamba", serial: "LAP-HP-0089", site: "Chanton", issueDate: "2023-02-15", status: "Active" },
  { type: "Radio", employee: "Rudo Chikwamba", serial: "RAD-MT-0078", site: "Chanton", issueDate: "2023-02-15", status: "Active" },
];

export const hardwareSummary = {
  totalItems: 1247,
  laptopsAssigned: 412,
  phonesAssigned: 289,
  pendingProvisioning: 18,
  devicesDueReturn: 34,
};

export const hardwareByType = [
  { type: "Laptop", count: 412, color: "#D4A017" },
  { type: "Monitor", count: 198, color: "#1E6BA3" },
  { type: "Phone", count: 289, color: "#1B7A43" },
  { type: "Printer", count: 87, color: "#C27A06" },
  { type: "Radio", count: 156, color: "#B91C1C" },
  { type: "Other", count: 105, color: "#9C9C9C" },
];

export const hardwareBySite = [
  { site: "Head Office — Harare", laptops: 38, monitors: 22, phones: 28, printers: 8, radios: 12, other: 5 },
  { site: "Harare — 207 Sam Nujoma", laptops: 52, monitors: 28, phones: 42, printers: 12, radios: 18, other: 8 },
  { site: "Walden", laptops: 18, monitors: 10, phones: 15, printers: 4, radios: 8, other: 3 },
  { site: "Peladillo", laptops: 58, monitors: 32, phones: 48, printers: 15, radios: 22, other: 10 },
  { site: "Pickstone", laptops: 72, monitors: 42, phones: 58, printers: 18, radios: 28, other: 12 },
  { site: "Chanton", laptops: 48, monitors: 26, phones: 38, printers: 10, radios: 18, other: 8 },
  { site: "Amaveni", laptops: 32, monitors: 18, phones: 28, printers: 8, radios: 12, other: 5 },
  { site: "Commoner", laptops: 62, monitors: 36, phones: 52, printers: 16, radios: 24, other: 10 },
  { site: "Amatola", laptops: 68, monitors: 38, phones: 55, printers: 14, radios: 26, other: 11 },
  { site: "Shamva", laptops: 52, monitors: 28, phones: 40, printers: 12, radios: 20, other: 9 },
  { site: "Carry", laptops: 54, monitors: 30, phones: 42, printers: 12, radios: 20, other: 8 },
];

export const m365Status = [
  { name: "Active", value: 723, color: "#1B7A43" },
  { name: "Not Created", value: 48, color: "#9C9C9C" },
  { name: "Disabled", value: 42, color: "#B91C1C" },
  { name: "Suspended", value: 34, color: "#C27A06" },
];

// Document expiry data
export interface DocumentExpiryAlert {
  employee: string;
  code: string;
  site: string;
  department: string;
  documentType: string;
  uploadDate: string;
  expiryDate: string;
  daysRemaining: number;
  severity: "critical" | "warning" | "good" | "unknown";
}

export const documentExpiryAlerts: DocumentExpiryAlert[] = [
  { employee: "Tatenda Marufu", code: "MM-2022-0087", site: "Harare — 207 Sam Nujoma", department: "Security", documentType: "Security Clearance", uploadDate: "2022-03-15", expiryDate: "2025-01-15", daysRemaining: -5, severity: "critical" },
  { employee: "Grace Ncube", code: "MM-2023-0156", site: "Amaveni", department: "Administration", documentType: "Medical Certificate", uploadDate: "2024-01-10", expiryDate: "2025-01-20", daysRemaining: 0, severity: "critical" },
  { employee: "Peter Chirwa", code: "MM-2023-0187", site: "Walden", department: "Human Resources", documentType: "National ID", uploadDate: "2023-06-01", expiryDate: "2025-01-28", daysRemaining: 3, severity: "critical" },
  { employee: "Kudakwashe Mushonga", code: "MM-2023-0145", site: "Peladillo", department: "Engineering", documentType: "Professional License", uploadDate: "2024-03-10", expiryDate: "2025-02-10", daysRemaining: 16, severity: "warning" },
  { employee: "Paidamoyo Sibanda", code: "MM-2023-0189", site: "Amaveni", department: "Health & Safety", documentType: "Safety Certificate", uploadDate: "2024-02-15", expiryDate: "2025-02-15", daysRemaining: 21, severity: "warning" },
  { employee: "Munashe Chingwara", code: "MM-2022-0045", site: "Peladillo", department: "Engineering", documentType: "Work Permit", uploadDate: "2024-04-01", expiryDate: "2025-02-28", daysRemaining: 34, severity: "warning" },
  { employee: "Anesu Mupfuti", code: "MM-2023-0167", site: "Amatola", department: "Geology", documentType: "Medical Certificate", uploadDate: "2024-05-10", expiryDate: "2025-03-05", daysRemaining: 39, severity: "warning" },
  { employee: "Tinashe Makoni", code: "MM-2022-0034", site: "Pickstone", department: "Processing", documentType: "Professional License", uploadDate: "2024-01-20", expiryDate: "2025-03-10", daysRemaining: 44, severity: "warning" },
  { employee: "Tendai Mutasa", code: "MM-2022-0012", site: "Pickstone", department: "Operations", documentType: "National ID", uploadDate: "2023-08-15", expiryDate: "2028-08-15", daysRemaining: 1308, severity: "good" },
  { employee: "Faith Dube", code: "MM-2020-0005", site: "Head Office — Harare", department: "Human Resources", documentType: "Passport", uploadDate: "2023-10-01", expiryDate: "2033-10-01", daysRemaining: 3174, severity: "good" },
  { employee: "Simba Katsande", code: "MM-2021-0003", site: "Head Office — Harare", department: "Security", documentType: "Security Clearance", uploadDate: "2024-06-01", expiryDate: "2025-06-01", daysRemaining: 142, severity: "good" },
  { employee: "Blessing Mhlanga", code: "MM-2024-0004", site: "Commoner", department: "IT", documentType: "National ID", uploadDate: "2024-11-25", expiryDate: "2034-11-25", daysRemaining: 3610, severity: "good" },
  { employee: "Farai Machingura", code: "MM-2023-0022", site: "Harare — 207 Sam Nujoma", department: "IT", documentType: "Medical Certificate", uploadDate: "2024-08-01", expiryDate: "2025-07-31", daysRemaining: 198, severity: "good" },
  { employee: "Nyasha Gomo", code: "MM-2020-0009", site: "Amatola", department: "IT", documentType: "Professional License", uploadDate: "2024-02-01", expiryDate: "2026-02-01", daysRemaining: 738, severity: "good" },
  { employee: "Rudo Chikwamba", code: "MM-2023-0013", site: "Chanton", department: "Human Resources", documentType: "National ID", uploadDate: "", expiryDate: "", daysRemaining: 0, severity: "unknown" },
  { employee: "Shamiso Mashaya", code: "MM-2023-0020", site: "Chanton", department: "Human Resources", documentType: "Medical Certificate", uploadDate: "", expiryDate: "", daysRemaining: 0, severity: "unknown" },
];

export const documentSeveritySummary = {
  critical: 3,
  warning: 4,
  good: 8,
  unknown: 2,
};
