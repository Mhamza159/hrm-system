# Feature Specification: M17 Attrition Prediction

**Module ID:** M17  
**Module Name:** Attrition Prediction  
**Phase:** Phase 3 — AI Features (Intelligence Scope)  
**Spec Directory:** `.specify/specs/24-attrition-prediction/`  
**Sources of Truth:**  
- `docs/FRD.md`: Section 8 (M17 Attrition Prediction) & Section 11 (Permission Matrix Row M17)  
- `docs/BUILD-GUIDE.md`: Section 26 (Rows 17.1 to 17.5)  
- `docs/TECH-SPEC.md`: Sections 3 (Folders), 4 (DB/Indexes), 5 (API Envelopes), 6 (PBAC/CASL Scopes)  

---

## 1. Module Overview & Value Proposition

Attrition Prediction proactively identifies flight-risk employees before resignations occur, enabling HR Managers and Department Managers to take timely retention actions. The module operates as a scheduled and on-demand analytical engine synthesizing multiple enterprise signals:
1. **Attendance & Punctuality Trends:** Rising unplanned leaves, frequent late arrivals, half-days in last 90 days.
2. **Compensation Stagnation:** Months since last salary increment (e.g. 18+ months with no revision).
3. **Appraisal & Career Growth:** Pending or delayed performance appraisals, below-average rating trajectory.
4. **Engagement & Satisfaction:** Low ratings on internal surveys or recurring grievances.
5. **Tenure & Role Dynamics:** Time in current role / designation without title change or promotion.

### Strict Confidentiality Invariant
> **CRITICAL SECURITY BARRIER:** Attrition risk scores, risk levels, and action notes are **strictly confidential**. They are never exposed to regular employees or peer staff.
> - **Super Admin:** Company-wide visibility and global job management.
> - **HR Manager:** Company-wide dashboard, retention notes, risk breakdowns, and manual re-run triggers.
> - **Department Manager:** Strictly scoped to their direct team / assigned department employees only.
> - **Employee:** **Zero access (HTTP 403 Forbidden & hidden navigation item).**

---

## 2. Technical Contracts & Context7 Verified Syntax

### 2.1 Recharts Bar & Composed Visualization Patterns
Context7 Library: `/recharts/recharts`
```jsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

<ResponsiveContainer width="100%" height={320}>
  <BarChart data={departmentStats} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
    <XAxis dataKey="departmentName" stroke="#64748b" tick={{ fontSize: 12 }} />
    <YAxis stroke="#64748b" allowDecimals={false} />
    <Tooltip
      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
    />
    <Legend wrapperStyle={{ paddingTop: 10 }} />
    <Bar dataKey="highRisk" name="High Risk" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
    <Bar dataKey="mediumRisk" name="Medium Risk" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
    <Bar dataKey="lowRisk" name="Low Risk" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
  </BarChart>
</ResponsiveContainer>
```

### 2.2 Node-Cron Job Syntax
Context7 Library: `/node-cron/node-cron`
```javascript
import cron from 'node-cron';
import { runWeeklyAttritionScoring } from '../modules/attrition/attrition.service.js';

export const initAttritionJob = () => {
  // Runs every Sunday at 00:00 AM PKT (UTC+5: Saturday 19:00 UTC)
  cron.schedule('0 0 * * 0', async () => {
    console.log('⏰ [CRON] Starting weekly Attrition Risk calculation...');
    await runWeeklyAttritionScoring();
  }, {
    timezone: 'Asia/Karachi'
  });
};
```

### 2.3 Zod API Request Validation Patterns
Context7 Library: `/colinhacks/zod`
```javascript
import { z } from 'zod';

export const getAttritionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
  riskLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(['riskScore', 'calculatedAt', 'employeeName']).default('riskScore'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const addRetentionNoteSchema = z.object({
  note: z.string().trim().min(3, 'Note must contain at least 3 characters').max(1000, 'Note cannot exceed 1000 characters'),
  actionTaken: z.enum([
    'Compensation Review',
    'One-on-One Wellness Check',
    'Career Pathing / Promotion',
    'Workload Rebalancing',
    'Performance Counseling',
    'Other'
  ]).default('One-on-One Wellness Check'),
  followUpDate: z.coerce.date().optional()
});
```

---

## 3. Detailed User Stories & Acceptance Criteria (Rows 17.1 to 17.5)

### Story 17.1 (P1): Automated & On-Demand Attrition Risk Scoring Engine
**BUILD-GUIDE Reference:** Row 17.1 · `jobs/attritionScore.job.js`, `attritionScore.model.js`  
**Description:** As an HR Manager or Super Admin, I want the system to calculate an objective attrition risk score (0–100) for all active employees weekly and on-demand, synthesizing signals across attendance, tenure, salary revision, and appraisals.

#### Scoring Algorithm & Signal Weights
Total Score $\in [0, 100]$ composed of:
1. **Attendance & Leaves Signal (Weight: 30%):**
   - High unplanned leaves (>3 days in last 30 days) $\rightarrow$ +15 pts.
   - Excessive late arrivals (>5 times in last 30 days) $\rightarrow$ +15 pts.
2. **Salary Stagnation Signal (Weight: 25%):**
   - Months since last salary revision > 18 months $\rightarrow$ +25 pts.
   - Months since last revision between 12 and 18 months $\rightarrow$ +12 pts.
3. **Appraisal & Rating Signal (Weight: 20%):**
   - Missed or overdue annual appraisal $\rightarrow$ +10 pts.
   - Latest appraisal rating below benchmark ($\le 2.5/5.0$) $\rightarrow$ +10 pts.
4. **Tenure & Promotion Signal (Weight: 15%):**
   - Same designation for > 24 months without progression $\rightarrow$ +15 pts.
5. **Survey & Grievance Signal (Weight: 10%):**
   - Negative survey sentiment or pending grievance $\rightarrow$ +10 pts.

#### Acceptance Criteria
- **Scenario 17.1-A (Scheduled Job Execution):**
  - **Given:** Active employees exist with attendance, payroll, and appraisal history.
  - **When:** Sunday 00:00 PKT cron fires.
  - **Then:** The system creates or updates `AttritionScore` records with normalized `riskScore` (0–100), `riskLevel` ('Low', 'Medium', 'High'), `topFactors` array, and `calculatedAt` timestamp.
- **Scenario 17.1-B (Role-wise API Recalculation):**
  - **Super Admin:** Can trigger `POST /api/v1/attrition/calculate` $\rightarrow$ 200 OK, full company recalculation executed.
  - **HR Manager:** Can trigger `POST /api/v1/attrition/calculate` $\rightarrow$ 200 OK, full company recalculation executed.
  - **Department Manager:** Cannot trigger company-wide calculation $\rightarrow$ 403 Forbidden.
  - **Employee:** Cannot trigger calculation $\rightarrow$ 403 Forbidden.

---

### Story 17.2 (P1): Risk Levels & Contributing Factors Dashboard
**BUILD-GUIDE Reference:** Row 17.2 · `AttritionDashboardPage.jsx`, `AttritionRiskCard.jsx`  
**Description:** As an HR Manager or Department Manager, I want a dedicated dashboard displaying employees categorized by risk tier (High, Medium, Low) along with primary contributing factors, so that I can immediately identify vulnerable talent.

#### Risk Tiers Thresholds
- **High Risk:** Score $70 - 100$ (Crimson Red badge `#ef4444`)
- **Medium Risk:** Score $40 - 69$ (Amber Yellow badge `#f59e0b`)
- **Low Risk:** Score $0 - 39$ (Emerald Green badge `#10b981`)

#### Acceptance Criteria
- **Scenario 17.2-A (Listing & Factor Breakdown):**
  - **Given:** Attrition scores exist in the database.
  - **When:** User navigates to `/attrition`.
  - **Then:** The table displays Employee ID, Name, Department, Designation, Risk Tier Badge, Risk Score gauge (0–100), Top 3 Contributing Factors badges (e.g. `Salary Stagnation (22 mos)`, `Late Arrivals (7x)`), and Last Calculated date.
- **Scenario 17.2-B (Role-wise Scope Filtering):**
  - **Super Admin:** Views all company employees across all departments. Can filter by department and risk tier.
  - **HR Manager:** Views all company employees across all departments. Can filter by department and risk tier.
  - **Department Manager:** Views **only** employees belonging to their assigned department. The department dropdown is locked/hidden. Employees of other departments are strictly filtered out at query level.
  - **Employee:** Blocked with HTTP 403. Cannot access dashboard.

---

### Story 17.3 (P1): Department Attrition Trends Analytics
**BUILD-GUIDE Reference:** Row 17.3 · `GET /api/v1/attrition/departments`, `DepartmentRiskChart.jsx`  
**Description:** As an HR Manager or Super Admin, I want to visualize department-level attrition distributions via interactive charts, so that I can pinpoint departments with systemic retention challenges.

#### Acceptance Criteria
- **Scenario 17.3-A (Analytics Aggregation):**
  - **Given:** Employee scores are recorded across multiple departments (e.g. Engineering, Sales, HR, Marketing).
  - **When:** Frontend requests `GET /api/v1/attrition/departments`.
  - **Then:** Returns aggregated array with `{ departmentId, departmentName, totalEmployees, highRiskCount, mediumRiskCount, lowRiskCount, averageRiskScore }`.
- **Scenario 17.3-B (Visualization):**
  - **Given:** Aggregated department statistics.
  - **When:** Rendered in `AttritionDashboardPage.jsx`.
  - **Then:** Recharts stacked/grouped `BarChart` renders visual distribution of risk tiers with responsive container, tooltip hover states, and color-coded bars.
- **Scenario 17.3-C (Role Scoping):**
  - **Super Admin & HR Manager:** Receive all company departments in the payload.
  - **Department Manager:** Receives data strictly for their own department.
  - **Employee:** HTTP 403 Forbidden.

---

### Story 17.4 (P2): Tailored Retention Suggestions & Action Notes Panel
**BUILD-GUIDE Reference:** Row 17.4 · `POST /api/v1/attrition/:id/notes`, `GET /api/v1/attrition/:id/notes`, `RetentionNotesPanel.jsx`  
**Description:** As an HR Manager or Department Manager, I want actionable retention suggestions generated based on identified risk drivers and the ability to log private intervention notes.

#### Rule-based Suggested Interventions
- If factor includes `Salary Stagnation` $\rightarrow$ Suggestion: *"Schedule off-cycle compensation review or market salary benchmarking."*
- If factor includes `Excessive Late Arrivals` or `Unplanned Leaves` $\rightarrow$ Suggestion: *"Conduct 1-on-1 wellness check; explore flexible shift or remote work accommodations."*
- If factor includes `Overdue Appraisal` or `Low Rating` $\rightarrow$ Suggestion: *"Expedite performance appraisal and align on 90-day growth milestones."*
- If factor includes `Tenure Stagnation` $\rightarrow$ Suggestion: *"Discuss senior title progression, lateral transfer, or project leadership opportunities."*

#### Acceptance Criteria
- **Scenario 17.4-A (Add Retention Note):**
  - **Given:** An employee with Medium or High risk score.
  - **When:** HR Manager or Dept Manager submits a note with `actionTaken` and optional `followUpDate`.
  - **Then:** Note is stored in `attritionNotes` array in `AttritionScore` with author ID, author name, timestamp, and audit trail. Returns 201 Created.
- **Scenario 17.4-B (Role Access):**
  - **Super Admin & HR Manager:** Can add and view notes for any employee.
  - **Department Manager:** Can add and view notes for employees in their own team only. Attempting to add note for an external employee returns 403.
  - **Employee:** Cannot view or add notes $\rightarrow$ 403 Forbidden.

---

### Story 17.5 (P1): Confidentiality, PBAC Permissions & UI Route Protection
**BUILD-GUIDE Reference:** Row 17.5 · `shared/permissions.js`, `Sidebar.jsx`, `App.jsx`  
**Description:** As the System Architect, I must guarantee that all attrition predictions, scores, charts, and notes are strictly confidential and impossible for regular employees to access via direct URL, DevTools, or REST endpoints.

#### Permissions Matrix (FRD Section 11)
- `ATTRITION_READ`: Super Admin (`all`), HR Manager (`all`), Department Manager (`team`), Employee (`none`).
- `ATTRITION_MANAGE`: Super Admin (`all`), HR Manager (`all`), Department Manager (`team`), Employee (`none`).

#### Acceptance Criteria
- **Scenario 17.5-A (Sidebar & Navigation):**
  - **Given:** An authenticated session.
  - **When:** User inspects the left sidebar navigation under "AI Features".
  - **Then:**
    - Super Admin, HR Manager, Department Manager see the item: `Attrition Risk` (icon: `TrendingDown` or `AlertTriangle`).
    - Employee: The menu item is **completely omitted** from the DOM.
- **Scenario 17.5-B (Route & API Defense):**
  - **Given:** An authenticated Employee attempts direct HTTP call `GET /api/v1/attrition/scores`.
  - **Then:** Backend responds with `HTTP 403 Forbidden` and `{ success: false, message: 'Access denied: Attrition prediction data is strictly confidential.' }`.
  - **Given:** An authenticated Employee types `/attrition` into the browser URL bar.
  - **Then:** React Router `<ProtectedRoute>` redirects immediately to `/unauthorized` or `/dashboard`.

---

## 4. Endpoints Summary & Permission Scopes

| HTTP Method | Route | Permission Required | Allowed Roles | Default Scope |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/attrition/scores` | `ATTRITION_READ` | Super Admin, HR Manager, Dept Manager | `all` (HR/Admin) / `team` (Manager) |
| `GET` | `/api/v1/attrition/scores/:id` | `ATTRITION_READ` | Super Admin, HR Manager, Dept Manager | `all` (HR/Admin) / `team` (Manager) |
| `POST` | `/api/v1/attrition/calculate` | `ATTRITION_MANAGE` | Super Admin, HR Manager | `all` |
| `GET` | `/api/v1/attrition/departments` | `ATTRITION_READ` | Super Admin, HR Manager, Dept Manager | `all` (HR/Admin) / `team` (Manager) |
| `POST` | `/api/v1/attrition/:id/notes` | `ATTRITION_MANAGE` | Super Admin, HR Manager, Dept Manager | `all` (HR/Admin) / `team` (Manager) |
| `GET` | `/api/v1/attrition/:id/notes` | `ATTRITION_READ` | Super Admin, HR Manager, Dept Manager | `all` (HR/Admin) / `team` (Manager) |

---

## 5. Non-Functional & Pakistan Operational Requirements

1. **Pure JavaScript:** Strictly `.js` backend, `.jsx` frontend — zero TypeScript.
2. **Timezone Accuracy:** All calculations reference UTC timestamps but format display dates in `Asia/Karachi` (PKT).
3. **Audit Trail:** Every manual recalculation and retention note creation produces an entry in `auditLogs`.
4. **Resilience & Safe Fallbacks:** If an employee lacks certain optional signals (e.g. no survey completed or newly hired < 90 days), the scoring algorithm handles missing values gracefully with default 0-point weighting without crashing.

