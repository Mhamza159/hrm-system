/**
 * @file RoleFormPage.jsx
 * @description Create & Edit Role Page with integrated visual Permission Matrix.
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.7, 26.8, 26.9, 26.13)
 * - Layer: Frontend Feature Page
 * - Integrates PermissionMatrix component, Zod-aligned inputs, and RTK Query mutations.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  Save,
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { PermissionMatrix } from '../components/PermissionMatrix.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import {
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation
} from '../rolesApi.js';

export default function RoleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const { can, isSuperAdmin } = usePermission();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState([]);

  // Fetch role details if editing
  const {
    data: roleResponse,
    isLoading: isFetchingRole,
    isError: fetchError
  } = useGetRoleByIdQuery(id, { skip: isNew });

  const roleData = roleResponse?.data;
  const isSystem = Boolean(roleData?.isSystem);

  // Synchronize state when existing role loads
  useEffect(() => {
    if (roleData) {
      setName(roleData.name || '');
      setDescription(roleData.description || '');
      setPermissions(roleData.permissions || []);
    }
  }, [roleData]);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Role name is required.');
      return;
    }

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
        <Loader2 className="w-8 h-8 animate-spin text-[#00C471]" />
        <span className="text-sm font-medium">Loading role specifications...</span>
      </div>
    );
  }

  if (!isNew && fetchError) {
    return (
      <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 space-y-3">
        <div className="flex items-center gap-2 font-bold">
          <AlertCircle className="w-5 h-5" />
          <span>Role Not Found</span>
        </div>
        <p className="text-xs">
          The requested role ID could not be retrieved or has been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/roles')}
          className="text-xs font-semibold text-rose-700 underline"
        >
          Return to Roles List
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      {/* Header with Navigation and Submit Action */}
      <PageHeader
        title={isNew ? 'Create Custom Role' : `Edit Role: ${roleData?.name || name}`}
        description={
          isNew
            ? 'Define a new security role with customized action grants and operational scopes.'
            : isSystem
            ? 'System Core Role: Permission rules can be tuned; name and identity remain locked.'
            : 'Modify role metadata, permissions, and departmental authorization limits.'
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/roles')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#14261D] text-xs font-semibold shadow-2xs transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#00B065] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
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
          </div>
        }
      />

      {/* System Role Lock Warning Banner */}
      {isSystem && (
        <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
          <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>System Protected Role:</strong> This core role cannot be renamed or deleted.
            You may inspect and adjust individual permission rules.
          </span>
        </div>
      )}

      {/* Role Metadata Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00C471]" />
          Role Identification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Role Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isSystem}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Talent Acquisition Lead"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of duties and privileges"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Visual Permission Matrix Component */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm">
        <PermissionMatrix
          value={permissions}
          onChange={setPermissions}
          readOnly={isSystem && roleData?.name === 'Super Admin'}
        />
      </div>
    </form>
  );
}
