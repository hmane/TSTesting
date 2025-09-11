import { ReactNode, LabelHTMLAttributes } from 'react';

export interface FormLabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'children'> {
  children: ReactNode;

  // Required field indicator
  required?: boolean;

  // Info tooltip
  info?: string | ReactNode;
  infoPlacement?: 'top' | 'bottom' | 'left' | 'right';

  // Accessibility
  htmlFor?: string;
  describedBy?: string;
  ariaLabel?: string;

  // Visual appearance
  size?: 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

  // Layout
  inline?: boolean; // For inline forms
  srOnly?: boolean; // Screen reader only (visually hidden)

  // State
  disabled?: boolean;

  // Custom styling
  className?: string;
  labelClassName?: string;
  requiredClassName?: string;
  infoIconClassName?: string;

  // Tooltip events
  onInfoClick?: (event: React.MouseEvent) => void;
  onInfoHover?: (event: React.MouseEvent) => void;

  // Debug mode
  debug?: boolean;
}

// Label size configurations
export interface LabelSizeConfig {
  fontSize: string;
  lineHeight: string;
  marginBottom: string;
}

export interface LabelSizes {
  sm: LabelSizeConfig;
  md: LabelSizeConfig;
  lg: LabelSizeConfig;
}

// Label weight configurations
export type LabelWeight = 'normal' | 'medium' | 'semibold' | 'bold';

// Label color variants
export type LabelColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

// Tooltip placement options
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

// Info icon configuration
export interface InfoIconConfig {
  size: string;
  color: string;
  hoverColor: string;
  backgroundColor: string;
  hoverBackgroundColor: string;
  borderRadius: string;
}
