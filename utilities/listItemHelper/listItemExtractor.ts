import { FieldMapping, SafeExtractionResult } from './types';
import { convertFieldValue } from './fieldConverter';

/**
 * Extract values from a SharePoint list item using field mapping
 * Throws error if any field conversion fails
 * @param item - SharePoint list item
 * @param fieldMapping - Mapping of property names to field schemas
 * @returns Extracted object of type T
 */
export function extract<T = any>(item: any, fieldMapping: FieldMapping): T {
  if (!item) {
    throw new Error('Item is null or undefined');
  }

  const result: any = {};

  for (const [propertyName, fieldSchema] of Object.entries(fieldMapping)) {
    const fieldValue = item[fieldSchema.internalName];
    const convertedValue = convertFieldValue(fieldValue, fieldSchema.type);

    result[propertyName] = convertedValue;
  }

  return result as T;
}

/**
 * Safely extract values from a SharePoint list item using field mapping
 * Continues processing even if individual fields fail conversion
 * @param item - SharePoint list item
 * @param fieldMapping - Mapping of property names to field schemas
 * @returns Object containing successfully extracted data and any conversion errors
 */
export function safeExtract<T = any>(
  item: any,
  fieldMapping: FieldMapping
): SafeExtractionResult<T> {
  const data: Partial<T> = {};
  const errors: Record<string, Error> = {};

  if (!item) {
    const error = new Error('Item is null or undefined');

    // Add error for all fields
    for (const propertyName of Object.keys(fieldMapping)) {
      errors[propertyName] = error;
    }

    return { data, errors };
  }

  for (const [propertyName, fieldSchema] of Object.entries(fieldMapping)) {
    try {
      const fieldValue = item[fieldSchema.internalName];
      const convertedValue = convertFieldValue(fieldValue, fieldSchema.type);

      (data as any)[propertyName] = convertedValue;
    } catch (error) {
      const conversionError = error instanceof Error ? error : new Error(String(error));
      errors[propertyName] = conversionError;
    }
  }

  return { data, errors };
}
