import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mergeStyles, useTheme, Icon } from '@fluentui/react';
import { ContentArea } from './ContentArea';
import { StepItem } from './StepItem';
import { StepData, WorkflowStepperProps } from './types';
import {
  calculateCompletionPercentage,
  findAutoSelectStep,
  getNextClickableStepId,
  getPrevClickableStepId,
  getFirstClickableStepId,
  getLastClickableStepId,
  getStepById,
  isStepClickable,
  validateStepIds,
  getStepStatistics,
} from './utils';
import { getStepperStyles } from './WorkflowStepper.styles';

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  steps,
  mode = 'fullSteps',
  selectedStepId,
  onStepClick,
  fullWidth = true,
  minStepWidth,
  descriptionStyles,
  className,
  showScrollHint = true,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const [internalSelectedStepId, setInternalSelectedStepId] = useState<string | null>(null);
  const [announceText, setAnnounceText] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showLeftScrollHint, setShowLeftScrollHint] = useState<boolean>(false);
  const [showRightScrollHint, setShowRightScrollHint] = useState<boolean>(false);

  // Validate step IDs on mount
  useEffect(() => {
    if (!validateStepIds(steps)) {
      console.warn(
        'WorkflowStepper: Duplicate step IDs detected. Each step must have a unique ID.'
      );
    }
  }, [steps]);

  // Check scroll hints
  const checkScrollHints = useCallback(() => {
    if (!showScrollHint || !stepsContainerRef.current) return;

    const container = stepsContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setShowLeftScrollHint(scrollLeft > 10);
    setShowRightScrollHint(scrollLeft + clientWidth < scrollWidth - 10);
  }, [showScrollHint]);

  // Set up scroll hint detection
  useEffect(() => {
    if (!showScrollHint) return;

    const container = stepsContainerRef.current;
    if (!container) return;

    // Initial check
    const timer = setTimeout(checkScrollHints, 100);

    // Add scroll listener
    container.addEventListener('scroll', checkScrollHints);

    // Add resize listener to window
    window.addEventListener('resize', checkScrollHints);

    return () => {
      clearTimeout(timer);
      container.removeEventListener('scroll', checkScrollHints);
      window.removeEventListener('resize', checkScrollHints);
    };
  }, [checkScrollHints, showScrollHint, steps.length]);

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

    // Auto-select the first current step or last completed step
    return findAutoSelectStep(steps);
  }, [steps, selectedStepId, internalSelectedStepId]);

  // Update internal selection when controlled selection changes
  useEffect(() => {
    if (selectedStepId) {
      setInternalSelectedStepId(selectedStepId);
    }
  }, [selectedStepId]);

  // Auto-select step on initial load
  useEffect(() => {
    if (!isInitialized) {
      if (!selectedStepId && !internalSelectedStepId) {
        const autoStep = findAutoSelectStep(steps);
        if (autoStep) {
          setInternalSelectedStepId(autoStep.id);
        }
      }
      setIsInitialized(true);
    }
  }, [steps, selectedStepId, internalSelectedStepId, isInitialized]);

  const styles = useMemo(
    () =>
      getStepperStyles(theme, {
        fullWidth,
        stepCount: steps.length,
        minStepWidth,
        mode,
      }),
    [theme, fullWidth, steps.length, minStepWidth, mode]
  );

  const stepStatistics = useMemo(() => getStepStatistics(steps), [steps]);

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
          targetStepId = getFirstClickableStepId(steps, mode);
          break;
        case 'End':
          event.preventDefault();
          targetStepId = getLastClickableStepId(steps, mode);
          break;
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

  const renderSteps = () => {
    return steps.map((step, index) => {
      const isSelected = selectedStep?.id === step.id;
      const clickable = isStepClickable(step, mode);

      return (
        <StepItem
          key={step.id}
          step={step}
          isSelected={isSelected}
          isClickable={clickable}
          onStepClick={handleStepClick}
          isLast={index === steps.length - 1}
          minWidth={minStepWidth}
          descriptionStyles={descriptionStyles}
          mode={mode}
        />
      );
    });
  };

  const renderScrollHints = () => {
    if (!showScrollHint) return null;

    return (
      <>
        {showLeftScrollHint && (
          <div className={styles.scrollHintLeft}>
            <Icon iconName='ChevronLeft' className={styles.scrollIcon} />
          </div>
        )}
        {showRightScrollHint && (
          <div className={styles.scrollHintRight}>
            <Icon iconName='ChevronRight' className={styles.scrollIcon} />
          </div>
        )}
      </>
    );
  };

  const containerClasses = mergeStyles(styles.container, className);

  const getAriaLabel = () => {
    const totalSteps = steps.length;
    const currentStepIndex = selectedStep ? steps.findIndex(s => s.id === selectedStep.id) + 1 : 0;

    return `Workflow stepper with ${totalSteps} steps. ${completionPercentage}% complete. ${
      currentStepIndex > 0
        ? `Currently on step ${currentStepIndex}: ${selectedStep?.title}`
        : 'No step selected'
    }`;
  };

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onKeyDown={handleKeyDown}
      role='application'
      aria-label={getAriaLabel()}
    >
      {/* Screen reader announcements */}
      <div className={styles.srOnly} aria-live='polite' aria-atomic='true'>
        {announceText}
      </div>

      {/* Steps container with scroll hints */}
      <div style={{ position: 'relative' }}>
        <div
          ref={stepsContainerRef}
          className={styles.stepsContainer}
          role='tablist'
          aria-label='Workflow steps'
          style={{
            // Remove justify-content when fullWidth is true to avoid gaps
            justifyContent: fullWidth ? 'flex-start' : 'flex-start',
          }}
        >
          {renderSteps()}
        </div>

        {renderScrollHints()}
      </div>

      {/* Content area - only show in fullSteps mode */}
      {mode === 'fullSteps' && <ContentArea selectedStep={selectedStep} isVisible={true} />}

      {/* Progress indicator for screen readers */}
      <div className={styles.srOnly} aria-live='polite'>
        Workflow progress: {completionPercentage}% complete.
        {stepStatistics.completed} of {stepStatistics.total} steps completed.
        {stepStatistics.current > 0 && ` ${stepStatistics.current} step in progress.`}
        {stepStatistics.error > 0 && ` ${stepStatistics.error} steps have errors.`}
        {stepStatistics.warning > 0 && ` ${stepStatistics.warning} steps need attention.`}
        {stepStatistics.blocked > 0 && ` ${stepStatistics.blocked} steps are blocked.`}
      </div>
    </div>
  );
};

export default WorkflowStepper;
