/**
 * @file chat.validation.js
 * @description Zod validation schemas for Internal Chat (M24).
 */

import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid conversation ID format')
  })
});

export const createConversationSchema = z.object({
  body: z.object({
    type: z.enum(['direct', 'group']).default('direct'),
    // Used for direct 1-to-1 conversation creation
    participantId: z
      .string()
      .regex(objectIdRegex, 'Invalid participant ID format')
      .optional(),
    // Used for group creation
    name: z
      .string()
      .trim()
      .min(2, 'Group name must be at least 2 characters')
      .max(100, 'Group name cannot exceed 100 characters')
      .optional(),
    description: z.string().trim().max(500).optional(),
    participants: z
      .array(z.string().regex(objectIdRegex, 'Invalid participant ID'))
      .optional()
  }).refine((data) => {
    if (data.type === 'direct') {
      return Boolean(data.participantId);
    }
    if (data.type === 'group') {
      return Boolean(data.name && Array.isArray(data.participants) && data.participants.length >= 1);
    }
    return true;
  }, {
    message: 'For direct chat, participantId is required. For group chat, name and participants are required.'
  })
});

export const modifyParticipantsSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid conversation ID format')
  }),
  body: z.object({
    action: z.enum(['add', 'remove']),
    userId: z.string().regex(objectIdRegex, 'Invalid user ID format')
  })
});

export const sendMessageSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid conversation ID format')
  }),
  body: z.object({
    content: z.string().trim().max(5000, 'Message cannot exceed 5000 characters').optional().default(''),
    messageType: z.enum(['text', 'file', 'image', 'system']).optional().default('text'),
    attachments: z
      .array(
        z.object({
          url: z
            .string()
            .url('Invalid attachment URL')
            .regex(/^https:\/\//, 'Attachment URL must use HTTPS'),
          fileType: z.string().optional().default('application/octet-stream'),
          fileName: z.string().optional().default('attachment'),
          fileSize: z.number().max(10 * 1024 * 1024, 'File size cannot exceed 10MB').optional().default(0)
        })
      )
      .optional()
      .default([])
  }).refine((data) => {
    // Must have either non-empty content or at least one attachment
    return Boolean(data.content || (data.attachments && data.attachments.length > 0));
  }, {
    message: 'Message must have content or at least one attachment'
  })
});

export const listMessagesSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid conversation ID format')
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional()
  }).optional()
});

export const searchMessagesSchema = z.object({
  query: z.object({
    q: z
      .string({ required_error: 'Search query is required' })
      .trim()
      .min(1, 'Search query must be at least 1 character')
      .max(100, 'Search query cannot exceed 100 characters'),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional()
  })
});
