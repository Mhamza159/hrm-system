/**
 * @file CreateAwardModal.jsx
 * @description Modal for creating a new Employee of the Month / Honors award cycle (BUILD-GUIDE Row 20.1).
 */

import React, { useState } from 'react';
import { X, Award, AlertCircle, Calendar, Gift, Building2 } from 'lucide-react';
import { useCreateAwardMutation } from '../rewardsApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { toast } from 'sonner';

export const CreateAwardModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [departmentId, setDepartmentId] = useState('');
  const [nominationDeadline, setNominationDeadline] = useState('');
  const [votingDeadline, setVotingDeadline] = useState('');
  const [prizeDetails, setPrizeDetails] = useState('');
  const [formError, setFormError] = useState('');

  const { data: deptRes } = useGetDepartmentsQuery(undefined, { skip: !isOpen });
  const departments = deptRes?.data || [];

  const [createAward, { isLoading: isCreating }] = useCreateAwardMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Award cycle title is required.');
      return;
    }

    if (!month) {
      setFormError('Please select award month (YYYY-MM).');
      return;
    }

    if (!nominationDeadline || !votingDeadline) {
      setFormError('Both nomination and voting deadlines are required.');
      return;
    }

    if (new Date(nominationDeadline) >= new Date(votingDeadline)) {
      setFormError('Nomination deadline must be strictly earlier than voting deadline.');
      return;
    }

    try {
      await createAward({
        title: title.trim(),
        month,
        departmentId: departmentId || null,
        nominationDeadline: new Date(nominationDeadline).toISOString(),
        votingDeadline: new Date(votingDeadline).toISOString(),
        prizeDetails: prizeDetails.trim()
      }).unwrap();

      toast.success('Award cycle launched successfully!');
      onClose();
      // Reset form
      setTitle('');
      setDepartmentId('');
      setPrizeDetails('');
      setNominationDeadline('');
      setVotingDeadline('');
    } catch (err) {
      setFormError(err?.data?.message || err?.message || 'Failed to create award cycle.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0C1712]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00C471]/10 text-[#00C471] rounded-xl border border-[#00C471]/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-base">
                Launch Award Cycle
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Define recognition cycle, nomination timeline & voting deadlines
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
              Award Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Employee of the Month — November 2026"
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
                Cycle Month (YYYY-MM) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="month"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#00C471]" />
                <span>Target Department</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
              >
                <option value="">Company-Wide (All Departments)</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                <span>Nomination Deadline <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={nominationDeadline}
                onChange={(e) => setNominationDeadline(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#00C471]" />
                <span>Voting Deadline <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={votingDeadline}
                onChange={(e) => setVotingDeadline(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5 flex items-center gap-1.5">
              <Gift className="h-3.5 w-3.5 text-amber-500" />
              <span>Prize / Reward Details (Optional)</span>
            </label>
            <input
              type="text"
              value={prizeDetails}
              onChange={(e) => setPrizeDetails(e.target.value)}
              placeholder="e.g. PKR 25,000 cash bonus + Trophy + Certificate"
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
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
              disabled={isCreating}
              className="px-5 py-2 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Award className="h-4 w-4" />
              <span>{isCreating ? 'Launching Cycle...' : 'Launch Cycle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
