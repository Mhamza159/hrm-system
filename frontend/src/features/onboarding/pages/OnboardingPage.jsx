/**
 * @file OnboardingPage.jsx
 * @description Active Employee Onboarding Workflows & Progress Tracker.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.2, 18.4)
 */

import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Mail,
  ChevronRight,
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';
import { useGetOnboardingsQuery, useResendWelcomeEmailMutation } from '../onboardingApi.js';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';

export const OnboardingPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  const { data: checklistsRes, isLoading } = useGetOnboardingsQuery({
    type: 'onboarding',
    status: statusFilter || undefined
  });
  const checklists = checklistsRes?.data || [];

  const [resendWelcomeEmail, { isLoading: isResending }] = useResendWelcomeEmailMutation();

  const handleResendWelcome = async (id, name) => {
    try {
      await resendWelcomeEmail(id).unwrap();
      toast.success(`Welcome email re-dispatched to ${name}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send welcome email');
    }
  };

  const filteredChecklists = checklists.filter((item) => {
    if (!search.trim()) return true;
    const name = item.employeeId?.name || '';
    const email = item.employeeId?.email || '';
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Employee Onboarding
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track active new-hire onboarding checklists, document collection, and provisioning.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="relative flex-1 sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search new hires..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Onboarding List */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading onboardings...</div>
      ) : filteredChecklists.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <UserCheck className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            No active onboardings found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            When new employees are hired, automated onboarding checklists will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChecklists.map((chk) => {
            const completedCount = chk.tasks?.filter((t) => t.completed).length || 0;
            const totalTasks = chk.tasks?.length || 0;
            const pct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

            return (
              <div
                key={chk._id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        chk.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : chk.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {chk.status?.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {completedCount} / {totalTasks} Done
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {chk.employeeId?.name || 'New Employee'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {chk.employeeId?.designation?.title || 'Team Member'} • {chk.employeeId?.department?.name || 'General'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                      <span>Overall Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Detail tasks preview */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                    {chk.tasks?.slice(0, 3).map((task, idx) => (
                      <div
                        key={idx}
                        className={`text-xs flex items-center justify-between gap-1.5 ${
                          task.completed
                            ? 'text-gray-400 line-through'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              task.completed ? 'text-emerald-500' : 'text-gray-300'
                            }`}
                          />
                          <span className="truncate">{task.title}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold shrink-0">
                          {task.roleAssignee}
                        </span>
                      </div>
                    ))}
                    {chk.tasks?.length > 3 && (
                      <p className="text-[11px] text-gray-400 italic">
                        +{chk.tasks.length - 3} more items...
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {chk.startDate ? new Date(chk.startDate).toLocaleDateString() : 'Active'}
                  </span>

                  <Can perform="onboard.manage">
                    <button
                      onClick={() => handleResendWelcome(chk._id, chk.employeeId?.name)}
                      disabled={isResending}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-md transition"
                      title="Resend Welcome Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Welcome Email
                    </button>
                  </Can>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
