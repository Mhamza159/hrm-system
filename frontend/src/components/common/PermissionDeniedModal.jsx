/**
 * @file PermissionDeniedModal.jsx
 * @description State 7: Action-level Permission Denial Dialog.
 * Strictly satisfies Rule 7: Explain why you need it and provide a way back.
 */

import React, { useEffect } from 'react';
import { ShieldAlert, X, KeyRound, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} [props.actionName='perform this action']
 * @param {string} [props.permission]
 * @param {string} [props.roleNeeded]
 */
export function PermissionDeniedModal({
  isOpen,
  onClose,
  actionName = 'perform this action',
  permission = null,
  roleNeeded = null
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSendRequest = () => {
    toast.success('Access escalation request submitted to your Department Administrator.');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-denied-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xl space-y-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Shield Icon Capsule */}
        <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <h2 id="permission-denied-title" className="text-base font-bold text-slate-900 dark:text-white">
            Permission Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            You do not have the authorization to {actionName}.
          </p>
        </div>

        {/* Required details */}
        <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-purple-800 dark:text-purple-300">
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span>Policy Requirement</span>
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-400 leading-normal">
            This operation requires the <code className="font-mono bg-purple-100 dark:bg-purple-900/40 px-1 py-0.5 rounded">{permission || 'elevated'}</code> permission, assigned to {roleNeeded || 'designated managers and administrators'}.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>

          <button
            type="button"
            onClick={handleSendRequest}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            Request Access
          </button>
        </div>
      </div>
    </div>
  );
}

