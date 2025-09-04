# Smart Field & Card System for SharePoint Framework

A powerful, intelligent form component system that combines responsive Field components with smart Card/Accordion containers. Built with React Hook Form integration, automatic parent expansion, and comprehensive focus management.

## 🚀 Features

### **Smart Parent Detection & Expansion**
- 🎯 **Automatic Card Expansion** - Fields detect parent Cards/Accordions and expand them when focused
- 🔄 **Seamless Navigation** - Form validation errors automatically expand and focus the relevant card
- 🧠 **Context Awareness** - Fields intelligently adapt to their container environment
- ⚡ **Performance Optimized** - Lazy detection and efficient DOM traversal

### **React Hook Form Integration**
- 📋 **Zero Re-renders** - Uncontrolled inputs with optimal performance
- ✅ **Advanced Validation** - Built-in and custom validation rules
- 🎛️ **Global Form Control** - Centralized state management with RHF
- 🔗 **Control Propagation** - FieldGroup passes control to child fields automatically

### **Responsive Design & Accessibility**
- 📱 **Mobile First** - Auto-stacking layouts on mobile devices
- ♿ **WCAG 2.1 AA** - Full accessibility compliance
- 🎨 **SharePoint Theming** - Fluent UI design tokens integration
- 🌐 **RTL Support** - International localization ready

### **Advanced Focus Management**
- 🎯 **Smart Focus Controller** - Centralized field focus and validation management
- 🔍 **Error Navigation** - Automatic focusing of validation errors
- ⌨️ **Keyboard Navigation** - Full keyboard accessibility with tab order
- 📍 **Scroll Management** - Smart scrolling to focused elements

## 📦 Installation

```bash
# Required dependencies
npm install react-hook-form

# Optional: For advanced state management
npm install zustand
```

## 🎯 Basic Usage

### **Simple Form with Smart Cards**

```typescript
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Card, Header, Content } from './Card';
import Field from './field';

interface FormData {
  email: string;
  firstName: string;
  department: string;
}

const SmartForm: React.FC = () => {
  const methods = useForm<FormData>({
    mode: 'onChange',
    defaultValues: { email: '', firstName: '', department: '' }
  });

  const { control, handleSubmit } = methods;

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Card automatically expands when fields inside are focused */}
        <Card id="user-info" defaultExpanded={false}>
          <Header>User Information</Header>
          <Content>
            <Field.Group labelWidth="wide" control={control}>
              {/* Field automatically expands parent card when focused */}
              <Field
                name="firstName"
                rules={{ required: 'First name is required' }}
                expandParent={true} // Default: true
              >
                <Field.Label required>First Name</Field.Label>
                {({ field }) => <input {...field} />}
                <Field.Error />
              </Field>

              <Field
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email'
                  }
                }}
              >
                <Field.Label required>Email</Field.Label>
                {({ field }) => <input type="email" {...field} />}
                <Field.Error />
              </Field>
            </Field.Group>
          </Content>
        </Card>

        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
};
```

### **Accordion with Smart Field Navigation**

```typescript
import { Accordion } from './Card/Accordion';
import { useFormSubmission } from './field/hooks/useFieldFocus';

const AccordionForm: React.FC = () => {
  const methods = useForm<FormData>();
  const { handleSubmissionErrors } = useFormSubmission();

  const onSubmit = handleSubmissionErrors(
    async (data) => {
      // Success handler
      console.log('Valid data:', data);
    },
    (errors) => {
      // Error handler - automatically focuses first error and expands parent
      console.log('Validation errors:', errors);
    }
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Accordion id="user-accordion" allowMultiple={false}>
          <Card id="basic-info">
            <Header>Basic Information</Header>
            <Content>
              <Field.Group control={methods.control}>
                <Field name="firstName" rules={{ required: true }}>
                  <Field.Label required>First Name</Field.Label>
                  {({ field }) => <input {...field} />}
                  <Field.Error />
                </Field>
              </Field.Group>
            </Content>
          </Card>

          <Card id="contact-info">
            <Header>Contact Information</Header>
            <Content>
              <Field.Group control={methods.control}>
                <Field name="email" rules={{ required: true }}>
                  <Field.Label required>Email</Field.Label>
                  {({ field }) => <input type="email" {...field} />}
                  <Field.Error />
                </Field>
              </Field.Group>
            </Content>
          </Card>
        </Accordion>
      </form>
    </FormProvider>
  );
};
```

## 🔧 Component API

### **Field Component**

```typescript
interface FieldProps<TFieldValues extends FieldValues = FieldValues> {
  // React Hook Form Integration
  name?: FieldPath<TFieldValues>;           // Field name for RHF
  control?: Control<TFieldValues>;          // RHF control object
  rules?: RegisterOptions<TFieldValues>;    // Validation rules

  // Smart Parent Expansion
  expandParent?: boolean;                   // Auto-expand parent card (default: true)

  // Layout & Styling
  layout?: 'auto' | 'horizontal' | 'vertical';
  labelWidth?: number | 'auto' | 'compact' | 'normal' | 'wide';
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;

  // Manual Validation (overrides RHF)
  isValid?: boolean;
  error?: string;

  // Advanced Features
  autoFocus?: boolean;                      // Auto-focus on mount
  lazy?: boolean;                          // Lazy load content
  loadingComponent?: ReactNode;

  // Event Handlers
  onFocus?: () => void;
  onLoad?: () => void;
  onFieldChange?: (value: any) => void;

  // Children
  children: ReactNode | ((props: FieldRenderProps) => ReactNode);
}
```

### **Enhanced FieldGroup with Control Propagation**

```typescript
interface FieldGroupProps {
  // Layout Configuration
  labelWidth?: LabelWidthType;
  spacing?: 'compact' | 'normal' | 'relaxed';
  layout?: 'auto' | 'horizontal' | 'vertical';
  
  // RHF Integration - NEW!
  control?: Control<any>;                   // Propagates to child fields
  
  // Styling
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  
  children: ReactNode;
}

// Usage with control propagation
<Field.Group control={control} labelWidth="wide">
  {/* Child fields automatically inherit control */}
  <Field name="firstName" rules={{ required: true }}>
    <Field.Label>First Name</Field.Label>
    {({ field }) => <input {...field} />}
  </Field>
  
  <Field name="lastName" rules={{ required: true }}>
    <Field.Label>Last Name</Field.Label>
    {({ field }) => <input {...field} />}
  </Field>
</Field.Group>
```

### **Card Component (Pure UI)**

```typescript
interface CardProps {
  id: string;                              // Required for parent detection
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
  size?: 'compact' | 'regular' | 'large' | 'full-width';
  defaultExpanded?: boolean;
  allowExpand?: boolean;
  allowMaximize?: boolean;
  
  // No form knowledge - stays pure!
  children: ReactNode;
}
```

## 🎛️ Advanced Focus Management

### **useFieldFocus Hook**

```typescript
import { useFieldFocus } from './field/hooks/useFieldFocus';

const MyForm = () => {
  const fieldController = useFieldFocus();

  // Smart focus with parent expansion
  const handleFocusField = async () => {
    await fieldController.focusField('email', true); // true = expand parent
  };

  // Validate and focus first error
  const handleValidate = async () => {
    const result = await fieldController.validateAndFocus();
    console.log('Validation result:', result);
  };

  // Handle form submission errors
  const handleFormErrors = async (errors: any) => {
    const focused = await fieldController.handleFormErrors(errors);
    if (focused) {
      console.log('Focused first error field');
    }
  };

  return (
    <div>
      <button onClick={handleFocusField}>Focus Email Field</button>
      <button onClick={handleValidate}>Validate All</button>
    </div>
  );
};
```

### **Available Methods**

```typescript
// Enhanced focus with parent expansion
focusField(id: string, expandParent?: boolean): Promise<boolean>
scrollToField(id: string, expandParent?: boolean): Promise<boolean>
focusFirstInvalidField(container?: HTMLElement, expandParent?: boolean): Promise<boolean>

// Smart form validation
validateAndFocus(container?: HTMLElement): Promise<FormSubmissionResult>
handleFormErrors(errors: {[fieldName: string]: string}): Promise<boolean>

// Advanced navigation
handleTabNavigation(currentId: string, direction: 'forward' | 'backward'): Promise<boolean>
focusFieldInGroup(groupId: string, fieldIndex: number): Promise<boolean>

// Batch operations
focusFieldsInSequence(fieldIds: string[], delay?: number): Promise<boolean[]>

// Statistics and debugging
getValidationStats(): ValidationStats
getDebugInfo(): FieldDebugInfo
```

## 🎨 Layout & Styling

### **Responsive Label Widths**

```typescript
// Global label width control (DevExtreme style)
<div className="formWide">
  <Field.Group> {/* All fields use wide labels */}
    <Field name="email">
      <Field.Label>Email Address</Field.Label>
      {({ field }) => <input {...field} />}
    </Field>
  </Field.Group>
</div>

// Individual field control
<Field labelWidth={200}>          {/* Pixels */}
<Field labelWidth="compact">      {/* 120px */}
<Field labelWidth="normal">       {/* 150px */}
<Field labelWidth="wide">         {/* 200px */}
<Field labelWidth="auto">         {/* Auto-sized */}

// FieldGroup propagation
<Field.Group labelWidth="wide">
  {/* All child fields inherit wide labels */}
</Field.Group>
```

### **Layout Options**

```typescript
// Auto-responsive (horizontal on desktop, vertical on mobile)
<Field layout="auto">
  <Field.Label>Auto Layout</Field.Label>
  <input />
</Field>

// Always horizontal
<Field layout="horizontal">
  <Field.Label>Horizontal</Field.Label>
  <input />
</Field>

// Always vertical  
<Field layout="vertical">
  <Field.Label>Vertical</Field.Label>
  <input />
</Field>
```

### **CSS Custom Properties**

```scss
:root {
  // Label widths
  --field-label-width-compact: 120px;
  --field-label-width-normal: 150px;
  --field-label-width-wide: 200px;
  
  // Colors
  --field-theme-primary: #0078d4;
  --field-theme-error: #d13438;
  --field-theme-success: #107c10;
  
  // Spacing
  --field-spacing-s: 8px;
  --field-spacing-m: 12px;
  --field-spacing-l: 16px;
}
```

## 🔄 Smart Parent Detection

### **How It Works**

1. **Detection**: Field components scan up the DOM tree to find parent Cards/Accordions
2. **Expansion**: When focused, fields automatically expand collapsed parents
3. **Fallback**: Graceful degradation when card controller is not available
4. **Performance**: Lazy detection only when needed

```typescript
// Field automatically detects and expands this card
<Card id="user-card" defaultExpanded={false}>
  <Header>User Information</Header>
  <Content>
    <Field name="email" expandParent={true}>
      {/* When this field is focused, the card automatically expands */}
      <Field.Label>Email</Field.Label>
      {({ field }) => <input {...field} />}
    </Field>
  </Content>
</Card>
```

### **Parent Detection API**

```typescript
import { useParentDetection } from './field/hooks/useParentDetection';

const MyField = () => {
  const { detectParent, expandParentCard } = useParentDetection();
  const fieldRef = useRef<HTMLDivElement>(null);

  const handleFocus = async () => {
    const parentInfo = detectParent(fieldRef);
    
    if (parentInfo && !parentInfo.isExpanded) {
      if (parentInfo.type === 'card') {
        await expandParentCard(parentInfo.id);
      }
    }
  };

  return <div ref={fieldRef} onFocus={handleFocus}>...</div>;
};
```

## ⚡ Performance Features

### **Lazy Loading Fields**

```typescript
<Field lazy={true} loadingComponent={<CustomLoader />}>
  <Field.Label>Lazy Field</Field.Label>
  {({ field }) => (
    <ExpensiveComponent {...field} />
  )}
</Field>
```

### **Debounced Validation**

```typescript
<Field 
  name="email"
  rules={{
    validate: async (value) => {
      // Debounced async validation
      const isValid = await validateEmailAsync(value);
      return isValid || 'Email already exists';
    }
  }}
>
  <Field.Label>Email</Field.Label>
  {({ field, fieldState }) => (
    <div>
      <input {...field} />
      {fieldState.isValidating && <span>Checking...</span>}
    </div>
  )}
  <Field.Error />
</Field>
```

### **Batch Operations**

```typescript
const fieldController = useFieldFocus();

// Focus multiple fields in sequence
await fieldController.focusFieldsInSequence(
  ['firstName', 'lastName', 'email'],
  200 // 200ms delay between focuses
);

// Validate specific fields
const result = await fieldController.validateAndFocus(
  document.querySelector('#user-section')
);
```

## 🧪 Testing

### **Component Testing**

```typescript
import { render, fireEvent, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import Field from './field';

const TestWrapper = ({ children }) => {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
};

test('field expands parent card when focused', async () => {
  render(
    <TestWrapper>
      <Card id="test-card" defaultExpanded={false}>
        <Content>
          <Field name="email" expandParent={true}>
            <Field.Label>Email</Field.Label>
            {({ field }) => <input {...field} />}
          </Field>
        </Content>
      </Card>
    </TestWrapper>
  );

  const input = screen.getByLabelText('Email');
  fireEvent.focus(input);

  // Card should expand automatically
  await waitFor(() => {
    expect(screen.getByTestId('card-content')).toBeVisible();
  });
});
```

### **Focus Controller Testing**

```typescript
import { focusController } from './field/controller/FocusController';

test('focus controller validates and focuses errors', async () => {
  // Register test fields
  focusController.registerField('field1', mockRegistration);
  focusController.registerField('field2', mockRegistration);

  // Validate and focus first error
  const result = await focusController.validateAndFocus();
  
  expect(result.isValid).toBe(false);
  expect(result.firstErrorFocused).toBe(true);
});
```

## 🛠️ SharePoint Integration

### **SPFx List Form Example**

```typescript
import { SPFI } from '@pnp/sp';
import { useForm } from 'react-hook-form';

interface SharePointItem {
  Title: string;
  Department: string;
  Manager: { Id: number; Title: string };
}

const SharePointForm: React.FC<{ sp: SPFI; listName: string }> = ({ sp, listName }) => {
  const methods = useForm<SharePointItem>();
  const { handleSubmissionErrors } = useFormSubmission();

  const onSubmit = handleSubmissionErrors(
    async (data) => {
      // Create SharePoint item
      await sp.web.lists.getByTitle(listName).items.add(data);
      console.log('Item created successfully');
    },
    (errors) => {
      console.log('Validation failed:', errors);
      // Focus automatically handled by handleSubmissionErrors
    }
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Card id="sharepoint-form">
          <Header>New Item</Header>
          <Content>
            <Field.Group control={methods.control} labelWidth="wide">
              <Field
                name="Title"
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
                rules={{
                  required: 'Department is required',
                  validate: async (value) => {
                    // Validate against SharePoint choice field
                    const choices = await getSharePointChoices(sp, listName, 'Department');
                    return choices.includes(value) || 'Invalid department';
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
                    </select>
                    {fieldState.isValidating && <span>Validating...</span>}
                  </div>
                )}
                <Field.Error />
              </Field>
            </Field.Group>
          </Content>
        </Card>
      </form>
    </FormProvider>
  );
};
```

## 🎯 Migration Guide

### **From Basic Field Component**

```typescript
// Before: Manual validation and card expansion
<Card id="my-card" defaultExpanded={cardExpanded}>
  <Header onClick={() => setCardExpanded(!cardExpanded)}>
    User Info
  </Header>
  <Content>
    <Field isValid={emailValid} error={emailError}>
      <Field.Label required>Email</Field.Label>
      <input 
        value={email} 
        onChange={(e) => {
          setEmail(e.target.value);
          validateEmail(e.target.value);
        }}
      />
      <Field.Error />
    </Field>
  </Content>
</Card>

// After: Smart automatic behavior
<Card id="my-card" defaultExpanded={false}>
  <Header>User Info</Header>
  <Content>
    <Field 
      name="email" 
      control={control} 
      rules={{ required: 'Email required' }}
      expandParent={true} // Automatic card expansion!
    >
      <Field.Label required>Email</Field.Label>
      {({ field }) => <input {...field} />}
      <Field.Error />
    </Field>
  </Content>
</Card>
```

### **Adding Control Propagation**

```typescript
// Before: Passing control to each field
<Field.Group>
  <Field name="firstName" control={control}>...</Field>
  <Field name="lastName" control={control}>...</Field>
  <Field name="email" control={control}>...</Field>
</Field.Group>

// After: Control propagation through group
<Field.Group control={control}>
  <Field name="firstName">...</Field>  {/* Inherits control */}
  <Field name="lastName">...</Field>   {/* Inherits control */}
  <Field name="email">...</Field>      {/* Inherits control */}
</Field.Group>
```

## 🚀 Best Practices

### **1. Form Organization**

```typescript
// ✅ Good: Logical grouping with Cards
<Accordion id="user-form">
  <Card id="basic-info">
    <Header>Basic Information</Header>
    <Content>
      <Field.Group control={control} labelWidth="wide">
        <Field name="firstName" rules={{ required: true }}>
          <Field.Label required>First Name</Field.Label>
          {({ field }) => <input {...field} />}
          <Field.Error />
        </Field>
      </Field.Group>
    </Content>
  </Card>
  
  <Card id="contact-info">
    <Header>Contact Information</Header>
    <Content>
      <Field.Group control={control} labelWidth="wide">
        <Field name="email" rules={{ required: true }}>
          <Field.Label required>Email</Field.Label>
          {({ field }) => <input type="email" {...field} />}
          <Field.Error />
        </Field>
      </Field.Group>
    </Content>
  </Card>
</Accordion>

// ❌ Avoid: Mixing form and non-form content in cards
```

### **2. Performance Optimization**

```typescript
// ✅ Good: Use lazy loading for expensive fields
<Field lazy={true} name="complexData">
  <Field.Label>Complex Data</Field.Label>
  {({ field }) => <ExpensiveComponent {...field} />}
  <Field.Error />
</Field>

// ✅ Good: Group related validations
<Field.Group control={control}>
  <Field name="password" rules={{ required: true, minLength: 8 }}>
    <Field.Label>Password</Field.Label>
    {({ field }) => <input type="password" {...field} />}
    <Field.Error />
  </Field>
  
  <Field 
    name="confirmPassword" 
    rules={{
      required: true,
      validate: value => value === watch('password') || 'Passwords must match'
    }}
  >
    <Field.Label>Confirm Password</Field.Label>
    {({ field }) => <input type="password" {...field} />}
    <Field.Error />
  </Field>
</Field.Group>
```

### **3. Error Handling**

```typescript
// ✅ Good: Use smart error handling
const { handleSubmissionErrors } = useFormSubmission();

const onSubmit = handleSubmissionErrors(
  async (data) => {
    // Handle success
    await saveData(data);
  },
  (errors) => {
    // Automatic error focusing handled by the hook
    console.log('Validation errors:', errors);
  }
);

// ✅ Good: Manual error navigation
const fieldController = useFieldFocus();

const handleCustomValidation = async () => {
  const result = await fieldController.validateAndFocus();
  if (!result.isValid) {
    // Show user-friendly error message
    showNotification('Please check the highlighted fields');
  }
};
```

## 📊 Browser Support

| Browser | Minimum Version | Smart Expansion | RHF Integration |
|---------|----------------|-----------------|-----------------|
| Chrome | 88+ | ✅ Full | ✅ Full |
| Edge | 88+ | ✅ Full | ✅ Full |
| Firefox | 85+ | ✅ Full | ✅ Full |
| Safari | 14+ | ✅ Full | ✅ Full |
| IE 11 | ❌ | ❌ | ❌ |

## 🔧 Troubleshooting

### **Common Issues**

1. **Parent expansion not working**
   ```typescript
   // Ensure card has proper data attributes
   <Card id="my-card"> {/* ✅ ID required */}
     <Content>
       <Field expandParent={true}> {/* ✅ Enable expansion */}
   ```

2. **Control not propagating in FieldGroup**
   ```typescript
   // ✅ Pass control to FieldGroup
   <Field.Group control={control}>
     <Field name="email"> {/* Inherits control */}
   
   // ❌ Missing control
   <Field.Group>
     <Field name="email" control={control}> {/* Manual control needed */}
   ```

3. **Form validation not focusing errors**
   ```typescript
   // ✅ Use handleSubmissionErrors
   const { handleSubmissionErrors } = useFormSubmission();
   const onSubmit = handleSubmissionErrors(successFn, errorFn);
   
   // ❌ Manual handleSubmit
   const onSubmit = handleSubmit(successFn, errorFn); // No auto-focus
   ```

### **Debug Tools**

```typescript
// Enable debug mode
const fieldController = useFieldFocus();
const debugInfo = fieldController.getDebugInfo();
console.log('Field registration:', debugInfo);

// Validation statistics
const stats = fieldController.getValidationStats();
console.log('Validation stats:', stats);
```

## 📄 License

MIT License - Free for use in SharePoint Framework projects.

## 🤝 Contributing

1. **Follow existing patterns** - Maintain consistency with the established architecture
2. **Add tests** - Include unit tests for new functionality
3. **Update documentation** - Keep README and code comments current
4. **Backward compatibility** - Ensure existing code continues to work

## 🔗 Related Documentation

- [React Hook Form Documentation](https://react-hook-form.com/)
- [SharePoint Framework Documentation](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/)
- [Fluent UI React Documentation](https://developer.microsoft.com/en-us/fluentui)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Built with ❤️ for modern SharePoint development**
