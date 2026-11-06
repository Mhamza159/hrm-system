/**
 * @file PermissionDeniedState.jsx
 * @description State 7: Contextual 403 Authorization Fallback.
 * Strictly satisfies Rule 7: Explain why you need it and provide a way back.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * @param {Object} props
 * @param {string} [props.permission] - Required permission key (e.g. 'payroll.manage', 'employee.delete')
 * @param {string|string[]} [props.requiredRoles] - Allowed role(s)
 * @param {string} [props.reason] - Contextual reason why this is restricted
 * @param {Function} [props.onRequestAccess] - Action to request access
 * @param {string} [props.returnUrl='/'] - Return route
 * @param {string} [props.className]
 */
export function PermissionDeniedState({
  permission = null,
  requiredRoles = null,
  reason = null,
  onRequestAccess = null,
  returnUrl = '/',
  className = ''
}) {
  const rolesList = Array.isArray(requiredRoles)
    ? requiredRoles.join(', ')
    : requiredRoles;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border transition-colors',
        'border-purple-200/80 dark:border-purple-950/60 bg-purple-50/20 dark:bg-[#14101A]',
        'py-14 px-6 max-w-lg mx-auto my-6',
        className
      )}
    >
      {/* Shield Icon */}
      <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 shadow-xs">
        <ShieldAlert className="w-7 h-7" />
      </div>

      {/* Permission Key Badge */}
      {permission && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 mb-3">
          <KeyRound className="w-3 h-3" />
          <span>Requires: {permission}</span>
        </div>
      )}

      {/* 1. Explain what is restricted */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
        Access Restricted (HTTP 403)
      </h3>

      {/* 2. Explain why you need it and why current role lacks it */}
      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-md leading-relaxed">
        {reason || (
          rolesList
            ? `This section contains sensitive organizational data restricted to accounts with ${rolesList} privileges.`
            : 'Your current account role does not have the policy permission needed to view or execute actions on this screen.'
        )}
      </p>

      {/* 3. Provide a way back & Optional Escalation */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <Link
          to={returnUrl}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Dashboard
        </Link>

        {onRequestAccess && (
          <button
            type="button"
            onClick={onRequestAccess}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            Request Permission
          </button>
        )}
      </div>
    </div>
  );
}

