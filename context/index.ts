/**
 * src/context/index.ts
 * Main entry point for SPFx Context utility (No Application Insights)
 *
 * Usage:
 * ```typescript
 * import { Context, ContextInitOptions } from './context';
 *
 * // In your WebPart/Extension onInit()
 * await Context.initialize(this.context, {
 *   componentName: 'MyWebPart',
 *   logging: { level: LogLevel.Info }
 * });
 *
 * // Anywhere in your app
 * const { sp, logger, http, links } = Context.current();
 * ```
 */

// Re-export PnP types first
export { LogLevel } from '@pnp/logging';
export type { SPFI } from '@pnp/sp';

// Main context exports
export { Context, getHttp, getLinks, getLogger, getSp } from './context-manager';

// Type definitions
export type {
  BuildMode,
  CacheStrategy, ContextInitOptions, ContextLogger, EnvironmentName, FileLinks, FlowTriggerOptions,
  FunctionCallOptions, HttpGateway,
  HttpResult, LinkBuilder, ListItemLinks, LogContext,
  LogEntry,
  LogSink, PerformanceMetric, PerformanceTracker, RuntimeConfig, SiteLinks, SPFxContext
} from './utils/types';

// Environment utilities
export {
  createEnvironmentBadge, detectBuildMode,
  detectSiteEnvironment, generateCorrelationId, getDefaultCacheStrategy, getDefaultLogLevel, readUrlOverrides, shouldUseProductionLogging, validateEnvironmentConfig
} from './environment/detector';

// Caching utilities
export {
  CacheBehaviorFactory, CacheKeyUtils,
  CacheMetricsCollector, CacheStrategySelector, createCacheBehavior,
  createPessimisticBehavior
} from './caching/behaviors';

// Logging system
export { ConsoleSink, LoggerFactory, SPFxLogger } from './logging/logger';

// Performance tracking
export { PerformanceAnalyzer, SPFxPerformanceTracker } from './logging/performance';

// HTTP utilities
export { SPFxHttpGateway } from './http/gateway';

// Link building
export { LinkUtils, SPFxLinkBuilder } from './utils/links';

// Helper utilities
export { ContextValidation, QuickStart } from './utils/helpers';

/**
 * Version information
 */
export const VERSION = '2.0.0';

/**
 * Default export for convenience
 */
export { Context as default } from './context-manager';
