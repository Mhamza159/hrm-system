/**
 * @file AssetReturnModal.jsx
 * @description Modal for returning an assigned asset back to the central company inventory.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.2)
 */

import React, { useState } from 'react';
import { X, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useReturnAssetMutation } from '../assetApi.js';
import { toast } from 'sonner';

export const AssetReturnModal = ({ isOpen, onClose, asset }) => {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [returnAsset, { isLoading }] = useReturnAssetMutation();

  if (!isOpen || !asset) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E2235]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Return Asset to Store</h3>
              <p className="text-xs text-slate-500 font-mono">{asset.assetTag} · {asset.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl">
              {errorMsg}
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
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Returned Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
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
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1E2235]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-xs"
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

