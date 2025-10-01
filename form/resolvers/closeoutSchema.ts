import { z } from 'zod';

// Closeout schema with conditional tracking ID
export const closeoutSchema = z.object({
  trackingId: z.string().optional(),
  isForesideReviewRequired: z.boolean().optional(),
  isRetailUse: z.boolean().optional(),
}).refine(
  (data) => {
    // Tracking ID required if either flag is true
    if (data.isForesideReviewRequired || data.isRetailUse) {
      return !!data.trackingId && data.trackingId.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Tracking ID is required when Foreside Review or Retail Use is indicated',
    path: ['trackingId'],
  }
);
