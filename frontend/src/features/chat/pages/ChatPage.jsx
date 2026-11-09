/**
 * @file ChatPage.jsx
 * @description Primary workspace page for Module M24: Internal Chat.
 * Responsive split view with conversations pane, active message stream, and modals.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, Loader2, Plus, Sparkles } from 'lucide-react';
import {
  useGetConversationsQuery,
  useSyncDepartmentChannelMutation
} from '../chatApi.js';
import { useChatSocket } from '../hooks/useChatSocket.js';
import { ConversationList } from '../components/ConversationList.jsx';
import { ChatArea } from '../components/ChatArea.jsx';
import { NewChatModal } from '../components/NewChatModal.jsx';
import { NewGroupModal } from '../components/NewGroupModal.jsx';
import { GroupInfoDrawer } from '../components/GroupInfoDrawer.jsx';
import { toast } from 'sonner';

export const ChatPage = () => {
  const user = useSelector((state) => state.auth?.user);
  const currentUserId = user?._id || user?.id;
  const userRoles = user?.roles || [];

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);

  const { data: convData, isLoading: isLoadingConversations } = useGetConversationsQuery();
  const [syncDepartmentChannel, { isLoading: isSyncingDept }] = useSyncDepartmentChannelMutation();

  const conversations = convData?.data || [];

  // Active conversation object
  const activeConversation = conversations.find((c) => c._id === activeConversationId) || null;

  // Real-time socket event hub
  const { emitTyping, isUserOnline, hasTypingUsers } = useChatSocket(activeConversationId);

  // Auto-select first conversation on desktop load if none selected
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0 && window.innerWidth >= 768) {
      setActiveConversationId(conversations[0]._id);
    }
  }, [conversations, activeConversationId]);

  const handleSyncDepartment = async () => {
    try {
      const res = await syncDepartmentChannel().unwrap();
      if (res?.data) {
        toast.success(`Department channel "${res.data.name}" synchronized`);
        setActiveConversationId(res.data._id);
      } else {
        toast.info('No department assignment linked to this account.');
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Department channel sync failed');
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Connecting to internal chat channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background overflow-hidden border border-border/50 rounded-xl shadow-xs">
      {/* 1. Conversations List Sidebar (Hidden on mobile if conversation is selected) */}
      <div className={`h-full ${activeConversationId ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => setActiveConversationId(id)}
          onOpenNewChat={() => setIsNewChatOpen(true)}
          onOpenNewGroup={() => setIsNewGroupOpen(true)}
          onSyncDepartment={handleSyncDepartment}
          isSyncing={isSyncingDept}
          isUserOnline={isUserOnline}
        />
      </div>

      {/* 2. Active Chat Feed Workspace */}
      <div className={`flex-1 h-full ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <ChatArea
            conversation={activeConversation}
            currentUserId={currentUserId}
            onBack={() => setActiveConversationId(null)}
            onOpenInfo={() => setIsInfoDrawerOpen(true)}
            onTyping={emitTyping}
            hasTypingUsers={hasTypingUsers}
            isUserOnline={isUserOnline}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-1">Your Team Conversations</h3>
            <p className="text-sm max-w-sm mb-6 text-muted-foreground">
              Select a conversation from the sidebar or start a new message with any colleague.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsNewChatOpen(true)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Direct Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setIsNewGroupOpen(true)}
                className="px-4 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition"
              >
                Create Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Modals & Drawers */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onConversationSelected={(id) => setActiveConversationId(id)}
        currentUserId={currentUserId}
      />

      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
        onConversationSelected={(id) => setActiveConversationId(id)}
        currentUserId={currentUserId}
      />

      <GroupInfoDrawer
        isOpen={isInfoDrawerOpen}
        onClose={() => setIsInfoDrawerOpen(false)}
        conversation={activeConversation}
        currentUserId={currentUserId}
        userRoles={userRoles}
        isUserOnline={isUserOnline}
      />
    </div>
  );
};

export default ChatPage;
