/**
 * @file DesignationBadge.jsx
 * @description Standardized enterprise Designation Badge component displaying employee corporate title.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: Common UI Components
 * - Layer: Frontend Shared Badge (Design Tokens, Dark Mode Support)
 * - Semantic Palette:
 *   - Executive / Leadership (CEO, Chief, Director, VP): Purple theme with Award icon
 *   - Management (Manager, Lead, Head): Teal theme with Briefcase icon
 *   - Engineering / Tech (Engineer, Developer, Architect, Specialist): Blue theme with Briefcase icon
 *   - People & HR: Emerald theme with Briefcase icon
 *   - Default / Staff: Subtle slate styling
 */

import React from 'react';
import { Briefcase, Award } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function DesignationBadge({ designation, className = '', size = 'sm' }) {
  const title = typeof designation === 'object' ? designation?.title || 'Staff' : designation || 'Staff';
  const lower = title.toLowerCase();

  let colorStyles = 'bg-slate-100 dark:bg-[#15231C] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-[#1A3125]';
  let Icon = Briefcase;

  if (lower.includes('ceo') || lower.includes('chief') || lower.includes('executive') || lower.includes('director') || lower.includes('president') || lower.includes('vp')) {
    colorStyles = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60';
    Icon = Award;
  } else if (lower.includes('manager') || lower.includes('lead') || lower.includes('head')) {
    colorStyles = 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60';
  } else if (lower.includes('engineer') || lower.includes('developer') || lower.includes('specialist') || lower.includes('architect')) {
    colorStyles = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60';
  } else if (lower.includes('hr') || lower.includes('people') || lower.includes('talent')) {
    colorStyles = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60';
  }

  const isLarge = size === 'md' || size === 'lg';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-md border shadow-2xs leading-none select-none tracking-tight',
        isLarge ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]',
        colorStyles,
        className
      )}
    >
      <Icon className={isLarge ? 'w-3.5 h-3.5 shrink-0 opacity-70' : 'w-3 h-3 shrink-0 opacity-70'} />
      <span className="truncate max-w-[170px]">{title}</span>
    </span>
  );
}

export default DesignationBadge;

