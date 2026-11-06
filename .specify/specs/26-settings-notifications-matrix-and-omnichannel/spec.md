# Feature Specification: Settings Notification Module Pro UI/UX Overhaul & Full Systemic Module Matrix Integration

**Feature Branch**: `26-settings-notifications-matrix-and-omnichannel`  
**Created**: 2026-11-06  
**Status**: Draft  
**Specification File**: `.specify/specs/26-settings-notifications-matrix-and-omnichannel/spec.md`  
**Input**: User request: *"Update the UI of the notification module in settings using Pro UX/UI design standards. Read my docs folder, design.md file, and ui-reference file, and prepare the structural design according to them. Currently, notifications are only showing for 3 modules; if more exist in my project, integrate them and perfectly align and integrate them with all modules. Whenever a notification is received from any module in my software, ensure it is added"*

---

## 1. Executive Summary & Design Vision

Currently, the Notifications tab in **Company Settings** (`/settings` -> `notifications`) displays a dated, hardcoded dark-indigo UI (`#0F111A`) that clashes with the system's official **Forest & Emerald Enterprise Craft** (`DESIGN.md` and `docs/UI-REFERENCE.md`). Furthermore, the **Module Event Delivery Routing Matrix** only exposes **3 modules** (Leaves, Attendance, Payroll), leaving all other operational domains (Loans & Advances, Expenses, Assets, Onboarding & Offboarding, Performance, Projects & Timesheets, Security, and Profile Change Requests) unmanageable and disaligned.

This specification redesigns the Notification Settings hub according to the official Elvara/Stripe-Linear design archetype (`#FFFFFF` / `#111D17` cards, `#EAECF0` / `#1A3125` hairline borders, `#00C471` brand emerald accents, high-density typography, and custom micro-toggles), while expanding the backend matrix and `notify.service.js` pipeline to comprehensively support **all 11 functional modules** across In-App, Email, and WhatsApp channels.

---

## 2. User Scenarios & Prioritized User Stories

### User Story 1 — High-End Pro UI/UX Settings Hub Overhaul (Priority: P1)
**Description:** As an HR Director or Super Admin, I want to manage system-wide notification delivery through a visually cohesive, high-density settings interface conforming to `DESIGN.md` (Forest & Emerald craft, light/dark responsiveness, hairline borders, and clear semantic iconography) instead of the previous out-of-place hardcoded indigo interface.

**Why this priority:** Establishes visual trust, accessibility compliance, and structural alignment with the rest of the enterprise application.

**Independent Test:** Navigate to **Settings $\rightarrow$ Notifications & Alerts**; verify cards use `--bg-surface` (`#FFFFFF` in light, `#111D17` in dark), hairline `#EAECF0` / `#1A3125` borders, emerald `#00C471` controls, quick preset buttons, and responsive grid layouts.

**Acceptance Scenarios:**
1. **Given** an admin browsing Settings in Light Mode, **When** they click the "Notifications & Alerts" tab, **Then** all cards render on `#FFFFFF` surfaces with subtle `#EAECF0` hairline borders, dark slate headings (`#0F172A`), and emerald accent pills.
2. **Given** an admin in Dark Mode, **When** viewing the notification settings, **Then** surfaces adapt seamlessly to `#111D17` with `#1A3125` borders and emerald active highlights without washed-out text or contrast clipping.
3. **Given** the "Admin Channel Strategy & Routing" card, **When** clicking quick presets ("In-App Only", "Email Only", "WhatsApp Only", "All Active"), **Then** master channels and all module matrix toggles cascade smoothly to match the preset.

---

### User Story 2 — Complete 11-Module Routing Matrix Integration (Priority: P2)
**Description:** As a System Administrator, I want to fine-tune notification delivery individually for every module in the project—not just 3—so that I can decide which modules trigger In-App alerts, asynchronous emails, or WhatsApp messages.

**Why this priority:** Fulfills the user's core request to eliminate blind spots and bring parity across all operational modules in the software.

**The Complete 11-Module Matrix:**
1. **Leaves & Holidays** (`leave`): Leave applications, manager approvals, encashment requests, holiday announcements.
2. **Attendance & Geofencing** (`attendance`): Clock-in alerts, geofence violations, low accuracy flags, missed punch regularization, WFH approvals.
3. **Payroll & Payslips** (`payroll`): Monthly payroll finalization, payslip generation, salary disbursement notices, tax deduction alerts.
4. **Loans & Advances** (`loan`): Loan applications, early prepayments, installment schedule updates, approval/rejection notices.
5. **Expenses & Claims** (`expense`): Corporate expense claims, manager escalations, reimbursement disbursements via payroll or direct bank wire.
6. **Assets Management** (`asset`): Hardware/asset allocation, return requests, warranty expirations, maintenance schedules.
7. **Onboarding & Offboarding** (`onboarding`): New hire task checklists, probation completion, resignations, exit clearance workflows.
8. **Performance & Appraisals** (`performance`): Review cycle launches, self-evaluations, 360 peer feedback requests, promotion decisions.
9. **Projects & Timesheets** (`project`): Task assignments, milestone deadlines, weekly timesheet submissions and manager approvals.
10. **Security & Authentication** (`security`): 2FA OTP codes, password rotation alerts, suspicious device logins, account lockouts.
11. **Profile & Organization** (`profile`): Employee profile change requests (CNIC, address, emergency contact) and HR verification.

**Independent Test:** Modify toggles for a newly integrated module (e.g., disable Email for "Loans & Advances" while keeping In-App enabled), click "Save Channel Strategy", and reload the page; verify persisted values reflect correctly.

**Acceptance Scenarios:**
1. **Given** the Module Event Delivery Routing Matrix, **When** viewed by an admin, **Then** all 11 modules appear in clear categorical sections with dedicated Lucide icons, descriptions, and independent In-App, Email, and WhatsApp checkboxes.
2. **Given** an admin toggling In-App for "Assets Management" and Email for "Performance", **When** they click "Save Channel Strategy", **Then** the settings payload `{ categories: { asset: { inApp: true, email: false, ... }, performance: { ... } } }` is persisted to MongoDB.

---

### User Story 3 — End-to-End Dynamic Notification Dispatch Pipeline (Priority: P3)
**Description:** As a system user, whenever an action occurs in any module (e.g. loan approved, expense submitted, asset assigned, timesheet submitted), the centralized `notify(userIds, payload)` service must evaluate the persisted admin channel settings and deliver the alert seamlessly.

**Why this priority:** Ensures the UI settings directly govern operational backend execution in real-time.

**Independent Test:** Trigger an event in any module (e.g. submit an expense or approve a loan); verify the recipient receives the in-app notification in their topbar bell drawer and the real-time WebSocket indicator reflects immediately if in-app delivery is enabled.

**Acceptance Scenarios:**
1. **Given** admin settings with In-App enabled for `loan`, **When** a manager approves a loan in `loan.service.js`, **Then** a notification document with `type: 'loan'` is created, and the user receives a WebSocket event updating their topbar badge.
2. **Given** admin settings with Email disabled for `expense`, **When** an employee submits an expense claim, **Then** `notify.service.js` suppresses the email worker queue and only delivers the in-app alert.
3. **Given** a notification emitted with any new module type, **Then** `Notification.schema` validates without enum constraint errors.

---

### User Story 4 — Topbar Bell & Sidebar Badge Synchronization (Priority: P4)
**Description:** As an employee or manager, when a notification is received from any module, I want to see the unread counter increment in the topbar bell and on the respective module's sidebar menu item in real-time.

**Why this priority:** Prevents stale state and allows users to jump directly to the relevant module from the alert.

**Independent Test:** Send a test notification for "Assets" or "Loans"; verify the topbar count increments and clicking the notification navigates to the target deep link (`link: '/loans'` or `/expenses`).

---

## 3. Structural Design & Layout Hierarchy (`DESIGN.md` Alignment)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Company Settings  >  [Notifications & Alerts Tab]                     [Refresh] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CARD 1: Admin Channel Strategy & Master Routing                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Headline + Description             [Presets: In-App | Email | WA | All]   │  │
│  ├───────────────────────────────────────────────────────────────────────────┤  │
│  │ [✓ In-App Alerts (Web)]     [✓ Email Delivery]     [✓ WhatsApp Business]  │  │
│  │ Real-time bell & drawer     Asynchronous HTML       Direct Cloud API      │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  CARD 2: Announcements & Executive Broadcast Channels                           │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ [✓ Notice Board & Bell]     [✓ Announcement Email]  [✓ WhatsApp Broadcast]│  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  CARD 3: Full 11-Module Event Delivery Routing Matrix                           │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Module Event                     Description          In-App  Email  WA   │  │
│  ├───────────────────────────────────────────────────────────────────────────┤  │
│  │ 📅 Leaves & Approvals            Submissions, balance   [✓]    [✓]   [ ]  │  │
│  │ ⏱️ Attendance & Geofencing       Punches, geofence, WFH [✓]    [ ]   [ ]  │  │
│  │ 💵 Payroll & Payslips            Disbursements, slips   [✓]    [✓]   [✓]  │  │
│  │ 🪙 Loans & Advances              Applications, settle   [✓]    [✓]   [ ]  │  │
│  │ 🧾 Expenses & Claims             Submissions, reimburse [✓]    [✓]   [ ]  │  │
│  │ 💻 Assets Management             Allocations, returns   [✓]    [ ]   [ ]  │  │
│  │ 🚀 Onboarding & Offboarding      Checklists, clearances [✓]    [✓]   [ ]  │  │
│  │ 🎯 Performance & Appraisals      Reviews, 360 feedback  [✓]    [✓]   [ ]  │  │
│  │ 📁 Projects & Timesheets         Tasks, weekly hours    [✓]    [ ]   [ ]  │  │
│  │ 🛡️ Security & Compliance         2FA, device alerts     [✓]    [✓]   [✓]  │  │
│  │ 👤 Profile & Change Requests     CNIC, document edits   [✓]    [✓]   [ ]  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  [Save Channel Strategy & Persist Configurations]                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Functional Requirements (FR)

- **FR-001**: System MUST render the Notification Settings page using strict semantic tokens from `DESIGN.md` (`bg-white dark:bg-[#111D17]`, `border-slate-200 dark:border-[#1A3125]`, `text-slate-900 dark:text-slate-100`).
- **FR-002**: System MUST render master delivery controls for **In-App Web**, **Email Delivery**, and **WhatsApp Business** with interactive checkcards and quick preset selectors.
- **FR-003**: System MUST provide the **Module Event Delivery Routing Matrix** incorporating all 11 modules:
  1. `leave`
  2. `attendance`
  3. `payroll`
  4. `loan`
  5. `expense`
  6. `asset`
  7. `onboarding`
  8. `performance`
  9. `project`
  10. `security`
  11. `profile`
- **FR-004**: System MUST allow independent toggling of In-App, Email, and WhatsApp channels for each of the 11 modules.
- **FR-005**: System MUST validate and update the Mongoose `Notification` schema enum to permit all 11 categories:
  `['system', 'attendance', 'leave', 'payroll', 'loan', 'expense', 'asset', 'onboarding', 'performance', 'project', 'announcement', 'security', 'profile']`.
- **FR-006**: `notify.service.js` MUST evaluate both the global channel toggles and the specific module's matrix row before queuing emails or saving in-app notifications.
- **FR-007**: When in-app notification is enabled for a module, `notify()` MUST insert the notification into MongoDB and emit the real-time WebSocket packet `notification:new` to the target user room.
- **FR-008**: Notification links MUST lead directly to valid, authenticated internal application routes (e.g. `/loans`, `/expenses/approvals`, `/assets`, `/performance`, `/projects`).
- **FR-009**: The settings form MUST provide optimistic updates, loading spinners, and immediate toast feedback on save via RTK Query mutation `updateSetting({ key: 'notifications', value })`.
- **FR-010**: System MUST provide a "Select All / In-App All" convenience control per row or across the matrix to streamline admin configuration.

---

## 5. Non-Functional & Quality Requirements

- **NFR-001 (Theme Compliance)**: 100% adherence to Light/Dark contrast guidelines. Zero hardcoded indigo/blue palettes (`#0F111A`, `#1E2235`); all surfaces use Forest & Emerald craft tokens.
- **NFR-002 (Performance)**: Matrix save operation MUST complete within $< 300\text{ms}$.
- **NFR-003 (Zero Regression)**: Existing notifications in the database must continue to render correctly in the topbar notification drawer and `NotificationsPage.jsx`.

---

## 6. Success Criteria (Measurable Outcomes)

- **SC-001**: All 11 operational modules are visibly configured and manageable within the Settings Notification Matrix.
- **SC-002**: Changing channel settings for any module instantly influences live dispatching via `notify()` without requiring server restarts.
- **SC-003**: 0 ESLint errors and 0 build warnings during `npm run build --prefix frontend`.
- **SC-004**: Light and dark mode pass 100% visual contrast and styling checks per `docs/UI-REFERENCE.md`.

