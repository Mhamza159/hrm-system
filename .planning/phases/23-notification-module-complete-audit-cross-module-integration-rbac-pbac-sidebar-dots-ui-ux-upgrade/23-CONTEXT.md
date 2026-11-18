# Phase 23: Notification Module — Complete Audit, Cross-Module Integration, RBAC/PBAC Implementation & UI/UX Upgrade

## 1. Executive Summary & Audit Findings

The **Notification Module** (Module M8 / Slice 8.1–8.5) serves as the real-time operational nerve center for the HRMS. It delivers instant alerts across WebSockets (Socket.io), database records for persistent in-app notifications, transactional emails, and optional WhatsApp notifications.

### Comprehensive Audit Analysis:

1. **Schema & Data Model Limitations (`notification.model.js`)**:
   - **Current State**: Model contains `userId`, `type` (limited enum), `title`, `body`, `link`, `isRead`, `readAt`, `metadata`.
   - **Gaps**:
     - Missing explicit `module` classification representing the true source module (`recruitment`, `employees`, `attendance`, `leaves`, `payroll`, `loans`, `expenses`, `assets`, `projects`, `performance`, `lifecycle`, `policies`, `announcements`, `rewards`, `feedback`, `chat`, `attrition`, `reports`, `settings`, `system`).
     - Missing `priority` level (`'low' | 'normal' | 'high' | 'urgent'`) to distinguish critical actions (such as urgent approval requests or policy compliance mandates) from routine informational alerts.
     - Missing `isArchived`, `archivedAt` flags for clean notification lifecycle management.
     - Compound indexes lack `{ userId: 1, module: 1, isRead: 1 }` for instant sidebar module unread aggregations.

2. **Centralized Notification Service (`notify.service.js`)**:
   - **Current State**: Provides polymorphic `notify(userIds, payload)` handling bulk DB inserts, Socket.io `notification:new` emissions, and background queue integration.
   - **Gaps**:
     - Lacks standardized module-to-category mapping for newer modules (Policies, Announcements, Chat, Attrition, Rewards, Feedback/Grievances).
     - Missing dedicated helper method `getModuleUnreadCounts(userId)` executing an aggregation pipeline to return per-module unread counts for dynamic sidebar badges with zero client-side calculation lag.

3. **Cross-Module Coverage Gaps**:
   - Many business workflow actions across HRMS controllers either:
     a) Do not trigger notifications upon state change (e.g., Asset assignment/return, Policy mandatory acknowledgement request, Grievance status progression, Reward celebration/kudos, Resignation submission, Attrition risk alerts).
     b) Fall back to silent database updates without notifying relevant approvers, department heads, or employees.
   - **Remedy**: Instrument all missing critical business events across all 16 domains with role-based and permission-scoped notifications, respecting confidentiality (e.g. Grievances and Attrition flight risks must never leak to unauthorized employees).

4. **Dynamic Sidebar Notification Indicators (`Sidebar.jsx` & Header)**:
   - **Current State**: Sidebar currently displays a single unread count badge on the "Notifications" link.
   - **Gaps**: The user requested dynamic dots/badges on each module in the sidebar navigation (both top-level standalone links and collapsible tree groups like Attendance, Leaves, Payroll, Assets, etc.) reflecting unread alerts pertinent to that module.
   - **Remedy**:
     - Connect `Sidebar.jsx` to `useModuleNotificationCounts` backed by `GET /api/v1/notifications/module-counts`.
     - Render glowing pulse dots / count badges beside module names in both expanded and collapsed views.
     - Automatically decrement / clear module indicators when the user visits the route or marks the notifications as read.

5. **Notification Center & Drawer UI/UX Polish**:
   - **Current State**: Basic slide-out drawer with a simple flat list.
   - **Gaps**:
     - No segmented category/module filtering (All, Leaves, Attendance, Payroll, ATS, Assets, Policies, etc.).
     - No priority badges (Urgent, High, Normal, Low).
     - No dedicated "Archive" tab or archive action.
     - Lacks deep-linking directly to target records/approvals.
   - **Remedy**: Redesign Notification Center and Header Drawer adhering strictly to the Forest & Emerald Enterprise theme (`#061A14`, `#111D17`, `#1A3125`, `#00C471`).

---

## 2. Cross-Module Notification Matrix (16 Domains)

| Domain | Business Event | Trigger Condition | Recipient(s) | Priority | Link | Confidentiality Scope |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Recruitment & ATS** | New candidate application | Candidate applies / created | Hiring Managers & HR | Normal | `/recruitment/pipeline` | HR / Recruiters only |
| | Interview scheduled | Interview event saved | Candidate & Interviewer | High | `/recruitment/pipeline` | Assigned Interviewers |
| | Hiring decision / Offer | Candidate status changed to 'Offered' | Candidate & HR Admin | High | `/recruitment/pipeline` | HR / Super Admin |
| **Employees & Lifecycle**| Onboarding task assigned | Lifecycle checklist initiated | New Employee | Normal | `/onboarding/my-tasks` | Assigned Employee |
| | Resignation submitted | Employee submits resignation | Manager & HR | High | `/offboarding` | Manager & HR only |
| | Exit clearance completed | Department head signs off exit | HR Admin & Employee | Normal | `/offboarding` | HR & Employee |
| **Attendance & Shifts** | Missed punch correction | Employee submits punch correction | Manager / Approver | Normal | `/attendance/team` | Team Manager |
| | Attendance locked | HR locks monthly attendance | All Employees | Low | `/attendance/my` | Company-wide |
| | Flagged punch review | Geo-fence / Mock GPS flagged punch | HR Admin | High | `/attendance/flagged` | HR Admin |
| **Leaves & Holidays** | Leave applied | Employee requests leave | Reporting Manager | Normal | `/leaves/approvals` | Direct Manager |
| | Leave approved / rejected | Manager decides leave | Requesting Employee | High | `/leaves` | Requesting Employee |
| | Encashment request | Employee requests leave encashment | HR Manager | Normal | `/leaves/encashment` | HR Manager |
| **Payroll** | Payroll run generated | BullMQ finishes payroll batch | Super Admin & HR | Normal | `/payroll/runs` | Payroll Admins |
| | Payslip published / paid | Status updated to 'Paid' | Respective Employees | High | `/payroll/my-payslips` | Masked / Employee Only |
| | Salary revision applied | Manager/HR revises compensation | Respective Employee | High | `/me` | Masked / Employee Only |
| **Loans & Advances** | Loan application | Employee submits loan request | Approver / Finance | Normal | `/loans/approvals` | Approvers |
| | Loan approved / disbursed | Status changed to approved | Requesting Employee | High | `/loans` | Requesting Employee |
| **Expenses** | Expense claim submitted | Employee submits receipt claim | Department Manager | Normal | `/expenses/approvals` | Manager |
| | Claim settled / paid | Status updated to reimbursed | Requesting Employee | Normal | `/expenses` | Requesting Employee |
| **Assets & Inventory** | Asset assigned | Asset assigned to employee | Assigned Employee | High | `/assets/my` | Assigned Employee |
| | Requisition approved | Asset request approved | Requesting Employee | Normal | `/assets/requests` | Requesting Employee |
| | Maintenance scheduled | Maintenance ticket logged | Asset Custodian / HR | Normal | `/assets` | Asset Managers |
| **Projects & Timesheet**| Timesheet submitted | Employee submits weekly sheet | Project Manager | Normal | `/timesheets/approvals` | Project Manager |
| | Timesheet overdue reminder| Cron detects missing log | Non-compliant Employee | High | `/timesheets/my` | Assigned Employee |
| **Performance** | Review cycle started | HR initiates appraisal period | All Eligible Staff | Normal | `/performance/my-review` | Company-wide |
| | Appraisal submitted | Self/Manager appraisal completed | Reviewer / Employee | Normal | `/performance/team-reviews` | Reviewer & Employee |
| **Company Policies** | New mandatory policy | Policy published with req ack | Targeted Employees | Urgent | `/policies` | Targeted Scope |
| | Acknowledgement reminder | Approaching deadline | Unacknowledged Staff | High | `/policies` | Targeted Scope |
| **Announcements** | Urgent company announcement| Priority 'Urgent' notice posted | Targeted Audience | Urgent | `/announcements` | Target Audience |
| **Rewards & Kudos** | Award conferred | Employee wins award | Awardee & Team | Normal | `/rewards/awards` | Public / Company-wide |
| | Appreciation received | Peer sends kudos | Recipient Employee | Normal | `/rewards/kudos` | Recipient Employee |
| **Feedback & Grievance**| Confidential grievance | Employee files complaint | HR & Committee Only | Urgent | `/feedback/admin` | STRICT: Committee Only |
| | Case status updated | Committee progresses inquiry | Complainant | High | `/feedback/track` | Strictly Complainant |
| **Internal Chat** | Direct message received | User sends 1-on-1 chat message | Recipient User | Normal | `/chat` | Chat Participants |
| **Attrition Prediction**| High flight-risk alert | ML model detects >75% risk | HR Director & SuperAdmin | Urgent | `/attrition` | STRICT: SuperAdmin & HR |
| **Reports** | Scheduled report ready | Background report generated | Requesting User | Low | `/reports` | Requesting User |
| **System & Security** | New device login / 2FA | Login from unrecognized IP | Account Owner | High | `/login-history` | Account Owner |

---

## 3. Dynamic Sidebar Notification System

The sidebar must reflect unread notification counts per module:
1. **Module Unread Aggregation Endpoint**: `GET /api/v1/notifications/module-counts`.
   - Returns `{ totalUnread: number, byModule: Record<string, number>, byRoute: Record<string, number> }`.
2. **Real-Time Synchronisation**:
   - WebSockets: Whenever a `notification:new` event is emitted, the client updates the module unread store optimistically or invalidates RTK Query `Notification` tags.
   - Route Navigation: When a user navigates to a module route (e.g. `/leaves`), an optional background trigger or user action marks unread notifications in that category as read, immediately reducing the sidebar badge.
3. **Visual Representation**:
   - Top-level links: Compact count pill or pulsing emerald dot.
   - Accordion groups: If closed, group header displays cumulative unread count pill. If opened, child items display specific route count badges.

---

## 4. Notification Center & Drawer UI/UX Redesign

- **Notification Drawer**:
  - Topbar slide-out drawer accessible via Bell icon.
  - Quick action to "Mark All as Read", "Clear All", or "View All in Center".
  - Clean card item with module icon, priority dot, relative time (`5m ago`), concise body, and deep link button.
- **Dedicated Notification Center Page (`/notifications`)**:
  - Full-screen operational command center.
  - Tab 1: **Active Notifications** with filter pills (`All`, `Urgent`, `Leaves`, `Attendance`, `Payroll`, `ATS`, `Assets`, etc.).
  - Tab 2: **Archived Notifications** with search and one-click restore / permanent delete.
  - Bulk actions: Mark selected as read, Archive selected, Clear read.
  - Deep action buttons taking the user straight to approval dialogs or relevant pages.

---

## 5. Security, PBAC & Confidentiality Guarantees

- **Rule 1**: Notifications must strictly enforce PBAC visibility. A notification created for a confidential grievance complaint must never be delivered to users who are not in the designated Grievance Committee.
- **Rule 2**: Salary details and compensation revisions must not be in plaintext within notification titles; they must state "Your compensation structure has been revised" and link securely to the authenticated, masked profile view.
- **Rule 3**: Attrition predictions and flight risk scores must only be routed to Super Admin and HR Managers holding `attrition.view` permission.
