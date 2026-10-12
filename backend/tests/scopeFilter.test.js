import { describe, it, expect } from 'vitest';
import { buildScopeQuery } from '../src/utils/scopeFilter.js';

describe('Data Scope Filtering Engine (Slice 26.4-TEST)', () => {
  const mockUser = {
    _id: 'user_123',
    employeeId: 'emp_456',
    departmentId: 'dept_789'
  };

  it('should return empty filter for scope "all"', () => {
    const query = buildScopeQuery(mockUser, 'all');
    expect(query).toEqual({});
  });

  it('should return departmentId filter for scope "department"', () => {
    const query = buildScopeQuery(mockUser, 'department');
    expect(query).toEqual({ departmentId: 'dept_789' });
  });

  it('should return managerId filter for scope "team" when querying Employee entity', () => {
    const query = buildScopeQuery(mockUser, 'team', { entity: 'Employee' });
    expect(query).toEqual({ managerId: 'emp_456' });
  });

  it('should return $or manager criteria for scope "team" when querying general transactional records', () => {
    const query = buildScopeQuery(mockUser, 'team', { entity: 'Attendance' });
    expect(query.$or).toBeDefined();
    expect(query.$or).toContainEqual({ managerId: 'emp_456' });
    expect(query.$or).toContainEqual({ reportingManagerId: 'user_123' });
  });

  it('should return employeeId filter for scope "own" by default', () => {
    const query = buildScopeQuery(mockUser, 'own', { entity: 'Leave' });
    expect(query).toEqual({ employeeId: 'emp_456' });
  });

  it('should return _id filter for scope "own" when querying User entity', () => {
    const query = buildScopeQuery(mockUser, 'own', { entity: 'User' });
    expect(query).toEqual({ _id: 'user_123' });
  });
});
