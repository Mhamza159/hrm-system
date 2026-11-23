# Phase 41: Software-Wide Real-Time Data Synchronization, RTK Query Cache Invalidation & Automatic Refresh System — Research & Root-Cause Audit

**Date:** 2026-11-23  
**Status:** DRAFT / RESEARCH COMPLETE  
**Target:** Frontend Networking Layer (`frontend/src/lib/baseApi.js`, `frontend/src/app/store.js`), Real-Time WebSocket Infrastructure (`frontend/src/features/notifications/hooks/useSocket.js`, `backend/src/services/socket.service.js`), Global Application Layout (`frontend/src/components/layout/AppLayout.jsx`), and 29 Feature API Slices (`frontend/src/features/**/*Api.js`).

---

## 1. Executive Summary & Problem Diagnosis

### The Reported Issue
The user noted:
> *"Mje referesh karne ki zrurt q prti he data sync q ni hotaaa production aur local me b"*  
> ("Why do I need to refresh the page? Why doesn't data sync in production and local too?")

In both local development and production (e.g. Vercel frontend + Render/Railway backend):
1. When an employee or manager performs an action (e.g., marks attendance, submits a leave request, approves a WFH application, creates a department, edits a profile), the updated data often does **not** reflect on other open tabs, devices, or even the current user's screen without a manual browser refresh (`F5`).
2. When a user switches away from the HRM browser tab (e.g. to Slack, email, or another window) and returns minutes or hours later, the stale cached data remains on screen because the browser does not re-fetch the latest database state upon regaining focus.
3. If an internet blip or Wi-Fi reconnect occurs, queries do not automatically re-validate.

---

## 2. Exhaustive Root-Cause Audit Across 4 Layers

### Layer 1: Redux Store & Missing `setupListeners` (The Core Enabler)
- **Investigation:** Examined `frontend/src/app/store.js`:
  ```javascript
  export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware)
  });
  ```
- **Root Cause Found:** `setupListeners(store.dispatch)` is **completely missing**.
- **Impact:** In RTK Query, `refetchOnFocus` and `refetchOnReconnect` rely entirely on `setupListeners(store.dispatch)`. Without calling `setupListeners`, RTK Query never binds event listeners to `window.addEventListener('focus')` or `window.addEventListener('online')`.
- **Resolution:** Add `import { setupListeners } from '@reduxjs/toolkit/query';` and call `setupListeners(store.dispatch);` immediately after store initialization.

### Layer 2: Centralized `baseApi.js` Configuration Defaults
- **Investigation:** Examined `frontend/src/lib/baseApi.js`:
  ```javascript
  export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: [ ... ],
    endpoints: () => ({})
  });
  ```
- **Root Cause Found:**
  1. `refetchOnFocus: false` (RTK Query default is `false`).
  2. `refetchOnReconnect: false` (RTK Query default is `false`).
  3. No default cache retention tuning (`keepUnusedDataFor` defaults to 60s without global re-hydration policy).
- **Impact:** Switching tabs or reconnecting Wi-Fi never revalidates cached queries.
- **Resolution:** Set `refetchOnFocus: true` and `refetchOnReconnect: true` at the `createApi` root in `baseApi.js`. This guarantees that every query in the system automatically revalidates when the user re-focuses their browser tab or recovers connection.

### Layer 3: Fragmented Socket.io Real-Time Dispatching
- **Investigation:** Examined `useSocket.js` and component mounting:
  - `useSocket.js` was only imported and mounted inside individual subcomponents (`NotificationBell.jsx`, `NotificationDrawer.jsx`, `TeamAttendancePage.jsx`, `AwardsPage.jsx`).
  - If a user is on `EmployeesPage`, `DepartmentsPage`, `MyAttendancePage`, `SettingsPage`, or `LeavesPage`, and hasn't opened the notification drawer, the websocket listeners are either inactive or restricted to a tiny subset of events.
  - Furthermore, `useSocket.js` only listened to `notification:new`, `notification:read`, `announcement:new`, and `attendance:punch`. It had zero awareness of changes to `Leave`, `Department`, `Shift`, `Designation`, `Employee`, `Role`, `Asset`, `Expense`, or `Settings`.
- **Root Cause Found:** Lack of a centralized, globally mounted real-time synchronization listener.
- **Resolution:**
  1. Create `useRealtimeCacheSync.js` (or enhance `useSocket.js`) and mount it globally in `AppLayout.jsx` so it is permanently active for all authenticated sessions across all pages.
  2. Implement a universal `entity:invalidate` or domain-specific socket handlers (`attendance:sync`, `leave:sync`, `employee:sync`, `department:sync`, `role:sync`, `settings:sync`, `notification:new`, `announcement:new`) that dispatch `dispatch(baseApi.util.invalidateTags([...]))`.
  3. Wire the backend `socket.service.js` to broadcast lightweight invalidation signals upon database mutations.

### Layer 4: RTK Query Mutation `invalidatesTags` Gaps Across 29 Feature Slices
- **Investigation:** Audited `*Api.js` files across `frontend/src/features/`:
  - **Tag Type Mismatches:** E.g., queries providing `{ type: 'Department', id: 'LIST' }` while mutation invalidates `{ type: 'Departments' }` (singular vs plural).
  - **Missing Invalidation on Status Transitions:** In several approval workflows (e.g. WFH approvals, leave status updates, asset return requests), mutations only updated local state or missed invalidating parent summary tags (e.g. `Attendance`, `Team`, `Dashboard`, `RoleStats`).
- **Resolution:** Systematically audit all 29 API files and align `providesTags` and `invalidatesTags` to guarantee that every mutation triggers immediate cache eviction and re-fetch of affected queries.

### Layer 5: Operational Consoles Lacking Smart Background Polling
- **Investigation:** High-density live operational screens (`TeamAttendancePage.jsx`, `DashboardPage.jsx`, `NotificationsPage.jsx`, `CandidatePipelinePage.jsx`) display live workplace status. If no user interaction or socket event occurs (e.g., in edge cases where socket fails or is blocked by strict corporate firewalls), data becomes stale.
- **Resolution:** Add smart background polling with configurable intervals (e.g., 15s–30s) that automatically pause when the browser tab is hidden (`document.visibilityState === 'hidden'`) to preserve bandwidth and battery life.

---

## 3. Architecture & Data Flow

```
[ Backend DB Mutation (e.g. Leave Approved / Punch Recorded) ]
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
[ HTTP 200 Response ]       [ Socket.io Broadcast ]
         │                           │
         ▼                           ▼
[ RTK Query Mutation ]      [ Global useRealtimeCacheSync Hook ]
   invalidatesTags                 │ (mounted in AppLayout)
         │                           ▼
         └───────────┬───────────────┘
                     ▼
  dispatch(baseApi.util.invalidateTags([...]))
                     │
                     ▼
  [ RTK Query Cache Invalidation ]
                     │
                     ▼
  [ Active Subscribed Queries Refetch Automatically ]
                     │
                     ▼
  [ UI Re-renders with Fresh Data (ZERO Page Refresh Needed) ]
```

---

## 4. Phase Breakdown & Execution Roadmap

To ensure modular, non-regressive, and thoroughly verified delivery, Phase 41 is structured into 6 focused plans:

1. **Plan 41-01: Redux Store `setupListeners`, BaseApi `refetchOnFocus`, `refetchOnReconnect` & Global Lifecycle Auto-Rehydration**
   - Enable `setupListeners(store.dispatch)` in `store.js`.
   - Set `refetchOnFocus: true` and `refetchOnReconnect: true` in `baseApi.js`.
   - Tune `keepUnusedDataFor` and cache retention policies.

2. **Plan 41-02: Comprehensive System-Wide RTK Query Mutation `invalidatesTags` Audit & Patching**
   - Audit and reconcile singular/plural tag mismatches across all 29 feature API slices.
   - Ensure every Create, Update, Delete, and Status Transition mutation invalidates corresponding list and detail cache tags.

3. **Plan 41-03: Global Real-Time Socket.io Cache Dispatcher (`useRealtimeCacheSync`) & Backend Invalidation Signals**
   - Mount persistent real-time cache invalidator in `AppLayout.jsx`.
   - Wire backend `socket.service.js` emitter helpers (`emitEntityInvalidation`) for cross-user/multi-device instant updates.

4. **Plan 41-04: Smart Background Polling for Mission-Critical Operational Consoles**
   - Introduce visibility-aware background polling (15s–30s) on live operations screens (`TeamAttendancePage`, `DashboardPage`, `CandidatePipelinePage`, `NotificationsPage`).
   - Pause polling when tab is inactive/hidden to avoid redundant network overhead.

5. **Plan 41-05: Optimistic UI Updates & Error Rollbacks for High-Frequency Actions**
   - Implement `onQueryStarted` optimistic cache patching for fast interactions (attendance check-in/out toggles, status updates, bookmarking).
   - Guarantee instant UI responsiveness with zero flicker and automatic rollback on server error.

6. **Plan 41-06: Cross-Module End-to-End Verification Test Suite, Multi-Tab Sync Verification & Phase Deliverables**
   - Write integration tests verifying cache invalidation, focus re-fetch triggers, and socket dispatching.
   - Verify multi-tab synchronization in browser (action in Tab A updates Tab B with zero page refresh).
   - Ensure 0 Oxlint errors, clean Vite production build, and generate `41-REPORT.md`.
