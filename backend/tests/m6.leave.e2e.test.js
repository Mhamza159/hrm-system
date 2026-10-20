/**
 * @file m6.leave.e2e.test.js
 * @description Multi-Role End-to-End System Verification for Module M6 (BUILD-GUIDE Section 11 · Rows 6.1 - 6.15).
 * 
 * ROLE JOURNEYS TESTED:
 * 1. Super Admin:
 *    - Configures core leave types (Annual, Sick, Casual)
 *    - Seeds Pakistan Gazetted & Optional Holidays
 *    - Performs manual balance override with audit verification
 *    - Decides annual leave encashment payout
 * 2. HR Manager:
 *    - Inspects company-wide conflict calendar
 *    - Updates lunar holiday observation date
 *    - Inspects multi-tier approval queue
 *    - Performs final approval, verifying auto-attendance synchronization
 *    - Exports company-wide leave analytics spreadsheet
 * 3. Department Manager:
 *    - Inspects team-scoped leave calendar
 *    - Approves tier-1 department leave request
 *    - Handles delegated approval for peer manager
 *    - Exports team-scoped leave spreadsheet
 * 4. Employee:
 *    - Inspects live balance cards
 *    - Submits full-day leave and half-day leave
 *    - Enforces mandatory medical attachment for sick leave >2 days
 *    - Cancels pending request and verifies quota restoration
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
import { LeaveType } from '../src/models/leaveType.model.js';
import { LeaveBalance } from '../src/models/leaveBalance.model.js';
import { Leave } from '../src/models/leave.model.js';
import { Holiday } from '../src/models/holiday.model.js';
import { Delegation } from '../src/models/delegation.model.js';
import { LeaveEncashment } from '../src/models/leaveEncashment.model.js';
import { Attendance } from '../src/models/attendance.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { seedPakistanHolidays } from '../src/seed/holidays.seed.js';

describe('Module M6 — Multi-Role End-to-End Verification (E2E-M6)', () => {
  let superAdminToken, hrToken, managerToken, delegatedManagerToken, employeeToken;
  let superAdminUser, hrUser, managerUser, delegatedManagerUser, employeeUser;
  let itDept, salesDept;
  let mgrEmp, delegatedMgrEmp, staffEmp;
  let annualType, sickType, casualType;
  let annualBalanceDoc;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m6_e2e');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Department.deleteMany({});
    await Employee.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await Leave.deleteMany({});
    await Holiday.deleteMany({});
    await Delegation.deleteMany({});
    await LeaveEncashment.deleteMany({});
    await Attendance.deleteMany({});
    await AuditLog.deleteMany({});

    // Roles
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [
        { action: 'manage', subject: 'all', scope: 'all' },
        { action: 'leave.settings', subject: 'Leave', scope: 'all' },
        { action: 'leave.view', subject: 'Leave', scope: 'all' },
        { action: 'leave.approve', subject: 'Leave', scope: 'all' },
        { action: 'leave.encash', subject: 'Leave', scope: 'all' },
        { action: 'report.export', subject: 'Report', scope: 'all' }
      ]
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.settings', subject: 'Leave', scope: 'all' },
        { action: 'leave.view', subject: 'Leave', scope: 'all' },
        { action: 'leave.approve', subject: 'Leave', scope: 'all' },
        { action: 'leave.encash', subject: 'Leave', scope: 'all' },
        { action: 'report.export', subject: 'Report', scope: 'all' }
      ]
    });

    const managerRole = await Role.create({
      name: 'Department Manager',
      isSystem: false,
      permissions: [
        { action: 'leave.view', subject: 'Leave', scope: 'team' },
        { action: 'leave.approve', subject: 'Leave', scope: 'team' },
        { action: 'report.export', subject: 'Report', scope: 'team' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'leave.apply', subject: 'Leave', scope: 'own' },
        { action: 'leave.view', subject: 'Leave', scope: 'own' },
        { action: 'leave.cancel', subject: 'Leave', scope: 'own' },
        { action: 'leave.encash', subject: 'Leave', scope: 'own' }
      ]
    });

    // Departments
    itDept = await Department.create({ name: 'Information Technology', code: 'IT' });
    salesDept = await Department.create({ name: 'Commercial Sales', code: 'SALES' });

    // Employees
    mgrEmp = await Employee.create({
      name: 'IT Manager',
      firstName: 'IT',
      lastName: 'Manager',
      employeeCode: 'EMP-IT-MGR',
      workEmail: 'it.mgr@example.com',
      departmentId: itDept._id,
      joiningDate: new Date('2024-01-01'),
      salary: 150000,
      status: 'Active'
    });

    delegatedMgrEmp = await Employee.create({
      name: 'Sales Manager',
      firstName: 'Sales',
      lastName: 'Manager',
      employeeCode: 'EMP-SALES-MGR',
      workEmail: 'sales.mgr@example.com',
      departmentId: salesDept._id,
      joiningDate: new Date('2024-01-01'),
      salary: 140000,
      status: 'Active'
    });

    staffEmp = await Employee.create({
      name: 'Tariq Mehmood',
      firstName: 'Tariq',
      lastName: 'Mehmood',
      employeeCode: 'EMP-IT-007',
      workEmail: 'tariq@example.com',
      departmentId: itDept._id,
      managerId: mgrEmp._id,
      joiningDate: new Date('2024-01-01'),
      salary: 60000,
      status: 'Active'
    });

    // Users
    superAdminUser = await User.create({
      email: 'admin@example.com',
      passwordHash: 'hash123',
      roles: [superAdminRole._id],
      status: 'Active'
    });

    hrUser = await User.create({
      email: 'hr@example.com',
      passwordHash: 'hash123',
      roles: [hrRole._id],
      status: 'Active'
    });

    managerUser = await User.create({
      email: 'it.mgr@example.com',
      passwordHash: 'hash123',
      roles: [managerRole._id],
      employeeId: mgrEmp._id,
      status: 'Active'
    });
    mgrEmp.userId = managerUser._id;
    await mgrEmp.save();

    delegatedManagerUser = await User.create({
      email: 'sales.mgr@example.com',
      passwordHash: 'hash123',
      roles: [managerRole._id],
      employeeId: delegatedMgrEmp._id,
      status: 'Active'
    });
    delegatedMgrEmp.userId = delegatedManagerUser._id;
    await delegatedMgrEmp.save();

    employeeUser = await User.create({
      email: 'tariq@example.com',
      passwordHash: 'hash123',
      roles: [employeeRole._id],
      employeeId: staffEmp._id,
      status: 'Active'
    });
    staffEmp.userId = employeeUser._id;
    await staffEmp.save();

    // Helper to generate JWT
    const signToken = (u, empId) =>
      jwt.sign(
        { userId: u._id, email: u.email, employeeId: empId },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

    superAdminToken = signToken(superAdminUser, null);
    hrToken = signToken(hrUser, null);
    managerToken = signToken(managerUser, mgrEmp._id);
    delegatedManagerToken = signToken(delegatedManagerUser, delegatedMgrEmp._id);
    employeeToken = signToken(employeeUser, staffEmp._id);
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // =========================================================================
  // JOURNEY 1: SUPER ADMIN
  // =========================================================================
  describe('1. Super Admin Operations', () => {
    it('1.1 Configures core leave types (Annual, Sick, Casual)', async () => {
      const annualRes = await request(app)
        .post('/api/v1/leave-types')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Annual Leave',
          code: 'ANNUAL',
          category: 'annual',
          daysPerYear: 14,
          isPaid: true,
          encashmentAllowed: true,
          rolloverAllowed: true,
          carryForwardMax: 5,
          requiresAttachment: false,
          minDaysForAttachment: 3,
          genderConstraint: 'any',
          isActive: true
        });

      expect(annualRes.status).toBe(201);
      annualType = annualRes.body.data;

      const sickRes = await request(app)
        .post('/api/v1/leave-types')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Sick Leave',
          code: 'SICK',
          category: 'sick',
          daysPerYear: 8,
          isPaid: true,
          requiresAttachment: true,
          minDaysForAttachment: 2,
          genderConstraint: 'any',
          isActive: true
        });

      expect(sickRes.status).toBe(201);
      sickType = sickRes.body.data;

      const casualRes = await request(app)
        .post('/api/v1/leave-types')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Casual Leave',
          code: 'CASUAL',
          category: 'casual',
          daysPerYear: 10,
          isPaid: true,
          genderConstraint: 'any',
          isActive: true
        });

      expect(casualRes.status).toBe(201);
      casualType = casualRes.body.data;
    });

    it('1.2 Seeds Pakistan Gazetted & Optional Holidays for the year', async () => {
      await seedPakistanHolidays(2026);
      const holidays = await Holiday.find({ year: 2026 });
      expect(holidays.length).toBeGreaterThanOrEqual(10);
    });

    it('1.3 Initializes employee leave balances and performs manual quota adjustment with audit log', async () => {
      // Create initial balance doc
      annualBalanceDoc = await LeaveBalance.create({
        employeeId: staffEmp._id,
        year: 2026,
        balances: [
          {
            leaveTypeId: annualType._id,
            allocatedDays: 14,
            carriedForwardDays: 0,
            usedDays: 0,
            pendingDays: 0,
            encashedDays: 0
          },
          {
            leaveTypeId: sickType._id,
            allocatedDays: 8,
            carriedForwardDays: 0,
            usedDays: 0,
            pendingDays: 0,
            encashedDays: 0
          },
          {
            leaveTypeId: casualType._id,
            allocatedDays: 10,
            carriedForwardDays: 0,
            usedDays: 0,
            pendingDays: 0,
            encashedDays: 0
          }
        ]
      });

      // Super Admin manual override
      const overrideRes = await request(app)
        .patch(`/api/v1/leaves/balance/${annualBalanceDoc._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          balances: [
            {
              leaveTypeId: annualType._id,
              allocatedDays: 16,
              carriedForwardDays: 2
            }
          ],
          overrideReason: 'Management bonus quota for excellent performance'
        });

      expect(overrideRes.status).toBe(200);
      const cat = overrideRes.body.data.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
      expect(cat.allocatedDays).toBe(16);
      expect(cat.carriedForwardDays).toBe(2);

      // Verify immutable audit log
      const audit = await AuditLog.findOne({
        targetId: annualBalanceDoc._id,
        action: 'LEAVE_BALANCE_OVERRIDE'
      });
      expect(audit).toBeDefined();
      expect(audit.details.overrideReason).toMatch(/Management bonus quota/i);
    });
  });

  // =========================================================================
  // JOURNEY 2: EMPLOYEE (REQUEST LIFECYCLE)
  // =========================================================================
  describe('2. Employee Self-Service Operations', () => {
    let pendingLeaveId;

    it('2.1 Views live leave balance cards with remaining quotas', async () => {
      const res = await request(app)
        .get('/api/v1/leaves/balance?year=2026')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.balances).toBeDefined();
      const annual = res.body.data.balances.find((b) => b.leaveType._id.toString() === annualType._id.toString());
      expect(annual.totalEntitlement).toBe(18); // 16 allocated + 2 carried forward
    });

    it('2.2 Applies for 1-day leave, atomic pendingDays increment, and successfully cancels it', async () => {
      const applyRes = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: annualType._id,
          startDate: '2026-07-01',
          endDate: '2026-07-01',
          reason: 'Personal urgent commitment'
        });

      expect(applyRes.status).toBe(201);
      pendingLeaveId = applyRes.body.data._id;

      // Verify pending balance increased
      let balance = await LeaveBalance.findById(annualBalanceDoc._id);
      let cat = balance.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
      expect(cat.pendingDays).toBe(1);

      // Cancel the pending leave
      const cancelRes = await request(app)
        .patch(`/api/v1/leaves/${pendingLeaveId}/cancel`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ cancellationReason: 'Plans cancelled by family' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('cancelled');

      // Verify quota is restored immediately
      balance = await LeaveBalance.findById(annualBalanceDoc._id);
      cat = balance.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
      expect(cat.pendingDays).toBe(0);
    });

    it('2.3 Rejects sick leave > 2 days when medical attachment is absent, accepts with attachmentUrl', async () => {
      // 3-day sick leave without certificate
      const failRes = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: sickType._id,
          startDate: '2026-07-06',
          endDate: '2026-07-08',
          reason: 'Severe fever and viral flu'
        });

      expect(failRes.status).toBe(400);
      expect(failRes.body.message).toMatch(/medical proof/i);

      // Submit with certificate
      const okRes = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: sickType._id,
          startDate: '2026-07-06',
          endDate: '2026-07-08',
          reason: 'Severe fever and viral flu',
          attachmentUrl: 'https://cloudinary.com/uploads/medical_cert_01.pdf'
        });

      expect(okRes.status).toBe(201);
      expect(okRes.body.data.attachmentUrl).toBe('https://cloudinary.com/uploads/medical_cert_01.pdf');
    });

    it('2.4 Submits half-day leave application with 0.5 day quota consumption', async () => {
      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: casualType._id,
          startDate: '2026-07-15',
          endDate: '2026-07-15',
          halfDay: 'first_half',
          reason: 'Morning doctor consultation'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.days).toBe(0.5);
      expect(res.body.data.halfDay).toBe('first_half');
    });
  });

  // =========================================================================
  // JOURNEY 3: DEPARTMENT MANAGER & DELEGATION
  // =========================================================================
  describe('3. Department Manager & Delegation Workflow', () => {
    let twoTierLeaveId;

    it('3.1 Submits two-tier annual leave request for employee', async () => {
      const res = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: annualType._id,
          startDate: '2026-08-03',
          endDate: '2026-08-04',
          reason: 'Annual family roadtrip'
        });

      expect(res.status).toBe(201);
      twoTierLeaveId = res.body.data._id;
      expect(res.body.data.approvalChain.length).toBe(2); // Step 1: Manager, Step 2: HR
    });

    it('3.2 Department Manager approves Step 1 (advances to HR Manager Step 2)', async () => {
      const res = await request(app)
        .patch(`/api/v1/leaves/${twoTierLeaveId}/decide`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          action: 'approve',
          reason: 'Coverage arranged with backup dev'
        });

      expect(res.status).toBe(200);
      const leave = res.body.data;
      expect(leave.status).toBe('pending'); // Still pending final HR step
      expect(leave.approvalChain[0].status).toBe('approved');
      expect(leave.approvalChain[1].status).toBe('pending');
    });

    it('3.3 Handles delegated approval when Manager creates active delegation to Sales Manager', async () => {
      // Create delegation from IT Manager to Sales Manager
      const now = new Date();
      await Delegation.create({
        fromUserId: managerUser._id,
        toUserId: delegatedManagerUser._id,
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        permissions: [{ action: 'leave.approve', subject: 'Leave', scope: 'team' }],
        reason: 'Hajj leave absence delegation',
        status: 'active'
      });

      // Submit another 1-tier casual leave
      const newLeaveRes = await request(app)
        .post('/api/v1/leaves')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: casualType._id,
          startDate: '2026-08-10',
          endDate: '2026-08-10',
          reason: 'Personal errands'
        });

      const delegatedLeaveId = newLeaveRes.body.data._id;

      // Delegated Sales Manager approves on behalf of IT Manager
      const approveRes = await request(app)
        .patch(`/api/v1/leaves/${delegatedLeaveId}/decide`)
        .set('Authorization', `Bearer ${delegatedManagerToken}`)
        .send({
          action: 'approve',
          reason: 'Approved via delegated authority during manager leave'
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('pending'); // Step 1 approved via delegation, Step 2 HR still pending
      expect(approveRes.body.data.approvalChain[0].status).toBe('approved');
      expect(approveRes.body.data.approvalChain[0].delegatedFrom.toString()).toBe(managerUser._id.toString());
    });

    it('3.4 Department Manager views team conflict calendar and exports team-scoped Excel', async () => {
      const calRes = await request(app)
        .get('/api/v1/leaves/calendar?month=2026-08')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(calRes.status).toBe(200);
      expect(calRes.body.data.leaves).toBeDefined();

      const exportRes = await request(app)
        .get('/api/v1/reports/leaves?year=2026')
        .set('Authorization', `Bearer ${managerToken}`)
        .responseType('blob');

      expect(exportRes.status).toBe(200);
      expect(exportRes.headers['content-type']).toContain('spreadsheetml.sheet');
    });
  });

  // =========================================================================
  // JOURNEY 4: HR MANAGER (FINAL SETTLEMENT & ATTENDANCE SYNC)
  // =========================================================================
  describe('4. HR Manager Governance & Full Attendance Sync', () => {
    it('4.1 HR Manager executes Step 2 final approval, settling balance and triggering auto-attendance sync', async () => {
      // Find the two-tier leave from section 3
      const pendingLeaves = await Leave.find({ employeeId: staffEmp._id, status: 'pending' });
      const twoTierLeave = pendingLeaves.find((l) => l.approvalChain.length === 2 && l.approvalChain[0].status === 'approved');

      expect(twoTierLeave).toBeDefined();

      const decideRes = await request(app)
        .patch(`/api/v1/leaves/${twoTierLeave._id}/decide`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          action: 'approve',
          reason: 'Final HR approval granted'
        });

      expect(decideRes.status).toBe(200);
      expect(decideRes.body.data.status).toBe('approved');

      // Verify usedDays increased and pendingDays decremented
      const balance = await LeaveBalance.findById(annualBalanceDoc._id);
      const cat = balance.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
      expect(cat.usedDays).toBe(twoTierLeave.days);

      // Verify attendance records automatically synced
      const syncedAttendance = await Attendance.find({
        employeeId: staffEmp._id,
        status: 'on_leave'
      });
      expect(syncedAttendance.length).toBe(2);
    });

    it('4.2 HR Manager edits lunar holiday observation date', async () => {
      const eidHoliday = await Holiday.findOne({ isLunar: true });
      if (eidHoliday) {
        const updateRes = await request(app)
          .patch(`/api/v1/holidays/${eidHoliday._id}`)
          .set('Authorization', `Bearer ${hrToken}`)
          .send({
            date: '2026-03-22',
            description: 'Updated Ruet-e-Hilal moon sighting confirmation'
          });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.data.description).toMatch(/moon sighting/i);
      }
    });

    it('4.3 HR Manager requests and Super Admin approves Year-End Leave Encashment', async () => {
      // Request encashment for 3 days of remaining annual leave
      const encashReqRes = await request(app)
        .post('/api/v1/leaves/encash')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: annualType._id,
          year: 2026,
          days: 3
        });

      expect(encashReqRes.status).toBe(201);
      const encashmentId = encashReqRes.body.data._id;
      expect(encashReqRes.body.data.totalAmountPaisa).toBeGreaterThan(0);

      // Super Admin approves encashment
      const decideEncashRes = await request(app)
        .patch(`/api/v1/leaves/encash/${encashmentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          action: 'approve',
          decisionReason: 'Eligible unused annual leave encashment cleared for payroll'
        });

      expect(decideEncashRes.status).toBe(200);
      expect(decideEncashRes.body.data.status).toBe('approved');

      // Verify balance encashedDays updated
      const balance = await LeaveBalance.findById(annualBalanceDoc._id);
      const cat = balance.balances.find((b) => b.leaveTypeId.toString() === annualType._id.toString());
      expect(cat.encashedDays).toBe(3);
    });

    it('4.4 Exports comprehensive company-wide Excel leave report', async () => {
      const res = await request(app)
        .get('/api/v1/reports/leaves?year=2026')
        .set('Authorization', `Bearer ${hrToken}`)
        .responseType('blob');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.body).toBeDefined();
    });
  });
});
