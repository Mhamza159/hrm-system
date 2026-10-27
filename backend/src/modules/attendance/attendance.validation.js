/**
 * @file attendance.validation.js
 * @description Zod Validation Schemas for Attendance, Shifts, Breaks, WFH, and Month Locking.
 * 
 * SPECIFICATION:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10)
 * - Layer: Validation (Runtime input validation)
 */

import { z } from 'zod';

export const checkInSchema = z.object({
  body: z.object({
    source: z.enum(['web', 'mobile', 'biometric', 'qr', 'wfh']).optional().default('web'),
    location: z
      .object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        address: z.string().optional()
      })
      .optional()
  })
});

export const checkOutSchema = z.object({
  body: z.object({
    location: z
      .object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        address: z.string().optional()
      })
      .optional()
  })
});

export const breakStartSchema = z.object({
  body: z.object({
    type: z.enum(['meal', 'tea', 'prayer', 'other']).default('meal')
  })
});

export const breakEndSchema = z.object({
  body: z.object({}).optional()
});

export const manualEditSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Attendance ID is required')
  }),
  body: z.object({
    checkIn: z.string().datetime().optional().nullable(),
    checkOut: z.string().datetime().optional().nullable(),
    status: z.enum(['present', 'late', 'half_day', 'absent', 'on_leave', 'holiday']).optional(),
    overtimeApproved: z.boolean().optional(),
    overrideReason: z.string().min(5, 'Override reason must be at least 5 characters')
  })
});

export const lockMonthSchema = z.object({
  body: z.object({
    yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'yearMonth must match format YYYY-MM'),
    notes: z.string().optional().default('')
  })
});

export const unlockMonthSchema = z.object({
  body: z.object({
    yearMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'yearMonth must match format YYYY-MM'),
    notes: z.string().optional().default('')
  })
});

export const wfhRequestSchema = z.object({
  body: z.object({
    date: z.string().min(1, 'Date is required'),
    reason: z.string().min(5, 'Reason must be at least 5 characters')
  })
});

export const wfhDecideSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Request ID is required')
  }),
  body: z.object({
    decision: z.enum(['approved', 'rejected']),
    decisionReason: z.string().optional()
  })
});

export const correctionRequestSchema = z.object({
  body: z
    .object({
      date: z.string().min(1, 'Date is required'),
      requestedCheckIn: z.string().datetime().optional().nullable(),
      requestedCheckOut: z.string().datetime().optional().nullable(),
      reason: z.string().min(5, 'Reason must be at least 5 characters')
    })
    .refine((data) => Boolean(data.requestedCheckIn || data.requestedCheckOut), {
      message: 'At least requested check-in or check-out time must be specified'
    })
});

export const correctionDecideSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Correction ID is required')
  }),
  body: z.object({
    decision: z.enum(['approved', 'rejected']),
    decisionNotes: z.string().optional()
  })
});

export const queryMyAttendanceSchema = z.object({
  query: z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    date: z.string().optional()
  })
});

export const queryTeamAttendanceSchema = z.object({
  query: z.object({
    date: z.string().optional(),
    departmentId: z.string().optional(),
    status: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50)
  })
});

export const exportAttendanceSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    departmentId: z.string().optional(),
    status: z.string().optional()
  })
});

export const queryAttendanceHistorySchema = z.object({
  query: z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    search: z.string().optional(),
    departmentId: z.string().optional(),
    selfOnly: z.coerce.boolean().optional().default(false),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50)
  })
});

export const decideOvertimeSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Attendance ID is required')
  }),
  body: z.object({
    approved: z.boolean(),
    reason: z.string().optional().default('')
  })
});

export const queryTeamOvertimeSchema = z.object({
  query: z.object({
    status: z.enum(['all', 'pending', 'approved']).optional().default('all'),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    search: z.string().optional(),
    departmentId: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20)
  }).optional()
});

