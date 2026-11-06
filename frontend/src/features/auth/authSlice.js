/**
 * @file authSlice.js
 * @description Redux Toolkit slice managing in-memory access token, user session state, and auth lifecycle.
 * 
 * SECURITY ARCHITECTURE NOTE:
 * - Access Token: Kept exclusively IN-MEMORY inside Redux state (never stored in localStorage or sessionStorage).
 *   This mitigates Cross-Site Scripting (XSS) token theft vulnerabilities.
 * - Refresh Token: Handled by the browser as an httpOnly, Secure, SameSite: Strict cookie.
 * - State Restoration: Upon page reload, the app dispatches /auth/refresh or /auth/me to transparently
 *   rehydrate the in-memory access token using the valid httpOnly cookie.
 * - Session Expiry (State 8): When refresh token expires, `expireSession` retains user info for in-place re-auth.
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,             // Current authenticated user object { id, email, roles, employeeId, mustChangePassword }
  accessToken: null,      // Short-lived in-memory JWT access token (15 mins)
  isAuthenticated: false, // Boolean auth status
  isInitialized: false,   // Flag indicating whether the initial session check has settled
  isSessionExpired: false // State 8 flag for in-place re-authentication modal
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set active user session and in-memory access token (called after login, verify-otp, or refresh)
     */
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = Boolean(user && accessToken);
      state.isInitialized = true;
      state.isSessionExpired = false;
    },

    /**
     * Update access token following background token rotation
     */
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      if (action.payload) {
        state.isSessionExpired = false;
      }
    },

    /**
     * Patch user attributes (e.g. after password change or profile update)
     */
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    /**
     * Mark session expired on 401 refresh failure to allow in-place re-login (State 8)
     */
    expireSession: (state) => {
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isSessionExpired = true;
    },

    /**
     * Invalidate all client-side authentication credentials
     */
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.isSessionExpired = false;
    }
  }
});

export const { setCredentials, setAccessToken, updateUser, expireSession, logout } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsSessionExpired = (state) => Boolean(state.auth.isSessionExpired);

export default authSlice.reducer;
