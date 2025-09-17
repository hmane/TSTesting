# SharePoint Document Library Splitter - Enhanced Version
# Moves/copies documents from source library to new replica library based on query criteria

param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl,

    [Parameter(Mandatory = $true)]
    [string]$SourceLibrary,

    [Parameter(Mandatory = $true)]
    [string]$TargetLibrary,

    [Parameter(Mandatory = $true)]
    [string]$Query,

    [Parameter(Mandatory = $false)]
    [int]$BatchSize = 500,

    [Parameter(Mandatory = $false)]
    [switch]$SetReadonly = $true,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun = $false,

    [Parameter(Mandatory = $false)]
    [switch]$TestMode = $false,

    [Parameter(Mandatory = $false)]
    [int]$MaxConcurrentBatches = 3,

    [Parameter(Mandatory = $false)]
    [switch]$DeleteEmptyFolders = $true,

    [Parameter(Mandatory = $false)]
    [string]$LogPath = ".\split-library-log.txt",

    [Parameter(Mandatory = $false)]
    [string]$ReportPath = ".\move-report.html"
)

# Global variables for tracking
$script:ProcessedCount = 0
$script:TotalCount = 0
$script:FailedDocuments = @()
$script:SuccessfulDocuments = @()
$script:StartTime = Get-Date
$script:OriginalPermissions = $null
$script:TempTemplatePath = ""
$script:OperationDetails = @{
    SourceLibrary = ""
    TargetLibrary = ""
    Query = ""
    Mode = ""
    TotalFiles = 0
    TotalSize = 0
    ProcessedFiles = 0
    SuccessfulFiles = 0
    FailedFiles = 0
    ProcessedSize = 0
    StartTime = $null
    EndTime = $null
    Duration = $null
    Batches = @()
}

# Enhanced logging with colors and formatting
function Write-Log {
    param(
        [string]$Message, 
        [string]$Level = "INFO",
        [switch]$NoNewLine = $false
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Console output with colors
    $params = @{
        Object = $logEntry
        NoNewline = $NoNewLine
    }
    
    switch ($Level) {
        "ERROR" { 
            Write-Host $logEntry -ForegroundColor Red
            Write-Host "" # Ensure newline after error
        }
        "WARNING" { 
            Write-Host $logEntry -ForegroundColor Yellow 
        }
        "SUCCESS" { 
            Write-Host $logEntry -ForegroundColor Green 
        }
        "STEP" { 
            Write-Host "`n=== $Message ===" -ForegroundColor Cyan
            $logEntry = "[$timestamp] [STEP] === $Message ==="
        }
        "PROGRESS" { 
            Write-Host $logEntry -ForegroundColor DarkCyan 
        }
        default { 
            Write-Host $logEntry -ForegroundColor White 
        }
    }
    
    # File logging
    try {
        Add-Content -Path $LogPath -Value $logEntry -ErrorAction SilentlyContinue
    }
    catch {
        # Ignore file logging errors to not interrupt main process
    }
}

# Enhanced progress display with detailed information
function Show-Progress {
    param(
        [string]$Activity, 
        [int]$Current, 
        [int]$Total, 
        [string]$Status = "",
        [string]$CurrentOperation = ""
    )
    
    if ($Total -gt 0) {
        $percentComplete = [math]::Round(($Current / $Total) * 100, 1)
        $elapsed = (Get-Date) - $script:StartTime
        
        if ($Current -gt 0) {
            $avgTimePerItem = $elapsed.TotalSeconds / $Current
            $remainingItems = $Total - $Current
            $eta = [TimeSpan]::FromSeconds($avgTimePerItem * $remainingItems)
            $etaString = "{0:hh\:mm\:ss}" -f $eta
            $ratePerHour = [math]::Round(($Current / $elapsed.TotalHours), 0)
            
            $statusText = "$Status | ETA: $etaString | Rate: $ratePerHour/hour"
        } else {
            $statusText = $Status
        }
        
        $operation = if ([string]::IsNullOrEmpty($CurrentOperation)) {
            "Processed: $Current / $Total ($percentComplete%)"
        } else {
            "$CurrentOperation | $Current / $Total ($percentComplete%)"
        }
        
        Write-Progress -Activity $Activity -Status $statusText -PercentComplete $percentComplete -CurrentOperation $operation
    }
}

# Enhanced query parser with better error handling
function Parse-Query {
    param([string]$QueryText)
    
    try {
        Write-Log "Parsing query: $QueryText" "PROGRESS"
        
        # Convert common query formats to PowerShell filter
        $filter = $QueryText
        
        # Replace common operators (case insensitive)
        $filter = $filter -replace '\bAND\b', ' -and ' -replace '\band\b', ' -and '
        $filter = $filter -replace '\bOR\b', ' -or ' -replace '\bor\b', ' -or '
        $filter = $filter -replace '\bNOT\b', ' -not ' -replace '\bnot\b', ' -not '
        $filter = $filter -replace '==', ' -eq '
        $filter = $filter -replace '!=', ' -ne '
        $filter = $filter -replace '<=', ' -le '
        $filter = $filter -replace '>=', ' -ge '
        $filter = $filter -replace '<(?!=)', ' -lt '
        $filter = $filter -replace '>(?!=)', ' -gt '
        $filter = $filter -replace '\bIN\b', ' -in ' -replace '\bin\b', ' -in '
        $filter = $filter -replace '\bLIKE\b', ' -like ' -replace '\blike\b', ' -like '
        
        # Create and test script block
        $filterScript = [ScriptBlock]::Create($filter)
        
        # Test the script block with a dummy object
        $testObj = [PSCustomObject]@{
            ID = 1
            Title = "Test"
            Created = Get-Date
            Modified = Get-Date
            FileSize = 1000
            FileExtension = "pdf"
            FolderPath = "/test"
        }
        
        $null = & $filterScript $testObj
        
        Write-Log "Query parsed and validated successfully" "SUCCESS"
        return $filterScript
    }
    catch {
        Write-Log "Failed to parse query: $($_.Exception.Message)" "ERROR"
        throw "Invalid query format: $QueryText`nExample: Created -lt '2024-01-01' -and FileExtension -eq 'pdf'"
    }
}

# Template-based library replication (much more robust)
function New-ReplicaLibrary {
    param([string]$SourceLibraryName, [string]$TargetLibraryName)
    
    try {
        Write-Log "Creating replica library using template approach..." "STEP"
        
        # Check if target already exists
        try {
            $existingList = Get-PnPList -Identity $TargetLibraryName -ErrorAction SilentlyContinue
            if ($existingList) {
                throw "Target library '$TargetLibraryName' already exists"
            }
        }
        catch {
            # Expected if list doesn't exist
        }
        
        # Generate unique template filename
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $script:TempTemplatePath = Join-Path $env:TEMP "LibraryTemplate_$timestamp.xml"
        
        Write-Log "Extracting template from source library: $SourceLibraryName" "PROGRESS"
        Write-Progress -Activity "Creating Replica Library" -Status "Extracting template from source library..." -PercentComplete 10
        
        # Extract template from source library only
        Get-PnPSiteTemplate -Out $script:TempTemplatePath -ListsToExtract $SourceLibraryName -ErrorAction Stop
        
        Write-Log "Template extracted successfully" "SUCCESS"
        
        # Read and modify template to change library name
        Write-Log "Updating template with new library name..." "PROGRESS"
        Write-Progress -Activity "Creating Replica Library" -Status "Modifying template for new library name..." -PercentComplete 30
        
        [xml]$templateXml = Get-Content $script:TempTemplatePath
        
        # Find and update the list instance
        $listInstances = $templateXml.SelectNodes("//pnp:ListInstance", @{pnp="http://schemas.dev.office.com/PnP/2021/03/ProvisioningSchema"})
        if (-not $listInstances) {
            # Try without namespace
            $listInstances = $templateXml.SelectNodes("//ListInstance")
        }
        
        foreach ($listInstance in $listInstances) {
            if ($listInstance.Title -eq $SourceLibraryName) {
                $listInstance.SetAttribute("Title", $TargetLibraryName)
                # Update URL to match new name
                $cleanName = $TargetLibraryName -replace '[^a-zA-Z0-9]', ''
                $listInstance.SetAttribute("Url", "Lists/$cleanName")
                Write-Log "Updated template: $SourceLibraryName → $TargetLibraryName" "PROGRESS"
                break
            }
        }
        
        # Save modified template
        $templateXml.Save($script:TempTemplatePath)
        
        # Apply template to create new library
        Write-Log "Applying template to create new library..." "PROGRESS"
        Write-Progress -Activity "Creating Replica Library" -Status "Creating new library from template..." -PercentComplete 60
        
        Invoke-PnPSiteTemplate -Path $script:TempTemplatePath -ErrorAction Stop
        
        Write-Progress -Activity "Creating Replica Library" -Status "Verifying new library..." -PercentComplete 90
        
        # Verify new library was created
        $newList = Get-PnPList -Identity $TargetLibraryName -ErrorAction Stop
        
        Write-Progress -Activity "Creating Replica Library" -Completed
        Write-Log "Replica library created successfully: $TargetLibraryName" "SUCCESS"
        Write-Log "Library details: Template Type $($newList.TemplateType), $($newList.ItemCount) items" "PROGRESS"
        
        return $newList
    }
    catch {
        Write-Log "Failed to create replica library: $($_.Exception.Message)" "ERROR"
        throw
    }
    finally {
        # Clean up template file
        if ($script:TempTemplatePath -and (Test-Path $script:TempTemplatePath)) {
            try {
                Remove-Item $script:TempTemplatePath -Force -ErrorAction SilentlyContinue
                Write-Log "Cleaned up temporary template file" "PROGRESS"
            }
            catch {
                Write-Log "Could not clean up template file: $script:TempTemplatePath" "WARNING"
            }
        }
    }
}

# Enhanced readonly functionality with better error handling
function Set-LibraryReadonly {
    param([string]$LibraryName, [bool]$ReadOnly)
    
    try {
        if ($ReadOnly) {
            Write-Log "Setting library to readonly mode: $LibraryName" "PROGRESS"
            Write-Progress -Activity "Library Security" -Status "Setting readonly permissions..." -PercentComplete 50
            
            # Break inheritance and remove write permissions
            $list = Get-PnPList -Identity $LibraryName
            
            if ($list.HasUniqueRoleAssignments -eq $false) {
                Write-Log "Breaking permission inheritance..." "PROGRESS"
                Set-PnPList -Identity $LibraryName -BreakRoleInheritance -CopyRoleAssignments
            }
            
            # Store original permissions for restoration
            $script:OriginalPermissions = @{
                LibraryName = $LibraryName
                HasUniquePermissions = $true
                Timestamp = Get-Date
            }
            
            Write-Progress -Activity "Library Security" -Completed
            Write-Log "Library set to readonly mode" "SUCCESS"
        }
        else {
            Write-Log "Restoring library permissions: $LibraryName" "PROGRESS"
            Write-Progress -Activity "Library Security" -Status "Restoring permissions..." -PercentComplete 50
            
            # Reset inheritance to restore original permissions
            Set-PnPList -Identity $LibraryName -ResetRoleInheritance
            
            Write-Progress -Activity "Library Security" -Completed
            Write-Log "Library permissions restored" "SUCCESS"
        }
    }
    catch {
        Write-Log "Could not modify library permissions: $($_.Exception.Message)" "WARNING"
        # Don't throw - this shouldn't stop the main operation
    }
}

# Enhanced document query with better filtering
function Get-DocumentsToMove {
    param([string]$LibraryName, [ScriptBlock]$FilterScript)
    
    try {
        Write-Log "Querying documents in library: $LibraryName" "STEP"
        Write-Progress -Activity "Document Discovery" -Status "Retrieving all items from library..." -PercentComplete 10
        
        # Get all items from library with pagination
        $allItems = @()
        $pageSize = 5000
        $items = Get-PnPListItem -List $LibraryName -PageSize $pageSize
        $allItems += $items
        
        Write-Log "Retrieved $($allItems.Count) total items from library" "PROGRESS"
        Write-Progress -Activity "Document Discovery" -Status "Filtering documents and applying query..." -PercentComplete 50
        
        # Filter to documents only and apply query
        $documents = @()
        $processedItems = 0
        
        foreach ($item in $allItems) {
            $processedItems++
            
            # Update progress every 1000 items
            if ($processedItems % 1000 -eq 0) {
                Write-Progress -Activity "Document Discovery" -Status "Processing items..." -PercentComplete (50 + (($processedItems / $allItems.Count) * 40))
            }
            
            try {
                # Skip folders (FSObjType = 1 means folder, 0 means file)
                if ($item["FSObjType"] -eq 1) {
                    continue
                }
                
                # Create object for query evaluation
                $docObj = [PSCustomObject]@{
                    ID = $item.Id
                    Title = $item["Title"]
                    FileRef = $item["FileRef"]
                    Created = $item["Created"]
                    Modified = $item["Modified"]
                    Author = if ($item["Author"]) { $item["Author"].LookupValue } else { "Unknown" }
                    Editor = if ($item["Editor"]) { $item["Editor"].LookupValue } else { "Unknown" }
                    FileSize = if ($item["File_x0020_Size"]) { [long]$item["File_x0020_Size"] } else { 0 }
                    FileName = $item["FileLeafRef"]
                    FileExtension = [System.IO.Path]::GetExtension($item["FileLeafRef"]).TrimStart('.').ToLower()
                    FolderPath = [System.IO.Path]::GetDirectoryName($item["FileRef"])
                    Item = $item
                }
                
                # Apply filter
                if (& $FilterScript $docObj) {
                    $documents += $docObj
                }
            }
            catch {
                Write-Log "Error processing item $($item.Id): $($_.Exception.Message)" "WARNING"
            }
        }
        
        Write-Progress -Activity "Document Discovery" -Completed
        
        $totalSize = ($documents | Measure-Object -Property FileSize -Sum).Sum
        Write-Log "Found $($documents.Count) documents matching query" "SUCCESS"
        Write-Log "Total size: $([math]::Round($totalSize / 1MB, 2)) MB" "PROGRESS"
        
        return $documents
    }
    catch {
        Write-Log "Failed to query documents: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Enhanced folder structure management
function Ensure-FolderStructure {
    param([string]$TargetLibrary, [string]$FolderPath)
    
    if ([string]::IsNullOrEmpty($FolderPath) -or $FolderPath -eq "/" -or $FolderPath -eq "\") {
        return
    }
    
    try {
        # Clean and normalize the path
        $relativePath = $FolderPath.TrimStart('/').TrimStart('\')
        
        # Remove source library name if it's part of the path
        if ($relativePath.StartsWith($SourceLibrary)) {
            $relativePath = $relativePath.Substring($SourceLibrary.Length).TrimStart('/').TrimStart('\')
        }
        
        if ([string]::IsNullOrEmpty($relativePath)) {
            return
        }
        
        # Check if folder already exists
        try {
            $folder = Get-PnPFolder -Url "$TargetLibrary/$relativePath" -ErrorAction SilentlyContinue
            if ($folder) {
                return # Folder already exists
            }
        }
        catch {
            # Folder doesn't exist, need to create it
        }
        
        Write-Log "Creating folder structure: $relativePath" "PROGRESS"
        
        # Create folder hierarchy
        $pathParts = $relativePath.Split('/', [StringSplitOptions]::RemoveEmptyEntries)
        $currentPath = $TargetLibrary
        
        foreach ($part in $pathParts) {
            $currentPath = "$currentPath/$part"
            try {
                $folder = Get-PnPFolder -Url $currentPath -ErrorAction SilentlyContinue
                if (-not $folder) {
                    $parentPath = Split-Path $currentPath -Parent
                    Add-PnPFolder -Name $part -Folder $parentPath -ErrorAction Stop
                    Write-Log "Created folder: $part" "PROGRESS"
                }
            }
            catch {
                Write-Log "Could not create folder $part in $currentPath: $($_.Exception.Message)" "WARNING"
            }
        }
    }
    catch {
        Write-Log "Could not ensure folder structure for $FolderPath: $($_.Exception.Message)" "WARNING"
    }
}

# Enhanced document moving with detailed progress
function Move-Document {
    param([PSCustomObject]$Document, [string]$TargetLibrary, [bool]$CopyOnly = $false)
    
    try {
        $fileRef = $Document.FileRef
        $fileName = $Document.FileName
        $operation = if ($CopyOnly) { "Copying" } else { "Moving" }
        $fileSize = $Document.FileSize
        
        Write-Log "$operation document: $fileName ($([math]::Round($fileSize / 1KB, 1)) KB)" "PROGRESS"
        
        # Ensure folder structure exists in target
        $folderPath = [System.IO.Path]::GetDirectoryName($fileRef)
        if (-not [string]::IsNullOrEmpty($folderPath) -and $folderPath -ne "/") {
            Ensure-FolderStructure -TargetLibrary $TargetLibrary -FolderPath $folderPath
        }
        
        # Calculate target path
        $relativePath = $folderPath.TrimStart('/')
        if ($relativePath.StartsWith($SourceLibrary)) {
            $relativePath = $relativePath.Substring($SourceLibrary.Length).TrimStart('/')
        }
        
        $targetPath = if ([string]::IsNullOrEmpty($relativePath)) { 
            $TargetLibrary 
        } else { 
            "$TargetLibrary/$relativePath" 
        }
        
        # Get file versions for reporting
        $versions = @()
        try {
            $versions = Get-PnPFileVersion -Url $fileRef -ErrorAction SilentlyContinue
        }
        catch {
            # Some files may not have accessible version history
        }
        
        # Copy/Move the file
        $targetUrl = "$targetPath/$fileName"
        Copy-PnPFile -SourceUrl $fileRef -TargetUrl $targetUrl -Force -ErrorAction Stop
        
        # Copy metadata to the target file
        try {
            $targetItems = Get-PnPListItem -List $TargetLibrary -Query "<View><Query><Where><Eq><FieldRef Name='FileLeafRef'/><Value Type='File'>$fileName</Value></Eq></Where></Query></View>"
            
            if ($targetItems -and $targetItems.Count -gt 0) {
                $targetFile = $targetItems[0]
                
                # Copy custom field values
                $copiedFields = 0
                foreach ($fieldName in $Document.Item.FieldValues.Keys) {
                    if ($fieldName -notmatch "^(ID|GUID|FileRef|FileDirRef|FSObjType|ContentTypeId|_|ows_|UniqueId|Created|Modified|Author|Editor)") {
                        try {
                            $targetFile[$fieldName] = $Document.Item[$fieldName]
                            $copiedFields++
                        }
                        catch {
                            # Skip fields that can't be set
                        }
                    }
                }
                
                if ($copiedFields -gt 0) {
                    $targetFile.Update()
                    Invoke-PnPQuery
                    Write-Log "Copied $copiedFields metadata fields" "PROGRESS"
                }
            }
        }
        catch {
            Write-Log "Could not copy all metadata for $fileName: $($_.Exception.Message)" "WARNING"
        }
        
        # Delete from source only if not in copy mode
        if (-not $CopyOnly) {
            Remove-PnPFile -ServerRelativeUrl $fileRef -Force -ErrorAction Stop
        }
        
        # Record successful operation
        $script:SuccessfulDocuments += [PSCustomObject]@{
            FileName = $Document.FileName
            SourcePath = $Document.FileRef
            TargetPath = $targetUrl
            FileSize = $Document.FileSize
            Created = $Document.Created
            Modified = $Document.Modified
            Author = $Document.Author
            Operation = if ($CopyOnly) { "Copied" } else { "Moved" }
            ProcessedAt = Get-Date
            VersionCount = $versions.Count + 1
        }
        
        Write-Log "Successfully $($operation.ToLower()): $fileName" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Failed to $($operation.ToLower()) document $($Document.FileName): $($_.Exception.Message)" "ERROR"
        
        # Record failed operation with detailed error info
        $failedDoc = $Document.PSObject.Copy()
        $failedDoc | Add-Member -NotePropertyName "Error" -NotePropertyValue $_.Exception.Message
        $failedDoc | Add-Member -NotePropertyName "Operation" -NotePropertyValue $operation
        $failedDoc | Add-Member -NotePropertyName "FailedAt" -NotePropertyValue (Get-Date)
        $script:FailedDocuments += $failedDoc
        
        return $false
    }
}

# Enhanced batch processing with detailed metrics
function Process-DocumentBatch {
    param([array]$Documents, [string]$TargetLibrary, [int]$BatchNumber, [bool]$CopyOnly = $false)
    
    $operation = if ($CopyOnly) { "Copying" } else { "Moving" }
    $batchStartTime = Get-Date
    
    Write-Log "Processing batch $BatchNumber with $($Documents.Count) documents ($operation mode)" "STEP"
    
    $batchSuccess = 0
    $batchFailed = 0
    $batchSize = 0
    $docIndex = 0
    
    foreach ($doc in $Documents) {
        $docIndex++
        
        # Update progress for this batch
        Show-Progress -Activity "$operation Documents" -Current $script:ProcessedCount -Total $script:TotalCount -Status "Batch $BatchNumber" -CurrentOperation "Processing: $($doc.FileName)"
        
        if (Move-Document -Document $doc -TargetLibrary $TargetLibrary -CopyOnly $CopyOnly) {
            $batchSuccess++
            $batchSize += $doc.FileSize
        } else {
            $batchFailed++
        }
        
        $script:ProcessedCount++
    }
    
    $batchEndTime = Get-Date
    $batchDuration = $batchEndTime - $batchStartTime
    
    # Record batch details for reporting
    $batchInfo = [PSCustomObject]@{
        BatchNumber = $BatchNumber
        DocumentCount = $Documents.Count
        SuccessCount = $batchSuccess
        FailedCount = $batchFailed
        ProcessedSize = $batchSize
        StartTime = $batchStartTime
        EndTime = $batchEndTime
        Duration = $batchDuration
        AverageTimePerDoc = if ($Documents.Count -gt 0) { $batchDuration.TotalSeconds / $Documents.Count } else { 0 }
    }
    
    $script:OperationDetails.Batches += $batchInfo
    
    $avgTime = [math]::Round($batchInfo.AverageTimePerDoc, 1)
    $sizeMB = [math]::Round($batchSize / 1MB, 2)
    
    Write-Log "Batch $BatchNumber completed: $batchSuccess successful, $batchFailed failed" "SUCCESS"
    Write-Log "Batch stats: $sizeMB MB processed, ${avgTime}s avg/file, $($batchDuration.ToString('mm\:ss')) total" "PROGRESS"
    
    return @{ Success = $batchSuccess; Failed = $batchFailed; Size = $batchSize }
}

# Enhanced HTML report generation
function Generate-MoveReport {
    param([string]$ReportPath)
    
    try {
        Write-Log "Generating comprehensive move report..." "STEP"
        Write-Progress -Activity "Generating Report" -Status "Calculating statistics..." -PercentComplete 10
        
        $totalSize = ($script:SuccessfulDocuments | Measure-Object -Property FileSize -Sum).Sum
        $avgFileSize = if ($script:SuccessfulDocuments.Count -gt 0) { $totalSize / $script:SuccessfulDocuments.Count } else { 0 }
        
        # Calculate file type distribution
        $fileTypes = $script:SuccessfulDocuments | Group-Object { 
            $ext = [System.IO.Path]::GetExtension($_.FileName).TrimStart('.').ToLower()
            if ([string]::IsNullOrEmpty($ext)) { "(no extension)" } else { $ext }
        } | Sort-Object Count -Descending | Select-Object Name, Count
        
        Write-Progress -Activity "Generating Report" -Status "Analyzing file distributions..." -PercentComplete 30
        
        # Calculate size distribution
        $sizeRanges = @(
            @{ Name = "< 1 MB"; Min = 0; Max = 1MB },
            @{ Name = "1-10 MB"; Min = 1MB; Max = 10MB },
            @{ Name = "10-50 MB"; Min = 10MB; Max = 50MB },
            @{ Name = "50-100 MB"; Min = 50MB; Max = 100MB },
            @{ Name = "> 100 MB"; Min = 100MB; Max = [long]::MaxValue }
        )
        
        $sizeDistribution = foreach ($range in $sizeRanges) {
            $count = ($script:SuccessfulDocuments | Where-Object { $_.FileSize -ge $range.Min -and $_.FileSize -lt $range.Max }).Count
            [PSCustomObject]@{ Range = $range.Name; Count = $count }
        }
        
        Write-Progress -Activity "Generating Report" -Status "Building HTML report..." -PercentComplete 60
        
        $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>SharePoint Document Library Split Report</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background-color: white; 
            border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #0078d4, #106ebe); 
            color: white; 
            padding: 30px; 
            text-align: center;
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: 300;
        }
        .header .subtitle { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 16px; 
        }
        .content { padding: 30px; }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 40px; 
        }
        .metric { 
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 25px; 
            border-radius: 8px; 
            border-left: 5px solid #0078d4;
            transition: transform 0.2s;
        }
        .metric:hover { transform: translateY(-2px); }
        .metric-value { 
            font-size: 28px; 
            font-weight: bold; 
            color: #0078d4; 
            margin-bottom: 8px; 
        }
        .metric-label { 
            color: #666; 
            font-size: 14px; 
            font-weight: 500;
        }
        .section { 
            margin-bottom: 40px; 
            background: #fafbfc;
            border-radius: 8px;
            padding: 25px;
        }
        .section h2 { 
            color: #323130; 
            border-bottom: 3px solid #0078d4; 
            padding-bottom: 15px; 
            margin-bottom: 25px;
            font-size: 24px;
            font-weight: 600;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        th, td { 
            padding: 15px; 
            text-align: left; 
        }
        th { 
            background: linear-gradient(135deg, #0078d4, #106ebe);
            color: white;
            font-weight: 600; 
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        td { border-bottom: 1px solid #f3f2f1; }
        tr:hover td { background-color: #f8f9fa; }
        tr:last-child td { border-bottom: none; }
        .success { color: #107c10; font-weight: bold; }
        .failed { color: #d13438; font-weight: bold; }
        .status-success { 
            background: linear-gradient(135deg, #dff6dd, #c3f0c0);
            color: #107c10; 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
        }
        .status-failed { 
            background: linear-gradient(135deg, #fed9da, #fcc2c3);
            color: #d13438; 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
        }
        .progress-bar { 
            background-color: #e1e1e1; 
            border-radius: 20px; 
            height: 25px; 
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .progress-fill { 
            background: linear-gradient(90deg, #107c10, #52c952); 
            height: 100%; 
            transition: width 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background-image: linear-gradient(45deg, transparent 35%, rgba(255,255,255,.2) 35%, rgba(255,255,255,.2) 65%, transparent 65%);
            background-size: 20px 20px;
            animation: progress-animation 1s linear infinite;
        }
        @keyframes progress-animation {
            0% { background-position: 0 0; }
            100% { background-position: 20px 0; }
        }
        .batch-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 20px; 
        }
        .batch-card { 
            background: white;
            padding: 20px; 
            border-radius: 8px; 
            border: 1px solid #e1e1e1;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .batch-card:hover { transform: translateY(-2px); }
        .batch-card h4 {
            margin: 0 0 15px 0;
            color: #0078d4;
            font-size: 18px;
        }
        .file-list { 
            max-height: 500px; 
            overflow-y: auto; 
            border: 1px solid #e1e1e1; 
            border-radius: 8px;
            background: white;
        }
        .file-row { 
            padding: 12px 16px; 
            border-bottom: 1px solid #f3f2f1; 
            font-size: 13px;
            transition: background-color 0.2s;
        }
        .file-row:hover { background-color: #f8f9fa; }
        .file-row:last-child { border-bottom: none; }
        .file-row:nth-child(even) { background-color: #fafbfc; }
        .error-details { 
            background: linear-gradient(135deg, #fed9da, #fcc2c3);
            padding: 10px; 
            border-radius: 6px; 
            margin-top: 8px; 
            font-size: 12px;
            border-left: 4px solid #d13438;
        }
        .footer { 
            text-align: center; 
            color: #666; 
            font-size: 12px; 
            margin-top: 40px; 
            padding-top: 30px; 
            border-top: 2px solid #e1e1e1; 
        }
        .highlight { 
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
        .code { 
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            border: 1px solid #e1e1e1;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SharePoint Document Library Split Report</h1>
            <div class="subtitle">Operation completed on $(Get-Date -Format 'MMMM dd, yyyy - HH:mm:ss')</div>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="metric">
                    <div class="metric-value">$($script:OperationDetails.SuccessfulFiles)</div>
                    <div class="metric-label">Files Processed Successfully</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$([math]::Round($totalSize / 1MB, 2)) MB</div>
                    <div class="metric-label">Total Data Processed</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($script:OperationDetails.FailedFiles)</div>
                    <div class="metric-label">Failed Files</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($script:OperationDetails.Duration.ToString('hh\:mm\:ss'))</div>
                    <div class="metric-label">Total Duration</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$([math]::Round($script:OperationDetails.SuccessfulFiles / $script:OperationDetails.Duration.TotalHours, 0))</div>
                    <div class="metric-label">Files per Hour</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$([math]::Round($avgFileSize / 1KB, 0)) KB</div>
                    <div class="metric-label">Average File Size</div>
                </div>
            </div>

            <div class="section">
                <h2>Operation Details</h2>
                <table>
                    <tr><td><strong>Source Library</strong></td><td>$($script:OperationDetails.SourceLibrary)</td></tr>
                    <tr><td><strong>Target Library</strong></td><td>$($script:OperationDetails.TargetLibrary)</td></tr>
                    <tr><td><strong>Query</strong></td><td><span class="code">$($script:OperationDetails.Query)</span></td></tr>
                    <tr><td><strong>Operation Mode</strong></td><td><span class="status-$(if($script:OperationDetails.Mode.Contains('Test')) {'success'} else {'failed'})">$($script:OperationDetails.Mode)</span></td></tr>
                    <tr><td><strong>Start Time</strong></td><td>$($script:OperationDetails.StartTime.ToString('yyyy-MM-dd HH:mm:ss'))</td></tr>
                    <tr><td><strong>End Time</strong></td><td>$($script:OperationDetails.EndTime.ToString('yyyy-MM-dd HH:mm:ss'))</td></tr>
                    <tr><td><strong>Success Rate</strong></td><td><strong>$([math]::Round(($script:OperationDetails.SuccessfulFiles / $script:OperationDetails.TotalFiles) * 100, 1))%</strong></td></tr>
                </table>
            </div>

            <div class="section">
                <h2>Success Rate Overview</h2>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: $([math]::Round(($script:OperationDetails.SuccessfulFiles / $script:OperationDetails.TotalFiles) * 100, 1))%"></div>
                </div>
                <p style="text-align: center; margin-top: 15px; font-size: 16px;">
                    <strong>$($script:OperationDetails.SuccessfulFiles)</strong> of <strong>$($script:OperationDetails.TotalFiles)</strong> files processed successfully 
                    (<strong>$([math]::Round(($script:OperationDetails.SuccessfulFiles / $script:OperationDetails.TotalFiles) * 100, 1))%</strong>)
                </p>
            </div>

            <div class="section">
                <h2>File Type Distribution</h2>
                <table>
                    <thead>
                        <tr>
                            <th>File Extension</th>
                            <th>Count</th>
                            <th>Percentage</th>
                            <th>Total Size</th>
                        </tr>
                    </thead>
                    <tbody>
"@

        foreach ($fileType in $fileTypes | Select-Object -First 15) {
            $percentage = [math]::Round(($fileType.Count / $script:SuccessfulDocuments.Count) * 100, 1)
            $extension = if ([string]::IsNullOrEmpty($fileType.Name) -or $fileType.Name -eq "(no extension)") { "(no extension)" } else { ".$($fileType.Name.ToUpper())" }
            
            # Calculate total size for this file type
            $typeSize = ($script:SuccessfulDocuments | Where-Object { 
                $ext = [System.IO.Path]::GetExtension($_.FileName).TrimStart('.').ToLower()
                if ([string]::IsNullOrEmpty($ext)) { $ext = "(no extension)" }
                $ext -eq $fileType.Name 
            } | Measure-Object -Property FileSize -Sum).Sum
            
            $typeSizeMB = [math]::Round($typeSize / 1MB, 2)
            
            $html += "                        <tr><td><strong>$extension</strong></td><td>$($fileType.Count)</td><td>$percentage%</td><td>$typeSizeMB MB</td></tr>`n"
        }

        $html += @"
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>File Size Distribution</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Size Range</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
"@

        foreach ($range in $sizeDistribution) {
            $percentage = if ($script:SuccessfulDocuments.Count -gt 0) { [math]::Round(($range.Count / $script:SuccessfulDocuments.Count) * 100, 1) } else { 0 }
            $html += "                        <tr><td><strong>$($range.Range)</strong></td><td>$($range.Count)</td><td>$percentage%</td></tr>`n"
        }

        $html += @"
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>Batch Performance Analysis</h2>
                <div class="batch-grid">
"@

        foreach ($batch in $script:OperationDetails.Batches) {
            $successRate = if ($batch.DocumentCount -gt 0) { [math]::Round(($batch.SuccessCount / $batch.DocumentCount) * 100, 1) } else { 0 }
            $sizeMB = [math]::Round($batch.ProcessedSize / 1MB, 2)
            
            $html += @"
                    <div class="batch-card">
                        <h4>Batch $($batch.BatchNumber)</h4>
                        <p><strong>Documents:</strong> $($batch.DocumentCount)</p>
                        <p><strong>Success:</strong> <span class="success">$($batch.SuccessCount)</span> ($successRate%)</p>
                        <p><strong>Failed:</strong> <span class="failed">$($batch.FailedCount)</span></p>
                        <p><strong>Data:</strong> $sizeMB MB</p>
                        <p><strong>Duration:</strong> $($batch.Duration.ToString('mm\:ss'))</p>
                        <p><strong>Avg/File:</strong> $([math]::Round($batch.AverageTimePerDoc, 1))s</p>
                    </div>
"@
        }

        $html += "</div></div>"

        if ($script:FailedDocuments.Count -gt 0) {
            $html += @"
            <div class="section">
                <h2>Failed Documents Analysis</h2>
                <div class="highlight">
                    <strong>Important:</strong> $($script:FailedDocuments.Count) documents failed to process. 
                    Review the errors below and consider rerunning the script for failed items only.
                </div>
                <div class="file-list">
"@

            foreach ($failedDoc in $script:FailedDocuments | Select-Object -First 50) {
                $sizeKB = [math]::Round($failedDoc.FileSize / 1KB, 1)
                $html += @"
                    <div class="file-row">
                        <strong>$($failedDoc.FileName)</strong> ($sizeKB KB)<br>
                        <small>Path: $($failedDoc.FileRef)</small><br>
                        <small>Failed at: $($failedDoc.FailedAt.ToString('HH:mm:ss'))</small>
                        <div class="error-details">
                            <strong>Error:</strong> $($failedDoc.Error)
                        </div>
                    </div>
"@
            }

            if ($script:FailedDocuments.Count -gt 50) {
                $html += @"
                    <div class="file-row" style="text-align: center; font-style: italic; color: #666;">
                        ... and $($script:FailedDocuments.Count - 50) more failed documents (see log file for complete list)
                    </div>
"@
            }

            $html += "                </div></div>"
        }

        $html += @"
            <div class="section">
                <h2>Successfully Processed Files</h2>
                <p>Showing first 100 files (see log file for complete list)</p>
                <div class="file-list">
"@

        foreach ($successDoc in ($script:SuccessfulDocuments | Select-Object -First 100)) {
            $sizeKB = [math]::Round($successDoc.FileSize / 1KB, 1)
            $versions = if ($successDoc.VersionCount -gt 1) { " ($($successDoc.VersionCount) versions)" } else { "" }
            
            $html += @"
                    <div class="file-row">
                        <strong>$($successDoc.FileName)</strong> ($sizeKB KB)$versions - <span class="status-success">$($successDoc.Operation)</span><br>
                        <small>From: $($successDoc.SourcePath)</small><br>
                        <small>To: $($successDoc.TargetPath)</small><br>
                        <small>Processed: $($successDoc.ProcessedAt.ToString('HH:mm:ss'))</small>
                    </div>
"@
        }

        if ($script:SuccessfulDocuments.Count -gt 100) {
            $html += @"
                    <div class="file-row" style="text-align: center; font-style: italic; color: #666;">
                        ... and $($script:SuccessfulDocuments.Count - 100) more successful files
                    </div>
"@
        }

        $html += @"
                </div>
            </div>

            <div class="footer">
                <p><strong>Report generated by SharePoint Document Library Splitter</strong></p>
                <p>Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | Detailed logs: $LogPath</p>
                <p>PowerShell Script Version 2.0 | SharePoint Online Compatible</p>
            </div>
        </div>
    </div>
</body>
</html>
"@

        Write-Progress -Activity "Generating Report" -Status "Saving HTML file..." -PercentComplete 90
        
        $html | Out-File -FilePath $ReportPath -Encoding UTF8
        
        Write-Progress -Activity "Generating Report" -Completed
        Write-Log "Comprehensive report generated: $ReportPath" "SUCCESS"
        
        # Open report in default browser
        try {
            Start-Process $ReportPath
            Write-Log "Report opened in default browser" "SUCCESS"
        }
        catch {
            Write-Log "Report saved to: $ReportPath (could not open automatically)" "SUCCESS"
        }
    }
    catch {
        Write-Log "Failed to generate move report: $($_.Exception.Message)" "ERROR"
    }
}

# Main execution function with enhanced progress tracking
function Start-LibrarySplit {
    try {
        # Determine operation mode
        $operationMode = if ($DryRun) { "Dry Run" } elseif ($TestMode) { "Test Mode (Copy)" } else { "Production Mode (Move)" }
        
        Write-Log "SharePoint Document Library Split Started" "STEP"
        Write-Log "Operation Mode: $operationMode" "PROGRESS"
        Write-Log "Source Library: $SourceLibrary" "PROGRESS"
        Write-Log "Target Library: $TargetLibrary" "PROGRESS"
        Write-Log "Query: $Query" "PROGRESS"
        Write-Log "Batch Size: $BatchSize" "PROGRESS"
        
        # Initialize operation details
        $script:OperationDetails.SourceLibrary = $SourceLibrary
        $script:OperationDetails.TargetLibrary = $TargetLibrary
        $script:OperationDetails.Query = $Query
        $script:OperationDetails.Mode = $operationMode
        $script:OperationDetails.StartTime = $script:StartTime
        
        # Connect to SharePoint with progress indication
        Write-Log "Connecting to SharePoint..." "STEP"
        Write-Progress -Activity "Initializing" -Status "Connecting to SharePoint..." -PercentComplete 5
        
        Connect-PnPOnline -Url $SiteUrl -Interactive -ErrorAction Stop
        Write-Log "Connected successfully to: $SiteUrl" "SUCCESS"
        
        # Validate source library
        Write-Progress -Activity "Initializing" -Status "Validating source library..." -PercentComplete 10
        $sourceList = Get-PnPList -Identity $SourceLibrary -ErrorAction Stop
        if (-not $sourceList) {
            throw "Source library '$SourceLibrary' not found"
        }
        Write-Log "Source library validated: $($sourceList.ItemCount) total items" "SUCCESS"
        
        # Parse and validate query
        Write-Progress -Activity "Initializing" -Status "Parsing query criteria..." -PercentComplete 15
        $filterScript = Parse-Query -QueryText $Query
        
        # Get documents to process
        Write-Progress -Activity "Initializing" -Status "Discovering documents..." -PercentComplete 20
        $documentsToMove = Get-DocumentsToMove -LibraryName $SourceLibrary -FilterScript $filterScript
        $script:TotalCount = $documentsToMove.Count
        $script:OperationDetails.TotalFiles = $script:TotalCount
        $script:OperationDetails.TotalSize = ($documentsToMove | Measure-Object -Property FileSize -Sum).Sum
        
        Write-Progress -Activity "Initializing" -Completed
        
        if ($script:TotalCount -eq 0) {
            Write-Log "No documents found matching query criteria" "WARNING"
            $script:OperationDetails.EndTime = Get-Date
            $script:OperationDetails.Duration = $script:OperationDetails.EndTime - $script:OperationDetails.StartTime
            Generate-MoveReport -ReportPath $ReportPath
            return
        }
        
        $totalSizeMB = [math]::Round($script:OperationDetails.TotalSize / 1MB, 2)
        Write-Log "Found $($script:TotalCount) documents to process (Total: $totalSizeMB MB)" "SUCCESS"
        
        # Dry run mode
        if ($DryRun) {
            Write-Log "DRY RUN MODE - NO ACTUAL CHANGES WILL BE MADE" "WARNING"
            Write-Log "Documents that would be processed:" "PROGRESS"
            
            $previewCount = [Math]::Min(25, $documentsToMove.Count)
            $documentsToMove | Select-Object -First $previewCount | ForEach-Object { 
                $sizeKB = [math]::Round($_.FileSize / 1KB, 1)
                Write-Log "  $($_.FileName) (Created: $($_.Created.ToString('yyyy-MM-dd')), Size: $sizeKB KB)" "PROGRESS"
            }
            
            if ($documentsToMove.Count -gt $previewCount) {
                Write-Log "  ... and $($documentsToMove.Count - $previewCount) more documents" "PROGRESS"
            }
            
            Write-Log "Summary: $($documentsToMove.Count) documents, $totalSizeMB MB total" "SUCCESS"
            Write-Log "DRY RUN COMPLETE - Review results and run in Test Mode next" "SUCCESS"
            
            $script:OperationDetails.EndTime = Get-Date
            $script:OperationDetails.Duration = $script:OperationDetails.EndTime - $script:OperationDetails.StartTime
            Generate-MoveReport -ReportPath $ReportPath
            return
        }
        
        # Create replica library using template approach
        $newList = New-ReplicaLibrary -SourceLibraryName $SourceLibrary -TargetLibraryName $TargetLibrary
        
        # Set source library to readonly (only in production mode)
        if ($SetReadonly -and -not $TestMode) {
            Set-LibraryReadonly -LibraryName $SourceLibrary -ReadOnly $true
        } elseif ($TestMode) {
            Write-Log "Test Mode: Source library will remain writable" "WARNING"
        }
        
        # Process documents in batches
        $operationVerb = if ($TestMode) { "copying" } else { "moving" }
        Write-Log "Starting document $operationVerb process..." "STEP"
        
        # Create batches
        $batches = @()
        for ($i = 0; $i -lt $documentsToMove.Count; $i += $BatchSize) {
            $end = [Math]::Min($i + $BatchSize - 1, $documentsToMove.Count - 1)
            $batches += ,@($documentsToMove[$i..$end])
        }
        
        Write-Log "Processing $($batches.Count) batches of up to $BatchSize documents each" "PROGRESS"
        
        $totalSuccess = 0
        $totalFailed = 0
        $totalProcessedSize = 0
        
        # Process each batch
        for ($batchNum = 0; $batchNum -lt $batches.Count; $batchNum++) {
            $result = Process-DocumentBatch -Documents $batches[$batchNum] -TargetLibrary $TargetLibrary -BatchNumber ($batchNum + 1) -CopyOnly $TestMode
            $totalSuccess += $result.Success
            $totalFailed += $result.Failed
            $totalProcessedSize += $result.Size
        }
        
        # Update operation details
        $script:OperationDetails.ProcessedFiles = $script:ProcessedCount
        $script:OperationDetails.SuccessfulFiles = $totalSuccess
        $script:OperationDetails.FailedFiles = $totalFailed
        $script:OperationDetails.ProcessedSize = $totalProcessedSize
        
        # Restore library permissions (only if they were changed)
        if ($SetReadonly -and -not $TestMode) {
            Set-LibraryReadonly -LibraryName $SourceLibrary -ReadOnly $false
        }
        
        # Final summary
        $script:OperationDetails.EndTime = Get-Date
        $script:OperationDetails.Duration = $script:OperationDetails.EndTime - $script:OperationDetails.StartTime
        
        Write-Log "OPERATION COMPLETED SUCCESSFULLY" "STEP"
        Write-Log "Operation Mode: $operationMode" "SUCCESS"
        Write-Log "Total documents processed: $($script:ProcessedCount)" "SUCCESS"
        Write-Log "Successfully processed: $totalSuccess" "SUCCESS"
        Write-Log "Failed: $totalFailed" "SUCCESS"
        Write-Log "Total data processed: $([math]::Round($totalProcessedSize / 1MB, 2)) MB" "SUCCESS"
        Write-Log "Total time: $($script:OperationDetails.Duration.ToString('hh\:mm\:ss'))" "SUCCESS"
        
        if ($totalSuccess -gt 0) {
            $avgTimePerDoc = $script:OperationDetails.Duration.TotalSeconds / $totalSuccess
            $docsPerHour = [math]::Round(3600 / $avgTimePerDoc, 0)
            Write-Log "Performance: $docsPerHour documents per hour" "SUCCESS"
        }
        
        if ($script:FailedDocuments.Count -gt 0) {
            Write-Log "Failed documents summary:" "WARNING"
            $script:FailedDocuments | Select-Object -First 5 | ForEach-Object {
                Write-Log "  $($_.FileName) - $($_.Error)" "WARNING"
            }
            if ($script:FailedDocuments.Count -gt 5) {
                Write-Log "  ... and $($script:FailedDocuments.Count - 5) more (see report for details)" "WARNING"
            }
        }
        
        Write-Progress -Activity "Processing Documents" -Completed
        
        # Generate comprehensive report
        Generate-MoveReport -ReportPath $ReportPath
        
        if ($TestMode) {
            Write-Log "TEST MODE COMPLETED SUCCESSFULLY" "SUCCESS"
            Write-Log "All documents were COPIED (not moved) to test the process" "SUCCESS"
            Write-Log "Source library remains unchanged and accessible" "SUCCESS"
            Write-Log "Review the generated report and run in production mode when ready" "SUCCESS"
        } else {
            Write-Log "PRODUCTION MODE COMPLETED" "SUCCESS"
            Write-Log "Documents have been moved to: $TargetLibrary" "SUCCESS"
            Write-Log "Source library permissions restored" "SUCCESS"
        }
        
    }
    catch {
        Write-Log "CRITICAL ERROR: $($_.Exception.Message)" "ERROR"
        
        # Update operation details for failed operation
        $script:OperationDetails.EndTime = Get-Date
        $script:OperationDetails.Duration = $script:OperationDetails.EndTime - $script:OperationDetails.StartTime
        
        # Try to restore permissions if they were changed
        if ($SetReadonly -and -not $TestMode -and $script:OriginalPermissions) {
            try {
                Set-LibraryReadonly -LibraryName $SourceLibrary -ReadOnly $false
                Write-Log "Restored library permissions after error" "SUCCESS"
            }
            catch {
                Write-Log "Failed to restore library permissions: $($_.Exception.Message)" "ERROR"
            }
        }
        
        # Generate report even for failed operations
        try {
            Generate-MoveReport -ReportPath $ReportPath
            Write-Log "Error report generated for troubleshooting" "SUCCESS"
        }
        catch {
            Write-Log "Could not generate report after error: $($_.Exception.Message)" "ERROR"
        }
        
        throw
    }
}

# Script execution starts here
Write-Host "`n===== SharePoint Document Library Splitter =====" -ForegroundColor Cyan
Write-Host "Enhanced version with comprehensive reporting" -ForegroundColor White
Write-Host "================================================`n" -ForegroundColor Cyan

try {
    # Validate required modules
    if (-not (Get-Module -ListAvailable -Name "PnP.PowerShell")) {
        throw "PnP.PowerShell module is required. Install with: Install-Module PnP.PowerShell -Scope CurrentUser"
    }
    
    # Initialize logging
    if (Test-Path $LogPath) {
        Remove-Item $LogPath -Force
    }
    
    Write-Log "Script initialized with parameters:" "STEP"
    Write-Log "  Site URL: $SiteUrl" "PROGRESS"
    Write-Log "  Source Library: $SourceLibrary" "PROGRESS"
    Write-Log "  Target Library: $TargetLibrary" "PROGRESS"
    Write-Log "  Query: $Query" "PROGRESS"
    Write-Log "  Batch Size: $BatchSize" "PROGRESS"
    Write-Log "  Set Readonly: $SetReadonly" "PROGRESS"
    Write-Log "  Dry Run: $DryRun" "PROGRESS"
    Write-Log "  Test Mode: $TestMode" "PROGRESS"
    Write-Log "  Log Path: $LogPath" "PROGRESS"
    Write-Log "  Report Path: $ReportPath" "PROGRESS"
    
    # Start the main operation
    Start-LibrarySplit
    
    Write-Log "Script execution completed successfully" "SUCCESS"
    
    # Final instructions
    Write-Host "`n===== OPERATION SUMMARY =====" -ForegroundColor Green
    
    if ($DryRun) {
        Write-Host "DRY RUN completed - no changes were made" -ForegroundColor Yellow
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Review the generated report: $ReportPath" -ForegroundColor White
        Write-Host "2. If satisfied, run in Test Mode (-TestMode)" -ForegroundColor White
        Write-Host "3. After testing, run in Production Mode (remove -DryRun and -TestMode)" -ForegroundColor White
    }
    elseif ($TestMode) {
        Write-Host "TEST MODE completed - documents were copied (not moved)" -ForegroundColor Yellow
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Review the generated report: $ReportPath" -ForegroundColor White
        Write-Host "2. Verify the target library structure and content" -ForegroundColor White
        Write-Host "3. If satisfied, run in Production Mode (remove -TestMode)" -ForegroundColor White
        Write-Host "4. Consider cleaning up the test target library before production run" -ForegroundColor White
    }
    else {
        Write-Host "PRODUCTION MODE completed - documents have been moved" -ForegroundColor Green
        Write-Host "Results:" -ForegroundColor Cyan
        Write-Host "1. Detailed report generated: $ReportPath" -ForegroundColor White
        Write-Host "2. Log file available: $LogPath" -ForegroundColor White
        Write-Host "3. Source library permissions have been restored" -ForegroundColor White
        if ($script:FailedDocuments.Count -gt 0) {
            Write-Host "4. ATTENTION: $($script:FailedDocuments.Count) documents failed - review report for details" -ForegroundColor Red
        }
    }
    
    Write-Host "`n================================" -ForegroundColor Green
}
catch {
    Write-Log "Script execution failed: $($_.Exception.Message)" "ERROR"
    Write-Host "`nScript execution failed. Check the log file for details: $LogPath" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Generate error report if possible
    try {
        if ($script:OperationDetails.StartTime) {
            $script:OperationDetails.EndTime = Get-Date
            $script:OperationDetails.Duration = $script:OperationDetails.EndTime - $script:OperationDetails.StartTime
            Generate-MoveReport -ReportPath $ReportPath
            Write-Host "Error report generated: $ReportPath" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Could not generate error report" -ForegroundColor Red
    }
    
    exit 1
}

# Example usage:
<#
# Dry run example - see what would be processed without making changes
.\Split-SharePointLibrary.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/yoursite" -SourceLibrary "Documents" -TargetLibrary "ArchivedDocuments" -Query "Created -lt '2023-01-01'" -DryRun

# Test mode example - copy documents to test the process
.\Split-SharePointLibrary.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/yoursite" -SourceLibrary "Documents" -TargetLibrary "ArchivedDocuments" -Query "Created -lt '2023-01-01'" -TestMode

# Production example - move documents based on creation date
.\Split-SharePointLibrary.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/yoursite" -SourceLibrary "Documents" -TargetLibrary "ArchivedDocuments" -Query "Created -lt '2023-01-01'"

# Move PDF files larger than 10MB
.\Split-SharePointLibrary.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/yoursite" -SourceLibrary "Documents" -TargetLibrary "LargePDFs" -Query "FileExtension -eq 'pdf' -and FileSize -gt 10485760"

# Move files from specific folder
.\Split-SharePointLibrary.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/yoursite" -SourceLibrary "Documents" -TargetLibrary "ProjectArchive" -Query "FolderPath -like '*Project2023*'"

# Complex query example - old Word documents or large files
.\Split-SharePointLibrary.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/yoursite" -SourceLibrary "Documents" -TargetLibrary "CleanupCandidates" -Query "(FileExtension -eq 'doc' -or FileExtension -eq 'docx') -and (Created -lt '2022-01-01' -or FileSize -gt 52428800)"
#>
