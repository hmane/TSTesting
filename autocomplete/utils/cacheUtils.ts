// utils/cacheUtils.ts
import { RecentCacheItem, AUTOCOMPLETE_CONSTANTS, AutocompleteError, AutocompleteErrorType } from '../types/AutocompleteTypes';

/**
 * Utility class for managing recent selections cache in localStorage
 * Provides methods to store, retrieve, and manage recently selected items
 */
export class RecentCacheManager {
  private readonly cacheKey: string;
  private readonly maxCacheSize: number;
  private readonly cacheTTL: number;

  constructor(
    cacheKey: string, 
    maxCacheSize: number = AUTOCOMPLETE_CONSTANTS.DEFAULT_RECENT_CACHE_SIZE,
    cacheTTL: number = AUTOCOMPLETE_CONSTANTS.RECENT_CACHE_TTL
  ) {
    this.cacheKey = `autocomplete_recent_${cacheKey}`;
    this.maxCacheSize = maxCacheSize;
    this.cacheTTL = cacheTTL;
  }

  /**
   * Get all recent items from cache, removing expired ones
   */
  public getRecentItems(): RecentCacheItem[] {
    try {
      const cachedData = localStorage.getItem(this.cacheKey);
      if (!cachedData) {
        return [];
      }

      const items: RecentCacheItem[] = JSON.parse(cachedData);
      const now = Date.now();
      
      // Filter out expired items
      const validItems = items.filter(item => 
        (now - item.timestamp) < this.cacheTTL
      );

      // If items were removed due to expiration, update the cache
      if (validItems.length !== items.length) {
        this.saveItems(validItems);
      }

      // Sort by access count (descending) and then by timestamp (descending)
      return validItems.sort((a, b) => {
        if (a.accessCount !== b.accessCount) {
          return b.accessCount - a.accessCount;
        }
        return b.timestamp - a.timestamp;
      });

    } catch (error) {
      console.warn('Failed to retrieve recent cache items:', error);
      this.clearCache(); // Clear corrupted cache
      throw new AutocompleteError(
        AutocompleteErrorType.CACHE_ERROR,
        'Failed to retrieve recent selections from cache',
        error as Error
      );
    }
  }

  /**
   * Add or update an item in the recent cache
   */
  public addRecentItem(key: any, displayValue: string): void {
    try {
      const items = this.getRecentItems();
      const now = Date.now();
      
      // Find existing item
      const existingIndex = items.findIndex(item => 
        this.compareKeys(item.key, key)
      );

      if (existingIndex >= 0) {
        // Update existing item
        items[existingIndex] = {
          ...items[existingIndex],
          displayValue, // Update display value in case it changed
          timestamp: now,
          accessCount: items[existingIndex].accessCount + 1
        };
      } else {
        // Add new item
        const newItem: RecentCacheItem = {
          key,
          displayValue,
          timestamp: now,
          accessCount: 1
        };

        items.unshift(newItem);
      }

      // Limit cache size
      const trimmedItems = items.slice(0, this.maxCacheSize);
      this.saveItems(trimmedItems);

    } catch (error) {
      console.warn('Failed to add item to recent cache:', error);
      throw new AutocompleteError(
        AutocompleteErrorType.CACHE_ERROR,
        'Failed to save recent selection to cache',
        error as Error
      );
    }
  }

  /**
   * Remove an item from the recent cache
   */
  public removeRecentItem(key: any): void {
    try {
      const items = this.getRecentItems();
      const filteredItems = items.filter(item => 
        !this.compareKeys(item.key, key)
      );

      if (filteredItems.length !== items.length) {
        this.saveItems(filteredItems);
      }
    } catch (error) {
      console.warn('Failed to remove item from recent cache:', error);
      throw new AutocompleteError(
        AutocompleteErrorType.CACHE_ERROR,
        'Failed to remove item from recent selections cache',
        error as Error
      );
    }
  }

  /**
   * Clear all recent items from cache
   */
  public clearCache(): void {
    try {
      localStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.warn('Failed to clear recent cache:', error);
      throw new AutocompleteError(
        AutocompleteErrorType.CACHE_ERROR,
        'Failed to clear recent selections cache',
        error as Error
      );
    }
  }

  /**
   * Get recent items excluding specified keys (for filtering out selected items)
   */
  public getRecentItemsExcluding(excludeKeys: any[]): RecentCacheItem[] {
    const allItems = this.getRecentItems();
    return allItems.filter(item => 
      !excludeKeys.some(excludeKey => 
        this.compareKeys(item.key, excludeKey)
      )
    );
  }

  /**
   * Check if cache is available and functional
   */
  public isCacheAvailable(): boolean {
    try {
      const testKey = `${this.cacheKey}_test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get cache statistics for debugging
   */
  public getCacheStats(): {
    totalItems: number;
    cacheSize: string;
    oldestItem?: Date;
    newestItem?: Date;
  } {
    try {
      const items = this.getRecentItems();
      const cacheData = localStorage.getItem(this.cacheKey);
      const cacheSize = cacheData ? new Blob([cacheData]).size : 0;

      return {
        totalItems: items.length,
        cacheSize: this.formatBytes(cacheSize),
        oldestItem: items.length > 0 ? new Date(Math.min(...items.map(i => i.timestamp))) : undefined,
        newestItem: items.length > 0 ? new Date(Math.max(...items.map(i => i.timestamp))) : undefined,
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return {
        totalItems: 0,
        cacheSize: '0 B'
      };
    }
  }

  /**
   * Save items to localStorage
   */
  private saveItems(items: RecentCacheItem[]): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(items));
    } catch (error) {
      // Handle storage quota exceeded
      if (error instanceof DOMException && error.code === 22) {
        console.warn('LocalStorage quota exceeded, clearing cache');
        this.clearCache();
        throw new AutocompleteError(
          AutocompleteErrorType.CACHE_ERROR,
          'Storage quota exceeded. Recent selections cache has been cleared.',
          error
        );
      }
      throw error;
    }
  }

  /**
   * Compare two keys for equality (handles different types)
   */
  private compareKeys(key1: any, key2: any): boolean {
    // Handle null/undefined
    if (key1 == null && key2 == null) return true;
    if (key1 == null || key2 == null) return false;

    // Handle objects
    if (typeof key1 === 'object' && typeof key2 === 'object') {
      return JSON.stringify(key1) === JSON.stringify(key2);
    }

    // Handle primitives
    return key1 === key2;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

/**
 * Create a new cache manager instance
 */
export const createCacheManager = (
  cacheKey: string,
  maxCacheSize?: number,
  cacheTTL?: number
): RecentCacheManager => {
  return new RecentCacheManager(cacheKey, maxCacheSize, cacheTTL);
};

/**
 * Global cache cleanup utility - removes expired caches across all instances
 */
export const cleanupExpiredCaches = (): void => {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('autocomplete_recent_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const items: RecentCacheItem[] = JSON.parse(data);
            const validItems = items.filter(item => 
              (now - item.timestamp) < AUTOCOMPLETE_CONSTANTS.RECENT_CACHE_TTL
            );

            if (validItems.length === 0) {
              keysToRemove.push(key);
            } else if (validItems.length !== items.length) {
              // Update with valid items only
              localStorage.setItem(key, JSON.stringify(validItems));
            }
          }
        } catch (error) {
          // Remove corrupted entries
          keysToRemove.push(key);
        }
      }
    }

    // Remove expired/corrupted entries
    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} expired autocomplete caches`);
    }

  } catch (error) {
    console.warn('Failed to cleanup expired caches:', error);
  }
};
