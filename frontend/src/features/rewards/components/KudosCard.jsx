/**
 * @file KudosCard.jsx
 * @description Card component for peer recognition kudos with likes (BUILD-GUIDE Row 20.2).
 */

import React, { useState } from "react";
import {
  ArrowRight,
  Heart,
  Sparkles,
  Lightbulb,
  Zap,
  Star,
  Users,
  Target,
  Award,
} from "lucide-react";
import { useToggleLikeKudosMutation } from "../rewardsApi.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { toast } from "sonner";

const BADGE_MAP = {
  "Team Player": {
    icon: Users,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  "Problem Solver": {
    icon: Lightbulb,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  "Customer Hero": {
    icon: Heart,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
  "Innovation Champ": {
    icon: Zap,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  "Leadership Star": {
    icon: Star,
    color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  },
  "Above & Beyond": {
    icon: Target,
    color: "text-[#00C471] bg-[#00C471]/10 border-[#00C471]/20",
  },
  Rockstar: {
    icon: Award,
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
};

export const KudosCard = ({ kudos }) => {
  const { can, isSuperAdmin } = usePermission();
  const canKudos = isSuperAdmin || can("rewards.kudos", "Rewards");

  const [toggleLike, { isLoading: isLiking }] = useToggleLikeKudosMutation();

  // Optimistic like state
  const [localHasLiked, setLocalHasLiked] = useState(Boolean(kudos.hasLiked));
  const [localLikesCount, setLocalLikesCount] = useState(kudos.likesCount || 0);

  const badgeConfig = BADGE_MAP[kudos.badge] || {
    icon: Sparkles,
    color: "text-[#00C471] bg-[#00C471]/10 border-[#00C471]/20",
  };
  const BadgeIcon = badgeConfig.icon;

  const handleLike = async () => {
    if (!canKudos) {
      toast.error("You do not have permission to react to kudos.");
      return;
    }

    const nextLiked = !localHasLiked;
    const nextCount = nextLiked
      ? localLikesCount + 1
      : Math.max(0, localLikesCount - 1);

    // Optimistic UI update
    setLocalHasLiked(nextLiked);
    setLocalLikesCount(nextCount);

    try {
      const res = await toggleLike(kudos._id).unwrap();
      if (res?.data) {
        setLocalHasLiked(res.data.hasLiked);
        setLocalLikesCount(res.data.likesCount);
      }
    } catch (_err) {
      // Revert on error
      setLocalHasLiked(!nextLiked);
      setLocalLikesCount(localLikesCount);
      toast.error("Failed to update reaction.");
    }
  };

  const sender = kudos.senderId || {};
  const receiver = kudos.receiverId || {};

  const senderName = sender.name || "Colleague";
  const receiverName = receiver.name || "Colleague";

  return (
    <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-[#2D4A3A] flex flex-col justify-between">
      <div>
        {/* Header with Sender -> Receiver flow */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Sender Initials */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#1A3125] text-slate-700 dark:text-[#CBD5E1] font-bold text-[10px] flex items-center justify-center">
                {senderName.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                {senderName}
              </span>
            </div>

            <ArrowRight className="h-3 w-3 text-slate-400 dark:text-[#7E9E8F]" />

            {/* Receiver Initials */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#00C471]/15 text-[#00C471] font-bold text-[10px] flex items-center justify-center">
                {receiverName.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-[#00C471]">{receiverName}</span>
            </div>
          </div>

          {/* Badge Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap ${badgeConfig.color}`}
          >
            <BadgeIcon className="h-3.5 w-3.5" />
            <span>{kudos.badge}</span>
          </div>
        </div>

        {/* Message Quote */}
        <p className="mt-3.5 text-xs text-slate-700 dark:text-[#CBD5E1] leading-relaxed font-normal italic">
          "{kudos.message}"
        </p>
      </div>

      {/* Footer / Reactions & Timestamp */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
        <span className="text-[11px] text-slate-400 dark:text-[#7E9E8F] font-mono">
          {new Date(kudos.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        <button
          onClick={handleLike}
          disabled={isLiking || !canKudos}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
            localHasLiked
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
              : "text-slate-500 dark:text-[#7E9E8F] hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1A3125]"
          } ${!canKudos ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-transform ${
              localHasLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
            }`}
          />
          <span className="font-mono tabular-nums">{localLikesCount}</span>
        </button>
      </div>
    </div>
  );
};
