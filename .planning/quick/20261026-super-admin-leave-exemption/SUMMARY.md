# GSD Quick Summary: Super Admin Leave & Attendance Exemption

**Task Identifier:** `20261026-super-admin-leave-exemption`  
**Date:** 2026-10-26  
**Scope:** Core Architecture Exemption for Super Admin / Executive Owner role across Module M5 (Attendance & Shifts) and Module M6 (Leaves & Holidays).  
**Status:** Completed, Verified & 100% Tests Passing

---

## 1. Problem & Core Intent
The user raised an architectural question:
> *"Kya super admin ko leave ki zrurt he? super admin tu owner he so i think usko leave apply krne ki zrurt nai he"*

Through the `/interview-me` framework, we extracted and confirmed the intent:
- Super Admin (Owner / CEO) has no higher manager to approve time-off, nor is their compensation bound to annual leave balance deductions.
- The nightly auto-absent sweep (`autoAbsent.job.js`) should never penalize or mark the Owner as 'Absent'.
- The self-service portal should clearly reflect their executive privilege while leaving full managerial authority intact over company leaves.

---

## 2. Technical Implementation

### A. Automated Absenteeism Exemption (`backend/src/modules/attendance/jobs/autoAbsent.job.js`)
- Pre-queries `Role.findOne({ name: 'Super Admin' })`.
- Populates `userId` with `roleId` in the employee sweep query.
- Skips any employee whose user role is `Super Admin` or employee code is `EMP-000` (`skipped++`).
- Guarantees zero 'absent' attendance records are generated for Super Admin.

### B. Leave Application Guard (`backend/src/modules/leaves/leave.service.js`)
- In `applyLeave(employeeId, data, actor)`:
  - Detects if applicant is `Super Admin` or `EMP-000`.
  - Rejects submission with 400 Bad Request:
    `"Super Admin / Business Owner is exempt from annual leave quota balances and managerial approval chains."`

### C. Frontend Portal Experience (`MyLeavesPage.jsx` & `ApplyLeaveModal.jsx`)
- **`MyLeavesPage.jsx`**:
  - Detects `isSuperAdmin` via `usePermission()`.
  - Renders an **Executive Authority Exemption Notice**:
    > *"As the primary enterprise authority, your profile is completely exempt from mandatory annual leave quotas, managerial approval chains, and automated absenteeism deductions. You hold full authority to review, approve, and manage team leaves across the organization."*
  - Replaces the clickable "Apply for Leave" button with an **"Exempt from Leave Quotas"** emerald badge for Super Admin.
  - Adds direct navigation links to **Manage Team Leave Approvals** and **Organization Calendar**.
- **`ApplyLeaveModal.jsx`**:
  - Displays a clean executive policy state if opened, preventing form submission for Super Admin.

---

## 3. Verification & Test Evidence
- **Backend Test Suite:**
  - `npm test -- tests/leave.apply.test.js`
  - **6 / 6 tests passed (100%)** including new test:
    `✓ 6. Super Admin / Executive Owner is exempt from leave applications with 400 informative guard`
  - `npm test -- tests/attendance.api.test.js tests/attendance.security.test.js`
  - **25 / 25 tests passed (100%)**
- **Frontend Build:**
  - `npm run build` in `frontend/` passed in 12.71s with zero errors (code 0).
