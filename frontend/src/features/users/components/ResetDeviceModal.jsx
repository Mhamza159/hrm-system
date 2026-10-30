/**
 * @file ResetDeviceModal.jsx
 * @description Modal for HR / Super Admin to unbind and reset an employee's registered physical hardware device.
 *
 * SPECIFICATION:
 * - Module: M13 Dynamic QR Code Attendance (BUILD-GUIDE Section 18 · Row 13.5)
 */

import React, { useState } from 'react';
import { Smartphone, X, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { useResetDeviceBindingMutation } from '../../attendance/attendanceApi.js';
import { toast } from 'sonner';

export const ResetDeviceModal = ({ isOpen, onClose, user = null, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [resetDeviceBinding, { isLoading }] = useResetDeviceBindingMutation();

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMsg('Please enter a valid reason for resetting this hardware device (minimum 3 characters).');
      return;
    }

    try {
      await resetDeviceBinding({
        userId: user._id || user.id,
        reason: reason.trim()
      }).unwrap();

      toast.success(`Hardware device binding for ${user.name} has been reset successfully.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to reset device binding.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Reset Bound Hardware Device
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                User: <span className="font-semibold text-slate-700 dark:text-slate-300">{user.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start space-x-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Resetting unbinds the employee's current registered smartphone or PC. Their next QR scan will automatically bind their new device. This action is recorded in the permanent audit ledger.
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Reason for Device Reset <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Employee changed their phone / Device lost / Company phone replaced"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Resetting...' : 'Confirm Reset Device'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
