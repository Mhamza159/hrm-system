/**
 * @file asyncHandler.js
 * @description Higher-Order Function to wrap async Express controllers and catch unhandled Promise rejections.
 * 
 * ARCHITECTURAL PURPOSE:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.4)
 * - Rationale:
 *   Eliminates the need for repetitive try-catch blocks in every controller method.
 *   If any async operation inside the controller rejects or throws, `.catch(next)`
 *   automatically routes the error to Express's next(err) -> errorHandler.js.
 */

/**
 * Wraps an async request handler function.
 * 
 * @param {Function} requestHandler - An async controller function (req, res, next) => Promise<any>
 * @returns {Function} Express middleware that guarantees Promise resolution and error catching
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    // 1. Resolve requestHandler as a Promise
    // 2. If rejected, pass the error to Express's next() callback automatically
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
