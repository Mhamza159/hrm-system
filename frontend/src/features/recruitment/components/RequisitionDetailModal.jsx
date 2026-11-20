/**
 * @file RequisitionDetailModal.jsx
 * @description Enterprise Headcount Requisition Review & Decision Modal for Super Admin (Module M15 / Rows 15.1, 15.2).
 * 
 * SPECIFICATION & BUSINESS RULES:
 * - Module: M15 Recruitment & ATS (BUILD-GUIDE Section 24 · Rows 15.1, 15.2)
 * - Design System: Forest & Emerald (#00C471 brand primary, #111D17 dark surface, #1A3125 dark border).
 * - Target Audience: Super Admin (for review and approval/rejection) and Department Managers (read-only audit).
 * - Action Flow:
 *   - Super Admin can review all requisition details, headcount justifications, compensation bands, and skills.
 *   - Super Admin can execute "Approve" (auto-creates internal Draft Job opening) or "Reject" with mandatory or optional remarks.
 *   - Shows full audit history (Decided By, Decision Date, Decision Remarks, Associated Job opening link).
 */

import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Building2,
  Briefcase,
  DollarSign,
  User,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  FileText
} from 'lucide-react';
import { formatDate } from '../../../lib/formatters.js';

export const RequisitionDetailModal = ({
  isOpen,
  onClose,
  requisition,
  isSuperAdmin = false,
  onDecision,
  isDeciding = false
}) => {
  const [activeAction, setActiveAction] = useState(null); // null | 'approved' | 'rejected'
  const [remarks, setRemarks] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isOpen || !requisition) return null;

  const minSalaryPkr = requisition.minSalaryPaisa
    ? (requisition.minSalaryPaisa / 100).toLocaleString()
    : '—';
  const maxSalaryPkr = requisition.maxSalaryPaisa
    ? (requisition.maxSalaryPaisa / 100).toLocaleString()
    : '—';

  const isPending = requisition.status === 'Pending_Approval';
  const isApproved = requisition.status === 'Approved';
  const isRejected = requisition.status === 'Rejected';

  const handleClose = () => {
    setActiveAction(null);
    setRemarks('');
    setValidationError('');
    onClose();
  };

  const handleStartDecision = (action) => {
    setActiveAction(action);
    setRemarks('');
    setValidationError('');
  };

  const handleSubmitDecision = async () => {
    if (activeAction === 'rejected' && !remarks.trim()) {
      setValidationError('Please provide a reason or remarks for rejecting this headcount request.');
      return;
    }
    setValidationError('');
    if (onDecision) {
      await onDecision({
        id: requisition._id,
        decision: activeAction,
        remarks: remarks.trim()
      });
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-2xl rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                isApproved
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00C471] border-emerald-200 dark:border-[#1A3125]'
                  : isRejected
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
              }`}
            >
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {requisition.designationId?.title || 'Headcount Requisition'}
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isApproved
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
                      : isPending
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                  }`}
                >
                  {requisition.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Ref: #{requisition._id.slice(-6).toUpperCase()}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Submitted on {formatDate(requisition.createdAt)}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0B1511]">
            <div>
              <span className="text-[10px] text-slate-400 font-medium">Department</span>
              <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {requisition.departmentId?.name || '—'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium">Target Openings</span>
              <p className="font-bold text-[#00C471] text-xs mt-0.5 font-mono">
                {requisition.openingsCount} {requisition.openingsCount === 1 ? 'Position' : 'Positions'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium">Employment Type</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                {requisition.employmentType}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium">Min Experience</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 font-mono">
                {requisition.minExperienceYears} {requisition.minExperienceYears === 1 ? 'Year' : 'Years'}
              </p>
            </div>
          </div>

          {/* Monthly Budget / Salary Band */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
              Monthly Salary Band (PKR)
            </span>
            <div className="flex items-center gap-2 text-sm font-bold font-mono text-slate-900 dark:text-white">
              <DollarSign className="w-4 h-4 text-[#00C471]" />
              <span>PKR {minSalaryPkr}</span>
              <span className="text-slate-400 font-normal">to</span>
              <span>PKR {maxSalaryPkr}</span>
              <span className="text-[10px] font-normal text-slate-400 ml-1">/ month</span>
            </div>
          </div>

          {/* Requesting Manager Information */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-2">
              Requesting Manager Details
            </span>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#162820] text-[#00C471] flex items-center justify-center font-bold text-xs border border-emerald-100 dark:border-[#1A3125]">
                  {requisition.requestedBy?.name?.[0]?.toUpperCase() || 'M'}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    {requisition.requestedBy?.name || 'Department Manager'}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Mail className="w-3 h-3" />
                    {requisition.requestedBy?.email || '—'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]">
                  ID: {requisition.requestedBy?.employeeCode || 'EMP'}
                </span>
                {requisition.requestedBy?.designationId?.title && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {requisition.requestedBy.designationId.title}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Justification & Business Need */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Headcount Justification & Purpose</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-[#0B1511] p-3 rounded-lg border border-slate-100 dark:border-[#1A3125]">
              {requisition.justification}
            </p>
          </div>

          {/* Required Skills & Tags */}
          {requisition.requiredSkills?.length > 0 && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] space-y-2">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                Required Technical & Domain Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {requisition.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Decision Outcome & Audit History (if already decided) */}
          {!isPending && (
            <div
              className={`p-3.5 rounded-xl border ${
                isApproved
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-[#1A3125]'
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
              } space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isApproved ? 'text-[#00C471]' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {isApproved ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  Executive Decision: {requisition.status}
                </span>
                {requisition.decidedAt && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Decided on {formatDate(requisition.decidedAt)}
                  </span>
                )}
              </div>

              {requisition.decidedBy && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Decided by: <span className="font-semibold text-slate-800 dark:text-slate-200">{requisition.decidedBy.name || requisition.decidedBy.email}</span>
                </p>
              )}

              {requisition.decisionRemarks && (
                <div className="bg-white dark:bg-[#111D17] p-2.5 rounded-lg border border-slate-200 dark:border-[#1A3125] text-xs text-slate-700 dark:text-slate-300">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">
                    Review Remarks:
                  </span>
                  "{requisition.decisionRemarks}"
                </div>
              )}

              {isApproved && requisition.jobId && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Associated Job Opening:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {requisition.jobId.title || 'Draft Opening'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-[#162820] text-[#00C471]">
                    {requisition.jobId.status || 'Draft'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Decision Form (when Super Admin clicks Approve or Reject) */}
          {activeAction && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0B1511] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                {activeAction === 'approved' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00C471]" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500" />
                )}
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  {activeAction === 'approved'
                    ? 'Confirm Headcount Requisition Approval'
                    : 'Confirm Headcount Requisition Rejection'}
                </h4>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeAction === 'approved'
                  ? 'Approving this request will automatically spawn an internal Draft Job Opening for this position and notify the requesting department manager.'
                  : 'Rejecting this request will mark the requisition as Rejected and send your recorded explanation to the department manager.'}
              </p>

              <div>
                <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  {activeAction === 'rejected' ? 'Rejection Reason (Required)' : 'Approval Notes (Optional)'}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  rows={3}
                  placeholder={
                    activeAction === 'rejected'
                      ? 'Please specify why this headcount request cannot be fulfilled at this time...'
                      : 'Optional notes regarding budget allocation or next steps...'
                  }
                  className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471] placeholder-slate-400"
                />
                {validationError && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {validationError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAction(null);
                    setRemarks('');
                    setValidationError('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162820] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={handleSubmitDecision}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer transition ${
                    activeAction === 'approved'
                      ? 'bg-[#00C471] hover:bg-[#049856]'
                      : 'bg-rose-600 hover:bg-rose-700'
                  } disabled:opacity-50`}
                >
                  {isDeciding
                    ? 'Processing...'
                    : activeAction === 'approved'
                    ? 'Confirm & Approve'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#162820] hover:bg-slate-200 dark:hover:bg-[#1E362B] transition cursor-pointer"
          >
            Close
          </button>

          {isPending && isSuperAdmin && !activeAction && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartDecision('rejected')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
              >
                Reject Request
              </button>
              <button
                type="button"
                onClick={() => handleStartDecision('approved')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#00C471] hover:bg-[#049856] shadow-xs hover:shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Requisition
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequisitionDetailModal;
