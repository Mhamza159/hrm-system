/**
 * @file CreateAwardModal.jsx
 * @description Modal for creating a new Employee of the Month award cycle (BUILD-GUIDE Row 20.1).
 */

import React, { useState } from 'react';
import { X, Award, AlertCircle, Calendar } from 'lucide-react';
import { useCreateAwardMutation } from '../rewardsApi.js';
import { toast } from 'sonner';

export const CreateAwardModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [nominationDeadline, setNominationDeadline] = useState('');
  const [votingDeadline, setVotingDeadline] = useState('');
  const [prizeDetails, setPrizeDetails] = useState('');
  const [formError, setFormError] = useState('');

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
      setFormError('Nomination deadline must be earlier than voting deadline.');
      return;
    }

    try {
      await createAward({
        title: title.trim(),
        month,
        nominationDeadline: new Date(nominationDeadline).toISOString(),
        votingDeadline: new Date(votingDeadline).toISOString(),
        prizeDetails: prizeDetails.trim()
      }).unwrap();

      toast.success('Award cycle launched successfully!');
      onClose();
    } catch (err) {
      setFormError(err?.data?.message || err?.message || 'Failed to create award cycle.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-500/5 dark:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                Launch New Award Cycle
              </h3>
              <p className="text-xs text-slate-500">Employee of the Month recognition program</p>
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
              Award Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Employee of the Month - November 2026"
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cycle Month <span className="text-rose-500">*</span>
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomination Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={nominationDeadline}
                onChange={(e) => setNominationDeadline(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Voting Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={votingDeadline}
                onChange={(e) => setVotingDeadline(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Prize / Bonus Details
            </label>
            <input
              type="text"
              value={prizeDetails}
              onChange={(e) => setPrizeDetails(e.target.value)}
              placeholder="e.g. PKR 50,000 cash bonus + crystal plaque"
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              <span>{isCreating ? 'Launching...' : 'Launch Cycle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
