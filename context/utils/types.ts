/**
 * src/context/utils/types.ts
 * Core type definitions for SPFx Context utility (No Application Insights)
 */

import type { LogLevel } from '@pnp/logging';
import type { SPFI } from '@pnp/sp';
import type { BaseComponentContext } from '@microsoft/sp-component-base';
import type { PageContext } from '@microsoft/sp-page-context';

// Environment and build detection
export type EnvironmentName = 'dev' | 'uat' | 'prod';
export type BuildMode = 'development' | 'production' | 'test' | 'unknown';
export type CacheStrategy = 'none' | 'short' | 'long' | 'pessimistic';

// Core context interfaces
export interface SPFxContextInput extends BaseComponentContext {
  pageContext: PageContext;
}

export interface ContextInitOptions {
  /** Component name for logging identification */
  componentName?: string;

  /** Logging configuration */
  logging?: {
    level?: LogLevel;
    enableDiagnostics?: boolean;
    enablePerformanceMetrics?: boolean;
    productionSampling?: number; // 0-1, percentage of logs to keep in prod
  };

  /** HTTP configuration */
  http?: {
    timeoutMs?: number;
    retries?: number;
    maxConcurrent?: number;
  };

  /** Caching defaults */
  caching?: {
    defaultStrategy?: CacheStrategy;
    shortTtlMs?: number;
    longTtlMs?: number;
  };

  /** Reserved for future telemetry integration */
  telemetry?: {
    // Future: Application Insights or other telemetry providers
    [key: string]: any;
  };

  /** Feature flags */
  features?: {
    enableUrlOverrides?: boolean;
    enableDevTools?: boolean;
    enableRequestDeduplication?: boolean;
  };
}

// Main context interface - simplified from original
export interface SPFxContext {
  // Core SPFx objects
  readonly context: SPFxContextInput;
  readonly pageContext: PageContext;

  // PnP SP instances with different caching strategies
  readonly sp: SPFI;
  readonly spNoCache: SPFI;
  readonly spShortCache: SPFI;
  readonly spLongCache: SPFI;
  readonly spPessimistic: SPFI;

  // Environment information
  readonly environment: EnvironmentName;
  readonly buildMode: BuildMode;
  readonly isProdSite: boolean;
  readonly isProdBuild: boolean;

  // Site/Web information
  readonly siteUrl: string;
  readonly webUrl: string;
  readonly webRelativeUrl: string;
  readonly siteId: string;
  readonly webId: string;
  readonly webTitle: string;
  readonly tenantId: string;

  // User information
  readonly currentUser: {
    loginName?: string;
    displayName?: string;
    email?: string;
  };

  // Culture/Language
  readonly culture: {
    name?: string;
    uiLanguage?: string;
  };

  // Context flags
  readonly isTeamsContext: boolean;
  readonly isClassicPage: boolean;

  // Utility instances
  readonly logger: ContextLogger;
  readonly http: HttpGateway;
  readonly links: LinkBuilder;
  readonly performance: PerformanceTracker;

  // Request correlation
  readonly correlationId: string;

  // Utility methods
  forWeb(webUrl: string, cacheStrategy?: CacheStrategy): SPFI;
  withCache<T>(strategy: CacheStrategy, operation: (sp: SPFI) => Promise<T>): Promise<T>;
}

// Logging interfaces
export interface LogContext {
  correlationId: string;
  environment: EnvironmentName;
  component?: string;
  user?: string;
  siteUrl?: string;
  webUrl?: string;
  [key: string]: any;
}

export interface ContextLogger {
  // Core logging methods
  verbose(message: string, data?: any, category?: string): void;
  info(message: string, data?: any, category?: string): void;
  warn(message: string, data?: any, category?: string): void;
  error(errorOrMessage: string | Error | any, data?: any, category?: string): void;

  // Enhanced convenience methods
  success(message: string, data?: any, category?: string): void;
  failure(messageOrError: string | Error | any, data?: any, category?: string): void;

  // Specialized error logging
  exception(error: Error | any, operation?: string, data?: any): void;
  httpError(error: any, request?: { method?: string; url?: string; data?: any }, data?: any): void;
  sharePointError(error: any, operation?: string, data?: any): void;

  // Structured logging
  event(name: string, properties?: Record<string, any>, metrics?: Record<string, number>): void;

  // Performance tracking
  startTimer(name: string): () => void;

  // Banner/formatting
  banner(title: string, details?: any): void;

  // Context management
  withContext(context: Partial<LogContext>): ContextLogger;
}

// HTTP Gateway interfaces
export interface HttpResult {
  ok: boolean;
  status: number;
  statusText?: string;
  body: string;
  url: string;
  duration: number;
  headers?: Record<string, string>;
}

export interface FlowTriggerOptions {
  url: string;
  data?: any;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  timeout?: number;
  /** Function key for secured flows */
  functionKey?: string;
  /** Enable Azure AD authentication */
  useAzureAD?: boolean;
  /** Resource URI or Application ID for Azure AD token */
  resourceUri?: string;
}

export interface FunctionCallOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  /** Enable Azure AD authentication */
  useAzureAD?: boolean;
  /** Resource URI or Application ID for Azure AD token */
  resourceUri?: string;
  /** Function key for key-based authentication */
  functionKey?: string;
  /** API key for custom authentication */
  apiKey?: string;
}

export interface HttpGateway {
  // Core HTTP methods
  sp(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<HttpResult>;

  // Power Platform integration
  triggerFlow(options: FlowTriggerOptions): Promise<HttpResult>;

  // Azure Functions integration
  callFunction(options: FunctionCallOptions): Promise<HttpResult>;

  // Azure AD utilities
  getAccessToken(resourceUri: string): Promise<string>;

  // Raw client access for advanced scenarios
  readonly rawSpHttp: any;
  readonly rawHttpClient: any;
}

// Link builder interfaces
export interface FileLinks {
  absolute(fileUrlOrPath: string): string;
  download(fileUrlOrPath: string): string;
  browserView(fileUrlOrPath: string): string;
  browserEdit(fileUrlOrPath: string): string;
  oneDrivePreview(fileUrlOrPath: string): string;
  openInClient(fileUrlOrPath: string): string;
  versionHistory(listId: string, itemId: number): string;
}

export interface ListItemLinks {
  display(listUrl: string, itemId: number, source?: string): string;
  edit(listUrl: string, itemId: number, source?: string): string;
  newItem(listUrl: string, source?: string): string; // Renamed from 'new'
  modernDisplay(listId: string, itemId: number, source?: string): string;
  modernEdit(listId: string, itemId: number, source?: string): string;
  modernNew(listId: string, source?: string): string;
}

export interface SiteLinks {
  home(): string;
  contents(): string;
  settings(): string;
  recycleBin(): string;
}

export interface LinkBuilder {
  readonly file: FileLinks;
  readonly listItem: ListItemLinks;
  readonly site: SiteLinks;

  // Utility methods
  uploadTo(libraryUrl: string): string;
  listSettings(listId: string): string;

  // Cross-site scenarios
  forSite(siteUrl: string): Pick<LinkBuilder, 'file' | 'listItem'>;
}

// Performance tracking
export interface PerformanceMetric {
  name: string;
  duration: number;
  success: boolean;
  timestamp: number;
  category: 'sp-query' | 'http-request' | 'operation';
  details?: any;
}

export interface PerformanceTracker {
  startOperation(
    name: string,
    category?: string
  ): (success?: boolean, details?: any) => PerformanceMetric;
  recordMetric(metric: PerformanceMetric): void;
  getMetrics(since?: number): PerformanceMetric[];
  clearMetrics(): void;

  // Convenience methods for common scenarios
  trackSpQuery<T>(operation: () => Promise<T>, queryName?: string): Promise<T>;
  trackHttpRequest<T>(operation: () => Promise<T>, requestName?: string): Promise<T>;
}

// Environment detection configuration
export interface EnvironmentConfig {
  patterns: {
    dev: string[];
    uat: string[];
    prod: string[];
  };
  urlOverrides?: {
    environment?: EnvironmentName;
    logLevel?: LogLevel;
    cacheStrategy?: CacheStrategy;
    debug?: boolean;
  };
}

// Internal interfaces for implementation
export interface CacheBehaviorConfig {
  ttlMs: number;
  store: 'local' | 'session';
  keyFactory: (url: string) => string;
}

export interface LogSink {
  log(entry: LogEntry): void;
  flush?(): Promise<void>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  category: string;
  timestamp: number;
  context: LogContext;
  data?: any;
  error?: Error;
}

// Error handling
export interface ContextError extends Error {
  code?: string;
  context?: any;
  correlationId?: string;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Runtime configuration (after initialization)
export interface RuntimeConfig {
  componentName: string;
  logLevel: LogLevel;
  cacheStrategy: CacheStrategy;
  httpTimeoutMs: number;
  maxConcurrentRequests: number;
  enableDevTools: boolean;
  environment: EnvironmentName;
  buildMode: BuildMode;
  correlationId: string;
  features: {
    performanceMetrics: boolean;
    requestDeduplication: boolean;
    urlOverrides: boolean;
  };
}
