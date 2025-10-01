import { z } from 'zod';

// Base approval schema
const baseApprovalsSchema = z.object({
  requiresCommunicationsApproval: z.boolean().optional(),
  communicationsApprovalDate: z.date().optional().nullable(),
  communicationsApprover: z.any().optional().nullable(),
  
  hasPortfolioManagerApproval: z.boolean().optional(),
  portfolioManagerApprovalDate: z.date().optional().nullable(),
  portfolioManager: z.any().optional().nullable(),
  
  hasResearchAnalystApproval: z.boolean().optional(),
  researchAnalystApprovalDate: z.date().optional().nullable(),
  researchAnalyst: z.any().optional().nullable(),
  
  hasSMEApproval: z.boolean().optional(),
  smeApprovalDate: z.date().optional().nullable(),
  subjectMatterExpert: z.any().optional().nullable(),
  
  hasPerformanceApproval: z.boolean().optional(),
  performanceApprovalDate: z.date().optional().nullable(),
  performanceApprover: z.any().optional().nullable(),
  
  hasOtherApproval: z.boolean().optional(),
  otherApprovalTitle: z.string().optional(),
  otherApprovalDate: z.date().optional().nullable(),
  otherApproval: z.any().optional().nullable(),
});

// Save as Draft schema - no validation
export const saveAsDraftApprovalsSchema = baseApprovalsSchema.partial();

// Submit schema - at least one approval required with validation
export const submitApprovalsSchema = baseApprovalsSchema
  .refine(
    (data) => {
      // Communication approval validation
      if (data.requiresCommunicationsApproval) {
        return !!data.communicationsApprovalDate && !!data.communicationsApprover;
      }
      return true;
    },
    {
      message: 'Communication approval date and approver are required',
      path: ['communicationsApprovalDate'],
    }
  )
  .refine(
    (data) => {
      // Portfolio Manager approval validation
      if (data.hasPortfolioManagerApproval) {
        return !!data.portfolioManagerApprovalDate && !!data.portfolioManager;
      }
      return true;
    },
    {
      message: 'Portfolio manager approval date and approver are required',
      path: ['portfolioManagerApprovalDate'],
    }
  )
  .refine(
    (data) => {
      // Research Analyst approval validation
      if (data.hasResearchAnalystApproval) {
        return !!data.researchAnalystApprovalDate && !!data.researchAnalyst;
      }
      return true;
    },
    {
      message: 'Research analyst approval date and approver are required',
      path: ['researchAnalystApprovalDate'],
    }
  )
  .refine(
    (data) => {
      // SME approval validation
      if (data.hasSMEApproval) {
        return !!data.smeApprovalDate && !!data.subjectMatterExpert;
      }
      return true;
    },
    {
      message: 'Subject matter expert approval date and approver are required',
      path: ['smeApprovalDate'],
    }
  )
  .refine(
    (data) => {
      // Performance approval validation
      if (data.hasPerformanceApproval) {
        return !!data.performanceApprovalDate && !!data.performanceApprover;
      }
      return true;
    },
    {
      message: 'Performance approval date and approver are required',
      path: ['performanceApprovalDate'],
    }
  )
  .refine(
    (data) => {
      // Other approval validation
      if (data.hasOtherApproval) {
        return !!data.otherApprovalTitle && !!data.otherApprovalDate && !!data.otherApproval;
      }
      return true;
    },
    {
      message: 'Other approval title, date, and approver are required',
      path: ['otherApprovalDate'],
    }
  )
  .refine(
    (data) => {
      // At least one approval required
      const hasComm = data.requiresCommunicationsApproval && 
                      data.communicationsApprovalDate && 
                      data.communicationsApprover;
      
      const hasOther = data.hasPortfolioManagerApproval || 
                       data.hasResearchAnalystApproval || 
                       data.hasSMEApproval || 
                       data.hasPerformanceApproval || 
                       data.hasOtherApproval;
      
      return hasComm || hasOther;
    },
    {
      message: 'At least one approval is required before submitting',
      path: ['requiresCommunicationsApproval'],
    }
  );

// Default export
export const approvalsSchema = submitApprovalsSchema;
