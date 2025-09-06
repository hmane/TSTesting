import { useCallback } from 'react';
import { useFormContext, FieldErrors, FieldError } from 'react-hook-form';
import { focusController } from '../controller/FocusController';
import type { ValidationResult } from '../Field.types';

interface UseFieldFocusReturn {
  // Enhanced focus management with parent expansion
  focusField: (id: string, expandParent?: boolean) => Promise<boolean>;
  scrollToField: (id: string, expandParent?: boolean) => Promise<boolean>;
  focusNextField: (currentId: string, expandParent?: boolean) => Promise<boolean>;
  focusPreviousField: (currentId: string, expandParent?: boolean) => Promise<boolean>;
  focusFirstField: (expandParent?: boolean) => Promise<boolean>;
  focusLastField: (expandParent?: boolean) => Promise<boolean>;

  // Enhanced validation with smart error focusing
  validateAllFields: (container?: HTMLElement) => ValidationResult;
  validateRHFFields: () => Promise<ValidationResult>;
  getFieldErrors: (container?: HTMLElement) => { [fieldId: string]: string };
  focusFirstInvalidField: (container?: HTMLElement, expandParent?: boolean) => Promise<boolean>;

  // Smart form validation and error handling
  validateAndFocus: (container?: HTMLElement) => Promise<{
    isValid: boolean;
    errors: { [fieldId: string]: string };
    firstErrorFocused: boolean;
  }>;
  handleFormErrors: (
    errors: FieldErrors<any> | { [fieldName: string]: string },
    fieldNameToIdMap?: { [fieldName: string]: string }
  ) => Promise<boolean>;

  // RHF integration
  triggerRHFValidation: (fieldName?: string) => Promise<boolean>;
  getRHFErrors: () => { [fieldName: string]: string };

  // Advanced navigation
  handleTabNavigation: (
    currentFieldId: string,
    direction: 'forward' | 'backward',
    expandParent?: boolean
  ) => Promise<boolean>;
  focusFieldInGroup: (
    groupId: string,
    fieldIndex: number,
    expandParent?: boolean
  ) => Promise<boolean>;

  // Batch operations with parent expansion
  focusFieldsInSequence: (
    fieldIds: string[],
    delay?: number,
    expandParent?: boolean
  ) => Promise<boolean[]>;
  scrollToFieldsInSequence: (
    fieldIds: string[],
    delay?: number,
    expandParent?: boolean
  ) => Promise<boolean[]>;

  // Utility methods
  getAllFields: () => string[];
  isFieldRegistered: (fieldId: string) => boolean;
  getRegisteredFieldCount: () => number;

  // Enhanced statistics with parent context
  getValidationStats: (container?: HTMLElement) => {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    rhfFields: number;
    fieldsInCards: number;
    fieldsInAccordions: number;
    collapsedParents: number;
    validationSources: { [source: string]: number };
  };

  // Debug helpers
  getDebugInfo: () => {
    registeredFields: string[];
    fieldDetails: Array<{
      id: string;
      hasElement: boolean;
      hasRHF: boolean;
      parentType: string | null;
      isParentExpanded: boolean | null;
    }>;
  };
}

/**
 * Utility function to convert RHF FieldErrors to simple string map
 */
const convertFieldErrorsToStringMap = (
  errors: FieldErrors<any>
): { [fieldName: string]: string } => {
  const stringErrors: { [fieldName: string]: string } = {};

  const processError = (key: string, error: FieldError | any): void => {
    if (!error) return;

    // Handle direct FieldError
    if (typeof error === 'object' && error.message) {
      stringErrors[key] = String(error.message);
      return;
    }

    // Handle nested errors (for nested objects/arrays)
    if (typeof error === 'object' && !error.message) {
      Object.keys(error).forEach(nestedKey => {
        const nestedError = error[nestedKey];
        if (nestedError) {
          processError(`${key}.${nestedKey}`, nestedError);
        }
      });
      return;
    }

    // Fallback - convert to string
    if (error) {
      stringErrors[key] = String(error);
    }
  };

  Object.keys(errors).forEach(key => {
    const error = errors[key];
    processError(key, error);
  });

  return stringErrors;
};

/**
 * Check if the errors parameter is RHF FieldErrors or simple string map
 */
const isFieldErrors = (errors: any): errors is FieldErrors<any> => {
  if (!errors || typeof errors !== 'object') return false;

  // Check if any value has the structure of a FieldError
  return Object.values(errors).some(
    error =>
      error &&
      typeof error === 'object' &&
      ('message' in error || 'type' in error || 'ref' in error)
  );
};

export const useFieldFocus = (): UseFieldFocusReturn => {
  // Optional RHF context
  const formContext = useFormContext();

  // Enhanced focus management methods with parent expansion
  const focusField = useCallback(
    async (id: string, expandParent: boolean = true): Promise<boolean> => {
      return await focusController.focusField(id, expandParent);
    },
    []
  );

  const scrollToField = useCallback(
    async (id: string, expandParent: boolean = true): Promise<boolean> => {
      return await focusController.scrollToField(id, expandParent);
    },
    []
  );

  const focusNextField = useCallback(
    async (currentId: string, expandParent: boolean = true): Promise<boolean> => {
      return await focusController.focusNextField(currentId, expandParent);
    },
    []
  );

  const focusPreviousField = useCallback(
    async (currentId: string, expandParent: boolean = true): Promise<boolean> => {
      return await focusController.focusPreviousField(currentId, expandParent);
    },
    []
  );

  const focusFirstField = useCallback(async (expandParent: boolean = true): Promise<boolean> => {
    return await focusController.focusFirstField(expandParent);
  }, []);

  const focusLastField = useCallback(async (expandParent: boolean = true): Promise<boolean> => {
    return await focusController.focusLastField(expandParent);
  }, []);

  // Enhanced validation methods
  const validateAllFields = useCallback((container?: HTMLElement): ValidationResult => {
    return focusController.validateAllFields(container);
  }, []);

  const validateRHFFields = useCallback(async (): Promise<ValidationResult> => {
    return await focusController.validateRHFFields();
  }, []);

  const getFieldErrors = useCallback((container?: HTMLElement): { [fieldId: string]: string } => {
    return focusController.getFieldErrors(container);
  }, []);

  const focusFirstInvalidField = useCallback(
    async (container?: HTMLElement, expandParent: boolean = true): Promise<boolean> => {
      return await focusController.focusFirstInvalidField(container, expandParent);
    },
    []
  );

  // Smart form validation and error handling
  const validateAndFocus = useCallback(async (container?: HTMLElement) => {
    return await focusController.validateAndFocus(container);
  }, []);

  const handleFormErrors = useCallback(
    async (
      errors: FieldErrors<any> | { [fieldName: string]: string },
      fieldNameToIdMap?: { [fieldName: string]: string }
    ): Promise<boolean> => {
      try {
        // Convert RHF FieldErrors to simple string map if needed
        let stringErrors: { [fieldName: string]: string };

        if (isFieldErrors(errors)) {
          stringErrors = convertFieldErrorsToStringMap(errors);
        } else {
          stringErrors = errors as { [fieldName: string]: string };
        }

        return await focusController.handleFormErrors(stringErrors, fieldNameToIdMap);
      } catch (error) {
        console.warn('Failed to handle form errors:', error);
        return false;
      }
    },
    []
  );

  // RHF-specific methods
  const triggerRHFValidation = useCallback(
    async (fieldName?: string): Promise<boolean> => {
      if (formContext) {
        try {
          const result = fieldName
            ? await formContext.trigger(fieldName as any)
            : await formContext.trigger();
          return result;
        } catch (error) {
          console.warn('RHF trigger validation failed:', error);
          return false;
        }
      }
      return true;
    },
    [formContext]
  );

  const getRHFErrors = useCallback((): { [fieldName: string]: string } => {
    if (formContext?.formState.errors) {
      return convertFieldErrorsToStringMap(formContext.formState.errors);
    }
    return {};
  }, [formContext]);

  // Advanced navigation methods
  const handleTabNavigation = useCallback(
    async (
      currentFieldId: string,
      direction: 'forward' | 'backward',
      expandParent: boolean = true
    ): Promise<boolean> => {
      return await focusController.handleTabNavigation(currentFieldId, direction, expandParent);
    },
    []
  );

  const focusFieldInGroup = useCallback(
    async (groupId: string, fieldIndex: number, expandParent: boolean = true): Promise<boolean> => {
      return await focusController.focusFieldInGroup(groupId, fieldIndex, expandParent);
    },
    []
  );

  // Batch operations with parent expansion
  const focusFieldsInSequence = useCallback(
    async (
      fieldIds: string[],
      delay: number = 100,
      expandParent: boolean = true
    ): Promise<boolean[]> => {
      return await focusController.focusFieldsInSequence(fieldIds, delay, expandParent);
    },
    []
  );

  const scrollToFieldsInSequence = useCallback(
    async (
      fieldIds: string[],
      delay: number = 500,
      expandParent: boolean = true
    ): Promise<boolean[]> => {
      return await focusController.scrollToFieldsInSequence(fieldIds, delay, expandParent);
    },
    []
  );

  // Utility methods
  const getAllFields = useCallback((): string[] => {
    return focusController.getAllFields();
  }, []);

  const isFieldRegistered = useCallback((fieldId: string): boolean => {
    return focusController.isFieldRegistered(fieldId);
  }, []);

  const getRegisteredFieldCount = useCallback((): number => {
    return focusController.getRegisteredFieldCount();
  }, []);

  // Enhanced statistics
  const getValidationStats = useCallback((container?: HTMLElement) => {
    return focusController.getValidationStats(container);
  }, []);

  // Debug helpers
  const getDebugInfo = useCallback(() => {
    const debugInfo = focusController.getDebugInfo();

    // Convert undefined to null to match our interface
    const fieldDetails = debugInfo.fieldDetails.map(detail => ({
      ...detail,
      parentType: detail.parentType ?? null,
      isParentExpanded: detail.isParentExpanded ?? null,
    }));

    return {
      registeredFields: debugInfo.registeredFields,
      fieldDetails,
    };
  }, []);

  return {
    // Enhanced focus management
    focusField,
    scrollToField,
    focusNextField,
    focusPreviousField,
    focusFirstField,
    focusLastField,

    // Enhanced validation
    validateAllFields,
    validateRHFFields,
    getFieldErrors,
    focusFirstInvalidField,

    // Smart form handling
    validateAndFocus,
    handleFormErrors,

    // RHF integration
    triggerRHFValidation,
    getRHFErrors,

    // Advanced navigation
    handleTabNavigation,
    focusFieldInGroup,

    // Batch operations
    focusFieldsInSequence,
    scrollToFieldsInSequence,

    // Utility methods
    getAllFields,
    isFieldRegistered,
    getRegisteredFieldCount,

    // Enhanced statistics
    getValidationStats,

    // Debug helpers
    getDebugInfo,
  };
};

/**
 * Convenience hook for common form submission scenarios
 */
export const useFormSubmission = () => {
  const fieldFocus = useFieldFocus();
  const formContext = useFormContext();

  const handleSubmissionErrors = useCallback(
    (
      onValid: (data: any) => void | Promise<void>,
      onInvalid?: (errors: FieldErrors<any>) => void
    ) => {
      if (!formContext) {
        console.warn('useFormSubmission requires FormProvider context');
        return async () => {};
      }

      return formContext.handleSubmit(
        async data => {
          await onValid(data);
        },
        async errors => {
          // Focus first error field with parent expansion
          const focused = await fieldFocus.handleFormErrors(errors);

          if (!focused) {
            // Fallback: try to focus first invalid field
            await fieldFocus.focusFirstInvalidField(undefined, true);
          }

          onInvalid?.(errors);
        }
      );
    },
    [fieldFocus, formContext]
  );

  return {
    handleSubmissionErrors,
    ...fieldFocus,
  };
};

/**
 * Hook for managing field focus within a specific card or accordion
 */
export const useCardFieldFocus = (cardId?: string) => {
  const fieldFocus = useFieldFocus();

  const focusFieldInCard = useCallback(
    async (fieldId: string): Promise<boolean> => {
      if (cardId) {
        // Ensure the card is expanded first
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement) {
          const isExpanded = cardElement.getAttribute('data-card-expanded') === 'true';
          if (!isExpanded) {
            // Expand the card first
            try {
              if (typeof window !== 'undefined' && (window as any).cardController) {
                const controller = (window as any).cardController;
                await controller.expandCard(cardId, true);
              }
            } catch (error) {
              console.warn('Failed to expand card before focusing field:', error);
            }
          }
        }
      }

      return await fieldFocus.focusField(fieldId, true);
    },
    [cardId, fieldFocus]
  );

  const getCardFields = useCallback((): string[] => {
    if (!cardId) return [];

    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    if (!cardElement) return [];

    const fieldElements = Array.from(cardElement.querySelectorAll('[data-field-id]'));
    return fieldElements.map(el => el.getAttribute('data-field-id')).filter(Boolean) as string[];
  }, [cardId]);

  const validateCardFields = useCallback((): ValidationResult => {
    if (!cardId) return { isValid: true, errors: {}, fieldCount: 0 };

    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    return fieldFocus.validateAllFields(cardElement as HTMLElement);
  }, [cardId, fieldFocus]);

  return {
    ...fieldFocus,
    focusFieldInCard,
    getCardFields,
    validateCardFields,
  };
};
