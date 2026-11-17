/**
 * @file PolicyApprovalModal.jsx
 * @description Administrative review modal for approving or rejecting proposed policy drafts.
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useApprovePolicyMutation, useRejectPolicyMutation } from '../policyApi.js';

export const PolicyApprovalModal = ({ isOpen, onClose, policy, onSuccess }) => {
  const [approvePolicy, { isLoading: isApproving }] = useApprovePolicyMutation();
  const [rejectPolicy, { isLoading: isRejecting }] = useRejectPolicyMutation();

  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !policy) return null;

  const handleApprove = async () => {
    setErrorMessage('');
    try {
      await approvePolicy({ id: policy._id, notes }).unwrap();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || 'Failed to approve policy.');
    }
  };

  const handleReject = async () => {
    setErrorMessage('');
    if (!rejectionReason.trim()) {
      setErrorMessage('Please state the reason for rejecting this policy draft.');
      return;
    }
    try {
      await rejectPolicy({ id: policy._id, reason: rejectionReason }).unwrap();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || 'Failed to reject policy.');
    }
  };

  const isBusy = isApproving || isRejecting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Policy Review & Sign-off
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Governance gate for policy publication
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Policy Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-[#7E9E8F]">
                {policy.policyCode}
              </span>
              <span className="font-mono text-xs text-slate-400">v{policy.version}</span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full ml-auto">
                {policy.status}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {policy.title}
            </h4>
            {policy.description && (
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F] line-clamp-2">
                {policy.description}
              </p>
            )}
          </div>

          {!isRejectMode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Approval Notes (Optional remarks for author)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Approved with recommended follow-up for IT team..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectMode(true)}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject this Draft</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleApprove}
                  className="h-9 px-5 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Policy</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                  Reason for Rejection * (Sent to author)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this policy requires revision or does not comply with regulations..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white dark:bg-[#0C1712] border border-rose-500/30 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectMode(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Back to Approval
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleReject}
                  className="h-9 px-5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] flex justify-end bg-slate-50/50 dark:bg-[#0C1712]/50">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyApprovalModal;
