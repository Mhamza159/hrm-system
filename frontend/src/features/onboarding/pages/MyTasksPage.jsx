/**
 * @file MyTasksPage.jsx
 * @description Assigned Lifecycle Tasks Self-Service Queue.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Row 18.3)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Check,
  User
} from 'lucide-react';
import { useGetMyTasksQuery, useCompleteTaskMutation } from '../onboardingApi.js';
import { toast } from 'sonner';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';

const categoryColors = {
  hr: 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60',
  it: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/40',
  department: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/40',
  finance: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
};

export const MyTasksPage = () => {
  const [statusFilter, setStatusFilter] = useState('pending');
  const { data: tasksRes, isLoading, isFetching, refetch } = useGetMyTasksQuery();
  const tasks = tasksRes?.data || [];

  const [completeTask, { isLoading: isCompleting }] = useCompleteTaskMutation();

  if (isLoading && !tasksRes) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const handleMarkComplete = async (taskId, title) => {
    try {
      await completeTask({ taskId }).unwrap();
      toast.success(`Completed: "${title}"`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to complete task');
    }
  };

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'pending') return !t.completed;
    if (statusFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] flex items-center justify-center border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              My Lifecycle Tasks
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Tasks assigned to you across new-hire onboarding checklists and departure offboardings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#162820]/60 border border-slate-200 dark:border-[#1A3125]">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-[#111D17] text-emerald-700 dark:text-[#00C471] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-[#111D17] text-emerald-700 dark:text-[#00C471] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Task Queue */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading assigned tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] bg-white/50 dark:bg-[#111D17]/50">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 dark:text-[#00C471] mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            All caught up!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            You have no pending lifecycle tasks requiring your sign-off or action.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isOverdue =
              task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
            const catBadge = categoryColors[task.category] || categoryColors.hr;

            return (
              <div
                key={task._id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800/80 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`p-2 rounded-xl mt-0.5 border ${
                      task.completed
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-[#162820] dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                        : isOverdue
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-[#162820] dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isOverdue ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-xs sm:text-sm font-bold ${
                          task.completed
                            ? 'text-slate-400 line-through'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${catBadge}`}>
                        {task.category}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 font-mono ${
                            isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      )}
                      {task.employeeName && (
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {task.employeeName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!task.completed && (
                  <button
                    onClick={() => handleMarkComplete(task._id, task.title)}
                    disabled={isCompleting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark Completed
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
