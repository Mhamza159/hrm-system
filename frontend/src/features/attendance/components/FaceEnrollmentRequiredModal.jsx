/**
 * @file FaceEnrollmentRequiredModal.jsx
 * @description Enterprise Centered Modal alerting employee that Face Enrollment is mandatory before Face Punch.
 * 
 * SPECIFICATION (Phase 40):
 * - Enforces mandatory biometric pre-requisite UX.
 * - Displays clear title, message, and actionable navigation to `/attendance/face/enroll`.
 * - Strictly follows the Elvara Forest theme tokens & universal modal contract.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanFace, ArrowRight, X, ShieldAlert } from 'lucide-react';

export const FaceEnrollmentRequiredModal = ({
  isOpen,
  onClose,
  status = 'none' // 'none' | 'pending' | 'rejected'
}) => {
  const navigate = useNavigate();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  const title = isPending
    ? 'Face Enrollment Pending Review'
    : isRejected
    ? 'Face Enrollment Rejected'
    : 'Face Enrollment Required';

  const message = isPending
    ? 'Your face enrollment has been submitted and is currently awaiting HR approval. You cannot use Face Punch until your biometric record is verified and approved.'
    : isRejected
    ? 'Your previous face enrollment was rejected by HR. Please re-enroll your facial biometric profile before using Face Punch.'
    : 'Your face has not been enrolled yet. Please complete Face Enrollment before using Face Punch.';

  const handleCompleteEnrollment = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
    navigate('/attendance/face/enroll');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/15 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0E1712]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              {isPending || isRejected ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <ScanFace className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
            {message}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Biometric attendance requires a verified 128-dimensional facial descriptor on file to prevent proxy clock-ins and ensure audit integrity.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0E1712]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1A3125] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {!isPending && (
            <button
              type="button"
              onClick={handleCompleteEnrollment}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00C471] hover:bg-[#00B065] shadow-sm shadow-[#00C471]/20 transition-all cursor-pointer"
            >
              <span>Complete Face Enrollment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceEnrollmentRequiredModal;
