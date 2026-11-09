/**
 * @file NominateModal.jsx
 * @description Modal dialog for nominating an employee for an award cycle (BUILD-GUIDE Row 20.1).
 */

import React, { useState } from 'react';
import { X, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNominateCandidateMutation } from '../rewardsApi.js';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';
import { toast } from 'sonner';

export const NominateModal = ({ isOpen, onClose, award }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const { data: employeesRes, isLoading: isLoadingEmps } = useGetEmployeesQuery(
    { limit: 150, status: 'Active' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                Nominate for Employee of the Month
              </h3>
              <p className="text-xs text-slate-500">{award.title} ({award.month})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Candidate <span className="text-rose-500">*</span>
            </label>
            {isLoadingEmps ? (
              <div className="text-xs text-slate-400 py-2">Loading active employees...</div>
            ) : (
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">-- Choose an eligible employee --</option>
                {availableEmployees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeCode || emp.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nomination Reason & Citation <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Highlight their accomplishments, dedication, teamwork, or noteworthy project deliverables this month..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Minimum 10 characters required.</p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingEmps}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Nomination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
