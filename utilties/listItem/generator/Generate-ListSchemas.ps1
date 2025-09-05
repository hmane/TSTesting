# SharePoint List Schema Generator
# Generates TypeScript field schemas and interfaces from SharePoint lists
# Requires PnP PowerShell module: Install-Module -Name PnP.PowerShell

param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl,
    
    [Parameter(Mandatory = $false)]
    [string[]]$ListNames = @(),
    
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = ".\generated-schemas",
    
    [Parameter(Mandatory = $false)]
    [string]$NamespacePrefix = "",
    
    [Parameter(Mandatory = $false)]
    [switch]$GenerateInterfaces = $true,
    
    [Parameter(Mandatory = $false)]
    [switch]$GenerateSchemas = $true,
    
    [Parameter(Mandatory = $false)]
    [switch]$IncludeHiddenFields = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$IncludeReadOnlyFields = $true,
    
    [Parameter(Mandatory = $false)]
    [string[]]$ExcludeFields = @("Attachments", "GUID", "WorkflowVersion", "WorkflowInstanceID"),
    
    [Parameter(Mandatory = $false)]
    [switch]$UseDisplayNames = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$Interactive = $false
)

# Field type mappings from SharePoint to TypeScript/PnP
$FieldTypeMappings = @{
    "Text" = @{
        "SPFieldType" = "SPFieldType.Text"
        "TypeScript" = "string"
        "DefaultValue" = '""'
    }
    "Note" = @{
        "SPFieldType" = "SPFieldType.Note"
        "TypeScript" = "string"
        "DefaultValue" = '""'
    }
    "Number" = @{
        "SPFieldType" = "SPFieldType.Number"
        "TypeScript" = "number"
        "DefaultValue" = "0"
    }
    "Currency" = @{
        "SPFieldType" = "SPFieldType.Currency"
        "TypeScript" = "number"
        "DefaultValue" = "0"
    }
    "DateTime" = @{
        "SPFieldType" = "SPFieldType.DateTime"
        "TypeScript" = "Date"
        "DefaultValue" = "new Date()"
    }
    "Boolean" = @{
        "SPFieldType" = "SPFieldType.Boolean"
        "TypeScript" = "boolean"
        "DefaultValue" = "false"
    }
    "Choice" = @{
        "SPFieldType" = "SPFieldType.Choice"
        "TypeScript" = "string"
        "DefaultValue" = '""'
    }
    "MultiChoice" = @{
        "SPFieldType" = "SPFieldType.MultiChoice"
        "TypeScript" = "string[]"
        "DefaultValue" = "[]"
    }
    "Lookup" = @{
        "SPFieldType" = "SPFieldType.Lookup"
        "TypeScript" = "number"
        "DefaultValue" = "undefined"
    }
    "LookupMulti" = @{
        "SPFieldType" = "SPFieldType.LookupMulti"
        "TypeScript" = "number[]"
        "DefaultValue" = "[]"
    }
    "User" = @{
        "SPFieldType" = "SPFieldType.User"
        "TypeScript" = "IPrincipal"
        "DefaultValue" = "undefined"
    }
    "UserMulti" = @{
        "SPFieldType" = "SPFieldType.UserMulti"
        "TypeScript" = "IPrincipal[]"
        "DefaultValue" = "[]"
    }
    "URL" = @{
        "SPFieldType" = "SPFieldType.URL"
        "TypeScript" = "string"
        "DefaultValue" = '""'
    }
    "Counter" = @{
        "SPFieldType" = "SPFieldType.Counter"
        "TypeScript" = "number"
        "DefaultValue" = "0"
    }
    "TaxonomyFieldType" = @{
        "SPFieldType" = "SPFieldType.TaxonomyFieldType"
        "TypeScript" = "TaxonomyFieldValue"
        "DefaultValue" = "undefined"
    }
    "TaxonomyFieldTypeMulti" = @{
        "SPFieldType" = "SPFieldType.TaxonomyFieldTypeMulti"
        "TypeScript" = "TaxonomyFieldValue[]"
        "DefaultValue" = "[]"
    }
}

# Common field exclusions
$DefaultExcludeFields = @(
    "Attachments", "GUID", "WorkflowVersion", "WorkflowInstanceID", 
    "PermMask", "UniqueId", "ProgId", "ScopeId", "MetaInfo", 
    "TimeLastModified", "TimeCreated", "ItemChildCount", "FolderChildCount",
    "AppAuthor", "AppEditor", "_Level", "_IsCurrentVersion", "ParentLeafName",
    "ParentVersionString", "CheckinComment", "_CheckinComment", "_CopySource"
)

# Combine with user-provided exclusions
$AllExcludeFields = $DefaultExcludeFields + $ExcludeFields | Sort-Object -Unique

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Get-SafeTypeName {
    param([string]$Name)
    
    # Convert to PascalCase and remove special characters
    $safeName = $Name -replace '[^a-zA-Z0-9]', ' '
    $safeName = (Get-Culture).TextInfo.ToTitleCase($safeName.ToLower()) -replace ' ', ''
    
    # Ensure it starts with a letter
    if ($safeName -match '^[0-9]') {
        $safeName = "Item$safeName"
    }
    
    return $safeName
}

function Get-SafePropertyName {
    param([string]$Name)
    
    # Convert to camelCase and remove special characters
    $safeName = $Name -replace '[^a-zA-Z0-9]', ' '
    $words = $safeName.Split(' ', [StringSplitOptions]::RemoveEmptyEntries)
    
    if ($words.Length -eq 0) {
        return "field"
    }
    
    $camelCase = $words[0].ToLower()
    for ($i = 1; $i -lt $words.Length; $i++) {
        $camelCase += (Get-Culture).TextInfo.ToTitleCase($words[$i].ToLower())
    }
    
    # Handle reserved keywords
    $reservedKeywords = @("constructor", "prototype", "function", "return", "var", "let", "const", "if", "else", "for", "while", "do", "break", "continue", "switch", "case", "default", "try", "catch", "finally", "throw", "new", "delete", "typeof", "instanceof", "this", "super", "class", "extends", "implements", "interface", "public", "private", "protected", "static", "readonly", "abstract", "async", "await", "import", "export", "from", "as", "default")
    
    if ($reservedKeywords -contains $camelCase) {
        $camelCase = "_$camelCase"
    }
    
    return $camelCase
}

function Get-FieldTypeInfo {
    param([object]$Field)
    
    $fieldType = $Field.TypeAsString
    $typeInfo = $FieldTypeMappings[$fieldType]
    
    if (-not $typeInfo) {
        # Handle unknown field types
        Write-ColorOutput "Warning: Unknown field type '$fieldType' for field '$($Field.InternalName)'. Using default string type." "Yellow"
        $typeInfo = @{
            "SPFieldType" = "SPFieldType.Text"
            "TypeScript" = "string"
            "DefaultValue" = '""'
        }
    }
    
    # Handle special cases
    if ($fieldType -eq "Choice" -and $Field.Choices) {
        # Create union type for choices
        $choices = $Field.Choices | ForEach-Object { "'$_'" }
        $typeInfo.TypeScript = $choices -join " | "
    }
    
    return $typeInfo
}

function Get-ListFields {
    param(
        [string]$ListName,
        [bool]$IncludeHidden,
        [bool]$IncludeReadOnly,
        [string[]]$ExcludeFields
    )
    
    try {
        Write-ColorOutput "  Retrieving fields for list '$ListName'..." "Cyan"
        
        $list = Get-PnPList -Identity $ListName -ErrorAction Stop
        $fields = Get-PnPField -List $ListName -ErrorAction Stop
        
        $filteredFields = $fields | Where-Object {
            $field = $_
            
            # Basic filters
            $include = $true
            
            # Exclude hidden fields if requested
            if (-not $IncludeHidden -and $field.Hidden) {
                $include = $false
            }
            
            # Exclude readonly fields if requested
            if (-not $IncludeReadOnly -and $field.ReadOnlyField) {
                $include = $false
            }
            
            # Exclude fields in exclusion list
            if ($ExcludeFields -contains $field.InternalName -or $ExcludeFields -contains $field.Title) {
                $include = $false
            }
            
            # Exclude system fields that are not useful
            if ($field.InternalName -like "*_*" -and $field.InternalName -notlike "*_x00*") {
                # Allow encoded fields but exclude most system fields
                if ($field.InternalName -like "_*" -or $field.InternalName -like "ows*" -or $field.InternalName -like "HTML*") {
                    $include = $false
                }
            }
            
            return $include
        }
        
        Write-ColorOutput "  Found $($filteredFields.Count) fields (filtered from $($fields.Count) total)" "Green"
        return $filteredFields
        
    } catch {
        Write-ColorOutput "  Error retrieving fields for list '$ListName': $($_.Exception.Message)" "Red"
        return @()
    }
}

function Generate-FieldSchema {
    param([object]$Field, [string]$PropertyName)
    
    $typeInfo = Get-FieldTypeInfo -Field $Field
    $required = if ($Field.Required) { "true" } else { "false" }
    $readonly = if ($Field.ReadOnlyField) { "true" } else { "false" }
    
    $schema = @"
  $PropertyName: {
    internalName: "$($Field.InternalName)",
    type: $($typeInfo.SPFieldType),
    required: $required,
    readonly: $readonly"@

    # Add default value if available
    if ($Field.DefaultValue) {
        $defaultValue = $Field.DefaultValue -replace '"', '\"'
        $schema += ",`n    defaultValue: `"$defaultValue`""
    }
    
    # Add choices for choice fields
    if ($Field.TypeAsString -eq "Choice" -and $Field.Choices) {
        $choices = $Field.Choices | ForEach-Object { "`"$_`"" }
        $schema += ",`n    choices: [$($choices -join ', ')]"
    }
    
    # Add lookup list info for lookup fields
    if ($Field.TypeAsString -eq "Lookup" -or $Field.TypeAsString -eq "LookupMulti") {
        if ($Field.LookupList) {
            $schema += ",`n    lookupListId: `"$($Field.LookupList)`""
        }
        if ($Field.LookupField) {
            $schema += ",`n    lookupField: `"$($Field.LookupField)`""
        }
    }
    
    $schema += "`n  }"
    
    return $schema
}

function Generate-InterfaceProperty {
    param([object]$Field, [string]$PropertyName)
    
    $typeInfo = Get-FieldTypeInfo -Field $Field
    $optional = if ($Field.Required) { "" } else { "?" }
    $description = if ($Field.Description) { $Field.Description -replace '"', '\"' } else $Field.Title
    
    $property = @"
  /** $description */
  $PropertyName$optional: $($typeInfo.TypeScript);"@
    
    return $property
}

function Generate-TypeScriptFile {
    param(
        [string]$ListName,
        [object[]]$Fields,
        [string]$OutputPath,
        [string]$NamespacePrefix,
        [bool]$GenerateInterfaces,
        [bool]$GenerateSchemas,
        [bool]$UseDisplayNames
    )
    
    $safeName = Get-SafeTypeName -Name $ListName
    $fileName = "$NamespacePrefix$safeName.ts"
    $filePath = Join-Path $OutputPath $fileName
    
    # Create file content
    $content = @"
// Auto-generated schema for SharePoint list: $ListName
// Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
// Source: $SiteUrl

import { SPFieldType } from "@pnp/sp/fields";
import { IPrincipal } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { FieldSchema, TaxonomyFieldValue } from "./ListItemHelper";

"@

    if ($GenerateInterfaces) {
        $content += @"

/**
 * Interface for $ListName list items
 */
export interface I$safeName {
"@
        
        foreach ($field in $Fields) {
            $propertyName = if ($UseDisplayNames) { 
                Get-SafePropertyName -Name $field.Title 
            } else { 
                Get-SafePropertyName -Name $field.InternalName 
            }
            
            $property = Generate-InterfaceProperty -Field $field -PropertyName $propertyName
            $content += "`n$property"
        }
        
        $content += "`n}"
    }
    
    if ($GenerateSchemas) {
        $content += @"

/**
 * Field schema for $ListName list
 */
export const $($safeName)Schema: Record<string, FieldSchema> = {
"@
        
        $schemaProperties = @()
        foreach ($field in $Fields) {
            $propertyName = if ($UseDisplayNames) { 
                Get-SafePropertyName -Name $field.Title 
            } else { 
                Get-SafePropertyName -Name $field.InternalName 
            }
            
            $schema = Generate-FieldSchema -Field $field -PropertyName $propertyName
            $schemaProperties += $schema
        }
        
        $content += "`n$($schemaProperties -join ",`n")"
        $content += "`n};"
        
        # Add helper functions
        $content += @"

/**
 * Create a typed updater for $ListName items
 */
export function create$($safeName)Updater() {
  return ListItemHelper.createUpdater<I$safeName>($($safeName)Schema);
}

/**
 * Extract $ListName item data with type safety
 */
export function extract$($safeName)Data(item: any): I$safeName {
  return ListItemHelper.extract<I$safeName>(item, $($safeName)Schema);
}

/**
 * Safely extract $ListName item data
 */
export function safeExtract$($safeName)Data(item: any) {
  return ListItemHelper.safeExtract<I$safeName>(item, $($safeName)Schema);
}
"@
    }
    
    # Write file
    $content | Out-File -FilePath $filePath -Encoding UTF8
    Write-ColorOutput "  Generated: $fileName" "Green"
    
    return @{
        FileName = $fileName
        FilePath = $filePath
        ListName = $ListName
        FieldCount = $Fields.Count
        InterfaceName = "I$safeName"
        SchemaName = "$($safeName)Schema"
    }
}

function Generate-IndexFile {
    param(
        [object[]]$GeneratedFiles,
        [string]$OutputPath,
        [string]$NamespacePrefix
    )
    
    $indexPath = Join-Path $OutputPath "index.ts"
    
    $content = @"
// Auto-generated index file for SharePoint list schemas
// Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
// Source: $SiteUrl

// Export all generated schemas and interfaces
"@
    
    foreach ($file in $GeneratedFiles) {
        $moduleName = [System.IO.Path]::GetFileNameWithoutExtension($file.FileName)
        $content += "`nexport * from './$moduleName';"
    }
    
    $content += @"

// Re-export helper utilities
export { ListItemHelper, FieldSchema, TaxonomyFieldValue } from './ListItemHelper';
"@
    
    $content | Out-File -FilePath $indexPath -Encoding UTF8
    Write-ColorOutput "Generated index file: index.ts" "Green"
}

function Show-Summary {
    param([object[]]$GeneratedFiles)
    
    Write-ColorOutput "`n=== Generation Summary ===" "Magenta"
    Write-ColorOutput "Total lists processed: $($GeneratedFiles.Count)" "White"
    Write-ColorOutput "Output directory: $OutputPath" "White"
    
    foreach ($file in $GeneratedFiles) {
        Write-ColorOutput "  ✓ $($file.ListName) -> $($file.FileName) ($($file.FieldCount) fields)" "Green"
    }
    
    Write-ColorOutput "`nNext steps:" "Yellow"
    Write-ColorOutput "1. Copy the generated files to your SPFx project" "White"
    Write-ColorOutput "2. Install required dependencies if not already present:" "White"
    Write-ColorOutput "   npm install @pnp/sp @pnp/spfx-controls-react" "Gray"
    Write-ColorOutput "3. Import and use the generated schemas:" "White"
    Write-ColorOutput "   import { ITaskSchema, createTaskUpdater } from './generated-schemas';" "Gray"
}

# Main execution
try {
    Write-ColorOutput "SharePoint List Schema Generator" "Magenta"
    Write-ColorOutput "================================" "Magenta"
    
    # Check if PnP PowerShell is available
    if (-not (Get-Module -ListAvailable -Name "PnP.PowerShell")) {
        Write-ColorOutput "Error: PnP.PowerShell module is not installed." "Red"
        Write-ColorOutput "Please install it using: Install-Module -Name PnP.PowerShell" "Yellow"
        exit 1
    }
    
    # Connect to SharePoint
    Write-ColorOutput "`nConnecting to SharePoint: $SiteUrl" "Cyan"
    try {
        Connect-PnPOnline -Url $SiteUrl -Interactive
        Write-ColorOutput "Successfully connected to SharePoint" "Green"
    } catch {
        Write-ColorOutput "Failed to connect to SharePoint: $($_.Exception.Message)" "Red"
        exit 1
    }
    
    # Create output directory
    if (-not (Test-Path $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
        Write-ColorOutput "Created output directory: $OutputPath" "Green"
    }
    
    # Get lists to process
    if ($ListNames.Count -eq 0 -or $Interactive) {
        Write-ColorOutput "`nRetrieving available lists..." "Cyan"
        $allLists = Get-PnPList | Where-Object { -not $_.Hidden -and $_.BaseType -eq "GenericList" } | Sort-Object Title
        
        if ($Interactive) {
            Write-ColorOutput "`nAvailable lists:" "Yellow"
            for ($i = 0; $i -lt $allLists.Count; $i++) {
                Write-ColorOutput "  [$($i + 1)] $($allLists[$i].Title)" "White"
            }
            
            Write-ColorOutput "`nEnter list numbers to process (comma-separated, or 'all' for all lists):" "Yellow"
            $selection = Read-Host
            
            if ($selection.ToLower() -eq "all") {
                $ListNames = $allLists.Title
            } else {
                $indices = $selection.Split(',') | ForEach-Object { [int]$_.Trim() - 1 }
                $ListNames = $indices | ForEach-Object { $allLists[$_].Title }
            }
        } else {
            $ListNames = $allLists.Title
        }
    }
    
    Write-ColorOutput "`nProcessing $($ListNames.Count) lists..." "Cyan"
    
    # Process each list
    $generatedFiles = @()
    
    foreach ($listName in $ListNames) {
        Write-ColorOutput "`nProcessing list: $listName" "Yellow"
        
        # Get fields for the list
        $fields = Get-ListFields -ListName $listName -IncludeHidden $IncludeHiddenFields -IncludeReadOnly $IncludeReadOnlyFields -ExcludeFields $AllExcludeFields
        
        if ($fields.Count -eq 0) {
            Write-ColorOutput "  Skipping '$listName' - no fields found" "Yellow"
            continue
        }
        
        # Generate TypeScript file
        $fileInfo = Generate-TypeScriptFile -ListName $listName -Fields $fields -OutputPath $OutputPath -NamespacePrefix $NamespacePrefix -GenerateInterfaces $GenerateInterfaces -GenerateSchemas $GenerateSchemas -UseDisplayNames $UseDisplayNames
        $generatedFiles += $fileInfo
    }
    
    # Generate index file
    if ($generatedFiles.Count -gt 0) {
        Generate-IndexFile -GeneratedFiles $generatedFiles -OutputPath $OutputPath -NamespacePrefix $NamespacePrefix
    }
    
    # Show summary
    Show-Summary -GeneratedFiles $generatedFiles
    
} catch {
    Write-ColorOutput "An error occurred: $($_.Exception.Message)" "Red"
    Write-ColorOutput "Stack trace: $($_.ScriptStackTrace)" "Red"
} finally {
    # Disconnect from SharePoint
    try {
        Disconnect-PnPOnline
        Write-ColorOutput "`nDisconnected from SharePoint" "Gray"
    } catch {
        # Ignore disconnect errors
    }
}

<#
.SYNOPSIS
    Generates TypeScript field schemas and interfaces from SharePoint lists

.DESCRIPTION
    This PowerShell script connects to a SharePoint site and generates TypeScript 
    field schemas and interfaces that can be used with the ListItemHelper utility.
    It automatically handles field type mappings and creates type-safe schemas.

.PARAMETER SiteUrl
    The URL of the SharePoint site to connect to

.PARAMETER ListNames
    Array of list names to process. If empty, processes all non-hidden lists

.PARAMETER OutputPath
    Directory path where generated files will be saved. Default: .\generated-schemas

.PARAMETER NamespacePrefix
    Prefix to add to generated file names. Useful for avoiding naming conflicts

.PARAMETER GenerateInterfaces
    Whether to generate TypeScript interfaces. Default: true

.PARAMETER GenerateSchemas
    Whether to generate field schemas. Default: true

.PARAMETER IncludeHiddenFields
    Whether to include hidden fields in the schema. Default: false

.PARAMETER IncludeReadOnlyFields
    Whether to include read-only fields in the schema. Default: true

.PARAMETER ExcludeFields
    Array of field names to exclude from generation

.PARAMETER UseDisplayNames
    Use display names instead of internal names for property names. Default: false

.PARAMETER Interactive
    Run in interactive mode to select lists manually. Default: false

.EXAMPLE
    .\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite"
    
    Generates schemas for all lists in the site

.EXAMPLE
    .\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -ListNames @("Tasks", "Documents") -OutputPath ".\src\schemas"
    
    Generates schemas for specific lists and saves to a custom directory

.EXAMPLE
    .\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -Interactive
    
    Runs in interactive mode to select lists manually

.NOTES
    Requires PnP.PowerShell module: Install-Module -Name PnP.PowerShell
    Generated files work with the ListItemHelper utility for type-safe SharePoint operations
#>
