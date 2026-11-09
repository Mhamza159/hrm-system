# Feature Specification: M21 — Anonymous Feedback & Grievance

## 1. Metadata
- **Module ID**: M21
- **Module Name**: Anonymous Feedback & Grievance
- **Phase**: Phase 4 — Engagement & Polish (Sprint 17)
- **Spec Directory**: `.specify/specs/26-anonymous-feedback-grievance/`
- **Target Route Root**: `/api/v1/feedback`
- **Frontend Route Roots**: `/feedback/submit`, `/feedback/track`, `/feedback/admin`, `/feedback/committee`

---

## 2. Sources of Truth & Regulatory Contracts
1. **docs/FRD.md Section 9 (M21)**:
   - Anonymous suggestion box & open feedback channel.
   - Formal grievance submission with lifecycle case tracking (`Submitted`, `Under Review`, `In Investigation`, `Resolved`, `Dismissed`, `Escalated`).
   - Dedicated Harassment complaint channel routed strictly to the designated Inquiry Committee.
   - Status updates accessible to the complainant via confidential tracking code without revealing identity.
   - Role-wise access:
     - **Super Admin**: View all cases, manage escalated grievances.
     - **HR Manager**: Handle and resolve non-harassment grievances; manage suggestion box.
     - **Inquiry Committee (`grievance.committee`)**: Exclusive access to Harassment category cases.
     - **Department Manager**: **No access** to grievances regarding their own department or team (`None` in permission matrix; HTTP 403).
     - **Employee**: Submit anonymously or by name, track own cases via tracking code or dashboard.
2. **docs/FRD.md Section 11 (Permission Matrix)**:
   - `M21 Feedback & Grievance`:
     - Super Admin: **Full**
     - HR Manager: **Manage**
     - Department Manager: **None** (strict 403 Forbidden)
     - Employee: **Own**
3. **docs/BUILD-GUIDE.md Section 28 (Rows 21.1 to 21.6)**:
   - `21.1`: Gumnaam mashwara (`feedback.model.js`: `isAnonymous` -> `userId` never saved, random `trackingCode` issued)
   - `21.2`: Baqaida shikayat + case tracking (`category`, `status`, `caseNotes[]`, severity)
   - `21.3`: Harassment -> sirf committee (permission `grievance.committee`, segregated view, hidden from regular HR/manager)
   - `21.4`: Gumnaam status update (`GET /feedback/track/:code`, public/authenticated tracking page)
   - `21.5`: Escalation (`PATCH /feedback/:id/escalate` -> Super Admin escalation flag & notifications)
   - `21.6`: Manager apni team ki shikayat na dekhe (scope rule: Department Managers blocked with 403)

---

## 3. Official Documentation & Syntax Patterns (Context7 & Node.js stdlib)

### A. Zod Validation Patterns (`/colinhacks/zod`)
```javascript
import { z } from 'zod';

export const submitFeedbackSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150, 'Title cannot exceed 150 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(3000, 'Description cannot exceed 3000 characters'),
  category: z.enum(['Suggestion', 'Grievance', 'Workplace Issue', 'Harassment', 'Safety', 'Other']),
  isAnonymous: z.boolean().default(false),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional().nullable(),
  attachments: z.array(z.string().url('Invalid attachment URL')).max(5).optional().default([])
});

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(['Submitted', 'Under Review', 'In Investigation', 'Resolved', 'Dismissed', 'Escalated']),
  resolutionNote: z.string().trim().max(2000).optional()
});

export const addCaseNoteSchema = z.object({
  note: z.string().trim().min(2, 'Note cannot be empty').max(2000),
  isPublicToComplainant: z.boolean().default(true)
});

export const escalateFeedbackSchema = z.object({
  reason: z.string().trim().min(5, 'Escalation reason is required').max(1000)
});
```

### B. Node.js `crypto` Tracking Code Generation
```javascript
import crypto from 'node:crypto';

// Generates human-friendly collision-resistant tracking codes: e.g. "TRK-A8F2C9"
export function generateTrackingCode() {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TRK-${bytes}`;
}
```

### C. Redux Toolkit Query Patterns (`/reduxjs/redux-toolkit`)
```javascript
import { baseApi } from '../../lib/baseApi';

export const feedbackApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFeedbackList: build.query({
      query: (params) => ({
        url: '/feedback',
        params
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [...result.data.items.map(({ _id }) => ({ type: 'Feedback', id: _id })), { type: 'Feedback', id: 'LIST' }]
          : [{ type: 'Feedback', id: 'LIST' }]
    }),
    getTrackedFeedback: build.query({
      query: (trackingCode) => `/feedback/track/${trackingCode}`,
      providesTags: (result, error, code) => [{ type: 'Feedback', id: code }]
    }),
    submitFeedback: build.mutation({
      query: (body) => ({
        url: '/feedback',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Feedback', id: 'LIST' }]
    }),
    updateFeedbackStatus: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/feedback/${id}/status`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Feedback', id }, { type: 'Feedback', id: 'LIST' }]
    }),
    addCaseNote: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/feedback/${id}/notes`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Feedback', id }]
    }),
    escalateFeedback: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/feedback/${id}/escalate`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Feedback', id }, { type: 'Feedback', id: 'LIST' }]
    })
  })
});
```

---

## 4. User Stories & Acceptance Criteria (Rows 21.1 to 21.6)

### Story 21.1: Gumnaam Mashwara & Suggestions (P1)
**BUILD-GUIDE ID**: `21.1`  
**Description**: As an employee, I want to submit feedback or suggestions completely anonymously, so that I can voice my thoughts or ideas without fear of retribution, and receive a secure tracking code.

- **Given**: An authenticated Employee or User visits the `/feedback/submit` page.
- **When**: The user selects `isAnonymous: true`, enters category `Suggestion` or `Workplace Issue`, enters a title and description, and submits the form.
- **Then**:
  - The backend generates a unique `trackingCode` (e.g. `TRK-9BF10A`).
  - In MongoDB `feedback` document, `isAnonymous` is `true` and `submittedBy` / `userId` is strictly `null`.
  - The API returns HTTP 201 with `{ success: true, data: { trackingCode: "TRK-9BF10A" } }`.
  - The UI displays a clear success modal highlighting the tracking code with a 1-click copy button and a strong warning that the code is the only way to track progress.

#### Role-wise Acceptance Criteria:
- **Super Admin**: Can view all suggestions in admin dashboard; cannot see `userId` on anonymous entries because it does not exist in DB.
- **HR Manager**: Can view and manage suggestions; cannot see `userId` on anonymous entries.
- **Department Manager**: Blocked with HTTP 403 (`None` access).
- **Employee**: Can submit anonymously; does not leak employee ID, name, or email into audit logs or DB document.

---

### Story 21.2: Baqaida Shikayat + Case Tracking (P1)
**BUILD-GUIDE ID**: `21.2`  
**Description**: As an HR Manager or Super Admin, I want to manage formal grievances through a lifecycle tracker with audit notes and status updates, so that employee grievances are addressed systematically.

- **Given**: A grievance has been submitted with category `Grievance`, `Workplace Issue`, or `Safety`.
- **When**: An authorized HR Manager or Super Admin views the Grievance Admin dashboard at `/feedback/admin` and selects a case.
- **Then**:
  - They can inspect the grievance metadata, timeline, and current status (`Submitted`).
  - They can update the status to `Under Review`, `In Investigation`, `Resolved`, or `Dismissed` via `PATCH /feedback/:id/status`.
  - They can append internal case notes (`caseNotes[]`) with author, timestamp, note text, and `isPublicToComplainant` flag.
  - The update generates an entry in the case timeline and audit logs.

#### Role-wise Acceptance Criteria:
- **Super Admin**: Can view and edit any non-harassment or escalated case; full status transition permissions.
- **HR Manager**: Can view and transition statuses of non-harassment grievances.
- **Department Manager**: Blocked with HTTP 403 on `/feedback/admin` and API endpoints.
- **Employee**: Cannot access `/feedback/admin`; can only view own named submissions or track via tracking code.

---

### Story 21.3: Harassment Grievances Routed Strictly to Committee (P1)
**BUILD-GUIDE ID**: `21.3`  
**Description**: As an employee submitting a harassment complaint, I want my report to be quarantined and visible strictly to the designated Inquiry Committee (`grievance.committee`), completely hidden from regular HR Managers and Department Managers, to preserve confidentiality and legal compliance.

- **Given**: An employee submits a feedback/complaint with `category: "Harassment"`.
- **When**: The grievance is saved in MongoDB.
- **Then**:
  - The case is marked with `category: "Harassment"` and restricted visibility.
  - Regular HR Managers (without `grievance.committee` permission) query `GET /feedback` and the harassment complaint is **filtered out** of results.
  - Department Managers query `GET /feedback` and receive HTTP 403.
  - Only users possessing the `grievance.committee` permission (or Super Admin) can retrieve `GET /feedback?category=Harassment` or access `/feedback/committee`.
  - Any direct attempt by standard HR to access `GET /feedback/:id` of a Harassment case returns HTTP 403 Forbidden.

#### Role-wise Acceptance Criteria:
- **Super Admin**: Can view all cases including harassment for compliance oversight.
- **Inquiry Committee Member (`grievance.committee`)**: Can access `/feedback/committee`, inspect evidence, interview logs, and record private committee findings.
- **HR Manager (without committee role)**: Zero visibility into Harassment cases. Count queries and listing queries strictly exclude `category: "Harassment"`.
- **Department Manager**: Completely blocked (HTTP 403).
- **Employee**: Can submit harassment complaint anonymously or by name, receiving a tracking code.

---

### Story 21.4: Gumnaam Status Update Lookup (P1)
**BUILD-GUIDE ID**: `21.4`  
**Description**: As a complainant who submitted an anonymous feedback or grievance, I want to query the status of my case using only my confidential tracking code, so that I can see progress and public case notes without logging in or revealing my identity.

- **Given**: An anonymous feedback document exists with `trackingCode: "TRK-XXXXXX"`.
- **When**: Anyone navigates to `/feedback/track` and submits tracking code `TRK-XXXXXX` (via `GET /feedback/track/:code`).
- **Then**:
  - The backend returns HTTP 200 with sanitized case information:
    - `trackingCode`, `category`, `status`, `createdAt`, `updatedAt`, `resolutionNote` (if resolved).
    - Public case notes (`caseNotes.filter(n => n.isPublicToComplainant)`).
  - Private internal notes (`isPublicToComplainant: false`) are **never returned**.
  - No user identity or IP addresses are exposed.
  - If an invalid tracking code is supplied, the API returns HTTP 404 Not Found (`"No grievance found with this tracking code"`).

#### Role-wise Acceptance Criteria:
- **All Users (including unauthenticated/public)**: Can query `GET /feedback/track/:code` and receive status of matching code.
- **Employee**: Can track their case anonymously from any browser.
- **Department Manager**: Can only view status if they possess the valid tracking code, receiving the same public redacted view.

---

### Story 21.5: Grievance Escalation to Super Admin (P2)
**BUILD-GUIDE ID**: `21.5`  
**Description**: As an HR Manager or Committee Member, I want to escalate an unresolved, complex, or high-conflict grievance directly to the Super Admin, so that executive action can be taken.

- **Given**: An active grievance exists in `Submitted`, `Under Review`, or `In Investigation` status.
- **When**: An authorized HR Manager or Committee Member clicks "Escalate Case" and submits `PATCH /feedback/:id/escalate` with an escalation reason.
- **Then**:
  - The feedback status transitions to `Escalated`.
  - Field `isEscalated: true` and `escalationDetails: { escalatedBy, escalatedAt, reason }` are recorded.
  - A notification is automatically dispatched to the Super Admin (Module M8 integration).
  - The case appears prominently in the Super Admin's "Escalated Cases" queue.

#### Role-wise Acceptance Criteria:
- **Super Admin**: Receives escalation alert and has unilateral authority to resolve or reassign the case.
- **HR Manager / Committee**: Can trigger escalation when a conflict of interest or impasse occurs.
- **Department Manager**: Blocked with HTTP 403.
- **Employee**: Sees status updated to "Escalated" when tracking via tracking code.

---

### Story 21.6: Department Manager Isolation Rule (P1)
**BUILD-GUIDE ID**: `21.6`  
**Description**: As system security architects, we must enforce that Department Managers cannot inspect, track, or access grievances filed by or concerning their department team members, preventing bias, retaliation, and conflicts of interest.

- **Given**: A user authenticated with the `Department Manager` role.
- **When**: The Department Manager attempts to access any management or list route (`GET /feedback`, `GET /feedback/:id`, `PATCH /feedback/:id/status`, `POST /feedback/:id/notes`, `PATCH /feedback/:id/escalate`).
- **Then**:
  - The CASL permission guard `checkPermission('feedback', 'manage')` rejects the request with HTTP 403 Forbidden.
  - The frontend sidebar does not render the "Grievance Admin" or "Committee" navigation items for Department Managers.
  - Department Managers may only submit feedback as regular complainants or track via public tracking code.

#### Role-wise Acceptance Criteria:
- **Department Manager**: HTTP 403 on all administrative grievance endpoints.
- **Super Admin & HR Manager**: Access granted in accordance with permissions matrix.

---

## 5. Security & Invariant Checklist
1. **Zero Trace in Anonymity**: When `isAnonymous: true`, `submittedBy` must be strictly `null` in the database. No session user IDs or IP addresses may be stored in the document.
2. **Harassment Data Isolation**: Non-committee users querying feedback list must have `{ category: { $ne: 'Harassment' } }` automatically injected into the database query filter.
3. **Internal Note Redaction**: `isPublicToComplainant: false` case notes must be stripped in public track endpoints.
4. **Collision-Proof Codes**: `trackingCode` must have a unique index `{ trackingCode: 1 }` with retry on generation in the rare event of collision.
