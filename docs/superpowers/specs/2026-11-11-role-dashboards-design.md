# Role Dashboards Redesign + Live Data — Design

**Date:** 2026-11-11 · **Module:** M7 Dashboard (BUILD-GUIDE §13, rows 7.1–7.5)
**Status:** Draft, awaiting approval. Builder check done; its open questions were resolved
with the user.

## 1. Intent

The four role dashboards (Super Admin, HR Manager, Department Manager, Employee) need to
match the official UI reference (`docs/ui-reference.png`, `docs/UI-REFERENCE.md`,
`DESIGN.md`). They also need to update live, without a page reload, when something changes
in the system: a punch, a leave request, an approval. Each user sees only the data their
role permits.

Supervisors (Super Admin, HR, Department Manager) also get two new widgets:
**Recent Activity** and **Upcoming Deadlines**. They let a supervisor see what changed and
what is due soon without opening each module.

### What exists today

- `DashboardPage.jsx` dispatches to `AdminDashboard` / `HrDashboard` / `ManagerDashboard` /
  `EmployeeDashboard`. Users with more than one role get a "View As" switcher.
- Each dashboard already loads real DB data from its own endpoint
  (`GET /dashboard/admin|hr|manager|employee`). The endpoints are scoped by
  `checkPermission('dashboard.view', 'all'|'team'|'own')`. **Role scoping already works.**
- Data refreshes only on page load or when the user clicks Refresh. The dashboards listen
  to no socket events.
- Styling has drifted from DESIGN.md. For example, `EmployeeDashboard` uses
  `dark:bg-slate-900` instead of the forest dark tokens (`#111D17` surface, `#1A3125`
  border).

## 2. Goals / Non-goals / Anti-goals

**Goals**
1. Restyle all four dashboards to the reference grid: 4 stat cards, then 3 cards, then
   3 cards. The employee dashboard uses a 2:1 split on rows 2 and 3.
2. Add **Recent Activity** and **Upcoming Deadlines** to the Admin, HR and Manager
   dashboards. The Manager versions are scoped to the manager's team.
3. Update live: when relevant data changes, open dashboards refetch automatically, within
   a few seconds.

**Non-goals**
- No new widgets on the Employee dashboard. Its content stays the same (punch card, leave
  balances, latest payslip, notice board) in the new layout.
- No changes to Reports (7.6–7.8), the sidebar or the topbar.
- No Urdu/RTL work beyond keeping the logical-property classes (`ps-`, `pe-`, `ms-`) in
  new markup.

**Anti-goals (failure even if it "works")**
- A Department Manager sees any activity or deadline from outside their team.
- Salary, payroll or role-change details appear in a Manager's activity feed.
- The socket broadcast carries record data. It may only say *that* something changed.
- Fake sparklines or placeholder numbers appear on a live dashboard.
- At 9 AM, many simultaneous punches cause one refetch per punch per open dashboard
  (a refetch storm).

## 3. Approaches considered (live updates)

| # | Approach | Trade-off |
|---|---|---|
| **1 ✅ chosen** | A socket event says "something changed", the dashboard debounces it, then refetches its existing scoped endpoint | Small change. It reuses the current permission scoping, so there is no new leak surface. Cost: one refetch per burst. |
| 2 | Poll every 30s | Least code, but not "instant", and it adds steady DB load for every open dashboard. |
| 3 | The server pushes computed numbers per room | Fastest, but it duplicates the scoping logic per socket room, has high leak risk and is a lot of work. |

The user picked **1**. A 60s polling fallback is added in case the socket disconnects.

## 4. Decided design

### 4.1 Layouts (approved via mockup, `.superpowers/brainstorm/.../role-layouts.html`)

● marks a card that updates live. ★ marks a new widget.

**Super Admin (whole company)**
- Row 1: Total Employees (active sub-count) · Attendance Today % ● · Pending Approvals ● ·
  Payroll Cost (last approved run, PKR)
- Row 2: Today's Attendance donut ● · 7-Day Attendance Trend bar chart ● · ★ Recent Activity ●
- Row 3: Department Cost chart · ★ Upcoming Deadlines · Upcoming Birthdays

**HR Manager (whole company)**
- Row 1: Active Employees · Present Today ● (late sub-count) · On Leave Today ● ·
  Pending Approvals ● (leave / correction / WFH breakdown)
- Row 2: Today's Attendance donut ● · Pending Approvals Queue ● · ★ Recent Activity ●
- Row 3: On Leave Today roster · ★ Upcoming Deadlines · Upcoming Birthdays

**Department Manager (own team only)**
- Row 1: Team Size · Team Present ● · Team Approvals ● (leave / correction / WFH / expense) ·
  Team Overtime (current month)
- Row 2: Team Attendance donut ● · Team 7-Day Trend ● · ★ Team Activity ●
- Row 3: Pending Approvals list ● · ★ Team Deadlines · Team Members (today's status) ●

**Employee (own data only; no new widgets)**
- Row 1: Today Status ● · Work Hours Today ● · Leave Available (sum of all types) ·
  Last Net Pay
- Row 2 (2:1): Today's Punch Card ● · Latest Payslip
- Row 3 (2:1): Leave Balances · Notice Board ●

### 4.2 Visual rules (from DESIGN.md / UI-REFERENCE.md)
- Cards: white surface, `rounded-2xl`, 1px `#EAECF0` border, `p-5`. In dark mode, the
  surface is `#111D17` and the border is `#1A3125`. No `slate-900` dark surfaces.
- Stat values: `font-mono tabular-nums`, 28px semibold. Labels: 11–12px uppercase muted.
- Status colours use the locked semantic badge table in DESIGN.md §4.
- Accent colour: **emerald `#00C471`**. The stray "Stripe Indigo" block in DESIGN.md §3 is
  ignored as a leftover. *(My call.)*
- A sparkline appears in a stat card **only** when real series data exists. Today that is
  the attendance stats, using the existing 7-day trend. Other stat cards get no sparkline.
  *(My call: the reference image shows a sparkline on every card, but a fake one breaks the
  anti-goal.)*
- Loading uses the existing `DashboardSkeleton`, updated to the new grid. Empty and error
  states follow DESIGN.md §6F.
- Header: the greeting stays in `PageHeader`. Add the reference's date + live-clock capsule
  on the right (UI-REFERENCE §5).

### 4.3 New widget: Recent Activity
- **Source:** the `AuditLog` collection, newest first, 8 items, with "View All" linking to
  the existing audit logs page.
- **Each item:** the actor's name, a human-readable action, the target, and a relative time.
  Map the action keys (`LEAVE_APPROVED` and so on) to readable strings with one lookup
  table. Unknown keys fall back to a title-cased key.
- **Excluded everywhere:** auth noise (`module` is `auth` or `AUTH`: logins, logouts,
  token refresh). *(My call.)*
- **Super Admin / HR:** all modules. "View All" links to the audit logs page.
- **Department Manager** *(decided with the user)*:
  - **Allowlist, not blocklist.** Show only entries whose stored `module` (the lowercased
    entity name written by `recordAuditLog`) is one of: `leave`, `attendancecorrection`,
    `wfhrequest`, `attendance` (overtime decisions), `expense`, `asset`/`assetrequest`,
    `checklist`, `project`/`timesheet`, `review`/`goal`. The builder confirms the exact
    stored strings with `AuditLog.distinct('module')` and keeps them in one constant,
    `MANAGER_ACTIVITY_MODULES`.
  - **Never visible, even when team-linked:** `payrollrun`, `payslip`, `salarystructure`,
    `loan`, `leaveencashment`, `user`, `role`, `setting` and `employee`. Employee record
    updates can hide salary or role changes. Because this is an allowlist, any new entity
    stays hidden by default.
  - **Team link.** An entry is visible if its actor is the manager or a team member, **or**
    if the record it targets belongs to a team member. Resolve the owner per model through
    that model's `employeeId` field (for example `Leave.employeeId`, `Expense.employeeId`),
    driven by one `{ module → Model }` map. Modules with no `employeeId` path use the actor
    rule only.
  - No "View All" link, because the audit page requires `audit.view` with scope `all`.
    *(My call.)*
- **Pre-requisite fix:** `recordAuditLog()` in `backend/src/services/audit.service.js`
  expects `userId`/`actor` and `details`. 43 of its 123 call sites, in the asset, leave,
  onboarding and project services, pass `actorId` and `meta` instead, so the actor and the
  metadata are silently dropped. Fix this once, in `recordAuditLog`, by also accepting
  `actorId` and `meta`. Do not edit the 43 call sites. Without this fix, Activity shows
  "System" for those actions.

### 4.4 New widget: Upcoming Deadlines
- **Window:** next 30 days, soonest first, up to 8 items. Each item shows a date, a title,
  a type pill and a link.

| Source | Field | Super Admin / HR | Manager (team) |
|---|---|---|---|
| Probation ending | `Employee.probationEndDate` | all | team members only |
| Job posting closing | `Job.closingDate` (status open) | all | jobs of manager's department |
| Project ending | `Project.endDate` (not completed) | all | projects with a team member assigned or managed by the manager |
| Self-review deadline | `ReviewCycle.selfReviewDeadline` (active cycle) | all | yes (applies to team) |
| Onboarding task due | `Checklist.dueDate` (incomplete) | all | checklists of team members |

### 4.5 Live updates
- **Backend:** `AuditService.log()` emits `dashboard:changed` with payload `{ module }` only,
  after a successful write. Auth entries are skipped, so a login does not trigger a refetch.
  *(My call.)*
- **Gap found in review:** attendance mutations do **not** write audit logs. In
  `attendance.service.js` this covers punches, breaks, `applyWFH`/`decideWFH`,
  `applyCorrection`/`decideCorrection` and `decideOvertime`. So *(my call)*:
  - All of these emit `dashboard:changed` (`{ module: 'attendance' }`) directly.
  - The requests (`applyWFH`, `applyCorrection`) and the decisions (`decideWFH`,
    `decideCorrection`, `decideOvertime`) also call `recordAuditLog`, so they appear in
    Recent Activity. Punches and breaks do **not**: at 9 AM they would flood the 8-item feed.
- **`attendance:punch` payload narrowed** *(decided with the user)*. Today it broadcasts
  every punch's `employeeName`, `checkIn`, `status` and `flags` to every logged-in user.
  Reduce it to `{ employeeId, departmentId, date }` at both emit sites (check-in around
  line 457, check-out around line 565). The only listener, `TeamAttendancePage.jsx`, ignores
  the payload, so nothing breaks. `announcement:new` and `payroll:completed` stay as they are.
- **Who receives the event:** it is broadcast to `company:broadcast`. The payload is a
  module name only, so it leaks nothing. The receiver refetches its own scoped endpoint,
  so it only ever sees data it is allowed to see.
- **Frontend:** a single `useDashboardLiveRefresh()` hook in `features/dashboard/`:
  - It gets the shared socket via `getSocket()`, following the pattern in
    `TeamAttendancePage.jsx`.
  - Admin, HR and Manager dashboards listen to `dashboard:changed`, `attendance:punch` and
    `payroll:completed`.
  - The Employee dashboard listens to `notification:new` (already user-targeted; it fires
    when the user's own leave or expense is decided), `announcement:new`, and
    `attendance:punch` only when the payload is the user's own employee id.
  - Debounce for **3 seconds** (trailing) with a **10-second maximum wait**, so a steady
    stream of punches cannot postpone the refetch forever. Then
    `dispatch(dashboardApi.util.invalidateTags(['Dashboard']))`. *(My call.)*
  - Remove listeners by handler reference (`socket.off(event, handler)`), not with
    `socket.off(event)`. The second form would also strip `TeamAttendancePage`'s listener.
  - The fallback is `pollingInterval: 60000` on the dashboard queries.
- The existing Refresh button stays.

### 4.6 API changes
- `getAdminDashboardData` and `getHrDashboardData` also return `recentActivity` and
  `upcomingDeadlines`.
- `getManagerDashboardData` also returns team-scoped `recentActivity` and
  `upcomingDeadlines`, and each `teamMembers[]` entry gains `todayStatus`.
- `getEmployeeDashboardData`: no new fields.
- No new routes and no permission changes.

## 5. Left to the builder
- Component breakdown and file names for the new widgets. Reuse the existing `widgets/`
  folder (`StatCard`, `AttendanceChart`, `PendingList`, `BirthdaysCard`) where it fits.
- Chart library usage, following whatever the current `AttendanceChart` uses.
- Wording of the action-to-text lookup table.
- Whether the debounce lives in the hook or uses an existing utility.
- Which department a manager's job postings come from when they head several (any of them
  is fine).
- The exact team-link field for `Project` and `Checklist`, which the review did not verify.
- **Tests (required):** backend tests for Manager scoping:
  - a team member's leave approved by HR **is** visible;
  - a payslip, salary or employee-update entry for a team member is **not** visible;
  - an entry from another department is **not** visible.

  Also a test for the `recordAuditLog` alias fix.
