/**
 * @file NominateModal.jsx
 * @description Modal dialog for nominating an employee for an award cycle (BUILD-GUIDE Row 20.1).
 */

import React, { useState } from 'react';
import { X, Award, AlertCircle, UserCheck } from 'lucide-react';
import { useNominateCandidateMutation } from '../rewardsApi.js';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';
import { toast } from 'sonner';

export const NominateModal = ({ isOpen, onClose, award }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const { data: employeesRes, isLoading: isLoadingEmps } = useGetEmployeesQuery(
    { limit: 200, status: 'Active' },
    { skip: !isOpen }
  );

  const [nominateCandidate, { isLoading: isSubmitting }] = useNominateCandidateMutation();

  if (!isOpen || !award) return null;

  const rawList = employeesRes?.data?.items || employeesRes?.data?.employees || employeesRes?.data || [];
  const employees = Array.isArray(rawList) ? rawList : [];

  // Exclude employees already nominated in this cycle
  const existingNomineeIds = new Set(
    (award.nominations || []).map((n) =>
      typeof n.employeeId === 'object' ? n.employeeId?._id?.toString() : n.employeeId?.toString()
    )
  );

  const availableEmployees = employees.filter((emp) => !existingNomineeIds.has(emp._id.toString()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!employeeId) {
      setFormError('Please select a candidate to nominate.');
      return;
    }

    if (!reason || reason.trim().length < 10) {
      setFormError('Nomination citation must be at least 10 characters.');
      return;
    }

    try {
      await nominateCandidate({
        awardId: award._id,
        employeeId,
        reason: reason.trim()
      }).unwrap();

      toast.success('Candidate nominated successfully!');
      onClose();
      setEmployeeId('');
      setReason('');
    } catch (err) {
      setFormError(err?.data?.message || err?.message || 'Failed to submit nomination.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0C1712]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00C471]/10 text-[#00C471] rounded-xl border border-[#00C471]/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-base">
                Nominate for Employee of the Month
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                {award.title} ({award.month})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
              Select Candidate <span className="text-rose-500">*</span>
            </label>
            {isLoadingEmps ? (
              <div className="py-3 text-xs text-slate-400 dark:text-[#7E9E8F] flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00C471] border-t-transparent" />
                <span>Loading active workforce...</span>
              </div>
            ) : availableEmployees.length === 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs">
                All eligible active employees have already been nominated for this cycle.
              </div>
            ) : (
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
              >
                <option value="">-- Choose Candidate --</option>
                {availableEmployees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()} • {emp.designation || 'Team Member'} {emp.employeeId ? `(${emp.employeeId})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                Nomination Citation & Achievements <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-[#7E9E8F]">
                {reason.length}/1000 characters
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Highlight key accomplishments, impact on projects, collaboration, or leadership during this cycle..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] p-3 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all leading-relaxed placeholder:text-slate-400 dark:placeholder:text-[#7E9E8F]/60"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-[#1A3125] rounded-xl text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#1A3125] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !employeeId || reason.trim().length < 10}
              className="px-5 py-2 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <UserCheck className="h-4 w-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Nomination'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
