# Phase 14 Context: Employees Module – Complete Audit, UI Redesign & Improvements

## Module Overview
The **Employees Module (Module M3)** is the central workforce registry and organizational backbone of the ELVARA HRM enterprise application. It governs:
1. **Employee Directory**: Enterprise-wide staff directory with advanced faceted filtering, status buckets (Active, Inactive, Archived), dual viewing modes (Table View and Card Grid View), and Excel exports.
2. **Employee Details & Profile Sheet**: Comprehensive 10-section inspection sheet (`EmployeeDetailModal.jsx` and `EmployeeProfilePage.jsx`) covering overview, personal info, employment details, reporting hierarchy, contact details, document vault, career history, payroll coordinates, and account credentials.
3. **Employee Onboarding & Editing Wizard**: 5-step responsive creation and editing wizard (`EmployeeFormPage.jsx`) covering personal details, contact/emergency info, job assignment, banking coordinates, and login account provisioning.
4. **Lifecycle & Status Governance**: State machine transitions (`Active`, `Probation`, `Notice`, `Resigned`, `Terminated`, `Suspended`) via `StatusChangeModal.jsx` with mandatory transition justification.
5. **Archive & Dependency-Safe Deletion**: Soft-deletion archive bucket with one-click restore and dependency-guarded permanent deletion (`assertEmployeeAssetClearance`).
6. **Bulk Excel Ingestion**: Multi-row spreadsheet upload (`EmployeeImportPage.jsx`) with pre-validation and row-by-row error reporting.
7. **Sensitive Profile Change Requests**: HR review console (`ChangeRequestsPage.jsx`) for approving or rejecting employee-submitted bank and address modifications.

---

## PBAC & RBAC Access Matrix

| Role | Directory Access (`employee.view`) | Onboard / Create (`employee.create`) | Edit Details (`employee.edit`) | Status Change (`employee.edit`) | Archive / Restore (`employee.delete`) | Financials / Salary (`employee.salary.view`) | Export Directory (`report.export`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | Full Company (`all`) | Yes | Yes | Yes | Yes (Archive, Restore, Permanent Delete) | Unmasked Full View | Yes |
| **HR Manager** | Full Company (`all`) | Yes | Yes | Yes | Yes (Archive & Restore) | Unmasked Full View | Yes |
| **Department Manager** | Team Scoped (`team`) | **NO** (Button Hidden) | **NO** (Button Hidden) | **NO** (Button Hidden) | **NO** (Button Hidden) | **NO** (Masked CNIC & Hidden Salary) | Only if explicitly scoped |
| **Regular Employee** | Self Profile (`own`) | **NO** (Button Hidden) | **NO** (Button Hidden) | **NO** (Button Hidden) | **NO** (Button Hidden) | Self Only (`own`) | **NO** (Button Hidden) |

### Strict Visibility & Enforcement Rules:
- If a user lacks a permission, the corresponding action button, menu item, or navigation link **must not appear** in the UI.
- Department Managers only view subordinates reporting directly to them or their department (`scope: team`).
- Sensitive financial coordinates (unmasked CNIC, IBAN, base salary) are strictly masked unless the actor possesses `employee.salary.view` or is inspecting their own record.
- Super Admin accounts (`EMP-000`, `admin@hrm.company.pk`, `mhamzaofficial159@gmail.com`) are hard-coded against deletion, status changes, or unauthorized edits by lower roles.

---

## Design System & Theme Alignment
- **Theme Archetype**: Forest & Emerald Enterprise Craft (`#111D17` dark surface, `#1A3125` dark hairline border, `#00C471` primary emerald accent).
- **Secondary Palette**: `#047857` deep emerald, `#162820` hover/card surface, `#0A110D` dark inputs.
- **Status Pills**:
  - `Active` / `Confirmed`: Emerald (`bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60`).
  - `Probation`: Sky (`bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/40`).
  - `Notice`: Amber (`bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40`).
  - `Terminated` / `Suspended`: Rose (`bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40`).
  - `Resigned`: Slate (`bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700`).
- **Typography & Layout**: Inter font family, monospaced tabular numbers for employee codes, CNICs, phone numbers, and dates. 1px hairline borders throughout.

---

## Cross-Module Integration Contracts
1. **Recruitment & ATS (M15) $\rightarrow$ Employee (M3)**:
   - When candidate is marked as `Hired` in ATS, `createEmployee` is automatically called, minting the next employee code (`/api/v1/employees/next-code`) and initiating onboarding.
2. **Employee (M3) $\rightarrow$ User Management (M1)**:
   - Creating an employee with `createAccount: true` provisions a linked `User` record with role assignment and auto-generates credentials.
   - Archiving, terminating, or suspending an employee immediately deactivates `User.isActive = false` and clears active refresh tokens.
3. **Employee (M3) $\rightarrow$ Lifecycle (M18)**:
   - Resignation approvals transition Employee status to `Notice`. Last working day trigger transitions status to `Resigned`.
4. **Employee (M3) $\rightarrow$ Assets (M23)**:
   - `deleteEmployee` and `permanentDeleteEmployee` validate `assertEmployeeAssetClearance(id)`: Deletion is blocked if company equipment is currently checked out to the employee.
5. **Employee (M3) $\rightarrow$ Payroll (M9)**:
   - Salary structures, monthly payroll runs, and tax deductions bind directly to `employeeId`.
