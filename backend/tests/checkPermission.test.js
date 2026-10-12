import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { checkPermission, buildAbilityForUser, getEffectiveScopeForAction } from '../src/middlewares/checkPermission.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

describe('CASL checkPermission Middleware (Slice 26.3-TEST)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock route guarded by checkPermission('role.manage')
    app.post(
      '/test-admin',
      (req, res, next) => {
        // Mock authentication attaching user
        req.user = req.body.mockUser;
        next();
      },
      checkPermission('role.manage', 'Role'),
      (req, res) => {
        res.status(200).json({
          success: true,
          permissionScope: req.permissionScope,
          message: 'Access granted'
        });
      }
    );

    // Mock route guarded by checkPermission('leave.view')
    app.get(
      '/test-leave',
      (req, res, next) => {
        req.user = JSON.parse(req.headers['x-mock-user'] || '{}');
        next();
      },
      checkPermission('leave.view', 'Leave'),
      (req, res) => {
        res.status(200).json({
          success: true,
          permissionScope: req.permissionScope,
          message: 'Leave accessed'
        });
      }
    );

    app.use(errorHandler);
  });

  it('should allow Super Admin with manage:all to access guarded endpoints', async () => {
    const superAdminUser = {
      _id: 'admin_123',
      roles: [{ name: 'Super Admin', isSystem: true, permissions: [{ action: 'manage', subject: 'all', scope: 'all' }] }]
    };

    const res = await request(app)
      .post('/test-admin')
      .send({ mockUser: superAdminUser });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.permissionScope).toBe('all');
  });

  it('should allow user with specific permission and attach resolved scope', async () => {
    const managerUser = {
      _id: 'mgr_123',
      roles: [
        {
          name: 'Department Manager',
          permissions: [{ action: 'leave.view', subject: 'Leave', scope: 'team' }]
        }
      ]
    };

    const res = await request(app)
      .get('/test-leave')
      .set('x-mock-user', JSON.stringify(managerUser));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.permissionScope).toBe('team');
  });

  it('should reject user lacking required permission with 403 Forbidden', async () => {
    const employeeUser = {
      _id: 'emp_123',
      roles: [
        {
          name: 'Employee',
          permissions: [{ action: 'attendance.mark', subject: 'Attendance', scope: 'own' }]
        }
      ]
    };

    const res = await request(app)
      .post('/test-admin')
      .send({ mockUser: employeeUser });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });

  it('should merge multi-role permissions additively and pick most permissive scope', () => {
    const multiRoleUser = {
      roles: [
        {
          name: 'Employee',
          permissions: [{ action: 'attendance.view', subject: 'Attendance', scope: 'own' }]
        },
        {
          name: 'Team Lead',
          permissions: [{ action: 'attendance.view', subject: 'Attendance', scope: 'team' }]
        }
      ]
    };

    const ability = buildAbilityForUser(multiRoleUser);
    expect(ability.can('attendance.view', 'Attendance')).toBe(true);

    const effectiveScope = getEffectiveScopeForAction(multiRoleUser, 'attendance.view');
    expect(effectiveScope).toBe('team');
  });
});
