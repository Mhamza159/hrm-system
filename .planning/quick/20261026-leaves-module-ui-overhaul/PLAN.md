# Quick Plan: Leaves Module Complete UI/UX Overhaul & Enterprise RBAC/PBAC Alignment

## Problem Statement
The Leaves module (`MyLeavesPage`, `LeaveApprovalsPage`, `TeamLeaveCalendarPage`, `EncashmentPage`, `LeaveTypesPage`, `HolidaysPage`, and corresponding modals) suffered from disjointed AI-generated aesthetics:
1. Hardcoded dark background blocks (`#0F111A`, `#1E2235`, `#5E6AD2`) inside light mode, creating jarring black boxes.
2. Super Admin saw low-contrast, washed out green banners (`text-slate-300`) and an empty "No Leave Quotas Allocated" state placeholder instead of an Executive Leave Command Center.
3. RBAC/PBAC disconnect: Super Admin has sovereign exemption and governance authority over approvals and policies, but was treated as an unallocated employee without action links.

## User Intent & Requirements
- Update UI completely for all roles (Super Admin, Manager, HR Manager, Employee) across the dashboard and leaves module.
- Adhere strictly to the ELVARA Enterprise Emerald & Slate design system (`ui-ux-pro-max`).
- Remove all AI-generated generic patterns, ensure high contrast (WCAG AA), theme-aware light/dark support.
- Fully respect RBAC & PBAC policies.

## Implementation Tasks
- [x] **Super Admin Experience in `MyLeavesPage.jsx`**:
  - Replace sad empty quota box with an **Executive Governance Command Center**.
  - High-contrast privilege card with quick links (`Manage Approvals`, `View Calendar`).
  - 4 Real-time KPI stat cards (Pending Requests, Active Categories, Next Gazetted Holiday, 100% Policy Retained).
  - Real-time Company-Wide Pending Leaves Queue with inline decision actions for Super Admin.
- [x] **Manager & HR Experience in `MyLeavesPage.jsx`**:
  - Personal leave quotas + active alert banner for subordinates' pending approvals with 1-click navigation.
- [x] **Employee Experience in `MyLeavesPage.jsx`**:
  - Modern emerald balance progress cards with stacked days visualization and quick leave application.
- [x] **Modals Theme Overhaul**:
  - `ApplyLeaveModal.jsx`, `LeaveDecideModal.jsx`, `ExportLeaveModal.jsx`.
  - Replaced all hardcoded hex styles with responsive light/dark classes.
- [x] **Approvals, Calendar & Encashment Overhaul**:
  - `LeaveApprovalsPage.jsx`, `TeamLeaveCalendarPage.jsx`, `EncashmentPage.jsx`, `LeaveTypesPage.jsx`, `HolidaysPage.jsx`.
  - Removed `#0F111A`, `#1E2235`, `#5E6AD2` in favor of `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800`.
- [x] **Verification**:
  - `npm run build` in frontend passed (0 errors, 14.45s).
  - `npm test -- tests/leave.apply.test.js tests/attendance.api.test.js` in backend passed (19/19 tests green).
