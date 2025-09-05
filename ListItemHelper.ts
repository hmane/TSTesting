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
 * Updater class for building SharePoint list item updates
 */
class ListItemUpdater {
  private updates: IListItemFormUpdateValue[] = [];
  private logger: Logger;
  private schema: Record<string, FieldSchema>;

  constructor(schema: Record<string, FieldSchema>) {
    this.schema = schema;
    this.logger = Logger.subscribe("ListItemUpdater");
    this.logger.write("ListItemUpdater initialized", LogLevel.Verbose);
  }

  /**
   * Set field value with optional comparison
   * @param fieldKey - Key from the schema
   * @param value - New value to set
   * @param originalValue - Optional original value for comparison. If provided, will only update if different
   */
  public setField(fieldKey: string, value: any, originalValue?: any): ListItemUpdater {
    // Validate field exists and is not readonly
    this.validateField(fieldKey);

    const fieldSchema = this.schema[fieldKey];

    // If originalValue is provided (even if undefined), perform comparison
    if (arguments.length === 3) {
      if (isEqual(value, originalValue)) {
        this.logger.write(`Field '${fieldKey}' unchanged, skipping update`, LogLevel.Verbose);
        return this;
      }
      this.logger.write(`Field '${fieldKey}' changed from '${this.getValueForLogging(originalValue)}' to '${this.getValueForLogging(value)}'`, LogLevel.Verbose);
    }

    // Convert value based on field type and add update
    const formattedValue = this.formatValueByType(value, fieldSchema.type);
    this.addUpdate(fieldKey, formattedValue);
    
    return this;
  }

  /**
   * Get the final updates array without validation
   */
  public getUpdates(): IListItemFormUpdateValue[] {
    this.logger.write(`Generated ${this.updates.length} field updates`, LogLevel.Verbose);
    return [...this.updates];
  }

  /**
   * Validate required fields and get the final updates array
   */
  public validateAndGetUpdates(): IListItemFormUpdateValue[] {
    this.validateRequiredFields();
    this.logger.write(`Generated ${this.updates.length} field updates after validation`, LogLevel.Verbose);
    return [...this.updates];
  }

  /**
   * Clear all updates and start fresh
   */
  public clear(): ListItemUpdater {
    this.updates = [];
    this.logger.write("Cleared all updates", LogLevel.Verbose);
    return this;
  }

  // Private helper methods

  private getFieldKeyByInternalName(internalName: string): string | undefined {
    return Object.keys(this.schema).find(key => this.schema[key].internalName === internalName);
  }

  private convertFormattedValueToDirectValue(formattedValue: string, fieldType: SPFieldType): any {
    // Convert the formatted string value back to appropriate type for direct PnP.js updates
    if (formattedValue === "") {
      return undefined; // Clear the field
    }

    try {
      switch (fieldType) {
        case SPFieldType.Text:
        case SPFieldType.Note:
        case SPFieldType.Choice:
          return formattedValue;

        case SPFieldType.Number:
        case SPFieldType.Currency:
        case SPFieldType.Counter:
          return parseFloat(formattedValue);

        case SPFieldType.Boolean:
          return formattedValue === "1";

        case SPFieldType.DateTime:
          return new Date(formattedValue);

        case SPFieldType.User:
          // For direct updates, PnP.js expects just the user ID
          return parseInt(formattedValue);

        case SPFieldType.UserMulti:
          // For multi-user, return array of IDs
          if (formattedValue.includes(";#")) {
            return formattedValue.split(";#").map(id => parseInt(id));
          }
          return [parseInt(formattedValue)];

        case SPFieldType.Lookup:
          return parseInt(formattedValue);

        case SPFieldType.LookupMulti:
          // For multi-lookup, return array of IDs
          if (formattedValue.includes(";#")) {
            return formattedValue.split(";#").map(id => parseInt(id));
          }
          return [parseInt(formattedValue)];

        case SPFieldType.MultiChoice:
          // For multi-choice, return array of strings
          if (formattedValue.includes(";#")) {
            return formattedValue.split(";#");
          }
          return [formattedValue];

        case SPFieldType.TaxonomyFieldType:
          // For taxonomy, PnP.js expects the formatted value as-is for direct updates
          return formattedValue;

        default:
          this.logger.write(`Unknown field type '${SPFieldType[fieldType]}' for direct conversion, returning formatted value`, LogLevel.Warning);
          return formattedValue;
      }
    } catch (error) {
      this.logger.write(`Error converting formatted value '${formattedValue}' for field type '${SPFieldType[fieldType]}': ${error}`, LogLevel.Warning);
      return formattedValue; // Return as-is if conversion fails
    }
  }

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
   * Create a new updater instance for building list item updates
   */
  public static createUpdater(schema: Record<string, FieldSchema>): ListItemUpdater {
    ListItemHelper.logger.write("Created new ListItemUpdater instance", LogLevel.Verbose);
    return new ListItemUpdater(schema);
  }

  /**
   * Extract values from a SharePoint list item using field mapping
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
   * Convert SharePoint field value to appropriate TypeScript type based on field type
   * Handles null/undefined/empty values gracefully
   */
  private static convertFieldValue(value: any, fieldType: SPFieldType): any {
    // Handle null, undefined, empty string, or empty object
    if (value === null || value === undefined || value === "" || 
        (typeof value === 'object' && value !== null && Object.keys(value).length === 0)) {
      return undefined; // Prefer undefined over null
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
            return value
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
            return value
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
