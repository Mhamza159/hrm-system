/**
 * @file ExpenseFormModal.jsx
 * @description Modal dialog for employee expense claim submissions with mandatory receipt proof.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.2)
 * - Receipt Mandate: Submissions without a verifiable image/PDF receipt are strictly blocked.
 * - Precision: Amount entered in PKR and submitted as positive integer paisa (1 PKR = 100 paisa).
 */

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  Receipt,
  Calendar,
  CheckCircle,
  FileCheck2,
  Trash2
} from 'lucide-react';
import {
  useGetExpenseCategoriesQuery,
  useApplyExpenseMutation
} from '../expensesApi.js';

export default function ExpenseFormModal({ isOpen, onClose }) {
  const [categoryId, setCategoryId] = useState('');
  const [amountPkr, setAmountPkr] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  const { data: categoriesData } = useGetExpenseCategoriesQuery();
  const [applyExpense, { isLoading }] = useApplyExpenseMutation();

  const categories = categoriesData?.data?.filter((c) => c.isActive) || [];
  const selectedCategory = categories.find((c) => c._id === categoryId);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype || file.type)) {
      setErrorMsg('Invalid file format. Please upload JPEG, PNG, WEBP image or PDF document.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Receipt file exceeds maximum 5MB size limit.');
      return;
    }

    setReceiptFile(file);
    setErrorMsg('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setReceiptPreview(event.target.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!categoryId) {
      setErrorMsg('Please select an expense category.');
      return;
    }

    const pkrNum = parseFloat(amountPkr);
    if (!pkrNum || pkrNum <= 0) {
      setErrorMsg('Please enter a valid expense amount in PKR.');
      return;
    }

    const amountPaisa = Math.round(pkrNum * 100);

    if (selectedCategory?.maxLimitPaisa > 0 && amountPaisa > selectedCategory.maxLimitPaisa) {
      setErrorMsg(
        `Amount exceeds the maximum limit for ${selectedCategory.name} (PKR ${(selectedCategory.maxLimitPaisa / 100).toLocaleString('en-PK')}).`
      );
      return;
    }

    // BUILD-GUIDE Row 11.2 Mandate: Bina raseed reject!
    if (selectedCategory?.requiresReceipt && !receiptFile) {
      setErrorMsg('Receipt proof is strictly mandatory for this category (Raseed Lazmi).');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setErrorMsg('Please provide a descriptive reason (at least 5 characters).');
      return;
    }

    const formData = new FormData();
    formData.append('categoryId', categoryId);
    formData.append('amount', amountPaisa.toString());
    formData.append('expenseDate', expenseDate);
    formData.append('description', description.trim());
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }

    try {
      await applyExpense(formData).unwrap();
      handleClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to submit expense claim.');
    }
  };

  const handleClose = () => {
    setCategoryId('');
    setAmountPkr('');
    setDescription('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Submit Expense Claim
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Attach verifiable receipt proof for out-of-pocket reimbursements
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Category Dropdown with Policy Limits */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Expense Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">-- Select Corporate Category --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name} ({cat.code}) — Cap: {cat.maxLimitPaisa > 0 ? `PKR ${(cat.maxLimitPaisa / 100).toLocaleString('en-PK')}` : 'No Limit'}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] px-2 py-1 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                <span>Policy Cap: {selectedCategory.maxLimitPaisa > 0 ? `PKR ${(selectedCategory.maxLimitPaisa / 100).toLocaleString('en-PK')}` : 'Discretionary'}</span>
                {selectedCategory.requiresReceipt && (
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Raseed Lazmi</span>
                )}
              </div>
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount (PKR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">PKR</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 2500"
                  value={amountPkr}
                  onChange={(e) => setAmountPkr(e.target.value)}
                  className="w-full pl-12 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                value={expenseDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Purpose & Business Justification *
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Fuel expenses for client site meeting in Gulberg..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Receipt Proof Upload (BUILD-GUIDE 11.2 Raseed Lazmi) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Receipt Proof (Image or PDF) *
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!receiptFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-5 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30"
              >
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-500 mb-2" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Click to upload receipt photo or PDF
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG, WEBP, or PDF up to 5MB (Bina raseed reject hoga)
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  {receiptPreview ? (
                    <img
                      src={receiptPreview}
                      alt="Receipt Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {receiptFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {(receiptFile.size / 1024).toFixed(1)} KB • Attached
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition shrink-0"
                  title="Remove Receipt"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? 'Uploading & Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

