/**
 * @file KpiTemplateDetailModal.jsx
 * @description High-craft read-only inspection modal for KPI Master Templates.
 * Adheres strictly to Forest & Emerald design system (DESIGN.md).
 */

import React from 'react';
import { Target, X, Layers, Edit, Calendar, User, Percent } from 'lucide-react';
import { Can } from '../../../components/common/Can.jsx';

export const KpiTemplateDetailModal = ({ isOpen, onClose, template, onEdit }) => {
  if (!isOpen || !template) return null;

  const totalWeight = (template.kpis || []).reduce((acc, k) => acc + (k.weightage || 0), 0);
  const isValid100 = totalWeight === 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {template.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    template.isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${template.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {template.isActive ? 'Active Template' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Layers className="h-3.5 w-3.5" />
                  {template.designationId?.title || 'All Designations'}
                </span>
                {template.createdAt && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          {/* Description */}
          {template.description ? (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                Template Objective & Scope
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {template.description}
              </p>
            </div>
          ) : null}

          {/* Weightage Summary Bar */}
          <div className="bg-white dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-emerald-600" />
                Total Metrics Weight Distribution
              </span>
              <span
                className={`font-mono px-2 py-0.5 rounded text-xs ${
                  isValid100
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40'
                }`}
              >
                {totalWeight}% / 100% {isValid100 ? '✓' : '⚠️'}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
              {(template.kpis || []).map((kpi, idx) => {
                const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-emerald-600', 'bg-cyan-600', 'bg-emerald-700'];
                return (
                  <div
                    key={idx}
                    title={`${kpi.title}: ${kpi.weightage}%`}
                    className={`h-full ${colors[idx % colors.length]} transition-all`}
                    style={{ width: `${kpi.weightage}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Performance Metrics List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Evaluation Metrics ({template.kpis?.length || 0})
              </h3>
              <span className="text-xs text-slate-400">Target Scale: 1 to 5 Stars</span>
            </div>

            <div className="space-y-3">
              {(template.kpis || []).map((kpi, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900/60 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-mono font-bold">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {kpi.title}
                      </h4>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      {kpi.weightage}% Weight
                    </span>
                  </div>

                  {kpi.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                      {kpi.description}
                    </p>
                  )}

                  <div className="ml-7 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-2.5 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Target Success Criteria:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {kpi.targetCriteria}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {template.createdBy && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Created by {template.createdBy.firstName} {template.createdBy.lastName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <Can perform="performance.template.manage">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit?.(template);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit Template
              </button>
            </Can>
          </div>
        </div>
      </div>
    </div>
  );
};
