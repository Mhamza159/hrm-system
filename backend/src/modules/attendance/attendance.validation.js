/**
 * @file attendance.validation.js
 * @description Zod Validation Schemas for Attendance, Shifts, Breaks, WFH, and Month Locking.
 * 
 * SPECIFICATION:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10)
 * - Layer: Validation (Runtime input validation)
 */

import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const checkInSchema = z.object({
  body: z.object({
    source: z.enum(['web', 'mobile', 'biometric', 'qr', 'face', 'wfh', 'field']).optional().default('web'),
    liveDescriptor: z
      .array(z.number().finite('Face descriptor coordinates must be finite numbers'))
      .length(128, 'Face descriptor must have 128 coordinates')
      .optional(),
    snapshot: z
      .string()
      .trim()
      .max(1500000, 'Snapshot payload exceeds 1.5MB limit')
      .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, 'Snapshot must be a valid base64 image data URI')
      .optional(),
    qrToken: z.string().trim().optional(),
    deviceId: z.string().trim().optional(),
    deviceModel: z.string().trim().max(100).optional(),
    location: z
      .object({
        latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional(),
        longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional(),
        accuracy: z.number().min(0, 'Accuracy cannot be negative').max(10000, 'Accuracy out of range').optional(),
        address: z.string().optional(),
        isMock: z.boolean().optional(),
        isClientVisit: z.boolean().optional(),
        clientName: z.string().trim().max(100).optional(),
        clientRemarks: z.string().trim().max(300).optional()
      })
      .optional()
  })
});

export const checkOutSchema = z.object({
  body: z.object({
    source: z.enum(['web', 'mobile', 'biometric', 'qr', 'face', 'wfh', 'field']).optional().default('web'),
    liveDescriptor: z
      .array(z.number().finite('Face descriptor coordinates must be finite numbers'))
      .length(128, 'Face descriptor must have 128 coordinates')
      .optional(),
    snapshot: z
      .string()
      .trim()
      .max(1500000, 'Snapshot payload exceeds 1.5MB limit')
      .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, 'Snapshot must be a valid base64 image data URI')
      .optional(),
    qrToken: z.string().trim().optional(),
    deviceId: z.string().trim().optional(),
    deviceModel: z.string().trim().max(100).optional(),
    location: z
      .object({
        latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional(),
        longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional(),
        accuracy: z.number().min(0, 'Accuracy cannot be negative').max(10000, 'Accuracy out of range').optional(),
        address: z.string().optional(),
        isMock: z.boolean().optional(),
        isClientVisit: z.boolean().optional(),
        clientName: z.string().trim().max(100).optional(),
        clientRemarks: z.string().trim().max(300).optional()
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


// ----------------------------------------------------
// M14: GPS Geo-fencing & WFH Locations Schemas
// ----------------------------------------------------

export const createWfhLocationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Location name must be at least 2 characters').max(100),
    address: z.string().trim().min(5, 'Address must be at least 5 characters').max(250),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusMeters: z.number().int().min(10, 'Radius must be at least 10 meters').max(150, 'Max radius is 150m').default(100)
  })
});

export const updateWfhLocationStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid WFH location ID')
  }),
  body: z.object({
    status: z.enum(['approved', 'rejected']),
    remarks: z.string().trim().max(250).optional()
  })
});

export const reviewFlaggedPunchSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid attendance ID')
  }),
  body: z.object({
    decision: z.enum(['approved', 'rejected']),
    comments: z.string().trim().min(5, 'Remarks must be at least 5 characters').max(300)
  })
});

export const queryPunchLocationsSchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD').optional(),
    departmentId: z.string().regex(objectIdRegex).optional(),
    onlyFlagged: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional()
  }).optional()
});
export const queryFlaggedPunchesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    status: z.enum(['pending', 'resolved', 'all']).optional().default('pending')
  }).optional()
});


// ----------------------------------------------------
// M13: QR Code Attendance & Kiosks Schemas
// ----------------------------------------------------

export const kioskIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid kiosk ID')
  })
});

export const createKioskSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Kiosk name must be at least 2 characters').max(100),
    code: z.string().trim().min(2, 'Kiosk code must be at least 2 characters').max(50).toUpperCase(),
    type: z.enum(['entry', 'exit', 'both']).default('both'),
    locationDescription: z.string().trim().max(200).optional().default(''),
    isActive: z.boolean().optional().default(true)
  })
});

export const updateKioskSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid kiosk ID')
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    type: z.enum(['entry', 'exit', 'both']).optional(),
    locationDescription: z.string().trim().max(200).optional(),
    isActive: z.boolean().optional()
  })
});

export const queryKiosksSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    type: z.enum(['entry', 'exit', 'both', 'all']).optional().default('all'),
    isActive: z.preprocess((val) => val === 'true' ? true : val === 'false' ? false : undefined, z.boolean().optional()),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50)
  }).optional()
});

export const getKioskQrSchema = z.object({
  query: z.object({
    kioskId: z.string().regex(objectIdRegex, 'Invalid kiosk ID')
  })
});

export const resetDeviceSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user ID')
  }),
  body: z.object({
    reason: z.string().trim().min(3, 'Reset reason must be at least 3 characters').max(200)
  })
});

export const enrollFaceSchema = z.object({
  body: z.object({
    descriptors: z
      .array(
        z
          .array(z.number().finite('Descriptor coordinate must be a finite number'))
          .length(128, 'Each face descriptor must contain exactly 128 float coordinates')
      )
      .min(3, 'At least 3 face captures required for reliable enrollment')
      .max(5, 'Maximum 5 face captures allowed'),
    photo: z
      .string()
      .trim()
      .max(1500000, 'Enrollment photo exceeds maximum size limit (1.5MB)')
      .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, 'Enrollment photo must be a valid base64 image data URI')
      .optional()
  })
});

export const faceApprovalSchema = z.object({
  params: z
    .object({
      userId: z.string().regex(objectIdRegex, 'Invalid user ID').optional(),
      id: z.string().regex(objectIdRegex, 'Invalid user ID').optional()
    })
    .optional(),
  body: z
    .object({
      reason: z.string().trim().max(500).optional()
    })
    .optional()
    .default({})
});

export const faceRejectSchema = z.object({
  params: z
    .object({
      userId: z.string().regex(objectIdRegex, 'Invalid user ID').optional(),
      id: z.string().regex(objectIdRegex, 'Invalid user ID').optional()
    })
    .optional(),
  body: z.object({
    reason: z.string().trim().min(3, 'Rejection reason is mandatory').max(500)
  })
});

export const faceResetSchema = z.object({
  params: z
    .object({
      userId: z.string().regex(objectIdRegex, 'Invalid user ID').optional(),
      id: z.string().regex(objectIdRegex, 'Invalid user ID').optional()
    })
    .optional(),
  body: z
    .object({
      reason: z.string().trim().max(500).optional()
    })
    .optional()
    .default({})
});
