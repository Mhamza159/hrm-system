# HRM System — Locked Development Rules

These rules are strictly enforced and mandatory for every task and file:

1. **JavaScript Only:**
   - Use plain JavaScript (`.js`, `.jsx`).
   - Absolutely NO TypeScript (`.ts`, `.tsx`) files allowed in the repository.

2. **Folder Structure & Layer Architecture (TECH-SPEC.md Section 3):**
   - Pipeline: `routes` -> `validate` -> `checkPermission` -> `controller` -> `service` -> `model`.
   - Controllers only parse request inputs, call service functions, and respond.
   - Controllers NEVER query the database directly. Database operations live in services.

3. **Every API Endpoint Protection:**
   - Every protected API must execute: `authenticate` (JWT) -> `validate` (Zod schemas) -> `checkPermission` (CASL RBAC).
   - Scopes enforced in query filtering: `own`, `team`, `department`, `all`.

4. **Uniform API Response Envelope:**
   ```json
   {
     "success": true,
     "data": { ... },
     "message": "Human-readable description",
     "meta": { "page": 1, "limit": 10, "total": 100 }
   }
   ```

5. **Financials & Date Conventions:**
   - Financial amounts stored as integers in minor currency units (paisa).
   - Timestamps and dates stored in UTC in MongoDB; rendered in `Asia/Karachi` (PKT, UTC+5) on client UI.

6. **Encryption & Audit Logging:**
   - Sensitive personal and financial fields (CNIC, bank accounts / IBAN, salary details) must be encrypted at rest.
   - Every create, edit, or delete action must generate an entry in the `auditLogs` collection with before/after state.

7. **User Roles:**
   - 4 default system roles: `Super Admin`, `HR Manager`, `Department Manager`, `Employee`.
   - Dynamic custom roles configurable through Module M26.

8. **Vertical Slice Execution (BUILD-GUIDE.md):**
   - Every feature must be built and verified end-to-end: Backend API + Frontend UI + Test together before moving to the next.

Refer to `mem:overview`, `mem:tech_stack`, `mem:architecture`, and `mem:build_order`.
