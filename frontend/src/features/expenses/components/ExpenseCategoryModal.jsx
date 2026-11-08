/**
 * @file ExpenseCategoryModal.jsx
 * @description Dialog for creating and modifying corporate expense policy categories and limits.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.1)
 * - Design: Forest & Emerald Craft (DESIGN.md & docs/UI-REFERENCE.md)
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  DollarSign,
  FileText,
  AlertCircle,
  Receipt,
  Check
} from 'lucide-react';
import {
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation
} from '../expensesApi.js';

export default function ExpenseCategoryModal({ isOpen, onClose, category = null }) {
  const isEditing = Boolean(category);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    maxLimitPkr: '',
    requiresReceipt: true,
    isActive: true
  });
  const [errorMsg, setErrorMsg] = useState('');

  const [createCategory, { isLoading: isCreating }] = useCreateExpenseCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateExpenseCategoryMutation();

  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        code: category.code || '',
        description: category.description || '',
        maxLimitPkr: category.maxLimitPaisa ? (category.maxLimitPaisa / 100).toString() : '',
        requiresReceipt: category.requiresReceipt ?? true,
        isActive: category.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        maxLimitPkr: '',
        requiresReceipt: true,
        isActive: true
      });
    }
    setErrorMsg('');
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setErrorMsg('Category uppercase code is required.');
      return;
    }

    const maxLimitPaisa = formData.maxLimitPkr ? Math.round(parseFloat(formData.maxLimitPkr) * 100) : 0;

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      maxLimitPaisa,
      requiresReceipt: formData.requiresReceipt,
      isActive: formData.isActive
    };

    try {
      if (isEditing) {
        await updateCategory({ id: category._id, data: payload }).unwrap();
      } else {
        await createCategory(payload).unwrap();
      }
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to save expense category.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111D17] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#162720]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Expense Category' : 'Create Expense Category'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Define spending threshold rules and receipt proof mandates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162720] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Travel & Commute"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category Code *
              </label>
              <input
                type="text"
                placeholder="e.g. TRAVEL"
                disabled={isEditing}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-mono uppercase rounded-xl border border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Max Policy Limit per Claim (PKR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">PKR</span>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="0 for unlimited"
                value={formData.maxLimitPkr}
                onChange={(e) => setFormData({ ...formData, maxLimitPkr: e.target.value })}
                className="w-full pl-12 pr-3 py-2 text-sm font-mono tabular-nums rounded-xl border border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F] mt-1">
              Claims exceeding this ceiling trigger automatic rejection or escalation. Enter 0 for no limit.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description & Audit Policy
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Fuel allowance, highway tolls, taxi receipts..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Toggle Switches */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#1A3125] space-y-3">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#162720]/40 transition">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Receipt Required
                </span>
                <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F]">
                  Strictly rejects any claim submitted without an image/PDF receipt.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.requiresReceipt}
                onChange={(e) => setFormData({ ...formData, requiresReceipt: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 accent-[#00C471] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#162720]/40 transition">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Active Status
                </span>
                <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F]">
                  Active categories appear in employee claim submission dropdown.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 accent-[#00C471] cursor-pointer"
              />
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162720] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
