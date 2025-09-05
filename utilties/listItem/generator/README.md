# SharePoint List Schema Generator (PowerShell)

A powerful PowerShell script that automatically generates TypeScript field schemas and interfaces from your SharePoint lists. This tool creates type-safe schemas that work seamlessly with the ListItemHelper utility for SPFx development.

## 🚀 Features

- **Automatic Field Detection** - Scans SharePoint lists and extracts all field metadata
- **TypeScript Interface Generation** - Creates strongly-typed interfaces for your list items
- **Field Schema Generation** - Generates complete FieldSchema objects for use with ListItemHelper
- **Smart Type Mapping** - Automatically maps SharePoint field types to appropriate TypeScript types
- **Choice Field Unions** - Converts choice fields to TypeScript union types
- **Helper Function Generation** - Creates type-safe helper functions for each list
- **Flexible Configuration** - Extensive options for customizing the generation process
- **Interactive Mode** - GUI-like experience for selecting lists to process

## 📋 Prerequisites

### Required Software
- **PowerShell 5.1+** or **PowerShell Core 7+**
- **PnP PowerShell Module**

### Install PnP PowerShell
```powershell
# Install for current user (recommended)
Install-Module -Name PnP.PowerShell -Scope CurrentUser

# Or install globally (requires admin)
Install-Module -Name PnP.PowerShell -Scope AllUsers
```

### Verify Installation
```powershell
Get-Module -ListAvailable -Name PnP.PowerShell
```

## 🛠️ Installation

1. **Download the script** to your local machine
2. **Save as** `Generate-ListSchemas.ps1`
3. **Open PowerShell** in the directory containing the script

## 📖 Usage

### Basic Usage

```powershell
# Generate schemas for all lists in a site
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite"
```

### Interactive Mode
```powershell
# Select lists interactively
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -Interactive
```

### Specific Lists
```powershell
# Generate schemas for specific lists only
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -ListNames @("Tasks", "Documents", "Announcements")
```

### Custom Output Directory
```powershell
# Save to a specific directory
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -OutputPath ".\src\generated-schemas"
```

### Advanced Configuration
```powershell
# Full configuration example
.\Generate-ListSchemas.ps1 `
    -SiteUrl "https://contoso.sharepoint.com/sites/mysite" `
    -ListNames @("Tasks", "Projects") `
    -OutputPath ".\src\schemas" `
    -NamespacePrefix "SP" `
    -IncludeHiddenFields $false `
    -IncludeReadOnlyFields $true `
    -UseDisplayNames $false `
    -ExcludeFields @("WorkflowStatus", "Compliance")
```

## ⚙️ Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `SiteUrl` | String | Required | SharePoint site URL to connect to |
| `ListNames` | String[] | All lists | Specific lists to process. If empty, processes all non-hidden lists |
| `OutputPath` | String | `.\generated-schemas` | Directory where generated files will be saved |
| `NamespacePrefix` | String | Empty | Prefix for generated file names (e.g., "SP" creates "SPTasks.ts") |
| `GenerateInterfaces` | Switch | True | Whether to generate TypeScript interfaces |
| `GenerateSchemas` | Switch | True | Whether to generate FieldSchema objects |
| `IncludeHiddenFields` | Switch | False | Include SharePoint hidden fields |
| `IncludeReadOnlyFields` | Switch | True | Include read-only fields |
| `ExcludeFields` | String[] | See below | Field names to exclude from generation |
| `UseDisplayNames` | Switch | False | Use display names instead of internal names for properties |
| `Interactive` | Switch | False | Run in interactive mode for list selection |

### Default Excluded Fields
The script automatically excludes these system fields:
- `Attachments`, `GUID`, `WorkflowVersion`, `WorkflowInstanceID`
- `PermMask`, `UniqueId`, `ProgId`, `ScopeId`, `MetaInfo`
- `TimeLastModified`, `TimeCreated`, `ItemChildCount`, `FolderChildCount`
- `AppAuthor`, `AppEditor`, `_Level`, `_IsCurrentVersion`
- `ParentLeafName`, `ParentVersionString`, `CheckinComment`

## 📁 Generated Files Structure

```
generated-schemas/
├── index.ts                 # Exports all schemas and interfaces
├── Tasks.ts                 # Schema for Tasks list
├── Documents.ts             # Schema for Documents list
├── Projects.ts              # Schema for Projects list
└── ...
```

### Example Generated File

```typescript
// Tasks.ts
import { SPFieldType } from "@pnp/sp/fields";
import { IPrincipal } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { FieldSchema, TaxonomyFieldValue } from "./ListItemHelper";

/**
 * Interface for Tasks list items
 */
export interface ITasks {
  /** Task title */
  title: string;
  /** Current status of the task */
  status: "Not Started" | "In Progress" | "Completed" | "Deferred";
  /** Person assigned to this task */
  assignedTo?: IPrincipal;
  /** Due date for completion */
  dueDate?: Date;
  /** Task priority level */
  priority: "Low" | "Normal" | "High";
  /** Completion percentage */
  percentComplete?: number;
  /** Task description */
  description?: string;
}

/**
 * Field schema for Tasks list
 */
export const TasksSchema: Record<string, FieldSchema> = {
  title: {
    internalName: "Title",
    type: SPFieldType.Text,
    required: true,
    readonly: false
  },
  status: {
    internalName: "Status",
    type: SPFieldType.Choice,
    required: false,
    readonly: false,
    choices: ["Not Started", "In Progress", "Completed", "Deferred"]
  },
  assignedTo: {
    internalName: "AssignedTo",
    type: SPFieldType.User,
    required: false,
    readonly: false
  },
  dueDate: {
    internalName: "DueDate",
    type: SPFieldType.DateTime,
    required: false,
    readonly: false
  },
  priority: {
    internalName: "Priority",
    type: SPFieldType.Choice,
    required: false,
    readonly: false,
    choices: ["Low", "Normal", "High"]
  },
  percentComplete: {
    internalName: "PercentComplete",
    type: SPFieldType.Number,
    required: false,
    readonly: false
  },
  description: {
    internalName: "Body",
    type: SPFieldType.Note,
    required: false,
    readonly: false
  }
};

/**
 * Create a typed updater for Tasks items
 */
export function createTasksUpdater() {
  return ListItemHelper.createUpdater<ITasks>(TasksSchema);
}

/**
 * Extract Tasks item data with type safety
 */
export function extractTasksData(item: any): ITasks {
  return ListItemHelper.extract<ITasks>(item, TasksSchema);
}

/**
 * Safely extract Tasks item data
 */
export function safeExtractTasksData(item: any) {
  return ListItemHelper.safeExtract<ITasks>(item, TasksSchema);
}
```

## 🔧 Field Type Mappings

The script automatically maps SharePoint field types to appropriate TypeScript types:

| SharePoint Type | TypeScript Type | Schema Type |
|-----------------|-----------------|-------------|
| Text | `string` | `SPFieldType.Text` |
| Note | `string` | `SPFieldType.Note` |
| Number | `number` | `SPFieldType.Number` |
| Currency | `number` | `SPFieldType.Currency` |
| DateTime | `Date` | `SPFieldType.DateTime` |
| Boolean | `boolean` | `SPFieldType.Boolean` |
| Choice | `"Option1" \| "Option2"` | `SPFieldType.Choice` |
| MultiChoice | `string[]` | `SPFieldType.MultiChoice` |
| User | `IPrincipal` | `SPFieldType.User` |
| UserMulti | `IPrincipal[]` | `SPFieldType.UserMulti` |
| Lookup | `number` | `SPFieldType.Lookup` |
| LookupMulti | `number[]` | `SPFieldType.LookupMulti` |
| TaxonomyFieldType | `TaxonomyFieldValue` | `SPFieldType.TaxonomyFieldType` |
| URL | `string` | `SPFieldType.URL` |

## 💡 Usage Examples

### 1. Generate All Schemas
```powershell
# Connect and generate schemas for all lists
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/projectsite"
```

### 2. Interactive List Selection
```powershell
# Run in interactive mode
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/projectsite" -Interactive

# Output:
# Available lists:
#   [1] Tasks
#   [2] Documents
#   [3] Issues
#   [4] Calendar
#   [5] Announcements
# 
# Enter list numbers to process (comma-separated, or 'all' for all lists):
# 1,3,5
```

### 3. Specific Lists with Custom Settings
```powershell
# Generate for specific lists with custom configuration
.\Generate-ListSchemas.ps1 `
    -SiteUrl "https://contoso.sharepoint.com/sites/hr" `
    -ListNames @("Employees", "Departments", "Benefits") `
    -OutputPath ".\src\hr-schemas" `
    -NamespacePrefix "HR" `
    -UseDisplayNames $true
```

### 4. Include Hidden Fields for Advanced Scenarios
```powershell
# Include hidden fields for system integration
.\Generate-ListSchemas.ps1 `
    -SiteUrl "https://contoso.sharepoint.com/sites/system" `
    -IncludeHiddenFields $true `
    -IncludeReadOnlyFields $true `
    -ExcludeFields @()
```

## 🔗 Integration with SPFx

### 1. Copy Generated Files
```bash
# Copy generated schemas to your SPFx project
cp -r ./generated-schemas/* ./src/schemas/
```

### 2. Install Dependencies
```bash
# Install required packages if not already present
npm install @pnp/sp @pnp/spfx-controls-react
```

### 3. Use in Your Code
```typescript
// In your SPFx web part
import { createTasksUpdater, ITasks, TasksSchema } from '../schemas';
import { createBatchBuilder } from '../utilities/BatchBuilder';
import { createPermissionHelper, SPPermissionLevel } from '../utilities/PermissionHelper';

export default class TaskManagerWebPart extends BaseClientSideWebPart<ITaskManagerWebPartProps> {
  
  public async onInit(): Promise<void> {
    this.sp = spfi().using(SPFx(this.context));
  }

  private async createTask(taskData: Partial<ITasks>): Promise<void> {
    // Check permissions
    const permHelper = createPermissionHelper(this.sp);
    const canCreate = await permHelper.userHasPermissionOnList("Tasks", SPPermissionLevel.Contribute);
    
    if (!canCreate.hasPermission) {
      throw new Error("Insufficient permissions to create tasks");
    }

    // Create type-safe updater
    const updater = createTasksUpdater();
    updater
      .setField("title", taskData.title!)
      .setField("status", taskData.status || "Not Started")
      .setField("assignedTo", taskData.assignedTo)
      .setField("dueDate", taskData.dueDate)
      .setField("priority", taskData.priority || "Normal");

    // Use batch builder for creation
    const batchBuilder = createBatchBuilder(this.sp);
    batchBuilder
      .list("Tasks")
      .addValidateUpdateItemUsingPath(
        updater.getUpdatesForValidate(),
        "/sites/mysite/Lists/Tasks"
      );

    const result = await batchBuilder.execute();
    
    if (result.success) {
      console.log("Task created successfully");
    } else {
      console.error("Failed to create task:", result.errors);
    }
  }
}
```

## 🔍 Troubleshooting

### Authentication Issues
```powershell
# If you get authentication errors, try different connection methods:

# Modern authentication (recommended)
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite"

# If the above fails, the script will prompt for interactive login
```

### Permission Issues
```powershell
# Ensure you have at least Read permissions to:
# - The SharePoint site
# - All lists you want to process
# - The list fields and schemas
```

### Module Issues
```powershell
# If PnP.PowerShell is not found:
Install-Module -Name PnP.PowerShell -Force -AllowClobber

# Update to latest version:
Update-Module -Name PnP.PowerShell

# Check version:
Get-Module -Name PnP.PowerShell -ListAvailable
```

### Large List Issues
```powershell
# For sites with many lists, use specific list names:
.\Generate-ListSchemas.ps1 `
    -SiteUrl "https://contoso.sharepoint.com/sites/mysite" `
    -ListNames @("Tasks", "Documents") # Only process specific lists
```

## 📈 Performance Tips

1. **Use Specific Lists** - Only generate schemas for lists you actually use
2. **Exclude Unnecessary Fields** - Use `-ExcludeFields` to remove fields you don't need
3. **Run Periodically** - Re-run when list schemas change
4. **Cache Results** - Generated files don't change unless list structure changes

## 🔄 Workflow Integration

### CI/CD Pipeline Integration
```yaml
# Azure DevOps Pipeline example
- task: PowerShell@2
  displayName: 'Generate SharePoint Schemas'
  inputs:
    targetType: 'filePath'
    filePath: './scripts/Generate-ListSchemas.ps1'
    arguments: '-SiteUrl $(SharePointSiteUrl) -OutputPath "./src/generated-schemas"'
    workingDirectory: '$(Build.SourcesDirectory)'
```

### NPM Script Integration
```json
{
  "scripts": {
    "generate-schemas": "pwsh ./scripts/Generate-ListSchemas.ps1 -SiteUrl $
