/**
 * @file EmptyState.jsx
 * @description Standardized empty collection component for enterprise HRM.
 * Follows Rule 1: State what is empty, give reassurance, then give one next step.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Plus } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * @param {Object} props
 * @param {React.ElementType} [props.icon=Inbox] - Lucide icon
 * @param {string} props.title - States what is empty (e.g. "No Employees Added Yet")
 * @param {string} props.description - Reassurance & context (e.g. "Your organization directory is currently empty. Get started by adding your first team member.")
 * @param {Object} [props.action] - One primary next step { label, onClick, href, icon }
 * @param {Object} [props.secondaryAction] - Optional secondary action { label, onClick, href }
 * @param {boolean} [props.compact=false] - Condensed variant for cards / sidebars
 * @param {string} [props.className]
 */
export function EmptyState({
  icon = Inbox,
  title = 'No records found',
  description = 'There are no active records in this section yet. Create one to get started.',
  action = null,
  secondaryAction = null,
  compact = false,
  className = ''
}) {
  const Icon = icon || Inbox;
  const ActionIcon = action?.icon || Plus;

  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed transition-colors',
        'border-slate-200 dark:border-[#1A3125] bg-white/50 dark:bg-[#111D17]/40',
        compact ? 'py-8 px-4 max-w-sm mx-auto' : 'py-14 px-6 max-w-lg mx-auto my-4',
        className
      )}
    >
      {/* Icon Capsule with Emerald/Slate Glow */}
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
          <Icon className="w-7 h-7" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-100 dark:bg-[#162820] border-2 border-white dark:border-[#111D17] flex items-center justify-center text-slate-400">
          <span className="text-[10px] font-bold">0</span>
        </div>
      </div>

      {/* 1. State what is empty */}
      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>

      {/* 2. Reassurance / Explanation */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
        {description}
      </p>

      {/* 3. Give ONE next step (or optional secondary link) */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {action && (
            action.href ? (
              <Link
                to={action.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all transform active:scale-95 cursor-pointer"
              >
                <ActionIcon className="w-3.5 h-3.5" />
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all transform active:scale-95 cursor-pointer"
              >
                <ActionIcon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                to={secondaryAction.href}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

