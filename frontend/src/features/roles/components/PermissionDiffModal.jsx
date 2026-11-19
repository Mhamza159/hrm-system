/**
 * @file PermissionDiffModal.jsx
 * @description Pre-save differential review modal for role permission changes.
 * Compares current working permissions against original database snapshot.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  FileDiff,
  X,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Sliders,
  Loader2,
  Check
} from 'lucide-react';

export function PermissionDiffModal({
  isOpen,
  onClose,
  onConfirm,
  diffSummary = {},
  isSystem = false,
  roleName = '',
  isSubmitting = false
}) {
  if (!isOpen) return null;

  const {
    added = [],
    removed = [],
    modifiedScope = [],
    modifiedLimit = [],
    totalChanges = 0
  } = diffSummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#1A3125] text-brand border border-emerald-200/60 dark:border-[#00C471]/30">
              <FileDiff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Review Permission Differential
              </h3>
              <p className="text-[11px] text-slate-400">
                Auditing {totalChanges} modification{totalChanges === 1 ? '' : 's'} on '{roleName}'
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* System Role Warning */}
          {isSystem && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>System Core Warning:</strong> Modifying permissions on a core system role
                directly affects all staff members currently assigned to it.
              </span>
            </div>
          )}

          {/* Added Permissions */}
          {added.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand uppercase tracking-wider">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Granted Permissions (+{added.length})</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 space-y-1 max-h-36 overflow-y-auto">
                {added.map((item) => (
                  <div
                    key={item.action}
                    className="flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{item.action}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-brand dark:bg-emerald-900/50 dark:text-[#00C471] uppercase">
                      scope: {item.scope || 'all'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modified Scopes */}
          {modifiedScope.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5" />
                <span>Modified Data Scopes (~{modifiedScope.length})</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/40 space-y-1 max-h-36 overflow-y-auto">
                {modifiedScope.map((item) => (
                  <div
                    key={item.action}
                    className="flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{item.action}</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase">
                      {item.from} &rarr; <strong>{item.to}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modified Limits */}
          {modifiedLimit.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5" />
                <span>Modified Approval Limits (~{modifiedLimit.length})</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 space-y-1 max-h-36 overflow-y-auto">
                {modifiedLimit.map((item) => (
                  <div
                    key={item.action}
                    className="flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{item.action}</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400">
                      limit: {item.from ?? 'none'} &rarr; <strong>{item.to ?? 'none'}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revoked Permissions */}
          {removed.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                <MinusCircle className="w-3.5 h-3.5" />
                <span>Revoked Permissions (-{removed.length})</span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/40 space-y-1 max-h-36 overflow-y-auto">
                {removed.map((item) => (
                  <div
                    key={item.action}
                    className="flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-slate-800 dark:text-slate-200">{item.action}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                      revoked
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand hover:bg-[#049856] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Apply Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PermissionDiffModal;
