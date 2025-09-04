// hooks/useEnhancedDataSource.ts
import { useMemo, useCallback, useRef, useEffect } from 'react';
import { DataSource, CustomStore } from 'devextreme/data';
import { createCacheManager, RecentCacheManager } from '../utils/cacheUtils';
import { 
  EnhancedDataSourceOptions, 
  AutocompleteError, 
  AutocompleteErrorType,
  AUTOCOMPLETE_CONSTANTS 
} from '../types/AutocompleteTypes';

interface DataSourceLoadOptions {
  searchValue?: string;
  searchExpr?: string | string[];
  searchOperation?: string;
  take?: number;
  skip?: number;
  filter?: any;
  sort?: any;
  userData?: any;
}

interface UseEnhancedDataSourceOptions extends EnhancedDataSourceOptions {
  onError?: (error: Error) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

interface LoadResult {
  data: any[];
  totalCount?: number;
}

/**
 * Enhanced DataSource hook that adds recent cache, excludes selected items,
 * and provides improved error handling and loading states
 */
export const useEnhancedDataSource = (options: UseEnhancedDataSourceOptions) => {
  const {
    dataSource,
    enableRecentCache = false,
    recentCacheKey,
    excludeSelected = [],
    onError,
    onLoadStart,
    onLoadEnd
  } = options;

  const cacheManagerRef = useRef<RecentCacheManager | null>(null);
  const originalDataSourceRef = useRef<DataSource | CustomStore | any[]>(dataSource);
  const loadingRef = useRef<boolean>(false);
  const lastRequestRef = useRef<string>('');

  // Initialize cache manager
  useEffect(() => {
    if (enableRecentCache && recentCacheKey) {
      try {
        cacheManagerRef.current = createCacheManager(recentCacheKey);
      } catch (error) {
        console.warn('Failed to initialize recent cache:', error);
        if (onError) {
          onError(new AutocompleteError(
            AutocompleteErrorType.CACHE_ERROR,
            'Failed to initialize recent selections cache',
            error as Error
          ));
        }
      }
    } else {
      cacheManagerRef.current = null;
    }
  }, [enableRecentCache, recentCacheKey, onError]);

  // Update original data source reference when it changes
  useEffect(() => {
    originalDataSourceRef.current = dataSource;
  }, [dataSource]);

  // Custom load function that integrates recent cache and excludes selected items
  const customLoad = useCallback(async (loadOptions: DataSourceLoadOptions): Promise<LoadResult> => {
    const requestId = `${Date.now()}-${Math.random()}`;
    lastRequestRef.current = requestId;

    try {
      if (onLoadStart) {
        onLoadStart();
      }

      loadingRef.current = true;
      let results: any[] = [];
      let totalCount: number | undefined;

      // Load data from original source
      if (originalDataSourceRef.current instanceof DataSource || originalDataSourceRef.current instanceof CustomStore) {
        // Handle DevExtreme DataSource/CustomStore
        const dataSourceInstance = originalDataSourceRef.current instanceof DataSource 
          ? originalDataSourceRef.current 
          : new DataSource({ store: originalDataSourceRef.current });

        const loadResult = await dataSourceInstance.load(loadOptions);
        
        if (Array.isArray(loadResult)) {
          results = loadResult;
        } else if (loadResult && typeof loadResult === 'object' && 'data' in loadResult) {
          results = loadResult.data || [];
          totalCount = loadResult.totalCount;
        } else {
          results = [];
        }
      } else if (Array.isArray(originalDataSourceRef.current)) {
        // Handle static array
        results = originalDataSourceRef.current;
        totalCount = results.length;

        // Apply client-side filtering if search is provided
        if (loadOptions.searchValue && loadOptions.searchExpr) {
          const searchValue = loadOptions.searchValue.toLowerCase();
          const searchFields = Array.isArray(loadOptions.searchExpr) 
            ? loadOptions.searchExpr 
            : [loadOptions.searchExpr];

          results = results.filter(item => {
            return searchFields.some(field => {
              const fieldValue = item[field];
              if (fieldValue == null) return false;
              
              const stringValue = String(fieldValue).toLowerCase();
              
              switch (loadOptions.searchOperation) {
                case 'startswith':
                  return stringValue.startsWith(searchValue);
                case 'equals':
                  return stringValue === searchValue;
                case 'contains':
                default:
                  return stringValue.includes(searchValue);
              }
            });
          });
        }

        // Apply pagination
        if (loadOptions.take) {
          const skip = loadOptions.skip || 0;
          results = results.slice(skip, skip + loadOptions.take);
        }
      }

      // Check if request is still current (prevent race conditions)
      if (lastRequestRef.current !== requestId) {
        return { data: [], totalCount: 0 };
      }

      // Exclude selected items
      if (excludeSelected && excludeSelected.length > 0) {
        results = results.filter(item => {
          const itemKey = item[loadOptions.userData?.valueField || 'id'];
          return !excludeSelected.some(selectedKey => 
            compareKeys(itemKey, selectedKey)
          );
        });
      }

      // Add recent items to the beginning if cache is enabled and no search
      if (cacheManagerRef.current && (!loadOptions.searchValue || loadOptions.searchValue.length === 0)) {
        try {
          const recentItems = cacheManagerRef.current.getRecentItemsExcluding(excludeSelected || []);
          
          // Convert recent cache items back to data items (if they're not already excluded)
          const recentDataItems = recentItems
            .map(cacheItem => {
              // Try to find the full data item from results or create a minimal one
              const fullItem = results.find(item => 
                compareKeys(item[loadOptions.userData?.valueField || 'id'], cacheItem.key)
              );
              
              return fullItem || {
                [loadOptions.userData?.valueField || 'id']: cacheItem.key,
                [loadOptions.userData?.displayField || 'title']: cacheItem.displayValue,
                _isRecentItem: true
              };
            })
            .slice(0, 3); // Limit recent items

          // Remove recent items from main results to avoid duplicates
          const recentKeys = recentDataItems.map(item => 
            item[loadOptions.userData?.valueField || 'id']
          );
          
          results = results.filter(item => {
            const itemKey = item[loadOptions.userData?.valueField || 'id'];
            return !recentKeys.some(recentKey => compareKeys(itemKey, recentKey));
          });

          // Prepend recent items
          results = [...recentDataItems, ...results];
        } catch (cacheError) {
          console.warn('Failed to load recent items:', cacheError);
          // Continue without recent items
        }
      }

      return {
        data: results,
        totalCount: totalCount ?? results.length
      };

    } catch (error) {
      console.error('DataSource load error:', error);
      
      const autocompleteError = new AutocompleteError(
        AutocompleteErrorType.DATA_SOURCE_ERROR,
        'Failed to load data from the data source',
        error as Error
      );

      if (onError) {
        onError(autocompleteError);
      }

      // Return empty result on error
      return { data: [], totalCount: 0 };
    } finally {
      loadingRef.current = false;
      
      if (onLoadEnd) {
        onLoadEnd();
      }
    }
  }, [excludeSelected, onError, onLoadStart, onLoadEnd]);

  // Custom byKey function for retrieving individual items
  const customByKey = useCallback(async (key: any): Promise<any> => {
    try {
      let result: any = null;

      // Try to get from original data source
      if (originalDataSourceRef.current instanceof DataSource || originalDataSourceRef.current instanceof CustomStore) {
        const dataSourceInstance = originalDataSourceRef.current instanceof DataSource 
          ? originalDataSourceRef.current 
          : new DataSource({ store: originalDataSourceRef.current });

        result = await dataSourceInstance.byKey(key);
      } else if (Array.isArray(originalDataSourceRef.current)) {
        // Find in static array
        result = originalDataSourceRef.current.find(item => 
          compareKeys(item.id || item.Id || item.key, key)
        );
      }

      // If not found and cache is enabled, try recent cache
      if (!result && cacheManagerRef.current) {
        try {
          const recentItems = cacheManagerRef.current.getRecentItems();
          const recentItem = recentItems.find(item => compareKeys(item.key, key));
          
          if (recentItem) {
            result = {
              [/*valueField*/ 'id']: recentItem.key,
              [/*displayField*/ 'title']: recentItem.displayValue,
              _isRecentItem: true
            };
          }
        } catch (cacheError) {
          console.warn('Failed to get item from recent cache:', cacheError);
        }
      }

      return result;
    } catch (error) {
      console.error('DataSource byKey error:', error);
      
      if (onError) {
        onError(new AutocompleteError(
          AutocompleteErrorType.DATA_SOURCE_ERROR,
          `Failed to retrieve item with key: ${key}`,
          error as Error
        ));
      }

      return null;
    }
  }, [onError]);

  // Enhanced DataSource instance
  const enhancedDataSource = useMemo(() => {
    return new DataSource({
      store: new CustomStore({
        key: 'id', // Default key field
        load: customLoad,
        byKey: customByKey
      }),
      paginate: true,
      pageSize: AUTOCOMPLETE_CONSTANTS.DEFAULT_RECENT_CACHE_SIZE
    });
  }, [customLoad, customByKey]);

  // Public methods for cache management
  const cacheHelpers = useMemo(() => ({
    addToRecentCache: (key: any, displayValue: string) => {
      if (cacheManagerRef.current) {
        try {
          cacheManagerRef.current.addRecentItem(key, displayValue);
        } catch (error) {
          console.warn('Failed to add item to recent cache:', error);
        }
      }
    },
    
    removeFromRecentCache: (key: any) => {
      if (cacheManagerRef.current) {
        try {
          cacheManagerRef.current.removeRecentItem(key);
        } catch (error) {
          console.warn('Failed to remove item from recent cache:', error);
        }
      }
    },
    
    clearRecentCache: () => {
      if (cacheManagerRef.current) {
        try {
          cacheManagerRef.current.clearCache();
        } catch (error) {
          console.warn('Failed to clear recent cache:', error);
        }
      }
    },
    
    getCacheStats: () => {
      return cacheManagerRef.current ? cacheManagerRef.current.getCacheStats() : null;
    }
  }), []);

  return {
    dataSource: enhancedDataSource,
    cacheHelpers,
    isLoading: loadingRef.current
  };
};

/**
 * Compare two keys for equality (handles different types)
 */
function compareKeys(key1: any, key2: any): boolean {
  // Handle null/undefined
  if (key1 == null && key2 == null) return true;
  if (key1 == null || key2 == null) return false;

  // Handle objects
  if (typeof key1 === 'object' && typeof key2 === 'object') {
    return JSON.stringify(key1) === JSON.stringify(key2);
  }

  // Handle primitives with type coercion
  return String(key1) === String(key2);
}
