import { ReactNode, HTMLAttributes } from 'react';
import {
  FieldError as RHFFieldError,
  FieldErrors as RHFFieldErrors,
  FieldErrorsImpl,
  Merge,
} from 'react-hook-form';

// Re-export react-hook-form types for consistency
export type FieldError = RHFFieldError;
export type FieldErrors = RHFFieldErrors;

// Internal error type for backward compatibility
export interface CustomFieldError {
  type: string;
  message?: string;
  ref?: React.Ref<any>;
}

// Union type that covers all possible react-hook-form error types
export type AnyFieldError =
  | string
  | FieldError
  | CustomFieldError
  | FieldError[]
  | CustomFieldError[]
  | Merge<FieldError, FieldErrorsImpl<any>> // For field arrays
  | Merge<FieldError, (FieldError | undefined)[]> // For field arrays with undefined
  | null
  | undefined;

export interface FormErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // Error content - accepts any react-hook-form error format
  error?: AnyFieldError;
  children?: ReactNode; // For custom error content

  // Display options
  showIcon?: boolean;
  showSuccess?: boolean; // Show success state when no error
  validationState?: 'idle' | 'validating' | 'valid' | 'invalid';

  // Visual appearance
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'inline' | 'tooltip';

  // Animation
  animated?: boolean;
  animationDuration?: number;

  // Accessibility
  ariaLive?: 'off' | 'polite' | 'assertive';
  role?: string;

  // Custom styling
  className?: string;
  errorClassName?: string;
  successClassName?: string;
  iconClassName?: string;

  // Custom icons
  errorIcon?: ReactNode;
  successIcon?: ReactNode;
  validatingIcon?: ReactNode;

  // Event handlers
  onErrorChange?: (hasError: boolean, errorMessage?: string) => void;

  // Debug mode
  debug?: boolean;
}

// Error size configurations
export interface ErrorSizeConfig {
  fontSize: string;
  lineHeight: string;
  marginTop: string;
  iconSize: string;
}

export interface ErrorSizes {
  sm: ErrorSizeConfig;
  md: ErrorSizeConfig;
  lg: ErrorSizeConfig;
}

// Validation states
export type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

// Error display variants
export type ErrorVariant = 'default' | 'inline' | 'tooltip';

// Error severity levels
export type ErrorSeverity = 'error' | 'warning' | 'info';

// Error configuration
export interface ErrorConfig {
  showIcon: boolean;
  showSuccess: boolean;
  animated: boolean;
  defaultIcon: string;
  successIcon: string;
  validatingIcon: string;
}
