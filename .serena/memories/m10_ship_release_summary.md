# Milestone Release: Module M10 Loans & Salary Advances

- **Status**: Shipped & Verified
- **Features Completed**:
  - 10.1: Loan & advance application submission (`POST /api/v1/loans`, `MyLoansPage.jsx`)
  - 10.2: Live borrowing limits validation (1x gross for advance, 2x basic for loan, `GET /api/v1/loans/my-eligibility`)
  - 10.3: Multi-tier approval chain (Dept Manager -> HR review -> Super Admin disbursement, `PATCH /api/v1/loans/:id/decide`, `LoanApprovalsPage.jsx`)
  - 10.4: Itemized installment amortization schedule (`GET /api/v1/loans/:id/schedule`, `LoanScheduleDrawer.jsx`)
  - 10.5: Automated payroll deduction & balance settlement (`payrollProcessor.js`, `payroll.service.js`)
  - 10.6: Early lump-sum prepayment & executive ledger (`POST /api/v1/loans/:id/prepay`, `GET /api/v1/loans/ledger/summary`, `LoanLedgerPage.jsx`)
- **Quality & Security**:
  - 49/49 automated tests passing (Vitest, Supertest, E2E, Security)
  - Concurrency protected via MongoDB partial unique compound index
  - BOLA/IDOR protected via dynamic scope authorization
  - Separation of duties strictly enforced (self-approval blocked)
- **Knowledge Graph**:
  - 3,350 AST nodes, 8,389 edges, 215 communities in `.planning/graphs/`
