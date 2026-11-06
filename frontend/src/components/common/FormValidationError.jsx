/**
 * @file FormValidationError.jsx
 * @description State 9: Inline Field Validation Error & Format Guide.
 * Strictly satisfies Rule 9: Flag the exact field with inline instructions on how to fix it.
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * @param {Object} props
 * @param {string} props.id - Input ID for aria-describedby binding
 * @param {string|string[]} props.error - Error text or list
 * @param {string} [props.instruction] - Specific format instruction (e.g., "Must be 13 digits without hyphens")
 * @param {string} [props.className]
 */
export function FormValidationError({
  id,
  error,
  instruction = null,
  className = ''
}) {
  if (!error) return null;

  const errorMessage = Array.isArray(error) ? error.join(', ') : error;

  return (
    <div
      id={id ? `${id}-error` : undefined}
      role="alert"
      className={cn(
        'flex items-start gap-1.5 mt-1.5 text-xs text-rose-600 dark:text-rose-400 animate-in fade-in slide-in-from-top-1 duration-150',
        className
      )}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <span className="font-medium">{errorMessage}</span>
        {instruction && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {instruction}
          </p>
        )}
      </div>
    </div>
  );
}

