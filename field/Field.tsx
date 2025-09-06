import * as React from 'react';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Control,
  Controller,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  useFormContext,
  UseFormStateReturn,
} from 'react-hook-form';
import styles from './Field.module.scss';
import type {
  FieldContextType,
  FieldProps,
  FieldRenderProps,
  ValidationState,
} from './Field.types';
import { useFieldGroupContext } from './components/FieldGroup';
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

// Field Context with proper typing
const FieldContext = createContext<FieldContextType | null>(null);

export const useFieldContext = (): FieldContextType => {
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
}: FieldProps<TFieldValues>): JSX.Element => {
  // Use a mutable ref object that we can actually write to
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const fieldId = useMemo(() => id || name || generateFieldId(), [id, name]);

  // Get FieldGroup context for control and other inherited properties
  const fieldGroupContext = useFieldGroupContext();

  // Try to get form context (optional)
  const formContext = useFormContext<TFieldValues>();

  // Control resolution priority with proper typing
  // 1. Explicit control prop
  // 2. FieldGroup context control (cast to proper type)
  // 3. FormProvider context control
  const activeControl = useMemo(() => {
    if (control) return control;
    if (fieldGroupContext?.control) {
      // Type assertion since we know this control should work with our field values
      return fieldGroupContext.control as Control<TFieldValues>;
    }
    return formContext?.control;
  }, [control, fieldGroupContext?.control, formContext?.control]);

  // Inherit layout from FieldGroup if not explicitly set
  const effectiveLayout = layout || fieldGroupContext?.layout || 'horizontal';

  // Inherit labelWidth from FieldGroup if not explicitly set
  const effectiveLabelWidth = labelWidth || fieldGroupContext?.labelWidth;

  // Inherit disabled state from FieldGroup if not explicitly set
  const effectiveDisabled = disabled || fieldGroupContext?.disabled || false;

  // Responsive layout hook
  const { currentLayout } = useResponsiveLayout({ layout: effectiveLayout });

  // Lazy loading hook - handle the ref properly
  const lazyHookResult = useLazyField({
    lazy,
    onLoad,
  });

  const { isVisible } = lazyHookResult;

  // Parent detection hook
  const { detectParent, expandParentCard, expandParentAccordion } = useParentDetection();

  // Create a ref callback that properly handles our field ref only
  // Let the lazy hook manage its own ref internally
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    // Only update our field ref - let lazy hook manage its own ref
    fieldRef.current = node;
  }, []);

  // Enhanced focus function with parent expansion
  const focusFieldWithExpansion = useCallback(async (): Promise<boolean> => {
    const currentElement = fieldRef.current;
    if (!currentElement) return false;

    try {
      // Detect parent containers
      const parentInfo = detectParent(fieldRef);

      if (expandParent && parentInfo && !parentInfo.isExpanded) {
        if (parentInfo.type === 'card') {
          // Expand parent card first
          const expanded = await expandParentCard(parentInfo.id);
          if (expanded) {
            // Wait a bit for animation to start
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else if (parentInfo.type === 'accordion' && parentInfo.accordionId) {
          // Expand parent accordion card
          const expanded = await expandParentAccordion(parentInfo.accordionId, parentInfo.id);
          if (expanded) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      // Focus the field - use current element reference
      const success = focusFirstElement(currentElement);
      if (success) {
        onFocus?.();
      }
      return success;
    } catch (error) {
      console.warn(`Failed to focus field ${fieldId} with parent expansion:`, error);
      // Fallback to simple focus
      const success = currentElement ? focusFirstElement(currentElement) : false;
      if (success) {
        onFocus?.();
      }
      return success;
    }
  }, [fieldId, onFocus, expandParent, detectParent, expandParentCard, expandParentAccordion]);

  // Regular focus function (without expansion)
  const focusField = useCallback((): boolean => {
    const currentElement = fieldRef.current;
    if (currentElement) {
      const success = focusFirstElement(currentElement);
      if (success) {
        onFocus?.();
      }
      return success;
    }
    return false;
  }, [onFocus]);

  // Scroll function for controller
  const scrollToField = useCallback((): boolean => {
    const currentElement = fieldRef.current;
    if (currentElement) {
      return scrollToElement(currentElement, {
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
    return false;
  }, []);

  // Enhanced scroll with expansion
  const scrollToFieldWithExpansion = useCallback(async (): Promise<boolean> => {
    const currentElement = fieldRef.current;
    if (!currentElement) return false;

    try {
      // Detect and expand parent if needed
      const parentInfo = detectParent(fieldRef);

      if (expandParent && parentInfo && !parentInfo.isExpanded) {
        if (parentInfo.type === 'card') {
          await expandParentCard(parentInfo.id);
          await new Promise(resolve => setTimeout(resolve, 100));
        } else if (parentInfo.type === 'accordion' && parentInfo.accordionId) {
          await expandParentAccordion(parentInfo.accordionId, parentInfo.id);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Scroll to field - use current element reference
      return scrollToElement(currentElement, {
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
        // Check if the control has a trigger method
        const controlAny = activeControl as any;
        if (controlAny && typeof controlAny.trigger === 'function') {
          const result = await controlAny.trigger(name);
          return Boolean(result);
        }
        return true;
      } catch (error) {
        console.warn(`RHF validation failed for field ${String(name)}:`, error);
        return false;
      }
    }
    return true;
  }, [activeControl, name]);

  // Register with focus controller (enhanced with parent expansion)
  useEffect(() => {
    const currentElement = fieldRef.current;

    focusController.registerField(fieldId, {
      element: currentElement || undefined,
      focusFn: focusFieldWithExpansion,
      scrollFn: scrollToFieldWithExpansion,
      simpleFocusFn: focusField,
      simpleScrollFn: scrollToField,
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
          .then(() => {
            // Success - field focused
          })
          .catch(error => {
            console.warn(`Auto-focus failed for field ${fieldId}:`, error);
          });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoFocus, isVisible, focusFieldWithExpansion, fieldId]);

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
            fieldName: String(name),
            fieldId,
            validationState,
            disabled: effectiveDisabled,
            layout: currentLayout as 'horizontal' | 'vertical',
            rhfField: {
              name: String(name),
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
            [field, onFieldChange]
          );

          // Render props for children with proper typing
          const renderProps: FieldRenderProps<TFieldValues> = {
            field: {
              ...field,
              onChange: handleFieldChange,
            } as ControllerRenderProps<TFieldValues, FieldPath<TFieldValues>>,
            fieldState,
            formState: formState as UseFormStateReturn<TFieldValues>,
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
                data-rhf-field={String(name)}
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
    fieldName: name ? String(name) : fieldId,
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

  // Non-RHF render props
  const nonRhfRenderProps: FieldRenderProps<TFieldValues> = {
    field: undefined,
    fieldState: undefined,
    formState: undefined,
  };

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
            ? (children as (props: FieldRenderProps<TFieldValues>) => ReactNode)(nonRhfRenderProps)
            : children}
        </div>
      </div>
    </FieldContext.Provider>
  );
};

Field.displayName = 'Field';

export { FieldContext };
