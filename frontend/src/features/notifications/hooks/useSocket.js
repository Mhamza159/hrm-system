/**
 * @file useSocket.js
 * @description Custom React Hook managing real-time WebSocket connection lifecycle (Module M8 / Slice 8.1).
 * 
 * ARCHITECTURAL DESIGN & INVARIANTS:
 * 1. Automatic JWT Handshake: Reads short-lived accessToken from Redux auth state and injects it into
 *    the socket.io client connection options.
 * 2. Instant RTK Query Invalidation: Upon receiving 'notification:new' or 'announcement:new', dispatches
 *    tag invalidations (['Notification'], ['Announcement']) so topbar badges and drawers update in real time.
 * 3. Graceful Lifecycle Cleanup: Disconnects cleanly on user logout or application unmount, avoiding memory leaks.
 */

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { baseApi } from '../../../lib/baseApi.js';

const SERVER_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

let sharedSocket = null;

export const useSocket = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.accessToken);
  const user = useSelector((state) => state.auth?.user);
  const socketRef = useRef(null);

  useEffect(() => {
    // If not authenticated, disconnect any existing socket
    if (!token || !user) {
      if (sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
      return;
    }

    // Disconnect stale socket if user credentials have changed
    if (sharedSocket && sharedSocket.auth?.token !== token) {
      sharedSocket.disconnect();
      sharedSocket = null;
    }

    if (!sharedSocket) {
      sharedSocket = io(SERVER_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000
      });

      sharedSocket.on('connect', () => {
        // Socket connection established
      });

      // Real-time notification handler
      sharedSocket.on('notification:new', (notification) => {
        // 1. Invalidate RTK Query cache so unread badge and drawer refresh immediately
        dispatch(baseApi.util.invalidateTags(['Notification']));

        // 2. Display unobtrusive toast notification
        if (notification?.title) {
          toast.info(notification.title, {
            description: notification.body,
            duration: 5000
          });
        }
      });

      // Real-time announcement handler
      sharedSocket.on('announcement:new', (announcement) => {
        dispatch(baseApi.util.invalidateTags(['Announcement', 'Notification']));
        if (announcement?.title) {
          toast.message(`📢 ${announcement.title}`, {
            description: announcement.content?.slice(0, 100) + '...',
            duration: 6000
          });
        }
      });

      sharedSocket.on('connect_error', (err) => {
        // If credentials expired or unauthorized, stop retrying with dead token
        // Will reconnect automatically once Redux rotates and provides a fresh accessToken
        if (
          err?.message?.includes('expired') ||
          err?.message?.includes('credentials') ||
          err?.message?.includes('jwt')
        ) {
          if (sharedSocket) {
            sharedSocket.disconnect();
            sharedSocket = null;
          }
        }
      });
    }

    socketRef.current = sharedSocket;

    return () => {
      // Retain socket connection across re-renders while user remains authenticated
    };
  }, [token, user, dispatch]);

  return socketRef.current;
};
