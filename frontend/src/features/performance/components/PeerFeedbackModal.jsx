/**
 * @file PeerFeedbackModal.jsx
 * @description Modal for requesting 360-degree peer feedback and inviting colleagues.
 * Adheres strictly to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.6)
 */

import React, { useState } from 'react';
import { X, Users, ShieldCheck, Send, Loader2 } from 'lucide-react';
import { useRequestPeerFeedbackMutation } from '../performanceApi.js';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';
import { toast } from 'sonner';

export const PeerFeedbackModal = ({ isOpen, onClose, reviewId }) => {
  const [requestPeerFeedback, { isLoading }] = useRequestPeerFeedbackMutation();
  const { data: empData } = useGetEmployeesQuery({ limit: 100 });
  const employees = empData?.data?.items || (Array.isArray(empData?.data) ? empData?.data : []);

  const [selectedPeer, setSelectedPeer] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPeer) {
      toast.error('Please select an active colleague to request peer review');
      return;
    }

    try {
      await requestPeerFeedback({
        id: reviewId,
        peerEmployeeId: selectedPeer
      }).unwrap();
      toast.success('360° peer feedback request sent successfully');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to request peer feedback');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Request 360° Peer Feedback
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invite a colleague to provide confidential performance input.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Colleague / Peer Reviewer <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedPeer}
              onChange={(e) => setSelectedPeer(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Choose a team member...</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode} · {emp.designationId?.title || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          {/* Confidentiality Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs text-emerald-900 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Confidentiality Guarantee:</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                Peer reviews are masked for confidentiality. The employee will not see the reviewer's identity when viewing feedback.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !selectedPeer}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Peer Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
