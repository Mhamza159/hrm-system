/**
 * @file changeRequest.module.overhaul.test.js
 * @description Comprehensive Integration Test Suite for Phase 33 Change Request Module Overhaul.
 * Verifies multi-category submissions, baseline snapshot capture, atomic master synchronization,
 * EmployeeHistory tracking, AES-256 IBAN encryption, PBAC scoping, Super Admin escalation,
 * and rejection/return lifecycles.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Role } from '../src/models/role.model.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import { Designation } from '../src/models/designation.model.js';
import { EmployeeHistory } from '../src/models/employeeHistory.model.js';
import { ProfileChangeRequest } from '../src/models/profileChangeRequest.model.js';
import { decrypt } from '../src/utils/crypto.js';
import * as employeeService from '../src/modules/employees/employee.service.js';

describe('Phase 33 — Change Request Module Complete Overhaul Suite', () => {
  let superAdminRole, hrRole, deptManagerRole, employeeRole;
  let engineeringDept, financeDept;
  let devDesignation, leadDesignation;
  let employeeUser, hrUser, adminUser, deptMgrUser;
  let devEmployee, hrEmployee, leadEmployee;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_p33_changerequest');
    await mongoose.connect(testDbUri);

    await User.deleteMany({});
    await Role.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await Designation.deleteMany({});
    await EmployeeHistory.deleteMany({});
    await ProfileChangeRequest.deleteMany({});

    // 1. Roles
    superAdminRole = await Role.create({
      name: 'Super Admin',
      isSystem: true,
      permissions: [{ action: 'manage', subject: 'all', scope: 'all' }]
    });

    hrRole = await Role.create({
      name: 'HR Manager',
      isSystem: true,
      permissions: [
        { action: 'change_request.view', subject: 'ChangeRequest', scope: 'all' },
        { action: 'change_request.approve', subject: 'ChangeRequest', scope: 'all' },
        { action: 'employee.view', subject: 'Employee', scope: 'all' },
        { action: 'employee.edit', subject: 'Employee', scope: 'all' }
      ]
    });

    deptManagerRole = await Role.create({
      name: 'Department Manager',
      isSystem: true,
      permissions: [
        { action: 'change_request.view', subject: 'ChangeRequest', scope: 'department' },
        { action: 'change_request.approve', subject: 'ChangeRequest', scope: 'department' },
        { action: 'employee.view', subject: 'Employee', scope: 'department' }
      ]
    });

    employeeRole = await Role.create({
      name: 'Employee',
      isSystem: true,
      permissions: [
        { action: 'change_request.view', subject: 'ChangeRequest', scope: 'own' },
        { action: 'change_request.create', subject: 'ChangeRequest', scope: 'own' },
        { action: 'change_request.delete', subject: 'ChangeRequest', scope: 'own' }
      ]
    });

    // 2. Departments & Designations
    engineeringDept = await Department.create({ name: 'Engineering', code: 'ENG' });
    financeDept = await Department.create({ name: 'Finance', code: 'FIN' });

    devDesignation = await Designation.create({
      title: 'Software Engineer',
      code: 'SWE',
      departmentId: engineeringDept._id,
      grade: 'Mid'
    });

    leadDesignation = await Designation.create({
      title: 'Principal Lead Engineer',
      code: 'PLE',
      departmentId: engineeringDept._id,
      grade: 'Lead'
    });

    // 3. Users & Employees
    adminUser = await User.create({
      name: 'Executive Super Admin',
      email: 'superadmin.p33@elvara.com',
      passwordHash: 'dummyhash123',
      roles: [superAdminRole._id]
    });

    hrUser = await User.create({
      name: 'Farah HR',
      email: 'hr.p33@elvara.com',
      passwordHash: 'dummyhash123',
      roles: [hrRole._id]
    });

    deptMgrUser = await User.create({
      name: 'Kamran Manager',
      email: 'mgr.p33@elvara.com',
      passwordHash: 'dummyhash123',
      roles: [deptManagerRole._id]
    });

    employeeUser = await User.create({
      name: 'Zaid Dev',
      email: 'zaid.p33@elvara.com',
      passwordHash: 'dummyhash123',
      roles: [employeeRole._id]
    });

    leadEmployee = await Employee.create({
      userId: deptMgrUser._id,
      name: 'Kamran Manager',
      employeeCode: 'EMP-MGR-01',
      email: 'mgr.p33@elvara.com',
      departmentId: engineeringDept._id,
      designationId: leadDesignation._id,
      status: 'Active'
    });

    hrEmployee = await Employee.create({
      userId: hrUser._id,
      name: 'Farah HR',
      employeeCode: 'EMP-HR-01',
      email: 'hr.p33@elvara.com',
      departmentId: financeDept._id,
      status: 'Active'
    });

    devEmployee = await Employee.create({
      userId: employeeUser._id,
      name: 'Zaid Dev',
      employeeCode: 'EMP-DEV-01',
      email: 'zaid.p33@elvara.com',
      phone: '+92 300 1112233',
      personalEmail: 'zaid.personal@gmail.com',
      departmentId: engineeringDept._id,
      designationId: devDesignation._id,
      managerId: leadEmployee._id,
      reportingManagerId: leadEmployee._id,
      gender: 'Male',
      maritalStatus: 'single',
      bloodGroup: 'B+',
      address: {
        street: 'Street 10, G-9/1',
        city: 'Islamabad',
        state: 'Federal',
        postalCode: '44000',
        country: 'Pakistan'
      },
      emergencyContact: {
        name: 'Ahmed Dev',
        relationship: 'Brother',
        phone: '+92 300 9998877'
      },
      bankDetails: {
        bankName: 'Habib Bank Limited',
        accountTitle: 'Zaid Dev',
        accountNumber: '1234567890',
        iban: 'PK12HABB00001234567890'
      },
      status: 'Active'
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('1. should create change request and capture baseline snapshot (oldValue)', async () => {
    const request = await employeeService.submitChangeRequest(employeeUser._id, {
      category: 'bank_details',
      field: 'bankDetails',
      requestedValue: {
        bankName: 'Meezan Bank Ltd',
        accountTitle: 'Zaid Dev',
        accountNumber: '9876543210',
        iban: 'PK36MEZN00009876543210'
      },
      reason: 'Migrated salary account to Islamic banking',
      priority: 'high'
    });

    expect(request).toBeDefined();
    expect(request.status).toBe('pending');
    expect(request.priority).toBe('high');
    expect(request.category).toBe('bank_details');
    expect(request.oldValue).toBeDefined();
    expect(request.oldValue.bankName).toBe('Habib Bank Limited');
    expect(request.oldValue.accountNumber).toBe('1234567890');
    expect(request.timeline).toHaveLength(1);
    expect(request.timeline[0].action).toBe('submitted');
  });

  it('2. should approve bank details change request and encrypt IBAN in Employee record', async () => {
    const pendingReq = await ProfileChangeRequest.findOne({
      employeeId: devEmployee._id,
      status: 'pending',
      category: 'bank_details'
    });

    const approved = await employeeService.decideChangeRequest(
      pendingReq._id,
      { action: 'approved', decisionReason: 'Verified bank statement copy' },
      adminUser
    );

    expect(approved.status).toBe('approved');
    expect(approved.decidedBy.toString()).toBe(adminUser._id.toString());
    expect(approved.decisionReason).toBe('Verified bank statement copy');

    // Verify Employee record was mutated
    const updatedEmp = await Employee.findById(devEmployee._id);
    expect(updatedEmp.bankDetails.bankName).toBe('Meezan Bank Ltd');
    expect(updatedEmp.bankDetails.accountNumber).toBe('9876543210');
    // IBAN must be encrypted at rest
    expect(updatedEmp.bankDetails.iban).not.toBe('PK36MEZN00009876543210');
    expect(decrypt(updatedEmp.bankDetails.iban)).toBe('PK36MEZN00009876543210');
  });

  it('3. should handle Department change request and create EmployeeHistory record', async () => {
    const req = await employeeService.submitChangeRequest(employeeUser._id, {
      category: 'department',
      field: 'departmentId',
      requestedValue: { departmentId: financeDept._id },
      reason: 'Internal transfer to Financial Tech group',
      priority: 'normal'
    });

    expect(req.oldValue.departmentId.toString()).toBe(engineeringDept._id.toString());

    await employeeService.decideChangeRequest(
      req._id,
      { action: 'approved', decisionReason: 'Transfer approved by management' },
      adminUser
    );

    const updatedEmp = await Employee.findById(devEmployee._id);
    expect(updatedEmp.departmentId.toString()).toBe(financeDept._id.toString());

    // Verify EmployeeHistory
    const history = await EmployeeHistory.findOne({
      employeeId: devEmployee._id,
      eventType: 'Transfer'
    });
    expect(history).toBeDefined();
    expect(history.previousDepartmentId.toString()).toBe(engineeringDept._id.toString());
    expect(history.newDepartmentId.toString()).toBe(financeDept._id.toString());
  });

  it('4. should handle Designation change request and create EmployeeHistory record', async () => {
    const req = await employeeService.submitChangeRequest(employeeUser._id, {
      category: 'designation',
      field: 'designationId',
      requestedValue: { designationId: leadDesignation._id },
      reason: 'Promoted following annual appraisal review'
    });

    expect(req.oldValue.designationId.toString()).toBe(devDesignation._id.toString());

    await employeeService.decideChangeRequest(
      req._id,
      { action: 'approved', decisionReason: 'Promotion confirmed' },
      adminUser
    );

    const updatedEmp = await Employee.findById(devEmployee._id);
    expect(updatedEmp.designationId.toString()).toBe(leadDesignation._id.toString());

    const history = await EmployeeHistory.findOne({
      employeeId: devEmployee._id,
      eventType: 'Promotion'
    });
    expect(history).toBeDefined();
    expect(history.previousDesignationId.toString()).toBe(devDesignation._id.toString());
    expect(history.newDesignationId.toString()).toBe(leadDesignation._id.toString());
  });

  it('5. should reject change request without modifying original employee data', async () => {
    const req = await employeeService.submitChangeRequest(employeeUser._id, {
      category: 'contact',
      field: 'contact',
      requestedValue: { phone: '+92 333 0000000', personalEmail: 'fake@email.com' },
      reason: 'Please update phone'
    });

    const rejected = await employeeService.decideChangeRequest(
      req._id,
      { action: 'rejected', rejectionReason: 'Invalid contact documentation provided' },
      adminUser
    );

    expect(rejected.status).toBe('rejected');
    expect(rejected.decisionReason).toBe('Invalid contact documentation provided');

    // Verify original employee data remained unchanged
    const emp = await Employee.findById(devEmployee._id);
    expect(emp.phone).toBe('+92 300 1112233');
    expect(emp.email).toBe('zaid.p33@elvara.com');
  });

  it('6. should return request for correction and update timeline', async () => {
    const req = await employeeService.submitChangeRequest(employeeUser._id, {
      category: 'address',
      field: 'address',
      requestedValue: { street: 'New Street 5', city: 'Lahore' },
      reason: 'Moved to Lahore'
    });

    const returned = await employeeService.returnChangeRequest(
      req._id,
      { notes: 'Please attach utility bill as residential proof' },
      adminUser
    );

    expect(returned.status).toBe('returned');
    expect(returned.decisionReason).toBe('Please attach utility bill as residential proof');

    const lastTimeline = returned.timeline[returned.timeline.length - 1];
    expect(lastTimeline.action).toBe('returned');
    expect(lastTimeline.note).toBe('Please attach utility bill as residential proof');
  });

  it('7. should allow employee to cancel their own pending change request', async () => {
    const req = await employeeService.submitChangeRequest(employeeUser._id, {
      category: 'personal',
      field: 'personal',
      requestedValue: { maritalStatus: 'married' },
      reason: 'Recently married'
    });

    const cancelled = await employeeService.cancelChangeRequest(
      req._id,
      { reason: 'Submitted by mistake' },
      employeeUser
    );

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.decisionReason).toBe('Submitted by mistake');

    const lastTimeline = cancelled.timeline[cancelled.timeline.length - 1];
    expect(lastTimeline.action).toBe('cancelled');
  });

  it('8. should prevent circular reporting manager assignment (self as manager)', async () => {
    const req = await employeeService.submitChangeRequest(employeeUser._id, {
      category: 'reporting_manager',
      field: 'reportingManagerId',
      requestedValue: { reportingManagerId: devEmployee._id },
      reason: 'Self reporting'
    });

    await expect(
      employeeService.decideChangeRequest(
        req._id,
        { action: 'approved', decisionReason: 'Approve' },
        adminUser
      )
    ).rejects.toThrow('Employee cannot be their own reporting manager');
  });

  it('9. should enforce Super Admin escalation when applicant is HR', async () => {
    const hrChangeReq = await employeeService.submitChangeRequest(hrUser._id, {
      category: 'bank_details',
      field: 'bankDetails',
      requestedValue: {
        bankName: 'Standard Chartered',
        accountTitle: 'Farah HR',
        accountNumber: '555666777',
        iban: 'PK99SCBL0000555666777'
      },
      reason: 'HR bank update'
    });

    // Attempt approval by HR Manager herself should be blocked by assertSuperAdminIfApplicantIsHR
    const hrActor = {
      _id: hrUser._id,
      role: 'HR Manager',
      roles: [{ name: 'HR Manager' }]
    };

    await expect(
      employeeService.decideChangeRequest(
        hrChangeReq._id,
        { action: 'approved', decisionReason: 'Self approval' },
        hrActor
      )
    ).rejects.toThrow();

    // But Super Admin CAN approve
    const superAdminActor = {
      _id: adminUser._id,
      role: 'Super Admin',
      roles: [{ name: 'Super Admin' }]
    };

    const approvedByAdmin = await employeeService.decideChangeRequest(
      hrChangeReq._id,
      { action: 'approved', decisionReason: 'Super Admin approved HR update' },
      superAdminActor
    );

    expect(approvedByAdmin.status).toBe('approved');
  });

  it('10. should return accurate statistics in getChangeRequestStats', async () => {
    const stats = await employeeService.getChangeRequestStats(adminUser);

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.approved).toBeGreaterThan(0);
    expect(stats.categoryBreakdown).toBeDefined();
    expect(stats.categoryBreakdown.bank_details).toBeGreaterThan(0);
  });

  it('11. should enforce PBAC scoping in getChangeRequests', async () => {
    // Super Admin gets all requests
    const adminView = await employeeService.getChangeRequests({}, adminUser);
    expect(adminView.requests.length).toBeGreaterThan(0);

    // Employee gets only their own requests
    const employeeActor = {
      _id: employeeUser._id,
      roles: [{ name: 'Employee' }]
    };
    const employeeView = await employeeService.getChangeRequests({}, employeeActor);
    expect(employeeView.requests.length).toBeGreaterThan(0);
    // Every request in employee view must belong to employeeUser or devEmployee
    employeeView.requests.forEach((r) => {
      expect(
        r.requestedBy._id.toString() === employeeUser._id.toString() ||
        r.employeeId._id.toString() === devEmployee._id.toString()
      ).toBe(true);
    });
  });
});
