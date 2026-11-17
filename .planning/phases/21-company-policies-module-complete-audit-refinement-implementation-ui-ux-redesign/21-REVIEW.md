# Phase 21 Code Review Report: Company Policies Module

**Phase:** Phase 21 — Company Policies Module — Complete Audit, Refinement, Implementation & UI/UX Redesign  
**Date:** 2026-11-17  
**Review Type:** Deep Architecture, Security, Data Integrity & UI/UX Audit  
**Status:** Findings Identified (2 High, 3 Medium, 2 Low)

---

## Executive Summary

Phase 21 establishes a corporate policy management and regulatory compliance architecture for the HRMS. The module delivers immutable version control, role-based visibility scoping, legal digital acknowledgement tracking, executive analytics, and modern UI components conforming to the Forest & Emerald Enterprise theme.

Overall code quality is high:
- Zero Oxlint errors or warnings across 17 module files.
- 100% Vitest pass rate (10/10 tests passing).
- Clean production Vite build without runtime syntax or rollup bundle failures.

However, detailed cross-layer tracing revealed **two high-priority issues** (a search scoping bypass in the backend and a field-naming mismatch between the frontend form modal and backend Zod schema), alongside **three medium-priority issues** regarding index uniqueness during soft-delete, query string boolean coercion, and compliance denominator precision.

---

## Severity-Classified Findings

### 🔴 High Severity

#### [SEC-01] Search Query Overwrites Non-HR Scoping Filter in `getPolicies`
- **Location:** `backend/src/modules/policies/policy.service.js` (Lines 71–117)
- **Description:** For non-HR users (Employees, Department Managers), line 86 sets `mongoQuery.$or = scopeOr` to restrict results to `All Employees`, matching department, or management-only policies. Subsequently, line 112 evaluates `if (search && search.trim())` and assigns `mongoQuery.$or = [ title search, code search, description search ]`.
- **Impact:** Overwrites the entire role/department scoping restriction. Any regular employee who enters a search keyword in the portal can view published policies that belong to restricted departments.
- **Remediation:** When both search and scoping conditions exist, combine them under `mongoQuery.$and = [{ $or: scopeOr }, { $or: searchOr }]`.

#### [BUG-02] Cross-Layer Field Naming Discrepancy in `PolicyFormModal.jsx` vs `policy.validation.js`
- **Location:** `frontend/src/features/policies/components/PolicyFormModal.jsx` (Lines 172–183) & `backend/src/modules/policies/policy.validation.js` (Lines 28–34)
- **Description:** `PolicyFormModal.jsx` submits:
  - `departmentIds` instead of `applicableDepartmentIds`
  - `targetRoles` instead of `applicableRoleNames`
  - `gracePeriodDays` instead of `acknowledgementGracePeriodDays`
  - `expiresAt` instead of `expiryDate`
- **Impact:** `createPolicySchema` and `updatePolicySchema` in Zod strip unknown keys. When an administrator creates a "Department Specific" or "Role Specific" policy, the target department IDs and roles are not persisted, defaulting to empty arrays.
- **Remediation:** Update `PolicyFormModal.jsx` payload mapper to submit canonical backend field names (`applicableDepartmentIds`, `applicableRoleNames`, `acknowledgementGracePeriodDays`, `expiryDate`), and add Zod aliases / transforms in `policy.validation.js` for defensive compatibility.

---

### 🟡 Medium Severity

#### [DATA-03] Unique Index Rejection on Soft-Deleted `policyCode`
- **Location:** `backend/src/models/policy.model.js` (Lines 23–31)
- **Description:** `policyCode` has `unique: true` at the schema field level, creating an unconditional unique index.
- **Impact:** If policy `POL-SEC-001` is archived/soft-deleted (`isDeleted: true`), attempting to create a new policy with code `POL-SEC-001` will throw a MongoDB E11000 duplicate key error.
- **Remediation:** Remove `unique: true` from the field definition and declare a partial index:
  ```javascript
  policySchema.index(
    { policyCode: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
  );
  ```

#### [API-04] Query Boolean Coercion Risk in `policyQuerySchema`
- **Location:** `backend/src/modules/policies/policy.validation.js` (Line 121)
- **Description:** `myPoliciesOnly: z.coerce.boolean()` evaluates `Boolean("false") === true` in JavaScript.
- **Impact:** If an API client or third-party integration calls `/api/v1/policies?myPoliciesOnly=false`, Zod coerces string `"false"` into `true`, improperly filtering the list to only mandatory policies.
- **Remediation:** Use `z.preprocess((val) => val === 'true' || val === true, z.boolean())`.

#### [BIZ-05] Overall Compliance Denominator Inflation in `getPolicyStats`
- **Location:** `backend/src/modules/policies/policy.service.js` (Lines 197–208)
- **Description:** `totalMandatorySlots` is computed by multiplying `allPublishedPolicies.length * totalActiveEmployees`.
- **Impact:** If a mandatory policy is scoped to a specific department (e.g., only 5 IT employees out of 100 enterprise staff), the calculation assumes all 100 employees must sign, skewing the overall compliance rate downward.
- **Remediation:** Sum eligible employee counts per policy according to its scope (`applicableDepartmentIds`).

---

### 🟢 Low Severity / Quality Polish

#### [UX-06] CSV Cell Escaping in `PolicyAcknowledgementRosterModal.jsx`
- **Location:** `frontend/src/features/policies/components/PolicyAcknowledgementRosterModal.jsx` (Lines 52–63)
- **Description:** Exported CSV quotes string fields but does not escape embedded quotes (`replace(/"/g, '""')`).
- **Impact:** Employee names or signatures containing quotation marks can corrupt CSV column alignments in spreadsheet software.

#### [SEC-07] Unsanitized Raw String in Markdown Content Reader
- **Location:** `frontend/src/features/policies/components/PolicyDetailDrawer.jsx` (Line 230)
- **Description:** Policy text is displayed using `whitespace-pre-wrap font-sans`. While safe against DOM XSS in React (text node rendering), if future rich Markdown parsing (e.g. `react-markdown`) is introduced, a strict HTML sanitizer (e.g. `DOMPurify`) should be enforced.

---

## Verification Matrix

| Area | Status | Evidence |
| :--- | :---: | :--- |
| **Backend Integration Tests** | Passed | 10/10 tests passing in `tests/policies.test.js` |
| **Oxlint Quality Gate** | Passed | 0 warnings, 0 errors across 17 files |
| **Vite Production Build** | Passed | Bundle compiled cleanly in 21.23s |
| **Data Integrity Indexes** | Verified | Compound unique index on `{ policyId, policyVersion, employeeId }` verified |
| **PBAC Access Control** | Verified | Role permissions properly seeded for 4 roles |

---

## Recommended Next Steps

1. Apply fix for **SEC-01** in `policy.service.js` (`mongoQuery.$and` compound logic).
2. Apply fix for **BUG-02** in `PolicyFormModal.jsx` and `policy.validation.js` (field name normalization).
3. Apply fix for **DATA-03** in `policy.model.js` (partial unique index for soft deletes).
4. Apply fix for **API-04** in `policy.validation.js` (Zod preprocessing for boolean query strings).
