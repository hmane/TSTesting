import React, { useMemo, useState } from 'react';
import { Stack } from '@fluentui/react';
import { WorkflowStepper, StepData } from '../WorkflowStepper';
import { RequestWorkflowStepperProps } from './types';
import { getStepConfigs } from './stepConfigs';
import {
  buildTypeSelectorSteps,
  buildNewRequestSteps,
  buildExistingRequestSteps,
} from './utils';

/**
 * RequestWorkflowStepper Component
 *
 * A specialized workflow stepper for the Legal Review System that handles:
 * - Type selector preview (fullSteps mode with content)
 * - New request creation (progress mode)
 * - Existing request display (progress mode with dynamic status)
 */
export const RequestWorkflowStepper: React.FC<RequestWorkflowStepperProps> = ({
  context,
  request,
  selectedRequestType,
  className,
}) => {
  // State for selected step (only used in typeSelector context)
  const [selectedStepId, setSelectedStepId] = useState<string | undefined>(undefined);

  // Determine request type based on context
  const requestType = useMemo(() => {
    if (context === 'typeSelector') {
      return selectedRequestType;
    }
    return request?.requestType;
  }, [context, selectedRequestType, request?.requestType]);

  // Get step configurations for the request type
  const stepConfigs = useMemo(() => {
    return getStepConfigs(requestType || null);
  }, [requestType]);

  // Build step data based on context
  const steps = useMemo((): StepData[] => {
    if (!requestType || stepConfigs.length === 0) {
      return [];
    }

    switch (context) {
      case 'typeSelector':
        return buildTypeSelectorSteps(requestType, stepConfigs);

      case 'newRequest':
        return buildNewRequestSteps(requestType, stepConfigs);

      case 'existingRequest':
        if (!request) {
          console.warn('RequestWorkflowStepper: request is required for existingRequest context');
          return [];
        }
        return buildExistingRequestSteps(request, stepConfigs);

      default:
        return [];
    }
  }, [context, requestType, stepConfigs, request]);

  // Determine display mode based on context
  const mode = useMemo(() => {
    return context === 'typeSelector' ? 'fullSteps' : 'progress';
  }, [context]);

  // Handle step click (only for typeSelector context)
  const handleStepClick = (step: StepData): void => {
    if (context === 'typeSelector') {
      setSelectedStepId(step.id);
    }
  };

  // Don't render if no steps
  if (steps.length === 0) {
    return null;
  }

  return (
    <Stack className={className}>
      <WorkflowStepper
        steps={steps}
        mode={mode}
        selectedStepId={selectedStepId}
        onStepClick={handleStepClick}
        minStepWidth={context === 'typeSelector' ? 160 : 140}
      />
    </Stack>
  );
};
