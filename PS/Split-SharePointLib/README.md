# SharePoint Document Library Splitter

A PowerShell script for safely moving or copying documents between SharePoint Online document libraries based on custom query criteria. Features comprehensive reporting, batch processing, and multiple safety modes.

## Overview

This script helps organizations manage large SharePoint document libraries by splitting them into smaller, more manageable libraries. It preserves folder structures, metadata, and file versions while providing detailed reporting and safety mechanisms.

## Key Features

- **Query-based document filtering** - Use flexible criteria to select documents
- **Safety modes** - Dry run, test mode, and production mode
- **Batch processing** - Configurable batch sizes for performance optimization
- **Comprehensive reporting** - Rich HTML reports with statistics and analytics
- **Metadata preservation** - Maintains custom fields and properties
- **Folder structure replication** - Recreates source folder hierarchy
- **Progress tracking** - Real-time progress with ETA calculations
- **Error handling** - Detailed error logging and recovery mechanisms

## Prerequisites

### Required Software
- PowerShell 5.1 or later
- PnP.PowerShell module

### Installation
```powershell
# Install the required PowerShell module
Install-Module PnP.PowerShell -Scope CurrentUser

# Import the module
Import-Module PnP.PowerShell
```

### Permissions
- Site Collection Administrator or Owner permissions on the SharePoint site
- Read/Write access to both source and target libraries

## Usage

### Basic Syntax
```powershell
.\Split-SharePointLibrary.ps1 -SiteUrl <URL> -SourceLibrary <Name> -TargetLibrary <Name> -Query <Filter> [Options]
```

### Parameters

| Parameter | Required | Description | Default |
|-----------|----------|-------------|---------|
| `SiteUrl` | Yes | SharePoint site URL | - |
| `SourceLibrary` | Yes | Name of source document library | - |
| `TargetLibrary` | Yes | Name of target document library (will be created) | - |
| `Query` | Yes | PowerShell filter expression for document selection | - |
| `BatchSize` | No | Number of documents to process per batch | 500 |
| `SetReadonly` | No | Temporarily lock source library during moves | $true |
| `DryRun` | No | Preview mode - no actual changes | $false |
| `TestMode` | No | Copy documents instead of moving | $false |
| `MaxConcurrentBatches` | No | Maximum concurrent batch operations | 3 |
| `DeleteEmptyFolders` | No | Remove empty folders after moving documents | $true |
| `LogPath` | No | Path for detailed log file | `.\split-library-log.txt` |
| `ReportPath` | No | Path for HTML report | `.\move-report.html` |

## Query Examples

### Date-based Filtering
```powershell
# Archive documents older than 2 years
-Query "Created -lt '2022-01-01'"

# Move documents from specific date range
-Query "Created -ge '2023-01-01' -and Created -lt '2024-01-01'"

# Documents modified recently
-Query "Modified -gt '2024-06-01'"
```

### File Type Filtering
```powershell
# Move all PDF files
-Query "FileExtension -eq 'pdf'"

# Archive old Office documents
-Query "(FileExtension -eq 'doc' -or FileExtension -eq 'docx') -and Created -lt '2023-01-01'"

# Large media files
-Query "FileExtension -in @('mp4','avi','mov') -and FileSize -gt 104857600"
```

### Size-based Filtering
```powershell
# Files larger than 50MB
-Query "FileSize -gt 52428800"

# Small files under 1MB
-Query "FileSize -lt 1048576"
```

### Folder-based Filtering
```powershell
# Documents from specific project folder
-Query "FolderPath -like '*Project2023*'"

# Multiple folder patterns
-Query "FolderPath -like '*Archive*' -or FolderPath -like '*Old*'"
```

### Complex Queries
```powershell
# Large old documents or specific file types
-Query "(FileSize -gt 10485760 -and Created -lt '2023-01-01') -or FileExtension -eq 'pst'"

# Exclude certain file types
-Query "FileExtension -notin @('tmp','log','bak') -and Created -lt '2024-01-01'"
```

## Operation Modes

### 1. Dry Run Mode (Recommended First Step)
Preview what documents would be processed without making any changes.

```powershell
.\Split-SharePointLibrary.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/documents" -SourceLibrary "Documents" -TargetLibrary "ArchivedDocs" -Query "Created -lt '2023-01-01'" -DryRun
```

### 2. Test Mode (Copy Documents)
Copy documents to test the process and verify results before moving them.

```powershell
.\Split-SharePointLibrary.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/documents" -SourceLibrary "Documents" -TargetLibrary "ArchivedDocs" -Query "Created -lt '2023-01-01'" -TestMode
```

### 3. Production Mode (Move Documents)
Move documents from source to target library.

```powershell
.\Split-SharePointLibrary.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/documents" -SourceLibrary "Documents" -TargetLibrary "ArchivedDocs" -Query "Created -lt '2023-01-01'"
```

## Workflow Recommendations

1. **Plan and Test**
   - Start with `-DryRun` to preview results
   - Review the generated report
   - Refine query criteria if needed

2. **Validate Process**
   - Run with `-TestMode` to copy a subset
   - Verify target library structure and metadata
   - Check permissions and access

3. **Execute Production**
   - Remove `-DryRun` and `-TestMode` flags
   - Monitor progress and logs
   - Review final report

## Reports and Logging

### HTML Report Features
- Operation summary with key metrics
- File type and size distribution analysis
- Batch performance statistics
- Success/failure rates with detailed breakdowns
- Failed document listing with error details
- Successfully processed file inventory

### Log File Contents
- Detailed operation timeline
- Individual document processing status
- Error messages and stack traces
- Performance metrics
- Configuration parameters

## Best Practices

### Performance Optimization
- Use appropriate batch sizes (500-1000 for most scenarios)
- Run during off-peak hours for large operations
- Monitor SharePoint throttling limits
- Consider breaking very large operations into multiple sessions

### Safety Measures
- Always test with a small subset first
- Backup important libraries before major operations
- Use readonly mode to prevent concurrent modifications
- Keep detailed logs of all operations
- Verify results before cleaning up source libraries

### Query Design
- Start with simple queries and add complexity gradually
- Test queries against known document sets
- Use date ranges to limit scope
- Consider file size limits to avoid timeouts

## Troubleshooting

### Common Issues

**Connection Errors**
```
Solution: Verify site URL and ensure proper permissions
Check: Site access, authentication, network connectivity
```

**Query Parsing Errors**
```
Solution: Verify PowerShell syntax and test with simple queries
Check: Date formats, operator syntax, field names
```

**Permission Denied**
```
Solution: Ensure Site Collection Admin rights or equivalent
Check: Library permissions, site permissions, tenant settings
```

**Throttling Errors**
```
Solution: Reduce batch size and add delays between operations
Check: SharePoint usage patterns, concurrent operations
```

### Error Recovery
- Review detailed error logs for specific failure reasons
- Use selective re-runs for failed documents
- Consider breaking large operations into smaller chunks
- Verify network stability for long-running operations

## Advanced Configuration

### Custom Batch Sizes
```powershell
# Large files - smaller batches
-BatchSize 100

# Small files - larger batches
-BatchSize 2000
```

### Performance Tuning
```powershell
# Maximum concurrent operations
-MaxConcurrentBatches 5

# Disable readonly mode for faster processing (less safe)
-SetReadonly:$false
```

## Security Considerations

- Script requires elevated SharePoint permissions
- Temporary readonly locks prevent data corruption
- All operations are logged for audit purposes
- Failed operations do not compromise data integrity
- Test mode provides safe validation environment

## Support and Maintenance

### Version Information
- Script Version: 2.0
- PowerShell Requirement: 5.1+
- PnP.PowerShell Requirement: Latest stable
- SharePoint Compatibility: SharePoint Online

### Monitoring
- Review HTML reports after each operation
- Monitor log files for patterns or recurring issues
- Track performance metrics for optimization
- Maintain operation history for compliance

## License

This script is provided as-is for educational and administrative purposes. Test thoroughly in your environment before production use.

## Contributing

When reporting issues or requesting features:
1. Include detailed error messages and log excerpts
2. Provide sanitized examples of queries and parameters
3. Specify SharePoint environment details
4. Include steps to reproduce issues
