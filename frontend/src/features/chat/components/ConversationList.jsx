/**
 * @file ConversationList.jsx
 * @description Left sidebar listing active direct chats, custom groups, and department channels.
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Building2,
  Plus,
  Search,
  RefreshCw,
  Archive
} from 'lucide-react';

export const ConversationList = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onOpenNewChat,
  onOpenNewGroup,
  onSyncDepartment,
  isSyncing = false,
  isUserOnline
}) => {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'direct' | 'group' | 'department'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) => {
    // Filter by tab
    if (filterTab !== 'all' && c.type !== filterTab) {
      return false;
    }
    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchLastMsg = c.lastMessage?.content?.toLowerCase().includes(q);
      return matchName || matchLastMsg;
    }
    return true;
  });

  const formatLastTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-white dark:bg-[#111D17] border-r border-slate-200 dark:border-[#1A3125] shrink-0 select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">Messages</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSyncDepartment}
            disabled={isSyncing}
            className="p-1.5 rounded-lg text-slate-500 dark:text-[#7E9E8F] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#0A110D] transition-all"
            title="Sync department channel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#00C471]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onOpenNewGroup}
            className="p-1.5 rounded-lg text-slate-500 dark:text-[#7E9E8F] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#0A110D] transition-all"
            title="Create new group"
          >
            <Users className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenNewChat}
            className="px-2.5 py-1 rounded-lg bg-[#00C471] hover:bg-[#00B064] text-white transition-all flex items-center gap-1 text-xs font-semibold shadow-xs"
            title="Start direct conversation"
          >
            <Plus className="w-3 h-3" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-200/80 dark:border-[#1A3125]/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-[#7E9E8F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D]"
          />
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="px-3 py-2 border-b border-slate-200/80 dark:border-[#1A3125]/80 flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'all', label: 'All' },
          { id: 'direct', label: 'Direct' },
          { id: 'group', label: 'Groups' },
          { id: 'department', label: 'Dept' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterTab(tab.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterTab === tab.id
                ? 'bg-[#00C471] text-white shadow-xs'
                : 'text-slate-600 dark:text-[#7E9E8F] hover:bg-slate-100 dark:hover:bg-[#0A110D]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1A3125]/40">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 dark:text-[#7E9E8F]">
            {searchQuery
              ? `No chats matching "${searchQuery}"`
              : 'No conversations found in this view.'}
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isSelected = c._id === activeConversationId;
            const otherUser = c.otherParticipant;
            const isOnline = otherUser ? isUserOnline(otherUser._id) : false;
            const isDirect = c.type === 'direct';
            const isDept = c.type === 'department';

            return (
              <button
                key={c._id}
                type="button"
                onClick={() => onSelectConversation(c._id)}
                className={`w-full p-3 flex items-start gap-3 transition-colors text-left relative ${
                  isSelected
                    ? 'bg-[#00C471]/10 border-l-2 border-[#00C471]'
                    : 'hover:bg-slate-50 dark:hover:bg-[#0A110D]'
                }`}
              >
                {/* Avatar with Presence Indicator */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] flex items-center justify-center font-bold text-xs text-[#00C471]">
                    {c.displayAvatar ? (
                      <img
                        src={c.displayAvatar}
                        alt={c.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : isDept ? (
                      <Building2 className="w-4 h-4 text-amber-500" />
                    ) : isDirect ? (
                      c.name?.slice(0, 2).toUpperCase() || 'CO'
                    ) : (
                      <Users className="w-4 h-4 text-[#00C471]" />
                    )}
                  </div>

                  {/* Presence dot for direct chats */}
                  {isDirect && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#111D17] ${
                        isOnline ? 'bg-[#00C471]' : 'bg-slate-300 dark:bg-[#4E6E5D]'
                      }`}
                    />
                  )}
                </div>

                {/* Content preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-semibold text-xs truncate max-w-[170px] ${
                        isSelected
                          ? 'text-[#00C471] font-bold'
                          : 'text-slate-900 dark:text-[#F8FAFC]'
                      }`}
                    >
                      {c.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-[#7E9E8F] shrink-0 ml-1">
                      {formatLastTime(c.lastMessageAt || c.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] truncate flex-1 leading-snug">
                      {c.isArchived ? (
                        <span className="inline-flex items-center gap-1 text-amber-500 italic">
                          <Archive className="w-3 h-3" /> Archived
                        </span>
                      ) : (
                        c.lastMessage?.content || 'No messages yet'
                      )}
                    </p>

                    {/* Unread badge */}
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#00C471] text-white shadow-xs">
                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
