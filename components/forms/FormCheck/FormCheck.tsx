import * as React from 'react';
import { useMemo } from 'react';
import styles from './FormCheck.module.scss';
import { FormCheckProps } from './FormCheck.types';

export const FormCheck: React.FC<FormCheckProps> = ({
  children,
  inline = false,
  reverse = false,
  size = 'md',
  variant = 'default',
  groupName,
  groupLabel,
  groupDescription,
  invalid = false,
  valid = false,
  role,
  ariaLabel,
  ariaDescribedBy,
  fieldsetLegend,
  className = '',
  inputClassName = '',
  labelClassName = '',
  gutter = 'md',
  debug = false,
  showWhen,
  ...rest
}) => {
  // Determine if component should be shown
  const shouldShow = useMemo(() => {
    if (showWhen && typeof showWhen === 'function') {
      // In a real implementation, you'd get form values from react-hook-form context
      // For now, we'll assume it should be shown
      return true;
    }
    return true;
  }, [showWhen]);

  // Build component classes with proper type checking
  const checkClasses = useMemo(() => {
    const classes = [styles.formCheck];

    // Add size class with type safety
    if (size !== 'md') {
      const sizeClass = `size${size.charAt(0).toUpperCase() + size.slice(1)}`;
      if (sizeClass in styles) {
        classes.push(styles[sizeClass as keyof typeof styles] as string);
      }
    }

    // Add variant class with type safety
    if (variant !== 'default') {
      const variantClass = `variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
      if (variantClass in styles) {
        classes.push(styles[variantClass as keyof typeof styles] as string);
      }
    }

    // Add modifier classes
    if (inline && styles.inline) classes.push(styles.inline);
    if (reverse && styles.reverse) classes.push(styles.reverse);
    if (debug && styles.debug) classes.push(styles.debug);

    // Add gutter class with type safety
    if (gutter !== 'md') {
      const gutterClass = `gutter${gutter.charAt(0).toUpperCase() + gutter.slice(1)}`;
      if (gutterClass in styles) {
        classes.push(styles[gutterClass as keyof typeof styles] as string);
      }
    }

    // Add validation state classes
    if (invalid && styles.invalid) classes.push(styles.invalid);
    if (valid && styles.valid) classes.push(styles.valid);

    // Add custom className
    if (className) classes.push(className);

    return classes.join(' ');
  }, [size, variant, inline, reverse, debug, gutter, invalid, valid, className]);

  // Build group classes for fieldset
  const groupClasses = useMemo(() => {
    const classes = [styles.formCheckGroup];
    if (debug && styles.debug) classes.push(styles.debug);
    if (className) classes.push(className);
    return classes.join(' ');
  }, [debug, className]);

  // Clone children to add classes
  const enhancedChildren = useMemo(() => {
    return React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        const childProps = child.props as any;

        // Add classes to form-check-input and form-check-label elements
        if (childProps.className?.includes('form-check-input') && inputClassName) {
          return React.cloneElement(child, {
            ...childProps,
            className: `${childProps.className} ${inputClassName}`,
          });
        }

        if (childProps.className?.includes('form-check-label') && labelClassName) {
          return React.cloneElement(child, {
            ...childProps,
            className: `${childProps.className} ${labelClassName}`,
          });
        }
      }
      return child;
    });
  }, [children, inputClassName, labelClassName]);

  // Don't render if conditional logic says to hide
  if (!shouldShow) {
    return null;
  }

  // Render as fieldset if it's a group
  if (groupName || groupLabel || fieldsetLegend) {
    return (
      <fieldset className={groupClasses} data-testid='form-check-group'>
        {(groupLabel || fieldsetLegend) && (
          <legend className={styles.groupLegend}>{groupLabel || fieldsetLegend}</legend>
        )}

        {groupDescription && <div className={styles.groupDescription}>{groupDescription}</div>}

        <div role={role || 'group'} aria-label={ariaLabel} aria-describedby={ariaDescribedBy}>
          {React.Children.map(children, (child, index) => (
            <div key={index} className={checkClasses} data-variant={debug ? variant : undefined}>
              {React.isValidElement(child)
                ? React.cloneElement(child, {
                    ...(child.props as any),
                    name: groupName || (child.props as any).name,
                    className: (() => {
                      const childProps = child.props as any;
                      if (childProps.className?.includes('form-check-input') && inputClassName) {
                        return `${childProps.className} ${inputClassName}`;
                      }
                      if (childProps.className?.includes('form-check-label') && labelClassName) {
                        return `${childProps.className} ${labelClassName}`;
                      }
                      return childProps.className;
                    })(),
                  })
                : child}
            </div>
          ))}
        </div>
      </fieldset>
    );
  }

  // Render as single form check
  return (
    <div
      {...rest}
      className={checkClasses}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      data-variant={debug ? variant : undefined}
      data-testid='form-check'
    >
      {enhancedChildren}
    </div>
  );
};

FormCheck.displayName = 'FormCheck';

export default FormCheck;
