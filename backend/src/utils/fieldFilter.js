/**
 * @file fieldFilter.js
 * @description Field-Level Authorization & Sensitive Data Masking Utility.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.5)
 * - Layer: Utilities / Data Masking Engine
 * - Security Rules:
 *   1. Sensitive fields (salary, basicSalary, bankDetails, cnic) are strictly masked or stripped
 *      for actors who lack unmasked field permissions (e.g. Department Manager, Employee viewing peers).
 *   2. Super Admin or actors holding 'employee.salary.view' retain unmasked visibility.
 */

// Universal list of sensitive personal and financial properties
export const SENSITIVE_FIELDS = [
  'salary',
  'basicSalary',
  'allowances',
  'deductions',
  'bankAccount',
  'bankDetails',
  'iban',
  'cnic'
];

/**
 * Sanitizes an object or array of objects based on actor's CASL abilities.
 * 
 * @param {Object|Array} data - Target document payload or array of documents
 * @param {import('@casl/ability').MongoAbility} userAbility - Compiled CASL ability instance
 * @param {string} [subject='Employee'] - Target entity subject
 * @param {Object} [options={}] - Custom options
 * @param {boolean} [options.maskWithPlaceholder=true] - If true, replaces with '—'; if false, deletes key
 * @returns {Object|Array} Sanitized payload
 */
export const sanitizeFields = (data, userAbility, subject = 'Employee', options = {}) => {
  if (!data) return data;

  const { maskWithPlaceholder = true } = options;

  // 1. Super Admin or unmasked permission holders bypass masking
  const canViewSensitive =
    userAbility?.can('manage', 'all') ||
    userAbility?.can('employee.salary.view', subject) ||
    userAbility?.can('employee.salary.view', 'all');

  if (canViewSensitive) {
    return data;
  }

  const maskItem = (item) => {
    if (!item || typeof item !== 'object') return item;

    // Clone to prevent mutating original in-memory Mongoose documents
    const sanitized = Array.isArray(item) ? [...item] : { ...item };

    for (const field of SENSITIVE_FIELDS) {
      if (field in sanitized) {
        if (maskWithPlaceholder) {
          sanitized[field] = '—';
        } else {
          delete sanitized[field];
        }
      }
    }

    return sanitized;
  };

  if (Array.isArray(data)) {
    return data.map(maskItem);
  }

  return maskItem(data);
};
