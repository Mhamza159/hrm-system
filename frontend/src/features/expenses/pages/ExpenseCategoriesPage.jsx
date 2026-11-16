/**
 * @file ExpenseCategoriesPage.jsx
 * @description Expense categories & policy limits, with an Archive bucket for deleted categories.
 *
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.1)
 * - Permission: Can I="expense.settings" a="ExpenseCategory" for every change and the Archive tab
 * - Lifecycle: Delete → Archive (disabled, hidden from claim forms) → Revert or Permanent delete
 *   (permanent delete is refused while claims reference the category)
 * - Design: DESIGN.md & docs/UI-REFERENCE.md (Forest & Emerald Craft)
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Tag,
  Plus,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  Search,
  Receipt,
  FileText,
  AlertCircle,
  Eye,
  CheckCircle2,
  Layers,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import {
  useGetExpenseCategoriesQuery,
  useDeleteExpenseCategoryMutation,
  useGetArchivedExpenseCategoriesQuery,
  useRestoreExpenseCategoryMutation,
  usePermanentDeleteExpenseCategoryMutation
} from '../expensesApi.js';
import ExpenseCategoryModal from '../components/ExpenseCategoryModal.jsx';
import ExpenseCategoryDetailModal from '../components/ExpenseCategoryDetailModal.jsx';
import { pkr, formatDay, CategoryPill } from '../components/expenseUi.jsx';

const limitLabel = (paisa) => (paisa > 0 ? pkr(paisa) : 'No limit');

/** Record summary shown inside the confirmation dialogs. */
function CategorySummary({ category }) {
  if (!category) return null;
  return (
    <dl className="grid grid-cols-3 gap-3 text-xs">
      <div className="col-span-3 min-w-0">
        <dt className="text-[11px] text-slate-500 dark:text-slate-400">Category</dt>
        <dd className="mt-0.5 truncate font-semibold text-slate-900 dark:text-white">{category.name}</dd>
      </div>
      <div>
        <dt className="text-[11px] text-slate-500 dark:text-slate-400">Code</dt>
        <dd className="mt-0.5 font-mono font-semibold text-slate-800 dark:text-slate-200">{category.code}</dd>
      </div>
      <div>
        <dt className="text-[11px] text-slate-500 dark:text-slate-400">Limit</dt>
        <dd className="mt-0.5 font-mono tabular-nums text-slate-800 dark:text-slate-200">{limitLabel(category.maxLimitPaisa)}</dd>
      </div>
      {category.claimCount !== undefined && (
        <div>
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">Linked claims</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-slate-800 dark:text-slate-200">{category.claimCount}</dd>
        </div>
      )}
    </dl>
  );
}

export default function ExpenseCategoriesPage() {
  const { can } = usePermission();
  const canManage = can('expense.settings', 'ExpenseCategory');

  const [tab, setTab] = useState('active'); // 'active' | 'archive'
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Row-click detail modal state
  const [detailCategory, setDetailCategory] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Confirmation dialog targets
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [purgeTarget, setPurgeTarget] = useState(null);

  const { data, isLoading, isFetching, error, refetch } = useGetExpenseCategoriesQuery();
  const archivedQuery = useGetArchivedExpenseCategoriesQuery(undefined, { skip: !canManage });
  const [archiveCategory, { isLoading: isArchiving }] = useDeleteExpenseCategoryMutation();
  const [restoreCategory, { isLoading: isRestoring }] = useRestoreExpenseCategoryMutation();
  const [purgeCategory, { isLoading: isPurging }] = usePermanentDeleteExpenseCategoryMutation();

  const categories = data?.data || [];
  const archived = archivedQuery.data?.data || [];

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const run = async (mutation, target, success, close) => {
    try {
      await mutation(target._id).unwrap();
      toast.success(success);
      close(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  const term = search.trim().toLowerCase();
  const matches = (c) => !term || [c.name, c.code, c.description].filter(Boolean).some((v) => v.toLowerCase().includes(term));
  const activeRows = categories.filter(matches);
  const archiveRows = archived.filter(matches);
  const onArchiveTab = tab === 'archive' && canManage;

  const handleRowClick = (cat) => {
    setDetailCategory(cat);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Categories & Limits"
        description="Set per-claim spending limits, receipt verification mandates, and policy governance."
        actions={
          <div className="flex items-center gap-2.5">
            <RefreshButton
              onRefresh={() => {
                refetch();
                if (canManage) archivedQuery.refetch();
              }}
              isFetching={isFetching || archivedQuery.isFetching}
            />
            <Can I="expense.settings" a="ExpenseCategory">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setIsModalOpen(true);
                }}
                className="h-9 px-4 inline-flex items-center gap-2 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold shadow-xs shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add Category</span>
              </button>
            </Can>
          </div>
        }
      />

      {/* Totals Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-[#1A3125] overflow-hidden rounded-2xl border border-slate-200/80 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
        {[
          { label: 'Active Categories', value: categories.filter((c) => c.isActive).length, note: 'Available in claim forms' },
          { label: 'Receipt Required', value: categories.filter((c) => c.requiresReceipt).length, note: 'Mandatory proof attachment' },
          { label: 'Archived Policies', value: canManage ? archived.length : '—', note: 'Disabled & safe in audit bucket' },
        ].map((s) => (
          <div key={s.label} className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
        {/* Navigation Tabs + Search Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200/80 dark:border-[#1A3125] px-5 pt-3.5 pb-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-[#0E1A14]/50">
          <div role="tablist" aria-label="Category lists" className="flex items-center gap-2">
            {[
              { key: 'active', label: 'Categories', count: categories.length, show: true },
              { key: 'archive', label: 'Archive', count: archived.length, show: canManage },
            ]
              .filter((t) => t.show)
              .map((t) => {
                const selected = (t.key === 'archive') === onArchiveTab;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setTab(t.key)}
                    className={`h-9 px-3.5 rounded-xl inline-flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#00C471] text-white shadow-xs shadow-emerald-600/20'
                        : 'bg-white dark:bg-[#15231C] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-[#1A3125]'
                    }`}
                  >
                    {t.key === 'archive' && <Archive className="h-3.5 w-3.5" aria-hidden="true" />}
                    <span>{t.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold tabular-nums ${
                        selected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-[#1E3328] text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name or code..."
              aria-label="Search categories"
              className="w-full h-9 pl-9 pr-4 text-xs font-medium rounded-xl border border-slate-200/80 dark:border-[#1A3125] bg-white dark:bg-[#15231C] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Content Views */}
        {onArchiveTab ? (
          archivedQuery.isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <ScreenSkeleton variant="table" />
            </div>
          ) : archiveRows.length === 0 ? (
            <div className="space-y-2 px-6 py-16 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#15231C] text-slate-400">
                <Archive className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                {term ? 'No matching archived categories' : 'The archive is empty'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Deleted categories land here, disabled and safe from new claims, until you revert or permanently delete them.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/75 dark:bg-[#0E1A14] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-[#1A3125] font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Archived Category</th>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5 text-right">Limit Per Claim</th>
                    <th className="px-5 py-3.5">Archived Date & Actor</th>
                    <th className="px-5 py-3.5 text-center">Linked Claims</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-[#1A3125]">
                  {archiveRows.map((cat) => (
                    <tr
                      key={cat._id}
                      onClick={() => handleRowClick(cat)}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#15231C]/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600">
                            {cat.name}
                          </span>
                          <CategoryPill tone="rose">Disabled</CategoryPill>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#15231C] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#1A3125]">
                          {cat.code}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right font-mono text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
                        {limitLabel(cat.maxLimitPaisa)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-mono text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {formatDay(cat.archivedAt || cat.updatedAt)}
                        </div>
                        {cat.archivedByName && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            by {cat.archivedByName}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="font-mono text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#15231C] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#1A3125]">
                          {cat.claimCount || 0}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setRestoreTarget(cat)}
                            className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs transition-colors cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Revert</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPurgeTarget(cat)}
                            disabled={cat.claimCount > 0}
                            title={cat.claimCount > 0 ? `${cat.claimCount} claim(s) use this category, so it stays safely archived` : undefined}
                            className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : error ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Categories could not be loaded</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : activeRows.length === 0 ? (
          <div className="space-y-2 px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#15231C] text-slate-400">
              <Tag className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">
              {term ? 'No matching categories' : 'No categories configured yet'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Add an expense policy category to set per-claim spending limits and receipt proof rules.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/75 dark:bg-[#0E1A14] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-[#1A3125] font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Category Name</th>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5 text-right">Limit Per Claim</th>
                  <th className="px-5 py-3.5 text-center">Receipt Mandate</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-[#1A3125]">
                {activeRows.map((cat) => (
                  <tr
                    key={cat._id}
                    onClick={() => handleRowClick(cat)}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#15231C]/60 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-[#00C471] transition-colors">
                        {cat.name}
                      </div>
                      {cat.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5" title={cat.description}>
                          {cat.description}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#15231C] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#1A3125]">
                        {cat.code}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                      {limitLabel(cat.maxLimitPaisa)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {cat.requiresReceipt ? (
                        <CategoryPill tone="emerald">Required</CategoryPill>
                      ) : (
                        <CategoryPill tone="slate">Optional</CategoryPill>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {cat.isActive ? (
                        <CategoryPill tone="emerald">Active</CategoryPill>
                      ) : (
                        <CategoryPill tone="slate">Inactive</CategoryPill>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Can I="expense.settings" a="ExpenseCategory">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsModalOpen(true);
                            }}
                            title={`Edit ${cat.name}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15231C] transition-colors cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchiveTarget(cat)}
                            title={`Archive ${cat.name}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </Can>
                        <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row-Click Inspection Modal */}
      <ExpenseCategoryDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailCategory(null);
        }}
        category={detailCategory}
        isArchived={onArchiveTab}
        onEdit={(cat) => {
          setSelectedCategory(cat);
          setIsModalOpen(true);
        }}
        onArchive={(cat) => setArchiveTarget(cat)}
        onRestore={(cat) => setRestoreTarget(cat)}
        onPurge={(cat) => setPurgeTarget(cat)}
      />

      {/* Create / Edit Form Modal */}
      <ExpenseCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={selectedCategory}
      />

      {/* Archive confirmation */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() =>
          run(archiveCategory, archiveTarget, `Category '${archiveTarget?.name}' moved to archive.`, setArchiveTarget)
        }
        title="Archive Expense Category?"
        description="This category will be disabled and hidden from employee claim forms. Existing claims are preserved."
        confirmText="Archive category"
        isLoading={isArchiving}
      >
        <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-[#1A3125] dark:bg-[#0E1A14]">
          <CategorySummary category={archiveTarget} />
        </div>
      </ConfirmDialog>

      {/* Revert confirmation */}
      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() =>
          run(restoreCategory, restoreTarget, `Category '${restoreTarget?.name}' restored to active.`, setRestoreTarget)
        }
        title="Restore Expense Category?"
        description="This category will be re-enabled and made available on claim submission forms."
        confirmText="Restore category"
        variant="emerald"
        isLoading={isRestoring}
      >
        <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-[#1A3125] dark:bg-[#0E1A14]">
          <CategorySummary category={restoreTarget} />
        </div>
      </ConfirmDialog>

      {/* Permanent delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(purgeTarget)}
        onClose={() => setPurgeTarget(null)}
        onConfirm={() =>
          run(
            purgeCategory,
            purgeTarget,
            `Category '${purgeTarget?.name}' permanently deleted.`,
            setPurgeTarget
          )
        }
        title="Delete Expense Category Forever?"
        description="This cannot be undone. Only categories with 0 linked claims can be deleted permanently."
        confirmText="Delete forever"
        variant="danger"
        isLoading={isPurging}
      >
        <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-[#1A3125] dark:bg-[#0E1A14]">
          <CategorySummary category={purgeTarget} />
        </div>
      </ConfirmDialog>
    </div>
  );
}
