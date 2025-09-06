// index.ts - Main export file for Autocomplete component
// Location: src/webparts/[your-webpart]/components/Autocomplete/index.ts

// Main component exports
export {
  Autocomplete,
  AutocompleteDefaults,
  createAutocompleteProps,
  Autocomplete as default,
  MultiAutocomplete,
  SimpleAutocomplete,
} from './Autocomplete';

// Type exports
export type {
  AutocompleteProps,
  BaseAutocompleteProps,
  EnhancedDataSourceOptions,
  KeyboardShortcutConfig,
  LoadingState,
  MultiSelectProps,
  RecentCacheItem,
  SingleSelectProps,
} from './AutocompleteTypes';

export {
  AUTOCOMPLETE_CONSTANTS,
  AutocompleteError,
  AutocompleteErrorType,
  isMultiSelect,
  isSingleSelect,
} from './AutocompleteTypes';

// Hook exports
export { useEnhancedDataSource } from './hooks/useEnhancedDataSource';
export {
  getAvailableShortcuts,
  useKeyboardShortcutHelpers,
  useKeyboardShortcuts,
} from './hooks/useKeyboardShortcuts';
export { useLoadingState, useManualLoadingState } from './hooks/useLoadingState';

// Component exports
export { ErrorBoundary } from './components/ErrorBoundary';
export {
  DotsSpinner,
  LoadingSpinner,
  PulseSpinner,
  SkeletonLoader,
} from './components/LoadingSpinner';

// Utility exports
export {
  cleanupExpiredCaches,
  createCacheManager,
  getGlobalCacheStats,
  isLocalStorageAvailable,
  RecentCacheManager,
} from './utils/cacheUtils';

// Helper utilities
export { DevUtils } from './DevUtils';
export { QuickStartConfigs } from './QuickStartConfigs';

// Re-export DevExtreme types for convenience
export type { Options as TagBoxOptions } from 'devextreme-react/tag-box';
export type { Options as TextBoxOptions } from 'devextreme-react/text-box';
export type { default as CustomStore } from 'devextreme/data/custom_store';
export type { default as DataSource } from 'devextreme/data/data_source';

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
  description:
    'Enhanced autocomplete component for SharePoint Framework with DevExtreme and Fluent UI integration',
  features: [
    'Single and multi-select modes',
    'Recent selections caching',
    'SharePoint theme integration',
    'Keyboard shortcuts',
    'Loading states',
    'Error handling',
    'Accessibility support',
    'TypeScript support',
  ],
  dependencies: {
    devextreme: '^22.2.3',
    'devextreme-react': '^22.2.3',
    '@fluentui/react': '^8.x',
    react: '^17.x',
  },
} as const;
