// types/AutocompleteTypes.ts
import { dxTextBoxOptions } from 'devextreme/ui/text_box';
import { dxTagBoxOptions } from 'devextreme/ui/tag_box';
import { DataSource, CustomStore } from 'devextreme/data';

// Base props shared by both modes
export interface BaseAutocompleteProps {
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
}

// Single Select Mode (extends TextBox)
export interface SingleSelectProps extends BaseAutocompleteProps, 
  Omit<dxTextBoxOptions, 'value' | 'onValueChanged' | 'dataSource' | 'onValueChange'> {
  maxSelect?: 1;
  value?: any;
  defaultValue?: any;
}

// Multi Select Mode (extends TagBox)
export interface MultiSelectProps extends BaseAutocompleteProps,
  Omit<dxTagBoxOptions, 'value' | 'onValueChanged' | 'dataSource' | 'onValueChange'> {
  maxSelect: number; // > 1
  value?: any[];
  defaultValue?: any[];
}

// Union type for component props
export type AutocompleteProps = SingleSelectProps | MultiSelectProps;

// Type guards
export const isSingleSelect = (props: AutocompleteProps): props is SingleSelectProps => {
  return (props.maxSelect ?? 1) === 1;
};

export const isMultiSelect = (props: AutocompleteProps): props is MultiSelectProps => {
  return (props.maxSelect ?? 1) > 1;
};

// Enhanced DataSource options
export interface EnhancedDataSourceOptions {
  dataSource: DataSource | CustomStore | any[];
  enableRecentCache?: boolean;
  recentCacheKey?: string;
  excludeSelected?: any[];
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
}

// Component constants
export const AUTOCOMPLETE_CONSTANTS = {
  DEFAULT_SEARCH_TIMEOUT: 300,
  DEFAULT_MIN_SEARCH_LENGTH: 1,
  DEFAULT_RECENT_CACHE_SIZE: 10,
  RECENT_CACHE_TTL: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  LOADING_SPINNER_DELAY: 200, // Minimum delay to show spinner
} as const;

// Error types
export enum AutocompleteErrorType {
  DATA_SOURCE_ERROR = 'DATA_SOURCE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class AutocompleteError extends Error {
  public readonly type: AutocompleteErrorType;
  public readonly originalError?: Error;

  constructor(type: AutocompleteErrorType, message: string, originalError?: Error) {
    super(message);
    this.name = 'AutocompleteError';
    this.type = type;
    this.originalError = originalError;
  }
}
