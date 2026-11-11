/**
 * @file DashboardPage.jsx
 * @description Smart Gateway Dispatcher rendering tailored role-based dashboards.
 *
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Rows 7.1, 7.2, 7.3, 7.4)
 * - Layer: Smart Page Dispatcher (React 18 / Tailwind)
 * - Security: Enforces zero-leakage by dynamically mounting the persona-scoped dashboard
 */

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { CalendarDays, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../../components/common/PageHeader.jsx";
import { RoleBadge } from "../../components/common/RoleBadge.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { getUserDisplayName } from "../../lib/formatters.js";
import { dashboardApi } from "./dashboardApi.js";

import { AdminDashboard } from "./components/AdminDashboard.jsx";
import { HrDashboard } from "./components/HrDashboard.jsx";
import { ManagerDashboard } from "./components/ManagerDashboard.jsx";
import { EmployeeDashboard } from "./components/EmployeeDashboard.jsx";

const TZ = "Asia/Karachi";
const DATE_FMT = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" });
const TIME_FMT = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

/** Date + live clock capsule (UI-REFERENCE §5), ticking every second in Asia/Karachi. */
function DateClockCapsule() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const date = DATE_FMT.format(now);
  const time = TIME_FMT.format(now);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#EAECF0] bg-white px-4 py-2 shadow-sm dark:border-[#1A3125] dark:bg-[#111D17]">
      <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{date}</span>
      <span className="h-1 w-1 rounded-full bg-[#CBD5E1]" aria-hidden="true" />
      <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00C471] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00C471]" />
        </span>
        {time}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isSuperAdmin } = useAuth();
  const userName = getUserDisplayName(user);
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Normalize user roles list
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === "object" ? r.name : r))
    : ["Employee"];

  // Determine initial role view
  const determineInitialRole = () => {
    if (isSuperAdmin || userRoles.includes("Super Admin")) return "Super Admin";
    if (userRoles.includes("HR Manager")) return "HR Manager";
    if (userRoles.includes("Department Manager")) return "Department Manager";
    return "Employee";
  };

  const [activeRoleView, setActiveRoleView] = useState(determineInitialRole);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dashboard metrics refreshed");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with greeting and profile card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={`Welcome back, ${userName} 👋`}
          description="Here's your live operational overview and daily updates."
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <DateClockCapsule />
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162820] hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          }
        />

        {/* Role View Switcher for multi-role users */}
        {userRoles.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#111D17] rounded-xl border border-slate-200 dark:border-[#1A3125] self-start sm:self-auto">
            <span className="text-[11px] font-medium text-slate-500 px-2">
              View As:
            </span>
            {userRoles.map((role) => (
              <button
                key={role}
                onClick={() => setActiveRoleView(role)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeRoleView === role
                    ? "bg-white dark:bg-[#162820] text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/50 dark:border-emerald-800/40"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Dynamically Render Role-Specific Dashboard Component */}
      {activeRoleView === "Super Admin" && <AdminDashboard />}
      {activeRoleView === "HR Manager" && <HrDashboard />}
      {activeRoleView === "Department Manager" && <ManagerDashboard />}
      {activeRoleView === "Employee" && <EmployeeDashboard />}
    </div>
  );
}
