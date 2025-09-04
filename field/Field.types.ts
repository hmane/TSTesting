import { ReactNode, CSSProperties, RefObject } from 'react';
import { 
  FieldPath, 
  FieldValues, 
  Control, 
  RegisterOptions, 
  FieldError,
  UseFormStateReturn,
  ControllerRenderProps
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

  /** React Hook Form control (optional) */
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

// Component props (unchanged)
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

export interface FieldGroupProps {
  id?: string;
  children: ReactNode;
  labelWidth?: LabelWidthType;
  className?: string;
  style?: CSSProperties;
  spacing?: SpacingType;
  layout?: LayoutType;
  disabled?: boolean;
}

export interface FieldGroupContextType {
  labelWidth: LabelWidthType;
  spacing: SpacingType;
  layout: LayoutType;
  disabled?: boolean;
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

// Form submission
