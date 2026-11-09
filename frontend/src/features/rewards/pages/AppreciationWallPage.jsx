/**
 * @file AppreciationWallPage.jsx
 * @description Peer Recognition & Appreciation Kudos Wall (BUILD-GUIDE Row 20.2).
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Filter, Heart, Users, Star, Award, Zap, Lightbulb, Target } from 'lucide-react';
import { useGetKudosQuery } from '../rewardsApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { getSocket } from '../../notifications/hooks/useSocket.js';
import { KudosCard } from '../components/KudosCard.jsx';
import { GiveKudosModal } from '../components/GiveKudosModal.jsx';

const BADGE_FILTERS = [
  'All',
  'Team Player',
  'Problem Solver',
  'Customer Hero',
  'Innovation Champ',
  'Leadership Star',
  'Above & Beyond',
  'Rockstar'
];

export const AppreciationWallPage = () => {
  const { user } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState('All');
  const [isGiveKudosOpen, setIsGiveKudosOpen] = useState(false);

  const { data: kudosRes, isLoading, refetch } = useGetKudosQuery({
    badge: selectedBadge !== 'All' ? selectedBadge : undefined,
    limit: 50
  });

  const kudosList = kudosRes?.data || [];

  // Real-time socket listener for incoming kudos
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewKudos = () => {
      refetch();
    };

    socket.on('kudos:created', handleNewKudos);

    return () => {
      socket.off('kudos:created', handleNewKudos);
    };
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Peer Appreciation Wall
              </h1>
              <p className="text-xs text-slate-500">
                Celebrate teammates, acknowledge daily contributions, and send recognition badges
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsGiveKudosOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Send Kudos</span>
        </button>
      </div>

      {/* Filter Chips by Badge */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {BADGE_FILTERS.map((badge) => (
          <button
            key={badge}
            onClick={() => setSelectedBadge(badge)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedBadge === badge
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {badge}
          </button>
        ))}
      </div>

      {/* Kudos Grid */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span>Loading appreciation wall...</span>
        </div>
      ) : kudosList.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No kudos posted yet in this category
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Be the first to recognize a colleague who made your day better!
          </p>
          <button
            onClick={() => setIsGiveKudosOpen(true)}
            className="mt-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-xl transition-colors"
          >
            Send First Kudos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kudosList.map((kudos) => (
            <KudosCard key={kudos._id} kudos={kudos} />
          ))}
        </div>
      )}

      {/* Give Kudos Modal */}
      <GiveKudosModal
        isOpen={isGiveKudosOpen}
        onClose={() => setIsGiveKudosOpen(false)}
        currentUserId={user?._id}
      />
    </div>
  );
};

