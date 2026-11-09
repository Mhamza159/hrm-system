/**
 * @file ConversationList.jsx
 * @description Left sidebar listing active direct chats, custom groups, and department channels.
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Building,
  Plus,
  UserPlus,
  Search,
  CheckCheck,
  RefreshCw
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
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-card border-r border-border shrink-0 select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-base">Messages</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSyncDepartment}
            disabled={isSyncing}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
            title="Sync department channel"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onOpenNewGroup}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
            title="Create new group"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenNewChat}
            className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition flex items-center gap-1 text-xs font-medium px-2 py-1"
            title="Start direct conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-border/50">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-3 pt-2 gap-1 border-b border-border/30 text-xs">
        {[
          { id: 'all', label: 'All' },
          { id: 'direct', label: 'Direct' },
          { id: 'group', label: 'Groups' },
          { id: 'department', label: 'Channels' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-2.5 py-1.5 font-medium border-b-2 transition ${
              filterTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/20">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No conversations found.
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv._id === activeConversationId;
            const otherUser = conv.otherParticipant;
            const isOnline = otherUser ? isUserOnline(otherUser._id) : false;

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`p-3 flex items-center gap-3 cursor-pointer transition ${
                  isActive ? 'bg-primary/10 border-l-3 border-primary' : 'hover:bg-muted/40'
                }`}
              >
                {/* Avatar with Presence Indicator */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs overflow-hidden">
                    {conv.type === 'department' ? (
                      <Building className="w-5 h-5 text-primary" />
                    ) : conv.type === 'group' ? (
                      <Users className="w-5 h-5 text-primary" />
                    ) : otherUser?.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={conv.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      conv.name?.slice(0, 2).toUpperCase() || 'CO'
                    )}
                  </div>
                  {conv.type === 'direct' && (
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-card ${
                        isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                      }`}
                    />
                  )}
                </div>

                {/* Content Summary */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-xs truncate">{conv.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                      {formatLastTime(conv.lastMessageAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <p className="truncate text-[11px] pr-2">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="min-w-4.5 h-4.5 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
