/**
 * @file AssetArchiveDetailModal.jsx
 * @description Archive inspection modal for decommissioned/archived assets with Revert and Permanent Delete controls.
 * 
 * SPECIFICATION & BUSINESS RULES:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.1)
 * - Critical Rule: If an asset has been assigned to a user, it must NOT be permanently deleted.
 * - Actions: Revert (restore to active) & Permanent Delete (with safety checks).
 */

import React, { useState } from 'react';
import {
  X,
  Archive,
  RotateCcw,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Laptop,
  CheckCircle2,
  Calendar,
  Tag,
  DollarSign
} from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';

export const AssetArchiveDetailModal = ({
  isOpen,
  onClose,
  asset,
  onRevert,
  onPermanentDelete,
  isReverting = false,
  isDeleting = false
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !asset) return null;

  const isAssigned = asset.status === 'assigned' || Boolean(asset.assignedTo);
  const assignedEmp = asset.assignedTo;
  const assignedEmpName = assignedEmp
    ? (assignedEmp.name || `${assignedEmp.firstName || ''} ${assignedEmp.lastName || ''}`.trim() || assignedEmp.employeeCode)
    : null;

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0B1511]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-[#1A3125]">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-[#1A3125] text-slate-700 dark:text-slate-300">
                  {asset.assetTag}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Archived Record
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                {asset.name}
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Critical Assignment Notice if Assigned */}
          {isAssigned ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Assigned Asset — Deletion Prohibited</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                This asset is currently registered under custodian <strong>{assignedEmpName}</strong>. By company policy, assets with active custodians cannot be deleted. You must revert and return it to inventory first.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 text-[11px]">
              This asset is archived and hidden from active inventory. You can restore it to the active pool or permanently delete it.
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
              <span className="text-slate-400 block text-[10px]">Category Type</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">
                {asset.type?.replace('_', ' ') || 'Hardware'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
              <span className="text-slate-400 block text-[10px]">Serial Number</span>
              <span className="font-mono font-bold text-slate-900 dark:text-emerald-400">
                {asset.serialNumber || 'N/A'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
              <span className="text-slate-400 block text-[10px]">Model</span>
              <span className="font-medium text-slate-900 dark:text-white truncate block">
                {asset.modelNumber || 'Standard'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
              <span className="text-slate-400 block text-[10px]">Last Updated</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {asset.updatedAt ? formatDate(asset.updatedAt) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Double Confirmation Warning for Permanent Deletion */}
          {confirmDelete && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirm Permanent Removal</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400">
                Are you absolutely sure? This will permanently wipe <strong>{asset.assetTag}</strong> and all its history from the database. This action is irreversible.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0B1511]/50 flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E362B] transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {/* Revert Action */}
            <button
              onClick={() => onRevert(asset)}
              disabled={isReverting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] text-white hover:bg-[#049856] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isReverting ? 'Restoring...' : 'Revert to Active'}</span>
            </button>

            {/* Permanent Delete Action */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={isAssigned || isDeleting}
                title={isAssigned ? 'Assigned assets cannot be deleted' : 'Permanently delete'}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  isAssigned
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 cursor-pointer'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            ) : (
              <button
                onClick={() => onPermanentDelete(asset)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Forever'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetArchiveDetailModal;
