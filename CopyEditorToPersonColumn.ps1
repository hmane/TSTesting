# ============================================
# PnP PowerShell Script - Copy Editor to Person Column
# ============================================

# Variables - Update these values
$siteUrl = "https://yourtenant.sharepoint.com/sites/yoursite"
$clientId = "your-client-id-guid"
$listName = "Your List Name"
$personColumnInternalName = "YourPersonColumn"  # Internal name of the person column

# ============================================
# Script Configuration
# ============================================

# Create log file with timestamp
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $scriptPath "CopyEditorToPersonColumn_$timestamp.log"

# ============================================
# Functions
# ============================================

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "SUCCESS", "WARNING", "ERROR")]
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Write to console with color
    switch ($Level) {
        "INFO"    { Write-Host $logMessage -ForegroundColor Cyan }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        "ERROR"   { Write-Host $logMessage -ForegroundColor Red }
    }
    
    # Write to log file
    Add-Content -Path $logFile -Value $logMessage
}

# ============================================
# Main Script
# ============================================

try {
    Write-Log "========================================" -Level "INFO"
    Write-Log "Script Started" -Level "INFO"
    Write-Log "========================================" -Level "INFO"
    Write-Log "Site URL: $siteUrl" -Level "INFO"
    Write-Log "List Name: $listName" -Level "INFO"
    Write-Log "Person Column: $personColumnInternalName" -Level "INFO"
    Write-Log "Log File: $logFile" -Level "INFO"
    Write-Log "" -Level "INFO"
    
    # Connect to SharePoint Online
    Write-Log "Connecting to SharePoint Online..." -Level "INFO"
    Connect-PnPOnline -Url $siteUrl -ClientId $clientId -Interactive
    Write-Log "Successfully connected to SharePoint Online" -Level "SUCCESS"
    
    # Get the list
    Write-Log "Retrieving list: $listName" -Level "INFO"
    $list = Get-PnPList -Identity $listName -ErrorAction Stop
    Write-Log "List retrieved successfully" -Level "SUCCESS"
    
    # Get all items where the person column is empty
    Write-Log "Retrieving items where '$personColumnInternalName' is empty..." -Level "INFO"
    $camlQuery = @"
<View Scope='RecursiveAll'>
    <Query>
        <Where>
            <IsNull>
                <FieldRef Name='$personColumnInternalName'/>
            </IsNull>
        </Where>
    </Query>
    <RowLimit Paged='TRUE'>5000</RowLimit>
</View>
"@
    
    $items = Get-PnPListItem -List $listName -Query $camlQuery
    $totalItems = $items.Count
    Write-Log "Found $totalItems items to process" -Level "INFO"
    Write-Log "" -Level "INFO"
    
    if ($totalItems -eq 0) {
        Write-Log "No items found to update. Exiting." -Level "WARNING"
        Disconnect-PnPOnline
        exit
    }
    
    # Process each item
    $successCount = 0
    $errorCount = 0
    $currentItem = 0
    
    foreach ($item in $items) {
        $currentItem++
        $itemId = $item.Id
        $itemTitle = $item["Title"]
        
        try {
            Write-Log "Processing item $currentItem of $totalItems - ID: $itemId, Title: $itemTitle" -Level "INFO"
            
            # Get the Editor (Modified By) value
            $editor = $item["Editor"]
            
            if ($null -eq $editor) {
                Write-Log "  Warning: Editor field is empty for item ID $itemId. Skipping." -Level "WARNING"
                $errorCount++
                continue
            }
            
            # Get the user lookup value
            $editorLookupId = $editor.LookupId
            Write-Log "  Editor Lookup ID: $editorLookupId" -Level "INFO"
            
            # Update the item using SystemUpdate to avoid changing Modified/ModifiedBy
            $listItem = Get-PnPListItem -List $listName -Id $itemId
            $listItem[$personColumnInternalName] = $editorLookupId
            $listItem.SystemUpdate()
            
            Write-Log "  Successfully updated item ID $itemId" -Level "SUCCESS"
            $successCount++
            
        }
        catch {
            $errorMessage = $_.Exception.Message
            Write-Log "  Error processing item ID $itemId : $errorMessage" -Level "ERROR"
            $errorCount++
        }
    }
    
    Write-Log "" -Level "INFO"
    Write-Log "========================================" -Level "INFO"
    Write-Log "Processing Complete" -Level "INFO"
    Write-Log "========================================" -Level "INFO"
    Write-Log "Total Items Found: $totalItems" -Level "INFO"
    Write-Log "Successfully Updated: $successCount" -Level "SUCCESS"
    Write-Log "Errors: $errorCount" -Level "ERROR"
    Write-Log "" -Level "INFO"
    
    # Disconnect
    Write-Log "Disconnecting from SharePoint Online..." -Level "INFO"
    Disconnect-PnPOnline
    Write-Log "Disconnected successfully" -Level "SUCCESS"
    
}
catch {
    $errorMessage = $_.Exception.Message
    Write-Log "Critical Error: $errorMessage" -Level "ERROR"
    Write-Log "Stack Trace: $($_.ScriptStackTrace)" -Level "ERROR"
    
    # Attempt to disconnect if connected
    try {
        Disconnect-PnPOnline -ErrorAction SilentlyContinue
    }
    catch {
        # Silently ignore disconnect errors
    }
}
finally {
    Write-Log "" -Level "INFO"
    Write-Log "Script Ended" -Level "INFO"
    Write-Log "Log file saved at: $logFile" -Level "INFO"
}
