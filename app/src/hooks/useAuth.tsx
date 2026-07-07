import { useState, useEffect, useCallback, useContext, createContext, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, fetchMyProfile, touchLastLogin } from "@/lib/supabase";
import { DB_ROLE_TO_UI, ROLE_LABELS, initialsFromName } from "@/types/db";
import type { UserRole, User } from "@/types";

interface AuthContextType {
  user: User | null;
  currentRole: UserRole | null;
  /** UUID of the user's site in the live database (null for HQ roles). */
  siteUuid: string | null;
  isAuthenticated: boolean;
  /** True while the initial session is being restored. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  currentRole: null,
  siteUuid: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ error: "Auth not initialised" }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [siteUuid, setSiteUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadedForUserId = useRef<string | null>(null);

  const loadProfile = useCallback(async (session: Session | null): Promise<string | null> => {
    if (!session?.user) {
      setUser(null);
      setCurrentRole(null);
      setSiteUuid(null);
      loadedForUserId.current = null;
      return null;
    }
    // Avoid refetching on token refresh events for the same user
    if (loadedForUserId.current === session.user.id) return null;

    const { data: profile, error } = await fetchMyProfile(session.user.id);
    if (error || !profile) {
      await supabase.auth.signOut();
      return "Your account has no profile in ELMS. Contact the system administrator.";
    }
    if (!profile.is_active) {
      await supabase.auth.signOut();
      return "Your account has been deactivated. Contact the system administrator.";
    }

    const uiRole = DB_ROLE_TO_UI[profile.role as keyof typeof DB_ROLE_TO_UI];
    if (!uiRole) {
      await supabase.auth.signOut();
      return "Your account role is not recognised. Contact the system administrator.";
    }

    setUser({
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: uiRole,
      roleLabel: ROLE_LABELS[uiRole],
      siteName: profile.sites?.name ?? undefined,
      avatarUrl: profile.avatar_url ?? undefined,
      initials: initialsFromName(profile.full_name),
    });
    setCurrentRole(uiRole);
    setSiteUuid(profile.site_id ?? null);
    loadedForUserId.current = profile.id;
    touchLastLogin(profile.id);
    return null;
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

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message;
      return { error: msg };
    }
    const profileError = await loadProfile(data.session);
    return { error: profileError };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentRole(null);
    setSiteUuid(null);
    loadedForUserId.current = null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, currentRole, siteUuid, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
