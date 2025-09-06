/**
 * SharePoint List Item Helper Utility
 * A comprehensive, type-safe utility for building SharePoint list item updates and extracting data
 */

// Export all types and interfaces
export type {
  FieldMapping, FieldSchema, IListItemFormUpdateValue, IPrincipal, SafeExtractionResult, TaxonomyFieldValue
} from './types';

// Export enums
export { SPFieldType } from './types';

// Export out-of-the-box fields
export { OOBFields } from './oobFields';

// Export main helper class
export { ListItemHelper } from './ListItemHelper';

// Export updater class for direct use
export { ListItemUpdater } from './listItemUpdater';

// Export utility functions for advanced scenarios
export { convertFieldValue } from './fieldConverter';
export { addDirectUpdateValue, formatValueByType } from './fieldFormatter';
export { extract, safeExtract } from './listItemExtractor';

