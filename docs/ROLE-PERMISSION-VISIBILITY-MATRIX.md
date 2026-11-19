# Role-Permission Visibility Matrix (RBAC & PBAC)

## 1. Overview & System-Wide Architectural Guarantee

This document defines the authoritative, enterprise-wide **Role-Permission Visibility Matrix** across all 26 modules of the HRMS application.

### Zero UI Leakage Rule
In accordance with system security contracts:
- **No Permission = No UI Element**: If an authenticated actor lacks an authorized action permission or the permission is dynamically revoked, the corresponding UI elements (**buttons, links, navigation tabs, cards, dropdown actions, and modals**) **must NOT render at all (returning `null`)**.
- **Strictly Banned Patterns**: Unauthorized functionality must **never** be rendered as disabled buttons, greyed-out controls, locked menu items, empty tabs, or restricted modals.
- **Super Admin Exemption**: Any actor assigned the `Super Admin` role or holding the wildcard permission (`action: 'manage', subject: 'all'`) possesses unrestricted, global visibility and administrative capabilities across every module.
- **Dual Enforcement (Defense in Depth)**: Frontend visibility guards are paired 1:1 with backend `checkPermission(action, subject)` Express middlewares that enforce authorization at the API route boundary, rejecting unauthorized requests with `HTTP 403 Forbidden`.

---

## 2. Multi-Role Matrix Across Modules

### Legend
- `VIS (all)`: Visible with company-wide / global scope
- `VIS (dept)`: Visible scoped to user's assigned department
- `VIS (team)`: Visible scoped to direct reporting hierarchy / team
- `VIS (own)`: Visible scoped strictly to actor's personal records (`isMe / own`)
- `HIDDEN`: Completely unrendered (`null` in DOM, 0 DOM footprint)
- `403`: Backend API returns HTTP 403 Forbidden on direct invocation

---

### Core HR & Workforce Administration

| Module | Feature / Action | Required Action | Super Admin | HR Manager | Dept Manager | Employee | View-Only Role | Backend Enforcement |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **M1 Organization** | View Org Chart / Hierarchy | `org.view` | VIS (all) | VIS (all) | VIS (dept) | VIS (team) | VIS (all) | `checkPermission('org.view')` |
| **M1 Organization** | Edit Department / Unit | `org.manage` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('org.manage')` |
| **M3 Employees** | Employee Directory Listing | `employee.view` | VIS (all) | VIS (all) | VIS (dept) | VIS (own) | VIS (all) | `checkPermission('employee.view')` |
| **M3 Employees** | Add New Employee | `employee.create` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('employee.create')` |
| **M3 Employees** | Edit Employee Profile | `employee.edit` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('employee.edit')` |
| **M3 Employees** | Deactivate / Delete Staff | `employee.delete` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('employee.delete')` |
| **M3 Employees** | View Financials / Salary Tab | `payroll.view` | VIS (all) | VIS (all) | HIDDEN | VIS (own) | VIS (all) | `checkPermission('payroll.view')` |
| **M4 Designations** | Manage Titles & Grades | `org.manage` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('org.manage')` |

---

### Time, Attendance & Leave Management

| Module | Feature / Action | Required Action | Super Admin | HR Manager | Dept Manager | Employee | View-Only Role | Backend Enforcement |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **M5 Attendance** | Punch In / Punch Out | `attendance.mark` | VIS (all) | VIS (own) | VIS (own) | VIS (own) | HIDDEN | `checkPermission('attendance.mark')` |
| **M5 Attendance** | Request Attendance Correction | `attendance.request` | VIS (all) | VIS (own) | VIS (own) | VIS (own) | HIDDEN | `checkPermission('attendance.request')` |
| **M5 Attendance** | Approve Attendance Adjustments | `attendance.approve`| VIS (all) | VIS (all) | VIS (dept) | HIDDEN | HIDDEN | `checkPermission('attendance.approve')`|
| **M5 Attendance** | Lock / Unlock Monthly Timesheet| `attendance.lock` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('attendance.lock')` |
| **M6 Leaves** | Apply for Leave / Time-off | `leave.apply` | VIS (all) | VIS (own) | VIS (own) | VIS (own) | HIDDEN | `checkPermission('leave.apply')` |
| **M6 Leaves** | Approve / Reject Leave Request | `leave.approve` | VIS (all) | VIS (all) | VIS (dept) | HIDDEN | HIDDEN | `checkPermission('leave.approve')` |
| **M6 Leaves** | Configure Quotas & Policies | `leave.settings` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('leave.settings')` |
| **M6 Leaves** | Request Year-End Encashment | `leave.encash` | VIS (all) | VIS (own) | VIS (own) | VIS (own) | HIDDEN | `checkPermission('leave.encash')` |
| **M6 Leaves** | Settle / Approve Encashment | `leave.settings` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('leave.settings')` |
| **M7 Shifts** | Assign Shifts & Rosters | `shift.manage` | VIS (all) | VIS (all) | VIS (dept) | HIDDEN | HIDDEN | `checkPermission('shift.manage')` |

---

### Payroll, Finance & Expense Claims

| Module | Feature / Action | Required Action | Super Admin | HR Manager | Dept Manager | Employee | View-Only Role | Backend Enforcement |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **M9 Payroll** | Generate Monthly Payroll Run | `payroll.run` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('payroll.run')` |
| **M9 Payroll** | Approve & Freeze Payroll Run | `payroll.approve`| VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('payroll.approve')`|
| **M9 Payroll** | Mark Run Disbursed (Paid) | `payroll.approve`| VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('payroll.approve')`|
| **M9 Payroll** | Export Bank Advice File | `payroll.export` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('payroll.export')` |
| **M9 Payroll** | Line-Item Payslip Adjustment | `payroll.manage` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('payroll.manage')` |
| **M9 Payroll** | Assign / Revise Salary Structure | `payroll.manage` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('payroll.manage')` |
| **M9 Payroll** | View Personal Payslip | `payroll.view` | VIS (all) | VIS (own) | VIS (own) | VIS (own) | VIS (all) | `checkPermission('payroll.view')` |
| **M10 Loans** | Apply for Salary Advance/Loan | `loan.create` | VIS (all) | VIS (own) | VIS (own) | VIS (own) | HIDDEN | `checkPermission('loan.create')` |
| **M10 Loans** | Recommend Loan (Dept Tier) | `loan.recommend` | VIS (all) | VIS (all) | VIS (dept) | HIDDEN | HIDDEN | `checkPermission('loan.recommend')` |
| **M10 Loans** | Approve / Reject Loan | `loan.approve` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('loan.approve')` |
| **M10 Loans** | Record Early Prepayment / Foreclose | `loan.prepay` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('loan.prepay')` |
| **M11 Expenses** | Submit New Expense Claim | `expense.create` | VIS (all) | VIS (own) | VIS (own) | VIS (own) | HIDDEN | `checkPermission('expense.create')` |
| **M11 Expenses** | Approve / Reject Claim | `expense.approve`| VIS (all) | VIS (all) | VIS (dept) | HIDDEN | HIDDEN | `checkPermission('expense.approve')`|
| **M11 Expenses** | Disburse Reimbursement | `expense.reimburse`| VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('expense.reimburse')`|
| **M11 Expenses** | Add/Edit Expense Categories | `expense.settings`| VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('expense.settings')`|

---

### Talent Acquisition, Performance & Corporate Assets

| Module | Feature / Action | Required Action | Super Admin | HR Manager | Dept Manager | Employee | View-Only Role | Backend Enforcement |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **M15 ATS** | Create Job Requisition | `recruitment.requisition.create` | VIS (all) | VIS (all) | VIS (dept) | HIDDEN | HIDDEN | `checkPermission('recruitment.requisition.create')` |
| **M15 ATS** | Post / Publish Opening | `recruitment.job.manage` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('recruitment.job.manage')` |
| **M15 ATS** | Advance Candidate / Stage Move | `recruitment.candidate.stage` | VIS (all) | VIS (all) | VIS (dept) | HIDDEN | HIDDEN | `checkPermission('recruitment.candidate.stage')` |
| **M15 ATS** | Schedule Interview Round | `recruitment.interview.manage` | VIS (all) | VIS (all) | VIS (dept) | HIDDEN | HIDDEN | `checkPermission('recruitment.interview.manage')` |
| **M15 ATS** | Submit Interview Evaluation | `recruitment.interview.evaluate` | VIS (all) | VIS (all) | VIS (all) | VIS (assigned)| HIDDEN | `checkPermission('recruitment.interview.evaluate')` |
| **M15 ATS** | Convert Candidate to Staff (Hire) | `recruitment.hire` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('recruitment.hire')` |
| **M14 Reviews** | Create Performance Cycle | `performance.cycle.manage` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('performance.cycle.manage')` |
| **M14 Reviews** | Submit Self-Appraisal | `performance.review.submit` | VIS (all) | VIS (own) | VIS (own) | VIS (own) | HIDDEN | `checkPermission('performance.review.submit')` |
| **M14 Reviews** | Finalize & Calibrate Ratings | `performance.review.finalize` | VIS (all) | VIS (all) | VIS (dept) | HIDDEN | HIDDEN | `checkPermission('performance.review.finalize')` |
| **M13 Assets** | Register New Hardware Asset | `asset.create` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('asset.create')` |
| **M13 Assets** | Assign / Return Asset | `asset.assign` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('asset.assign')` |
| **M13 Assets** | Mark Under Repair / Dispose | `asset.manage` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('asset.manage')` |

---

### Governance, Communication & System Settings

| Module | Feature / Action | Required Action | Super Admin | HR Manager | Dept Manager | Employee | View-Only Role | Backend Enforcement |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **M8 Notices** | Create Announcement | `announcement.create` | VIS (all) | VIS (all) | VIS (dept) | HIDDEN | HIDDEN | `checkPermission('announcement.create')` |
| **M8 Notices** | Pin Announcement to Noticeboard | `announcement.pin` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('announcement.pin')` |
| **M8 Notices** | Edit / Delete Announcement | `announcement.edit` / `delete` | VIS (all) | VIS (all) | VIS (own) | HIDDEN | HIDDEN | `checkPermission('announcement.edit')` |
| **M19 Policies**| Create / Publish Policy | `policy.create` / `publish` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('policy.create')` |
| **M19 Policies**| Acknowledge Mandatory Policy | `policy.acknowledge` | VIS (all) | VIS (own) | VIS (own) | VIS (own) | HIDDEN | `checkPermission('policy.acknowledge')` |
| **M21 Feedback**| File Anonymous Grievance | `feedback.submit` | VIS (all) | VIS (all) | VIS (all) | VIS (all) | HIDDEN | `checkPermission('feedback.submit')` |
| **M21 Feedback**| Triage & Status Update | `feedback.manage` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('feedback.manage')` |
| **M21 Feedback**| Escalate to Executive Board | `feedback.escalate` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('feedback.escalate')` |
| **M26 Roles** | Create / Edit / Clone Custom Role | `role.manage` | VIS (all) | HIDDEN | HIDDEN | HIDDEN | HIDDEN | `checkPermission('role.manage')` |
| **M26 Roles** | Assign Roles to Users | `role.assign` | VIS (all) | VIS (all) | HIDDEN | HIDDEN | HIDDEN | `checkPermission('role.assign')` |
| **M2 Settings** | Edit Company Identity & Slabs | `settings.manage` | VIS (all) | HIDDEN | HIDDEN | HIDDEN | HIDDEN | `checkPermission('settings.manage')` |

---

## 3. Real-Time Dynamic Revocation Sync Architecture

To ensure immediate revocation propagation without requiring manual user logout:
1. **Tag Invalidation**: Any mutation modifying permissions (`updateRole`, `assignUserRoles`, `createDelegation`, `revokeDelegation`) invalidates the RTK Query cache tag `'Auth'`.
2. **Background Rehydration**: `App.jsx` mounts `useGetMeQuery(undefined, { skip: !isAuthenticated })`. When the tag is invalidated, RTK Query immediately executes a background `GET /api/v1/auth/me`.
3. **State Re-compilation**: `authApi.js` `getMe` query triggers `onQueryStarted`, dispatching `updateUser(payload)` into `authSlice`.
4. **CASL Ability Update**: `authSlice` synchronously updates `state.permissions` and `state.user.effectivePermissions`. The CASL `ability` instance automatically rebuilds via `buildAbilityFromRules`.
5. **DOM Mutation**: All `<Can />` components and `usePermission().can` consumers evaluate against the freshly rehydrated ability. Revoked elements disappear instantly from the DOM.
