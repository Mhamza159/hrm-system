/**
 * @file ExpenseCategoryModal.jsx
 * @description Modal dialog for creating and updating corporate Expense Categories & Policy Limits.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.1)
 * - Design System: Neutral / Slate palette with Forest & Emerald accent tokens.
 */

import React, { useState, useEffect } from 'react';
import { X, Tag, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import {
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation
} from '../expensesApi.js';

export default function ExpenseCategoryModal({ isOpen, onClose, category = null }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    maxLimitPkr: '',
    requiresReceipt: true,
    description: '',
    isActive: true
  });
  const [errorMsg, setErrorMsg] = useState('');

  const [createCategory, { isLoading: isCreating }] = useCreateExpenseCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateExpenseCategoryMutation();

  const isEditing = Boolean(category?._id);
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        code: category.code || '',
        maxLimitPkr: category.maxLimitPaisa ? (category.maxLimitPaisa / 100).toString() : '0',
        requiresReceipt: category.requiresReceipt !== undefined ? category.requiresReceipt : true,
        description: category.description || '',
        isActive: category.isActive !== undefined ? category.isActive : true
      });
    } else {
      setFormData({
        name: '',
        code: '',
        maxLimitPkr: '5000',
        requiresReceipt: true,
        description: '',
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
      setErrorMsg('Category code is required (e.g., TRAVEL, MEALS).');
      return;
    }

    const maxLimitPkrNum = parseFloat(formData.maxLimitPkr) || 0;
    if (maxLimitPkrNum < 0) {
      setErrorMsg('Policy limit cannot be negative.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      maxLimitPaisa: Math.round(maxLimitPkrNum * 100),
      requiresReceipt: formData.requiresReceipt,
      description: formData.description.trim(),
      isActive: formData.isActive
    };

    try {
      if (isEditing) {
        await updateCategory({ id: category._id, ...payload }).unwrap();
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
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Expense Category' : 'Create Expense Category'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure policy limit caps and receipt rules (BUILD-GUIDE 11.1)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                className="w-full px-3 py-2 text-sm uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Max Policy Limit per Claim (PKR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">PKR</span>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="0 for unlimited"
                value={formData.maxLimitPkr}
                onChange={(e) => setFormData({ ...formData, maxLimitPkr: e.target.value })}
                className="w-full pl-12 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
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
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Toggle Switches */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Mandatory Receipt Proof (Raseed Lazmi)
                </span>
                <p className="text-[11px] text-slate-400">
                  Strictly rejects any claim submitted without an image/PDF receipt.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.requiresReceipt}
                onChange={(e) => setFormData({ ...formData, requiresReceipt: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Active Status
                </span>
                <p className="text-[11px] text-slate-400">
                  Active categories appear in employee claim submission dropdown.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

