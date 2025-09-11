# SPFx Context Utility

A production-ready, lightweight context management utility for SharePoint Framework (SPFx) applications. This utility provides centralized configuration, structured logging, smart caching, HTTP client management with Azure AD authentication, and performance tracking for SPFx solutions.

## 🚀 Features

- **🎯 Lightweight & Focused**: No Graph API overhead, optimized for SharePoint operations
- **📊 Intelligent Logging**: Structured logging with automatic error analysis, production sampling, and actionable insights
- **⚡ Smart Caching**: Multiple caching strategies with automatic optimization
- **🔐 Enterprise Authentication**: Azure AD, Function Keys, and API Key authentication support
- **🌐 HTTP Gateway**: Optimized for Power Platform Flows and Azure Functions with enterprise security
- **🔗 Link Builder**: Comprehensive SharePoint URL generation utilities
- **📈 Performance Tracking**: Built-in metrics collection and analysis
- **🛠️ Developer Tools**: Enhanced debugging experience with dev-time utilities
- **🏗️ Environment Detection**: Automatic dev/uat/prod environment detection
- **🔍 Error Analysis**: Automatic error categorization with remediation suggestions
- **🧩 Universal Compatibility**: Works with all SPFx component types (Web Parts, Extensions, Customizers)
- **⚙️ TypeScript First**: Full type safety with strict TypeScript support

## 📦 Installation

### Dependencies

Ensure your SPFx project has these dependencies (compatible with SPFx 1.21.1):

```json
{
  "@pnp/sp": "3.20.1",
  "@pnp/logging": "3.20.1",
  "@pnp/queryable": "3.20.1"
}
```

### File Structure

Copy the context utility files to your SPFx project:

```
src/
└── context/
    ├── index.ts                     # Main entry point
    ├── context-manager.ts           # Core context manager
    ├── caching/
    │   └── behaviors.ts             # Caching strategies
    ├── environment/
    │   └── detector.ts              # Environment detection
    ├── http/
    │   └── gateway.ts               # HTTP client with Azure AD auth
    ├── logging/
    │   ├── logger.ts                # Structured logging
    │   └── performance.ts           # Performance tracking
    └── utils/
        ├── types.ts                 # TypeScript definitions
        ├── links.ts                 # SharePoint link builders
        └── helpers.ts               # Quick start helpers
```

## 🎯 Quick Start

### 1. Universal Setup (Works with ALL SPFx Components)

The utility works with any SPFx component type:

```typescript
import { Context } from './context';

// ✅ Web Part
export default class MyWebPart extends BaseClientSideWebPart<IMyWebPartProps> {
  protected async onInit(): Promise<void> {
    await Context.initialize(this.context, { componentName: 'MyWebPart' });
    return super.onInit();
  }
}

// ✅ Form Customizer
export default class MyFormCustomizer extends BaseFormCustomizer<IMyFormCustomizerProps> {
  public async onInit(): Promise<void> {
    await Context.initialize(this.context, { componentName: 'MyFormCustomizer' });
    return super.onInit();
  }
}

// ✅ Field Customizer
export default class MyFieldCustomizer extends BaseFieldCustomizer<IMyFieldCustomizerProps> {
  public async onInit(): Promise<void> {
    await Context.initialize(this.context, { componentName: 'MyFieldCustomizer' });
    return super.onInit();
  }
}

// ✅ Command Set
export default class MyCommandSet extends BaseListViewCommandSet<IMyCommandSetProps> {
  public async onInit(): Promise<void> {
    await Context.initialize(this.context, { componentName: 'MyCommandSet' });
    return super.onInit();
  }
}

// ✅ Application Customizer
export default class MyAppCustomizer extends BaseApplicationCustomizer<IMyAppCustomizerProps> {
  public async onInit(): Promise<void> {
    await Context.initialize(this.context, { componentName: 'MyAppCustomizer' });
    return super.onInit();
  }
}
```

### 2. Quick Start Helpers

For common scenarios, use the pre-configured Quick Start helpers:

```typescript
import { QuickStart } from './context';

// Simple setup (development-friendly)
await QuickStart.simple(this.context, 'MyComponent');

// Production setup (optimized logging and caching)
await QuickStart.production(this.context, 'MyComponent');

// Development setup (verbose logging, no caching)
await QuickStart.development(this.context, 'MyComponent');

// Teams app setup (optimized for Teams environment)
await QuickStart.teams(this.context, 'MyComponent');
```

### 3. Using the Context

Once initialized, access the context from anywhere in your application:

```typescript
import { Context, getSp, getLogger, getHttp, getLinks } from './context';

// Full context object
const ctx = Context.current();

// Individual utilities (convenience exports)
const sp = getSp();
const logger = getLogger();
const http = getHttp();
const links = getLinks();
```

## 🔐 Authentication & HTTP Operations

The HTTP gateway supports multiple authentication methods for enterprise scenarios:

### Azure AD Authentication (Recommended for Production)

```typescript
const { http } = Context.current();

// Azure Function with Azure AD authentication
const result = await http.callFunction({
  url: 'https://myapp.azurewebsites.net/api/processData',
  method: 'POST',
  data: { items: [1, 2, 3] },
  useAzureAD: true,
  resourceUri: '12345678-1234-5678-9012-123456789012', // Your App Registration ID
});

// Power Platform Flow with Azure AD (for secured flows)
const flowResult = await http.triggerFlow({
  url: 'https://prod-123.westus.logic.azure.com:443/workflows/abc/triggers/manual/paths/invoke',
  data: { userId: 123, action: 'process' },
  useAzureAD: true,
  resourceUri: 'https://service.flow.microsoft.com/',
  idempotencyKey: crypto.randomUUID(), // Prevents duplicate operations
});
```

### Function Key Authentication (Simple & Common)

```typescript
// Azure Function with function key
const result = await http.callFunction({
  url: 'https://myapp.azurewebsites.net/api/processData',
  method: 'POST',
  data: { items: [1, 2, 3] },
  functionKey: 'your-function-key-here',
});

// Power Platform Flow with function key (most common approach)
const flowResult = await http.triggerFlow({
  url: 'https://prod-123.westus.logic.azure.com:443/workflows/abc/triggers/manual/paths/invoke',
  data: { userId: 123, action: 'process' },
  functionKey: 'your-flow-key-here',
  idempotencyKey: `process-${userId}-${Date.now()}`, // Context-specific unique key
});
```

### API Key Authentication (Custom APIs)

```typescript
// Custom API with API key
const result = await http.callFunction({
  url: 'https://api.mycompany.com/v1/data',
  method: 'GET',
  apiKey: 'your-api-key-here',
  headers: {
    'X-Client-Version': '1.0.0',
    'X-Request-Source': 'SPFx',
  },
});
```

### SharePoint REST API

```typescript
// SharePoint REST calls (automatic authentication)
const spResult = await http.sp('GET', `${Context.current().webUrl}/_api/web/lists`);
if (spResult.ok) {
  const lists = JSON.parse(spResult.body);
  logger.success('Lists retrieved', { count: lists.value.length });
}
```

## 📊 Structured Logging with Enhanced Error Handling

The logging system provides intelligent error analysis and structured logging:

```typescript
const { logger } = Context.current();

// Enhanced error logging with automatic analysis
try {
  const items = await sp.web.lists.getByTitle('Tasks').items();
} catch (error) {
  // Automatically extracts: status, stack trace, error type, correlation ID
  logger.error(error);
}

// Operation-specific error logging
try {
  await uploadFile(file);
} catch (error) {
  logger.exception(error, 'fileUpload', {
    fileName: file.name,
    size: file.size,
    userId: currentUser.id,
  });
}

// HTTP/API error logging with request context
try {
  const response = await http.callFunction({
    url: 'https://api.example.com/process',
    method: 'POST',
    data: requestData,
    useAzureAD: true,
    resourceUri: 'api://your-app-id',
  });
} catch (error) {
  logger.httpError(error, {
    method: 'POST',
    url: 'https://api.example.com/process',
    data: requestData,
  });
  // Automatically detects: timeout, network, server errors, auth failures
}

// SharePoint-specific error logging
try {
  const list = await sp.web.lists.getByTitle('NonExistent');
} catch (error) {
  logger.sharePointError(error, 'getList', { listTitle: 'NonExistent' });
  // Extracts: SP correlation ID, permission errors, throttling detection
}

// Operation results
logger.success('File uploaded successfully', {
  fileName: 'document.pdf',
  size: 1024000,
  uploadTime: 2300,
});

logger.failure('Upload failed due to size limit', {
  maxSize: 10485760,
  actualSize: 20971520,
  fileName: 'large-file.pdf',
});

// Structured events for analytics
logger.event(
  'UserAction',
  {
    action: 'fileDownload',
    fileName: 'report.xlsx',
    department: 'finance',
  },
  {
    fileSize: 1024000,
    downloadTime: 1500,
    bandwidthUsed: 683,
  }
);
```

## 📖 Detailed Usage

### SharePoint Operations with Smart Caching

```typescript
const { sp, spNoCache, spShortCache, spLongCache, spPessimistic } = Context.current();

// Default SP instance (uses configured cache strategy)
const items = await sp.web.lists.getByTitle('Tasks').items();

// No caching (always fresh data)
const freshItems = await spNoCache.web.lists.getByTitle('Tasks').items();

// Short-term caching (5 minutes)
const cachedItems = await spShortCache.web.lists.getByTitle('Tasks').items();

// Long-term caching (24 hours)
const configData = await spLongCache.web.contentTypes();

// Pessimistic refresh (serves cached data, refreshes in background)
const userFriendlyData = await spPessimistic.web.lists.getByTitle('Announcements').items();
```

### Dynamic Cache Strategy

```typescript
const { withCache, forWeb } = Context.current();

// Use specific cache strategy for an operation
const result = await withCache('long', async sp => {
  return sp.web.lists.getByTitle('Configuration').items();
});

// Cross-site operations with caching
const otherSiteSp = forWeb('https://tenant.sharepoint.com/sites/other', 'short');
const otherSiteData = await otherSiteSp.web.lists.getByTitle('Data').items();
```

### Link Building

```typescript
const { links } = Context.current();

// File operations
const fileUrl = links.file.absolute('Shared Documents/Report.pdf');
const downloadUrl = links.file.download('Shared Documents/Report.pdf');
const previewUrl = links.file.oneDrivePreview('Shared Documents/Report.pdf');
const editUrl = links.file.browserEdit('Shared Documents/Report.pdf');
const clientUrl = links.file.openInClient('Shared Documents/Report.pdf');

// List item operations
const displayUrl = links.listItem.display('Lists/Tasks', 123);
const editUrl = links.listItem.edit('Lists/Tasks', 123);
const newUrl = links.listItem.newItem('Lists/Tasks');

// Modern list forms
const modernDisplayUrl = links.listItem.modernDisplay('list-guid', 123);
const modernEditUrl = links.listItem.modernEdit('list-guid', 123);

// Cross-site links
const otherSiteLinks = links.forSite('https://tenant.sharepoint.com/sites/other');
const crossSiteFileUrl = otherSiteLinks.file.browserView('Documents/File.pdf');
```

### Performance Tracking

```typescript
const { performance, logger } = Context.current();

// Manual operation tracking
const endTimer = performance.startOperation('dataProcessing', 'operation');
// ... perform operation
const metric = endTimer(true, { recordsProcessed: 150 });

// Automatic SharePoint query tracking
const items = await performance.trackSpQuery(
  () => sp.web.lists.getByTitle('Tasks').items(),
  'TasksList.GetItems'
);

// Automatic HTTP request tracking
const result = await performance.trackHttpRequest(
  () =>
    http.callFunction({
      url: 'https://api.example.com/data',
      useAzureAD: true,
      resourceUri: 'api://your-app-id',
    }),
  'ExternalAPI.GetData'
);

// Get performance statistics
const stats = performance.getStatistics('sp-query');
console.log(`Average SP query time: ${stats.averageDuration}ms`);
console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
```

## ⚙️ Configuration

### Initialization Options

```typescript
await Context.initialize(this.context, {
  componentName: 'MyComponent',

  logging: {
    level: LogLevel.Info, // Verbose, Info, Warning, Error
    enablePerformanceMetrics: true, // Track performance metrics
    enableDiagnostics: false, // Enable SPFx diagnostics logging
    productionSampling: 0.1, // 10% log sampling in production
  },

  http: {
    timeoutMs: 30000, // Request timeout
    retries: 3, // Retry attempts
    maxConcurrent: 6, // Max concurrent requests
  },

  caching: {
    defaultStrategy: 'short', // none, short, long, pessimistic
    shortTtlMs: 5 * 60 * 1000, // 5 minutes
    longTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  },

  features: {
    enableUrlOverrides: true, // Allow URL parameter overrides
    enableDevTools: true, // Development tools in browser
    enableRequestDeduplication: false, // Deduplicate identical requests
  },
});
```

### Environment Detection

The utility automatically detects your environment:

- **Development**: `localhost`, workbench, debug manifests
- **UAT**: URLs containing `/uat`, `/staging`, `/test`
- **Production**: Everything else

Override with URL parameters:

- `?env=dev` - Force development environment
- `?loglevel=verbose` - Override log level
- `?cache=none` - Override cache strategy
- `?debug=true` - Enable debug mode

## 🔒 Azure AD Setup Guide

### 1. App Registration (Azure Portal)

```json
// App Registration Manifest
{
  "appId": "12345678-1234-5678-9012-123456789012",
  "identifierUris": ["api://12345678-1234-5678-9012-123456789012"],
  "oauth2Permissions": [
    {
      "adminConsentDescription": "Allow access to API",
      "adminConsentDisplayName": "Access API",
      "id": "unique-guid-here",
      "isEnabled": true,
      "type": "User",
      "userConsentDescription": "Access API on your behalf",
      "userConsentDisplayName": "Access API",
      "value": "API.Access"
    }
  ]
}
```

### 2. SPFx Package Solution

```json
// package-solution.json
{
  "solution": {
    "name": "my-spfx-solution",
    "id": "spfx-solution-guid",
    "webApiPermissionRequests": [
      {
        "resource": "api://12345678-1234-5678-9012-123456789012",
        "scope": "API.Access"
      },
      {
        "resource": "https://service.flow.microsoft.com",
        "scope": "Flows.Read.All"
      }
    ]
  }
}
```

### 3. Admin Consent

After deployment, admin must approve permissions in:
**SharePoint Admin Center > Advanced > API access > Pending requests**

## 🎯 Real-World Examples

### Document Processing Workflow

```typescript
async function processDocument(file: File, userId: string) {
  const { http, logger } = Context.current();

  try {
    // 1. Upload to Azure Function for processing
    const uploadResult = await http.callFunction({
      url: 'https://docprocessor.azurewebsites.net/api/upload',
      method: 'POST',
      data: {
        fileName: file.name,
        fileSize: file.size,
        userId: userId,
      },
      useAzureAD: true,
      resourceUri: 'api://doc-processor-app-id',
      timeout: 60000,
    });

    if (!uploadResult.ok) {
      throw new Error(`Upload failed: ${uploadResult.status}`);
    }

    // 2. Trigger Power Platform workflow
    const processingResult = await http.triggerFlow({
      url: 'https://prod-456.westus.logic.azure.com:443/workflows/process-doc/triggers/manual/paths/invoke',
      data: {
        documentId: JSON.parse(uploadResult.body).documentId,
        userId: userId,
        processingOptions: {
          extractText: true,
          generateThumbnail: true,
          detectLanguage: true,
        },
      },
      idempotencyKey: `process-doc-${userId}-${Date.now()}`,
      functionKey: 'your-flow-trigger-key',
    });

    logger.success('Document processing initiated', {
      documentId: JSON.parse(uploadResult.body).documentId,
      flowRunId: processingResult.headers?.['x-ms-workflow-run-id'],
    });

    return JSON.parse(processingResult.body);
  } catch (error) {
    logger.exception(error, 'processDocument', {
      fileName: file.name,
      fileSize: file.size,
      userId,
    });
    throw error;
  }
}
```

### Secure Configuration Retrieval

```typescript
async function getSecureConfiguration(environment: string) {
  const { http, logger } = Context.current();

  const configResult = await http.callFunction({
    url: `https://config.mycompany.com/api/config/${environment}`,
    method: 'GET',
    useAzureAD: true,
    resourceUri: 'api://configuration-service-id',
    headers: {
      'X-Client-App': 'SPFx-Component',
      'X-Config-Version': '2.0',
    },
  });

  if (configResult.ok) {
    const config = JSON.parse(configResult.body);
    logger.info('Configuration retrieved', {
      environment,
      configKeys: Object.keys(config).length,
    });
    return config;
  } else {
    logger.httpError(new Error(`Config retrieval failed: ${configResult.status}`), {
      method: 'GET',
      url: `https://config.mycompany.com/api/config/${environment}`,
    });
    throw new Error('Failed to retrieve configuration');
  }
}
```

## 🔍 Troubleshooting

### Common Issues

**Context Not Initialized:**

- Make sure `Context.initialize()` is called in `onInit()` and awaited
- Check for initialization errors in browser console
- Verify SPFx context is properly passed to the utility

**Azure AD Authentication Issues:**

```typescript
// Check permission status
async function debugPermissions() {
  const { http, logger } = Context.current();

  try {
    const token = await http.getAccessToken('api://your-app-id');
    logger.info('Token acquired successfully');

    const result = await http.callFunction({
      url: 'https://yourapi.com/api/test',
      useAzureAD: true,
      resourceUri: 'api://your-app-id',
    });

    logger.success('API call successful', { status: result.status });
  } catch (error) {
    logger.httpError(
      error,
      { method: 'GET', url: 'https://yourapi.com/api/test' },
      {
        troubleshooting: [
          'Check if admin approved API permissions in SharePoint Admin Center',
          'Verify App Registration ID is correct',
          'Ensure user has required roles/permissions',
        ],
      }
    );
  }
}
```

**Logging Issues:**

- **Use specific error methods**: `exception()` for operation failures, `httpError()` for API errors, `sharePointError()` for SP operations
- **Check error analysis**: The logger provides automatic error categorization and remediation suggestions
- **Include operation context**: Always provide operation names and relevant data with error logs

## 📊 Best Practices

### Authentication

- **Use Azure AD** for production enterprise applications
- **Use Function Keys** for simple Azure Function calls
- **Use API Keys** for external/third-party APIs
- **Store resource URIs** in environment-specific configuration
- **Implement error handling** for authentication failures

### Logging

- Use appropriate log levels and specific error methods
- Include relevant context data with log messages
- Use structured logging with consistent property names
- Leverage log sampling in production to reduce noise
- Let the logger analyze errors automatically

### Caching

- Use `short` cache for frequently changing data
- Use `long` cache for configuration and static data
- Use `pessimistic` cache for large datasets where UX is important
- Use `none` cache for real-time requirements

### Performance

- Monitor performance metrics regularly
- Use performance tracking for critical user flows
- Set up alerts for slow operations
- Analyze trends to identify degradation over time

## 📋 API Reference

### Context

- `Context.initialize(context, options)` - Initialize the utility
- `Context.current()` - Get current context
- `Context.isReady()` - Check if initialized
- `Context.getConfig()` - Get runtime configuration

### HTTP Authentication

- `http.callFunction(options)` - Call Azure Functions with auth
- `http.triggerFlow(options)` - Trigger Power Platform Flows
- `http.getAccessToken(resourceUri)` - Get Azure AD token
- `http.sp(method, url, data, headers)` - SharePoint REST calls

### Logging

- `logger.info/warn/error/verbose(message, data, category)`
- `logger.success/failure(message, data, category)`
- `logger.exception(error, operation, data)` - Enhanced exception logging
- `logger.httpError(error, request, data)` - HTTP-specific error logging
- `logger.sharePointError(error, operation, data)` - SharePoint error analysis

### Performance

- `performance.startOperation(name, category)`
- `performance.trackSpQuery(operation, name)`
- `performance.trackHttpRequest(operation, name)`
- `performance.getStatistics(category, since)`

## 🚀 Version History

- **v2.1.0** - Added Azure AD authentication support with multiple auth methods
- **v2.0.0** - Initial release with full SPFx 1.21.1 support
- Enhanced logging with production sampling and intelligent error analysis
- Comprehensive performance tracking and caching strategies
- Universal compatibility with all SPFx component types

## 📄 License

This utility is provided as-is for use in SharePoint Framework projects. Modify and adapt as needed for your specific requirements.

---

**Happy SharePoint development with enterprise-grade authentication! 🚀**
