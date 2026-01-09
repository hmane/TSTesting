#Region Connection
$SiteUrl = "https://yourtenant.sharepoint.com/sites/yoursite"
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
    
    #Region Helper Function - Core logic to reorder fields
    function Update-ContentTypeFieldOrder {
        param (
            [string]$ListTitle,
            [Microsoft.SharePoint.Client.ContentType]$CT
        )
        
        $CTFields = Get-PnPProperty -ClientObject $CT -Property "FieldLinks"
        $NameField = $CTFields | Where-Object { $_.Name -eq "FileLeafRef" -or $_.Name -eq "Name" }
        
        if ($NameField) {
            Write-Host "    Found 'Name' field. Reordering..." -ForegroundColor Green
            
            $FieldNames = $CTFields | Select-Object -ExpandProperty Name
            $NameFieldInternalName = $NameField.Name
            $ReorderedFields = @($NameFieldInternalName) + ($FieldNames | Where-Object { $_ -ne $NameFieldInternalName })
            
            try {
                Set-PnPContentType -Identity $CT.Id.StringValue -List $ListTitle -FieldOrder $ReorderedFields
                Write-Host "    Successfully reordered fields for '$($CT.Name)'" -ForegroundColor Green
                return $true
            }
            catch {
                Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
                return $false
            }
        }
        else {
            Write-Host "    'Name' field not found. Skipping." -ForegroundColor DarkGray
            return $false
        }
    }
    #EndRegion
    
    #Region Single Content Type Mode
    if ($LibraryName -and $ContentTypeName) {
        Write-Host "Processing Library: $LibraryName, Content Type: $ContentTypeName" -ForegroundColor Yellow
        
        # Validate library
        $Library = Get-PnPList -Identity $LibraryName -ErrorAction SilentlyContinue
        if (-not $Library) {
            Write-Host "Error: Library '$LibraryName' not found." -ForegroundColor Red
            return
        }
        
        # Get specific content type
        $ContentType = Get-PnPContentType -List $LibraryName | Where-Object { $_.Name -eq $ContentTypeName }
        if (-not $ContentType) {
            Write-Host "Error: Content Type '$ContentTypeName' not found in '$LibraryName'." -ForegroundColor Red
            return
        }
        
        Write-Host "  Found Content Type: $($ContentType.Name)" -ForegroundColor Gray
        Update-ContentTypeFieldOrder -ListTitle $LibraryName -CT $ContentType
        return
    }
    #EndRegion
    
    #Region All Libraries Mode - Confirm first
    $Confirmation = Read-Host "No specific library/content type provided. Process ALL libraries? (Y/N)"
    if ($Confirmation -notin @('Y', 'y', 'Yes', 'yes')) {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        return
    }
    
    # Get libraries
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
            
            if (Update-ContentTypeFieldOrder -ListTitle $List.Title -CT $CT) {
                $Results.Updated++
            }
            else {
                $Results.Skipped++
            }
        }
    }
    
    # Summary
    Write-Host "`n========== Summary ==========" -ForegroundColor Cyan
    Write-Host "Total Processed: $($Results.Processed)" -ForegroundColor White
    Write-Host "Updated: $($Results.Updated)" -ForegroundColor Green
    Write-Host "Skipped: $($Results.Skipped)" -ForegroundColor DarkGray
    Write-Host "=============================" -ForegroundColor Cyan
    #EndRegion
}

#Region Usage Examples

# Process specific library and content type
# Set-NameFieldFirst -LibraryName "Documents" -ContentTypeName "Document"

# Process all libraries (will ask for confirmation)
# Set-NameFieldFirst

# Process all including generic lists (will ask for confirmation)
# Set-NameFieldFirst -IncludeGenericLists

#EndRegion
