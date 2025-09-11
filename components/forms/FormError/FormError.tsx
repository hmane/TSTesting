import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldContext } from '../Field/Field';
import styles from './FormError.module.scss';
import { FormErrorProps, ValidationState } from './FormError.types';

export const FormError: React.FC<FormErrorProps> = ({
  error,
  children,
  showIcon = true,
  showSuccess = false,
  validationState = 'idle',
  size = 'md',
  variant = 'default',
  animated = true,
  animationDuration = 300,
  ariaLive = 'polite',
  role = 'alert',
  className = '',
  errorClassName = '',
  successClassName = '',
  iconClassName = '',
  errorIcon,
  successIcon,
  validatingIcon,
  onErrorChange,
  debug = false,
  ...rest
}) => {
  const fieldContext = useFieldContext();
  const [animationState, setAnimationState] = useState<
    'entering' | 'entered' | 'exiting' | 'exited'
  >('exited');
  const [previousError, setPreviousError] = useState<string | null>(null);
  const timeoutRef = useRef<number>();

  // Helper function to extract message from any error object
  const extractErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && err.message) return err.message;
    return 'Validation error';
  };

  // Helper function to check if an object is array-like
  const isArrayLike = (obj: any): obj is ArrayLike<any> => {
    return obj && typeof obj === 'object' && typeof obj.length === 'number';
  };

  // Extract error message from various error formats including react-hook-form complex types
  const errorMessage = useMemo(() => {
    if (!error) return null;

    if (typeof error === 'string') {
      return error;
    }

    // Handle standard arrays
    if (Array.isArray(error)) {
      return error.map(extractErrorMessage);
    }

    // Handle react-hook-form Merge types and complex objects
    if (typeof error === 'object' && error !== null) {
      // Check if it's a Merge type with array-like properties (field arrays)
      if (isArrayLike(error) && typeof error.length === 'number') {
        // It's an array-like object (Merge<FieldError, (FieldError | undefined)[]>)
        const messages: string[] = [];

        // First check if the main object has a message
        if ('message' in error && error.message) {
          messages.push(error.message as string);
        }

        // Then iterate through array-like properties
        for (let i = 0; i < error.length; i++) {
          const item = (error as any)[i];
          if (item) {
            messages.push(extractErrorMessage(item));
          }
        }

        return messages.length > 0 ? messages : null;
      }

      // Handle regular FieldError objects
      if ('message' in error && error.message) {
        return error.message as string;
      }

      // Handle objects with numeric keys (field arrays)
      const keys = Object.keys(error);
      const numericKeys = keys.filter(key => !isNaN(Number(key)));

      if (numericKeys.length > 0) {
        const messages: string[] = [];

        // Add main message if exists
        if ('message' in error && error.message) {
          messages.push(error.message as string);
        }

        // Add messages from numeric keys
        numericKeys.forEach(key => {
          const item = (error as any)[key];
          if (item) {
            messages.push(extractErrorMessage(item));
          }
        });

        return messages.length > 0 ? messages : null;
      }

      // Fallback for other object types
      if ('type' in error) {
        return 'Validation error';
      }
    }

    return 'Validation error';
  }, [error]);

  // Determine current validation state
  const currentState: ValidationState = useMemo(() => {
    if (validationState !== 'idle') {
      return validationState;
    }

    if (errorMessage) {
      return 'invalid';
    }

    if (showSuccess && !errorMessage) {
      return 'valid';
    }

    return 'idle';
  }, [validationState, errorMessage, showSuccess]);

  // Build component classes
  const errorClasses = useMemo(() => {
    const classes = [styles.formError];

    // Add size class
    if (size !== 'md') {
      const sizeClass = `size${size.charAt(0).toUpperCase() + size.slice(1)}`;
      if (sizeClass in styles) {
        classes.push((styles as any)[sizeClass]);
      }
    }

    // Add variant class
    if (variant !== 'default') {
      const variantClass = `variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
      if (variantClass in styles) {
        classes.push((styles as any)[variantClass]);
      }
    }

    // Add state class
    const stateClass = `state${currentState.charAt(0).toUpperCase() + currentState.slice(1)}`;
    if (stateClass in styles) {
      classes.push((styles as any)[stateClass]);
    }

    // Add animation classes
    if (animated) {
      classes.push(styles.animated);
      classes.push(styles[animationState]);
    }

    // Add debug class
    if (debug) {
      classes.push(styles.debug);
    }

    // Add custom classes
    if (className) classes.push(className);
    if (currentState === 'invalid' && errorClassName) classes.push(errorClassName);
    if (currentState === 'valid' && successClassName) classes.push(successClassName);

    // Check if this is a new error for shake animation
    if (errorMessage && errorMessage !== previousError && previousError !== null) {
      classes.push(styles.newError);
    }

    return classes.join(' ');
  }, [
    size,
    variant,
    currentState,
    animated,
    animationState,
    debug,
    className,
    errorClassName,
    successClassName,
    errorMessage,
    previousError,
  ]);

  // Build icon classes
  const iconClasses = useMemo(() => {
    const classes = [styles.icon];
    if (iconClassName) classes.push(iconClassName);
    return classes.join(' ');
  }, [iconClassName]);

  // Handle animation state changes
  useEffect(() => {
    if (!animated) return;

    if (currentState !== 'idle') {
      setAnimationState('entering');
      timeoutRef.current = setTimeout(() => {
        setAnimationState('entered');
      }, 50);
    } else {
      setAnimationState('exiting');
      timeoutRef.current = setTimeout(() => {
        setAnimationState('exited');
      }, animationDuration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentState, animated, animationDuration]);

  // Track error changes for notifications
  useEffect(() => {
    const hasError = currentState === 'invalid';
    const errorMsg = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;

    if (onErrorChange) {
      onErrorChange(hasError, errorMsg || undefined);
    }

    setPreviousError(errorMsg);
  }, [currentState, errorMessage, onErrorChange]);

  // Render icon based on state
  const renderIcon = () => {
    if (!showIcon) return null;

    let icon = null;
    let defaultClass = '';

    switch (currentState) {
      case 'invalid':
        icon = errorIcon;
        defaultClass = styles.defaultErrorIcon;
        break;
      case 'valid':
        icon = successIcon;
        defaultClass = styles.defaultSuccessIcon;
        break;
      case 'validating':
        icon = validatingIcon;
        defaultClass = styles.defaultValidatingIcon;
        break;
      default:
        return null;
    }

    if (icon) {
      return <span className={iconClasses}>{icon}</span>;
    }

    return <span className={`${iconClasses} ${defaultClass}`} />;
  };

  // Render error messages
  const renderMessage = () => {
    if (children) {
      return children;
    }

    if (currentState === 'valid' && showSuccess) {
      return <span className={styles.successMessage}>Valid</span>;
    }

    if (currentState === 'validating') {
      return <span>Validating...</span>;
    }

    if (!errorMessage) {
      return null;
    }

    if (Array.isArray(errorMessage)) {
      return (
        <div className={`${styles.errorMessage} ${styles.multipleErrors}`}>
          <ul>
            {errorMessage.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
      );
    }

    return <span className={styles.errorMessage}>{errorMessage}</span>;
  };

  // Don't render if idle and not animated or animation is complete
  if (currentState === 'idle' && (!animated || animationState === 'exited')) {
    return null;
  }

  return (
    <div
      id={fieldContext.errorId}
      className={errorClasses}
      role={currentState === 'invalid' ? role : undefined}
      aria-live={ariaLive}
      aria-atomic='true'
      data-error-state={debug ? currentState : undefined}
      data-testid='form-error'
      {...rest}
    >
      <div className={styles.errorContent}>
        {renderIcon()}
        {renderMessage()}
      </div>
    </div>
  );
};

FormError.displayName = 'FormError';

export default FormError;
