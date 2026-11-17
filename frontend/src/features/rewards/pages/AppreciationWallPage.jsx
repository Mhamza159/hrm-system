/**
 * @file AppreciationWallPage.jsx
 * @description Peer Recognition & Appreciation Kudos Wall (BUILD-GUIDE Row 20.2).
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Plus,
  Heart,
  Award,
  Search,
  X,
  MessageSquare,
} from "lucide-react";
import { useGetKudosQuery } from "../rewardsApi.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { getSocket } from "../../notifications/hooks/useSocket.js";
import { KudosCard } from "../components/KudosCard.jsx";
import { GiveKudosModal } from "../components/GiveKudosModal.jsx";

const BADGE_FILTERS = [
  "All",
  "Team Player",
  "Problem Solver",
  "Customer Hero",
  "Innovation Champ",
  "Leadership Star",
  "Above & Beyond",
  "Rockstar",
];

export const AppreciationWallPage = () => {
  const { can, isSuperAdmin } = usePermission();
  const canKudos = isSuperAdmin || can("rewards.kudos", "Rewards");

  const [selectedBadge, setSelectedBadge] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGiveKudosOpen, setIsGiveKudosOpen] = useState(false);

  const {
    data: kudosRes,
    isLoading,
    refetch,
  } = useGetKudosQuery({
    badge: selectedBadge !== "All" ? selectedBadge : undefined,
    limit: 60,
  });

  const rawKudosList = kudosRes?.data?.kudos || kudosRes?.data || [];
  const kudosListArray = Array.isArray(rawKudosList) ? rawKudosList : [];

  // Filter kudos by client-side search query
  const filteredKudos = useMemo(() => {
    if (!searchQuery.trim()) return kudosListArray;
    const q = searchQuery.toLowerCase();
    return kudosListArray.filter((k) => {
      const sender = (k.senderId?.name || "").toLowerCase();
      const receiver = (k.receiverId?.name || "").toLowerCase();
      const msg = (k.message || "").toLowerCase();
      const badge = (k.badge || "").toLowerCase();
      return (
        sender.includes(q) ||
        receiver.includes(q) ||
        msg.includes(q) ||
        badge.includes(q)
      );
    });
  }, [kudosListArray, searchQuery]);

  // Aggregate stats
  const totalKudos = kudosListArray.length;
  const totalLikes = useMemo(() => {
    return kudosListArray.reduce(
      (acc, k) => acc + (k.likesCount || (k.likes || []).length || 0),
      0,
    );
  }, [kudosListArray]);

  // Real-time socket listener for incoming kudos
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewKudos = () => {
      refetch();
    };

    socket.on("kudos:created", handleNewKudos);

    return () => {
      socket.off("kudos:created", handleNewKudos);
    };
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00C471]/10 text-[#00C471] rounded-2xl border border-[#00C471]/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Peer Appreciation Wall
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
              Celebrate team wins, acknowledge everyday contributions, and send
              recognition badges
            </p>
          </div>
        </div>

        {canKudos && (
          <button
            onClick={() => setIsGiveKudosOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Send Kudos</span>
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Total Kudos Shared
            </span>
            <MessageSquare className="h-4 w-4 text-[#00C471]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {totalKudos}
            </span>
            <span className="text-[11px] text-slate-400">Wall posts</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Badges Awarded
            </span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {totalKudos}
            </span>
            <span className="text-[11px] text-amber-500 font-medium">
              Peer honors
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Community Cheers
            </span>
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {totalLikes}
            </span>
            <span className="text-[11px] text-rose-500 font-medium">
              Reactions
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar: Badges & Search */}
      <div className="space-y-3">
        {/* Horizontal Badge Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {BADGE_FILTERS.map((badge) => (
            <button
              key={badge}
              onClick={() => setSelectedBadge(badge)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBadge === badge
                  ? "bg-[#00C471] text-white shadow-sm"
                  : "bg-white dark:bg-[#111D17] text-slate-600 dark:text-[#7E9E8F] border border-slate-200 dark:border-[#1A3125] hover:border-slate-300 dark:hover:border-[#2D4A3A]"
              }`}
            >
              {badge}
            </button>
          ))}
        </div>

        {/* Text Search Bar */}
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#7E9E8F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender, recipient, badge or message..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
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
      </div>

      {/* Kudos Feed Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F] gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C471] border-t-transparent" />
          <span>Loading appreciation feed...</span>
        </div>
      ) : filteredKudos.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center bg-white dark:bg-[#111D17] rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] p-8">
          <Sparkles className="h-10 w-10 text-slate-300 dark:text-[#1A3125] mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">
            No appreciation posts found
          </h3>
          <p className="text-xs text-slate-400 dark:text-[#7E9E8F] mt-1 max-w-sm">
            {searchQuery
              ? "No kudos match your search criteria. Try a different query."
              : "Be the first to recognize a colleague who made your day better!"}
          </p>
          {canKudos && (
            <button
              onClick={() => setIsGiveKudosOpen(true)}
              className="mt-4 px-4 py-2 bg-[#00C471]/10 hover:bg-[#00C471]/20 text-[#00C471] text-xs font-semibold rounded-xl transition-colors"
            >
              Send First Kudos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKudos.map((kudos) => (
            <KudosCard key={kudos._id} kudos={kudos} />
          ))}
        </div>
      )}

      {/* Give Kudos Modal */}
      <GiveKudosModal
        isOpen={isGiveKudosOpen}
        onClose={() => setIsGiveKudosOpen(false)}
      />
    </div>
  );
};
