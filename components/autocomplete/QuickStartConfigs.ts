// QuickStartConfigs.ts
import { createAutocompleteProps } from './Autocomplete';

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
      // placeholder is a DevExtreme prop, not our custom prop
      // Users should add it when using the component
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
  ) =>
    createAutocompleteProps({
      dataSource,
      displayExpr: displayField,
      valueExpr: valueField,
      maxSelect,
      enableRecentCache: true,
      recentCacheKey: cacheKey,
      // Users can add placeholder when using: { ...config, placeholder: 'Select items...' }
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
      minSearchLength: 2,
      searchTimeout: 500,
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
      minSearchLength: 3,
      searchTimeout: 300,
    }),
} as const;
