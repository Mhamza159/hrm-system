/**
 * @file AwardsPage.jsx
 * @description Main Awards & Employee of the Month Management Dashboard (BUILD-GUIDE Row 20.1).
 */

import React, { useState, useEffect } from "react";
import {
  Award,
  Trophy,
  Plus,
  Vote,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
  Check,
  Sparkles,
  Users,
} from "lucide-react";
import {
  useGetAwardsQuery,
  useShortlistNominationMutation,
  useUpdateAwardStatusMutation,
} from "../rewardsApi.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { getSocket } from "../../notifications/hooks/useSocket.js";
import { NominateModal } from "../components/NominateModal.jsx";
import { VotingCard } from "../components/VotingCard.jsx";
import { AnnounceWinnerModal } from "../components/AnnounceWinnerModal.jsx";
import { CreateAwardModal } from "../components/CreateAwardModal.jsx";
import { toast } from "sonner";

export const AwardsPage = () => {
  const { user, isHR, isSuperAdmin, isDeptManager } = useAuth();
  const canManage = isSuperAdmin || isHR;
  const canNominate = isSuperAdmin || isHR || isDeptManager;

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [activeAwardForNominate, setActiveAwardForNominate] = useState(null);
  const [activeAwardForAnnounce, setActiveAwardForAnnounce] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: awardsRes,
    isLoading,
    refetch,
  } = useGetAwardsQuery({
    month: selectedMonth || undefined,
    status: selectedStatus || undefined,
  });

  const [shortlistNomination] = useShortlistNominationMutation();
  const [updateAwardStatus] = useUpdateAwardStatusMutation();

  const awards = awardsRes?.data || [];

  // WebSocket live listeners for real-time award updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAwardUpdate = () => {
      refetch();
    };

    socket.on("award:voted", handleAwardUpdate);
    socket.on("award:statusUpdated", handleAwardUpdate);
    socket.on("award:announced", handleAwardUpdate);

    return () => {
      socket.off("award:voted", handleAwardUpdate);
      socket.off("award:statusUpdated", handleAwardUpdate);
      socket.off("award:announced", handleAwardUpdate);
    };
  }, [refetch]);

  const handleToggleShortlist = async (
    awardId,
    nominationId,
    currentShortlisted,
  ) => {
    try {
      await shortlistNomination({
        awardId,
        nominationId,
        shortlisted: !currentShortlisted,
      }).unwrap();
      toast.success(
        !currentShortlisted
          ? "Candidate shortlisted for voting"
          : "Removed from shortlist",
      );
    } catch (err) {
      toast.error("Failed to update shortlist status.");
    }
  };

  const handleStatusChange = async (awardId, newStatus) => {
    try {
      await updateAwardStatus({ awardId, status: newStatus }).unwrap();
      toast.success(`Award cycle status updated to "${newStatus}"`);
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  // Find recent announced winner for showcase banner
  const announcedAward = awards.find(
    (a) => a.status === "announced" && a.winnerId,
  );

  // Active voting cycles
  const votingCycles = awards.filter((a) => a.status === "voting");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Employee of the Month & Honors
              </h1>
              <p className="text-xs text-slate-500">
                Recognize outstanding performance, nominate peers, and cast
                monthly award ballots
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canManage && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Launch Cycle</span>
            </button>
          )}
        </div>
      </div>

      {/* Announced Winner Showcase Banner */}
      {announcedAward && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Winner Announced • {announcedAward.month}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {announcedAward.winnerId?.name}
              </h2>
              <p className="text-sm font-medium text-amber-100">
                {announcedAward.winnerId?.designation || "Team Leader"} •{" "}
                {announcedAward.title}
              </p>
              <p className="text-xs text-white/90 italic leading-relaxed pt-1">
                "{announcedAward.winnerCitation}"
              </p>
              {announcedAward.prizeDetails && (
                <div className="pt-2 text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4" />
                  <span>Prize: {announcedAward.prizeDetails}</span>
                </div>
              )}
            </div>

            <div className="shrink-0 self-center sm:self-auto">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/30 shadow-2xl flex items-center justify-center bg-white/10 backdrop-blur-md text-3xl font-black">
                🏆
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Ballot / Voting Cards Section */}
      {votingCycles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Vote className="h-4 w-4 text-primary" />
            <span>Cast Your Ballot</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {votingCycles.map((cycle) => (
              <VotingCard key={cycle._id} award={cycle} currentUser={user} />
            ))}
          </div>
        </div>
      )}

      {/* Award Cycles & Nominations Management */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Award Cycles & Nominations</span>
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Statuses</option>
              <option value="nomination">Accepting Nominations</option>
              <option value="voting">Open for Voting</option>
              <option value="announced">Winner Announced</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span>Loading award cycles...</span>
          </div>
        ) : awards.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No award cycles found.
          </div>
        ) : (
          <div className="space-y-6">
            {awards.map((award) => {
              const isNominationPhase = award.status === "nomination";
              const isVotingPhase = award.status === "voting";
              const isAnnounced = award.status === "announced";

              return (
                <div
                  key={award._id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/40 dark:bg-slate-950/40 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                            isNominationPhase
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : isVotingPhase
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {award.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          Month: {award.month}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {award.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Nominate button for managers & HR during nomination phase */}
                      {isNominationPhase && canNominate && (
                        <button
                          onClick={() => setActiveAwardForNominate(award)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-xl transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Nominate Candidate</span>
                        </button>
                      )}

                      {/* HR Transition actions */}
                      {canManage && isNominationPhase && (
                        <button
                          onClick={() =>
                            handleStatusChange(award._id, "voting")
                          }
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          Open Voting Ballot
                        </button>
                      )}

                      {canManage && isVotingPhase && (
                        <button
                          onClick={() => setActiveAwardForAnnounce(award)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <Trophy className="h-3.5 w-3.5" />
                          <span>Announce Winner</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nominations List */}
                  <div>
                    <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Nominated Candidates ({(award.nominations || []).length})
                    </h5>

                    {(award.nominations || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No nominations submitted yet for this cycle.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {award.nominations.map((nom) => {
                          const nominee = nom.employeeId || {};
                          const nominator = nom.nominatedBy || {};

                          return (
                            <div
                              key={nom._id}
                              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                                nom.shortlisted
                                  ? "border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20"
                                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h6 className="font-bold text-slate-900 dark:text-slate-100">
                                    {nominee.name || "Nominee"}
                                  </h6>
                                  <p className="text-[11px] text-slate-400">
                                    Nominated by {nominator.name || "Manager"}
                                  </p>
                                </div>

                                {canManage && isNominationPhase && (
                                  <button
                                    onClick={() =>
                                      handleToggleShortlist(
                                        award._id,
                                        nom._id,
                                        nom.shortlisted,
                                      )
                                    }
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                                      nom.shortlisted
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                                    }`}
                                  >
                                    {nom.shortlisted
                                      ? "Shortlisted ✓"
                                      : "Shortlist"}
                                  </button>
                                )}

                                {!canManage && nom.shortlisted && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    Shortlisted
                                  </span>
                                )}
                              </div>

                              <p className="text-slate-600 dark:text-slate-300 text-xs italic leading-relaxed">
                                "{nom.reason}"
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAwardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <NominateModal
        isOpen={Boolean(activeAwardForNominate)}
        onClose={() => setActiveAwardForNominate(null)}
        award={activeAwardForNominate}
      />

      <AnnounceWinnerModal
        isOpen={Boolean(activeAwardForAnnounce)}
        onClose={() => setActiveAwardForAnnounce(null)}
        award={activeAwardForAnnounce}
      />
    </div>
  );
};
