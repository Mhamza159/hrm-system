/**
 * @file scopeFilter.js
 * @description Mongoose Query Scope Generator for Horizontal RBAC Data Isolation.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.4)
 * - Layer: Utilities / Query Scoping Engine
 * - Invariant: Ensures users cannot view or mutate entities outside their authorized
 *   horizontal boundary ('own', 'team', 'department', 'all').
 */

/**
 * Builds Mongoose filter criteria based on user's authorized scope and target entity.
 * 
 * @param {Object} user - The authenticated user object (from req.user)
 * @param {string} [scope='own'] - The authorized scope: 'own' | 'team' | 'department' | 'all'
 * @param {Object} [options={}] - Entity-specific overrides
 * @param {string} [options.entity='general'] - Entity name: 'Employee', 'User', 'Attendance', 'Leave', 'Payroll', etc.
 * @param {string} [options.employeeField='employeeId'] - Field name storing employee link
 * @returns {Object} Mongoose filter object to spread or merge into database queries
 */
export const buildScopeQuery = (user, scope = 'own', options = {}) => {
  // 1. Universal company-wide access (Super Admin / HR Manager with 'all' scope)
  if (scope === 'all') {
    return {};
  }

  const {
    entity = 'general',
    employeeField = 'employeeId'
  } = options;

  const actorId = user?._id;
  const actorEmployeeId = user?.employeeId || actorId;
  const actorDepartmentId = user?.departmentId;

  // 2. Department scope: restricts to members of actor's department
  if (scope === 'department') {
    if (!actorDepartmentId) {
      // If user has no department assigned, fail-safe to empty or own
      return { [employeeField]: actorEmployeeId };
    }
    return { departmentId: actorDepartmentId };
  }

  // 3. Team scope: restricts to direct subordinates of actor (manager/team lead)
  if (scope === 'team') {
    if (entity.toLowerCase() === 'employee') {
      // Subordinates whose managerId matches actor's employeeId
      return { managerId: actorEmployeeId };
    }
    // For transactional records (Attendance, Leave, Expense), check managerId or reportingManagerId
    return {
      $or: [
        { managerId: actorEmployeeId },
        { reportingManagerId: actorId },
        { approverId: actorId }
      ]
    };
  }

  // 4. Own scope: restricts strictly to actor's own records (Self-Service)
  if (scope === 'own') {
    if (entity.toLowerCase() === 'user') {
      return { _id: actorId };
    }
    return { [employeeField]: actorEmployeeId };
  }

  // Default fallback: strict defensive own scope
  return { [employeeField]: actorEmployeeId };
};

export const scopeFilter = buildScopeQuery;
