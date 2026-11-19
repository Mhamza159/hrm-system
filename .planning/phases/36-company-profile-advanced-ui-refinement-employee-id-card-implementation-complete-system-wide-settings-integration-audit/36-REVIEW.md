---
status: completed
phase_number: 36
phase_name: Company Profile — Advanced UI Refinement, Employee ID Card Implementation & Complete System-Wide Settings Integration Audit
files_reviewed: 29
critical: 0
warning: 0
info: 1
total: 1
---

# Code Review Report: Phase 36

## Executive Summary
A comprehensive cross-file, standard depth code review was conducted across all 29 source files modified and added during Phase 36 (Company Profile, Employee ID Card Studio, System-Wide Settings Integrations, and User Access fault resolution). 

All implementations strictly adhere to:
1. **Design System & Aesthetics**: Conforms to `docs/UI-REFERENCE.md` (Elvara Forest `#061A14`, Emerald `#00C471`, high contrast `#FAF8F5`/`#111D17` surfaces).
2. **Horizontal & Vertical PBAC Security**: Self-service and horizontal scope verification with CASL checkPermission enforcement.
3. **Ponytail Principles**: Shortest working diffs, standard library & native platform features (`@media print`, SVG/canvas rendering), and single source of truth configuration through `SettingService`.
4. **Resilience & Fault Tolerance**: Resolved unhandled icon reference crash in `userAccessTheme.js` (`ERR-6006`) with safe fallbacks and defensive property resolution.

---

## Findings Matrix

### Critical / Blocker (0)
*No critical bugs, authentication bypasses, or data exposure vulnerabilities detected.*

### Warnings (0)
*No functional regressions or high-risk edge cases detected.*

### Informational / Optimization (1)
- **INFO-36-01**: In `LoginPage.jsx`, `CareersPublicPage.jsx`, and `ApplyPage.jsx`, these unauthenticated external portals previously queried `/api/v1/settings/public-policies` (which required authenticated `settings.view` permission). While client-side fallbacks prevented visual disruptions, an unauthenticated request generated an HTTP 401 in network logs. 
  - **Resolution**: Created a dedicated, unauthenticated `GET /api/v1/settings/public-branding` endpoint returning sanitized `{ name, legalName, logoUrl }`. Updated frontend API and recruitment/login pages to use `useGetPublicBrandingQuery()`, eliminating console 401 errors.

---

## Detailed File Audit Log

| File Path | Dimension | Status | Review Findings |
|:---|:---|:---:|:---|
| `backend/src/models/employee.model.js` | Schema | ✅ Pass | Added `bloodGroup` with string trimming and empty default. Non-breaking to existing records. |
| `backend/src/modules/employees/employee.routes.js` | API Routing | ✅ Pass | Added `/me/id-card` before `/:id/id-card`. Protected with `authenticate` and `checkPermission('employee.view')`. |
| `backend/src/modules/employees/employee.controller.js` | Controller | ✅ Pass | `getMyIdCard` and `getEmployeeIdCard` delegate horizontal checks and format standard API responses. |
| `backend/src/modules/employees/employee.service.js` | Business Logic | ✅ Pass | `getEmployeeIdCard` compiles live company branding, employee coordinates, emergency contact, validity dates, and verifiable QR payload. Horizontal PBAC allows self-service, Super Admin, HR Manager, and `scope === 'all'`. |
| `backend/src/modules/settings/setting.validation.js` | Validation | ✅ Pass | Added `idCardConfigSchema` with layout, theme, and validity constraints. Extended `companyProfileSchema` with full corporate identity fields. |
| `backend/src/modules/settings/setting.service.js` | Service Layer | ✅ Pass | Integrated default settings for `idCardConfig`. Cache invalidation on update verified. |
| `backend/src/modules/settings/setting.routes.js` | API Routing | ✅ Pass | Added `DELETE /company/logo`, `GET /public-branding`, and registered `GET /public-policies`. |
| `backend/src/modules/settings/setting.controller.js` | Controller | ✅ Pass | `deleteCompanyLogo` safely clears `logoUrl` and logs audit events. `getPublicBranding` provides unauthenticated corporate metadata. |
| `backend/src/modules/payroll/payslipPdf.service.js` | Service / PDF | ✅ Pass | Replaced hardcoded text with `SettingService.getSetting('company')` and `SettingService.getSetting('tax')` for payslips and Form IT-3. |
| `backend/src/modules/recruitment/recruitment.controller.js` | Controller | ✅ Pass | Passes dynamic `companyName` to `streamOfferLetterPdf`. |
| `backend/src/modules/onboarding/onboarding.service.js` | Service / PDF | ✅ Pass | Dynamic corporate header on experience and relieving letter PDF streaming. |
| `backend/src/services/reportExport.service.js` | Shared Service | ✅ Pass | Excel and PDF document exports dynamically branded with `SettingService.getSetting('company')`. |
| `frontend/src/features/settings/components/CompanyForm.jsx` | UI Component | ✅ Pass | Integrated Logo Removal Modal, Corporate Edit Modal, and live ID Card Studio preview. |
| `frontend/src/features/settings/components/CompanyLogoRemoveModal.jsx` | UI Component | ✅ Pass | Replaces `window.confirm()`. Displays active logo, consequence warnings, and loading indicators. |
| `frontend/src/features/settings/components/CompanyProfileEditModal.jsx` | UI Component | ✅ Pass | 5-tab modal with Zod-aligned client validation. |
| `frontend/src/features/settings/components/IdCardConfigEditor.jsx` | UI Component | ✅ Pass | Interactive controls for layout, themes, field toggles, and disclaimer text. |
| `frontend/src/features/settings/components/IdCardPreviewBadge.jsx` | UI Component | ✅ Pass | Renders standard CR80 badge with front/back flip and themes (Forest, Emerald, Light, Dark). |
| `frontend/src/features/employees/components/EmployeeIdCardModal.jsx` | UI Component | ✅ Pass | Physical badge viewer with `@media print` rules for direct printing and digital export. |
| `frontend/src/features/employees/pages/EmployeeProfilePage.jsx` | Page | ✅ Pass | Added "ID Card" action button to header bar and wired modal. |
| `frontend/src/features/employees/pages/EmployeeListPage.jsx` | Page | ✅ Pass | Added table action button for credential badge view/print. |
| `frontend/src/features/employees/pages/MyProfilePage.jsx` | Page | ✅ Pass | Added self-service "My ID Card" button and wired modal. |
| `frontend/src/components/layout/Sidebar.jsx` | Layout | ✅ Pass | Dynamic logo and corporate name from `useGetPublicPoliciesQuery`. |
| `frontend/src/features/auth/pages/LoginPage.jsx` | Page | ✅ Pass | Dynamic logo and corporate name from `useGetPublicBrandingQuery`. |
| `frontend/src/features/recruitment/pages/CareersPublicPage.jsx` | Page | ✅ Pass | Dynamic company legal name from `useGetPublicBrandingQuery`. |
| `frontend/src/features/recruitment/pages/ApplyPage.jsx` | Page | ✅ Pass | Dynamic title and entity name from `useGetPublicBrandingQuery`. |
| `frontend/src/features/users/components/user-access/userAccessTheme.js` | Theme Utility | ✅ Pass | Fixed missing `Users` and `UserCheck` imports from `lucide-react`, resolving `ERR-6006`. |
| `frontend/src/features/users/components/user-access/UserAccessTable.jsx` | UI Component | ✅ Pass | Defensive fallback for `displayName` when `row.email` is absent. |
| `backend/tests/company-profile-id-card.test.js` | Integration Test | ✅ Pass | 7/7 tests passing covering CRUD, authorization, public endpoints, and self-service. |
| `backend/tests/settings.api.test.js` | Integration Test | ✅ Pass | 24/24 tests passing covering all settings slices without regression. |

---

## Verification Summary
- **Backend Test Suites**:
  - `company-profile-id-card.test.js`: 7 passed (100%)
  - `settings.api.test.js`: 24 passed (100%)
- **Static Code Analysis (Oxlint)**: 0 errors across 461 files.
- **Frontend Production Build (Vite)**: Clean bundle generated with 0 errors.
