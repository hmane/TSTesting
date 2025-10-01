import { StepData, StepStatus } from '../WorkflowStepper';
import { IRequest, RequestStatus, RequestType, StepConfig } from './types';

/**
 * Format date to MM/dd/yyyy hh:mm a format
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

/**
 * Map request status to step ID
 */
export function getStepIdFromStatus(status: RequestStatus): string {
  const statusMap: Record<RequestStatus, string> = {
    Draft: 'draft',
    'Legal Intake': 'legal-intake',
    'In Review': 'in-review',
    Closeout: 'closeout',
    Completed: 'completed',
    Cancelled: 'cancelled',
    'On Hold': 'on-hold',
  };

  return statusMap[status] || 'draft';
}

/**
 * Get step index by ID
 */
export function getStepIndex(stepId: string, configs: StepConfig[]): number {
  return configs.findIndex(config => config.id === stepId);
}

/**
 * Determine step status based on request status and step position
 */
export function determineStepStatus(
  stepId: string,
  currentStatus: RequestStatus,
  previousStatus: RequestStatus | undefined,
  configs: StepConfig[]
): StepStatus {
  const currentStepId = getStepIdFromStatus(currentStatus);
  const currentStepIndex = getStepIndex(currentStepId, configs);
  const thisStepIndex = getStepIndex(stepId, configs);

  // Handle Cancelled status
  if (currentStatus === 'Cancelled') {
    if (previousStatus) {
      const previousStepId = getStepIdFromStatus(previousStatus);
      const previousStepIndex = getStepIndex(previousStepId, configs);

      if (thisStepIndex < previousStepIndex) {
        return 'completed';
      } else if (thisStepIndex === previousStepIndex) {
        return 'completed';
      } else {
        // This is the cancelled step (show as error at the end)
        return 'error';
      }
    }
    return 'error';
  }

  // Handle On Hold status
  if (currentStatus === 'On Hold') {
    if (previousStatus) {
      const previousStepId = getStepIdFromStatus(previousStatus);
      const previousStepIndex = getStepIndex(previousStepId, configs);

      if (thisStepIndex < previousStepIndex) {
        return 'completed';
      } else if (thisStepIndex === previousStepIndex) {
        return 'warning'; // Current step when put on hold
      } else {
        return 'blocked'; // Future steps are blocked
      }
    }
    return 'blocked';
  }

  // Normal flow
  if (thisStepIndex < currentStepIndex) {
    return 'completed';
  } else if (thisStepIndex === currentStepIndex) {
    return 'current';
  } else {
    return 'pending';
  }
}

/**
 * Get description for a step based on request data and step status
 */
export function getStepDescriptions(
  stepId: string,
  stepStatus: StepStatus,
  request: IRequest
): { description1: string; description2: string } {
  // For cancelled status, show cancelled info
  if (request.status === 'Cancelled' && stepStatus === 'error') {
    return {
      description1: request.cancelledBy?.title || 'Cancelled',
      description2: formatDate(request.cancelledOn),
    };
  }

  // For on hold status with warning, show on hold info
  if (request.status === 'On Hold' && stepStatus === 'warning') {
    return {
      description1: `On Hold by ${request.onHoldBy?.title || 'Unknown'}`,
      description2: `Since ${formatDate(request.onHoldSince)}`,
    };
  }

  // For pending or blocked steps, show default info
  if (stepStatus === 'pending' || stepStatus === 'blocked') {
    return {
      description1: 'Pending',
      description2: 'Awaiting previous step',
    };
  }

  // For completed and current steps, show specific info based on step
  switch (stepId) {
    case 'draft':
      if (stepStatus === 'completed' || stepStatus === 'current') {
        return {
          description1: request.createdBy?.title || 'Created',
          description2: formatDate(request.created),
        };
      }
      break;

    case 'legal-intake':
      if (stepStatus === 'completed') {
        return {
          description1: `Submitted by ${request.submittedBy?.title || 'Unknown'}`,
          description2: formatDate(request.submittedOn),
        };
      } else if (stepStatus === 'current') {
        return {
          description1: 'Legal Admin reviewing',
          description2: 'Attorney assignment pending',
        };
      }
      break;

    case 'in-review':
      if (stepStatus === 'completed') {
        return {
          description1: `Reviewed by ${request.attorney?.title || 'Attorney'}`,
          description2: formatDate(request.submittedForReviewOn),
        };
      } else if (stepStatus === 'current') {
        return {
          description1: `Assigned to ${request.attorney?.title || 'Attorney'}`,
          description2: 'Review in progress',
        };
      }
      break;

    case 'closeout':
      if (stepStatus === 'completed') {
        return {
          description1: `Closed by ${request.closeoutBy?.title || 'Unknown'}`,
          description2: formatDate(request.closeoutOn),
        };
      } else if (stepStatus === 'current') {
        return {
          description1: 'Ready for closeout',
          description2: 'Awaiting submitter',
        };
      }
      break;

    case 'completed':
      if (stepStatus === 'completed' || stepStatus === 'current') {
        return {
          description1: 'Request completed',
          description2: formatDate(request.closeoutOn),
        };
      }
      break;
  }

  // Default fallback
  return {
    description1: '',
    description2: '',
  };
}

/**
 * Build step data for type selector context (preview mode)
 */
export function buildTypeSelectorSteps(
  requestType: RequestType,
  configs: StepConfig[]
): StepData[] {
  if (!requestType) return [];

  return configs.map(config => ({
    id: config.id,
    title: config.title,
    description1: config.description,
    description2: '',
    status: 'completed' as StepStatus, // All steps shown as completed for preview
    content: config.content,
    isClickable: true,
  }));
}

/**
 * Build step data for new request context
 */
export function buildNewRequestSteps(
  requestType: RequestType,
  configs: StepConfig[]
): StepData[] {
  if (!requestType) return [];

  return configs.map((config, index) => ({
    id: config.id,
    title: config.title,
    description1: index === 0 ? 'Current step' : 'Pending',
    description2: index === 0 ? 'Complete the form' : 'Awaiting previous step',
    status: (index === 0 ? 'current' : 'pending') as StepStatus,
    isClickable: false,
  }));
}

/**
 * Build step data for existing request context
 */
export function buildExistingRequestSteps(request: IRequest, configs: StepConfig[]): StepData[] {
  const requestType = request.requestType;
  if (!requestType) return [];

  const steps: StepData[] = configs.map(config => {
    const stepStatus = determineStepStatus(
      config.id,
      request.status || 'Draft',
      request.previousStatus,
      configs
    );

    const { description1, description2 } = getStepDescriptions(config.id, stepStatus, request);

    return {
      id: config.id,
      title: config.title,
      description1,
      description2,
      status: stepStatus,
      isClickable: false,
    };
  });

  // Add cancelled step if status is cancelled
  if (request.status === 'Cancelled') {
    steps.push({
      id: 'cancelled',
      title: 'Cancelled',
      description1: request.cancelledBy?.title || 'Cancelled',
      description2: formatDate(request.cancelledOn),
      status: 'error',
      isClickable: false,
    });
  }

  return steps;
}
