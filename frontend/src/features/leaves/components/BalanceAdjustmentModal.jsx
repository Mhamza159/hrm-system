/**
 * @file BalanceAdjustmentModal.jsx
 * @description HR Administrative Leave Balance Adjustment & Audit Override Modal (BUILD-GUIDE Row 6.14).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Features: Category-wise quota overrides with mandatory audit justification notes.
 * - Layer: Component (Admin Governance Dialog)
 * - Aesthetics: Linear Dark Craft (#090A0F, #0F111A, #1E2235, #5E6AD2).
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ShieldAlert, X, Sliders, AlertTriangle } from 'lucide-react';
import { useAdjustLeaveBalanceMutation } from '../leavesApi.js';

export function BalanceAdjustmentModal({ isOpen, onClose, balanceDoc, employeeName }) {
  const [adjustBalance, { isLoading }] = useAdjustLeaveBalanceMutation();

  const [formBalances, setFormBalances] = useState([]);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    if (balanceDoc?.balances) {
      setFormBalances(
        balanceDoc.balances.map((b) => ({
          leaveTypeId: b.leaveTypeId?._id || b.leaveTypeId,
          name: b.leaveTypeId?.name || 'Leave Category',
          code: b.leaveTypeId?.code || 'LV',
          allocatedDays: b.allocatedDays || 0,
          carriedForwardDays: b.carriedForwardDays || 0,
          usedDays: b.usedDays || 0,
          pendingDays: b.pendingDays || 0,
          encashedDays: b.encashedDays || 0
        }))
      );
    }
    setOverrideReason('');
  }, [balanceDoc, isOpen]);

  if (!isOpen || !balanceDoc) return null;

  const handleFieldChange = (index, field, value) => {
    const updated = [...formBalances];
    updated[index] = {
      ...updated[index],
      [field]: Math.max(0, Number(value) || 0)
    };
    setFormBalances(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      toast.error('Audit override justification must be at least 5 characters.');
      return;
    }

    try {
      const payloadBalances = formBalances.map((b) => ({
        leaveTypeId: b.leaveTypeId,
        allocatedDays: b.allocatedDays,
        carriedForwardDays: b.carriedForwardDays,
        usedDays: b.usedDays,
        pendingDays: b.pendingDays,
        encashedDays: b.encashedDays
      }));

      await adjustBalance({
        id: balanceDoc._id,
        balances: payloadBalances,
        overrideReason: overrideReason.trim()
      }).unwrap();

      toast.success('Leave balance adjusted and immutable audit log entry created.');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to adjust leave balance.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#0F111A] border border-[#1E2235] w-full max-w-2xl rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2235] shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Sliders className="w-4 h-4 text-[#5E6AD2]" />
            <span>
              Adjust Leave Balances — {employeeName || 'Employee'} ({balanceDoc.year})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2235] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mt-4 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-2.5 text-xs text-slate-300 shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Administrative Override Mode:</span> Modifying
            quota balances directly impacts employee annual entitlements and attendance records. An
            immutable audit record with your user ID and justification will be recorded permanently.
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
          <div className="space-y-3">
            {formBalances.map((item, idx) => (
              <div
                key={item.leaveTypeId || idx}
                className="p-3.5 rounded-xl border border-[#1E2235] bg-[#161926]/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {item.name} <span className="text-[10px] text-slate-400 font-normal">({item.code})</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Available:{' '}
                    <span className="text-emerald-400 font-bold">
                      {Math.max(
                        0,
                        item.allocatedDays +
                          item.carriedForwardDays -
                          item.usedDays -
                          item.pendingDays -
                          item.encashedDays
                      )}{' '}
                      days
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Allocated</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.allocatedDays}
                      onChange={(e) => handleFieldChange(idx, 'allocatedDays', e.target.value)}
                      className="w-full bg-[#0F111A] border border-[#1E2235] text-white rounded-lg px-2.5 py-1.5 focus:border-[#5E6AD2] focus:outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Carried Over</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.carriedForwardDays}
                      onChange={(e) => handleFieldChange(idx, 'carriedForwardDays', e.target.value)}
                      className="w-full bg-[#0F111A] border border-[#1E2235] text-white rounded-lg px-2.5 py-1.5 focus:border-[#5E6AD2] focus:outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Used Days</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.usedDays}
                      onChange={(e) => handleFieldChange(idx, 'usedDays', e.target.value)}
                      className="w-full bg-[#0F111A] border border-[#1E2235] text-white rounded-lg px-2.5 py-1.5 focus:border-[#5E6AD2] focus:outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">In Review</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.pendingDays}
                      onChange={(e) => handleFieldChange(idx, 'pendingDays', e.target.value)}
                      className="w-full bg-[#0F111A] border border-[#1E2235] text-white rounded-lg px-2.5 py-1.5 focus:border-[#5E6AD2] focus:outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Encashed</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.encashedDays}
                      onChange={(e) => handleFieldChange(idx, 'encashedDays', e.target.value)}
                      className="w-full bg-[#0F111A] border border-[#1E2235] text-white rounded-lg px-2.5 py-1.5 focus:border-[#5E6AD2] focus:outline-hidden text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mandatory Override Justification (Min 5 chars) *
            </label>
            <textarea
              rows="3"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Compensatory leave credit approved by COO for weekend project delivery."
              required
              className="w-full bg-[#161926] border border-[#1E2235] text-slate-200 text-xs rounded-xl p-3 focus:border-[#5E6AD2] focus:outline-hidden resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2235] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1E2235] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-semibold shadow-md shadow-[#5E6AD2]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Saving Override...' : 'Save & Record Audit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BalanceAdjustmentModal;
