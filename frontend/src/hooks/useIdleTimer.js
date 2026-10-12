/**
 * @file useIdleTimer.js
 * @description Enterprise Session Inactivity Auto-Logout Hook.
 * 
 * SPECIFICATION (BUILD-GUIDE Section 4 · Slice 1.11):
 * 1. Monitored Events: mousemove, mousedown, keydown, scroll, touchstart, click.
 * 2. Timeout Duration: 30 minutes (1,800,000 ms) of continuous inactivity.
 * 3. Lifecycle Guard: Only activates when the user is actively authenticated.
 * 4. Termination Flow:
 *    - Calls POST /api/v1/auth/logout to invalidate refreshToken in database.
 *    - Dispatches Redux logout action to clear in-memory tokens and user profile.
 *    - Navigates to /login?reason=inactivity.
 *    - Displays warning toast notification.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { useAuth } from './useAuth.js';
import { logout as logoutAction } from '../features/auth/authSlice.js';
import { useLogoutMutation } from '../features/auth/authApi.js';

// Default timeout: 30 minutes in milliseconds
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

export function useIdleTimer(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [triggerLogout] = useLogoutMutation();

  const timerRef = useRef(null);

  /**
   * Execute auto-logout sequence on inactivity threshold breach
   */
  const handleInactivityLogout = useCallback(async () => {
    try {
      // 1. Notify server to invalidate active refresh token in database
      await triggerLogout().unwrap();
    } catch {
      // Fallback: Proceed with client eviction even if server call fails
    } finally {
      // 2. Clear Redux auth slice credentials
      dispatch(logoutAction());

      // 3. Display user notification
      toast.warning('You were logged out due to 30 minutes of inactivity.');

      // 4. Redirect to login view with inactivity query parameter
      navigate('/login?reason=inactivity', { replace: true });
    }
  }, [triggerLogout, dispatch, navigate]);

  /**
   * Reset idle timer countdown upon user interaction
   */
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (isAuthenticated) {
      timerRef.current = setTimeout(handleInactivityLogout, timeoutMs);
    }
  }, [isAuthenticated, handleInactivityLogout, timeoutMs]);

  useEffect(() => {
    // Only register listeners when user is logged in
    if (!isAuthenticated) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Interactive DOM event types to monitor for user engagement
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttle listener to prevent excessive handler execution during continuous mouse movement
    let lastActivity = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      // Throttle to at most once every 1,000ms
      if (now - lastActivity > 1000) {
        lastActivity = now;
        resetTimer();
      }
    };

    // Initialize timer
    resetTimer();

    // Attach listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup listeners on unmount or authentication state change
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, resetTimer]);
}
