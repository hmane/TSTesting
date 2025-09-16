# SharePoint Constants Generator - CLEAN VERSION
# Supports both SharePoint live connection and PnP Provisioning Templates (including multi-file)

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
  [switch]$IncludeViews = $false,

  [Parameter(Mandatory = $false)]
  [string]$ClientId = "970bb320-0d49-4b4a-aa8f-c3f4b1e5928f"
)

Write-Host "SharePoint Constants Generator - CLEAN VERSION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

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
  "User Information List", "Workflow History", "Workflow Tasks"
)

# Fields to exclude
$ExcludeFields = @(
  "ContentTypeId", "_ModerationStatus", "_ModerationComments", "FileRef", "FileDirRef",
  "Last_x0020_Modified", "Created_x0020_Date", "File_x0020_Size", "FSObjType",
  "UniqueId", "ParentUniqueId", "CheckedOutUserId", "Modified_x0020_By", "Created_x0020_By",
  "File_x0020_Type", "_SourceUrl", "_EditMenuTableStart", "_EditMenuTableEnd",
  "ServerUrl", "EncodedAbsUrl", "BaseName", "MetaInfo", "_Level", "_IsCurrentVersion",
  "Attachments", "owshiddenversion", "_UIVersion", "InstanceID", "Order", "GUID"
)

# Field ordering
$FieldOrdering = @{
  "ID" = 1; "Title" = 2; "ContentType" = 5; "Created" = 500; "Modified" = 501; "Author" = 502; "Editor" = 503
}

function Get-SafePropertyName {
  param($InputName)
  
  $nameStr = $InputName -join ""
  if ([string]::IsNullOrEmpty($nameStr)) { return "DefaultField" }
  
  # Clean SharePoint encodings
  $cleaned = $nameStr -replace '_x0020_', '' -replace '_x002e_', '' -replace '_x002d_', ''
  $cleaned = $cleaned -replace '[^a-zA-Z0-9]', ''
  
  if ([string]::IsNullOrEmpty($cleaned)) { 
    $cleaned = $nameStr -replace '[^a-zA-Z0-9]', ''
  }
  
  # Capitalize first letter
  if ($cleaned.Length -gt 0) {
    return $cleaned.Substring(0, 1).ToUpper() + $cleaned.Substring(1)
  }
  
  return $cleaned
}

# === SHAREPOINT MODE FUNCTIONS ===

function Get-ListsFromSharePoint {
  $allLists = Get-PnPList | Where-Object { -not $_.Hidden } | Sort-Object Title
  $customLists = @()
  
  foreach ($list in $allLists) {
    $isOOB = $DefaultExcludeOOBLists -contains $list.Title
    if ($isOOB -and ($IncludeOOBLists -notcontains $list.Title)) {
      continue
    }
    $customLists += $list
  }
  
  Write-Host "Processing $($customLists.Count) lists from SharePoint" -ForegroundColor Yellow
  return $customLists
}

function Get-FieldsFromSharePoint {
  param([string]$ListTitle)
  
  $fieldCollection = Get-PnPField -List $ListTitle
  $filteredFields = @()
  
  foreach ($field in $fieldCollection) {
    $internalName = $field.InternalName -join ""
    
    # Skip excluded, hidden, or system fields
    if ($ExcludeFields -contains $internalName -or 
        $field.Hidden -or 
        ($internalName.StartsWith("_") -and -not $FieldOrdering.ContainsKey($internalName)) -or
        ($field.ReadOnlyField -and $internalName -notmatch "^(ID|Title|Created|Modified|Author|Editor|ContentType)$")) {
      continue
    }
    
    $filteredFields += $field
  }
  
  # Sort by priority
  $sorted = $filteredFields | Sort-Object {
    $name = $_.InternalName -join ""
    if ($FieldOrdering.ContainsKey($name)) { $FieldOrdering[$name] } else { 300 }
  }, { $_.InternalName -join "" }
  
  return $sorted
}

function Get-ViewsFromSharePoint {
  param([string]$ListTitle)
  
  $allViews = Get-PnPView -List $ListTitle
  return $allViews | Where-Object { -not $_.Hidden }
}

# === TEMPLATE MODE FUNCTIONS ===

function Read-PnPTemplate {
  param([string]$FilePath)
  
  if (-not (Test-Path $FilePath)) {
    Write-Error "Template file not found: $FilePath"
    return $null
  }
  
  [xml]$xml = Get-Content $FilePath -Raw
  $baseDir = Split-Path $FilePath -Parent
  $allLists = @()
  
  # Process main template file
  $mainLists = Extract-ListsFromXml -XmlContent $xml
  $allLists += $mainLists
  
  # Find and process referenced template files
  $templateRefs = $xml.SelectNodes("//pnp:ProvisioningTemplateFile | //*[local-name()='ProvisioningTemplateFile']")
  
  foreach ($ref in $templateRefs) {
    $refFile = $ref.File
    if ([string]::IsNullOrEmpty($refFile)) { $refFile = $ref.GetAttribute("File") }
    if ([string]::IsNullOrEmpty($refFile)) { continue }
    
    # Resolve path
    if (-not [System.IO.Path]::IsPathRooted($refFile)) {
      $refFile = Join-Path $baseDir $refFile
    }
    
    if (Test-Path $refFile) {
      Write-Host "  Processing referenced file: $refFile" -ForegroundColor Gray
      [xml]$refXml = Get-Content $refFile -Raw
      $refLists = Extract-ListsFromXml -XmlContent $refXml
      $allLists += $refLists
    } else {
      Write-Host "  Referenced file not found: $refFile" -ForegroundColor Red
    }
  }
  
  Write-Host "Total lists found in template: $($allLists.Count)" -ForegroundColor Green
  return $allLists
}

function Extract-ListsFromXml {
  param([xml]$XmlContent)
  
  $lists = @()
  $listNodes = $XmlContent.SelectNodes("//pnp:ListInstance | //*[local-name()='ListInstance']")
  
  foreach ($node in $listNodes) {
    $title = $node.Title
    if ([string]::IsNullOrEmpty($title)) { $title = $node.GetAttribute("Title") }
    if ([string]::IsNullOrEmpty($title)) { continue }
    
    $url = $node.Url
    if ([string]::IsNullOrEmpty($url)) { $url = $node.GetAttribute("Url") }
    if ([string]::IsNullOrEmpty($url)) { $url = "/Lists/$title" }
    
    # Create list object
    $listObj = [PSCustomObject]@{
      Title = $title
      RootFolder = [PSCustomObject]@{ ServerRelativeUrl = $url }
      Fields = @()
      Views = @()
    }
    
    # Extract fields
    $fieldNodes = $node.SelectNodes(".//pnp:Field | .//*[local-name()='Field']")
    foreach ($fieldNode in $fieldNodes) {
      $internalName = $fieldNode.InternalName
      if ([string]::IsNullOrEmpty($internalName)) { $internalName = $fieldNode.GetAttribute("InternalName") }
      if ([string]::IsNullOrEmpty($internalName)) { $internalName = $fieldNode.GetAttribute("Name") }
      
      if (-not [string]::IsNullOrEmpty($internalName)) {
        $mockField = [PSCustomObject]@{
          InternalName = $internalName
          Title = $fieldNode.DisplayName ?? $fieldNode.GetAttribute("DisplayName") ?? $internalName
          Hidden = $false
          ReadOnlyField = $false
        }
        $listObj.Fields += $mockField
      }
    }
    
    # Add default fields if none found
    if ($listObj.Fields.Count -eq 0) {
      @("ID", "Title", "Created", "Modified", "Author", "Editor") | ForEach-Object {
        $listObj.Fields += [PSCustomObject]@{
          InternalName = $_; Title = $_; Hidden = $false; ReadOnlyField = ($_ -in @("ID", "Created", "Modified", "Author", "Editor"))
        }
      }
    }
    
    # Extract views
    if ($IncludeViews) {
      $viewNodes = $node.SelectNodes(".//pnp:View | .//*[local-name()='View']")
      foreach ($viewNode in $viewNodes) {
        $viewTitle = $viewNode.DisplayName ?? $viewNode.GetAttribute("DisplayName") ?? "All Items"
        $listObj.Views += [PSCustomObject]@{
          Title = $viewTitle
          ServerRelativeUrl = "$url/$($viewTitle -replace '\s+', '').aspx"
          Hidden = $false
        }
      }
      
      # Add default view if none found
      if ($listObj.Views.Count -eq 0) {
        $listObj.Views += [PSCustomObject]@{
          Title = "All Items"
          ServerRelativeUrl = "$url/AllItems.aspx"
          Hidden = $false
        }
      }
    }
    
    $lists += $listObj
  }
  
  return $lists
}

function Get-FieldsFromTemplate {
  param([string]$ListTitle, [array]$Lists)
  
  $list = $Lists | Where-Object { $_.Title -eq $ListTitle }
  if (-not $list -or -not $list.Fields) { return @() }
  
  # Filter and sort fields
  $filteredFields = $list.Fields | Where-Object {
    $name = $_.InternalName
    -not ($ExcludeFields -contains $name -or $_.Hidden)
  }
  
  $sorted = $filteredFields | Sort-Object {
    $name = $_.InternalName
    if ($FieldOrdering.ContainsKey($name)) { $FieldOrdering[$name] } else { 300 }
  }, InternalName
  
  return $sorted
}

function Get-ViewsFromTemplate {
  param([string]$ListTitle, [array]$Lists)
  
  $list = $Lists | Where-Object { $_.Title -eq $ListTitle }
  if (-not $list -or -not $list.Views) { return @() }
  
  return $list.Views | Where-Object { -not $_.Hidden }
}

# === GENERATION FUNCTIONS ===

function Generate-ListsFile {
  param([array]$Lists, [string]$OutputPath)
  
  $content = @"
// Auto-generated SharePoint Lists constants
// Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

export const Lists = {
"@
  
  $listItems = @()
  foreach ($list in $Lists) {
    $safeName = Get-SafePropertyName -InputName $list.Title
    $url = $list.RootFolder.ServerRelativeUrl
    
    # Ensure URL starts with /Lists/
    if ($url -notmatch '^/Lists/') {
      if ($url -match '/Lists/(.*)$') {
        $url = "/Lists/$($matches[1])"
      } else {
        $url = "/Lists/$($list.Title -replace '\s+', '%20')"
      }
    }
    
    $listItems += "  $safeName`: { Title: '$($list.Title)', Url: '$url' }"
  }
  
  $content += "`n" + ($listItems -join ",`n") + "`n} as const;`n"
  
  $listsFile = Join-Path $OutputPath "Lists.ts"
  $content | Out-File -FilePath $listsFile -Encoding UTF8
  Write-Host "Generated: Lists.ts" -ForegroundColor Green
}

function Generate-FieldsFile {
  param([string]$ListTitle, [array]$Fields, [string]$OutputPath)
  
  if ($Fields.Count -eq 0) { return }
  
  $safeName = Get-SafePropertyName -InputName $ListTitle
  $fileName = "$($safeName)Fields.ts"
  $fieldsDir = Join-Path $OutputPath "listFields"
  
  if (-not (Test-Path $fieldsDir)) {
    New-Item -ItemType Directory -Path $fieldsDir -Force | Out-Null
  }
  
  $content = @"
// Auto-generated fields for SharePoint list: $ListTitle
// Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

export const $($safeName)Fields = {
"@
  
  $fieldItems = @()
  foreach ($field in $Fields) {
    $internalName = $field.InternalName -join ""
    $propertyName = Get-SafePropertyName -InputName $internalName
    $fieldItems += "  $propertyName`: '$internalName'"
  }
  
  $content += "`n" + ($fieldItems -join ",`n") + "`n} as const;`n"
  
  $filePath = Join-Path $fieldsDir $fileName
  $content | Out-File -FilePath $filePath -Encoding UTF8
  Write-Host "Generated: listFields/$fileName" -ForegroundColor Green
}

function Generate-ViewsFile {
  param([string]$ListTitle, [array]$Views, [string]$OutputPath)
  
  if ($Views.Count -eq 0 -or -not $IncludeViews) { return }
  
  $safeName = Get-SafePropertyName -InputName $ListTitle
  $fileName = "$($safeName)Views.ts"
  $viewsDir = Join-Path $OutputPath "listViews"
  
  if (-not (Test-Path $viewsDir)) {
    New-Item -ItemType Directory -Path $viewsDir -Force | Out-Null
  }
  
  $content = @"
// Auto-generated views for SharePoint list: $ListTitle
// Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

export const $($safeName)Views = {
"@
  
  $viewItems = @()
  foreach ($view in $Views) {
    $safePropName = Get-SafePropertyName -InputName $view.Title
    $viewUrl = $view.ServerRelativeUrl
    $viewItems += "  $safePropName`: { Title: '$($view.Title)', Url: '$viewUrl' }"
  }
  
  $content += "`n" + ($viewItems -join ",`n") + "`n} as const;`n"
  
  $filePath = Join-Path $viewsDir $fileName
  $content | Out-File -FilePath $filePath -Encoding UTF8
  Write-Host "Generated: listViews/$fileName" -ForegroundColor Green
}

function Generate-IndexFiles {
  param([array]$Lists, [string]$OutputPath)
  
  # Main index
  $content = "// Auto-generated index file`nexport { Lists } from './Lists';`n`n"
  foreach ($list in $Lists) {
    $safeName = Get-SafePropertyName -InputName $list.Title
    $content += "export { $($safeName)Fields } from './listFields/$($safeName)Fields';`n"
    if ($IncludeViews) {
      $content += "export { $($safeName)Views } from './listViews/$($safeName)Views';`n"
    }
  }
  
  $content | Out-File -FilePath (Join-Path $OutputPath "index.ts") -Encoding UTF8
  Write-Host "Generated: index.ts" -ForegroundColor Green
}

# === MAIN EXECUTION ===

try {
  # Create output directory
  if (-not (Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
  }
  
  if ($isTemplateMode) {
    Write-Host "Template Mode: $TemplateFilePath" -ForegroundColor Cyan
    
    $lists = Read-PnPTemplate -FilePath $TemplateFilePath
    if (-not $lists -or $lists.Count -eq 0) {
      Write-Host "No lists found in template" -ForegroundColor Yellow
      exit 0
    }
    
    # Generate files
    Generate-ListsFile -Lists $lists -OutputPath $OutputPath
    
    foreach ($list in $lists) {
      $fields = Get-FieldsFromTemplate -ListTitle $list.Title -Lists $lists
      if ($fields.Count -gt 0) {
        Generate-FieldsFile -ListTitle $list.Title -Fields $fields -OutputPath $OutputPath
      }
      
      if ($IncludeViews) {
        $views = Get-ViewsFromTemplate -ListTitle $list.Title -Lists $lists
        Generate-ViewsFile -ListTitle $list.Title -Views $views -OutputPath $OutputPath
      }
    }
    
    Generate-IndexFiles -Lists $lists -OutputPath $OutputPath
    
    Write-Host "`n=== Template Generation Complete ===" -ForegroundColor Green
    Write-Host "Lists processed: $($lists.Count)" -ForegroundColor White
  }
  else {
    Write-Host "SharePoint Mode: $SiteUrl" -ForegroundColor Cyan
    
    # Connect to SharePoint
    Connect-PnPOnline -Url $SiteUrl -ClientId $ClientId -Interactive
    
    $lists = Get-ListsFromSharePoint
    if ($lists.Count -eq 0) {
      Write-Host "No lists to process" -ForegroundColor Yellow
      exit 0
    }
    
    # Generate files
    Generate-ListsFile -Lists $lists -OutputPath $OutputPath
    
    foreach ($list in $lists) {
      $fields = Get-FieldsFromSharePoint -ListTitle $list.Title
      if ($fields.Count -gt 0) {
        Generate-FieldsFile -ListTitle $list.Title -Fields $fields -OutputPath $OutputPath
      }
      
      if ($IncludeViews) {
        $views = Get-ViewsFromSharePoint -ListTitle $list.Title
        Generate-ViewsFile -ListTitle $list.Title -Views $views -OutputPath $OutputPath
      }
    }
    
    Generate-IndexFiles -Lists $lists -OutputPath $OutputPath
    
    Write-Host "`n=== SharePoint Generation Complete ===" -ForegroundColor Green
    Write-Host "Lists processed: $($lists.Count)" -ForegroundColor White
  }
}
catch {
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
  if (-not $isTemplateMode) {
    try { Disconnect-PnPOnline } catch {}
  }
}
