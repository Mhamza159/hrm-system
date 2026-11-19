import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/user.model.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

describe('M6 Multi-Role PBAC & RBAC Enforcement Matrix', () => {
  let employeeToken;
  let managerToken;
  let hrToken;
  let adminToken;

  const makeToken = (user) => {
    return jwt.sign(
      { userId: user._id, email: user.email, roles: user.roles },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    await connectDB();
    const { Role } = await import('../src/models/role.model.js');

    // Resolve or bootstrap roles
    let adminRole = await Role.findOne({ name: 'Super Admin', isDeleted: { $ne: true } });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Super Admin',
        isSystem: true,
        permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
      });
    }

    let hrRole = await Role.findOne({ name: 'HR Manager', isDeleted: { $ne: true } });
    if (!hrRole) {
      hrRole = await Role.create({
        name: 'HR Manager',
        isSystem: true,
        permissions: [
          { action: 'leave.view', subject: 'Leave', scope: 'all' },
          { action: 'leave.approve', subject: 'Leave', scope: 'all' },
          { action: 'leave.settings', subject: 'Leave', scope: 'all' },
          { action: 'report.view', subject: 'Report', scope: 'all' },
          { action: 'report.export', subject: 'Report', scope: 'all' }
        ]
      });
    }

    let mgrRole = await Role.findOne({ name: 'Department Manager', isDeleted: { $ne: true } });
    if (!mgrRole) {
      mgrRole = await Role.create({
        name: 'Department Manager',
        isSystem: true,
        permissions: [
          { action: 'leave.view', subject: 'Leave', scope: 'team' },
          { action: 'leave.approve', subject: 'Leave', scope: 'team', limit: 3 }
        ]
      });
    }

    let empRole = await Role.findOne({ name: 'Employee', isDeleted: { $ne: true } });
    if (!empRole) {
      empRole = await Role.create({
        name: 'Employee',
        isSystem: true,
        permissions: [
          { action: 'leave.view', subject: 'Leave', scope: 'own' },
          { action: 'leave.apply', subject: 'Leave', scope: 'own' }
        ]
      });
    }

    // Resolve or bootstrap test users
    let adminUser = await User.findOne({ email: 'mhamzaofficial159@gmail.com' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'mhamzaofficial159@gmail.com',
        passwordHash: 'dummy_hash',
        roles: [adminRole._id],
        isActive: true
      });
    }

    let hrUser = await User.findOne({ email: 'hr@hrm.company.pk' });
    if (!hrUser) {
      hrUser = await User.create({
        email: 'hr@hrm.company.pk',
        passwordHash: 'dummy_hash',
        roles: [hrRole._id],
        isActive: true
      });
    }

    let mgrUser = await User.findOne({ email: 'manager@hrm.company.pk' });
    if (!mgrUser) {
      mgrUser = await User.create({
        email: 'manager@hrm.company.pk',
        passwordHash: 'dummy_hash',
        roles: [mgrRole._id],
        isActive: true
      });
    }

    let empUser = await User.findOne({ email: 'employee@hrm.company.pk' });
    if (!empUser) {
      empUser = await User.create({
        email: 'employee@hrm.company.pk',
        passwordHash: 'dummy_hash',
        roles: [empRole._id],
        isActive: true
      });
    }

    // Ensure Employee profile exists for leave balance resolution
    const { Employee } = await import('../src/models/employee.model.js');
    let empDoc = await Employee.findOne({ userId: empUser._id });
    if (!empDoc) {
      await Employee.create({
        employeeCode: 'EMP-PBAC-TEST',
        userId: empUser._id,
        name: 'PBAC Test Employee',
        email: empUser.email,
        status: 'Active',
        employmentType: 'Permanent',
        joiningDate: new Date('2024-01-01'),
        isDeleted: false
      });
    }

    employeeToken = makeToken(empUser);
    managerToken = makeToken(mgrUser);
    hrToken = makeToken(hrUser);
    adminToken = makeToken(adminUser);
  }, 30000);

  it('Role 1: Employee CAN view balance and CANNOT create leave types (403)', async () => {
    // Allowed
    const resAllowed = await request(app)
      .get('/api/v1/leaves/balance')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(resAllowed.statusCode).toBe(200);

    // Forbidden: Employee cannot create leave types
    const resForbidden = await request(app)
      .post('/api/v1/leave-types')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Hacker Leave', code: 'HL', daysPerYear: 30 });
    expect(resForbidden.statusCode).toBe(403);
  });

  it('Role 1: Employee CANNOT create holidays or override balances (403)', async () => {
    const resHoliday = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Fake Holiday', date: '2026-12-31' });
    expect(resHoliday.statusCode).toBe(403);

    const resOverride = await request(app)
      .patch('/api/v1/leave-balances/6ad72f3f43b132bb9a4f1eaf')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ balanceId: '6ad72f3f43b132bb9a4f1eaf', days: 50, reason: 'Unauthorized' });
    expect(resOverride.statusCode).toBe(403);
  });

  it('Role 2: Department Manager CAN view team leaves, CANNOT create leave types (403)', async () => {
    const resApprovals = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(resApprovals.statusCode).toBe(200);

    const resTypes = await request(app)
      .post('/api/v1/leave-types')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Manager Custom Leave', code: 'MCL' });
    expect(resTypes.statusCode).toBe(403);
  });

  it('Role 2: Department Manager CANNOT manage holidays or override balances (403)', async () => {
    const resHoliday = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Manager Holiday', date: '2026-11-15' });
    expect(resHoliday.statusCode).toBe(403);

    const resOverride = await request(app)
      .patch('/api/v1/leave-balances/6ad72f3f43b132bb9a4f1eaf')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ balanceId: '6ad72f3f43b132bb9a4f1eaf', days: 50 });
    expect(resOverride.statusCode).toBe(403);
  });

  it('Role 3: HR Manager CAN view leave approvals and export reports', async () => {
    const resApprovals = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(resApprovals.statusCode).toBe(200);

    const resReport = await request(app)
      .get('/api/v1/reports/leaves')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(resReport.statusCode).toBe(200);
  });

  it('Role 4: Super Admin possesses unrestricted access', async () => {
    const resTypes = await request(app)
      .get('/api/v1/leave-types')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resTypes.statusCode).toBe(200);

    const resReport = await request(app)
      .get('/api/v1/reports/leaves')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resReport.statusCode).toBe(200);
  });
});
