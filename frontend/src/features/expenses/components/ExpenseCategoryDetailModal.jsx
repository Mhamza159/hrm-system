/**
 * @file ExpenseCategoryDetailModal.jsx
 * @description Comprehensive detail inspection modal for Expense Categories (both Active and Archived).
 * Opened whenever a user clicks on any row in the Categories & Limits data table.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.1)
 * - Design: Forest & Emerald Craft (DESIGN.md & docs/UI-REFERENCE.md)
 */

import React from 'react';
import {
  X,
  Tag,
  DollarSign,
  FileText,
  Receipt,
  RotateCcw,
  Trash2,
  Pencil,
  Clock,
  User,
  ShieldAlert,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { pkr, formatDateTime, CategoryPill } from './expenseUi.jsx';
import { Can } from '../../../components/common/Can.jsx';

export default function ExpenseCategoryDetailModal({
  isOpen,
  onClose,
  category,
  isArchived = false,
  onEdit,
  onArchive,
  onRestore,
  onPurge
}) {
  if (!isOpen || !category) return null;

  const hasLimit = category.maxLimitPaisa && category.maxLimitPaisa > 0;
  const claimCount = category.claimCount || 0;
  const cannotPurge = isArchived && claimCount > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/15 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] shadow-2xl overflow-hidden z-10 transition-all">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-[#1A3125] flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-[#0E1A14]/50">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] dark:text-[#05D87D] border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs mt-0.5">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {category.name}
                </h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#15231C] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#1A3125]">
                  {category.code}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {isArchived ? (
                  <CategoryPill tone="rose">Archived / Disabled</CategoryPill>
                ) : category.isActive ? (
                  <CategoryPill tone="emerald">Active Policy</CategoryPill>
                ) : (
                  <CategoryPill tone="slate">Inactive</CategoryPill>
                )}
                {category.requiresReceipt ? (
                  <CategoryPill tone="emerald">Receipt Required</CategoryPill>
                ) : (
                  <CategoryPill tone="slate">Receipt Optional</CategoryPill>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15231C] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Top 2 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#15231C]/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Max Limit Per Claim
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {hasLimit ? pkr(category.maxLimitPaisa) : 'No Limit'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {hasLimit
                  ? 'Expenses exceeding this cap require manager escalation'
                  : 'Uncapped out-of-pocket business expenditure'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#15231C]/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Linked Claims
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {claimCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">total claim(s)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {claimCount > 0
                  ? 'Historical or active vouchers linked to this category'
                  : 'No employee claims filed under this category yet'}
              </p>
            </div>
          </div>

          {/* Description / Purpose Guidelines */}
          <div className="rounded-xl border border-slate-200/80 dark:border-[#1A3125] p-4 bg-white dark:bg-[#111D17]">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Policy Description & Scope
              </h4>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {category.description ? (
                category.description
              ) : (
                <span className="italic text-slate-400 dark:text-slate-500">
                  No detailed description or employee guidance provided for this policy category.
                </span>
              )}
            </p>
          </div>

          {/* Archive Notice if Archived with linked claims */}
          {cannotPurge && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <span className="font-semibold">Audit Protected:</span> This category is referenced by{' '}
                <span className="font-mono font-bold">{claimCount}</span> employee expense claim(s). It cannot be permanently purged from the database, but remains safely archived.
              </div>
            </div>
          )}

          {/* Audit & Timestamps */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 dark:border-[#1A3125] text-xs">
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Created On</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 block">
                {formatDateTime(category.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                {isArchived ? 'Archived On' : 'Last Modified'}
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 block">
                {formatDateTime(isArchived ? category.archivedAt || category.updatedAt : category.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-50/75 dark:bg-[#0E1A14] border-t border-slate-200/80 dark:border-[#1A3125] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200/80 dark:border-[#1A3125] bg-white dark:bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15231C] transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {isArchived ? (
              <Can I="expense.settings" a="ExpenseCategory">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRestore?.(category);
                  }}
                  className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revert to Active</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPurge?.(category);
                  }}
                  disabled={cannotPurge}
                  title={cannotPurge ? 'Cannot permanently delete category with linked claims' : undefined}
                  className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Forever</span>
                </button>
              </Can>
            ) : (
              <Can I="expense.settings" a="ExpenseCategory">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onArchive?.(category);
                  }}
                  className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit?.(category);
                  }}
                  className="h-9 px-4 inline-flex items-center gap-1.5 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold shadow-xs shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Policy</span>
                </button>
              </Can>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
