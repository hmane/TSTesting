// DevUtils.ts
import type { AutocompleteProps } from './AutocompleteTypes';

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
      console.log(
        'Mode:',
        componentProps.maxSelect === 1
          ? 'Single Select'
          : `Multi Select (max: ${componentProps.maxSelect})`
      );
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
        startTime: entry.startTime,
      }));
    }
    return [];
  },
} as const;
