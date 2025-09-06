import { extract, safeExtract } from './listItemExtractor';
import { ListItemUpdater } from './listItemUpdater';
import { FieldMapping, FieldSchema, SafeExtractionResult } from './types';

/**
 * Main utility class that provides static methods for both updating and extracting SharePoint list items
 */
export class ListItemHelper {
  /**
   * Create a new type-safe updater instance for building list item updates
   * @param schema - Schema definition for the list fields
   * @returns Type-safe ListItemUpdater instance
   */
  public static createUpdater<T extends Record<string, any> = Record<string, any>>(
    schema: Record<string, FieldSchema>
  ): ListItemUpdater<T> {
    return new ListItemUpdater<T>(schema);
  }

  /**
   * Extract values from a SharePoint list item using field mapping
   * Throws error if any field conversion fails
   * @param item - SharePoint list item
   * @param fieldMapping - Mapping of property names to field schemas
   * @returns Extracted object of type T
   */
  public static extract<T = any>(item: any, fieldMapping: FieldMapping): T {
    return extract<T>(item, fieldMapping);
  }

  /**
   * Safely extract values from a SharePoint list item using field mapping
   * Continues processing even if individual fields fail conversion
   * @param item - SharePoint list item
   * @param fieldMapping - Mapping of property names to field schemas
   * @returns Object containing successfully extracted data and any conversion errors
   */
  public static safeExtract<T = any>(
    item: any,
    fieldMapping: FieldMapping
  ): SafeExtractionResult<T> {
    return safeExtract<T>(item, fieldMapping);
  }
}
