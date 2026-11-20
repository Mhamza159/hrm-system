/**
 * @file EscalateModal.jsx
 * @description Dialog for escalating a grievance case directly to the Super Admin (BUILD-GUIDE Row 21.5).
 */

import React, { useState } from 'react';
import { X, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { useEscalateFeedbackMutation } from '../feedbackApi.js';

export default function EscalateModal({ isOpen, onClose, caseItem }) {
  const [escalateFeedback, { isLoading }] = useEscalateFeedbackMutation();
  const [reason, setReason] = useState('');

  if (!isOpen || !caseItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      return toast.error('Please enter a detailed escalation reason (at least 5 characters).');
    }

    try {
      await escalateFeedback({
        id: caseItem._id,
        reason: reason.trim()
      }).unwrap();

      toast.success('Grievance has been escalated to executive leadership.');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to escalate case');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1A3125] mb-4">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
              Escalate to Executive Super Admin
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-[#7E9E8F] mb-4 leading-relaxed">
          Escalating case <strong className="font-mono text-[#00C471]">{caseItem.trackingCode}</strong> marks this matter for immediate executive oversight. Use this for departmental impasses, managerial conflicts of interest, or high-risk legal exposures.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7E9E8F] mb-1.5">
              Escalation Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why standard departmental triage cannot resolve this case..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all resize-y placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D]"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-[#1A3125] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#7E9E8F] hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{isLoading ? 'Escalating...' : 'Confirm Escalation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
