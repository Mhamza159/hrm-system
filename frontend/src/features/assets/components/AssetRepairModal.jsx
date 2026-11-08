/**
 * @file AssetRepairModal.jsx
 * @description Modal for dispatching an asset for external service repair or maintenance.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.4)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { X, Wrench, AlertCircle } from 'lucide-react';
import { useSendAssetForRepairMutation } from '../assetApi.js';
import { toast } from 'sonner';

export const AssetRepairModal = ({ isOpen, onClose, asset }) => {
  const [issueDescription, setIssueDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [repairCostPkr, setRepairCostPkr] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [sendAssetForRepair, { isLoading }] = useSendAssetForRepairMutation();

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!issueDescription.trim()) {
      setErrorMsg('Please describe the fault or malfunction.');
      return;
    }
    if (!vendorName.trim()) {
      setErrorMsg('Vendor or service center name is required.');
      return;
    }

    try {
      await sendAssetForRepair({
        id: asset._id,
        issueDescription: issueDescription.trim(),
        vendorName: vendorName.trim(),
        repairCostPaisa: repairCostPkr ? Math.round(parseFloat(repairCostPkr) * 100) : 0,
        expectedReturnDate: expectedReturnDate || null
      }).unwrap();

      toast.success(`Asset '${asset.assetTag}' dispatched for service repair.`);
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to dispatch asset for repair.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
              <Wrench className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Send Asset for Repair</h3>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issue / Malfunction Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="e.g. Screen flickering, hinge replacement, battery diagnosis"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Service Vendor / Repair Center <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. Authorized Lenovo Support Center"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Cost (PKR)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={repairCostPkr}
                onChange={(e) => setRepairCostPkr(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white font-mono tabular-nums focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Return Date
              </label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white font-mono tabular-nums focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
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
              {isLoading ? 'Dispatching...' : 'Dispatch for Repair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetRepairModal;
