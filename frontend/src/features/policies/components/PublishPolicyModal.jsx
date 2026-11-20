/**
 * @file PublishPolicyModal.jsx
 * @description Final publishing confirmation modal with effective date selector and workforce notification trigger.
 */

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Bell,
  Calendar,
  AlertCircle,
  FileCheck,
  Users
} from 'lucide-react';
import { usePublishPolicyMutation } from '../policyApi.js';

export const PublishPolicyModal = ({ isOpen, onClose, policy, onSuccess }) => {
  const [publishPolicy, { isLoading: isPublishing }] = usePublishPolicyMutation();

  const [effectiveDate, setEffectiveDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [notifyWorkforce, setNotifyWorkforce] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !policy) return null;

  const handlePublish = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      await publishPolicy({
        id: policy._id,
        effectiveDate,
        notifyWorkforce
      }).unwrap();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || 'Failed to publish policy.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/15 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Publish Company Policy
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Deploy approved policy into active workforce enforcement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handlePublish} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Policy Summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-[#7E9E8F]">
                {policy.policyCode}
              </span>
              <span className="font-mono text-xs text-slate-400">v{policy.version}</span>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded-full ml-auto">
                {policy.status}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {policy.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#7E9E8F] pt-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Scope: {policy.scope}</span>
              {policy.requiresAcknowledgement && (
                <span className="text-violet-600 dark:text-violet-400 font-semibold ml-2">
                  · Mandatory Sign-off Required
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>Enforcement Effective Date *</span>
            </label>
            <input
              type="date"
              required
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
            />
          </div>

          {/* Multi-channel Notification Option */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Notify Eligible Workforce
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">
                  Dispatch in-app notifications and alerts to all targeted personnel
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyWorkforce}
                onChange={(e) => setNotifyWorkforce(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-[#00C471]" />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPublishing}
              className="h-9 px-5 rounded-lg bg-[#00C471] hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isPublishing ? 'Publishing...' : 'Publish Policy Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublishPolicyModal;
