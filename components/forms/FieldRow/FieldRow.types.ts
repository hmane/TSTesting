import { ReactNode, HTMLAttributes } from 'react';

export interface FieldRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;

  // Layout options
  noGutters?: boolean; // Removes gutters between columns
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

  // Responsive behavior
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';

  // Spacing
  gutterSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  // Debug mode
  debug?: boolean;

  // Custom classes
  className?: string;

  // Conditional rendering
  showWhen?: (formValues: any) => boolean;
}

// Gutter size configurations
export interface GutterSizeConfig {
  padding: string;
  margin: string;
}

export interface GutterSizes {
  xs: GutterSizeConfig;
  sm: GutterSizeConfig;
  md: GutterSizeConfig;
  lg: GutterSizeConfig;
  xl: GutterSizeConfig;
}

// Flexbox alignment types
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
