import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";

// Eager load login (first thing users see)
import Login from "@/pages/Login";

// Lazy load all other pages for code splitting
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Employees = lazy(() => import("@/pages/Employees"));
const EmployeeProfile = lazy(() => import("@/pages/EmployeeProfile"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Offboarding = lazy(() => import("@/pages/Offboarding"));
const Transfers = lazy(() => import("@/pages/Transfers"));
const Sites = lazy(() => import("@/pages/Sites"));
const Reports = lazy(() => import("@/pages/Reports"));
const AuditLogs = lazy(() => import("@/pages/AuditLogs"));
const Settings = lazy(() => import("@/pages/Settings"));

function LoadingFallback() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      background: "#f4f3ef"
    }}>
      <div style={{
        width: 32, height: 32,
        border: "3px solid #e5e4e0",
        borderTopColor: "#d4a017",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingFallback />;
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
        <Route path="/employees" element={<Suspense fallback={<LoadingFallback />}><Employees /></Suspense>} />
        <Route path="/employees/:id" element={<Suspense fallback={<LoadingFallback />}><EmployeeProfile /></Suspense>} />
        <Route path="/onboarding" element={<Suspense fallback={<LoadingFallback />}><Onboarding /></Suspense>} />
        <Route path="/onboarding/:id" element={<Suspense fallback={<LoadingFallback />}><Onboarding /></Suspense>} />
        <Route path="/offboarding" element={<Suspense fallback={<LoadingFallback />}><Offboarding /></Suspense>} />
        <Route path="/offboarding/:id" element={<Suspense fallback={<LoadingFallback />}><Offboarding /></Suspense>} />
        <Route path="/transfers" element={<Suspense fallback={<LoadingFallback />}><Transfers /></Suspense>} />
        <Route path="/transfers/:id" element={<Suspense fallback={<LoadingFallback />}><Transfers /></Suspense>} />
        <Route path="/sites" element={<Suspense fallback={<LoadingFallback />}><Sites /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<LoadingFallback />}><Reports /></Suspense>} />
        <Route path="/audit-logs" element={<Suspense fallback={<LoadingFallback />}><AuditLogs /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<LoadingFallback />}><Settings /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
