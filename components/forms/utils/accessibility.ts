/**
 * Accessibility utilities for form components
 * Handles auto-generation of IDs and aria relationships
 */

let idCounter = 0;

/**
 * Generates a unique ID with an optional prefix
 */
export const generateId = (prefix: string = 'field'): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
};

/**
 * Creates consistent IDs for field components
 */
export interface FieldIds {
  fieldId: string;
  labelId: string;
  descriptionId: string;
  errorId: string;
}

export const generateFieldIds = (baseId?: string): FieldIds => {
  const fieldId = baseId || generateId('field');

  return {
    fieldId,
    labelId: `${fieldId}-label`,
    descriptionId: `${fieldId}-description`,
    errorId: `${fieldId}-error`,
  };
};

/**
 * Creates aria attributes for form controls
 */
export interface AriaAttributes {
  id?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

export const createAriaAttributes = (
  fieldId: string,
  labelId: string,
  descriptionId?: string,
  errorId?: string,
  options: {
    hasError?: boolean;
    isRequired?: boolean;
    hasDescription?: boolean;
  } = {}
): AriaAttributes => {
  const { hasError = false, isRequired = false, hasDescription = false } = options;

  const describedByIds: string[] = [];

  if (hasDescription && descriptionId) {
    describedByIds.push(descriptionId);
  }

  if (hasError && errorId) {
    describedByIds.push(errorId);
  }

  const attributes: AriaAttributes = {
    id: fieldId,
    'aria-labelledby': labelId,
  };

  if (describedByIds.length > 0) {
    attributes['aria-describedby'] = describedByIds.join(' ');
  }

  if (hasError) {
    attributes['aria-invalid'] = true;
  }

  if (isRequired) {
    attributes['aria-required'] = true;
  }

  return attributes;
};

/**
 * Validates if an element has proper accessibility attributes
 */
export const validateAccessibility = (element: HTMLElement): string[] => {
  const issues: string[] = [];

  // Check for label association
  const hasAriaLabel = element.hasAttribute('aria-label');
  const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
  const hasAssociatedLabel = document.querySelector(`label[for="${element.id}"]`);

  if (!hasAriaLabel && !hasAriaLabelledBy && !hasAssociatedLabel) {
    issues.push('Form control should have an associated label or aria-label');
  }

  // Check for error state
  const isInvalid = element.getAttribute('aria-invalid') === 'true';
  const hasErrorDescription = element.hasAttribute('aria-describedby');

  if (isInvalid && !hasErrorDescription) {
    issues.push('Invalid form control should have aria-describedby pointing to error message');
  }

  // Check for required state
  const isRequired =
    element.hasAttribute('required') || element.getAttribute('aria-required') === 'true';
  const parentLabel = element.closest('.field-container')?.querySelector('label');

  if (isRequired && parentLabel && !parentLabel.textContent?.includes('*')) {
    issues.push('Required field should have visual required indicator');
  }

  return issues;
};

/**
 * Enhances form control with accessibility attributes
 */
export const enhanceFormControl = (
  element: HTMLElement,
  fieldIds: FieldIds,
  options: {
    hasError?: boolean;
    isRequired?: boolean;
    hasDescription?: boolean;
    hasLabel?: boolean;
  } = {}
): void => {
  const { hasError = false, isRequired = false, hasDescription = false, hasLabel = true } = options;

  // Set basic attributes
  element.id = fieldIds.fieldId;

  if (hasLabel) {
    element.setAttribute('aria-labelledby', fieldIds.labelId);
  }

  // Set described by relationships
  const describedByIds: string[] = [];

  if (hasDescription) {
    describedByIds.push(fieldIds.descriptionId);
  }

  if (hasError) {
    describedByIds.push(fieldIds.errorId);
    element.setAttribute('aria-invalid', 'true');
  } else {
    element.removeAttribute('aria-invalid');
  }

  if (describedByIds.length > 0) {
    element.setAttribute('aria-describedby', describedByIds.join(' '));
  } else {
    element.removeAttribute('aria-describedby');
  }

  // Set required state
  if (isRequired) {
    element.setAttribute('aria-required', 'true');
  } else {
    element.removeAttribute('aria-required');
  }
};

/**
 * Checks if the current environment supports screen readers
 */
export const hasScreenReaderSupport = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for common screen reader indicators
  const hasAriaSupport = 'aria-label' in document.createElement('div');
  const hasRoleSupport = 'role' in document.createElement('div');

  return hasAriaSupport && hasRoleSupport;
};

/**
 * Announces a message to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  if (typeof window === 'undefined' || !hasScreenReaderSupport()) {
    return;
  }

  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;

  document.body.appendChild(announcer);

  // Remove the announcer after a short delay
  setTimeout(() => {
    if (announcer.parentNode) {
      announcer.parentNode.removeChild(announcer);
    }
  }, 1000);
};

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Sets focus to the first invalid field in a form
   */
  focusFirstInvalidField: (formElement: HTMLFormElement): boolean => {
    const invalidField = formElement.querySelector('[aria-invalid="true"]') as HTMLElement;

    if (invalidField && typeof invalidField.focus === 'function') {
      invalidField.focus();
      return true;
    }

    return false;
  },

  /**
   * Creates a focus trap within an element
   */
  createFocusTrap: (element: HTMLElement): (() => void) => {
    const focusableSelectors = [
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = element.querySelectorAll(
      focusableSelectors
    ) as NodeListOf<HTMLElement>;
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },
};
