import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { Controller, FieldValues, useFormContext } from 'react-hook-form';
import styles from './Field.module.scss';
import type {
  FieldContextType,
  FieldProps,
  FieldRenderProps,
  ValidationState,
} from './Field.types';
import { useFieldGroupContext } from './components/FieldGroup'; // Import FieldGroup context
import { focusController } from './controller/FocusController';
import { useLazyField } from './hooks/useLazyField';
import { useParentDetection } from './hooks/useParentDetection';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import {
  focusFirstElement,
  generateFieldClasses,
  generateFieldId,
  generateFieldStyles,
  hasLabelComponent,
  scrollToElement,
} from './utils/fieldUtils';

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

// Main Field Component with Enhanced Parent Detection and FieldGroup Control Support
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
  expandParent = true,
  children,
}: FieldProps<TFieldValues>) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const fieldId = id || name || generateFieldId();

  // Get FieldGroup context for control and other inherited properties
  const fieldGroupContext = useFieldGroupContext();

  // Try to get form context (optional)
  const formContext = useFormContext<TFieldValues>();

  // Control resolution priority:
  // 1. Explicit control prop
  // 2. FieldGroup context control
  // 3. FormProvider context control
  const activeControl = control || fieldGroupContext?.control || formContext?.control;

  // Inherit layout from FieldGroup if not explicitly set
  const effectiveLayout = layout || fieldGroupContext?.layout || 'horizontal';

  // Inherit labelWidth from FieldGroup if not explicitly set
  const effectiveLabelWidth = labelWidth || fieldGroupContext?.labelWidth;

  // Inherit disabled state from FieldGroup if not explicitly set
  const effectiveDisabled = disabled || fieldGroupContext?.disabled || false;

  // Responsive layout hook
  const { currentLayout } = useResponsiveLayout({ layout: effectiveLayout });

  // Lazy loading hook
  const {
    isVisible,
    manualLoad,
    fieldRef: lazyRef,
  } = useLazyField({
    lazy,
    onLoad,
  });

  // Parent detection hook
  const { detectParent, expandParentCard, expandParentAccordion } = useParentDetection();

  // Merge refs for lazy loading
  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      (fieldRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      (lazyRef as any).current = node;
    },
    [lazyRef]
  );

  // Enhanced focus function with parent expansion
  const focusFieldWithExpansion = useCallback(async (): Promise<boolean> => {
    if (!fieldRef.current) return false;

    try {
      // Detect parent containers
      const parentInfo = detectParent(fieldRef);

      if (expandParent && parentInfo) {
        if (parentInfo.type === 'card' && !parentInfo.isExpanded) {
          // Expand parent card first
          const expanded = await expandParentCard(parentInfo.id);
          if (expanded) {
            // Wait a bit for animation to start
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else if (parentInfo.type === 'accordion' && !parentInfo.isExpanded) {
          // Expand parent accordion card
          const expanded = await expandParentAccordion(parentInfo.accordionId!, parentInfo.id);
          if (expanded) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      // Focus the field
      const success = focusFirstElement(fieldRef.current);
      if (success) {
        onFocus?.();
      }
      return success;
    } catch (error) {
      console.warn(`Failed to focus field ${fieldId} with parent expansion:`, error);
      // Fallback to simple focus
      const success = focusFirstElement(fieldRef.current);
      if (success) {
        onFocus?.();
      }
      return success;
    }
  }, [fieldId, onFocus, expandParent, detectParent, expandParentCard, expandParentAccordion]);

  // Regular focus function (without expansion)
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

  // Enhanced scroll with expansion
  const scrollToFieldWithExpansion = useCallback(async (): Promise<boolean> => {
    if (!fieldRef.current) return false;

    try {
      // Detect and expand parent if needed
      const parentInfo = detectParent(fieldRef);

      if (expandParent && parentInfo) {
        if (parentInfo.type === 'card' && !parentInfo.isExpanded) {
          await expandParentCard(parentInfo.id);
          await new Promise(resolve => setTimeout(resolve, 100));
        } else if (parentInfo.type === 'accordion' && !parentInfo.isExpanded) {
          await expandParentAccordion(parentInfo.accordionId!, parentInfo.id);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Scroll to field
      return scrollToElement(fieldRef.current, {
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    } catch (error) {
      console.warn(`Failed to scroll to field ${fieldId} with expansion:`, error);
      return scrollToField();
    }
  }, [fieldId, expandParent, detectParent, expandParentCard, expandParentAccordion, scrollToField]);

  // RHF validation function
  const rhfValidationFn = useCallback(async (): Promise<boolean> => {
    if (activeControl && name) {
      try {
        // Cast activeControl to any to access the trigger method
        const result = await (activeControl as any).trigger(name as any);
        return result;
      } catch (error) {
        console.warn(`RHF validation failed for field ${name}:`, error);
        return false;
      }
    }
    return true;
  }, [activeControl, name]);

  // Register with focus controller (enhanced with parent expansion)
  useEffect(() => {
    focusController.registerField(fieldId, {
      element: fieldRef.current || undefined,
      focusFn: focusFieldWithExpansion, // Use enhanced focus function
      scrollFn: scrollToFieldWithExpansion, // Use enhanced scroll function
      simpleFocusFn: focusField, // Also register simple focus for backward compatibility
      simpleScrollFn: scrollToField, // Also register simple scroll
      rhfValidationFn: name ? rhfValidationFn : undefined,
    });

    return () => {
      focusController.unregisterField(fieldId);
    };
  }, [
    fieldId,
    focusFieldWithExpansion,
    scrollToFieldWithExpansion,
    focusField,
    scrollToField,
    rhfValidationFn,
    name,
  ]);

  // Auto focus on mount (with expansion)
  useEffect(() => {
    if (autoFocus && isVisible) {
      const timer = setTimeout(() => {
        focusFieldWithExpansion()
          .then(() => console.log(`Auto-focused field ${fieldId}`))
          .catch(() => {
            /*ignore*/
          });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoFocus, isVisible, focusFieldWithExpansion]);

  // Detect if field has label
  const hasLabel = useMemo(() => hasLabelComponent(children), [children]);

  // Field classes (using effective values from FieldGroup context)
  const fieldClasses = useMemo(
    () =>
      generateFieldClasses(
        styles.field,
        currentLayout,
        hasLabel,
        effectiveDisabled,
        effectiveLabelWidth,
        className
      ),
    [currentLayout, hasLabel, effectiveDisabled, effectiveLabelWidth, className]
  );

  // Field styles (using effective values from FieldGroup context)
  const fieldStyles = useMemo(
    () => generateFieldStyles(effectiveLabelWidth, backgroundColor, style),
    [effectiveLabelWidth, backgroundColor, style]
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
            disabled: effectiveDisabled,
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
          const handleFieldChange = useCallback(
            (value: any) => {
              field.onChange(value);
              onFieldChange?.(value);
            },
            [field.onChange, onFieldChange]
          );

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
                data-field-loading='true'
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
                data-expand-parent={expandParent}
                data-field-group-inherited={fieldGroupContext ? 'true' : 'false'}
              >
                <div className={styles.fieldContent}>
                  {typeof children === 'function'
                    ? (children as (props: FieldRenderProps<TFieldValues>) => ReactNode)(
                        renderProps
                      )
                    : children}
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
    disabled: effectiveDisabled,
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
        data-field-loading='true'
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
        data-expand-parent={expandParent}
        data-field-group-inherited={fieldGroupContext ? 'true' : 'false'}
      >
        <div className={styles.fieldContent}>
          {typeof children === 'function'
            ? (children as (props: FieldRenderProps<TFieldValues>) => ReactNode)({
                fieldState: undefined,
                formState: undefined,
              })
            : children}
        </div>
      </div>
    </FieldContext.Provider>
  );
};

Field.displayName = 'Field';

export { FieldContext };
