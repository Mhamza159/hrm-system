/**
 * @file PolicyAcknowledgementModal.jsx
 * @description Digital Employee Policy Acknowledgement Modal with legal declaration and signature capture.
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Paperclip,
  Check
} from 'lucide-react';
import { useAcknowledgePolicyMutation } from '../policyApi.js';

export const PolicyAcknowledgementModal = ({
  isOpen,
  onClose,
  policy,
  userName = '',
  onSuccess
}) => {
  const [acknowledgePolicy, { isLoading: isSigning }] = useAcknowledgePolicyMutation();

  const [hasConfirmedRead, setHasConfirmedRead] = useState(false);
  const [signatureText, setSignatureText] = useState(userName || '');
  const [currentTimestamp] = useState(() => new Date().toLocaleString());
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !policy) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasConfirmedRead) {
      setErrorMessage('You must confirm having read and agreed to the policy terms.');
      return;
    }

    if (!signatureText.trim()) {
      setErrorMessage('Please type your full legal name as your digital signature.');
      return;
    }

    try {
      await acknowledgePolicy({
        id: policy._id,
        signatureText: signatureText.trim()
      }).unwrap();

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMessage(err?.data?.message || 'Failed to record acknowledgement.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Policy Acknowledgement & Sign-off
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Mandatory digital compliance declaration
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
        {isSuccess ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Acknowledgement Confirmed!
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F] max-w-sm mx-auto">
              Your digital signature for {policy.title} (v{policy.version}) has been recorded with a secure timestamp.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Policy Snapshot Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-[#7E9E8F]">
                  {policy.policyCode}
                </span>
                <span className="font-mono text-xs text-slate-400">v{policy.version}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full ml-auto">
                  Enforced
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {policy.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F] line-clamp-2">
                {policy.description || 'Corporate operational guideline.'}
              </p>
            </div>

            {/* Document preview snippet */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Policy Document Summary
              </label>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-700 dark:text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {policy.content}
              </div>
            </div>

            {/* Attached file link if available */}
            {policy.fileUrl && (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                    {policy.fileName || 'Attached Documentation'}
                  </span>
                </div>
                <a
                  href={policy.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#00C471] hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Review File</span>
                </a>
              </div>
            )}

            {/* Mandatory Checkbox Declaration */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/30 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={hasConfirmedRead}
                  onChange={(e) => setHasConfirmedRead(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#00C471] focus:ring-[#00C471]"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                  I confirm that I have read, understood, and agree to abide by the rules, procedures, and principles set forth in this policy document.
                </span>
              </label>
            </div>

            {/* Digital Signature */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Legal Electronic Signature (Type Full Name) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jane Doe"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Timestamp: {currentTimestamp} · Identity verified by system session
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-lg border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSigning || !hasConfirmedRead || !signatureText.trim()}
                className="h-9 px-5 rounded-lg bg-[#00C471] hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSigning ? 'Submitting...' : 'Sign & Acknowledge'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PolicyAcknowledgementModal;
