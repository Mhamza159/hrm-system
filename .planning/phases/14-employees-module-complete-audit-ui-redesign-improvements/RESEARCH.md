# Phase 14 Research: Employees Module Audit & Component Analysis

## 1. Existing Codebase Audit

### A. Employee Directory Page (`frontend/src/features/employees/pages/EmployeeListPage.jsx`)
- **Current State**: 745 lines. Only renders a table view. There is **no Card Grid View** switcher.
- **Issues Found**:
  - Lacks a dual view toggle (Table View vs Card View), which is explicitly required by the user prompt.
  - Active and Archived tabs exist, but there is no dedicated filter or count for Inactive/Suspended staff.
  - Clicking on a row navigates away from the page to `/employees/:id` rather than offering a seamless inspection modal (`EmployeeDetailModal.jsx`).
  - Table columns have some clutter: `Code`, `Name & Email`, `Department`, `Role & Designation`, `Shift Timing`, `Status`, `Actions`.
  - Action buttons in table use generic Lucide icons without action menus for smaller screens.

### B. Employee Creation & Edit Wizard (`frontend/src/features/employees/pages/EmployeeFormPage.jsx`)
- **Current State**: 1,144 lines. Implements a 5-step wizard (`Personal Details`, `Contact & Emergency`, `Job Assignment`, `Bank & Financials`, `Account & Review`).
- **Issues Found**:
  - Some styling uses outdated slate colors and does not strictly follow the dark Forest & Emerald tokens (`#111D17` / `#1A3125`).
  - Form validation error alerts can be polished into a high-visibility summary banner.
  - Pakistani CNIC mask is present but can be refined with NADRA digit count checks (13 digits).
  - Designation dependent filtering depends on department, but needs memoization to avoid redundant re-renders.

### C. Employee Profile Page & Tabs (`frontend/src/features/employees/pages/EmployeeProfilePage.jsx`)
- **Current State**: 509 lines, with 4 sub-tab files (`ProfileOverviewTab.jsx`, `ProfileDocumentsTab.jsx`, `ProfileHistoryTab.jsx`, `ProfileSalaryTab.jsx`).
- **Issues Found**:
  - Missing a lightweight, accessible `EmployeeDetailModal.jsx` for rapid row-click inspection on `EmployeeListPage.jsx`.
  - Sub-tabs contain some legacy styling and lack dark mode tokens.

### D. Status Transition & Modals (`StatusChangeModal.jsx`, `DocumentUploadModal.jsx`)
- **Current State**: `StatusChangeModal.jsx` (134 lines) and `DocumentUploadModal.jsx` (142 lines).
- **Issues Found**:
  - `StatusChangeModal.jsx` lacks dark mode classes (`dark:bg-[#111D17]`, `dark:border-[#1A3125]`).
  - `DocumentUploadModal.jsx` needs styling polish and clearer dropzone states.

---

## 2. API Endpoints & Capabilities Audit

| Endpoint | Method | Permission | Controller / Service | Status |
| :--- | :---: | :---: | :---: | :---: |
| `/api/v1/employees` | `GET` | `employee.view` | `employeeController.getEmployees` | Fully Implemented & Scoped |
| `/api/v1/employees/:id` | `GET` | `employee.view` | `employeeController.getEmployeeById` | Fully Implemented (Masked) |
| `/api/v1/employees` | `POST` | `employee.create` | `employeeController.createEmployee` | Fully Implemented |
| `/api/v1/employees/:id` | `PATCH` | `employee.edit` | `employeeController.updateEmployee` | Fully Implemented |
| `/api/v1/employees/:id` | `DELETE` | `employee.delete` | `employeeController.deleteEmployee` | Soft-deletes (Asset clearance checked) |
| `/api/v1/employees/:id/restore` | `POST` | `employee.delete` | `employeeController.restoreEmployee` | Fully Implemented |
| `/api/v1/employees/:id/permanent` | `DELETE` | `employee.delete` | `employeeController.permanentDeleteEmployee` | Fully Implemented (Asset clearance checked) |
| `/api/v1/employees/:id/status` | `PATCH` | `employee.edit` | `employeeController.updateEmployeeStatus` | Fully Implemented (Reason mandatory) |
| `/api/v1/employees/:id/documents` | `POST` | `employee.edit` | `employeeController.uploadDocument` | Fully Implemented (5MB limit) |
| `/api/v1/employees/:id/documents/:docId` | `DELETE` | `employee.edit` | `employeeController.deleteDocument` | Fully Implemented |
| `/api/v1/employees/next-code` | `GET` | `employee.create` | `employeeController.getNextEmployeeCode` | Auto-minting next code |
| `/api/v1/employees/export` | `GET` | `report.export` | `employeeController.exportEmployees` | Excel stream |
| `/api/v1/employees/import` | `POST` | `employee.create` | `employeeController.importEmployees` | Excel bulk upload |

---

## 3. Redesign Plan & Execution Strategy

We decompose Phase 14 into 4 focused execution plans:

1. **Plan 14-01: Directory Overhaul, Dual View (Data Table & Card Grid) & Advanced Filters**:
   - Modernized `EmployeeListPage.jsx` with Table View & Card Grid View switch.
   - Professional employee card component with initials/avatar, role pills, department, status, and quick menu.
   - High-density table with sticky headers, monospaced codes, and aligned columns.
   - Status bucket tabs: `Active Workforce`, `Inactive / Suspended`, `Archive Bucket`.
   - Advanced filters (search, department, designation, status) with quick reset.
   - Strict PBAC button gating (only authorized roles see Onboard, Ingest, Export, Edit, Archive).

2. **Plan 14-02: Employee Comprehensive Detail Modal (`EmployeeDetailModal.jsx`) & Profile Polish**:
   - Create new `EmployeeDetailModal.jsx` with 10 structured sections:
     1. Employee Overview & Avatar
     2. Personal Information (DOB, Gender, CNIC masked)
     3. Employment Information (Type, Status, Joining Date)
     4. Department & Designation (Hierarchy & Grade)
     5. Reporting Structure (Direct Manager & Subordinates)
     6. Contact Information (Email, Phone, Address)
     7. Documents & Attachments (Vault files)
     8. Career & Job History (Promotions, transfers)
     9. Account & Security (Username, User ID status, 2FA indicator)
     10. Financial / Payroll Overview (Unmasked only if permitted)
   - Accurately populate from backend; format missing data as '—'.
   - Role-aware action bar (Edit, Change Status, Reset Password, Archive).
   - Polish `EmployeeProfilePage.jsx` and its tabs (`ProfileOverviewTab.jsx`, `ProfileDocumentsTab.jsx`, `ProfileHistoryTab.jsx`, `ProfileSalaryTab.jsx`) with dark mode tokens.

3. **Plan 14-03: Employee Creation & Edit Wizard (`EmployeeFormPage.jsx`) & Supporting Modals**:
   - Completely redesign the 5-step wizard (`EmployeeFormPage.jsx`):
     - Step 1: Personal Details (CNIC mask & NADRA validator, DOB, Gender, Name, Email, Phone).
     - Step 2: Contact & Emergency Details (Street, City, Province, Postal Code, Emergency Name, Relationship, Phone).
     - Step 3: Job Assignment (Department, Designation reactive filter, Shift, Manager select, Employment Type, Joining Date, Probation).
     - Step 4: Bank Coordinates (Bank Name, Account Title, Account Number, IBAN).
     - Step 5: Account Provisioning (Generate Login Account toggle, Role Selector, Review summary).
   - Modernize `StatusChangeModal.jsx` and `DocumentUploadModal.jsx` with Forest & Emerald tokens, dark mode, and strict validation.

4. **Plan 14-04: Excel Ingestion, Change Requests Review Queue, Integration & Verification**:
   - Polish `EmployeeImportPage.jsx` with interactive drag & drop, template download, preview table, and row error inspection.
   - Polish `ChangeRequestsPage.jsx` with card diff view and fast approve/reject actions.
   - Verify all cross-module integration hooks.
   - Multi-role verification, 16/16 backend test suite pass (`tests/m3.employees.e2e.test.js`), 0 Oxlint warnings, and clean `vite build`.
