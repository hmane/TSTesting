# SharePoint List Schema Generator (Enhanced) - PowerShell

A powerful, enhanced PowerShell script that automatically generates TypeScript field schemas and interfaces from SharePoint lists or PnP provisioning templates. This tool creates type-safe schemas with advanced features like external field mappings, calculated field handling, and PnP template includes processing.

## 🚀 Enhanced Features

### ✨ New in Enhanced Version
- **External Field Type Mappings** - Configurable field type mappings via JSON file
- **PnP Provisioning Template Support** - Generate schemas from offline PnP templates
- **Template Includes Processing** - Automatic processing of PnP template includes
- **Enhanced Calculated Field Handling** - Smart detection and helper functions for calculated fields
- **Safe Updaters** - Automatically exclude calculated fields from updates
- **Flexible Configuration** - Highly customizable with external configuration files

### 🔧 Core Features
- **Automatic Field Detection** - Scans SharePoint lists and extracts all field metadata
- **TypeScript Interface Generation** - Creates strongly-typed interfaces for your list items
- **Field Schema Generation** - Generates complete FieldSchema objects for use with ListItemHelper
- **Smart Type Mapping** - Automatically maps SharePoint field types to appropriate TypeScript types
- **Choice Field Unions** - Converts choice fields to TypeScript union types
- **Helper Function Generation** - Creates type-safe helper functions for each list
- **Interactive Mode** - GUI-like experience for selecting lists to process

## 📋 Prerequisites

### Required Software
- **PowerShell 5.1+** or **PowerShell Core 7+**
- **PnP PowerShell Module** (for SharePoint mode only)

### Install PnP PowerShell (SharePoint Mode)
```powershell
# Install for current user (recommended)
Install-Module -Name PnP.PowerShell -Scope CurrentUser

# Or install globally (requires admin)
Install-Module -Name PnP.PowerShell -Scope AllUsers
```

### Required Files
- **fieldTypeMappings.json** - Field type mapping configuration file
- **Generate-ListSchemas.ps1** - Main PowerShell script

## 🛠️ Installation

1. **Download the files** to your local machine:
   - `Generate-ListSchemas.ps1`
   - `fieldTypeMappings.json`

2. **Place both files** in the same directory

3. **Optional**: Customize `fieldTypeMappings.json` for your needs

4. **Open PowerShell** in the directory containing the script

## 📖 Usage Modes

### 1. SharePoint Live Mode

Generate schemas directly from SharePoint lists:

```powershell
# Basic usage - all lists
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite"

# Specific lists
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -ListNames @("Tasks", "Documents")

# Interactive mode
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -Interactive
```

### 2. PnP Template Mode (Offline)

Generate schemas from PnP provisioning templates:

```powershell
# Basic template processing
.\Generate-ListSchemas.ps1 -TemplateFilePath ".\templates\site-template.xml"

# With includes processing
.\Generate-ListSchemas.ps1 -TemplateFilePath ".\templates\main-template.xml" -ProcessIncludes $true

# Specific lists from template
.\Generate-ListSchemas.ps1 -TemplateFilePath ".\templates\site-template.xml" -ListNames @("Tasks", "Projects")
```

## ⚙️ Configuration Files

### Field Type Mappings (fieldTypeMappings.json)

Customize how SharePoint field types map to TypeScript types:

```json
{
  "Text": {
    "SPFieldType": "SPFieldType.Text",
    "TypeScript": "string",
    "DefaultValue": "\"\""
  },
  "Choice": {
    "SPFieldType": "SPFieldType.Choice",
    "TypeScript": "string",
    "DefaultValue": "\"\""
  },
  "Calculated": {
    "SPFieldType": "SPFieldType.Calculated",
    "TypeScript": "string | number | Date",
    "DefaultValue": "undefined",
    "IsCalculated": true
  }
}
```

### Custom Field Type Mappings

Create your own mapping file:

```powershell
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -FieldTypeMappingsPath ".\custom-mappings.json"
```

## 📁 PnP Template Support

### Supported PnP Template Structure

The script supports standard PnP Provisioning Schema format:

```xml
<?xml version="1.0"?>
<pnp:Provisioning xmlns:pnp="http://schemas.dev.office.com/PnP/2022/09/ProvisioningSchema">
  <pnp:Templates>
    <pnp:ProvisioningTemplate ID="MyTemplate" Version="1">
      
      <!-- Site Fields (Site Columns) -->
      <pnp:SiteFields>
        <Field ID="{GUID}" Name="Priority" Type="Choice" Group="Custom">
          <CHOICES>
            <CHOICE>Low</CHOICE>
            <CHOICE>High</CHOICE>
          </CHOICES>
        </Field>
      </pnp:SiteFields>

      <!-- Lists -->
      <pnp:Lists>
        <pnp:ListInstance Title="Tasks" TemplateType="100">
          <pnp:FieldRefs>
            <pnp:FieldRef ID="{GUID}" Name="Priority" />
          </pnp:FieldRefs>
        </pnp:ListInstance>
      </pnp:Lists>

    </pnp:ProvisioningTemplate>
  </pnp:Templates>
</pnp:Provisioning>
```

### Template Includes Support

For modular templates with includes:

**Main Template (main-template.xml):**
```xml
<pnp:Provisioning xmlns:pnp="http://schemas.dev.office.com/PnP/2022/09/ProvisioningSchema">
  <pnp:Templates>
    <pnp:ProvisioningTemplateFile File="./fields/custom-fields.xml" />
    <pnp:ProvisioningTemplateFile File="./lists/task-lists.xml" />
  </pnp:Templates>
</pnp:Provisioning>
```

**Process with includes:**
```powershell
.\Generate-ListSchemas.ps1 -TemplateFilePath ".\main-template.xml" -ProcessIncludes $true
```

## 🔧 Advanced Configuration

### Calculated Fields Enhancement

```powershell
# Include calculated fields and generate helpers
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -IncludeCalculatedFields $true -GenerateCalculatedFieldHelpers $true
```

Generated calculated field helpers:

```typescript
// Get calculated field names
export function getTasksCalculatedFields(): string[] {
  return ["timeVariance", "budgetVariance"];
}

// Safe updater that excludes calculated fields
export function createTasksUpdaterSafe() {
  const updater = ListItemHelper.createUpdater<ITasks>(TasksSchema);
  // Automatically prevents setting calculated fields
  return updater;
}
```

### Field Filtering Options

```powershell
# Exclude specific fields
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -ExcludeFields @("WorkflowStatus", "Compliance", "Internal_Field")

# Include hidden fields for system integration
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -IncludeHiddenFields $true

# Exclude read-only fields
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -IncludeReadOnlyFields $false
```

## 📊 Parameters Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `SiteUrl` | String | - | SharePoint site URL (required for SharePoint mode) |
| `TemplateFilePath` | String | - | PnP template file path (required for template mode) |
| `ListNames` | String[] | All lists | Specific lists to process |
| `OutputPath` | String | `.\generated-schemas` | Output directory |
| `NamespacePrefix` | String | Empty | File name prefix |
| `GenerateInterfaces` | Switch | True | Generate TypeScript interfaces |
| `GenerateSchemas` | Switch | True | Generate FieldSchema objects |
| `IncludeHiddenFields` | Switch | False | Include hidden fields |
| `IncludeReadOnlyFields` | Switch | True | Include read-only fields |
| `IncludeCalculatedFields` | Switch | True | Include calculated fields |
| `ExcludeFields` | String[] | System fields | Fields to exclude |
| `UseDisplayNames` | Switch | False | Use display names for properties |
| `Interactive` | Switch | False | Interactive list selection |
| `FieldTypeMappingsPath` | String | `.\fieldTypeMappings.json` | Custom mappings file |
| `GenerateCalculatedFieldHelpers` | Switch | True | Generate calculated field helpers |
| `ProcessIncludes` | Switch | True | Process PnP template includes |

## 📁 Generated Files Structure

```
generated-schemas/
├── index.ts                 # Exports all schemas and interfaces
├── Tasks.ts                 # Schema for Tasks list
├── Documents.ts             # Schema for Documents list
├── Projects.ts              # Schema for Projects list
└── fieldTypeMappings.json   # Field type configuration (optional to copy)
```

## 📝 Generated File Examples

### Interface with Calculated Fields

```typescript
// Tasks.ts
export interface ITasks {
  /** Task title */
  title: string;
  /** Current status */
  status: "Not Started" | "In Progress" | "Completed";
  /** Estimated work hours */
  estimatedHours?: number;
  /** Actual work hours */
  actualHours?: number;
  /** Time variance between estimated and actual (Calculated) */
  timeVariance?: number;
}

export const TasksSchema: Record<string, FieldSchema> = {
  title: {
    internalName: "Title",
    type: SPFieldType.Text,
    required: true,
    readonly: false,
    calculated: false
  },
  estimatedHours: {
    internalName: "EstimatedHours",
    type: SPFieldType.Number,
    required: false,
    readonly: false,
    calculated: false
  },
  timeVariance: {
    internalName: "TimeVariance",
    type: SPFieldType.Calculated,
    required: false,
    readonly: true,
    calculated: true,
    formula: "=[ActualHours]-[EstimatedHours]",
    fieldRefs: ["ActualHours", "EstimatedHours"]
  }
};

// Helper functions
export function createTasksUpdater() {
  return ListItemHelper.createUpdater<ITasks>(TasksSchema);
}

export function getTasksCalculatedFields(): string[] {
  return ["timeVariance"];
}

export function createTasksUpdaterSafe() {
  const updater = ListItemHelper.createUpdater<ITasks>(TasksSchema);
  const calculatedFields = getTasksCalculatedFields();
  
  // Override setField to prevent setting calculated fields
  const originalSetField = updater.setField.bind(updater);
  updater.setField = function(fieldKey: any, value: any, originalValue?: any) {
    if (calculatedFields.includes(fieldKey as string)) {
      console.warn(`Skipping calculated field '${fieldKey}' in Tasks updater`);
      return this;
    }
    return originalSetField(fieldKey, value, originalValue);
  };
  
  return updater;
}
```

## 🔗 Integration Examples

### 1. CI/CD Pipeline Integration

```yaml
# Azure DevOps Pipeline
- task: PowerShell@2
  displayName: 'Generate SharePoint Schemas from Template'
  inputs:
    targetType: 'filePath'
    filePath: './scripts/Generate-ListSchemas.ps1'
    arguments: '-TemplateFilePath "./provisioning/site-template.xml" -OutputPath "./src/generated-schemas"'
    workingDirectory: '$(Build.SourcesDirectory)'
```

### 2. NPM Script Integration

```json
{
  "scripts": {
    "generate-schemas": "pwsh ./scripts/Generate-ListSchemas.ps1 -SiteUrl $SHAREPOINT_SITE_URL -OutputPath ./src/schemas",
    "generate-schemas-template": "pwsh ./scripts/Generate-ListSchemas.ps1 -TemplateFilePath ./provisioning/template.xml -OutputPath ./src/schemas"
  }
}
```

### 3. SPFx Integration

```typescript
// In your SPFx web part
import { createTasksUpdaterSafe, ITasks, TasksSchema } from '../generated-schemas';
import { createBatchBuilder } from '../utilities/BatchBuilder';

export default class TaskManagerWebPart extends BaseClientSideWebPart<ITaskManagerWebPartProps> {
  
  private async createTask(taskData: Partial<ITasks>): Promise<void> {
    // Use safe updater that excludes calculated fields
    const updater = createTasksUpdaterSafe();
    updater
      .setField("title", taskData.title!)
      .setField("status", taskData.status || "Not Started")
      .setField("estimatedHours", taskData.estimatedHours)
      .setField("actualHours", taskData.actualHours);
      // timeVariance is automatically excluded as it's calculated

    // Use with batch builder
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

## 💡 Usage Scenarios

### 1. Development Environment Setup

```powershell
# Generate schemas from your development site
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/dev" -OutputPath ".\src\schemas"
```

### 2. Production Deployment Preparation

```powershell
# Generate schemas from PnP template before deployment
.\Generate-ListSchemas.ps1 -TemplateFilePath ".\production-template.xml" -OutputPath ".\src\schemas-prod"
```

### 3. Multi-Environment Schema Validation

```powershell
# Generate from dev environment
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/dev" -OutputPath ".\schemas\dev"

# Generate from template
.\Generate-ListSchemas.ps1 -TemplateFilePath ".\template.xml" -OutputPath ".\schemas\template"

# Compare the generated files to ensure consistency
```

### 4. Complex Template Processing

```powershell
# Process complex template with multiple includes
.\Generate-ListSchemas.ps1 `
    -TemplateFilePath ".\complex-site\main-template.xml" `
    -ProcessIncludes $true `
    -GenerateCalculatedFieldHelpers $true `
    -NamespacePrefix "ComplexSite" `
    -OutputPath ".\src\complex-schemas"
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Field Type Mappings Not Found
```powershell
# Error: Field type mappings file not found
# Solution: Ensure fieldTypeMappings.json exists or specify custom path
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -FieldTypeMappingsPath ".\custom-mappings.json"
```

#### 2. PnP Template Parsing Errors
```powershell
# Error: Failed to process template
# Solution: Validate XML structure and namespace
# Check that the template follows PnP schema format
```

#### 3. Template Includes Not Found
```powershell
# Error: Included file not found
# Solution: Ensure included files exist relative to main template
# Use absolute paths if needed
```

#### 4. Calculated Field Detection Issues
```powershell
# Some calculated fields not detected
# Solution: Update fieldTypeMappings.json to include custom calculated field patterns
```

### Debug Mode

```powershell
# Enable verbose output for debugging
$VerbosePreference = "Continue"
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -Verbose
```

### Authentication Issues (SharePoint Mode)

```powershell
# If authentication fails, try different methods:

# 1. Ensure you have proper permissions
# 2. Try clearing cached credentials:
Clear-PnPAccessToken

# 3. Use specific authentication:
.\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite"
# (Script will prompt for interactive authentication)
```

## 🔄 Best Practices

### 1. Template Organization

```
project/
├── provisioning/
│   ├── main-template.xml
│   ├── fields/
│   │   ├── custom-fields.xml
│   │   └── calculated-fields.xml
│   └── lists/
│       ├── task-lists.xml
│       └── document-libraries.xml
├── scripts/
│   ├── Generate-ListSchemas.ps1
│   └── fieldTypeMappings.json
└── src/
    └── generated-schemas/
```

### 2. Field Type Mapping Maintenance

- Keep `fieldTypeMappings.json` in version control
- Update mappings when adding custom field types
- Test mappings with complex field configurations

### 3. Calculated Field Handling

- Always use safe updaters in production code
- Document calculated field formulas in templates
- Test calculated field generation with complex formulas

### 4. CI/CD Integration

- Generate schemas as part of build process
- Compare generated schemas between environments
- Validate template consistency before deployment

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

Contributions welcome! Please ensure:
- PowerShell best practices are followed
- All new features are documented
- Test with both SharePoint and template modes
- Update field type mappings as needed

## 🔗 Related Documentation

- [PnP Provisioning Schema](https://github.com/pnp/PnP-Provisioning-Schema)
- [PnP PowerShell Documentation](https://pnp.github.io/powershell/)
- [SharePoint Field Types Reference](https://docs.microsoft.com/en-us/previous-versions/office/developer/sharepoint-2010/ms428806(v=office.14))
- [SPFx Field Schema Documentation](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/guidance/use-sp-pnp-js-with-spfx-web-parts)# SharePoint List Schema Generator (PowerShell)

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
