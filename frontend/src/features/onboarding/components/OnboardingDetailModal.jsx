/**
 * @file OnboardingDetailModal.jsx
 * @description Comprehensive Employee Onboarding Detail Modal & Interactive Task Checklist.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding Lifecycle (BUILD-GUIDE Section 21 · Rows 18.2, 18.3, 18.4)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Check,
  Mail
} from 'lucide-react';
import {
  useGetOnboardingByIdQuery,
  useCompleteTaskMutation,
  useResendWelcomeEmailMutation
} from '../onboardingApi.js';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';

const categoryColors = {
  hr: {
    label: 'HR',
    badge: 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
  },
  it: {
    label: 'IT & Hardware',
    badge: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/40'
  },
  department: {
    label: 'Department',
    badge: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/40'
  },
  finance: {
    label: 'Finance',
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
  }
};

export const OnboardingDetailModal = ({ isOpen, onClose, checklistId, initialChecklist }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: detailRes } = useGetOnboardingByIdQuery(checklistId, {
    skip: !isOpen || !checklistId
  });

  const checklist = detailRes?.data || initialChecklist;

  const [completeTask, { isLoading: isCompleting }] = useCompleteTaskMutation();
  const [resendWelcome, { isLoading: isResending }] = useResendWelcomeEmailMutation();

  if (!isOpen || !checklist) return null;

  const employee = checklist.employeeId || {};
  const tasks = checklist.tasks || [];
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleTaskToggle = async (taskId, currentStatus, taskTitle) => {
    if (currentStatus) return; // Already completed
    try {
      await completeTask({ taskId }).unwrap();
      toast.success(`Task completed: "${taskTitle}"`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to complete task');
    }
  };

  const handleResendWelcomeEmail = async () => {
    try {
      await resendWelcome(checklist._id).unwrap();
      toast.success(`Welcome email dispatched to ${employee.name || 'employee'}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send welcome email');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeCategory === 'all') return true;
    return t.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] flex items-center justify-center font-bold text-base border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
              {employee.name?.[0] || 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {employee.name || 'New Employee'}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    checklist.status === 'completed'
                      ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                      : checklist.status === 'in_progress'
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/40'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                  }`}
                >
                  {checklist.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="text-slate-700 dark:text-slate-200 font-semibold">
                  {employee.designation?.title || 'Designation Pending'}
                </span>{' '}
                • {employee.department?.name || 'Department Pending'}{' '}
                {employee.employeeCode && (
                  <span className="font-mono text-slate-400">({employee.employeeCode})</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#162820]/40">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                Progress
              </span>
              <p className="font-bold text-emerald-700 dark:text-[#00C471] text-base mt-0.5 font-mono">
                {progressPercent}%
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                Tasks Completed
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 font-mono">
                {completedTasks} / {totalTasks}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                Joining Date
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 font-mono">
                {checklist.startDate ? new Date(checklist.startDate).toLocaleDateString() : 'Active'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                Email Status
              </span>
              <p className="font-semibold text-emerald-600 dark:text-[#00C471] text-xs mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dispatched
              </p>
            </div>
          </div>

          {/* Overall Progress Gauge */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Onboarding Milestone Completion</span>
              <span className="font-mono text-emerald-600 dark:text-[#00C471]">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-[#162820] rounded-full overflow-hidden border border-slate-200/60 dark:border-[#1A3125]">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#162820]/60 border border-slate-200 dark:border-[#1A3125] overflow-x-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-white dark:bg-[#111D17] text-emerald-700 dark:text-[#00C471] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Tasks ({totalTasks})
            </button>
            {['hr', 'it', 'department', 'finance'].map((cat) => {
              const count = tasks.filter((t) => t.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-white dark:bg-[#111D17] text-emerald-700 dark:text-[#00C471] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {categoryColors[cat]?.label || cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Task Items List */}
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#1A3125] text-slate-400">
                No tasks found in this category.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const catMeta = categoryColors[task.category] || categoryColors.hr;
                return (
                  <div
                    key={task._id}
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      task.completed
                        ? 'border-slate-200 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#111D17]/50'
                        : 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:border-emerald-300 dark:hover:border-emerald-800/80'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        type="button"
                        disabled={task.completed || isCompleting}
                        onClick={() => handleTaskToggle(task._id, task.completed, task.title)}
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 cursor-pointer ${
                          task.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-[#1A3125] hover:border-emerald-500 bg-white dark:bg-[#162820]'
                        }`}
                        title={task.completed ? 'Task completed' : 'Mark task complete'}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-bold text-xs ${
                              task.completed
                                ? 'text-slate-400 dark:text-slate-500 line-through'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {task.title}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${catMeta.badge}`}
                          >
                            {catMeta.label}
                          </span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125] uppercase font-mono">
                            {task.roleAssignee}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {task.description}
                          </p>
                        )}

                        {task.completed && task.completedAt && (
                          <p className="text-[10px] text-emerald-600 dark:text-[#00C471] font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed on {new Date(task.completedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 sm:border-l sm:border-slate-100 dark:sm:border-[#1A3125] sm:pl-3">
                      <span className="text-[9px] text-slate-400 uppercase block font-sans">
                        Deadline
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Immediate'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#162820]/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Lifecycle Module M18 • Row 18.2
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
            >
              Close
            </button>
            <Can perform="onboard.manage">
              <button
                type="button"
                disabled={isResending}
                onClick={handleResendWelcomeEmail}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                {isResending ? 'Sending...' : 'Resend Welcome Email'}
              </button>
            </Can>
          </div>
        </div>
      </div>
    </div>
  );
};
