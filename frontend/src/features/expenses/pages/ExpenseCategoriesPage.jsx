/**
 * @file ExpenseCategoriesPage.jsx
 * @description Corporate Expense Categories & Policy Limits Configuration Screen.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.1)
 * - Layer: Feature Page (Frontend)
 * - Permission: Can I="expense.settings" a="ExpenseCategory"
 */

import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Shield,
  FileCheck,
  Edit2,
  Trash2,
  AlertCircle,
  Receipt,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import {
  useGetExpenseCategoriesQuery,
  useDeleteExpenseCategoryMutation
} from '../expensesApi.js';
import ExpenseCategoryModal from '../components/ExpenseCategoryModal.jsx';

export default function ExpenseCategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading, error } = useGetExpenseCategoriesQuery();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteExpenseCategoryMutation();

  const categories = data?.data || [];

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }
    try {
      setDeleteError('');
      await deleteCategory(id).unwrap();
    } catch (err) {
      setDeleteError(err?.data?.message || 'Failed to delete category.');
    }
  };

  const totalCategories = categories.length;
  const activeCount = categories.filter((c) => c.isActive).length;
  const receiptMandatedCount = categories.filter((c) => c.requiresReceipt).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Expense Categories & Policy Limits"
        description="Configure corporate claim ceilings, receipt audit mandates, and category codes."
        actions={
          <Can I="expense.settings" a="ExpenseCategory">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </Can>
        }
      />

      {deleteError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Categories</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalCategories}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Policies</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{activeCount}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Receipts Mandated (Raseed Lazmi)</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{receiptMandatedCount}</h3>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Corporate Expense Policies</h3>
          <span className="text-xs text-slate-500">{categories.length} categories configured</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading expense categories...</div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-500">Failed to load categories.</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">No Expense Categories Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first corporate expense category to set spending ceilings and receipt rules.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 font-medium">
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Code</th>
                  <th className="py-3 px-6">Max Limit per Claim</th>
                  <th className="py-3 px-6">Receipt Rule</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-medium text-slate-900 dark:text-white">
                      <div>{cat.name}</div>
                      {cat.description && (
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5 max-w-xs truncate">
                          {cat.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {cat.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-900 dark:text-slate-200">
                      {cat.maxLimitPaisa > 0 ? (
                        <span>PKR {(cat.maxLimitPaisa / 100).toLocaleString('en-PK')}</span>
                      ) : (
                        <span className="text-slate-400 italic">No Cap (Discretionary)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {cat.requiresReceipt ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Raseed Lazmi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {cat.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Can I="expense.settings" a="ExpenseCategory">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat._id, cat.name)}
                            disabled={isDeleting}
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <ExpenseCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={selectedCategory}
      />
    </div>
  );
}

