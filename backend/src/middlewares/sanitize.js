/**
 * @file sanitize.js
 * @description Recursively sanitizes request body, query, and params to defend against NoSQL injection and parameter pollution.
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.5 Advanced Perimeter Defenses
 * - Policy: Strips keys beginning with '$' (MongoDB query operators like $ne, $regex, $where)
 *           and keys containing '.' (dotted paths used in prototype or document pollution).
 */

/**
 * Recursively strips prohibited keys starting with '$' or containing '.'
 * @param {any} target - The object, array, or primitive to sanitize
 * @returns {any} Sanitized clone
 */
export function sanitizeData(target) {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(target)) {
    // Drop keys starting with '$' (NoSQL operators) or containing '.' (dotted access/pollution)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    sanitized[key] = sanitizeData(value);
  }

  return sanitized;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
export const sanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeData(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeData(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeData(req.params);
  }
  next();
};
