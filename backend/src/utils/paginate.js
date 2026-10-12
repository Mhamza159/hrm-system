/**
 * @file paginate.js
 * @description Universal Mongoose Pagination & Search Utility.
 * 
 * ARCHITECTURE & PERFORMANCE SPECIFICATION:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.7)
 * - Standard: Used across all data list APIs (Employees, Attendance, Payroll, Audit Logs).
 * - Performance: Executes paginated slice and total document count concurrently via Promise.all.
 * - Caps: Maximum limit capped at 100 to prevent denial-of-service memory exhaustion.
 */

/**
 * Executes a paginated, sorted, and optionally filtered/searched query against a Mongoose model.
 * 
 * @param {import('mongoose').Model} model - Mongoose model to query
 * @param {Object} [filter={}] - Base filter conditions
 * @param {Object} [options={}] - Query modifiers
 * @param {number|string} [options.page=1] - Requested page number (1-indexed)
 * @param {number|string} [options.limit=20] - Number of items per page (default 20, max 100)
 * @param {Object|string} [options.sort] - Mongoose sort criteria (defaults to { createdAt: -1 })
 * @param {string} [options.select] - Projection string specifying fields to include/exclude
 * @param {string|Object} [options.populate] - Mongoose population string or options
 * @param {string} [options.search] - Search string for text filtering
 * @param {string[]} [options.searchFields] - Array of schema field paths to apply search regex against
 * @returns {Promise<{ docs: Array, meta: { totalDocs: number, limit: number, page: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean } }>}
 */
export async function paginate(model, filter = {}, options = {}) {
  // Normalize page and limit boundaries
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(options.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const queryFilter = { ...filter };

  // Case-insensitive regex search across configured fields
  if (options.search && options.searchFields?.length) {
    const searchRegex = new RegExp(options.search.trim(), 'i');
    queryFilter.$or = options.searchFields.map((field) => ({
      [field]: searchRegex
    }));
  }

  // Construct Mongoose query cursor
  let query = model.find(queryFilter);

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.sort) {
    query = query.sort(options.sort);
  } else {
    query = query.sort({ createdAt: -1 }); // Newest records first by default
  }

  if (options.populate) {
    query = query.populate(options.populate);
  }

  // Run data slice retrieval and total record count in parallel for maximum query throughput
  const [docs, totalDocs] = await Promise.all([
    query.skip(skip).limit(limit).lean().exec(),
    model.countDocuments(queryFilter).exec()
  ]);

  const totalPages = Math.ceil(totalDocs / limit) || 1;

  return {
    docs,
    meta: {
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}
