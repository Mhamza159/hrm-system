/**
 * @file policies.test.js
 * @description Integration tests for Phase 21: Company Policies Module Architecture & Workflows.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Policy } from '../src/models/policy.model.js';
import { PolicyCategory } from '../src/models/policyCategory.model.js';
import { PolicyVersion } from '../src/models/policyVersion.model.js';
import { PolicyAcknowledgement } from '../src/models/policyAcknowledgement.model.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Phase 21 — Company Policies Module Integration Tests', () => {
  let hrToken;
  let employeeToken;
  let hrUser;
  let empUser;
  let testDept;
  let testCategory;
  let createdPolicyId;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_policies_p21');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Policy.deleteMany({});
    await PolicyCategory.deleteMany({});
    await PolicyVersion.deleteMany({});
    await PolicyAcknowledgement.deleteMany({});

    testDept = await Department.create({
      name: 'Information Security & Compliance',
      code: 'INFOSEC'
    });

    const hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'policy.view', subject: 'Policy', scope: 'all' },
        { action: 'policy.create', subject: 'Policy', scope: 'all' },
        { action: 'policy.edit', subject: 'Policy', scope: 'all' },
        { action: 'policy.delete', subject: 'Policy', scope: 'all' },
        { action: 'policy.manage', subject: 'Policy', scope: 'all' },
        { action: 'policy.approve', subject: 'Policy', scope: 'all' },
        { action: 'policy.publish', subject: 'Policy', scope: 'all' },
        { action: 'policy.acknowledge', subject: 'Policy', scope: 'own' },
        { action: 'policy.track', subject: 'Policy', scope: 'all' }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'policy.view', subject: 'Policy', scope: 'own' },
        { action: 'policy.acknowledge', subject: 'Policy', scope: 'own' }
      ]
    });

    hrUser = await User.create({
      name: 'HR Policy Officer',
      email: 'hr.policy@hrm.enterprise',
      passwordHash: 'dummy_hash',
      roles: [hrRole._id]
    });

    empUser = await User.create({
      name: 'Staff Member',
      email: 'staff.policy@hrm.enterprise',
      passwordHash: 'dummy_hash',
      roles: [employeeRole._id]
    });

    await Employee.create({
      userId: empUser._id,
      name: 'Staff Member',
      employeeCode: 'EMP-POL-001',
      email: empUser.email,
      departmentId: testDept._id,
      status: 'Active',
      joiningDate: new Date('2024-01-01')
    });

    hrToken = jwt.sign(
      { userId: hrUser._id, email: hrUser.email, roles: ['HR Manager'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { userId: empUser._id, email: empUser.email, roles: ['Employee'] },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    testCategory = await PolicyCategory.create({
      name: 'Information Security',
      code: 'SEC',
      description: 'Corporate cybersecurity guidelines and data privacy mandates.',
      icon: 'Shield',
      color: '#00C471'
    });
  }, 60000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('1. GET /api/v1/policies/categories returns policy categories', async () => {
    const res = await request(app)
      .get('/api/v1/policies/categories')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((c) => c.code === 'SEC')).toBe(true);
  });

  it('2. POST /api/v1/policies creates a new draft policy', async () => {
    const res = await request(app)
      .post('/api/v1/policies')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        title: 'Information Security & Data Protection Policy',
        policyCode: 'POL-SEC-001',
        categoryId: testCategory._id.toString(),
        description: 'Mandatory standard operating procedure for handling sensitive customer records.',
        content: 'Article 1: All employees must enable 2FA and never share credentials.',
        scope: 'All Employees',
        requiresAcknowledgement: true,
        acknowledgementGracePeriodDays: 14
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.policyCode).toBe('POL-SEC-001');
    expect(res.body.data.status).toBe('Draft');
    expect(res.body.data.version).toBe('1.0');
    createdPolicyId = res.body.data._id;
  });

  it('3. Regular Employee is blocked from viewing unpublished Draft policy (403)', async () => {
    const res = await request(app)
      .get(`/api/v1/policies/${createdPolicyId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('4. POST /api/v1/policies/:id/submit advances status to Pending Approval', async () => {
    const res = await request(app)
      .post(`/api/v1/policies/${createdPolicyId}/submit`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Pending Approval');
  });

  it('5. POST /api/v1/policies/:id/approve approves the policy proposal', async () => {
    const res = await request(app)
      .post(`/api/v1/policies/${createdPolicyId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ notes: 'Reviewed and compliant with ISO 27001' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Approved');
    expect(res.body.data.approvedBy).toBeDefined();
  });

  it('6. POST /api/v1/policies/:id/publish publishes policy and creates version history snapshot', async () => {
    const res = await request(app)
      .post(`/api/v1/policies/${createdPolicyId}/publish`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ notifyWorkforce: false });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Published');

    // Verify version record created
    const versions = await PolicyVersion.find({ policyId: createdPolicyId });
    expect(versions.length).toBe(1);
    expect(versions[0].version).toBe('1.0');
  });

  it('7. Employee can now view the published policy and GET /api/v1/policies/stats reflects it', async () => {
    const res = await request(app)
      .get(`/api/v1/policies/${createdPolicyId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Published');
    expect(res.body.data.hasAcknowledged).toBe(false);

    const statsRes = await request(app)
      .get('/api/v1/policies/stats')
      .set('Authorization', `Bearer ${hrToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.publishedPolicies).toBe(1);
    expect(statsRes.body.data.requiringAcknowledgementCount).toBe(1);
  });

  it('8. POST /api/v1/policies/:id/acknowledge successfully signs the policy', async () => {
    const res = await request(app)
      .post(`/api/v1/policies/${createdPolicyId}/acknowledge`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ signatureText: 'Staff Member' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.signatureText).toBe('Staff Member');
    expect(res.body.data.policyVersion).toBe('1.0');
  });

  it('9. Duplicate acknowledgement by the same employee is rejected (409 Conflict)', async () => {
    const res = await request(app)
      .post(`/api/v1/policies/${createdPolicyId}/acknowledge`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ signatureText: 'Staff Member' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('10. GET /api/v1/policies/:id/acknowledgements returns compliance roster and 100% completion rate', async () => {
    const res = await request(app)
      .get(`/api/v1/policies/${createdPolicyId}/acknowledgements`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.signedCount).toBe(1);
    expect(res.body.data.compliancePercentage).toBe(100);
    expect(res.body.data.roster.length).toBe(1);
    expect(res.body.data.roster[0].isAcknowledged).toBe(true);
  });
});
