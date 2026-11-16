# Phase 12 Research: Employee Lifecycle Module – Architecture & Audit Findings

## Current State Evaluation

### 1. Frontend Audit (`frontend/src/features/onboarding`)
- **Pages**:
  - `OnboardingPage.jsx`: Displays active onboarding instances in card format. Lacks a detail modal, search by department, or interactive task completion controls. Uses generic `gray-*` classes.
  - `ResignationPage.jsx`: Mixed employee self-service and management review queue. Contains outdated `indigo-*` classes and lacks structured approval tracking, department filtering, and detailed inspection modal.
  - `OffboardingPage.jsx`: Displays exit clearance instances in basic cards. Lacks an asset custody overview drawer/modal (resulting in cryptic 400 errors when assets are unreturned), and lacks final settlement details.
  - `ChecklistTemplatesPage.jsx`: Master template list with basic create/edit modal. Uses `indigo-*` styling, lacks read-only inspection modal, and lacks safe template modification guards.
  - `MyTasksPage.jsx`: Employee task completion list. Needs Forest & Emerald styling alignment.
- **Components**:
  - `ChecklistTemplateModal.jsx`: Only authoring modal. Needs category color coding, role assignees, due offsets, and safe modification warnings.
  - Missing Modals: `OnboardingDetailModal.jsx`, `ResignationDetailModal.jsx`, `ExitClearanceDetailModal.jsx`, and `ChecklistTemplateDetailModal.jsx`.

### 2. Backend Audit (`backend/src/modules/onboarding`)
- **Controllers & Services**:
  - `onboarding.controller.js` & `onboarding.service.js`: Mature implementation covering all 11 features of Module M18 (Rows 18.1 to 18.11).
  - 25/25 automated Vitest E2E tests passing in `backend/tests/m18.onboarding.e2e.test.js`.
- **Cross-Module Integrations Verified**:
  - **M15 Recruitment**: `hireCandidate` in `recruitment.service.js` triggers `createEmployee`, which calls `initOnboardingForEmployee`.
  - **M3 Employee**: Employee model status updates between `Active` $\rightarrow$ `Notice` $\rightarrow$ `Resigned`.
  - **M23 Asset Management**: `signoffDepartmentClearance` in `onboarding.service.js` directly queries `Asset` model to verify `custodian === employeeId` before permitting clearance.
  - **M9 Payroll**: `getEmployeeSettlementSummary` calculates encashment, unpaid leaves, and loan deductions.
  - **M1 Auth**: `runAccountDeactivationJob` in `deactivate.job.js` deactivates `User.isActive = false` at LWD.

---

## Action Plan for Phase 12

### Wave 1: Checklist Templates & Authoring Redesign
- Redesign `ChecklistTemplatesPage.jsx` with tabs (Onboarding vs Offboarding), department filters, search, and active/inactive status pills.
- Create `ChecklistTemplateDetailModal.jsx` for read-only inspection of template rubrics and task criteria.
- Redesign `ChecklistTemplateModal.jsx` with category tags, role assignees, due offset days, and safe template edit callout.

### Wave 2: Employee Onboarding & Lifecycle Progress Redesign
- Redesign `OnboardingPage.jsx` with top telemetry metrics (Active, Completed, In Progress, Overdue Tasks), data table/cards toggle, and search.
- Create `OnboardingDetailModal.jsx` displaying employee profile overview, categorized task list, task completion toggles, and welcome email trigger.
- Redesign `MyTasksPage.jsx` for employee self-service lifecycle task tracking.

### Wave 3: Resignation & Notice Period Management Redesign
- Redesign `ResignationPage.jsx` with clear tabbed separation: "My Resignation" (Self-service with notice period tracker) vs "Management Review Queue" (HR & Manager approvals).
- Create `ResignationDetailModal.jsx` with employee tenure details, official LWD picker, rejection reason field, and confidential exit interview viewer (strictly guarded for HR/Admin).

### Wave 4: Exit Clearance, M23 Asset Lock & Final Settlement Redesign
- Redesign `OffboardingPage.jsx` with clearance telemetry and department sign-off overview.
- Create `ExitClearanceDetailModal.jsx` with 4-department clearance sign-off cards, live M23 asset custody checker (with hardware return blocker), and M9 final settlement preview.
- Run complete cross-module integration tests, frontend build, and code quality audits.
