/**
 * @file StatusChangeModal.jsx
 * @description Modal dialog for transitioning grievance case status (BUILD-GUIDE Row 21.2).
 */

import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateFeedbackStatusMutation } from '../feedbackApi.js';

export default function StatusChangeModal({ isOpen, onClose, caseItem }) {
  const [updateStatus, { isLoading }] = useUpdateFeedbackStatusMutation();

  const [newStatus, setNewStatus] = useState(caseItem?.status || 'Under Review');
  const [resolutionNote, setResolutionNote] = useState('');

  if (!isOpen || !caseItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateStatus({
        id: caseItem._id,
        status: newStatus,
        resolutionNote: resolutionNote.trim() || undefined
      }).unwrap();

      toast.success(`Case status updated to ${newStatus}`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const isFinalState = ['Resolved', 'Dismissed'].includes(newStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1A3125] mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
              Transition Docket Status
            </h3>
            <span className="text-xs font-mono text-[#00C471] font-bold">
              {caseItem.trackingCode}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7E9E8F] mb-1.5">
              Select New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs sm:text-sm focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all"
            >
              <option value="Submitted">Submitted (Pending Triaging)</option>
              <option value="Under Review">Under Review (Initial Assessment)</option>
              <option value="In Investigation">In Investigation (Hearings / Active Evidence)</option>
              <option value="Resolved">Resolved (Corrective Action Taken)</option>
              <option value="Dismissed">Dismissed (No Action Required / Unfounded)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7E9E8F] mb-1.5">
              {isFinalState ? 'Resolution Findings / Final Note' : 'Transition Note (Optional)'}
              {isFinalState && <span className="text-rose-500"> *</span>}
            </label>
            <textarea
              rows={4}
              required={isFinalState}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder={
                isFinalState
                  ? 'Detail the investigation findings, corrective remedies, and administrative closure reasons...'
                  : 'Add brief note on why this status transition occurred...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all resize-y placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D]"
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-[#7E9E8F]">
              This note will be logged in the public timeline visible to the complainant.
            </p>
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
              className="px-5 py-2 rounded-xl bg-[#00C471] hover:bg-[#00B064] text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Updating...' : 'Commit Status'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
