/**
 * @file OnboardingPage.jsx
 * @description Active Employee Onboarding Workflows & Lifecycle Progress Tracker.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.2, 18.4)
 * - Permissions: Guarded by 'onboard.view' (hrOnly in routing) and 'onboard.manage'
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  CheckCircle2,
  Clock,
  Mail,
  Layers,
  Eye,
  Laptop
} from 'lucide-react';
import { useGetOnboardingsQuery, useResendWelcomeEmailMutation } from '../onboardingApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { OnboardingDetailModal } from '../components/OnboardingDetailModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const OnboardingPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [search, setSearch] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: checklistsRes, isLoading, isFetching, refetch } = useGetOnboardingsQuery({
    type: 'onboarding',
    status: statusFilter || undefined
  });
  const checklists = checklistsRes?.data || [];

  const { data: deptData } = useGetDepartmentsQuery();
  const departments = deptData?.data || [];

  const [resendWelcomeEmail, { isLoading: isResending }] = useResendWelcomeEmailMutation();

  if (isLoading && !checklistsRes) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const handleResendWelcome = async (id, name) => {
    try {
      await resendWelcomeEmail(id).unwrap();
      toast.success(`Welcome email re-dispatched to ${name}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send welcome email');
    }
  };

  const handleOpenDetail = (chk) => {
    setSelectedChecklist(chk);
    setIsDetailOpen(true);
  };

  const filteredChecklists = checklists.filter((item) => {
    if (selectedDept && item.employeeId?.department?._id !== selectedDept && item.employeeId?.department !== selectedDept) {
      return false;
    }
    if (!search.trim()) return true;
    const name = item.employeeId?.name || '';
    const email = item.employeeId?.email || '';
    const code = item.employeeId?.employeeCode || '';
    const q = search.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q)
    );
  });

  const totalActive = checklists.length;
  const inProgressCount = checklists.filter((c) => c.status === 'in_progress').length;
  const completedCount = checklists.filter((c) => c.status === 'completed').length;
  const pendingProvisioning = checklists.filter((c) =>
    c.tasks?.some((t) => t.category === 'it' && !t.completed)
  ).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] flex items-center justify-center border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Employee Onboarding
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Track new-hire onboarding checklists, department handoffs, and IT provisioning.
            </p>
          </div>
        </div>
        <RefreshButton onRefresh={refetch} isFetching={isFetching} />
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total In View
            </span>
            <Layers className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
            {totalActive}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              In Progress
            </span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
            {inProgressCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              IT Provisioning
            </span>
            <Laptop className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
            {pendingProvisioning}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fully Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1A3125] pb-4">
        <div className="relative flex-1 sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Onboarding List Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading onboardings...</div>
      ) : filteredChecklists.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] bg-white/50 dark:bg-[#111D17]/50">
          <UserCheck className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No active onboardings found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            When new candidates are converted to employees, automated onboarding checklists will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChecklists.map((chk) => {
            const completedTaskCount = chk.tasks?.filter((t) => t.completed).length || 0;
            const totalTaskCount = chk.tasks?.length || 0;
            const pct = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;
            const employee = chk.employeeId || {};

            return (
              <div
                key={chk._id}
                className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-5 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800/80 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        chk.status === 'completed'
                          ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                          : chk.status === 'in_progress'
                          ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/40'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                      }`}
                    >
                      {chk.status?.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                      {completedTaskCount} / {totalTaskCount} Tasks
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#00C471] transition">
                    {employee.name || 'New Employee'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {employee.designation?.title || 'Team Member'} • {employee.department?.name || 'General'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <span>Overall Progress</span>
                      <span className="font-mono text-emerald-600 dark:text-[#00C471]">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-[#162820] rounded-full overflow-hidden border border-slate-200/60 dark:border-[#1A3125]">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1A3125] space-y-1.5">
                    {chk.tasks?.slice(0, 3).map((task, idx) => (
                      <div
                        key={idx}
                        className={`text-xs flex items-center justify-between gap-1.5 ${
                          task.completed
                            ? 'text-slate-400 line-through'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              task.completed ? 'text-emerald-600 dark:text-[#00C471]' : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                          <span className="truncate">{task.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono shrink-0">
                          {task.roleAssignee}
                        </span>
                      </div>
                    ))}
                    {chk.tasks?.length > 3 && (
                      <p className="text-[10px] text-slate-400 italic">
                        +{chk.tasks.length - 3} more items...
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(chk)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-600 dark:text-[#00C471] transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Details
                  </button>

                  <Can perform="onboard.manage">
                    <button
                      onClick={() => handleResendWelcome(chk._id, employee.name)}
                      disabled={isResending}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#162820] hover:bg-slate-200 dark:hover:bg-[#1A3125] rounded-lg border border-slate-200 dark:border-[#1A3125] transition cursor-pointer"
                      title="Resend Welcome Email"
                    >
                      <Mail className="w-3 h-3 text-emerald-600 dark:text-[#00C471]" />
                      Welcome Email
                    </button>
                  </Can>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboarding Detail Modal */}
      {isDetailOpen && selectedChecklist && (
        <OnboardingDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedChecklist(null);
          }}
          checklistId={selectedChecklist._id}
          initialChecklist={selectedChecklist}
        />
      )}
    </div>
  );
};
