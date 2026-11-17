/**
 * @file VotingCard.jsx
 * @description Ballot Voting Card for Shortlisted Award Nominees (BUILD-GUIDE Row 20.1).
 */

import React, { useState } from "react";
import {
  Check,
  Vote,
  Clock,
  ShieldCheck,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useCastVoteMutation,
  useGetAwardVoteStatsQuery,
} from "../rewardsApi.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { toast } from "sonner";

export const VotingCard = ({ award }) => {
  const { can, isSuperAdmin } = usePermission();
  const canManage = isSuperAdmin || can("rewards.manage", "Rewards");
  const canVote = isSuperAdmin || can("rewards.vote", "Rewards");

  const [selectedNomineeId, setSelectedNomineeId] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [castVote, { isLoading: isVoting }] = useCastVoteMutation();

  const { data: statsRes, isLoading: isLoadingStats } =
    useGetAwardVoteStatsQuery(award._id, {
      skip: !showStats || !canManage,
    });
  const voteStats = statsRes?.data;

  const shortlistedNominations = (award.nominations || []).filter(
    (n) => n.shortlisted === true,
  );
  const isDeadlinePassed = new Date() > new Date(award.votingDeadline);
  const isOpenForVoting = award.status === "voting" && !isDeadlinePassed;

  const handleVote = async () => {
    if (!selectedNomineeId) {
      toast.error("Please select a candidate before casting your vote.");
      return;
    }

    try {
      await castVote({
        awardId: award._id,
        nomineeId: selectedNomineeId,
      }).unwrap();

      toast.success("Your vote has been counted!");
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "Failed to submit vote.",
      );
    }
  };

  return (
    <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Official Ballot
              </span>
              <span className="text-xs text-slate-500 dark:text-[#7E9E8F] flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Closes: {new Date(award.votingDeadline).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
              {award.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {canManage && (
              <button
                type="button"
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-[#1A3125] hover:bg-slate-50 dark:hover:bg-[#1A3125] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold rounded-xl transition-all"
              >
                <BarChart3 className="h-3.5 w-3.5 text-[#00C471]" />
                <span>{showStats ? "Hide Tally" : "Inspect Tally"}</span>
                {showStats ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {award.hasVoted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C471]/10 border border-[#00C471]/20 rounded-xl text-[#00C471] text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Ballot Cast</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Tally for Authorized Managers */}
        {showStats && canManage && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-[#00C471]" />
                Live Vote Distribution
              </span>
              <span className="font-mono text-slate-500 dark:text-[#7E9E8F]">
                Total Ballots:{" "}
                <strong className="text-slate-900 dark:text-[#F8FAFC]">
                  {voteStats?.totalVotes || 0}
                </strong>
              </span>
            </div>

            {isLoadingStats ? (
              <div className="py-2 text-xs text-slate-400 flex items-center justify-center">
                Computing real-time tally...
              </div>
            ) : !voteStats?.breakdown || voteStats.breakdown.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No votes cast yet in this cycle.
              </p>
            ) : (
              <div className="space-y-2">
                {voteStats.breakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-800 dark:text-[#CBD5E1]">
                        {item.nominee?.name || "Candidate"}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-[#7E9E8F]">
                        {item.votes} votes ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-[#1A3125] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00C471] rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shortlisted Candidates */}
        <div className="mt-4 space-y-2.5">
          {shortlistedNominations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-[#7E9E8F] border border-dashed border-slate-200 dark:border-[#1A3125] rounded-xl">
              No candidates shortlisted for voting yet.
            </div>
          ) : (
            shortlistedNominations.map((nom) => {
              const nominee = nom.employeeId || {};
              const nomineeId = nominee._id
                ? nominee._id.toString()
                : nom.employeeId?.toString();
              const isSelected = selectedNomineeId === nomineeId;
              const isUserVotedForThis = award.votedNomineeId === nomineeId;

              return (
                <label
                  key={nom._id}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isUserVotedForThis
                      ? "border-[#00C471] bg-[#00C471]/10 dark:bg-[#00C471]/15"
                      : isSelected
                        ? "border-[#00C471] bg-[#00C471]/5 dark:bg-[#00C471]/10 ring-1 ring-[#00C471]"
                        : "border-slate-200 dark:border-[#1A3125] hover:border-slate-300 dark:hover:border-[#2D4A3A] bg-white dark:bg-[#13221B]"
                  } ${award.hasVoted || !isOpenForVoting || !canVote ? "cursor-default pointer-events-none" : ""}`}
                >
                  {!award.hasVoted && isOpenForVoting && canVote && (
                    <input
                      type="radio"
                      name={`vote-${award._id}`}
                      value={nomineeId}
                      checked={isSelected}
                      onChange={() => setSelectedNomineeId(nomineeId)}
                      className="mt-1 h-4 w-4 text-[#00C471] border-slate-300 dark:border-[#1A3125] focus:ring-[#00C471]"
                    />
                  )}

                  {isUserVotedForThis && (
                    <div className="mt-0.5 p-1 bg-[#00C471] text-white rounded-full">
                      <Check className="h-3 w-3" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                        {nominee.name || "Nominated Candidate"}
                      </h4>
                      {nominee.designation && (
                        <span className="text-[11px] text-slate-500 dark:text-[#7E9E8F]">
                          {nominee.designation}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#CBD5E1] mt-1 italic leading-relaxed">
                      "{nom.reason}"
                    </p>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>

      {/* Action Footer */}
      {!award.hasVoted &&
        isOpenForVoting &&
        canVote &&
        shortlistedNominations.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#1A3125] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F]">
              One ballot per employee. Votes are counted confidentially.
            </p>
            <button
              onClick={handleVote}
              disabled={isVoting || !selectedNomineeId}
              className="px-5 py-2 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Vote className="h-4 w-4" />
              <span>{isVoting ? "Casting Vote..." : "Cast My Ballot"}</span>
            </button>
          </div>
        )}
    </div>
  );
};
