<#
.SYNOPSIS
    SharePoint Document Library Metadata Update Script with Managed Metadata Filtering

.DESCRIPTION
    Processes SharePoint document libraries to update item metadata based on content types 
    and managed metadata field values. Supports large-scale operations (100K+ items) with 
    optimized CAML queries, chunking, and detailed logging.

.PARAMETER LibraryNames
    Array of library names to process

.PARAMETER ContentTypeNames
    Array of content type names to filter

.PARAMETER ColumnName
    Internal name of the managed metadata field to match

.PARAMETER ColumnValues
    Array of account numbers (or term labels) to match against

.PARAMETER ModifiedBy
    Email of user to set as 'Modified By'. Leave empty to skip updating Editor field.

.PARAMETER MaxUpdatesPerLibrary
    Maximum number of items to update per library. 0 or empty = unlimited (default: 0)

.PARAMETER DryRun
    Dry run mode - logs what would be updated without making changes

.EXAMPLE
    .\Update-SPOMetadata.ps1 -LibraryNames @("Documents","Contracts") `
        -ContentTypeNames @("Invoice","Agreement") `
        -ColumnName "AccountField" `
        -ColumnValues @("1000","1001","2001") `
        -ModifiedBy "admin@contoso.com" `
        -MaxUpdatesPerLibrary 100

.NOTES
    Requires: PnP.PowerShell module (modern)
    Author: Generated Script
    Date: 2025-10-24
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string[]]$LibraryNames,
    
    [Parameter(Mandatory = $true)]
    [string[]]$ContentTypeNames,
    
    [Parameter(Mandatory = $true)]
    [string]$ColumnName,
    
    [Parameter(Mandatory = $true)]
    [string[]]$ColumnValues,
    
    [Parameter(Mandatory = $false)]
    [string]$ModifiedBy = "",
    
    [Parameter(Mandatory = $false)]
    [int]$MaxUpdatesPerLibrary = 0,
    
    [Parameter(Mandatory = $false)]
    [switch]$DryRun
)

#region Configuration Variables
# SharePoint site URL and Client ID for PnP authentication
$SiteUrl = "https://contoso.sharepoint.com/sites/YourSite"
$ClientId = "00000000-0000-0000-0000-000000000000"  # Azure AD App Registration Client ID

# Chunk size for account values in CAML query
# Recommended: 10-15 for optimal balance between query complexity and number of queries
# 10 = safer, more queries | 15 = fewer queries, deeper nesting | Max safe: ~20
$ChunkSize = 10

# ID range size for threshold avoidance (must be less than 5000)
# Each query will fetch items in ID ranges (e.g., 1-4999, 5000-9999, etc.)
$IdBatchSize = 4999

# Maximum ID to process (safe high estimate to avoid querying for max ID which can hit threshold)
# Adjust this if you have libraries with items exceeding this ID
# Default: 500000 (sufficient for most libraries)
$MaxIdEstimate = 500000
#endregion

#region Initialize Logging
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = "log_$timestamp.txt"

function Write-Log {
    param(
        [string]$Message,
        [string]$Library = "",
        [string]$ContentType = "",
        [string]$ItemID = "",
        [string]$Action = "",
        [string]$AccountNumbers = "",
        [string]$ModifiedByUser = "",
        [string]$ErrorMessage = ""
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp]"
    
    if ($Library) { $logEntry += " Library: $Library" }
    if ($ContentType) { $logEntry += " | ContentType: $ContentType" }
    if ($ItemID) { $logEntry += " | ItemID: $ItemID" }
    if ($Action) { $logEntry += " | Action: $Action" }
    if ($AccountNumbers) { $logEntry += " | Accounts: $AccountNumbers" }
    if ($ModifiedByUser) { $logEntry += " | ModifiedBy: $ModifiedByUser" }
    if ($ErrorMessage) { $logEntry += " | Error: $ErrorMessage" }
    if (!$Library -and !$ContentType -and !$ItemID) { $logEntry += " $Message" }
    
    $logEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

function Write-CAMLQueryLog {
    param(
        [string]$Library,
        [string]$ContentType,
        [string]$CAMLQuery,
        [int]$ChunkNumber,
        [int]$IdStart,
        [int]$IdEnd
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    # Format CAML query for readability
    $formattedCAML = $CAMLQuery `
        -replace '<View>', "`n<View>`n  " `
        -replace '<Query>', "<Query>`n    " `
        -replace '<Where>', "<Where>`n      " `
        -replace '<And>', "<And>`n        " `
        -replace '</And>', "`n      </And>" `
        -replace '<Geq>', "<Geq>`n          " `
        -replace '</Geq>', "`n        </Geq>" `
        -replace '<Lt>', "<Lt>`n          " `
        -replace '</Lt>', "`n        </Lt>" `
        -replace '<Eq>', "<Eq>`n          " `
        -replace '</Eq>', "`n        </Eq>" `
        -replace '<Contains>', "<Contains>`n          " `
        -replace '</Contains>', "`n        </Contains>" `
        -replace '<Or>', "<Or>`n        " `
        -replace '</Or>', "`n      </Or>" `
        -replace '<FieldRef', "`n            <FieldRef" `
        -replace '<Value', "`n            <Value" `
        -replace '</Where>', "`n    </Where>" `
        -replace '</Query>', "`n  </Query>" `
        -replace '<RowLimit>', "`n  <RowLimit>" `
        -replace '</RowLimit>', "</RowLimit>`n" `
        -replace '</View>', "</View>`n"
    
    $logEntry = @"

[$timestamp] ========== CAML QUERY ==========
Library: $Library
ContentType: $ContentType
Chunk: $ChunkNumber | ID Range: $IdStart - $($IdEnd - 1)
$formattedCAML
========================================

"@
    
    $logEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

function Write-ConsoleHeader {
    param([string]$Text, [string]$Color = "Cyan")
    
    $line = "=" * 80
    Write-Host "`n$line" -ForegroundColor $Color
    Write-Host $Text -ForegroundColor $Color
    Write-Host "$line" -ForegroundColor $Color
}

function Write-ConsoleSubHeader {
    param([string]$Text, [string]$Color = "Yellow")
    
    $line = "-" * 60
    Write-Host "`n$line" -ForegroundColor $Color
    Write-Host $Text -ForegroundColor $Color
    Write-Host "$line" -ForegroundColor $Color
}

function Write-ConsoleSummary {
    param(
        [string]$Title,
        [int]$Updated,
        [int]$Skipped,
        [int]$Errors,
        [string]$Color = "Cyan"
    )
    
    Write-Host "`n  $Title" -ForegroundColor $Color
    Write-Host "    ✓ Updated : " -NoNewline -ForegroundColor Gray
    Write-Host $Updated -ForegroundColor Green
    Write-Host "    ○ Skipped : " -NoNewline -ForegroundColor Gray
    Write-Host $Skipped -ForegroundColor Yellow
    Write-Host "    ✗ Errors  : " -NoNewline -ForegroundColor Gray
    Write-Host $Errors -ForegroundColor $(if($Errors -gt 0){'Red'}else{'Green'})
}
#endregion

#region Script Start
Write-ConsoleHeader "SHAREPOINT METADATA UPDATE SCRIPT" "Green"

Write-Log -Message "========================================="
Write-Log -Message "Script execution started"
Write-Log -Message "========================================="
Write-Log -Message "Configuration:"
Write-Log -Message "  Site URL: $SiteUrl"
Write-Log -Message "  Client ID: $ClientId"
Write-Log -Message "Parameters:"
Write-Log -Message "  Libraries: $($LibraryNames -join ', ')"
Write-Log -Message "  Content Types: $($ContentTypeNames -join ', ')"
Write-Log -Message "  Column Name: $ColumnName"
Write-Log -Message "  Column Values: $($ColumnValues.Count) account(s) - [$($ColumnValues[0])...$($ColumnValues[-1])]"
Write-Log -Message "  Modified By: $(if($ModifiedBy){"$ModifiedBy"}else{'(not set - Editor will not change)'})"
Write-Log -Message "  Max Updates Per Library: $(if($MaxUpdatesPerLibrary -gt 0){"$MaxUpdatesPerLibrary"}else{'Unlimited'})"
Write-Log -Message "  Dry Run Mode: $($DryRun.IsPresent)"
Write-Log -Message "Settings:"
Write-Log -Message "  Chunk Size: $ChunkSize"
Write-Log -Message "  ID Batch Size: $IdBatchSize"
Write-Log -Message "  Max ID Estimate: $MaxIdEstimate"
Write-Log -Message "========================================="

Write-Host "`nCONFIGURATION:" -ForegroundColor White
Write-Host "  Site URL            : " -NoNewline -ForegroundColor Gray
Write-Host $SiteUrl -ForegroundColor White
Write-Host "  Libraries           : " -NoNewline -ForegroundColor Gray
Write-Host "$($LibraryNames.Count) library(ies)" -ForegroundColor White
Write-Host "  Content Types       : " -NoNewline -ForegroundColor Gray
Write-Host "$($ContentTypeNames.Count) type(s)" -ForegroundColor White
Write-Host "  Account Values      : " -NoNewline -ForegroundColor Gray
Write-Host "$($ColumnValues.Count) account(s)" -ForegroundColor White
Write-Host "  Modified By         : " -NoNewline -ForegroundColor Gray
Write-Host $(if($ModifiedBy){$ModifiedBy}else{"(not changing Editor)"}) -ForegroundColor White
Write-Host "  Max Per Library     : " -NoNewline -ForegroundColor Gray
Write-Host $(if($MaxUpdatesPerLibrary -gt 0){$MaxUpdatesPerLibrary}else{"Unlimited"}) -ForegroundColor White
Write-Host "  Mode                : " -NoNewline -ForegroundColor Gray
Write-Host $(if($DryRun){"DRY RUN (no changes)"}else{"LIVE (making changes)"}) -ForegroundColor $(if($DryRun){"Yellow"}else{"Red"})

# Validate parameters
if ($ColumnValues.Count -eq 0) {
    Write-Host "`n[ERROR] ColumnValues parameter is empty. Exiting." -ForegroundColor Red
    Write-Log -Message "ERROR: ColumnValues parameter is empty. Exiting."
    exit 1
}

if ($LibraryNames.Count -eq 0) {
    Write-Host "`n[ERROR] LibraryNames parameter is empty. Exiting." -ForegroundColor Red
    Write-Log -Message "ERROR: LibraryNames parameter is empty. Exiting."
    exit 1
}

if ($ContentTypeNames.Count -eq 0) {
    Write-Host "`n[ERROR] ContentTypeNames parameter is empty. Exiting." -ForegroundColor Red
    Write-Log -Message "ERROR: ContentTypeNames parameter is empty. Exiting."
    exit 1
}
#endregion

#region Connect to SharePoint
Write-Host "`n"
Write-Host "Connecting to SharePoint..." -ForegroundColor Cyan
Write-Log -Message "Attempting to connect to SharePoint: $SiteUrl"

try {
    Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ErrorAction Stop
    Write-Host "✓ Successfully connected to SharePoint" -ForegroundColor Green
    Write-Log -Message "Successfully connected to SharePoint"
}
catch {
    Write-Host "✗ FATAL ERROR: Failed to connect to SharePoint" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Log -Message "FATAL ERROR: Failed to connect to SharePoint" -ErrorMessage $_.Exception.Message
    Write-Log -Message "Stack Trace: $($_.ScriptStackTrace)"
    exit 1
}
#endregion

#region Get User Object for ModifiedBy (if provided)
$editorUser = $null
if (![string]::IsNullOrWhiteSpace($ModifiedBy)) {
    Write-Host "Retrieving user object for Modified By..." -ForegroundColor Cyan
    Write-Log -Message "Retrieving user object for ModifiedBy: $ModifiedBy"
    
    try {
        $editorUser = Get-PnPUser -Identity $ModifiedBy -ErrorAction Stop
        Write-Host "✓ User found: $($editorUser.Title) (ID: $($editorUser.Id))" -ForegroundColor Green
        Write-Log -Message "User object retrieved successfully: $($editorUser.Title) (ID: $($editorUser.Id))"
    }
    catch {
        Write-Host "✗ ERROR: Failed to retrieve user: $ModifiedBy" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Continuing without ModifiedBy - Editor field will not be changed" -ForegroundColor Yellow
        Write-Log -Message "ERROR: Failed to retrieve user for ModifiedBy: $ModifiedBy" -ErrorMessage $_.Exception.Message
        Write-Log -Message "Stack Trace: $($_.ScriptStackTrace)"
        Write-Log -Message "Continuing without ModifiedBy updates"
        $ModifiedBy = ""
        $editorUser = $null
    }
}
#endregion

#region Helper Function: Build CAML Query with ID Range and Single Content Type
function Build-CAMLQuery {
    param(
        [string]$ContentTypeId,
        [string[]]$AccountChunk,
        [string]$FieldName,
        [int]$IdStart,
        [int]$IdEnd
    )
    
    # Build ContentType <Eq> clause (single content type)
    $ctFilter = "<Eq><FieldRef Name='ContentTypeId' /><Value Type='ContentTypeId'>$ContentTypeId</Value></Eq>"
    
    # Build Account <Contains> with nested <Or> using Type='Text' for managed metadata labels
    if ($AccountChunk.Count -eq 1) {
        $accountFilter = "<Contains><FieldRef Name='$FieldName' /><Value Type='Text'>$($AccountChunk[0])</Value></Contains>"
    }
    else {
        $accountFilter = ""
        for ($i = $AccountChunk.Count - 1; $i -ge 0; $i--) {
            $contains = "<Contains><FieldRef Name='$FieldName' /><Value Type='Text'>$($AccountChunk[$i])</Value></Contains>"
            if ($i -eq $AccountChunk.Count - 1) {
                $accountFilter = $contains
            }
            else {
                $accountFilter = "<Or>$contains$accountFilter</Or>"
            }
        }
    }
    
    # Build ID range filter
    $idFilter = "<And><Geq><FieldRef Name='ID' /><Value Type='Number'>$IdStart</Value></Geq><Lt><FieldRef Name='ID' /><Value Type='Number'>$IdEnd</Value></Lt></And>"
    
    # Combine all filters with nested <And>
    $whereClause = "<And>$idFilter<And>$ctFilter$accountFilter</And></And>"
    
    # Build complete CAML query
    $caml = "<View><Query><Where>$whereClause</Where></Query><RowLimit>$IdBatchSize</RowLimit></View>"
    
    return $caml
}
#endregion

#region Helper Function: Extract Account Numbers from Item
function Get-AccountNumbersFromItem {
    param(
        [object]$Item,
        [string]$FieldName
    )
    
    try {
        $fieldValue = $Item[$FieldName]
        
        if ($null -eq $fieldValue) {
            return @()
        }
        
        # Handle TaxonomyFieldValueCollection (multi-value)
        if ($fieldValue -is [Microsoft.SharePoint.Client.Taxonomy.TaxonomyFieldValueCollection]) {
            return $fieldValue | ForEach-Object { $_.Label }
        }
        
        # Handle TaxonomyFieldValue (single value)
        if ($fieldValue -is [Microsoft.SharePoint.Client.Taxonomy.TaxonomyFieldValue]) {
            return @($fieldValue.Label)
        }
        
        # Handle array or collection
        if ($fieldValue -is [Array] -or $fieldValue -is [System.Collections.IEnumerable]) {
            $labels = @()
            foreach ($val in $fieldValue) {
                if ($val.Label) {
                    $labels += $val.Label
                }
                elseif ($val -is [string]) {
                    $labels += $val
                }
            }
            return $labels
        }
        
        # Handle string (fallback)
        if ($fieldValue -is [string]) {
            return @($fieldValue)
        }
        
        return @()
    }
    catch {
        Write-Log -Message "Warning: Failed to extract account numbers from field '$FieldName'" -ErrorMessage $_.Exception.Message
        return @()
    }
}
#endregion

#region Main Processing Loop
$totalLibraries = $LibraryNames.Count
$currentLibraryIndex = 0
$scriptTotalUpdated = 0
$scriptTotalSkipped = 0
$scriptTotalErrors = 0
$scriptStartTime = Get-Date

foreach ($libraryName in $LibraryNames) {
    $currentLibraryIndex++
    $libraryStartTime = Get-Date
    
    Write-ConsoleHeader "LIBRARY: $libraryName ($currentLibraryIndex of $totalLibraries)" "Cyan"
    Write-Log -Message "========================================="
    Write-Log -Library $libraryName -Action "Started" -Message "Processing library ($currentLibraryIndex of $totalLibraries)"
    Write-Log -Message "========================================="
    
    # Initialize library counter
    $updatedCountForLibrary = 0
    $skippedCountForLibrary = 0
    $errorCountForLibrary = 0
    
    #region Get Library and Content Types
    try {
        Write-Host "  Verifying library exists..." -ForegroundColor Gray
        $library = Get-PnPList -Identity "$libraryName" -ErrorAction Stop
        Write-Host "  ✓ Library verified" -ForegroundColor Green
        Write-Log -Library $libraryName -Action "Info" -Message "Library found and verified"
        
        Write-Host "  Retrieving content types..." -ForegroundColor Gray
        $libraryContentTypes = Get-PnPContentType -List "$libraryName" -ErrorAction Stop
        
        # Match against ContentTypeNames parameter
        $matchingContentTypes = $libraryContentTypes | Where-Object { 
            $ContentTypeNames -contains $_.Name 
        }
        
        if ($matchingContentTypes.Count -eq 0) {
            Write-Host "  ⚠ WARNING: No matching content types found" -ForegroundColor Yellow
            Write-Host "    Expected: $($ContentTypeNames -join ', ')" -ForegroundColor Yellow
            Write-Host "    Found: $($libraryContentTypes.Name -join ', ')" -ForegroundColor Yellow
            Write-Log -Library $libraryName -Action "Warning" -Message "No matching content types found. Expected: $($ContentTypeNames -join ', ') | Found: $($libraryContentTypes.Name -join ', ')"
            continue
        }
        
        Write-Host "  ✓ Found $($matchingContentTypes.Count) matching content type(s):" -ForegroundColor Green
        foreach ($ct in $matchingContentTypes) {
            Write-Host "    • $($ct.Name)" -ForegroundColor White
        }
        Write-Log -Library $libraryName -Action "Info" -Message "Found $($matchingContentTypes.Count) matching content types: $($matchingContentTypes.Name -join ', ')"
    }
    catch {
        Write-Host "  ✗ ERROR: Failed to retrieve library or content types" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
        Write-Log -Library $libraryName -Action "Error" -Message "Failed to retrieve library or content types" -ErrorMessage "$($_.Exception.Message) | StackTrace: $($_.ScriptStackTrace)"
        $errorCountForLibrary++
        continue
    }
    #endregion
    
    #region Process Each Content Type (One at a Time)
    $totalContentTypes = $matchingContentTypes.Count
    $currentContentTypeIndex = 0
    
    foreach ($contentType in $matchingContentTypes) {
        # Check if max updates reached
        if ($MaxUpdatesPerLibrary -gt 0 -and $updatedCountForLibrary -ge $MaxUpdatesPerLibrary) {
            Write-Host "`n  ⚠ Max updates limit reached ($MaxUpdatesPerLibrary)" -ForegroundColor Yellow
            Write-Host "    Skipping remaining content types" -ForegroundColor Yellow
            Write-Log -Library $libraryName -Action "MaxUpdatesReached" -Message "Limit of $MaxUpdatesPerLibrary updates reached. Skipping remaining content types."
            break
        }
        
        $currentContentTypeIndex++
        $contentTypeName = $contentType.Name
        $contentTypeId = $contentType.StringId
        
        Write-ConsoleSubHeader "Content Type: $contentTypeName ($currentContentTypeIndex of $totalContentTypes)" "Magenta"
        Write-Log -Message "-----------------------------------------"
        Write-Log -Library $libraryName -ContentType $contentTypeName -Action "ContentTypeStart" -Message "Processing content type ($currentContentTypeIndex of $totalContentTypes) | ID: $contentTypeId"
        
        #region Chunk Account Values and Process
        $totalChunks = [Math]::Ceiling($ColumnValues.Count / $ChunkSize)
        $currentChunk = 0
        
        for ($i = 0; $i -lt $ColumnValues.Count; $i += $ChunkSize) {
            # Check if max updates reached
            if ($MaxUpdatesPerLibrary -gt 0 -and $updatedCountForLibrary -ge $MaxUpdatesPerLibrary) {
                Write-Host "    ⚠ Max updates limit reached" -ForegroundColor Yellow
                Write-Log -Library $libraryName -ContentType $contentTypeName -Action "MaxUpdatesReached" -Message "Limit reached. Skipping remaining chunks."
                break
            }
            
            $currentChunk++
            $endIndex = [Math]::Min($i + $ChunkSize - 1, $ColumnValues.Count - 1)
            $accountChunk = $ColumnValues[$i..$endIndex]
            
            Write-Host "`n    ┌─ Chunk $currentChunk of $totalChunks ─────────────────────" -ForegroundColor Yellow
            Write-Host "    │ Accounts: " -NoNewline -ForegroundColor Yellow
            Write-Host "$($accountChunk[0]) ... $($accountChunk[-1]) " -NoNewline -ForegroundColor White
            Write-Host "($($accountChunk.Count) values)" -ForegroundColor Gray
            Write-Host "    └────────────────────────────────────────" -ForegroundColor Yellow
            
            Write-Log -Library $libraryName -ContentType $contentTypeName -Action "ChunkStart" -Message "Processing chunk $currentChunk of $totalChunks | Accounts: $($accountChunk -join ', ')"
            
            #region Process ID Ranges
            $allItems = @()
            $idRangeCount = 0
            $emptyRangeCount = 0
            
            for ($idStart = 1; $idStart -le $MaxIdEstimate; $idStart += $IdBatchSize) {
                # Check if max updates reached
                if ($MaxUpdatesPerLibrary -gt 0 -and $updatedCountForLibrary -ge $MaxUpdatesPerLibrary) {
                    Write-Host "      ⚠ Max updates limit reached" -ForegroundColor Yellow
                    Write-Log -Library $libraryName -ContentType $contentTypeName -Action "MaxUpdatesReached" -Message "Limit reached. Skipping remaining ID ranges."
                    break
                }
                
                $idEnd = $idStart + $IdBatchSize
                $idRangeCount++
                
                Write-Host "      → ID Range $idRangeCount: " -NoNewline -ForegroundColor Gray
                Write-Host "$idStart - $($idEnd - 1)" -NoNewline -ForegroundColor White
                Write-Host " ... " -NoNewline -ForegroundColor Gray
                
                try {
                    # Build CAML query
                    $camlQuery = Build-CAMLQuery -ContentTypeId $contentTypeId -AccountChunk $accountChunk -FieldName $ColumnName -IdStart $idStart -IdEnd $idEnd
                    
                    # Log formatted CAML query
                    Write-CAMLQueryLog -Library $libraryName -ContentType $contentTypeName -CAMLQuery $camlQuery -ChunkNumber $currentChunk -IdStart $idStart -IdEnd $idEnd
                    
                    # Execute query
                    $items = Get-PnPListItem -List "$libraryName" -Query $camlQuery -ErrorAction Stop
                    
                    if ($items.Count -gt 0) {
                        $allItems += $items
                        $emptyRangeCount = 0
                        Write-Host "$($items.Count) items found" -ForegroundColor Green
                        Write-Host "        Total retrieved: $($allItems.Count)" -ForegroundColor Cyan
                        Write-Log -Library $libraryName -ContentType $contentTypeName -Action "QueryComplete" -Message "ID range $idStart-$($idEnd-1): Retrieved $($items.Count) items | Running total: $($allItems.Count)"
                    }
                    else {
                        $emptyRangeCount++
                        Write-Host "No items" -ForegroundColor DarkGray
                        
                        if ($emptyRangeCount -ge 3) {
                            Write-Host "        (3 consecutive empty ranges - stopping ID iteration)" -ForegroundColor DarkGray
                            Write-Log -Library $libraryName -ContentType $contentTypeName -Action "Info" -Message "Three consecutive empty ID ranges detected. Stopping iteration."
                            break
                        }
                    }
                }
                catch {
                    Write-Host "ERROR" -ForegroundColor Red
                    Write-Host "        $($_.Exception.Message)" -ForegroundColor Red
                    Write-Log -Library $libraryName -ContentType $contentTypeName -Action "Error" -Message "CAML query failed for chunk $currentChunk, ID range $idStart-$($idEnd-1)" -ErrorMessage "$($_.Exception.Message) | StackTrace: $($_.ScriptStackTrace)"
                    $errorCountForLibrary++
                }
            }
            
            Write-Host "`n      ═══ Chunk Query Complete ═══" -ForegroundColor Cyan
            Write-Host "      Total items retrieved: " -NoNewline -ForegroundColor Gray
            Write-Host $allItems.Count -ForegroundColor Cyan
            Write-Host "      ID ranges processed: " -NoNewline -ForegroundColor Gray
            Write-Host $idRangeCount -ForegroundColor Cyan
            
            Write-Log -Library $libraryName -ContentType $contentTypeName -Action "ChunkQueryComplete" -Message "Chunk $currentChunk query complete | Retrieved: $($allItems.Count) items | ID ranges: $idRangeCount"
            
            if ($allItems.Count -eq 0) {
                Write-Host "      No items to process in this chunk" -ForegroundColor DarkGray
                continue
            }
            #endregion
            
            #region Process Each Item
            Write-Host "`n      ┌─ Processing Items ─────────────────────" -ForegroundColor White
            
            $itemCount = 0
            $chunkUpdated = 0
            $chunkSkipped = 0
            $chunkErrors = 0
            
            foreach ($item in $allItems) {
                # Check max updates limit
                if ($MaxUpdatesPerLibrary -gt 0 -and $updatedCountForLibrary -ge $MaxUpdatesPerLibrary) {
                    Write-Host "      │ ⚠ Max updates limit reached" -ForegroundColor Yellow
                    Write-Log -Library $libraryName -ContentType $contentTypeName -Action "MaxUpdatesReached" -Message "Limit reached at $updatedCountForLibrary updates."
                    break
                }
                
                $itemCount++
                
                try {
                    $itemId = $item.Id
                    
                    # Progress indicator
                    if ($itemCount % 50 -eq 0 -or $itemCount -eq $allItems.Count) {
                        $percentComplete = [Math]::Round(($itemCount / $allItems.Count) * 100, 1)
                        Write-Host "      │ Progress: $itemCount / $($allItems.Count) ($percentComplete%) - " -NoNewline -ForegroundColor Gray
                        Write-Host "Updated: $chunkUpdated" -NoNewline -ForegroundColor Green
                        Write-Host " | Skipped: $chunkSkipped" -NoNewline -ForegroundColor Yellow
                        Write-Host " | Errors: $chunkErrors" -ForegroundColor Red
                    }
                    
                    #region Verify Account Match
                    $itemAccountNumbers = Get-AccountNumbersFromItem -Item $item -FieldName $ColumnName
                    
                    if ($itemAccountNumbers.Count -eq 0) {
                        Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "Skipped" -Message "Field '$ColumnName' is empty or could not be read"
                        $skippedCountForLibrary++
                        $chunkSkipped++
                        continue
                    }
                    
                    $matchedAccounts = $itemAccountNumbers | Where-Object { $ColumnValues -contains $_ }
                    
                    if ($matchedAccounts.Count -eq 0) {
                        Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "Skipped" -AccountNumbers ($itemAccountNumbers -join ', ') -Message "No matching account values"
                        $skippedCountForLibrary++
                        $chunkSkipped++
                        continue
                    }
                    
                    $matchedAccountsString = $matchedAccounts -join ', '
                    #endregion
                    
                    #region Perform Update
                    if ($DryRun) {
                        Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "DryRun" -AccountNumbers $matchedAccountsString -ModifiedByUser $ModifiedBy -Message "Would update item"
                        $updatedCountForLibrary++
                        $chunkUpdated++
                    }
                    else {
                        if ([string]::IsNullOrWhiteSpace($ModifiedBy)) {
                            $item.Update()
                            $item.Context.ExecuteQuery()
                            Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "Updated" -AccountNumbers $matchedAccountsString -Message "Modified date updated, Editor unchanged"
                        }
                        else {
                            $item["Editor"] = $editorUser.Id
                            $item.Update()
                            $item.Context.ExecuteQuery()
                            Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "Updated" -AccountNumbers $matchedAccountsString -ModifiedByUser $ModifiedBy
                        }
                        
                        $updatedCountForLibrary++
                        $chunkUpdated++
                    }
                    #endregion
                }
                catch {
                    Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "Error" -ErrorMessage "$($_.Exception.Message) | StackTrace: $($_.ScriptStackTrace)"
                    $errorCountForLibrary++
                    $chunkErrors++
                }
            }
            
            Write-Host "      └────────────────────────────────────────" -ForegroundColor White
            #endregion
            
            # Chunk Summary
            Write-ConsoleSummary "Chunk $currentChunk Results:" $chunkUpdated $chunkSkipped $chunkErrors "White"
            Write-Log -Library $libraryName -ContentType $contentTypeName -Action "ChunkComplete" -Message "Chunk $currentChunk complete | Updated: $chunkUpdated | Skipped: $chunkSkipped | Errors: $chunkErrors"
        }
        #endregion
        
        Write-Log -Library $libraryName -ContentType $contentTypeName -Action "ContentTypeComplete" -Message "Content type processing complete"
    }
    #endregion
    
    # Library Summary
    $libraryEndTime = Get-Date
    $libraryDuration = $libraryEndTime - $libraryStartTime
    
    Write-ConsoleHeader "LIBRARY '$libraryName' COMPLETE" "Cyan"
    Write-ConsoleSummary "Final Results:" $updatedCountForLibrary $skippedCountForLibrary $errorCountForLibrary "Cyan"
    Write-Host "  Duration: " -NoNewline -ForegroundColor Gray
    Write-Host "$($libraryDuration.Hours)h $($libraryDuration.Minutes)m $($libraryDuration.Seconds)s" -ForegroundColor White
    
    Write-Log -Message "========================================="
    Write-Log -Library $libraryName -Action "Complete" -Message "Library complete | Updated: $updatedCountForLibrary | Skipped: $skippedCountForLibrary | Errors: $errorCountForLibrary | Duration: $($libraryDuration.ToString())"
    Write-Log -Message "========================================="
    
    # Add to script totals
    $scriptTotalUpdated += $updatedCountForLibrary
    $scriptTotalSkipped += $skippedCountForLibrary
    $scriptTotalErrors += $errorCountForLibrary
}
#endregion

#region Script Complete
$scriptEndTime = Get-Date
$scriptDuration = $scriptEndTime - $scriptStartTime

Write-ConsoleHeader "SCRIPT EXECUTION COMPLETED" "Green"

Write-Host "`nFINAL SUMMARY:" -ForegroundColor White
Write-Host "  Total Libraries Processed : " -NoNewline -ForegroundColor Gray
Write-Host $totalLibraries -ForegroundColor White
Write-ConsoleSummary "Overall Results:" $scriptTotalUpdated $scriptTotalSkipped $scriptTotalErrors "Green"

Write-Host "`n  Total Duration    : " -NoNewline -ForegroundColor Gray
Write-Host "$($scriptDuration.Hours)h $($scriptDuration.Minutes)m $($scriptDuration.Seconds)s" -ForegroundColor White
Write-Host "  Log File          : " -NoNewline -ForegroundColor Gray
Write-Host $LogFile -ForegroundColor Cyan

Write-Host "`n" + ("=" * 80) -ForegroundColor Green

Write-Log -Message "========================================="
Write-Log -Message "SCRIPT EXECUTION COMPLETED"
Write-Log -Message "========================================="
Write-Log -Message "Final Summary:"
Write-Log -Message "  Total Libraries: $totalLibraries"
Write-Log -Message "  Total Updated: $scriptTotalUpdated"
Write-Log -Message "  Total Skipped: $scriptTotalSkipped"
Write-Log -Message "  Total Errors: $scriptTotalErrors"
Write-Log -Message "  Duration: $($scriptDuration.ToString())"
Write-Log -Message "  Log File: $LogFile"
Write-Log -Message "========================================="

Disconnect-PnPOnline
Write-Log -Message "Disconnected from SharePoint"
Write-Host "✓ Disconnected from SharePoint" -ForegroundColor Green
#endregion
