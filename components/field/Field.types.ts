import { CSSProperties, ReactNode, RefObject } from 'react';
import {
  Control,
  ControllerRenderProps,
  FieldError,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormStateReturn,
} from 'react-hook-form';

// Enhanced ValidationState with RHF support
export interface ValidationState {
  isValid: boolean;
  error?: string;
  isDirty: boolean;
  isTouched: boolean;
  isValidating?: boolean;
}

// Enhanced FieldContextType with RHF integration
export interface FieldContextType {
  fieldName: string;
  fieldId: string;
  validationState: ValidationState;
  disabled?: boolean;
  layout: LayoutType;
  // RHF integration (optional)
  rhfField?: {
    name: string;
    control?: Control<any>;
    fieldError?: FieldError;
    fieldState?: {
      isDirty: boolean;
      isTouched: boolean;
      isValidating: boolean;
      invalid: boolean;
    };
  };
}

export type LayoutType = 'auto' | 'horizontal' | 'vertical';
export type LabelWidthType = number | 'auto' | 'compact' | 'normal' | 'wide';
export type SpacingType = 'compact' | 'normal' | 'relaxed';

// Enhanced FieldProps with parent expansion support
export interface FieldProps<TFieldValues extends FieldValues = FieldValues> {
  /** Field identifier for focus management */
  id?: string;

  /** Field name for form handling */
  name?: FieldPath<TFieldValues>;

  /** React Hook Form control (optional - can be inherited from FieldGroup) */
  control?: Control<TFieldValues>;

  /** React Hook Form validation rules (optional) */
  rules?: RegisterOptions<TFieldValues>;

  /** Layout direction */
  layout?: LayoutType;

  /** Whether field is disabled */
  disabled?: boolean;

  /** Manual validation state (overrides RHF if provided) */
  isValid?: boolean;

  /** Manual error message (overrides RHF if provided) */
  error?: string;

  /** Label width configuration */
  labelWidth?: LabelWidthType;

  /** Background color */
  backgroundColor?: string;

  /** Custom CSS class */
  className?: string;

  /** Custom styles */
  style?: CSSProperties;

  /** Auto focus on mount */
  autoFocus?: boolean;

  /** Lazy loading */
  lazy?: boolean;

  /** Loading component for lazy fields */
  loadingComponent?: ReactNode;

  /** Enable automatic parent card/accordion expansion when focusing (default: true) */
  expandParent?: boolean;

  /** Focus callback */
  onFocus?: () => void;

  /** Load callback for lazy fields */
  onLoad?: () => void;

  /** RHF field change callback */
  onFieldChange?: (value: any) => void;

  /** Children components or render prop */
  children: ReactNode | ((props: FieldRenderProps<TFieldValues>) => ReactNode);
}

// Render props for advanced usage
export interface FieldRenderProps<TFieldValues extends FieldValues = FieldValues> {
  field?: ControllerRenderProps<TFieldValues>;
  fieldState?: {
    invalid: boolean;
    isTouched: boolean;
    isDirty: boolean;
    isValidating: boolean;
    error?: FieldError;
  };
  formState?: UseFormStateReturn<TFieldValues>;
}

// Component props
export interface LabelProps {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
  wrap?: 'normal' | 'break-word' | 'nowrap';
  className?: string;
  style?: CSSProperties;
}

export interface DescriptionProps {
  children: ReactNode;
  icon?: string;
  position?: 'inline' | 'end';
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

export interface ErrorProps {
  children?: ReactNode;
  animation?: 'slide' | 'fade' | 'none';
  position?: 'below' | 'inline';
  className?: string;
  style?: CSSProperties;
}

// Enhanced FieldGroupProps with RHF control propagation
export interface FieldGroupProps<TFieldValues extends FieldValues = FieldValues> {
  id?: string;
  children: ReactNode;

  /** Label width for all child fields */
  labelWidth?: LabelWidthType;

  /** CSS class name */
  className?: string;

  /** Inline styles */
  style?: CSSProperties;

  /** Spacing between fields */
  spacing?: SpacingType;

  /** Layout direction for all child fields */
  layout?: LayoutType;

  /** Disabled state for all child fields */
  disabled?: boolean;

  /** React Hook Form control - propagates to child fields that don't have their own control */
  control?: Control<TFieldValues>;
}

// Enhanced FieldGroupContextType with control propagation
export interface FieldGroupContextType<TFieldValues extends FieldValues = FieldValues> {
  labelWidth: LabelWidthType;
  spacing: SpacingType;
  layout: LayoutType;
  disabled?: boolean;

  /** Control object that child fields can inherit */
  control?: Control<TFieldValues>;
}

// Enhanced Focus Controller types with parent expansion
export interface FieldRegistration {
  element?: HTMLElement;
  // Enhanced focus functions that can expand parents
  focusFn: () => Promise<boolean> | boolean;
  scrollFn: () => Promise<boolean> | boolean;
  // Backward compatibility - simple focus/scroll without expansion
  simpleFocusFn?: () => boolean;
  simpleScrollFn?: () => boolean;
  // RHF validation
  rhfValidationFn?: () => Promise<boolean>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [fieldId: string]: string };
  fieldCount: number;
  rhfErrors?: { [fieldName: string]: FieldError }; // RHF errors
}

export interface FieldValidationState {
  isValid: boolean;
  error: string;
  source: 'direct' | 'nested' | 'data-attribute' | 'rhf' | 'default';
  element: HTMLElement;
  rhfFieldState?: {
    isDirty: boolean;
    isTouched: boolean;
    isValidating: boolean;
  };
}

export type FieldValidationMap = Map<string, FieldValidationState>;

// Parent detection types
export interface ParentInfo {
  type: 'card' | 'accordion';
  id: string;
  isExpanded: boolean;
  element: HTMLElement;
  accordionId?: string; // For accordion cards
}

export interface ParentDetectionHook {
  detectParent: (fieldRef: RefObject<HTMLElement>) => ParentInfo | null;
  expandParentCard: (cardId: string) => Promise<boolean>;
  expandParentAccordion: (accordionId: string, cardId: string) => Promise<boolean>;
  isParentExpanded: (fieldRef: RefObject<HTMLElement>) => boolean;
  getParentInfo: (fieldRef: RefObject<HTMLElement>) => ParentInfo | null;
}

// Enhanced field focus context
export interface FieldParentContext {
  hasParent: boolean;
  parentType?: 'card' | 'accordion';
  parentId?: string;
  isParentExpanded: boolean;
  parentElement?: HTMLElement;
  isInAccordion: boolean;
  accordionId?: string;
}

// Enhanced validation statistics
export interface ValidationStats {
  totalFields: number;
  validFields: number;
  invalidFields: number;
  rhfFields: number;
  fieldsInCards: number;
  fieldsInAccordions: number;
  collapsedParents: number;
  validationSources: { [source: string]: number };
}

// Enhanced field debug information
export interface FieldDebugInfo {
  registeredFields: string[];
  fieldDetails: Array<{
    id: string;
    hasElement: boolean;
    hasRHF: boolean;
    parentType: string | null;
    isParentExpanded: boolean | null;
  }>;
}

// Form submission with enhanced error handling
export interface FormSubmissionResult {
  isValid: boolean;
  errors: { [fieldId: string]: string };
  firstErrorFocused: boolean;
}

export interface FormSubmissionOptions {
  expandParentOnError?: boolean;
  focusFirstError?: boolean;
  scrollToError?: boolean;
  highlightErrors?: boolean;
}

// Enhanced hooks return types
export interface UseFieldFocusReturn {
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
  validateAndFocus: (container?: HTMLElement) => Promise<FormSubmissionResult>;
  handleFormErrors: (
    errors: { [fieldName: string]: string },
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
  getValidationStats: (container?: HTMLElement) => ValidationStats;

  // Debug helpers
  getDebugInfo: () => FieldDebugInfo;
}

export interface UseFormSubmissionReturn extends UseFieldFocusReturn {
  handleSubmissionErrors: (
    onValid: (data: any) => void | Promise<void>,
    onInvalid?: (errors: any) => void
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export interface UseCardFieldFocusReturn extends UseFieldFocusReturn {
  focusFieldInCard: (fieldId: string) => Promise<boolean>;
  getCardFields: () => string[];
  validateCardFields: () => ValidationResult;
}

// Lazy field hook types
export interface UseLazyFieldOptions {
  lazy: boolean;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
}

export interface UseLazyFieldReturn {
  isVisible: boolean;
  isManuallyLoaded: boolean;
  manualLoad: () => void;
  fieldRef: RefObject<HTMLDivElement>;
}

// Responsive layout hook types
export interface UseResponsiveLayoutOptions {
  layout: LayoutType;
  breakpoint?: number;
}

export interface UseResponsiveLayoutReturn {
  currentLayout: 'horizontal' | 'vertical';
  isMobile: boolean;
}

// Parent detection hook types
export interface UseParentDetectionReturn {
  detectParent: (fieldRef: RefObject<HTMLElement>) => ParentInfo | null;
  expandParentCard: (cardId: string) => Promise<boolean>;
  expandParentAccordion: (accordionId: string, cardId: string) => Promise<boolean>;
  isParentExpanded: (fieldRef: RefObject<HTMLElement>) => boolean;
  getParentInfo: (fieldRef: RefObject<HTMLElement>) => ParentInfo | null;
}

export interface UseFieldParentContextReturn {
  hasParent: boolean;
  parentType?: 'card' | 'accordion';
  parentId?: string;
  isParentExpanded: boolean;
  parentElement?: HTMLElement;
  isInAccordion: boolean;
  accordionId?: string;
}

// Error handling types for better form UX
export interface FieldErrorHandlingOptions {
  scrollToError?: boolean;
  expandParent?: boolean;
  highlightDuration?: number;
  focusDelay?: number;
  animateExpansion?: boolean;
}

export interface FormValidationConfig {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  expandParentOnError?: boolean;
  focusFirstError?: boolean;
  debounceValidation?: number;
}

// Advanced field configuration
export interface FieldConfiguration {
  id: string;
  name?: string;
  priority?: number; // For focus order
  group?: string; // Group ID for related fields
  dependencies?: string[]; // Other field IDs this field depends on
  parentExpansion?: {
    enabled: boolean;
    delay?: number;
    highlight?: boolean;
  };
  validation?: {
    immediate?: boolean;
    debounce?: number;
    dependencies?: string[];
  };
}

// Field registry for advanced management
export interface FieldRegistry {
  register: (config: FieldConfiguration) => void;
  unregister: (fieldId: string) => void;
  getConfiguration: (fieldId: string) => FieldConfiguration | null;
  getFieldsByGroup: (groupId: string) => FieldConfiguration[];
  getFieldDependencies: (fieldId: string) => FieldConfiguration[];
  validateDependencies: (fieldId: string) => Promise<boolean>;
}

// Events and callbacks
export interface FieldEventHandlers {
  onFocus?: (fieldId: string, parentInfo?: ParentInfo) => void;
  onBlur?: (fieldId: string) => void;
  onParentExpansion?: (parentId: string, parentType: 'card' | 'accordion') => void;
  onValidationChange?: (fieldId: string, isValid: boolean, error?: string) => void;
  onNavigate?: (fromFieldId: string, toFieldId: string, direction: 'forward' | 'backward') => void;
}

// Integration with external libraries
export interface ExternalIntegration {
  zustand?: {
    store?: any;
    selector?: (state: any) => any;
    actions?: { [key: string]: (...args: any[]) => void };
  };
  reactHookForm?: {
    control?: Control<any>;
    formState?: UseFormStateReturn<any>;
    trigger?: (name?: string | string[]) => Promise<boolean>;
  };
  cardController?: {
    expandCard?: (id: string, highlight?: boolean) => Promise<boolean>;
    collapseCard?: (id: string, highlight?: boolean) => Promise<boolean>;
    isCardExpanded?: (id: string) => boolean;
  };
}

// Performance optimization types
export interface FieldPerformanceOptions {
  debounceValidation?: number;
  throttleFocus?: number;
  virtualizeFields?: boolean;
  lazyValidation?: boolean;
  batchUpdates?: boolean;
  memoizeRendering?: boolean;
}

// Accessibility enhancements
export interface FieldAccessibilityOptions {
  announceErrors?: boolean;
  announceExpansion?: boolean;
  skipLinks?: boolean;
  customAriaLabels?: { [key: string]: string };
  highContrast?: boolean;
  reducedMotion?: boolean;
}

// Complete field system configuration
export interface FieldSystemConfig {
  performance?: FieldPerformanceOptions;
  accessibility?: FieldAccessibilityOptions;
  validation?: FormValidationConfig;
  errorHandling?: FieldErrorHandlingOptions;
  integration?: ExternalIntegration;
  events?: FieldEventHandlers;
  debug?: boolean;
}

// Export utility types
export type FieldElement =
  | HTMLDivElement
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;
export type FocusableElement = HTMLElement & { focus(): void };
export type ValidationSource = 'direct' | 'nested' | 'data-attribute' | 'rhf' | 'default';
export type ParentType = 'card' | 'accordion';
export type NavigationDirection = 'forward' | 'backward' | 'up' | 'down' | 'first' | 'last';

// Re-export common types for convenience
export type {
  Control, ControllerRenderProps, FieldError, FieldPath,
  FieldValues,
  RegisterOptions, UseFormStateReturn
} from 'react-hook-form';

