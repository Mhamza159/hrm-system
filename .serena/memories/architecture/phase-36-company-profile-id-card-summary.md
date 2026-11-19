# Phase 36: Company Profile, Employee ID Card Studio & System-Wide Settings Integration

## Overview
Phase 36 implemented the comprehensive enterprise audit and overhaul of the Company Profile settings section, designed the Employee ID Card Studio, built the physical badge viewing/printing workflow across the Employee Module, and unified corporate branding across the entire HRMS.

## Key Deliverables & Achievements

### 1. Company Profile & ID Card Studio Configuration
- **Extended Profile Coordinates**: `legalName`, `registrationNumber`, `industry`, `businessType`, `description`, `city`, `state`, `postalCode`, `country`, `timezone`, `currency`, and `idCardConfig`.
- **Zod Validation & Cache Bus**: Enforced strict runtime schemas and cache invalidation in `SettingService`.
- **Logo Removal Modal**: Replaced browser-native dialogs with `CompanyLogoRemoveModal.jsx` displaying the active logo, consequences, and reactive state update.
- **Categorized Coordinates Modal**: Built `CompanyProfileEditModal.jsx` with 5 distinct corporate tabs.
- **ID Card Studio**: Built `IdCardConfigEditor.jsx` and `IdCardPreviewBadge.jsx` with vertical/horizontal CR80 geometry, theme presets (Forest, Emerald, Light, Dark), and live field toggles.

### 2. Backend Employee ID Card REST API & Security
- Registered `GET /api/v1/employees/me/id-card` (self-service) and `GET /api/v1/employees/:id/id-card` (admin/horizontal PBAC scoped).
- Live compilation: Merges company identity, employee data, emergency contact, blood group, validity dates, QR verification payload, and records audit logs.
- Added `bloodGroup` to `Employee` model.

### 3. Employee Module ID Card Workflow
- Built `EmployeeIdCardModal.jsx` featuring physical badge rendering (front and back), standard CR80 `@media print` physical badge dimensions (85.6mm × 53.98mm), and digital export.
- Integrated into `EmployeeProfilePage.jsx`, `EmployeeListPage.jsx`, and `MyProfilePage.jsx`.

### 4. System-Wide Settings Integration Matrix (Single Source of Truth)
- **Navigation & Brand**: `Sidebar.jsx` and `LoginPage.jsx` consume live branding from `useGetPublicPoliciesQuery`.
- **Public Recruitment Portals**: `CareersPublicPage.jsx` and `ApplyPage.jsx` consume dynamic company legal branding.
- **Statutory & Enterprise PDFs**:
  * `payslipPdf.service.js`: Branded salary advice with dynamic legal name and company headers.
  * `generateAnnualTaxCertificate`: Form IT-3 with employer NTN, address, and jurisdiction from company & tax settings.
  * `offerPdf.service.js` & `recruitment.controller.js`: Dynamic corporate entity in formal job offers.
  * `onboarding.service.js`: Dynamic experience and relieving letter certificates.
  * `reportExport.service.js`: Excel and PDF reports generated under dynamic corporate title.

### 5. Automated Verification & Quality Gates
- `backend/tests/company-profile-id-card.test.js`: 6/6 tests passing (100%).
- `backend/tests/settings.api.test.js`: 24/24 tests passing (100%).
- Oxlint: 0 errors across 461 files.
- Vite: Production build clean (0 errors, 21.88s build time).
- User Access module `ERR-6006` resolved: Clean rendering with verified imports in `userAccessTheme.js` and defensive fallback in `UserAccessTable.jsx`.
