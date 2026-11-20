/**
 * @file RoleCloneModal.jsx
 * @description Role Cloning Modal for rapid creation of custom roles from existing templates.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState, useEffect } from 'react';
import { Copy, X, Loader2, Shield, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useCloneRoleMutation } from '../rolesApi.js';

export function RoleCloneModal({ isOpen, onClose, role, onCloned }) {
  const [newName, setNewName] = useState('');
  const [cloneRole, { isLoading }] = useCloneRoleMutation();

  useEffect(() => {
    if (role) {
      setNewName(`Copy of ${role.name}`);
    } else {
      setNewName('');
    }
  }, [role]);

  if (!isOpen || !role) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('Role name cannot be empty.');
      return;
    }
    if (trimmed.toLowerCase() === role.name.toLowerCase()) {
      toast.error('New role name must differ from the source role.');
      return;
    }

    try {
      const res = await cloneRole({
        id: role._id,
        newName: trimmed
      }).unwrap();

      toast.success(`Role '${res?.data?.name || trimmed}' created successfully.`);
      onClose();
      if (onCloned && res?.data?._id) {
        onCloned(res.data._id);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to clone role.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#1A3125] text-brand">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Clone Security Role
              </h3>
              <p className="text-[11px] text-slate-400">
                Duplicate permissions into a new custom tenant role
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

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Source Role Snapshot */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-100 dark:border-[#1A3125] text-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span>Source Role:</span>
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-brand" />
                  {role.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Permissions to inherit:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#00C471]" />
                  {role.permissions?.length || 0} actions
                </span>
              </div>
            </div>

            {/* Target Role Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Associate Project Manager"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The cloned role will be created as an active custom role with full edit rights.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !newName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand hover:bg-[#049856] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Clone Role</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoleCloneModal;
