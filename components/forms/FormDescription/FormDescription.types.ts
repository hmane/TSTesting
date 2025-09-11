import { ReactNode, HTMLAttributes } from 'react';

export interface FormDescriptionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;

  // Visual appearance
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted' | 'help' | 'warning' | 'info';

  // Layout options
  placement?: 'below-label' | 'below-field' | 'inline';

  // Icon support
  showIcon?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';

  // Accessibility
  id?: string;
  ariaLabel?: string;

  // Custom styling
  className?: string;
  textClassName?: string;
  iconClassName?: string;

  // Conditional display
  showWhen?: (formValues: any) => boolean;
  hideOnError?: boolean; // Hide when field has error
  hideOnSuccess?: boolean; // Hide when field is valid

  // Animation
  animated?: boolean;

  // Debug mode
  debug?: boolean;
}

// Description size configurations
export interface DescriptionSizeConfig {
  fontSize: string;
  lineHeight: string;
  marginTop: string;
  iconSize: string;
}

export interface DescriptionSizes {
  sm: DescriptionSizeConfig;
  md: DescriptionSizeConfig;
  lg: DescriptionSizeConfig;
}

// Description variants
export type DescriptionVariant = 'default' | 'muted' | 'help' | 'warning' | 'info';

// Description placement options
export type DescriptionPlacement = 'below-label' | 'below-field' | 'inline';

// Icon position options
export type IconPosition = 'left' | 'right';

// Description configuration
export interface DescriptionConfig {
  showIcon: boolean;
  animated: boolean;
  defaultIcons: {
    [key in DescriptionVariant]: string;
  };
}
