# Phase 36 Research: Company Profile, Employee ID Card & System-Wide Integration Audit

## 1. Executive Summary & Problem Diagnosis

### 1.1 The Existing Gap
- **Company Profile UI**:
  - The Company Profile form (`CompanyForm.jsx`) previously handled basic text fields (`name`, `address`, `phone`, `email`, `website`, `ntn`, `strn`, `logoUrl`) and offered a basic logo upload and direct deletion.
  - Direct logo deletion used native `window.confirm()`, violating UI standards.
  - Text fields were arranged in a flat, unorganized layout without grouping, validation feedback modals, or support for essential corporate attributes (Legal Company Name, Registration/SECP Number, Industry, Description, City, State, Country, Postal Code, Timezone, Currency).
- **Employee ID Card Disconnection**:
  - In `CompanyForm.jsx`, an "Employee ID Card" preview tab was rendered using hardcoded sample data (`John Doe`, `EMP-1049`).
  - The Employee Module (`EmployeeListPage.jsx`, `EmployeeProfilePage.jsx`, `MyProfilePage.jsx`) had **zero ID card functionality**—no view, preview, download, print, or card issuance workflow existed anywhere.
  - The ID card configuration was not persisted or connected to the actual Employee records.
- **System-Wide Settings Inconsistency**:
  - Across the HRMS, individual modules hardcoded company names (`"ELVARA"`, `"Starlight Software Ltd"`, `"HRM Enterprise Suite"`) and branding rather than consuming the central Company Profile settings.
  - PDF engines (`payslipPdf.service.js`, `offerPdf.service.js`, `onboarding.service.js`, `reportExport.service.js`) rendered hardcoded headers rather than the dynamic company profile.
  - `Sidebar.jsx`, `LoginPage.jsx`, and `CareersPublicPage.jsx` did not dynamically adapt to the customer's uploaded company branding.

---

## 2. Architecture & Data Flow

```
[ Company Profile Configuration (Settings Module) ]
       │
       ├── Logo Upload / Remove (with Modal Confirmation)
       ├── Corporate Coordinates (Legal, Tax, Address, Contact)
       └── Employee ID Card Configuration (Layout, Theme, Fields, QR)
              │
              ▼
    [ SettingService (MongoDB Atlas + In-Memory O(1) Cache Bus) ]
              │
              ├──► Sidebar & Topbar (Live App Layout)
              ├──► Login Page & Public Careers (Unauthenticated Policies API)
              ├──► Document PDF Services (Payslips, Offer Letters, Experience Certificates)
              ├──► Report Export Engines (ExcelJS & PDFKit)
              └──► Employee Module (ID Card Generation, Print & Download)
                     │
                     ├── GET /api/v1/employees/:id/id-card
                     ├── GET /api/v1/employees/me/id-card (Self-Service)
                     └── EmployeeIdCardModal (Print CSS + Canvas/PNG Export)
```

---

## 3. Detailed Component & Schema Specifications

### 3.1 Extended Company Profile Schema
```javascript
export const idCardConfigSchema = z.object({
  layout: z.enum(['vertical', 'horizontal']).default('vertical'),
  primaryColor: z.string().default('#00C471'),
  theme: z.enum(['forest', 'emerald', 'light', 'dark']).default('forest'),
  showBloodGroup: z.boolean().default(true),
  showEmergencyContact: z.boolean().default(true),
  showDepartment: z.boolean().default(true),
  showDesignation: z.boolean().default(true),
  showJoiningDate: z.boolean().default(true),
  showBarcode: z.boolean().default(true),
  qrCodeType: z.enum(['verification', 'contact', 'profile']).default('verification'),
  cardValidityYears: z.number().int().min(1).max(10).default(2),
  backDisclaimer: z.string().max(300).default('This credential card remains the property of the organization. If found, please return to Human Resources.')
});

export const companyProfileSchema = z.object({
  name: z.string().min(2).max(100),
  legalName: z.string().max(120).optional().or(z.literal('')),
  registrationNumber: z.string().max(50).optional().or(z.literal('')),
  industry: z.string().max(80).optional().or(z.literal('')),
  businessType: z.string().max(60).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  email: z.string().email(),
  phone: z.string().min(8).max(25),
  alternatePhone: z.string().max(25).optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  ntn: z.string().min(5).max(30),
  strn: z.string().max(30).optional().or(z.literal('')),
  address: z.string().min(5).max(300),
  city: z.string().max(60).optional().or(z.literal('')),
  state: z.string().max(60).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(60).default('Pakistan'),
  timezone: z.string().default('Asia/Karachi'),
  currency: z.string().default('PKR'),
  logoUrl: z.string().optional().or(z.literal('')),
  idCardConfig: idCardConfigSchema.optional()
});
```

### 3.2 ID Card Geometry & Standard Dimensions
- Standard: ISO/IEC 7810 ID-1 (CR80)
- Dimensions: 85.60 mm × 53.98 mm (Aspect ratio: ~1.586 : 1)
- Print Resolution: 300 DPI target (approx 1011px × 638px landscape, or 638px × 1011px portrait).
- Screen Display: Scaled at CSS ratio `w-64` (~256px) or `w-72` with proportional height and rounded corners (`rounded-2xl` matching physical credit/badge card radius).

---

## 4. RBAC & PBAC Security Analysis

| Action | Required Permission | Allowed Roles | Data Scope Constraints |
|---|---|---|---|
| View Company Settings | `settings.view` or `settings.manage` | Super Admin, HR Manager, Dept Manager | Organization-wide |
| Edit Company Settings | `settings.manage` | Super Admin, HR Manager | Organization-wide |
| Upload / Remove Logo | `settings.manage` | Super Admin, HR Manager | Organization-wide |
| Configure ID Card Design | `settings.manage` | Super Admin, HR Manager | Organization-wide |
| View Own ID Card | `employee.view_self` or authenticated user | All Employees | Self-only (`userId === actor._id`) |
| View Colleague ID Card | `employee.view` | Super Admin, HR Manager, Dept Manager | Scoped by PBAC (Department Manager restricted to department) |
| Print / Download ID Card | `employee.view` or self-owner | Authorized roles / Employee | Self or scoped subordinates |

---

## 5. System-Wide Integration Audit Matrix

| Consumer Domain | File / Module Location | Current Hardcoded Value | Required Dynamic Source |
|---|---|---|---|
| App Navigation Sidebar | `frontend/src/components/layout/Sidebar.jsx` | `"ELVARA"` | `company.name` + `company.logoUrl` |
| Authentication Portal | `frontend/src/features/auth/pages/LoginPage.jsx` | `"ELVARA"` | Public Policies `company.name` + `company.logoUrl` |
| Public Careers Board | `frontend/src/features/recruitment/pages/CareersPublicPage.jsx` | `"ELVARA HRM"` | Public Policies `company.name` + `company.address` |
| Candidate Job Application | `frontend/src/features/recruitment/pages/ApplyPage.jsx` | `"ELVARA TALENT ACQUISITION"` | Public Policies `company.name` |
| PDF Salary Advice Slips | `backend/src/modules/payroll/payslipPdf.service.js` | `"HRM ENTERPRISE SUITE"` | `SettingService.getSetting('company')` |
| PDF Candidate Offer Letters | `backend/src/services/offerPdf.service.js` | `"HRM Enterprise Suite"` | `SettingService.getSetting('company')` |
| PDF Experience & Service Letters | `backend/src/modules/onboarding/onboarding.service.js` | `"HRM ENTERPRISE SUITE"` | `SettingService.getSetting('company')` |
| Document Export Engines | `backend/src/services/reportExport.service.js` | `"HRM Enterprise Suite"` | `SettingService.getSetting('company')` |
| Email & Notification Dispatch | `backend/src/modules/settings/setting.service.js` | `"{{company}}"` mustache | `SettingService.getSetting('company').name` |
| Employee ID Card Workflow | `frontend/src/features/employees/` | None (Missing) | Live `SettingService` + `Employee` Model |
