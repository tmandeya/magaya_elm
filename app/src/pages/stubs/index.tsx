// Real page implementations - no stubs remaining
import Employees from "@/pages/Employees";
import EmployeeProfile from "@/pages/EmployeeProfile";
import Onboarding from "@/pages/Onboarding";
import Offboarding from "@/pages/Offboarding";
import Transfers from "@/pages/Transfers";
import SitesPage from "@/pages/Sites";
import SettingsPage from "@/pages/Settings";
import AuditLogsPage from "@/pages/AuditLogs";
import ReportsPage from "@/pages/Reports";

export const EmployeeStub = Employees;
export const EmployeeProfileStub = EmployeeProfile;
export const OnboardingStub = () => <Onboarding />;
export const OnboardingDetailStub = () => <Onboarding />;
export const OffboardingStub = () => <Offboarding />;
export const OffboardingDetailStub = () => <Offboarding />;
export const TransferStub = () => <Transfers />;
export const TransferDetailStub = () => <Transfers />;
export const SitesStub = () => <SitesPage />;
export const ReportsStub = () => <ReportsPage />;
export const AuditLogsStub = () => <AuditLogsPage />;
export const SettingsStub = () => <SettingsPage />;
