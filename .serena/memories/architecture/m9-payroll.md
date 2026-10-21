# Module M9: Payroll & Pakistan Statutory Compliance

## Status & Overview
- Completed: Slices 9.1 through 9.17 (BUILD-GUIDE Section 12)
- Automated Test Suite: 39/39 Vitest Integration & Unit tests passing
- Multi-role CASL authorization: Super Admin, HR Manager, Department Manager, Employee

## Data Models (Integer Paisa Storage)
- **SalaryStructure**: Basic salary, house rent, medical, conveyance, other allowances, gross salary in integer paisa (1 PKR = 100 paisa), with historical revision tracking (`revisions[]`).
- **PayrollRun**: Monthly payroll batches (`month: YYYY-MM`), 4-stage lifecycle (`draft` -> `review` -> `approved` -> `paid`), aggregate financials.
- **Payslip**: Granular employee slips with earnings breakdown (basic, allowances, overtime, bonuses, arrears), deductions (unpaid leaves, late penalty, loan installments), statutory deductions (FBR tax, employee EOBI, employee PESSI), and employer statutory contributions.

## Pakistan Statutory Compliance (FBR, EOBI, PESSI, Gratuity)
- **FBR Tax**: Progressive annual tax slabs (FY 2024-2025, Section 149) calculated via monthly taxable gross * 12, divided by 12.
- **EOBI**: 1% employee contribution (PKR 258/month) and 5% employer contribution (PKR 1,290/month) pegged to statutory minimum wage.
- **PESSI**: 6% employer social security contribution up to provincial wage cap.
- **Gratuity**: Computed under West Pakistan Industrial and Commercial Employment Ordinance (20/30 days basic salary per continuous service year).

## APIs & Endpoints
- Salary Structures: `POST /api/v1/salary-structures`, `GET /api/v1/salary-structures`, `GET /api/v1/salary-structures/employee/:employeeId`
- Lifecycle & Batch Processing: `POST /api/v1/payroll/runs` (Attendance month-lock pre-condition), `GET /api/v1/payroll/runs`, `GET /api/v1/payroll/runs/:id`, `PATCH /api/v1/payroll/runs/:id/approve` (Super Admin only), `PATCH /api/v1/payroll/runs/:id/mark-paid`
- Payslip Adjustment & PDF: `PATCH /api/v1/payroll/runs/:id/payslips/:slipId`, `POST /api/v1/payroll/runs/:id/payslips/:slipId/regenerate`, `GET /api/v1/payslips/:id/pdf`
- Bank Advice & Exports: `GET /api/v1/payroll/runs/:id/bank-advice?bank=meezan|hbl|standard`
- Employee Self-Service: `GET /api/v1/payslips/my`, `GET /api/v1/payslips/annual-tax-certificate`
- Offboarding Exit Clearance: `POST /api/v1/payroll/final-settlement/:employeeId`
- Team Overtime (Manager Scoped): `GET /api/v1/payroll/team-overtime` (Hours only, salary figures stripped)
- Statutory Compliance Reports: `GET /api/v1/reports/tax-compliance`, `GET /api/v1/reports/eobi-compliance`, `GET /api/v1/reports/payroll-cost`

## RBAC Permissions
- `payroll.manage`: HR Manager, Super Admin
- `payroll.run`: HR Manager, Super Admin
- `payroll.approve`: Super Admin ONLY
- `payroll.view`: Super Admin (`all`), HR Manager (`all`), Department Manager (`team`/`own`), Employee (`own`)

## Architectural Decisions & Bug Fixes
- `checkPermission` updated with `subject = null` default to avoid `scopePriority['all'] === 4` conflicts with wildcard CASL operations.
- Direct binary streaming (PDF/Excel) securely authenticates with in-memory Redux `accessToken` and `credentials: 'include'`.
- Real-time and persistent notification dispatches wired into `markPayrollPaid` and `processFinalSettlement` via M8 `notify()` service.
