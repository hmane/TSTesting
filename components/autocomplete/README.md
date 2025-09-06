# Enhanced Autocomplete Component for SharePoint Framework

A powerful, feature-rich autocomplete component built for SharePoint Framework (SPFx) applications. Combines the robustness of DevExtreme components with the design consistency of Fluent UI, while providing enhanced functionality like recent selections caching, keyboard shortcuts, and comprehensive error handling.

## 🚀 Features

- **Dual Mode Support**: Single-select (TextBox) and multi-select (TagBox) based on `maxSelect` property
- **SharePoint Theme Integration**: Automatically inherits current SharePoint site theme
- **Recent Selections Cache**: localStorage-based caching with configurable TTL and size limits
- **Advanced Keyboard Shortcuts**: Full keyboard navigation with multi-instance support
- **Loading States**: Smooth loading indicators with debouncing and minimum display time
- **Error Handling**: Comprehensive error boundaries with user-friendly messages
- **TypeScript Support**: Full type safety with DevExtreme property inheritance
- **Accessibility**: ARIA support, high contrast mode, reduced motion preferences
- **Performance Optimized**: Bundle splitting, request deduplication, and virtual scrolling ready
- **Mobile Responsive**: Optimized for touch devices and small screens

## 📋 Requirements

- SharePoint Framework (SPFx) v1.21.1+
- React 17.x
- DevExtreme 22.x
- Fluent UI v8.x
- TypeScript 4.x+

## 📦 Installation

1. Copy the component files to your SPFx project:
```
src/webparts/[your-webpart]/components/Autocomplete/
├── index.ts                     # Main exports
├── Autocomplete.tsx             # Main component
├── types/
│   └── AutocompleteTypes.ts     # TypeScript definitions
├── hooks/
│   ├── useEnhancedDataSource.ts # Data source enhancement
│   ├── useKeyboardShortcuts.ts  # Keyboard navigation
│   └── useLoadingState.ts       # Loading state management
├── components/
│   ├── LoadingSpinner.tsx       # Loading indicators
│   ├── LoadingSpinner.scss      # Spinner styles
│   ├── ErrorBoundary.tsx        # Error handling
│   └── ErrorBoundary.scss       # Error boundary styles
├── utils/
│   └── cacheUtils.ts           # Cache management
└── styles/
    └── Autocomplete.scss       # Main component styles
```

2. Install required dependencies (if not already installed):
```bash
npm install devextreme devextreme-react @fluentui/react
```

3. Import and use in your component:
```typescript
import { Autocomplete } from './components/Autocomplete';
```

## 🎯 Quick Start

### Basic Single Select
```typescript
import React from 'react';
import { Autocomplete } from './components/Autocomplete';

const MyComponent = () => {
  const [selectedItem, setSelectedItem] = React.useState(null);
  
  const items = [
    { id: 1, title: 'Item 1', description: 'First item' },
    { id: 2, title: 'Item 2', description: 'Second item' },
    // ... more items
  ];

  return (
    <Autocomplete
      dataSource={items}
      displayExpr="title"
      valueExpr="id"
      value={selectedItem}
      onValueChanged={(value) => setSelectedItem(value)}
      placeholder="Select an item..."
      showClearButton={true}
    />
  );
};
```

### Multi-Select with Recent Cache
```typescript
import React from 'react';
import { Autocomplete } from './components/Autocomplete';

const MyMultiSelect = () => {
  const [selectedItems, setSelectedItems] = React.useState([]);

  return (
    <Autocomplete
      dataSource={items}
      displayExpr="title"
      valueExpr="id"
      maxSelect={5}
      value={selectedItems}
      onValueChanged={setSelectedItems}
      enableRecentCache={true}
      recentCacheKey="my-items"
      placeholder="Select up to 5 items..."
      maxDisplayedTags={3}
      showClearButton={true}
    />
  );
};
```

### SharePoint List Integration
```typescript
import { CustomStore } from 'devextreme/data';
import { sp } from '@pnp/sp/presets/all';

const SharePointListPicker = () => {
  const dataSource = React.useMemo(() => new CustomStore({
    key: 'Id',
    load: async (loadOptions) => {
      let items = sp.web.lists.getByTitle('MyList').items;
      
      // Apply search filter
      if (loadOptions.searchValue) {
        items = items.filter(`substringof('${loadOptions.searchValue}', Title)`);
      }
      
      // Apply pagination
      if (loadOptions.take) {
        items = items.top(loadOptions.take);
      }
      
      if (loadOptions.skip) {
        items = items.skip(loadOptions.skip);
      }
      
      const result = await items.select('Id', 'Title', 'Description')();
      
      return {
        data: result,
        totalCount: result.length
      };
    },
    byKey: async (key) => {
      return await sp.web.lists.getByTitle('MyList').items.getById(key)();
    }
  }), []);

  return (
    <Autocomplete
      dataSource={dataSource}
      displayExpr="Title"
      valueExpr="Id"
      enableRecentCache={true}
      recentCacheKey="sharepoint-list"
      minSearchLength={2}
      searchTimeout={500}
      placeholder="Search SharePoint list..."
    />
  );
};
```

## 🎛️ Props Reference

### Core Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `dataSource` | `DataSource \| CustomStore \| any[]` | - | **Required.** Data source for the autocomplete |
| `displayExpr` | `string \| function` | - | **Required.** Field to display in the dropdown |
| `valueExpr` | `string` | - | **Required.** Field to use as the value |
| `maxSelect` | `number` | `1` | Maximum number of selections (1 = single, >1 = multi) |
| `value` | `any \| any[]` | - | Current selected value(s) |
| `onValueChanged` | `function` | - | **Required.** Callback when selection changes |

### Search & Performance

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `minSearchLength` | `number` | `1` | Minimum characters before search triggers |
| `searchTimeout` | `number` | `300` | Debounce delay for search (ms) |
| `enableRecentCache` | `boolean` | `false` | Enable recent selections caching |
| `recentCacheKey` | `string` | - | Unique key for cache storage |

### UI & UX

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placeholder` | `string` | - | Placeholder text |
| `showClearButton` | `boolean` | `true` | Show clear button |
| `showLoadingSpinner` | `boolean` | `true` | Show loading indicator |
| `isValid` | `boolean` | `true` | Validation state |
| `disabled` | `boolean` | `false` | Disable the component |
| `readOnly` | `boolean` | `false` | Make component read-only |

### Multi-Select Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxDisplayedTags` | `number` | `3` | Number of tags to show before "X more" |
| `showMultiTagOnly` | `boolean` | `false` | Always show count instead of individual tags |
| `multiline` | `boolean` | `false` | Allow tags to wrap to new lines |

### Keyboard & Accessibility

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enableKeyboardShortcuts` | `boolean` | `true` | Enable keyboard shortcuts |
| `keyboardScope` | `string` | - | Unique scope for keyboard shortcuts |

### Event Handlers

| Property | Type | Description |
|----------|------|-------------|
| `onSelectionLimitReached` | `function` | Called when selection limit is reached |
| `onDataSourceError` | `function` | Called when data source errors occur |

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Mode |
|----------|--------|------|
| `Ctrl+A` | Select all items | Multi-select only |
| `Ctrl+K` | Clear all selections | Both |
| `Delete` / `Backspace` | Remove last selected item | Both |
| `F2` | Open dropdown and focus | Both |
| `Escape` | Close dropdown | Both |
| `↑` / `↓` | Navigate dropdown items | Both |
| `Enter` | Select focused item | Both |

## 🎨 Theming

The component automatically inherits SharePoint's current theme through CSS custom properties:

```scss
// Automatic theme variables available
--palette-themePrimary      // Primary brand color
--palette-neutralPrimary    // Primary text color
--palette-neutralSecondary  // Secondary text color
--palette-white            // Background color
--borderRadius             // Border radius
--fontSizeMedium          // Base font size
```

### Custom Styling

```scss
// Override component styles
.autocomplete-container {
  // Custom container styles
  
  .dx-textbox .dx-texteditor-container {
    // Custom input styling
    border-radius: 8px;
  }
  
  .dx-tag {
    // Custom tag styling for multi-select
    background-color: var(--palette-themeLighter);
  }
}
```

## 🔧 Advanced Usage

### Custom Item Templates

```typescript
const itemTemplate = (item: any) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
      <div style={{ width: 32, height: 32, marginRight: 8 }}>
        <img src={item.avatar} alt="" style={{ width: '100%', borderRadius: '50%' }} />
      </div>
      <div>
        <div style={{ fontWeight: 600 }}>{item.title}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{item.department}</div>
      </div>
    </div>
  );
};

<Autocomplete
  // ... other props
  itemTemplate={itemTemplate}
/>
```

### Error Handling

```typescript
const handleDataSourceError = (error: Error) => {
  console.error('Autocomplete error:', error);
  // Show user-friendly message
  // Log to application insights
  // Fallback to cached data
};

<Autocomplete
  // ... other props
  onDataSourceError={handleDataSourceError}
/>
```

### Performance Optimization

```typescript
// Large dataset with virtual scrolling
const largeDataSource = new CustomStore({
  key: 'id',
  load: async (loadOptions) => {
    // Implement server-side paging and filtering
    const result = await fetchLargeDataset({
      search: loadOptions.searchValue,
      skip: loadOptions.skip,
      take: loadOptions.take || 50
    });
    
    return {
      data: result.items,
      totalCount: result.total
    };
  }
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Autocomplete not showing data**
   - Verify `dataSource`, `displayExpr`, and `valueExpr` are correctly set
   - Check browser console for error messages
   - Ensure data source returns expected format

2. **Theme not applying**
   - Verify SharePoint theme variables are available
   - Check if CSS custom properties are supported
   - Import component SCSS files

3. **Keyboard shortcuts not working**
   - Ensure `enableKeyboardShortcuts={true}`
   - Check for conflicting keyboard event handlers
   - Verify component has focus

4. **Recent cache not persisting**
   - Confirm `enableRecentCache={true}` and `recentCacheKey` is set
   - Check localStorage is available and not disabled
   - Verify cache isn't being cleared by other code

### Debug Mode

```typescript
import { DevUtils } from './components/Autocomplete';

// Validate configuration
const warnings = DevUtils.validateConfig(autocompleteProps);

// Log usage statistics
DevUtils.logUsage(autocompleteProps);

// Get performance metrics
const metrics = DevUtils.getPerformanceMetrics();
```

## 🔄 Migration Guide

### From Basic DevExtreme TextBox/TagBox

```typescript
// Before
<TextBox
  dataSource={items}
  displayExpr="title"
  valueExpr="id"
  onValueChanged={handleChange}
/>

// After
<Autocomplete
  dataSource={items}
  displayExpr="title"
  valueExpr="id"
  maxSelect={1}
  onValueChanged={handleChange}
  enableRecentCache={true}
  recentCacheKey="my-cache"
/>
```

### From Custom Autocomplete Solutions

1. Replace custom data loading logic with `CustomStore`
2. Remove manual loading state management
3. Replace custom keyboard handling with built-in shortcuts
4. Update styling to use SharePoint theme variables

## 📚 API Reference

### Quick Start Configurations

```typescript
import { QuickStartConfigs } from './components/Autocomplete';

// Basic configuration
const basicConfig = QuickStartConfigs.basic(items, 'title', 'id');

// Multi-select with cache
const multiConfig = QuickStartConfigs.multiSelectWithCache(items, 'title', 'id', 'cache-key', 5);

// SharePoint list template
const spConfig = QuickStartConfigs.sharePointList('Documents', 'Title', 'Id');
```

### Data Source Helpers

```typescript
import { DataSourceHelpers } from './components/Autocomplete';

// Static array with search
const staticDS = DataSourceHelpers.createStaticDataSource(items, ['title', 'description']);

// REST API data source
const restDS = DataSourceHelpers.createRestApiDataSource('/api/items', 'q', 'page', 'size');
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Maintain accessibility standards
3. Add comprehensive tests for new features
4. Update documentation for API changes
5. Ensure SharePoint theme compatibility

## 📄 License

This component is designed for use within SharePoint Framework applications and follows Microsoft's licensing terms for SPFx development.

## 🔗 Related Documentation

- [DevExtreme TextBox API](https://js.devexpress.com/Documentation/ApiReference/UI_Components/dxTextBox/)
- [DevExtreme TagBox API](https://js.devexpress.com/Documentation/ApiReference/UI_Components/dxTagBox/)
- [Fluent UI Theme Documentation](https://developer.microsoft.com/en-us/fluentui#/styles/web/colors/theme-slots)
- [SharePoint Framework Documentation](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/)

---

**Version**: 1.0.0  
**Compatible with**: SPFx 1.21.1, React 17.x, DevExtreme 22.x, Fluent UI 8.x
