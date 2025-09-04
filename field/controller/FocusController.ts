import type { 
  FieldRegistration, 
  ValidationResult, 
  FieldValidationMap, 
  FieldValidationState 
} from '../Field.types';
import { 
  findFieldElements, 
  scanElementValidation, 
  extractErrorMessage, 
  focusFirstElement, 
  scrollToElement 
} from '../utils/fieldUtils';

/**
 * Enhanced global focus and validation controller with RHF support
 * Singleton pattern for centralized field management
 */
class FocusController {
  private static instance: FocusController;
  private fields = new Map<string, FieldRegistration>();

  private constructor() {}

  static getInstance(): FocusController {
    if (!FocusController.instance) {
      FocusController.instance = new FocusController();
    }
    return FocusController.instance;
  }

  // Core registration methods
  registerField(id: string, registration: FieldRegistration): void {
    this.fields.set(id, registration);
  }

  unregisterField(id: string): void {
    this.fields.delete(id);
  }

  // Focus management methods
  focusField(id: string): boolean {
    const field = this.fields.get(id);
    if (field && field.focusFn) {
      try {
        return field.focusFn();
      } catch (error) {
        console.warn(`Failed to focus field ${id}:`, error);
        return false;
      }
    }
    return false;
  }

  scrollToField(id: string): boolean {
    const field = this.fields.get(id);
    if (field && field.scrollFn) {
      try {
        return field.scrollFn();
      } catch (error) {
        console.warn(`Failed to scroll to field ${id}:`, error);
        return false;
      }
    }
    return false;
  }

  // Navigation methods
  focusNextField(currentId: string): boolean {
    const fieldIds = Array.from(this.fields.keys());
    const currentIndex = fieldIds.indexOf(currentId);
    
    if (currentIndex !== -1 && currentIndex < fieldIds.length - 1) {
      const nextFieldId = fieldIds[currentIndex + 1];
      return this.focusField(nextFieldId);
    }
    
    return false;
  }

  focusPreviousField(currentId: string): boolean {
    const fieldIds = Array.from(this.fields.keys());
    const currentIndex = fieldIds.indexOf(currentId);
    
    if (currentIndex > 0) {
      const previousFieldId = fieldIds[currentIndex - 1];
      return this.focusField(previousFieldId);
    }
    
    return false;
  }

  focusFirstField(): boolean {
    const fieldIds = Array.from(this.fields.keys());
    if (fieldIds.length > 0) {
      return this.focusField(fieldIds[0]);
    }
    return false;
  }

  focusLastField(): boolean {
    const fieldIds = Array.from(this.fields.keys());
    if (fieldIds.length > 0) {
      return this.focusField(fieldIds[fieldIds.length - 1]);
    }
    return false;
  }

  // Enhanced validation scanning with RHF support
  scanFieldValidation(rootElement?: HTMLElement): FieldValidationMap {
    const fields = new Map<string, FieldValidationState>();
    const fieldElements = findFieldElements(rootElement);
    
    fieldElements.forEach(fieldEl => {
      const fieldId = fieldEl.getAttribute('data-field-id');
      if (!fieldId) return;
      
      // Check if this is an RHF field
      const rhfFieldName = fieldEl.getAttribute('data-rhf-field');
      
      if (rhfFieldName) {
        // RHF field - check data attributes set by Controller
        const isValid = fieldEl.getAttribute('data-is-valid') === 'true';
        const error = fieldEl.getAttribute('data-validation-message') || '';
        
        fields.set(fieldId, {
          isValid,
          error: error || (isValid ? '' : 'Validation failed'),
          source: 'rhf',
          element: fieldEl,
          rhfFieldState: {
            isDirty: fieldEl.hasAttribute('data-field-dirty'),
            isTouched: fieldEl.hasAttribute('data-field-touched'),
            isValidating: fieldEl.hasAttribute('data-field-validating'),
          },
        });
      } else {
        // Non-RHF field - use existing validation scanning
        const validation = scanElementValidation(fieldEl);
        const error = extractErrorMessage(fieldEl) || validation.error;
        
        fields.set(fieldId, {
          ...validation,
          error: error || 'Validation failed'
        });
      }
    });
    
    return fields;
  }

  validateAllFields(container?: HTMLElement): ValidationResult {
    const fieldStates = this.scanFieldValidation(container);
    const errors: { [fieldId: string]: string } = {};
    
    fieldStates.forEach((state, fieldId) => {
      if (!state.isValid) {
        errors[fieldId] = state.error;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      fieldCount: fieldStates.size
    };
  }

  // RHF-specific validation methods
  async validateRHFFields(): Promise<ValidationResult> {
    const rhfValidationPromises: Promise<{ fieldId: string; isValid: boolean }>[] = [];
    const errors: { [fieldId: string]: string } = {};
    
    // Trigger RHF validation for all registered fields
    this.fields.forEach((registration, fieldId) => {
      if (registration.rhfValidationFn) {
        rhfValidationPromises.push(
          registration.rhfValidationFn().then(isValid => ({ fieldId, isValid }))
        );
      }
    });
    
    if (rhfValidationPromises.length > 0) {
      try {
        const results = await Promise.all(rhfValidationPromises);
        
        results.forEach(({ fieldId, isValid }) => {
          if (!isValid) {
            errors[fieldId] = 'RHF validation failed';
          }
        });
      } catch (error) {
        console.warn('RHF validation batch failed:', error);
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      fieldCount: rhfValidationPromises.length
    };
  }

  getFieldErrors(container?: HTMLElement): { [fieldId: string]: string } {
    const validation = this.validateAllFields(container);
    return validation.errors;
  }

  // Focus first invalid field (enhanced with RHF support)
  focusFirstInvalidField(container?: HTMLElement): boolean {
    const fieldStates = this.scanFieldValidation(container);
    
    for (const [fieldId, state] of fieldStates) {
      if (!state.isValid) {
        return this.focusField(fieldId);
      }
    }
    
    return false;
  }

  // Batch operations
  focusFieldsInSequence(fieldIds: string[], delay: number = 100): Promise<boolean[]> {
    return new Promise((resolve) => {
      const results: boolean[] = [];
      let index = 0;

      const focusNext = () => {
        if (index < fieldIds.length) {
          const result = this.focusField(fieldIds[index]);
          results.push(result);
          index++;
          setTimeout(focusNext, delay);
        } else {
          resolve(results);
        }
      };

      focusNext();
    });
  }

  scrollToFieldsInSequence(fieldIds: string[], delay: number = 500): Promise<boolean[]> {
    return new Promise((resolve) => {
      const results: boolean[] = [];
      let index = 0;

      const scrollNext = () => {
        if (index < fieldIds.length) {
          const result = this.scrollToField(fieldIds[index]);
          results.push(result);
          index++;
          setTimeout(scrollNext, delay);
        } else {
          resolve(results);
        }
      };

      scrollNext();
    });
  }

  // Utility methods
  getAllFields(): string[] {
    return Array.from(this.fields.keys());
  }

  isFieldRegistered(fieldId: string): boolean {
    return this.fields.has(fieldId);
  }

  getRegisteredFieldCount(): number {
    return this.fields.size;
  }

  clearAllFields(): void {
    this.fields.clear();
  }

  // Enhanced validation statistics with RHF support
  getValidationStats(container?: HTMLElement): {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    rhfFields: number;
    validationSources: { [source: string]: number };
  } {
    const fieldStates = this.scanFieldValidation(container);
    const stats = {
      totalFields: fieldStates.size,
      validFields: 0,
      invalidFields: 0,
      rhfFields: 0,
      validationSources: {} as { [source: string]: number }
    };

    fieldStates.forEach((state) => {
      if (state.isValid) {
        stats.validFields++;
      } else {
        stats.invalidFields++;
      }

      if (state.source === 'rhf') {
        stats.rhfFields++;
      }

      // Count validation sources
      stats.validationSources[state.source] = 
        (stats.validationSources[state.source] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const focusController = FocusController.getInstance();
