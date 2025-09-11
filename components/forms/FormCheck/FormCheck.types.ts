import { ReactNode, HTMLAttributes, FieldsetHTMLAttributes } from 'react';

export interface FormCheckProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;

  // Layout options
  inline?: boolean; // Display checkboxes/radios inline
  reverse?: boolean; // Show input after label (right-to-left)

  // Visual appearance
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'switch' | 'button'; // For different checkbox/radio styles

  // Grouping (for radio button groups)
  groupName?: string;
  groupLabel?: string;
  groupDescription?: string;

  // Validation state
  invalid?: boolean;
  valid?: boolean;

  // Accessibility
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  fieldsetLegend?: string; // For grouped inputs

  // Custom styling
  className?: string;
  inputClassName?: string;
  labelClassName?: string;

  // Layout spacing
  gutter?: 'none' | 'sm' | 'md' | 'lg';

  // Debug mode
  debug?: boolean;

  // Conditional rendering
  showWhen?: (formValues: any) => boolean;
}

// Separate props interface for when used as fieldset
export interface FormCheckGroupProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'children'> {
  children: ReactNode;
  groupName?: string;
  groupLabel?: string;
  groupDescription?: string;
  fieldsetLegend?: string;
  className?: string;
  debug?: boolean;
}

// Form check size configurations
export interface FormCheckSizeConfig {
  inputSize: string;
  fontSize: string;
  lineHeight: string;
  gutter: string;
  padding: string;
}

export interface FormCheckSizes {
  sm: FormCheckSizeConfig;
  md: FormCheckSizeConfig;
  lg: FormCheckSizeConfig;
}

// Form check variants
export type FormCheckVariant = 'default' | 'switch' | 'button';

// Gutter size options
export type FormCheckGutter = 'none' | 'sm' | 'md' | 'lg';

// Form check configuration
export interface FormCheckConfig {
  defaultGutter: FormCheckGutter;
  switchWidth: string;
  switchHeight: string;
  buttonPadding: string;
  buttonBorderRadius: string;
}
