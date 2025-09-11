// types/AutocompleteTypes.ts
import type { Options as TagBoxOptions } from 'devextreme-react/tag-box';
import type { Options as TextBoxOptions } from 'devextreme-react/text-box';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

// Base props shared by both modes
export interface BaseAutocompleteProps<TFieldValues extends FieldValues = FieldValues> {
  // Core Data
  dataSource: DataSource | CustomStore | any[];
  displayExpr: string | ((item: any) => string);
  valueExpr: string;

  // Selection
  maxSelect?: number;
  onValueChanged: (value: any | any[]) => void;

  // Search Behavior
  minSearchLength?: number;
  searchTimeout?: number;

  // Performance & Caching
  enableRecentCache?: boolean;
  recentCacheKey?: string;

  // Loading & UI
  showLoadingSpinner?: boolean;

  // Keyboard
  enableKeyboardShortcuts?: boolean;
  keyboardScope?: string;

  // Events
  onSelectionLimitReached?: () => void;
  onDataSourceError?: (error: Error) => void;

  // React Hook Form integration (optional)
  name?: FieldPath<TFieldValues>;
  control?: Control<TFieldValues>;
}

// Single Select Mode (extends TextBox)
export interface SingleSelectProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseAutocompleteProps<TFieldValues>,
    Omit<
      TextBoxOptions,
      | 'value'
      | 'onValueChanged'
      | 'dataSource'
      | 'onValueChange'
      | 'displayExpr'
      | 'valueExpr'
      | 'searchTimeout'
      | 'minSearchLength'
    > {
  maxSelect?: 1;
  value?: any;
  defaultValue?: any;
}

// Multi Select Mode (extends TagBox)
export interface MultiSelectProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseAutocompleteProps<TFieldValues>,
    Omit<
      TagBoxOptions,
      | 'value'
      | 'onValueChanged'
      | 'dataSource'
      | 'onValueChange'
      | 'displayExpr'
      | 'valueExpr'
      | 'searchTimeout'
      | 'minSearchLength'
    > {
  maxSelect: number; // > 1
  value?: any[];
  defaultValue?: any[];
}

// Union type for component props
export type AutocompleteProps<TFieldValues extends FieldValues = FieldValues> =
  | SingleSelectProps<TFieldValues>
  | MultiSelectProps<TFieldValues>;

// Type guards with proper generic support
export const isSingleSelect = <TFieldValues extends FieldValues = FieldValues>(
  props: AutocompleteProps<TFieldValues>
): props is SingleSelectProps<TFieldValues> => {
  return (props.maxSelect ?? 1) === 1;
};

export const isMultiSelect = <TFieldValues extends FieldValues = FieldValues>(
  props: AutocompleteProps<TFieldValues>
): props is MultiSelectProps<TFieldValues> => {
  return (props.maxSelect ?? 1) > 1;
};

// Enhanced DataSource options
export interface EnhancedDataSourceOptions {
  dataSource: DataSource | CustomStore | any[];
  enableRecentCache?: boolean;
  recentCacheKey?: string;
  excludeSelected?: any[];
  onError?: (error: Error) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

// Recent cache item structure
export interface RecentCacheItem {
  key: any;
  displayValue: string;
  timestamp: number;
  accessCount: number;
}

// Loading state interface
export interface LoadingState {
  isLoading: boolean;
  error?: Error;
}

// Keyboard shortcut configuration
export interface KeyboardShortcutConfig {
  enabled: boolean;
  scope?: string;
  maxSelect: number;
  onValueChanged: (value: any | any[]) => void;
  currentValue?: any | any[];
  onSelectAll?: () => void;
  onClearAll?: () => void;
  onRemoveLast?: () => void;
  onOpenDropdown?: () => void;
  onCloseDropdown?: () => void;
  onFocus?: () => void;
}

// Data source load options interface
export interface DataSourceLoadOptions {
  searchValue?: string;
  searchExpr?: string | string[];
  searchOperation?: 'contains' | 'startswith' | 'equals';
  take?: number;
  skip?: number;
  filter?: any;
  sort?: any;
  userData?: {
    valueField?: string;
    displayField?: string;
    [key: string]: any;
  };
}

// Load result interface
export interface LoadResult {
  data: any[];
  totalCount?: number;
}

// Cache statistics interface
export interface CacheStats {
  totalItems: number;
  cacheSize: string;
  oldestItem?: Date;
  newestItem?: Date;
}

// Cache helpers interface
export interface CacheHelpers {
  addToRecentCache: (key: any, displayValue: string) => void;
  removeFromRecentCache: (key: any) => void;
  clearRecentCache: () => void;
  getCacheStats: () => CacheStats | null;
}

// Enhanced data source result interface
export interface EnhancedDataSourceResult {
  dataSource: DataSource;
  cacheHelpers: CacheHelpers;
  isLoading: boolean;
}

// Loading spinner props interface
export interface LoadingSpinnerProps {
  visible?: boolean;
  position?: 'right' | 'overlay' | 'inline';
  size?: 'small' | 'medium' | 'large';
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  delay?: number;
}

// Error boundary props interface
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
}

// Error boundary state interface
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

// Component constants
export const AUTOCOMPLETE_CONSTANTS = {
  DEFAULT_SEARCH_TIMEOUT: 300,
  DEFAULT_MIN_SEARCH_LENGTH: 1,
  DEFAULT_RECENT_CACHE_SIZE: 10,
  RECENT_CACHE_TTL: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  LOADING_SPINNER_DELAY: 200, // Minimum delay to show spinner
  MAX_RETRIES: 3,
  DEBOUNCE_DELAY: 100,
  MINIMUM_LOADING_TIME: 200,
} as const;

// Error types enum
export enum AutocompleteErrorType {
  DATA_SOURCE_ERROR = 'DATA_SOURCE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

// Custom error class
export class AutocompleteError extends Error {
  public readonly type: AutocompleteErrorType;
  public readonly originalError?: Error;
  public readonly timestamp: number;
  public readonly errorId: string;

  constructor(type: AutocompleteErrorType, message: string, originalError?: Error) {
    super(message);
    this.name = 'AutocompleteError';
    this.type = type;
    this.originalError = originalError;
    this.timestamp = Date.now();
    this.errorId = this.generateErrorId();

    // Maintains proper stack trace in browsers that support it
    if ('captureStackTrace' in Error && typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, AutocompleteError);
    }
  }

  private generateErrorId(): string {
    return `autocomplete-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      timestamp: this.timestamp,
      errorId: this.errorId,
      stack: this.stack,
      originalError: this.originalError?.message,
    };
  }
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Performance metrics interface
export interface PerformanceMetrics {
  loadTime: number;
  searchTime: number;
  renderTime: number;
  cacheHitRate: number;
}

// Quick start configuration types
export interface QuickStartConfig {
  dataSource: any[];
  displayField: string;
  valueField: string;
  placeholder?: string;
  maxSelect?: number;
  enableCache?: boolean;
  cacheKey?: string;
}

// Data source helper types
export interface StaticDataSourceConfig {
  items: any[];
  searchFields: string[];
  searchOperation: 'contains' | 'startswith' | 'equals';
}

export interface RestApiDataSourceConfig {
  baseUrl: string;
  searchParam: string;
  pageParam: string;
  limitParam: string;
  headers?: Record<string, string>;
  transformResponse?: (data: any) => { items: any[]; totalCount: number };
}

// SharePoint specific types
export interface SharePointListConfig {
  listTitle: string;
  siteUrl?: string;
  selectFields: string[];
  filterFields?: string[];
  orderBy?: string;
}

// Component metadata type
export interface ComponentMetadata {
  name: string;
  version: string;
  description: string;
  features: readonly string[];
  dependencies: Record<string, string>;
}

// Keyboard shortcut information type
export interface KeyboardShortcutInfo {
  key: string;
  description: string;
  condition?: string;
}

// Development utilities types
export interface DevUtilsValidationOptions {
  strict?: boolean;
  warningsAsErrors?: boolean;
}

export interface DevUtilsPerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
}

// Export all utility types for external use
export type { default as CustomStore } from 'devextreme/data/custom_store';
export type { default as DataSource } from 'devextreme/data/data_source';

export type { TagBoxOptions, TextBoxOptions };

// Type predicate helpers
export const isDataSource = (value: any): value is DataSource => {
  return value instanceof DataSource;
};

export const isCustomStore = (value: any): value is CustomStore => {
  return value instanceof CustomStore;
};

export const isStaticArray = (value: any): value is any[] => {
  return Array.isArray(value);
};

// Utility type for extracting value type from autocomplete props
export type AutocompleteValue<T extends AutocompleteProps> = T extends SingleSelectProps
  ? any
  : T extends MultiSelectProps
  ? any[]
  : never;

// Utility type for creating strongly typed autocomplete props
export type TypedAutocompleteProps<
  TData,
  TValue = any,
  TFieldValues extends FieldValues = FieldValues
> = Omit<AutocompleteProps<TFieldValues>, 'dataSource' | 'value' | 'onValueChanged'> & {
  dataSource: TData[] | DataSource | CustomStore;
  value?: TValue;
  onValueChanged: (value: TValue) => void;
};
