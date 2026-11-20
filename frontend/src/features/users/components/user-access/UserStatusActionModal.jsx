/**
 * @file UserStatusActionModal.jsx
 * @description Guarded Status Toggle Confirmation Modal for Account Activation / Deactivation.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  UserX,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateUserStatusMutation } from '../../usersApi.js';

export function UserStatusActionModal({
  user,
  nextStatus, // boolean: true for activate, false for deactivate
  isOpen,
  onClose,
  onSuccess
}) {
  const [reason, setReason] = useState('');
  const [updateUserStatus, { isLoading: isSubmitting }] = useUpdateUserStatusMutation();

  useEffect(() => {
    setReason('');
  }, [user, nextStatus, isOpen]);

  if (!isOpen || !user) return null;

  const displayName = user.name || user.email?.split('@')[0] || 'User Account';
  const isDeactivating = nextStatus === false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await updateUserStatus({
        id: user._id,
        isActive: nextStatus,
        reason: reason.trim() || (isDeactivating ? 'Administrative account deactivation' : 'Administrative account activation')
      }).unwrap();

      toast.success(
        response?.message ||
          (nextStatus ? 'User account activated successfully.' : 'User account deactivated successfully.')
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update account status.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold border ${
                isDeactivating
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-[#00C471] dark:border-emerald-800/60'
              }`}
            >
              {isDeactivating ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isDeactivating ? 'Deactivate User Account' : 'Activate User Account'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target: <span className="font-semibold text-slate-700 dark:text-slate-200">{displayName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Warning Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
              isDeactivating
                ? 'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-200'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {isDeactivating ? (
                <>
                  <span className="font-bold">Authentication Lockout:</span> Deactivating this user will terminate their active sessions immediately and block future login attempts.
                </>
              ) : (
                <>
                  <span className="font-bold">Restoring Access:</span> Activating this account will allow the employee to log in and access company resources according to their assigned roles.
                </>
              )}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Administrative Justification Reason {isDeactivating && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              required={isDeactivating}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isDeactivating ? 'e.g. Employee on extended leave, account security hold...' : 'Reason for re-activating account...'}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isDeactivating && !reason.trim())}
              className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isDeactivating
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                  : 'bg-[#00C471] hover:bg-emerald-600 text-white shadow-emerald-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isDeactivating ? 'Confirm Deactivation' : 'Confirm Activation'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
