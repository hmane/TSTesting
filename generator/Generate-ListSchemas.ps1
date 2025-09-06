# SharePoint List Schema Generator (Enhanced)
# Generates TypeScript field schemas and interfaces from SharePoint lists or PnP templates
# Requires PnP PowerShell module: Install-Module -Name PnP.PowerShell

param(
    [Parameter(Mandatory = $false)]
    [string]$SiteUrl = "",
    
    [Parameter(Mandatory = $false)]
    [string]$TemplateFilePath = "",
    
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
    [switch]$IncludeCalculatedFields = $true,
    
    [Parameter(Mandatory = $false)]
    [string[]]$ExcludeFields = @("Attachments", "GUID", "WorkflowVersion", "WorkflowInstanceID"),
    
    [Parameter(Mandatory = $false)]
    [switch]$UseDisplayNames = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$Interactive = $false,
    
    [Parameter(Mandatory = $false)]
    [string]$FieldTypeMappingsPath = "",
    
    [Parameter(Mandatory = $false)]
    [switch]$GenerateCalculatedFieldHelpers = $true,
    
    [Parameter(Mandatory = $false)]
    [switch]$ProcessIncludes = $true
)

# Validate parameters
if ([string]::IsNullOrEmpty($SiteUrl) -and [string]::IsNullOrEmpty($TemplateFilePath)) {
    Write-Error "Either -SiteUrl or -TemplateFilePath must be provided"
    exit 1
}

if (-not [string]::IsNullOrEmpty($SiteUrl) -and -not [string]::IsNullOrEmpty($TemplateFilePath)) {
    Write-Error "Cannot specify both -SiteUrl and -TemplateFilePath. Choose one source."
    exit 1
}

# Load field type mappings
$MappingFilePath = if ([string]::IsNullOrEmpty($FieldTypeMappingsPath)) {
    Join-Path $PSScriptRoot "fieldTypeMappings.json"
} else {
    $FieldTypeMappingsPath
}

if (-not (Test-Path $MappingFilePath)) {
    Write-Error "Field type mappings file not found: $MappingFilePath"
    Write-Host "Please ensure fieldTypeMappings.json exists in the script directory or provide -FieldTypeMappingsPath"
    exit 1
}

try {
    $FieldTypeMappings = Get-Content -Path $MappingFilePath -Raw | ConvertFrom-Json -AsHashtable
    Write-Host "Loaded field type mappings from: $MappingFilePath" -ForegroundColor Green
} catch {
    Write-Error "Failed to load field type mappings: $($_.Exception.Message)"
    exit 1
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
    
    $fieldType = if ($Field.PSObject.Properties.Name -contains 'TypeAsString') {
        $Field.TypeAsString
    } elseif ($Field.PSObject.Properties.Name -contains 'Type') {
        $Field.Type
    } else {
        "Text" # Default fallback
    }
    
    $typeInfo = $FieldTypeMappings[$fieldType]
    
    if (-not $typeInfo) {
        # Handle unknown field types
        Write-ColorOutput "Warning: Unknown field type '$fieldType' for field '$($Field.InternalName -or $Field.Name)'. Using default string type." "Yellow"
        $typeInfo = @{
            "SPFieldType" = "SPFieldType.Text"
            "TypeScript" = "string"
            "DefaultValue" = '""'
            "IsCalculated" = $false
        }
    }
    
    # Handle special cases for choice fields
    if ($fieldType -eq "Choice") {
        $choices = $null
        if ($Field.PSObject.Properties.Name -contains 'Choices' -and $Field.Choices) {
            $choices = $Field.Choices
        } elseif ($Field.PSObject.Properties.Name -contains 'CHOICES' -and $Field.CHOICES.CHOICE) {
            $choices = $Field.CHOICES.CHOICE
        }
        
        if ($choices -and $choices.Count -gt 0) {
            # Create union type for choices
            $choicesList = $choices | ForEach-Object { "'$_'" }
            $typeInfo = $typeInfo.Clone()
            $typeInfo.TypeScript = $choicesList -join " | "
        }
    }
    
    return $typeInfo
}

function Test-IsCalculatedField {
    param([object]$Field)
    
    # Check if field is calculated based on various indicators
    
    # From PnP template
    if ($Field.PSObject.Properties.Name -contains 'calculated' -and $Field.calculated) {
        return $true
    }
    
    # From SharePoint field type
    if ($Field.PSObject.Properties.Name -contains 'TypeAsString') {
        $fieldType = $Field.TypeAsString
        if ($fieldType -eq "Calculated" -or $fieldType -eq "Computed") {
            return $true
        }
    } elseif ($Field.PSObject.Properties.Name -contains 'Type') {
        $fieldType = $Field.Type
        if ($fieldType -eq "Calculated" -or $fieldType -eq "Computed") {
            return $true
        }
    }
    
    # Check SchemaXml if available (from live SharePoint)
    if ($Field.PSObject.Properties.Name -contains 'SchemaXml' -and $Field.SchemaXml) {
        if ($Field.SchemaXml -like '*Type="Calculated"*' -or $Field.SchemaXml -like '*Type="Computed"*') {
            return $true
        }
    }
    
    # Check for Formula element in XML (from PnP template)
    if ($Field.PSObject.Properties.Name -contains 'Formula' -and -not [string]::IsNullOrEmpty($Field.Formula)) {
        return $true
    }
    
    # Check ReadOnly attribute combined with formula-like patterns
    if ($Field.PSObject.Properties.Name -contains 'ReadOnly' -and $Field.ReadOnly -eq "TRUE") {
        # Check if it has formula-related attributes
        if ($Field.PSObject.Properties.Name -contains 'Formula' -or 
            $Field.PSObject.Properties.Name -contains 'FieldRefs') {
            return $true
        }
    }
    
    return $false
}

function Process-PnPTemplateIncludes {
    param(
        [string]$TemplateFilePath,
        [hashtable]$ProcessedFiles = @{}
    )
    
    if ($ProcessedFiles.ContainsKey($TemplateFilePath)) {
        Write-ColorOutput "Circular reference detected for $TemplateFilePath, skipping..." "Yellow"
        return $null
    }
    
    $ProcessedFiles[$TemplateFilePath] = $true
    
    try {
        [xml]$templateXml = Get-Content -Path $TemplateFilePath -Raw
        
        # Process any included files
        $includeElements = $templateXml.SelectNodes("//pnp:ProvisioningTemplateFile", $templateXml.CreateNamespaceManager()) 
        
        if ($includeElements.Count -gt 0) {
            $baseDir = Split-Path $TemplateFilePath -Parent
            
            foreach ($include in $includeElements) {
                $includePath = $include.GetAttribute("File")
                if (-not [System.IO.Path]::IsPathRooted($includePath)) {
                    $includePath = Join-Path $baseDir $includePath
                }
                
                if (Test-Path $includePath) {
                    Write-ColorOutput "Processing included template: $includePath" "Cyan"
                    $includedXml = Process-PnPTemplateIncludes -TemplateFilePath $includePath -ProcessedFiles $ProcessedFiles
                    
                    if ($includedXml) {
                        # Merge the included template into the main template
                        # This is a simplified merge - you might need more sophisticated logic
                        $mainTemplate = $templateXml.SelectSingleNode("//pnp:ProvisioningTemplate", $templateXml.CreateNamespaceManager())
                        $includedTemplate = $includedXml.SelectSingleNode("//pnp:ProvisioningTemplate", $includedXml.CreateNamespaceManager())
                        
                        if ($mainTemplate -and $includedTemplate) {
                            # Merge SiteFields
                            $includedSiteFields = $includedTemplate.SelectSingleNode("pnp:SiteFields", $templateXml.CreateNamespaceManager())
                            if ($includedSiteFields) {
                                $mainSiteFields = $mainTemplate.SelectSingleNode("pnp:SiteFields", $templateXml.CreateNamespaceManager())
                                if (-not $mainSiteFields) {
                                    $mainSiteFields = $templateXml.CreateElement("pnp:SiteFields", $templateXml.DocumentElement.NamespaceURI)
                                    $mainTemplate.AppendChild($mainSiteFields)
                                }
                                
                                foreach ($field in $includedSiteFields.ChildNodes) {
                                    $importedField = $templateXml.ImportNode($field, $true)
                                    $mainSiteFields.AppendChild($importedField)
                                }
                            }
                            
                            # Merge Lists
                            $includedLists = $includedTemplate.SelectSingleNode("pnp:Lists", $templateXml.CreateNamespaceManager())
                            if ($includedLists) {
                                $mainLists = $mainTemplate.SelectSingleNode("pnp:Lists", $templateXml.CreateNamespaceManager())
                                if (-not $mainLists) {
                                    $mainLists = $templateXml.CreateElement("pnp:Lists", $templateXml.DocumentElement.NamespaceURI)
                                    $mainTemplate.AppendChild($mainLists)
                                }
                                
                                foreach ($list in $includedLists.ChildNodes) {
                                    $importedList = $templateXml.ImportNode($list, $true)
                                    $mainLists.AppendChild($importedList)
                                }
                            }
                        }
                    }
                } else {
                    Write-ColorOutput "Included file not found: $includePath" "Yellow"
                }
            }
        }
        
        return $templateXml
    } catch {
        Write-ColorOutput "Error processing template $TemplateFilePath`: $($_.Exception.Message)" "Red"
        return $null
    }
}

function Get-ListFieldsFromSharePoint {
    param(
        [string]$ListName,
        [bool]$IncludeHidden,
        [bool]$IncludeReadOnly,
        [bool]$IncludeCalculated,
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
            
            # Exclude calculated fields if requested
            if (-not $IncludeCalculated -and (Test-IsCalculatedField -Field $field)) {
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

function Get-ListFieldsFromTemplate {
    param(
        [object]$ListNode,
        [object]$SiteFieldsNode,
        [bool]$IncludeHidden,
        [bool]$IncludeReadOnly,
        [bool]$IncludeCalculated,
        [string[]]$ExcludeFields
    )
    
    $listTitle = $ListNode.GetAttribute("Title")
    Write-ColorOutput "  Processing fields for list '$listTitle'..." "Cyan"
    
    $fields = @()
    
    # Get fields from the list's Fields section
    $listFields = $ListNode.SelectNodes("pnp:Fields/Field", $ListNode.OwnerDocument.CreateNamespaceManager())
    foreach ($fieldNode in $listFields) {
        $fieldObj = Convert-XmlFieldToObject -FieldNode $fieldNode -IsFromSiteFields $false
        if ($fieldObj) {
            $fields += $fieldObj
        }
    }
    
    # Get fields from FieldRefs that reference SiteFields
    $fieldRefs = $ListNode.SelectNodes("pnp:FieldRefs/pnp:FieldRef", $ListNode.OwnerDocument.CreateNamespaceManager())
    foreach ($fieldRef in $fieldRefs) {
        $fieldId = $fieldRef.GetAttribute("ID")
        $fieldName = $fieldRef.GetAttribute("Name")
        
        # Find the corresponding field in SiteFields
        if ($SiteFieldsNode) {
            $siteField = $SiteFieldsNode.SelectSingleNode("Field[@ID='$fieldId' or @Name='$fieldName']", $SiteFieldsNode.OwnerDocument.CreateNamespaceManager())
            if ($siteField) {
                $fieldObj = Convert-XmlFieldToObject -FieldNode $siteField -IsFromSiteFields $true
                if ($fieldObj) {
                    # Override display name from FieldRef if provided
                    $displayName = $fieldRef.GetAttribute("DisplayName")
                    if ($displayName) {
                        $fieldObj.DisplayName = $displayName
                    }
                    $fields += $fieldObj
                }
            }
        }
    }
    
    # Filter fields based on parameters
    $filteredFields = $fields | Where-Object {
        $field = $_
        
        # Basic filters
        $include = $true
        
        # Exclude hidden fields if requested
        if (-not $IncludeHidden -and $field.PSObject.Properties.Name -contains 'Hidden' -and $field.Hidden -eq "TRUE") {
            $include = $false
        }
        
        # Exclude readonly fields if requested
        if (-not $IncludeReadOnly -and $field.PSObject.Properties.Name -contains 'ReadOnly' -and $field.ReadOnly -eq "TRUE") {
            $include = $false
        }
        
        # Exclude calculated fields if requested
        if (-not $IncludeCalculated -and (Test-IsCalculatedField -Field $field)) {
            $include = $false
        }
        
        # Exclude fields in exclusion list
        if ($ExcludeFields -contains $field.Name -or $ExcludeFields -contains $field.DisplayName) {
            $include = $false
        }
        
        return $include
    }
    
    Write-ColorOutput "  Found $($filteredFields.Count) fields (filtered from $($fields.Count) total)" "Green"
    return $filteredFields
}

function Convert-XmlFieldToObject {
    param(
        [System.Xml.XmlNode]$FieldNode,
        [bool]$IsFromSiteFields = $true
    )
    
    $fieldObj = New-Object PSObject
    
    # Get basic attributes
    $fieldObj | Add-Member -Type NoteProperty -Name "ID" -Value $FieldNode.GetAttribute("ID")
    $fieldObj | Add-Member -Type NoteProperty -Name "Name" -Value $FieldNode.GetAttribute("Name")
    $fieldObj | Add-Member -Type NoteProperty -Name "DisplayName" -Value $FieldNode.GetAttribute("DisplayName")
    $fieldObj | Add-Member -Type NoteProperty -Name "Type" -Value $FieldNode.GetAttribute("Type")
    $fieldObj | Add-Member -Type NoteProperty -Name "Required" -Value ($FieldNode.GetAttribute("Required") -eq "TRUE")
    $fieldObj | Add-Member -Type NoteProperty -Name "ReadOnly" -Value $FieldNode.GetAttribute("ReadOnly")
    $fieldObj | Add-Member -Type NoteProperty -Name "Hidden" -Value $FieldNode.GetAttribute("Hidden")
    $fieldObj | Add-Member -Type NoteProperty -Name "Group" -Value $FieldNode.GetAttribute("Group")
    
    # Handle choices
    $choicesNode = $FieldNode.SelectSingleNode("CHOICES", $FieldNode.OwnerDocument.CreateNamespaceManager())
    if ($choicesNode) {
        $choices = @()
        foreach ($choice in $choicesNode.SelectNodes("CHOICE")) {
            $choices += $choice.InnerText
        }
        $fieldObj | Add-Member -Type NoteProperty -Name "CHOICES" -Value @{ CHOICE = $choices }
    }
    
    # Handle default value
    $defaultNode = $FieldNode.SelectSingleNode("Default", $FieldNode.OwnerDocument.CreateNamespaceManager())
    if ($defaultNode) {
        $fieldObj | Add-Member -Type NoteProperty -Name "Default" -Value $defaultNode.InnerText
    }
    
    # Handle formula for calculated fields
    $formulaNode = $FieldNode.SelectSingleNode("Formula", $FieldNode.OwnerDocument.CreateNamespaceManager())
    if ($formulaNode) {
        $fieldObj | Add-Member -Type NoteProperty -Name "Formula" -Value $formulaNode.InnerText
    }
    
    # Handle field references for calculated fields
    $fieldRefsNode = $FieldNode.SelectSingleNode("FieldRefs", $FieldNode.OwnerDocument.CreateNamespaceManager())
    if ($fieldRefsNode) {
        $fieldRefs = @()
        foreach ($fieldRef in $fieldRefsNode.SelectNodes("FieldRef")) {
            $fieldRefs += $fieldRef.GetAttribute("Name")
        }
        $fieldObj | Add-Member -Type NoteProperty -Name "FieldRefs" -Value $fieldRefs
    }
    
    return $fieldObj
}

function Generate-FieldSchema {
    param([object]$Field, [string]$PropertyName, [bool]$IsFromTemplate = $false)
    
    $typeInfo = Get-FieldTypeInfo -Field $Field
    
    # Get field properties based on source
    if ($IsFromTemplate) {
        $required = if ($Field.PSObject.Properties.Name -contains 'Required' -and $Field.Required) { "true" } else { "false" }
        $readonly = if ($Field.PSObject.Properties.Name -contains 'ReadOnly' -and $Field.ReadOnly -eq "TRUE") { "true" } else { "false" }
        $internalName = $Field.Name
    } else {
        $required = if ($Field.Required) { "true" } else { "false" }
        $readonly = if ($Field.ReadOnlyField) { "true" } else { "false" }
        $internalName = $Field.InternalName
    }
    
    $calculated = if (Test-IsCalculatedField -Field $Field) { "true" } else { "false" }
    
    $schema = @"
  $PropertyName: {
    internalName: "$internalName",
    type: $($typeInfo.SPFieldType),
    required: $required,
    readonly: $readonly,
    calculated: $calculated"@

    # Add default value if available
    $defaultValue = $null
    if ($IsFromTemplate) {
        $defaultValue = if ($Field.PSObject.Properties.Name -contains 'Default') { $Field.Default } else { $null }
    } else {
        $defaultValue = if ($Field.DefaultValue) { $Field.DefaultValue } else { $null }
    }
    
    if ($defaultValue) {
        $defaultValue = $defaultValue -replace '"', '\"'
        $schema += ",`n    defaultValue: `"$defaultValue`""
    }
    
    # Add choices for choice fields
    $choices = $null
    if ($IsFromTemplate) {
        if ($Field.PSObject.Properties.Name -contains 'CHOICES' -and $Field.CHOICES.CHOICE) {
            $choices = $Field.CHOICES.CHOICE
        }
    } else {
        if ($Field.PSObject.Properties.Name -contains 'Choices' -and $Field.Choices) {
            $choices = $Field.Choices
        }
    }
    
    if ($choices -and $choices.Count -gt 0) {
        $choicesList = $choices | ForEach-Object { "`"$_`"" }
        $schema += ",`n    choices: [$($choicesList -join ', ')]"
    }
    
    # Add lookup list info for lookup fields (SharePoint only)
    if (-not $IsFromTemplate) {
        $fieldType = $Field.TypeAsString
        if ($fieldType -eq "Lookup" -or $fieldType -eq "LookupMulti") {
            if ($Field.LookupList) {
                $schema += ",`n    lookupListId: `"$($Field.LookupList)`""
            }
            if ($Field.LookupField) {
                $schema += ",`n    lookupField: `"$($Field.LookupField)`""
            }
        }
    }
    
    # Add formula for calculated fields
    if ($Field.PSObject.Properties.Name -contains 'Formula' -and -not [string]::IsNullOrEmpty($Field.Formula)) {
        $formula = $Field.Formula -replace '"', '\"'
        $schema += ",`n    formula: `"$formula`""
    }
    
    # Add field references for calculated fields
    if ($Field.PSObject.Properties.Name -contains 'FieldRefs' -and $Field.FieldRefs) {
        $fieldRefsList = $Field.FieldRefs | ForEach-Object { "`"$_`"" }
        $schema += ",`n    fieldRefs: [$($fieldRefsList -join ', ')]"
    }
    
    $schema += "`n  }"
    
    return $schema
}

function Generate-InterfaceProperty {
    param([object]$Field, [string]$PropertyName, [bool]$IsFromTemplate = $false)
    
    $typeInfo = Get-FieldTypeInfo -Field $Field
    
    # Get field properties based on source
    if ($IsFromTemplate) {
        $required = $Field.PSObject.Properties.Name -contains 'Required' -and $Field.Required
        $description = if ($Field.PSObject.Properties.Name -contains 'DisplayName' -and $Field.DisplayName) { 
            $Field.DisplayName -replace '"', '\"' 
        } else { 
            $Field.Name -replace '"', '\"'
        }
    } else {
        $required = $Field.Required
        $description = if ($Field.Description) { $Field.Description -replace '"', '\"' } else { $Field.Title -replace '"', '\"' }
    }
    
    $optional = if ($required) { "" } else { "?" }
    
    # Add calculated field indicator in comment
    $calculatedIndicator = if (Test-IsCalculatedField -Field $Field) { " (Calculated)" } else { "" }
    
    $property = @"
  /** $description$calculatedIndicator */
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
        [bool]$UseDisplayNames,
        [bool]$IsFromTemplate = $false,
        [bool]$GenerateCalculatedFieldHelpers = $true
    )
    
    $safeName = Get-SafeTypeName -Name $ListName
    $fileName = "$NamespacePrefix$safeName.ts"
    $filePath = Join-Path $OutputPath $fileName
    
    # Create file content
    $content = @"
// Auto-generated schema for SharePoint list: $ListName
// Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
// Source: $(if ($IsFromTemplate) { "PnP Template" } else { $SiteUrl })

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
                Get-SafePropertyName -Name ($field.DisplayName -or $field.Title -or $field.Name)
            } else { 
                Get-SafePropertyName -Name ($field.InternalName -or $field.Name)
            }
            
            $property = Generate-InterfaceProperty -Field $field -PropertyName $propertyName -IsFromTemplate $IsFromTemplate
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
                Get-SafePropertyName -Name ($field.DisplayName -or $field.Title -or $field.Name)
            } else { 
                Get-SafePropertyName -Name ($field.InternalName -or $field.Name)
            }
            
            $schema = Generate-FieldSchema -Field $field -PropertyName $propertyName -IsFromTemplate $IsFromTemplate
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

        # Add calculated field helpers if requested
        if ($GenerateCalculatedFieldHelpers) {
            $calculatedFields = $Fields | Where-Object { Test-IsCalculatedField -Field $_ }
            if ($calculatedFields.Count -gt 0) {
                $content += @"

/**
 * Get calculated field names for $ListName
 * Use this to exclude calculated fields from updates
 */
export function get$($safeName)CalculatedFields(): string[] {
  return [
"@
                $calculatedFieldNames = @()
                foreach ($calcField in $calculatedFields) {
                    $propertyName = if ($UseDisplayNames) { 
                        Get-SafePropertyName -Name ($calcField.DisplayName -or $calcField.Title -or $calcField.Name)
                    } else { 
                        Get-SafePropertyName -Name ($calcField.InternalName -or $calcField.Name)
                    }
                    $calculatedFieldNames += "    `"$propertyName`""
                }
                
                $content += "`n$($calculatedFieldNames -join ",`n")"
                $content += @"

  ];
}

/**
 * Create a typed updater for $ListName items that automatically excludes calculated fields
 */
export function create$($safeName)UpdaterSafe() {
  const updater = ListItemHelper.createUpdater<I$safeName>($($safeName)Schema);
  const calculatedFields = get$($safeName)CalculatedFields();
  
  // Override setField to prevent setting calculated fields
  const originalSetField = updater.setField.bind(updater);
  updater.setField = function(fieldKey: any, value: any, originalValue?: any) {
    if (calculatedFields.includes(fieldKey as string)) {
      console.warn(`Skipping calculated field '# SharePoint List Schema Generator (Enhanced)
# Generates TypeScript field schemas and interfaces from SharePoint lists or PnP templates
# Requires PnP PowerShell module: Install-Module -Name PnP.PowerShell

param(
    [Parameter(Mandatory = $false)]
    [string]$SiteUrl = "",
    
    [Parameter(Mandatory = $false)]
    [string]$TemplateFilePath = "",
    
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
    [switch]$IncludeCalculatedFields = $true,
    
    [Parameter(Mandatory = $false)]
    [string[]]$ExcludeFields = @("Attachments", "GUID", "WorkflowVersion", "WorkflowInstanceID"),
    
    [Parameter(Mandatory = $false)]
    [switch]$UseDisplayNames = $false,
    
    [Parameter(Mandatory = $false)]
    [switch]$Interactive = $false,
    
    [Parameter(Mandatory = $false)]
    [string]$FieldTypeMappingsPath = "",
    
    [Parameter(Mandatory = $false)]
    [switch]$GenerateCalculatedFieldHelpers = $true,
    
    [Parameter(Mandatory = $false)]
    [switch]$ProcessIncludes = $true
)

# Validate parameters
if ([string]::IsNullOrEmpty($SiteUrl) -and [string]::IsNullOrEmpty($TemplateFilePath)) {
    Write-Error "Either -SiteUrl or -TemplateFilePath must be provided"
    exit 1
}

if (-not [string]::IsNullOrEmpty($SiteUrl) -and -not [string]::IsNullOrEmpty($TemplateFilePath)) {
    Write-Error "Cannot specify both -SiteUrl and -TemplateFilePath. Choose one source."
    exit 1
}

# Load field type mappings
$MappingFilePath = if ([string]::IsNullOrEmpty($FieldTypeMappingsPath)) {
    Join-Path $PSScriptRoot "fieldTypeMappings.json"
} else {
    $FieldTypeMappingsPath
}

if (-not (Test-Path $MappingFilePath)) {
    Write-Error "Field type mappings file not found: $MappingFilePath"
    Write-Host "Please ensure fieldTypeMappings.json exists in the script directory or provide -FieldTypeMappingsPath"
    exit 1
}

try {
    $FieldTypeMappings = Get-Content -Path $MappingFilePath -Raw | ConvertFrom-Json -AsHashtable
    Write-Host "Loaded field type mappings from: $MappingFilePath" -ForegroundColor Green
} catch {
    Write-Error "Failed to load field type mappings: $($_.Exception.Message)"
    exit 1
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
    
    $fieldType = if ($Field.PSObject.Properties.Name -contains 'TypeAsString') {
        $Field.TypeAsString
    } elseif ($Field.PSObject.Properties.Name -contains 'Type') {
        $Field.Type
    } else {
        "Text" # Default fallback
    }
    
    $typeInfo = $FieldTypeMappings[$fieldType]
    
    if (-not $typeInfo) {
        # Handle unknown field types
        Write-ColorOutput "Warning: Unknown field type '$fieldType' for field '$($Field.InternalName -or $Field.Name)'. Using default string type." "Yellow"
        $typeInfo = @{
            "SPFieldType" = "SPFieldType.Text"
            "TypeScript" = "string"
            "DefaultValue" = '""'
            "IsCalculated" = $false
        }
    }
    
    # Handle special cases for choice fields
    if ($fieldType -eq "Choice") {
        $choices = $null
        if ($Field.PSObject.Properties.Name -contains 'Choices' -and $Field.Choices) {
            $choices = $Field.Choices
        } elseif ($Field.PSObject.Properties.Name -contains 'CHOICES' -and $Field.CHOICES.CHOICE) {
            $choices = $Field.CHOICES.CHOICE
        }
        
        if ($choices -and $choices.Count -gt 0) {
            # Create union type for choices
            $choicesList = $choices | ForEach-Object { "'$_'" }
            $typeInfo = $typeInfo.Clone()
            $typeInfo.TypeScript = $choicesList -join " | "
        }
    }
    
    return $typeInfo
}

function Test-IsCalculatedField {
    param([object]$Field)
    
    # Check if field is calculated based on various indicators
    
    # From PnP template
    if ($Field.PSObject.Properties.Name -contains 'calculated' -and $Field.calculated) {
        return $true
    }
    
    # From SharePoint field type
    if ($Field.PSObject.Properties.Name -contains 'TypeAsString') {
        $fieldType = $Field.TypeAsString
        if ($fieldType -eq "Calculated" -or $fieldType -eq "Computed") {
            return $true
        }
    } elseif ($Field.PSObject.Properties.Name -contains 'Type') {
        $fieldType = $Field.Type
        if ($fieldType -eq "Calculated" -or $fieldType -eq "Computed") {
            return $true
        }
    }
    
    # Check SchemaXml if available (from live SharePoint)
    if ($Field.PSObject.Properties.Name -contains 'SchemaXml' -and $Field.SchemaXml) {
        if ($Field.SchemaXml -like '*Type="Calculated"*' -or $Field.SchemaXml -like '*Type="Computed"*') {
            return $true
        }
    }
    
    # Check for Formula element in XML (from PnP template)
    if ($Field.PSObject.Properties.Name -contains 'Formula' -and -not [string]::IsNullOrEmpty($Field.Formula)) {
        return $true
    }
    
    # Check ReadOnly attribute combined with formula-like patterns
    if ($Field.PSObject.Properties.Name -contains 'ReadOnly' -and $Field.ReadOnly -eq "TRUE") {
        # Check if it has formula-related attributes
        if ($Field.PSObject.Properties.Name -contains 'Formula' -or 
            $Field.PSObject.Properties.Name -contains 'FieldRefs') {
            return $true
        }
    }
    
    return $false
}

function Process-PnPTemplateIncludes {
    param(
        [string]$TemplateFilePath,
        [hashtable]$ProcessedFiles = @{}
    )
    
    if ($ProcessedFiles.ContainsKey($TemplateFilePath)) {
        Write-ColorOutput "Circular reference detected for $TemplateFilePath, skipping..." "Yellow"
        return $null
    }
    
    $ProcessedFiles[$TemplateFilePath] = $true
    
    try {
        [xml]$templateXml = Get-Content -Path $TemplateFilePath -Raw
        
        # Process any included files
        $includeElements = $templateXml.SelectNodes("//pnp:ProvisioningTemplateFile", $templateXml.CreateNamespaceManager()) 
        
        if ($includeElements.Count -gt 0) {
            $baseDir = Split-Path $TemplateFilePath -Parent
            
            foreach ($include in $includeElements) {
                $includePath = $include.GetAttribute("File")
                if (-not [System.IO.Path]::IsPathRooted($includePath)) {
                    $includePath = Join-Path $baseDir $includePath
                }
                
                if (Test-Path $includePath) {
                    Write-ColorOutput "Processing included template: $includePath" "Cyan"
                    $includedXml = Process-PnPTemplateIncludes -TemplateFilePath $includePath -ProcessedFiles $ProcessedFiles
                    
                    if ($includedXml) {
                        # Merge the included template into the main template
                        # This is a simplified merge - you might need more sophisticated logic
                        $mainTemplate = $templateXml.SelectSingleNode("//pnp:ProvisioningTemplate", $templateXml.CreateNamespaceManager())
                        $includedTemplate = $includedXml.SelectSingleNode("//pnp:ProvisioningTemplate", $includedXml.CreateNamespaceManager())
                        
                        if ($mainTemplate -and $includedTemplate) {
                            # Merge SiteFields
                            $includedSiteFields = $includedTemplate.SelectSingleNode("pnp:SiteFields", $templateXml.CreateNamespaceManager())
                            if ($includedSiteFields) {
                                $mainSiteFields = $mainTemplate.SelectSingleNode("pnp:SiteFields", $templateXml.CreateNamespaceManager())
                                if (-not $mainSiteFields) {
                                    $mainSiteFields = $templateXml.CreateElement("pnp:SiteFields", $templateXml.DocumentElement.NamespaceURI)
                                    $mainTemplate.AppendChild($mainSiteFields)
                                }
                                
                                foreach ($field in $includedSiteFields.ChildNodes) {
                                    $importedField = $templateXml.ImportNode($field, $true)
                                    $mainSiteFields.AppendChild($importedField)
                                }
                            }
                            
                            # Merge Lists
                            $includedLists = $includedTemplate.SelectSingleNode("pnp:Lists", $templateXml.CreateNamespaceManager())
                            if ($includedLists) {
                                $mainLists = $mainTemplate.SelectSingleNode("pnp:Lists", $templateXml.CreateNamespaceManager())
                                if (-not $mainLists) {
                                    $mainLists = $templateXml.CreateElement("pnp:Lists", $templateXml.DocumentElement.NamespaceURI)
                                    $mainTemplate.AppendChild($mainLists)
                                }
                                
                                foreach ($list in $includedLists.ChildNodes) {
                                    $importedList = $templateXml.ImportNode($list, $true)
                                    $mainLists.AppendChild($importedList)
                                }
                            }
                        }
                    }
                } else {
                    Write-ColorOutput "Included file not found: $includePath" "Yellow"
                }
            }
        }
        
        return $templateXml
    } catch {
        Write-ColorOutput "Error processing template $TemplateFilePath`: $($_.Exception.Message)" "Red"
        return $null
    }
}

function Get-ListFieldsFromSharePoint {
    param(
        [string]$ListName,
        [bool]$IncludeHidden,
        [bool]$IncludeReadOnly,
        [bool]$IncludeCalculated,
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
            
            # Exclude calculated fields if requested
            if (-not $IncludeCalculated -and (Test-IsCalculatedField -Field $field)) {
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

function Get-ListFieldsFromTemplate {
    param(
        [object]$ListNode,
        [object]$SiteFieldsNode,
        [bool]$IncludeHidden,
        [bool]$IncludeReadOnly,
        [bool]$IncludeCalculated,
        [string[]]$ExcludeFields
    )
    
    $listTitle = $ListNode.GetAttribute("Title")
    Write-ColorOutput "  Processing fields for list '$listTitle'..." "Cyan"
    
    $fields = @()
    
    # Get fields from the list's Fields section
    $listFields = $ListNode.SelectNodes("pnp:Fields/Field", $ListNode.OwnerDocument.CreateNamespaceManager())
    foreach ($fieldNode in $listFields) {
        $fieldObj = Convert-XmlFieldToObject -FieldNode $fieldNode -IsFromSiteFields $false
        if ($fieldObj) {
            $fields += $fieldObj
        }
    }
    
    # Get fields from FieldRefs that reference SiteFields
    $fieldRefs = $ListNode.SelectNodes("pnp:FieldRefs/pnp:FieldRef", $ListNode.OwnerDocument.CreateNamespaceManager())
    foreach ($fieldRef in $fieldRefs) {
        $fieldId = $fieldRef.GetAttribute("ID")
        $fieldName = $fieldRef.GetAttribute("Name")
        
        # Find the corresponding field in SiteFields
        if ($SiteFieldsNode) {
            $siteField = $SiteFieldsNode.SelectSingleNode("Field[@ID='$fieldId' or @Name='$fieldName']", $SiteFieldsNode.OwnerDocument.CreateNamespaceManager())
            if ($siteField) {
                $fieldObj = Convert-XmlFieldToObject -FieldNode $siteField -IsFromSiteFields $true
                if ($fieldObj) {
                    # Override display name from FieldRef if provided
                    $displayName = $fieldRef.GetAttribute("DisplayName")
                    if ($displayName) {
                        $fieldObj.DisplayName = $displayName
                    }
                    $fields += $fieldObj
                }
            }
        }
    }
    
    # Filter fields based on parameters
    $filteredFields = $fields | Where-Object {
        $field = $_
        
        # Basic filters
        $include = $true
        
        # Exclude hidden fields if requested
        if (-not $IncludeHidden -and $field.PSObject.Properties.Name -contains 'Hidden' -and $field.Hidden -eq "TRUE") {
            $include = $false
        }
        
        # Exclude readonly fields if requested
        if (-not $IncludeReadOnly -and $field.PSObject.Properties.Name -contains 'ReadOnly' -and $field.ReadOnly -eq "TRUE") {
            $include = $false
        }
        
        # Exclude calculated fields if requested
        if (-not $IncludeCalculated -and (Test-IsCalculatedField -Field $field)) {
            $include = $false
        }
        
        # Exclude fields in exclusion list
        if ($ExcludeFields -contains $field.Name -or $ExcludeFields -contains $field.DisplayName) {
            $include = $false
        }
        
        return $include
    }
    
    Write-ColorOutput "  Found $($filteredFields.Count) fields (filtered from $($fields.Count) total)" "Green"
    return $filteredFields
}

function Convert-XmlFieldToObject {
    param(
        [System.Xml.XmlNode]$FieldNode,
        [bool]$IsFromSiteFields = $true
    )
    
    $fieldObj = New-Object PSObject
    
    # Get basic attributes
    $fieldObj | Add-Member -Type NoteProperty -Name "ID" -Value $FieldNode.GetAttribute("ID")
    $fieldObj | Add-Member -Type NoteProperty -Name "Name" -Value $FieldNode.GetAttribute("Name")
    $fieldObj | Add-Member -Type NoteProperty -Name "DisplayName" -Value $FieldNode.GetAttribute("DisplayName")
    $fieldObj | Add-Member -Type NoteProperty -Name "Type" -Value $FieldNode.GetAttribute("Type")
    $fieldObj | Add-Member -Type NoteProperty -Name "Required" -Value ($FieldNode.GetAttribute("Required") -eq "TRUE")
    $fieldObj | Add-Member -Type NoteProperty -Name "ReadOnly" -Value $FieldNode.GetAttribute("ReadOnly")
    $fieldObj | Add-Member -Type NoteProperty -Name "Hidden" -Value $FieldNode.GetAttribute("Hidden")
    $fieldObj | Add-Member -Type NoteProperty -Name "Group" -Value $FieldNode.GetAttribute("Group")
    
    # Handle choices
    $choicesNode = $FieldNode.SelectSingleNode("CHOICES", $FieldNode.OwnerDocument.CreateNamespaceManager())
    if ($choicesNode) {
        $choices = @()
        foreach ($choice in $choicesNode.SelectNodes("CHOICE")) {
            $choices += $choice.InnerText
        }
        $fieldObj | Add-Member -Type NoteProperty -Name "CHOICES" -Value @{ CHOICE = $choices }
    }
    
    # Handle default value
    $defaultNode = $FieldNode.SelectSingleNode("Default", $FieldNode.OwnerDocument.CreateNamespaceManager())
    if ($defaultNode) {
        $fieldObj | Add-Member -Type NoteProperty -Name "Default" -Value $defaultNode.InnerText
    }
    
    # Handle formula for calculated fields
    $formulaNode = $FieldNode.SelectSingleNode("Formula", $FieldNode.OwnerDocument.CreateNamespaceManager())
    if ($formulaNode) {
        $fieldObj | Add-Member -Type NoteProperty -Name "Formula" -Value $formulaNode.InnerText
    }
    
    # Handle field references for calculated fields
    $fieldRefsNode = $FieldNode.SelectSingleNode("FieldRefs", $FieldNode.OwnerDocument.CreateNamespaceManager())
    if ($fieldRefsNode) {
        $fieldRefs = @()
        foreach ($fieldRef in $fieldRefsNode.SelectNodes("FieldRef")) {
            $fieldRefs += $fieldRef.GetAttribute("Name")
        }
        $fieldObj | Add-Member -Type NoteProperty -Name "FieldRefs" -Value $fieldRefs
    }
    
    return $fieldObj
}

function Generate-FieldSchema {
    param([object]$Field, [string]$PropertyName, [bool]$IsFromTemplate = $false)
    
    $typeInfo = Get-FieldTypeInfo -Field $Field
    
    # Get field properties based on source
    if ($IsFromTemplate) {
        $required = if ($Field.PSObject.Properties.Name -contains 'Required' -and $Field.Required) { "true" } else { "false" }
        $readonly = if ($Field.PSObject.Properties.Name -contains 'ReadOnly' -and $Field.ReadOnly -eq "TRUE") { "true" } else { "false" }
        $internalName = $Field.Name
    } else {
        $required = if ($Field.Required) { "true" } else { "false" }
        $readonly = if ($Field.ReadOnlyField) { "true" } else { "false" }
        $internalName = $Field.InternalName
    }
    
    $calculated = if (Test-IsCalculatedField -Field $Field) { "true" } else { "false" }
    
{fieldKey}' in $ListName updater`);
      return this;
    }
    return originalSetField(fieldKey, value, originalValue);
  };
  
  return updater;
}
"@
            }
        }
    }
    
    # Write file
    $content | Out-File -FilePath $filePath -Encoding UTF8
    Write-ColorOutput "  Generated: $fileName" "Green"
    
    return @{
        FileName = $fileName
        FilePath = $filePath
        ListName = $ListName
        FieldCount = $Fields.Count
        CalculatedFieldCount = ($Fields | Where-Object { Test-IsCalculatedField -Field $_ }).Count
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
// Source: $(if ($TemplateFilePath) { "PnP Template: $TemplateFilePath" } else { $SiteUrl })

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
    
    # Add summary information as comments
    $content += @"

/*
 * Generation Summary:
 * ===================
 * Total Lists: $($GeneratedFiles.Count)
 * Total Fields: $($GeneratedFiles | ForEach-Object { $_.FieldCount } | Measure-Object -Sum | Select-Object -ExpandProperty Sum)
 * Total Calculated Fields: $($GeneratedFiles | ForEach-Object { $_.CalculatedFieldCount } | Measure-Object -Sum | Select-Object -ExpandProperty Sum)
 * 
 * Generated Files:
"@
    
    foreach ($file in $GeneratedFiles) {
        $content += "`n * - $($file.ListName): $($file.FieldCount) fields ($($file.CalculatedFieldCount) calculated)"
    }
    
    $content += "`n */"
    
    $content | Out-File -FilePath $indexPath -Encoding UTF8
    Write-ColorOutput "Generated index file: index.ts" "Green"
}

function Show-Summary {
    param([object[]]$GeneratedFiles, [string]$Source)
    
    Write-ColorOutput "`n=== Generation Summary ===" "Magenta"
    Write-ColorOutput "Source: $Source" "White"
    Write-ColorOutput "Total lists processed: $($GeneratedFiles.Count)" "White"
    Write-ColorOutput "Output directory: $OutputPath" "White"
    
    $totalFields = $GeneratedFiles | ForEach-Object { $_.FieldCount } | Measure-Object -Sum | Select-Object -ExpandProperty Sum
    $totalCalculatedFields = $GeneratedFiles | ForEach-Object { $_.CalculatedFieldCount } | Measure-Object -Sum | Select-Object -ExpandProperty Sum
    
    Write-ColorOutput "Total fields: $totalFields ($totalCalculatedFields calculated)" "White"
    
    foreach ($file in $GeneratedFiles) {
        Write-ColorOutput "  ✓ $($file.ListName) -> $($file.FileName) ($($file.FieldCount) fields, $($file.CalculatedFieldCount) calculated)" "Green"
    }
    
    Write-ColorOutput "`nNext steps:" "Yellow"
    Write-ColorOutput "1. Copy the generated files to your SPFx project" "White"
    Write-ColorOutput "2. Install required dependencies if not already present:" "White"
    Write-ColorOutput "   npm install @pnp/sp @pnp/spfx-controls-react" "Gray"
    Write-ColorOutput "3. Import and use the generated schemas:" "White"
    Write-ColorOutput "   import { ITaskSchema, createTaskUpdater } from './generated-schemas';" "Gray"
    
    if ($totalCalculatedFields -gt 0) {
        Write-ColorOutput "`n💡 Tip: Use createXXXUpdaterSafe() functions to automatically exclude calculated fields from updates" "Cyan"
    }
}

# Main execution
try {
    Write-ColorOutput "SharePoint List Schema Generator (Enhanced)" "Magenta"
    Write-ColorOutput "===========================================" "Magenta"
    
    # Determine source
    $isTemplateMode = -not [string]::IsNullOrEmpty($TemplateFilePath)
    $source = if ($isTemplateMode) { "PnP Template: $TemplateFilePath" } else { $SiteUrl }
    
    if ($isTemplateMode) {
        # Template mode
        Write-ColorOutput "`nProcessing PnP Provisioning Template: $TemplateFilePath" "Cyan"
        
        if (-not (Test-Path $TemplateFilePath)) {
            Write-ColorOutput "Template file not found: $TemplateFilePath" "Red"
            exit 1
        }
        
        # Process includes if requested
        if ($ProcessIncludes) {
            Write-ColorOutput "Processing template includes..." "Cyan"
            $templateXml = Process-PnPTemplateIncludes -TemplateFilePath $TemplateFilePath
        } else {
            [xml]$templateXml = Get-Content -Path $TemplateFilePath -Raw
        }
        
        if (-not $templateXml) {
            Write-ColorOutput "Failed to load template file" "Red"
            exit 1
        }
        
        # Create namespace manager for XPath queries
        $nsManager = $templateXml.CreateNamespaceManager()
        $nsManager.AddNamespace("pnp", $templateXml.DocumentElement.NamespaceURI)
        
        # Find the provisioning template
        $provisioningTemplate = $templateXml.SelectSingleNode("//pnp:ProvisioningTemplate", $nsManager)
        if (-not $provisioningTemplate) {
            Write-ColorOutput "No ProvisioningTemplate found in the template file" "Red"
            exit 1
        }
        
        # Get SiteFields for reference
        $siteFieldsNode = $provisioningTemplate.SelectSingleNode("pnp:SiteFields", $nsManager)
        
        # Get Lists
        $listsNode = $provisioningTemplate.SelectSingleNode("pnp:Lists", $nsManager)
        if (-not $listsNode) {
            Write-ColorOutput "No Lists found in the template" "Yellow"
            exit 0
        }
        
        $listNodes = $listsNode.SelectNodes("pnp:ListInstance", $nsManager)
        
        if ($ListNames.Count -gt 0) {
            # Filter to specific lists
            $listNodes = $listNodes | Where-Object { $ListNames -contains $_.GetAttribute("Title") }
        }
        
        Write-ColorOutput "Found $($listNodes.Count) lists to process" "Green"
        
    } else {
        # SharePoint mode
        if (-not (Get-Module -ListAvailable -Name "PnP.PowerShell")) {
            Write-ColorOutput "Error: PnP.PowerShell module is not installed." "Red"
            Write-ColorOutput "Please install it using: Install-Module -Name PnP.PowerShell" "Yellow"
            exit 1
        }
        
        Write-ColorOutput "`nConnecting to SharePoint: $SiteUrl" "Cyan"
        try {
            Connect-PnPOnline -Url $SiteUrl -Interactive
            Write-ColorOutput "Successfully connected to SharePoint" "Green"
        } catch {
            Write-ColorOutput "Failed to connect to SharePoint: $($_.Exception.Message)" "Red"
            exit 1
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
    }
    
    # Create output directory
    if (-not (Test-Path $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
        Write-ColorOutput "Created output directory: $OutputPath" "Green"
    }
    
    # Process lists
    $generatedFiles = @()
    
    if ($isTemplateMode) {
        # Process lists from template
        foreach ($listNode in $listNodes) {
            $listTitle = $listNode.GetAttribute("Title")
            Write-ColorOutput "`nProcessing list: $listTitle" "Yellow"
            
            # Get fields for the list
            $fields = Get-ListFieldsFromTemplate -ListNode $listNode -SiteFieldsNode $siteFieldsNode -IncludeHidden $IncludeHiddenFields -IncludeReadOnly $IncludeReadOnlyFields -IncludeCalculated $IncludeCalculatedFields -ExcludeFields $AllExcludeFields
            
            if ($fields.Count -eq 0) {
                Write-ColorOutput "  Skipping '$listTitle' - no fields found" "Yellow"
                continue
            }
            
            # Generate TypeScript file
            $fileInfo = Generate-TypeScriptFile -ListName $listTitle -Fields $fields -OutputPath $OutputPath -NamespacePrefix $NamespacePrefix -GenerateInterfaces $GenerateInterfaces -GenerateSchemas $GenerateSchemas -UseDisplayNames $UseDisplayNames -IsFromTemplate $true -GenerateCalculatedFieldHelpers $GenerateCalculatedFieldHelpers
            $generatedFiles += $fileInfo
        }
    } else {
        # Process lists from SharePoint
        foreach ($listName in $ListNames) {
            Write-ColorOutput "`nProcessing list: $listName" "Yellow"
            
            # Get fields for the list
            $fields = Get-ListFieldsFromSharePoint -ListName $listName -IncludeHidden $IncludeHiddenFields -IncludeReadOnly $IncludeReadOnlyFields -IncludeCalculated $IncludeCalculatedFields -ExcludeFields $AllExcludeFields
            
            if ($fields.Count -eq 0) {
                Write-ColorOutput "  Skipping '$listName' - no fields found" "Yellow"
                continue
            }
            
            # Generate TypeScript file
            $fileInfo = Generate-TypeScriptFile -ListName $listName -Fields $fields -OutputPath $OutputPath -NamespacePrefix $NamespacePrefix -GenerateInterfaces $GenerateInterfaces -GenerateSchemas $GenerateSchemas -UseDisplayNames $UseDisplayNames -IsFromTemplate $false -GenerateCalculatedFieldHelpers $GenerateCalculatedFieldHelpers
            $generatedFiles += $fileInfo
        }
    }
    
    # Generate index file
    if ($generatedFiles.Count -gt 0) {
        Generate-IndexFile -GeneratedFiles $generatedFiles -OutputPath $OutputPath -NamespacePrefix $NamespacePrefix
    }
    
    # Show summary
    Show-Summary -GeneratedFiles $generatedFiles -Source $source
    
} catch {
    Write-ColorOutput "An error occurred: $($_.Exception.Message)" "Red"
    Write-ColorOutput "Stack trace: $($_.ScriptStackTrace)" "Red"
} finally {
    # Disconnect from SharePoint if connected
    if (-not $isTemplateMode) {
        try {
            Disconnect-PnPOnline
            Write-ColorOutput "`nDisconnected from SharePoint" "Gray"
        } catch {
            # Ignore disconnect errors
        }
    }
}

<#
.SYNOPSIS
    Generates TypeScript field schemas and interfaces from SharePoint lists or PnP provisioning templates

.DESCRIPTION
    This enhanced PowerShell script connects to a SharePoint site or processes PnP provisioning templates
    to generate TypeScript field schemas and interfaces. It supports external field type mappings,
    calculated field detection, and PnP template includes processing.

.PARAMETER SiteUrl
    The URL of the SharePoint site to connect to (required if not using TemplateFilePath)

.PARAMETER TemplateFilePath
    Path to a PnP provisioning template XML file (required if not using SiteUrl)

.PARAMETER ListNames
    Array of list names to process. If empty, processes all available lists

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

.PARAMETER IncludeCalculatedFields
    Whether to include calculated fields in the schema. Default: true

.PARAMETER ExcludeFields
    Array of field names to exclude from generation

.PARAMETER UseDisplayNames
    Use display names instead of internal names for property names. Default: false

.PARAMETER Interactive
    Run in interactive mode to select lists manually. Default: false

.PARAMETER FieldTypeMappingsPath
    Path to custom field type mappings JSON file. If not specified, uses fieldTypeMappings.json in script directory

.PARAMETER GenerateCalculatedFieldHelpers
    Generate helper functions for handling calculated fields. Default: true

.PARAMETER ProcessIncludes
    Process PnP template includes when in template mode. Default: true

.EXAMPLE
    .\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite"
    
    Generates schemas for all lists in the site

.EXAMPLE
    .\Generate-ListSchemas.ps1 -TemplateFilePath ".\templates\site-template.xml"
    
    Generates schemas from a PnP provisioning template

.EXAMPLE
    .\Generate-ListSchemas.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/mysite" -ListNames @("Tasks", "Documents") -OutputPath ".\src\schemas"
    
    Generates schemas for specific lists and saves to a custom directory

.EXAMPLE
    .\Generate-ListSchemas.ps1 -TemplateFilePath ".\main-template.xml" -ProcessIncludes $true
    
    Processes a PnP template with includes

.NOTES
    Enhanced Features:
    - External field type mappings via JSON file
    - PnP provisioning template support with includes processing
    - Enhanced calculated field handling with helper functions
    - Automatic exclusion of calculated fields in safe updaters
    - Support for complex PnP template structures
#>
