/**
 * @file PolicyVersionHistoryModal.jsx
 * @description Audit timeline and snapshot reader for immutable policy version ledger.
 */

import React, { useState } from 'react';
import {
  X,
  History,
  Calendar,
  User,
  Eye,
  FileText
} from 'lucide-react';
import { useGetPolicyVersionsQuery } from '../policyApi.js';

export const PolicyVersionHistoryModal = ({ isOpen, onClose, policy }) => {
  const { data: versionsData, isLoading } = useGetPolicyVersionsQuery(
    policy?._id,
    { skip: !policy?._id || !isOpen }
  );
  const rawVersions = versionsData?.data || (Array.isArray(versionsData) ? versionsData : []);
  const versions = Array.isArray(rawVersions) ? rawVersions : [];

  const [selectedVersion, setSelectedVersion] = useState(null);

  if (!isOpen || !policy) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/15 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Policy Version History & Revisions
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                {policy.title} ({policy.policyCode}) · Current Active: v{policy.version}
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading version audit ledger...</div>
          ) : versions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-[#0C1712] rounded-xl border border-slate-200 dark:border-[#1A3125]">
              No past historical revisions recorded yet. Current active version is v{policy.version}.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((ver) => {
                const isActive = ver.version === policy.version;
                const isViewing = selectedVersion?._id === ver._id;

                return (
                  <div
                    key={ver._id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'border-[#00C471]/50 bg-emerald-500/5 dark:bg-[#162820]/40'
                        : 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125]">
                            v{ver.version}
                          </span>
                          {isActive ? (
                            <span className="text-[10px] font-bold text-[#00C471] bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              Active Version
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-[#162820] px-2 py-0.5 rounded-full">
                              Superseded
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {ver.createdAt ? new Date(ver.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>

                        {ver.changeSummary && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium pt-1">
                            {ver.changeSummary}
                          </p>
                        )}

                        <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-0.5">
                          {ver.createdBy && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {ver.createdBy.name || 'Admin'}
                            </span>
                          )}
                          {ver.acknowledgementCount !== undefined && (
                            <span>
                              {ver.acknowledgementCount} digital sign-offs
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedVersion(isViewing ? null : ver)}
                        className="h-8 px-3 rounded-lg border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162820] flex items-center gap-1.5 transition shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isViewing ? 'Hide Snapshot' : 'Inspect'}</span>
                      </button>
                    </div>

                    {/* Snapshot Preview Accordion */}
                    {isViewing && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>Snapshot Content (v{ver.version})</span>
                        </h5>
                        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans max-h-60 overflow-y-auto leading-relaxed">
                          {ver.content}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] flex justify-end bg-slate-50/50 dark:bg-[#0C1712]/50">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyVersionHistoryModal;
