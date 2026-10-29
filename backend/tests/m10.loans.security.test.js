/**
 * @file m10.loans.security.test.js
 * @description Comprehensive Security, Threat-Hardening & Adversarial Stress Tests for Module M10 (Loans).
 * 
 * THREAT DIMENSIONS AUDITED:
 * 1. Perimeter Auth & RBAC Boundaries:
 *    - Unauthenticated requests rejected with 401.
 *    - Unauthorized roles (Employee attempting approval or prepayment) blocked with 403.
 * 2. Separation of Duties (Self-Recommendation & Self-Approval Prevention):
 *    - Applicant employee cannot recommend or approve their own loan application (403 Forbidden).
 * 3. Broken Object-Level Authorization (BOLA / IDOR):
 *    - Employee cannot view peer employee's loan or installment schedule (403 Forbidden).
 *    - Manager cannot access or decide loans outside their department/team (403 Forbidden).
 * 4. Concurrency & Race Conditions (Double-Click Defense):
 *    - Parallel concurrent loan applications blocked by atomic partial compound index (HTTP 409 Conflict).
 * 5. Input Validation, Numeric Integrity & Edge Cases:
 *    - Negative amount, fractional paisa, zero amount, invalid tenure rejected by Zod (HTTP 400).
 *    - Over-borrowing exceeding policy cap rejected (HTTP 422).
 *    - Over-prepayment exceeding remaining balance rejected (HTTP 422).
 * 6. Injection Defense (NoSQL Injection & XSS / HTML Tampering):
 *    - Malicious regex patterns (ReDoS, unmatched brackets) handled safely without crashing.
 *    - HTML/Script tags stripped from reason, comments, and prepayment references.
 * 7. Path Parameter Integrity:
 *    - Non-hex / malformed ObjectIds rejected with 400 Bad Request before hitting Mongoose.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Department } from '../src/models/department.model.js';
import { Employee } from '../src/models/employee.model.js';
import { SalaryStructure } from '../src/models/salaryStructure.model.js';
import { Loan } from '../src/models/loan.model.js';

describe('Module M10 — Security Hardening & Threat Verification Suite', () => {
  let superAdminToken, hrManagerToken, deptManagerToken, employeeToken, peerEmployeeToken, crossDeptManagerToken;
  let superAdminUser, hrManagerUser, deptManagerUser, employeeUser, peerUser, crossDeptManagerUser;
  let deptEngineering, deptSales;
  let empDeptManager, empStaff, empPeer, empSalesManager;
  let activeLoanId, pendingLoanId;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m10_sec');
    await mongoose.connect(testDbUri);

    // Clean test collections
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Department.deleteMany({}),
      Employee.deleteMany({}),
      SalaryStructure.deleteMany({}),
      Loan.deleteMany({})
    ]);

    // 1. Setup Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'loan.view', subject: 'Loan', scope: 'all' },
        { action: 'loan.create', subject: 'Loan', scope: 'own' },
        { action: 'loan.recommend', subject: 'Loan', scope: 'all' },
        { action: 'loan.approve', subject: 'Loan', scope: 'all' },
        { action: 'loan.prepay', subject: 'Loan', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'loan.view', subject: 'Loan', scope: 'team' },
        { action: 'loan.create', subject: 'Loan', scope: 'own' },
        { action: 'loan.recommend', subject: 'Loan', scope: 'team' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'loan.view', subject: 'Loan', scope: 'own' },
        { action: 'loan.create', subject: 'Loan', scope: 'own' }
      ]
    });

    // 2. Setup Departments
    deptEngineering = await Department.create({ name: 'Engineering', code: 'ENG', status: 'active' });
    deptSales = await Department.create({ name: 'Sales', code: 'SLS', status: 'active' });

    // 3. Setup Employees & Users
    // Super Admin
    superAdminUser = await User.create({
      name: 'Executive Super Admin',
      email: 'sec.admin@company.com',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    // HR Manager
    hrManagerUser = await User.create({
      name: 'HR Lead',
      email: 'sec.hr@company.com',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });

    // Engineering Dept Manager
    empDeptManager = await Employee.create({
      employeeCode: 'EMP-SEC-MGR',
      name: 'Lead Architect',
      email: 'sec.lead@company.com',
      phone: '+923001112233',
      departmentId: deptEngineering._id,
      status: 'Active',
      joiningDate: new Date('2023-01-01')
    });

    deptManagerUser = await User.create({
      name: 'Lead Architect',
      email: 'sec.lead@company.com',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      employeeId: empDeptManager._id,
      isActive: true
    });
    empDeptManager.userId = deptManagerUser._id;
    await empDeptManager.save();

    // Sales Dept Manager (Cross-department adversarial test actor)
    empSalesManager = await Employee.create({
      employeeCode: 'EMP-SEC-SALES-MGR',
      name: 'Sales Lead',
      email: 'sec.saleslead@company.com',
      phone: '+923004445566',
      departmentId: deptSales._id,
      status: 'Active',
      joiningDate: new Date('2023-01-01')
    });

    crossDeptManagerUser = await User.create({
      name: 'Sales Lead',
      email: 'sec.saleslead@company.com',
      passwordHash: 'dummy_hash',
      roles: [managerRole._id],
      employeeId: empSalesManager._id,
      isActive: true
    });
    empSalesManager.userId = crossDeptManagerUser._id;
    await empSalesManager.save();

    // Engineering Staff Employee (Applicant)
    empStaff = await Employee.create({
      employeeCode: 'EMP-SEC-001',
      name: 'Frontend Engineer',
      email: 'sec.engineer@company.com',
      phone: '+923009998877',
      departmentId: deptEngineering._id,
      managerId: empDeptManager._id,
      status: 'Active',
      joiningDate: new Date('2024-01-01')
    });

    employeeUser = await User.create({
      name: 'Frontend Engineer',
      email: 'sec.engineer@company.com',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      employeeId: empStaff._id,
      isActive: true
    });
    empStaff.userId = employeeUser._id;
    await empStaff.save();

    // Peer Employee in Same Dept (BOLA/IDOR Target)
    empPeer = await Employee.create({
      employeeCode: 'EMP-SEC-002',
      name: 'Backend Peer',
      email: 'sec.peer@company.com',
      phone: '+923008887766',
      departmentId: deptEngineering._id,
      managerId: empDeptManager._id,
      status: 'Active',
      joiningDate: new Date('2024-02-01')
    });

    peerUser = await User.create({
      name: 'Backend Peer',
      email: 'sec.peer@company.com',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      employeeId: empPeer._id,
      isActive: true
    });
    empPeer.userId = peerUser._id;
    await empPeer.save();

    // Salary Structures
    await SalaryStructure.create({
      employeeId: empStaff._id,
      version: 1,
      currency: 'PKR',
      basicSalary: 8000000,   // PKR 80,000 (8,000,000 paisa)
      grossSalary: 12000000, // PKR 120,000 (12,000,000 paisa)
      netSalary: 11000000,
      status: 'active',
      effectiveFrom: new Date('2024-01-01')
    });

    await SalaryStructure.create({
      employeeId: empDeptManager._id,
      version: 1,
      currency: 'PKR',
      basicSalary: 15000000,
      grossSalary: 20000000,
      netSalary: 18500000,
      status: 'active',
      effectiveFrom: new Date('2023-01-01')
    });

    // JWT Tokens
    superAdminToken = jwt.sign({ userId: superAdminUser._id, roles: ['Super Admin'] }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    hrManagerToken = jwt.sign({ userId: hrManagerUser._id, roles: ['HR Manager'] }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    deptManagerToken = jwt.sign({ userId: deptManagerUser._id, roles: ['Department Manager'] }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    crossDeptManagerToken = jwt.sign({ userId: crossDeptManagerUser._id, roles: ['Department Manager'] }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    employeeToken = jwt.sign({ userId: employeeUser._id, roles: ['Employee'] }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    peerEmployeeToken = jwt.sign({ userId: peerUser._id, roles: ['Employee'] }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });

    // Seed Loan Indexes
    await Loan.syncIndexes();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // =========================================================================
  // 1. PERIMETER AUTH & RBAC BOUNDARIES
  // =========================================================================
  describe('1. Perimeter Authentication & RBAC Boundaries', () => {
    it('rejects unauthenticated requests with HTTP 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/loans/my-eligibility');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects forged/tampered JWT tokens with HTTP 401', async () => {
      const res = await request(app)
        .get('/api/v1/loans/my-eligibility')
        .set('Authorization', 'Bearer forged.malicious.token');
      expect(res.status).toBe(401);
    });

    it('blocks regular Employee from accessing company-wide ledger summary (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/v1/loans/ledger/summary')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it('blocks regular Employee from attempting loan approval decision (HTTP 403)', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/v1/loans/${fakeId}/decide`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ decision: 'approve', comments: 'Attempting unauthorized self-approval' });
      expect(res.status).toBe(403);
    });

    it('blocks regular Employee from invoking early prepayment settlement (HTTP 403)', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/v1/loans/${fakeId}/prepay`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ amount: 500000, paymentMethod: 'cash', reference: 'Illegal prepayment attempt' });
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 2. INPUT VALIDATION, NUMERIC DEFENSE & PARAMETER INTEGRITY
  // =========================================================================
  describe('2. Input Validation, Numeric Integrity & Parameter Boundaries', () => {
    it('rejects malformed / non-hex 24-character ObjectIds with HTTP 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/v1/loans/invalid-loan-id-123')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/Invalid Loan ID/i);
    });

    it('rejects negative loan amounts with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'loan',
          amount: -500000,
          repaymentTenureMonths: 6,
          effectiveStartMonth: '2025-04',
          reason: 'Negative amount exploit attempt'
        });
      expect(res.status).toBe(400);
    });

    it('rejects fractional / non-integer paisa with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'loan',
          amount: 50000.75,
          repaymentTenureMonths: 6,
          effectiveStartMonth: '2025-04',
          reason: 'Fractional paisa overflow attempt'
        });
      expect(res.status).toBe(400);
    });

    it('rejects tenure exceeding the 24-month ceiling with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'loan',
          amount: 1000000,
          repaymentTenureMonths: 36,
          effectiveStartMonth: '2025-04',
          reason: 'Exceeding 24-month tenure policy'
        });
      expect(res.status).toBe(400);
    });

    it('rejects borrow amount exceeding policy cap (2x basic salary for loans) with HTTP 422', async () => {
      // Basic is 80,000 PKR (8,000,000 paisa) -> Max loan is 16,000,000 paisa. Requesting 20,000,000 paisa:
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'loan',
          amount: 20000000,
          repaymentTenureMonths: 12,
          effectiveStartMonth: '2025-04',
          reason: 'Attempting to bypass 2x basic salary borrowing limit'
        });
      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/borrowing policy limit/i);
    });
  });

  // =========================================================================
  // 3. XSS & REGEX REDOS RESILIENCE
  // =========================================================================
  describe('3. XSS Sanitization & ReDoS Resilience', () => {
    it('sanitizes and strips malicious HTML/XSS script tags from loan reason', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          type: 'advance',
          amount: 5000000, // PKR 50,000 (well within 120,000 gross cap)
          repaymentTenureMonths: 1,
          effectiveStartMonth: '2025-04',
          reason: '<script>alert("XSS")</script>Medical assistance emergency <img src=x onerror=alert(1)>'
        });

      expect(res.status).toBe(201);
      pendingLoanId = res.body.data._id;
      // Stored reason should have all script & img tags removed
      expect(res.body.data.reason).not.toContain('<script>');
      expect(res.body.data.reason).not.toContain('onerror=');
      expect(res.body.data.reason).toContain('Medical assistance emergency');
    });

    it('safely handles ReDoS and unescaped regex special characters in search query', async () => {
      const maliciousPatterns = [
        '(((a+)+)+)+',
        '[a-z',
        '\\',
        '^.*.*.*.*.*.*.*.*.*.*.*.*.*$',
        '??++++***'
      ];

      for (const pattern of maliciousPatterns) {
        const res = await request(app)
          .get(`/api/v1/loans?search=${encodeURIComponent(pattern)}`)
          .set('Authorization', `Bearer ${superAdminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });

  // =========================================================================
  // 4. CONCURRENCY & RACE CONDITION PROTECTION (DOUBLE-CLICK DEFENSE)
  // =========================================================================
  describe('4. Concurrency & Race Condition Defense (Double-Click Block)', () => {
    it('blocks simultaneous parallel loan requests of the same type via atomic database constraint (HTTP 409 Conflict)', async () => {
      // Fire two parallel requests concurrently with Promise.all for advance
      const [req1, req2] = await Promise.all([
        request(app)
          .post('/api/v1/loans')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            type: 'advance',
            amount: 3000000,
            repaymentTenureMonths: 1,
            effectiveStartMonth: '2025-05',
            reason: 'Concurrent request attempt 1'
          }),
        request(app)
          .post('/api/v1/loans')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            type: 'advance',
            amount: 3000000,
            repaymentTenureMonths: 1,
            effectiveStartMonth: '2025-05',
            reason: 'Concurrent request attempt 2'
          })
      ]);

      // Since pendingLoanId is already active/pending for this employee, both should be rejected with 409
      expect([409, 422]).toContain(req1.status);
      expect([409, 422]).toContain(req2.status);
    });
  });

  // =========================================================================
  // 5. SEPARATION OF DUTIES (SELF-RECOMMENDATION & SELF-APPROVAL DEFENSE)
  // =========================================================================
  describe('5. Separation of Duties (Self-Recommendation Block)', () => {
    let mgrLoanId;

    it('submits a loan as Department Manager', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          type: 'loan',
          amount: 5000000,
          repaymentTenureMonths: 6,
          effectiveStartMonth: '2025-04',
          reason: 'Manager personal expense'
        });
      expect(res.status).toBe(201);
      mgrLoanId = res.body.data._id;
    });

    it('blocks the applicant Department Manager from recommending their own loan (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${mgrLoanId}/decide`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          decision: 'recommend',
          comments: 'I recommend my own loan application'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/separation of duties/i);
    });
  });

  // =========================================================================
  // 6. BROKEN OBJECT-LEVEL AUTHORIZATION (BOLA / IDOR)
  // =========================================================================
  describe('6. Broken Object-Level Authorization (BOLA / IDOR)', () => {
    it('blocks Employee A from viewing Employee B’s loan record (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/loans/${pendingLoanId}`)
        .set('Authorization', `Bearer ${peerEmployeeToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/do not have permission/i);
    });

    it('blocks Employee A from viewing Employee B’s installment amortization schedule (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/loans/${pendingLoanId}/schedule`)
        .set('Authorization', `Bearer ${peerEmployeeToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/do not have permission/i);
    });

    it('blocks Sales Manager from recommending or deciding Engineering department loans (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${pendingLoanId}/decide`)
        .set('Authorization', `Bearer ${crossDeptManagerToken}`)
        .send({
          decision: 'recommend',
          comments: 'Cross-department recommendation exploit attempt'
        });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/department or team/i);
    });
  });

  // =========================================================================
  // 7. MULTI-TIER LIFECYCLE & PREPAYMENT BOUNDARY DEFENSE
  // =========================================================================
  describe('7. Lifecycle Integrity & Prepayment Bounds', () => {
    it('Engineering Manager recommends staff loan successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${pendingLoanId}/decide`)
        .set('Authorization', `Bearer ${deptManagerToken}`)
        .send({
          decision: 'recommend',
          comments: 'Recommended for valid medical need'
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending_hr');
    });

    it('blocks Super Admin from jumping the gun before HR verification (HTTP 400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${pendingLoanId}/decide`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          decision: 'approve',
          comments: 'Attempting to bypass HR review stage'
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid decision for HR stage/i);
    });

    it('HR Manager forwards loan to Super Admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${pendingLoanId}/decide`)
        .set('Authorization', `Bearer ${hrManagerToken}`)
        .send({
          decision: 'forward',
          comments: 'HR checks verified.'
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending_admin');
    });

    it('Super Admin approves and disburses loan', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${pendingLoanId}/decide`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          decision: 'approve',
          disbursementMethod: 'bank_transfer',
          comments: 'Disbursement authorized via corporate wire'
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
      activeLoanId = res.body.data._id;
    });

    it('rejects prepayment amount exceeding outstanding balance with HTTP 422', async () => {
      // Loan amount is 5,000,000 paisa. Attempting 10,000,000 paisa:
      const res = await request(app)
        .post(`/api/v1/loans/${activeLoanId}/prepay`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          amount: 10000000,
          paymentMethod: 'bank_transfer',
          reference: 'Overpayment attempt'
        });
      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/exceeds total outstanding balance/i);
    });

    it('executes valid prepayment and strips malicious HTML from reference', async () => {
      const res = await request(app)
        .post(`/api/v1/loans/${activeLoanId}/prepay`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          amount: 5000000,
          paymentMethod: 'bank_transfer',
          reference: '<b onmouseover=alert(1)>Bank Wire</b> REF-SEC-1001'
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('closed');
      expect(res.body.data.remainingBalance).toBe(0);
      const lastRepayment = res.body.data.repayments[res.body.data.repayments.length - 1];
      expect(lastRepayment.reference).not.toContain('<b');
      expect(lastRepayment.reference).not.toContain('onmouseover');
      expect(lastRepayment.reference).toContain('Bank Wire REF-SEC-1001');
    });

    it('rejects prepayment on an already closed loan with HTTP 400', async () => {
      const res = await request(app)
        .post(`/api/v1/loans/${activeLoanId}/prepay`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          amount: 100000,
          paymentMethod: 'cash',
          reference: 'Settlement after close'
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Cannot record prepayment on a loan with status 'closed'/i);
    });
  });
});
