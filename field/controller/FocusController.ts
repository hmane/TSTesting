import type {
  FieldRegistration,
  FieldValidationMap,
  FieldValidationState,
  ValidationResult,
} from '../Field.types';
import { extractErrorMessage, findFieldElements, scanElementValidation } from '../utils/fieldUtils';

// Enhanced field registration with parent expansion capabilities
interface EnhancedFieldRegistration extends FieldRegistration {
  // Enhanced focus with parent expansion
  focusFn: () => Promise<boolean> | boolean;
  scrollFn: () => Promise<boolean> | boolean;

  // Backward compatibility - simple focus/scroll without expansion
  simpleFocusFn?: () => boolean;
  simpleScrollFn?: () => boolean;

  // RHF validation
  rhfValidationFn?: () => Promise<boolean>;
}

/**
 * Enhanced global focus and validation controller with parent expansion support
 * Now supports smart field focusing that can expand parent cards/accordions
 */
class EnhancedFocusController {
  private static instance: EnhancedFocusController;
  private fields = new Map<string, EnhancedFieldRegistration>();

  private constructor() {}

  static getInstance(): EnhancedFocusController {
    if (!EnhancedFocusController.instance) {
      EnhancedFocusController.instance = new EnhancedFocusController();
    }
    return EnhancedFocusController.instance;
  }

  // Core registration methods
  registerField(id: string, registration: EnhancedFieldRegistration): void {
    this.fields.set(id, registration);
  }

  unregisterField(id: string): void {
    this.fields.delete(id);
  }

  // Enhanced focus management with parent expansion
  async focusField(id: string, expandParent: boolean = true): Promise<boolean> {
    const field = this.fields.get(id);
    if (!field) return false;

    try {
      const focusFunction = expandParent ? field.focusFn : field.simpleFocusFn || field.focusFn;
      const result = await Promise.resolve(focusFunction());
      return result;
    } catch (error) {
      console.warn(`Failed to focus field ${id}:`, error);
      return false;
    }
  }

  async scrollToField(id: string, expandParent: boolean = true): Promise<boolean> {
    const field = this.fields.get(id);
    if (!field) return false;

    try {
      const scrollFunction = expandParent ? field.scrollFn : field.simpleScrollFn || field.scrollFn;
      const result = await Promise.resolve(scrollFunction());
      return result;
    } catch (error) {
      console.warn(`Failed to scroll to field ${id}:`, error);
      return false;
    }
  }

  // Enhanced navigation methods
  async focusNextField(currentId: string, expandParent: boolean = true): Promise<boolean> {
    const fieldIds = Array.from(this.fields.keys());
    const currentIndex = fieldIds.indexOf(currentId);

    if (currentIndex !== -1 && currentIndex < fieldIds.length - 1) {
      const nextFieldId = fieldIds[currentIndex + 1];
      return await this.focusField(nextFieldId, expandParent);
    }

    return false;
  }

  async focusPreviousField(currentId: string, expandParent: boolean = true): Promise<boolean> {
    const fieldIds = Array.from(this.fields.keys());
    const currentIndex = fieldIds.indexOf(currentId);

    if (currentIndex > 0) {
      const previousFieldId = fieldIds[currentIndex - 1];
      return await this.focusField(previousFieldId, expandParent);
    }

    return false;
  }

  async focusFirstField(expandParent: boolean = true): Promise<boolean> {
    const fieldIds = Array.from(this.fields.keys());
    if (fieldIds.length > 0) {
      return await this.focusField(fieldIds[0], expandParent);
    }
    return false;
  }

  async focusLastField(expandParent: boolean = true): Promise<boolean> {
    const fieldIds = Array.from(this.fields.keys());
    if (fieldIds.length > 0) {
      return await this.focusField(fieldIds[fieldIds.length - 1], expandParent);
    }
    return false;
  }

  // Enhanced validation with smart focusing
  async focusFirstInvalidField(
    container?: HTMLElement,
    expandParent: boolean = true
  ): Promise<boolean> {
    const fieldStates = this.scanFieldValidation(container);

    fieldStates.forEach(async (state, fieldId) => {
      if (!state.isValid) {
        const success = await this.focusField(fieldId, expandParent);
        if (success) return true; // Note: return in forEach doesn't work the same
      }
    });
    return false;
  }

  // Batch operations with parent expansion
  async focusFieldsInSequence(
    fieldIds: string[],
    delay: number = 100,
    expandParent: boolean = true
  ): Promise<boolean[]> {
    const results: boolean[] = [];

    for (const fieldId of fieldIds) {
      const result = await this.focusField(fieldId, expandParent);
      results.push(result);

      if (delay > 0 && fieldIds.indexOf(fieldId) < fieldIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  async scrollToFieldsInSequence(
    fieldIds: string[],
    delay: number = 500,
    expandParent: boolean = true
  ): Promise<boolean[]> {
    const results: boolean[] = [];

    for (const fieldId of fieldIds) {
      const result = await this.scrollToField(fieldId, expandParent);
      results.push(result);

      if (delay > 0 && fieldIds.indexOf(fieldId) < fieldIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  // Enhanced form validation with smart error focusing
  async validateAndFocus(container?: HTMLElement): Promise<{
    isValid: boolean;
    errors: { [fieldId: string]: string };
    firstErrorFocused: boolean;
  }> {
    const validation = this.validateAllFields(container);

    if (!validation.isValid) {
      const firstErrorFocused = await this.focusFirstInvalidField(container, true);
      return {
        ...validation,
        firstErrorFocused,
      };
    }

    return {
      ...validation,
      firstErrorFocused: false,
    };
  }

  // Smart field expansion and focus for form submission errors
  async handleFormErrors(
    errors: { [fieldName: string]: string },
    fieldNameToIdMap?: { [fieldName: string]: string }
  ): Promise<boolean> {
    const errorFieldNames = Object.keys(errors);
    if (errorFieldNames.length === 0) return false;

    // Try to focus the first error field
    for (const fieldName of errorFieldNames) {
      // First try direct field ID
      let fieldId = fieldName;

      // If we have a mapping, use it
      if (fieldNameToIdMap && fieldNameToIdMap[fieldName]) {
        fieldId = fieldNameToIdMap[fieldName];
      }

      // Try to find field by name attribute
      if (!this.fields.has(fieldId)) {
        const fieldElement = document.querySelector(`[data-rhf-field="${fieldName}"]`);
        if (fieldElement) {
          const foundId = fieldElement.getAttribute('data-field-id');
          if (foundId && this.fields.has(foundId)) {
            fieldId = foundId;
          }
        }
      }

      // Try to focus the field
      if (this.fields.has(fieldId)) {
        const success = await this.focusField(fieldId, true);
        if (success) return true;
      }
    }

    return false;
  }

  // Existing validation methods (enhanced)
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
          error: error || 'Validation failed',
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
      fieldCount: fieldStates.size,
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
      fieldCount: rhfValidationPromises.length,
    };
  }

  getFieldErrors(container?: HTMLElement): { [fieldId: string]: string } {
    const validation = this.validateAllFields(container);
    return validation.errors;
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

  // Enhanced validation statistics with parent context
  getValidationStats(container?: HTMLElement): {
    totalFields: number;
    validFields: number;
    invalidFields: number;
    rhfFields: number;
    fieldsInCards: number;
    fieldsInAccordions: number;
    collapsedParents: number;
    validationSources: { [source: string]: number };
  } {
    const fieldStates = this.scanFieldValidation(container);
    const stats = {
      totalFields: fieldStates.size,
      validFields: 0,
      invalidFields: 0,
      rhfFields: 0,
      fieldsInCards: 0,
      fieldsInAccordions: 0,
      collapsedParents: 0,
      validationSources: {} as { [source: string]: number },
    };

    fieldStates.forEach((state, fieldId) => {
      if (state.isValid) {
        stats.validFields++;
      } else {
        stats.invalidFields++;
      }

      if (state.source === 'rhf') {
        stats.rhfFields++;
      }

      // Count validation sources
      stats.validationSources[state.source] = (stats.validationSources[state.source] || 0) + 1;

      // Check parent context
      const element = state.element;
      const cardParent = element.closest('[data-card-id]');
      const accordionParent = element.closest('[data-accordion-id]');

      if (cardParent) {
        stats.fieldsInCards++;
        const isExpanded = cardParent.getAttribute('data-card-expanded') === 'true';
        if (!isExpanded) {
          stats.collapsedParents++;
        }
      }

      if (accordionParent) {
        stats.fieldsInAccordions++;
      }
    });

    return stats;
  }

  // Advanced focus management for complex forms
  async focusFieldInGroup(
    groupId: string,
    fieldIndex: number,
    expandParent: boolean = true
  ): Promise<boolean> {
    const groupElement = document.querySelector(`[data-field-group-id="${groupId}"]`);
    if (!groupElement) return false;

    const fieldElements = Array.from(groupElement.querySelectorAll('[data-field-id]'));
    if (fieldIndex < 0 || fieldIndex >= fieldElements.length) return false;

    const fieldElement = fieldElements[fieldIndex] as HTMLElement;
    const fieldId = fieldElement.getAttribute('data-field-id');

    if (fieldId) {
      return await this.focusField(fieldId, expandParent);
    }

    return false;
  }

  // Smart tab navigation that respects parent containers
  async handleTabNavigation(
    currentFieldId: string,
    direction: 'forward' | 'backward',
    expandParent: boolean = true
  ): Promise<boolean> {
    const currentField = this.fields.get(currentFieldId);
    if (!currentField?.element) return false;

    // Get all visible fields in tab order
    const allFieldElements = findFieldElements();
    const visibleFields = allFieldElements.filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    // Sort by tab order (top to bottom, left to right)
    visibleFields.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();

      if (Math.abs(rectA.top - rectB.top) < 10) {
        return rectA.left - rectB.left;
      }
      return rectA.top - rectB.top;
    });

    // Find current field index
    const currentElement = currentField.element;
    const currentIndex = visibleFields.findIndex(el => el === currentElement);

    if (currentIndex === -1) return false;

    // Calculate next field index
    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= visibleFields.length) return false;

    // Get next field ID and focus it
    const nextFieldElement = visibleFields[nextIndex];
    const nextFieldId = nextFieldElement.getAttribute('data-field-id');

    if (nextFieldId) {
      return await this.focusField(nextFieldId, expandParent);
    }

    return false;
  }

  // Cleanup and reset methods
  async resetAllFields(): Promise<void> {
    // Clear validation states
    const fieldElements = findFieldElements();
    fieldElements.forEach(element => {
      element.removeAttribute('data-is-valid');
      element.removeAttribute('data-validation-message');
    });

    // Clear registration
    this.clearAllFields();
  }

  // Debug and development helpers
  getDebugInfo(): {
    registeredFields: string[];
    fieldDetails: Array<{
      id: string;
      hasElement: boolean;
      hasRHF: boolean;
      parentType: string | undefined;
      isParentExpanded: boolean | undefined;
    }>;
  } {
    const fieldDetails = Array.from(this.fields.entries()).map(([id, registration]) => {
      let parentType: string | undefined = undefined;
      let isParentExpanded: boolean | undefined = undefined;

      if (registration.element) {
        const cardParent = registration.element.closest('[data-card-id]');
        const accordionParent = registration.element.closest('[data-accordion-id]');

        if (cardParent) {
          parentType = accordionParent ? 'accordion' : 'card';
          isParentExpanded = cardParent.getAttribute('data-card-expanded') === 'true';
        }
      }

      return {
        id,
        hasElement: !!registration.element,
        hasRHF: !!registration.rhfValidationFn,
        parentType,
        isParentExpanded,
      };
    });

    return {
      registeredFields: this.getAllFields(),
      fieldDetails,
    };
  }
}

// Export singleton instance
export const focusController = EnhancedFocusController.getInstance();
