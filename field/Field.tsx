import React, { useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import { Controller, useFormContext, FieldValues } from 'react-hook-form';
import type { FieldProps, FieldContextType, ValidationState, FieldRenderProps } from './Field.types';
import { focusController } from './controller/FocusController';
import { useLazyField } from './hooks/useLazyField';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { 
  generateFieldClasses, 
  generateFieldStyles, 
  hasLabelComponent,
  focusFirstElement,
  scrollToElement,
  generateFieldId
} from './utils/fieldUtils';
import styles from './Field.module.scss';

// Field Context
const FieldContext = createContext<FieldContextType | null>(null);

export const useFieldContext = () => {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error('Field child components must be used within a Field component');
  }
  return context;
};

// Loading component for lazy fields
const DefaultLoadingComponent: React.FC = () => (
  <div className={styles.fieldLoading}>
    <div className={styles.loadingSpinner} />
    Loading...
  </div>
);

// Main Field Component with RHF Integration
export const Field = <TFieldValues extends FieldValues = FieldValues>({
  id,
  name,
  control,
  rules,
  layout = 'horizontal',
  disabled = false,
  isValid,
  error,
  labelWidth,
  backgroundColor,
  className = '',
  style,
  autoFocus = false,
  lazy = false,
  loadingComponent,
  onFocus,
  onLoad,
  onFieldChange,
  children,
}: FieldProps<TFieldValues>) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const fieldId = id || name || generateFieldId();

  // Try to get form context (optional)
  const formContext = useFormContext<TFieldValues>();
  const activeControl = control || formContext?.control;

  // Responsive layout hook
  const { currentLayout } = useResponsiveLayout({ layout });

  // Lazy loading hook
  const { isVisible, manualLoad, fieldRef: lazyRef } = useLazyField({
    lazy,
    onLoad,
  });

  // Merge refs for lazy loading
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    fieldRef.current = node;
    (lazyRef as any).current = node;
  }, [lazyRef]);

  // Focus function for controller
  const focusField = useCallback((): boolean => {
    if (fieldRef.current) {
      const success = focusFirstElement(fieldRef.current);
      if (success) {
        onFocus?.();
      }
      return success;
    }
    return false;
  }, [onFocus]);

  // Scroll function for controller
  const scrollToField = useCallback((): boolean => {
    if (fieldRef.current) {
      return scrollToElement(fieldRef.current, {
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
    return false;
  }, []);

  // RHF validation function
  const rhfValidationFn = useCallback(async (): Promise<boolean> => {
    if (activeControl && name) {
      try {
        const result = await activeControl.trigger(name as any);
        return result;
      } catch (error) {
        console.warn(`RHF validation failed for field ${name}:`, error);
        return false;
      }
    }
    return true;
  }, [activeControl, name]);

  // Register with focus controller
  useEffect(() => {
    focusController.registerField(fieldId, {
      element: fieldRef.current || undefined,
      focusFn: focusField,
      scrollFn: scrollToField,
      rhfValidationFn: name ? rhfValidationFn : undefined,
    });

    return () => {
      focusController.unregisterField(fieldId);
    };
  }, [fieldId, focusField, scrollToField, rhfValidationFn, name]);

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus && isVisible) {
      const timer = setTimeout(() => {
        focusField();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoFocus, isVisible, focusField]);

  // Detect if field has label
  const hasLabel = useMemo(() => hasLabelComponent(children), [children]);

  // Field classes
  const fieldClasses = useMemo(
    () => generateFieldClasses(
      styles.field,
      currentLayout,
      hasLabel,
      disabled,
      labelWidth,
      className
    ),
    [currentLayout, hasLabel, disabled, labelWidth, className]
  );

  // Field styles
  const fieldStyles = useMemo(
    () => generateFieldStyles(labelWidth, backgroundColor, style),
    [labelWidth, backgroundColor, style]
  );

  // Render with RHF Controller if name and control are provided
  if (name && activeControl) {
    return (
      <Controller
        name={name}
        control={activeControl}
        rules={rules}
        render={({ field, fieldState, formState }) => {
          // Create validation state from RHF
          const validationState: ValidationState = {
            isValid: isValid !== undefined ? isValid : !fieldState.invalid,
            error: error || fieldState.error?.message || '',
            isDirty: fieldState.isDirty,
            isTouched: fieldState.isTouched,
            isValidating: fieldState.isValidating,
          };

          // Context value for child components
          const fieldContext: FieldContextType = {
            fieldName: name,
            fieldId,
            validationState,
            disabled,
            layout: currentLayout as 'horizontal' | 'vertical',
            rhfField: {
              name,
              control: activeControl,
              fieldError: fieldState.error,
              fieldState: {
                isDirty: fieldState.isDirty,
                isTouched: fieldState.isTouched,
                isValidating: fieldState.isValidating,
                invalid: fieldState.invalid,
              },
            },
          };

          // Handle field change
          const handleFieldChange = useCallback((value: any) => {
            field.onChange(value);
            onFieldChange?.(value);
          }, [field.onChange, onFieldChange]);

          // Render props for children
          const renderProps: FieldRenderProps<TFieldValues> = {
            field: {
              ...field,
              onChange: handleFieldChange,
            },
            fieldState,
            formState,
          };

          // Render loading state for lazy fields
          if (lazy && !isVisible) {
            return (
              <div
                ref={mergedRef}
                className={fieldClasses}
                style={fieldStyles}
                data-field-id={fieldId}
                data-field-loading="true"
              >
                {loadingComponent || <DefaultLoadingComponent />}
              </div>
            );
          }

          return (
            <FieldContext.Provider value={fieldContext}>
              <div
                ref={mergedRef}
                className={fieldClasses}
                style={fieldStyles}
                data-field-id={fieldId}
                data-is-valid={validationState.isValid}
                data-validation-message={validationState.error || ''}
                data-rhf-field={name}
              >
                <div className={styles.fieldContent}>
                  {typeof children === 'function' 
                    ? (children as (props: FieldRenderProps<TFieldValues>) => ReactNode)(renderProps)
                    : children
                  }
                </div>
              </div>
            </FieldContext.Provider>
          );
        }}
      />
    );
  }

  // Fallback to non-RHF mode (backward compatibility)
  const validationState: ValidationState = {
    isValid: isValid !== undefined ? isValid : true,
    error: error || '',
    isDirty: false,
    isTouched: false,
    isValidating: false,
  };

  const fieldContext: FieldContextType = {
    fieldName: name || fieldId,
    fieldId,
    validationState,
    disabled,
    layout: currentLayout as 'horizontal' | 'vertical',
  };

  // Render loading state for lazy fields
  if (lazy && !isVisible) {
    return (
      <div
        ref={mergedRef}
        className={fieldClasses}
        style={fieldStyles}
        data-field-id={fieldId}
        data-field-loading="true"
      >
        {loadingComponent || <DefaultLoadingComponent />}
      </div>
    );
  }

  return (
    <FieldContext.Provider value={fieldContext}>
      <div
        ref={mergedRef}
        className={fieldClasses}
        style={fieldStyles}
        data-field-id={fieldId}
        data-is-valid={validationState.isValid}
        data-validation-message={validationState.error || ''}
      >
        <div className={styles.fieldContent}>
          {typeof children === 'function' 
            ? (children as (props: FieldRenderProps<TFieldValues>) => ReactNode)({ 
                fieldState: undefined, 
                formState: undefined 
              })
            : children
          }
        </div>
      </div>
    </FieldContext.Provider>
  );
};

Field.displayName = 'Field';

export { FieldContext };
