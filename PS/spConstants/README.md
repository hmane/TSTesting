# SharePoint Constants Generator

A PowerShell script that automatically generates TypeScript constants for SharePoint lists, fields, and views. This tool helps developers maintain consistent references to SharePoint entities across different environments.

## Features

- **List Constants**: Generates TypeScript constants for SharePoint lists with clean URLs
- **Field Constants**: Creates typed constants for list fields with proper ordering
- **View Constants**: Optionally includes view constants for list views
- **Environment Portable**: URLs are relative and work across different SharePoint environments
- **Smart Filtering**: Automatically excludes system fields and OOB lists
- **Proper Naming**: Converts SharePoint field names to proper TypeScript property names

## Prerequisites

- PowerShell 5.1 or higher
- PnP PowerShell module: `Install-Module PnP.PowerShell -Scope CurrentUser`
- SharePoint site access with appropriate permissions

## Installation

1. Download the `Generate-SPConstants-Fixed.ps1` script
2. Save it to your preferred directory
3. Ensure you have the PnP PowerShell module installed

## Usage

### Basic Usage

```powershell
.\Generate-SPConstants-Fixed.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/yoursite"
```

### Include Views

```powershell
.\Generate-SPConstants-Fixed.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/yoursite" -IncludeViews
```

### Custom Output Directory

```powershell
.\Generate-SPConstants-Fixed.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/yoursite" -OutputPath "./src/constants"
```

### Include Specific OOB Lists

```powershell
.\Generate-SPConstants-Fixed.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/yoursite" -IncludeOOBLists @("Documents", "Site Pages")
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `SiteUrl` | String | Yes | SharePoint site URL |
| `OutputPath` | String | No | Output directory (default: `./generated`) |
| `IncludeOOBLists` | String[] | No | Specific OOB lists to include |
| `IncludeViews` | Switch | No | Generate view constants |
| `ClientId` | String | No | Custom Azure App Client ID |

## Generated Output

The script generates the following file structure:

```
generated/
├── index.ts                    # Main export file
├── Lists.ts                    # List constants
├── listFields/
│   ├── index.ts               # Fields index
│   └── [ListName]Fields.ts    # Individual field constants
└── listViews/                 # (if -IncludeViews is used)
    ├── index.ts               # Views index
    └── [ListName]Views.ts     # Individual view constants
```

### Example Output

**Lists.ts**
```typescript
export const Lists = {
  TestList1: {
    Title: 'Test List 1',
    Url: '/Lists/Test List 1'
  }
} as const;
```

**TestList1Fields.ts**
```typescript
export const TestList1Fields = {
  ID: 'ID',
  Title: 'Title',
  ContentType: 'ContentType',
  ChoiceField: 'Choice_x0020_Field',
  MultiLineNotes: 'Multi_x0020_Line_x0020_Notes',
  UserField: 'User_x0020_Field',
  Created: 'Created',
  Modified: 'Modified',
  Author: 'Author',
  Editor: 'Editor'
} as const;
```

**TestList1Views.ts** (when using `-IncludeViews`)
```typescript
export const TestList1Views = {
  AllItems: {
    Title: 'All Items',
    Url: '/Lists/Test List 1/AllItems.aspx'
  }
} as const;
```

## Field Ordering

Fields are automatically ordered by priority:

1. **System Core Fields** (ID, Title, ContentType)
2. **Custom Business Fields** (Choice, Multi, User, etc.)
3. **Other Custom Fields**
4. **Metadata Fields** (Created, Modified, Author, Editor)

## Excluded by Default

### Lists
- Documents, Shared Documents
- Site Pages, Site Assets, Style Library
- Master Page Gallery, Web Part Gallery
- Apps for SharePoint, App Catalog
- Form Templates, Solution Gallery
- User Information List, Workflow History

### Fields
- System fields starting with underscore
- Hidden fields
- Read-only computed fields
- Attachments
- File system fields (FileRef, FileDirRef, etc.)
- Workflow and version fields

## Usage in TypeScript/JavaScript

```typescript
import { Lists, TestList1Fields } from './generated';

// Use list constants
const listUrl = Lists.TestList1.Url;
const listTitle = Lists.TestList1.Title;

// Use field constants
const titleField = TestList1Fields.Title;
const choiceField = TestList1Fields.ChoiceField;

// SharePoint REST API example
const apiUrl = `${siteUrl}/_api/web/lists/getbytitle('${Lists.TestList1.Title}')/items?$select=${TestList1Fields.ID},${TestList1Fields.Title},${TestList1Fields.ChoiceField}`;
```

## Troubleshooting

### Authentication Issues
- Ensure you have proper permissions to the SharePoint site
- Try using a different Client ID if the default one doesn't work
- Check if your tenant has specific authentication requirements

### No Fields Generated
- Verify the list exists and is not hidden
- Check if all fields are system fields (which get filtered out)
- Try including OOB lists if you need their fields

### PowerShell Execution Policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Character Encoding Issues
The script handles SharePoint's encoded field names automatically:
- `_x0020_` → Space
- `_x002e_` → Period
- `_x002d_` → Hyphen

## Environment Portability

The generated constants use relative URLs (`/Lists/...`) making them portable across:
- Development, staging, and production environments
- Different SharePoint tenants
- Site collections with different base URLs

Simply prepend your site's base URL when needed:
```typescript
const fullUrl = `${siteBaseUrl}${Lists.TestList1.Url}`;
```

## Best Practices

1. **Version Control**: Include generated files in version control for consistency
2. **CI/CD Integration**: Run the script as part of your build process
3. **Regular Updates**: Regenerate constants when SharePoint schema changes
4. **Environment Separation**: Use different generated constants for different environments if schemas differ

## Contributing

When modifying the script:
1. Test with various SharePoint list configurations
2. Ensure PowerShell compatibility across versions
3. Maintain backward compatibility with generated output
4. Update documentation for any new features

## License

This script is provided as-is for educational and development purposes.
