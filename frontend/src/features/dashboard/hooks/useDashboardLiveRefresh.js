/**
 * @file useDashboardLiveRefresh.js
 * @description Invalidates the RTK Query 'Dashboard' tag when relevant socket events arrive.
 * Bursts are coalesced: trailing debounce of 3s, but never later than 10s after the first event.
 */

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../../notifications/hooks/useSocket.js';
import { dashboardApi } from '../dashboardApi.js';

export const SUPERVISOR_EVENTS = ['dashboard:changed', 'attendance:punch', 'payroll:completed'];
export const EMPLOYEE_EVENTS = ['notification:new', 'announcement:new', 'attendance:punch'];

const DEBOUNCE_MS = 3000;
const MAX_WAIT_MS = 10000;
const SOCKET_CHECK_MS = 1000;

// auth user's employeeId is a populated object ({ _id, ... }); punch payload ids are strings.
export const makeEmployeeAccept = (user) => (event, payload) =>
  event !== 'attendance:punch' ||
  payload?.employeeId === String(user?.employeeId?._id ?? user?.employeeId);

export function useDashboardLiveRefresh({ events, accept = () => true }) {
  const dispatch = useDispatch();
  // Same source useSocket.js reads; it recreates the shared socket whenever this changes.
  const token = useSelector((state) => state.auth?.accessToken);
  const acceptRef = useRef(accept);
  useEffect(() => {
    acceptRef.current = accept;
  });

  // Key by content so callers passing an inline array don't resubscribe every render.
  const eventsKey = events.join(',');

  useEffect(() => {
    let debounceTimer = null;
    let maxTimer = null;
    let bound = null; // socket currently subscribed
    let handlers = [];

    const flush = () => {
      clearTimeout(debounceTimer);
      clearTimeout(maxTimer);
      debounceTimer = null;
      maxTimer = null;
      dispatch(dashboardApi.util.invalidateTags(['Dashboard']));
    };

    const unbind = () => {
      handlers.forEach(([event, handler]) => bound.off(event, handler));
      handlers = [];
      bound = null;
    };

    const bind = (socket) => {
      bound = socket;
      handlers = eventsKey.split(',').filter(Boolean).map((event) => {
        const handler = (payload) => {
          if (!acceptRef.current(event, payload)) return;
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(flush, DEBOUNCE_MS);
          if (!maxTimer) maxTimer = setTimeout(flush, MAX_WAIT_MS);
        };
        socket.on(event, handler);
        return [event, handler];
      });
    };

    // The shared socket is created/replaced by a sibling effect (useSocket), so it may not exist
    // yet when this runs; keep checking until it does and follow any later replacement.
    const sync = () => {
      const socket = getSocket();
      if (socket === bound) return;
      if (bound) unbind();
      if (socket) bind(socket);
    };
    sync();
    const syncTimer = setInterval(sync, SOCKET_CHECK_MS);

    return () => {
      clearInterval(syncTimer);
      if (bound) unbind();
      clearTimeout(debounceTimer);
      clearTimeout(maxTimer);
    };
  }, [eventsKey, dispatch, token]);
}
