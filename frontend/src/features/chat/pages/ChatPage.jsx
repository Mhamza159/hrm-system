/**
 * @file ChatPage.jsx
 * @description Primary workspace page for Module M24: Internal Chat.
 * Responsive split view with conversations pane, active message stream, and modals.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, Loader2, Plus, Users } from 'lucide-react';
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

  const conversations = useMemo(() => convData?.data || [], [convData?.data]);

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
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-white dark:bg-[#061A14]">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-[#7E9E8F]">
          <div className="w-12 h-12 rounded-2xl bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs sm:text-sm font-medium">Connecting to enterprise chat channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white dark:bg-[#061A14] overflow-hidden border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-xl">
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
      <div className={`flex-1 h-full ${!activeConversationId ? 'hidden md:flex' : 'flex'} bg-slate-50 dark:bg-[#0A110D]`}>
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-[#0A110D]">
            <div className="w-16 h-16 rounded-2xl bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30 flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-[#F8FAFC]">
                Enterprise Team Messaging
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30">
                Encrypted
              </span>
            </div>
            <p className="text-xs sm:text-sm max-w-md mb-6 text-slate-500 dark:text-[#7E9E8F] leading-relaxed">
              Select a coworker or group channel from the left sidebar to resume messaging, or initiate a new secure chat with any colleague.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsNewChatOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#00B064] text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Start Direct Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setIsNewGroupOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#1A3125] text-xs font-semibold transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-[#00C471]" />
                <span>Create Group</span>
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
