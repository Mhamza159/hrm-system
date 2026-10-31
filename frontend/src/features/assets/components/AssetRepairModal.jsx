/**
 * @file AssetRepairModal.jsx
 * @description Modal for dispatching an asset for external service repair or maintenance.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.4)
 */

import React, { useState } from 'react';
import { X, Wrench } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E2235]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Send Asset for Repair</h3>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issue / Malfunction Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="e.g. Screen flickering, hinge replacement, battery diagnosis"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
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
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden"
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
                value={repairCostPkr}
                onChange={(e) => setRepairCostPkr(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
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
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
              />
            </div>
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
              {isLoading ? 'Dispatching...' : 'Dispatch for Repair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetRepairModal;

