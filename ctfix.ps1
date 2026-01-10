#Region Script Parameters
param (
    [Parameter(Mandatory = $false)]
    [string]$LibraryName,
    
    [Parameter(Mandatory = $false)]
    [string]$ContentTypeName,
    
    [Parameter(Mandatory = $false)]
    [switch]$IncludeGenericLists,
    
    [Parameter(Mandatory = $false)]
    [string]$SiteUrl = "https://yourtenant.sharepoint.com/sites/yoursite"
)
#EndRegion

#Region Connection
Connect-PnPOnline -Url $SiteUrl -Interactive
#EndRegion

function Set-NameFieldFirst {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory = $false)]
        [string]$LibraryName,
        
        [Parameter(Mandatory = $false)]
        [string]$ContentTypeName,
        
        [Parameter(Mandatory = $false)]
        [switch]$IncludeGenericLists
    )
    
    #Region Helper Function
    function Update-ContentType {
        param (
            [string]$ListTitle,
            [Microsoft.SharePoint.Client.ContentType]$CT
        )
        
        $ChangesApplied = @()
        
        #Region 1. Move "Name" field to first position
        $CTFields = Get-PnPProperty -ClientObject $CT -Property "FieldLinks"
        $NameField = $CTFields | Where-Object { $_.Name -eq "FileLeafRef" -or $_.Name -eq "Name" }
        
        if ($NameField) {
            Write-Host "    Found 'Name' field. Moving to first position..." -ForegroundColor Green
            
            $FieldNames = $CTFields | Select-Object -ExpandProperty Name
            $NameFieldInternalName = $NameField.Name
            $ReorderedFields = @($NameFieldInternalName) + ($FieldNames | Where-Object { $_ -ne $NameFieldInternalName })
            
            try {
                Set-PnPContentType -Identity $CT.Id.StringValue -List $ListTitle -FieldOrder $ReorderedFields
                $ChangesApplied += "Name field moved to first"
            }
            catch {
                Write-Host "    Error reordering fields: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "    'Name' field not found. Skipping reorder." -ForegroundColor DarkGray
        }
        #EndRegion
        
        #Region 2. Hide "Title" field if exists
        $TitleField = $CTFields | Where-Object { $_.Name -eq "Title" }
        
        if ($TitleField) {
            Write-Host "    Found 'Title' field. Setting to hidden..." -ForegroundColor Green
            
            try {
                Set-PnPContentType -Identity $CT.Id.StringValue -List $ListTitle -UpdateChildren -FieldLinkAttribute @{Name = "Title"; Hidden = $true }
                $ChangesApplied += "Title field hidden"
            }
            catch {
                Write-Host "    Error hiding Title field: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "    'Title' field not found. Skipping hide." -ForegroundColor DarkGray
        }
        #EndRegion
        
        #Region 3. Clear description if exists
        $Description = Get-PnPProperty -ClientObject $CT -Property "Description"
        
        if ($Description -and $Description.Trim() -ne "") {
            Write-Host "    Found description: '$Description'. Clearing..." -ForegroundColor Green
            
            try {
                Set-PnPContentType -Identity $CT.Id.StringValue -List $ListTitle -Description ""
                $ChangesApplied += "Description cleared"
            }
            catch {
                Write-Host "    Error clearing description: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "    Description already empty. Skipping." -ForegroundColor DarkGray
        }
        #EndRegion
        
        #Region Summary for this content type
        if ($ChangesApplied.Count -gt 0) {
            Write-Host "    Changes applied: $($ChangesApplied -join ', ')" -ForegroundColor Cyan
            return $true
        }
        return $false
        #EndRegion
    }
    #EndRegion
    
    #Region Single Content Type Mode
    if ($LibraryName -and $ContentTypeName) {
        Write-Host "Processing Library: $LibraryName, Content Type: $ContentTypeName" -ForegroundColor Yellow
        
        $Library = Get-PnPList -Identity $LibraryName -ErrorAction SilentlyContinue
        if (-not $Library) {
            Write-Host "Error: Library '$LibraryName' not found." -ForegroundColor Red
            return
        }
        
        $ContentType = Get-PnPContentType -List $LibraryName | Where-Object { $_.Name -eq $ContentTypeName }
        if (-not $ContentType) {
            Write-Host "Error: Content Type '$ContentTypeName' not found in '$LibraryName'." -ForegroundColor Red
            return
        }
        
        Write-Host "  Found Content Type: $($ContentType.Name)" -ForegroundColor Gray
        Update-ContentType -ListTitle $LibraryName -CT $ContentType
        return
    }
    #EndRegion
    
    #Region All Libraries Mode
    $Confirmation = Read-Host "No specific library/content type provided. Process ALL libraries? (Y/N)"
    if ($Confirmation -notin @('Y', 'y', 'Yes', 'yes')) {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        return
    }
    
    if ($IncludeGenericLists) {
        $Lists = Get-PnPList | Where-Object { $_.BaseTemplate -in @(100, 101) -and $_.Hidden -eq $false }
    }
    else {
        $Lists = Get-PnPList | Where-Object { $_.BaseTemplate -eq 101 -and $_.Hidden -eq $false }
    }
    
    Write-Host "Found $($Lists.Count) libraries to process" -ForegroundColor Cyan
    
    $Results = @{ Processed = 0; Updated = 0; Skipped = 0 }
    
    foreach ($List in $Lists) {
        Write-Host "`nProcessing Library: $($List.Title)" -ForegroundColor Yellow
        
        $ContentTypes = Get-PnPContentType -List $List.Title
        
        foreach ($CT in $ContentTypes) {
            if ($CT.Hidden) { continue }
            
            Write-Host "  Checking Content Type: $($CT.Name)" -ForegroundColor Gray
            $Results.Processed++
            
            if (Update-ContentType -ListTitle $List.Title -CT $CT) {
                $Results.Updated++
            }
            else {
                $Results.Skipped++
            }
        }
    }
    
    Write-Host "`n========== Summary ==========" -ForegroundColor Cyan
    Write-Host "Total Processed: $($Results.Processed)" -ForegroundColor White
    Write-Host "Updated: $($Results.Updated)" -ForegroundColor Green
    Write-Host "Skipped (No changes needed): $($Results.Skipped)" -ForegroundColor DarkGray
    Write-Host "=============================" -ForegroundColor Cyan
    #EndRegion
}

#Region Execute the Function
Set-NameFieldFirst -LibraryName $LibraryName -ContentTypeName $ContentTypeName -IncludeGenericLists:$IncludeGenericLists
#EndRegion
```

**What the script now does for each content type:**

| Check | Action |
|-------|--------|
| Has "Name" field (FileLeafRef) | Move to first position |
| Has "Title" field | Set to hidden |
| Has description | Clear it (set to blank) |

**Sample output:**
```
Processing Library: Documents, Content Type: Project Document
  Found Content Type: Project Document
    Found 'Name' field. Moving to first position...
    Found 'Title' field. Setting to hidden...
    Found description: 'Use for project files'. Clearing...
    Changes applied: Name field moved to first, Title field hidden, Description cleared
