import * as React from 'react';
import { createContext, useContext, useMemo } from 'react';
import { generateFieldIds } from '../utils/accessibility';
import styles from './Field.module.scss';
import { FieldContextType, FieldProps } from './Field.types';

// Field Context for sharing state with child components
export const FieldContext = createContext<FieldContextType>({});

// Custom hook to use field context
export const useFieldContext = (): FieldContextType => {
  return useContext(FieldContext);
};

export const Field: React.FC<FieldProps> = ({
  children,
  xs,
  sm,
  md,
  lg,
  xl,
  offsetLabel = false,
  loading = false,
  disabled = false,
  showWhen,
  dependsOn,
  clearWhen,
  autoId = true,
  fieldId,
  debug = false,
  textAlign = 'left',
  size = 'md',
  className = '',
  fieldClassName = '',
  ...rest
}) => {
  // Generate field IDs
  const fieldIds = useMemo(() => {
    return generateFieldIds(fieldId);
  }, [fieldId]);

  // Determine if field should be shown based on conditional logic
  const shouldShow = useMemo(() => {
    if (showWhen && typeof showWhen === 'function') {
      // In a real implementation, you'd get form values from react-hook-form context
      // For now, we'll assume the field should be shown
      return true;
    }
    return true;
  }, [showWhen]);

  // Build CSS classes with better debugging
  const fieldClasses = useMemo(() => {
    const classes = [styles.field];

    // Add responsive column classes with proper mapping
    const breakpoints = [
      { prop: xs, name: 'xs' },
      { prop: sm, name: 'sm' },
      { prop: md, name: 'md' },
      { prop: lg, name: 'lg' },
      { prop: xl, name: 'xl' },
    ];

    breakpoints.forEach(({ prop, name }) => {
      if (prop) {
        const colClass = `col-${name}-${prop}`;
        // Check if the class exists in styles
        if (colClass in styles) {
          classes.push(styles[colClass as keyof typeof styles] as string);
        } else if (debug) {
          console.warn(`CSS class ${colClass} not found in Field.module.scss`);
        }
      }
    });

    // Add modifier classes
    if (offsetLabel && styles.offsetLabel) classes.push(styles.offsetLabel);
    if (loading && styles.loading) classes.push(styles.loading);
    if (disabled && styles.disabled) classes.push(styles.disabled);
    if (debug && styles.debug) classes.push(styles.debug);

    // Add size class
    if (size !== 'md') {
      const sizeClass = `size-${size}`;
      if (sizeClass in styles) {
        classes.push(styles[sizeClass as keyof typeof styles] as string);
      }
    }

    // Add text alignment
    if (textAlign === 'center' && styles.textAlignCenter) classes.push(styles.textAlignCenter);
    if (textAlign === 'right' && styles.textAlignRight) classes.push(styles.textAlignRight);

    // Add custom className
    if (className) classes.push(className);

    if (debug) {
      console.log('Field classes:', classes);
      console.log('Available styles:', Object.keys(styles));
    }

    return classes.join(' ');
  }, [xs, sm, md, lg, xl, offsetLabel, loading, disabled, debug, size, textAlign, className]);

  // Build field content classes
  const fieldContentClasses = useMemo(() => {
    const classes = [styles.fieldContent];
    if (fieldClassName) classes.push(fieldClassName);
    return classes.join(' ');
  }, [fieldClassName]);

  // Create field context value
  const contextValue: FieldContextType = useMemo(
    () => ({
      fieldId: autoId ? fieldIds.fieldId : fieldId,
      labelId: autoId ? fieldIds.labelId : undefined,
      descriptionId: autoId ? fieldIds.descriptionId : undefined,
      errorId: autoId ? fieldIds.errorId : undefined,
      hasError: false, // This would be determined by form validation state
      isRequired: false, // This would be determined by checking child components
      isDisabled: disabled,
      isLoading: loading,
    }),
    [autoId, fieldIds, fieldId, disabled, loading]
  );

  // Don't render if conditional logic says to hide
  if (!shouldShow) {
    return null;
  }

  return (
    <FieldContext.Provider value={contextValue}>
      <div
        className={fieldClasses}
        data-field-id={debug ? contextValue.fieldId : undefined}
        data-testid='field-container'
        style={
          debug
            ? {
                border: '2px dashed blue',
                margin: '5px',
                position: 'relative',
              }
            : undefined
        }
        {...rest}
      >
        {debug && (
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '0',
              fontSize: '10px',
              background: 'blue',
              color: 'white',
              padding: '2px 4px',
              borderRadius: '2px',
              zIndex: 1000,
            }}
          >
            {xs && `xs:${xs}`} {sm && `sm:${sm}`} {md && `md:${md}`} {lg && `lg:${lg}`}{' '}
            {xl && `xl:${xl}`}
          </div>
        )}
        <div className={fieldContentClasses}>{children}</div>
      </div>
    </FieldContext.Provider>
  );
};

Field.displayName = 'Field';

export default Field;
