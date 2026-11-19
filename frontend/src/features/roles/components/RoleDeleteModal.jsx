/**
 * @file RoleDeleteModal.jsx
 * @description Guarded Role Deletion Modal with System Immunity & Assigned User Locks.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState } from 'react';
import { Lock, Users, X, Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useDeleteRoleMutation } from '../rolesApi.js';

export function RoleDeleteModal({ isOpen, onClose, role }) {
  const [confirmText, setConfirmText] = useState('');
  const [deleteRole, { isLoading }] = useDeleteRoleMutation();

  if (!isOpen || !role) return null;

  const isSystem = Boolean(role.isSystem);
  const userCount = role.userCount || 0;
  const isBlocked = isSystem || userCount > 0;

  const handleDelete = async () => {
    if (isBlocked) return;
    if (confirmText.trim() !== role.name.trim()) {
      toast.error('Please type the exact role name to confirm deletion.');
      return;
    }

    try {
      await deleteRole(role._id).unwrap();
      toast.success(`Role '${role.name}' deleted successfully.`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete role.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
              {isSystem ? <Lock className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isSystem ? 'System Role Protected' : 'Delete Security Role'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isSystem ? 'Immutable core security boundary' : 'Irreversible role removal action'}
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
        <div className="p-6 space-y-4">
          {/* Case 1: System Role Guard */}
          {isSystem ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Protected System Boundary</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                The role <strong className="font-semibold">{role.name}</strong> is a core system role required for system authorization integrity and root security. System roles cannot be renamed, deactivated, or deleted.
              </p>
            </div>
          ) : userCount > 0 ? (
            /* Case 2: Assigned Users Guard */
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <Users className="w-4 h-4 shrink-0" />
                <span>Active Staff Assignments Detected</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Cannot delete role <strong className="font-semibold">{role.name}</strong> while <strong className="font-mono">{userCount}</strong> staff {userCount === 1 ? 'member is' : 'members are'} assigned to it.
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-500">
                Please reassign or revoke this role from all active employees in User Management before attempting deletion.
              </p>
            </div>
          ) : (
            /* Case 3: Empty Custom Role -> Double Confirmation */
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{role.name}</strong>? This will permanently remove its permission definitions and audit metadata.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type <span className="font-mono font-bold text-red-600 dark:text-red-400">{role.name}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={role.name}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isBlocked ? 'Acknowledge & Close' : 'Cancel'}
          </button>

          {!isBlocked && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading || confirmText.trim() !== role.name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <Trash2 className="w-3.5 h-3.5" />
              <span>Permanently Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoleDeleteModal;
