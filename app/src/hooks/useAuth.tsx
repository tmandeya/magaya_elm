import { useState, useEffect, useCallback, useContext, createContext, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, fetchMyProfile, touchLastLogin } from "@/lib/supabase";
import { DB_ROLE_TO_UI, ROLE_LABELS, initialsFromName } from "@/types/db";
import type { UserRole, User } from "@/types";

/**
 * Sign-in policy (enforced again by the database; this is the user-facing side):
 *  - ELMS is Microsoft sign-in only. A session created any other way is ended.
 *  - HR and administrator roles must also confirm an ELMS authenticator code
 *    (Supabase TOTP, assurance level aal2) before any data is served.
 */
export const MFA_REQUIRED_ROLES = new Set([
  "site_hr", "hq_hr", "hod_hr",
  "hod_it", "hq_it", "site_it_administrator", "hq_administrator", "site_administrator",
]);

/** "ok" = full access; "enroll" = must set up an authenticator; "verify" = must enter a code. */
export type MfaState = "ok" | "enroll" | "verify";

interface AuthContextType {
  user: User | null;
  currentRole: UserRole | null;
  /** UUID of the user's site in the live database (null for HQ roles). */
  siteUuid: string | null;
  isAuthenticated: boolean;
  /** True while the initial session is being restored. */
  isLoading: boolean;
  mfaState: MfaState;
  /** Re-check the code requirement after enrolling or verifying. */
  refreshMfa: () => Promise<void>;
  /** A message to show on the login page (e.g. why a session was ended). */
  authNotice: string | null;
  loginWithMicrosoft: () => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, currentRole: null, siteUuid: null, isAuthenticated: false, isLoading: true,
  mfaState: "ok", refreshMfa: async () => {}, authNotice: null,
  loginWithMicrosoft: async () => "Auth not initialised", logout: async () => {},
});

/** Authentication methods recorded in the access token (e.g. ["oauth"], ["oauth","totp"]). */
function tokenMethods(session: Session): string[] {
  try {
    const payload = JSON.parse(atob(session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Array.isArray(payload.amr) ? payload.amr.map((a: { method?: string } | string) => (typeof a === "string" ? a : a.method ?? "")) : [];
  } catch { return []; }
}

async function mfaStateFor(dbRole: string): Promise<MfaState> {
  if (!MFA_REQUIRED_ROLES.has(dbRole)) return "ok";
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel === "aal2") return "ok";
  return data?.nextLevel === "aal2" ? "verify" : "enroll";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [siteUuid, setSiteUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaState, setMfaState] = useState<MfaState>("ok");
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const loadedForUserId = useRef<string | null>(null);
  const dbRoleRef = useRef<string | null>(null);

  const clear = () => {
    setUser(null); setCurrentRole(null); setSiteUuid(null); setMfaState("ok");
    loadedForUserId.current = null; dbRoleRef.current = null;
  };

  const deny = async (message: string) => {
    await supabase.auth.signOut();
    clear();
    setAuthNotice(message);
  };

  const loadProfile = useCallback(async (session: Session | null): Promise<void> => {
    if (!session?.user) { clear(); return; }
    if (!tokenMethods(session).includes("oauth")) {
      await deny("ELMS sign-in is through Microsoft only. Please use “Sign in with Microsoft”.");
      return;
    }
    // Token refreshes for the same user only need the code requirement re-checked
    if (loadedForUserId.current === session.user.id && dbRoleRef.current) {
      setMfaState(await mfaStateFor(dbRoleRef.current));
      return;
    }

    const { data: profile, error } = await fetchMyProfile(session.user.id);
    if (error || !profile) { await deny("Your Microsoft account has no ELMS account. Contact the system administrator."); return; }
    if (!profile.is_active) { await deny("Your ELMS account has been deactivated. Contact the system administrator."); return; }
    const uiRole = DB_ROLE_TO_UI[profile.role as keyof typeof DB_ROLE_TO_UI];
    if (!uiRole) { await deny("Your account role is not recognised. Contact the system administrator."); return; }

    dbRoleRef.current = profile.role;
    setMfaState(await mfaStateFor(profile.role));
    setUser({
      id: profile.id, name: profile.full_name, email: profile.email, role: uiRole, roleLabel: ROLE_LABELS[uiRole],
      siteName: profile.sites?.name ?? undefined, avatarUrl: profile.avatar_url ?? undefined, initials: initialsFromName(profile.full_name),
    });
    setCurrentRole(uiRole);
    setSiteUuid(profile.site_id ?? null);
    setAuthNotice(null);
    loadedForUserId.current = profile.id;
    touchLastLogin(profile.id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      await loadProfile(session);
      setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase warns against awaiting inside this callback; defer instead.
      setTimeout(() => { void loadProfile(session); }, 0);
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [loadProfile]);

  const refreshMfa = useCallback(async () => {
    if (dbRoleRef.current) setMfaState(await mfaStateFor(dbRoleRef.current));
  }, []);

  const loginWithMicrosoft = useCallback(async (): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { scopes: "openid profile email", redirectTo: window.location.origin, skipBrowserRedirect: true },
    });
    if (error || !data?.url) return error?.message ?? "Could not start Microsoft sign-in.";
    try {
      const probe = await fetch(data.url, { method: "GET", redirect: "manual" });
      if (probe.status === 400 || probe.status === 404) return "Microsoft sign-in is not available right now. Contact IT.";
    } catch { /* opaque redirect = provider responded; proceed */ }
    window.location.assign(data.url);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clear();
  }, []);

  return (
    <AuthContext.Provider value={{ user, currentRole, siteUuid, isAuthenticated: !!user, isLoading, mfaState, refreshMfa, authNotice, loginWithMicrosoft, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
