# HRM System — Project Context & Invariants

## 1. Project Profile & Operational Scope
- **Project Name:** HRM System (Human Resource Management System)
- **Target Client:** Single software house based in Pakistan (office, hybrid, and remote employees across engineering, QA, UI/UX, sales, HR, and admin).
- **Deployment Architecture:** Single company, single database deployment (strictly NOT multi-tenant SaaS). Hosted on private VPS with MongoDB Atlas.
- **Current Headcount:** 10–30 employees today, scaling to ~50–80 employees over the next 2 years.
- **Physical Locations:** Single main office building with single geo-fence perimeter. Hybrid/remote employees mark attendance with supervisor-approved WFH status.
- **Payroll Bank Transfer Format:** Generic Standard Pakistani Corporate Bank Advice Excel Sheet (`Employee Code`, `Account Title`, `IBAN / Account Number`, `CNIC`, `Net Salary PKR`) compatible with all major commercial banks in Pakistan (Meezan Bank, HBL, Bank Alfalah, MCB, UBL).
- **Salary Slip Delivery:** Primary delivery via Email (PDF attachment via Nodemailer) + Employee Self-Service in-app portal download. WhatsApp Cloud API integration is toggleable and optional via Company Settings.
- **AI Service Provider:** OpenAI API (`gpt-4o-mini` / `gpt-4o`) via backend provider adapter pattern for M15 Resume Screening and M16 HR Chatbot.

---

## 2. Core Architectural & Code Invariants (Non-Negotiable)

1. **Strict JavaScript Only (NO TypeScript):**
   - Every file must be plain JavaScript: `.js` for backend/shared and `.js` / `.jsx` for frontend.
   - Absolutely NO `.ts` or `.tsx` files are allowed anywhere in the repository.
   - Type-safety and runtime validation enforced strictly via Zod schemas across frontend and backend.

2. **Full MERN Stack:**
   - **M**ongoDB + Mongoose (models, soft delete with `isDeleted`, schema validation, indexed queries).
   - **E**xpress.js + Node.js LTS (RESTful API, modular architecture).
   - **R**eact + Vite (fast build, SPA/PWA, RTK Query state management).
   - **N**ode ecosystem tooling: Tailwind CSS + shadcn/ui (JavaScript variant), Socket.io, BullMQ + Redis, node-cron.

3. **RBAC & Scoping on Every Single API:**
   - Middleware Pipeline: `routes` $\longrightarrow$ `validate` (Zod) $\longrightarrow$ `checkPermission` (CASL) $\longrightarrow$ `controller` $\longrightarrow$ `service` $\longrightarrow$ `model`.
   - Controllers only parse request inputs, call services, and respond. Controllers NEVER query MongoDB directly.
   - Every protected API checks permission action and subject via CASL (`@casl/ability`).
   - Query filtering enforces data scope:
     - `own` (employee's own records)
     - `team` (records of employees reporting to manager)
     - `department` (records within user's department)
     - `all` (company-wide access for HR / Super Admin)
   - Field-level masking strips sensitive fields (salary, CNIC, bank) based on role capabilities.

4. **Encrypted Sensitive Fields at Rest:**
   - Personal and financial identifiers must be encrypted using AES (`utils/crypto.js`):
     - CNIC numbers (`xxxxx-xxxxxxx-x`)
     - Bank account numbers & IBANs
     - Base salary and compensation structures
   - Decryption occurs only at the service level when accessed by authorized roles.

5. **Immutable Audit Logging:**
   - Every state-altering mutation (`POST`, `PATCH`, `PUT`, `DELETE` / soft-delete) must write a record to `auditLogs` collection via `services/audit.service.js`.
   - Log records capture `userId`, `action`, `entity`, `entityId`, `before` state snapshot, `after` state snapshot, client IP, and UTC timestamp.

6. **Pakistan Statutory & Localization Compliance:**
   - **Currency Precision:** Pakistani Rupee (PKR), stored as integers in minor currency units (paisa) to eliminate floating-point rounding errors.
   - **Timezone & Dates:** Timestamps stored in UTC in MongoDB; rendered and parsed in `Asia/Karachi` (PKT, UTC+5) on the client.
   - **FBR Salaried Income Tax Slabs:** Annual taxable salary evaluated against FBR tax slab brackets, divided into 12 monthly deductions. Slabs stored in editable settings per tax year (July–June).
   - **EOBI & Statutory Deductions:** Configurable employer/employee contribution rates according to statutory minimum wage rules, toggleable in M2 Company Settings.
   - **CNIC Management:** 13-digit masked validation and proactive expiry tracking via background cron.

7. **Standard API Response Envelope:**
   ```json
   {
     "success": true,
     "data": { ... },
     "message": "Human-readable response message",
     "meta": { "page": 1, "limit": 10, "total": 25 }
   }
   ```

8. **Vertical Slice Development:**
   - Every feature must be completed as a cohesive unit: Backend Model/Route + Zod Validation + CASL Permission + Controller/Service + RTK Query Hook + Frontend UI Component + Verification Test before advancing to the next feature.

---

## 3. User Roles Hierarchy
- **Super Admin:** CEO, Business Owner, or IT Lead — full company visibility, role creation, system settings, final approvals, audit log viewer.
- **HR Manager:** HR Department — complete employee lifecycle, attendance oversight, leave approvals, payroll execution, compliance reports.
- **Department Manager:** Team Leads & Project Managers — team attendance approvals, leave/expense recommendations, performance evaluations (no salary or bank visibility).
- **Employee:** All Staff Members — self-service web attendance, leave requests, payslip access, expense submissions, profile management.
- **Custom Roles:** Extensible roles created and managed dynamically in Module M26 with granular permissions and approval limits.

---

## 4. Documentation Sources of Truth
- [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) — Functional Requirements Document
- [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) — Technical Specification & Architecture
- [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) — Vertical Slice Build Checklist
- [`docs/MODULES.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/MODULES.md) — Modular Code Organization Guide
