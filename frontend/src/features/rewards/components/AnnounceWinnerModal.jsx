/**
 * @file AnnounceWinnerModal.jsx
 * @description Modal for Announcing Award Cycle Winner (BUILD-GUIDE Row 20.1).
 */

import React, { useState } from 'react';
import { X, Trophy, AlertCircle } from 'lucide-react';
import { useAnnounceWinnerMutation } from '../rewardsApi.js';
import { toast } from 'sonner';

export const AnnounceWinnerModal = ({ isOpen, onClose, award }) => {
  const [winnerId, setWinnerId] = useState('');
  const [winnerCitation, setWinnerCitation] = useState('');
  const [prizeDetails, setPrizeDetails] = useState(award?.prizeDetails || '');
  const [formError, setFormError] = useState('');

  const [announceWinner, { isLoading: isAnnouncing }] = useAnnounceWinnerMutation();

  if (!isOpen || !award) return null;

  // Shortlisted nominees list
  const nominees = (award.nominations || []).map((n) => ({
    _id: typeof n.employeeId === 'object' ? n.employeeId?._id : n.employeeId,
    name: typeof n.employeeId === 'object' ? n.employeeId?.name : 'Nominee',
    citation: n.reason
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!winnerId) {
      setFormError('Please select a winner among the nominated candidates.');
      return;
    }

    if (!winnerCitation || winnerCitation.trim().length < 5) {
      setFormError('Winner citation citation must be at least 5 characters.');
      return;
    }

    try {
      await announceWinner({
        awardId: award._id,
        winnerId,
        winnerCitation: winnerCitation.trim(),
        prizeDetails: prizeDetails.trim()
      }).unwrap();

      toast.success('Winner announced to the company!');
      onClose();
    } catch (err) {
      setFormError(err?.data?.message || err?.message || 'Failed to announce winner.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-500/5 dark:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                Announce Award Winner
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
              Select Winner <span className="text-rose-500">*</span>
            </label>
            <select
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">-- Choose Winner --</option>
              {nominees.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Winner Citation & Citation Speech <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={winnerCitation}
              onChange={(e) => setWinnerCitation(e.target.value)}
              placeholder="e.g. Recognized for phenomenal team leadership, exceptional delivery, and inspiring colleagues..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Prize & Trophy Details
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
              disabled={isAnnouncing}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAnnouncing}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              <span>{isAnnouncing ? 'Announcing...' : 'Announce Winner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
