// Main Field component (now with RHF support)
export { Field } from './Field';

// Child components
export { Description } from './components/Description';
export { Error } from './components/Error'; // Enhanced with RHF
export { FieldGroup } from './components/FieldGroup';
export { Label } from './components/Label';

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
  debounce, extractErrorMessage, findFieldElements, focusFirstElement, generateFieldClasses, generateFieldId, generateFieldStyles, getReactProps, hasLabelComponent, scanElementValidation, scrollToElement
} from './utils/fieldUtils';

// TypeScript types (enhanced with RHF)
export type {
  DescriptionProps,
  ErrorProps, FieldContextType,
  FieldGroupContextType, FieldGroupProps, FieldProps, FieldRegistration, FieldRenderProps, FieldValidationMap, FieldValidationState, LabelProps, LabelWidthType, LayoutType, SpacingType, ValidationResult, ValidationState
} from './Field.types';

// Compound component pattern
import { Field as FieldComponent } from './Field';
import { Description } from './components/Description';
import { Error } from './components/Error';
import { FieldGroup } from './components/FieldGroup';
import { Label } from './components/Label';

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
