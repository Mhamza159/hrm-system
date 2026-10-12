/**
 * @file apiResponse.js
 * @description Standardized API Success Response Envelope.
 * 
 * ARCHITECTURAL DESIGN:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.4)
 * - Strict Invariant: Every successful JSON response from Express must conform to the shape:
 *   {
 *     statusCode: number,
 *     success: boolean,
 *     data: any,
 *     message: string,
 *     meta: Object | null
 *   }
 */

export class ApiResponse {
  /**
   * Constructs an ApiResponse payload.
   * 
   * @param {number} statusCode - HTTP status code (typically 200, 201, 204)
   * @param {*} data - The core payload payload returned to client (object, array, or null)
   * @param {string} [message='Success'] - Descriptive user-facing message
   * @param {Object|null} [meta=null] - Optional metadata (such as pagination info: page, limit, totalPages)
   */
  constructor(statusCode, data, message = 'Success', meta = null) {
    // 1. HTTP status code
    this.statusCode = statusCode;

    // 2. Data payload
    this.data = data;

    // 3. Status message
    this.message = message;

    // 4. Invariant: automatically marked true for status codes < 400
    this.success = statusCode < 400;

    // 5. Metadata for pagination and filtering
    this.meta = meta;
  }
}
