# Phase 12 Context: Employee Lifecycle Module – Complete UI Redesign, Integration Audit & Improvements

## Module Overview
The **Employee Lifecycle Module (Module M18)** governs the critical transitions in an employee's organizational tenure:
1. **Onboarding**: Automated checklist instantiation upon new hire creation, task assignments across departments (HR, IT, Department, Finance), document collection, and welcome email dispatch.
2. **Resignation**: Employee self-service formal resignation submission, intended vs. official Last Working Day (LWD) management, and multi-tier manager/HR approval workflow.
3. **Exit Clearance**: Cross-departmental sign-offs (IT, Finance, Admin, HR), strict hardware asset custody return locks (Module M23), confidential exit interviews, experience & relieving letter PDF streaming, and final settlement link (Module M9).
4. **Checklist Templates**: Master template authoring for onboarding and offboarding workflows with department scoping, task categories, role assignments, and due day offsets.

---

## Design System & Theme Alignment
- **Theme**: Forest & Emerald Enterprise Craft (matching `docs/design.md` & `docs/UI-REFERENCE.md`).
- **Dark Surface**: `#111D17`
- **Dark Border**: `#1A3125`
- **Subtle Surface / Hover**: `#162820`
- **Primary Accent**: `#00C471` (Emerald)
- **Neutral Text**: `slate-900` (light) / `white` (dark), `slate-500` / `slate-400` (secondary)
- **Status Pills**:
  - `completed` / `accepted` / `cleared`: Emerald (`bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60`)
  - `in_progress` / `under_review`: Sky (`bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/40`)
  - `pending` / `submitted`: Amber (`bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40`)
  - `rejected` / `blocked`: Rose (`bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40`)
- **Strict Rule**: Zero legacy `indigo-*` classes across `frontend/src/features/onboarding/`.

---

## PBAC & RBAC Governance
- **Checklist Templates**: `onboard.view` (listing/inspection), `onboard.manage` (create/update/delete)
- **Onboarding Workflows**: `onboard.view` (view workflows, scoped by department for managers, all for HR/Super Admin), `onboard.manage` (resend welcome email, initialize/manage)
- **Tasks Self-Service**: `onboard.view` with `own` scope (`GET /api/v1/onboarding/tasks/my`, `PATCH /api/v1/onboarding/tasks/:taskId/complete`)
- **Resignation**:
  - Employee: `resignation.submit` (`own` scope for submit, view own)
  - Management / HR: `offboard.manage` (`decideResignation` approve/reject, set official LWD)
- **Exit Clearance**: `offboard.view` (view clearance list), `offboard.manage` (department sign-offs, trigger settlement summary, deactivation)
- **Exit Interview**:
  - Employee submit: `offboard.view` (`own` scope)
  - HR inspection: `offboard.manage` (confidential, blocked for Department Managers)

---

## Cross-Module Integration Contracts
1. **Recruitment & ATS (M15) $\rightarrow$ Employee (M3) $\rightarrow$ Onboarding (M18)**:
   - When candidate is hired via `POST /api/v1/recruitment/candidates/:id/hire`, `employeeService.createEmployee` is called.
   - `createEmployee` invokes `initOnboardingForEmployee({ employee })`.
   - Matching active checklist template for employee's department (or global fallback) is cloned into active `Checklist` instance with tasks assigned to `employee`, `manager`, `it_admin`, and `hr`.
2. **Resignation (M18) $\rightarrow$ Employee (M3) $\rightarrow$ Exit Clearance (M18)**:
   - Resignation approval by Manager/HR transitions Employee status to `Notice` and calls `initOffboardingForEmployee({ employeeId })`.
   - Offboarding creates checklist with tasks across `it`, `finance`, `admin`, and `hr`.
3. **Exit Clearance (M18) $\rightarrow$ Asset Management (M23)**:
   - `signoffDepartmentClearance` for `it` or `admin` validates `Asset.countDocuments({ custodian: employeeId, status: { $in: ['assigned', 'in_use', 'damaged'] } }) === 0`.
   - Clearance is strictly blocked with HTTP 400 if any hardware asset remains unreturned.
4. **Exit Clearance (M18) $\rightarrow$ Payroll (M9)**:
   - `GET /api/v1/offboarding/:id/settlement-summary` aggregates unpaid working days, leave encashment, and outstanding loan balances.
5. **Exit Clearance (M18) $\rightarrow$ Service Letters & Account Deactivation**:
   - `streamServiceLetterPdf` streams official Experience and Relieving Letters only after clearance is 100% completed.
   - Nightly cron (`deactivate.job.js`) switches Employee status to `Resigned` and disables user portal login (`User.isActive = false`) when official LWD arrives.
