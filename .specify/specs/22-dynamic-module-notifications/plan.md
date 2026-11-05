# Technical Architecture Plan: Module M22 — Dynamic Module-Level Notification Badges & RBAC/PBAC Dashboards

**Feature Branch**: `feature/22-dynamic-module-notifications`  
**Specification**: [`.specify/specs/22-dynamic-module-notifications/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/22-dynamic-module-notifications/spec.md)  
**Governance**: `docs/BUILD-GUIDE.md` (Sections 3, 5, 9, 12, 15, 26) & `docs/TECH-SPEC.md`  
**Created**: November 5, 2026  
**Status**: Ready for Implementation  

---

## 1. System Architecture & Component Responsibilities

This implementation establishes an end-to-end, reactive notification distribution pipeline coupled with a standardized three-tier RBAC/PBAC navigation and dashboard architecture.

```
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    1. CLIENT REAL-TIME HUB                                        |
|                                                                                                   |
|  useSocket Hook (WebSockets)                                                                      |
|  ├── Listens: 'notification:new', 'notification:read', 'notification:read_all'                    |
|  └── Dispatches: Redux RTK Query Cache Invalidation for ['Notifications', 'NotificationCounts']  |
|                                                                                                   |
|  useModuleNotificationCounts Hook                                                                 |
|  ├── Maps notification categories & links to sidebar tree keys                                    |
|  └── Computes: { totalUnread, byGroup: { Leaves: 2, Payroll: 1 }, byRoute: { '/leaves/approvals': 2 } } |
|                                                                                                   |
|  Sidebar Navigation (React 18 / Tailwind)                                                         |
|  ├── Collapsed Group Header: Glowing dynamic dot / counter badge (e.g. "Leaves & Holidays (2)")   |
|  ├── Expanded Child Items: Pinpoint unread indicator dot on matching route (e.g. "Leave Approvals") |
|  └── Elimination: All hardcoded counts (e.g. fixed 3) purged across Topbar & Sidebar              |
+───────────────────────────────────────────────────────────────────────────────────────────────────+
                                             ▲
                       WebSocket & HTTP GET (/api/v1/notifications/unread-summary)
                                             │
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    2. EXPRESS BACKEND PIPELINE                                    |
|                                                                                                   |
|  Notification Aggregation Endpoint (GET /api/v1/notifications/unread-summary)                      |
|  ├── authenticate: Extracts authenticated user from JWT                                           |
|  └── Aggregation Pipeline:                                                                        |
|      $match: { userId: ObjectId(req.user._id), isRead: false }                                    |
|      $group: { _id: '$type', count: { $sum: 1 }, links: { $push: '$link' } }                     |
|                                                                                                   |
|  Real-Time Socket Service (services/socket.service.js)                                            |
|  └── emitToUser(userId, 'notification:new', notificationPayload)                                  |
+───────────────────────────────────────────────────────────────────────────────────────────────────+
                                             │
                                             ▼
+───────────────────────────────────────────────────────────────────────────────────────────────────+
|                                  3. RBAC & PBAC ACCESS GUARD                                      |
|                                                                                                   |
|  Tier 1: Super Admin (Executive) ── All modules unmasked + Executive Action & Security Hub        |
|  Tier 2: HR Manager (Operational) ── Workforce management + First-tier approval pipelines         |
|  Tier 3: Dept Manager (Team Lead) ── Team roster + Time/Leave triage (Salaries masked via PBAC)   |
|  Tier 4: Employee (Self-Service)  ── Personal punch, leave balances, borrowing & payslips         |
+───────────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Exact Files & Directory Mapping

### Backend (Node.js / Express / Mongoose)
| Component | File Path | Responsibility |
| :--- | :--- | :--- |
| **Model** | `backend/src/models/notification.model.js` | Ensure compound index `{ userId: 1, isRead: 1, type: 1 }` exists for O(1) aggregation. |
| **Service** | `backend/src/modules/notifications/notification.service.js` | Add `getUnreadSummaryByModule(userId)` aggregate method. |
| **Controller** | `backend/src/modules/notifications/notification.controller.js` | Add `getUnreadSummary` handler. |
| **Routes** | `backend/src/modules/notifications/notification.routes.js` | Register `GET /unread-summary` endpoint. |
| **Socket** | `backend/src/services/socket.service.js` | Verify real-time dispatch events emit room-targeted payloads. |

### Frontend (React 18 / Redux Toolkit / Tailwind)
| Component | File Path | Responsibility |
| :--- | :--- | :--- |
| **API** | `frontend/src/features/notifications/notificationsApi.js` | Add `getNotificationUnreadSummary` endpoint with tag invalidation. |
| **Hook** | `frontend/src/features/notifications/hooks/useModuleNotificationCounts.js` | Map backend types and route links to sidebar group names and route paths. |
| **Sidebar** | `frontend/src/components/layout/Sidebar.jsx` | Integrate dynamic badge dots on parent groups and child items; remove static counts. |
| **Topbar** | `frontend/src/components/layout/Topbar.jsx` | Ensure bell icon badge directly mirrors exact unread count from API. |
| **NotificationBell** | `frontend/src/features/notifications/components/NotificationBell.jsx` | Verify drawer synchronization and real-time updates. |

---

## 3. Data Contract & API Blueprint

### Endpoint: `GET /api/v1/notifications/unread-summary`
* **Access**: Authenticated user (`authenticate` middleware)
* **Response Contract (JSON)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "totalUnread": 4,
    "byType": {
      "leave": 2,
      "loan": 1,
      "attendance": 1,
      "payroll": 0,
      "expense": 0,
      "asset": 0,
      "project": 0,
      "performance": 0,
      "lifecycle": 0
    },
    "byLink": {
      "/leaves/approvals": 2,
      "/loans/approvals": 1,
      "/attendance/flagged": 1
    }
  }
}
```

### MongoDB Aggregation Implementation:
```javascript
export async function getUnreadSummaryByModule(userId) {
  const objectId = new mongoose.Types.ObjectId(userId);

  const [aggregateResult, totalCount] = await Promise.all([
    Notification.aggregate([
      { $match: { userId: objectId, isRead: false } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          links: { $push: '$link' }
        }
      }
    ]),
    Notification.countDocuments({ userId: objectId, isRead: false })
  ]);

  const byType = {};
  const byLink = {};

  for (const group of aggregateResult) {
    byType[group._id] = group.count;
    if (Array.isArray(group.links)) {
      for (const link of group.links) {
        if (link) {
          byLink[link] = (byLink[link] || 0) + 1;
        }
      }
    }
  }

  return {
    totalUnread: totalCount,
    byType,
    byLink
  };
}
```

---

## 4. Frontend Dynamic Mapping Logic

In `useModuleNotificationCounts.js`:
```javascript
export function useModuleNotificationCounts() {
  const { data } = useGetNotificationUnreadSummaryQuery(undefined, {
    pollingInterval: 30000
  });

  const summary = data?.data || { totalUnread: 0, byType: {}, byLink: {} };

  // Mapping from Notification type to Sidebar group names
  const groupCounts = {
    'Leaves & Holidays': (summary.byType.leave || 0),
    'Payroll': (summary.byType.payroll || 0),
    'Loans & Advances': (summary.byType.loan || 0),
    'Attendance': (summary.byType.attendance || 0),
    'Expenses': (summary.byType.expense || 0),
    'Assets': (summary.byType.asset || 0),
    'Projects & Timesheets': (summary.byType.project || 0) + (summary.byType.timesheet || 0),
    'Performance': (summary.byType.performance || 0),
    'Lifecycle': (summary.byType.resignation || 0) + (summary.byType.onboard || 0)
  };

  // Helper function to check if a specific child route has unread items
  const getRouteCount = (routePath) => {
    let count = summary.byLink[routePath] || 0;
    // Check partial prefix match if exact link has params
    for (const [link, linkCount] of Object.entries(summary.byLink)) {
      if (link.startsWith(routePath) && routePath !== '/') {
        count = Math.max(count, linkCount);
      }
    }
    return count;
  };

  return {
    totalUnread: summary.totalUnread,
    groupCounts,
    getRouteCount
  };
}
```

---

## 5. UI Presentation & Visual Archetype

In accordance with `docs/UI-REFERENCE.md` and `DESIGN.md` (Forest & Emerald theme):
- **Collapsed Group Parent**:
  When `groupCounts[item.name] > 0`:
  Render an animated emerald glowing indicator or counter pill:
  ```jsx
  <span className="flex h-2 w-2 relative">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
  </span>
  ```
- **Expanded Group Children**:
  When `getRouteCount(child.path) > 0`:
  Render a discreet, stylish number pill beside the link title:
  ```jsx
  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
    {routeCount}
  </span>
  ```
- **Elimination of Static Values**:
  Ensure no hardcoded badge counters (e.g. `badge: 3`) exist in `navStructure` or layout components.

---

## 6. Three-Tier RBAC & PBAC Structure Specification

### 6.1 Role Definitions & Permission Matrix Mapping
| Role | Primary Identifier | CASL Grant Rule | Scoped Access Invariant |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `'Super Admin'` | `can('manage', 'all')` | Full corporate visibility, executive disbursements, security governance. |
| **HR Manager** | `'HR Manager'` | `can(action, subject)` | Operational workforce administration; cannot execute self-approvals or Super Admin authorizations. |
| **Department Manager** | `'Department Manager'` | `can(action, subject, { departmentId, managerId })` | Subordinate operational triage; **financial salary details masked** by PBAC. |
| **Employee** | `'Employee'` | `can(action, subject, { employeeId: user.employeeId })` | Strict individual self-service only. |

### 6.2 Specialized Dashboard Component Architecture
1. **`AdminDashboard.jsx`**:
   - Executive Financial Strip: Disbursed capital, active loans, pending payroll liabilities.
   - Authorization Board: Pending executive sign-offs (disbursements, overrides).
   - Enterprise Security Telemetry: Audit log monitor, system health, active user sessions.
2. **`HrDashboard.jsx`**:
   - Attendance & Headcount Pulse: Present vs. Late vs. Absent rates today.
   - Operations Triage: Pending leave reviews, candidate onboarding checklists, upcoming probation reviews.
   - Statutory Compliance Check: FBR tax withholding status, EOBI voucher readiness.
3. **`ManagerDashboard.jsx`**:
   - Team Attendance Roster: Today's direct report statuses (Present / WFH / Field / Absent).
   - Team Recommendations Queue: Subordinate leaves, overtime approvals, timesheet sign-offs.
   - Resource Utilization: Weekly project hours logged vs. standard shift capacity.
4. **`EmployeeDashboard.jsx`**:
   - Digital Punch Console: Web check-in/out button, real-time shift timer, geofence status.
   - Entitlement Progress: Remaining paid/casual leaves meter.
   - Personal Finances: Latest payslip download, active loan deduction timeline.

---

## 7. Security, Verification & Rollout Strategy

1. **Security & Boundary Isolation**:
   - `getUnreadSummary` is strictly scoped to `req.user._id` — no user can query or infer another user's notifications.
   - PBAC checks prevent Department Managers or Employees from seeing badges for routes they are not authorized to view (`isItemVisible`).
2. **Automated Verification**:
   - Unit & integration tests for `getUnreadSummaryByModule`.
   - Real-time socket event test verifying cache invalidation.
   - UI snapshot & regression tests ensuring clean rendering on mobile and desktop viewports.

