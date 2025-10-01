/**
 * Props for RequestWorkflowStepper component
 */
export interface RequestWorkflowStepperProps {
  /**
   * Workflow context - determines display mode
   */
  context: WorkflowContext;

  /**
   * Current request object from useRequestForm hook
   * Required for 'newRequest' and 'existingRequest' contexts
   */
  request?: IRequest;

  /**
   * Selected request type for typeSelector context
   * Required only when context is 'typeSelector'
   */
  selectedRequestType?: RequestType;

  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * Step configuration for a request type
 */
export interface StepConfig {
  id: string;
  title: string;
  description: string;
  content: string;
}


import { StepConfig, RequestType } from './types';

/**
 * Step configurations for Communication Request type
 */
const communicationSteps: StepConfig[] = [
  {
    id: 'draft',
    title: 'Draft',
    description: 'Create and prepare your request',
    content: `
      <h3>Draft Stage</h3>
      <p>In this stage, you will:</p>
      <ul>
        <li>Fill in the request details including title, purpose, and submission type</li>
        <li>Select the appropriate submission item (e.g., White Paper, Email Blast)</li>
        <li>Provide at least one pre-approval with proof (Communications, Portfolio Manager, etc.)</li>
        <li>Upload documents for review</li>
        <li>Set your target return date</li>
      </ul>
      <p><strong>Note:</strong> You can save your request as a draft and return to complete it later.</p>
    `,
  },
  {
    id: 'legal-intake',
    title: 'Legal Intake',
    description: 'Legal team reviews and assigns attorney',
    content: `
      <h3>Legal Intake Stage</h3>
      <p>Once submitted, your request enters the Legal Intake stage where:</p>
      <ul>
        <li>Legal Admin reviews your request details and validates the review audience</li>
        <li>Legal Admin determines if they know the right attorney or need committee input</li>
        <li>Attorney is assigned either directly by Legal Admin or through the Attorney Assigner committee</li>
        <li>The assigned attorney receives notification of the new request</li>
      </ul>
      <p><strong>Typical Duration:</strong> Less than 1 business day</p>
    `,
  },
  {
    id: 'in-review',
    title: 'In Review',
    description: 'Legal and/or Compliance review',
    content: `
      <h3>In Review Stage</h3>
      <p>Your documents are being reviewed:</p>
      <ul>
        <li><strong>Legal Review:</strong> Assigned attorney reviews documents for legal compliance</li>
        <li><strong>Compliance Review:</strong> If required, compliance team reviews for regulatory compliance</li>
        <li>Reviewers may request changes or additional documents through comments</li>
        <li>You can upload revised documents and respond to feedback</li>
        <li>This back-and-forth continues until review is complete</li>
      </ul>
      <p><strong>Duration:</strong> Varies based on submission item (1-5 business days typically)</p>
      <p><strong>Outcomes:</strong> Approved, Approved With Comments, Respond To Comments And Resubmit, or Not Approved</p>
    `,
  },
  {
    id: 'closeout',
    title: 'Closeout',
    description: 'Finalize and close the request',
    content: `
      <h3>Closeout Stage</h3>
      <p>Your request has been approved! Final steps:</p>
      <ul>
        <li>Review the approval outcomes and any comments from reviewers</li>
        <li>If compliance flags were set (Foreside Review or Retail Use), provide a Tracking ID</li>
        <li>Click "Close Request" to complete the workflow</li>
        <li>Download approved documents if needed</li>
      </ul>
      <p><strong>Note:</strong> A Tracking ID is required only if compliance review indicated Foreside Review or Retail Use.</p>
    `,
  },
  {
    id: 'completed',
    title: 'Completed',
    description: 'Request is finalized',
    content: `
      <h3>Completed Stage</h3>
      <p>Your request is now complete!</p>
      <ul>
        <li>All approvals and reviews are documented</li>
        <li>Complete audit trail is available</li>
        <li>All stakeholders have been notified</li>
        <li>Request is now read-only for archival purposes</li>
      </ul>
      <p><strong>Note:</strong> You can reference this request in future submissions using the "Prior Submissions" field.</p>
    `,
  },
];

/**
 * Step configurations for General Review Request type (Phase 2)
 */
const generalReviewSteps: StepConfig[] = [
  {
    id: 'draft',
    title: 'Draft',
    description: 'Create your general review request',
    content: `
      <h3>Draft Stage - General Review</h3>
      <p>General Review requests are for contracts, policies, agreements, and NDAs.</p>
      <p>In this stage, you will provide the necessary details and documentation for legal review.</p>
      <p><em>Available in Phase 2</em></p>
    `,
  },
  {
    id: 'legal-intake',
    title: 'Legal Intake',
    description: 'Legal team reviews and assigns attorney',
    content: `
      <h3>Legal Intake Stage - General Review</h3>
      <p>Legal Admin will review and assign the appropriate attorney based on the type of document being reviewed.</p>
      <p><em>Available in Phase 2</em></p>
    `,
  },
  {
    id: 'in-review',
    title: 'In Review',
    description: 'Legal review in progress',
    content: `
      <h3>In Review Stage - General Review</h3>
      <p>Attorney reviews your documents and provides feedback or approval.</p>
      <p><em>Available in Phase 2</em></p>
    `,
  },
  {
    id: 'closeout',
    title: 'Closeout',
    description: 'Finalize the request',
    content: `
      <h3>Closeout Stage - General Review</h3>
      <p>Review the outcomes and close the request.</p>
      <p><em>Available in Phase 2</em></p>
    `,
  },
  {
    id: 'completed',
    title: 'Completed',
    description: 'Request is finalized',
    content: `
      <h3>Completed Stage - General Review</h3>
      <p>Your general review request is complete.</p>
      <p><em>Available in Phase 2</em></p>
    `,
  },
];

/**
 * Step configurations for IMA Review Request type (Phase 2)
 */
const imaReviewSteps: StepConfig[] = [
  {
    id: 'draft',
    title: 'Draft',
    description: 'Create your IMA review request',
    content: `
      <h3>Draft Stage - IMA Review</h3>
      <p>Investment Management Agreement reviews require specialized handling.</p>
      <p>In this stage, you will provide all necessary IMA documentation and details.</p>
      <p><em>Available in Phase 2</em></p>
    `,
  },
  {
    id: 'legal-intake',
    title: 'Legal Intake',
    description: 'Legal team reviews and assigns attorney',
    content: `
      <h3>Legal Intake Stage - IMA Review</h3>
      <p>Legal Admin will assign an attorney with IMA expertise.</p>
      <p><em>Available in Phase 2</em></p>
    `,
  },
  {
    id: 'in-review',
    title: 'In Review',
    description: 'IMA review in progress',
    content: `
      <h3>In Review Stage - IMA Review</h3>
      <p>Specialized review of Investment Management Agreement documentation.</p>
      <p><em>Available in Phase 2</em></p>
    `,
  },
  {
    id: 'closeout',
    title: 'Closeout',
    description: 'Finalize the IMA request',
    content: `
      <h3>Closeout Stage - IMA Review</h3>
      <p>Review outcomes and complete the IMA review process.</p>
      <p><em>Available in Phase 2</em></p>
    `,
  },
  {
    id: 'completed',
    title: 'Completed',
    description: 'IMA request is finalized',
    content: `
      <h3>Completed Stage - IMA Review</h3>
      <p>Your IMA review request is complete.</p>
      <p><em>Available in Phase 2</em></p>
    `,
  },
];

/**
 * Get step configurations for a request type
 */
export function getStepConfigs(requestType: RequestType): StepConfig[] {
  switch (requestType) {
    case 'Communication':
      return communicationSteps;
    case 'GeneralReview':
      return generalReviewSteps;
    case 'IMA':
      return imaReviewSteps;
    default:
      return [];
  }
}
