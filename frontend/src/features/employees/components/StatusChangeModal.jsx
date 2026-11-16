/**
 * @file StatusChangeModal.jsx
 * @description Modal dialog for transitioning employee lifecycle status.
 * 
 * SPECIFICATION:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.7)
 * - Statuses: Active, Probation, Notice, Resigned, Terminated, Suspended.
 * - Mandatory Reason: Enforced by Zod and UI.
 * - Warning: Prominent danger alert when selecting 'Terminated' or 'Suspended'.
 * - Theme: Forest & Emerald Enterprise styling.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'sonner';
import { ShieldAlert, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useUpdateEmployeeStatusMutation } from '../employeesApi.js';

export function StatusChangeModal({ isOpen, onClose, employeeId, currentStatus }) {
  const [overrideStatus, setOverrideStatus] = useState(null);
  const [reason, setReason] = useState('');

  const status = overrideStatus ?? (currentStatus || 'Active');

  const [updateEmployeeStatus, { isLoading }] = useUpdateEmployeeStatusMutation();

  if (!isOpen) return null;

  const isCriticalStatus = ['Terminated', 'Suspended', 'Resigned'].includes(status);

  const handleClose = () => {
    setOverrideStatus(null);
    setReason('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Status transition reason is mandatory');
      return;
    }

    try {
      await updateEmployeeStatus({
        id: employeeId,
        status,
        reason: reason.trim()
      }).unwrap();
      toast.success(`Employee status updated to ${status}`);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update employee status');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-[#111D17] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-900/40">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Update Employee Status</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Lifecycle Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setOverrideStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 font-medium"
            >
              <option value="Active">Active</option>
              <option value="Probation">Probation</option>
              <option value="Notice">Notice Period</option>
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {isCriticalStatus && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold block text-slate-900 dark:text-white">Caution: Account Deactivation Notice</span>
                Changing status to <strong>{status}</strong> will immediately disable this employee's system user login and invalidate active sessions.
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mandatory Justification / Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Provide detailed administrative or operational reasoning..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#15241C] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl font-semibold bg-[#00C471] hover:bg-[#00ad64] text-white flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                'Confirm Status Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

StatusChangeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  employeeId: PropTypes.string,
  currentStatus: PropTypes.string
};
