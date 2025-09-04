// index.ts - Main export file for Autocomplete component
// Location: src/webparts/[your-webpart]/components/Autocomplete/index.ts

// Main component exports
export { 
  Autocomplete as default,
  Autocomplete,
  SimpleAutocomplete,
  MultiAutocomplete,
  AutocompleteDefaults,
  createAutocompleteProps
} from './Autocomplete';

// Type exports
export type {
  AutocompleteProps,
  SingleSelectProps,
  MultiSelectProps,
  BaseAutocompleteProps,
  EnhancedDataSourceOptions,
  RecentCacheItem,
  LoadingState,
  KeyboardShortcutConfig
} from './types/AutocompleteTypes';

export {
  isSingleSelect,
  isMultiSelect,
  AUTOCOMPLETE_CONSTANTS,
  AutocompleteError,
  AutocompleteErrorType
} from './types/AutocompleteTypes';

// Hook exports
export { useEnhancedDataSource } from './hooks/useEnhancedDataSource';
export { useKeyboardShortcuts, useKeyboardShortcutHelpers, getAvailableShortcuts } from './hooks/useKeyboardShortcuts';
export { useLoadingState, useManualLoadingState } from './hooks/useLoadingState';

// Component exports
export { LoadingSpinner, PulseSpinner, DotsSpinner, SkeletonLoader } from './components/LoadingSpinner';
export { ErrorBoundary } from './components/ErrorBoundary';

// Utility exports
export { 
  RecentCacheManager,
  createCacheManager,
  cleanupExpiredCaches
} from './utils/cacheUtils';

// Re-export DevExtreme types for convenience
export type { DataSource, CustomStore } from 'devextreme/data';
export type { dxTextBoxOptions } from 'devextreme/ui/text_box';
export type { dxTagBoxOptions } from 'devextreme/ui/tag_box';

/**
 * Version information
 */
export const AUTOCOMPLETE_VERSION = '1.0.0';

/**
 * Component metadata for debugging and documentation
 */
export const AUTOCOMPLETE_METADATA = {
  name: 'Autocomplete',
  version: AUTOCOMPLETE_VERSION,
  description: 'Enhanced autocomplete component for SharePoint Framework with DevExtreme and Fluent UI integration',
  features: [
    'Single and multi-select modes',
    'Recent selections caching',
    'SharePoint theme integration',
    'Keyboard shortcuts',
    'Loading states',
    'Error handling',
    'Accessibility support',
    'TypeScript support'
  ],
  dependencies: {
    'devextreme': '^22.x',
    '@fluentui/react': '^8.x',
    'react': '^17.x'
  }
} as const;

/**
 * Quick start configuration helpers
 */
export const QuickStartConfigs = {
  /**
   * Basic single-select autocomplete
   */
  basic: (dataSource: any[], displayField: string = 'title', valueField: string = 'id') => 
    createAutocompleteProps({
      dataSource,
      displayExpr: displayField,
      valueExpr: valueField,
      maxSelect: 1,
      placeholder: 'Select an item...'
    }),

  /**
   * Multi-select with recent cache
   */
  multiSelectWithCache: (
    dataSource: any[], 
    displayField: string = 'title', 
    valueField: string = 'id',
    cacheKey: string = 'default',
    maxSelect: number = 5
  ) => createAutocompleteProps({
    dataSource,
    displayExpr: displayField,
    valueExpr: valueField,
    maxSelect,
    enableRecentCache: true,
    recentCacheKey: cacheKey,
    placeholder: `Select up to ${maxSelect} items...`,
    showClearButton: true
  }),

  /**
   * SharePoint list picker configuration
   */
  sharePointList: (
    listTitle: string,
    displayField: string = 'Title',
    valueField: string = 'Id',
    siteUrl?: string
  ) => {
    // Note: Developer would need to provide their own CustomStore implementation
    // This is just a configuration template
    return createAutocompleteProps({
      dataSource: [], // Would be replaced with CustomStore
      displayExpr: displayField,
      valueExpr: valueField,
      enableRecentCache: true,
      recentCacheKey: `sp_${listTitle}`,
      placeholder: `Search ${listTitle}...`,
      minSearchLength: 2,
      searchTimeout: 500
    });
  },

  /**
   * People picker configuration
   */
  peoplePicker: (maxSelect: number = 1) => 
    createAutocompleteProps({
      dataSource: [], // Would be replaced with Graph API CustomStore
      displayExpr: 'displayName',
      valueExpr: 'id',
      maxSelect,
      enableRecentCache: true,
      recentCacheKey: 'people_picker',
      placeholder: maxSelect === 1 ? 'Select a person...' : 'Select people...',
      minSearchLength: 3,
      searchTimeout: 300
    })
} as const;

/**
 * Development utilities
 */
export const DevUtils = {
  /**
   * Log component usage statistics
   */
  logUsage: (componentProps: AutocompleteProps) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Autocomplete Component Usage');
      console.log('Props:', componentProps);
      console.log('Mode:', componentProps.maxSelect === 1 ? 'Single Select' : `Multi Select (max: ${componentProps.maxSelect})`);
      console.log('Cache Enabled:', componentProps.enableRecentCache);
      console.log('Keyboard Shortcuts:', componentProps.enableKeyboardShortcuts);
      console.groupEnd();
    }
  },

  /**
   * Validate component configuration
   */
  validateConfig: (props: AutocompleteProps): string[] => {
    const warnings: string[] = [];

    if (!props.dataSource) {
      warnings.push('dataSource is required');
    }

    if (!props.displayExpr) {
      warnings.push('displayExpr is required');
    }

    if (!props.valueExpr) {
      warnings.push('valueExpr is required');
    }

    if (!props.onValueChanged) {
      warnings.push('onValueChanged callback is required');
    }

    if (props.enableRecentCache && !props.recentCacheKey) {
      warnings.push('recentCacheKey is required when enableRecentCache is true');
    }

    if (props.maxSelect && props.maxSelect < 1) {
      warnings.push('maxSelect must be greater than 0');
    }

    if (props.minSearchLength && props.minSearchLength < 0) {
      warnings.push('minSearchLength cannot be negative');
    }

    if (process.env.NODE_ENV === 'development' && warnings.length > 0) {
      console.warn('⚠️ Autocomplete Configuration Warnings:', warnings);
    }

    return warnings;
  },

  /**
   * Get component performance metrics
   */
  getPerformanceMetrics: () => {
    if (typeof performance !== 'undefined') {
      const entries = performance.getEntriesByName('autocomplete');
      return entries.map(entry => ({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime
      }));
    }
    return [];
  }
} as const;

/**
 * Common data source creation helpers
 */
export const DataSourceHelpers = {
  /**
   * Create a static array data source with search
   */
  createStaticDataSource: (
    items: any[],
    searchFields: string[] = ['title', 'name'],
    searchOperation: 'contains' | 'startsWith' | 'equals' = 'contains'
  ) => {
    return items; // DevExtreme will handle client-side filtering
  },

  /**
   * Create a REST API data source template
   */
  createRestApiDataSource: (
    baseUrl: string,
    searchParam: string = 'search',
    pageParam: string = 'page',
    limitParam: string = 'limit'
  ) => {
    return new (require('devextreme/data').CustomStore)({
      key: 'id',
      load: (options: any) => {
        const params = new URLSearchParams();
        
        if (options.searchValue) {
          params.append(searchParam, options.searchValue);
        }
        
        if (options.skip) {
          params.append(pageParam, String(Math.floor(options.skip / (options.take || 10)) + 1));
        }
        
        if (options.take) {
          params.append(limitParam, String(options.take));
        }

        return fetch(`${baseUrl}?${params.toString()}`)
          .then(response => response.json())
          .then(data => ({
            data: data.items || data,
            totalCount: data.totalCount || data.length
          }));
      },
      byKey: (key: any) => {
        return fetch(`${baseUrl}/${key}`)
          .then(response => response.json());
      }
    });
  }
} as const;
