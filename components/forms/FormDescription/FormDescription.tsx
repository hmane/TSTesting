import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldContext } from '../Field/Field';
import styles from './FormDescription.module.scss';
import { FormDescriptionProps } from './FormDescription.types';

export const FormDescription: React.FC<FormDescriptionProps> = ({
  children,
  size = 'md',
  variant = 'default',
  placement = 'below-field',
  showIcon = false,
  icon,
  iconPosition = 'left',
  id,
  ariaLabel,
  className = '',
  textClassName = '',
  iconClassName = '',
  showWhen,
  hideOnError = false,
  hideOnSuccess = false,
  animated = true,
  debug = false,
  ...rest
}) => {
  const fieldContext = useFieldContext();
  const [animationState, setAnimationState] = useState<
    'entering' | 'entered' | 'exiting' | 'exited'
  >('entered');
  const [shouldShow] = useState(true);
  const timeoutRef = useRef<number>();

  // Determine if description should be shown
  const isVisible = useMemo(() => {
    // Check conditional rendering
    if (showWhen && typeof showWhen === 'function') {
      // In a real implementation, you'd get form values from react-hook-form context
      // For now, we'll assume it should be shown
      return true;
    }

    // Check if should hide based on field state
    if (hideOnError && fieldContext.hasError) {
      return false;
    }

    if (hideOnSuccess && !fieldContext.hasError) {
      // Assuming valid state when no error (this would be more sophisticated in real implementation)
      return false;
    }

    return shouldShow;
  }, [showWhen, hideOnError, hideOnSuccess, fieldContext.hasError, shouldShow]);

  // Build component classes
  const descriptionClasses = useMemo(() => {
    const classes = [styles.formDescription];

    // Add size class
    if (size !== 'md') {
      classes.push(styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles]);
    }

    // Add variant class
    if (variant !== 'default') {
      classes.push(styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles]);
    }

    // Add placement class
    if (placement !== 'below-field') {
      const placementClass = placement
        .split('-')
        .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join('');
      classes.push(
        styles[`placement${placementClass.charAt(0).toUpperCase() + placementClass.slice(1)}` as keyof typeof styles]
      );
    }

    // Add animation classes
    if (animated) {
      classes.push(styles.animated);
      classes.push(styles[animationState]);
    }

    // Add conditional classes
    if (hideOnError) classes.push(styles.hideOnError);
    if (hideOnSuccess) classes.push(styles.hideOnSuccess);

    // Add field state classes for conditional hiding
    if (fieldContext.hasError) classes.push(styles.hasFieldError);
    if (!fieldContext.hasError) classes.push(styles.hasFieldSuccess);

    // Add debug class
    if (debug) {
      classes.push(styles.debug);
    }

    // Add visibility class
    if (!isVisible) {
      classes.push(styles.hidden);
    }

    // Add custom classes
    if (className) classes.push(className);

    return classes.join(' ');
  }, [
    size,
    variant,
    placement,
    animated,
    animationState,
    hideOnError,
    hideOnSuccess,
    fieldContext.hasError,
    debug,
    isVisible,
    className,
  ]);

  // Build content classes
  const contentClasses = useMemo(() => {
    const classes = [styles.descriptionContent];
    if (iconPosition === 'right') {
      classes.push(styles.iconRight);
    }
    return classes.join(' ');
  }, [iconPosition]);

  // Build icon classes
  const iconClasses = useMemo(() => {
    const classes = [styles.icon];
    if (iconClassName) classes.push(iconClassName);
    return classes.join(' ');
  }, [iconClassName]);

  // Build text classes
  const textClasses = useMemo(() => {
    const classes = [styles.descriptionText];
    if (textClassName) classes.push(textClassName);
    return classes.join(' ');
  }, [textClassName]);

  // Handle animation state changes
  useEffect(() => {
    if (!animated) return;

    if (isVisible) {
      setAnimationState('entering');
      timeoutRef.current = setTimeout(() => {
        setAnimationState('entered');
      }, 50);
    } else {
      setAnimationState('exiting');
      timeoutRef.current = setTimeout(() => {
        setAnimationState('exited');
      }, 300);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, animated]);

  // Render icon based on variant
  const renderIcon = () => {
    if (!showIcon) return null;

    if (icon) {
      return <span className={iconClasses}>{icon}</span>;
    }

    // Default icons for variants
    let defaultClass = '';
    switch (variant) {
      case 'help':
      case 'info':
        defaultClass = styles.defaultInfoIcon;
        break;
      case 'warning':
        defaultClass = styles.defaultWarningIcon;
        break;
      default:
        defaultClass = styles.defaultHelpIcon;
    }

    if (defaultClass) {
      return <span className={`${iconClasses} ${defaultClass}`} />;
    }

    return null;
  };

  // Don't render if not visible and animation is complete
  if (!isVisible && (!animated || animationState === 'exited')) {
    return null;
  }

  // Generate description ID
  const descriptionId = id || fieldContext.descriptionId;

  return (
    <div
      id={descriptionId}
      className={descriptionClasses}
      aria-label={ariaLabel}
      data-variant={debug ? variant : undefined}
      data-testid='form-description'
      {...rest}
    >
      <div className={contentClasses}>
        {iconPosition === 'left' && renderIcon()}
        <div className={textClasses}>{children}</div>
        {iconPosition === 'right' && renderIcon()}
      </div>
    </div>
  );
};

FormDescription.displayName = 'FormDescription';

export default FormDescription;
