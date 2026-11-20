/**
 * @file JobArchiveDetailModal.jsx
 * @description Archive inspection modal for decommissioned/archived job openings with Revert and Permanent Delete controls.
 * 
 * SPECIFICATION & BUSINESS RULES:
 * - Module: M15 Recruitment & ATS (BUILD-GUIDE Section 24 · Row 15.3)
 * - Design System: Forest & Emerald (#00C471 brand primary, #111D17 dark surface, #1A3125 dark border).
 * - Safety Invariant: Permanent deletion is blocked if active candidates remain in pipeline.
 * - Actions: Revert to Active & Permanent Delete (with two-step confirmation).
 */

import React, { useState } from 'react';
import {
  X,
  Archive,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2
} from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';

export const JobArchiveDetailModal = ({
  isOpen,
  onClose,
  job,
  onRevert,
  onPermanentDelete,
  isReverting = false,
  isDeleting = false
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !job) return null;

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  const minSalaryPkr = job.minSalaryPaisa ? (job.minSalaryPaisa / 100).toLocaleString() : null;
  const maxSalaryPkr = job.maxSalaryPaisa ? (job.maxSalaryPaisa / 100).toLocaleString() : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0B1511]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-[#1A3125]">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Archived Job Opening
                </span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-500">
                  {job.employmentType || 'Full-time'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                {job.title}
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Informational Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 text-xs">
            This job opening is archived and unlisted from the public careers portal. You can restore it to the Active list in <strong>Draft</strong> status, or permanently delete it.
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
              <span className="text-slate-400 block text-[10px]">Department</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {job.departmentId?.name || 'Department'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
              <span className="text-slate-400 block text-[10px]">Designation</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {job.designationId?.title || 'Role'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
              <span className="text-slate-400 block text-[10px]">Location</span>
              <span className="font-medium text-slate-900 dark:text-white truncate block">
                {job.location || 'Headquarters'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
              <span className="text-slate-400 block text-[10px]">Min Experience</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {job.minExperienceYears ? `${job.minExperienceYears}+ Years` : 'Fresh / Entry'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
              <span className="text-slate-400 block text-[10px]">Compensation (PKR)</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {minSalaryPkr && maxSalaryPkr ? `${minSalaryPkr} - ${maxSalaryPkr}` : minSalaryPkr ? `From ${minSalaryPkr}` : 'Disclosed on Offer'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125]">
              <span className="text-slate-400 block text-[10px]">Archived On</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {job.updatedAt ? formatDate(job.updatedAt) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Description Preview */}
          {job.description && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125] space-y-1.5">
              <span className="text-slate-400 font-semibold block text-[11px]">Description Summary</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs line-clamp-4 whitespace-pre-line">
                {job.description}
              </p>
            </div>
          )}

          {/* Requirements Badges */}
          {Array.isArray(job.requirements) && job.requirements.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-slate-400 font-semibold block text-[11px]">Required Skills & Tech</span>
              <div className="flex flex-wrap gap-1.5">
                {job.requirements.map((req, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-[#1A3125]"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Two-step permanent delete confirmation banner */}
          {confirmDelete && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirm Permanent Removal</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400">
                Are you absolutely sure? This will permanently delete <strong>{job.title}</strong> from the database. Note: permanent deletion is rejected if any active candidates are currently attached to this opening.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0B1511]/50 flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E362B] transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {/* Revert Action */}
            <button
              onClick={() => onRevert(job)}
              disabled={isReverting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] text-white hover:bg-[#049856] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isReverting ? 'Restoring...' : 'Revert to Active'}</span>
            </button>

            {/* Permanent Delete Action */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanent Delete</span>
              </button>
            ) : (
              <button
                onClick={() => onPermanentDelete(job)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Forever'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobArchiveDetailModal;
