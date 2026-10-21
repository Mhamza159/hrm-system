/**
 * @file DashboardPage.jsx
 * @description Smart Gateway Dispatcher rendering tailored role-based dashboards.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Rows 7.1, 7.2, 7.3, 7.4)
 * - Layer: Smart Page Dispatcher (React 18 / Tailwind)
 * - Security: Enforces zero-leakage by dynamically mounting the persona-scoped dashboard
 */

import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { RoleBadge } from '../../components/common/RoleBadge.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getUserDisplayName } from '../../lib/formatters.js';

import { AdminDashboard } from './components/AdminDashboard.jsx';
import { HrDashboard } from './components/HrDashboard.jsx';
import { ManagerDashboard } from './components/ManagerDashboard.jsx';
import { EmployeeDashboard } from './components/EmployeeDashboard.jsx';

export default function DashboardPage() {
  const { user, isSuperAdmin } = useAuth();
  const userName = getUserDisplayName(user);

  // Normalize user roles list
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'object' ? r.name : r))
    : ['Employee'];

  // Determine initial role view
  const determineInitialRole = () => {
    if (isSuperAdmin || userRoles.includes('Super Admin')) return 'Super Admin';
    if (userRoles.includes('HR Manager')) return 'HR Manager';
    if (userRoles.includes('Department Manager')) return 'Department Manager';
    return 'Employee';
  };

  const [activeRoleView, setActiveRoleView] = useState(determineInitialRole);

  return (
    <div className="space-y-6">
      {/* 1. Header with greeting and profile card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={`Welcome back, ${userName} 👋`}
          description="Here's your live operational overview and daily updates."
        />

        {/* Role View Switcher for multi-role users */}
        {userRoles.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
            <span className="text-[11px] font-medium text-slate-500 px-2">View As:</span>
            {userRoles.map((role) => (
              <button
                key={role}
                onClick={() => setActiveRoleView(role)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeRoleView === role
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Dynamically Render Role-Specific Dashboard Component */}
      {activeRoleView === 'Super Admin' && <AdminDashboard />}
      {activeRoleView === 'HR Manager' && <HrDashboard />}
      {activeRoleView === 'Department Manager' && <ManagerDashboard />}
      {activeRoleView === 'Employee' && <EmployeeDashboard />}
    </div>
  );
}
