import { describe, it, expect } from 'vitest';
import { sanitizeFields } from '../src/utils/fieldFilter.js';
import { buildAbilityForUser } from '../src/middlewares/checkPermission.js';

describe('Field-Level Masking Engine (Slice 26.5-TEST)', () => {
  const sampleEmployeePayload = {
    name: 'Ahmed Khan',
    designation: 'Senior Backend Engineer',
    department: 'Engineering',
    salary: 250000,
    basicSalary: 180000,
    bankAccount: 'PK36SCBL0000001123456701',
    cnic: '42101-1234567-1'
  };

  it('should preserve all sensitive fields unmasked for Super Admin', () => {
    const superAdminUser = {
      roles: [{ name: 'Super Admin', isSystem: true, permissions: [{ action: 'manage', subject: 'all' }] }]
    };
    const ability = buildAbilityForUser(superAdminUser);

    const result = sanitizeFields(sampleEmployeePayload, ability, 'Employee');
    expect(result.salary).toBe(250000);
    expect(result.basicSalary).toBe(180000);
    expect(result.bankAccount).toBe('PK36SCBL0000001123456701');
    expect(result.cnic).toBe('42101-1234567-1');
  });

  it('should mask salary and bank details with "—" for Department Manager lacking salary view', () => {
    const deptManagerUser = {
      roles: [
        {
          name: 'Department Manager',
          permissions: [
            { action: 'employee.view', subject: 'Employee', scope: 'team' }
          ]
        }
      ]
    };
    const ability = buildAbilityForUser(deptManagerUser);

    const result = sanitizeFields(sampleEmployeePayload, ability, 'Employee');
    expect(result.name).toBe('Ahmed Khan');
    expect(result.designation).toBe('Senior Backend Engineer');
    expect(result.salary).toBe('—');
    expect(result.basicSalary).toBe('—');
    expect(result.bankAccount).toBe('—');
    expect(result.cnic).toBe('—');
  });

  it('should strip sensitive fields entirely if maskWithPlaceholder is false', () => {
    const employeeUser = {
      roles: [{ name: 'Employee', permissions: [{ action: 'employee.view', subject: 'Employee', scope: 'own' }] }]
    };
    const ability = buildAbilityForUser(employeeUser);

    const result = sanitizeFields(sampleEmployeePayload, ability, 'Employee', {
      maskWithPlaceholder: false
    });
    expect(result.name).toBe('Ahmed Khan');
    expect(result.salary).toBeUndefined();
    expect(result.bankAccount).toBeUndefined();
    expect(result.cnic).toBeUndefined();
  });

  it('should handle array of documents consistently', () => {
    const employeeUser = {
      roles: [{ name: 'Employee', permissions: [{ action: 'employee.view', subject: 'Employee', scope: 'own' }] }]
    };
    const ability = buildAbilityForUser(employeeUser);

    const list = [sampleEmployeePayload, { ...sampleEmployeePayload, name: 'Sara Ali' }];
    const sanitizedList = sanitizeFields(list, ability, 'Employee');

    expect(Array.isArray(sanitizedList)).toBe(true);
    expect(sanitizedList[0].salary).toBe('—');
    expect(sanitizedList[1].salary).toBe('—');
  });
});
