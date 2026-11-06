# Feature Specification: Systemic 10 UI States Framework

**Feature Branch**: `24-systemic-ten-ui-states`  
**Created**: 2026-11-05  
**Status**: Ready for Review  
**Theme & Design Standard**: Forest & Emerald Enterprise Craft ([`DESIGN.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/DESIGN.md) & [`docs/UI-REFERENCE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/UI-REFERENCE.md))  
**Input User Request**: 
> "Apply these 10 states across my entire project. Read my `docs` folder and design the structure accordingly. For the UI, use professional UI/UX design standards, read the `design.md` file and the `ui-reference` file, and create the UI for these states based on those files. Wherever modals are needed for these states, create them:
> 1. Empty State: State what is empty, then give one next step.
> 2. Loading State: Show the shape of what is coming (skeleton loader), not just a spinner.
> 3. Error State: Explain what went wrong, whose fault it is, and how to fix it.
> 4. No Internet: Keep cached content on screen and show a toast notification.
> 5. Slow Network: Show real progress and offer a lighter path.
> 6. No Search Result: Fix typos and suggest the next best thing.
> 7. Permission Denied: Explain why you need it and provide a way back.
> 8. Session Expired: Save their work before signing them out.
> 9. Form Validation: Flag the exact field with inline instructions on how to fix it.
> 10. Success States: Confirm, reassure, and show what happens next."

---

## Executive Summary & Design Vision

In high-density enterprise software, users encounter edge scenarios continuously: networks drop, sessions expire while drafting long reviews, forms fail validation, queries return zero matches, and background APIs fail. Generic spinners or blank screens degrade user trust and increase administrative overhead.

This specification institutes an application-wide, standardized **10 UI States Design System** built on top of our **Forest & Emerald craft aesthetic**:
- **Palette & Tokens**: Light surface `#FFFFFF` with `#EAECF0` borders; Dark surface `#111D17` with `#1A3125` hairline borders; Primary accent Emerald `#00C471`; Warning Amber `#F59E0B`; Destructive Rose `#EF4444`.
- **Modals & Overlays**: Where disruptive actions occur (Session Expiry, Fatal Error Recovery, Permission Escalation, High-Stakes Confirmation), dedicated accessible dialogs (`role="dialog"`, keyboard `Esc` escape, focus-trap) guide the user safely.
- **Data Protection & Draft Recovery**: Forms automatically snapshot draft changes into `localStorage` before session logouts to eliminate data loss.
- **Zero Layout Shift (CLS)**: Skeletons mimic exact incoming component geometry.

---

## User Scenarios & Testing *(Prioritized)*

### User Story 1 (P1) - Empty States & Data-Entry Onboarding (State 1)
**Journey**: When an administrator or employee visits any list, table, or card collection that has zero records (e.g., brand-new system without employees, no loan applications, empty expense claim queue, no assets assigned), the UI must explicitly state what is empty, explain why it is empty, and provide exactly one prominent call-to-action button to initiate the first entry.

**Why this priority**: Prevents user disorientation upon initial rollout or after clearing filters. Ensures immediate velocity for new users.

**Independent Test**:
- Open `DataTable` or page container with empty array `[]`.
- Verify an icon, descriptive title ("No Employees Added Yet"), concise context ("Your organization directory has no active employee records"), and a clear button ("+ Add First Employee") render instead of an empty box.

**Acceptance Scenarios**:
1. **Given** an empty table or list, **When** data resolves with 0 records, **Then** `<EmptyState />` displays stating the entity name, reassurance, and 1 primary next step.
2. **Given** an empty state action button, **When** clicked, **Then** it triggers the corresponding creation modal or routes to the creation flow.

---

### User Story 2 (P1) - Error States & Root-Cause Attribution (State 3)
**Journey**: When a network query, calculation mutation, or background process fails (e.g. 500 Internal Server Error, 400 Bad Request, 503 Service Unavailable), the interface must not present cryptic technical stack traces or generic "An error occurred". It must clearly communicate:
1. **What went wrong**: Plain English description of the failure.
2. **Whose fault/domain it is**: System/Server, Third-Party Gateway, or Input/Client.
3. **How to fix it**: Concrete instructions (e.g., "Retry in a few moments", "Check network connection", "Contact HR Admin with Error ID: #ERR-8291").
4. Provide a Retry button and a Return Home/Back button.

**Why this priority**: Reduces support tickets and confusion by pinpointing responsible components and offering one-click retry.

**Independent Test**:
- Simulate API failure (mock 500 error or disconnect backend).
- Verify the `<ErrorState />` or `<ErrorModal />` specifies the fault attribution, actionable steps, and a working retry mechanism.

**Acceptance Scenarios**:
1. **Given** an API failure, **When** the component renders, **Then** the error state specifies: (a) what happened, (b) fault attribution, and (c) instructions to fix.
2. **Given** a fatal page-level crash, **When** caught by `<ErrorBoundary />`, **Then** the fallback displays actionable recovery controls without unmounting the entire navigation shell.

---

### User Story 3 (P1) - No Search Results & Typo Suggestions (State 6)
**Journey**: When a user filters or searches across tables (Employees, Audit Logs, Projects, Expenses, Payroll Runs) and no rows match the query, the UI must distinguish between an empty collection and a zero-search outcome. It must display the searched string, run a fuzzy/typo-tolerance check to suggest the closest match (e.g. "Did you mean 'Engineering'?"), and provide a "Clear Search" button to restore all records in one click.

**Why this priority**: Saves users from dead ends when simple spelling mistakes or leftover filter inputs hide critical records.

**Independent Test**:
- Search for "Enginering" in the Department or Employee list.
- Verify the message shows: "No records found matching 'Enginering'. Did you mean 'Engineering'? [Apply Suggestion] [Clear Search]".

**Acceptance Scenarios**:
1. **Given** a search term with 0 matches, **When** evaluated, **Then** `<NoSearchResults />` displays the queried term and a "Clear Filters" button.
2. **Given** a near-match typo, **When** detected, **Then** the closest candidate is suggested with a one-click apply button.

---

### User Story 4 (P1) - Session Expired & Draft Preservation Modal (State 8)
**Journey**: When an employee or manager is drafting a lengthy performance appraisal, incident report, or salary revision and their JWT access/refresh token expires (or 401 Unauthorized is returned), the system MUST NOT silently kick them to `/login` wiping out their unsaved form work. Instead, it must snapshot the active form inputs into secure browser storage (`localStorage` key `hrm_draft_recovery_*`), trigger a clean `<SessionExpiredModal />`, allow seamless re-authentication, and restore their draft upon re-login.

**Why this priority**: Prevents catastrophic data loss during lengthy managerial reviews, exit settlements, and timesheet entries.

**Independent Test**:
- Fill in fields in a multi-step form (e.g. Performance Review or Expense Claim).
- Trigger a 401 or token expiration.
- Verify the `<SessionExpiredModal />` opens, displays the message that work was saved, provides re-login controls, and restores draft content.

**Acceptance Scenarios**:
1. **Given** an expired session during an active form edit, **When** 401 is intercepted, **Then** form fields are saved to local storage and `<SessionExpiredModal />` is displayed.
2. **Given** successful re-login, **When** returning to the form, **Then** the draft is restored with an inline confirmation toast.

---

### User Story 5 (P1) - Precise Form Validation & Inline Instructions (State 9)
**Journey**: When submitting any modal or inline form (e.g., New Employee, Bank Advice, Asset Registration, Leave Request), validation errors must never be dumped as a solitary generic toast. Each offending field must be immediately highlighted with a hairline red border (`#EF4444`), an alert icon, and clear instructional text directly beneath the control stating exactly how to format the value (e.g. "PKR amount must be a positive integer greater than 0", "CNIC must be 13 digits without hyphens (e.g. 3520112345671)").

**Why this priority**: Eliminates form frustration and ensures data fidelity before payloads reach the backend.

**Independent Test**:
- Submit invalid data on an employee registration or expense claim form.
- Verify each invalid field receives inline error styling, field-level focus, and specific instructional guidance.

**Acceptance Scenarios**:
1. **Given** an invalid form input, **When** blurred or submitted, **Then** the exact field receives red hairline highlighting and instructions beneath.
2. **Given** the user corrects the input, **When** re-typing valid data, **Then** the error state clears immediately.

---

### User Story 6 (P2) - Offline Awareness & Cached Continuity (State 4)
**Journey**: When the user loses internet connection during active usage, the application must keep all cached data on-screen rather than flashing a blank screen or broken image placeholders. A non-intrusive floating status indicator and toast must notify the user: "You are offline. Viewing cached records. Actions will sync when reconnected." When back online, an emerald toast confirms reconnection and triggers background data synchronization.

**Why this priority**: Crucial for workplace environments in emerging markets where brief internet drops or micro-outages occur frequently.

**Independent Test**:
- Toggle browser offline mode in DevTools.
- Verify the current page stays readable, the offline banner appears, and reconnecting triggers automatic refresh and toast notification.

**Acceptance Scenarios**:
1. **Given** active navigation, **When** internet drops (`offline` event), **Then** cached content remains visible and an `<OfflineBanner />` appears.
2. **Given** offline mode, **When** connection restores (`online` event), **Then** a success toast confirms re-connection and RTK Query invalidates cache tags.

---

### User Story 7 (P2) - Slow Network Detection & Lightweight Fallback (State 5)
**Journey**: When a user experiences poor network connectivity (high round-trip time > 2500ms or 2G/3G throttling), the interface must display real progress feedback (determinate or animated progress tracker) and surface a subtle status bar: "Slow connection detected. [Switch to Light Mode / Retry]".

**Why this priority**: Reassures users on slow connections that the app has not frozen, preventing duplicate clicks and rage-refreshes.

**Independent Test**:
- Throttling connection to "Slow 3G" in DevTools.
- Verify progress indicator remains visible and slow connection advisory bar offers a streamlined path.

**Acceptance Scenarios**:
1. **Given** latency exceeding 2500ms on a pending query, **When** threshold is reached, **Then** a progress bar and slow network toast appear.

---

### User Story 8 (P2) - Permission Denied & Contextual Escalation (State 7)
**Journey**: When a user navigates to a protected route or attempts an action restricted by PBAC rules (e.g., regular employee accessing `/payroll/runs` or attempting to approve their own loan), the system must not display a raw 403 error. It must show `<PermissionDeniedState />` or `<PermissionDeniedModal />` that explains:
1. What permission is required (`payroll.run.read`, `loan.approve`).
2. Why the current role lacks this permission.
3. A safe way back ("Return to Dashboard").
4. An option to "Request Access" from their Department Head or Super Admin.

**Why this priority**: Prevents user alienation, reinforces enterprise PBAC hierarchy, and gives clear pathways for permission resolution.

**Independent Test**:
- Log in as Employee and visit `/payroll/runs` or trigger an admin modal.
- Verify clear explanation of missing permission, allowed roles, and a "Return to Dashboard" action.

**Acceptance Scenarios**:
1. **Given** an unauthorized attempt, **When** caught by route guard or API 403, **Then** `<PermissionDeniedState />` renders with permission requirements and a return route.

---

### User Story 9 (P2) - Success States with Reassurance & Next Steps (State 10)
**Journey**: Upon successful completion of major actions (e.g. submitting expense claim, creating payroll run, approving leave, registering an asset), the system must not simply close the modal and leave the user wondering if it worked. It must present a dedicated `<SuccessState />` or `<SuccessModal />` that:
1. **Confirms**: "Expense Claim #EXP-2026-089 Submitted".
2. **Reassures**: "All receipt proofs securely archived. Manager notified via email and in-app alert."
3. **Shows what happens next**: Step-by-step pipeline preview ("1. Manager Review (48h SLA) -> 2. HR Audit -> 3. Reimbursement Disbursement").
4. **Offers Next Actions**: [View Submitted Claim] [Submit Another Expense].

**Why this priority**: Delivers enterprise-grade polish and removes ambiguity for staff and management.

**Independent Test**:
- Complete an action (e.g., submit leave request or expense claim).
- Verify the success confirmation details what was created, what the pipeline does next, and provides direct navigational next steps.

**Acceptance Scenarios**:
1. **Given** a successful mutation, **When** finished, **Then** a confirmation dialog or embedded state details the outcome and upcoming workflow steps.

---

### User Story 10 (P3) - Loading Skeletons Geometry Alignment (State 2)
**Journey**: Audit all UI modules to verify that `<ScreenSkeleton />` shapes precisely match the final content geometry (table columns, card grids, metric blocks) rather than displaying generic bouncing spinners.

**Why this priority**: Eliminates Cumulative Layout Shift (CLS) and makes the UI feel instantly responsive.

**Independent Test**:
- Inspect all primary screens during initial fetch and ensure no raw spinners replace content blocks.

---

## Architecture & System Design Requirements

### Functional Requirements

- **FR-001 (Empty State System)**: System MUST provide `<EmptyState />` component accepting `icon`, `title`, `description`, `action` (`{ label, onClick, href }`), and `variant`. All table empty states in `DataTable.jsx` MUST invoke this component.
- **FR-002 (Loading Skeleton System)**: System MUST provide structured skeletons (`ScreenSkeleton`, `TableSkeleton`, `CardSkeleton`, `ProfileSkeleton`, `MatrixSkeleton`). Solitary full-screen spinners for page content are strictly forbidden.
- **FR-003 (Error State & Attribution System)**: System MUST categorize errors into `client`, `server`, `network`, `auth`, or `gateway`, displaying the responsible domain, concise explanation, and next steps with retry buttons.
- **FR-004 (Offline & Connectivity Provider)**: System MUST maintain an `OfflineProvider` listening to `window.online` and `window.offline`. It MUST render `<OfflineBanner />` without unmounting cached views.
- **FR-005 (Slow Network Indicator)**: System MUST detect pending request latency > 2500ms and present an animated top progress telemetry bar and retry/minimal prompt.
- **FR-006 (Search & Typo Matcher)**: System MUST integrate typo detection into `DataTable.jsx` and search bars. If a query yields 0 results, it MUST compute Levenshtein distance against available categories/entities and propose "Did you mean '{suggestion}'?" with a "Clear Search" button.
- **FR-007 (PBAC Permission Denied)**: System MUST render `<PermissionDeniedState />` on 403 responses or `<Can>` failure, stating the exact permission key missing, why it is restricted, and a button to return to `/dashboard`.
- **FR-008 (Session Expiry & Draft Safeguard)**: When receiving a 401 response while user has unsubmitted input in forms, system MUST serialize form state to `localStorage.setItem('hrm_draft_recovery_' + key, ...)` and display `<SessionExpiredModal />`.
- **FR-009 (Standardized Form Validation)**: System MUST provide `<FormField />` wrapping inputs with accessible `aria-invalid`, `aria-describedby`, red hairline borders (`#EF4444`), error icon, and actionable instructions.
- **FR-010 (Success Reassurance Modals)**: System MUST provide `<SuccessModal />` and `<SuccessState />` components displaying confirmation checkmark, recorded ID, downstream next steps (e.g. approval stages), and primary/secondary CTAs.

---

## Measurable Success Criteria

- **SC-001**: 100% of tables and list views across the entire platform render `<EmptyState />` with a direct call-to-action when collection is empty.
- **SC-002**: 100% of search inputs across all modules display `<NoSearchResults />` with a "Clear Filters" button when matching 0 records.
- **SC-003**: Zero form data is lost upon session timeout; active form state is restored upon re-login in 100% of test scenarios.
- **SC-004**: 100% of form validation errors include inline instructions placed directly beneath the offending input.
- **SC-005**: Offline mode maintains cached UI without blanking or unmounting existing tables/cards.
- **SC-006**: Complete Vite build passes with exit code 0 and zero lint or type errors.

---

## Assumptions & Boundaries

1. **Storage Mechanism for Drafts**: Local drafts are stored in `window.localStorage` encrypted/encoded with the active user ID and scoped per form URL to prevent cross-account contamination.
2. **Design Alignment**: All components strictly follow `DESIGN.md` (Forest & Emerald craft theme, hairline borders `#EAECF0` / `#1A3125`, emerald `#00C471`).
3. **No Third-Party Bloat**: Implementation will rely on native DOM APIs (`navigator.onLine`, `localStorage`), Tailwind CSS, and Lucide icons without introducing heavy external modal or animation libraries.

