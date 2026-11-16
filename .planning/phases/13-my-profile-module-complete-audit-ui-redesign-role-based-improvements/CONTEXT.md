# Phase 13 Context: My Profile Module – Complete Audit, UI Redesign & Role-Based Improvements

## Module Overview
The **My Profile Module (Self-Service & Identity Governance in M1/M3)** provides authenticated users across all enterprise roles with an authoritative view of their identity, organizational assignment, security credentials, and self-service capabilities.

In this phase, we conduct a comprehensive audit across all four enterprise roles:
1. **Super Admin**: Supreme platform owner / system administrator. Focuses on identity, root access security, session monitoring, 2FA enforcement, and administrative hub shortcuts (users, roles, departments, designations, settings). Does not display irrelevant employee operational fields (e.g. probation end dates, shift rosters, line managers).
2. **HR Manager**: Enterprise people operations lead. Focuses on workforce governance context, organizational details, personal contact details, security credentials, and people operations quick links (directory, profile change requests, onboarding, offboarding, shifts).
3. **Department Manager**: Departmental leadership. Focuses on department attribution, team oversight scope, direct manager reporting, peer approval delegation quick access, and account security.
4. **Regular Employee**: Comprehensive self-service employee portal. Displays personal contact info, organizational assignment, assigned shift timing & grace minutes, residential address, emergency contact, self-service skills taxonomy tags, password management, 2FA toggle, and profile change requests for protected fields (bank details, address, emergency contact).

---

## Design System & Theme Alignment
- **Theme Archetype**: Forest & Emerald Enterprise Craft (matching `DESIGN.md` & `docs/UI-REFERENCE.md`).
- **Dark Surface**: `#111D17`
- **Dark Border**: `#1A3125`
- **Subtle Surface / Hover**: `#162820`
- **Primary Accent**: `#00C471` (Emerald)
- **Secondary Accent**: `#047857` (Deep Emerald)
- **Text**: `slate-900` (light) / `white` (dark), `slate-500` / `slate-400` (secondary/muted).
- **Strict Rule**: Zero legacy `indigo-*` classes. Eliminate technical database leaks ("CASL Policy Boundary", "Encrypted JWT + Salted Bcrypt", "Apex Level 0").

---

## Role-Wise Field & Section Comparison Audit

| Section / Field | Super Admin | HR Manager | Department Manager | Regular Employee | Rationale / PBAC Policy |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Hero Banner** | | | | | |
| Avatar & Upload Button | Yes | Yes | Yes | Yes | Self-service avatar mutation (`useUploadAvatarMutation`) |
| Name & Code | Yes (EMP-000) | Yes | Yes | Yes | Authoritative DB identifier |
| Role & Status Pill | Yes (System Owner) | Yes (HR Executive) | Yes (Dept Lead) | Yes (Active) | High-contrast semantic role badge |
| Masked CNIC / Email / Phone | Yes | Yes | Yes | Yes | Masked CNIC, contact credentials |
| **Personal Information** | | | | | |
| Email / Phone | Yes | Yes | Yes | Yes | Essential contact coordinates |
| Date of Birth / Gender | Optional/Hidden | Yes | Yes | Yes | HR workforce records |
| Residential Address | Hidden | Optional | Yes | Yes | Protected; Employee submits change request |
| Emergency Contact | Hidden | Yes | Yes | Yes | Protected; Employee submits change request |
| **Employment Details** | | | | | |
| Department & Designation | Platform Owner | People Operations | Assigned Unit | Assigned Unit | Context-relevant job metadata |
| Reporting Manager | None (Apex) | Executive / MD | Executive / MD | Assigned Manager | Hierarchy clarity |
| Employment Type & Joining Date | Enterprise Founder | Permanent | Permanent | Assigned Type | Employment contract terms |
| Assigned Shift & Timings | Hidden | Optional/Standard | General Shift | Specific Shift | Operational time tracking |
| **Account & Security** | | | | | |
| Password Change | Yes | Yes | Yes | Yes | `ChangePasswordModal` |
| Two-Factor Authentication (2FA) | Yes | Yes | Yes | Yes | `TwoFactorModal` (active status + toggle) |
| Session & Login History | Yes | Yes | Yes | Yes | Link to `/login-history` |
| **Skills & Competencies** | | | | | |
| Skills Taxonomy Tags | Hidden | Yes | Yes | Yes | Self-service add/remove tags (`updateSkills`) |
| **Financial / Bank Details** | | | | | |
| Bank Name, Account, IBAN | Hidden | Self Record | Self Record | Self Record | Encrypted IBAN; requires Change Request |
| **Role-Specific Governance Hub** | | | | | |
| Administrative Hub Shortcuts | Yes (`/users`, `/roles`, etc.) | Hidden | Hidden | Hidden | Fast access to admin consoles |
| People Operations Hub | Hidden | Yes (`/employees`, `/change-requests`, etc.) | Hidden | Hidden | Fast access to HR workflows |
| Team Leadership & Delegation | Hidden | Hidden | Yes (`/delegations`, etc.) | Hidden | Departmental governance |
| Employee Self-Service Shortcuts | Hidden | Hidden | Hidden | Yes (`/org-chart`, `/policies`) | Essential employee links |

---

## Architecture Refactoring Strategy
- **Current Issue**: Single 1,782-line monolithic file with four bloated, nearly identical branches.
- **Solution**: Decompose into modular, clean, reusable sub-components in `frontend/src/features/employees/components/profile/`:
  1. `ProfileHeader.jsx`
  2. `PersonalInfoCard.jsx`
  3. `EmploymentDetailsCard.jsx`
  4. `AccountSecurityCard.jsx`
  5. `SkillsQualificationsCard.jsx`
  6. `PayrollBankCard.jsx`
  7. `RoleGovernanceCard.jsx`
- Re-architect `MyProfilePage.jsx` into a concise, maintainable, single orchestrator (~250-300 lines) that dynamically renders the appropriate cards based on the authenticated user's role and capabilities.
