/**
 * @file ExpenseCategoriesPage.jsx
 * @description Expense categories & policy limits, with an Archive for deleted categories.
 *
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.1)
 * - Permission: Can I="expense.settings" a="ExpenseCategory" for every change and the Archive tab
 * - Lifecycle: Delete → Archive (disabled, hidden from claim forms) → Revert or Permanent delete
 *   (permanent delete is refused while claims reference the category)
 * - Design: DESIGN.md & docs/UI-REFERENCE.md
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Tag, Plus, Pencil, Archive, RotateCcw, Trash2, Search } from 'lucide-react';
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
import { pkr, formatDay } from '../components/expenseUi.jsx';

const ACTIVE_COLS = 'md:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_6rem]';
const ARCHIVE_COLS = 'md:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_13rem]';

const limitLabel = (paisa) => (paisa > 0 ? pkr(paisa) : 'No limit');

function Pill({ tone = 'slate', children }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    slate: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#13221B] dark:text-slate-400 dark:border-[#1A3125]',
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

function CellLabel({ children }) {
  return <span className="mb-0.5 block text-[11px] text-slate-500 md:hidden dark:text-slate-400">{children}</span>;
}

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

const iconButton =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

export default function ExpenseCategoriesPage() {
  const { can } = usePermission();
  const canManage = can('expense.settings', 'ExpenseCategory');

  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Categories & Limits"
        description="Set per-claim spending limits and receipt rules for each expense category."
        actions={
          <div className="flex items-center gap-2">
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00C471] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#049856]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add category
              </button>
            </Can>
          </div>
        }
      />

      {/* Totals */}
      <div className="grid grid-cols-3 divide-x divide-[#EAECF0] overflow-hidden rounded-2xl border border-[#EAECF0] bg-white rtl:divide-x-reverse dark:divide-[#1A3125] dark:border-[#1A3125] dark:bg-[#111D17]">
        {[
          { label: 'Active categories', value: categories.filter((c) => c.isActive).length },
          { label: 'Receipt required', value: categories.filter((c) => c.requiresReceipt).length },
          { label: 'Archived', value: canManage ? archived.length : '—' },
        ].map((s) => (
          <div key={s.label} className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="mt-1.5 font-mono text-[22px] font-semibold tabular-nums text-slate-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white dark:border-[#1A3125] dark:bg-[#111D17]">
        {/* Tabs + search */}
        <div className="flex flex-col gap-3 border-b border-[#EAECF0] px-5 pt-3 sm:flex-row sm:items-end sm:justify-between dark:border-[#1A3125]">
          <div role="tablist" aria-label="Category lists" className="flex gap-6">
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
                    className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-[13px] font-medium transition-colors ${
                      selected
                        ? 'border-[#00C471] text-slate-900 dark:text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.key === 'archive' && <Archive className="h-3.5 w-3.5" aria-hidden="true" />}
                    {t.label}
                    <span
                      className={`rounded-full px-1.5 py-px font-mono text-[11px] font-semibold tabular-nums ${
                        selected ? 'bg-emerald-50 text-emerald-700 dark:bg-[#00C471]/15 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-[#13221B] dark:text-slate-400'
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
          </div>
          <div className="relative mb-3 w-full sm:w-64">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or code"
              aria-label="Search categories"
              className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2 pe-3 ps-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-[#1A3125] dark:bg-[#0A110D] dark:text-slate-100"
            />
          </div>
        </div>

        {onArchiveTab ? (
          archivedQuery.isLoading ? (
            <div className="space-y-2 p-5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-[#13221B]" />
              ))}
            </div>
          ) : archiveRows.length === 0 ? (
            <div className="space-y-2 px-6 py-14 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-[#13221B]">
                <Archive className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{term ? 'No matching archived categories' : 'The archive is empty'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Deleted categories land here, disabled, until you revert or permanently delete them.</p>
            </div>
          ) : (
            <>
              <div className={`hidden gap-4 border-b border-[#EAECF0] bg-slate-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:grid dark:border-[#1A3125] dark:bg-[#0E1A14] dark:text-slate-400 ${ARCHIVE_COLS}`}>
                <span>Category</span>
                <span>Code</span>
                <span className="text-end">Limit per claim</span>
                <span>Archived</span>
                <span className="text-end">Claims</span>
                <span className="sr-only">Actions</span>
              </div>
              <ul className="divide-y divide-[#EAECF0] dark:divide-[#1A3125]">
                {archiveRows.map((cat) => (
                  <li key={cat._id} className={`grid grid-cols-2 items-center gap-x-4 gap-y-3 px-5 py-3.5 ${ARCHIVE_COLS}`}>
                    <div className="col-span-2 min-w-0 md:col-span-1">
                      <p className="truncate text-[13px] font-semibold text-slate-500 line-through decoration-slate-300 dark:text-slate-400 dark:decoration-slate-600">{cat.name}</p>
                      <p className="mt-0.5">
                        <Pill>Disabled</Pill>
                      </p>
                    </div>
                    <div>
                      <CellLabel>Code</CellLabel>
                      <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{cat.code}</span>
                    </div>
                    <div className="md:text-end">
                      <CellLabel>Limit per claim</CellLabel>
                      <span className="font-mono text-[13px] tabular-nums text-slate-600 dark:text-slate-300">{limitLabel(cat.maxLimitPaisa)}</span>
                    </div>
                    <div className="min-w-0">
                      <CellLabel>Archived</CellLabel>
                      <p className="font-mono text-[13px] tabular-nums text-slate-700 dark:text-slate-300">{formatDay(cat.archivedAt || cat.updatedAt)}</p>
                      {cat.archivedByName && <p className="truncate text-xs text-slate-500 dark:text-slate-400">by {cat.archivedByName}</p>}
                    </div>
                    <div className="md:text-end">
                      <CellLabel>Claims</CellLabel>
                      <span className="font-mono text-[13px] tabular-nums text-slate-700 dark:text-slate-300">{cat.claimCount}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1.5 md:col-span-1">
                      <button
                        type="button"
                        onClick={() => setRestoreTarget(cat)}
                        className={`${iconButton} text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40`}
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        Revert
                      </button>
                      <button
                        type="button"
                        onClick={() => setPurgeTarget(cat)}
                        disabled={cat.claimCount > 0}
                        title={cat.claimCount > 0 ? `${cat.claimCount} claim${cat.claimCount === 1 ? '' : 's'} use this category, so it stays archived` : undefined}
                        className={`${iconButton} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete forever
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Categories could not be loaded</p>
            <button type="button" onClick={refetch} className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
              Try again
            </button>
          </div>
        ) : activeRows.length === 0 ? (
          <div className="space-y-2 px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-[#13221B]">
              <Tag className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{term ? 'No matching categories' : 'No categories yet'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Add a category to set spending limits and receipt rules.</p>
          </div>
        ) : (
          <>
            <div className={`hidden gap-4 border-b border-[#EAECF0] bg-slate-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:grid dark:border-[#1A3125] dark:bg-[#0E1A14] dark:text-slate-400 ${ACTIVE_COLS}`}>
              <span>Category</span>
              <span>Code</span>
              <span className="text-end">Limit per claim</span>
              <span>Receipt</span>
              <span>Status</span>
              <span className="sr-only">Actions</span>
            </div>
            <ul className="divide-y divide-[#EAECF0] dark:divide-[#1A3125]">
              {activeRows.map((cat) => (
                <li key={cat._id} className={`grid grid-cols-2 items-center gap-x-4 gap-y-3 px-5 py-3.5 ${ACTIVE_COLS}`}>
                  <div className="col-span-2 min-w-0 md:col-span-1">
                    <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">{cat.name}</p>
                    {cat.description && (
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={cat.description}>
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <CellLabel>Code</CellLabel>
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{cat.code}</span>
                  </div>
                  <div className="md:text-end">
                    <CellLabel>Limit per claim</CellLabel>
                    <span className={`font-mono text-[13px] tabular-nums ${cat.maxLimitPaisa > 0 ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {limitLabel(cat.maxLimitPaisa)}
                    </span>
                  </div>
                  <div>
                    <CellLabel>Receipt</CellLabel>
                    {cat.requiresReceipt ? <Pill tone="emerald">Required</Pill> : <Pill>Optional</Pill>}
                  </div>
                  <div>
                    <CellLabel>Status</CellLabel>
                    {cat.isActive ? <Pill tone="emerald">Active</Pill> : <Pill>Inactive</Pill>}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1 md:col-span-1">
                    <Can I="expense.settings" a="ExpenseCategory">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsModalOpen(true);
                        }}
                        aria-label={`Edit ${cat.name}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#13221B] dark:hover:text-slate-200"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchiveTarget(cat)}
                        aria-label={`Delete ${cat.name}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </Can>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ExpenseCategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} category={selectedCategory} />

      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        icon={Archive}
        isDestructive
        title="Move this category to the archive?"
        message="It will be disabled and removed from the claim form straight away. Existing claims keep it, and you can revert it from the Archive tab at any time."
        details={<CategorySummary category={archiveTarget} />}
        confirmText="Move to archive"
        isLoading={isArchiving}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => run(archiveCategory, archiveTarget, `'${archiveTarget.name}' moved to the archive`, setArchiveTarget)}
      />

      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        icon={RotateCcw}
        title="Revert this category?"
        message="It becomes active again and employees can choose it on new claims."
        details={<CategorySummary category={restoreTarget} />}
        confirmText="Revert category"
        isLoading={isRestoring}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={() => run(restoreCategory, restoreTarget, `'${restoreTarget.name}' is active again`, setRestoreTarget)}
      />

      <ConfirmDialog
        isOpen={Boolean(purgeTarget)}
        icon={Trash2}
        isDestructive
        title="Delete this category forever?"
        message="This permanently removes the category and frees its code. It cannot be undone."
        details={<CategorySummary category={purgeTarget} />}
        requireText={purgeTarget?.code || ''}
        confirmText="Delete forever"
        isLoading={isPurging}
        onCancel={() => setPurgeTarget(null)}
        onConfirm={() => run(purgeCategory, purgeTarget, `'${purgeTarget.name}' permanently deleted`, setPurgeTarget)}
      />
    </div>
  );
}
