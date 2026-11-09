# Tasks: M21 — Anonymous Feedback & Grievance

## Overview
- **Spec Directory**: `.specify/specs/26-anonymous-feedback-grievance/`
- **Source of Truth**: `docs/BUILD-GUIDE.md` Section 28 (Rows 21.1 to 21.6), `docs/FRD.md` Sections 9 & 11
- **Order of Execution**: Foundation $\rightarrow$ Vertical slices (P1 rows first, then P2) $\rightarrow$ E2E Multi-Role Verification

---

## Phase 0: Foundation, Permissions & Seeds
- [x] 0.1-PERM Register `feedback.submit`, `feedback.manage`, `grievance.committee`, and `feedback.escalate` permissions in `backend/src/shared/permissions.js`
- [x] 0.2-ROLE Update `backend/src/seed/roles.seed.js` with permission assignments across all 4 roles (Super Admin: full, HR Manager: manage/escalate, Dept Manager: submit own only, Employee: submit own only)
- [x] 0.3-TAG Add `Feedback` tag type to `frontend/src/lib/baseApi.js`

---

## Slice 1: Row 21.1 — Gumnaam Mashwara & Suggestions (P1)
- [x] 21.1-BE Create `backend/src/models/feedback.model.js` with schema validation, `trackingCode` unique index, `isAnonymous` flag, and null `submittedBy` invariant
- [x] 21.1-BE Implement Zod `submitFeedbackSchema` in `backend/src/modules/feedback/feedback.validation.js`
- [x] 21.1-BE Implement `submitFeedback` in `feedback.service.js` using Node.js `crypto` for tracking code generation and enforcing zero author trace on anonymous feedback
- [x] 21.1-BE Create `feedback.controller.js` and mount `POST /api/v1/feedback` in `feedback.routes.js` and `backend/src/app.js`
- [x] 21.1-FE Create RTK Query hook `useSubmitFeedbackMutation` in `frontend/src/features/feedback/feedbackApi.js`
- [x] 21.1-FE Create `frontend/src/features/feedback/pages/SubmitFeedbackPage.jsx` with category picker, anonymous toggle, and tracking code confirmation dialog
- [x] 21.1-FE Mount route `/feedback/submit` in `frontend/src/App.jsx` and add navigation in `frontend/src/components/layout/Sidebar.jsx`
- [x] 21.1-TEST Add Vitest test in `backend/tests/m21.feedback.test.js`: verify anonymous submission generates tracking code and has `submittedBy: null` in MongoDB

---

## Slice 2: Row 21.2 — Baqaida Shikayat + Case Tracking (P1)
- [x] 21.2-BE Implement `updateFeedbackStatusSchema` and `addCaseNoteSchema` in `feedback.validation.js`
- [x] 21.2-BE Implement `getFeedbackList`, `getFeedbackById`, `updateStatus`, and `addCaseNote` in `feedback.service.js` with case notes timeline
- [x] 21.2-BE Create routes `GET /api/v1/feedback`, `GET /api/v1/feedback/:id`, `PATCH /api/v1/feedback/:id/status`, and `POST /api/v1/feedback/:id/notes` protected with `feedback.manage`
- [x] 21.2-FE Add RTK Query hooks `useGetFeedbackListQuery`, `useGetFeedbackByIdQuery`, `useUpdateFeedbackStatusMutation`, and `useAddCaseNoteMutation` in `feedbackApi.js`
- [x] 21.2-FE Create `frontend/src/features/feedback/components/CaseDetailsDrawer.jsx`, `CaseTimeline.jsx`, `CaseNotesThread.jsx`, and `StatusChangeModal.jsx`
- [x] 21.2-FE Create `frontend/src/features/feedback/pages/GrievanceAdminPage.jsx` with status tabs, filter by priority/category, and case drawer
- [x] 21.2-FE Mount route `/feedback/admin` in `frontend/src/App.jsx` and add sidebar entry protected by `<Can I="feedback.manage">`
- [x] 21.2-TEST Add Vitest test: verify case status transitions (`Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Resolved`) and internal vs public notes recording

---

## Slice 3: Row 21.3 — Harassment -> Sirf Committee (P1)
- [x] 21.3-BE Implement Harassment quarantine filter in `feedback.service.js`: automatically inject `{ category: { $ne: 'Harassment' } }` for any caller without `grievance.committee` permission or Super Admin
- [x] 21.3-BE Enforce 403 Forbidden in `getFeedbackById` if non-committee HR attempts to access a Harassment case
- [x] 21.3-FE Create `frontend/src/features/feedback/pages/CommitteeDashboardPage.jsx` dedicated to reviewing quarantined Harassment complaints
- [x] 21.3-FE Mount route `/feedback/committee` in `frontend/src/App.jsx` and add sidebar navigation protected by `<Can I="grievance.committee">`
- [x] 21.3-TEST Add Vitest test in `backend/tests/m21.feedback.security.test.js`: verify regular HR Manager query hides harassment complaints and direct ID access returns 403

---

## Slice 4: Row 21.4 — Gumnaam Status Update Lookup (P1)
- [x] 21.4-BE Implement `getTrackedFeedbackByCode` in `feedback.service.js`: queries by `trackingCode`, sanitizes output, filters out private case notes (`isPublicToComplainant: false`), and returns public timeline
- [x] 21.4-BE Mount public route `GET /api/v1/feedback/track/:code` without requiring session token
- [x] 21.4-FE Add RTK Query hook `useGetTrackedFeedbackQuery` in `feedbackApi.js`
- [x] 21.4-FE Create `frontend/src/features/feedback/pages/TrackFeedbackPage.jsx` with code search input, progress stepper, and public investigator responses
- [x] 21.4-FE Mount route `/feedback/track` in `frontend/src/App.jsx` and add sidebar link
- [x] 21.4-TEST Add Vitest test: verify tracking code returns sanitized timeline and rejects invalid/non-existent code with HTTP 404

---

## Slice 5: Row 21.6 — Department Manager Isolation Rule (P1)
- [x] 21.6-BE Verify and enforce `None` access for Department Manager role across all `/api/v1/feedback` management endpoints
- [x] 21.6-FE Ensure `Sidebar.jsx` hides Grievance Admin and Committee menus from Department Managers
- [x] 21.6-TEST Add Vitest security test: verify Department Manager token receives HTTP 403 on `GET /api/v1/feedback`, `PATCH /api/v1/feedback/:id/status`, and `POST /api/v1/feedback/:id/notes`

---

## Slice 6: Row 21.5 — Escalation to Super Admin (P2)
- [x] 21.5-BE Implement `escalateFeedbackSchema` in `feedback.validation.js`
- [x] 21.5-BE Implement `escalateFeedback` in `feedback.service.js` setting `isEscalated: true`, recording reason, and dispatching notification to Super Admin
- [x] 21.5-BE Mount route `PATCH /api/v1/feedback/:id/escalate` protected by `feedback.escalate`
- [x] 21.5-FE Create `frontend/src/features/feedback/components/EscalateModal.jsx` and trigger button in `CaseDetailsDrawer.jsx`
- [x] 21.5-FE Add "Escalated Cases" filter tab in `GrievanceAdminPage.jsx`
- [x] 21.5-TEST Add Vitest test: verify case status transitions to `Escalated`, records reason, and alerts Super Admin

---

## Phase 7: Seed Data & Multi-Role Playwright E2E Verification
- [x] 7.1-SEED Create `backend/src/seed/m21.seed.js` seeding diverse cases (anonymous suggestions, open grievances, quarantined harassment complaints, and resolved cases)
- [x] 7.2-BUILD Verify frontend production build `npm --prefix frontend run build` completes with 0 errors
- [x] 7.3-E2E Module M21 end-to-end Playwright test, chaaron roles se (Super Admin, HR Manager, Department Manager, Employee) + 390px mobile viewport
