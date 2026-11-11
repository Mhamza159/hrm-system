/**
 * @file useDashboardLiveRefresh.js
 * @description Invalidates the RTK Query 'Dashboard' tag when relevant socket events arrive.
 * Bursts are coalesced: trailing debounce of 3s, but never later than 10s after the first event.
 */

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getSocket } from '../../notifications/hooks/useSocket.js';
import { dashboardApi } from '../dashboardApi.js';

export const SUPERVISOR_EVENTS = ['dashboard:changed', 'attendance:punch', 'payroll:completed'];
export const EMPLOYEE_EVENTS = ['notification:new', 'announcement:new', 'attendance:punch'];

const DEBOUNCE_MS = 3000;
const MAX_WAIT_MS = 10000;

// auth user's employeeId is a populated object ({ _id, ... }); punch payload ids are strings.
export const makeEmployeeAccept = (user) => (event, payload) =>
  event !== 'attendance:punch' ||
  payload?.employeeId === String(user?.employeeId?._id ?? user?.employeeId);

export function useDashboardLiveRefresh({ events, accept = () => true }) {
  const dispatch = useDispatch();
  const acceptRef = useRef(accept);
  acceptRef.current = accept;

  // Key by content so callers passing an inline array don't resubscribe every render.
  const eventsKey = events.join(',');

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    let debounceTimer = null;
    let maxTimer = null;

    const flush = () => {
      clearTimeout(debounceTimer);
      clearTimeout(maxTimer);
      debounceTimer = null;
      maxTimer = null;
      dispatch(dashboardApi.util.invalidateTags(['Dashboard']));
    };

    const handlers = eventsKey.split(',').filter(Boolean).map((event) => {
      const handler = (payload) => {
        if (!acceptRef.current(event, payload)) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(flush, DEBOUNCE_MS);
        if (!maxTimer) maxTimer = setTimeout(flush, MAX_WAIT_MS);
      };
      socket.on(event, handler);
      return [event, handler];
    });

    return () => {
      handlers.forEach(([event, handler]) => socket.off(event, handler));
      clearTimeout(debounceTimer);
      clearTimeout(maxTimer);
    };
  }, [eventsKey, dispatch]);
}
