---
description: "Granular implementation tasks for Dynamic Module-Level Notification Badges & RBAC/PBAC Dashboards"
---

# Tasks: Dynamic Module-Level Notification Badges & RBAC/PBAC Dashboards

**Branch**: `feature/22-dynamic-module-notifications`  
**Prerequisites**: [`.specify/specs/22-dynamic-module-notifications/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/22-dynamic-module-notifications/spec.md), [`.specify/specs/22-dynamic-module-notifications/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/22-dynamic-module-notifications/plan.md)  
**Organization**: Grouped into sequential, verifiable implementation phases prioritized by User Story (P1, P2).

---

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Parallelizable task (independent file / no blocking dependency)
- **[Story]**: Target user journey from `spec.md` (`US1`, `US2`, `US3`)

---

## Phase 1: Foundational Backend Notification Aggregation API

**Purpose**: Provide an ultra-fast, database-aggregated endpoint that breaks down unread notifications by module category and route link.

- [x] **T001** [P] Verify compound index `{ userId: 1, isRead: 1, type: 1 }` in `backend/src/models/notification.model.js` to ensure O(1) aggregation performance.
- [x] **T002** Implement `getUnreadSummaryByModule(userId)` in `backend/src/modules/notifications/notification.service.js` using MongoDB aggregation pipeline grouping by `type` and collecting target `link` paths.
- [x] **T003** [P] Implement `getUnreadSummary` handler in `backend/src/modules/notifications/notification.controller.js`.
- [x] **T004** Register route `GET /api/v1/notifications/unread-summary` in `backend/src/modules/notifications/notification.routes.js` protected by `authenticate`.

**Checkpoint**: `GET /api/v1/notifications/unread-summary` returns `{ totalUnread, byType, byLink }` for authenticated users.

---

## Phase 2: Real-Time Client State & Mapping Hook

**Purpose**: Connect WebSockets and RTK Query to maintain a reactive, module-mapped count state in the frontend.

- [x] **T005** [P] Add `getNotificationUnreadSummary` query to `frontend/src/features/notifications/notificationsApi.js` with tag `NotificationCounts`.
- [x] **T006** Update `frontend/src/features/notifications/hooks/useSocket.js` to automatically invalidate `NotificationCounts` and `Notifications` tags on `notification:new`, `notification:read`, and `notification:read_all` events.
- [x] **T007** Implement `useModuleNotificationCounts.js` hook in `frontend/src/features/notifications/hooks/useModuleNotificationCounts.js` mapping notification types (`leave`, `loan`, `payroll`, `attendance`, `expense`, `asset`, `project`, `performance`, `resignation`) to sidebar accordion group names and child route links.

**Checkpoint**: `useModuleNotificationCounts()` returns real-time `{ totalUnread, groupCounts, getRouteCount }`.

---

## Phase 3: User Story 1 (P1) - Dynamic Module Notification Dots & Badges in Sidebar

**Goal**: Display real-time notification indicator dots on collapsed module headers and expanded child routes.

- [x] **T008** [US1] Integrate `useModuleNotificationCounts` hook into `frontend/src/components/layout/Sidebar.jsx`.
- [x] **T009** [US1] Add dynamic glowing unread indicator (animated emerald/red dot or count badge) to collapsed accordion group headers when `groupCounts[group.name] > 0` in `Sidebar.jsx`.
- [x] **T010** [US1] Add unread count badge / dot next to specific child items in `Sidebar.jsx` when `getRouteCount(child.path) > 0`.
- [x] **T011** [US1] Ensure that clicking into a badged child item and viewing the page or dismissing the notification cleans up the badge in real-time.

**Checkpoint**: Inbound notifications render an immediate visual dot on the relevant module group in the sidebar without page reload.

---

## Phase 4: User Story 2 (P1) - Eliminate Fixed Notification Displays Across Layout

**Goal**: Purge all hardcoded / static notification counts (such as the fixed `3` display) across Topbar and Sidebar.

- [x] **T012** [US2] Audit `Sidebar.jsx`, `Topbar.jsx`, and `NotificationBell.jsx` to remove any hardcoded badge numbers or mock fallback values.
- [x] **T013** [US2] Ensure Topbar `NotificationBell.jsx` badge strictly displays dynamic `totalUnread` (hides when 0, shows `99+` if > 99).
- [x] **T014** [US2] Verify that "Mark all as read" in `NotificationDrawer.jsx` immediately zeroes out both Topbar bell and Sidebar module dots.

**Checkpoint**: Zero hardcoded notification counters exist in the application.

---

## Phase 5: User Story 3 (P2) - RBAC & PBAC Navigation & Dashboard Specialization

**Goal**: Align sidebar navigation and dashboards with the 3-tier enterprise structure defined in `spec.md`.

- [x] **T015** [US3] Review CASL permission filters (`isItemVisible`) in `Sidebar.jsx` ensuring correct role visibility across Super Admin, HR Manager, Department Manager, and Employee.
- [x] **T016** [US3] Verify that confidential modules (e.g. `Payroll Overview`, `Leave Approvals`, `Audit Logs`) are never shown or badged to unauthorized roles.
- [x] **T017** [US3] Ensure the 4 role-specific dashboard layouts (`AdminDashboard`, `HrDashboard`, `ManagerDashboard`, `EmployeeDashboard`) mount appropriately based on primary active role.

---

## Phase 6: Verification & End-to-End Testing

**Purpose**: Validate that the entire notification distribution and indicator pipeline operates seamlessly without regressions.

- [x] **T018** Run automated API test for `GET /api/v1/notifications/unread-summary` validating aggregation correctness.
- [x] **T019** Verify live WebSocket push: create a test leave and test loan notification &rarr; confirm dots appear on "Leaves & Holidays" and "Loans & Advances" in sidebar.
- [x] **T020** Run frontend production build (`npm run build --prefix frontend`) to ensure zero TypeScript, JSX, or bundling errors.
