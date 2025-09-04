# Field Component with React Hook Form Integration

A powerful, accessible, and performant field component system for SharePoint Framework applications. Built with modern React patterns, Fluent UI integration, and seamless React Hook Form support.

## 🚀 Features

- 🎯 **React Hook Form Integration** - Seamless form state management with zero re-renders
- 📱 **Responsive Design** - Auto-stacking on mobile with configurable breakpoints
- ⚡ **Zero Re-renders** - Uncontrolled inputs with RHF for optimal performance
- 🎛️ **Global Focus Controller** - Centralized field management and validation
- ♿ **Accessibility First** - ARIA attributes, keyboard navigation, screen reader support
- 🎨 **Fluent UI Integration** - SharePoint design tokens and components
- 🔍 **Smart Validation** - Combines RHF validation with custom field scanning
- 📊 **TypeScript First** - Full type safety and IntelliSense support
- 🔄 **Backward Compatible** - Works with or without React Hook Form

## 📦 Installation

```bash
npm install react-hook-form
```

## 🎯 Basic Usage

### Simple Form with React Hook Form

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import Field from './field';

interface FormData {
  email: string;
  firstName: string;
  department: string;
}

const MyForm: React.FC = () => {
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      firstName: '',
      department: ''
    }
  });

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    // Save to SharePoint
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* RHF-powered field with validation */}
      <Field
        name="email"
        control={control}
        rules={{
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
          }
        }}
      >
        <Field.Label required>Email Address</Field.Label>
        <Field.Description>
          Enter your corporate email address
        </Field.Description>
        {({ field }) => (
          <input
            type="email"
            {...field}
            placeholder="john@company.com"
          />
        )}
        <Field.Error />
      </Field>

      {/* Traditional field without RHF (backward compatible) */}
      <Field>
        <Field.Label>Department</Field.Label>
        <select>
          <option value="">Select Department</option>
          <option value="IT">IT</option>
          <option value="HR">HR</option>
        </select>
      </Field>

      <button type="submit" disabled={!isValid}>
        Submit Form
      </button>
    </form>
  );
};
```

## 🔧 Component API

### Field Props

```typescript
interface FieldProps<TFieldValues extends FieldValues = FieldValues> {
  // React Hook Form integration
  name?: FieldPath<TFieldValues>;           // Field name for RHF
  control?: Control<TFieldValues>;          // RHF control object
  rules?: RegisterOptions<TFieldValues>;    // RHF validation rules
  onFieldChange?: (value: any) => void;     // Field change callback

  // Field configuration
  id?: string;                              // Field identifier
  layout?: 'auto' | 'horizontal' | 'vertical'; // Layout direction
  disabled?: boolean;                       // Disabled state
  labelWidth?: number | 'auto' | 'compact' | 'normal' | 'wide';
  
  // Manual validation (overrides RHF)
  isValid?: boolean;                        // Manual validation state
  error?: string;                          // Manual error message
  
  // Styling
  backgroundColor?: string;                 // Custom background
  className?: string;                      // CSS classes
  style?: CSSProperties;                   // Inline styles
  
  // Advanced features
  autoFocus?: boolean;                     // Auto focus on mount
  lazy?: boolean;                          // Lazy loading
  loadingComponent?: ReactNode;            // Custom loading component
  
  // Callbacks
  onFocus?: () => void;                    // Focus callback
  onLoad?: () => void;                     // Lazy load callback
  
  // Children
  children: ReactNode | ((props: FieldRenderProps) => ReactNode);
}
```

### Render Props Pattern

For advanced usage, use the render props pattern to access field state:

```typescript
<Field
  name="email"
  control={control}
  rules={{ required: 'Email is required' }}
>
  <Field.Label required>Email</Field.Label>
  {({ field, fieldState, formState }) => (
    <div>
      <input 
        {...field} 
        className={fieldState.invalid ? 'error' : ''} 
      />
      {fieldState.isTouched && fieldState.invalid && (
        <span>Field has errors</span>
      )}
    </div>
  )}
  <Field.Error />
</Field>
```

## 🎨 Layout and Styling

### Responsive Layouts

```typescript
// Auto layout - horizontal on desktop, vertical on mobile
<Field layout="auto">
  <Field.Label>Responsive Field</Field.Label>
  <input />
</Field>

// Always horizontal
<Field layout="horizontal">
  <Field.Label>Horizontal Field</Field.Label>
  <input />
</Field>

// Always vertical
<Field layout="vertical">
  <Field.Label>Vertical Field</Field.Label>
  <input />
</Field>
```

### Label Width Control

```typescript
// Numeric width in pixels
<Field labelWidth={200}>
  <Field.Label>Custom Width</Field.Label>
  <input />
</Field>

// Predefined sizes
<Field labelWidth="compact">   {/* 120px */}
<Field labelWidth="normal">    {/* 150px */}
<Field labelWidth="wide">      {/* 200px */}
<Field labelWidth="auto">      {/* Auto-sized */}

// Form-level control
<div className="formWide">
  <Field><Field.Label>Field 1</Field.Label><input /></Field>
  <Field><Field.Label>Field 2</Field.Label><input /></Field>
  {/* All fields use wide labels */}
</div>
```

### Field Groups

```typescript
<Field.Group spacing="compact" labelWidth="wide" layout="horizontal">
  <Field name="firstName" control={control}>
    <Field.Label>First Name</Field.Label>
    {({ field }) => <input {...field} />}
    <Field.Error />
  </Field>
  
  <Field name="lastName" control={control}>
    <Field.Label>Last Name</Field.Label>
    {({ field }) => <input {...field} />}
    <Field.Error />
  </Field>
</Field.Group>
```

## ⚡ Advanced Validation

### Custom Validation Rules

```typescript
<Field
  name="password"
  control={control}
  rules={{
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters'
    },
    validate: {
      hasUppercase: (value) => 
        /[A-Z]/.test(value) || 'Must contain uppercase letter',
      hasNumber: (value) => 
        /\d/.test(value) || 'Must contain a number',
      notCommon: (value) => 
        !['password', '123456'].includes(value) || 'Too common'
    }
  }}
>
  <Field.Label required>Password</Field.Label>
  {({ field }) => <input type="password" {...field} />}
  <Field.Error />
</Field>
```

### Async Validation (SharePoint Integration)

```typescript
<Field
  name="email"
  control={control}
  rules={{
    required: 'Email is required',
    validate: async (value) => {
      // Check if email exists in SharePoint
      try {
        const users = await pnp.sp.web.lists
          .getByTitle('Users')
          .items
          .filter(`Email eq '${value}'`)();
        
        return users.length === 0 || 'Email already exists';
      } catch (error) {
        return 'Unable to validate email';
      }
    }
  }}
>
  <Field.Label required>Email</Field.Label>
  {({ field, fieldState }) => (
    <div>
      <input {...field} />
      {fieldState.isValidating && <span>Checking email...</span>}
    </div>
  )}
  <Field.Error />
</Field>
```

### Cross-Field Validation

```typescript
const { control, watch } = useForm();
const watchPassword = watch('password');
const watchDepartment = watch('department');

// Password confirmation
<Field
  name="confirmPassword"
  control={control}
  rules={{
    required: 'Please confirm your password',
    validate: (value) => 
      value === watchPassword || 'Passwords do not match'
  }}
>
  <Field.Label required>Confirm Password</Field.Label>
  {({ field }) => <input type="password" {...field} />}
  <Field.Error />
</Field>

// Conditional validation
<Field
  name="projectCode"
  control={control}
  rules={{
    required: watchDepartment === 'Finance' ? 'Project code required for Finance' : false
  }}
>
  <Field.Label required={watchDepartment === 'Finance'}>Project Code</Field.Label>
  {({ field }) => <input {...field} />}
  <Field.Error />
</Field>
```

## 🎛️ Focus Management

### Using the Focus Controller

```typescript
import { useFieldFocus } from './field';

const MyForm: React.FC = () => {
  const { control, handleSubmit } = useForm();
  const fieldController = useFieldFocus();

  const handleFormSubmit = async (data: any) => {
    // Validate all fields (both RHF and non-RHF)
    const validation = fieldController.validateAllFields();
    
    if (!validation.isValid) {
      // Focus first invalid field
      fieldController.focusFirstInvalidField();
      console.log('Validation errors:', validation.errors);
      return;
    }

    // Also validate RHF fields specifically
    const rhfValidation = await fieldController.validateRHFFields();
    if (!rhfValidation.isValid) {
      console.log('RHF validation failed');
      return;
    }

    console.log('Form is valid, submitting:', data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Field id="field1" name="firstName" control={control}>
        <Field.Label>First Name</Field.Label>
        {({ field }) => <input {...field} />}
        <Field.Error />
      </Field>

      <Field id="field2" name="lastName" control={control}>
        <Field.Label>Last Name</Field.Label>
        {({ field }) => <input {...field} />}
        <Field.Error />
      </Field>

      <div>
        <button type="button" onClick={() => fieldController.focusFirstField()}>
          Focus First
        </button>
        <button type="button" onClick={() => fieldController.focusNextField('field1')}>
          Focus Next
        </button>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
};
```

### Focus Controller Methods

```typescript
const fieldController = useFieldFocus();

// Focus management
fieldController.focusField('fieldId');           // Focus specific field
fieldController.focusNextField('currentId');     // Focus next field
fieldController.focusPreviousField('currentId'); // Focus previous field
fieldController.focusFirstField();               // Focus first field
fieldController.focusLastField();                // Focus last field

// Validation
fieldController.validateAllFields();             // Validate all fields
fieldController.validateRHFFields();             // Validate RHF fields only
fieldController.focusFirstInvalidField();        // Focus first invalid field

// RHF integration
fieldController.triggerRHFValidation();          // Trigger RHF validation
fieldController.getRHFErrors();                  // Get RHF errors

// Utilities
fieldController.getAllFields();                  // Get all field IDs
fieldController.getValidationStats();            // Get validation statistics
```

## 🔧 Custom Components

### Creating Custom Input Components

```typescript
import React, { forwardRef } from 'react';

// Custom autocomplete component
const CustomAutocomplete = forwardRef<HTMLInputElement, {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
}>(({ value = '', onChange, onBlur, placeholder, error }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState(value);
  
  const options = ['John Doe', 'Jane Smith', 'Mike Wilson'];
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: string) => {
    setSearchTerm(option);
    onChange?.(option);
    setIsOpen(false);
  };

  return (
    <div className={`autocomplete ${error ? 'error' : ''}`}>
      <input
        ref={ref}
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange?.(e.target.value);
        }}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 200);
          onBlur?.();
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="autocomplete-dropdown">
          {filteredOptions.map((option) => (
            <div
              key={option}
              onClick={() => handleSelect(option)}
              className="autocomplete-option"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Usage with Field
<Field
  name="assignedTo"
  control={control}
  rules={{ required: 'Please select an assignee' }}
>
  <Field.Label required>Assigned To</Field.Label>
  <Field.Description>Search and select a team member</Field.Description>
  {({ field, fieldState }) => (
    <CustomAutocomplete
      {...field}
      placeholder="Search for a person..."
      error={fieldState.invalid}
    />
  )}
  <Field.Error />
</Field>
```

## 🎯 SPFx Integration Examples

### SharePoint List Form

```typescript
import { SPFI } from '@pnp/sp';
import { useForm } from 'react-hook-form';
import Field from './field';

interface SharePointFormData {
  Title: string;
  Department: string;
  Manager: string;
  StartDate: string;
}

const SharePointForm: React.FC<{ sp: SPFI; listName: string }> = ({ sp, listName }) => {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<SharePointFormData>();

  const onSubmit = async (data: SharePointFormData) => {
    try {
      await sp.web.lists.getByTitle(listName).items.add(data);
      console.log('Item created successfully');
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Field.Group labelWidth="wide">
        <Field
          name="Title"
          control={control}
          rules={{ 
            required: 'Title is required',
            maxLength: { value: 255, message: 'Title too long' }
          }}
        >
          <Field.Label required>Title</Field.Label>
          {({ field }) => <input {...field} maxLength={255} />}
          <Field.Error />
        </Field>

        <Field
          name="Department"
          control={control}
          rules={{
            required: 'Department is required',
            validate: async (value) => {
              // Validate against SharePoint choice field
              const field = await sp.web.lists
                .getByTitle(listName)
                .fields
                .getByInternalNameOrTitle('Department')();
              
              return field.Choices.includes(value) || 'Invalid department';
            }
          }}
        >
          <Field.Label required>Department</Field.Label>
          {({ field, fieldState }) => (
            <div>
              <select {...field}>
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
              {fieldState.isValidating && <span>Validating...</span>}
            </div>
          )}
          <Field.Error />
        </Field>
      </Field.Group>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Item'}
      </button>
    </form>
  );
};
```

## 🎨 Styling and Theming

### CSS Custom Properties

The component uses CSS custom properties for theming:

```scss
:root {
  // Field colors
  --field-theme-primary: #0078d4;
  --field-theme-error: #d13438;
  --field-theme-success: #107c10;
  
  // Label widths
  --field-label-width-compact: 120px;
  --field-label-width-normal: 150px;
  --field-label-width-wide: 200px;
  
  // Spacing
  --field-spacing-s: 8px;
  --field-spacing-m: 12px;
  --field-spacing-l: 16px;
}
```

### Custom Styling

```scss
// Custom field styling
.my-custom-field {
  .field {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
  }
  
  .fieldLabel {
    color: #005a9a;
    font-weight: 600;
  }
  
  .fieldError {
    background: #fde7e9;
    padding: 8px;
    border-radius: 4px;
  }
}
```

## ♿ Accessibility Features

- **ARIA attributes** - Proper semantic markup
- **Keyboard navigation** - Tab order and focus management
- **Screen readers** - Live regions for errors and status
- **High contrast** - Forced colors support
- **Reduced motion** - Respects user preferences

## 📱 Browser Support

- **Modern Browsers** - Chrome, Edge, Firefox, Safari
- **ES2018+** - Uses modern JavaScript features
- **CSS Grid** - For layout (IE11+ fallback available)
- **React 16.8+** - Hooks support required

## 🔄 Migration Guide

### From Basic Field Component

```typescript
// Before
<Field isValid={emailValid} error={emailError}>
  <Field.Label required>Email</Field.Label>
  <input value={email} onChange={setEmail} />
  <Field.Error />
</Field>

// After (with RHF)
<Field name="email" control={control} rules={{ required: 'Email required' }}>
  <Field.Label required>Email</Field.Label>
  {({ field }) => <input {...field} />}
  <Field.Error />
</Field>

// Still works (backward compatible)
<Field isValid={emailValid} error={emailError}>
  <Field.Label required>Email</Field.Label>
  <input value={email} onChange={setEmail} />
  <Field.Error />
</Field>
```

## 🚀 Performance Tips

1. **Use `mode: 'onChange'`** for real-time validation
2. **Lazy load complex fields** with `lazy={true}`
3. **Group related fields** with `Field.Group`
4. **Use custom components** with `forwardRef` for reusability
5. **Leverage focus controller** for better UX

## 📚 TypeScript Support

Full TypeScript support with form data typing:

```typescript
interface MyFormData {
  email: string;
  age: number;
  preferences: string[];
}

const { control } = useForm<MyFormData>();

// Type-safe field names and validation
<Field<MyFormData>
  name="email"  // ✅ Type-checked
  control={control}
  rules={{ required: true }}
>
  {/* ... */}
</Field>
```

## 🤝 Contributing

The Field component is designed to be extensible. To add new features:

1. Update `Field.types.ts` for new interfaces
2. Enhance `Field.tsx` for new functionality
3. Add tests and documentation
4. Follow existing patterns for consistency

## 📄 License

MIT License - feel free to use in your SPFx projects!
