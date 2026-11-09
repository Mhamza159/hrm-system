/**
 * @file VotingCard.jsx
 * @description Ballot Voting Card for Shortlisted Award Nominees (BUILD-GUIDE Row 20.1).
 */

import React, { useState } from 'react';
import { Award, Check, Vote, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { useCastVoteMutation } from '../rewardsApi.js';
import { toast } from 'sonner';

export const VotingCard = ({ award, currentUser }) => {
  const [selectedNomineeId, setSelectedNomineeId] = useState('');
  const [castVote, { isLoading: isVoting }] = useCastVoteMutation();

  const shortlistedNominations = (award.nominations || []).filter((n) => n.shortlisted === true);

  const isDeadlinePassed = new Date() > new Date(award.votingDeadline);
  const isOpenForVoting = award.status === 'voting' && !isDeadlinePassed;

  const handleVote = async () => {
    if (!selectedNomineeId) {
      toast.error('Please select a candidate before casting your vote.');
      return;
    }

    try {
      await castVote({
        awardId: award._id,
        nomineeId: selectedNomineeId
      }).unwrap();

      toast.success('Your vote has been counted!');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to submit vote.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              Active Ballot
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Deadline: {new Date(award.votingDeadline).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
            {award.title}
          </h3>
        </div>

        {award.hasVoted && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold self-start sm:self-auto">
            <ShieldCheck className="h-4 w-4" />
            <span>Ballot Cast</span>
          </div>
        )}
      </div>

      {/* Shortlisted Candidates */}
      <div className="mt-5 space-y-3">
        {shortlistedNominations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No candidates shortlisted for voting yet.
          </div>
        ) : (
          shortlistedNominations.map((nom) => {
            const nominee = nom.employeeId || {};
            const nomineeId = nominee._id ? nominee._id.toString() : nom.employeeId?.toString();
            const isSelected = selectedNomineeId === nomineeId;
            const isUserVotedForThis = award.votedNomineeId === nomineeId;

            return (
              <label
                key={nom._id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  isUserVotedForThis
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : isSelected
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950'
                } ${award.hasVoted || !isOpenForVoting ? 'cursor-default pointer-events-none' : ''}`}
              >
                {!award.hasVoted && isOpenForVoting && (
                  <input
                    type="radio"
                    name={`vote-${award._id}`}
                    value={nomineeId}
                    checked={isSelected}
                    onChange={() => setSelectedNomineeId(nomineeId)}
                    className="mt-1 h-4 w-4 text-primary border-slate-300 focus:ring-primary"
                  />
                )}

                {isUserVotedForThis && (
                  <div className="mt-0.5 p-1 bg-emerald-500 text-white rounded-full">
                    <Check className="h-3 w-3" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {nominee.name || 'Nominated Candidate'}
                    </h4>
                    {nominee.designation && (
                      <span className="text-[11px] text-slate-500">{nominee.designation}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic leading-relaxed">
                    "{nom.reason}"
                  </p>
                </div>
              </label>
            );
          })
        )}
      </div>

      {/* Action Footer */}
      {!award.hasVoted && isOpenForVoting && shortlistedNominations.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            One ballot per employee. Votes are counted anonymously.
          </p>
          <button
            onClick={handleVote}
            disabled={isVoting || !selectedNomineeId}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Vote className="h-4 w-4" />
            <span>{isVoting ? 'Casting Vote...' : 'Cast My Vote'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
