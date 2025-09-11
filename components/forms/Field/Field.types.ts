import { ReactNode, HTMLAttributes } from 'react';
import { FieldError as RHFFieldError } from 'react-hook-form';

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;

  // Bootstrap grid system (1-12)
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;

  // Field behavior
  offsetLabel?: boolean; // Adds top spacing to align with fields that have labels
  loading?: boolean; // Shows loading state
  disabled?: boolean; // Disables entire field

  // Conditional rendering
  showWhen?: (formValues: any) => boolean;
  dependsOn?: string[]; // Array of field names this field depends on
  clearWhen?: (formValues: any) => boolean;

  // Accessibility
  autoId?: boolean; // Auto-generates IDs and aria relationships
  fieldId?: string; // Custom field ID

  // Debug mode
  debug?: boolean; // Shows debug info in development

  // Additional styling
  textAlign?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg';

  // Custom classes
  className?: string;
  fieldClassName?: string; // Applied to inner field wrapper
}

export interface FieldContextType {
  fieldId?: string;
  labelId?: string;
  descriptionId?: string;
  errorId?: string;
  hasError?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
}

// Re-export react-hook-form FieldError for consistency
export type FieldError = RHFFieldError;

// Grid breakpoint configuration
export interface GridBreakpoints {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

// Field size configurations
export interface FieldSizeConfig {
  padding: string;
  fontSize: string;
  lineHeight: string;
}

export interface FieldSizes {
  sm: FieldSizeConfig;
  md: FieldSizeConfig;
  lg: FieldSizeConfig;
}
