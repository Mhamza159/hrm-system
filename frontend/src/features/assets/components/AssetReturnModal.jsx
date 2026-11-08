/**
 * @file AssetReturnModal.jsx
 * @description Modal for returning an assigned asset back to the central company inventory.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.2)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { X, RotateCcw, CheckCircle2, User, Building2, Briefcase, AlertCircle } from 'lucide-react';
import { useReturnAssetMutation } from '../assetApi.js';
import { toast } from 'sonner';

export const AssetReturnModal = ({ isOpen, onClose, asset }) => {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [returnAsset, { isLoading }] = useReturnAssetMutation();

  if (!isOpen || !asset) return null;

  const custodian = asset.assignedTo;
  const custodianName = custodian
    ? (custodian.name || `${custodian.firstName || ''} ${custodian.lastName || ''}`.trim() || custodian.employeeCode)
    : null;
  const deptName = custodian?.departmentId?.name || custodian?.departmentId?.code || null;
  const desigTitle = custodian?.designationId?.title || custodian?.designationId?.code || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await returnAsset({
        id: asset._id,
        returnDate,
        condition,
        notes: notes.trim()
      }).unwrap();

      toast.success(`Asset '${asset.assetTag}' returned to inventory.`);
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to return asset.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
              <RotateCcw className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Return Asset to Store</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {asset.assetTag} · {asset.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Returning Custodian Identity Card (T008) */}
          {custodian && (
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-[#1A3125] bg-amber-50/40 dark:bg-[#162820]/60 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Returning Custodian
              </p>
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {custodian.avatar ? (
                    <img
                      src={custodian.avatar}
                      alt={custodianName}
                      className="w-10 h-10 rounded-full object-cover border border-amber-300 dark:border-amber-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-[#111D17] text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-300 dark:border-[#1A3125]">
                      {(custodianName?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      {custodianName}
                    </p>
                    {custodian.employeeCode && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-[#1A3125]">
                        {custodian.employeeCode}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                    {desigTitle && <span>{desigTitle}</span>}
                    {desigTitle && deptName && <span>•</span>}
                    {deptName && <span className="font-medium text-slate-700 dark:text-slate-300">{deptName}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Return Date
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white font-mono tabular-nums focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Returned Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              >
                <option value="good">Good (Fully Operational)</option>
                <option value="fair">Fair (Minor Scuffs / Normal Wear)</option>
                <option value="damaged">Damaged (Requires Repair)</option>
                <option value="unusable">Unusable (Beyond Repair)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Inspection & Handover Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Device returned clean with all original accessories verified."
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#162820] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer hover:shadow-amber-500/20"
            >
              {isLoading ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetReturnModal;
