import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Footer from "./Footer";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard", "/employees": "Employee Master Data", "/onboarding": "Onboarding Hub",
  "/offboarding": "Offboarding Hub", "/transfers": "Transfer Hub", "/sites": "Sites Management",
  "/reports": "Reports & Analytics", "/audit-logs": "Audit Logs", "/settings": "Settings",
};

function buildBreadcrumb(pathname: string) {
  const crumbs: { label: string; path?: string }[] = [{ label: "Home", path: "/dashboard" }];
  if (pathname === "/dashboard") crumbs.push({ label: "Dashboard" });
  else if (pathname.startsWith("/employees")) { crumbs.push({ label: "Employees", path: "/employees" }); const id = pathname.split("/").pop(); if (id && id !== "employees") crumbs.push({ label: `Employee #${id}` }); }
  else if (pathname === "/onboarding") crumbs.push({ label: "Onboarding" });
  else if (pathname.startsWith("/onboarding/")) { crumbs.push({ label: "Onboarding", path: "/onboarding" }); crumbs.push({ label: pathname.split("/").pop() ?? "Detail" }); }
  else if (pathname === "/offboarding") crumbs.push({ label: "Offboarding" });
  else if (pathname.startsWith("/offboarding/")) { crumbs.push({ label: "Offboarding", path: "/offboarding" }); crumbs.push({ label: pathname.split("/").pop() ?? "Detail" }); }
  else if (pathname === "/transfers") crumbs.push({ label: "Transfers" });
  else if (pathname.startsWith("/transfers/")) { crumbs.push({ label: "Transfers", path: "/transfers" }); crumbs.push({ label: pathname.split("/").pop() ?? "Detail" }); }
  else if (pathname === "/sites") crumbs.push({ label: "Sites" });
  else if (pathname === "/reports") crumbs.push({ label: "Reports" });
  else if (pathname === "/audit-logs") crumbs.push({ label: "Audit Logs" });
  else if (pathname === "/settings") crumbs.push({ label: "Settings" });
  return crumbs;
}

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const title = pageTitles[location.pathname] || "Magaya ELMS";
  const breadcrumb = buildBreadcrumb(location.pathname);

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={cn("flex-1 flex flex-col min-h-[100dvh] transition-all duration-300 ease-sidebar", collapsed ? "ml-sidebar-collapsed" : "ml-sidebar")}>
        <Topbar title={title} breadcrumb={breadcrumb} />
        <main className="flex-1 p-6 overflow-auto"><Outlet /></main>
        <Footer />
      </div>
    </div>
  );
}
