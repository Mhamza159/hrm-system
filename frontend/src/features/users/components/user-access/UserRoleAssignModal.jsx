/**
 * @file UserRoleAssignModal.jsx
 * @description Guarded Role Assignment Studio with Privilege Escalation Defense.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  UserCog,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useAssignUserRolesMutation } from '../../usersApi.js';
import { useGetRolesQuery } from '../../../roles/rolesApi.js';
import { useAuth } from '../../../../hooks/useAuth.js';
import { getRoleBadge } from './userAccessTheme.js';

export function UserRoleAssignModal({
  user,
  isOpen,
  onClose,
  onSuccess
}) {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { data: rolesResponse, isLoading: isRolesLoading } = useGetRolesQuery({ limit: 100 }, { skip: !isOpen });
  const allRoles = rolesResponse?.data || [];

  const [assignUserRoles, { isLoading: isSubmitting }] = useAssignUserRolesMutation();
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [justificationReason, setJustificationReason] = useState('');

  useEffect(() => {
    if (user && Array.isArray(user.roles)) {
      const ids = user.roles.map((r) => (typeof r === 'string' ? r : r._id));
      setSelectedRoleIds(ids);
    } else {
      setSelectedRoleIds([]);
    }
    setJustificationReason('');
  }, [user]);

  if (!isOpen || !user) return null;

  const displayName = user.name || user.email?.split('@')[0] || 'User Account';

  // Privilege escalation check: Non-super admins cannot grant Super Admin or permissions they lack
  const isRoleDisabled = (roleItem) => {
    if (!roleItem) return true;
    if (isSuperAdmin) return false;
    if (roleItem.name === 'Super Admin') return true;

    const currentUserActions = new Set();
    for (const r of currentUser?.roles || []) {
      for (const p of r?.permissions || []) {
        currentUserActions.add(p.action);
      }
    }

    for (const p of roleItem.permissions || []) {
      if (p.action !== 'manage' && !currentUserActions.has(p.action)) {
        return true;
      }
    }
    return false;
  };

  const handleToggleRole = (roleId) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== roleId));
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedRoleIds.length === 0) {
      toast.error('User must have at least one assigned role.');
      return;
    }

    try {
      await assignUserRoles({
        userId: user._id,
        roleIds: selectedRoleIds
      }).unwrap();

      toast.success(`Roles updated successfully for ${user.email}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update user roles.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-[#00C471] flex items-center justify-center font-bold border border-emerald-200/80 dark:border-emerald-800/60">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assign System Roles
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure role assignments for <span className="font-semibold text-slate-700 dark:text-slate-200">{displayName}</span> ({user.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Privilege Escalation Info Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#00C471] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Privilege Escalation Protection:</span> Roles containing permissions greater than your active administrator credentials cannot be assigned.
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Eligible System & Custom Roles
            </label>

            {isRolesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Loading available roles catalog...
              </div>
            ) : allRoles.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No roles found in system.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {allRoles.map((roleItem) => {
                  const isChecked = selectedRoleIds.includes(roleItem._id);
                  const disabled = isRoleDisabled(roleItem);
                  const rBadge = getRoleBadge(roleItem.name);

                  return (
                    <label
                      key={roleItem._id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-colors cursor-pointer ${
                        disabled
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-slate-800'
                          : isChecked
                          ? 'bg-emerald-50/50 border-[#00C471] dark:bg-emerald-950/30 dark:border-[#00C471]'
                          : 'bg-white dark:bg-[#0A110D] border-slate-200 dark:border-[#1A3125] hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={disabled}
                        onChange={() => handleToggleRole(roleItem._id)}
                        className="mt-1 w-4 h-4 text-[#00C471] border-slate-300 rounded focus:ring-[#00C471]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {roleItem.name}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${rBadge.colorClass}`}
                          >
                            {roleItem.isSystem ? 'System' : 'Custom'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {roleItem.description || 'Standard corporate role configuration.'}
                        </p>
                        {disabled && (
                          <div className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Exceeds your administrative authorization
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Justification Note */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Assignment Rationale / Audit Note (Optional)
            </label>
            <input
              type="text"
              value={justificationReason}
              onChange={(e) => setJustificationReason(e.target.value)}
              placeholder="e.g. Promoted to Department Manager, Transferred to Operations"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedRoleIds.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-[#00C471] hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Roles...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Role Assignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
