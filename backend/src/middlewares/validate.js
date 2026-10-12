/**
 * @file validate.js
 * @description Universal Zod Request Schema Validation Middleware.
 * 
 * ARCHITECTURAL PURPOSE & DESIGN:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.5)
 * - Layer: Middleware (First defensive boundary before requests hit Controllers)
 * - Rationale:
 *   Because the HRM codebase uses pure JavaScript (no TypeScript compile-time typing),
 *   Zod acts as the runtime type safety engine. Every incoming HTTP request MUST be validated
 *   against its contract schema to guarantee payload integrity, block injection payloads,
 *   and provide clean, field-level error messages to the frontend.
 */

/**
 * Higher-Order Middleware Factory that wraps a Zod schema.
 * 
 * @param {import('zod').ZodSchema} schema - The Zod schema defining the expected shape of body, query, and params.
 * @returns {Function} Express middleware function `(req, res, next) => void`
 * 
 * HOW IT WORKS (STEP-BY-STEP):
 * 1. Takes the incoming Express request and inspects `req.body`, `req.query`, and `req.params`.
 * 2. Executes `schema.parse(...)`:
 *    - If data is 100% valid: passes control to the next middleware or controller via `next()`.
 *    - If data violates rules: Zod throws a `ZodError` containing detailed field error diagnostics.
 * 3. Catches the error and calls `next(err)` to route it to `errorHandler.js` which produces a standard 400 Bad Request response.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    // Validate request body, query params, and URL path route params simultaneously
    schema.parse({
      body: req.body,     // JSON payload from POST / PUT / PATCH
      query: req.query,   // URL query parameters (e.g. ?page=1&limit=20)
      params: req.params  // Dynamic route segments (e.g. /users/:id)
    });

    // Validation succeeded: proceed forward into route handler / controller
    next();
  } catch (err) {
    // Validation failed: forward the ZodError directly into the centralized error handler
    next(err);
  }
};
