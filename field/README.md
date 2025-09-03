# Field Component

A flexible, accessible, and performant field component system for SharePoint Framework applications. Built with modern React patterns and Fluent UI integration.

## Features

- 🎯 **CSS-First Alignment** - DevExtreme-like consistent label alignment without containers
- 📱 **Responsive Design** - Auto-stacking on mobile with configurable breakpoints
- ⚡ **Lazy Loading** - Intersection Observer-based content loading for performance
- 🎛️ **Global Focus Controller** - Centralized field management and validation scanning
- ♿ **Accessibility First** - ARIA attributes, keyboard navigation, high contrast support
- 🎨 **Fluent UI Integration** - Uses TooltipHost, Icons, and SharePoint design tokens
- 🔍 **Smart Validation** - Scans nested components for `isValid` properties
- 📊 **Rich Tooltips** - JSX-supported info bubbles to save screen space

## Basic Usage

```typescript
import Field from './components/Field';

// Simple field
<Field id="email" isValid={emailValid} error="Email is required">
  <Field.Label required>Email Address</Field.Label>
  <Field.Description>
    <div>
      <strong>Requirements:</strong>
      <ul>
        <li>Valid email format</li>
        <li>Must be unique</li>
      </ul>
    </div>
  </Field.Description>
  <input 
    type="email" 
    value={email} 
    onChange={setEmail}
  />
  <Field.Error />
</Field>
```

## Advanced Usage

### Responsive Layout
```typescript
<Field layout="auto"> {/* Stacks on mobile */}
<Field layout="horizontal"> {/* Always horizontal */}
<Field layout="vertical"> {/* Always vertical */}
```

### Label Width Control
```typescript
<Field labelWidth={200}> {/* Numeric pixels */}
<Field labelWidth="compact"> {/* 120px */}
<Field labelWidth="normal"> {/* 150px */}
<Field labelWidth="wide"> {/* 200px */}

{/* Form-level control */}
<div className="formWide">
  <Field>...</Field> {/* All fields use wide labels */}
</div>
```

### Lazy Loading
```typescript
<Field lazy onLoad={loadData}>
  <Field.Label>Large Data Table</Field.Label>
  {isLoading ? <Spinner /> : <DataTable data={data} />}
</Field>
```

### Field Groups
```typescript
<Field.Group spacing="compact" labelWidth="wide">
  <Field><Field.Label>Name</Field.Label><input /></Field>
  <Field><Field.Label>Email</Field.Label><input /></Field>
  <Field><Field.Label>Phone</Field.Label><input /></Field>
</Field.Group>
```

### Custom Background
```typescript
<Field backgroundColor="#f0f8ff">
  <Field.Label>Highlighted Field</Field.Label>
  <input />
</Field>
```

## Global Field Management

### Focus Controller Hook
```typescript
import { useFieldFocus } from './components/Field';

const MyForm = () => {
  const fieldController = useFieldFocus();

  const handleSubmit = () => {
    // Validate all fields
    const validation = fieldController.validateAllFields();
    
    if (!validation.isValid) {
      // Focus first invalid field
      fieldController.focusFirstInvalidField();
      console.log('Errors:', validation.errors);
      return;
    }
    
    // Submit form
  };

  const handleNextField = () => {
    fieldController.focusNextField('current-field-id');
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your fields */}
    </form>
  );
};
```

### Validation Scanning
The controller automatically scans for `isValid` properties in nested components:

```typescript
// These will be detected automatically
<Field id="nested">
  <Field.Label>Complex Field</Field.Label>
  <div>
    <CustomInput isValid={false} error="Invalid input" />
    <AnotherComponent>
      <DeepInput isValid={true} />
    </AnotherComponent>
  </div>
  <Field.Error />
</Field>
```

## Component Props

### Field
```typescript
interface FieldProps {
  id?: string;                    // Field identifier
  name?: string;                  // Form field name
  layout?: 'auto' | 'horizontal' | 'vertical';
  disabled?: boolean;
  isValid?: boolean;             // Validation state
  error?: string;                // Error message
  labelWidth?: number | 'auto' | 'compact' | 'normal' | 'wide';
  backgroundColor?: string;       // Custom background color
  lazy?: boolean;                // Enable lazy loading
  loadingComponent?: ReactNode;   // Custom loading component
  autoFocus?: boolean;
  onFocus?: () => void;
  onLoad?: () => void;           // Lazy load callback
  children: ReactNode;
}
```

### Label
```typescript
interface LabelProps {
  children: ReactNode;
  required?: boolean;            // Show * indicator
  htmlFor?: string;             // Override auto-linking
  wrap?: 'normal' | 'break-word' | 'nowrap';
}
```

### Description
```typescript
interface DescriptionProps {
  children: ReactNode;          // JSX tooltip content
  icon?: string;               // Fluent UI icon name
  position?: 'inline' | 'end';
  delay?: number;              // Tooltip delay
}
```

### Error
```typescript
interface ErrorProps {
  children?: ReactNode;         // Custom error message
  animation?: 'slide' | 'fade' | 'none';
  position?: 'below' | 'inline';
}
```

### FieldGroup
```typescript
interface FieldGroupProps {
  labelWidth?: number | 'auto' | 'compact' | 'normal' | 'wide';
  spacing?: 'compact' | 'normal' | 'relaxed';
  layout?: 'horizontal' | 'vertical';
  disabled?: boolean;
}
```

## Styling and Theming

The component uses CSS custom properties for theming:

```scss
:root {
  --field-label-width-global: 150px;    // Global label width
  --field-theme-primary: #0078d4;       // Primary color
  --field-theme-error: #d13438;         // Error color
  --field-spacing-l: 16px;              // Default spacing
}
```

### Form-Level Classes
```scss
.formCompact .field { /* 120px labels */ }
.formWide .field { /* 200px labels */ }
```

## Performance Features

- **Memoized Components** - Minimal re-renders
- **Intersection Observer** - Efficient lazy loading
- **CSS-First Layout** - No JavaScript calculations
- **Debounced Operations** - Smooth user interactions
- **Singleton Controller** - Shared instance across app

## Accessibility Features

- **ARIA Attributes** - Proper semantic markup
- **Keyboard Navigation** - Tab order and focus management
- **Screen Readers** - Live regions for errors
- **High Contrast** - Forced colors support
- **Reduced Motion** - Respects user preferences

## Browser Support

- **Modern Browsers** - Chrome, Edge, Firefox, Safari
- **ES2018+** - Uses modern JavaScript features
- **CSS Grid** - For layout (IE11+ fallback available)
- **Intersection Observer** - With polyfill support

## Migration from React Hook Form

Replace RHF integration with simple props:

```typescript
// Before (RHF)
<Field name="email" control={control} rules={{ required: true }}>

// After
<Field id="email" isValid={emailValid} error={emailError}>
```

The component focuses on UI and layout, letting you handle validation in your preferred way.
