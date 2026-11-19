/**
 * @file RoleFormPage.jsx
 * @description Create & Edit Role Page with Visual Permission Matrix, Diff Summary Modal,
 * Sticky Bottom Unsaved Bar, Offline Guards, and System Role Lock Styling.
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.7, 26.8, 26.9, 26.13)
 * - Design System: Elvara Forest & Emerald Enterprise Craft (DESIGN.md)
 * - Studio UI: Breadcrumb header, locked system badges (Crown), monospace slug,
 *   auto-counting description (0/200), active status toggle, pre-save diff modal,
 *   sticky bottom unsaved bar, and beforeunload departure guards.
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
  WifiOff,
  Crown,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { PermissionMatrix } from '../components/PermissionMatrix.jsx';
import { PermissionDiffModal } from '../components/PermissionDiffModal.jsx';
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
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // Original snapshot to detect dirty state and build diff
  const [originalSnapshot, setOriginalSnapshot] = useState({
    name: '',
    description: '',
    isActive: true,
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
      const initialActive = roleData.isActive !== false;
      const initialPerms = roleData.permissions || [];

      setName(initialName);
      setDescription(initialDesc);
      setIsActive(initialActive);
      setPermissions(initialPerms);
      setOriginalSnapshot({
        name: initialName,
        description: initialDesc,
        isActive: initialActive,
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
    const modifiedScope = [];
    const modifiedLimit = [];

    // Check for added or modified
    permissions.forEach((curr) => {
      if (!origMap.has(curr.action)) {
        added.push(curr);
      } else {
        const orig = origMap.get(curr.action);
        if (orig.scope !== curr.scope) {
          modifiedScope.push({
            action: curr.action,
            from: orig.scope,
            to: curr.scope
          });
        }
        if (orig.limit !== curr.limit) {
          modifiedLimit.push({
            action: curr.action,
            from: orig.limit,
            to: curr.limit
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

    const isNameChanged = name.trim() !== (originalSnapshot.name || '').trim();
    const isDescChanged = description.trim() !== (originalSnapshot.description || '').trim();
    const isStatusChanged = isActive !== originalSnapshot.isActive;
    const totalChanges = added.length + removed.length + modifiedScope.length + modifiedLimit.length;
    const isDirty = isNameChanged || isDescChanged || isStatusChanged || totalChanges > 0;

    return {
      added,
      removed,
      modifiedScope,
      modifiedLimit,
      totalChanges,
      isNameChanged,
      isDescChanged,
      isStatusChanged,
      isDirty
    };
  }, [originalSnapshot, name, description, isActive, permissions]);

  // Warn on uncommitted browser reload/navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (diffSummary.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [diffSummary.isDirty]);

  // Derived slug for display
  const computedSlug = useMemo(() => {
    if (roleData?.slug) return roleData.slug;
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }, [roleData?.slug, name]);

  // Discard all changes
  const handleDiscardChanges = useCallback(() => {
    setName(originalSnapshot.name);
    setDescription(originalSnapshot.description);
    setIsActive(originalSnapshot.isActive);
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
          isActive,
          permissions
        }).unwrap();
        toast.success(`Custom role '${res?.data?.name || name}' created successfully.`);
        navigate('/roles');
      } else {
        await updateRole({
          id,
          name: isSystem ? undefined : name.trim(),
          description: description.trim(),
          isActive: isSystem ? undefined : isActive,
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
    <form onSubmit={handleSaveClick} className="space-y-6 max-w-5xl pb-28">
      {/* 0. Breadcrumb Navigation Ribbon */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={handleCancelClick}
          className="hover:text-brand transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
        >
          <Shield className="w-3.5 h-3.5 text-brand" />
          <span>Roles & Permissions</span>
        </button>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {isNew ? 'Create Custom Role' : (roleData?.name || name)}
        </span>
      </nav>

      {/* 1. Header with Status & Save Controls */}
      <PageHeader
        title={
          <div className="flex items-center gap-2.5 flex-wrap">
            <span>{isNew ? 'Create Custom Role' : `Edit Role: ${roleData?.name || name}`}</span>
            {isSystem && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60 shadow-2xs">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>Core System Role</span>
              </span>
            )}
          </div>
        }
        description={
          isNew
            ? 'Define a new security role with customized action grants and operational scopes.'
            : isSystem
            ? 'System Core Role: Permission matrix can be customized; role name and identity remain locked.'
            : 'Modify role metadata, permissions matrix, and departmental authorization limits.'
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

      {/* 2. Role Metadata Card with Styled Locked Fields, Status Switch & Textarea Counter */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand" />
            Role Specifications & Identity
          </h3>
          {/* Active / Inactive Status Toggle */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 cursor-pointer">
              <span>Status:</span>
              <button
                type="button"
                disabled={isSystem || !canManageRoles}
                onClick={() => setIsActive((prev) => !prev)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand/20',
                  isActive ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-700',
                  (isSystem || !canManageRoles) && 'opacity-60 cursor-not-allowed'
                )}
                role="switch"
                aria-checked={isActive}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
              <span className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider',
                isActive
                  ? 'text-brand bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
              )}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>
        </div>

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

            {/* Slug Monospace Pill */}
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
              <Hash className="w-3 h-3 text-slate-400" />
              <span>Identifier Slug:</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#061A14] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#1A3125]">
                {computedSlug || 'untitled-role'}
              </span>
            </div>
          </div>

          {/* Description Multi-line Textarea with Char Counter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {description.length}/200
              </span>
            </div>

            <textarea
              rows={2}
              maxLength={200}
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
              {diffSummary.totalChanges > 0
                ? `${diffSummary.totalChanges} permission change${diffSummary.totalChanges === 1 ? '' : 's'} pending`
                : 'Metadata changes pending'}
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
                  <span>{diffSummary.totalChanges > 0 && !isNew ? 'Review & Save' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 5. Pre-Save Diff Summary Modal */}
      <PermissionDiffModal
        isOpen={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        onConfirm={executeSave}
        diffSummary={diffSummary}
        isSystem={isSystem}
        roleName={roleData?.name || name}
        isSubmitting={isSubmitting}
      />

      {/* 6. Discard Confirmation Modal */}
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
