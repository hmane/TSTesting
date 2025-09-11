// ===========================================
// Forms Package - Main Export
// ===========================================

// Core Components
export { Field, FieldContext, useFieldContext } from './Field';
export { FieldRow } from './FieldRow';
export { FormCheck } from './FormCheck';
export { FormDescription } from './FormDescription';
export { FormError } from './FormError';
export { FormLabel } from './FormLabel';

// Type Exports - Field
export type {
  FieldContextType,
  FieldError, FieldProps, FieldSizeConfig,
  FieldSizes, GridBreakpoints
} from './Field';

// Type Exports - FieldRow
export type {
  FieldRowProps, FlexAlign, FlexDirection, FlexJustify, FlexWrap, GutterSizeConfig,
  GutterSizes
} from './FieldRow';

// Type Exports - FormLabel
export type {
  FormLabelProps, InfoIconConfig, LabelColor, LabelSizeConfig,
  LabelSizes,
  LabelWeight, TooltipPlacement
} from './FormLabel';

// Type Exports - FormError
export type {
  ErrorConfig, ErrorSeverity, ErrorSizeConfig,
  ErrorSizes, ErrorVariant, FieldErrors, FormErrorProps,
  FieldError as FormFieldError, ValidationState
} from './FormError';

// Type Exports - FormDescription
export type {
  DescriptionConfig, DescriptionPlacement, DescriptionSizeConfig,
  DescriptionSizes,
  DescriptionVariant, FormDescriptionProps, IconPosition
} from './FormDescription';

// Type Exports - FormCheck
export type {
  FormCheckConfig, FormCheckGroupProps, FormCheckGutter, FormCheckProps, FormCheckSizeConfig,
  FormCheckSizes,
  FormCheckVariant
} from './FormCheck';

// Utility Exports
export {
  announceToScreenReader, createAriaAttributes, enhanceFormControl, focusUtils, generateFieldIds, generateId, hasScreenReaderSupport, validateAccessibility
} from './utils/accessibility';

// Default exports for convenience
export { default as DefaultField } from './Field';
export { default as DefaultFieldRow } from './FieldRow';
export { default as DefaultFormCheck } from './FormCheck';
export { default as DefaultFormDescription } from './FormDescription';
export { default as DefaultFormError } from './FormError';
export { default as DefaultFormLabel } from './FormLabel';

