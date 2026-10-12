/**
 * @file delegation.routes.js
 * @description Express Router for Approvals Delegation System (Slice 26.14).
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import * as delegationController from './delegation.controller.js';

const router = Router();
router.use(authenticate);

const createDelegationSchema = z.object({
  body: z.object({
    toUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid toUserId format'),
    permissions: z
      .array(
        z.object({
          action: z.string().min(1),
          subject: z.string().optional().default('all'),
          scope: z.enum(['own', 'team', 'department', 'all']).optional().default('department'),
          limit: z.number().optional()
        })
      )
      .min(1, 'At least one permission must be delegated'),
    startDate: z.string().datetime({ message: 'Valid ISO startDate required' }),
    endDate: z.string().datetime({ message: 'Valid ISO endDate required' }),
    reason: z.string().optional().default('')
  })
});

router.get('/', delegationController.getDelegations);
router.post('/', validate(createDelegationSchema), delegationController.createDelegation);
router.delete('/:id', delegationController.cancelDelegation);

export default router;
