import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { checkApprovalLimit } from '../src/utils/approvalLimit.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Granular Approval Limits & Role Cloning Engine (Slices 26.9 & 26.10)', () => {
  let superAdminToken;
  let deptManagerRole;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m26_limits_clone');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
    await Role.deleteMany({});

    // Super Admin
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    const superAdmin = await User.create({
      email: 'admin.clone@company.pk',
      passwordHash: 'dummy_hash',
      roles: [superAdminRole._id],
      isActive: true
    });

    superAdminToken = jwt.sign(
      { userId: superAdmin._id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // Department Manager role with limit: 50000 on expense.approve
    deptManagerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        {
          action: 'expense.approve',
          subject: 'Expense',
          scope: 'department',
          limit: 50000
        }
      ]
    });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Slice 26.9: Approval Limits Verification Engine', () => {
    it('should permit approval within configured limit threshold', () => {
      const mockUser = {
        roles: [
          {
            name: 'Department Manager',
            permissions: [{ action: 'expense.approve', limit: 50000 }]
          }
        ]
      };

      const result = checkApprovalLimit(mockUser, 'expense.approve', 35000);
      expect(result.allowed).toBe(true);
      expect(result.maxLimit).toBe(50000);
    });

    it('should reject approval when requested amount exceeds configured limit', () => {
      const mockUser = {
        roles: [
          {
            name: 'Department Manager',
            permissions: [{ action: 'expense.approve', limit: 50000 }]
          }
        ]
      };

      const result = checkApprovalLimit(mockUser, 'expense.approve', 75000);
      expect(result.allowed).toBe(false);
      expect(result.maxLimit).toBe(50000);
      expect(result.reason).toMatch(/exceeds maximum configured approval limit/i);
    });

    it('should permit any amount for Super Admin', () => {
      const superUser = {
        roles: ['Super Admin']
      };

      const result = checkApprovalLimit(superUser, 'expense.approve', 10000000);
      expect(result.allowed).toBe(true);
      expect(result.maxLimit).toBeNull();
    });
  });

  describe('Slice 26.10: Role Cloning Engine', () => {
    it('POST /api/v1/roles/:id/clone should clone role with new name and identical permissions', async () => {
      const res = await request(app)
        .post(`/api/v1/roles/${deptManagerRole._id}/clone`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          newName: 'Assistant Department Manager'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Assistant Department Manager');
      expect(res.body.data.isSystem).toBe(false);
      expect(res.body.data.permissions).toHaveLength(1);
      expect(res.body.data.permissions[0].action).toBe('expense.approve');
      expect(res.body.data.permissions[0].limit).toBe(50000);

      // Verify persistence in DB
      const clonedInDb = await Role.findOne({ name: 'Assistant Department Manager' });
      expect(clonedInDb).not.toBeNull();
      expect(clonedInDb.isSystem).toBe(false);
    });
  });
});
