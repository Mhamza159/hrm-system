/**
 * @file userAccessTheme.js
 * @description Theme & semantic style tokens for User Access & Security Module.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Palette).
 */

import {
  CheckCircle2,
  XCircle,
  Lock,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  Shield
} from 'lucide-react';

export const USER_STATUS_CONFIG = {
  active: {
    label: 'Active Account',
    shortLabel: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-[#00C471] dark:border-emerald-800/60',
    indicatorClass: 'bg-[#00C471]',
    icon: CheckCircle2
  },
  inactive: {
    label: 'Deactivated',
    shortLabel: 'Inactive',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
    indicatorClass: 'bg-slate-400',
    icon: XCircle
  },
  locked: {
    label: 'Account Locked',
    shortLabel: 'Locked',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    indicatorClass: 'bg-amber-500',
    icon: Lock
  },
  suspended: {
    label: 'Suspended Access',
    shortLabel: 'Suspended',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
    indicatorClass: 'bg-rose-500',
    icon: AlertOctagon
  }
};

export function getUserStatusBadge(status) {
  if (status === 'locked') return USER_STATUS_CONFIG.locked;
  if (status === 'inactive' || status === false) return USER_STATUS_CONFIG.inactive;
  if (status === 'suspended') return USER_STATUS_CONFIG.suspended;
  return USER_STATUS_CONFIG.active;
}

export function getRoleBadge(roleName = 'Employee') {
  const norm = String(roleName).toLowerCase();

  if (norm.includes('super admin')) {
    return {
      label: 'Super Admin',
      colorClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60',
      icon: Shield
    };
  }
  if (norm.includes('hr')) {
    return {
      label: 'HR Manager',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-[#00C471] dark:border-emerald-800/60',
      icon: UserCheck
    };
  }
  if (norm.includes('dept') || norm.includes('department') || norm.includes('manager')) {
    return {
      label: 'Dept Manager',
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
      icon: Users
    };
  }
  return {
    label: roleName || 'Employee',
    colorClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10',
    icon: ShieldAlert
  };
}

export function get2faBadge(isEnabled) {
  if (isEnabled) {
    return {
      label: '2FA Enforced',
      shortLabel: '2FA On',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-[#00C471] dark:border-emerald-800/60',
      icon: ShieldCheck
    };
  }
  return {
    label: '2FA Disabled',
    shortLabel: '2FA Off',
    colorClass: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
    icon: ShieldAlert
  };
}

export function getAccessStatusBadge(rolesCount = 0) {
  if (rolesCount > 0) {
    return {
      label: 'Roles Assigned',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-[#00C471] dark:border-emerald-800/60'
    };
  }
  return {
    label: 'No Roles Assigned',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
  };
}
