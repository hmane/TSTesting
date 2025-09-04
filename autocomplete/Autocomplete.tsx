// Autocomplete.tsx
import * as React from 'react';
import { TextBox } from 'devextreme-react/text-box';
import { TagBox } from 'devextreme-react/tag-box';
import { useTheme } from '@fluentui/react/lib/Theme';
import { 
  AutocompleteProps, 
  isSingleSelect, 
  isMultiSelect,
  AUTOCOMPLETE_CONSTANTS 
} from './types/AutocompleteTypes';
import { useEnhancedDataSource } from './hooks/useEnhancedDataSource';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLoadingState } from './hooks/useLoadingState';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/Autocomplete.scss';

/**
 * Internal Autocomplete component (wrapped by ErrorBoundary)
 */
const AutocompleteInner: React.FC<AutocompleteProps> = (props) => {
  const {
    // Core props
    dataSource,
    displayExpr,
    valueExpr,
    maxSelect = 1,
    value,
    defaultValue,
    onValueChanged,
    
    // Search behavior
    minSearchLength = AUTOCOMPLETE_CONSTANTS.DEFAULT_MIN_SEARCH_LENGTH,
    searchTimeout = AUTOCOMPLETE_CONSTANTS.DEFAULT_SEARCH_TIMEOUT,
    
    // Performance & caching
    enableRecentCache = false,
    recentCacheKey,
    
    // Loading & UI
    showLoadingSpinner = true,
    
    // Keyboard
    enableKeyboardShortcuts = true,
    keyboardScope,
    
    // Events
    onSelectionLimitReached,
    onDataSourceError,
    
    // DevExtreme pass-through props
    ...devExtremeProps
  } = props;

  const theme = useTheme();
  const isMultiSelectMode = isMultiSelect(props);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Get current selected items for exclusion
  const selectedItems = React.useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Enhanced data source with caching and exclusion
  const { dataSource: enhancedDataSource, cacheHelpers } = useEnhancedDataSource({
    dataSource,
    enableRecentCache,
    recentCacheKey,
    excludeSelected: selectedItems,
    onError: onDataSourceError
  });

  // Loading state management
  const { isLoading, loadingSpinnerProps } = useLoadingState({
    dataSource: enhancedDataSource,
    showSpinner: showLoadingSpinner
  });

  // Keyboard shortcuts
  const { componentRef } = useKeyboardShortcuts({
    enabled: enableKeyboardShortcuts,
    scope: keyboardScope,
    maxSelect,
    onValueChanged,
    currentValue: value,
    onSelectAll: () => {
      // Note: SelectAll would need to be implemented based on current dataset
      // This is a placeholder for the functionality
      console.warn('SelectAll functionality needs to be implemented with access to full dataset');
    }
  });

  // Handle value changes with cache management
  const handleValueChanged = React.useCallback((e: any) => {
    const newValue = e.value;
    
    // Check selection limit for multi-select
    if (isMultiSelectMode && Array.isArray(newValue) && maxSelect > 1) {
      if (newValue.length > maxSelect) {
        if (onSelectionLimitReached) {
          onSelectionLimitReached();
        }
        return; // Don't allow exceeding the limit
      }
    }

    // Add to recent cache if enabled
    if (enableRecentCache && recentCacheKey && newValue) {
      try {
        if (isMultiSelectMode && Array.isArray(newValue)) {
          // Add the last selected item to cache
          const lastItem = newValue[newValue.length - 1];
          if (lastItem) {
            const displayValue = typeof displayExpr === 'function' 
              ? displayExpr(lastItem)
              : lastItem[displayExpr as string] || String(lastItem);
            
            const keyValue = typeof lastItem === 'object' 
              ? lastItem[valueExpr as string]
              : lastItem;
              
            cacheHelpers.addToRecentCache(keyValue, displayValue);
          }
        } else if (!isMultiSelectMode && newValue) {
          const displayValue = typeof displayExpr === 'function' 
            ? displayExpr(newValue)
            : newValue[displayExpr as string] || String(newValue);
          
          const keyValue = typeof newValue === 'object' 
            ? newValue[valueExpr as string]
            : newValue;
            
          cacheHelpers.addToRecentCache(keyValue, displayValue);
        }
      } catch (error) {
        console.warn('Failed to add item to recent cache:', error);
      }
    }

    // Call the original handler
    onValueChanged(newValue);
  }, [
    isMultiSelectMode, 
    maxSelect, 
    onSelectionLimitReached, 
    enableRecentCache, 
    recentCacheKey, 
    displayExpr, 
    valueExpr, 
    cacheHelpers, 
    onValueChanged
  ]);

  // Merge component refs
  const mergedRef = React.useCallback((node: HTMLDivElement | null) => {
    if (containerRef.current !== node) {
      containerRef.current = node;
    }
    if (componentRef.current !== node) {
      componentRef.current = node as HTMLElement;
    }
  }, [componentRef]);

  // Common props for both TextBox and TagBox
  const commonProps = {
    ...devExtremeProps,
    dataSource: enhancedDataSource,
    displayExpr,
    valueExpr,
    value,
    defaultValue,
    searchTimeout,
    minSearchLength,
    searchEnabled: true,
    onValueChanged: handleValueChanged,
    // Apply SharePoint theme colors
    elementAttr: {
      ...devExtremeProps.elementAttr,
      'data-autocomplete-scope': keyboardScope,
      style: {
        '--dx-color-primary': theme.palette.themePrimary,
        '--dx-color-primary-hover': theme.palette.themeDarkAlt,
        '--dx-color-border': theme.palette.neutralTertiary,
        '--dx-color-border-hover': theme.palette.themePrimary,
        '--dx-color-text': theme.palette.neutralPrimary,
        '--dx-color-text-secondary': theme.palette.neutralSecondary,
        '--dx-color-background': theme.palette.white,
        '--dx-color-background-hover': theme.palette.neutralLighter,
        ...devExtremeProps.elementAttr?.style
      }
    }
  };

  // Render appropriate component based on maxSelect
  const renderInputComponent = () => {
    if (isSingleSelect(props)) {
      return (
        <TextBox
          {...commonProps}
          acceptCustomValue={false}
          showClearButton={devExtremeProps.showClearButton}
        />
      );
    }

    if (isMultiSelect(props)) {
      return (
        <TagBox
          {...commonProps}
          maxDisplayedTags={props.maxDisplayedTags || 3}
          showMultiTagOnly={props.showMultiTagOnly || false}
          multiline={props.multiline || false}
          selectAllMode={props.selectAllMode || 'page'}
          showSelectionControls={props.showSelectionControls || false}
          maxLength={maxSelect > 1 ? maxSelect : undefined}
        />
      );
    }

    return null;
  };

  return (
    <div 
      ref={mergedRef}
      className={`autocomplete-container ${isMultiSelectMode ? 'autocomplete-container--multi' : 'autocomplete-container--single'}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%'
      }}
    >
      {renderInputComponent()}
      
      {showLoadingSpinner && (
        <LoadingSpinner
          {...loadingSpinnerProps}
          position="right"
          ariaLabel="Loading autocomplete options"
        />
      )}
    </div>
  );
};

/**
 * Main Autocomplete component with error boundary
 */
export const Autocomplete: React.FC<AutocompleteProps> = (props) => {
  return (
    <ErrorBoundary 
      componentName="Autocomplete"
      onError={props.onDataSourceError}
    >
      <AutocompleteInner {...props} />
    </ErrorBoundary>
  );
};

// Export display name for debugging
Autocomplete.displayName = 'Autocomplete';

// Default props for easier usage
export const AutocompleteDefaults = {
  maxSelect: 1,
  minSearchLength: AUTOCOMPLETE_CONSTANTS.DEFAULT_MIN_SEARCH_LENGTH,
  searchTimeout: AUTOCOMPLETE_CONSTANTS.DEFAULT_SEARCH_TIMEOUT,
  enableRecentCache: false,
  showLoadingSpinner: true,
  enableKeyboardShortcuts: true,
  showClearButton: true
} as const;

/**
 * Helper function to create autocomplete props with defaults
 */
export const createAutocompleteProps = (
  overrides: Partial<AutocompleteProps>
): AutocompleteProps => {
  return {
    ...AutocompleteDefaults,
    ...overrides
  } as AutocompleteProps;
};

/**
 * Utility component for simple single-select scenarios
 */
export const SimpleAutocomplete: React.FC<Omit<AutocompleteProps, 'maxSelect'>> = (props) => {
  return <Autocomplete {...props} maxSelect={1} />;
};

/**
 * Utility component for multi-select scenarios
 */
export const MultiAutocomplete: React.FC<Omit<AutocompleteProps, 'maxSelect'> & { maxSelect: number }> = (props) => {
  return <Autocomplete {...props} />;
};

// Export for backwards compatibility and convenience
export default Autocomplete;
