# Implementation Plan: Systemic 10 UI States Framework

**Branch**: `feature/24-systemic-ten-ui-states`  
**Date**: 2026-11-06  
**Spec**: [`.specify/specs/24-systemic-ten-ui-states/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/24-systemic-ten-ui-states/spec.md)  
**Status**: Ready for Task Breakdown  

---

## 1. Summary & Architecture Overview

This plan establishes a systemic, production-grade **10 UI States Framework** across the HRM Enterprise platform. Instead of ad-hoc error banners, raw spinners, and generic toasts, this architecture provides a unified set of reusable components, hooks, providers, and modals that turn every edge condition into an intuitive, reassuring user experience.

### Architectural Core Principles
1. **Rule-Based State Construction**:
   - **Empty State**: Explicitly name what is empty, provide context, and offer **one primary next step**.
   - **Loading State**: Show the **shape of incoming content** via shimmer skeletons (zero unstyled spinners).
   - **Error State**: Explicitly communicate **what went wrong**, **whose fault it is**, and **how to fix it**.
   - **No Internet**: Keep **cached content on screen**; show a non-intrusive banner; auto-sync when online.
   - **Slow Network**: Show **real progress** and provide a low-bandwidth / retry path.
   - **No Search Result**: Distinguish from empty collections, **fix typos with candidate suggestions**, and offer 1-click clear.
   - **Permission Denied**: Explain **which permission is required**, **why it is restricted**, and provide a **safe return path**.
   - **Session Expired**: **Save form drafts in local storage** before user is signed out; present re-auth modal.
   - **Form Validation**: Flag the **exact field** with a red hairline border and **inline instructions on how to format**.
   - **Success State**: **Confirm** the record, **reassure** what was saved, and outline **what happens next** in the workflow.

2. **Strict Theme & Design Tokens (`DESIGN.md`)**:
   - Palette: Dark Forest `#061A14`, Card Surface `#FFFFFF` (Dark `#111D17`), Hairline Border `#EAECF0` (Dark `#1A3125`), Emerald `#00C471`, Amber `#F59E0B`, Rose `#EF4444`.
   - Modals: Full accessibility compliance with backdrop blur, focus trap, and `Esc` escape.
   - Zero Bloat (Ponytail): Pure React + Tailwind + Lucide icons. No external modal or heavy state machine libraries.

---

## 2. Technical Context & File Layout

- **Platform**: React 18, Vite 6, Tailwind CSS, Redux Toolkit Query (RTK Query), Lucide React, Sonner.
- **Directory Structure for New & Enhanced Components**:
  ```text
  frontend/src/
  ├── components/
  │   ├── common/
  │   │   ├── EmptyState.jsx             # State 1: Reusable Empty Collection Container
  │   │   ├── ScreenSkeleton.jsx         # State 2: Enhanced Shimmer Loading Skeletons
  │   │   ├── ModalSkeleton.jsx          # State 2: Dialog & Drawer Form Skeletons
  │   │   ├── ErrorState.jsx             # State 3: Inline Attributed Error Display
  │   │   ├── ErrorModal.jsx             # State 3: Dialog for Fatal / Mutation Failures
  │   │   ├── ErrorBoundary.jsx          # State 3: Enhanced React Error Boundary
  │   │   ├── OfflineBanner.jsx          # State 4: Floating Non-Intrusive Offline Bar
  │   │   ├── OfflineProvider.jsx        # State 4: Online/Offline React Context & Hook
  │   │   ├── NetworkProgressBar.jsx     # State 5: Top-Edge Slow Network Telemetry
  │   │   ├── NoSearchResults.jsx        # State 6: Typo Tolerance & Suggestion UI
  │   │   ├── PermissionDeniedState.jsx  # State 7: Page-Level 403 Fallback with Return
  │   │   ├── PermissionDeniedModal.jsx  # State 7: Dialog for Restricted Actions
  │   │   ├── SessionExpiredModal.jsx    # State 8: 401 Interceptor with Draft Preservation
  │   │   ├── FormField.jsx              # State 9: Accessible Form Field with Inline Errors
  │   │   ├── FormValidationError.jsx    # State 9: Inline Micro-Instructions for Invalid Inputs
  │   │   ├── SuccessState.jsx           # State 10: Embedded Next-Steps Confirmation
  │   │   ├── SuccessModal.jsx           # State 10: Dialog with Workflow Progression
  │   │   └── DataTable.jsx              # Integrated States 1, 2, 6
  ├── lib/
  │   ├── draftStorage.js                # State 8: LocalStorage Form Draft Recovery Engine
  │   ├── typoMatcher.js                 # State 6: Levenshtein Distance & Candidate Suggestion
  │   └── networkMonitor.js              # State 5: Latency & Effective Connection Tracker
  ```

---

## 3. Component Architecture & Implementation Specifications

### State 1: `<EmptyState />`
```jsx
/**
 * EmptyState Component
 * Follows Rule: State what is empty, give reassurance, provide one next step.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action = null, // { label: string, onClick?: function, href?: string, icon?: Component }
  secondaryAction = null,
  compact = false,
  className = ''
})
```
- Integrated into `DataTable.jsx`:
  When `data.length === 0 && !searchTerm`, replaces the default table empty row with `<EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />`.

---

### State 2: `<ScreenSkeleton />` & `<ModalSkeleton />`
- Extends existing `ScreenSkeleton.jsx` with full geometry alignment:
  - Table: Exact row and column cell distribution matching the target data.
  - Cards: Grid matching KPI cards or team roster cards.
  - Profiles: Avatar, badge pills, and tabbed section skeletons.
  - Matrix: Role and permission toggle grid skeleton.
- Introduces `<ModalSkeleton />` for dialogs fetching detail records (e.g., `PayrollRunDetailPage`, `AssetDetailPage`, `PayslipPreviewModal`).

---

### State 3: `<ErrorState />`, `<ErrorModal />` & `<ErrorBoundary />`
- **Error Attribution Engine**:
  ```js
  export function classifyError(error) {
    if (error?.status === 401 || error?.statusCode === 401) {
      return { fault: 'auth', label: 'Authentication Expired', help: 'Please sign back in.' };
    }
    if (error?.status === 403 || error?.statusCode === 403) {
      return { fault: 'permission', label: 'Access Restricted', help: 'You lack permission.' };
    }
    if (error?.status >= 500 || error?.statusCode >= 500) {
      return { fault: 'server', label: 'Server Fault', help: 'Our service had an internal issue. Try again.' };
    }
    if (error?.message?.includes('NetworkError') || error?.status === 'FETCH_ERROR') {
      return { fault: 'network', label: 'Network Disconnected', help: 'Check internet connection.' };
    }
    return { fault: 'client', label: 'Request Error', help: error?.data?.message || 'Check inputs.' };
  }
  ```
- **UI Blueprint**:
  - Top alert badge with fault category.
  - Concrete headline ("Failed to calculate payroll deductions").
  - Clear blame & resolution ("Server Fault: Database connection timed out. Please retry in 30 seconds.").
  - Dual action buttons: `[Retry Action]` (with spinner) and `[Return to Previous Page]`.

---

### State 4: `<OfflineProvider />` & `<OfflineBanner />`
- **Global Context Provider** wraps `AppLayout.jsx`.
- **Behavior**:
  - Subscribes to `online` and `offline` DOM window events.
  - When offline:
    - Maintains existing RTK Query cache on-screen (zero blanking).
    - Surfaces `<OfflineBanner />`: Fixed floating top capsule:
      `[WifiOff Icon] Offline Mode: Viewing cached data. Offline changes will synchronize when reconnected.`
  - When connection is restored:
    - Fires Sonner emerald toast: `"Connection restored. System is synchronized."`
    - Seamlessly hides banner.

---

### State 5: `<NetworkProgressBar />` & Slow Network Telemetry
- **Latency Monitoring**:
  - Intercepts RTK Query queries taking longer than `2500ms` or uses `navigator.connection.effectiveType === '2g'`.
  - Animates a subtle 2px emerald progress bar along the very top edge of the browser viewport.
  - If latency exceeds `4000ms`, displays top indicator:
    `[Timer Icon] Slow connection detected. Loading records... [Retry / Refresh]`

---

### State 6: `<NoSearchResults />` & Typo Tolerance Engine
- **Typo Tolerance Helper (`typoMatcher.js`)**:
  - Implements Levenshtein distance against known vocabulary arrays (e.g. active departments, role names, designation titles).
  - Example: Querying `"Enginering"` suggests `"Engineering"`.
- **UI Blueprint**:
  - Search icon with subtle amber circle.
  - Headline: `No results matching "{searchTerm}"`.
  - Suggestion prompt: `Did you mean "{suggestedTerm}"? [Apply Suggestion]`.
  - Primary Action: `[Clear Search & Reset Filters]`.

---

### State 7: `<PermissionDeniedState />` & `<PermissionDeniedModal />`
- Used when PBAC authorization blocks route access or a specific action.
- **UI Blueprint**:
  - Shield Lock icon with subtle purple/indigo badge.
  - Title: `Access Restricted (HTTP 403)`.
  - Explicit explanation:
    - `"You require the '{requiredPermission}' permission to access this view."`
    - `"This module manages sensitive {moduleName} data restricted to {roles}."`
  - Navigation actions:
    - `[Return to Dashboard]` (Primary)
    - `[Request Access from HR Admin]` (Secondary action triggering access request modal).

---

### State 8: `<SessionExpiredModal />` & Draft Preservation Engine (`draftStorage.js`)
- **Data Protection Engine**:
  - Before session logout or on 401 API response:
    - Inspects any active `<form>` or registered draft state.
    - Serializes inputs into `localStorage.setItem('hrm_draft_backup_' + userId + '_' + path, JSON.stringify(formData))`.
- **UI Blueprint (`<SessionExpiredModal />`)**:
  - Dialog opens with backdrop blur (`z-50`).
  - Title: `Session Expired`.
  - Message: `Your session timed out. Don't worry — we safely preserved all your unsaved form entries!`
  - Re-authentication fields: Email (read-only), Password input.
  - Action: `[Sign In & Continue Drafting]` or `[Go to Login]`.
  - Upon successful re-authentication, automatically populates form inputs and confirms with toast: `"Draft restored successfully."`

---

### State 9: `<FormField />` & `<FormValidationError />`
- **Standardized Input Wrapper**:
  ```jsx
  export function FormField({
    label,
    error,
    helperText,
    required = false,
    id,
    children
  })
  ```
- **Error Presentation**:
  - Offending input receives `border-rose-500 focus:ring-rose-500/20`.
  - Inline error box directly below:
    `[AlertCircle Icon] {error}`
  - Example error messages with concrete formatting instructions:
    - `"CNIC must be exactly 13 numeric digits without hyphens (e.g., 3520112345671)."`
    - `"Basic salary must be greater than 0 PKR."`
    - `"Effective date cannot be in the past."`

---

### State 10: `<SuccessState />` & `<SuccessModal />`
- **Workflow Progression Blueprint**:
  - Large emerald checkmark with subtle glowing pulse.
  - **Confirm**: `Expense Claim #EXP-2026-0042 Submitted`
  - **Reassure**: `Receipt images uploaded to secure cloud storage. Status set to Pending Manager Review.`
  - **What Happens Next**:
    - `Step 1: Department Manager review (within 48 hours)`
    - `Step 2: HR reimbursement verification`
    - `Step 3: Payout credited with monthly payroll`
  - **Action Controls**:
    - Primary CTA: `[View Submitted Claim]`
    - Secondary CTA: `[Submit Another / Done]`

---

## 4. Phased Implementation Roadmap

### Phase 1: Shared Core Engines & Components
- Create `frontend/src/lib/draftStorage.js`, `frontend/src/lib/typoMatcher.js`, `frontend/src/lib/networkMonitor.js`.
- Create foundational state components:
  - `EmptyState.jsx`
  - `ErrorState.jsx` & `ErrorModal.jsx`
  - `OfflineBanner.jsx` & `OfflineProvider.jsx`
  - `NetworkProgressBar.jsx`
  - `NoSearchResults.jsx`
  - `PermissionDeniedState.jsx` & `PermissionDeniedModal.jsx`
  - `SessionExpiredModal.jsx`
  - `FormField.jsx` & `FormValidationError.jsx`
  - `SuccessState.jsx` & `SuccessModal.jsx`

### Phase 2: Table & Search Integration (States 1, 2, 6)
- Upgrade `DataTable.jsx` to natively integrate:
  - `<EmptyState />` for zero records.
  - `<NoSearchResults />` with typo suggestions for filtered searches.
  - Seamless skeleton loading.

### Phase 3: Global Network & Session Guardians (States 4, 5, 8)
- Wrap application layout in `<OfflineProvider />` with `<OfflineBanner />`.
- Mount `<NetworkProgressBar />` along top viewport edge.
- Integrate 401 interception in RTK Query base query to trigger `<SessionExpiredModal />` and `draftStorage.js`.

### Phase 4: PBAC & Error Hardening (States 3, 7)
- Upgrade `ErrorBoundary.jsx` and `<Can.jsx>` fallback with `<PermissionDeniedState />`.
- Standardize mutation error handling to render `<ErrorModal />` with fault attribution.

### Phase 5: Form Validation & Success Confirmation (States 9, 10)
- Roll out `<FormField />` across key modal forms (Employee create, Salary structure, Expense apply, Loan apply, Leave apply).
- Implement `<SuccessModal />` on creation workflows with multi-step pipeline previews.

### Phase 6: Build Verification & Testing
- Run full Vite production build (`npm run build --prefix frontend`).
- Run backend verification tests.

---

## 5. Verification & Testing Strategy

1. **Empty States**: Test tables with `data = []` and confirm title, reassurance, and next step action button appear.
2. **Offline Simulation**: Toggle browser offline; confirm cached records stay intact, offline banner appears, and reconnecting triggers auto-sync.
3. **Typo Tolerance**: Type misspelling into search (e.g. `Admn`); verify suggestion `Admin` and "Clear Search" button.
4. **Session Timeout & Draft Recovery**: Simulate 401 while form is filled; verify inputs persist into `localStorage` and recover post-login.
5. **Form Validation**: Trigger invalid submission; verify exact red hairline border and instructional helper message.
6. **Success Workflow**: Submit claim/request; verify confirmation, reassurance, and "what happens next" timeline render.

