/**
 * @file OfferLetterModal.jsx
 * @description Formal Employment Offer Configuration & PDF Generation Modal (Module M15 / Row 15.10).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.10)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { X, FileText, Plus, Trash2, CheckCircle2, Download, AlertCircle, DollarSign } from 'lucide-react';
import { useIssueOfferLetterMutation } from '../recruitmentApi.js';
import { toast } from 'sonner';

export const OfferLetterModal = ({ isOpen, onClose, candidate }) => {
  const [baseSalaryPkr, setBaseSalaryPkr] = useState('200000');
  const [joiningDate, setJoiningDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [probationMonths, setProbationMonths] = useState(3);
  const [allowances, setAllowances] = useState([
    { name: 'Medical Allowance', amountPkr: '20000' }
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  const [issueOfferLetter, { isLoading }] = useIssueOfferLetterMutation();

  if (!isOpen || !candidate) return null;

  const handleAddAllowance = () => {
    setAllowances((prev) => [...prev, { name: '', amountPkr: '' }]);
  };

  const handleRemoveAllowance = (idx) => {
    setAllowances((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAllowanceChange = (idx, field, value) => {
    setAllowances((prev) =>
      prev.map((al, i) => (i === idx ? { ...al, [field]: value } : al))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const baseSal = Number(baseSalaryPkr);
    if (isNaN(baseSal) || baseSal <= 0) {
      setErrorMsg('Please enter a valid monthly base salary in PKR.');
      return;
    }

    const formattedAllowances = allowances
      .filter((a) => a.name.trim() && !isNaN(Number(a.amountPkr)) && Number(a.amountPkr) > 0)
      .map((a) => ({
        name: a.name.trim(),
        amountPaisa: Math.round(Number(a.amountPkr) * 100)
      }));

    try {
      await issueOfferLetter({
        candidateId: candidate._id,
        baseSalaryPaisa: Math.round(baseSal * 100),
        joiningDate,
        probationMonths: Number(probationMonths),
        allowances: formattedAllowances
      }).unwrap();

      toast.success(`Formal offer letter issued to ${candidate.name}!`);
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to issue offer letter.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
              <FileText className="w-5 h-5 text-[#00C471]" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Issue Formal Offer Letter</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Candidate: <span className="font-semibold text-slate-700 dark:text-slate-200">{candidate.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Base Salary (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={baseSalaryPkr}
                onChange={(e) => setBaseSalaryPkr(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Joining Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Probation Duration (Months)
            </label>
            <input
              type="number"
              min="0"
              max="12"
              value={probationMonths}
              onChange={(e) => setProbationMonths(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            />
          </div>

          {/* Allowances list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Additional Monthly Allowances
              </label>
              <button
                type="button"
                onClick={handleAddAllowance}
                className="text-xs font-semibold text-[#00C471] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Allowance
              </button>
            </div>

            {allowances.map((al, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Allowance name (e.g. Fuel, Medical)"
                  value={al.name}
                  onChange={(e) => handleAllowanceChange(idx, 'name', e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
                />
                <input
                  type="number"
                  placeholder="Amount (PKR)"
                  value={al.amountPkr}
                  onChange={(e) => handleAllowanceChange(idx, 'amountPkr', e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAllowance(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#1A3125]">
            <a
              href={`/api/v1/recruitment/candidates/${candidate._id}/offer/pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Preview PDF Letter
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLoading ? 'Issuing...' : 'Issue Offer Letter'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
