import { mergeStyles, useTheme } from '@fluentui/react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContentArea } from './ContentArea';
import { StepItem } from './StepItem';
import { StepData, WorkflowStepperProps } from './types';
import {
  calculateCompletionPercentage,
  findAutoSelectStep,
  getNextClickableStepId,
  getPrevClickableStepId,
  getStepById,
  isStepClickable,
  validateStepIds,
} from './utils';
import { getStepperStyles } from './WorkflowStepper.styles';

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  steps,
  mode = 'fullSteps',
  fullWidth = true,
  showStepNumbers = true,
  selectedStepId,
  autoSelectCurrent = true,
  customColors,
  onStepClick,
  className,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalSelectedStepId, setInternalSelectedStepId] = useState<string | null>(null);
  const [announceText, setAnnounceText] = useState<string>('');

  // Validate step IDs on mount
  useEffect(() => {
    if (!validateStepIds(steps)) {
      console.warn(
        'WorkflowStepper: Duplicate step IDs detected. Each step must have a unique ID.'
      );
    }
  }, [steps]);

  // Determine which step should be selected
  const selectedStep = useMemo(() => {
    // If controlled selection is provided, use it
    if (selectedStepId) {
      return getStepById(steps, selectedStepId);
    }

    // If internal selection exists, use it
    if (internalSelectedStepId) {
      return getStepById(steps, internalSelectedStepId);
    }

    // Auto-select based on mode and autoSelectCurrent setting
    if (autoSelectCurrent) {
      return findAutoSelectStep(steps);
    }

    return null;
  }, [steps, selectedStepId, internalSelectedStepId, autoSelectCurrent]);

  // Update internal selection when controlled selection changes
  useEffect(() => {
    if (selectedStepId) {
      setInternalSelectedStepId(selectedStepId);
    }
  }, [selectedStepId]);

  // Auto-select step on initial load
  useEffect(() => {
    if (!selectedStepId && !internalSelectedStepId && autoSelectCurrent) {
      const autoStep = findAutoSelectStep(steps);
      if (autoStep) {
        setInternalSelectedStepId(autoStep.id);
      }
    }
  }, [steps, selectedStepId, internalSelectedStepId, autoSelectCurrent]);

  const styles = useMemo(
    () => getStepperStyles(theme, { fullWidth, stepCount: steps.length }),
    [theme, fullWidth, steps.length]
  );

  const handleStepClick = useCallback(
    (step: StepData) => {
      if (!isStepClickable(step, mode)) return;

      // Update internal state
      setInternalSelectedStepId(step.id);

      // Announce to screen readers
      setAnnounceText(`Selected step: ${step.title}`);

      // Call external handler if provided
      if (onStepClick) {
        onStepClick(step);
      }
    },
    [mode, onStepClick]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!selectedStep) return;

      let targetStepId: string | null = null;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          targetStepId = getNextClickableStepId(steps, selectedStep.id, mode);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          targetStepId = getPrevClickableStepId(steps, selectedStep.id, mode);
          break;
        case 'Home':
          event.preventDefault();
          targetStepId = steps.find(step => isStepClickable(step, mode))?.id || null;
          break;
        case 'End': {
          event.preventDefault();
          const clickableSteps = steps.filter(step => isStepClickable(step, mode));
          targetStepId = clickableSteps[clickableSteps.length - 1]?.id || null;
          break;
        }
      }

      if (targetStepId) {
        const targetStep = getStepById(steps, targetStepId);
        if (targetStep) {
          handleStepClick(targetStep);
        }
      }
    },
    [selectedStep, steps, mode, handleStepClick]
  );

  const completionPercentage = useMemo(() => calculateCompletionPercentage(steps), [steps]);

  const containerClasses = mergeStyles(styles.container, className);

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onKeyDown={handleKeyDown}
      role='application'
      aria-label={`Workflow stepper with ${steps.length} steps, ${completionPercentage}% complete`}
    >
      {/* Screen reader announcements */}
      <div
        aria-live='polite'
        aria-atomic='true'
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        {announceText}
      </div>

      {/* Steps container */}
      <div className={styles.stepsContainer} role='tablist' aria-label='Workflow steps'>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isSelected = selectedStep?.id === step.id;
          const clickable = isStepClickable(step, mode);

          return (
            <StepItem
              key={step.id}
              step={step}
              stepNumber={stepNumber}
              isSelected={isSelected}
              isClickable={clickable}
              showStepNumbers={showStepNumbers}
              customColors={customColors}
              onStepClick={handleStepClick}
            />
          );
        })}
      </div>

      {/* Content area - only show in fullSteps mode */}
      {mode === 'fullSteps' && <ContentArea selectedStep={selectedStep} isVisible={true} />}

      {/* Progress indicator for screen readers */}
      <div
        aria-live='polite'
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        Workflow progress: {completionPercentage}% complete
      </div>
    </div>
  );
};

export default WorkflowStepper;
