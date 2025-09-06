import { ReactNode } from 'react';
import type { FieldValidationState, LabelWidthType } from '../Field.types';

/**
 * Generate CSS class names for field component
 */
export const generateFieldClasses = (
  baseClass: string,
  layout: string,
  hasLabel: boolean,
  disabled: boolean,
  labelWidth?: LabelWidthType,
  className?: string
): string => {
  const classes = [baseClass];

  // Add layout class
  classes.push(`layout${layout.charAt(0).toUpperCase() + layout.slice(1)}`);

  // Add label width class if specified
  if (labelWidth && typeof labelWidth === 'string' && labelWidth !== 'auto') {
    classes.push(`labelWidth${labelWidth.charAt(0).toUpperCase() + labelWidth.slice(1)}`);
  }

  // Add state classes
  if (!hasLabel) classes.push('noLabel');
  if (disabled) classes.push('disabled');
  if (className) classes.push(className);

  return classes.join(' ');
};

/**
 * Generate inline styles for field component
 */
export const generateFieldStyles = (
  labelWidth?: LabelWidthType,
  backgroundColor?: string,
  baseStyle?: React.CSSProperties
): React.CSSProperties => {
  const styles: React.CSSProperties = { ...baseStyle };

  // Handle numeric label width
  if (typeof labelWidth === 'number') {
    (styles as React.CSSProperties & Record<string, unknown>)[
      '--field-label-width-global'
    ] = `${labelWidth}px`;
  }

  // Handle background color
  if (backgroundColor) {
    styles.backgroundColor = backgroundColor;
  }

  return styles;
};

/**
 * Check if children contain a Label component
 */
export const hasLabelComponent = (children: ReactNode): boolean => {
  const childrenArray = Array.isArray(children) ? children : [children];

  return childrenArray.some(child => {
    if (!child || typeof child !== 'object') return false;

    // Check if it's a React element with Label displayName
    if ('type' in child) {
      const type = child.type as any;
      return type?.displayName === 'Label';
    }

    return false;
  });
};

/**
 * Extract React component props from DOM element (for validation scanning)
 */
export const getReactProps = (element: HTMLElement): any => {
  // Try to find React fiber node
  const reactKey = Object.keys(element).find(
    key =>
      key.startsWith('__reactInternalInstance') ||
      key.startsWith('_reactInternalFiber') ||
      key.startsWith('__reactFiber')
  );

  if (reactKey) {
    const reactInstance = (element as any)[reactKey];
    return (
      reactInstance?.memoizedProps ||
      reactInstance?.pendingProps ||
      reactInstance?.return?.memoizedProps
    );
  }

  return null;
};

/**
 * Scan element and its children for isValid property (breadth-first search)
 */
export const scanElementValidation = (element: HTMLElement): FieldValidationState => {
  const queue: HTMLElement[] = [element];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Check React props first
    const props = getReactProps(current);
    if (props?.isValid !== undefined) {
      return {
        isValid: props.isValid,
        error: props.error || 'Validation failed',
        source: 'direct',
        element: current,
      };
    }

    // Check data attributes
    if (current.hasAttribute('data-is-valid')) {
      const isValid = current.getAttribute('data-is-valid') === 'true';
      const error = current.getAttribute('data-validation-message') || 'Validation failed';
      return {
        isValid,
        error,
        source: 'data-attribute',
        element: current,
      };
    }

    // Add children to queue for breadth-first search
    const children = Array.from(current.children) as HTMLElement[];
    queue.push(...children);
  }

  // Default to valid if no validation found
  return {
    isValid: true,
    error: '',
    source: 'default',
    element,
  };
};

/**
 * Find all field elements in a container
 */
export const findFieldElements = (container?: HTMLElement): HTMLElement[] => {
  const root = container || document.body;
  return Array.from(root.querySelectorAll('[data-field-id]')) as HTMLElement[];
};

/**
 * Extract error message from field element
 */
export const extractErrorMessage = (fieldElement: HTMLElement): string | null => {
  // Look for error component
  const errorElement = fieldElement.querySelector('[data-field-error]');
  if (errorElement) {
    return errorElement.textContent?.trim() || null;
  }

  // Look for validation message data attribute
  const validationMessage = fieldElement.getAttribute('data-validation-message');
  if (validationMessage) {
    return validationMessage.trim();
  }

  return null;
};

/**
 * Focus first focusable element in a container
 */
export const focusFirstElement = (container: HTMLElement): boolean => {
  const focusableSelector = [
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    '[contenteditable="true"]',
  ].join(', ');

  const focusableElement = container.querySelector(focusableSelector) as HTMLElement;

  if (focusableElement) {
    try {
      focusableElement.focus();
      return true;
    } catch (error) {
      console.warn('Failed to focus element:', error);
      return false;
    }
  }

  return false;
};

/**
 * Scroll element into view with smooth behavior
 */
export const scrollToElement = (element: HTMLElement, options?: ScrollIntoViewOptions): boolean => {
  try {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
      ...options,
    });
    return true;
  } catch (error) {
    console.warn('Failed to scroll to element:', error);
    return false;
  }
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Generate unique field ID
 */
export const generateFieldId = (name?: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  const prefix = name ? name.replace(/[^a-zA-Z0-9]/g, '_') : 'field';

  return `${prefix}_${timestamp}_${random}`;
};
