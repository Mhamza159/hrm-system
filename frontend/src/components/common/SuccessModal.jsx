/**
 * @file SuccessModal.jsx
 * @description State 10: Modal confirmation dialog for completed actions.
 * Strictly satisfies Rule 10: Confirm, reassure, and show what happens next.
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { SuccessState } from './SuccessState.jsx';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {string} [props.referenceId]
 * @param {string} props.reassurance
 * @param {Array<{ title: string, description?: string, duration?: string }>} [props.nextSteps]
 * @param {Object} [props.primaryAction]
 * @param {Object} [props.secondaryAction]
 */
export function SuccessModal({
  isOpen,
  onClose,
  title,
  referenceId = null,
  reassurance,
  nextSteps = [],
  primaryAction = null,
  secondaryAction = null
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl p-6 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <SuccessState
          title={title}
          referenceId={referenceId}
          reassurance={reassurance}
          nextSteps={nextSteps}
          primaryAction={primaryAction || { label: 'Close', onClick: onClose }}
          secondaryAction={secondaryAction}
          className="border-0 bg-transparent p-0 my-0"
        />
      </div>
    </div>
  );
}

