/**
 * @file chatbot.tools.js
 * @description Domain Tool Definitions & Handlers for M16 HR Chatbot.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Rows 16.3, 16.4, 16.5)
 * - Strict User Scoping: All personal record lookups execute exclusively with actor.employeeId.
 * - External employee IDs passed via prompts or tool arguments are ignored.
 */

import { PolicyDoc } from '../../../models/policyDoc.model.js';
import { LeaveBalance } from '../../../models/leaveBalance.model.js';
import { LeaveType } from '../../../models/leaveType.model.js';
import { Payslip } from '../../../models/payslip.model.js';
import * as leaveService from '../../leaves/leave.service.js';

/**
 * 1. searchPolicy: Search company policy documents using MongoDB full-text index
 */
export async function searchPolicy({ query, category }) {
  if (!query || typeof query !== 'string') {
    return { found: false, message: 'No search query provided' };
  }

  const cleanQuery = query.trim();
  const filter = { isActive: true, isDeleted: false };
  if (category && category !== 'All') {
    filter.category = category;
  }

  // Common query stop words to prevent false-positive matching
  const STOP_WORDS = new Set([
    'policy', 'policies', 'the', 'what', 'regarding', 'rules', 'about', 'is', 'are', 'in',
    'for', 'company', 'handbook', 'guidelines', 'and', 'with', 'from', 'this', 'that',
    'inside', 'outside', 'does', 'have', 'tell', 'me', 'please', 'can', 'you'
  ]);
  const meaningfulWords = cleanQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  let docs = [];
  // Attempt MongoDB full-text search first with meaningful search terms
  if (meaningfulWords.length > 0) {
    const textQuery = meaningfulWords.join(' ');
    docs = await PolicyDoc.find(
      { ...filter, $text: { $search: textQuery } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .lean();
  }

  // If text index returned 0 matches, perform regex fallback on title and extractedText
  if (!docs || docs.length === 0) {
    if (meaningfulWords.length === 0) {
      return {
        found: false,
        message: `No active policy documents found matching '${cleanQuery}'.`
      };
    }
    const escapedWords = meaningfulWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regexPattern = escapedWords.join('|');
    docs = await PolicyDoc.find({
      ...filter,
      $or: [
        { title: { $regex: regexPattern, $options: 'i' } },
        { extractedText: { $regex: regexPattern, $options: 'i' } }
      ]
    })
      .limit(3)
      .lean();
  }

  if (!docs || docs.length === 0) {
    return {
      found: false,
      message: `No active policy documents found matching '${cleanQuery}'.`
    };
  }

  const results = docs.map((doc) => {
    // Extract a focused snippet around the query terms
    const text = doc.extractedText || '';
    const lowerText = text.toLowerCase();
    const queryTerm = cleanQuery.toLowerCase().split(/\s+/)[0] || '';
    const matchIdx = lowerText.indexOf(queryTerm);

    let snippet = '';
    if (matchIdx !== -1) {
      const start = Math.max(0, matchIdx - 100);
      const end = Math.min(text.length, matchIdx + 300);
      snippet = (start > 0 ? '...' : '') + text.substring(start, end).trim() + (end < text.length ? '...' : '');
    } else {
      snippet = text.substring(0, 350).trim() + (text.length > 350 ? '...' : '');
    }

    return {
      policyDocId: doc._id,
      title: doc.title,
      category: doc.category,
      snippet
    };
  });

  return {
    found: true,
    results
  };
}

/**
 * 2. getMyLeaveBalance: Secure identity-scoped leave balance query
 */
export async function getMyLeaveBalance(_args, actor) {
  if (!actor?.employeeId) {
    return {
      error: true,
      message: 'No associated employee profile found for the active user account.'
    };
  }

  const currentYear = new Date().getFullYear();
  let balanceDoc = await LeaveBalance.findOne({
    employeeId: actor.employeeId,
    year: currentYear
  })
    .populate('balances.leaveTypeId', 'name code')
    .lean();

  if (!balanceDoc) {
    // Check previous year
    balanceDoc = await LeaveBalance.findOne({
      employeeId: actor.employeeId,
      year: currentYear - 1
    })
      .populate('balances.leaveTypeId', 'name code')
      .lean();
  }

  if (!balanceDoc || !balanceDoc.balances || balanceDoc.balances.length === 0) {
    // If no balance record, fetch active leave types to display 0s
    const leaveTypes = await LeaveType.find({ isActive: true }).select('name code daysAllowed').lean();
    return {
      year: currentYear,
      balances: leaveTypes.map((lt) => ({
        leaveTypeId: lt._id,
        leaveType: lt.name,
        code: lt.code,
        allocatedDays: lt.daysAllowed || 0,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: lt.daysAllowed || 0
      }))
    };
  }

  const formattedBalances = balanceDoc.balances.map((b) => {
    const typeName = b.leaveTypeId?.name || 'Leave';
    const code = b.leaveTypeId?.code || '';
    const totalAllocated = (b.allocatedDays || 0) + (b.carriedForwardDays || 0);
    const used = b.usedDays || 0;
    const pending = b.pendingDays || 0;
    const remaining = Math.max(0, totalAllocated - used - pending);

    return {
      leaveTypeId: b.leaveTypeId?._id,
      leaveType: typeName,
      code,
      allocatedDays: totalAllocated,
      usedDays: used,
      pendingDays: pending,
      remainingDays: remaining
    };
  });

  return {
    year: balanceDoc.year,
    balances: formattedBalances
  };
}

/**
 * 3. getMyLastPayslip: Secure identity-scoped latest payslip query
 */
export async function getMyLastPayslip(_args, actor) {
  if (!actor?.employeeId) {
    return {
      error: true,
      message: 'No associated employee profile found for the active user account.'
    };
  }

  const payslip = await Payslip.findOne({
    employeeId: actor.employeeId
  })
    .sort({ year: -1, month: -1 })
    .lean();

  if (!payslip) {
    return {
      found: false,
      message: 'No processed payslips found in your records.'
    };
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthName = monthNames[payslip.month - 1] || `Month ${payslip.month}`;

  return {
    found: true,
    payslipId: payslip._id,
    period: `${monthName} ${payslip.year}`,
    month: payslip.month,
    year: payslip.year,
    netPayPKR: (payslip.netPay || 0) / 100,
    grossPayPKR: (payslip.grossPay || 0) / 100,
    totalDeductionsPKR: (payslip.totalDeductions || 0) / 100,
    status: payslip.status,
    downloadUrl: `/api/v1/payroll/payslips/${payslip._id}/pdf`
  };
}

/**
 * 4. getNextPayDate: Predict next salary disbursement date
 */
export async function getNextPayDate(_args, _actor) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Standard salary disbursement in Pakistan corporate sector is the 1st of the next month
  let nextPayDate = new Date(currentYear, currentMonth + 1, 1);
  // If nextPayDate is on Sunday, adjust to Monday
  if (nextPayDate.getDay() === 0) {
    nextPayDate.setDate(nextPayDate.getDate() + 1);
  }

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = nextPayDate.toLocaleDateString('en-US', options);

  const diffTime = nextPayDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    nextPayDate: nextPayDate.toISOString().split('T')[0],
    formattedDate,
    daysRemaining: diffDays > 0 ? diffDays : 0,
    standardDisbursementRule: 'Salaries are disbursed on the 1st day of each calendar month.'
  };
}

/**
 * 5. applyLeave: Execute verified leave application
 */
export async function applyLeave({ leaveTypeId, startDate, endDate, reason }, actor) {
  if (!actor?.employeeId) {
    return {
      success: false,
      message: 'User must be associated with an active employee record to apply for leave.'
    };
  }

  try {
    let resolvedLeaveTypeId = leaveTypeId;
    if (!resolvedLeaveTypeId) {
      // Find Casual leave or first active leave type
      const defaultType = await LeaveType.findOne({ isActive: true }).lean();
      if (!defaultType) {
        return { success: false, message: 'No active leave types configured in system.' };
      }
      resolvedLeaveTypeId = defaultType._id;
    }

    const application = await leaveService.applyLeave(
      actor.employeeId,
      {
        leaveTypeId: resolvedLeaveTypeId,
        startDate,
        endDate,
        reason: reason || 'Applied via HR Chatbot Assistant'
      },
      actor
    );

    return {
      success: true,
      applicationId: application._id,
      status: application.status,
      startDate: application.startDate,
      endDate: application.endDate,
      message: 'Leave application submitted successfully for manager approval.'
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to submit leave application.'
    };
  }
}

/**
 * OpenAI Tool Specification Catalogue
 */
export const CHATBOT_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'searchPolicy',
      description: 'Search company policy documents, employee handbook, rules on leave, attendance, probation, conduct, or benefits.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Keywords to search in company policy documents (e.g. "probation period", "dress code", "wfh rules").'
          },
          category: {
            type: 'string',
            enum: ['General', 'Leave', 'Attendance', 'Conduct', 'Benefits', 'Travel', 'Security', 'Probation', 'All'],
            description: 'Optional category to narrow policy search.'
          }
        },
        required: ['query'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getMyLeaveBalance',
      description: 'Fetch the authenticated employee’s own leave balances (Annual, Casual, Sick).',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getMyLastPayslip',
      description: 'Fetch the authenticated employee’s most recent salary payslip, net pay, and PDF link.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getNextPayDate',
      description: 'Get the date of the next upcoming salary disbursement.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'applyLeave',
      description: 'Submit a leave request for the authenticated employee after user confirmation.',
      parameters: {
        type: 'object',
        properties: {
          leaveTypeId: { type: 'string', description: 'ID of the leave type' },
          startDate: { type: 'string', description: 'Start date in YYYY-MM-DD' },
          endDate: { type: 'string', description: 'End date in YYYY-MM-DD' },
          reason: { type: 'string', description: 'Reason for leave' }
        },
        required: ['startDate', 'endDate'],
        additionalProperties: false
      }
    }
  }
];

/**
 * Tool dispatcher
 */
export async function executeToolCall(toolName, toolArgs, actor) {
  switch (toolName) {
    case 'searchPolicy':
      return await searchPolicy(toolArgs);
    case 'getMyLeaveBalance':
      return await getMyLeaveBalance(toolArgs, actor);
    case 'getMyLastPayslip':
      return await getMyLastPayslip(toolArgs, actor);
    case 'getNextPayDate':
      return await getNextPayDate(toolArgs, actor);
    case 'applyLeave':
      return await applyLeave(toolArgs, actor);
    default:
      return { error: `Tool ${toolName} not found` };
  }
}
