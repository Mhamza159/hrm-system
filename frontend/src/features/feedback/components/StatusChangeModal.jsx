/**
 * @file StatusChangeModal.jsx
 * @description Modal dialog for transitioning grievance case status (BUILD-GUIDE Row 21.2).
 */

import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Update Case Status
            </h3>
            <span className="text-xs font-mono text-primary font-semibold">
              {caseItem.trackingCode}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Select New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="Submitted">Submitted (Pending Triaging)</option>
              <option value="Under Review">Under Review (Initial Assessment)</option>
              <option value="In Investigation">In Investigation (Hearings / Active Evidence)</option>
              <option value="Resolved">Resolved (Corrective Action Taken)</option>
              <option value="Dismissed">Dismissed (No Action Required / Unfounded)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
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
                  ? 'Detail the investigation findings and corrective measures implemented...'
                  : 'Add brief note on why this status transition occurred...'
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            />
            <p className="mt-1 text-xs text-slate-400">
              This note will be logged in the public timeline visible to the complainant.
            </p>
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
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Commit Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
