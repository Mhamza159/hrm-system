/**
 * @file ApiError.js
 * @description Standardized Operational Error Class for HRM Backend.
 * 
 * ARCHITECTURAL DESIGN:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.4)
 * - Extends the native JavaScript `Error` class to carry HTTP status codes, structured field errors,
 *   and success flags cleanly through the Express error pipeline.
 */

export class ApiError extends Error {
  /**
   * Constructs a new ApiError instance.
   * 
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 423, 500)
   * @param {string} [message='Something went wrong'] - Descriptive, human-readable error summary
   * @param {Array} [errors=[]] - Array of specific validation or operational error objects
   * @param {string} [stack=''] - Optional stack trace string override
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    // 1. Invoke parent Error constructor with the error message
    super(message);

    // 2. Set the HTTP status code
    this.statusCode = statusCode;

    // 3. Invariant: error responses always set data to null
    this.data = null;

    // 4. Invariant: error responses always set success to false
    this.success = false;

    // 5. Attach granular errors (e.g. Zod field validation issues)
    this.errors = errors;

    // 6. Capture or preserve clean stack trace for logging
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
