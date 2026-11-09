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
      return toast.error('Please enter a detailed escalation reason (at least 5 characters)');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Escalate to Super Admin
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          Escalating case <strong className="font-mono text-primary">{caseItem.trackingCode}</strong> flags this matter directly for executive oversight by the Super Admin. Use this when an impasse, conflict of interest, or high-risk violation occurs.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Reason for Escalation <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why standard investigation cannot resolve this case..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <ArrowUpRight className="w-4 h-4" />
              {isLoading ? 'Escalating...' : 'Confirm Escalation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
