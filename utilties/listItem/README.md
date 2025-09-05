# SharePoint ListItemHelper Utility

A comprehensive, type-safe utility for building SharePoint list item updates and extracting data using PnP.js. This utility provides seamless integration with all PnP.js update methods while offering advanced features like type safety, field validation, and resilient data extraction.

## 🚀 Features

- **🔒 Type Safety**: Full TypeScript support with compile-time field validation
- **🛠️ Universal PnP.js Support**: Works with all PnP.js update methods
- **📝 Smart Field Formatting**: Automatic handling of complex SharePoint field types
- **🔍 Flexible Extraction**: Both strict and safe extraction modes
- **⚡ Chainable API**: Fluent interface for building updates
- **📊 Comprehensive Logging**: Built-in PnP logging integration
- **✅ Field Validation**: Required field validation and readonly protection

## 📦 Installation

```bash
npm install @pnp/sp @pnp/logging @pnp/spfx-controls-react @microsoft/sp-lodash-subset
```

## 🏗️ Basic Setup

### 1. Define Your List Schema

```typescript
import { SPFieldType } from "@pnp/sp/fields";
import { ListItemHelper, OOBFields } from "./ListItemHelper";

// Define your list item interface (optional but recommended)
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

### Conditional Updates

```typescript
const updater = ListItemHelper.createUpdater<IMyListItem>(MyListSchema)
  .setField("title", "New Title");

// Break the chain for conditional logic
if (shouldUpdateBudget) {
  updater.setField("budget", newBudget, originalBudget);
}

if (user.isManager) {
  updater.setField("assignedTo", managerPerson);
}

// Continue chaining
updater.setField("isActive", true);
```

## 📤 Getting Updates for Different PnP.js Methods

### For Direct PnP.js Methods (`item.update()`, `items.add()`)

```typescript
const updates = updater.getUpdates();
// Returns: {
//   Title: "New Title",
//   AssignedToId: 123,
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

### With Required Field Validation

```typescript
// Validates that all required fields are provided before returning updates
const updates = updater.validateAndGetUpdates();
const validateUpdates = updater.validateAndGetUpdatesForValidate();

// Throws error if required fields are missing
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

if (Object.keys(errors).length > 0) {
  logWarning(`${Object.keys(errors).length} fields failed to convert`);
}
```

## 🎯 Supported Field Types

| SharePoint Field Type | Input Type | Output Type | Notes |
|----------------------|------------|-------------|-------|
| **Text/Note** | `string` | `string` | Empty string for empty values |
| **Number/Currency** | `number` | `number` | `undefined` for invalid numbers |
| **Boolean** | `boolean` | `boolean` | `undefined` for empty values |
| **DateTime** | `Date` | `Date` | `undefined` for invalid dates |
| **Choice** | `string` | `string` | Single selection |
| **Multi-Choice** | `string[]` | `string[]` | Empty array for empty values |
| **User** | `IPrincipal` | `IPrincipal` | Single user selection |
| **User Multi** | `IPrincipal[]` | `IPrincipal[]` | Empty array for empty values |
| **Lookup** | `number` | `number` | Lookup item ID |
| **Lookup Multi** | `number[]` | `number[]` | Empty array for empty values |
| **Taxonomy** | `TaxonomyFieldValue` | `TaxonomyFieldValue` | `{Label, TermID}` |

## 🔍 Advanced Features

### Field Schema Properties

```typescript
const schema = {
  title: { 
    internalName: "Title", 
    type: SPFieldType.Text, 
    required: true,           // Validates presence when using validateAndGetUpdates()
    readonly: false           // Prevents updates if true
  },
  id: { 
    internalName: "ID", 
    type: SPFieldType.Counter, 
    readonly: true            // Cannot be updated
  }
};
```

### Comparison Logic

```typescript
// Only updates if value has changed (uses deep comparison)
updater.setField("categories", [1, 2, 3], [1, 2]);     // Will update
updater.setField("categories", [1, 2, 3], [1, 2, 3]);  // Will skip

// Handles complex objects
updater.setField("department", newTaxValue, oldTaxValue); // Deep comparison
```

### Smart Empty Value Handling

```typescript
// Different field types handle "empty" appropriately
updater.setField("title", "");           // Sets empty string
updater.setField("categories", []);      // Sets empty array  
updater.setField("budget", undefined);   // Clears number field
updater.setField("assignedTo", null);    // Clears user field
```

## 🔧 Without Type Safety (Backward Compatible)

```typescript
// Create updater without generics
const updater = ListItemHelper.createUpdater(MyListSchema);

// Field names are not type-checked, but everything else works the same
updater.setField("anyFieldName", "anyValue");
```

## 🚨 Error Handling

### Field Validation Errors

```typescript
try {
  const updater = ListItemHelper.createUpdater(schema)
    .setField("nonExistentField", "value");  // Throws error
} catch (error) {
  console.error("Field validation failed:", error.message);
}

try {
  const updater = ListItemHelper.createUpdater(schema)
    .setField("readOnlyField", "value");     // Throws error
} catch (error) {
  console.error("Cannot update readonly field:", error.message);
}
```

### Required Field Validation

```typescript
try {
  const updates = updater.validateAndGetUpdates(); // Throws if required fields missing
} catch (error) {
  console.error("Missing required fields:", error.message);
}
```

### Extraction Errors

```typescript
try {
  const data = ListItemHelper.extract(item, mapping); // Throws on any conversion error
} catch (error) {
  console.error("Extraction failed:", error.message);
  
  // Use safe extraction instead
  const { data, errors } = ListItemHelper.safeExtract(item, mapping);
}
```

## 📊 Logging

The utility uses PnP logging with different levels:

- **Verbose**: Field updates, extractions, comparisons
- **Warning**: Type conversion issues, unknown field types  
- **Error**: Validation failures, missing fields

```typescript
import { Logger, LogLevel, ConsoleListener } from "@pnp/logging";

// Configure logging (optional)
Logger.subscribe(ConsoleListener("ListItemHelper", { warning: "#e69500", error: "#cc0000" }));
Logger.activeLogLevel = LogLevel.Warning; // Set minimum level
```

## 🎨 Best Practices

### 1. Define Strong Types

```typescript
// ✅ Good - Specific interface
interface IProjectItem {
  title: string;
  manager: IPrincipal;
  budget: number;
  startDate: Date;
  tags: number[];
}

// ❌ Avoid - Generic any
interface IProjectItem {
  [key: string]: any;
}
```

### 2. Use Safe Extraction in Production

```typescript
// ✅ Good - Handles errors gracefully
const { data, errors } = ListItemHelper.safeExtract<IProjectItem>(item, mapping);

if (Object.keys(errors).length > 0) {
  // Log errors but continue with partial data
  logger.warn("Some fields failed to extract", errors);
}

// ❌ Avoid - Can crash on bad data
const data = ListItemHelper.extract<IProjectItem>(item, mapping);
```

### 3. Validate Required Fields

```typescript
// ✅ Good - Validate before sending to SharePoint
const updates = updater.validateAndGetUpdates();

// ❌ Avoid - SharePoint will reject with cryptic error
const updates = updater.getUpdates();
```

### 4. Use Comparison for Performance

```typescript
// ✅ Good - Only updates changed fields
updater
  .setField("title", newTitle, originalTitle)
  .setField("budget", newBudget, originalBudget);

// ❌ Avoid - Always updates even if unchanged
updater
  .setField("title", newTitle)
  .setField("budget", newBudget);
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Submit a pull request

## 📞 Support

For issues and feature requests, please create an issue in the repository.
