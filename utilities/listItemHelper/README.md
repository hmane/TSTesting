# SharePoint ListItemHelper Utility v2.0

A comprehensive, type-safe utility for building SharePoint list item updates and extracting data using PnP.js. This utility provides seamless integration with all PnP.js update methods while offering advanced features like type safety, field validation, and resilient data extraction.

## 🚀 Features

- **🔒 Type Safety**: Full TypeScript support with compile-time field validation
- **🛠️ Universal PnP.js Support**: Works with all PnP.js update methods
- **📝 Smart Field Formatting**: Automatic handling of complex SharePoint field types
- **🔍 Flexible Extraction**: Both strict and safe extraction modes
- **⚡ Chainable API**: Fluent interface for building updates
- **✅ Field Validation**: Required field validation and readonly protection
- **🧩 Modular Architecture**: Split into focused modules for better maintainability
- **🚫 Zero Logger Dependency**: Removed logger overhead for better performance

## 📦 Installation

```bash
npm install @your-org/sharepoint-listitem-helper @microsoft/sp-lodash-subset
```

## 🆕 What's New in v2.0

- **Custom IPrincipal Interface**: Now uses your own IPrincipal definition with comprehensive user properties
- **Modular Architecture**: Split into multiple focused files for better maintainability
- **Updated SPFieldType Enum**: Based on PnP-JS-Core with all modern field types
- **No Logger Dependency**: Removed PnP logging dependency for better performance
- **Enhanced Type Safety**: Improved TypeScript types and better error handling
- **Better ESLint Support**: Comprehensive ESLint configuration included

## 🏗️ Project Structure

```
src/
├── index.ts                 # Main exports
├── types.ts                 # Core types and interfaces
├── oobFields.ts            # Out-of-the-box SharePoint fields
├── fieldConverter.ts       # SharePoint to TypeScript conversion
├── fieldFormatter.ts       # TypeScript to SharePoint formatting
├── listItemUpdater.ts      # Type-safe updater class
├── listItemExtractor.ts    # Data extraction logic
└── listItemHelper.ts       # Main helper class
```

## 🏗️ Basic Setup

### 1. Define Your List Schema

```typescript
import { SPFieldType, IPrincipal, TaxonomyFieldValue } from '@your-org/sharepoint-listitem-helper';

// Define your list item interface
interface IMyListItem {
  title: string;
  assignedTo: IPrincipal;
  budget: number;
  categories: number[];
  department: TaxonomyFieldValue;
  isActive: boolean;
  dueDate: Date;
}

// Create your list schema
const MyListSchema = {
  title: { internalName: "Title", type: SPFieldType.Text, required: true },
  assignedTo: { internalName: "AssignedTo", type: SPFieldType.User },
  budget: { internalName: "Budget", type: SPFieldType.Currency },
  categories: { internalName: "Categories", type: SPFieldType.LookupMulti },
  department: { internalName: "Department", type: SPFieldType.TaxonomyFieldType },
  isActive: { internalName: "IsActive", type: SPFieldType.Boolean, defaultValue: true },
  dueDate: { internalName: "DueDate", type: SPFieldType.DateTime }
} as const;
```

### 2. Use Out-of-the-Box Fields

```typescript
import { OOBFields } from '@your-org/sharepoint-listitem-helper';

// Pre-defined OOB fields for common SharePoint columns
const fieldMapping = {
  id: OOBFields.Id,
  title: MyListSchema.title,
  createdBy: OOBFields.CreatedBy,
  modified: OOBFields.Modified,
  assignedTo: MyListSchema.assignedTo
};
```

## 🔧 Creating Updates

### Type-Safe Updater (Recommended)

```typescript
import { ListItemHelper } from '@your-org/sharepoint-listitem-helper';

// Create a type-safe updater
const updater = ListItemHelper.createUpdater<IMyListItem>(MyListSchema)
  .setField("title", "New Title")                    // ✅ Type-safe
  .setField("assignedTo", selectedPerson)            // ✅ Type-safe
  .setField("budget", 1000, originalBudget)          // ✅ Compare first
  .setField("categories", [1, 2, 3])                 // ✅ Type-safe array
  .setField("department", { Label: "IT", TermID: "guid" }); // ✅ Type-safe object

// This would cause a TypeScript error:
// updater.setField("wrongField", "value");          // ❌ Compile error
// updater.setField("budget", "not a number");       // ❌ Compile error
```

## 📤 Getting Updates for Different PnP.js Methods

### For Direct PnP.js Methods (`item.update()`, `items.add()`)

```typescript
const updates = updater.getUpdates();
// Returns: {
//   Title: "New Title",
//   AssignedToId: "123",
//   Budget: 1000,
//   CategoriesId: { results: [1, 2, 3] },
//   Department: { Label: "IT", TermGuid: "guid" },
//   Department_0: "IT|guid",
//   IsActive: true
// }

// Use with PnP.js
await item.update(updates);
await list.items.add(updates);
```

### For Validate Methods (`addValidateUpdateItemUsingPath`, `validateUpdateListItem`)

```typescript
const validateUpdates = updater.getUpdatesForValidate();
// Returns: [
//   { FieldName: "Title", FieldValue: "New Title" },
//   { FieldName: "AssignedTo", FieldValue: "123" },
//   { FieldName: "Budget", FieldValue: "1000" },
//   ...
// ]

// Use with PnP.js validate methods
await list.items.addValidateUpdateItemUsingPath(validateUpdates, "/sites/site/lists/listname");
await item.validateUpdateListItem(validateUpdates);
```

## 📥 Extracting Data from SharePoint Items

### Standard Extraction

```typescript
// Extract data with automatic type conversion
const myObj = ListItemHelper.extract<IMyListItem>(spItem, {
  id: OOBFields.Id,
  title: MyListSchema.title,
  assignedTo: MyListSchema.assignedTo,
  budget: MyListSchema.budget,
  categories: MyListSchema.categories,
  createdBy: OOBFields.CreatedBy
});

// myObj is now properly typed as IMyListItem
console.log(myObj.title);        // string
console.log(myObj.assignedTo);   // IPrincipal
console.log(myObj.budget);       // number
```

### Safe Extraction (Recommended for Production)

```typescript
// Extract with error resilience
const { data, errors } = ListItemHelper.safeExtract<IMyListItem>(spItem, {
  id: OOBFields.Id,
  title: MyListSchema.title,
  assignedTo: MyListSchema.assignedTo,
  budget: MyListSchema.budget,
  categories: MyListSchema.categories
});

// Handle successful extractions
if (data.title) {
  displayTitle(data.title);
}

if (data.assignedTo) {
  showAssignedUser(data.assignedTo);
}

// Handle conversion errors gracefully
if (errors.budget) {
  console.warn("Budget field could not be converted:", errors.budget.message);
  showDefaultBudget();
}
```

## 🎯 Updated Field Types

| SharePoint Field Type | Input Type | Output Type | SPFieldType Enum |
|----------------------|------------|-------------|------------------|
| **Text/Note** | `string` | `string` | `SPFieldType.Text` / `SPFieldType.Note` |
| **Number/Currency** | `number` | `number` | `SPFieldType.Number` / `SPFieldType.Currency` |
| **Boolean** | `boolean` | `boolean` | `SPFieldType.Boolean` |
| **DateTime** | `Date` | `Date` | `SPFieldType.DateTime` |
| **Choice** | `string` | `string` | `SPFieldType.Choice` |
| **Multi-Choice** | `string[]` | `string[]` | `SPFieldType.MultiChoice` |
| **User** | `IPrincipal` | `IPrincipal` | `SPFieldType.User` |
| **User Multi** | `IPrincipal[]` | `IPrincipal[]` | `SPFieldType.UserMulti` |
| **Lookup** | `number` | `number` | `SPFieldType.Lookup` |
| **Lookup Multi** | `number[]` | `number[]` | `SPFieldType.LookupMulti` |
| **Taxonomy** | `TaxonomyFieldValue` | `TaxonomyFieldValue` | `SPFieldType.TaxonomyFieldType` |
| **Taxonomy Multi** | `TaxonomyFieldValue[]` | `TaxonomyFieldValue[]` | `SPFieldType.TaxonomyFieldTypeMulti` |

## 🔍 Custom IPrincipal Interface

The updated utility uses a comprehensive IPrincipal interface:

```typescript
export interface IPrincipal {
  id: string;        // User ID
  email: string;     // Email address
  department: string; // Department
  jobTitle: string;  // Job title
  sip: string;       // SIP address
  title: string;     // Display name
  value: string;     // Login name
  picture: string;   // Profile picture URL
}
```

## 🛠️ Development

### Building the Project

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch for changes during development
npm run build:watch
```

### Linting and Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix
```

### Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📁 File Organization

The utility is now organized into focused modules:

- **`types.ts`** - Core TypeScript interfaces and enums
- **`oobFields.ts`** - Out-of-the-box SharePoint field definitions
- **`fieldConverter.ts`** - SharePoint to TypeScript value conversion
- **`fieldFormatter.ts`** - TypeScript to SharePoint value formatting
- **`listItemUpdater.ts`** - Type-safe updater class implementation
- **`listItemExtractor.ts`** - Data extraction logic
- **`listItemHelper.ts`** - Main helper class that ties everything together
- **`index.ts`** - Public API exports

## 🔧 Migration from v1.x

### Breaking Changes

1. **Logger Removed**: No more PnP logging dependency
2. **Custom IPrincipal**: Updated interface with more properties
3. **Import Changes**: Some internal functions may have moved

### Migration Steps

```typescript
// Old v1.x import
import { ListItemHelper, IPrincipal } from './ListItemHelper';

// New v2.x import
import { ListItemHelper, IPrincipal } from '@your-org/sharepoint-listitem-helper';

// IPrincipal interface has been updated - check your user objects
const user: IPrincipal = {
  id: "123",
  email: "user@company.com",
  department: "IT",
  jobTitle: "Developer",
  sip: "user@company.com",
  title: "John Doe",
  value: "i:0#.f|membership|user@company.com",
  picture: "/_layouts/15/userphoto.aspx?size=S&username=user@company.com"
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the ESLint rules
4. Add tests for new functionality
5. Run `npm run lint` and `npm run test`
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Related Documentation

- [PnP.js Documentation](https://pnp.github.io/pnpjs/)
- [SharePoint Field Types Reference](https://docs.microsoft.com/en-us/previous-versions/office/developer/sharepoint-2010/ms428806(v=office.14))
- [SPFx Development Documentation](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/)
