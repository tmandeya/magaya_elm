import { useState, useCallback, useContext, createContext } from "react";
import type { UserRole, User } from "@/types";

const MOCK_USERS: Record<UserRole, User> = {
  site_admin: { id: "USR-001", name: "Tendai Moyo", email: "tendai.moyo@magaya.co.zw", role: "site_admin", roleLabel: "Site Administrator", siteId: 5, siteName: "Pickstone", initials: "TM" },
  site_hr: { id: "USR-002", name: "Rudo Chikwamba", email: "rudo.chikwamba@magaya.co.zw", role: "site_hr", roleLabel: "Site HR", siteId: 2, siteName: "Harare — 207 Sam Nujoma", initials: "RC" },
  site_security: { id: "USR-003", name: "Simba Katsande", email: "simba.katsande@magaya.co.zw", role: "site_security", roleLabel: "Site Security", siteId: 6, siteName: "Chanton", initials: "SK" },
  site_it: { id: "USR-004", name: "Blessing Mhlanga", email: "blessing.mhlanga@magaya.co.zw", role: "site_it", roleLabel: "Site IT Administrator", siteId: 4, siteName: "Peladillo", initials: "BM" },
  hq_hr: { id: "USR-005", name: "Faith Dube", email: "faith.dube@magaya.co.zw", role: "hq_hr", roleLabel: "HQ HR", initials: "FD" },
  hod_hr: { id: "USR-006", name: "Peter Chirwa", email: "peter.chirwa@magaya.co.zw", role: "hod_hr", roleLabel: "HOD HR", initials: "PC" },
  hq_admin: { id: "USR-007", name: "Grace Ncube", email: "grace.ncube@magaya.co.zw", role: "hq_admin", roleLabel: "HQ Administrator", initials: "GN" },
  hod_security: { id: "USR-008", name: "Tatenda Marufu", email: "tatenda.marufu@magaya.co.zw", role: "hod_security", roleLabel: "HOD Security", initials: "TM" },
  hq_it: { id: "USR-009", name: "Nyasha Gomo", email: "nyasha.gomo@magaya.co.zw", role: "hq_it", roleLabel: "HQ IT", initials: "NG" },
  hod_it: { id: "USR-010", name: "Tafadzwa Mhembere", email: "tafadzwa.mhembere@magaya.co.zw", role: "hod_it", roleLabel: "HOD IT", initials: "TMh" },
};

interface AuthContextType {
  user: User | null;
  currentRole: UserRole | null;
  isAuthenticated: boolean;
  login: (role: UserRole, siteId?: number) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, currentRole: null, isAuthenticated: false,
  login: () => {}, logout: () => {}, setRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const login = useCallback((role: UserRole, siteId?: number) => {
    const mockUser = { ...MOCK_USERS[role] };
    if (siteId && mockUser) { mockUser.siteId = siteId; }
    setUser(mockUser);
    setCurrentRole(role);
  }, []);

  const logout = useCallback(() => { setUser(null); setCurrentRole(null); }, []);

  const setRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    const mockUser = MOCK_USERS[role];
    if (mockUser) { setUser(mockUser); }
  }, []);

  return (
    <AuthContext.Provider value={{ user, currentRole, isAuthenticated: !!user, login, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
