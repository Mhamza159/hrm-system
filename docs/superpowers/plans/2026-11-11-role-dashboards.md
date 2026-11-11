# Role Dashboards Redesign + Live Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the four role dashboards to the UI reference, add team-scoped Recent Activity
and Upcoming Deadlines for supervisors, and make dashboards refetch live on socket events.

**Architecture:** The backend gains two focused service files (`dashboard.activity.js`,
`dashboard.deadlines.js`). Their results are merged into the existing role payloads. Every
audit write, plus every attendance mutation, emits a payload-free `dashboard:changed` socket
event. The frontend gets one hook that debounces those events and invalidates the
`Dashboard` RTK tag, plus shared card widgets reused by all four dashboards.

**Tech Stack:** Express + Mongoose + Socket.io + Vitest/Supertest (backend). React 19 +
RTK Query + Tailwind (frontend; no frontend test runner exists).

**Spec:** `docs/superpowers/specs/2026-11-11-role-dashboards-design.md`

## Global Constraints

- Plain JavaScript (`.js`/`.jsx`), no TypeScript. **No new npm dependencies** in either app.
- Accent colour is emerald `#00C471` (hover `#049856`). Ignore the "Stripe Indigo" block in
  DESIGN.md.
- Cards: `rounded-2xl`, `border border-[#EAECF0]`, `bg-white`, `p-5`. Dark mode:
  `dark:bg-[#111D17] dark:border-[#1A3125]`. **No `dark:bg-slate-900` / `dark:border-slate-800`.**
- Stat values: `font-mono tabular-nums text-[28px] font-semibold`. Labels: 11px uppercase,
  `tracking-wider`, muted text.
- Status colours come only from the DESIGN.md §4 badge table.
- New markup uses logical properties (`ps-`/`pe-`/`ms-`/`me-`/`border-s`), never `pl-`/`pr-`/`ml-`/`mr-`.
- Socket payloads added or changed by this work carry **no record data** beyond ids and a
  module name.
- Sparklines only where a real series exists (attendance stats from `attendanceTrend`).
  Never fake data.
- Debounce: 3000 ms trailing, 10000 ms max wait. Polling fallback: `pollingInterval: 60000`.
- Activity feed: 8 items. Deadlines: next 30 days, 8 items, soonest first.
- Manager activity allowlist and blocklist are exactly as in spec §4.3.
- Backend tests: `cd backend && npx vitest run <file>`. Frontend check: `cd frontend && npx vite build`.

## Review Focus

1. **Manager with no Employee record or no team.** Expect empty `recentActivity` and
   `upcomingDeadlines` arrays, not a 500. Tested in Task 5.
2. **Audit entry with a null actor** (cron or system job). The feed shows `actorName: 'System'`.
   Tested in Task 3.
3. **Audit entry whose target record was deleted.** The team lookup finds no owner and falls
   back to the actor rule without throwing. Tested in Task 3.
4. **Audit write fails** (DB error). No `dashboard:changed` is emitted and the business call
   still succeeds. Tested in Task 1.
5. **A user switches "View As" roles, or the socket is null at mount.** Listeners are removed
   by handler reference and the hook no-ops when `getSocket()` is null; polling covers that
   case. Checked manually in Task 6, step 4.

---

### Task 1: Audit service — alias fix + `dashboard:changed` emit

**Files:**
- Modify: `backend/src/services/audit.service.js`
- Test: `backend/tests/audit.dashboard-emit.test.js` (create)

**Interfaces:**
- Produces:
  - `recordAuditLog(...)` now also accepts `actorId` (an alias of `userId`) and `meta` (merged
    into `details`).
  - `AuditService.log()` calls `emitToCompany('dashboard:changed', { module })` after a
    successful write, unless `module` lowercases to `auth`.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
vi.mock('../src/services/socket.service.js', () => ({ emitToCompany: vi.fn() }));
import { emitToCompany } from '../src/services/socket.service.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { AuditService, recordAuditLog } from '../src/services/audit.service.js';

// beforeAll: connect to env.MONGO_URI.replace('hrm_development','hrm_test_audit_emit'); AuditLog.deleteMany({})
// beforeEach: vi.clearAllMocks()

it('recordAuditLog keeps actor and meta passed as actorId/meta', async () => {
  const actorId = new mongoose.Types.ObjectId();
  const log = await recordAuditLog({ action: 'LEAVE_TYPE_CREATE', actorId, entity: 'LeaveType',
    entityId: new mongoose.Types.ObjectId(), meta: { code: 'CL' } });
  expect(String(log.actorId)).toBe(String(actorId));
  expect(log.details.code).toBe('CL');
});

it('emits dashboard:changed with module only', async () => {
  await AuditService.log({ action: 'LEAVE_APPROVED', module: 'leave' });
  expect(emitToCompany).toHaveBeenCalledWith('dashboard:changed', { module: 'leave' });
});

it('does not emit for auth entries', async () => {
  await AuditService.log({ action: 'USER_LOGIN', module: 'AUTH' });
  expect(emitToCompany).not.toHaveBeenCalled();
});

it('does not emit when the write fails', async () => {
  vi.spyOn(AuditLog, 'create').mockRejectedValueOnce(new Error('db down'));
  const res = await AuditService.log({ action: 'X', module: 'leave' });
  expect(res).toBeNull();
  expect(emitToCompany).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd backend && npx vitest run tests/audit.dashboard-emit.test.js`
Expected: FAIL on the actor/meta assertion and on the emit assertions.

- [ ] **Step 3: Implement**

In `recordAuditLog`, the parameters become `{ userId, actorId, actor, ..., details = {}, meta = {} }`.
The actor is `userId || actorId || actor?._id || null`, and details are
`{ before, after, ...meta, ...details }`. In `AuditService.log`, import `emitToCompany` from
`./socket.service.js` and emit after `await AuditLog.create(...)` inside the `try`, guarded by
`String(module).toLowerCase() !== 'auth'`.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd backend && npx vitest run tests/audit.dashboard-emit.test.js tests/auditlogs.test.js`
Expected: PASS, and existing audit tests are still green.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/audit.service.js backend/tests/audit.dashboard-emit.test.js
git commit -m "fix(audit): accept actorId/meta aliases and emit dashboard:changed"
```

---

### Task 2: Attendance — live events, audit for requests/decisions, narrowed punch payload

**Files:**
- Modify: `backend/src/modules/attendance/attendance.service.js`. The functions are
  `checkIn` (~L243, emit ~L457), `checkOut` (~L478, emit ~L565), the break start/end
  functions, `applyWFH` (~L1045), `decideWFH` (~L1135), `applyCorrection` (~L1311),
  `decideCorrection` (~L1429) and `decideOvertime` (~L1874).
- Test: `backend/tests/attendance.dashboard-events.test.js` (create)

**Interfaces:**
- Consumes: `recordAuditLog` from Task 1. Each `recordAuditLog` already emits.
- Produces:
  - `export const buildPunchBroadcast = (attendance, employee) => ({ employeeId, departmentId, date })`.
    Ids are strings; `departmentId` may be `null`.
  - Audit `module` strings: `wfhrequest`, `attendancecorrection` and `attendance` (overtime).
    These come from the entities `WFHRequest`, `AttendanceCorrection` and `Attendance`.

- [ ] **Step 1: Write the failing tests**

```js
// Pure function
it('buildPunchBroadcast exposes only ids and date', () => {
  const p = buildPunchBroadcast({ date: '2026-11-11', checkIn: new Date(), status: 'late', flags: ['x'] },
    { _id: empId, name: 'Ali', departmentId: deptId });
  expect(Object.keys(p).sort()).toEqual(['date', 'departmentId', 'employeeId']);
  expect(p.employeeId).toBe(String(empId));
});

// Integration (test DB 'hrm_test_attendance_dash'; seed one employee+user, socket.service mocked as in Task 1)
it('applyWFH and decideWFH write audit logs and emit dashboard:changed', async () => {
  const req = await applyWFH({ user: staffUser, date: tomorrow, reason: 'plumber' });
  await decideWFH({ requestId: req._id, user: hrUser, decision: 'approved' });
  const logs = await AuditLog.find({ module: 'wfhrequest' });
  expect(logs).toHaveLength(2);
  expect(emitToCompany).toHaveBeenCalledWith('dashboard:changed', { module: 'wfhrequest' });
});

it('checkIn emits dashboard:changed but writes no audit log', async () => {
  // call checkIn through the API (supertest POST /api/v1/attendance/check-in) as in attendance.api.test.js
  expect(emitToCompany).toHaveBeenCalledWith('dashboard:changed', { module: 'attendance' });
  expect(await AuditLog.countDocuments({ module: 'attendance', action: /CHECK_?IN/i })).toBe(0);
});
```

Copy the seed and auth setup from `backend/tests/attendance.api.test.js`. Match the
`applyWFH`/`decideWFH` return shapes and argument names to their current signatures.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd backend && npx vitest run tests/attendance.dashboard-events.test.js`
Expected: FAIL. `buildPunchBroadcast` is not exported and no audit logs exist.

- [ ] **Step 3: Implement**

- Replace both inline punch payloads with `buildPunchBroadcast(attendance, employee)`.
- After each mutation commits, call `emitToCompany('dashboard:changed', { module: 'attendance' })`.
  This applies to `checkIn`, `checkOut`, break start/end, `applyWFH`, `decideWFH`,
  `applyCorrection`, `decideCorrection` and `decideOvertime`.
- Add `recordAuditLog({ actor: user, action, entity, entityId, after })` to the five
  request/decision functions. Use these actions:
  - `WFH_REQUESTED`, `WFH_APPROVED`/`WFH_REJECTED` (entity `WFHRequest`)
  - `CORRECTION_REQUESTED`, `CORRECTION_APPROVED`/`CORRECTION_REJECTED` (entity `AttendanceCorrection`)
  - `OVERTIME_APPROVED`/`OVERTIME_REJECTED` (entity `Attendance`)
- Audit calls get `.catch(() => {})`, as elsewhere in the file. They must never break the
  attendance flow.
- Those five functions now get two emits each, one from the audit write and one direct. The
  debounce absorbs this, so leave it.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd backend && npx vitest run tests/attendance.dashboard-events.test.js tests/attendance.api.test.js tests/attendance.overtime.test.js tests/attendance.security.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/attendance/attendance.service.js backend/tests/attendance.dashboard-events.test.js
git commit -m "feat(attendance): emit dashboard events, audit WFH/correction/overtime, narrow punch broadcast"
```

---

### Task 3: Recent Activity service

**Files:**
- Create: `backend/src/modules/dashboard/dashboard.activity.js`
- Test: `backend/tests/dashboard.activity.test.js` (create)

**Interfaces:**
- Consumes: the `team` shape from Task 5's `resolveManagerTeam`. Tests build it by hand.
- Produces:
  - `export const MANAGER_ACTIVITY_MODULES` (array of lowercase strings, spec §4.3 allowlist)
  - `export const formatActionLabel = (action: string) => string`
  - `export const getRecentActivity = async ({ team = null, limit = 8 } = {}) =>
    Array<{ _id, actorName, actionLabel, action, module, targetModel, createdAt }>`
    - `team === null` means company-wide: all modules except auth.
    - `team = { teamEmployeeIds: ObjectId[], teamUserIds: ObjectId[] }` means
      manager-scoped. `teamUserIds` includes the manager's own userId.

- [ ] **Step 1: Write the failing tests**

Seed (test DB `hrm_test_dash_activity`): department A with manager M (user `mU`, employee
`mE`) and staff S (user `sU`, employee `sE`); department B with staff X (user `xU`,
employee `xE`); HR user `hU`; leave `L1` for `sE`, leave `L2` for `xE`. Then create
AuditLog rows directly:

```js
const team = { teamEmployeeIds: [mE._id, sE._id], teamUserIds: [mU._id, sU._id] };

it('shows a team member leave approved by HR (target-owner rule)', async () => {
  await AuditLog.create({ actorId: hU._id, action: 'LEAVE_APPROVED', module: 'leave', targetModel: 'Leave', targetId: L1._id });
  const items = await getRecentActivity({ team });
  expect(items.map((i) => i.action)).toContain('LEAVE_APPROVED');
});

it('hides another department entry', async () => {
  await AuditLog.create({ actorId: hU._id, action: 'LEAVE_REJECTED', module: 'leave', targetModel: 'Leave', targetId: L2._id });
  const items = await getRecentActivity({ team });
  expect(items.find((i) => i.action === 'LEAVE_REJECTED')).toBeUndefined();
});

it.each(['payslip', 'salarystructure', 'employee', 'loan', 'payrollrun'])(
  'never shows %s to a manager even for a team member', async (module) => {
    await AuditLog.create({ actorId: sU._id, action: `${module.toUpperCase()}_X`, module, targetId: sE._id });
    const items = await getRecentActivity({ team });
    expect(items.find((i) => i.module === module)).toBeUndefined();
  });

it('company-wide feed excludes auth and includes payroll', async () => {
  await AuditLog.create({ action: 'USER_LOGIN', module: 'AUTH' });
  await AuditLog.create({ actorId: hU._id, action: 'PAYROLL_RUN_APPROVED', module: 'payrollrun' });
  const items = await getRecentActivity();
  expect(items.some((i) => i.module.toLowerCase() === 'auth')).toBe(false);
  expect(items.some((i) => i.module === 'payrollrun')).toBe(true);
});

it('null actor shows as System', async () => {
  await AuditLog.create({ actorId: null, action: 'LEAVE_AUTO_LAPSED', module: 'leave', targetModel: 'Leave', targetId: L1._id });
  const items = await getRecentActivity();
  expect(items.find((i) => i.action === 'LEAVE_AUTO_LAPSED').actorName).toBe('System');
});

it('deleted target falls back to actor rule without throwing', async () => {
  await AuditLog.create({ actorId: sU._id, action: 'EXPENSE_SUBMITTED', module: 'expense', targetModel: 'Expense', targetId: new mongoose.Types.ObjectId() });
  const items = await getRecentActivity({ team });
  expect(items.map((i) => i.action)).toContain('EXPENSE_SUBMITTED');
});

it('caps at limit and sorts newest first', async () => { /* insert 10 rows → length 8, createdAt desc */ });

it('formatActionLabel falls back to title case', () => {
  expect(formatActionLabel('SOME_NEW_THING')).toBe('Some New Thing');
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd backend && npx vitest run tests/dashboard.activity.test.js`
Expected: FAIL, because the module does not exist.

- [ ] **Step 3: Implement `dashboard.activity.js`**

- **Query.** Use `AuditLog.find(filter).sort({ createdAt: -1 }).limit(team ? 200 : limit)`,
  where `filter` is either `{ module: { $nin: ['auth','AUTH'] } }` or
  `{ module: { $in: MANAGER_ACTIVITY_MODULES } }`. Add this comment:
  `// shortcut: team feed scans the latest 200 allowlisted rows, upgrade to an aggregation if teams see empty feeds`.
- **Team filter.** A row is kept if `actorId ∈ teamUserIds`. Otherwise, resolve the owner
  through `OWNER_MODELS = { leave: Leave, attendancecorrection: AttendanceCorrection, wfhrequest: WFHRequest, attendance: Attendance, expense: Expense, assetrequest: AssetRequest, checklist: Checklist }`:
  - Do one batched `Model.find({ _id: { $in } }).select('employeeId')` per module.
  - Keep the row if the owner's `employeeId ∈ teamEmployeeIds`.
  - Modules not in `OWNER_MODELS` use the actor rule only.
  - Slice the result to `limit`.
- **Actor name.** Batch-load `Employee.find({ userId: { $in: actorIds } }).select('userId name')`.
  If there is no Employee, use `actorEmail`. If there is no actor, use `'System'`.
- **Labels.** `formatActionLabel` uses a small `ACTION_LABELS` map for the actions that
  Task 2 and the leave/expense services emit, then falls back to title case.
- **Before finalising `MANAGER_ACTIVITY_MODULES`,** run
  `node -e` with `AuditLog.distinct('module')` against the dev DB. Keep only the allowlisted
  concepts from spec §4.3, using their real stored spelling.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd backend && npx vitest run tests/dashboard.activity.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/dashboard/dashboard.activity.js backend/tests/dashboard.activity.test.js
git commit -m "feat(dashboard): add role-scoped recent activity service"
```

---

### Task 4: Upcoming Deadlines service

**Files:**
- Create: `backend/src/modules/dashboard/dashboard.deadlines.js`
- Test: `backend/tests/dashboard.deadlines.test.js` (create)

**Interfaces:**
- Consumes: the `team` shape `{ managerEmpId, teamEmployeeIds, managedDeptIds }` (Task 5).
- Produces: `export const getUpcomingDeadlines = async ({ team = null, days = 30, limit = 8 } = {}) =>
  Array<{ _id, type: 'probation'|'job'|'project'|'review'|'checklist', title, date: Date, link: string }>`

| type | Query | Team filter | title | link |
|---|---|---|---|---|
| probation | `Employee` `isDeleted:false`, status Active/Probation, `probationEndDate` in window | `_id ∈ teamEmployeeIds` | `Probation ends: ${name}` | `/employees/${_id}` |
| job | `Job` `status:'Published'`, `closingDate` in window | `departmentId ∈ managedDeptIds` | `Job closes: ${title}` | recruitment jobs route |
| project | `Project` `isDeleted:false`, status `active`/`on_hold`, `endDate` in window | `managerId = managerEmpId` or `members.employeeId ∈ teamEmployeeIds` | `Project ends: ${name}` | projects route |
| review | `ReviewCycle` (default export) `status:'Active'`, `selfReviewDeadline` in window | none (applies to all) | `Self-review due: ${title}` | performance route |
| checklist | `Checklist` (default export) `completed:false`, `dueDate` in window | `employeeId ∈ teamEmployeeIds` | `Task due: ${title}` | onboarding route |

The window is `[startOf today Asia/Karachi, +days]`. Take route paths from `frontend/src/App.jsx`.

- [ ] **Step 1: Write the failing tests** (test DB `hrm_test_dash_deadlines`)

```js
it('returns all five types company-wide, sorted soonest first, within 30 days', async () => {
  // seed one of each due in 5,10,15,20,25 days + one probation due in 40 days
  const items = await getUpcomingDeadlines();
  expect(items.map((i) => i.type)).toEqual(['probation', 'job', 'project', 'review', 'checklist']);
  expect(items.every((i) => dayjs(i.date).diff(dayjs(), 'day') <= 30)).toBe(true);
});

it('manager sees only team probation/checklists, own-dept jobs, own/member projects', async () => {
  // seed one of each for dept A (team) and dept B (other)
  const items = await getUpcomingDeadlines({ team });
  expect(items.filter((i) => i.type !== 'review').every((i) => teamItemIds.includes(String(i._id)))).toBe(true);
});

it('ignores completed checklists, closed jobs, completed projects', async () => { /* expect length 0 for those */ });
it('caps at limit', async () => { /* 10 seeded → 8 */ });
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd backend && npx vitest run tests/dashboard.deadlines.test.js`
Expected: FAIL, because the module does not exist.

- [ ] **Step 3: Implement `dashboard.deadlines.js`.** Run the five queries in `Promise.all`,
  each with `.limit(limit).lean()`. Map them to the shape above, merge, sort by `date` ascending
  and slice to `limit`.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd backend && npx vitest run tests/dashboard.deadlines.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/dashboard/dashboard.deadlines.js backend/tests/dashboard.deadlines.test.js
git commit -m "feat(dashboard): add role-scoped upcoming deadlines service"
```

---

### Task 5: Wire activity + deadlines into role payloads

**Files:**
- Modify: `backend/src/modules/dashboard/dashboard.service.js`
- Test: `backend/tests/dashboard.test.js` (extend)

**Interfaces:**
- Consumes: `getRecentActivity` (Task 3) and `getUpcomingDeadlines` (Task 4).
- Produces:
  - `export const resolveManagerTeam = async (user) => ({ managerEmp, managedDeptIds, teamMembers, teamEmployeeIds, teamUserIds, managerEmpId }) | null`.
    It is extracted from the current inline logic in `getManagerDashboardData`.
    - `teamEmployeeIds` includes the manager.
    - `teamUserIds` comes from `teamMembers[].userId` plus `user._id`.
    - It returns `null` when there is no manager employee or no team.
  - Admin and HR payloads gain `recentActivity` and `upcomingDeadlines`.
  - The manager payload gains `recentActivity` and `upcomingDeadlines` (team-scoped), and
    each `teamMembers[]` item gains `todayStatus`. `todayStatus` is the attendance status
    string or `'not_marked'`.
  - The empty-team branch also returns `recentActivity: []` and `upcomingDeadlines: []`.

- [ ] **Step 1: Add failing tests** to `dashboard.test.js`, using the existing tokens and seed:

```js
it('7.1/7.2: admin and hr payloads include recentActivity and upcomingDeadlines arrays', async () => {
  for (const [path, token] of [['/api/v1/dashboard/admin', superAdminToken], ['/api/v1/dashboard/hr', hrToken]]) {
    const res = await request(app).get(path).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.recentActivity)).toBe(true);
    expect(Array.isArray(res.body.data.upcomingDeadlines)).toBe(true);
  }
});

it('7.3: manager team members carry todayStatus', async () => {
  const res = await request(app).get('/api/v1/dashboard/manager').set('Authorization', `Bearer ${managerToken}`);
  expect(res.body.data.teamMembers.every((m) => typeof m.todayStatus === 'string')).toBe(true);
});

it('7.3: manager with no employee record gets empty activity/deadlines, not 500', async () => {
  // create a Department Manager user with no Employee doc, sign token
  const res = await request(app).get('/api/v1/dashboard/manager').set('Authorization', `Bearer ${orphanToken}`);
  expect(res.status).toBe(200);
  expect(res.body.data.recentActivity).toEqual([]);
  expect(res.body.data.upcomingDeadlines).toEqual([]);
});
```

Match the API prefix to the existing requests in this file.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd backend && npx vitest run tests/dashboard.test.js`
Expected: the new tests FAIL and the old ones PASS.

- [ ] **Step 3: Implement.** Add `getRecentActivity()` and `getUpcomingDeadlines()` to the
  admin and HR `Promise.all`. In the manager function, call `resolveManagerTeam(user)`; on
  `null`, return the empty shape. Otherwise pass `{ team }` to both new services and add
  `todayStatus` from the team's today attendance. Fetch that with one
  `Attendance.find(...).select('employeeId status')` alongside the existing today aggregate.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd backend && npx vitest run tests/dashboard.test.js tests/dashboard.activity.test.js tests/dashboard.deadlines.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/dashboard/dashboard.service.js backend/tests/dashboard.test.js
git commit -m "feat(dashboard): include activity and deadlines in role payloads"
```

---

### Task 6: Frontend live-refresh hook

**Files:**
- Create: `frontend/src/features/dashboard/hooks/useDashboardLiveRefresh.js`
- Modify: the query calls in `AdminDashboard.jsx`, `HrDashboard.jsx`, `ManagerDashboard.jsx`
  and `EmployeeDashboard.jsx`, which gain `{ pollingInterval: 60000 }`

**Interfaces:**
- Consumes: `getSocket()` from `features/notifications/hooks/useSocket.js`, and
  `dashboardApi.util.invalidateTags(['Dashboard'])`.
- Produces: `export function useDashboardLiveRefresh({ events, accept = () => true })`.
  - `events: string[]`.
  - `accept(event, payload) => boolean` decides whether an event counts.
  - Trailing debounce of 3000 ms with a 10000 ms max wait, then one `invalidateTags` dispatch.
  - Cleanup calls `socket.off(event, handler)` for each event, and clears timers.
  - If `getSocket()` is null, it does nothing.

Event sets (used in Tasks 8–11):
- `SUPERVISOR_EVENTS = ['dashboard:changed', 'attendance:punch', 'payroll:completed']`
- `EMPLOYEE_EVENTS = ['notification:new', 'announcement:new', 'attendance:punch']`. Employee
  `accept` is `(e, p) => e !== 'attendance:punch' || p?.employeeId === String(user?.employeeId)`.

- [ ] **Step 1: Implement the hook.** Export both event constants from the same file.
- [ ] **Step 2: Add `{ pollingInterval: 60000 }`** to the four `useGet…DashboardQuery()` calls.
- [ ] **Step 3: Build**

Run: `cd frontend && npx vite build`
Expected: the build succeeds.

- [ ] **Step 4: Manual check.** With backend and frontend running, open the HR dashboard in
  one tab. In another tab, as an employee, apply for WFH. The HR "Pending Approvals" count
  should update within about 3 to 10 s without a reload. Then switch "View As" back and forth
  three times, trigger one event, and confirm in the DevTools Network tab that
  `/dashboard/hr` is fetched **once**.
- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/dashboard
git commit -m "feat(dashboard): live refresh via debounced socket events with polling fallback"
```

---

### Task 7: Shared dashboard widgets + header capsule

**Files:**
- Create: `frontend/src/features/dashboard/components/widgets/DashboardCard.jsx`
- Modify: `frontend/src/features/dashboard/components/widgets/StatCard.jsx`
- Create: `frontend/src/features/dashboard/components/widgets/RecentActivityCard.jsx`
- Create: `frontend/src/features/dashboard/components/widgets/UpcomingDeadlinesCard.jsx`
- Create: `frontend/src/features/dashboard/components/widgets/AttendanceDonut.jsx`
- Modify: `frontend/src/features/dashboard/DashboardPage.jsx` (date and live-clock capsule)

**Interfaces:**
- Produces:
  - `DashboardCard({ title, action?: { label, to }, live?: boolean, className, children })`.
    The card primitive from Global Constraints. `live` shows the pulsing emerald dot.
  - `StatCard({ label, value, sub?, subTone?: 'emerald'|'amber'|'rose'|'muted', icon, series?: number[] })`.
    A sparkline is rendered as an inline SVG polyline **only** when `series?.length >= 2`.
    Update existing callers to these props.
  - `RecentActivityCard({ items, showViewAll })`. `items` is the Task 3 shape. Each item shows
    `actorName`, `actionLabel` and a relative time. `showViewAll` links to `/audit-logs`.
    Includes an empty state.
  - `UpcomingDeadlinesCard({ items, title = 'Upcoming Deadlines' })`. `items` is the Task 4
    shape. Each item shows a date block, the title and a type pill:
    probation → amber, job → blue, project → violet, review → teal, checklist → slate.
    Includes an empty state.
  - `AttendanceDonut({ breakdown })`. `breakdown` is the `todayBreakdown` from the API, drawn
    as an SVG ring using the DESIGN.md §4 colours (present emerald, late amber, on_leave blue,
    absent rose, half_day cyan) with a legend.
- Header capsule: the right side of `PageHeader` `actions` shows today's date and a live clock
  in `Asia/Karachi`, updating every second, styled per UI-REFERENCE §5. The Refresh button stays.

- [ ] **Step 1: Build the components** to the interfaces above, using only Tailwind and inline SVG.
- [ ] **Step 2: Build**

Run: `cd frontend && npx vite build`
Expected: the build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/dashboard
git commit -m "feat(dashboard): shared reference-style widgets and live clock header"
```

---

### Tasks 8–11: Restyle each dashboard

Each of these four tasks follows the same pattern:
- Rebuild one dashboard component to its row layout in spec §4.1, using the Task 7 widgets.
- Call `useDashboardLiveRefresh` with the right event set.
- Update the matching `variant` in `DashboardSkeleton.jsx` to the same grid.
- Remove every `dark:bg-slate-900` / `dark:border-slate-800` in that file.

Each is verified with `cd frontend && npx vite build` plus a manual look in light and dark
mode, logged in as that role, compared side by side with `docs/ui-reference.png`. Commit
after each one.

| Task | File | Live hook | Notes |
|---|---|---|---|
| 8 | `AdminDashboard.jsx` | `SUPERVISOR_EVENTS` | Attendance stat gets `series` from `attendanceTrend` (present+late per day). `RecentActivityCard showViewAll`. `DepartmentCostChart` and `BirthdaysCard` restyled into `DashboardCard`. |
| 9 | `HrDashboard.jsx` | `SUPERVISOR_EVENTS` | Row-2 middle card is the existing `PendingList` inside `DashboardCard`. Present stat has no series (HR payload has no trend). `RecentActivityCard showViewAll`. |
| 10 | `ManagerDashboard.jsx` | `SUPERVISOR_EVENTS` | Titles are "Team Activity" and "Team Deadlines". `showViewAll={false}`. Team Members list shows a `todayStatus` badge from the DESIGN.md §4 colours. |
| 11 | `EmployeeDashboard.jsx` | `EMPLOYEE_EVENTS` with `accept` from Task 6 | No new widgets. Leave Available is the sum of `leaveBalances[].available`. Rows 2 and 3 use `lg:grid-cols-3` with a `lg:col-span-2` left card. |

Commit messages: `feat(dashboard): restyle admin|hr|manager|employee dashboard to UI reference`.

---

## Self-review notes

- **Spec coverage.** Each spec section maps to tasks:
  - §4.1 → Tasks 8–11
  - §4.2 → Global Constraints and Task 7
  - §4.3 → Tasks 1 and 3
  - §4.4 → Task 4
  - §4.5 → Tasks 1, 2 and 6
  - §4.6 → Task 5
  - §5 tests → Tasks 3 and 5
- **Type consistency.** The `team` objects from Task 5 carry the field sets used by Task 3
  (`teamEmployeeIds`, `teamUserIds`) and Task 4 (`managerEmpId`, `teamEmployeeIds`,
  `managedDeptIds`).
