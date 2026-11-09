/**
 * @file useChatSocket.js
 * @description Hook managing Socket.io chat room lifecycle, live messaging, typing indicators, and presence.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getSocket } from '../../notifications/hooks/useSocket.js';
import { baseApi } from '../../../lib/baseApi.js';

export const useChatSocket = (activeConversationId) => {
  const dispatch = useDispatch();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);

  // Helper to emit typing status with auto-throttle
  const emitTyping = useCallback(
    (isTyping) => {
      const socket = getSocket();
      if (socket && activeConversationId) {
        socket.emit('chat:typing', {
          conversationId: activeConversationId,
          isTyping: Boolean(isTyping)
        });
      }
    },
    [activeConversationId]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join active conversation room
    if (activeConversationId) {
      socket.emit('chat:join', activeConversationId);
    }

    // 1. Incoming message handler
    const handleNewMessage = (message) => {
      // Invalidate message stream and conversation list counters
      dispatch(
        baseApi.util.invalidateTags([
          { type: 'Message', id: message.conversationId },
          { type: 'Conversation', id: 'LIST' }
        ])
      );
    };

    // 2. Read receipts handler
    const handleReadReceipt = ({ conversationId }) => {
      dispatch(
        baseApi.util.invalidateTags([{ type: 'Message', id: conversationId }])
      );
    };

    // 3. Typing indicator handler
    const handleTyping = ({ conversationId, userId, isTyping }) => {
      if (conversationId === activeConversationId) {
        setTypingUsers((prev) => {
          if (isTyping) {
            return { ...prev, [userId]: true };
          }
          const next = { ...prev };
          delete next[userId];
          return next;
        });

        // Auto-clear typing indicator after 3 seconds
        if (isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers((prev) => {
              const next = { ...prev };
              delete next[userId];
              return next;
            });
          }, 3000);
        }
      }
    };

    // 4. Online presence handler
    const handlePresence = ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === 'online') {
          next.add(String(userId));
        } else {
          next.delete(String(userId));
        }
        return next;
      });
    };

    // 5. Channel archived handler
    const handleArchived = ({ conversationId }) => {
      dispatch(
        baseApi.util.invalidateTags([
          { type: 'Conversation', id: conversationId },
          { type: 'Conversation', id: 'LIST' }
        ])
      );
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:read', handleReadReceipt);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:presence', handlePresence);
    socket.on('chat:conversation_archived', handleArchived);

    return () => {
      if (activeConversationId) {
        socket.emit('chat:leave', activeConversationId);
      }
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:read', handleReadReceipt);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:presence', handlePresence);
      socket.off('chat:conversation_archived', handleArchived);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeConversationId, dispatch]);

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.has(String(userId));
    },
    [onlineUsers]
  );

  return {
    emitTyping,
    isUserOnline,
    hasTypingUsers: Object.keys(typingUsers).length > 0
  };
};
