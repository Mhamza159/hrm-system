# GSD Plan: Super Admin Leave & Attendance Exemption

**Goal:** Formally exempt the Super Admin (Business Owner / CEO) from employee leave applications, quota balance restrictions, and automated absenteeism penalties while preserving full managerial authority over team leaves.

---

## 1. Context & Rationale
- **Problem:** The Super Admin role represents the company owner / executive authority. Owner has no higher manager to approve leaves, nor is their salary or compensation bound to annual leave quota deduction calculations.
- Having a Super Admin apply for leave triggers an approval chain looking for a non-existent manager.
- If the Super Admin doesn't punch biometric/web attendance on any day, the nightly `autoAbsent.job.js` sweep could erroneously mark the owner as "Absent".
- **Solution:** Implement a clean, root-cause exemption across backend services, cron jobs, and frontend portal views.

---

## 2. Technical Architecture Blueprint

### A. Backend: Automated Absenteeism Exemption (`autoAbsent.job.js`)
- **File:** `backend/src/modules/attendance/jobs/autoAbsent.job.js`
- **Change:**
  1. At the beginning of `runAutoAbsentSweep`, retrieve the `Super Admin` role ID from `Role.findOne({ name: 'Super Admin' })`.
  2. In the employee sweep loop, populate `userId` (specifically `roleId`).
  3. If `emp.userId?.roleId?.name === 'Super Admin'` or `emp.userId?.roleId?.equals(superAdminRoleId)`, skip immediately (`skipped++`).
  4. Ensure zero 'absent' attendance records are generated for Super Admin.

### B. Backend: Leave Application Guard (`leave.service.js`)
- **File:** `backend/src/modules/leaves/leave.service.js`
- **Change:**
  - In `applyLeave(employeeId, data, actor)`:
    - Check if the applicant or actor is `Super Admin`.
    - If Super Admin attempts to submit a standard leave, return an informative response or guidance that the owner role is exempt from leave quota deductions and approval chains.

### C. Frontend: Portal Self-Service State (`MyLeavesPage.jsx`)
- **File:** `frontend/src/features/leaves/pages/MyLeavesPage.jsx`
- **Change:**
  - Use `usePermission()` / user auth state to detect if user has role `'Super Admin'`.
  - When viewed by a Super Admin:
    - Display an Executive Exemption Banner:
      > **Executive Authority Notice:** As the Super Admin / Business Owner, your profile is exempt from annual leave quota deductions and managerial approvals.
    - Gracefully disable or adjust the "Apply for Leave" action button with an informative badge.
    - Super Admin can still navigate to **Leave Approvals**, **Leave Types**, **Encashment**, and **Team Leave Calendar** to manage company policies.

---

## 3. Verification & Safety Criteria
1. **Cron Job Verification:** Execute `runAutoAbsentSweep` unit/integration test to guarantee Super Admin is skipped.
2. **Standard Roles Intact:** Verify that regular employees, department managers, and HR managers continue to be processed and evaluated against shift schedules and holidays normally.
3. **Frontend Build Check:** Run `npm run build` in `frontend/` to ensure zero compilation or JSX syntax regressions.
4. **Backend Test Suite:** Run `npm test` across attendance and leaves to verify 100% green tests.
