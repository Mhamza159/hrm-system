/**
 * @file ArchiveConfirmationModal.jsx
 * @description Confirmation modal for archiving or restoring an announcement.
 */

import React from 'react';
import { Archive, RotateCcw, X } from 'lucide-react';

export function ArchiveConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  announcementTitle = '',
  isRestoring = false,
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isRestoring
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-[#00C471]'
                : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-500'
            }`}
          >
            {isRestoring ? <RotateCcw className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {isRestoring ? 'Restore Announcement?' : 'Archive Announcement?'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isRestoring ? (
              <>
                Restore <strong className="text-slate-800 dark:text-slate-200 font-semibold">"{announcementTitle}"</strong> back to the active notice board? Staff will see this notice in their active feeds again.
              </>
            ) : (
              <>
                Archive <strong className="text-slate-800 dark:text-slate-200 font-semibold">"{announcementTitle}"</strong>? It will be moved to the dedicated Archive tab while preserving all verified reader receipts and engagement records.
              </>
            )}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162820] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 ${
              isRestoring
                ? 'bg-[#00C471] hover:bg-emerald-600 text-slate-950'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
            }`}
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isRestoring ? (
              <RotateCcw className="w-3.5 h-3.5" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
            <span>{isRestoring ? 'Restore to Active' : 'Archive Notice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArchiveConfirmationModal;
