import { z } from 'zod';

// Hold Request schema
export const holdRequestSchema = z.object({
  onHoldReason: z.string()
    .min(10, 'Hold reason must be at least 10 characters')
    .max(1000, 'Hold reason must not exceed 1,000 characters'),
});

// Cancel Request schema
export const cancelRequestSchema = z.object({
  cancelReason: z.string()
    .min(10, 'Cancel reason must be at least 10 characters')
    .max(1000, 'Cancel reason must not exceed 1,000 characters'),
});
