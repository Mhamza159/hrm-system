/**
 * @file FormField.jsx
 * @description Accessible Form Field wrapper with precise inline error instructions.
 * Strictly satisfies Rule 9: Flag the exact field with inline instructions on how to fix it.
 */

import React from 'react';
import { FormValidationError } from './FormValidationError.jsx';
import { cn } from '../../lib/utils.js';

/**
 * Recursively inject aria and identity attributes directly onto the interactive control
 * (input, select, textarea), even if nested inside icons or container divs.
 */
function injectAriaProps(child, ariaProps) {
  if (!React.isValidElement(child)) return child;

  const isFormTag =
    typeof child.type === 'string' &&
    ['input', 'select', 'textarea'].includes(child.type.toLowerCase());

  if (isFormTag) {
    return React.cloneElement(child, {
      id: child.props.id || ariaProps.id,
      'aria-invalid': ariaProps['aria-invalid'],
      'aria-describedby': ariaProps['aria-describedby']
    });
  }

  if (child.props && child.props.children) {
    const updatedChildren = React.Children.map(child.props.children, (subChild) =>
      injectAriaProps(subChild, ariaProps)
    );
    return React.cloneElement(child, {}, updatedChildren);
  }

  return React.cloneElement(child, ariaProps);
}

/**
 * @param {Object} props
 * @param {string} props.id - HTML input ID
 * @param {string} props.label - Human readable field label
 * @param {boolean} [props.required=false] - Mandatory field flag
 * @param {string|string[]} [props.error] - Validation error message
 * @param {string} [props.instruction] - Concrete formatting instruction
 * @param {string} [props.helperText] - Neutral field guidance
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children - Input, select, or wrapped control element
 */
export function FormField({
  id,
  label,
  required = false,
  error = null,
  instruction = null,
  helperText = null,
  className = '',
  children
}) {
  const hasError = Boolean(error);
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = hasError ? `${id}-error` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  const ariaPayload = {
    id,
    'aria-invalid': hasError ? 'true' : undefined,
    'aria-describedby': describedBy
  };

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
          {helperText && !hasError && (
            <span id={helperId} className="text-[11px] text-slate-400">
              {helperText}
            </span>
          )}
        </div>
      )}

      {/* Input container with dynamic error styling injection */}
      <div
        className={cn(
          'relative',
          hasError &&
            '[&_input]:border-rose-500 [&_select]:border-rose-500 [&_textarea]:border-rose-500 [&_input]:focus:ring-rose-500/20 [&_select]:focus:ring-rose-500/20 [&_textarea]:focus:ring-rose-500/20'
        )}
      >
        {injectAriaProps(children, ariaPayload)}
      </div>

      {/* Inline instruction error box */}
      <FormValidationError
        id={id}
        error={error}
        instruction={instruction}
      />
    </div>
  );
}

export default FormField;
