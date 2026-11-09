/**
 * @file KudosCard.jsx
 * @description Card component for peer recognition kudos with likes (BUILD-GUIDE Row 20.2).
 */

import React from 'react';
import { ThumbsUp, ArrowRight, Heart, Sparkles, Lightbulb, Zap, Star, Users, Target, Award } from 'lucide-react';
import { useToggleLikeKudosMutation } from '../rewardsApi.js';
import { toast } from 'sonner';

const BADGE_MAP = {
  'Team Player': { icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200' },
  'Problem Solver': { icon: Lightbulb, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' },
  'Customer Hero': { icon: Heart, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200' },
  'Innovation Champ': { icon: Zap, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200' },
  'Leadership Star': { icon: Star, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200' },
  'Above & Beyond': { icon: Target, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' },
  'Rockstar': { icon: Award, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' }
};

export const KudosCard = ({ kudos }) => {
  const [toggleLike, { isLoading: isLiking }] = useToggleLikeKudosMutation();

  const badgeConfig = BADGE_MAP[kudos.badge] || {
    icon: Sparkles,
    color: 'text-primary bg-primary/10 border-primary/20'
  };
  const BadgeIcon = badgeConfig.icon;

  const handleLike = async () => {
    try {
      await toggleLike(kudos._id).unwrap();
    } catch (err) {
      toast.error('Failed to react to kudos.');
    }
  };

  const senderName = kudos.senderId?.name || 'Colleague';
  const receiverName = kudos.receiverId?.name || 'Colleague';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with Sender -> Receiver */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-900 dark:text-slate-100">{senderName}</span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="font-bold text-primary">{receiverName}</span>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${badgeConfig.color}`}>
          <BadgeIcon className="h-3.5 w-3.5" />
          <span>{kudos.badge}</span>
        </div>
      </div>

      {/* Message */}
      <p className="mt-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
        "{kudos.message}"
      </p>

      {/* Footer / Reactions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {new Date(kudos.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>

        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
            kudos.hasLiked
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-transform ${
              kudos.hasLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
            }`}
          />
          <span>{kudos.likesCount || 0}</span>
        </button>
      </div>
    </div>
  );
};
