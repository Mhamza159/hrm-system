# Phase 16: Feedback & Grievance Module – Context & Decision Record

## 1. Context & Business Intent
The Feedback & Grievance Module is an essential corporate governance component in enterprise HRM. It ensures:
- Employees have a trusted whistleblowing and suggestion system without fear of retaliation.
- Anonymous submissions cannot be reverse-engineered or traced back to user accounts.
- Supervisors and Department Managers are strictly barred from grievance administration to avoid conflicts of interest.
- Sexual harassment cases are quarantined under legal statutory mandates (Pakistan Protection Against Harassment at the Workplace Act) and accessible exclusively to the Inquiry Committee and Super Admin.

---

## 2. Locked Technical & Architectural Decisions

### Decision 1: Strict PBAC & Isolation Enforcement
- **Submit Feedback**: Gated by `feedback.submit`.
- **Track Case**: Publicly available at `/feedback/track` with rate limiting, and authenticated in portal.
- **Grievance Admin**: Gated by `feedback.manage` (`hrOnly: true`). Backend automatically filters out Harassment complaints and throws 403 Forbidden for Department Managers.
- **Inquiry Committee**: Gated by `grievance.committee` (Inquiry Committee members and Super Admin only). Exclusively manages Harassment dockets.
- **Escalation**: Gated by `feedback.escalate`. Allows HR to elevate cases to Super Admin.

### Decision 2: Forest & Emerald Design Archetype with Quarantined Security Accents
- Normal grievance & feedback interfaces will strictly use the Forest & Emerald Enterprise theme:
  - Canvas: `#F8FAFC` (light) / `#061A14` (dark forest)
  - Surface: `#FFFFFF` (light) / `#111D17` (dark surface)
  - Borders: `#EAECF0` (light) / `#1A3125` (dark border)
  - Accent: `#00C471` (Emerald) with hover `#00E584`
- The Inquiry Committee portal (`CommitteeDashboardPage.jsx`) maintains the dark forest frame but incorporates high-clearance crimson accents (`#E11D48` / `#4C0519`) to visually signal quarantined statutory legal proceedings.

### Decision 3: Submodule Decomposition (4 Wave-Ordered Plans)
- **Plan 16-01**: **Submit Feedback Submodule Audit & UI Redesign** (`SubmitFeedbackPage.jsx`, category cards, anonymous toggle, tracking code generation & modern success dialog).
- **Plan 16-02**: **Track Case Submodule Audit & UI Redesign** (`TrackFeedbackPage.jsx`, dual tabs: code lookup & "My Submissions" list, 4-stage visual timeline, public case notes).
- **Plan 16-03**: **Grievance Admin Submodule & Management Drawer** (`GrievanceAdminPage.jsx`, `CaseDetailsDrawer.jsx`, `StatusChangeModal.jsx`, `EscalateModal.jsx`, PBAC isolation, KPI cards, table filters).
- **Plan 16-04**: **Inquiry Committee Submodule & Module Verification Gate** (`CommitteeDashboardPage.jsx`, harassment quarantine enforcement, investigation docket, Oxlint clean, 0 `prop-types`, Vite production build).

### Decision 4: Ponytail Code Optimization Standard
- Shortest working diff wins.
- Zero unnecessary abstractions or duplicate components.
- Zero `prop-types` imports.
- Native tabular numerals (`font-mono tabular-nums`) for tracking codes, counts, and dates.

---

## 3. Scope Fences
- **IN SCOPE**:
  - Full UI overhaul of all 4 submodules and their drawers/modals.
  - PBAC enforcement across all action buttons, forms, and views.
  - Adding "My Submissions" tab to `TrackFeedbackPage.jsx` using existing `useGetMyFeedbackSubmissionsQuery`.
  - Secure HTTPS attachment link presentation and file preview.
  - Oxlint verification and clean Vite production build.
- **OUT OF SCOPE**:
  - Altering backend database models or route URLs (full backward compatibility is maintained).
  - External file storage provider re-architecture (Multer/Cloudinary remains untouched).
