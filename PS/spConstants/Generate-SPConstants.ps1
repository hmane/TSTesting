# SharePoint Constants Generator - WITH TEMPLATE MODE IMPLEMENTATION
# Save as Generate-SPConstants-Complete.ps1

param(
  [Parameter(Mandatory = $false)]
  [string]$SiteUrl = "",

  [Parameter(Mandatory = $false)]
  [string]$TemplateFilePath = "",

  [Parameter(Mandatory = $false)]
  [string]$OutputPath = ".\generated",

  [Parameter(Mandatory = $false)]
  [string[]]$IncludeOOBLists = @(),

  [Parameter(Mandatory = $false)]
  [switch]$IncludeContentTypes = $false,

  [Parameter(Mandatory = $false)]
  [switch]$IncludeSiteColumns = $false,

  [Parameter(Mandatory = $false)]
  [switch]$IncludeViews = $false,

  [Parameter(Mandatory = $false)]
  [string]$ClientId = "970bb320-0d49-4b4a-aa8f-c3f4b1e5928f"
)

Write-Host "SharePoint Constants Generator - WITH TEMPLATE MODE" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# Validation
if ([string]::IsNullOrEmpty($SiteUrl) -and [string]::IsNullOrEmpty($TemplateFilePath)) {
  Write-Error "Either -SiteUrl or -TemplateFilePath must be provided"
  exit 1
}

$isTemplateMode = -not [string]::IsNullOrEmpty($TemplateFilePath)

# OOB Lists to exclude by default
$DefaultExcludeOOBLists = @(
  "Documents", "Shared Documents", "Site Pages", "Site Assets", "Style Library",
  "Master Page Gallery", "Web Part Gallery", "List Template Gallery",
  "Theme Gallery", "Solution Gallery", "Form Templates",
  "User Information List", "Workflow History", "Workflow Tasks",
  "Apps for SharePoint", "App Catalog"
)

# Fields to exclude
$ExcludeFields = @(
  "ContentTypeId", "_ModerationStatus", "_ModerationComments", "FileRef", "FileDirRef",
  "Last_x0020_Modified", "Created_x0020_Date", "File_x0020_Size", "FSObjType",
  "SortBehavior", "PermMask", "PrincipalCount", "CheckedOutUserId", "IsCheckedoutToLocal",
  "UniqueId", "ParentUniqueId", "SyncClientId", "ProgId", "ScopeId", "VirusStatus",
  "CheckedOutTitle", "LinkCheckedOutTitle", "Modified_x0020_By", "Created_x0020_By",
  "File_x0020_Type", "HTML_x0020_File_x0020_Type", "_SourceUrl", "_SharedFileIndex",
  "_EditMenuTableStart", "_EditMenuTableStart2", "_EditMenuTableEnd", "LinkFilename2",
  "ServerUrl", "EncodedAbsUrl", "BaseName", "MetaInfo", "_Level", "_IsCurrentVersion",
  "Restricted", "OriginatorId", "NoExecute", "ContentVersion", "BSN", "_ListSchemaVersion",
  "_Dirty", "_Parsable", "_StubFile", "_HasEncryptedContent", "_HasUserDefinedProtection",
  "AccessPolicy", "_VirusStatus", "_VirusVendorID", "_VirusInfo", "_RansomwareAnomalyMetaInfo",
  "_CommentFlags", "_CommentCount", "_RmsTemplateId", "_IpLabelId", "_IpLabelAssignmentMethod",
  "A2ODMountCount", "_ExpirationDate", "_IpLabelHash", "_IpLabelPromotionCtagVersion",
  "_ColorHex", "_Emoji", "_DraftOwnerId", "_IpLabelMetaInfo", "_AdditionalStreamSize",
  "_StreamScenarioIds", "MediaGeneratedMetadata", "MediaUserMetadata", "_FileArchiveStatus",
  "_ExtractedMetadata", "ExtractedMetadataComputed", "MainLinkSettings", "SMTotalSize",
  "SMLastModifiedDate", "SMTotalFileStreamSize", "SMTotalFileCount", "SelectTitle",
  "SelectFilename", "owshiddenversion", "_UIVersion", "InstanceID", "Order", "GUID",
  "WorkflowVersion", "WorkflowInstanceID", "DocConcurrencyNumber", "StreamHash",
  "AppPrerequisitesXML", "AppPackageHash", "AppPermissionXML", "AppSubtypeID",
  "IsAutoHostedApp", "AppTitleInfo", "AppSupportedLocales", "UniqueSolutionId",
  "IsProviderHostedClientSideSolution", "WebApiPermissionRequests", "AadApplicationId",
  "AadServicePrincipalId", "AadApplicationAppId", "_HasCopyDestinations", "_CopySource",
  "Attachments"
)

# Field ordering for priority
$FieldOrdering = @{
  "ID"                = 1
  "Title"             = 2
  "LinkTitle"         = 3
  "LinkTitleNoMenu"   = 4
  "ContentType"       = 5
  # Custom fields go here (order 100-400)
  "Created"           = 500
  "Modified"          = 501
  "Author"            = 502
  "Editor"            = 503
  "_ModerationStatus" = 1000  # Keep at end if included
}

function Get-SafePropertyName {
  param($InputName)

  # Handle character array issue by joining
  $nameStr = $InputName -join ""

  if ([string]::IsNullOrEmpty($nameStr)) {
    return "DefaultField"
  }

  # Clean approach - replace SharePoint encodings and clean up
  $cleaned = $nameStr -replace '_x0020_', ''
  $cleaned = $cleaned -replace '_x002e_', ''
  $cleaned = $cleaned -replace '_x002d_', ''

  # Remove non-alphanumeric characters
  $cleaned = $cleaned -replace '[^a-zA-Z0-9]', ''

  # If empty after cleaning, use original
  if ([string]::IsNullOrEmpty($cleaned)) {
    $cleaned = $nameStr -replace '[^a-zA-Z0-9]', ''
  }

  # Simple capitalization without complex string operations
  if ($cleaned.Length -gt 0) {
    $firstChar = $cleaned.Substring(0, 1)
    if ($cleaned.Length -eq 1) {
      return $firstChar.ToUpper()
    }
    else {
      $rest = $cleaned.Substring(1)
      return $firstChar.ToUpper() + $rest
    }
  }

  return $cleaned
}

# TEMPLATE MODE FUNCTIONS

function Read-TemplateFile {
  param([string]$FilePath)

  if (-not (Test-Path $FilePath)) {
    Write-Error "Template file not found: $FilePath"
    return $null
  }

  try {
    $content = Get-Content $FilePath -Raw
    $template = $content | ConvertFrom-Json

    Write-Host "Template file loaded successfully" -ForegroundColor Green
    Write-Host "Lists in template: $($template.Lists.Count)" -ForegroundColor Gray

    return $template
  }
  catch {
    Write-Error "Failed to parse template file: $($_.Exception.Message)"
    return $null
  }
}

function Get-ListsFromTemplate {
  param([object]$Template)

  $lists = @()
  foreach ($listDef in $Template.Lists) {
    # Create mock list object similar to SharePoint list
    $mockList = [PSCustomObject]@{
      Title      = $listDef.Title
      RootFolder = [PSCustomObject]@{
        ServerRelativeUrl = $listDef.Url
      }
    }
    $lists += $mockList
  }

  Write-Host "Found $($lists.Count) lists in template" -ForegroundColor Yellow
  return $lists
}

function Get-FieldsFromTemplate {
  param([string]$ListTitle, [object]$Template)

  # Find the list definition in template
  $listDef = $Template.Lists | Where-Object { $_.Title -eq $ListTitle }

  if ($null -eq $listDef -or $null -eq $listDef.Fields) {
    Write-Host "    No fields found in template for '$ListTitle'" -ForegroundColor Yellow
    return @()
  }

  Write-Host "    Processing $($listDef.Fields.Count) fields from template..." -ForegroundColor Gray

  $fields = @()
  foreach ($fieldDef in $listDef.Fields) {
    # Skip excluded fields
    if ($ExcludeFields -contains $fieldDef.InternalName) {
      continue
    }

    # Create mock field object
    $mockField = [PSCustomObject]@{
      InternalName  = $fieldDef.InternalName
      Title         = if ($fieldDef.PSObject.Properties['Title']) { $fieldDef.Title } else { $fieldDef.InternalName }
      FieldTypeKind = if ($fieldDef.PSObject.Properties['FieldType']) { $fieldDef.FieldType } else { "Text" }
      Hidden        = if ($fieldDef.PSObject.Properties['Hidden']) { $fieldDef.Hidden } else { $false }
      ReadOnlyField = if ($fieldDef.PSObject.Properties['ReadOnly']) { $fieldDef.ReadOnly } else { $false }
    }

    $fields += $mockField
  }

  # Sort fields by priority (same logic as SharePoint mode)
  $fieldsWithOrder = @()
  foreach ($field in $fields) {
    $internalName = $field.InternalName
    $order = if ($FieldOrdering.ContainsKey($internalName)) {
      $FieldOrdering[$internalName]
    }
    else {
      # Custom fields get priority based on field type
      if ($internalName -match "^(Choice|Multi|User|Person|Lookup|Number|Currency|DateTime|Boolean|URL|Image)") {
        200  # Business fields get higher priority
      }
      else {
        300  # Other custom fields
      }
    }

    $fieldsWithOrder += [PSCustomObject]@{
      Field        = $field
      Order        = $order
      InternalName = $internalName
    }
  }

  # Sort by order, then by name
  $sortedFields = $fieldsWithOrder | Sort-Object Order, InternalName | ForEach-Object { $_.Field }

  Write-Host "    Final result: $($sortedFields.Count) usable fields from template" -ForegroundColor Gray
  return $sortedFields
}

function Get-ViewsFromTemplate {
  param([string]$ListTitle, [object]$Template)

  # Find the list definition in template
  $listDef = $Template.Lists | Where-Object { $_.Title -eq $ListTitle }

  if ($null -eq $listDef -or $null -eq $listDef.Views) {
    Write-Host "    No views found in template for '$ListTitle'" -ForegroundColor Yellow
    return @()
  }

  $views = @()
  foreach ($viewDef in $listDef.Views) {
    # Skip hidden views
    if ($viewDef.PSObject.Properties['Hidden'] -and $viewDef.Hidden) {
      continue
    }

    # Create mock view object
    $mockView = [PSCustomObject]@{
      Title             = $viewDef.Title
      ServerRelativeUrl = if ($viewDef.PSObject.Properties['Url']) { $viewDef.Url } else { "/Lists/$($ListTitle -replace '\s+', '')/$($viewDef.Title -replace '\s+', '').aspx" }
      Hidden            = if ($viewDef.PSObject.Properties['Hidden']) { $viewDef.Hidden } else { $false }
    }

    $views += $mockView
  }

  Write-Host "    Found $($views.Count) views in template" -ForegroundColor Gray
  return $views
}

function Generate-SampleTemplate {
  param([string]$OutputPath)

  $sampleTemplate = @{
    SchemaVersion = "1.0"
    GeneratedOn   = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
    Description   = "Sample template for SharePoint Constants Generator"
    Lists         = @(
      @{
        Title  = "Sample List 1"
        Url    = "/Lists/Sample List 1"
        Fields = @(
          @{
            InternalName = "ID"
            Title        = "ID"
            FieldType    = "Counter"
            Hidden       = $false
            ReadOnly     = $true
          },
          @{
            InternalName = "Title"
            Title        = "Title"
            FieldType    = "Text"
            Hidden       = $false
            ReadOnly     = $false
          },
          @{
            InternalName = "Status"
            Title        = "Status"
            FieldType    = "Choice"
            Hidden       = $false
            ReadOnly     = $false
          },
          @{
            InternalName = "Priority"
            Title        = "Priority"
            FieldType    = "Choice"
            Hidden       = $false
            ReadOnly     = $false
          },
          @{
            InternalName = "AssignedTo"
            Title        = "Assigned To"
            FieldType    = "User"
            Hidden       = $false
            ReadOnly     = $false
          },
          @{
            InternalName = "DueDate"
            Title        = "Due Date"
            FieldType    = "DateTime"
            Hidden       = $false
            ReadOnly     = $false
          },
          @{
            InternalName = "Created"
            Title        = "Created"
            FieldType    = "DateTime"
            Hidden       = $false
            ReadOnly     = $true
          },
          @{
            InternalName = "Modified"
            Title        = "Modified"
            FieldType    = "DateTime"
            Hidden       = $false
            ReadOnly     = $true
          }
        )
        Views  = @(
          @{
            Title  = "All Items"
            Url    = "/Lists/Sample List 1/AllItems.aspx"
            Hidden = $false
          },
          @{
            Title  = "Active Items"
            Url    = "/Lists/Sample List 1/ActiveItems.aspx"
            Hidden = $false
          }
        )
      },
      @{
        Title  = "Sample List 2"
        Url    = "/Lists/Sample List 2"
        Fields = @(
          @{
            InternalName = "ID"
            Title        = "ID"
            FieldType    = "Counter"
          },
          @{
            InternalName = "Title"
            Title        = "Title"
            FieldType    = "Text"
          },
          @{
            InternalName = "Description"
            Title        = "Description"
            FieldType    = "Note"
          },
          @{
            InternalName = "Category"
            Title        = "Category"
            FieldType    = "Choice"
          }
        )
        Views  = @(
          @{
            Title = "All Items"
            Url   = "/Lists/Sample List 2/AllItems.aspx"
          }
        )
      }
    )
  }

  $templateJson = $sampleTemplate | ConvertTo-Json -Depth 10
  $templatePath = Join-Path $OutputPath "sample-template.json"

  # Create directory if it doesn't exist
  $templateDir = Split-Path $templatePath -Parent
  if (-not (Test-Path $templateDir)) {
    New-Item -ItemType Directory -Path $templateDir -Force | Out-Null
  }

  $templateJson | Out-File -FilePath $templatePath -Encoding UTF8
  Write-Host "Sample template generated: $templatePath" -ForegroundColor Green
  Write-Host "You can modify this template and use it with -TemplateFilePath parameter" -ForegroundColor Cyan
}

# SHAREPOINT MODE FUNCTIONS (existing functions remain the same)

function Get-ListsFromSharePoint {
  Write-Host "Getting SharePoint lists..." -ForegroundColor Yellow

  try {
    $allLists = Get-PnPList | Where-Object { -not $_.Hidden } | Sort-Object Title
    Write-Host "Found $($allLists.Count) non-hidden lists" -ForegroundColor Gray

    # Filter to only custom lists (exclude all OOB unless explicitly included)
    $customLists = @()
    foreach ($list in $allLists) {
      $listTitle = $list.Title
      $isOOB = $DefaultExcludeOOBLists -contains $listTitle

      if ($isOOB) {
        if ($IncludeOOBLists -contains $listTitle) {
          Write-Host "  Including OOB list (explicit): $listTitle" -ForegroundColor Cyan
          $customLists += $list
        }
        else {
          Write-Host "  Excluding OOB list: $listTitle" -ForegroundColor DarkGray
        }
      }
      else {
        Write-Host "  Including custom list: $listTitle" -ForegroundColor Green
        $customLists += $list
      }
    }

    Write-Host "Processing $($customLists.Count) lists" -ForegroundColor Yellow
    return $customLists
  }
  catch {
    Write-Host "Error getting lists: $($_.Exception.Message)" -ForegroundColor Red
    return @()
  }
}

function Get-FieldsFromSharePoint {
  param([string]$ListTitle)

  try {
    $allFields = @()
    $fieldCollection = Get-PnPField -List $ListTitle

    Write-Host "    Processing $($fieldCollection.Count) total fields..." -ForegroundColor Gray

    # Filter and collect fields
    foreach ($field in $fieldCollection) {
      if ($null -eq $field) { continue }

      try {
        # Safely get internal name as string
        $internalName = ""
        if ($field.PSObject.Properties['InternalName'] -and $null -ne $field.InternalName) {
          $internalName = $field.InternalName -join ""  # Handle character arrays
        }
        else {
          continue
        }

        # Skip if empty
        if ([string]::IsNullOrEmpty($internalName)) {
          continue
        }

        # Skip excluded fields
        if ($ExcludeFields -contains $internalName) {
          continue
        }

        # Skip hidden fields
        $isHidden = $false
        if ($field.PSObject.Properties['Hidden'] -and $null -ne $field.Hidden) {
          $isHidden = $field.Hidden
        }
        if ($isHidden) {
          continue
        }

        # Skip fields starting with underscore (except useful ones)
        if ($internalName.StartsWith("_") -and -not $FieldOrdering.ContainsKey($internalName)) {
          continue
        }

        # Skip system fields with patterns
        if ($internalName -like "ows_*" -or $internalName -like "HTML_*") { continue }

        # Skip read-only system fields (except important ones)
        $isReadOnly = $false
        if ($field.PSObject.Properties['ReadOnlyField'] -and $null -ne $field.ReadOnlyField) {
          $isReadOnly = $field.ReadOnlyField
        }
        if ($isReadOnly -and $internalName -notmatch "^(ID|Title|Created|Modified|Author|Editor|ContentType)$") {
          continue
        }

        # Include field
        $allFields += $field
      }
      catch {
        continue
      }
    }

    # Sort fields by priority
    $fieldsWithOrder = @()
    foreach ($field in $allFields) {
      try {
        $internalName = $field.InternalName -join ""  # Handle character arrays
        $order = if ($FieldOrdering.ContainsKey($internalName)) {
          $FieldOrdering[$internalName]
        }
        else {
          # Custom fields get priority based on field type
          if ($internalName -match "^(Choice|Multi|User|Person|Lookup|Number|Currency|DateTime|Boolean|URL|Image)") {
            200  # Business fields get higher priority
          }
          else {
            300  # Other custom fields
          }
        }

        $fieldsWithOrder += [PSCustomObject]@{
          Field        = $field
          Order        = $order
          InternalName = $internalName
        }
      }
      catch {
        continue
      }
    }

    # Sort by order, then by name
    $sortedFields = $fieldsWithOrder | Sort-Object Order, InternalName | ForEach-Object { $_.Field }

    Write-Host "    Final result: $($sortedFields.Count) usable fields" -ForegroundColor Gray
    return $sortedFields
  }
  catch {
    Write-Host "    Error processing fields: $($_.Exception.Message)" -ForegroundColor Red
    return @()
  }
}

function Get-ViewsFromSharePoint {
  param([string]$ListTitle)

  try {
    $allViews = Get-PnPView -List $ListTitle

    $filteredViews = @()
    foreach ($view in $allViews) {
      if ($null -eq $view) { continue }

      try {
        # Skip hidden views
        if ($view.Hidden) { continue }

        $filteredViews += $view
      }
      catch {
        continue
      }
    }

    Write-Host "    Found $($filteredViews.Count) views" -ForegroundColor Gray
    return $filteredViews
  }
  catch {
    Write-Host "    Error processing views: $($_.Exception.Message)" -ForegroundColor Red
    return @()
  }
}

# COMMON GENERATION FUNCTIONS (work for both modes)

function Generate-ListsFile {
  param([array]$Lists, [string]$OutputPath)

  $content = "// Auto-generated SharePoint Lists constants`n"
  $content += "// Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
  if ($isTemplateMode) {
    $content += "// Source: Template file`n`n"
  }
  else {
    $content += "// Source: $SiteUrl`n`n"
  }

  $content += "export const Lists = {`n"

  $listItems = @()
  foreach ($list in $Lists) {
    $title = $list.Title
    $serverRelativeUrl = $list.RootFolder.ServerRelativeUrl

    # Extract just the /Lists/... part from the full URL
    $relativeUrl = ""
    if (-not [string]::IsNullOrEmpty($serverRelativeUrl)) {
      # Use regex to extract everything from /Lists onwards
      if ($serverRelativeUrl -match '(/Lists/.*)$') {
        $relativeUrl = $matches[1]
      }
      else {
        # Fallback if pattern not found
        $relativeUrl = "/Lists/$($title -replace '\s+', '')"
      }
    }
    else {
      # Fallback if ServerRelativeUrl is not available
      $relativeUrl = "/Lists/$($title -replace '\s+', '')"
    }

    $safeName = Get-SafePropertyName -InputName $title

    $listItem = "  $safeName`: {`n"
    $listItem += "    Title: '$title',`n"
    $listItem += "    Url: '$relativeUrl'`n"
    $listItem += "  }"

    $listItems += $listItem
  }

  $content += $listItems -join ",`n"
  $content += "`n} as const;`n"

  $listsFile = Join-Path $OutputPath "Lists.ts"
  $content | Out-File -FilePath $listsFile -Encoding UTF8
  Write-Host "Generated: Lists.ts" -ForegroundColor Green
}

function Generate-FieldsFile {
  param([string]$ListTitle, [array]$Fields, [string]$OutputPath)

  if ($Fields.Count -eq 0) {
    Write-Host "No fields to generate for '$ListTitle'" -ForegroundColor Yellow
    return
  }

  Write-Host "    Generating fields file with $($Fields.Count) fields..." -ForegroundColor Gray

  $safeName = Get-SafePropertyName -InputName $ListTitle
  $fileName = "$($safeName)Fields.ts"
  $fieldsDir = Join-Path $OutputPath "listFields"

  if (-not (Test-Path $fieldsDir)) {
    New-Item -ItemType Directory -Path $fieldsDir -Force | Out-Null
  }

  $filePath = Join-Path $fieldsDir $fileName

  $content = "// Auto-generated fields for SharePoint list: $ListTitle`n"
  $content += "// Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"

  $content += "export const $($safeName)Fields = {`n"

  $fieldItems = @()
  foreach ($field in $Fields) {
    try {
      # Get the internal name properly - handle character arrays
      $internalName = ""
      if ($null -ne $field -and $null -ne $field.InternalName) {
        $internalName = $field.InternalName -join ""
      }
      else {
        continue
      }

      # Skip if empty
      if ([string]::IsNullOrEmpty($internalName)) {
        continue
      }

      $propertyName = Get-SafePropertyName -InputName $internalName

      # Debug output for system fields
      if ($internalName -match "^(ID|Title|ContentType|Created|Modified|Author|Editor)$") {
        Write-Host "    -> Adding to TS file: $propertyName = '$internalName'" -ForegroundColor Cyan
      }

      $fieldItems += "  $propertyName`: '$internalName'"
    }
    catch {
      Write-Host "    -> Error processing field: $($_.Exception.Message)" -ForegroundColor Red
      continue
    }
  }

  Write-Host "    Generated $($fieldItems.Count) field items for TypeScript" -ForegroundColor Gray

  $content += $fieldItems -join ",`n"
  $content += "`n} as const;`n"

  $content | Out-File -FilePath $filePath -Encoding UTF8
  Write-Host "Generated: listFields/$fileName" -ForegroundColor Green
}

function Generate-ViewsFile {
  param([string]$ListTitle, [array]$Views, [string]$OutputPath)

  if ($Views.Count -eq 0) {
    Write-Host "No views to generate for '$ListTitle'" -ForegroundColor Yellow
    return
  }

  $safeName = Get-SafePropertyName -InputName $ListTitle
  $fileName = "$($safeName)Views.ts"
  $viewsDir = Join-Path $OutputPath "listViews"

  if (-not (Test-Path $viewsDir)) {
    New-Item -ItemType Directory -Path $viewsDir -Force | Out-Null
  }

  $filePath = Join-Path $viewsDir $fileName

  $content = "// Auto-generated views for SharePoint list: $ListTitle`n"
  $content += "// Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"

  $content += "export const $($safeName)Views = {`n"

  $viewItems = @()
  foreach ($view in $Views) {
    try {
      $viewTitle = $view.Title
      $viewUrl = $view.ServerRelativeUrl

      # Extract just the /Lists/... part from the full URL using regex
      $relativeUrl = ""
      if (-not [string]::IsNullOrEmpty($viewUrl)) {
        if ($viewUrl -match '(/Lists/.*)$') {
          $relativeUrl = $matches[1]
        }
        else {
          # Fallback if pattern not found
          $relativeUrl = "/Lists/$($ListTitle -replace '\s+', '')/$($viewTitle -replace '\s+', '').aspx"
        }
      }
      else {
        # Fallback if ServerRelativeUrl is not available
        $relativeUrl = "/Lists/$($ListTitle -replace '\s+', '')/$($viewTitle -replace '\s+', '').aspx"
      }

      $safePropName = Get-SafePropertyName -InputName $viewTitle

      $viewItem = "  $safePropName`: {`n"
      $viewItem += "    Title: '$viewTitle',`n"
      $viewItem += "    Url: '$relativeUrl'`n"
      $viewItem += "  }"

      $viewItems += $viewItem
    }
    catch {
      continue
    }
  }

  $content += $viewItems -join ",`n"
  $content += "`n} as const;`n"

  $content | Out-File -FilePath $filePath -Encoding UTF8
  Write-Host "Generated: listViews/$fileName" -ForegroundColor Green
}

function Generate-IndexFiles {
  param([array]$Lists, [string]$OutputPath)

  # Create directories
  $listFieldsDir = Join-Path $OutputPath "listFields"
  if (-not (Test-Path $listFieldsDir)) {
    New-Item -ItemType Directory -Path $listFieldsDir -Force | Out-Null
  }

  if ($IncludeViews) {
    $listViewsDir = Join-Path $OutputPath "listViews"
    if (-not (Test-Path $listViewsDir)) {
      New-Item -ItemType Directory -Path $listViewsDir -Force | Out-Null
    }
  }

  # Main index file
  $content = "// Auto-generated index file`n"
  $content += "export { Lists } from './Lists';`n`n"

  if ($Lists.Count -gt 0) {
    foreach ($list in $Lists) {
      $safeName = Get-SafePropertyName -InputName $list.Title
      $content += "export { $($safeName)Fields } from './listFields/$($safeName)Fields';`n"

      if ($IncludeViews) {
        $content += "export { $($safeName)Views } from './listViews/$($safeName)Views';`n"
      }
    }
  }

  $indexFile = Join-Path $OutputPath "index.ts"
  $content | Out-File -FilePath $indexFile -Encoding UTF8
  Write-Host "Generated: index.ts" -ForegroundColor Green

  # Fields index file
  $fieldsIndexPath = Join-Path $listFieldsDir "index.ts"
  $fieldsContent = "// Auto-generated fields index`n`n"

  if ($Lists.Count -gt 0) {
    foreach ($list in $Lists) {
      $safeName = Get-SafePropertyName -InputName $list.Title
      $fieldsContent += "export { $($safeName)Fields } from './$($safeName)Fields';`n"
    }
  }

  $fieldsContent | Out-File -FilePath $fieldsIndexPath -Encoding UTF8
  Write-Host "Generated: listFields/index.ts" -ForegroundColor Green

  # Views index file (if views are included)
  if ($IncludeViews) {
    $viewsIndexPath = Join-Path $listViewsDir "index.ts"
    $viewsContent = "// Auto-generated views index`n`n"

    if ($Lists.Count -gt 0) {
      foreach ($list in $Lists) {
        $safeName = Get-SafePropertyName -InputName $list.Title
        $viewsContent += "export { $($safeName)Views } from './$($safeName)Views';`n"
      }
    }

    $viewsContent | Out-File -FilePath $viewsIndexPath -Encoding UTF8
    Write-Host "Generated: listViews/index.ts" -ForegroundColor Green
  }
}

# Main execution
try {
  # Create output directory
  if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
  }

  if ($isTemplateMode) {
    Write-Host "Running in Template Mode" -ForegroundColor Cyan
    Write-Host "Template file: $TemplateFilePath" -ForegroundColor Gray

    # Check if user wants to generate a sample template
    if ($TemplateFilePath -eq "sample" -or $TemplateFilePath -eq "generate-sample") {
      Write-Host "Generating sample template..." -ForegroundColor Yellow
      Generate-SampleTemplate -OutputPath $OutputPath
      Write-Host "`nSample template generated successfully!" -ForegroundColor Green
      Write-Host "Edit the template file and run again with -TemplateFilePath pointing to your template." -ForegroundColor Cyan
      exit 0
    }

    # Load template
    $template = Read-TemplateFile -FilePath $TemplateFilePath
    if ($null -eq $template) {
      exit 1
    }

    # Get lists from template
    $lists = Get-ListsFromTemplate -Template $template

    if ($lists.Count -eq 0) {
      Write-Host "No lists found in template" -ForegroundColor Yellow
      exit 0
    }

    # Generate Lists.ts
    Generate-ListsFile -Lists $lists -OutputPath $OutputPath

    # Generate field and view files
    Write-Host "`nProcessing lists from template..." -ForegroundColor Yellow
    $processedLists = @()

    foreach ($list in $lists) {
      $listTitle = $list.Title
      Write-Host "  Processing: $listTitle" -ForegroundColor White

      $fields = Get-FieldsFromTemplate -ListTitle $listTitle -Template $template
      if ($fields.Count -gt 0) {
        Generate-FieldsFile -ListTitle $listTitle -Fields $fields -OutputPath $OutputPath
        $processedLists += $list
      }

      # Generate views if requested
      if ($IncludeViews) {
        $views = Get-ViewsFromTemplate -ListTitle $listTitle -Template $template
        if ($views.Count -gt 0) {
          Generate-ViewsFile -ListTitle $listTitle -Views $views -OutputPath $OutputPath
        }
      }
    }

    # Generate index files
    Generate-IndexFiles -Lists $processedLists -OutputPath $OutputPath

    Write-Host "`n=== Template Generation Complete ===" -ForegroundColor Cyan
    Write-Host "Lists processed: $($processedLists.Count)" -ForegroundColor White
    Write-Host "Output directory: $OutputPath" -ForegroundColor White
    Write-Host "Source: Template file ($TemplateFilePath)" -ForegroundColor White

  }
  else {
    Write-Host "Running in SharePoint Mode" -ForegroundColor Cyan
    Write-Host "Connecting to SharePoint: $SiteUrl" -ForegroundColor Gray

    if (-not (Get-Module -ListAvailable -Name "PnP.PowerShell")) {
      Write-Error "PnP.PowerShell module not installed"
      exit 1
    }

    try {
      Connect-PnPOnline -Url $SiteUrl -ClientId $ClientId -Interactive
      Write-Host "Connected successfully" -ForegroundColor Green
    }
    catch {
      Write-Error "Failed to connect: $($_.Exception.Message)"
      exit 1
    }

    $lists = Get-ListsFromSharePoint

    if ($lists.Count -eq 0) {
      Write-Host "No lists to process" -ForegroundColor Yellow
      exit 0
    }

    # Generate Lists.ts
    Generate-ListsFile -Lists $lists -OutputPath $OutputPath

    # Generate field and view files
    Write-Host "`nProcessing individual lists..." -ForegroundColor Yellow
    $processedLists = @()

    foreach ($list in $lists) {
      $listTitle = $list.Title
      Write-Host "  Processing: $listTitle" -ForegroundColor White

      $fields = Get-FieldsFromSharePoint -ListTitle $listTitle
      if ($fields.Count -gt 0) {
        Generate-FieldsFile -ListTitle $listTitle -Fields $fields -OutputPath $OutputPath
        $processedLists += $list
      }

      # Generate views if requested
      if ($IncludeViews) {
        $views = Get-ViewsFromSharePoint -ListTitle $listTitle
        if ($views.Count -gt 0) {
          Generate-ViewsFile -ListTitle $listTitle -Views $views -OutputPath $OutputPath
        }
      }
    }

    # Generate index files
    Generate-IndexFiles -Lists $processedLists -OutputPath $OutputPath

    Write-Host "`n=== SharePoint Generation Complete ===" -ForegroundColor Cyan
    Write-Host "Lists processed: $($processedLists.Count)" -ForegroundColor White
    Write-Host "Output directory: $OutputPath" -ForegroundColor White
    Write-Host "Source: $SiteUrl" -ForegroundColor White

    if ($IncludeViews) {
      Write-Host "Views included: Yes" -ForegroundColor White
    }
  }

}
catch {
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Stack Trace: $($_.Exception.StackTrace)" -ForegroundColor Red
}
finally {
  if (-not $isTemplateMode) {
    try {
      Disconnect-PnPOnline
      Write-Host "Disconnected from SharePoint" -ForegroundColor Gray
    }
    catch {}
  }
}
