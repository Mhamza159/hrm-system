/**
 * @file MyTasksPage.jsx
 * @description Assigned Lifecycle Tasks Self-Service Queue.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Row 18.3)
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Check,
  Filter
} from 'lucide-react';
import { useGetMyTasksQuery, useCompleteTaskMutation } from '../onboardingApi.js';
import { toast } from 'sonner';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';

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

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'pending') return !t.completed;
    if (statusFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Lifecycle Tasks
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tasks assigned to you across onboarding new team members and exit offboardings.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              statusFilter === 'pending'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Pending ({tasks.filter((t) => !t.completed).length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              statusFilter === 'completed'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Completed ({tasks.filter((t) => t.completed).length})
          </button>
        </div>
      </div>

      {/* Task Queue */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading assigned tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            All caught up!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            You have no pending lifecycle tasks requiring your sign-off or action.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isOverdue =
              task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

            return (
              <div
                key={task._id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      task.completed
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : isOverdue
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
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
                        className={`text-sm font-bold ${
                          task.completed
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {task.category}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      )}
                      {task.employeeName && (
                        <span>Candidate: {task.employeeName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {!task.completed && (
                  <button
                    onClick={() => handleMarkComplete(task._id, task.title)}
                    disabled={isCompleting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50 shrink-0"
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

