import { z } from 'zod';

// Assign Attorney schema
export const assignAttorneySchema = z.object({
  attorney: z.number({
    required_error: 'Please select an attorney',
    invalid_type_error: 'Attorney must be selected',
  }).min(1, 'Please select an attorney'),
  
  reviewAudience: z.enum(['Legal', 'Compliance', 'Both']).optional(),
});

// Submit to Committee schema
export const submitToCommitteeSchema = z.object({
  reviewAudience: z.enum(['Legal', 'Compliance', 'Both']).optional(),
});
