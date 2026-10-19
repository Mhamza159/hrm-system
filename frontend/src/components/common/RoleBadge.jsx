/**
 * @file RoleBadge.jsx
 * @description Dynamic Role Badge component reflecting user privileges and organizational role.
 * 
 * SPECIFICATION:
 * - Super Admin: Purple Theme with Crown Icon
 * - HR Manager: Emerald Theme with ShieldCheck Icon
 * - Department Manager: Blue Theme with Briefcase Icon
 * - Employee: Teal Theme with User Icon
 */

import React from 'react';
import { Crown, ShieldCheck, Briefcase, User } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function RoleBadge({ role, className = '', size = 'sm' }) {
  const roleName = typeof role === 'object' ? role?.name || 'Employee' : role || 'Employee';

  let config = {
    label: roleName,
    icon: User,
    color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800/60'
  };

  if (roleName === 'Super Admin') {
    config = {
      label: 'Super Admin',
      icon: Crown,
      color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
    };
  } else if (roleName === 'HR Manager') {
    config = {
      label: 'HR Manager',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
    };
  } else if (roleName === 'Department Manager') {
    config = {
      label: 'Dept Manager',
      icon: Briefcase,
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
    };
  }

  const Icon = config.icon;
  const isLarge = size === 'md' || size === 'lg';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-full border shadow-2xs leading-none select-none',
        isLarge ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]',
        config.color,
        className
      )}
    >
      <Icon className={isLarge ? 'w-3.5 h-3.5 shrink-0' : 'w-3 h-3 shrink-0'} />
      <span>{config.label}</span>
    </span>
  );
}

export default RoleBadge;
