# PnP.js Batch Builder Utility

A powerful, TypeScript-based utility for performing bulk operations in SharePoint using PnP.js with a clean fluent API, automatic batch management, and comprehensive error handling.

## 🚀 Features

- **Fluent API Design** - Clean, chainable syntax for better code readability
- **Automatic Batch Management** - Handles SharePoint's 1000-operation batch limit automatically
- **TypeScript Support** - Full type safety with IntelliSense support
- **Comprehensive Error Handling** - Operation-level and batch-level error management
- **Configurable Retry Logic** - Automatic retry for transient failures
- **Multiple Operation Types** - Support for all common PnP.js operations
- **Detailed Results** - Complete success/failure information with SharePoint response data

## 📦 Installation

```bash
npm install @pnp/sp @pnp/logging @pnp/queryable
```

## 🛠️ Setup

```typescript
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { createBatchBuilder } from './BatchBuilder';

// Initialize PnP.js (SPFx example)
const sp = spfi().using(SPFx(this.context));

// Create batch builder
const batchBuilder = createBatchBuilder(sp);
```

## 🔧 Basic Usage

### Simple Operations

```typescript
const batchBuilder = createBatchBuilder(sp);

batchBuilder
  .list("Tasks")
    .add({ Title: "New Task", Status: "Active", Priority: "High" })
    .update(123, { Status: "Completed", CompletedDate: new Date() })
    .delete(456);

const result = await batchBuilder.execute();
console.log(`Processed ${result.totalOperations} operations`);
```

### Multiple Lists

```typescript
const batchBuilder = createBatchBuilder(sp);

batchBuilder
  .list("Tasks")
    .add({ Title: "Task 1", Status: "Active" })
    .add({ Title: "Task 2", Status: "Pending" })
  .list("Documents")
    .update(100, { Status: "Approved" })
    .delete(200)
  .list("Announcements")
    .add({ Title: "New Announcement", Body: "Important update" });

const result = await batchBuilder.execute();
```

### Validation Operations

```typescript
const batchBuilder = createBatchBuilder(sp);

batchBuilder
  .list("CustomList")
    .addValidateUpdateItemUsingPath([
      { FieldName: "Title", FieldValue: "New Item" },
      { FieldName: "Category", FieldValue: "Important" },
      { FieldName: "DueDate", FieldValue: "2024-12-31" }
    ], "/sites/yoursite/Lists/CustomList")
    .validateUpdateListItem(123, [
      { FieldName: "Status", FieldValue: "Approved" },
      { FieldName: "ApprovedBy", FieldValue: "john.doe@company.com" }
    ]);

const result = await batchBuilder.execute();
```

## ⚙️ Configuration

### Retry Configuration

```typescript
const batchBuilder = createBatchBuilder(sp, {
  retryConfig: {
    enabled: true,
    maxRetries: 5,
    retryDelay: 2000, // 2 seconds
    retryableErrors: ['timeout', 'network', '503', '502', '429']
  }
});
```

### Custom Batch Size

```typescript
const batchBuilder = createBatchBuilder(sp, {
  batchSize: 500, // Smaller batches for complex operations
  retryConfig: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000
  }
});
```

## 📊 Result Handling

### Basic Result Processing

```typescript
const result = await batchBuilder.execute();

if (result.success) {
  console.log(`✅ All ${result.totalOperations} operations completed successfully`);
} else {
  console.log(`⚠️ ${result.successfulOperations}/${result.totalOperations} operations succeeded`);
  console.log(`❌ ${result.failedOperations} operations failed`);
}
```

### Detailed Result Analysis

```typescript
const result = await batchBuilder.execute();

// Process successful operations
result.results
  .filter(r => r.success)
  .forEach(operation => {
    console.log(`✅ ${operation.operationType} on ${operation.listName}:`, operation.data);
  });

// Handle failed operations
result.results
  .filter(r => !r.success)
  .forEach(operation => {
    console.error(`❌ ${operation.operationType} failed on ${operation.listName}:`, operation.error);
  });

// Review batch-level errors
result.errors.forEach(error => {
  console.error(`🚨 Batch Error - ${error.operationType} on ${error.listName}:`, error.error);
});
```

### Specific Data Access

```typescript
const result = await batchBuilder.execute();

// Find newly created items
const newItems = result.results
  .filter(r => r.success && r.operationType === 'add')
  .map(r => ({
    listName: r.listName,
    itemId: r.data?.data?.Id,
    title: r.data?.data?.Title
  }));

console.log('Newly created items:', newItems);
```

## 🔍 Available Operations

### Standard Operations

| Method | Parameters | Description |
|--------|------------|-------------|
| `add(data)` | `data: { [key: string]: any }` | Create new list item |
| `update(itemId, data, eTag?)` | `itemId: number, data: { [key: string]: any }, eTag?: string` | Update existing item |
| `delete(itemId, eTag?)` | `itemId: number, eTag?: string` | Delete item |

### Validation Operations

| Method | Parameters | Description |
|--------|------------|-------------|
| `addValidateUpdateItemUsingPath(formValues, path)` | `formValues: IListItemFormUpdateValue[], path: string` | Create item with validation |
| `validateUpdateListItem(itemId, formValues)` | `itemId: number, formValues: IListItemFormUpdateValue[]` | Update item with validation |

### Form Values Format

```typescript
interface IListItemFormUpdateValue {
  FieldName: string;
  FieldValue: string;
}

// Example
const formValues = [
  { FieldName: "Title", FieldValue: "My Title" },
  { FieldName: "Status", FieldValue: "Active" },
  { FieldName: "DueDate", FieldValue: "2024-12-31" }
];
```

## 🏗️ Advanced Usage

### Large Dataset Processing

```typescript
// Process 10,000+ items automatically split into batches
const batchBuilder = createBatchBuilder(sp);

// Add thousands of operations
for (let i = 0; i < 10000; i++) {
  batchBuilder.list("LargeList").add({
    Title: `Item ${i}`,
    Description: `Description for item ${i}`,
    Index: i
  });
}

// Automatically handles batch splitting and execution
const result = await batchBuilder.execute();
```

### Complex Field Updates

```typescript
const batchBuilder = createBatchBuilder(sp);

batchBuilder
  .list("Employees")
    .update(123, {
      Title: "John Doe",
      Department: "IT",
      Manager: { results: [45] }, // Lookup field
      Skills: { results: ["JavaScript", "SharePoint", "TypeScript"] }, // Multi-choice
      HireDate: new Date("2023-01-15"),
      IsActive: true
    })
    .update(124, {
      Title: "Jane Smith",
      Department: "HR",
      Salary: 75000
    });

const result = await batchBuilder.execute();
```

### Error Recovery Patterns

```typescript
const batchBuilder = createBatchBuilder(sp, {
  retryConfig: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000
  }
});

// First attempt
let result = await batchBuilder.execute();

// Retry failed operations
if (!result.success) {
  const failedOperations = result.results.filter(r => !r.success);
  console.log(`Retrying ${failedOperations.length} failed operations...`);
  
  // Create new batch with only failed operations
  const retryBuilder = createBatchBuilder(sp);
  
  failedOperations.forEach(op => {
    if (op.operationType === 'add') {
      retryBuilder.list(op.listName).add(/* original data */);
    }
    // Handle other operation types...
  });
  
  const retryResult = await retryBuilder.execute();
}
```

## 🛡️ Error Handling

### Error Types

1. **Operation-level errors** - Individual operation failures
2. **Batch-level errors** - Failures affecting entire batches
3. **Network errors** - Connection and timeout issues
4. **Validation errors** - SharePoint field validation failures

### Error Response Structure

```typescript
interface IBatchError {
  listName: string;
  operationType: string;
  error: string;
  itemId?: number;
}

interface IOperationResult {
  operationType: string;
  listName: string;
  success: boolean;
  data?: any;
  error?: string;
  retryAttempts?: number;
  itemId?: number;
}
```

## 📝 Best Practices

### 1. Batch Size Optimization

```typescript
// For simple operations (add/update/delete)
const batchBuilder = createBatchBuilder(sp, { batchSize: 1000 });

// For complex operations with large data
const batchBuilder = createBatchBuilder(sp, { batchSize: 100 });

// For validation operations
const batchBuilder = createBatchBuilder(sp, { batchSize: 250 });
```

### 2. Error Handling

```typescript
// Always check results
const result = await batchBuilder.execute();

if (!result.success) {
  // Log errors for debugging
  result.errors.forEach(error => {
    console.error(`Error in ${error.listName}: ${error.error}`);
  });
  
  // Handle partial success scenarios
  if (result.successfulOperations > 0) {
    console.log(`Partial success: ${result.successfulOperations}/${result.totalOperations}`);
  }
}
```

### 3. Performance Optimization

```typescript
// Group operations by list for better performance
batchBuilder
  .list("List1")
    .add(item1)
    .add(item2)
    .update(id1, updates1)
  .list("List2")
    .add(item3)
    .delete(id2);

// Instead of alternating between lists
```

### 4. Memory Management

```typescript
// For very large operations, process in chunks
const CHUNK_SIZE = 5000;
const allOperations = [...]; // Your large dataset

for (let i = 0; i < allOperations.length; i += CHUNK_SIZE) {
  const chunk = allOperations.slice(i, i + CHUNK_SIZE);
  const batchBuilder = createBatchBuilder(sp);
  
  chunk.forEach(op => {
    batchBuilder.list(op.listName).add(op.data);
  });
  
  const result = await batchBuilder.execute();
  console.log(`Processed chunk ${Math.floor(i/CHUNK_SIZE) + 1}`);
}
```

## 🔧 TypeScript Configuration

```typescript
// For strict typing with your SharePoint lists
interface ITaskItem {
  Title: string;
  Status: "Active" | "Completed" | "Pending";
  Priority: "Low" | "Medium" | "High";
  DueDate?: Date;
}

interface IDocumentItem {
  Title: string;
  DocumentType: string;
  Status: "Draft" | "Published" | "Archived";
}

// Use with batch builder
batchBuilder
  .list("Tasks")
    .add({
      Title: "New Task",
      Status: "Active",
      Priority: "High"
    } as ITaskItem);
```

## 🐛 Troubleshooting

### Common Issues

1. **"The current change set contains too many operations"**
   - Reduce batch size in configuration
   - Solution: `{ batchSize: 500 }`

2. **"Request timeout"**
   - Enable retry configuration
   - Reduce batch size for complex operations

3. **"Field validation errors"**
   - Use `validateUpdateListItem` for server-side validation
   - Check field internal names vs display names

4. **"Concurrency errors"**
   - Use eTags for update/delete operations
   - Implement proper conflict resolution

### Debug Mode

```typescript
// Enable detailed logging
const batchBuilder = createBatchBuilder(sp, {
  retryConfig: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000
  }
});

// Log all operations before execution
console.log('Operations to execute:', batchBuilder.getOperations?.());
```

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

Contributions welcome! Please ensure:
- TypeScript compilation passes
- All tests pass
- Follow existing code style
- Add tests for new features

## 📚 Related Documentation

- [PnP.js Documentation](https://pnp.github.io/pnpjs/)
- [SharePoint REST API Reference](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/working-with-lists-and-list-items-with-rest)
- [SharePoint Batch Operations](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/make-batch-requests-with-the-rest-apis)
