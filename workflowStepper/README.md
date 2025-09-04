# WorkflowStepper Component

A comprehensive, accessible workflow stepper component for SharePoint Framework (SPFx) applications built with React and Fluent UI. Perfect for tracking multi-step processes like approvals, reviews, and business workflows.

## Features

- 🎯 **Two Display Modes**: Full steps with content area or progress-only view
- 🎨 **SharePoint Theme Integration**: Automatic Fluent UI theme colors with custom override support
- ♿ **Accessibility First**: Full keyboard navigation, screen reader support, and ARIA compliance
- 📱 **Responsive Design**: Mobile-friendly with horizontal scroll on small screens
- 🖨️ **Print-Friendly**: Optimized CSS for professional printed reports
- ⚡ **Smooth Animations**: Subtle transitions and selection feedback
- 🔧 **Highly Configurable**: Optional step numbers, custom colors, flexible width control
- 🎭 **Multiple Status Types**: Completed, current, pending, warning, error, and blocked states

## Installation

Copy the following files to your SPFx project:

```
src/components/WorkflowStepper/
├── types.ts
├── WorkflowStepper.styles.ts
├── StepItem.tsx
├── ContentArea.tsx
├── utils.ts
└── WorkflowStepper.tsx
```

## Dependencies

- React 17.0.1+
- @fluentui/react 8.x
- SharePoint Framework

## Basic Usage

```tsx
import React, { useState } from 'react';
import { WorkflowStepper } from './components/WorkflowStepper/WorkflowStepper';
import { StepData } from './components/WorkflowStepper/types';

const MyComponent: React.FC = () => {
  const [selectedStepId, setSelectedStepId] = useState<string>('step-1');

  const steps: StepData[] = [
    {
      id: 'step-1',
      title: 'Submit Request',
      description1: 'User submits the initial request',
      description2: 'Completed on 2024-01-15',
      status: 'completed',
      content: '<p>Request submitted successfully by John Doe.</p>'
    },
    {
      id: 'step-2',
      title: 'Admin Review',
      description1: 'Administrator assigns reviewer',
      description2: 'In progress',
      status: 'current',
      content: '<p>Waiting for admin to assign a reviewer.</p>'
    },
    {
      id: 'step-3',
      title: 'Legal Review',
      description1: 'Legal team reviews compliance',
      description2: 'Not started',
      status: 'pending',
      content: '<p>Legal review will begin after admin approval.</p>'
    },
    {
      id: 'step-4',
      title: 'Execution',
      description1: 'Final execution of the request',
      description2: 'Pending',
      status: 'pending',
      content: '<p>Request will be executed after all approvals.</p>'
    }
  ];

  return (
    <WorkflowStepper
      steps={steps}
      mode="fullSteps"
      selectedStepId={selectedStepId}
      onStepClick={(step) => setSelectedStepId(step.id)}
      showStepNumbers={true}
      fullWidth={true}
    />
  );
};
```

## Component Props

### WorkflowStepperProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `StepData[]` | required | Array of step data objects |
| `mode` | `'fullSteps' \| 'progress'` | `'fullSteps'` | Display mode - full steps with content or progress-only |
| `fullWidth` | `boolean` | `true` | Whether steps should stretch to fill container width |
| `showStepNumbers` | `boolean` | `true` | Show step numbers (1, 2, 3...) in each step |
| `selectedStepId` | `string` | undefined | Controlled selection - which step is currently selected |
| `autoSelectCurrent` | `boolean` | `true` | Auto-select current step or last completed step |
| `customColors` | `CustomColors` | undefined | Override default theme colors |
| `onStepClick` | `(step: StepData) => void` | undefined | Callback when a step is clicked |
| `className` | `string` | undefined | Additional CSS class for the container |

### StepData Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | ✅ | Unique identifier for the step |
| `title` | `string` | ✅ | Step title/name |
| `description1` | `string` | ❌ | First description line (e.g., status) |
| `description2` | `string` | ❌ | Second description line (e.g., date) |
| `status` | `StepStatus` | ✅ | Step status (completed, current, pending, warning, error, blocked) |
| `content` | `string \| React.ReactNode` | ❌ | Content to display when step is selected (fullSteps mode only) |
| `isClickable` | `boolean` | ❌ | Override clickability (defaults based on mode and status) |

## Display Modes

### Full Steps Mode (`mode="fullSteps"`)
- Shows all steps with clickable navigation
- Displays content area below steps
- Users can click any step to view its content
- Perfect for workflow creation or detailed step information

### Progress Mode (`mode="progress"`)
- Shows workflow progress with visual status indicators
- Only completed and current steps are clickable
- No content area displayed
- Perfect for showing current item progress

## Status Types

| Status | Description | Default Color | Clickable (Progress Mode) |
|--------|-------------|---------------|---------------------------|
| `completed` | Step finished successfully | Green | ✅ |
| `current` | Step in progress | Blue (theme primary) | ✅ |
| `pending` | Step not started | Grey | ❌ |
| `warning` | Step needs attention | Yellow | ❌ |
| `error` | Step has errors | Red | ❌ |
| `blocked` | Step is blocked | Orange | ❌ |

## Custom Colors

Override default theme colors by providing a `customColors` object:

```tsx
const customColors = {
  completed: {
    background: '#28a745',
    selectedBackground: '#1e7e34',
    text: '#ffffff',
    selectedText: '#ffffff'
  },
  current: {
    background: '#007bff',
    selectedBackground: '#0056b3',
    text: '#ffffff',
    selectedText: '#ffffff'
  },
  warning: {
    background: '#ffc107',
    selectedBackground: '#e0a800',
    text: '#212529',
    selectedText: '#212529'
  }
  // ... other statuses
};

<WorkflowStepper
  steps={steps}
  customColors={customColors}
  // ... other props
/>
```

## Keyboard Navigation

The component supports full keyboard accessibility:

- **Arrow Keys / Tab**: Navigate between clickable steps
- **Enter / Space**: Select the focused step
- **Home**: Jump to first clickable step
- **End**: Jump to last clickable step

## Responsive Behavior

- **Desktop**: Full arrow-style layout with hover effects
- **Tablet**: Slightly smaller steps with touch-friendly targets
- **Mobile**: Horizontal scroll with fade indicators
- **Print**: Simplified layout without arrows, optimized for printing

## Examples

### Simple Progress Indicator

```tsx
<WorkflowStepper
  steps={steps}
  mode="progress"
  showStepNumbers={false}
  fullWidth={true}
/>
```

### Compact Step Layout

```tsx
<WorkflowStepper
  steps={steps}
  mode="fullSteps"
  fullWidth={false}
  showStepNumbers={true}
/>
```

### With React Component Content

```tsx
const steps = [
  {
    id: 'step-1',
    title: 'Data Input',
    status: 'completed',
    content: (
      <div>
        <h3>Data Input Form</h3>
        <MyCustomForm onSubmit={handleSubmit} />
      </div>
    )
  }
  // ... more steps
];
```

### Controlled Selection

```tsx
const [currentStep, setCurrentStep] = useState('step-2');

<WorkflowStepper
  steps={steps}
  selectedStepId={currentStep}
  onStepClick={(step) => {
    setCurrentStep(step.id);
    // Additional logic here
  }}
/>
```

## Accessibility Features

- **ARIA Labels**: Comprehensive labeling for screen readers
- **Live Regions**: Announces step changes and progress updates
- **Keyboard Navigation**: Full keyboard control
- **Focus Management**: Proper focus indicators and management
- **High Contrast**: Supports Windows high contrast mode
- **Screen Reader**: Detailed descriptions and status announcements

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Internet Explorer 11 (with polyfills)

## TypeScript Support

The component is written in TypeScript and includes full type definitions. All interfaces are exported for use in your application.

## Performance Considerations

- Uses React.memo() for optimized re-renders
- Debounced animations for smooth performance
- Efficient DOM updates with proper keys
- Minimal re-calculations with useMemo hooks

## Troubleshooting

### Steps not appearing correctly
- Ensure each step has a unique `id`
- Check that `steps` array is not empty
- Verify Fluent UI theme is properly initialized

### Content not showing
- Make sure you're using `mode="fullSteps"`
- Check that the selected step has `content` property
- Verify step is clickable and properly selected

### Styling issues
- Ensure Fluent UI theme is loaded
- Check for CSS conflicts
- Verify custom colors follow the correct interface

### Accessibility warnings
- Ensure all steps have meaningful titles
- Provide description text for complex workflows
- Test with screen readers

## Contributing

When contributing to this component:

1. Maintain TypeScript strict mode compliance
2. Follow accessibility best practices
3. Add appropriate unit tests
4. Update documentation for new features
5. Test across different SharePoint themes

## License

This component is designed for use in SharePoint Framework applications and follows Microsoft's development guidelines.
