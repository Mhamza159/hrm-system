/**
 * @file AwardsPage.jsx
 * @description Main Awards & Employee of the Month Management Dashboard (BUILD-GUIDE Row 20.1).
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Trophy,
  Plus,
  Vote,
  Sparkles,
  Users,
  Search,
  X,
  Building2,
  Gift,
} from "lucide-react";
import {
  useGetAwardsQuery,
  useShortlistNominationMutation,
  useUpdateAwardStatusMutation,
} from "../rewardsApi.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { getSocket } from "../../notifications/hooks/useSocket.js";
import { NominateModal } from "../components/NominateModal.jsx";
import { VotingCard } from "../components/VotingCard.jsx";
import { AnnounceWinnerModal } from "../components/AnnounceWinnerModal.jsx";
import { CreateAwardModal } from "../components/CreateAwardModal.jsx";
import { toast } from "sonner";

export const AwardsPage = () => {
  const { user } = useAuth();
  const { can, isSuperAdmin } = usePermission();

  const canManage = isSuperAdmin || can("rewards.manage", "Rewards");
  const canNominate = isSuperAdmin || can("rewards.nominate", "Rewards");
  const canVote = isSuperAdmin || can("rewards.vote", "Rewards");

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'nomination' | 'voting' | 'announced'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [activeAwardForNominate, setActiveAwardForNominate] = useState(null);
  const [activeAwardForAnnounce, setActiveAwardForAnnounce] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: awardsRes,
    isLoading,
    refetch,
  } = useGetAwardsQuery({
    month: selectedMonth || undefined,
    status: activeTab !== "all" ? activeTab : undefined,
  });

  const [shortlistNomination] = useShortlistNominationMutation();
  const [updateAwardStatus] = useUpdateAwardStatusMutation();

  const rawAwards = awardsRes?.data || [];

  // Filter awards by client-side search query
  const awards = useMemo(() => {
    if (!searchQuery.trim()) return rawAwards;
    const q = searchQuery.toLowerCase();
    return rawAwards.filter((a) => {
      const matchTitle = a.title?.toLowerCase().includes(q);
      const matchMonth = a.month?.toLowerCase().includes(q);
      const matchWinner = a.winnerId?.name?.toLowerCase().includes(q);
      const matchNominee = (a.nominations || []).some((n) =>
        (typeof n.employeeId === "object" ? n.employeeId?.name : "")
          ?.toLowerCase()
          .includes(q),
      );
      return matchTitle || matchMonth || matchWinner || matchNominee;
    });
  }, [rawAwards, searchQuery]);

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

  // Find most recent announced winner for showcase banner
  const announcedAward = useMemo(() => {
    return rawAwards.find((a) => a.status === "announced" && a.winnerId);
  }, [rawAwards]);

  // Active voting cycles
  const votingCycles = useMemo(() => {
    return rawAwards.filter((a) => a.status === "voting");
  }, [rawAwards]);

  // KPI calculations
  const kpiTotalCycles = rawAwards.length;
  const kpiNominations = rawAwards.filter(
    (a) => a.status === "nomination",
  ).length;
  const kpiVoting = rawAwards.filter((a) => a.status === "voting").length;
  const kpiAnnounced = rawAwards.filter((a) => a.status === "announced").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00C471]/10 text-[#00C471] rounded-2xl border border-[#00C471]/20">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Award & Honors
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
              Celebrate exceptional impact, nominate standout colleagues, and
              cast monthly honors ballots
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Launch Award Cycle</span>
          </button>
        )}
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Total Cycles
            </span>
            <Award className="h-4 w-4 text-[#00C471]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {kpiTotalCycles}
            </span>
            <span className="text-[11px] text-slate-400">All-time</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Accepting Nominations
            </span>
            <Users className="h-4 w-4 text-violet-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {kpiNominations}
            </span>
            <span className="text-[11px] text-violet-500 font-medium">
              Open phase
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Active Ballots
            </span>
            <Vote className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {kpiVoting}
            </span>
            <span className="text-[11px] text-amber-500 font-medium">
              Voting live
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Honors Crowned
            </span>
            <Trophy className="h-4 w-4 text-[#00C471]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {kpiAnnounced}
            </span>
            <span className="text-[11px] text-[#00C471] font-medium">
              Winners
            </span>
          </div>
        </div>
      </div>

      {/* Announced Winner Showcase Banner */}
      {announcedAward && (
        <div className="relative overflow-hidden rounded-3xl bg-[#111D17] border border-[#1A3125] p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#00C471]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00C471]/15 border border-[#00C471]/30 rounded-full text-xs font-bold uppercase tracking-wider text-[#00C471]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Winner Announced • {announcedAward.month}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F8FAFC]">
                {announcedAward.winnerId?.name}
              </h2>
              <p className="text-sm font-medium text-[#7E9E8F] flex items-center gap-2">
                <span>
                  {announcedAward.winnerId?.designation || "Team Leader"}
                </span>
                <span>•</span>
                <span className="text-slate-300">{announcedAward.title}</span>
              </p>
              <p className="text-xs text-slate-300 italic leading-relaxed pt-1 bg-[#0A110D]/50 border border-[#1A3125] rounded-xl p-3">
                "{announcedAward.winnerCitation}"
              </p>
              {announcedAward.prizeDetails && (
                <div className="pt-1 text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Gift className="h-4 w-4" />
                  <span>Honors Package: {announcedAward.prizeDetails}</span>
                </div>
              )}
            </div>

            <div className="shrink-0 self-center md:self-auto flex flex-col items-center gap-2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#00C471]/40 shadow-2xl flex items-center justify-center bg-[#00C471]/10 backdrop-blur-md text-3xl font-black">
                🏆
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#00C471] font-bold">
                Employee of the Month
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Ballot / Voting Cards Section */}
      {votingCycles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
              <Vote className="h-4 w-4 text-[#00C471]" />
              <span>Cast Your Official Ballot ({votingCycles.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Strictly 1 vote per employee
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {votingCycles.map((cycle) => (
              <VotingCard key={cycle._id} award={cycle} currentUser={user} />
            ))}
          </div>
        </div>
      )}

      {/* Award Cycles & Nominations Management */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-sm space-y-5">
        {/* Sub-header & Segmented Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
              Award Cycles & Nomination Registers
            </h3>
          </div>

          {/* Segmented Pill Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All Cycles" },
              { id: "nomination", label: "Accepting Nominations" },
              { id: "voting", label: "Voting Open" },
              { id: "announced", label: "Announced Winners" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-[#00C471] text-white shadow-sm"
                    : "text-slate-600 dark:text-[#7E9E8F] hover:bg-slate-100 dark:hover:bg-[#1A3125]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#7E9E8F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cycles, candidates, or winners..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] px-3 py-2 text-slate-700 dark:text-[#CBD5E1] font-mono focus:outline-none focus:ring-1 focus:ring-[#00C471]"
            />
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth("")}
                className="text-xs text-rose-500 hover:text-rose-600 px-2 py-1 font-semibold"
              >
                Clear Month
              </button>
            )}
          </div>
        </div>

        {/* Award Cycles List */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F] gap-2">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#00C471] border-t-transparent" />
            <span>Loading award cycles...</span>
          </div>
        ) : awards.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400 dark:text-[#7E9E8F] border border-dashed border-slate-200 dark:border-[#1A3125] rounded-2xl p-6">
            <Award className="h-8 w-8 mx-auto text-slate-300 dark:text-[#1A3125] mb-2" />
            <p className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
              No award cycles match your filter
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Try clearing your search query or switching tabs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {awards.map((award) => {
              const isNominationPhase = award.status === "nomination";
              const isVotingPhase = award.status === "voting";
              const isAnnounced = award.status === "announced";

              return (
                <div
                  key={award._id}
                  className="rounded-2xl border border-slate-200 dark:border-[#1A3125] p-5 bg-slate-50/50 dark:bg-[#0C1712] space-y-4 transition-all hover:border-slate-300 dark:hover:border-[#2D4A3A]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1A3125]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                            isNominationPhase
                              ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                              : isVotingPhase
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-[#00C471]/10 text-[#00C471] border border-[#00C471]/20"
                          }`}
                        >
                          {award.status}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-[#7E9E8F] font-mono">
                          Month: {award.month}
                        </span>
                        {award.departmentId && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {award.departmentId.name || "Department Specific"}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] mt-1.5">
                        {award.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Nominate button for managers & authorized nominators */}
                      {isNominationPhase && canNominate && (
                        <button
                          onClick={() => setActiveAwardForNominate(award)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C471]/10 hover:bg-[#00C471]/20 text-[#00C471] text-xs font-semibold rounded-xl transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Nominate Candidate</span>
                        </button>
                      )}

                      {/* Admin/HR Transition actions */}
                      {canManage && isNominationPhase && (
                        <button
                          onClick={() =>
                            handleStatusChange(award._id, "voting")
                          }
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <Vote className="h-3.5 w-3.5" />
                          <span>Open Voting Ballot</span>
                        </button>
                      )}

                      {canManage && isVotingPhase && (
                        <button
                          onClick={() => setActiveAwardForAnnounce(award)}
                          className="px-3 py-1.5 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <Trophy className="h-3.5 w-3.5" />
                          <span>Announce Winner</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nominations List */}
                  <div>
                    <h5 className="text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-2.5">
                      Nominated Candidates ({(award.nominations || []).length})
                    </h5>

                    {(award.nominations || []).length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-[#7E9E8F] italic py-2">
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
                              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                                nom.shortlisted
                                  ? "border-[#00C471]/40 bg-[#00C471]/5 dark:bg-[#00C471]/10"
                                  : "border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h6 className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                                    {nominee.name || "Nominee"}
                                  </h6>
                                  <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F]">
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
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                                      nom.shortlisted
                                        ? "bg-[#00C471] text-white shadow-sm"
                                        : "bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-200 dark:hover:bg-[#2D4A3A]"
                                    }`}
                                  >
                                    {nom.shortlisted
                                      ? "Shortlisted ✓"
                                      : "Shortlist"}
                                  </button>
                                )}

                                {!canManage && nom.shortlisted && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#00C471]/10 text-[#00C471]">
                                    Shortlisted
                                  </span>
                                )}
                              </div>

                              <p className="text-slate-600 dark:text-[#CBD5E1] text-xs italic leading-relaxed">
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
