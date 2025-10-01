import { z } from 'zod';

// Base schema with all fields
const baseRequestInfoSchema = z.object({
  requestTitle: z.string()
    .min(3, 'Request title must be at least 3 characters')
    .max(255, 'Request title must not exceed 255 characters'),
  
  department: z.string().optional(),
  
  requestType: z.enum(['Communication', 'General Review', 'IMA Review']).optional(),
  
  purpose: z.string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(10000, 'Purpose must not exceed 10,000 characters'),
  
  submissionType: z.enum(['New', 'Material Updates']),
  
  submissionItem: z.string().optional(),
  
  submissionItemId: z.number({
    required_error: 'Please select a submission item',
    invalid_type_error: 'Submission item must be a number',
  }),
  
  distributionMethod: z.array(z.string()).optional(),
  
  targetReturnDate: z.date({
    required_error: 'Target return date is required',
    invalid_type_error: 'Invalid date',
  }).refine(date => date > new Date(), {
    message: 'Target return date must be in the future',
  }),
  
  isRushRequest: z.boolean().optional(),
  
  rushRational: z.string().optional(),
  
  reviewAudience: z.enum(['Legal', 'Compliance', 'Both'], {
    required_error: 'Please select a review audience',
  }),
  
  priorSubmissions: z.array(z.any()).optional(),
  
  priorSubmissionNotes: z.string().optional(),
  
  dateOfFirstUse: z.date().optional().nullable(),
  
  additionalParty: z.array(z.any()).optional(),
});

// Save as Draft schema - minimal validation
export const saveAsDraftRequestInfoSchema = baseRequestInfoSchema.partial();

// Submit schema - full validation with rush rationale
export const submitRequestInfoSchema = baseRequestInfoSchema.refine(
  (data) => {
    if (data.isRushRequest && (!data.rushRational || data.rushRational.length < 10)) {
      return false;
    }
    return true;
  },
  {
    message: 'Rush rationale is required and must be at least 10 characters for rush requests',
    path: ['rushRational'],
  }
);

// Default export for general use
export const requestInfoSchema = submitRequestInfoSchema;
