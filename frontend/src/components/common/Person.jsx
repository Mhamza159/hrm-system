/**
 * @file Person.jsx
 * @description The one way dashboards show a person: avatar (photo, or initials when there is
 * no photo or it fails to load), name, role badge and "Designation · Department".
 * Fed by the backend person shape: { employeeName|name, avatar, designation, department, role }.
 */

import React, { useState } from 'react';
import { RoleBadge } from './RoleBadge.jsx';
import { cn } from '../../lib/utils.js';

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
};

export const initialsOf = (name) =>
  (String(name || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase();

export function PersonAvatar({ name, src, size = 'md', className }) {
  const [failed, setFailed] = useState(false);
  const box = cn('shrink-0 rounded-full', SIZES[size], className);

  if (src && !failed) {
    return <img src={src} alt="" onError={() => setFailed(true)} className={cn(box, 'object-cover ring-1 ring-[#EAECF0] dark:ring-[#1A3125]')} />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(box, 'flex items-center justify-center bg-emerald-50 font-semibold text-emerald-700 dark:bg-[#00C471]/15 dark:text-emerald-400')}
    >
      {initialsOf(name)}
    </span>
  );
}

/** "Designation · Department" — omits whichever part is missing. */
export const personSubtitle = (p) => [p?.designation, p?.department].filter(Boolean).join(' · ');

/**
 * Avatar + name (+ optional role badge) + designation/department line.
 * `trailing` renders on the right of the name row (e.g. a time or a status badge).
 */
export function PersonRow({ person, size = 'md', showRole = true, trailing, children, className }) {
  const name = person?.employeeName || person?.name || 'Employee';
  const subtitle = personSubtitle(person);
  return (
    <div className={cn('flex min-w-0 items-start gap-3', className)}>
      <PersonAvatar name={name} src={person?.avatar} size={size} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white" title={name}>
            {name}
          </p>
          {showRole && person?.role && <RoleBadge role={person.role} className="shrink-0 shadow-none" />}
          {trailing && <div className="ms-auto shrink-0 ps-2">{trailing}</div>}
        </div>
        {subtitle && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={subtitle}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
