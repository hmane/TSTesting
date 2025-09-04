import React, { useCallback, useRef } from 'react';
import { useTheme } from '@fluentui/react';
import { StepItemProps } from './types';
import { getStepItemStyles } from './WorkflowStepper.styles';

export const StepItem: React.FC<StepItemProps> = ({
  step,
  stepNumber,
  isSelected,
  isClickable,
  showStepNumbers,
  customColors,
  onStepClick
}) => {
  const theme = useTheme();
  const stepRef = useRef<HTMLDivElement>(null);
  
  const styles = getStepItemStyles(
    theme,
    step.status,
    isSelected,
    isClickable,
    customColors
  );

  const handleClick = useCallback(() => {
    if (isClickable) {
      onStepClick(step);
    }
  }, [isClickable, onStepClick, step]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onStepClick(step);
    }
  }, [isClickable, onStepClick, step]);

  const renderDescription = () => {
    if (!step.description1 && !step.description2) return null;

    return (
      <div className={styles.stepDescription}>
        {step.description1 && (
          <span className={styles.stepDescriptionLine} title={step.description1}>
            {step.description1}
          </span>
        )}
        {step.description2 && (
          <span className={styles.stepDescriptionLine} title={step.description2}>
            {step.description2}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={stepRef}
      className={styles.stepWrapper}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : -1}
      role={isClickable ? 'button' : 'presentation'}
      aria-label={isClickable ? `Step ${stepNumber}: ${step.title}` : undefined}
      aria-current={isSelected ? 'step' : undefined}
      aria-disabled={!isClickable}
      data-step-id={step.id}
      data-step-status={step.status}
    >
      <div className={styles.stepContent}>
        {showStepNumbers && (
          <div className={styles.stepNumber} aria-hidden="true">
            {stepNumber}
          </div>
        )}
        
        <div className={styles.stepDetails}>
          <div 
            className={styles.stepTitle}
            title={step.title}
          >
            {step.title}
          </div>
          {renderDescription()}
        </div>
      </div>
    </div>
  );
};

export default StepItem;
