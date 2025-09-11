/**
 * src/context/context-manager.ts
 * Main context manager - single point of initialization and access (Fixed)
 */

import { LogLevel, Logger as PnPLogger } from '@pnp/logging';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import { CacheBehaviorFactory } from './caching/behaviors';
import {
  detectBuildMode,
  detectSiteEnvironment,
  generateCorrelationId,
  getDefaultCacheStrategy,
  getDefaultLogLevel,
  readUrlOverrides,
} from './environment/detector';
import { SPFxHttpGateway } from './http/gateway';
import { LoggerFactory } from './logging/logger';
import { SPFxPerformanceTracker } from './logging/performance';
import { SPFxLinkBuilder } from './utils/links';
import type {
  CacheStrategy,
  ContextInitOptions,
  RuntimeConfig,
  SPFxContext,
  SPFxContextInput
} from './utils/types';

/**
 * Main context manager singleton
 */
class ContextManager {
  private static instance: ContextManager | null = null;
  private context: SPFxContext | null = null;
  private isInitialized = false;
  private runtimeConfig: RuntimeConfig | null = null;

  static get current(): SPFxContext {
    if (!ContextManager.instance?.context) {
      throw new Error('Context not initialized. Call ContextManager.initialize() first.');
    }
    return ContextManager.instance.context;
  }

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * Initialize the context system
   */
  static async initialize(
    spfxContext: SPFxContextInput,
    options: ContextInitOptions = {}
  ): Promise<SPFxContext> {
    const manager = ContextManager.getInstance();

    if (manager.isInitialized) {
      console.warn('Context already initialized. Returning existing context.');
      return manager.context!;
    }

    return manager.doInitialize(spfxContext, options);
  }

  /**
   * Check if context is ready
   */
  static isReady(): boolean {
    return ContextManager.instance?.isInitialized ?? false;
  }

  /**
   * Get current runtime configuration
   */
  static getConfig(): RuntimeConfig | null {
    const manager = ContextManager.getInstance();
    return manager.runtimeConfig;
  }

  /**
   * Reset context (useful for testing)
   */
  static reset(): void {
    if (ContextManager.instance) {
      ContextManager.instance.context = null;
      ContextManager.instance.isInitialized = false;
      ContextManager.instance.runtimeConfig = null;
    }
  }

  // Private implementation

  private async doInitialize(
    spfxContext: SPFxContextInput,
    options: ContextInitOptions
  ): Promise<SPFxContext> {
    try {
      // Extract page context safely
      const pageContext = spfxContext.pageContext;
      if (!pageContext) {
        throw new Error('PageContext is required but not found in SPFx context');
      }

      // Environment detection
      const webAbsoluteUrl = pageContext.web.absoluteUrl;
      const webServerRelativeUrl = pageContext.web.serverRelativeUrl;

      const buildMode = detectBuildMode();
      const urlOverrides = readUrlOverrides();
      const detectedEnv = detectSiteEnvironment(webAbsoluteUrl, webServerRelativeUrl);
      const environment = urlOverrides?.environment ?? detectedEnv;

      // Configuration resolution
      const correlationId = generateCorrelationId();
      const componentName = options.componentName ?? 'SPFxApp';

      // Logging configuration
      const defaultLogLevel = getDefaultLogLevel(environment, buildMode);
      const logLevel = urlOverrides?.logLevel ?? options.logging?.level ?? defaultLogLevel;

      // Cache configuration
      const defaultCacheStrategy = getDefaultCacheStrategy(environment);
      const cacheStrategy =
        urlOverrides?.cacheStrategy ?? options.caching?.defaultStrategy ?? defaultCacheStrategy;

      // Create logger
      const logger = LoggerFactory.create({
        componentName,
        environment,
        correlationId,
        level: logLevel,
        userLoginName: pageContext.user.loginName,
        siteUrl: pageContext.site.absoluteUrl,
        webUrl: webAbsoluteUrl,
        productionSamplingRate: options.logging?.productionSampling ?? 0.1,
      });

      // Create cache behavior factory
      const cacheFactory = new CacheBehaviorFactory(
        options.caching?.shortTtlMs,
        options.caching?.longTtlMs
      );

      // Create PnP SP instances with different caching strategies
      const spBase = spfi().using(SPFx(spfxContext));
      const spNoCache = spBase;

      // Handle undefined behaviors safely
      const shortBehavior = cacheFactory.getBehavior('short');
      const longBehavior = cacheFactory.getBehavior('long');
      const pessimisticBehavior = cacheFactory.getBehavior('pessimistic');
      const defaultBehavior = cacheFactory.getBehavior(cacheStrategy);

      const spShortCache = shortBehavior ? spBase.using(shortBehavior) : spBase;
      const spLongCache = longBehavior ? spBase.using(longBehavior) : spBase;
      const spPessimistic = pessimisticBehavior ? spBase.using(pessimisticBehavior) : spBase;

      // Default SP instance based on strategy
      const sp = defaultBehavior ? spBase.using(defaultBehavior) : spBase;

      // Create performance tracker
      const performance = new SPFxPerformanceTracker({
        maxMetrics: 1000,
        enabledCategories:
          options.logging?.enablePerformanceMetrics !== false
            ? ['sp-query', 'http-request', 'operation']
            : [],
      });

      // Create HTTP gateway
      const http = new SPFxHttpGateway(spfxContext, {
        logger,
        correlationId,
        timeoutMs: options.http?.timeoutMs ?? 30000,
        maxRetries: options.http?.retries ?? 3,
        maxConcurrent: options.http?.maxConcurrent ?? 6,
      });

      // Create link builder
      const links = new SPFxLinkBuilder(webAbsoluteUrl, webServerRelativeUrl);

      // Extract additional context information
      const siteId = this.extractId(pageContext.site);
      const webId = this.extractId(pageContext.web);
      const tenantId = this.extractTenantId(pageContext);

      // Build the complete context
      const context: SPFxContext = {
        // Core SPFx objects
        context: spfxContext,
        pageContext,

        // PnP SP instances
        sp,
        spNoCache,
        spShortCache,
        spLongCache,
        spPessimistic,

        // Environment information
        environment,
        buildMode,
        isProdSite: environment === 'prod',
        isProdBuild: buildMode === 'production',

        // Site/Web information
        siteUrl: pageContext.site.absoluteUrl,
        webUrl: webAbsoluteUrl,
        webRelativeUrl: webServerRelativeUrl,
        siteId,
        webId,
        webTitle: pageContext.web.title,
        tenantId,

        // User information
        currentUser: {
          loginName: pageContext.user.loginName,
          displayName: pageContext.user.displayName,
          email: pageContext.user.email,
        },

        // Culture/Language
        culture: {
          name: (pageContext as any).cultureInfo?.currentCultureName,
          uiLanguage: (pageContext as any).cultureInfo?.currentUICultureName,
        },

        // Context flags
        isTeamsContext: !!(pageContext as any).legacyPageContext?.isTeamsContext,
        isClassicPage: !!(pageContext as any).legacyPageContext?.isClassicPage,

        // Utility instances
        logger,
        http,
        links,
        performance,

        // Request correlation
        correlationId,

        // Utility methods
        forWeb: (webUrl: string, cacheStrategyOverride?: CacheStrategy): SPFI => {
          const strategy = cacheStrategyOverride ?? cacheStrategy;
          const webSp = spfi(webUrl).using(SPFx(spfxContext));
          const behavior = cacheFactory.getBehavior(strategy);
          return behavior ? webSp.using(behavior) : webSp;
        },

        withCache: async <T>(
          strategy: CacheStrategy,
          operation: (sp: SPFI) => Promise<T>
        ): Promise<T> => {
          const behavior = cacheFactory.getBehavior(strategy);
          const spInstance = behavior ? spBase.using(behavior) : spBase;
          return performance.trackSpQuery(() => operation(spInstance), `withCache(${strategy})`);
        },
      };

      // Create runtime configuration
      this.runtimeConfig = {
        componentName,
        logLevel,
        cacheStrategy,
        httpTimeoutMs: options.http?.timeoutMs ?? 30000,
        maxConcurrentRequests: options.http?.maxConcurrent ?? 6,
        enableDevTools: buildMode === 'development' && options.features?.enableDevTools !== false,
        environment,
        buildMode,
        correlationId,
        features: {
          performanceMetrics: options.logging?.enablePerformanceMetrics !== false,
          requestDeduplication: options.features?.enableRequestDeduplication ?? false,
          urlOverrides: environment !== 'prod' && options.features?.enableUrlOverrides !== false,
        },
      };

      // Set up PnP logger bridge
      this.bridgePnPLogger(logger);

      // Store context
      this.context = context;
      this.isInitialized = true;

      // Development tools
      if (this.runtimeConfig.enableDevTools) {
        this.setupDevTools(context);
      }

      // Log successful initialization
      logger.banner(`Context Initialized • ${pageContext.web.title}`, {
        component: componentName,
        environment,
        buildMode,
        cacheStrategy,
        logLevel: LogLevel[logLevel],
        correlationId,
        siteUrl: context.siteUrl,
        webUrl: context.webUrl,
        user: context.currentUser.loginName,
      });

      return context;
    } catch (error) {
      console.error('Failed to initialize SPFx context:', error);
      throw error;
    }
  }

  private extractId(object: any): string {
    try {
      const id = object?.id;
      return typeof id?.toString === 'function' ? id.toString() : String(id || '');
    } catch {
      return '';
    }
  }

  private extractTenantId(pageContext: any): string {
    try {
      return (
        pageContext?.aadInfo?.tenantId?.toString() ??
        pageContext?.legacyPageContext?.aadTenantId ??
        ''
      );
    } catch {
      return '';
    }
  }

  private bridgePnPLogger(logger: any): void {
    try {
      PnPLogger.subscribe({
        log: (entry: any) => {
          const level = entry.level ?? LogLevel.Info;
          const message = entry.message ?? 'PnP Log';
          const data = entry.data;

          switch (level) {
            case LogLevel.Error:
              logger.error(message, data, 'pnp');
              break;
            case LogLevel.Warning:
              logger.warn(message, data, 'pnp');
              break;
            case LogLevel.Info:
              logger.info(message, data, 'pnp');
              break;
            default:
              logger.verbose(message, data, 'pnp');
              break;
          }
        },
      });
    } catch (error) {
      console.warn('Failed to bridge PnP logger:', error);
    }
  }

  private setupDevTools(context: SPFxContext): void {
    try {
      (window as any).__spfxContext = {
        get: () => context,
        config: this.runtimeConfig,
        performance: {
          getMetrics: () => context.performance.getMetrics(),
          getStats: (category?: string) => {
            // Use the performance tracker's getStatistics method that actually exists
            const tracker = context.performance as SPFxPerformanceTracker;
            if (typeof tracker.getStatistics === 'function') {
              return tracker.getStatistics(category);
            }
            return null;
          },
          clear: () => context.performance.clearMetrics(),
        },
        cache: {
          clear: () => {
            // Note: PnP doesn't expose cache clearing directly
            console.log('Cache clear requested (not implemented by PnP)');
          },
        },
        logger: {
          test: (level: string, message: string) => {
            switch (level.toLowerCase()) {
              case 'error':
                context.logger.error(message, { test: true });
                break;
              case 'warn':
                context.logger.warn(message, { test: true });
                break;
              case 'info':
                context.logger.info(message, { test: true });
                break;
              default:
                context.logger.verbose(message, { test: true });
                break;
            }
          },
        },
      };

      console.log('🔧 SPFx Dev Tools available at window.__spfxContext');
    } catch (error) {
      console.warn('Failed to setup dev tools:', error);
    }
  }
}

// Export the singleton instance methods as the public API
export const Context = {
  initialize: ContextManager.initialize,
  current: () => ContextManager.current,
  isReady: ContextManager.isReady,
  getConfig: ContextManager.getConfig,
  reset: ContextManager.reset, // For testing
};

// Convenience exports for common operations
export const getSp = (): SPFI => Context.current().sp;
export const getLogger = () => Context.current().logger;
export const getHttp = () => Context.current().http;
export const getLinks = () => Context.current().links;
