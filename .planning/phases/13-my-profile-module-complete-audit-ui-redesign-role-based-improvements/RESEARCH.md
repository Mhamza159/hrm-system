# Phase 13 Research: My Profile Module Audit & Architecture Analysis

## 1. Existing Codebase Audit

### A. Current File Analysis: `frontend/src/features/employees/pages/MyProfilePage.jsx`
- **Total Lines**: 1,782 lines.
- **Architectural Flaw**: Monolithic duplication across 4 role branches:
  - Lines 265–632: Super Admin view (~367 lines).
  - Lines 637–1052: HR Manager view (~415 lines).
  - Lines 1053–1445: Department Manager view (~392 lines).
  - Lines 1446–1782: Regular Employee view (~336 lines).
- **Duplicated Logic in Each Branch**:
  - Avatar file input, file validation (3MB limit, JPG/PNG/WEBP), and upload mutation handler.
  - TwoFactorModal and ChangePasswordModal mountings.
  - Card container wrappers and styling.
  - Redundant user/initials derivation.
  - Fragmented styling: Super Admin uses `#061A14`, HR Manager uses `indigo-500`/`indigo-700` (breaks Forest & Emerald brand guidelines), Department Manager uses `teal-500`, and Employee uses generic `slate-900`/`emerald-100`.
- **Technical & Security Leaks**:
  - Internal database jargon is exposed directly in the UI:
    - `"CASL Policy Boundary: Unrestricted System Override"`
    - `"Authentication Protocol: Encrypted JWT + Salted Bcrypt"`
    - `"PBAC Password Governance: Master Authority (manage: all)"`
    - `"Hierarchy Level: Apex (Level 0)"`
  - These technical implementation details must be replaced with professional enterprise copy (e.g. "Access Level: Global Platform Administrator", "Authentication: Multi-Factor Protected", "Scope: Enterprise-Wide Governance").

---

## 2. API & Data Flow Audit

### A. Query Endpoint: `GET /api/v1/employees/me`
- Controller: `employeeController.getMyProfile`
- Service: `employeeService.getMyProfile(req.user._id)`
- Populated fields:
  - `departmentId`: `name code headId`
  - `designationId`: `title code grade`
  - `shiftId`: `name code startTime endTime graceMinutes type`
  - `managerId`: `name employeeCode email phone`
  - `userId`: `email isActive lastLoginAt twoFactorEnabled avatar`
- Model attributes (decrypted where necessary):
  - `name`, `employeeCode`, `email`, `phone`, `cnic`, `dob`, `gender`
  - `address`: `street`, `city`, `state`, `postalCode`, `country`
  - `emergencyContact`: `name`, `relationship`, `phone`
  - `employmentType`, `status`, `joiningDate`, `probationEndDate`
  - `bankDetails`: `bankName`, `accountTitle`, `accountNumber`, `iban`
  - `skills`: array of string competency tags

### B. Mutation Endpoints:
1. `PATCH /api/v1/employees/me/avatar`:
   - Handles profile photo uploads via `avatarUpload` multer memory storage (JPEG, PNG, WEBP, max 3MB).
   - Invalides `Employee` tag and updates user avatar in Redux auth slice.
2. `PATCH /api/v1/employees/me/skills`:
   - Updates `skills` array via `useUpdateSkillsMutation`.
   - Validated against schema.
3. `POST /api/v1/employees/me/change-request`:
   - Submits formal change request for protected fields (`bankDetails`, `address`, `emergencyContact`).
   - Inserts into `ProfileChangeRequest` collection with status `pending`.
   - Handled by `ChangeRequestModal.jsx`.
4. `POST /api/v1/auth/change-password` & `POST /api/v1/auth/2fa/*`:
   - Standard account credential & 2FA management via `ChangePasswordModal.jsx` and `TwoFactorModal.jsx`.

---

## 3. Sub-Component Modularization Plan

To strictly adhere to Ponytail principles (maintainable, DRY, small diffs, single-responsibility components), we decompose `MyProfilePage.jsx` into the following sub-components located in `frontend/src/features/employees/components/profile/`:

1. **`ProfileHeader.jsx`**:
   - Master profile hero banner.
   - Houses the avatar upload trigger, visual status badge, role badge, employee code, name, and core contact coordinates.
   - Action slot for role-specific primary actions (e.g., "Request Change", "Edit Profile", or "Refresh").
2. **`PersonalInfoCard.jsx`**:
   - Clean display of personal details: Full Name, Email, Phone, Masked CNIC, Date of Birth, Gender, and Residential Address (where applicable).
3. **`EmploymentDetailsCard.jsx`**:
   - Role-specific employment metadata: Designation, Department, Reporting Manager, Employment Type, Status, Joining Date, and Shift Timings.
4. **`AccountSecurityCard.jsx`**:
   - Security credentials, Password change modal trigger, Two-Factor Authentication status indicator and management button, and recent login history link.
5. **`SkillsQualificationsCard.jsx`**:
   - Interactive competency taxonomy tags with inline add/remove functionality powered by `useUpdateSkillsMutation`.
6. **`PayrollBankCard.jsx`**:
   - Displays payroll bank coordinates (Bank Name, Account Title, Account Number, IBAN) and emergency contact with explicit notice that modifications require a Change Request.
7. **`RoleGovernanceCard.jsx`**:
   - Contextual navigation hub tailoring shortcuts and governance scope to the authenticated persona (Super Admin admin console, HR Manager workforce hub, Department Manager team/delegations, Employee quick links).

---

## 4. Verification & Testing Strategy
1. **Backend E2E Tests**:
   - `npm --prefix backend test -- tests/m3.employees.e2e.test.js`
   - Validates that Flow 1 (Super Admin), Flow 2 (HR Manager), Flow 3 (Dept Manager), and Flow 4 (Employee Self-Service) continue to pass 100%.
2. **Frontend Linter & Typechecks**:
   - Run `oxlint` across all newly created and modified files to guarantee 0 errors and 0 warnings.
3. **Production Build**:
   - Run `npm --prefix frontend run build` to verify zero syntax errors or dead bundle imports.
