// Main Field component (now with RHF support)
export { Field } from './Field';

// Child components
export { Label } from './components/Label';
export { Description } from './components/Description';
export { Error } from './components/Error'; // Enhanced with RHF
export { FieldGroup } from './components/FieldGroup';

// Context and hooks
export { FieldContext, useFieldContext } from './Field';
export { useFieldGroupContext } from './components/FieldGroup';
export { useFieldFocus } from './hooks/useFieldFocus'; // Enhanced with RHF
export { useLazyField } from './hooks/useLazyField';
export { useResponsiveLayout } from './hooks/useResponsiveLayout';

// Controller (enhanced with RHF)
export { focusController } from './controller/FocusController';

// Utility functions
export {
  generateFieldClasses,
  generateFieldStyles,
  hasLabelComponent,
  getReactProps,
  scanElementValidation,
  findFieldElements,
  extractErrorMessage,
  focusFirstElement,
  scrollToElement,
  debounce,
  generateFieldId,
} from './utils/fieldUtils';

// TypeScript types (enhanced with RHF)
export type {
  FieldProps,
  LabelProps,
  DescriptionProps,
  ErrorProps,
  FieldGroupProps,
  FieldContextType,
  FieldGroupContextType,
  ValidationState,
  FieldRegistration,
  ValidationResult,
  FieldValidationState,
  FieldValidationMap,
  FieldRenderProps,
  LayoutType,
  LabelWidthType,
  SpacingType,
} from './Field.types';

// Compound component pattern
import { Field as FieldComponent } from './Field';
import { Label } from './components/Label';
import { Description } from './components/Description';
import { Error } from './components/Error';
import { FieldGroup } from './components/FieldGroup';

// Create compound component
const CompoundField = FieldComponent as typeof FieldComponent & {
  Label: typeof Label;
  Description: typeof Description;
  Error: typeof Error;
  Group: typeof FieldGroup;
};

CompoundField.Label = Label;
CompoundField.Description = Description;
CompoundField.Error = Error;
CompoundField.Group = FieldGroup;

// Export compound component as default
export default CompoundField;
