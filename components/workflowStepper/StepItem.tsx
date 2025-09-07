import * as React from 'react';
import { useCallback, useRef } from 'react';
import { useTheme } from '@fluentui/react';
import { StepItemProps } from './types';
import { getStepperStyles, getStepItemStyles } from './WorkflowStepper.styles';

export const StepItem: React.FC<StepItemProps> = ({
  step,
  isSelected,
  isClickable,
  onStepClick,
  isLast,
  minWidth,
  descriptionStyles,
  mode,
}) => {
  const theme = useTheme();
  const stepRef = useRef<HTMLDivElement>(null);

  const styles = getStepperStyles(theme, {
    fullWidth: false,
    stepCount: 0,
    minStepWidth: minWidth,
    mode,
  });

  const stepContentStyles = getStepItemStyles(theme, step.status, isSelected, isClickable, mode);

  const handleClick = useCallback(() => {
    if (isClickable) {
      onStepClick(step);
    }
  }, [isClickable, onStepClick, step]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onStepClick(step);
      }
    },
    [isClickable, onStepClick, step]
  );

  const getDefaultDescriptionStyles = () => {
    return {
      description1: {
        fontSize: mode === 'compact' ? theme.fonts.xSmall.fontSize : theme.fonts.small.fontSize,
        fontWeight: 400,
        ...descriptionStyles?.description1,
      },
      description2: {
        fontSize: theme.fonts.xSmall.fontSize,
        fontWeight: 300,
        opacity: 0.8,
        ...descriptionStyles?.description2,
      },
    };
  };

  const defaultStyles = getDefaultDescriptionStyles();

  const renderStepText = () => {
    return (
      <div className={styles.stepText}>
        <div className={styles.stepTitle} title={step.title}>
          {step.title}
        </div>

        {step.description1 && (
          <div
            className={styles.stepDescription1}
            style={defaultStyles.description1}
            title={step.description1}
          >
            {step.description1}
          </div>
        )}

        {step.description2 && (
          <div
            className={styles.stepDescription2}
            style={defaultStyles.description2}
            title={step.description2}
          >
            {step.description2}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={stepRef}
      className={styles.stepItem}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : 'presentation'}
      aria-label={isClickable ? `Step: ${step.title}` : `Step: ${step.title} (not clickable)`}
      aria-current={isSelected ? 'step' : undefined}
      aria-disabled={!isClickable}
      tabIndex={isClickable ? 0 : -1}
      data-step-id={step.id}
      data-step-status={step.status}
      style={{
        minWidth: minWidth ? `${minWidth}px` : undefined,
        cursor: isClickable ? 'pointer' : 'not-allowed',
      }}
    >
      <div className={`${styles.stepContent} ${stepContentStyles}`}>{renderStepText()}</div>
    </div>
  );
};

export default StepItem;
