import { z } from 'zod';

// Submit Compliance Review schema
export const submitComplianceReviewSchema = z.object({
  complianceReviewStatus: z.enum([
    'Not Started',
    'In Progress',
    'Waiting On Submitter',
    'Waiting On Compliance Reviewer',
    'Completed'
  ], {
    required_error: 'Please select a compliance review status',
  }).refine(status => status === 'Completed', {
    message: 'Status must be set to Completed before submitting review',
  }),
  
  complianceReviewOutcome: z.enum([
    'Approved',
    'Approved With Comments',
    'Respond To Comments And Resubmit',
    'Not Approved'
  ], {
    required_error: 'Please select a review outcome',
  }),
  
  isForesideReviewRequired: z.boolean().optional(),
  
  isRetailUse: z.boolean().optional(),
});

// Save progress schema (no validation)
export const saveComplianceProgressSchema = z.object({
  complianceReviewStatus: z.enum([
    'Not Started',
    'In Progress',
    'Waiting On Submitter',
    'Waiting On Compliance Reviewer',
    'Completed'
  ]).optional(),
  
  complianceReviewOutcome: z.enum([
    'Approved',
    'Approved With Comments',
    'Respond To Comments And Resubmit',
    'Not Approved'
  ]).optional(),
  
  isForesideReviewRequired: z.boolean().optional(),
  
  isRetailUse: z.boolean().optional(),
});
