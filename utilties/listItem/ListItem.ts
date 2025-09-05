import { IListItemFormUpdateValue } from "@pnp/sp/lists";
import { Logger, LogLevel } from "@pnp/logging";
import { IPrincipal } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { SPFieldType } from "@pnp/sp/fields";
import { isEqual } from "@microsoft/sp-lodash-subset";

/**
 * Interface for Taxonomy field values
 */
export interface TaxonomyFieldValue {
  Label: string;
  TermID: string;
}

/**
 * Schema definition for a SharePoint field
 */
export interface FieldSchema {
  internalName: string;
  type: SPFieldType;
  required?: boolean;
  readonly?: boolean;
  defaultValue?: any;
}

/**
 * Type for field mapping in extraction
 */
export type FieldMapping = {
  [key: string]: FieldSchema;
};

/**
 * Result type for safe extraction
 */
export interface SafeExtractionResult<T> {
  data: Partial<T>;
  errors: Record<string, Error>;
}

/**
 * Out-of-the-box SharePoint fields that are commonly used
 */
export const OOBFields = {
  Id: { internalName: "ID", type: SPFieldType.Counter, readonly: true },
  Title: { internalName: "Title", type: SPFieldType.Text },
  CreatedBy: { internalName: "Author", type: SPFieldType.User, readonly: true },
  ModifiedBy: { internalName: "Editor", type: SPFieldType.User, readonly: true },
  Created: { internalName: "Created", type: SPFieldType.DateTime, readonly: true },
  Modified: { internalName: "Modified", type: SPFieldType.DateTime, readonly: true },
  Version: { internalName: "_UIVersionString", type: SPFieldType.Text, readonly: true },
  ContentType: { internalName: "ContentType", type: SPFieldType.Text, readonly: true },
  FileRef: { internalName: "FileRef", type: SPFieldType.Text, readonly: true }
} as const;

/**
 * Type-safe updater class for building SharePoint list item updates
 */
class ListItemUpdater<T = any> {
  private updates: IListItemFormUpdateValue[] = [];
  private logger: Logger;
  private schema: T extends any ? Record<string, FieldSchema> : { [K in keyof T]: FieldSchema };

  constructor(schema: T extends any ? Record<string, FieldSchema> : { [K in keyof T]: FieldSchema }) {
    this.schema = schema;
    this.logger = Logger.subscribe("ListItemUpdater");
    this.logger.write("ListItemUpdater initialized", LogLevel.Verbose);
  }

  /**
   * Set field value with optional comparison (type-safe when T is provided)
   * @param fieldKey - Key from the schema
   * @param value - New value to set (type-safe based on T[K])
   * @param originalValue - Optional original value for comparison. If provided, will only update if different
   */
  public setField<K extends keyof T>(
    fieldKey: K, 
    value: T[K], 
    originalValue?: T[K]
  ): ListItemUpdater<T>;
  public setField(
    fieldKey: string, 
    value: any, 
    originalValue?: any
  ): ListItemUpdater<T>;
  public setField(fieldKey: any, value: any, originalValue?: any): ListItemUpdater<T> {
    // Validate field exists and is not readonly
    this.validateField(fieldKey as string);

    const fieldSchema = this.schema[fieldKey as string];

    // If originalValue is provided (even if undefined), perform comparison
    if (arguments.length === 3) {
      if (isEqual(value, originalValue)) {
        this.logger.write(`Field '${String(fieldKey)}' unchanged, skipping update`, LogLevel.Verbose);
        return this;
      }
      this.logger.write(`Field '${String(fieldKey)}' changed from '${this.getValueForLogging(originalValue)}' to '${this.getValueForLogging(value)}'`, LogLevel.Verbose);
    }

    // Convert value based on field type and add update
    const formattedValue = this.formatValueByType(value, fieldSchema.type);
    this.addUpdate(fieldKey as string, formattedValue);
    
    return this;
  }

  /**
   * Get updates for validate methods (addValidateUpdateItemUsingPath, validateUpdateListItem)
   * @returns Array of IListItemFormUpdateValue for PnP.js validate methods
   */
  public getUpdatesForValidate(): IListItemFormUpdateValue[] {
    this.logger.write(`Generated ${this.updates.length} field updates for validate methods`, LogLevel.Verbose);
    return [...this.updates];
  }

  /**
   * Validate required fields and get updates for validate methods
   * @returns Array of IListItemFormUpdateValue for PnP.js validate methods
   */
  public validateAndGetUpdatesForValidate(): IListItemFormUpdateValue[] {
    this.validateRequiredFields();
    this.logger.write(`Generated ${this.updates.length} field updates for validate methods after validation`, LogLevel.Verbose);
    return [...this.updates];
  }

  /**
   * Get updates for PnP.js methods (item.update(), items.add())
   * Handles complex field types like User and Taxonomy properly
   * @returns Key-value object for PnP.js update methods
   */
  public getUpdates(): { [key: string]: any } {
    const updates: { [key: string]: any } = {};
    
    for (const update of this.updates) {
      const fieldKey = this.getFieldKeyByInternalName(update.FieldName);
      const fieldSchema = fieldKey ? this.schema[fieldKey] : undefined;
      
      if (fieldSchema) {
        // Handle special field types that need different formatting for direct updates
        this.addDirectUpdateValue(updates, update.FieldName, update.FieldValue, fieldSchema.type);
      } else {
        // Fallback: use the formatted value as-is
        updates[update.FieldName] = update.FieldValue;
        this.logger.write(`Could not find field schema for '${update.FieldName}', using formatted value`, LogLevel.Warning);
      }
    }
    
    this.logger.write(`Generated ${Object.keys(updates).length} field updates`, LogLevel.Verbose);
    return updates;
  }

  /**
   * Validate required fields and get updates for PnP.js methods
   * @returns Key-value object for PnP.js update methods
   */
  public validateAndGetUpdates(): { [key: string]: any } {
    this.validateRequiredFields();
    this.logger.write(`Generated updates after validation`, LogLevel.Verbose);
    return this.getUpdates();
  }

  /**
   * Clear all updates and start fresh
   */
  public clear(): ListItemUpdater<T> {
    this.updates = [];
    this.logger.write("Cleared all updates", LogLevel.Verbose);
    return this;
  }

  // Private helper methods

  private validateField(fieldKey: string): void {
    const field = this.schema[fieldKey];
    if (!field) {
      const error = `Field '${fieldKey}' not found in schema`;
      this.logger.write(error, LogLevel.Error);
      throw new Error(error);
    }

    if (field.readonly) {
      const error = `Field '${fieldKey}' is readonly and cannot be updated`;
      this.logger.write(error, LogLevel.Error);
      throw new Error(error);
    }
  }

  private validateRequiredFields(): void {
    const requiredFields = Object.keys(this.schema).filter(key => this.schema[key].required);
    const updatedFields = this.updates.map(update => {
      // Find the field key that maps to this internal name
      return Object.keys(this.schema).find(key => this.schema[key].internalName === update.FieldName);
    }).filter(Boolean);

    const missingRequiredFields = requiredFields.filter(field => !updatedFields.includes(field));

    if (missingRequiredFields.length > 0) {
      const error = `Missing required fields: ${missingRequiredFields.join(', ')}`;
      this.logger.write(error, LogLevel.Error);
      throw new Error(error);
    }

    this.logger.write("All required fields validation passed", LogLevel.Verbose);
  }

  private addUpdate(fieldKey: string, fieldValue: string): void {
    try {
      const field = this.schema[fieldKey];
      this.updates.push({
        FieldName: field.internalName,
        FieldValue: fieldValue
      });
      this.logger.write(`Added field update: ${fieldKey} (${field.internalName}) = ${fieldValue}`, LogLevel.Verbose);
    } catch (error) {
      this.logger.write(`Error adding update for field '${fieldKey}': ${error}`, LogLevel.Error);
      throw error;
    }
  }

  private getFieldKeyByInternalName(internalName: string): string | undefined {
    return Object.keys(this.schema).find(key => this.schema[key].internalName === internalName);
  }

  private addDirectUpdateValue(updates: { [key: string]: any }, internalName: string, formattedValue: string, fieldType: SPFieldType): void {
    if (formattedValue === "") {
      // Handle empty values appropriately for each field type
      switch (fieldType) {
        case SPFieldType.Text:
        case SPFieldType.Note:
        case SPFieldType.Choice:
          updates[internalName] = "";
          break;
          
        case SPFieldType.MultiChoice:
          updates[internalName] = { results: [] };
          break;
          
        case SPFieldType.UserMulti:
          updates[`${internalName}Id`] = { results: [] };
          break;
          
        case SPFieldType.LookupMulti:
          updates[`${internalName}Id`] = { results: [] };
          break;
          
        case SPFieldType.User:
          updates[`${internalName}Id`] = undefined;
          break;
          
        case SPFieldType.Lookup:
          updates[`${internalName}Id`] = undefined;
          break;
          
        case SPFieldType.TaxonomyFieldType:
          // Clear both the main field and hidden field
          updates[internalName] = undefined;
          updates[`${internalName}_0`] = undefined;
          break;
          
        default:
          updates[internalName] = undefined;
      }
      return;
    }

    try {
      switch (fieldType) {
        case SPFieldType.Text:
        case SPFieldType.Note:
        case SPFieldType.Choice:
          updates[internalName] = formattedValue;
          break;

        case SPFieldType.Number:
        case SPFieldType.Currency:
        case SPFieldType.Counter:
          updates[internalName] = parseFloat(formattedValue);
          break;

        case SPFieldType.Boolean:
          updates[internalName] = formattedValue === "1";
          break;

        case SPFieldType.DateTime:
          updates[internalName] = new Date(formattedValue);
          break;

        case SPFieldType.User:
          // For single user, PnP.js expects FieldNameId
          updates[`${internalName}Id`] = parseInt(formattedValue);
          break;

        case SPFieldType.UserMulti:
          // For multi-user, PnP.js expects FieldNameId with results array
          if (formattedValue.includes(";#")) {
            const userIds = formattedValue.split(";#").map(id => parseInt(id));
            updates[`${internalName}Id`] = { results: userIds };
          } else {
            updates[`${internalName}Id`] = { results: [parseInt(formattedValue)] };
          }
          break;

        case SPFieldType.Lookup:
          // For single lookup, PnP.js expects FieldNameId
          updates[`${internalName}Id`] = parseInt(formattedValue);
          break;

        case SPFieldType.LookupMulti:
          // For multi-lookup, PnP.js expects FieldNameId with results array
          if (formattedValue.includes(";#")) {
            const lookupIds = formattedValue.split(";#").map(id => parseInt(id));
            updates[`${internalName}Id`] = { results: lookupIds };
          } else {
            updates[`${internalName}Id`] = { results: [parseInt(formattedValue)] };
          }
          break;

        case SPFieldType.MultiChoice:
          // For multi-choice, PnP.js expects results array
          if (formattedValue.includes(";#")) {
            updates[internalName] = { results: formattedValue.split(";#") };
          } else {
            updates[internalName] = { results: [formattedValue] };
          }
          break;

        case SPFieldType.TaxonomyFieldType:
          // For taxonomy, we need to handle both the main field and hidden field
          // Format: "Label|TermID"
          if (formattedValue.includes("|")) {
            const [label, termId] = formattedValue.split("|");
            
            // Set the main taxonomy field
            updates[internalName] = {
              Label: label,
              TermGuid: termId,
              WssId: -1 // Let SharePoint assign the WssId
            };
            
            // Set the hidden taxonomy field (typically FieldName_0)
            updates[`${internalName}_0`] = `${label}|${termId}`;
          } else {
            updates[internalName] = formattedValue;
          }
          break;

        default:
          this.logger.write(`Unknown field type '${SPFieldType[fieldType]}' for direct update, using formatted value`, LogLevel.Warning);
          updates[internalName] = formattedValue;
      }
    } catch (error) {
      this.logger.write(`Error converting formatted value '${formattedValue}' for field type '${SPFieldType[fieldType]}': ${error}`, LogLevel.Warning);
      updates[internalName] = formattedValue; // Return as-is if conversion fails
    }
  }

  private formatValueByType(value: any, fieldType: SPFieldType): string {
    // Handle null/undefined values - clear the field in SharePoint
    if (value === null || value === undefined) {
      return "";
    }

    try {
      switch (fieldType) {
        case SPFieldType.Text:
        case SPFieldType.Note:
        case SPFieldType.Choice:
          return value.toString();

        case SPFieldType.Number:
        case SPFieldType.Currency:
        case SPFieldType.Counter:
          return typeof value === 'number' ? value.toString() : parseFloat(value).toString();

        case SPFieldType.Boolean:
          return value ? "1" : "0";

        case SPFieldType.DateTime:
          if (value instanceof Date) {
            return value.toISOString();
          }
          return new Date(value).toISOString();

        case SPFieldType.User:
          if (typeof value === 'object' && value !== null && 'id' in value) {
            return (value as IPrincipal).id.toString();
          }
          throw new Error("User field requires IPrincipal object with id property");

        case SPFieldType.UserMulti:
          if (Array.isArray(value)) {
            return value.map(person => (person as IPrincipal).id).join(";#");
          }
          throw new Error("Multi-user field requires array of IPrincipal objects");

        case SPFieldType.Lookup:
          return typeof value === 'number' ? value.toString() : parseInt(value).toString();

        case SPFieldType.LookupMulti:
          if (Array.isArray(value)) {
            return value.map(id => typeof id === 'number' ? id : parseInt(id)).join(";#");
          }
          throw new Error("Multi-lookup field requires array of numbers");

        case SPFieldType.MultiChoice:
          if (Array.isArray(value)) {
            return value.join(";#");
          }
          throw new Error("Multi-choice field requires array of strings");

        case SPFieldType.TaxonomyFieldType:
          if (typeof value === 'object' && value !== null && 'Label' in value && 'TermID' in value) {
            const taxValue = value as TaxonomyFieldValue;
            return `${taxValue.Label}|${taxValue.TermID}`;
          }
          throw new Error("Taxonomy field requires TaxonomyFieldValue object with Label and TermID properties");

        default:
          this.logger.write(`Unknown field type '${SPFieldType[fieldType]}', converting to string`, LogLevel.Warning);
          return value.toString();
      }
    } catch (error) {
      const errorMsg = `Error formatting value for field type '${SPFieldType[fieldType]}': ${error}`;
      this.logger.write(errorMsg, LogLevel.Error);
      throw new Error(errorMsg);
    }
  }

  private getValueForLogging(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return `[${value.join(', ')}]`;
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  }
}

/**
 * Main utility class that provides static methods for both updating and extracting SharePoint list items
 */
export class ListItemHelper {
  private static logger = Logger.subscribe("ListItemHelper");

  /**
   * Create a new type-safe updater instance for building list item updates
   * @param schema - Schema definition for the list fields
   * @returns Type-safe ListItemUpdater instance
   */
  public static createUpdater<T = any>(
    schema: T extends any ? Record<string, FieldSchema> : { [K in keyof T]: FieldSchema }
  ): ListItemUpdater<T> {
    ListItemHelper.logger.write("Created new ListItemUpdater instance", LogLevel.Verbose);
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
    ListItemHelper.logger.write("Starting list item extraction", LogLevel.Verbose);
    
    if (!item) {
      const error = "Item is null or undefined";
      ListItemHelper.logger.write(error, LogLevel.Error);
      throw new Error(error);
    }

    const result: any = {};

    try {
      for (const [propertyName, fieldSchema] of Object.entries(fieldMapping)) {
        const fieldValue = item[fieldSchema.internalName];
        const convertedValue = ListItemHelper.convertFieldValue(fieldValue, fieldSchema.type);
        
        result[propertyName] = convertedValue;
        
        ListItemHelper.logger.write(
          `Extracted field '${propertyName}' (${fieldSchema.internalName}) = ${JSON.stringify(convertedValue)}`,
          LogLevel.Verbose
        );
      }

      ListItemHelper.logger.write(`Successfully extracted ${Object.keys(fieldMapping).length} fields`, LogLevel.Verbose);
      return result as T;
    } catch (error) {
      ListItemHelper.logger.write(`Error during extraction: ${error}`, LogLevel.Error);
      throw error;
    }
  }

  /**
   * Safely extract values from a SharePoint list item using field mapping
   * Continues processing even if individual fields fail conversion
   * @param item - SharePoint list item
   * @param fieldMapping - Mapping of property names to field schemas
   * @returns Object containing successfully extracted data and any conversion errors
   */
  public static safeExtract<T = any>(item: any, fieldMapping: FieldMapping): SafeExtractionResult<T> {
    ListItemHelper.logger.write("Starting safe list item extraction", LogLevel.Verbose);
    
    const data: Partial<T> = {};
    const errors: Record<string, Error> = {};

    if (!item) {
      const error = new Error("Item is null or undefined");
      ListItemHelper.logger.write(error.message, LogLevel.Error);
      
      // Add error for all fields
      for (const propertyName of Object.keys(fieldMapping)) {
        errors[propertyName] = error;
      }
      
      return { data, errors };
    }

    for (const [propertyName, fieldSchema] of Object.entries(fieldMapping)) {
      try {
        const fieldValue = item[fieldSchema.internalName];
        const convertedValue = ListItemHelper.convertFieldValue(fieldValue, fieldSchema.type);
        
        (data as any)[propertyName] = convertedValue;
        
        ListItemHelper.logger.write(
          `Successfully extracted field '${propertyName}' (${fieldSchema.internalName}) = ${JSON.stringify(convertedValue)}`,
          LogLevel.Verbose
        );
      } catch (error) {
        const conversionError = error instanceof Error ? error : new Error(String(error));
        errors[propertyName] = conversionError;
        
        ListItemHelper.logger.write(
          `Failed to extract field '${propertyName}' (${fieldSchema.internalName}): ${conversionError.message}`,
          LogLevel.Warning
        );
      }
    }

    const successCount = Object.keys(data).length;
    const errorCount = Object.keys(errors).length;
    
    ListItemHelper.logger.write(
      `Safe extraction completed: ${successCount} successful, ${errorCount} failed`,
      errorCount > 0 ? LogLevel.Warning : LogLevel.Verbose
    );

    return { data, errors };
  }

  /**
   * Convert SharePoint field value to appropriate TypeScript type based on field type
   * Handles null/undefined/empty values gracefully with appropriate empty values
   */
  private static convertFieldValue(value: any, fieldType: SPFieldType): any {
    // Handle null, undefined, empty string, or empty object
    if (value === null || value === undefined || value === "" || 
        (typeof value === 'object' && value !== null && Object.keys(value).length === 0)) {
      
      // Return appropriate empty value based on field type
      switch (fieldType) {
        case SPFieldType.Text:
        case SPFieldType.Note:
        case SPFieldType.Choice:
          return ""; // Empty string for text fields
          
        case SPFieldType.MultiChoice:
        case SPFieldType.UserMulti:
        case SPFieldType.LookupMulti:
          return []; // Empty array for multi-value fields
          
        case SPFieldType.Number:
        case SPFieldType.Currency:
        case SPFieldType.Counter:
        case SPFieldType.Boolean:
        case SPFieldType.DateTime:
        case SPFieldType.User:
        case SPFieldType.Lookup:
        case SPFieldType.TaxonomyFieldType:
          return undefined; // Undefined for single-value fields that can't be "empty"
          
        default:
          return undefined;
      }
    }

    try {
      switch (fieldType) {
        case SPFieldType.Text:
        case SPFieldType.Note:
        case SPFieldType.Choice:
          return value.toString();

        case SPFieldType.Number:
        case SPFieldType.Currency:
        case SPFieldType.Counter:
          if (typeof value === 'number') return value;
          if (typeof value === 'string' && value.trim() === '') return undefined;
          
          const numValue = parseFloat(value);
          return isNaN(numValue) ? undefined : numValue;

        case SPFieldType.Boolean:
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase().trim();
            if (lowerValue === '' || lowerValue === 'false' || lowerValue === '0') return false;
            if (lowerValue === 'true' || lowerValue === '1') return true;
          }
          return Boolean(value);

        case SPFieldType.DateTime:
          if (value instanceof Date) return value;
          if (typeof value === 'string' && value.trim() === '') return undefined;
          
          const dateValue = new Date(value);
          return isNaN(dateValue.getTime()) ? undefined : dateValue;

        case SPFieldType.User:
          // SharePoint returns user fields as objects with various properties
          if (typeof value === 'object' && value !== null) {
            // Check if it has required properties for IPrincipal
            if (value.id !== undefined || value.ID !== undefined) {
              return {
                id: value.id || value.ID,
                email: value.email || value.EMail || undefined,
                text: value.text || value.Title || undefined,
                loginName: value.loginName || value.Name || undefined
              } as IPrincipal;
            }
          }
          return undefined;

        case SPFieldType.UserMulti:
          if (Array.isArray(value) && value.length > 0) {
            const users = value
              .map(user => {
                if (typeof user === 'object' && user !== null && (user.id !== undefined || user.ID !== undefined)) {
                  return {
                    id: user.id || user.ID,
                    email: user.email || user.EMail || undefined,
                    text: user.text || user.Title || undefined,
                    loginName: user.loginName || user.Name || undefined
                  } as IPrincipal;
                }
                return undefined;
              })
              .filter(user => user !== undefined);
            return users.length > 0 ? users : [];
          }
          return [];

        case SPFieldType.Lookup:
          // SharePoint returns lookup as object with ID and Title
          if (typeof value === 'object' && value !== null) {
            const lookupId = value.ID || value.id;
            return lookupId !== undefined ? (typeof lookupId === 'number' ? lookupId : parseInt(lookupId)) : undefined;
          }
          if (typeof value === 'number') return value;
          if (typeof value === 'string' && value.trim() !== '') {
            const parsedId = parseInt(value);
            return isNaN(parsedId) ? undefined : parsedId;
          }
          return undefined;

        case SPFieldType.LookupMulti:
          if (Array.isArray(value) && value.length > 0) {
            const lookupIds = value
              .map(lookup => {
                if (typeof lookup === 'object' && lookup !== null) {
                  const lookupId = lookup.ID || lookup.id;
                  return lookupId !== undefined ? (typeof lookupId === 'number' ? lookupId : parseInt(lookupId)) : undefined;
                }
                if (typeof lookup === 'number') return lookup;
                if (typeof lookup === 'string' && lookup.trim() !== '') {
                  const parsedId = parseInt(lookup);
                  return isNaN(parsedId) ? undefined : parsedId;
                }
                return undefined;
              })
              .filter(id => id !== undefined);
            return lookupIds.length > 0 ? lookupIds : [];
          }
          return [];

        case SPFieldType.MultiChoice:
          if (Array.isArray(value) && value.length > 0) {
            const choices = value.filter(choice => choice !== null && choice !== undefined && choice !== '');
            return choices.length > 0 ? choices : [];
          }
          // Sometimes returned as semicolon-delimited string
          if (typeof value === 'string' && value.trim() !== '') {
            const choices = value.split(';#').filter(v => v.length > 0);
            return choices.length > 0 ? choices : [];
          }
          return [];

        case SPFieldType.TaxonomyFieldType:
          // SharePoint returns taxonomy as object with Label and TermGuid
          if (typeof value === 'object' && value !== null) {
            const label = value.Label;
            const termId = value.TermGuid || value.TermID;
            
            if (label && termId) {
              return {
                Label: label,
                TermID: termId
              } as TaxonomyFieldValue;
            }
          }
          return undefined;

        default:
          ListItemHelper.logger.write(`Unknown field type '${SPFieldType[fieldType]}', returning raw value`, LogLevel.Warning);
          return value;
      }
    } catch (error) {
      ListItemHelper.logger.write(`Error converting field value for type '${SPFieldType[fieldType]}': ${error}`, LogLevel.Warning);
      return undefined; // Return undefined instead of raw value on conversion error
    }
  }
}
