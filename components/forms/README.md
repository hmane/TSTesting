# SPFx Forms Components

A comprehensive, responsive form component library for SharePoint Framework (SPFx) applications built with React and TypeScript. Inspired by Bootstrap's form system with modern enhancements for accessibility, validation, and developer experience.

## 🚀 Features

- **Responsive Grid System**: Bootstrap-inspired responsive columns (xs, sm, md, lg, xl)
- **React Hook Form Integration**: Seamless integration with react-hook-form for validation
- **Accessibility First**: Full ARIA support, keyboard navigation, and screen reader compatibility
- **Multiple Component Libraries**: Works with DevExtreme, Fluent UI, PnP React, and custom components
- **TypeScript**: Fully typed with comprehensive interfaces
- **Flexible Layouts**: Vertical, horizontal, and auto-responsive field layouts
- **Rich Validation**: Multiple error formats, validation states, and custom error displays
- **Extensible**: Easy to customize and extend for specific needs

## 📦 Installation

Since this is part of your SPFx solution, simply include the `forms` folder in your project structure:

```
src/
├── forms/
│   ├── Field/
│   ├── FieldRow/
│   ├── FormLabel/
│   ├── FormError/
│   ├── FormDescription/
│   ├── FormCheck/
│   ├── styles/
│   ├── utils/
│   └── index.ts
```

## 🎯 Quick Start

### Basic Usage

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Field,
  FieldRow,
  FormLabel,
  FormError,
  FormDescription
} from '../forms';

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Field md={6}>
        <FormLabel htmlFor="firstName" required>
          First Name
        </FormLabel>
        <input
          {...register('firstName', { required: 'First name is required' })}
          className="form-control"
        />
        <FormError error={errors.firstName} />
      </Field>
    </form>
  );
};
```

### Responsive Layout

```tsx
<FieldRow>
  <Field xs={12} md={6}>
    <FormLabel htmlFor="firstName" required>First Name</FormLabel>
    <input {...register('firstName')} className="form-control" />
    <FormError error={errors.firstName} />
  </Field>

  <Field xs={12} md={6}>
    <FormLabel htmlFor="lastName" required>Last Name</FormLabel>
    <input {...register('lastName')} className="form-control" />
    <FormError error={errors.lastName} />
  </Field>
</FieldRow>
```

## 🧩 Components

### Field

The main container component that provides responsive grid layout and field context.

```tsx
<Field
  md={6}                    // Responsive column size
  offsetLabel={true}        // Align with fields that have labels
  loading={false}           // Show loading state
  debug={false}             // Debug mode for development
  size="md"                 // sm | md | lg
  textAlign="left"          // left | center | right
>
  {children}
</Field>
```

**Props:**
- `xs`, `sm`, `md`, `lg`, `xl`: Responsive column sizes (1-12)
- `offsetLabel`: Adds spacing to align with fields that have labels
- `loading`: Shows loading skeleton
- `disabled`: Disables the entire field
- `size`: Field size variant
- `textAlign`: Text alignment for field content
- `debug`: Shows debug information in development

### FieldRow

Horizontal container for grouping fields with flexbox controls.

```tsx
<FieldRow
  noGutters={false}         // Remove spacing between fields
  alignItems="stretch"      // Flex alignment
  justifyContent="start"    // Flex justification
  gutterSize="md"           // xs | sm | md | lg | xl
>
  {children}
</FieldRow>
```

### FormLabel

Enhanced label component with required indicators and info tooltips.

```tsx
<FormLabel
  htmlFor="fieldId"
  required={true}                              // Show red asterisk
  info="Additional information"                // Tooltip content
  infoPlacement="top"                         // Tooltip position
  size="md"                                   // sm | md | lg
  weight="semibold"                           // Font weight
  color="default"                             // Label color variant
>
  Field Label
</FormLabel>
```

**Features:**
- Required field indicator (red asterisk)
- Info tooltips with string or JSX content
- Configurable tooltip placement
- Size and styling variants
- Automatic accessibility attributes

### FormError

Comprehensive error display component with validation states.

```tsx
<FormError
  error={errors.fieldName}        // React Hook Form error
  showIcon={true}                 // Display error icon
  showSuccess={false}             // Show success state
  validationState="invalid"       // Validation state
  variant="default"               // Display variant
  animated={true}                 // Smooth animations
/>
```

**Supported Error Types:**
- String messages
- React Hook Form error objects
- Arrays of errors
- Custom error formats

**Validation States:**
- `idle`: No validation
- `validating`: Shows loading indicator
- `valid`: Success state
- `invalid`: Error state

### FormDescription

Help text component with multiple variants and conditional display.

```tsx
<FormDescription
  variant="help"                  // default | muted | help | warning | info
  placement="below-field"         // Positioning relative to field
  showIcon={true}                 // Display variant icon
  hideOnError={false}             // Hide when field has error
  animated={true}                 // Smooth transitions
>
  Helpful description text
</FormDescription>
```

### FormCheck

Container for checkboxes and radio buttons with multiple display variants.

```tsx
<FormCheck
  variant="default"               // default | switch | button
  size="md"                       // sm | md | lg
  inline={false}                  // Inline layout
  reverse={false}                 // Input after label
  groupName="radioGroup"          // For radio button groups
>
  <input type="checkbox" className="form-check-input" />
  <FormLabel className="form-check-label">
    Check me out
  </FormLabel>
</FormCheck>
```

**Variants:**
- `default`: Standard checkboxes/radios
- `switch`: Toggle switch appearance
- `button`: Button-style checkboxes

## 🎨 Styling

### CSS Classes

The components use CSS modules with Bootstrap-extracted styles. Key classes:

- `.form-control`: Applied to input elements
- `.form-check-input`: Applied to checkbox/radio inputs
- `.form-check-label`: Applied to checkbox/radio labels

### Size Variants

All components support three size variants:
- `sm`: Small/compact
- `md`: Medium/default
- `lg`: Large

### Responsive Grid

Uses Bootstrap's 12-column grid system:
- `xs`: <576px
- `sm`: ≥576px
- `md`: ≥768px
- `lg`: ≥992px
- `xl`: ≥1200px

## 🔧 Integration Examples

### With DevExtreme

```tsx
<Field md={6}>
  <FormLabel htmlFor="skills" info="Select your primary skills">
    Technical Skills
  </FormLabel>
  <TagBox
    dataSource={skillsData}
    displayExpr="name"
    valueExpr="id"
    onValueChanged={(e) => setValue('skills', e.value)}
  />
  <FormError error={errors.skills} />
</Field>
```

### With Fluent UI

```tsx
<Field md={4}>
  <FormLabel htmlFor="department" required>
    Department
  </FormLabel>
  <Dropdown
    options={departmentOptions}
    onChange={(_, option) => setValue('department', option?.key)}
  />
  <FormError error={errors.department} />
</Field>
```

### With Custom Components

```tsx
<Field md={8}>
  <FormLabel htmlFor="customField" info="This is a custom component">
    Custom Field
  </FormLabel>
  <MyCustomComponent
    value={value}
    onChange={onChange}
    error={!!errors.customField}
  />
  <FormDescription variant="info">
    This field uses a custom component
  </FormDescription>
  <FormError error={errors.customField} />
</Field>
```

## ♿ Accessibility

### Automatic Features

- Auto-generated field IDs and ARIA relationships
- Proper label associations
- Screen reader announcements for errors
- Keyboard navigation support
- High contrast mode support

### Manual Enhancements

```tsx
import { enhanceFormControl, announceToScreenReader } from '../forms';

// Enhance any form control
enhanceFormControl(inputElement, fieldIds, {
  hasError: true,
  isRequired: true,
  hasDescription: true
});

// Announce to screen readers
announceToScreenReader('Form submitted successfully', 'polite');
```

## 🐛 Debug Mode

Enable debug mode for development insights:

```tsx
<Field debug>
  <FormLabel debug>Label</FormLabel>
  <input className="form-control" />
  <FormError debug error={error} />
</Field>
```

Debug mode shows:
- Component boundaries
- Field IDs and relationships
- Validation states
- Layout information

## 🎯 Best Practices

### 1. Use Semantic HTML

```tsx
// ✅ Good
<Field>
  <FormLabel htmlFor="email">Email</FormLabel>
  <input type="email" className="form-control" />
</Field>

// ❌ Avoid
<Field>
  <div>Email</div>
  <div><input /></div>
</Field>
```

### 2. Consistent Validation

```tsx
// ✅ Good - Use react-hook-form consistently
const { register, formState: { errors } } = useForm();

<input {...register('email', {
  required: 'Email is required',
  pattern: { value: /^[^@]+@[^@]+$/, message: 'Invalid email' }
})} />
<FormError error={errors.email} />
```

### 3. Responsive Design

```tsx
// ✅ Good - Mobile-first responsive design
<FieldRow>
  <Field xs={12} md={6}>...</Field>
  <Field xs={12} md={6}>...</Field>
</FieldRow>
```

### 4. Progressive Enhancement

```tsx
// ✅ Good - Graceful degradation
<FormDescription
  hideOnError={true}
  animated={true}
>
  Help text that hides when there's an error
</FormDescription>
```

## 🔧 Advanced Usage

### Custom Validation States

```tsx
<FormError
  validationState="validating"
  validatingIcon={<Spinner />}
>
  Checking availability...
</FormError>
```

### Conditional Fields

```tsx
<Field showWhen={(values) => values.userType === 'admin'}>
  <FormLabel>Admin Only Field</FormLabel>
  <input className="form-control" />
</Field>
```

### Complex Layouts

```tsx
<FieldRow>
  <Field md={8}>
    <FormLabel>Main Content</FormLabel>
    <textarea className="form-control" rows={4} />
  </Field>

  <Field md={4}>
    <Field offsetLabel>
      <button type="button" className="btn btn-secondary">
        Add Attachment
      </button>
    </Field>

    <Field>
      <FormCheck variant="switch">
        <input type="checkbox" className="form-check-input" />
        <FormLabel className="form-check-label">
          Enable notifications
        </FormLabel>
      </FormCheck>
    </Field>
  </Field>
</FieldRow>
```

## 📝 TypeScript Support

Full TypeScript support with comprehensive interfaces:

```tsx
import type {
  FieldProps,
  FormLabelProps,
  FieldError,
  ValidationState
} from '../forms';

interface MyFormData {
  firstName: string;
  email: string;
  department: string;
}

const MyForm: React.FC = () => {
  const { register, formState: { errors } } = useForm<MyFormData>();
  // ... rest of component
};
```

## 🤝 Contributing

When extending or modifying these components:

1. Maintain TypeScript strict mode compliance
2. Follow accessibility guidelines (WCAG 2.1 AA)
3. Test with screen readers
4. Ensure responsive behavior
5. Add comprehensive JSDoc comments
6. Update this README with new features

## 📄 License

This form component library is part of your SPFx solution and follows your project's licensing terms.
