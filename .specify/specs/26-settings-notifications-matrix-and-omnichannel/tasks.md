# Tasks: Settings Notification Module Pro UI/UX Overhaul & Full 11-Module Matrix Integration

**Input**: Design documents from `.specify/specs/26-settings-notifications-matrix-and-omnichannel/`  
**Prerequisites**: `spec.md`, `plan.md`  
**Specification**: [spec.md](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/26-settings-notifications-matrix-and-omnichannel/spec.md) | **Plan**: [plan.md](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/26-settings-notifications-matrix-and-omnichannel/plan.md)

---

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Belongs to User Story (US1 = Pro UI/UX Redesign, US2 = 11-Module Matrix, US3 = Dynamic Dispatch Pipeline, US4 = Real-Time Sync)

---

## Phase 1: Backend Data Model & Enums (Foundational)

**Purpose**: Expand core Notification schema enums to prevent validation errors when dispatching alerts from newly supported modules.

- [x] **T001** `[P]` `[US2]` Expand the `type` enum values in `backend/src/models/notification.model.js` to include all 11 modules: `['system', 'attendance', 'leave', 'payroll', 'loan', 'expense', 'asset', 'onboarding', 'performance', 'project', 'announcement', 'security', 'profile']`.
- [x] **T002** `[US3]` Update `backend/src/services/notify.service.js` channel resolution engine to dynamically evaluate category configurations (`adminNotifSetting.categories?.[type]`) across all 11 modules, with graceful fallback to global master channel toggles.

**Checkpoint**: Backend data layer safely accepts and resolves notifications for all 11 modules without schema validation exceptions.

---

## Phase 2: User Story 1 & 2 — Pro UI/UX Overhaul & 11-Module Matrix UI (Frontend)

**Purpose**: Transform the dated `#0F111A` interface into a premier Forest & Emerald craft settings hub (`DESIGN.md` and `docs/UI-REFERENCE.md`) housing the full 11-module matrix.

- [x] **T003** `[US1]` Redesign master card surfaces in `frontend/src/features/settings/components/NotificationSettingsForm.jsx` to adhere to light (`#FFFFFF`, `#EAECF0`) and dark (`#111D17`, `#1A3125`) theme standards with emerald accents (`#00C471`).
- [x] **T004** `[US1]` Rebuild Card 1 (**Admin Channel Strategy & Routing**) with interactive master channel toggles (In-App Alerts, Email Delivery, WhatsApp Business) and animated quick preset pills (*"In-App Only"*, *"Email Only"*, *"WhatsApp Only"*, *"Mixed / All Active"*).
- [x] **T005** `[US1]` Rebuild Card 2 (**Announcements & Executive Broadcast Channels**) with clean channel checkcards and clear helper copy.
- [x] **T006** `[US2]` Rebuild Card 3 (**Module Event Delivery Routing Matrix**) to render all 11 operational modules:
  1. `leave`: Leaves & Holidays (Calendar)
  2. `attendance`: Attendance & Geofencing (Clock)
  3. `payroll`: Payroll & Payslips (BadgeDollarSign)
  4. `loan`: Loans & Advances (Coins)
  5. `expense`: Expenses & Claims (Receipt)
  6. `asset`: Assets Management (Laptop)
  7. `onboarding`: Onboarding & Offboarding (UserCheck)
  8. `performance`: Performance & Appraisals (Award)
  9. `project`: Projects & Timesheets (FolderKanban)
  10. `security`: Security & Authentication (ShieldCheck)
  11. `profile`: Employee Profile & Change Requests (User)
- [x] **T007** `[US2]` Implement row-level toggle controls (independent checkboxes for In-App, Email, WhatsApp) and batch actions (*"Select All In-App"*, *"Enable All Channels"*, *"Disable All"*) to maximize administrative ergonomics.
- [x] **T008** `[US1]` Implement the Emerald Save CTA button (`#00C471`) with loading spinner, optimistic UI feedback, and Sonner toast notifications via `useUpdateSettingMutation`.

**Checkpoint**: Settings UI is visually stunning, 100% theme-compliant, and allows granular control of all 11 modules across 3 channels.

---

## Phase 3: User Story 3 & 4 — Operational Dispatch Audit & Real-Time Sync

**Purpose**: Confirm that system events in newly expanded modules correctly trigger alerts, respect admin channel suppressions, and update client unread badges.

- [x] **T009** `[P]` `[US3]` Audit domain services (`loan.service.js`, `expense.service.js`, `asset.service.js`, `onboarding.service.js`, `performance.service.js`, `project.service.js`) to ensure all emitted alerts pass standardized `type` keys and internal deep links.
- [x] **T010** `[US4]` Verify that WebSocket `notification:new` events properly trigger real-time cache tag invalidations, updating the topbar bell badge and module-level sidebar notification indicators.

---

## Phase 4: Verification & Quality Gate

**Purpose**: Ensure zero regressions, error-free bundling, and flawless responsive appearance.

- [x] **T011** Verify frontend production bundle compiles without warnings or errors: `npm run build --prefix frontend`.
- [x] **T012** Verify settings persistence: Toggle module channels, save, reload page, and confirm persisted MongoDB state in settings document.
- [x] **T013** Test Light and Dark mode appearance per `DESIGN.md` and verify zero color clipping or readability issues.

