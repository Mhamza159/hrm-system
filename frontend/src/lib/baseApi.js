/**
 * @file baseApi.js
 * @description Centralized RTK Query baseApi configuration with Mutex-driven automatic token re-authentication.
 * 
 * CORE NETWORKING RULES & LIFECYCLE (Slice 1.4):
 * 1. Base URL: Configured to '/api/v1', proxied through Vite dev server or production Nginx.
 * 2. Credentials: 'include' ensures browser forwards httpOnly refreshToken cookies automatically.
 * 3. Header Authorization: Automatically extracts short-lived accessToken from Redux auth slice
 *    and injects 'Bearer <token>' into every outgoing HTTP request header.
 * 4. Transparent Re-authentication (Mutex):
 *    - Intercepts 401 Unauthorized responses on protected routes.
 *    - Uses an in-memory Mutex to queue concurrent outgoing requests while a single refresh is in-flight.
 *    - Invokes POST /api/v1/auth/refresh to rotate the 7-day cookie and acquire a new 15-minute access token.
 *    - Upon success, dispatches `setCredentials` to Redux and seamlessly replays the queued requests.
 *    - If refresh fails, dispatches `logout` to purge state and redirect to /login.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logout } from '../features/auth/authSlice.js';

/**
 * Lightweight, zero-dependency in-memory Mutex lock
 */
class Mutex {
  constructor() {
    this._locking = Promise.resolve();
    this._locked = false;
  }

  isLocked() {
    return this._locked;
  }

  acquire() {
    let unlock;
    const nextLock = new Promise((resolve) => {
      unlock = resolve;
    });
    const currentLock = this._locking;
    this._locking = currentLock.then(() => nextLock);

    return currentLock.then(() => {
      this._locked = true;
      return () => {
        this._locked = false;
        unlock();
      };
    });
  }

  async waitForUnlock() {
    await this._locking;
  }
}

// Global Mutex instance for synchronizing concurrent 401 re-auth requests
const mutex = new Mutex();

// Standard fetchBaseQuery instance
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  credentials: 'include', // Transmit cookies cross-origin & cross-subdomain
  prepareHeaders: (headers, { getState }) => {
    // 1. Extract short-lived in-memory accessToken from Redux state
    const token = getState().auth.accessToken;
    // 2. If present, inject Bearer header
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

/**
 * Custom baseQuery wrapper that transparently handles 401 token refresh (Slice 1.4)
 */
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // 1. Wait if another refresh operation is already locking the pipeline
  await mutex.waitForUnlock();

  // 2. Execute the primary requested query
  let result = await baseQuery(args, api, extraOptions);

  // 3. Inspect if the server rejected the request with 401 Unauthorized
  if (result.error && result.error.status === 401) {
    const requestedUrl = typeof args === 'string' ? args : args.url;

    // Do NOT attempt refresh on public auth endpoints to avoid infinite loops
    if (requestedUrl.includes('/auth/login') || requestedUrl.includes('/auth/refresh')) {
      return result;
    }

    // Check if another request is currently refreshing the token
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        // 4. Request a token rotation via POST /api/v1/auth/refresh
        const refreshResult = await baseQuery(
          { url: '/auth/refresh', method: 'POST' },
          api,
          extraOptions
        );

        if (refreshResult.data?.data) {
          // 5. Success: Commit newly rotated accessToken and user profile to Redux
          const { user, accessToken } = refreshResult.data.data;
          api.dispatch(setCredentials({ user, accessToken }));

          // 6. Seamlessly replay the initial request that previously failed with 401
          result = await baseQuery(args, api, extraOptions);
        } else {
          // 7. Refresh token has expired or is invalid: terminate session
          api.dispatch(logout());
        }
      } finally {
        // 8. Release the mutex to let queued requests replay
        release();
      }
    } else {
      // 9. Another call is already refreshing: wait until it finishes and replay
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Users',
    'Auth',
    'Roles',
    'Permissions',
    'Employee',
    'Attendance',
    'Leave',
    'LeaveType',
    'Holiday',
    'Payroll',
    'Settings',
    'Policies',
    'Departments',
    'Designations',
    'Shifts',
    'OrgChart',
    'Team',
    'Notification',
    'Announcement',
    'WFH',
    'Correction',
    'AttendanceLock'
  ],
  endpoints: () => ({})
});
