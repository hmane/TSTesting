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
    Write-Host $logEntry
}
#endregion

#region Script Start
Write-Log -Message "========================================="
Write-Log -Message "Script execution started"
Write-Log -Message "========================================="
Write-Log -Message "Parameters:"
Write-Log -Message "  LibraryNames: $($LibraryNames -join ', ')"
Write-Log -Message "  ContentTypeNames: $($ContentTypeNames -join ', ')"
Write-Log -Message "  ColumnName: $ColumnName"
Write-Log -Message "  ColumnValues Count: $($ColumnValues.Count)"
Write-Log -Message "  ModifiedBy: $(if($ModifiedBy){"$ModifiedBy"}else{'(not set - Editor will not change)'})"
Write-Log -Message "  MaxUpdatesPerLibrary: $(if($MaxUpdatesPerLibrary -gt 0){"$MaxUpdatesPerLibrary"}else{'Unlimited'})"
Write-Log -Message "  DryRun Mode: $($DryRun.IsPresent)"
Write-Log -Message "  ChunkSize: $ChunkSize"
Write-Log -Message "  IdBatchSize: $IdBatchSize"
Write-Log -Message "  MaxIdEstimate: $MaxIdEstimate"
Write-Log -Message "========================================="

# Validate parameters
if ($ColumnValues.Count -eq 0) {
    Write-Log -Message "ERROR: ColumnValues parameter is empty. Exiting."
    exit 1
}

if ($LibraryNames.Count -eq 0) {
    Write-Log -Message "ERROR: LibraryNames parameter is empty. Exiting."
    exit 1
}

if ($ContentTypeNames.Count -eq 0) {
    Write-Log -Message "ERROR: ContentTypeNames parameter is empty. Exiting."
    exit 1
}
#endregion

#region Connect to SharePoint
try {
    Write-Log -Message "Connecting to SharePoint: $SiteUrl"
    Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId -ErrorAction Stop
    Write-Log -Message "Successfully connected to SharePoint"
}
catch {
    Write-Log -Message "FATAL ERROR: Failed to connect to SharePoint" -ErrorMessage $_.Exception.Message
    Write-Log -Message "Stack Trace: $($_.ScriptStackTrace)"
    exit 1
}
#endregion

#region Get User Object for ModifiedBy (if provided)
$editorUser = $null
if (![string]::IsNullOrWhiteSpace($ModifiedBy)) {
    try {
        Write-Log -Message "Retrieving user object for ModifiedBy: $ModifiedBy"
        $editorUser = Get-PnPUser -Identity $ModifiedBy -ErrorAction Stop
        Write-Log -Message "User object retrieved successfully: $($editorUser.Title) (ID: $($editorUser.Id))"
    }
    catch {
        Write-Log -Message "ERROR: Failed to retrieve user for ModifiedBy: $ModifiedBy" -ErrorMessage $_.Exception.Message
        Write-Log -Message "Stack Trace: $($_.ScriptStackTrace)"
        Write-Log -Message "Continuing without ModifiedBy updates - Editor field will not be changed"
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

foreach ($libraryName in $LibraryNames) {
    $currentLibraryIndex++
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Processing Library: $libraryName ($currentLibraryIndex of $totalLibraries)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Write-Log -Library $libraryName -Action "Started" -Message "Processing library"
    
    # Initialize library counter
    $updatedCountForLibrary = 0
    $skippedCountForLibrary = 0
    $errorCountForLibrary = 0
    
    #region Get Library and Content Types
    try {
        # Verify library exists (with double quotes)
        $library = Get-PnPList -Identity "$libraryName" -ErrorAction Stop
        Write-Log -Library $libraryName -Action "Info" -Message "Library found successfully"
        
        # Get all content types in the library (with double quotes)
        $libraryContentTypes = Get-PnPContentType -List "$libraryName" -ErrorAction Stop
        
        # Match against ContentTypeNames parameter
        $matchingContentTypes = $libraryContentTypes | Where-Object { 
            $ContentTypeNames -contains $_.Name 
        }
        
        if ($matchingContentTypes.Count -eq 0) {
            Write-Log -Library $libraryName -Action "Warning" -Message "No matching content types found in library. Expected: $($ContentTypeNames -join ', ') | Found: $($libraryContentTypes.Name -join ', ')"
            continue
        }
        
        Write-Host "  Found $($matchingContentTypes.Count) matching content types:" -ForegroundColor Green
        foreach ($ct in $matchingContentTypes) {
            Write-Host "    - $($ct.Name)" -ForegroundColor Gray
        }
        Write-Log -Library $libraryName -Action "Info" -Message "Found content types: $($matchingContentTypes.Name -join ', ')"
    }
    catch {
        Write-Log -Library $libraryName -Action "Error" -Message "Failed to retrieve library or content types" -ErrorMessage "$($_.Exception.Message) | StackTrace: $($_.ScriptStackTrace)"
        $errorCountForLibrary++
        continue
    }
    #endregion
    
    #region Process Each Content Type (One at a Time)
    $totalContentTypes = $matchingContentTypes.Count
    $currentContentTypeIndex = 0
    
    foreach ($contentType in $matchingContentTypes) {
        # Check if max updates reached before processing next content type
        if ($MaxUpdatesPerLibrary -gt 0 -and $updatedCountForLibrary -ge $MaxUpdatesPerLibrary) {
            Write-Host "`n  Max updates limit reached ($MaxUpdatesPerLibrary). Skipping remaining content types." -ForegroundColor Yellow
            Write-Log -Library $libraryName -Action "MaxUpdatesReached" -Message "Limit of $MaxUpdatesPerLibrary updates reached. Skipping remaining content types."
            break
        }
        
        $currentContentTypeIndex++
        $contentTypeName = $contentType.Name
        $contentTypeId = $contentType.StringId
        
        Write-Host "`n  ======================================" -ForegroundColor Magenta
        Write-Host "  Content Type: $contentTypeName ($currentContentTypeIndex of $totalContentTypes)" -ForegroundColor Magenta
        Write-Host "  ======================================" -ForegroundColor Magenta
        Write-Log -Library $libraryName -ContentType $contentTypeName -Action "ContentTypeStart" -Message "Processing content type (ID: $contentTypeId)"
        
        #region Chunk Account Values and Process
        $totalChunks = [Math]::Ceiling($ColumnValues.Count / $ChunkSize)
        $currentChunk = 0
        
        for ($i = 0; $i -lt $ColumnValues.Count; $i += $ChunkSize) {
            # Check if max updates reached before processing next chunk
            if ($MaxUpdatesPerLibrary -gt 0 -and $updatedCountForLibrary -ge $MaxUpdatesPerLibrary) {
                Write-Host "`n    Max updates limit reached ($MaxUpdatesPerLibrary). Skipping remaining chunks." -ForegroundColor Yellow
                Write-Log -Library $libraryName -ContentType $contentTypeName -Action "MaxUpdatesReached" -Message "Limit of $MaxUpdatesPerLibrary updates reached. Skipping remaining chunks."
                break
            }
            
            $currentChunk++
            $endIndex = [Math]::Min($i + $ChunkSize - 1, $ColumnValues.Count - 1)
            $accountChunk = $ColumnValues[$i..$endIndex]
            
            Write-Host "`n    ----------------------------------------" -ForegroundColor Yellow
            Write-Host "    Processing chunk $currentChunk of $totalChunks" -ForegroundColor Yellow
            Write-Host "    Accounts: $($accountChunk[0]) to $($accountChunk[-1]) ($($accountChunk.Count) values)" -ForegroundColor Yellow
            Write-Host "    ----------------------------------------" -ForegroundColor Yellow
            
            Write-Log -Library $libraryName -ContentType $contentTypeName -Action "ChunkStart" -Message "Processing chunk $currentChunk/$totalChunks with $($accountChunk.Count) account values: $($accountChunk -join ', ')"
            
            #region Process ID Ranges
            $allItems = @()
            $idRangeCount = 0
            $emptyRangeCount = 0
            
            for ($idStart = 1; $idStart -le $MaxIdEstimate; $idStart += $IdBatchSize) {
                # Check if max updates reached before processing next ID range
                if ($MaxUpdatesPerLibrary -gt 0 -and $updatedCountForLibrary -ge $MaxUpdatesPerLibrary) {
                    Write-Host "`n      Max updates limit reached. Skipping remaining ID ranges." -ForegroundColor Yellow
                    Write-Log -Library $libraryName -ContentType $contentTypeName -Action "MaxUpdatesReached" -Message "Limit reached. Skipping remaining ID ranges in chunk $currentChunk."
                    break
                }
                
                $idEnd = $idStart + $IdBatchSize
                $idRangeCount++
                
                Write-Host "      Processing ID range: $idStart to $($idEnd - 1) (Batch $idRangeCount)" -ForegroundColor Gray
                
                try {
                    # Build CAML query with ID range and single content type
                    $camlQuery = Build-CAMLQuery -ContentTypeId $contentTypeId -AccountChunk $accountChunk -FieldName $ColumnName -IdStart $idStart -IdEnd $idEnd
                    
                    # Log CAML query for debugging
                    Write-Log -Library $libraryName -ContentType $contentTypeName -Action "CAMLQuery" -Message "Chunk $currentChunk, ID Range $idStart-$($idEnd-1): $camlQuery"
                    
                    Write-Host "        Executing CAML query..." -ForegroundColor Gray
                    
                    # Get items (with double quotes)
                    $items = Get-PnPListItem -List "$libraryName" -Query $camlQuery -ErrorAction Stop
                    
                    if ($items.Count -gt 0) {
                        $allItems += $items
                        $emptyRangeCount = 0  # Reset counter
                        Write-Host "        Retrieved $($items.Count) items (Total so far: $($allItems.Count))" -ForegroundColor Green
                        Write-Log -Library $libraryName -ContentType $contentTypeName -Action "QueryComplete" -Message "ID range $idStart-$($idEnd-1): Retrieved $($items.Count) items"
                    }
                    else {
                        $emptyRangeCount++
                        Write-Host "        No items found in this ID range" -ForegroundColor Gray
                        
                        # If we've had 3 consecutive empty ranges, assume we've passed all items
                        if ($emptyRangeCount -ge 3) {
                            Write-Host "        Three consecutive empty ranges detected. Assuming end of items." -ForegroundColor Gray
                            Write-Log -Library $libraryName -ContentType $contentTypeName -Action "Info" -Message "Three consecutive empty ID ranges detected. Stopping ID range iteration."
                            break
                        }
                    }
                }
                catch {
                    Write-Log -Library $libraryName -ContentType $contentTypeName -Action "Error" -Message "CAML query failed for chunk $currentChunk, ID range $idStart-$($idEnd-1)" -ErrorMessage "$($_.Exception.Message) | StackTrace: $($_.ScriptStackTrace)"
                    $errorCountForLibrary++
                }
            }
            
            Write-Host "`n      Total items retrieved for chunk $currentChunk: $($allItems.Count)" -ForegroundColor Green
            Write-Log -Library $libraryName -ContentType $contentTypeName -Action "ChunkQueryComplete" -Message "Chunk $currentChunk complete: Retrieved $($allItems.Count) items across $idRangeCount ID range(s)"
            
            if ($allItems.Count -eq 0) {
                Write-Host "      No items found for this chunk. Moving to next chunk." -ForegroundColor Gray
                continue
            }
            #endregion
            
            #region Process Each Item
            $itemCount = 0
            $chunkUpdated = 0
            $chunkSkipped = 0
            $chunkErrors = 0
            
            foreach ($item in $allItems) {
                # Check max updates limit
                if ($MaxUpdatesPerLibrary -gt 0 -and $updatedCountForLibrary -ge $MaxUpdatesPerLibrary) {
                    Write-Host "        Max updates limit reached. Skipping remaining items in this chunk." -ForegroundColor Yellow
                    Write-Log -Library $libraryName -ContentType $contentTypeName -Action "MaxUpdatesReached" -Message "Limit reached at $updatedCountForLibrary updates. Skipping remaining items in chunk $currentChunk."
                    break
                }
                
                $itemCount++
                
                try {
                    $itemId = $item.Id
                    
                    # Progress indicator every 100 items
                    if ($itemCount % 100 -eq 0) {
                        $percentComplete = [Math]::Round(($itemCount / $allItems.Count) * 100, 1)
                        Write-Host "        Processing item $itemCount of $($allItems.Count) ($percentComplete%)..." -ForegroundColor Gray
                    }
                    
                    #region Verify Account Match
                    $itemAccountNumbers = Get-AccountNumbersFromItem -Item $item -FieldName $ColumnName
                    
                    if ($itemAccountNumbers.Count -eq 0) {
                        Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "Skipped" -Message "Field '$ColumnName' is empty or could not be read"
                        $skippedCountForLibrary++
                        $chunkSkipped++
                        continue
                    }
                    
                    # Check if any account number matches
                    $matchedAccounts = $itemAccountNumbers | Where-Object { $ColumnValues -contains $_ }
                    
                    if ($matchedAccounts.Count -eq 0) {
                        Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "Skipped" -AccountNumbers ($itemAccountNumbers -join ', ') -Message "No matching account values found"
                        $skippedCountForLibrary++
                        $chunkSkipped++
                        continue
                    }
                    
                    $matchedAccountsString = $matchedAccounts -join ', '
                    #endregion
                    
                    #region Perform Update
                    if ($DryRun) {
                        Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "DryRun" -AccountNumbers $matchedAccountsString -ModifiedByUser $ModifiedBy -Message "Would update item (Modified date would change)"
                        $updatedCountForLibrary++
                        $chunkUpdated++
                    }
                    else {
                        # Perform update based on ModifiedBy parameter
                        if ([string]::IsNullOrWhiteSpace($ModifiedBy)) {
                            # Update without changing Editor
                            # Modified date will be automatically set to current time by Update()
                            $item.Update()
                            $item.Context.ExecuteQuery()
                            
                            Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "Updated" -AccountNumbers $matchedAccountsString -Message "Modified date updated, Editor unchanged"
                        }
                        else {
                            # Update with new Editor
                            # Modified date will be automatically set to current time by Update()
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
                    $errorMessage = $_.Exception.Message
                    $stackTrace = $_.ScriptStackTrace
                    Write-Log -Library $libraryName -ContentType $contentTypeName -ItemID $itemId -Action "Error" -ErrorMessage "$errorMessage | StackTrace: $stackTrace"
                    $errorCountForLibrary++
                    $chunkErrors++
                }
            }
            #endregion
            
            # Chunk Summary
            Write-Host "`n      Chunk $currentChunk Summary:" -ForegroundColor Cyan
            Write-Host "        Updated: $chunkUpdated" -ForegroundColor Green
            Write-Host "        Skipped: $chunkSkipped" -ForegroundColor Yellow
            Write-Host "        Errors: $chunkErrors" -ForegroundColor Red
            
            Write-Log -Library $libraryName -ContentType $contentTypeName -Action "ChunkComplete" -Message "Chunk $currentChunk complete | Updated: $chunkUpdated | Skipped: $chunkSkipped | Errors: $chunkErrors"
        }
        #endregion
        
        Write-Log -Library $libraryName -ContentType $contentTypeName -Action "ContentTypeComplete" -Message "Content type processing complete"
    }
    #endregion
    
    # Library Summary
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Library '$libraryName' Complete:" -ForegroundColor Cyan
    Write-Host "  Updated: $updatedCountForLibrary" -ForegroundColor Green
    Write-Host "  Skipped: $skippedCountForLibrary" -ForegroundColor Yellow
    Write-Host "  Errors: $errorCountForLibrary" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    
    Write-Log -Library $libraryName -Action "Complete" -Message "Updated: $updatedCountForLibrary | Skipped: $skippedCountForLibrary | Errors: $errorCountForLibrary"
    
    # Add to script totals
    $scriptTotalUpdated += $updatedCountForLibrary
    $scriptTotalSkipped += $skippedCountForLibrary
    $scriptTotalErrors += $errorCountForLibrary
}
#endregion

#region Script Complete
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "SCRIPT EXECUTION COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Total across all libraries:" -ForegroundColor Green
Write-Host "  Updated: $scriptTotalUpdated" -ForegroundColor Green
Write-Host "  Skipped: $scriptTotalSkipped" -ForegroundColor Yellow
Write-Host "  Errors: $scriptTotalErrors" -ForegroundColor $(if($scriptTotalErrors -gt 0){'Red'}else{'Green'})
Write-Host "========================================" -ForegroundColor Green
Write-Host "Log file: $LogFile" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green

Write-Log -Message "========================================="
Write-Log -Message "Script execution completed"
Write-Log -Message "Total Updated: $scriptTotalUpdated"
Write-Log -Message "Total Skipped: $scriptTotalSkipped"
Write-Log -Message "Total Errors: $scriptTotalErrors"
Write-Log -Message "Log file: $LogFile"
Write-Log -Message "========================================="

Disconnect-PnPOnline
Write-Log -Message "Disconnected from SharePoint"
#endregion
