# High-Performance PnP PowerShell Script to Copy Boolean Column Data
# Optimized for large libraries (100k+ documents) with minimal logging

#region Configuration
$SiteUrl = "https://yourtenant.sharepoint.com/sites/yoursite"
$OldColumnInternalName = "OldBooleanField"  # Replace with your old column internal name
$NewColumnInternalName = "NewBooleanField"  # Replace with your new column internal name
$NewColumnDisplayName = "New Boolean Field" # Replace with your new column display name

# Performance Configuration
$BatchSize = 500  # Number of items to process in each batch

# Document Libraries to process
$DocumentLibraries = @(
    "Documents",
    "Library1", 
    "Library2"
    # Add more library names as needed
)
#endregion

#region Initialization
# Initialize logging paths
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$LogFile = Join-Path $ScriptPath "ColumnCopy_ErrorLog_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
$SummaryLogFile = Join-Path $ScriptPath "ColumnCopy_Summary_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

# Initialize summary counters
$TotalLibrariesProcessed = 0
$TotalItemsUpdated = 0
$TotalItemsSkipped = 0
$TotalErrors = 0
#endregion

#region Functions
function Write-ErrorLog {
    param($Message, $LibraryName = "", $ItemId = "")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] Library: $LibraryName | Item ID: $ItemId | Error: $Message"
    Add-Content -Path $LogFile -Value $logEntry
}

function Write-SummaryLog {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $Message"
    Add-Content -Path $SummaryLogFile -Value $logEntry
}
#endregion

# --- SCRIPT EXECUTION ---
try {
    # Connect to SharePoint Online
    Write-Host "Connecting to SharePoint Online..." -ForegroundColor Yellow
    Connect-PnPOnline -Url $SiteUrl -Interactive
    # For automated scenarios, consider using an App Registration:
    # Connect-PnPOnline -Url $SiteUrl -ClientId "your-app-id" -ClientSecret "your-app-secret"

    Write-SummaryLog "=== Column Copy Operation Started ==="
    Write-SummaryLog "Script Parameters: Old Column: $OldColumnInternalName | New Column: $NewColumnInternalName"

    # Process each document library
    foreach ($LibraryName in $DocumentLibraries) {
        $LibraryStartTime = Get-Date
        Write-Host "`n==== Processing library: $LibraryName ====" -ForegroundColor Cyan
        
        $LibraryItemsUpdated = 0
        $LibraryItemsSkipped = 0
        $LibraryErrors = 0
        
        # Check if library exists
        $library = Get-PnPList -Identity $LibraryName -ErrorAction SilentlyContinue
        if (-not $library) {
            Write-Host "Library '$LibraryName' not found. Skipping..." -ForegroundColor Red
            Write-ErrorLog "Library not found" $LibraryName
            continue
        }

        # Check if old column exists
        $oldField = Get-PnPField -List $LibraryName -Identity $OldColumnInternalName -ErrorAction SilentlyContinue
        if (-not $oldField) {
            Write-Host "Old column '$OldColumnInternalName' not found in library '$LibraryName'. Skipping..." -ForegroundColor Red
            Write-ErrorLog "Old column not found: $OldColumnInternalName" $LibraryName
            continue
        }

        # Check if new column already exists, create if needed
        $newField = Get-PnPField -List $LibraryName -Identity $NewColumnInternalName -ErrorAction SilentlyContinue
        if (-not $newField) {
            Write-Host "Creating new boolean column '$NewColumnDisplayName'..." -ForegroundColor Green
            try {
                Add-PnPField -List $LibraryName -DisplayName $NewColumnDisplayName -InternalName $NewColumnInternalName -Type Boolean -AddToDefaultView
                Write-Host "New column created successfully." -ForegroundColor Green
            }
            catch {
                Write-Host "Failed to create new column. Skipping library." -ForegroundColor Red
                Write-ErrorLog "Failed to create new column: $($_.Exception.Message)" $LibraryName
                continue
            }
        }

        # Get total item count for progress tracking
        Write-Host "Getting item count..." -ForegroundColor Yellow
        ## SUGGESTION 1: Simplified item count retrieval.
        $itemCount = (Get-PnPList -Identity $LibraryName).ItemCount
        Write-Host "Library contains approximately $itemCount items." -ForegroundColor Yellow

        # Process items in batches
        $position = $null
        $processedCount = 0
        $batchNumber = 0
        
        do {
            $batchNumber++
            $batchStartTime = Get-Date
            
            try {
                # Get items batch with optimized field selection
                if ($position) {
                    $items = Get-PnPListItem -List $LibraryName -PageSize $BatchSize -ListItemCollectionPosition $position -Fields "ID", $OldColumnInternalName, $NewColumnInternalName
                } else {
                    $items = Get-PnPListItem -List $LibraryName -PageSize $BatchSize -Fields "ID", $OldColumnInternalName, $NewColumnInternalName
                }
                
                $position = $items.ListItemCollectionPosition
                $currentBatchSize = $items.Count
                
                if ($currentBatchSize -gt 0) {
                    $processedCount += $currentBatchSize
                    # Avoid division by zero if itemCount is 0
                    $progressPercent = if ($itemCount -gt 0) { [math]::Round(($processedCount / $itemCount) * 100, 1) } else { 100 }
                    
                    Write-Host "Batch $batchNumber - Processing $currentBatchSize items ($processedCount/$itemCount - $progressPercent%)" -ForegroundColor Yellow
                    
                    $batchUpdated = 0
                    $batchSkipped = 0
                    $batchErrors = 0
                    
                    # Process items in current batch
                    foreach ($item in $items) {
                        try {
                            $oldValue = $item.FieldValues[$OldColumnInternalName]
                            
                            # Skip if old column has no value
                            if ($null -eq $oldValue) {
                                $batchSkipped++
                                continue
                            }
                            
                            ## SUGGESTION 2: Simplified boolean comparison. [bool]$null evaluates to $false.
                            $oldBoolValue = [bool]$oldValue
                            $newBoolValue = [bool]$item.FieldValues[$NewColumnInternalName]
                            
                            # Only update if values are different
                            if ($oldBoolValue -ne $newBoolValue) {
                                Set-PnPListItem -List $LibraryName -Identity $item.Id -Values @{$NewColumnInternalName = $oldBoolValue} -SystemUpdate
                                $batchUpdated++
                            } else {
                                $batchSkipped++
                            }
                        }
                        catch {
                            $batchErrors++
                            Write-ErrorLog $_.Exception.Message $LibraryName $item.Id
                        }
                    }
                    
                    $LibraryItemsUpdated += $batchUpdated
                    $LibraryItemsSkipped += $batchSkipped
                    $LibraryErrors += $batchErrors
                    
                    $batchDuration = ((Get-Date) - $batchStartTime).TotalSeconds
                    # Avoid division by zero if batch takes 0 seconds
                    $itemsPerSecond = if ($batchDuration -gt 0) { [math]::Round($currentBatchSize / $batchDuration, 1) } else { $currentBatchSize }

                    Write-Host "Batch completed - Updated: $batchUpdated, Skipped: $batchSkipped, Errors: $batchErrors ($itemsPerSecond items/sec)" -ForegroundColor Green
                }
            }
            catch {
                Write-Host "Error processing batch $batchNumber : $($_.Exception.Message)" -ForegroundColor Red
                Write-ErrorLog "Batch processing error: $($_.Exception.Message)" $LibraryName "Batch $batchNumber"
                $LibraryErrors++
                break # Exit the do-while loop for this library on a batch-level error
            }
        } while ($position)
        
        $libraryDuration = ((Get-Date) - $LibraryStartTime).TotalMinutes
        Write-Host "`nLibrary '$LibraryName' completed in $('{0:N2}' -f $libraryDuration) minutes" -ForegroundColor Cyan
        Write-Host "Results - Updated: $LibraryItemsUpdated, Skipped: $LibraryItemsSkipped, Errors: $LibraryErrors" -ForegroundColor Cyan
        
        # Update global counters
        $TotalItemsUpdated += $LibraryItemsUpdated
        $TotalItemsSkipped += $LibraryItemsSkipped
        $TotalErrors += $LibraryErrors
        $TotalLibrariesProcessed++
        
        Write-SummaryLog "Library: $LibraryName | Duration: $('{0:N2}' -f $libraryDuration) min | Updated: $LibraryItemsUpdated | Skipped: $LibraryItemsSkipped | Errors: $LibraryErrors"
    }
}
catch {
    $criticalError = $_.Exception.Message
    Write-Host "CRITICAL SCRIPT ERROR: $criticalError" -ForegroundColor Red
    Write-ErrorLog "CRITICAL SCRIPT ERROR: $criticalError"
    Write-SummaryLog "CRITICAL ERROR: Script terminated - $criticalError"
}
finally {
    # Final summary log
    Write-SummaryLog "=== Operation Completed ==="
    Write-SummaryLog "Libraries Processed: $TotalLibrariesProcessed | Items Updated: $TotalItemsUpdated | Items Skipped: $TotalItemsSkipped | Total Errors: $TotalErrors"
    
    # Disconnect from SharePoint
    if (Get-PnPConnection) {
        Disconnect-PnPOnline
        Write-Host "`nDisconnected from SharePoint Online." -ForegroundColor Yellow
    }

    # Final summary display
    Write-Host "`n==== SCRIPT COMPLETED ====" -ForegroundColor Green
    Write-Host "Libraries Processed: $TotalLibrariesProcessed" -ForegroundColor Green
    Write-Host "Total Items Updated: $TotalItemsUpdated" -ForegroundColor Green
    Write-Host "Total Items Skipped: $TotalItemsSkipped" -ForegroundColor Green
    Write-Host "Total Errors: $TotalErrors" -ForegroundColor Green

    Write-Host "`n=== LOG FILES ===" -ForegroundColor Magenta
    Write-Host "Summary Log: $SummaryLogFile" -ForegroundColor White
    if ($TotalErrors -gt 0) {
        Write-Host "Error Log:   $LogFile" -ForegroundColor White
    }
}
