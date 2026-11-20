/**
 * @file ChecklistTemplateDetailModal.jsx
 * @description Read-Only Inspection Modal for Lifecycle Checklist Templates & Task Rubrics.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding Lifecycle (BUILD-GUIDE Section 21 · Row 18.1)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React from 'react';
import {
  X,
  ListChecks,
  Edit2,
  Layers
} from 'lucide-react';
import { Can } from '../../../components/common/Can.jsx';

const categoryMeta = {
  hr: {
    label: 'Human Resources',
    color: 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
  },
  it: {
    label: 'IT & Provisioning',
    color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/40'
  },
  department: {
    label: 'Departmental',
    color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/40'
  },
  finance: {
    label: 'Finance & Payroll',
    color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
  }
};

const roleMeta = {
  employee: 'Employee',
  manager: 'Reporting Manager',
  it_admin: 'IT Administrator',
  hr: 'HR Specialist'
};

export const ChecklistTemplateDetailModal = ({ isOpen, onClose, template, onEdit }) => {
  if (!isOpen || !template) return null;

  const tasks = template.tasks || [];
  const mandatoryCount = tasks.filter((t) => t.isMandatory).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] flex items-center justify-center border border-emerald-200 dark:border-emerald-900/60">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {template.name}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    template.isActive
                      ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1A3125]'
                  }`}
                >
                  {template.isActive ? 'Active' : 'Archived'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Lifecycle Stage:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  {template.type}
                </span>{' '}
                • Department:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {template.departmentId?.name || 'Company-Wide'}
                </span>
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
          {/* Top Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#162820]/40">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                Total Tasks
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 font-mono">
                {tasks.length}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                Mandatory
              </span>
              <p className="font-bold text-emerald-700 dark:text-[#00C471] text-sm mt-0.5 font-mono">
                {mandatoryCount}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                Optional
              </span>
              <p className="font-bold text-slate-600 dark:text-slate-300 text-sm mt-0.5 font-mono">
                {tasks.length - mandatoryCount}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                Created
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 font-mono">
                {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Initial'}
              </p>
            </div>
          </div>

          {/* Tasks Rubric List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00C471]" />
                Configured Checklist Tasks ({tasks.length})
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Cloned on instantiation
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#1A3125] text-slate-400">
                No tasks configured in this template.
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task, idx) => {
                  const cat = categoryMeta[task.category] || categoryMeta.hr;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:border-emerald-300 dark:hover:border-emerald-800/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {idx + 1}. {task.title}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${cat.color}`}
                          >
                            {cat.label}
                          </span>
                          {task.isMandatory ? (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-[#162820] dark:text-slate-400 border border-slate-200 dark:border-[#1A3125]">
                              Optional
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-slate-500 dark:text-slate-400 sm:border-l sm:border-slate-100 dark:sm:border-[#1A3125] sm:pl-3">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 uppercase block font-sans">
                            Role Assignee
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {roleMeta[task.roleAssignee] || task.roleAssignee}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 uppercase block font-sans">
                            Due Offset
                          </span>
                          <span className="font-semibold text-emerald-700 dark:text-[#00C471]">
                            +{task.dueDaysOffset || 0}d
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#162820]/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Lifecycle Module M18 • Row 18.1
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
                onClick={() => {
                  onClose();
                  if (onEdit) onEdit(template);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Template
              </button>
            </Can>
          </div>
        </div>
      </div>
    </div>
  );
};
