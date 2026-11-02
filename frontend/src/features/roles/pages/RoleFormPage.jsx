/**
 * @file RoleFormPage.jsx
 * @description Create & Edit Role Page with Visual Permission Matrix, Diff Summary Modal,
 * Sticky Bottom Unsaved Bar, Offline Guards, and System Role Lock Styling.
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.7, 26.8, 26.9, 26.13)
 * - Design System: Elvara Forest & Emerald Enterprise Craft (DESIGN.md)
 * - UX Overhaul: Clear locked styling, auto-growing description with char counter,
 *   pre-save diff summary modal, unsaved changes bottom bar, offline status banner.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  Save,
  Lock,
  Loader2,
  AlertCircle,
  RotateCcw,
  WifiOff,
  Check,
  AlertTriangle,
  FileDiff,
  PlusCircle,
  MinusCircle,
  Sliders,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { PermissionMatrix } from '../components/PermissionMatrix.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import {
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation
} from '../rolesApi.js';
import { cn } from '../../../lib/utils.js';

export default function RoleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const { can, isSuperAdmin } = usePermission();
  const canManageRoles = can('role.manage') || isSuperAdmin;

  // Form Field States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState([]);

  // Original snapshot to detect dirty state and build diff
  const [originalSnapshot, setOriginalSnapshot] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // Modal & Guard States
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor network online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch role details if editing
  const {
    data: roleResponse,
    isLoading: isFetchingRole,
    isError: fetchError,
    refetch
  } = useGetRoleByIdQuery(id, { skip: isNew });

  const roleData = roleResponse?.data;
  const isSystem = Boolean(roleData?.isSystem);
  const isSystemSuperAdmin = isSystem && roleData?.name === 'Super Admin';

  // Synchronize state when existing role loads
  useEffect(() => {
    if (roleData) {
      const initialName = roleData.name || '';
      const initialDesc = roleData.description || '';
      const initialPerms = roleData.permissions || [];

      setName(initialName);
      setDescription(initialDesc);
      setPermissions(initialPerms);
      setOriginalSnapshot({
        name: initialName,
        description: initialDesc,
        permissions: initialPerms
      });
    }
  }, [roleData]);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const isSubmitting = isCreating || isUpdating;

  // Compute Diffs between original snapshot and current state
  const diffSummary = useMemo(() => {
    const origMap = new Map();
    originalSnapshot.permissions.forEach((p) => origMap.set(p.action, p));

    const currMap = new Map();
    permissions.forEach((p) => currMap.set(p.action, p));

    const added = [];
    const removed = [];
    const modified = [];

    // Check for added or modified
    permissions.forEach((curr) => {
      if (!origMap.has(curr.action)) {
        added.push(curr);
      } else {
        const orig = origMap.get(curr.action);
        if (orig.scope !== curr.scope || orig.limit !== curr.limit) {
          modified.push({
            action: curr.action,
            oldScope: orig.scope,
            newScope: curr.scope,
            oldLimit: orig.limit,
            newLimit: curr.limit
          });
        }
      }
    });

    // Check for removed
    originalSnapshot.permissions.forEach((orig) => {
      if (!currMap.has(orig.action)) {
        removed.push(orig);
      }
    });

    const isNameChanged = name.trim() !== originalSnapshot.name.trim();
    const isDescChanged = description.trim() !== originalSnapshot.description.trim();
    const isPermsChanged = added.length > 0 || removed.length > 0 || modified.length > 0;
    const isDirty = isNameChanged || isDescChanged || isPermsChanged;

    return {
      added,
      removed,
      modified,
      totalChanges: added.length + removed.length + modified.length,
      isNameChanged,
      isDescChanged,
      isDirty
    };
  }, [originalSnapshot, name, description, permissions]);

  // Discard all changes
  const handleDiscardChanges = useCallback(() => {
    setName(originalSnapshot.name);
    setDescription(originalSnapshot.description);
    setPermissions(originalSnapshot.permissions);
    setShowDiscardConfirm(false);
    toast.info('Changes discarded.');
  }, [originalSnapshot]);

  // Navigation Cancel Guard
  const handleCancelClick = () => {
    if (diffSummary.isDirty) {
      setShowDiscardConfirm(true);
    } else {
      navigate('/roles');
    }
  };

  // Trigger Save (show diff modal first if there are permission changes in edit mode)
  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Role name is required.');
      return;
    }
    if (isOffline) {
      toast.error('Cannot save while offline. Reconnect to internet.');
      return;
    }

    if (!isNew && diffSummary.totalChanges > 0) {
      setShowDiffModal(true);
    } else {
      executeSave();
    }
  };

  // Perform actual API persistence
  const executeSave = async () => {
    setShowDiffModal(false);
    try {
      if (isNew) {
        const res = await createRole({
          name: name.trim(),
          description: description.trim(),
          permissions
        }).unwrap();
        toast.success(`Custom role '${res?.data?.name || name}' created successfully.`);
        navigate('/roles');
      } else {
        await updateRole({
          id,
          name: isSystem ? undefined : name.trim(),
          description: description.trim(),
          permissions
        }).unwrap();
        toast.success(`Role '${roleData?.name || name}' updated successfully.`);
        navigate('/roles');
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save role configuration.');
    }
  };

  if (!isNew && isFetchingRole) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <span className="text-sm font-semibold">Loading role specifications...</span>
      </div>
    );
  }

  if (!isNew && fetchError) {
    return (
      <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 space-y-4 max-w-xl mx-auto mt-12 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Role Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested role ID could not be retrieved from the security catalogue.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => navigate('/roles')}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
          >
            Return to Roles
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveClick} className="space-y-6 max-w-5xl pb-24">
      {/* 1. Header with Status & Save Controls */}
      <PageHeader
        title={isNew ? 'Create Custom Role' : `Edit Role: ${roleData?.name || name}`}
        description={
          isNew
            ? 'Define a new security role with customized action grants and operational scopes.'
            : isSystem
            ? 'System Core Role: Permission rules can be tuned; name and identity remain locked.'
            : 'Modify role metadata, permissions, and departmental authorization limits.'
        }
        compactClock={true}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCancelClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#14261D] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>

            {canManageRoles && !isSystemSuperAdmin && (
              <button
                type="submit"
                disabled={isSubmitting || isOffline}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-[#049856] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer"
                title={isOffline ? 'Offline: Reconnect to save changes' : undefined}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isNew ? 'Create Role' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        }
      />

      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Working Offline:</strong> Network connection lost. Changes can still be previewed
            locally, but saving is disabled until internet connectivity is restored.
          </span>
        </div>
      )}

      {/* Read-Only Permission Denied Banner */}
      {!canManageRoles && (
        <div className="p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-3">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Read-Only Mode:</strong> You possess view authorization for role specifications,
            but lack <code className="font-mono text-[11px]">role.manage</code> privilege to modify rules.
          </span>
        </div>
      )}

      {/* System Core Role Lock Banner */}
      {isSystem && (
        <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
          <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>System Protected Role:</strong> Core identity and role name are locked against modification.
            {isSystemSuperAdmin
              ? ' Super Admin permissions are permanent and cannot be altered.'
              : ' You may inspect and customize specific operational permission rules.'}
          </span>
        </div>
      )}

      {/* 2. Role Metadata Card with Styled Locked Fields & Textarea Counter */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand" />
          Role Specifications & Identity
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Role Name <span className="text-rose-500">*</span>
              </label>
              {isSystem && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/60">
                  <Lock className="w-2.5 h-2.5" />
                  Locked for system roles
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                required
                disabled={isSystem || !canManageRoles}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lead Talent Acquisition Specialist"
                className={cn(
                  'w-full px-3.5 py-2.5 text-xs rounded-xl border transition-all shadow-2xs font-medium',
                  isSystem
                    ? 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0E1A14] text-slate-700 dark:text-slate-300 cursor-not-allowed select-none pl-9'
                    : 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'
                )}
              />
              {isSystem && (
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
            {isSystem && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                System role names are mapped to native PBAC policies and cannot be modified.
              </p>
            )}
          </div>

          {/* Description Multi-line Textarea with Char Counter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {description.length}/300
              </span>
            </div>

            <textarea
              rows={2}
              maxLength={300}
              disabled={!canManageRoles || isSystemSuperAdmin}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the operational privileges and duties governed by this role..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-2xs resize-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Visual Permission Matrix Component */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm">
        <PermissionMatrix
          value={permissions}
          onChange={setPermissions}
          readOnly={!canManageRoles || isSystemSuperAdmin}
        />
      </div>

      {/* 4. Sticky Bottom Action Bar on Unsaved Changes */}
      {diffSummary.isDirty && canManageRoles && !isSystemSuperAdmin && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-3xl bg-slate-900/95 dark:bg-[#13221B]/95 text-white backdrop-blur-md p-3.5 px-5 rounded-2xl border border-slate-700/60 dark:border-[#1A3125] shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-xs font-semibold">
              {diffSummary.totalChanges} {diffSummary.totalChanges === 1 ? 'permission change' : 'permission changes'} pending
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isOffline}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand hover:bg-[#049856] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 5. Pre-Save Diff Summary Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-brand border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                <FileDiff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Review Permission Changes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inspect the differential impact before committing modifications to '{name}'.
                </p>
              </div>
            </div>

            {/* Warning if System Role */}
            {isSystem && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>System Core Warning:</strong> Modifying permissions on a core system role
                  directly updates authorization bounds for all current users inheriting this role.
                </span>
              </div>
            )}

            {/* Diff Lists Container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 text-xs">
              {/* Added Rules */}
              {diffSummary.added.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Granted Permissions (+{diffSummary.added.length})</span>
                  </div>
                  <div className="space-y-1 pl-5">
                    {diffSummary.added.map((r) => (
                      <div key={r.action} className="flex items-center justify-between text-slate-700 dark:text-slate-300 bg-emerald-50/40 dark:bg-emerald-950/20 p-1.5 rounded-lg border border-emerald-200/40">
                        <span className="font-mono text-[11px]">{r.action}</span>
                        <span className="text-[10px] uppercase font-bold text-brand bg-white dark:bg-black/30 px-1.5 py-0.5 rounded">
                          {r.scope}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modified Rules */}
              {diffSummary.modified.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Scope / Limit Adjusted ({diffSummary.modified.length})</span>
                  </div>
                  <div className="space-y-1 pl-5">
                    {diffSummary.modified.map((m) => (
                      <div key={m.action} className="text-slate-700 dark:text-slate-300 bg-blue-50/40 dark:bg-blue-950/20 p-1.5 rounded-lg border border-blue-200/40">
                        <div className="font-mono text-[11px]">{m.action}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Scope: <span className="line-through">{m.oldScope}</span> $\rightarrow$ <span className="font-bold text-blue-600 dark:text-blue-400">{m.newScope}</span>
                          {m.oldLimit !== m.newLimit && (
                            <span className="ml-2">
                              Limit: {m.oldLimit ?? 'None'} $\rightarrow$ {m.newLimit ?? 'None'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed Rules */}
              {diffSummary.removed.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Revoked Permissions (-{diffSummary.removed.length})</span>
                  </div>
                  <div className="space-y-1 pl-5">
                    {diffSummary.removed.map((r) => (
                      <div key={r.action} className="flex items-center justify-between text-slate-700 dark:text-slate-300 bg-rose-50/40 dark:bg-rose-950/20 p-1.5 rounded-lg border border-rose-200/40">
                        <span className="font-mono text-[11px]">{r.action}</span>
                        <span className="text-[10px] uppercase text-rose-600 bg-white dark:bg-black/30 px-1.5 py-0.5 rounded">
                          Revoked
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1A3125]">
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#14261D] transition-colors cursor-pointer"
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-[#049856] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Confirm & Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this role specification. Discarding will revert all field values and matrix toggles to their last saved state."
        confirmText="Discard Changes"
        isDestructive={true}
        onConfirm={handleDiscardChanges}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </form>
  );
}
