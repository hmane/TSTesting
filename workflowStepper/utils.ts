import { StepData, StepStatus } from './types';

/**
 * Finds the first step with 'current' status, or the last completed step if none are current
 */
export const findAutoSelectStep = (steps: StepData[]): StepData | null => {
  if (!steps || steps.length === 0) return null;

  // First, look for a step with 'current' status
  const currentStep = steps.find(step => step.status === 'current');
  if (currentStep) return currentStep;

  // If no current step, find the last completed step
  let lastCompletedStep: StepData | null = null;
  for (const step of steps) {
    if (step.status === 'completed') {
      lastCompletedStep = step;
    }
  }

  // If we have a last completed step, return it
  if (lastCompletedStep) return lastCompletedStep;

  // If no completed steps, return the first step
  return steps[0];
};

/**
 * Determines if a step should be clickable based on mode and status
 */
export const isStepClickable = (step: StepData, mode: 'fullSteps' | 'progress'): boolean => {
  // In progress mode, only allow clicking on completed and current steps
  if (mode === 'progress') {
    return step.status === 'completed' || step.status === 'current';
  }

  // In fullSteps mode, respect the step's isClickable property, defaulting to true
  return step.isClickable !== false;
};

/**
 * Gets the step by ID from the steps array
 */
export const getStepById = (steps: StepData[], stepId: string): StepData | null => {
  return steps.find(step => step.id === stepId) || null;
};

/**
 * Validates that step IDs are unique
 */
export const validateStepIds = (steps: StepData[]): boolean => {
  const ids = steps.map(step => step.id);
  const uniqueIds = new Set(ids);
  return ids.length === uniqueIds.size;
};

/**
 * Gets the step number (1-based index) for a given step ID
 */
export const getStepNumber = (steps: StepData[], stepId: string): number => {
  const index = steps.findIndex(step => step.id === stepId);
  return index >= 0 ? index + 1 : 0;
};

/**
 * Gets the next clickable step ID for keyboard navigation
 */
export const getNextClickableStepId = (
  steps: StepData[], 
  currentStepId: string, 
  mode: 'fullSteps' | 'progress'
): string | null => {
  const currentIndex = steps.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1) return null;

  for (let i = currentIndex + 1; i < steps.length; i++) {
    const step = steps[i];
    if (isStepClickable(step, mode)) {
      return step.id;
    }
  }

  return null;
};

/**
 * Gets the previous clickable step ID for keyboard navigation
 */
export const getPrevClickableStepId = (
  steps: StepData[], 
  currentStepId: string, 
  mode: 'fullSteps' | 'progress'
): string | null => {
  const currentIndex = steps.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1) return null;

  for (let i = currentIndex - 1; i >= 0; i--) {
    const step = steps[i];
    if (isStepClickable(step, mode)) {
      return step.id;
    }
  }

  return null;
};

/**
 * Calculates the completion percentage of the workflow
 */
export const calculateCompletionPercentage = (steps: StepData[]): number => {
  if (!steps || steps.length === 0) return 0;

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  return Math.round((completedSteps / steps.length) * 100);
};

/**
 * Gets a human-readable status description
 */
export const getStatusDescription = (status: StepStatus): string => {
  const statusMap: Record<StepStatus, string> = {
    completed: 'This step has been completed successfully',
    current: 'This step is currently in progress',
    pending: 'This step is waiting to be started',
    warning: 'This step requires attention',
    error: 'This step has encountered an error',
    blocked: 'This step is blocked and cannot proceed'
  };

  return statusMap[status] || 'Unknown status';
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Truncates text to a specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Checks if the browser supports the clipboard API
 */
export const supportsClipboard = (): boolean => {
  return navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
};

/**
 * Generates a simple hash for step content (useful for caching)
 */
export const hashStepContent = (step: StepData): string => {
  const content = `${step.id}-${step.title}-${step.status}-${step.description1 || ''}-${step.description2 || ''}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};
