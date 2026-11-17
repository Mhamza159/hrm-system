# Phase 16: Feedback & Grievance Module – Research & Technical Audit

## 1. Executive Summary & Audit Scope
The **Feedback & Grievance Module** (Module M21) provides a safe, transparent, and legally compliant channel for employees to voice open suggestions, raise general grievances, and report workplace issues or sexual harassment. It comprises four distinct submodules:
1. **Submit Feedback** (`/feedback/submit`, `SubmitFeedbackPage.jsx`): Multi-category submission interface supporting suggestions, formal grievances, workplace issues, health & safety, and harassment complaints. Features cryptographic anonymity mode where `submittedBy` is strictly wiped (`null`) and unique collision-resistant tracking codes (`TRK-XXXXXX`) are minted.
2. **Track Case** (`/feedback/track`, `TrackFeedbackPage.jsx`): Dual-mode tracking experience allowing anonymous users to lookup their case progress via their tracking code, and authenticated employees to view all their named submissions directly via `GET /feedback/my`. Features visual 4-stage lifecycle timeline and public investigation notes.
3. **Grievance Admin** (`/feedback/admin`, `GrievanceAdminPage.jsx`, `CaseDetailsDrawer.jsx`, `StatusChangeModal.jsx`, `EscalateModal.jsx`): Operational command center for HR Managers and Super Admins. Features KPI cards, segmented status tabs, multifaceted search & filter bar, case assignment, status progression, private/public note appending, and escalation to Super Admin.
4. **Inquiry Committee** (`/feedback/committee`, `CommitteeDashboardPage.jsx`): Quarantined channel for Harassment complaints governed by the *Protection Against Harassment of Women at the Workplace Act*. Features restricted access clearance, dedicated case docket, and formal inquiry investigation history.

---

## 2. Backend Architecture & API Mapping

### Data Models (`backend/src/models/feedback.model.js`)
- **Fields**:
  - `title`: String (3–150 chars).
  - `description`: String (10–3000 chars).
  - `category`: Enum (`'Suggestion' | 'Grievance' | 'Workplace Issue' | 'Harassment' | 'Safety' | 'Other'`).
  - `priority`: Enum (`'Low' | 'Medium' | 'High' | 'Urgent'`). Default: `'Medium'`.
  - `status`: Enum (`'Submitted' | 'Under Review' | 'In Investigation' | 'Resolved' | 'Dismissed' | 'Escalated'`). Default: `'Submitted'`.
  - `isAnonymous`: Boolean (pre-save hook strictly enforces `this.submittedBy = null` if true).
  - `trackingCode`: String (unique collision-resistant token, e.g. `TRK-A8F2C1`).
  - `submittedBy`: Ref `User` (null if anonymous).
  - `departmentId`: Ref `Department` (optional).
  - `attachments`: Array of secure HTTPS URLs (max 5).
  - `caseNotes`: Subdocuments `[{ note, authorId, authorRole, isPublicToComplainant, createdAt }]`.
  - `resolutionNote`: String (optional final conclusion on Resolved/Dismissed).
  - `resolvedAt`, `resolvedBy`: Date and Ref `User`.
  - `isEscalated`, `escalationDetails: { escalatedBy, escalatedAt, reason }`.

### API Endpoints (`backend/src/modules/feedback/feedback.routes.js`)
| Method | Endpoint | Required Permission | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/feedback/track/:code` | Public / Throttled (30/15m) | Public case tracking by tracking code |
| `POST` | `/feedback` | `feedback.submit` (20/15m) | Submit feedback or grievance |
| `GET` | `/feedback/my` | Authenticated User | List submissions created by logged-in user |
| `GET` | `/feedback/stats/summary` | `feedback.manage` OR `grievance.committee` | Dashboard summary metrics |
| `GET` | `/feedback` | `feedback.manage` OR `grievance.committee` | List grievances with category/status filters |
| `GET` | `/feedback/:id` | `feedback.manage` OR `grievance.committee` | Single case details with notes |
| `PATCH`| `/feedback/:id/status` | `feedback.manage` OR `grievance.committee` | Progress case status & resolution |
| `POST` | `/feedback/:id/notes` | `feedback.manage` OR `grievance.committee` | Append case note (public/private) |
| `PATCH`| `/feedback/:id/escalate` | `feedback.escalate` | Escalate case to Super Admin |

---

## 3. PBAC & RBAC Permission Rules & Isolation Mandates

1. **Department Manager Isolation Rule (Row 21.6)**:
   - Department Managers have **NO ACCESS** to grievance administration (`feedback.manage` or `grievance.committee`).
   - If a Department Manager attempts to query `/feedback`, `/feedback/stats/summary`, or access administrative drawers, the backend strictly returns `403 Forbidden` (`'Access denied: Department Managers have no access to grievance administration'`).
   - *Rationale*: Grievances are frequently filed against immediate supervisors and department managers; preventing supervisor inspection protects complainants from retaliation.

2. **Harassment Quarantine Rule (Row 21.3)**:
   - Complaints in category `Harassment` are **strictly quarantined**.
   - Standard HR Managers (`feedback.manage`) **cannot view or list Harassment cases** (they are automatically excluded via `{ category: { $ne: 'Harassment' } }`).
   - Only users with `grievance.committee` (designated Inquiry Committee members) and the Super Admin can view or access Harassment cases.

3. **Confidential Tracking Code Sanitization (Row 21.4)**:
   - The public/authenticated `/feedback/track/:code` endpoint strictly sanitizes internal investigation notes: only case notes where `isPublicToComplainant: true` are returned.
   - Author IDs and private deliberation notes are never leaked to the tracker.

4. **Dynamic PBAC Enforcement Matrix**:
| Capability | Super Admin | HR Manager | Committee Member | Department Manager | Regular Employee |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `feedback.submit` | Yes | Yes | Yes | Yes | Yes |
| `/feedback/track` | Yes | Yes | Yes | Yes | Yes |
| `feedback.manage` | Yes | Yes | No | **Blocked (403)** | No |
| `grievance.committee` | Yes | No* | Yes | **Blocked (403)** | No |
| `feedback.escalate` | Yes | Yes | No | **Blocked (403)** | No |

*\*HR Managers only access the Inquiry Committee if explicitly appointed as a committee member with `grievance.committee`.*

---

## 4. Design System Specification (Forest & Emerald Enterprise)

All four submodules will adhere strictly to the project-wide design system:
- **Canvas**: `#F8FAFC` (light) / `#061A14` (dark forest black-green)
- **Card Surface**: `#FFFFFF` (light) / `#111D17` (dark card surface)
- **Hairline Borders**: `#EAECF0` (light) / `#1A3125` (dark border)
- **Primary Brand Accent**: `#00C471` (Vibrant Emerald) with `#00E584` hover
- **Quarantine Security Accent**: `#E11D48` (Rose-600) with `#4C0519` dark crimson background strictly for the Inquiry Committee portal
- **Typography & Data**: Monospaced tabular numerals (`font-mono tabular-nums`) for tracking codes (`TRK-XXXXXX`), timestamps, and case metrics.
- **Pills & Status Badges**:
  - `Submitted`: Violet (`bg-violet-50 text-violet-700 border-violet-200` / dark: `bg-violet-950/40 text-violet-400 border-violet-800/60`)
  - `Under Review`: Amber (`bg-amber-50 text-amber-700 border-amber-200` / dark: `bg-amber-950/40 text-amber-400 border-amber-800/60`)
  - `In Investigation`: Blue (`bg-blue-50 text-blue-700 border-blue-200` / dark: `bg-blue-950/40 text-blue-400 border-blue-800/60`)
  - `Resolved`: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200` / dark: `bg-emerald-950/40 text-emerald-400 border-emerald-800/60`)
  - `Dismissed`: Slate (`bg-slate-100 text-slate-700 border-slate-200` / dark: `bg-slate-800 text-slate-400 border-slate-700`)
  - `Escalated`: Crimson / Rose (`bg-rose-50 text-rose-700 border-rose-200` / dark: `bg-rose-950/40 text-rose-400 border-rose-800/60`)

---

## 5. Audit Gaps & Areas for Improvement

1. **Submit Feedback (`SubmitFeedbackPage.jsx`)**:
   - Outdated color scheme (`text-amber-500 bg-amber-50`, `bg-purple-50`, etc.) needs replacement with Forest & Emerald tokens.
   - Category selection cards need modern active states, clean icon badges, and clear descriptions.
   - The Success Modal with the tracking code needs a modern dialog design with high-contrast copy button, instructions to bookmark/save the code, and a direct button to track the case.

2. **Track Case (`TrackFeedbackPage.jsx`)**:
   - Currently only supports tracking code input.
   - Authenticated employees who submitted cases by name shouldn't have to search their history manually: add a segmented tab bar: `Track by Code` and `My Submitted Cases` (using `useGetMyFeedbackSubmissionsQuery`).
   - Elevated 4-stage visual timeline with status icons and progress indicators.
   - Public investigator updates feed with clean timestamps and role tags.

3. **Grievance Admin (`GrievanceAdminPage.jsx` & Drawers)**:
   - High-density KPI cards with actual counts from `useGetGrievanceStatsQuery`.
   - Comprehensive filter bar: search by title/code, category dropdown, priority dropdown, and segmented status tabs (`All`, `Active`, `Escalated`, `Resolved`, `Suggestions`).
   - Modern semantic table with monospaced tracking code, complainant tag, status pill, priority pill, and drawer action.
   - Overhaul `CaseDetailsDrawer.jsx`, `StatusChangeModal.jsx`, and `EscalateModal.jsx` with dark forest cards, accessible forms, and public/private note toggles.

4. **Inquiry Committee (`CommitteeDashboardPage.jsx`)**:
   - Elevate into an executive security clearance command center.
   - Summary cards: Total Harassment Cases, Under Active Investigation, Escalated / Overdue, Resolved / Closed.
   - High-density docket table with strict privacy protections.
   - Integrated case review drawer with formal findings and recommendations.

5. **Code Hygiene & Quality**:
   - Zero `prop-types` imports.
   - 0 Oxlint errors or warnings.
   - Clean Vite production build.
