import React, { memo, useMemo } from 'react';
import { Icon } from '@fluentui/react';
import type { ErrorProps } from '../Field.types';
import { useFieldContext } from '../Field';
import styles from '../Field.module.scss';

export const Error = memo<ErrorProps>(({
  children,
  animation = 'slide',
  position = 'below',
  className = '',
  style,
}) => {
  const { validationState, rhfField } = useFieldContext();

  const errorClasses = useMemo(() => {
    const classes = [styles.fieldError];
    
    // Add animation class
    if (animation !== 'none') {
      const animationClass = `animation${animation.charAt(0).toUpperCase() + animation.slice(1)}`;
      if (styles[animationClass as keyof typeof styles]) {
        classes.push(styles[animationClass as keyof typeof styles]);
      }
    }
    
    // Add position class
    if (position === 'inline') {
      classes.push(styles.positionInline);
    }
    
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  }, [animation, position, className]);

  // Determine what error message to show
  // Priority: children > RHF error > validationState error
  const errorMessage = children || 
                      rhfField?.fieldError?.message || 
                      validationState.error;
  
  // Show error if validation failed
  const showError = !validationState.isValid && errorMessage;

  // Show validating state
  const isValidating = rhfField?.fieldState?.isValidating || validationState.isValidating;

  if (!showError && !isValidating) {
    return null;
  }

  return (
    <div 
      className={errorClasses} 
      style={style} 
      role="alert" 
      aria-live="polite"
      data-field-error="true"
      data-rhf-error={rhfField?.fieldError ? 'true' : 'false'}
    >
      {isValidating ? (
        <>
          <Icon 
            iconName="Spinner" 
            className={styles.errorIcon}
            aria-hidden="true"
          />
          <span>Validating...</span>
        </>
      ) : (
        <>
          <Icon 
            iconName="ErrorBadge" 
            className={styles.errorIcon}
            aria-hidden="true"
          />
          <span>{errorMessage}</span>
        </>
      )}
    </div>
  );
});

Error.displayName = 'Error';
