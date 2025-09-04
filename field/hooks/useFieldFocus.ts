import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { focusController } from '../controller/FocusController';
import type { ValidationResult } from '../Field.types';

interface UseFieldFocusReturn {
  // Existing focus management
  focusField: (id: string) => boolean;
  scrollToField: (id: string) => boolean;
  focusNextField: (currentId: string) => boolean;
  focusPreviousField: (currentId: string) => boolean;
  focusFirstField: () => boolean;
  focusLastField: () => boolean;
  
  // Enhanced validation with RHF support
  validateAllFields: (container?: HTMLElement) => ValidationResult;
  validateRHFFields: () => Promise<ValidationResult>;
  getFieldErrors: (container?: HTMLElement) => { [fieldId: string]: string };
  focusFirstInvalidField: (container?: HTMLElement) => boolean;
  
  // RHF integration
  triggerRHFValidation: (fieldName?: string) => Promise<boolean>;
  getRHFErrors: () => { [fieldName: string]: string };
  
  // Utility methods
  getAllFields: () => string[];
  isFieldRegistered: (fieldId: string) => boolean;
  getRegisteredFieldCount: () => number;
  
  // Batch operations
  focusFieldsInSequence: (fieldIds: string[], delay?: number) => Promise<boolean[]>;
  scrollToFieldsInSequence: (fieldIds: string[], delay?: number) => Promise<boolean[]>;
  
  // Statistics
  getValidationStats: (container?: HTMLElement) => {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    rhfFields: number;
    validationSources: { [source: string]: number };
  };
}

export const useFieldFocus = (): UseFieldFocusReturn => {
  // Optional RHF context
  const formContext = useFormContext();

  // Existing focus management methods
  const focusField = useCallback((id: string): boolean => {
    return focusController.focusField(id);
  }, []);

  const scrollToField = useCallback((id: string): boolean => {
    return focusController.scrollToField(id);
  }, []);

  const focusNextField = useCallback((currentId: string): boolean => {
    return focusController.focusNextField(currentId);
  }, []);

  const focusPreviousField = useCallback((currentId: string): boolean => {
    return focusController.focusPreviousField(currentId);
  }, []);

  const focusFirstField = useCallback((): boolean => {
    return focusController.focusFirstField();
  }, []);

  const focusLastField = useCallback((): boolean => {
    return focusController.focusLastField();
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

  const focusFirstInvalidField = useCallback((container?: HTMLElement): boolean => {
    return focusController.focusFirstInvalidField(container);
  }, []);

  // RHF-specific methods
  const triggerRHFValidation = useCallback(async (fieldName?: string): Promise<boolean> => {
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
  }, [formContext]);

  const getRHFErrors = useCallback((): { [fieldName: string]: string } => {
    if (formContext?.formState.errors) {
      const errors: { [fieldName: string]: string } = {};
      Object.entries(formContext.formState.errors).forEach(([key, error]) => {
        if (error?.message) {
          errors[key] = error.message;
        }
      });
      return errors;
    }
    return {};
  }, [formContext]);

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

  // Batch operations
  const focusFieldsInSequence = useCallback(
    (fieldIds: string[], delay?: number): Promise<boolean[]> => {
      return focusController.focusFieldsInSequence(fieldIds, delay);
    }, 
    []
  );

  const scrollToFieldsInSequence = useCallback(
    (fieldIds: string[], delay?: number): Promise<boolean[]> => {
      return focusController.scrollToFieldsInSequence(fieldIds, delay);
    }, 
    []
  );

  // Statistics
  const getValidationStats = useCallback((container?: HTMLElement) => {
    return focusController.getValidationStats(container);
  }, []);

  return {
    // Focus management
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
    
    // RHF integration
    triggerRHFValidation,
    getRHFErrors,
    
    // Utility methods
    getAllFields,
    isFieldRegistered,
    getRegisteredFieldCount,
    
    // Batch operations
    focusFieldsInSequence,
    scrollToFieldsInSequence,
    
    // Statistics
    getValidationStats,
  };
};
