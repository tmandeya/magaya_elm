import type { RoleDefinition } from "@/types";

// src/lib/uiConstants.ts
// UI display constants (role labels, ring colors) — extracted from the
// retired mock-data files so live pages carry no @/data imports.

export interface SitePersonnelSlots {
  hr?: unknown; it?: unknown; security?: unknown; admin?: unknown; hod?: unknown; gm?: unknown;
}

export const roleRingColors: Record<string, string> = {
  hr: "ring-[#B91C1C]",
  it: "ring-[#7C3AED]",
  security: "ring-[#1E6BA3]",
  admin: "ring-[#166534]",
  hod: "ring-[#C27A06]",
  gm: "ring-[#1A1A1A]",
};

export const personnelRoles = [
  { key: "hr" as const, label: "Site HR Lead", color: "hr" },
  { key: "it" as const, label: "Site IT Administrator", color: "it" },
  { key: "security" as const, label: "Site Security Lead", color: "security" },
  { key: "admin" as const, label: "Site Administrator", color: "admin" },
  { key: "hod" as const, label: "HOD", color: "hod" },
  { key: "gm" as const, label: "Site GM", color: "gm" },
];

export const roleDefinitions: RoleDefinition[] = [
  { id: "site_admin", label: "Site Administrator", siteRequired: true, permissions: ["employees:read", "employees:write", "onboarding:read", "onboarding:write", "offboarding:read", "offboarding:write", "transfers:read", "transfers:write", "sites:read", "reports:read", "settings:read"], navItems: ["dashboard", "employees", "onboarding", "offboarding", "transfers", "sites", "reports", "settings"] },
  { id: "site_hr", label: "Site HR", siteRequired: true, permissions: ["employees:read", "employees:write", "onboarding:read", "onboarding:write", "offboarding:read", "offboarding:write", "transfers:read", "transfers:write", "sites:read", "reports:read", "settings:read"], navItems: ["dashboard", "employees", "onboarding", "offboarding", "transfers", "sites", "reports", "settings"] },
  { id: "site_security", label: "Site Security", siteRequired: true, permissions: ["employees:read", "onboarding:read", "offboarding:read", "offboarding:write", "transfers:read", "sites:read", "reports:read"], navItems: ["dashboard", "employees", "onboarding", "offboarding", "transfers", "sites", "reports"] },
  { id: "site_it", label: "Site IT Administrator", siteRequired: true, permissions: ["employees:read", "onboarding:read", "onboarding:write", "offboarding:read", "offboarding:write", "transfers:read", "sites:read", "reports:read"], navItems: ["dashboard", "employees", "onboarding", "offboarding", "transfers", "sites", "reports"] },
  { id: "hq_hr", label: "HQ HR", siteRequired: false, permissions: ["employees:read", "employees:write", "employees:delete", "onboarding:read", "onboarding:write", "onboarding:approve", "offboarding:read", "offboarding:write", "offboarding:approve", "transfers:read", "transfers:write", "transfers:approve", "sites:read", "sites:write", "reports:read", "reports:write", "audit:read", "settings:read", "settings:write", "admin:all"], navItems: ["dashboard", "employees", "onboarding", "offboarding", "transfers", "sites", "reports", "audit-logs", "settings"] },
  { id: "hod_hr", label: "HOD HR", siteRequired: false, permissions: ["employees:read", "employees:write", "onboarding:read", "onboarding:write", "offboarding:read", "offboarding:write", "transfers:read", "transfers:write", "sites:read", "reports:read", "audit:read", "settings:read"], navItems: ["dashboard", "employees", "onboarding", "offboarding", "transfers", "sites", "reports", "audit-logs", "settings"] },
  { id: "hq_admin", label: "HQ Administrator", siteRequired: false, permissions: ["employees:read", "onboarding:read", "offboarding:read", "transfers:read", "sites:read", "sites:write", "reports:read", "reports:write", "audit:read", "settings:read", "settings:write", "admin:all"], navItems: ["dashboard", "employees", "onboarding", "offboarding", "transfers", "sites", "reports", "audit-logs", "settings"] },
  { id: "hod_security", label: "HOD Security", siteRequired: false, permissions: ["employees:read", "onboarding:read", "offboarding:read", "offboarding:write", "transfers:read", "sites:read", "reports:read", "audit:read"], navItems: ["dashboard", "employees", "onboarding", "offboarding", "transfers", "sites", "reports", "audit-logs"] },
  { id: "hq_it", label: "HQ IT", siteRequired: false, permissions: ["employees:read", "onboarding:read", "onboarding:write", "offboarding:read", "offboarding:write", "transfers:read", "sites:read", "reports:read", "audit:read", "settings:read"], navItems: ["dashboard", "employees", "onboarding", "offboarding", "transfers", "sites", "reports", "audit-logs", "settings"] },
  { id: "hod_it", label: "HOD IT", siteRequired: false, permissions: ["employees:read", "onboarding:read", "onboarding:write", "offboarding:read", "offboarding:write", "transfers:read", "sites:read", "reports:read", "audit:read"], navItems: ["dashboard", "employees", "onboarding", "offboarding", "transfers", "sites", "reports", "audit-logs"] },
];
