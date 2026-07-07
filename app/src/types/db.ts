// src/types/db.ts
// Types matching the LIVE Supabase v2 schema (project wjiyxnctajxogxqslyii).
// These mirror actual database rows. Frontend display types live in ./index.ts.

import type { UserRole } from "./index";

/** Matches the `app_role` enum in the database. */
export type DbAppRole =
  | "site_administrator"
  | "site_hr"
  | "site_security"
  | "site_it_administrator"
  | "hq_hr"
  | "hod_hr"
  | "hq_administrator"
  | "hod_security"
  | "hq_it"
  | "hod_it";

/** Matches a row in `public.profiles` (auth-linked user profile). */
export interface DbProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: DbAppRole;
  site_id: string | null;
  department_id: string | null;
  is_active: boolean;
  notification_preference: "in_app" | "email" | "both";
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Profile row with the joined site name (as fetched by fetchMyProfile). */
export interface DbProfileWithSite extends DbProfile {
  sites: { id: string; name: string; code: string } | null;
}

/** DB role enum -> frontend UserRole used across pages/components. */
export const DB_ROLE_TO_UI: Record<DbAppRole, UserRole> = {
  site_administrator: "site_admin",
  site_hr: "site_hr",
  site_security: "site_security",
  site_it_administrator: "site_it",
  hq_hr: "hq_hr",
  hod_hr: "hod_hr",
  hq_administrator: "hq_admin",
  hod_security: "hod_security",
  hq_it: "hq_it",
  hod_it: "hod_it",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  site_admin: "Site Administrator",
  site_hr: "Site HR",
  site_security: "Site Security",
  site_it: "Site IT Administrator",
  hq_hr: "HQ HR",
  hod_hr: "HOD HR",
  hq_admin: "HQ Administrator",
  hod_security: "HOD Security",
  hq_it: "HQ IT",
  hod_it: "HOD IT",
};

export function initialsFromName(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase())
    .slice(0, 2)
    .join("") || "?";
}
