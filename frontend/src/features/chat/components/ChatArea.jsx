/**
 * @file ChatArea.jsx
 * @description Main active chat feed, message history stream, typing telemetry, and input bar.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Info,
  Search,
  Building,
  Users,
  Loader2,
  Lock,
  X
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
  const containerRef = useRef(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: messagesData, isLoading, isFetching } = useGetMessagesQuery(
    { conversationId: conversation._id, page: 1, limit: 100 },
    { skip: !conversation._id }
  );

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [markConversationAsRead] = useMarkConversationAsReadMutation();
  const [triggerSearch, { data: searchResults, isFetching: isSearchingMessages }] =
    useLazySearchMessagesQuery();

  const messages = messagesData?.data || [];

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

  return (
    <div className="flex-1 h-full flex flex-col bg-background relative overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-card border-b border-border flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs overflow-hidden">
              {conversation.type === 'department' ? (
                <Building className="w-4 h-4 text-primary" />
              ) : conversation.type === 'group' ? (
                <Users className="w-4 h-4 text-primary" />
              ) : otherUser?.avatar ? (
                <img
                  src={otherUser.avatar}
                  alt={conversation.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                conversation.name?.slice(0, 2).toUpperCase() || 'CO'
              )}
            </div>
            {conversation.type === 'direct' && (
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-card ${
                  isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                }`}
              />
            )}
          </div>

          <div className="truncate">
            <h3 className="font-semibold text-sm truncate flex items-center gap-1.5">
              <span>{conversation.name}</span>
              {conversation.isArchived && (
                <Lock className="w-3.5 h-3.5 text-amber-500" title="Archived" />
              )}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {conversation.type === 'direct'
                ? isOnline
                  ? 'Online'
                  : 'Offline'
                : `${conversation.participants?.length || 0} participants`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsSearching(!isSearching)}
            className={`p-2 rounded-lg transition ${
              isSearching
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenInfo}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
            title="Conversation details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* In-chat search banner */}
      {isSearching && (
        <div className="p-2.5 bg-muted/60 border-b border-border flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages by keyword..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingMessages || !searchQuery.trim()}
              className="px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              {isSearchingMessages ? 'Searching...' : 'Find'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search results overlay */}
      {isSearching && searchResults?.data && (
        <div className="bg-card border-b border-border p-3 max-h-48 overflow-y-auto divide-y divide-border/20 text-xs">
          <p className="font-semibold text-muted-foreground mb-1 text-[11px]">
            Found {searchResults.data.length} match(es):
          </p>
          {searchResults.data.length === 0 ? (
            <p className="text-muted-foreground py-2 text-center">No messages matched your query.</p>
          ) : (
            searchResults.data.map((m) => (
              <div key={m._id} className="py-1.5 flex justify-between gap-2">
                <span className="font-medium text-foreground truncate">{m.senderName}:</span>
                <span className="text-muted-foreground truncate flex-1">{m.content}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(m.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Message Stream */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-muted/10"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs">Loading message history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Users className="w-6 h-6" />
            </div>
            <p className="font-medium text-sm text-foreground">Welcome to {conversation.name}!</p>
            <p className="text-xs mt-1">This is the beginning of your conversation history.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isMine={msg.senderId === currentUserId || msg.senderId?._id === currentUserId}
            />
          ))
        )}

        {/* Live typing indicator */}
        {hasTypingUsers && (
          <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground italic animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>Someone is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
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
