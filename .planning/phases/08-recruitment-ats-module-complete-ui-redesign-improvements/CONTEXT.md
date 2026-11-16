# Phase 8: Recruitment & ATS Module – Complete UI Redesign & Improvements (Context)

## Executive Summary
Phase 8 delivers an enterprise-grade UI redesign and craft overhaul of the Recruitment & ATS Module (Module M15). The goal is a pixel-perfect, modern, and accessible user experience matching the **Forest & Emerald** design system (`DESIGN.md` and `docs/UI-REFERENCE.md`), backed by robust PBAC/RBAC permissions (`recruitment.job.view`, `recruitment.job.manage`, `recruitment.candidate.view`, `recruitment.candidate.stage`, `recruitment.referral.submit`, etc.), full active/archive lifecycle management for job openings, and streamlined workflows across internal and public candidate portals.

---

## Governing Documentation & Invariants
1. `docs/BUILD-GUIDE.md` Section 24 (Module M15 Recruitment & AI Screening, Rows 15.1 – 15.13).
2. `DESIGN.md` & `docs/UI-REFERENCE.md`:
   - Primary Emerald: `#00C471`, hover `#049856`.
   - Dark Surfaces: Background `#061A14` / `#0B1511`, Cards/Drawers `#111D17`, Borders `#1A3125`.
   - Light Surfaces: Background `#F8FAFC`, Cards `#FFFFFF`, Borders `#EAECF0`.
   - High-density semantic tables, tabular numbers, badge status pills.
3. `docs/PBAC.md` & `docs/RBAC.md`:
   - Enforce permission gates for every action (e.g. `recruitment.job.manage`, `recruitment.candidate.stage`, `recruitment.hire`).
   - Hide unauthorized action buttons and controls in the frontend using CASL `Can` components.

---

## Detailed Scope by Section

### 1. Job Opening Page (`/recruitment/jobs`)
- Redesign internal jobs console with top-level tabs for **Active Openings** and **Archived Openings**.
- Unified toolbar with search, department filter, employment type filter, status pills (`Draft`, `Published`, `Closed`), and action buttons (`+ Create Requisition` / `+ New Job`).
- Create `JobArchiveDetailModal.jsx` for archived jobs with metadata, department, salary disclosure, and action controls:
  - **Revert:** Restores the archived job back to Active (`isDeleted: false`, status `Draft`).
  - **Permanent Delete:** Hard-deletes from DB with safety check (verifies no active candidates attached).
- Redesign requisition decision cards/accordions for Super Admin approval workflows.

### 2. Public Career Portal (`/careers` and `/careers/:slug/apply`)
- Redesign `CareersPublicPage.jsx`:
  - Modern, responsive public hero with clean typography, search, and category pills.
  - Job card listing with clear badges (Department, Location, Employment Type, Salary if disclosed).
  - Quick view job drawer or expandable details view.
- Redesign `ApplyPage.jsx`:
  - Elegant candidate application form with drag-and-drop resume upload zone (PDF, DOC, DOCX up to 5MB).
  - Validation feedback and success confirmation view.

### 3. Candidate Pipeline (`/recruitment/candidates`)
- Redesign `CandidatePipelinePage.jsx`:
  - Visual Kanban pipeline with stages: `Applied` -> `Shortlisted` -> `Interview` -> `Technical_Test` -> `Offer` -> `Hired` (plus `Rejected`).
  - Candidate cards showing AI match score badge (`AIScreeningBadge.jsx`), applicant details, and stage move actions.
  - Integration with `CandidateDetailModal.jsx`, `InterviewScheduleModal.jsx`, `ScorecardModal.jsx`, and `OfferLetterModal.jsx`.

### 4. Internal Jobs & Employee Referrals (`/recruitment/internal`)
- Redesign `InternalJobsPage.jsx`:
  - Clean tab switcher between **Internal Openings** and **My Referrals**.
  - Modern referral cards and submission modal (`EmployeeReferralModal.jsx`).
  - Status indicators for submitted referrals with referral bonus badges.
