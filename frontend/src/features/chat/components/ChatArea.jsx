/**
 * @file ChatArea.jsx
 * @description Main active chat feed, message history stream, typing telemetry, and input bar.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Info,
  Search,
  Building2,
  Users,
  Loader2,
  Lock,
  X,
  Sparkles
} from 'lucide-react';
import { MessageBubble } from './MessageBubble.jsx';
import { MessageInput } from './MessageInput.jsx';
import {
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkConversationAsReadMutation,
  useLazySearchMessagesQuery
} from '../chatApi.js';
import { toast } from 'sonner';

export const ChatArea = ({
  conversation,
  currentUserId,
  onBack,
  onOpenInfo,
  onTyping,
  hasTypingUsers,
  isUserOnline
}) => {
  const messagesEndRef = useRef(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: messagesData, isLoading } = useGetMessagesQuery(
    { conversationId: conversation._id, page: 1, limit: 100 },
    { skip: !conversation._id }
  );

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [markConversationAsRead] = useMarkConversationAsReadMutation();
  const [triggerSearch, { data: searchResults, isFetching: isSearchingMessages }] =
    useLazySearchMessagesQuery();

  const messages = useMemo(() => messagesData?.data || [], [messagesData?.data]);

  // Auto mark as read upon conversation load
  useEffect(() => {
    if (conversation._id && conversation.unreadCount > 0) {
      markConversationAsRead(conversation._id);
    }
  }, [conversation._id, conversation.unreadCount, markConversationAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isSearching) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hasTypingUsers, isSearching]);

  const handleSendMessage = async ({ content, messageType, attachments }) => {
    try {
      await sendMessage({
        conversationId: conversation._id,
        content,
        messageType,
        attachments
      }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send message');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    triggerSearch(searchQuery.trim());
  };

  const otherUser = conversation.otherParticipant;
  const isOnline = otherUser ? isUserOnline(otherUser._id) : false;
  const isDirect = conversation.type === 'direct';
  const isDept = conversation.type === 'department';

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 dark:bg-[#0A110D] relative overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 bg-white dark:bg-[#111D17] border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between shrink-0 select-none shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0A110D] text-slate-500 dark:text-[#7E9E8F] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar with Presence Indicator */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] flex items-center justify-center font-bold text-xs text-[#00C471]">
              {conversation.displayAvatar ? (
                <img
                  src={conversation.displayAvatar}
                  alt={conversation.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : isDept ? (
                <Building2 className="w-4 h-4 text-amber-500" />
              ) : isDirect ? (
                conversation.name?.slice(0, 2).toUpperCase() || 'CO'
              ) : (
                <Users className="w-4 h-4 text-[#00C471]" />
              )}
            </div>

            {isDirect && (
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#111D17] ${
                  isOnline ? 'bg-[#00C471]' : 'bg-slate-300 dark:bg-[#4E6E5D]'
                }`}
              />
            )}
          </div>

          <div className="truncate">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC] truncate">
              {conversation.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isDirect ? (
                <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#00C471]' : 'bg-slate-400'}`} />
                  {isOnline ? 'Active Now' : 'Offline'}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#00C471]" />
                  <span>{conversation.participants?.length || 0} participants</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setIsSearching(!isSearching);
              setSearchQuery('');
            }}
            className={`p-2 rounded-xl transition-all ${
              isSearching
                ? 'bg-[#00C471]/15 text-[#00C471]'
                : 'text-slate-500 dark:text-[#7E9E8F] hover:bg-slate-100 dark:hover:bg-[#0A110D] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
            title="Search in conversation"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenInfo}
            className="p-2 rounded-xl text-slate-500 dark:text-[#7E9E8F] hover:bg-slate-100 dark:hover:bg-[#0A110D] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-all"
            title="Conversation info & members"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* In-Conversation Search Bar */}
      {isSearching && (
        <div className="p-2.5 bg-slate-100 dark:bg-[#111D17] border-b border-slate-200 dark:border-[#1A3125] flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-[#7E9E8F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword in this channel..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471]"
              autoFocus
            />
          </form>

          {isSearchingMessages && (
            <Loader2 className="w-4 h-4 animate-spin text-[#00C471]" />
          )}

          <button
            type="button"
            onClick={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Results Drawer / Overlay if search returned items */}
      {isSearching && searchResults?.data && (
        <div className="p-3 bg-white dark:bg-[#111D17] border-b border-slate-200 dark:border-[#1A3125] max-h-48 overflow-y-auto space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#7E9E8F]">
            Search Matches ({searchResults.data.length})
          </div>
          {searchResults.data.length === 0 ? (
            <p className="text-xs text-slate-400">No messages match this search query.</p>
          ) : (
            searchResults.data.map((m) => (
              <div
                key={m._id}
                className="p-2 rounded-lg bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-xs"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                  <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">{m.senderName}</span>
                  <span className="font-mono">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-800 dark:text-[#F8FAFC] truncate">{m.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Messages Feed Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#7E9E8F] gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#00C471]" />
            <span className="text-xs">Loading message stream...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
              Start of {conversation.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1 max-w-xs leading-relaxed">
              This channel is encrypted and authenticated. Send a message to get the conversation going.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === currentUserId;
            return <MessageBubble key={m._id} message={m} isMine={isMine} />;
          })
        )}

        {/* Live Typing Indicator */}
        {hasTypingUsers && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#7E9E8F] pl-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#00C471]" />
            <span className="italic">Someone is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Archival Read-Only Notice if archived */}
      {conversation.isArchived && (
        <div className="p-3 bg-amber-500/10 border-t border-amber-500/30 flex items-center justify-center gap-2 text-xs text-amber-400 select-none">
          <Lock className="w-4 h-4" />
          <span>This conversation has been archived by executive administration and is now read-only.</span>
        </div>
      )}

      {/* Message Input Composer */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={onTyping}
        isArchived={conversation.isArchived}
        isSending={isSending}
      />
    </div>
  );
};

export default ChatArea;
