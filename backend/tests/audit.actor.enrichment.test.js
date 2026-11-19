/**
 * @file audit.actor.enrichment.test.js
 * @description Unit and Integration tests for Audit Log Deep Actor Enrichment Pipeline (Phase 32 Plan 32-01).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { AuditLog } from '../src/models/auditLog.model.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import {
  formatAuditActor,
  queryAuditLogs,
  getAuditLogById
} from '../src/modules/audit/audit.service.js';

describe('Audit Log Deep Actor Enrichment Pipeline', () => {
  let superAdminRole;
  let department;
  let designation;
  let employee;
  let employeeUser;
  let adminUser;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_p32_actor_enrichment');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await AuditLog.deleteMany({});

    // 1. Create Role
    superAdminRole = await Role.create({
      name: 'Super Admin',
      label: 'Executive Administrator',
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }],
      isSystem: true
    });

    // 2. Create Department & Designation
    department = await Department.create({
      name: 'Engineering',
      code: 'ENG'
    });

    designation = await Designation.create({
      title: 'Principal Architect',
      code: 'PR-ARCH',
      departmentId: department._id,
      grade: 'Executive'
    });

    // 3. Create Linked Employee
    employee = await Employee.create({
      name: 'Tariq Mehmood',
      employeeCode: 'EMP-007',
      email: 'tariq@elvara.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      departmentId: department._id,
      designationId: designation._id,
      status: 'Active'
    });

    // 4. Create Linked User
    employeeUser = await User.create({
      email: 'tariq@elvara.com',
      passwordHash: 'dummyhash123',
      roles: [superAdminRole._id],
      employeeId: employee._id,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      isActive: true
    });

    // 5. Create Standalone Admin User (No Employee record)
    adminUser = await User.create({
      email: 'admin.root@elvara.com',
      passwordHash: 'dummyhash123',
      roles: [superAdminRole._id],
      employeeId: null,
      avatar: null,
      isActive: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('1. should deeply populate and format actor with linked Employee', async () => {
    const log = await AuditLog.create({
      actorId: employeeUser._id,
      actorEmail: employeeUser.email,
      actorRole: 'Super Admin',
      action: 'SALARY_APPROVED',
      module: 'payroll',
      status: 'SUCCESS',
      severity: 'HIGH',
      category: 'ADMINISTRATIVE',
      description: 'Monthly payroll batch approved'
    });

    const single = await getAuditLogById(log._id.toString());

    expect(single).toBeDefined();
    expect(single.actor).toBeDefined();
    expect(single.actor.name).toBe('Tariq Mehmood');
    expect(single.actor.employeeCode).toBe('EMP-007');
    expect(single.actor.email).toBe('tariq@elvara.com');
    expect(single.actor.role).toBe('Super Admin');
    expect(single.actor.department).toBe('Engineering');
    expect(single.actor.designation).toBe('Principal Architect');
    expect(single.actor.accountStatus).toBe('Active');
    expect(single.actor.employmentStatus).toBe('Active');
    expect(single.actor.isSystem).toBe(false);
  });

  it('2. should format standalone admin account without employee record gracefully', async () => {
    const log = await AuditLog.create({
      actorId: adminUser._id,
      actorEmail: adminUser.email,
      actorRole: 'Super Admin',
      action: 'SETTINGS_UPDATED',
      module: 'settings',
      status: 'SUCCESS',
      severity: 'MEDIUM',
      category: 'ADMINISTRATIVE'
    });

    const single = await getAuditLogById(log._id.toString());

    expect(single).toBeDefined();
    expect(single.actor).toBeDefined();
    expect(single.actor.name).toContain('Admin Root');
    expect(single.actor.employeeCode).toBe('N/A');
    expect(single.actor.email).toBe('admin.root@elvara.com');
    expect(single.actor.role).toBe('Super Admin');
    expect(single.actor.department).toBe('Administration');
    expect(single.actor.accountStatus).toBe('Active');
    expect(single.actor.isSystem).toBe(false);
  });

  it('3. should format automated system cron / daemon logs with null actorId', async () => {
    const log = await AuditLog.create({
      actorId: null,
      actorEmail: 'system',
      actorRole: 'SYSTEM',
      action: 'AUTO_ABSENT_CRON',
      module: 'attendance',
      status: 'SUCCESS',
      severity: 'LOW',
      category: 'SYSTEM'
    });

    const single = await getAuditLogById(log._id.toString());

    expect(single).toBeDefined();
    expect(single.actor).toBeDefined();
    expect(single.actor.name).toBe('System Automation Engine');
    expect(single.actor.employeeCode).toBe('SYS-CRON');
    expect(single.actor.role).toBe('SYSTEM');
    expect(single.actor.department).toBe('Kernel & Infrastructure');
    expect(single.actor.designation).toBe('Background Daemon');
    expect(single.actor.isSystem).toBe(true);
  });

  it('4. queryAuditLogs should return enriched items with actor metadata', async () => {
    const result = await queryAuditLogs({ module: 'payroll' }, { page: 1, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].actor).toBeDefined();
    expect(result.items[0].actor.name).toBe('Tariq Mehmood');
    expect(result.items[0].actor.employeeCode).toBe('EMP-007');
  });

  it('5. formatAuditActor unit fallback works even with undefined log', () => {
    const fallback = formatAuditActor(null);
    expect(fallback.isSystem).toBe(true);
    expect(fallback.name).toBe('System Automation Engine');
  });
});
