/**
 * @file errorHandler.js
 * @description Centralized Global Error Handler Middleware for Express.
 * 
 * ARCHITECTURAL PURPOSE & DESIGN:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.4)
 * - Layer: Terminal Middleware (Catches all unhandled exceptions and errors passed via next(err))
 * - Response Contract: Strictly enforces unified JSON response shape:
 *   {
 *     success: false,
 *     statusCode: number,
 *     data: null,
 *     message: string,
 *     errors: Array<{ field: string, message: string }>,
 *     meta: null
 *   }
 */

import { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';

/**
 * Express 4-parameter error-handling middleware.
 * Express identifies this as an error handler because it accepts exactly 4 arguments: (err, req, res, next).
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // 1. Check if the error originated from Zod schema validation
  if (err instanceof ZodError) {
    // Transform Zod's raw issues into a clean, frontend-consumable array: { field, message }
    const errorMessages = err.errors.map((e) => ({
      field: e.path.join('.'), // Converts array path ['body', 'email'] into dot-notation string "body.email"
      message: e.message        // Human-readable message e.g. "Please provide a valid email address"
    }));

    // Wrap in standard ApiError with HTTP 400 Bad Request
    error = new ApiError(400, 'Validation failed', errorMessages);
  } 
  // 2. Check if the error is a MongoDB unique constraint violation (code 11000)
  else if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    const fields = Object.keys(err.keyValue || {});
    const fieldName = fields.length > 0 ? fields.join(', ') : 'field';
    error = new ApiError(409, `Duplicate entry: A record with this ${fieldName} already exists.`);
  }
  // 3. Check if the error is an unexpected runtime error (e.g. Mongoose, SyntaxError, ReferenceError)
  else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Wrap unexpected error in ApiError preserving stack trace for debugging
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // 3. Format the final unified JSON response payload adhering to project invariants
  const response = {
    success: false,
    statusCode: error.statusCode,
    data: null,
    message: error.message,
    errors: error.errors || [],
    meta: null
  };

  // 4. Send response with appropriate HTTP status code
  return res.status(error.statusCode).json(response);
};
