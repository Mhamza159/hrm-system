/**
 * @file dashboard.people.js
 * @description One "person" shape for every name shown on a dashboard:
 * { employeeId, employeeName, employeeCode, avatar, designation, department, role }.
 *
 * The profile photo usually lives on the User (uploaded from My Profile), so avatar falls back
 * Employee.avatar → User.avatar, the same order auth.service uses for the topbar.
 */

import { Employee } from '../../models/employee.model.js';
import { User } from '../../models/user.model.js';

export const PERSON_SELECT = 'name firstName lastName employeeCode avatar departmentId designationId userId';

export const PERSON_POPULATE = [
  { path: 'departmentId', select: 'name' },
  { path: 'designationId', select: 'title' },
  { path: 'userId', select: 'email avatar roles', populate: { path: 'roles', select: 'name' } },
];

/** `.populate(...)` argument for an `employeeId` ref that should resolve to a full person. */
export const populatePerson = (path = 'employeeId') => ({ path, select: PERSON_SELECT, populate: PERSON_POPULATE });

const ROLE_RANK = ['Super Admin', 'HR Manager', 'Department Manager', 'Employee'];

/** Highest-privilege role name of a user (roles may be populated docs or plain names). */
export const primaryRole = (roles = []) => {
  const names = (roles || []).map((r) => r?.name || r).filter((n) => typeof n === 'string');
  return ROLE_RANK.find((r) => names.includes(r)) || names[0] || null;
};

/** Maps a populated Employee (see PERSON_POPULATE) to the dashboard person shape. */
export const toPerson = (emp) => {
  if (!emp) {
    return { employeeId: null, employeeName: 'Employee', employeeCode: '', avatar: null, designation: null, department: null, role: null };
  }
  const user = emp.userId && typeof emp.userId === 'object' ? emp.userId : null;
  return {
    employeeId: emp._id,
    employeeName: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
    employeeCode: emp.employeeCode || '',
    avatar: emp.avatar || user?.avatar || null,
    designation: emp.designationId?.title || null,
    department: emp.departmentId?.name || null,
    role: primaryRole(user?.roles),
  };
};

/**
 * Person shape per userId, for audit-log actors. Users without an Employee record
 * (e.g. a bootstrap Super Admin) still resolve to their User name, avatar and role.
 */
export const getPeopleByUserIds = async (userIds = []) => {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (ids.length === 0) return new Map();

  const [employees, users] = await Promise.all([
    // userId stays a raw id here (it is the map key); the User docs are joined from the second query
    Employee.find({ userId: { $in: ids } }).select(PERSON_SELECT).populate(PERSON_POPULATE.slice(0, 2)).lean(),
    User.find({ _id: { $in: ids } }).select('email avatar roles').populate('roles', 'name').lean(),
  ]);
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const people = new Map();
  users.forEach((u) => {
    people.set(String(u._id), {
      employeeId: null,
      employeeName: u.email || 'User',
      employeeCode: '',
      avatar: u.avatar || null,
      designation: null,
      department: null,
      role: primaryRole(u.roles),
    });
  });
  employees.forEach((e) => {
    const key = String(e.userId);
    people.set(key, toPerson({ ...e, userId: userById.get(key) || null }));
  });
  return people;
};
