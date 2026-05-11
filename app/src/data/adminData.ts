// Admin data - mock data for Sites, Settings, and Audit Logs pages

import type { UserRole } from "@/types";

export interface SiteDetail {
  id: number;
  name: string;
  location: string;
  address: string;
  type: string;
  status: "Active" | "Inactive";
  established: string;
  description: string;
  employees: number;
  workflows: { onboarding: number; offboarding: number; transfers: number };
}

export interface SitePersonnel {
  hr?: { name: string; code: string };
  it?: { name: string; code: string };
  security?: { name: string; code: string };
  admin?: { name: string; code: string };
  hod?: { name: string; code: string };
  gm?: { name: string; code: string };
}

export const siteTypes = ["Mining", "Processing", "Office", "Mixed"];

export const mockSites: SiteDetail[] = [
  { id: 1, name: "Head Office", location: "Harare", address: "1 Magaya Way, Harare", type: "Office", status: "Active", established: "2010-01-01", description: "Corporate headquarters for Magaya Mining", employees: 45, workflows: { onboarding: 3, offboarding: 1, transfers: 2 } },
  { id: 2, name: "Harare", location: "207 Sam Nujoma, Harare", address: "207 Sam Nujoma Street, Harare", type: "Mixed", status: "Active", established: "2012-03-15", description: "Harare operations and processing facility", employees: 67, workflows: { onboarding: 5, offboarding: 2, transfers: 1 } },
  { id: 3, name: "Walden", location: "Mashonaland West", address: "Walden Mine, Chegutu District", type: "Mining", status: "Active", established: "2014-06-01", description: "Underground gold mining operation", employees: 34, workflows: { onboarding: 2, offboarding: 0, transfers: 3 } },
  { id: 4, name: "Peladillo", location: "Mashonaland Central", address: "Peladillo Mine, Mazowe District", type: "Mining", status: "Active", established: "2013-09-10", description: "Open-pit gold mining operation", employees: 89, workflows: { onboarding: 4, offboarding: 1, transfers: 0 } },
  { id: 5, name: "Pickstone", location: "Mashonaland West", address: "Pickstone Mine, Chegutu District", type: "Mining", status: "Active", established: "2015-01-20", description: "Primary gold processing and mining site", employees: 112, workflows: { onboarding: 3, offboarding: 1, transfers: 2 } },
  { id: 6, name: "Chanton", location: "Mashonaland East", address: "Chanton Mine, Mutoko District", type: "Mining", status: "Active", established: "2016-04-05", description: "Gold and mineral exploration site", employees: 78, workflows: { onboarding: 1, offboarding: 1, transfers: 1 } },
  { id: 7, name: "Amaveni", location: "Midlands", address: "Amaveni Mine, Kwekwe District", type: "Processing", status: "Active", established: "2017-07-12", description: "Mineral processing and refinery", employees: 56, workflows: { onboarding: 2, offboarding: 1, transfers: 1 } },
  { id: 8, name: "Commoner", location: "Mashonaland West", address: "Commoner Mine, Kadoma District", type: "Mining", status: "Active", established: "2018-02-28", description: "Underground mining and exploration", employees: 92, workflows: { onboarding: 1, offboarding: 0, transfers: 0 } },
  { id: 9, name: "Amatola", location: "Manicaland", address: "Amatola Mine, Mutare District", type: "Mining", status: "Active", established: "2019-05-15", description: "Gold mining with environmental focus", employees: 104, workflows: { onboarding: 2, offboarding: 0, transfers: 1 } },
  { id: 10, name: "Shamva", location: "Mashonaland Central", address: "Shamva Mine, Shamva District", type: "Mining", status: "Active", established: "2020-08-01", description: "Large-scale open-pit operation", employees: 87, workflows: { onboarding: 0, offboarding: 0, transfers: 1 } },
  { id: 11, name: "Carry", location: "Matabeleland North", address: "Carry Mine, Bubi District", type: "Mining", status: "Active", established: "2021-11-10", description: "Newest mining operation", employees: 83, workflows: { onboarding: 1, offboarding: 1, transfers: 0 } },
];

export const mockSitePersonnel: Record<number, SitePersonnel> = {
  1: { hr: { name: "Rudo Mupfumi", code: "MM-2024-0035" }, it: { name: "Blessing Mhlanga", code: "MM-2023-0134" }, security: { name: "Nyasha Gomo", code: "MM-2022-0076" }, admin: { name: "Samantha Mhondera", code: "MM-2024-0045" }, hod: { name: "Patricia Makoni", code: "MM-2022-0065" }, gm: { name: "Tatenda Marufu", code: "MM-2022-0087" } },
  2: { hr: { name: "Kudzai Mhembere", code: "MM-2023-0078" }, it: { name: "Tinashe Chirwa", code: "MM-2024-0012" }, security: { name: "Simba Katsande", code: "MM-2022-0054" }, admin: { name: "Farai Chinhema", code: "MM-2024-0033" }, hod: { name: "John Mupfumi", code: "MM-2021-0034" }, gm: { name: "Grace Ncube", code: "MM-2022-0067" } },
  3: { hr: { name: "Chengeto Dube", code: "MM-2023-0091" }, it: { name: "Peter Chirwa", code: "MM-2022-0088" }, security: { name: "Tendai Mutasa", code: "MM-2022-0099" }, admin: { name: "Faith Dube", code: "MM-2024-0056" }, hod: { name: "Rudo Mupfumi", code: "MM-2023-0045" } },
  4: { hr: { name: "Nyasha Gomo", code: "MM-2022-0076" }, it: { name: "Tafadzwa Mhembere", code: "MM-2023-0101" }, security: { name: "Blessing Mhlanga", code: "MM-2023-0134" }, gm: { name: "Tatenda Marufu", code: "MM-2022-0087" } },
  5: { hr: { name: "Chiedza Makwara", code: "MM-2023-0145" }, it: { name: "Tinashe Moyo", code: "MM-2023-0102" }, security: { name: "John Banda", code: "MM-2023-0089" }, admin: { name: "Farai Chinhema", code: "MM-2024-0012" }, hod: { name: "Kudakwashe Mupini", code: "MM-2023-0145" }, gm: { name: "Tendai Mupfumi", code: "MM-2021-0045" } },
  6: { hr: { name: "Patricia Makoni", code: "MM-2022-0065" }, it: { name: "Blessing Mhlanga", code: "MM-2023-0134" }, security: { name: "Nyasha Gomo", code: "MM-2022-0076" }, admin: { name: "Samantha Mhondera", code: "MM-2024-0045" }, gm: { name: "Tatenda Marufu", code: "MM-2022-0087" } },
  7: { hr: { name: "Rudo Mupfumi", code: "MM-2024-0035" }, it: { name: "Tinashe Chirwa", code: "MM-2024-0012" }, security: { name: "Simba Katsande", code: "MM-2022-0054" } },
  8: { hr: { name: "Farai Chinhema", code: "MM-2024-0033" }, it: { name: "Peter Chirwa", code: "MM-2022-0088" }, security: { name: "John Banda", code: "MM-2023-0089" }, admin: { name: "Kudzai Mhembere", code: "MM-2023-0078" }, gm: { name: "Grace Ncube", code: "MM-2022-0067" } },
  9: { hr: { name: "Samantha Mhondera", code: "MM-2024-0045" }, it: { name: "Tafadzwa Mhembere", code: "MM-2023-0101" }, security: { name: "Blessing Mhlanga", code: "MM-2023-0134" }, gm: { name: "Chengeto Dube", code: "MM-2023-0091" } },
  10: { hr: { name: "Kudakwashe Mupini", code: "MM-2023-0145" }, it: { name: "Tinashe Moyo", code: "MM-2023-0102" }, security: { name: "Nyasha Gomo", code: "MM-2022-0076" } },
  11: { hr: { name: "John Mupfumi", code: "MM-2021-0034" }, it: { name: "Blessing Mhlanga", code: "MM-2023-0134" }, security: { name: "Simba Katsande", code: "MM-2022-0054" }, admin: { name: "Faith Dube", code: "MM-2024-0056" }, gm: { name: "Tatenda Marufu", code: "MM-2022-0087" } },
};

export interface ApprovalStage {
  id: number;
  name: string;
  department: string;
  requiredApprovers: number;
  status: string;
}

export const mockApprovalStages: ApprovalStage[] = [
  { id: 1, name: "HR Initiation", department: "HQ HR", requiredApprovers: 1, status: "Configured" },
  { id: 2, name: "Security Clearance", department: "Site Security", requiredApprovers: 1, status: "Configured" },
  { id: 3, name: "IT Provisioning", department: "Site IT", requiredApprovers: 1, status: "Configured" },
  { id: 4, name: "Admin Setup", department: "Site Administration", requiredApprovers: 1, status: "Configured" },
  { id: 5, name: "HOD Acknowledgment", department: "Department HOD", requiredApprovers: 1, status: "Configured" },
  { id: 6, name: "HR Completion", department: "HQ HR", requiredApprovers: 1, status: "Configured" },
];

// Dropdown config data
export interface DropdownItem {
  id: number;
  name: string;
  status: "Active" | "Inactive";
  [key: string]: unknown;
}

export interface HardwareItem extends DropdownItem {
  type: string;
  model: string;
  defaultSite: string;
}

export interface SoftwareItem extends DropdownItem {
  version: string;
  licenseType: string;
}

export interface ClearanceLevelItem extends DropdownItem {
  description: string;
  accessZones: string[];
}

export interface DocumentTypeItem extends DropdownItem {
  category: string;
  expiryWarningDays: number;
  required: boolean;
}

export const mockDepartments: DropdownItem[] = [
  { id: 1, name: "Mining", status: "Active" },
  { id: 2, name: "Engineering", status: "Active" },
  { id: 3, name: "HR", status: "Active" },
  { id: 4, name: "Finance", status: "Active" },
  { id: 5, name: "Security", status: "Active" },
  { id: 6, name: "IT", status: "Active" },
  { id: 7, name: "Operations", status: "Active" },
  { id: 8, name: "Administration", status: "Active" },
  { id: 9, name: "Geology", status: "Active" },
  { id: 10, name: "Environmental", status: "Active" },
  { id: 11, name: "Health & Safety", status: "Active" },
  { id: 12, name: "Logistics", status: "Active" },
];

export const mockJobTitles: DropdownItem[] = [
  { id: 1, name: "Mine Manager", department: "Mining", status: "Active" },
  { id: 2, name: "Mining Engineer", department: "Mining", status: "Active" },
  { id: 3, name: "Mechanical Engineer", department: "Engineering", status: "Active" },
  { id: 4, name: "Electrical Engineer", department: "Engineering", status: "Active" },
  { id: 5, name: "HR Officer", department: "HR", status: "Active" },
  { id: 6, name: "HR Director", department: "HR", status: "Active" },
  { id: 7, name: "Finance Manager", department: "Finance", status: "Active" },
  { id: 8, name: "Security Officer", department: "Security", status: "Active" },
  { id: 9, name: "IT Administrator", department: "IT", status: "Active" },
  { id: 10, name: "Systems Analyst", department: "IT", status: "Active" },
  { id: 11, name: "Operations Manager", department: "Operations", status: "Active" },
  { id: 12, name: "Administrator", department: "Administration", status: "Active" },
  { id: 13, name: "Geologist", department: "Geology", status: "Active" },
  { id: 14, name: "Environmental Officer", department: "Environmental", status: "Active" },
  { id: 15, name: "Safety Officer", department: "Health & Safety", status: "Active" },
];

export const mockHardwareCatalog: HardwareItem[] = [
  { id: 1, name: "Dell Latitude 5520", type: "Laptop", model: "Dell Latitude 5520", defaultSite: "All Sites", status: "Active" },
  { id: 2, name: "HP ProBook 450 G8", type: "Laptop", model: "HP ProBook 450 G8", defaultSite: "All Sites", status: "Active" },
  { id: 3, name: "Dell OptiPlex 7090", type: "Desktop", model: "Dell OptiPlex 7090", defaultSite: "Head Office", status: "Active" },
  { id: 4, name: "HP LaserJet Pro M404", type: "Printer", model: "HP LaserJet Pro M404", defaultSite: "All Sites", status: "Active" },
  { id: 5, name: "Motorola CP200d", type: "Radio", model: "Motorola CP200d", defaultSite: "Mining Sites", status: "Active" },
  { id: 6, name: "Samsung Galaxy A54", type: "Mobile Phone", model: "Samsung Galaxy A54", defaultSite: "All Sites", status: "Active" },
];

export const mockSoftwareList: SoftwareItem[] = [
  { id: 1, name: "Microsoft Office 365", version: "Latest", licenseType: "Enterprise", status: "Active" },
  { id: 2, name: "AutoCAD", version: "2024", licenseType: "Per-user", status: "Active" },
  { id: 3, name: "SolidWorks", version: "2023", licenseType: "Floating", status: "Active" },
  { id: 4, name: "SAP ERP", version: "ECC 6.0", licenseType: "Enterprise", status: "Active" },
  { id: 5, name: "Primavera P6", version: "22.12", licenseType: "Enterprise", status: "Active" },
  { id: 6, name: "Microsoft Project", version: "Latest", licenseType: "Enterprise", status: "Active" },
];

export const mockClearanceLevels: ClearanceLevelItem[] = [
  { id: 1, name: "Level 1 — Office Only", description: "Office block and main gate access only", accessZones: ["Office Block", "Main Gate"], status: "Active" },
  { id: 2, name: "Level 2 — General Site", description: "General site areas including cafeteria and parking", accessZones: ["Office Block", "Main Gate", "Cafeteria", "Parking"], status: "Active" },
  { id: 3, name: "Level 3 — Mine Floor", description: "Includes mine floor and workshop access", accessZones: ["All Level 2", "Mine Floor", "Workshop"], status: "Active" },
  { id: 4, name: "Level 4 — Restricted", description: "Full access including control room and restricted areas", accessZones: ["All Level 3", "Control Room", "Stores", "Explosives Store"], status: "Active" },
];

export const mockDocumentTypes: DocumentTypeItem[] = [
  { id: 1, name: "National ID", category: "Personal", expiryWarningDays: 90, required: true, status: "Active" },
  { id: 2, name: "Passport", category: "Personal", expiryWarningDays: 180, required: false, status: "Active" },
  { id: 3, name: "Driver's License", category: "Personal", expiryWarningDays: 60, required: false, status: "Active" },
  { id: 4, name: "Medical Certificate", category: "Medical", expiryWarningDays: 30, required: true, status: "Active" },
  { id: 5, name: "Security Clearance", category: "Security", expiryWarningDays: 60, required: true, status: "Active" },
  { id: 6, name: "Employment Contract", category: "Employment", expiryWarningDays: 30, required: true, status: "Active" },
  { id: 7, name: "Professional License", category: "Academic", expiryWarningDays: 60, required: false, status: "Active" },
  { id: 8, name: "Police Clearance", category: "Security", expiryWarningDays: 180, required: true, status: "Active" },
];

export const mockEmploymentTypes: DropdownItem[] = [
  { id: 1, name: "Permanent", status: "Active" },
  { id: 2, name: "Contract", status: "Active" },
  { id: 3, name: "Casual", status: "Active" },
  { id: 4, name: "Intern", status: "Active" },
];

export const mockNationalities: DropdownItem[] = [
  { id: 1, name: "Zimbabwean", status: "Active" },
  { id: 2, name: "South African", status: "Active" },
  { id: 3, name: "Zambian", status: "Active" },
  { id: 4, name: "Malawian", status: "Active" },
  { id: 5, name: "Mozambican", status: "Active" },
  { id: 6, name: "Botswanan", status: "Active" },
  { id: 7, name: "Namibian", status: "Active" },
];

// Retention policies
export interface RetentionPolicy {
  id: number;
  dataType: string;
  period: string;
  description: string;
  severity: "green" | "amber" | "red";
  lastChanged: string;
  changedBy: string;
}

export const mockRetentionPolicies: RetentionPolicy[] = [
  { id: 1, dataType: "Employee Records (Active)", period: "indefinite", description: "Until employee status changes", severity: "green", lastChanged: "2023-01-15T10:00:00", changedBy: "HQ Administrator" },
  { id: 2, dataType: "Employee Records (Terminated)", period: "7-years", description: "Auto-archive after 7 years", severity: "green", lastChanged: "2023-01-15T10:00:00", changedBy: "HQ Administrator" },
  { id: 3, dataType: "Audit Logs", period: "7-years", description: "Immutable, auto-purge after 7 years", severity: "green", lastChanged: "2023-01-15T10:00:00", changedBy: "HQ Administrator" },
  { id: 4, dataType: "Onboarding Workflows (Completed)", period: "5-years", description: "Archive after 1 year, purge after 5", severity: "amber", lastChanged: "2023-06-20T14:30:00", changedBy: "HQ HR" },
  { id: 5, dataType: "Offboarding Workflows (Completed)", period: "7-years", description: "Archive after 1 year, purge after 7", severity: "amber", lastChanged: "2023-06-20T14:30:00", changedBy: "HQ HR" },
  { id: 6, dataType: "Transfer Workflows (Completed)", period: "7-years", description: "Archive after 1 year, purge after 7", severity: "amber", lastChanged: "2023-06-20T14:30:00", changedBy: "HQ HR" },
  { id: 7, dataType: "Documents", period: "match-employee", description: "Purge with employee record", severity: "green", lastChanged: "2023-01-15T10:00:00", changedBy: "HQ Administrator" },
  { id: 8, dataType: "Login Sessions", period: "90-days", description: "Auto-purge inactive sessions", severity: "green", lastChanged: "2023-01-15T10:00:00", changedBy: "HQ Administrator" },
  { id: 9, dataType: "Exported Reports", period: "30-days", description: "Auto-delete from temp storage", severity: "green", lastChanged: "2023-01-15T10:00:00", changedBy: "HQ Administrator" },
];

// Notification preferences
export interface NotificationEvent {
  id: number;
  event: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

export const mockNotificationEvents: NotificationEvent[] = [
  { id: 1, event: "Employee Onboarding Started", inApp: true, email: true, sms: false, push: true },
  { id: 2, event: "Stage Completion", inApp: true, email: true, sms: false, push: false },
  { id: 3, event: "Approval Required", inApp: true, email: true, sms: true, push: true },
  { id: 4, event: "Document Expiry Warning", inApp: true, email: true, sms: false, push: true },
  { id: 5, event: "Offboarding Initiated", inApp: true, email: true, sms: false, push: true },
  { id: 6, event: "Transfer Request", inApp: true, email: true, sms: false, push: true },
  { id: 7, event: "System Alert", inApp: true, email: true, sms: true, push: true },
  { id: 8, event: "Sign-off Required", inApp: true, email: true, sms: true, push: false },
  { id: 9, event: "Employee Status Change", inApp: true, email: true, sms: false, push: false },
  { id: 10, event: "Password Expiry", inApp: true, email: true, sms: false, push: false },
  { id: 11, event: "Account Locked", inApp: true, email: true, sms: true, push: true },
  { id: 12, event: "New User Registration", inApp: true, email: true, sms: false, push: false },
];

// System users
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  site: string;
  lastLogin: string;
  status: "Active" | "Inactive";
}

export const mockSystemUsers: SystemUser[] = [
  { id: "USR-001", name: "Tendai Moyo", email: "tendai.moyo@magaya.co.zw", role: "site_admin", roleLabel: "Site Administrator", site: "Pickstone", lastLogin: "2024-01-28T14:30:00", status: "Active" },
  { id: "USR-002", name: "Rudo Chikwamba", email: "rudo.chikwamba@magaya.co.zw", role: "site_hr", roleLabel: "Site HR", site: "Harare", lastLogin: "2024-01-28T10:15:00", status: "Active" },
  { id: "USR-003", name: "Simba Katsande", email: "simba.katsande@magaya.co.zw", role: "site_security", roleLabel: "Site Security", site: "Head Office", lastLogin: "2024-01-27T16:45:00", status: "Active" },
  { id: "USR-004", name: "Blessing Mhlanga", email: "blessing.mhlanga@magaya.co.zw", role: "site_it", roleLabel: "Site IT", site: "Peladillo", lastLogin: "2024-01-28T09:00:00", status: "Active" },
  { id: "USR-005", name: "Faith Dube", email: "faith.dube@magaya.co.zw", role: "hq_hr", roleLabel: "HQ HR", site: "All Sites", lastLogin: "2024-01-28T08:30:00", status: "Active" },
  { id: "USR-006", name: "Peter Chirwa", email: "peter.chirwa@magaya.co.zw", role: "hod_hr", roleLabel: "HOD HR", site: "All Sites", lastLogin: "2024-01-27T11:20:00", status: "Active" },
  { id: "USR-007", name: "Grace Ncube", email: "grace.ncube@magaya.co.zw", role: "hq_admin", roleLabel: "HQ Administrator", site: "All Sites", lastLogin: "2024-01-28T07:45:00", status: "Active" },
  { id: "USR-008", name: "Tatenda Marufu", email: "tatenda.marufu@magaya.co.zw", role: "hod_security", roleLabel: "HOD Security", site: "All Sites", lastLogin: "2024-01-26T15:30:00", status: "Active" },
  { id: "USR-009", name: "Nyasha Gomo", email: "nyasha.gomo@magaya.co.zw", role: "hq_it", roleLabel: "HQ IT", site: "All Sites", lastLogin: "2024-01-28T11:00:00", status: "Active" },
  { id: "USR-010", name: "Tafadzwa Mhembere", email: "tafadzwa.mhembere@magaya.co.zw", role: "hod_it", roleLabel: "HOD IT", site: "All Sites", lastLogin: "2024-01-27T13:15:00", status: "Active" },
  { id: "USR-011", name: "John Mupfumi", email: "john.mupfumi@magaya.co.zw", role: "site_admin", roleLabel: "Site Administrator", site: "Carry", lastLogin: "2024-01-25T09:30:00", status: "Inactive" },
  { id: "USR-012", name: "Chengeto Dube", email: "chengeto.dube@magaya.co.zw", role: "site_hr", roleLabel: "Site HR", site: "Walden", lastLogin: "2024-01-26T10:00:00", status: "Active" },
];

// Extended audit log
export interface ExtendedAuditLog {
  id: string;
  timestamp: string;
  user: { name: string; role: string };
  action: string;
  module: string;
  employee: { name: string; code: string } | null;
  details: string;
  ipAddress: string;
  sessionId: string;
  previousValue: string | null;
  newValue: string | null;
}

export const mockExtendedAuditLogs: ExtendedAuditLog[] = [
  { id: "LOG-001", timestamp: "2024-01-28T14:30:00Z", user: { name: "Blessing Mhlanga", role: "Site IT" }, action: "Update", module: "Offboarding", employee: { name: "Peter Chirwa", code: "MM-2023-0187" }, details: "Completed IT Clearance: M365 account disabled", ipAddress: "192.168.5.42", sessionId: "sess_a1b2c3d4", previousValue: "M365: Active", newValue: "M365: Disabled" },
  { id: "LOG-002", timestamp: "2024-01-28T11:00:00Z", user: { name: "Blessing Mhlanga", role: "Site IT" }, action: "Update", module: "Offboarding", employee: { name: "Peter Chirwa", code: "MM-2023-0187" }, details: "Completed IT Clearance: Mobile WiFi revoked", ipAddress: "192.168.5.42", sessionId: "sess_a1b2c3d4", previousValue: "WiFi: Enabled", newValue: "WiFi: Revoked" },
  { id: "LOG-003", timestamp: "2024-01-28T09:15:00Z", user: { name: "Rudo Mupfumi", role: "HQ HR" }, action: "Create", module: "Onboarding", employee: { name: "Tendai Mutasa", code: "MM-2024-0042" }, details: "Created onboarding workflow ONB-2024-0042", ipAddress: "192.168.1.15", sessionId: "sess_e5f6g7h8", previousValue: null, newValue: "Status: In Progress" },
  { id: "LOG-004", timestamp: "2024-01-27T16:45:00Z", user: { name: "Nyasha Gomo", role: "Site Security" }, action: "Approve", module: "Onboarding", employee: { name: "Tendai Mutasa", code: "MM-2024-0042" }, details: "Signed off Security Clearance. ID card MAG-2024-0042 issued.", ipAddress: "192.168.3.88", sessionId: "sess_i9j0k1l2", previousValue: "Stage: In Progress", newValue: "Stage: Completed" },
  { id: "LOG-005", timestamp: "2024-01-27T10:30:00Z", user: { name: "HQ Administrator", role: "HQ Administrator" }, action: "Update", module: "Settings", employee: null, details: "Updated department list: added 'Renewable Energy' department", ipAddress: "192.168.1.5", sessionId: "sess_m3n4o5p6", previousValue: "Departments: 12", newValue: "Departments: 13" },
  { id: "LOG-006", timestamp: "2024-01-26T15:00:00Z", user: { name: "Rudo Mupfumi", role: "HQ HR" }, action: "Create", module: "Transfer", employee: { name: "Grace Ncube", code: "MM-2023-0156" }, details: "Initiated transfer TRF-2024-0027: Shamva to Chanton", ipAddress: "192.168.1.15", sessionId: "sess_e5f6g7h8", previousValue: "Site: Shamva", newValue: "Transfer initiated to Chanton" },
  { id: "LOG-007", timestamp: "2024-01-26T08:00:00Z", user: { name: "Tendai Mutasa", role: "Site Administrator" }, action: "Login", module: "Authentication", employee: null, details: "User login successful", ipAddress: "192.168.5.101", sessionId: "sess_q7r8s9t0", previousValue: null, newValue: null },
  { id: "LOG-008", timestamp: "2024-01-25T17:30:00Z", user: { name: "Peter Chirwa", role: "HOD HR" }, action: "Export", module: "Employee Master", employee: { name: "Peter Chirwa", code: "MM-2023-0187" }, details: "Exported employee profile as PDF", ipAddress: "192.168.2.55", sessionId: "sess_u1v2w3x4", previousValue: null, newValue: null },
  { id: "LOG-009", timestamp: "2024-01-25T14:00:00Z", user: { name: "Rudo Mupfumi", role: "HQ HR" }, action: "Delete", module: "Employee Master", employee: { name: "John Doe", code: "MM-2022-0099" }, details: "Deleted employee record (data retention policy)", ipAddress: "192.168.1.15", sessionId: "sess_e5f6g7h8", previousValue: "Status: Terminated", newValue: null },
  { id: "LOG-010", timestamp: "2024-01-25T09:00:00Z", user: { name: "Rudo Mupfumi", role: "HQ HR" }, action: "Update", module: "Employee Master", employee: { name: "Simba Katsande", code: "MM-2024-0039" }, details: "Updated employee status from Active to Transferred", ipAddress: "192.168.1.15", sessionId: "sess_e5f6g7h8", previousValue: "Status: Active, Site: Head Office", newValue: "Status: Transferred, Site: Harare" },
  { id: "LOG-011", timestamp: "2024-01-24T16:30:00Z", user: { name: "Faith Dube", role: "HQ HR" }, action: "Create", module: "Onboarding", employee: { name: "Munashe Chingwara", code: "MM-2024-0048" }, details: "Created onboarding workflow ONB-2024-0048", ipAddress: "192.168.1.22", sessionId: "sess_b2c3d4e5", previousValue: null, newValue: "Status: In Progress" },
  { id: "LOG-012", timestamp: "2024-01-24T14:15:00Z", user: { name: "Nyasha Gomo", role: "HQ IT" }, action: "Update", module: "Onboarding", employee: { name: "Munashe Chingwara", code: "MM-2024-0048" }, details: "Completed IT Provisioning: Laptop assigned", ipAddress: "192.168.1.33", sessionId: "sess_c3d4e5f6", previousValue: "IT: Pending", newValue: "IT: Completed" },
  { id: "LOG-013", timestamp: "2024-01-24T11:00:00Z", user: { name: "Simba Katsande", role: "Site Security" }, action: "Approve", module: "Onboarding", employee: { name: "Blessing Mhlanga", code: "MM-2024-0040" }, details: "Completed Security Clearance stage", ipAddress: "192.168.4.12", sessionId: "sess_d4e5f6g7", previousValue: "Security: In Progress", newValue: "Security: Completed" },
  { id: "LOG-014", timestamp: "2024-01-24T09:30:00Z", user: { name: "Grace Ncube", role: "HQ Administrator" }, action: "Create", module: "Site", employee: null, details: "Added new site: Gwanda Operations", ipAddress: "192.168.1.8", sessionId: "sess_e5f6g7h8", previousValue: "Sites: 11", newValue: "Sites: 12" },
  { id: "LOG-015", timestamp: "2024-01-23T17:00:00Z", user: { name: "Tatenda Marufu", role: "HOD Security" }, action: "Reject", module: "Onboarding", employee: { name: "Farai Machingura", code: "MM-2024-0050" }, details: "Rejected Security Clearance - incomplete documentation", ipAddress: "192.168.6.22", sessionId: "sess_f6g7h8i9", previousValue: "Status: Pending", newValue: "Status: Rejected" },
  { id: "LOG-016", timestamp: "2024-01-23T15:30:00Z", user: { name: "Tafadzwa Mhembere", role: "HOD IT" }, action: "Update", module: "Settings", employee: null, details: "Updated hardware catalog: added new laptop model", ipAddress: "192.168.1.44", sessionId: "sess_g7h8i9j0", previousValue: "Catalog: 6 items", newValue: "Catalog: 7 items" },
  { id: "LOG-017", timestamp: "2024-01-23T12:00:00Z", user: { name: "Faith Dube", role: "HQ HR" }, action: "Update", module: "Employee Master", employee: { name: "Rudo Chikwamba", code: "MM-2023-0123" }, details: "Updated department from HR to Operations", ipAddress: "192.168.1.22", sessionId: "sess_h8i9j0k1", previousValue: "Department: HR", newValue: "Department: Operations" },
  { id: "LOG-018", timestamp: "2024-01-23T10:00:00Z", user: { name: "Tendai Moyo", role: "Site Administrator" }, action: "View", module: "Report", employee: null, details: "Viewed employee census report", ipAddress: "192.168.5.55", sessionId: "sess_i9j0k1l2", previousValue: null, newValue: null },
  { id: "LOG-019", timestamp: "2024-01-22T16:45:00Z", user: { name: "Peter Chirwa", role: "HOD HR" }, action: "Export", module: "Transfer", employee: null, details: "Exported transfer report for Q4 2023", ipAddress: "192.168.2.33", sessionId: "sess_j0k1l2m3", previousValue: null, newValue: null },
  { id: "LOG-020", timestamp: "2024-01-22T14:30:00Z", user: { name: "Chengeto Dube", role: "Site HR" }, action: "Create", module: "Employee Master", employee: { name: "Shamiso Mashaya", code: "MM-2024-0055" }, details: "Created new employee record", ipAddress: "192.168.7.11", sessionId: "sess_k1l2m3n4", previousValue: null, newValue: "Status: Onboarding" },
  { id: "LOG-021", timestamp: "2024-01-22T11:00:00Z", user: { name: "HQ Administrator", role: "HQ Administrator" }, action: "Update", module: "Settings", employee: null, details: "Changed session timeout from 30 to 60 minutes", ipAddress: "192.168.1.5", sessionId: "sess_l2m3n4o5", previousValue: "Timeout: 30 min", newValue: "Timeout: 60 min" },
  { id: "LOG-022", timestamp: "2024-01-22T09:00:00Z", user: { name: "Rudo Mupfumi", role: "HQ HR" }, action: "Login", module: "Authentication", employee: null, details: "User login successful", ipAddress: "192.168.1.15", sessionId: "sess_m3n4o5p6", previousValue: null, newValue: null },
  { id: "LOG-023", timestamp: "2024-01-21T17:30:00Z", user: { name: "Blessing Mhlanga", role: "Site IT" }, action: "Update", module: "Offboarding", employee: { name: "Tanaka Mudzviti", code: "MM-2023-0176" }, details: "Returned hardware: laptop, mobile phone, access card", ipAddress: "192.168.8.44", sessionId: "sess_n4o5p6q7", previousValue: "Hardware: Assigned", newValue: "Hardware: Returned" },
  { id: "LOG-024", timestamp: "2024-01-21T15:00:00Z", user: { name: "Simba Katsande", role: "Site Security" }, action: "Update", module: "Offboarding", employee: { name: "Tanaka Mudzviti", code: "MM-2023-0176" }, details: "Revoked access cards and cleared security", ipAddress: "192.168.4.12", sessionId: "sess_o5p6q7r8", previousValue: "Access: Active", newValue: "Access: Revoked" },
  { id: "LOG-025", timestamp: "2024-01-21T12:00:00Z", user: { name: "Faith Dube", role: "HQ HR" }, action: "Approve", module: "Offboarding", employee: { name: "Tanaka Mudzviti", code: "MM-2023-0176" }, details: "Final HR clearance - offboarding complete", ipAddress: "192.168.1.22", sessionId: "sess_p6q7r8s9", previousValue: "Status: In Progress", newValue: "Status: Completed" },
  { id: "LOG-026", timestamp: "2024-01-20T16:00:00Z", user: { name: "Grace Ncube", role: "HQ Administrator" }, action: "Create", module: "Employee Master", employee: { name: "Paidamoyo Sibanda", code: "MM-2024-0060" }, details: "Bulk import of 15 new employees", ipAddress: "192.168.1.8", sessionId: "sess_q7r8s9t0", previousValue: "Employees: 847", newValue: "Employees: 862" },
  { id: "LOG-027", timestamp: "2024-01-20T14:30:00Z", user: { name: "Tatenda Marufu", role: "HOD Security" }, action: "View", module: "Employee Master", employee: { name: "Simba Katsande", code: "MM-2024-0039" }, details: "Viewed employee security profile", ipAddress: "192.168.6.22", sessionId: "sess_r8s9t0u1", previousValue: null, newValue: null },
  { id: "LOG-028", timestamp: "2024-01-20T11:00:00Z", user: { name: "Tafadzwa Mhembere", role: "HOD IT" }, action: "Update", module: "Settings", employee: null, details: "Updated software license: AutoCAD 2024 renewed", ipAddress: "192.168.1.44", sessionId: "sess_s9t0u1v2", previousValue: "License: Expired", newValue: "License: Active" },
  { id: "LOG-029", timestamp: "2024-01-19T17:00:00Z", user: { name: "Tendai Moyo", role: "Site Administrator" }, action: "Logout", module: "Authentication", employee: null, details: "User logout", ipAddress: "192.168.5.55", sessionId: "sess_t0u1v2w3", previousValue: null, newValue: null },
  { id: "LOG-030", timestamp: "2024-01-19T15:30:00Z", user: { name: "Kudzai Mhembere", role: "Site HR" }, action: "Create", module: "Transfer", employee: { name: "Blessing Mhlanga", code: "MM-2024-0040" }, details: "Initiated transfer: Harare to Pickstone", ipAddress: "192.168.9.33", sessionId: "sess_u1v2w3x4", previousValue: "Site: Harare", newValue: "Transfer: Pickstone" },
  { id: "LOG-031", timestamp: "2024-01-19T12:00:00Z", user: { name: "John Mupfumi", role: "Site Administrator" }, action: "Update", module: "Site", employee: null, details: "Updated Carry site address", ipAddress: "192.168.10.11", sessionId: "sess_v2w3x4y5", previousValue: "Address: Old", newValue: "Address: Updated" },
  { id: "LOG-032", timestamp: "2024-01-19T10:00:00Z", user: { name: "Rudo Mupfumi", role: "HQ HR" }, action: "Reject", module: "Transfer", employee: { name: "Peter Chirwa", code: "MM-2023-0187" }, details: "Rejected transfer request - incomplete docs", ipAddress: "192.168.1.15", sessionId: "sess_w3x4y5z6", previousValue: "Status: Pending", newValue: "Status: Rejected" },
  { id: "LOG-033", timestamp: "2024-01-18T16:30:00Z", user: { name: "Nyasha Gomo", role: "HQ IT" }, action: "Export", module: "Settings", employee: null, details: "Exported system configuration backup", ipAddress: "192.168.1.33", sessionId: "sess_x4y5z6a7", previousValue: null, newValue: null },
  { id: "LOG-034", timestamp: "2024-01-18T14:00:00Z", user: { name: "Patricia Makoni", role: "Site HR" }, action: "Update", module: "Employee Master", employee: { name: "Farai Machingura", code: "MM-2024-0050" }, details: "Updated phone number and address", ipAddress: "192.168.11.22", sessionId: "sess_y5z6a7b8", previousValue: "Phone: +263772345678", newValue: "Phone: +263773456789" },
  { id: "LOG-035", timestamp: "2024-01-18T11:30:00Z", user: { name: "HQ Administrator", role: "HQ Administrator" }, action: "Delete", module: "Settings", employee: null, details: "Removed deprecated department: Renewable Energy", ipAddress: "192.168.1.5", sessionId: "sess_z6a7b8c9", previousValue: "Departments: 13", newValue: "Departments: 12" },
  { id: "LOG-036", timestamp: "2024-01-18T09:00:00Z", user: { name: "Chengeto Dube", role: "Site HR" }, action: "Create", module: "Onboarding", employee: { name: "Tatenda Mupfumi", code: "MM-2024-0065" }, details: "Created onboarding for new mine operator", ipAddress: "192.168.7.11", sessionId: "sess_a7b8c9d0", previousValue: null, newValue: "Status: In Progress" },
  { id: "LOG-037", timestamp: "2024-01-17T17:00:00Z", user: { name: "Faith Dube", role: "HQ HR" }, action: "View", module: "Report", employee: null, details: "Viewed retention policy compliance report", ipAddress: "192.168.1.22", sessionId: "sess_b8c9d0e1", previousValue: null, newValue: null },
  { id: "LOG-038", timestamp: "2024-01-17T15:00:00Z", user: { name: "Tatenda Marufu", role: "HOD Security" }, action: "Update", module: "Employee Master", employee: { name: "Rudo Chikwamba", code: "MM-2023-0123" }, details: "Updated security clearance level to Level 3", ipAddress: "192.168.6.22", sessionId: "sess_c9d0e1f2", previousValue: "Clearance: Level 2", newValue: "Clearance: Level 3" },
  { id: "LOG-039", timestamp: "2024-01-17T12:00:00Z", user: { name: "Tafadzwa Mhembere", role: "HOD IT" }, action: "Login", module: "Authentication", employee: null, details: "User login successful", ipAddress: "192.168.1.44", sessionId: "sess_d0e1f2g3", previousValue: null, newValue: null },
  { id: "LOG-040", timestamp: "2024-01-17T10:00:00Z", user: { name: "Grace Ncube", role: "HQ Administrator" }, action: "Create", module: "Settings", employee: null, details: "Added new notification event: Hardware Request", ipAddress: "192.168.1.8", sessionId: "sess_e1f2g3h4", previousValue: "Events: 11", newValue: "Events: 12" },
  { id: "LOG-041", timestamp: "2024-01-16T16:30:00Z", user: { name: "Rudo Mupfumi", role: "HQ HR" }, action: "Update", module: "Offboarding", employee: { name: "Samantha Mhondera", code: "MM-2023-0145" }, details: "Initiated offboarding for retirement", ipAddress: "192.168.1.15", sessionId: "sess_f2g3h4i5", previousValue: "Status: Active", newValue: "Status: Offboarding" },
  { id: "LOG-042", timestamp: "2024-01-16T14:00:00Z", user: { name: "Blessing Mhlanga", role: "Site IT" }, action: "Update", module: "Onboarding", employee: { name: "Tatenda Mupfumi", code: "MM-2024-0065" }, details: "Assigned laptop and configured M365 account", ipAddress: "192.168.8.44", sessionId: "sess_g3h4i5j6", previousValue: "IT: Pending", newValue: "IT: Completed" },
  { id: "LOG-043", timestamp: "2024-01-16T11:00:00Z", user: { name: "Simba Katsande", role: "Site Security" }, action: "Approve", module: "Onboarding", employee: { name: "Shamiso Mashaya", code: "MM-2024-0055" }, details: "Completed security clearance - issued access cards", ipAddress: "192.168.4.12", sessionId: "sess_h4i5j6k7", previousValue: "Security: Pending", newValue: "Security: Completed" },
  { id: "LOG-044", timestamp: "2024-01-16T09:00:00Z", user: { name: "Peter Chirwa", role: "HOD HR" }, action: "Export", module: "Report", employee: null, details: "Exported monthly HR summary report", ipAddress: "192.168.2.33", sessionId: "sess_i5j6k7l8", previousValue: null, newValue: null },
  { id: "LOG-045", timestamp: "2024-01-15T17:00:00Z", user: { name: "Tendai Moyo", role: "Site Administrator" }, action: "Update", module: "Site", employee: null, details: "Updated Pickstone site emergency contacts", ipAddress: "192.168.5.55", sessionId: "sess_j6k7l8m9", previousValue: "Contacts: Old", newValue: "Contacts: Updated" },
  { id: "LOG-046", timestamp: "2024-01-15T15:00:00Z", user: { name: "HQ Administrator", role: "HQ Administrator" }, action: "Create", module: "Employee Master", employee: { name: "Chido Mupambwa", code: "MM-2024-0070" }, details: "Created admin assistant position and record", ipAddress: "192.168.1.5", sessionId: "sess_k7l8m9n0", previousValue: null, newValue: "Status: Onboarding" },
  { id: "LOG-047", timestamp: "2024-01-15T12:00:00Z", user: { name: "Faith Dube", role: "HQ HR" }, action: "View", module: "Employee Master", employee: { name: "Grace Ncube", code: "MM-2022-0056" }, details: "Viewed employee profile for verification", ipAddress: "192.168.1.22", sessionId: "sess_l8m9n0o1", previousValue: null, newValue: null },
  { id: "LOG-048", timestamp: "2024-01-15T10:00:00Z", user: { name: "Nyasha Gomo", role: "HQ IT" }, action: "Delete", module: "Settings", employee: null, details: "Removed old software entry: Windows 7", ipAddress: "192.168.1.33", sessionId: "sess_m9n0o1p2", previousValue: "Software: 6 items", newValue: "Software: 5 items" },
  { id: "LOG-049", timestamp: "2024-01-14T16:30:00Z", user: { name: "Rudo Mupfumi", role: "HQ HR" }, action: "Login", module: "Authentication", employee: null, details: "User login successful", ipAddress: "192.168.1.15", sessionId: "sess_n0o1p2q3", previousValue: null, newValue: null },
  { id: "LOG-050", timestamp: "2024-01-14T14:00:00Z", user: { name: "Tatenda Marufu", role: "HOD Security" }, action: "Update", module: "Transfer", employee: { name: "Kudakwashe Mupini", code: "MM-2023-0145" }, details: "Approved destination security clearance", ipAddress: "192.168.6.22", sessionId: "sess_o1p2q3r4", previousValue: "Security: Pending", newValue: "Security: Approved" },
];

// Role color helpers
export const roleRingColors: Record<string, string> = {
  hr: "ring-[#B91C1C]",
  it: "ring-[#7C3AED]",
  security: "ring-[#1E6BA3]",
  admin: "ring-[#166534]",
  hod: "ring-[#C27A06]",
  gm: "ring-[#1A1A1A]",
};

export const roleBgColors: Record<string, string> = {
  hr: "bg-[#FEF2F2]",
  it: "bg-[#F3E8FF]",
  security: "bg-[#E8F2FA]",
  admin: "bg-[#F0FDF4]",
  hod: "bg-[#FFF7ED]",
  gm: "bg-[#1A1A1A]",
};

export const personnelRoles = [
  { key: "hr" as keyof SitePersonnel, label: "Site HR Lead", color: "hr" },
  { key: "it" as keyof SitePersonnel, label: "Site IT Administrator", color: "it" },
  { key: "security" as keyof SitePersonnel, label: "Site Security Lead", color: "security" },
  { key: "admin" as keyof SitePersonnel, label: "Site Administrator", color: "admin" },
  { key: "hod" as keyof SitePersonnel, label: "HOD", color: "hod" },
  { key: "gm" as keyof SitePersonnel, label: "Site GM", color: "gm" },
];

// Action badge colors
export const actionBadgeColors: Record<string, { bg: string; text: string }> = {
  Create: { bg: "#E8F5EC", text: "#1B7A43" },
  Update: { bg: "#E8F2FA", text: "#1E6BA3" },
  Delete: { bg: "#FEF2F2", text: "#B91C1C" },
  Approve: { bg: "#E8F5EC", text: "#1B7A43" },
  Reject: { bg: "#FEF2F2", text: "#B91C1C" },
  Login: { bg: "#F5F5F5", text: "#737373" },
  Logout: { bg: "#F5F5F5", text: "#737373" },
  Export: { bg: "#F3E8FF", text: "#7C3AED" },
  View: { bg: "#F5F5F5", text: "#737373" },
};

// Chart colors
export const CHART_COLORS = {
  gold: "#D4A017",
  success: "#1B7A43",
  info: "#1E6BA3",
  warning: "#C27A06",
  danger: "#B91C1C",
};
