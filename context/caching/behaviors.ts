/**
 * src/context/caching/behaviors.ts
 * PnP caching behavior configurations for different strategies
 */

import { Caching, CachingPessimisticRefresh } from '@pnp/queryable';
import type { CacheStrategy, CacheBehaviorConfig } from '../utils/types';

// Default cache TTL values
const DEFAULT_TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Creates a standard caching behavior for PnP
 */
export function createCacheBehavior(ttlMs: number) {
  return Caching({
    store: 'local',
    keyFactory: (url: string) => url.toLowerCase(),
    expireFunc: () => new Date(Date.now() + ttlMs),
  });
}

/**
 * Creates a pessimistic refresh caching behavior for PnP
 * This strategy serves cached data immediately but refreshes in background
 */
export function createPessimisticBehavior(ttlMs: number) {
  return CachingPessimisticRefresh({
    store: 'local',
    keyFactory: (url: string) => url.toLowerCase(),
    expireFunc: () => new Date(Date.now() + ttlMs),
  });
}

/**
 * Cache behavior factory that creates PnP behaviors based on strategy
 */
export class CacheBehaviorFactory {
  private readonly shortTtl: number;
  private readonly longTtl: number;

  constructor(shortTtlMs?: number, longTtlMs?: number) {
    this.shortTtl = shortTtlMs ?? DEFAULT_TTL.SHORT;
    this.longTtl = longTtlMs ?? DEFAULT_TTL.LONG;
  }

  /**
   * Gets the appropriate caching behavior for a strategy
   */
  getBehavior(strategy: CacheStrategy) {
    switch (strategy) {
      case 'short':
        return createCacheBehavior(this.shortTtl);

      case 'long':
        return createCacheBehavior(this.longTtl);

      case 'pessimistic':
        return createPessimisticBehavior(this.longTtl);

      case 'none':
      default:
        return undefined; // No caching behavior
    }
  }

  /**
   * Gets cache configuration for a strategy
   */
  getConfig(strategy: CacheStrategy): CacheBehaviorConfig | null {
    switch (strategy) {
      case 'short':
        return {
          ttlMs: this.shortTtl,
          store: 'local',
          keyFactory: (url: string) => url.toLowerCase(),
        };

      case 'long':
      case 'pessimistic':
        return {
          ttlMs: this.longTtl,
          store: 'local',
          keyFactory: (url: string) => url.toLowerCase(),
        };

      case 'none':
      default:
        return null;
    }
  }

  /**
   * Updates TTL values
   */
  updateTtl(shortTtlMs?: number, longTtlMs?: number): void {
    if (shortTtlMs !== undefined) {
      (this as any).shortTtl = Math.max(0, shortTtlMs);
    }
    if (longTtlMs !== undefined) {
      (this as any).longTtl = Math.max(0, longTtlMs);
    }
  }

  /**
   * Gets current TTL values
   */
  getTtlValues(): { short: number; long: number } {
    return {
      short: this.shortTtl,
      long: this.longTtl,
    };
  }
}

/**
 * Smart cache strategy selector based on context
 */
export class CacheStrategySelector {
  /**
   * Recommends cache strategy based on query characteristics
   */
  static recommendStrategy(queryInfo: {
    isListData?: boolean;
    isUserData?: boolean;
    isConfigData?: boolean;
    isFrequentlyChanging?: boolean;
    expectedSize?: 'small' | 'medium' | 'large';
  }): CacheStrategy {
    const {
      isListData = false,
      isUserData = false,
      isConfigData = false,
      isFrequentlyChanging = false,
      expectedSize = 'medium',
    } = queryInfo;

    // No cache for frequently changing data
    if (isFrequentlyChanging) {
      return 'none';
    }

    // Long cache for configuration data (site settings, content types, etc.)
    if (isConfigData) {
      return 'long';
    }

    // Short cache for user-specific data
    if (isUserData) {
      return 'short';
    }

    // Pessimistic for large, stable datasets
    if (isListData && expectedSize === 'large') {
      return 'pessimistic';
    }

    // Default to short cache
    return 'short';
  }

  /**
   * Determines if a URL should use caching based on patterns
   */
  static shouldCache(url: string): boolean {
    const lowerUrl = url.toLowerCase();

    // Don't cache certain operations
    const noCachePatterns = [
      '/items/add',
      '/items/update',
      '/items/delete',
      '/files/add',
      '/folders/add',
      '/recyclebin',
      '/search/query',
      'select=created,modified', // Real-time data queries
    ];

    return !noCachePatterns.some(pattern => lowerUrl.includes(pattern));
  }
}

/**
 * Cache key utilities for consistent key generation
 */
export class CacheKeyUtils {
  /**
   * Generates a cache key for user-specific data
   */
  static userSpecific(baseKey: string, userLoginName?: string): string {
    const user = userLoginName ? userLoginName.toLowerCase() : 'anonymous';
    return `${baseKey}|user:${user}`;
  }

  /**
   * Generates a cache key for site-specific data
   */
  static siteSpecific(baseKey: string, siteUrl?: string): string {
    const site = siteUrl ? new URL(siteUrl).pathname : 'unknown';
    return `${baseKey}|site:${site}`;
  }

  /**
   * Generates a cache key with version for cache busting
   */
  static versioned(baseKey: string, version: string | number): string {
    return `${baseKey}|v:${version}`;
  }

  /**
   * Normalizes URLs for consistent cache keys
   */
  static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove hash and sort query parameters for consistency
      const params = new URLSearchParams(urlObj.search);
      const sortedParams = new URLSearchParams();

      const keys: string[] = [];
      params.forEach((_, key) => keys.push(key));
      keys.sort().forEach(key => {
        sortedParams.set(key, params.get(key) || '');
      });

      return `${urlObj.origin}${urlObj.pathname}${
        sortedParams.toString() ? '?' + sortedParams.toString() : ''
      }`;
    } catch {
      return url.toLowerCase();
    }
  }
}

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  totalRequests: number;
  hitRatio: number;
  lastUpdated: number;
}

/**
 * Simple cache metrics collector
 */
export class CacheMetricsCollector {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalRequests: 0,
    hitRatio: 0,
    lastUpdated: Date.now(),
  };

  recordHit(): void {
    this.metrics.hits++;
    this.metrics.totalRequests++;
    this.updateRatio();
  }

  recordMiss(): void {
    this.metrics.misses++;
    this.metrics.totalRequests++;
    this.updateRatio();
  }

  recordError(): void {
    this.metrics.errors++;
    this.metrics.totalRequests++;
    this.updateRatio();
  }

  getMetrics(): Readonly<CacheMetrics> {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalRequests: 0,
      hitRatio: 0,
      lastUpdated: Date.now(),
    };
  }

  private updateRatio(): void {
    this.metrics.hitRatio =
      this.metrics.totalRequests > 0 ? this.metrics.hits / this.metrics.totalRequests : 0;
    this.metrics.lastUpdated = Date.now();
  }
}
