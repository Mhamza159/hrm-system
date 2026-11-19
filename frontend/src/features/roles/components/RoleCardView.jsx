/**
 * @file RoleCardView.jsx
 * @description Visual Role Cards Grid View for Enterprise Role Directory.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  Crown,
  Shield,
  Users,
  Layers,
  Lock,
  Edit2,
  Copy,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils.js';
import { Can } from '../../../components/common/Can.jsx';

export function RoleCardView({
  roles = [],
  isLoading = false,
  onViewDetails,
  onEditRole,
  onCloneRole,
  onDeleteRole
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] animate-pulse space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-10 bg-slate-100 dark:bg-slate-800/40 rounded" />
            <div className="h-6 w-full bg-slate-100 dark:bg-slate-800/50 rounded" />
            <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex justify-between">
              <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!roles.length) {
    return null; // Parent handles empty state
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles.map((role) => {
        const isSystem = Boolean(role.isSystem);
        const isActive = role.isActive !== false;
        const userCount = role.userCount || 0;
        const permCount = role.permissions?.length || 0;
        const totalCatalogue = 127;
        const permPercent = Math.min(Math.round((permCount / totalCatalogue) * 100), 100);

        // Extract unique module keys
        const moduleSet = new Set();
        (role.permissions || []).forEach((p) => {
          if (p.action) {
            moduleSet.add(p.action.split('.')[0]);
          }
        });
        const modulesList = Array.from(moduleSet);
        const displayedModules = modulesList.slice(0, 3);
        const remainingModulesCount = Math.max(0, modulesList.length - 3);

        return (
          <div
            key={role._id}
            className={cn(
              'group relative flex flex-col justify-between p-5 rounded-xl border transition-all duration-200',
              'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]',
              'hover:border-[#00C471]/60 hover:shadow-lg dark:hover:shadow-[#00C471]/5 hover:-translate-y-0.5'
            )}
          >
            {/* Header: Title, slug, system badge, active badge */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'p-2 rounded-xl shrink-0',
                      isSystem
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 ring-1 ring-amber-400/20'
                        : 'bg-emerald-50 dark:bg-[#1A3125]/60 text-brand ring-1 ring-[#00C471]/20'
                    )}
                  >
                    {isSystem ? (
                      <Crown className="w-4 h-4" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#00C471] transition-colors leading-tight">
                      {role.name}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      {role.slug || role.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider',
                      isSystem
                        ? 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300/40'
                        : 'bg-indigo-100/70 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-300/40'
                    )}
                  >
                    {isSystem ? 'System Core' : 'Custom'}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isActive ? 'bg-[#00C471]' : 'bg-slate-400'
                      )}
                    />
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[2rem] mb-4">
                {role.description || 'Enterprise role with scoped permissions across modules.'}
              </p>

              {/* Stats Bar: Users Assigned & Permission density */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#061A14]/70 border border-slate-100 dark:border-[#1A3125]/80 space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned Staff:</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {userCount} {userCount === 1 ? 'member' : 'members'}
                  </span>
                </div>

                {/* Permissions count & mini progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Layers className="w-3 h-3 text-[#00C471]" />
                      <span>Permission Coverage:</span>
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {isSystem && role.name === 'Super Admin' ? (
                        <span className="text-[#00C471] font-bold">Full Access (100%)</span>
                      ) : (
                        `${permCount} / ${totalCatalogue} (${permPercent}%)`
                      )}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isSystem && role.name === 'Super Admin'
                          ? 'w-full bg-[#00C471]'
                          : 'bg-gradient-to-r from-[#00C471] to-[#10B981]'
                      )}
                      style={{
                        width: isSystem && role.name === 'Super Admin' ? '100%' : `${permPercent}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Module Scope Tags */}
              <div className="mb-4">
                <div className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 mb-1.5 tracking-wider">
                  Accessible Capabilities
                </div>
                <div className="flex flex-wrap gap-1">
                  {isSystem && role.name === 'Super Admin' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-[#00C471] dark:bg-emerald-950/50 border border-emerald-300/40">
                      All Modules Unrestricted
                    </span>
                  ) : displayedModules.length > 0 ? (
                    <>
                      {displayedModules.map((mod) => (
                        <span
                          key={mod}
                          className="px-2 py-0.5 rounded text-[10px] font-mono capitalize bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {mod.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {remainingModulesCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          +{remainingModulesCount} more
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No permissions assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onViewDetails(role)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Details</span>
              </button>

              <div className="flex items-center gap-1">
                <Can I="role.manage">
                  <button
                    type="button"
                    onClick={() => onCloneRole(role)}
                    title="Clone Role"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </Can>

                <Can I="role.manage">
                  <button
                    type="button"
                    onClick={() => onEditRole(role)}
                    title="Edit Matrix"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#00C471] dark:text-slate-400 dark:hover:text-[#00C471] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </Can>

                <Can I="role.manage">
                  <button
                    type="button"
                    disabled={isSystem || userCount > 0}
                    onClick={() => onDeleteRole(role)}
                    title={
                      isSystem
                        ? 'System core roles cannot be deleted'
                        : userCount > 0
                        ? `Cannot delete role with ${userCount} assigned staff`
                        : 'Delete Role'
                    }
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      isSystem || userCount > 0
                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                        : 'text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer'
                    )}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Can>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RoleCardView;
