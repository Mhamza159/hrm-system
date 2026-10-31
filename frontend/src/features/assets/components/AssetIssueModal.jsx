/**
 * @file AssetIssueModal.jsx
 * @description Modal for employees to report defect, malfunction, or damage on assigned equipment.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.6)
 */

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useReportAssetIssueMutation } from '../assetApi.js';
import { toast } from 'sonner';

const ISSUE_TYPES = [
  { value: 'hardware_failure', label: 'Hardware Failure / Will Not Power On' },
  { value: 'screen_damage', label: 'Screen Display / Crack' },
  { value: 'battery_problem', label: 'Battery / Charging Issue' },
  { value: 'keyboard_trackpad', label: 'Keyboard / Trackpad Defect' },
  { value: 'software_license', label: 'License Expired / Software Problem' },
  { value: 'network_wifi', label: 'Wi-Fi / Network Adapter Fault' },
  { value: 'other', label: 'Other Defect' }
];

export const AssetIssueModal = ({ isOpen, onClose, asset }) => {
  const [issueType, setIssueType] = useState('hardware_failure');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [reportIssue, { isLoading }] = useReportAssetIssueMutation();

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim()) {
      setErrorMsg('Please describe the problem or fault.');
      return;
    }

    try {
      await reportIssue({
        id: asset._id,
        issueType,
        severity,
        description: description.trim()
      }).unwrap();

      toast.success('Defect report submitted to HR support.');
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to submit issue report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E2235]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Report Equipment Defect</h3>
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
              Issue Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden"
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Urgency / Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
            >
              <option value="low">Low (Cosmetic / Minor Inconvenience)</option>
              <option value="medium">Medium (Workable with Workaround)</option>
              <option value="high">High (Severely Impairs Work)</option>
              <option value="critical">Critical (Completely Dead / Inoperable)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Problem Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe symptoms, when it started, and steps to reproduce..."
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
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-all shadow-xs"
            >
              {isLoading ? 'Submitting...' : 'Submit Issue Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetIssueModal;

