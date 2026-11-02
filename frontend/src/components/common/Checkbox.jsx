/**
 * @file Checkbox.jsx
 * @description Accessible custom checkbox adhering strictly to Elvara HRM brand green tokens.
 * Supports checked, unchecked, and tri-state indeterminate states in both light and dark modes.
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export const Checkbox = forwardRef(function Checkbox(
  {
    checked = false,
    indeterminate = false,
    onChange,
    disabled = false,
    className = '',
    id,
    name,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    ...props
  },
  forwardedRef
) {
  const internalRef = useRef(null);
  const inputRef = forwardedRef || internalRef;

  useEffect(() => {
    if (inputRef && 'current' in inputRef && inputRef.current) {
      inputRef.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate, inputRef]);

  const isChecked = Boolean(checked) && !indeterminate;
  const isIndeterminate = Boolean(indeterminate);
  const isActive = isChecked || isIndeterminate;

  const handleClick = (e) => {
    if (disabled) return;
    onChange?.({
      target: {
        checked: !checked,
        name,
        id
      }
    });
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={isIndeterminate ? 'mixed' : isChecked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 w-4 h-4 rounded transition-all duration-150 select-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0A110D]',
        isActive
          ? 'bg-brand border border-brand text-white shadow-2xs'
          : 'bg-white dark:bg-[#111D17] border border-slate-300 dark:border-slate-600 hover:border-brand dark:hover:border-brand text-transparent',
        disabled && 'opacity-40 cursor-not-allowed hover:border-slate-300 dark:hover:border-slate-600',
        className
      )}
      {...props}
    >
      {/* Hidden real input for accessibility & form capture */}
      <input
        ref={inputRef}
        type="checkbox"
        id={id}
        name={name}
        checked={isChecked}
        disabled={disabled}
        onChange={() => {}} // handled by wrapper
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Tri-state icons */}
      {isChecked && (
        <Check className="w-3 h-3 text-white stroke-[3] animate-in zoom-in-50 duration-100" />
      )}
      {isIndeterminate && (
        <Minus className="w-3 h-3 text-white stroke-[3] animate-in zoom-in-50 duration-100" />
      )}
    </div>
  );
});

export default Checkbox;

