# Feature Specification: Module M7 — Dashboard & Reports

**Feature Branch**: `feature/11-dashboard`  
**Created**: 2026-10-21  
**Status**: Ready for Architectural Planning & Implementation  
**Module ID**: M7  
**Module Name**: Dashboard & Reports (Phase 1 · Launch Scope P1/P2)  
**Spec Folder**: `.specify/specs/11-dashboard`  
**Governing Documents**:
- [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section 4.7 (M7 Dashboard & Reports) & Section 11 (Permission Matrix M7 Row)
- [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 13 (Rows 7.1 to 7.8)
- [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) Section 1, 3, 5, 6, 8 & 11
- Context7 Official Docs: Recharts (`/websites/recharts_github_io`), ExcelJS (`/exceljs/exceljs`), PDFKit (`/websites/pdfkit_org`)

---

## 1. Executive Summary & Architecture Integration

Module M7 is the central intelligence, analytics, and operational command layer of the HRM system. It aggregates real-time transactional data across all completed Phase 1 modules:
1. **M3 (Employee Management)**: Headcount, department distributions, upcoming birthdays, probation alerts, and turnover metrics.
2. **M5 (Attendance & Shifts)**: Today's live check-ins, punctuality, active breaks, late arrivals, overtime hours, and monthly attendance distributions.
3. **M6 (Leave & Holidays)**: Employees currently on leave, upcoming holidays, leave balances, and pending multi-tier approval queues.
4. **M9 (Payroll & Pakistan Statutory Compliance)**: Total monthly payroll cost, FBR tax withholdings, EOBI/PESSI employer liabilities, and employee latest payslip access.
5. **M8 (Notifications & Announcements)**: Pinned company notice boards and real-time alerts.

Module M7 enforces strict role-based data isolation through CASL PBAC scopes (`all`, `team`, `own`). A single smart gateway page (`DashboardPage.jsx`) detects the user's active role and renders a tailored, high-density dashboard, preventing data leakage (such as payroll costs or company-wide turnover) to managers or employees.

```mermaid
flowchart TD
    subgraph Client [Frontend UI Layer (React 18 + Recharts)]
        DashPage[DashboardPage.jsx: Role Dispatcher]
        AdminView[AdminDashboard.jsx: Company Overview & Financial KPIs]
        HrView[HrDashboard.jsx: Workforce Operations & Approvals]
        MgrView[ManagerDashboard.jsx: Scoped Team Pulse & Attendance]
        EmpView[EmployeeDashboard.jsx: Personal Attendance, Slips & Balance]
        ReportsConsole[ReportsPage.jsx: Multi-Axis Reports & Export Engine]
    end

    subgraph Middleware [Auth & Security Gate]
        AuthGate[authenticate: JWT In-Memory Token]
        PermGate[checkPermission: 'dashboard.view' / 'report.view' / 'report.export']
        ScopeEnforcer[Query Scope Injector: all | team | own]
    end

    subgraph BackendServices [Backend Aggregation Engines]
        DashService[dashboard.service.js: High-Performance Aggregations]
        ReportService[report.service.js: Dynamic Multi-Axis Pipelines]
        ExcelEngine[ExcelJS: Styled Multi-Sheet Workbooks]
        PdfEngine[PDFKit: Branded Corporate PDF Tables]
    end

    subgraph DataSources [MongoDB Collections]
        ColEmp[(employees)]
        ColAtt[(attendances)]
        ColLeave[(leaves)]
        ColPay[(payrollruns / payslips)]
        ColDept[(departments)]
    end

    DashPage --> AuthGate
    ReportsConsole --> AuthGate
    AuthGate --> PermGate
    PermGate --> ScopeEnforcer
    ScopeEnforcer --> DashService
    ScopeEnforcer --> ReportService
    DashService --> DataSources
    ReportService --> DataSources
    ReportService --> ExcelEngine
    ReportService --> PdfEngine
```

---

## 2. Context7 Official Library Syntax Patterns

### 2.1 Recharts (`/websites/recharts_github_io`)
All interactive analytics charts in Module M7 use Recharts components wrapped in `ResponsiveContainer` to guarantee responsive rendering across mobile (390px), tablet, and desktop:

```javascript
import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// 1. Attendance Trend Area Chart
export function AttendanceTrendChart({ data }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
          <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 2.2 ExcelJS (`/exceljs/exceljs`)
Corporate Excel exports are generated in backend services using buffered workbooks with styled header rows, custom column widths, and proper cell types:

```javascript
import ExcelJS from 'exceljs';

export async function generateStyledReportWorkbook({ title, columns, rows }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HRM Enterprise Suite';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(title, {
    views: [{ showGridLines: true }]
  });

  // 1. Define Columns & Widths
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 20
  }));

  // 2. Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' } // Slate-900
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 26;

  // 3. Add Rows & Alternating Stripe
  rows.forEach((rowData, idx) => {
    const row = worksheet.addRow(rowData);
    if (idx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' } // Slate-50
      };
    }
    row.alignment = { vertical: 'middle' };
  });

  return await workbook.xlsx.writeBuffer();
}
```

---

## 3. RBAC & Data Visibility Matrix

Per `docs/FRD.md` Section 11 (Permission Matrix M7 Row), access permissions are mapped as follows:

| Role | Permission Name | Permitted Scope | Allowed Views & Actions |
| :--- | :--- | :---: | :--- |
| **Super Admin** | `dashboard.view`<br>`report.view`<br>`report.export` | `all` | Full company-wide KPI analytics, total payroll expenditure, organization headcount, all reports, full Excel/PDF exports. |
| **HR Manager** | `dashboard.view`<br>`report.view`<br>`report.export` | `all` | Full workforce operational dashboard, pending leave/correction approval lists, all HR reports (attendance, leaves, payroll, headcount, turnover), Excel/PDF exports. |
| **Department Manager**| `dashboard.view`<br>`report.view`<br>`report.export` | `team` | Team-scoped dashboard (team present/absent, pending team leave approvals, team overtime hours). Financials & company-wide turnover strictly omitted. |
| **Employee** | `dashboard.view`<br>`report.view`<br>`report.export` | `own` | Personal dashboard (my attendance streak, live punch status, leave quota balances, latest payslip shortcut, my assigned tasks/notices). No reports console. |

---

## 4. User Stories & Acceptance Criteria

### US-7.1: Super Admin Executive Dashboard (P1 · BUILD-GUIDE Row 7.1)
**As a** Super Admin,  
**I want to** access a consolidated high-level organizational and financial overview,  
**So that** I can assess workforce health, attendance punctuality, and payroll liabilities at a glance.

#### Acceptance Criteria (Given -> When -> Then)
* **Super Admin**:
  * **Given** an authenticated Super Admin user navigates to `/dashboard`,
  * **When** `GET /api/v1/dashboard/admin` resolves,
  * **Then** the page renders the `AdminDashboard` component with live numbers: total headcount, today's attendance breakdown (present, late, on leave, absent), monthly gross payroll expenditure (in PKR), active departments, and pending system approvals.
* **HR Manager**:
  * **Given** an authenticated HR Manager,
  * **When** accessing `/dashboard`,
  * **Then** the role dispatcher renders `HrDashboard` with operational metrics.
* **Department Manager**:
  * **Given** an authenticated Department Manager,
  * **When** attempting a direct API call to `GET /api/v1/dashboard/admin`,
  * **Then** the server responds with `403 Forbidden` (`Required scope 'all' exceeds user scope 'team'`).
* **Employee**:
  * **Given** an authenticated standard Employee,
  * **When** navigating to `/dashboard`,
  * **Then** the system automatically routes to `EmployeeDashboard` with personal stats.

---

### US-7.2: HR Manager Operational Workforce Dashboard (P1 · BUILD-GUIDE Row 7.2)
**As an** HR Manager,  
**I want an** operations-focused workspace displaying real-time workforce status and pending action queues,  
**So that** I can expedite leave requests, attendance corrections, and onboarding tasks.

#### Acceptance Criteria (Given -> When -> Then)
* **HR Manager**:
  * **Given** an authenticated HR Manager accessing `GET /api/v1/dashboard/hr`,
  * **When** the payload returns,
  * **Then** the dashboard displays:
    1. Quick Action Cards: "Pending Leave Approvals", "Pending Attendance Corrections", "Probation Reviews Due".
    2. Real-time Attendance Donut Chart: Present vs Absent vs On Leave vs Late.
    3. Today's On-Leave Staff List with leave types and dates.
    4. Upcoming Birthdays (next 14 days) and Work Anniversaries.
* **Department Manager**:
  * **Given** a Department Manager,
  * **When** attempting `GET /api/v1/dashboard/hr`,
  * **Then** the request is rejected with `403 Forbidden`.
* **Super Admin**:
  * **Given** a Super Admin,
  * **When** toggling or viewing HR operations,
  * **Then** full access is permitted.

---

### US-7.3: Department Manager Team Overview Dashboard (P1 · BUILD-GUIDE Row 7.3)
**As a** Department Manager,  
**I want to** view a team-specific dashboard showing only my direct and indirect reports,  
**So that** I can monitor daily team availability and approve team requests without seeing unauthorized salary or company data.

#### Acceptance Criteria (Given -> When -> Then)
* **Department Manager**:
  * **Given** an authenticated Department Manager who leads a department or team,
  * **When** requesting `GET /api/v1/dashboard/manager`,
  * **Then** the service queries only employees where `departmentId` matches the manager's assigned department or `reportingTo` matches the manager's employee ID.
  * **Then** the dashboard displays: Team Headcount, Today's Team In-Office / Remote / Absent, Pending Team Leave Approvals, and Approved Overtime Hours (with salary numbers completely redacted).
* **Cross-Department Leak Guard**:
  * **Given** Manager of "Engineering",
  * **When** loading the manager dashboard,
  * **Then** employees belonging to "Design" or "Marketing" do NOT appear in any team widget.
* **Employee**:
  * **Given** an employee without a managerial role,
  * **When** requesting `GET /api/v1/dashboard/manager`,
  * **Then** the server returns `403 Forbidden`.

---

### US-7.4: Employee Personal Self-Service Dashboard (P1 · BUILD-GUIDE Row 7.4)
**As an** Employee,  
**I want a** personalized self-service dashboard,  
**So that** I can track my daily punch status, remaining leave balance, latest payslip, and pinned notices.

#### Acceptance Criteria (Given -> When -> Then)
* **Employee**:
  * **Given** an authenticated Employee accessing `/dashboard`,
  * **When** `GET /api/v1/dashboard/employee` executes,
  * **Then** the UI renders:
    1. **Today's Attendance Punch Card**: Current status (Not Checked In / In Office / On Break), check-in timestamp, and quick "Check In / Out" shortcut button.
    2. **Leave Balance Cards**: Annual, Casual, Sick leaves (remaining vs allocated).
    3. **Latest Payslip Summary Card**: Month, net payout (formatted in PKR), and direct link to download PDF.
    4. **Pinned Notice Board**: Company-wide announcements pinned via Module M8.
* **Data Isolation**:
  * **Given** Employee A,
  * **When** viewing the dashboard,
  * **Then** no other employee's attendance, leave, or payslip data is exposed in network payloads or DOM elements.

---

### US-7.5: Modular KPI Widgets & Interactive Charts (P1 · BUILD-GUIDE Row 7.5)
**As an** Administrator or Manager,  
**I want** reusable, high-performance KPI stat cards and charts,  
**So that** metrics are presented consistently, cleanly, and responsively across all dashboard views.

#### Acceptance Criteria (Given -> When -> Then)
* **Components Built**:
  1. `StatCard.jsx`: Metric value, label, trend icon (+/- % from last month), and colored accent banner.
  2. `AttendanceChart.jsx`: Recharts 7-day attendance trend area chart.
  3. `PendingList.jsx`: Tabbed action list of pending approvals with direct "Review" links.
  4. `BirthdaysCard.jsx`: Upcoming celebrations list with employee avatar and date.
* **Visual Standards**:
  * **Given** viewing on a 390px mobile viewport,
  * **When** the widgets render,
  * **Then** grid layouts automatically collapse to 1 column without horizontal overflow or overlapping text.
  * **Then** all charts use `ResponsiveContainer` and adapt cleanly.

---

### US-7.6: Multi-Axis Organizational Reports Console (P1 · BUILD-GUIDE Row 7.6)
**As an** HR Manager or Super Admin,  
**I want a** dedicated reporting console offering 6 core organizational reports,  
**So that** I can analyze historical trends and compliance data.

#### Core Reports Supported (`GET /api/v1/reports/:type`):
1. **Attendance Report (`attendance`)**: Employee code, name, department, date, check-in, check-out, work hours, status (Present, Late, Absent, Half-Day).
2. **Leave Utilization Report (`leave`)**: Employee, leave type, from/to dates, total days, approval status, approved by.
3. **Payroll Summary Report (`payroll`)**: Month, total gross, FBR tax, EOBI, PESSI, net payable, payment status.
4. **Headcount & Demographics Report (`headcount`)**: Department, designation, gender, employment status, joining dates.
5. **Turnover & Attrition Report (`turnover`)**: Hires vs exits per month, termination/resignation reasons, average tenure.
6. **Departmental Cost Report (`department-cost`)**: Department-wise payroll and compensation distributions.

#### Acceptance Criteria (Given -> When -> Then)
* **HR Manager & Super Admin**:
  * **Given** user holds `report.view` with scope `all`,
  * **When** selecting any of the 6 report types on `/reports`,
  * **Then** the server aggregates and returns paginated tabular data matching the selected date range.
* **Department Manager**:
  * **Given** user holds `report.view` with scope `team`,
  * **When** viewing reports,
  * **Then** only team records for `attendance` and `leave` are accessible. Access to `payroll`, `turnover`, and `department-cost` returns `403 Forbidden`.
* **Employee**:
  * **Given** a standard employee,
  * **When** navigating to `/reports`,
  * **Then** the page redirects or denies access with a 403 screen.

---

### US-7.7: Dynamic Multi-Parameter Report Filter Toolbar (P2 · BUILD-GUIDE Row 7.7)
**As an** HR Analyst or Administrator,  
**I want to** filter reports by date range, department, and individual employee,  
**So that** I can isolate specific cohorts for auditing and decision making.

#### Acceptance Criteria (Given -> When -> Then)
* **Filter Toolbar Features**:
  1. Date Range Picker (`from` and `to` dates, with quick presets: "This Month", "Last Month", "This Quarter", "Year to Date").
  2. Department Selector dropdown (populated from Module M4).
  3. Employee Search input (debounced autocomplete).
* **Validation & Edge Cases**:
  * **Given** an invalid date range where `from > to`,
  * **When** the user clicks "Apply Filters",
  * **Then** the UI displays an inline validation message and blocks request dispatch.
* **Scope Injection**:
  * **Given** a Department Manager applying filters,
  * **Then** the department selector is locked to their assigned department, preventing cross-department queries.

---

### US-7.8: Streaming Multi-Format Excel & PDF Report Exporter (P2 · BUILD-GUIDE Row 7.8)
**As an** HR Manager or Super Admin,  
**I want to** export any generated report to styled Microsoft Excel (`.xlsx`) or PDF (`.pdf`),  
**So that** I can share compliance records with executive leadership and external auditors.

#### Acceptance Criteria (Given -> When -> Then)
* **Backend Streaming**:
  * **Given** an authorized user clicks "Export to Excel",
  * **When** `GET /api/v1/reports/:type?format=xlsx` is requested with active filter query params,
  * **Then** the server streams an Excel file with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `Content-Disposition: attachment; filename="<ReportName>_<YYYY-MM-DD>.xlsx"`.
  * **Then** the worksheet features dark-slate header styling, frozen top row, alternating row striping, and auto-fit column widths.
* **PDF Streaming**:
  * **Given** user clicks "Export to PDF",
  * **When** `GET /api/v1/reports/:type?format=pdf` is requested,
  * **Then** the server returns `application/pdf` with company branding, header, generated timestamp, and clean tabular layout.
* **Redux Token & Session Auth**:
  * **Given** direct binary downloads,
  * **When** the download trigger fires,
  * **Then** the request securely transmits the in-memory Redux `accessToken` and `credentials: 'include'`.
* **Export Audit**:
  * **Given** any report export is completed,
  * **Then** an entry is logged in `auditLogs` recording the user, report type, filter parameters, and timestamp.

---

## 5. Security & Data Protection Specifications

1. **Role Scoping at Route Level**:
   * Administrative endpoints (`/dashboard/admin`, `/reports/payroll`, `/reports/turnover`) strictly require `checkPermission('report.view', 'all')`.
   * Team endpoints (`/dashboard/manager`, `/reports/attendance`, `/reports/leaves`) enforce dynamic query scoping via `req.user.employeeId` and department ownership.
2. **Data Scrubbing**:
   * Manager-level attendance endpoints MUST NOT include employee salary, bank accounts, or CNIC.
3. **No Unbounded Aggregations**:
   * All report list queries enforce mandatory pagination (`limit: 50`, `max: 500`) to prevent denial-of-service on large datasets.

---

## 6. Traceability Matrix: BUILD-GUIDE ID to User Story

| BUILD-GUIDE ID | Feature Description | User Story ID | Priority | Module Layer |
| :---: | :--- | :---: | :---: | :--- |
| **7.1** | Admin dashboard (`GET /dashboard` role: admin aggregation) | **US-7.1** | **P1** | Backend Controller + `AdminDashboard.jsx` |
| **7.2** | HR dashboard (workforce status & pending approvals) | **US-7.2** | **P1** | Backend Controller + `HrDashboard.jsx` |
| **7.3** | Manager dashboard (team-scoped attendance & leaves) | **US-7.3** | **P1** | Backend Controller + `ManagerDashboard.jsx` |
| **7.4** | Employee dashboard (attendance, balance, aakhri slip) | **US-7.4** | **P1** | Backend Controller + `EmployeeDashboard.jsx` |
| **7.5** | Widgets: headcount, today's attendance, pending list, birthdays | **US-7.5** | **P1** | Modular Reusable Components (`StatCard`, `AttendanceChart`, etc.) |
| **7.6** | Reports: attendance, leave, payroll, headcount, turnover, cost | **US-7.6** | **P1** | Aggregation Service + `ReportsPage.jsx` |
| **7.7** | Interactive filter bar (date range, department, employee) | **US-7.7** | **P2** | Filter Component + Query Parser Middleware |
| **7.8** | Export Excel/PDF (`?format=xlsx` or `pdf` with report.export) | **US-7.8** | **P2** | ExcelJS + PDFKit Streaming Exporters |
