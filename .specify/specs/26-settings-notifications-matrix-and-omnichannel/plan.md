# Implementation Plan: Settings Notification Module Pro UI/UX Overhaul & Full 11-Module Matrix Integration

**Branch**: `26-settings-notifications-matrix-and-omnichannel` | **Date**: 2026-11-06 | **Spec**: [spec.md](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/26-settings-notifications-matrix-and-omnichannel/spec.md)

**Input**: Feature specification from `.specify/specs/26-settings-notifications-matrix-and-omnichannel/spec.md`

---

## 1. Summary

This plan outlines the end-to-end technical implementation for overhauling the **Notification Settings Hub** (`/settings` -> Notifications & Alerts) to meet **Pro Enterprise UX/UI Craft Standards** (`DESIGN.md` and `docs/UI-REFERENCE.md`). It expands the delivery routing matrix from a rudimentary 3-module subset to the complete **11-module operational suite** (Leaves, Attendance, Payroll, Loans, Expenses, Assets, Onboarding, Performance, Projects, Security, Profile), ensuring omnichannel control (In-App, Email, WhatsApp) with instant WebSocket emission and topbar badge synchronization.

---

## 2. Technical Context

- **Frontend Tech Stack**: React 18, Vite, Tailwind CSS, Lucide React icons, RTK Query (`settingsApi.js`, `notificationsApi.js`), Sonner toast system.
- **Backend Tech Stack**: Node.js, Express, Mongoose (MongoDB Atlas), Socket.io (WebSocket rooms `user:${id}`), Redis / Queue worker (Email), WhatsApp Cloud API.
- **Design System Tokens**:
  - Light Canvas: `--bg-surface: #FFFFFF`, `--border-color: #EAECF0`, `--text-heading: #0F172A`, `--text-muted: #64748B`.
  - Dark Canvas: `--bg-surface: #111D17`, `--border-color: #1A3125`, `--text-heading: #F8FAFC`, `--text-muted: #7E9E8F`.
  - Primary Brand Accent: `--brand-primary: #00C471`, `--brand-hover: #049856`, `--brand-light: #E6F9F1`.
- **Target Performance**: Matrix save $< 250\text{ms}$; WebSocket packet delivery latency $< 50\text{ms}$.

---

## 3. Architecture Blueprint & System Flow

```mermaid
flowchart TD
    subgraph UI_Settings ["Settings UI (NotificationSettingsForm.jsx)"]
        A["Master Channel Strategy (In-App / Email / WhatsApp)"]
        B["Announcements & Broadcast Channels"]
        C["11-Module Event Delivery Routing Matrix"]
        D["Save Settings Mutation (RTK Query)"]
        A --> D
        B --> D
        C --> D
    end

    subgraph Backend_Storage ["MongoDB (Setting Collection)"]
        D -->|PUT /api/v1/settings/notifications| E["Setting Document (key: 'notifications')"]
    end

    subgraph Operational_Modules ["Any System Module Event"]
        M1["Loans (loan.service.js)"]
        M2["Expenses (expense.service.js)"]
        M3["Assets (asset.service.js)"]
        M4["Onboarding (onboarding.service.js)"]
        M5["Performance (performance.service.js)"]
        M6["Projects (project.service.js)"]
        M7["Attendance / Leaves / Payroll / Security / Profile"]
    end

    subgraph Dispatcher ["Centralized notify.service.js Pipeline"]
        M1 & M2 & M3 & M4 & M5 & M6 & M7 -->|notify(userIds, payload)| F["Channel Resolution Engine"]
        E -.->|Lookup active channel config| F
        F --> G{"Channels Allowed?"}
        G -->|In-App Enabled| H["Notification.create() + Socket.io emit('notification:new')"]
        G -->|Email Enabled| I["Queue Worker (Email Dispatcher)"]
        G -->|WhatsApp Enabled| J["WhatsApp Cloud API Dispatcher"]
    end

    subgraph Client_Realtime ["Client Portal Real-Time Sync"]
        H --> K["Topbar Bell Unread Counter Incremented"]
        H --> L["Slide-Out Notifications Drawer Updated"]
        H --> M["Sidebar Dynamic Module Badge Updated"]
    end
```

---

## 4. Phase-by-Phase Implementation Slices

### Phase 1: Database Model & Notification Enum Expansion
- **File**: `backend/src/models/notification.model.js`
- **Objective**: Expand the `type` enum in `notificationSchema` to support all operational domains:
  ```javascript
  enum: {
    values: [
      'system',
      'attendance',
      'leave',
      'payroll',
      'loan',
      'expense',
      'asset',
      'onboarding',
      'performance',
      'project',
      'announcement',
      'security',
      'profile'
    ],
    message: '{VALUE} is not a valid notification category'
  }
  ```
- **Invariant**: Backward compatibility with existing records.

---

### Phase 2: Centralized Dispatcher Matrix Alignment
- **File**: `backend/src/services/notify.service.js`
- **Objective**: Ensure the channel resolution engine resolves category overrides accurately:
  - If `adminNotifSetting.categories?.[type]` exists, evaluate `inApp`, `email`, and `whatsapp` against global master toggles.
  - Fallback gracefully to default global channel flags if a newly added module category hasn't been explicitly configured yet in the database.

---

### Phase 3: Pro UX/UI Redesign of `NotificationSettingsForm.jsx`
- **File**: `frontend/src/features/settings/components/NotificationSettingsForm.jsx`
- **Objective**: Rebuild the UI adhering strictly to `DESIGN.md`:
  1. **Card 1: Admin Channel Strategy & Master Routing**
     - Modern light/dark cards with `#EAECF0` / `#1A3125` hairline borders.
     - 3 master channel cards: **In-App Alerts**, **Email Delivery**, **WhatsApp Business**.
     - Quick Preset Pills: "In-App Only", "Email Only", "WhatsApp Only", "All Active" with animated active states.
  2. **Card 2: Announcements & Executive Broadcast Channels**
     - Master toggles for company-wide notifications and urgent broadcasts.
  3. **Card 3: Full 11-Module Event Delivery Routing Matrix**
     - High-density tabular grid with clear module identity (Lucide icons, module badges, event descriptions):
       1. **Leaves & Approvals** (Calendar)
       2. **Attendance & Geofencing** (Clock)
       3. **Payroll & Payslips** (BadgeDollarSign)
       4. **Loans & Advances** (Coins)
       5. **Expenses & Claims** (Receipt)
       6. **Assets Management** (Laptop)
       7. **Onboarding & Offboarding** (UserCheck)
       8. **Performance & Appraisals** (Award)
       9. **Projects & Timesheets** (FolderKanban)
       10. **Security & Authentication** (ShieldCheck)
       11. **Profile & Change Requests** (User)
     - Clean, accessible toggles for In-App, Email, and WhatsApp.
     - Row-level quick action: "All Channels" / "In-App Only" toggles.
  4. **Save Action & Visual State Handling**
     - Emerald CTA button (`#00C471`) with loading spinner and optimistic feedback.

---

### Phase 4: Module-Wide Dispatch Audit & Verification
- **Objective**: Audit and verify that key event dispatchers across all 11 modules call `notify()` with the standardized `type`:
  - `loan.service.js` -> `type: 'loan'`
  - `expense.service.js` -> `type: 'expense'`
  - `asset.service.js` -> `type: 'asset'`
  - `onboarding.service.js` -> `type: 'onboarding'`
  - `performance.service.js` -> `type: 'performance'`
  - `project.service.js` -> `type: 'project'`
  - `auth.service.js` -> `type: 'security'`
  - `changeRequest.service.js` -> `type: 'profile'`

---

## 5. Verification & Test Strategy

1. **Schema Integrity**: Validate that saving notifications with `type: 'asset'` or `type: 'loan'` executes without Mongoose validation errors.
2. **Settings Persistence**: Update channel strategy via UI, refresh page, and verify the 11-module matrix retains states accurately.
3. **Dispatch Enforcement**: Disable Email for `loan`, trigger a loan application approval, and confirm that email is skipped while in-app WebSocket alert is emitted.
4. **Theme Verification**: Verify light mode (`#FFFFFF` surfaces) and dark mode (`#111D17` surfaces) render with proper contrast and zero styling anomalies.
5. **Production Build**: Execute `npm run build --prefix frontend` ensuring clean bundle without lint or build warnings.

