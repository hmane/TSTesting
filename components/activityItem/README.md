# ActivityItem Component

A beautiful, feature-rich activity tracking component for SharePoint Framework applications. Display creation and modification information with rich user personas, smart time formatting, and multiple visual variants.

![Activity Item Preview](./docs/preview.png)

## ✨ Features

- 🎭 **4 Visual Variants** - Compact, Detailed, Timeline, and Inline layouts
- 👥 **Rich Personas** - PnP LivePersona integration with SharePoint user profiles
- ⏰ **Smart Time Display** - Relative time with absolute time tooltips
- 🔔 **Recent Activity Indicators** - Visual highlights for recent modifications
- 📱 **Responsive Design** - Adapts beautifully to mobile screens
- ♿ **Accessibility First** - Full ARIA support and keyboard navigation
- 🎨 **SharePoint Native** - Uses SharePoint design tokens and Fluent UI
- ⚡ **Performance Optimized** - Memoized components with minimal re-renders
- 🔗 **Interactive** - Click handlers for personas and activity items
- 🛡️ **Error Handling** - Robust validation and graceful fallbacks

## 📦 Installation

```bash
# Install PnP Controls dependency
npm install @pnp/spfx-controls-react

# Copy the ActivityItem component to your project
# src/components/ActivityItem/
```

## 🚀 Quick Start

```typescript
import { ActivityItem } from './components/ActivityItem';

const MyComponent = () => (
  <ActivityItem
    context={this.context}
    createdBy={{
      id: 'user1@tenant.com',
      title: 'John Doe',
      email: 'john.doe@company.com',
    }}
    createdDate={new Date('2024-01-15T10:30:00Z')}
    variant='compact'
  />
);
```

## 🎭 Variants

### Compact Variant

Perfect for lists and summary views. Single line with avatars and time.

```typescript
<ActivityItem
  context={this.context}
  variant='compact'
  createdBy={user}
  createdDate={date}
  modifiedBy={user2}
  modifiedDate={date2}
/>
```

### Detailed Variant

Card-style layout with full information. Great for detailed views and dashboards.

```typescript
<ActivityItem
  context={this.context}
  variant='detailed'
  createdBy={user}
  createdDate={date}
  modifiedBy={user2}
  modifiedDate={date2}
  showRelativeTime={true}
/>
```

### Timeline Variant

Vertical timeline showing activity flow. Perfect for activity feeds and history views.

```typescript
<ActivityItem
  context={this.context}
  variant='timeline'
  createdBy={user}
  createdDate={date}
  modifiedBy={user2}
  modifiedDate={date2}
/>
```

### Inline Variant

Minimal text format. Great for embedding in sentences and compact layouts.

```typescript
<ActivityItem
  context={this.context}
  variant='inline'
  createdBy={user}
  createdDate={date}
  modifiedBy={user2}
  modifiedDate={date2}
/>
```

## 📋 Props API

### ActivityItemProps

| Prop                | Type                         | Default      | Description                              |
| ------------------- | ---------------------------- | ------------ | ---------------------------------------- |
| `context`           | `WebPartContext`             | **Required** | SharePoint web part context              |
| `createdBy`         | `IPrincipal`                 | **Required** | User who created the item                |
| `createdDate`       | `Date`                       | **Required** | Creation date                            |
| `modifiedBy`        | `IPrincipal`                 | `undefined`  | User who last modified the item          |
| `modifiedDate`      | `Date`                       | `undefined`  | Last modification date                   |
| `variant`           | `ActivityVariant`            | `'compact'`  | Visual layout variant                    |
| `showRelativeTime`  | `boolean`                    | `true`       | Show relative time vs absolute           |
| `showSharedFiles`   | `boolean`                    | `true`       | Include shared files in persona tooltips |
| `itemId`            | `string`                     | `undefined`  | Unique identifier for the item           |
| `className`         | `string`                     | `''`         | Custom CSS class                         |
| `style`             | `CSSProperties`              | `undefined`  | Custom inline styles                     |
| `onClick`           | `() => void`                 | `undefined`  | Click handler for entire item            |
| `onCreatedByClick`  | `(user: IPrincipal) => void` | `undefined`  | Click handler for created by persona     |
| `onModifiedByClick` | `(user: IPrincipal) => void` | `undefined`  | Click handler for modified by persona    |

### IPrincipal Interface

```typescript
interface IPrincipal {
  id: string; // User ID or email
  title: string; // Display name
  email: string; // Email address
  loginName?: string; // Login name (optional)
  jobTitle?: string; // Job title (optional)
  department?: string; // Department (optional)
}
```

### ActivityVariant Type

```typescript
type ActivityVariant = 'compact' | 'detailed' | 'timeline' | 'inline';
```

## 🔔 Recent Activity Features

The component automatically detects and highlights recent modifications with visual indicators:

### Smart Recent Detection

- **Recent if**: Modified within last 24 hours
- **Significant if**: Modified more than 1 hour after creation
- **Hidden if**: Same user modified within 5 minutes of creation

### Visual Indicators

- **Green accent borders** on all variants
- **Success color highlighting** for time and activity text
- **Pulsing animations** for attention (respects reduced motion)
- **"Recently modified" badges** in detailed view
- **Gradient backgrounds** for subtle emphasis

### CSS Classes

```scss
.recentlyModified {
  // Applied automatically when modification is recent
  // Includes green borders, success colors, and animations
}
```

## 🎨 Examples

### Basic Activity Item

```typescript
<ActivityItem
  context={this.context}
  createdBy={{
    id: 'john.doe@company.com',
    title: 'John Doe',
    email: 'john.doe@company.com',
    jobTitle: 'Software Developer',
    department: 'Engineering',
  }}
  createdDate={new Date('2024-01-15T10:30:00Z')}
/>
```

### With Recent Modification

```typescript
<ActivityItem
  context={this.context}
  variant='detailed'
  createdBy={{
    id: 'john.doe@company.com',
    title: 'John Doe',
    email: 'john.doe@company.com',
  }}
  createdDate={new Date('2024-01-15T10:30:00Z')}
  modifiedBy={{
    id: 'jane.smith@company.com',
    title: 'Jane Smith',
    email: 'jane.smith@company.com',
  }}
  modifiedDate={new Date()} // Recent modification - will show indicators
  showRelativeTime={true}
/>
```

### Interactive Activity Item

```typescript
<ActivityItem
  context={this.context}
  variant='compact'
  createdBy={user}
  createdDate={createdDate}
  modifiedBy={modifiedUser}
  modifiedDate={modifiedDate}
  onClick={() => navigateToItem(itemId)}
  onCreatedByClick={user => openUserProfile(user)}
  onModifiedByClick={user => openUserProfile(user)}
/>
```

### Custom Styling

```typescript
<ActivityItem
  context={this.context}
  variant='detailed'
  createdBy={user}
  createdDate={date}
  className='my-custom-activity'
  style={{
    backgroundColor: '#f8f9fa',
    border: '2px solid #0078d4',
  }}
/>
```

## 🎯 Use Cases

### Document Libraries

```typescript
// Show creation and modification info for documents
<ActivityItem
  context={this.context}
  variant='compact'
  createdBy={document.Author}
  createdDate={document.Created}
  modifiedBy={document.Editor}
  modifiedDate={document.Modified}
  onClick={() => openDocument(document.Id)}
/>
```

### List Items

```typescript
// Activity tracking in SharePoint lists
<ActivityItem
  context={this.context}
  variant='detailed'
  itemId={listItem.Id.toString()}
  createdBy={listItem.AuthorUser}
  createdDate={new Date(listItem.Created)}
  modifiedBy={listItem.EditorUser}
  modifiedDate={new Date(listItem.Modified)}
/>
```

### Activity Feeds

```typescript
// Timeline view of activities
{
  activities.map(activity => (
    <ActivityItem
      key={activity.id}
      context={this.context}
      variant='timeline'
      createdBy={activity.user}
      createdDate={activity.date}
      onClick={() => viewActivity(activity.id)}
    />
  ));
}
```

### Inline Attribution

```typescript
// Embed in content
<p>
  This report was{' '}
  <ActivityItem
    context={this.context}
    variant='inline'
    createdBy={report.author}
    createdDate={report.date}
  />
</p>
```

## 🎨 Styling & Theming

The component uses CSS custom properties for easy theming:

```scss
:root {
  --activity-theme-primary: #0078d4; // Primary color
  --activity-theme-success: #107c10; // Success/recent color
  --activity-theme-neutral-secondary: #605e5c; // Text color
  --activity-spacing-m: 12px; // Spacing
  --activity-border-radius: 6px; // Border radius
}
```

### Custom CSS Classes

```scss
// Override specific variant
.my-custom-activity.variantDetailed {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .personaName {
    color: #ffffff;
  }
}

// Style recent modifications
.my-custom-activity.recentlyModified {
  border-left-color: #ff6b6b;

  .timeText {
    color: #ff6b6b;
  }
}
```

## 📱 Responsive Behavior

The component automatically adapts to different screen sizes:

- **Mobile (≤640px)**: Stacks content vertically, adjusts spacing
- **Tablet (641px-1024px)**: Optimizes layout for touch interfaces
- **Desktop (≥1025px)**: Full layout with optimal information density

## ♿ Accessibility Features

- **ARIA Labels**: Proper semantic markup for screen readers
- **Keyboard Navigation**: Full keyboard accessibility with Enter/Space support
- **High Contrast**: Supports Windows high contrast mode
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Clear focus indicators and logical tab order
- **Screen Reader Support**: Descriptive labels and announcements

## ⚡ Performance

- **Memoized Components**: Prevents unnecessary re-renders
- **Optimized Time Calculations**: Cached time formatting
- **Efficient Event Handlers**: useCallback for stable references
- **Smart Modification Logic**: Only shows meaningful modifications
- **Error Boundaries**: Graceful error handling with fallbacks

## 🔧 Advanced Configuration

### Input Validation

```typescript
// Component validates all inputs and provides warnings
<ActivityItem
  context={invalidContext} // Will show warning and return null
  createdBy={user}
  createdDate={new Date('invalid')} // Will show warning and return null
/>
```

### Error Handling

```typescript
// Component includes try-catch error boundaries
// Errors are logged to console and show fallback UI
```

### Custom Time Formatting

```typescript
// The component automatically formats time, but you can customize tooltips
<ActivityItem
  context={this.context}
  createdDate={date}
  showRelativeTime={false} // Shows absolute time instead
  // Tooltip will show: "Created: Feb 20, 2024 at 2:45 PM"
/>
```

### Persona Customization

```typescript
// Control shared files display
<ActivityItem
  context={this.context}
  showSharedFiles={false} // Disables shared files in tooltips
  createdBy={user}
  createdDate={date}
/>
```

### Click Handling

```typescript
const handlePersonaClick = (user: IPrincipal) => {
  // Navigate to user profile
  window.open(`/_layouts/15/userdisp.aspx?ID=${user.id}`, '_blank');
};

<ActivityItem
  context={this.context}
  onCreatedByClick={handlePersonaClick}
  onModifiedByClick={handlePersonaClick}
  onClick={() => console.log('Item clicked')}
/>;
```

## 🔍 Troubleshooting

### Common Issues

**LivePersona not loading**

- Ensure `@pnp/spfx-controls-react` is installed
- Verify SharePoint context is available
- Check user permissions

**Time not displaying correctly**

- Verify Date objects are valid
- Check timezone settings
- Ensure dates are not in the future

**Recent modification indicators not showing**

- Check that modifiedDate is within 24 hours
- Verify modification is significant (>1 hour after creation)
- Ensure different users for creation/modification

**Styling issues**

- Check CSS custom properties are defined
- Verify SCSS modules are configured
- Ensure Fluent UI styles are loaded

### Debug Mode

```typescript
// Add debug logging
<ActivityItem
  context={this.context}
  createdBy={user}
  createdDate={date}
  onClick={() => {
    console.log('Activity item clicked', { user, date });
  }}
/>
```

### Validation Warnings

The component logs warnings for:

- Missing required props
- Invalid date objects
- Missing user information
- Unknown variants

## 🆕 What's New

### Enhanced Features

- **Smart Recent Detection**: Automatically identifies meaningful modifications
- **Visual Recent Indicators**: Green accents, badges, and animations
- **Better Error Handling**: Robust validation with graceful fallbacks
- **Enhanced Accessibility**: Full keyboard navigation and ARIA support
- **Performance Improvements**: Better memoization and optimizations

### Bug Fixes

- Fixed TypeScript errors with dynamic CSS class indexing
- Corrected LivePersona props to match actual API
- Added proper event handling and bubbling prevention
- Enhanced persona click handling with keyboard support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -am 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PnP Community** - For the excellent LivePersona control
- **Fluent UI Team** - For the amazing design system
- **SharePoint Framework** - For the robust platform

---
