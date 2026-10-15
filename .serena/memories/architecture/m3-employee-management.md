# Module M3 — Employee Management Architecture & Implementation Summary

## Status
- **Module ID:** M3 (Employee Management · Core HR Group)
- **BUILD-GUIDE Section:** Section 8 (Rows 3.1 to 3.17)
- **Implementation State:** 100% Complete & Tested (All 17 slices verified with 16 integration tests and end-to-end multi-role tests)

## Data Models
1. **Employee (`employee.model.js`):**
   - Personal details (fullName, code, email, phone, dob, gender)
   - Field-level AES-256-GCM authenticated encryption for sensitive PII (`cnic`, `bankDetails.iban`)
   - 13-digit masked Pakistani CNIC format validation (`XXXXX-XXXXXXX-X`) and `cnicExpiry` tracking
   - Job assignment: `departmentId`, `designationId`, `shiftId`, `reportingManagerId`, `employmentType`, `joiningDate`, `probationEndDate`
   - Status lifecycle: `['active', 'notice', 'resigned', 'terminated']` with mandatory `statusReason`
   - Document vault array with private expiring URLs (`cnic_front`, `cnic_back`, `degree`, `contract`, `nda`)
   - Tech skills array and soft-delete (`isDeleted: true`)
2. **EmployeeHistory (`employeeHistory.model.js`):**
   - Immutable audit trail of promotions, transfers, salary revisions, and status changes
3. **ProfileChangeRequest (`profileChangeRequest.model.js`):**
   - Employee self-service workflow for sensitive field changes (IBAN, address, emergency contact) with HR approval gate

## Security & Authorization Boundaries
- AES-256-GCM encryption with 16-byte random IV and auth tag verification via `node:crypto` (`backend/src/utils/crypto.js`)
- Field-level filtering (`fieldFilter.js`): salary and raw bank details stripped from Department Manager and unauthorized viewers
- Horizontal multi-tenant scoping (`scopeFilter.js`): Employees see own record (`own`), Department Managers see team/dept (`department`), HR/Admin see all (`all`)
- Terminated employees automatically trigger user account deactivation (`isActive: false`)
- Nightly cron job (`probation.job.js`) checking for probation expiration 7 days in advance
