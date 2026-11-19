import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { checkPermission, buildAbilityForUser, getEffectiveScopeForAction } from '../src/middlewares/checkPermission.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

describe('Phase 30: System-Wide RBAC & PBAC Multi-Role Visibility & Authorization Audit Test Suite', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Middleware to attach mock user from header
    const mockAuth = (req, res, next) => {
      if (req.headers['x-mock-user']) {
        req.user = JSON.parse(req.headers['x-mock-user']);
      }
      next();
    };

    // Route 1: Employee Management (Create)
    app.post(
      '/api/v1/employees',
      mockAuth,
      checkPermission('employee.create', 'Employee'),
      (req, res) => {
        res.status(201).json({
          success: true,
          scope: req.permissionScope,
          message: 'Employee created'
        });
      }
    );

    // Route 2: Employee Management (Edit)
    app.put(
      '/api/v1/employees/:id',
      mockAuth,
      checkPermission('employee.edit', 'Employee'),
      (req, res) => {
        res.status(200).json({
          success: true,
          scope: req.permissionScope,
          message: 'Employee updated'
        });
      }
    );

    // Route 3: Employee Management (Delete)
    app.delete(
      '/api/v1/employees/:id',
      mockAuth,
      checkPermission('employee.delete', 'Employee'),
      (req, res) => {
        res.status(200).json({
          success: true,
          scope: req.permissionScope,
          message: 'Employee deleted'
        });
      }
    );

    // Route 4: Payroll Processing (Run)
    app.post(
      '/api/v1/payroll/runs',
      mockAuth,
      checkPermission('payroll.run', 'Payroll'),
      (req, res) => {
        res.status(200).json({
          success: true,
          scope: req.permissionScope,
          message: 'Payroll run executed'
        });
      }
    );

    // Route 5: Leave Approvals
    app.post(
      '/api/v1/leaves/:id/decide',
      mockAuth,
      checkPermission('leave.approve', 'Leave'),
      (req, res) => {
        res.status(200).json({
          success: true,
          scope: req.permissionScope,
          message: 'Leave decision processed'
        });
      }
    );

    // Route 6: Role Administration
    app.post(
      '/api/v1/roles',
      mockAuth,
      checkPermission('role.manage', 'Role'),
      (req, res) => {
        res.status(201).json({
          success: true,
          scope: req.permissionScope,
          message: 'Role created'
        });
      }
    );

    // Route 7: Root System Settings
    app.put(
      '/api/v1/settings',
      mockAuth,
      checkPermission('settings.manage', 'Settings'),
      (req, res) => {
        res.status(200).json({
          success: true,
          scope: req.permissionScope,
          message: 'Settings updated'
        });
      }
    );

    app.use(errorHandler);
  });

  // Persona 1: Super Admin
  it('Persona 1 [Super Admin]: possesses unrestricted global access across all endpoints via manage:all', async () => {
    const superAdmin = {
      _id: 'user_super_admin',
      roles: [{ name: 'Super Admin', isSystem: true, permissions: [{ action: 'manage', subject: 'all', scope: 'all' }] }]
    };
    const header = JSON.stringify(superAdmin);

    const empRes = await request(app).post('/api/v1/employees').set('x-mock-user', header).send({});
    expect(empRes.status).toBe(201);
    expect(empRes.body.scope).toBe('all');

    const payRes = await request(app).post('/api/v1/payroll/runs').set('x-mock-user', header).send({});
    expect(payRes.status).toBe(200);

    const roleRes = await request(app).post('/api/v1/roles').set('x-mock-user', header).send({});
    expect(roleRes.status).toBe(201);

    const setRes = await request(app).put('/api/v1/settings').set('x-mock-user', header).send({});
    expect(setRes.status).toBe(200);
  });

  // Persona 2: HR Manager
  it('Persona 2 [HR Manager]: can manage workforce and payroll, but blocked from role management & system settings', async () => {
    const hrManager = {
      _id: 'user_hr_manager',
      roles: [
        {
          name: 'HR Manager',
          permissions: [
            { action: 'employee.create', subject: 'Employee', scope: 'all' },
            { action: 'employee.edit', subject: 'Employee', scope: 'all' },
            { action: 'payroll.run', subject: 'Payroll', scope: 'all' },
            { action: 'leave.approve', subject: 'Leave', scope: 'all' }
          ]
        }
      ]
    };
    const header = JSON.stringify(hrManager);

    // Allowed
    const empRes = await request(app).post('/api/v1/employees').set('x-mock-user', header).send({});
    expect(empRes.status).toBe(201);

    const payRes = await request(app).post('/api/v1/payroll/runs').set('x-mock-user', header).send({});
    expect(payRes.status).toBe(200);

    // Forbidden: role.manage
    const roleRes = await request(app).post('/api/v1/roles').set('x-mock-user', header).send({});
    expect(roleRes.status).toBe(403);
    expect(roleRes.body.success).toBe(false);

    // Forbidden: settings.manage
    const setRes = await request(app).put('/api/v1/settings').set('x-mock-user', header).send({});
    expect(setRes.status).toBe(403);
  });

  // Persona 3: Department Manager
  it('Persona 3 [Department Manager]: can approve leaves within departmental scope, but forbidden from payroll and roles', async () => {
    const deptManager = {
      _id: 'user_dept_manager',
      roles: [
        {
          name: 'Department Manager',
          permissions: [
            { action: 'leave.approve', subject: 'Leave', scope: 'department' },
            { action: 'employee.view', subject: 'Employee', scope: 'department' }
          ]
        }
      ]
    };
    const header = JSON.stringify(deptManager);

    const leaveRes = await request(app).post('/api/v1/leaves/123/decide').set('x-mock-user', header).send({});
    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.scope).toBe('department');

    const payRes = await request(app).post('/api/v1/payroll/runs').set('x-mock-user', header).send({});
    expect(payRes.status).toBe(403);

    const empRes = await request(app).post('/api/v1/employees').set('x-mock-user', header).send({});
    expect(empRes.status).toBe(403);
  });

  // Persona 4: Employee
  it('Persona 4 [Employee]: personal self-service only; strictly rejected from all administrative actions', async () => {
    const employee = {
      _id: 'user_employee',
      roles: [
        {
          name: 'Employee',
          permissions: [
            { action: 'leave.apply', subject: 'Leave', scope: 'own' },
            { action: 'attendance.mark', subject: 'Attendance', scope: 'own' }
          ]
        }
      ]
    };
    const header = JSON.stringify(employee);

    const empRes = await request(app).post('/api/v1/employees').set('x-mock-user', header).send({});
    expect(empRes.status).toBe(403);

    const payRes = await request(app).post('/api/v1/payroll/runs').set('x-mock-user', header).send({});
    expect(payRes.status).toBe(403);

    const leaveRes = await request(app).post('/api/v1/leaves/123/decide').set('x-mock-user', header).send({});
    expect(leaveRes.status).toBe(403);
  });

  // Persona 5: Custom Role A (View Only)
  it('Persona 5 [Custom Role A - View Only]: blocked from create, edit, delete, and execution endpoints', async () => {
    const viewOnlyUser = {
      _id: 'user_view_only',
      roles: [
        {
          name: 'Auditor View-Only',
          permissions: [
            { action: 'employee.view', subject: 'Employee', scope: 'all' },
            { action: 'payroll.view', subject: 'Payroll', scope: 'all' }
          ]
        }
      ]
    };
    const header = JSON.stringify(viewOnlyUser);

    const createRes = await request(app).post('/api/v1/employees').set('x-mock-user', header).send({});
    expect(createRes.status).toBe(403);

    const editRes = await request(app).put('/api/v1/employees/123').set('x-mock-user', header).send({});
    expect(editRes.status).toBe(403);

    const delRes = await request(app).delete('/api/v1/employees/123').set('x-mock-user', header).send({});
    expect(delRes.status).toBe(403);

    const payRes = await request(app).post('/api/v1/payroll/runs').set('x-mock-user', header).send({});
    expect(payRes.status).toBe(403);
  });

  // Persona 6: Custom Role B (View + Create)
  it('Persona 6 [Custom Role B - View + Create]: can create employee but rejected from edit and delete', async () => {
    const creatorUser = {
      _id: 'user_creator',
      roles: [
        {
          name: 'Staff Onboarder',
          permissions: [
            { action: 'employee.view', subject: 'Employee', scope: 'all' },
            { action: 'employee.create', subject: 'Employee', scope: 'all' }
          ]
        }
      ]
    };
    const header = JSON.stringify(creatorUser);

    const createRes = await request(app).post('/api/v1/employees').set('x-mock-user', header).send({});
    expect(createRes.status).toBe(201);

    const editRes = await request(app).put('/api/v1/employees/123').set('x-mock-user', header).send({});
    expect(editRes.status).toBe(403);

    const delRes = await request(app).delete('/api/v1/employees/123').set('x-mock-user', header).send({});
    expect(delRes.status).toBe(403);
  });

  // Persona 7: Custom Role C (View + Edit)
  it('Persona 7 [Custom Role C - View + Edit]: can edit employee but rejected from create and delete', async () => {
    const editorUser = {
      _id: 'user_editor',
      roles: [
        {
          name: 'Records Editor',
          permissions: [
            { action: 'employee.view', subject: 'Employee', scope: 'all' },
            { action: 'employee.edit', subject: 'Employee', scope: 'all' }
          ]
        }
      ]
    };
    const header = JSON.stringify(editorUser);

    const editRes = await request(app).put('/api/v1/employees/123').set('x-mock-user', header).send({});
    expect(editRes.status).toBe(200);

    const createRes = await request(app).post('/api/v1/employees').set('x-mock-user', header).send({});
    expect(createRes.status).toBe(403);

    const delRes = await request(app).delete('/api/v1/employees/123').set('x-mock-user', header).send({});
    expect(delRes.status).toBe(403);
  });

  // Persona 8: Custom Role D (View + Delete)
  it('Persona 8 [Custom Role D - View + Delete]: can delete employee but rejected from create and edit', async () => {
    const deleterUser = {
      _id: 'user_deleter',
      roles: [
        {
          name: 'Records Purger',
          permissions: [
            { action: 'employee.view', subject: 'Employee', scope: 'all' },
            { action: 'employee.delete', subject: 'Employee', scope: 'all' }
          ]
        }
      ]
    };
    const header = JSON.stringify(deleterUser);

    const delRes = await request(app).delete('/api/v1/employees/123').set('x-mock-user', header).send({});
    expect(delRes.status).toBe(200);

    const createRes = await request(app).post('/api/v1/employees').set('x-mock-user', header).send({});
    expect(createRes.status).toBe(403);

    const editRes = await request(app).put('/api/v1/employees/123').set('x-mock-user', header).send({});
    expect(editRes.status).toBe(403);
  });

  // Persona 9: Revoked Role Persona (Real-time dynamic permission revocation)
  it('Persona 9 [Revoked Role Persona]: dynamic revocation of leave.approve immediately blocks API access with 403', async () => {
    // Stage 1: Active with leave.approve
    const userWithPerm = {
      _id: 'user_dynamic',
      roles: [
        {
          name: 'Team Lead',
          permissions: [{ action: 'leave.approve', subject: 'Leave', scope: 'team' }]
        }
      ]
    };
    const activeHeader = JSON.stringify(userWithPerm);
    const initialRes = await request(app).post('/api/v1/leaves/123/decide').set('x-mock-user', activeHeader).send({});
    expect(initialRes.status).toBe(200);

    // Stage 2: Revoked permission
    const userRevoked = {
      _id: 'user_dynamic',
      roles: [
        {
          name: 'Team Lead',
          permissions: [{ action: 'leave.view', subject: 'Leave', scope: 'team' }] // leave.approve removed
        }
      ]
    };
    const revokedHeader = JSON.stringify(userRevoked);
    const revokedRes = await request(app).post('/api/v1/leaves/123/decide').set('x-mock-user', revokedHeader).send({});
    expect(revokedRes.status).toBe(403);
    expect(revokedRes.body.success).toBe(false);
  });

  // Scope evaluation helper tests
  it('buildAbilityForUser correctly compiles CASL ability and scopes across multi-role inheritance', () => {
    const multiRoleUser = {
      _id: 'user_combo',
      roles: [
        {
          name: 'Dept Manager',
          permissions: [{ action: 'leave.approve', subject: 'Leave', scope: 'department' }]
        },
        {
          name: 'HR Assistant',
          permissions: [{ action: 'leave.approve', subject: 'Leave', scope: 'all' }]
        }
      ]
    };

    const ability = buildAbilityForUser(multiRoleUser);
    expect(ability.can('leave.approve', 'Leave')).toBe(true);

    const effectiveScope = getEffectiveScopeForAction(multiRoleUser, 'leave.approve', 'Leave');
    // 'all' scope takes precedence over 'department'
    expect(effectiveScope).toBe('all');
  });
});
