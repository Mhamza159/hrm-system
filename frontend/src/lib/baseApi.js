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
 *    - If refresh fails, preserves unsubmitted drafts and dispatches `session-expired` + `expireSession`.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, expireSession, logout } from '../features/auth/authSlice.js';
import { snapshotActiveForms } from './draftStorage.js';
import { latencyTracker } from './networkMonitor.js';

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

  waitForUnlock() {
    return this._locking;
  }
}

const mutex = new Mutex();

/**
 * Resolves the API base URL supporting production environments (e.g. Render / Railway backend with Vercel frontend)
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api/v1';
  if (envUrl.endsWith('/api/v1')) return envUrl;
  if (envUrl.endsWith('/api/v1/')) return envUrl.slice(0, -1);
  const cleanUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  return `${cleanUrl}/api/v1`;
};

/**
 * Primary low-level fetchBaseQuery instance
 */
const baseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  }
});

/**
 * Custom baseQuery wrapper that transparently handles 401 token refresh (Slice 1.4)
 * and tracks request latency for Slow Network State telemetry.
 */
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // 1. Wait if another refresh operation is already locking the pipeline
  await mutex.waitForUnlock();

  // Track request latency for slow network detection
  const tracker = latencyTracker.start();

  let result;
  try {
    // 2. Execute the primary requested query
    result = await baseQuery(args, api, extraOptions);

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
            // 7. Refresh token has expired or is invalid: preserve active drafts before terminating session
            const currentUser = api.getState()?.auth?.user;
            if (typeof window !== 'undefined') {
              snapshotActiveForms(currentUser?.id || currentUser?._id || 'anon');
              window.dispatchEvent(
                new CustomEvent('session-expired', { detail: { user: currentUser } })
              );
            }
            // Mark session expired so modal stays active without premature hard route redirect
            api.dispatch(expireSession());
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
  } finally {
    tracker.end();
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
    'NotificationCounts',
    'Announcement',
    'WFH',
    'Correction',
    'AttendanceLock',
    'Loan',
    'Loans',
    'FlaggedAttendance',
    'AttendanceLocations',
    'WfhLocations',
    'Kiosks',
    'FaceEnrollment',
    'FaceEnrollments',
    'Assets',
    'Asset',
    'AssetRequests',
    'ChecklistTemplates',
    'Checklists',
    'ChecklistTasks',
    'Resignations',
    'ExitInterviews',
    'KpiTemplates',
    'ReviewCycles',
    'Reviews',
    'PerformanceProgress',
    'Clients',
    'Projects',
    'Timesheets',
    'Requisitions',
    'Requisition',
    'Jobs',
    'Job',
    'Candidates',
    'Candidate',
    'Interviews',
    'Interview',
    'Chatbot',
    'PolicyDoc',
    'UnansweredQuestion',
    'AttritionScore',
    'AttritionAnalytics'
  ],
  endpoints: () => ({})
});
