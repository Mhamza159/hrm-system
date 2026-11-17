/**
 * @file AnnounceWinnerModal.jsx
 * @description Modal for Announcing Award Cycle Winner (BUILD-GUIDE Row 20.1).
 */

import React, { useState } from 'react';
import { X, Trophy, AlertCircle, Sparkles, Gift } from 'lucide-react';
import { useAnnounceWinnerMutation } from '../rewardsApi.js';
import { toast } from 'sonner';

export const AnnounceWinnerModal = ({ isOpen, onClose, award }) => {
  const [winnerId, setWinnerId] = useState('');
  const [winnerCitation, setWinnerCitation] = useState('');
  const [prizeDetails, setPrizeDetails] = useState(award?.prizeDetails || '');
  const [formError, setFormError] = useState('');

  const [announceWinner, { isLoading: isAnnouncing }] = useAnnounceWinnerMutation();

  if (!isOpen || !award) return null;

  // Shortlisted or all nominated candidates list
  const rawNominations = award.nominations || [];
  const shortlisted = rawNominations.filter((n) => n.shortlisted);
  const candidatesToPick = shortlisted.length > 0 ? shortlisted : rawNominations;

  const nominees = candidatesToPick.map((n) => {
    const emp = typeof n.employeeId === 'object' ? n.employeeId : { _id: n.employeeId, name: 'Candidate' };
    return {
      _id: emp._id,
      name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Candidate',
      designation: emp.designation || '',
      citation: n.reason
    };
  });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-amber-500/5 dark:bg-[#15231B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-base flex items-center gap-2">
                <span>Announce Award Winner</span>
                <Sparkles className="h-4 w-4 text-amber-500" />
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
              Select Winner Candidate <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={winnerId}
              onChange={(e) => {
                const id = e.target.value;
                setWinnerId(id);
                const picked = nominees.find((n) => n._id?.toString() === id);
                if (picked && !winnerCitation) {
                  setWinnerCitation(`Recognized for exceptional dedication, performance, and contributions: ${picked.citation}`);
                }
              }}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
            >
              <option value="">-- Choose Winner --</option>
              {nominees.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.name} {n.designation ? `(${n.designation})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                Official Winner Citation & Speech <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-[#7E9E8F]">
                {winnerCitation.length}/1000 characters
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={winnerCitation}
              onChange={(e) => setWinnerCitation(e.target.value)}
              placeholder="e.g. Recognized for outstanding cross-team collaboration, high deliverable velocity, and exemplar company values..."
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] p-3 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all leading-relaxed placeholder:text-slate-400 dark:placeholder:text-[#7E9E8F]/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5 flex items-center gap-1.5">
              <Gift className="h-3.5 w-3.5 text-amber-500" />
              <span>Prize / Honors Package</span>
            </label>
            <input
              type="text"
              value={prizeDetails}
              onChange={(e) => setPrizeDetails(e.target.value)}
              placeholder="e.g. PKR 25,000 cash bonus + Trophy + Dedicated parking spot"
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3.5 py-2.5 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Announcing the winner immediately showcases them on the Honors hero banner company-wide.</span>
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
              disabled={isAnnouncing || !winnerId || winnerCitation.trim().length < 5}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trophy className="h-4 w-4" />
              <span>{isAnnouncing ? 'Publishing Winner...' : 'Publish & Crown Winner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
