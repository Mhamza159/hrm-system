import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Multi-Role Assignment, Privilege Escalation Guard & Audit (Slices 26.11, 26.12, 26.16)', () => {
  let superAdminToken;
  let hrToken;
  let superAdminRole;
  let hrRole;
  let deptManagerRole;
  let employeeRole;
  let targetEmployeeUser;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m26_assign');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});
    await AuditLog.deleteMany({});

    // 1. Super Admin Role & User
    superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const superAdmin = await User.create({
      email: 'admin.assign@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    superAdminToken = jwt.sign(
      { userId: superAdmin._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // 2. HR Manager Role & User (has role.assign, employee.view, but NOT manage all)
    hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'role.assign', subject: 'Role', scope: 'all' },
        { action: 'role.view', subject: 'Role', scope: 'all' },
        { action: 'employee.view', subject: 'Employee', scope: 'all' }
      ]
    });

    const hrUser = await User.create({
      email: 'hr.assign@company.pk',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id],
      isActive: true
    });

    hrToken = jwt.sign(
      { userId: hrUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // 3. Department Manager Role
    deptManagerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'leave.approve', subject: 'Leave', scope: 'department' }
      ]
    });

    // 4. Employee Role & Target Employee User
    employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'profile.view', subject: 'Employee', scope: 'own' }
      ]
    });

    targetEmployeeUser = await User.create({
      email: 'target.employee@company.pk',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id],
      isActive: true
    });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await AuditLog.deleteMany({});
    await mongoose.disconnect();
  });

  it('PATCH /api/v1/users/:id/roles should assign multiple roles (Slice 26.11-TEST)', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${targetEmployeeUser._id}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        roleIds: [employeeRole._id.toString(), deptManagerRole._id.toString()]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roles).toHaveLength(2);
  });

  it('GET /api/v1/auth/me should return additive union of effective permissions (Slice 26.11-TEST)', async () => {
    const targetUserToken = jwt.sign(
      { userId: targetEmployeeUser._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${targetUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roles).toHaveLength(2);

    const effective = res.body.data.effectivePermissions;
    expect(effective).toBeInstanceOf(Array);
    const actions = effective.map((p) => p.action);
    // User has both profile.view (from Employee) and leave.approve (from Dept Manager)
    expect(actions).toContain('profile.view');
    expect(actions).toContain('leave.approve');
  });

  it('PATCH /api/v1/users/:id/roles should reject HR Manager assigning Super Admin role (Slice 26.12-TEST Privilege Escalation)', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${targetEmployeeUser._id}/roles`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        roleIds: [superAdminRole._id.toString()]
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Privilege Escalation Guard/i);
  });

  it('PATCH /api/v1/users/:id/roles should reject HR Manager assigning a role with permissions exceeding their own (Slice 26.12-TEST)', async () => {
    // Dept manager has 'leave.approve' which HR Manager in this test does not possess
    const res = await request(app)
      .patch(`/api/v1/users/${targetEmployeeUser._id}/roles`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        roleIds: [deptManagerRole._id.toString()]
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/exceeds your own/i);
  });

  it('Audit logging should record role assignment with details (Slice 26.16-TEST)', async () => {
    const logs = await AuditLog.find({ action: 'user.roles_assigned' });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].targetId.toString()).toBe(targetEmployeeUser._id.toString());
    expect(logs[0].details.assignedRoleNames).toContain('Department Manager');
  });
});
