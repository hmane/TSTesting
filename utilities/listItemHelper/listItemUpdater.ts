import { isEqual } from '@microsoft/sp-lodash-subset';
import { addDirectUpdateValue, formatValueByType } from './fieldFormatter';
import { FieldSchema, IListItemFormUpdateValue } from './types';

/**
 * Type-safe updater class for building SharePoint list item updates
 */
export class ListItemUpdater<T extends Record<string, any> = Record<string, any>> {
  private updates: IListItemFormUpdateValue[] = [];
  private schema: Record<string, FieldSchema>;

  constructor(schema: Record<string, FieldSchema>) {
    this.schema = schema;
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
  public setField(fieldKey: string, value: any, originalValue?: any): ListItemUpdater<T>;
  public setField(fieldKey: any, value: any, originalValue?: any): ListItemUpdater<T> {
    // Validate field exists and is not readonly
    this.validateField(fieldKey as string);

    const fieldSchema = this.schema[fieldKey as string];

    // If originalValue is provided (even if undefined), perform comparison
    if (arguments.length === 3) {
      if (isEqual(value, originalValue)) {
        return this;
      }
    }

    // Convert value based on field type and add update
    const formattedValue = formatValueByType(value, fieldSchema.type);
    this.addUpdate(fieldKey as string, formattedValue);

    return this;
  }

  /**
   * Get updates for validate methods (addValidateUpdateItemUsingPath, validateUpdateListItem)
   * @returns Array of IListItemFormUpdateValue for PnP.js validate methods
   */
  public getUpdatesForValidate(): IListItemFormUpdateValue[] {
    return [...this.updates];
  }

  /**
   * Validate required fields and get updates for validate methods
   * @returns Array of IListItemFormUpdateValue for PnP.js validate methods
   */
  public validateAndGetUpdatesForValidate(): IListItemFormUpdateValue[] {
    this.validateRequiredFields();
    return [...this.updates];
  }

  /**
   * Get updates for PnP.js methods (item.update(), items.add())
   * Handles complex field types like User and Taxonomy properly
   * @returns Key-value object for PnP.js update methods
   */
  public getUpdates(): Record<string, any> {
    const updates: Record<string, any> = {};

    for (const update of this.updates) {
      const fieldKey = this.getFieldKeyByInternalName(update.FieldName);
      const fieldSchema = fieldKey ? this.schema[fieldKey] : undefined;

      if (fieldSchema) {
        // Handle special field types that need different formatting for direct updates
        addDirectUpdateValue(updates, update.FieldName, update.FieldValue, fieldSchema.type);
      } else {
        // Fallback: use the formatted value as-is
        updates[update.FieldName] = update.FieldValue;
      }
    }

    return updates;
  }

  /**
   * Validate required fields and get updates for PnP.js methods
   * @returns Key-value object for PnP.js update methods
   */
  public validateAndGetUpdates(): Record<string, any> {
    this.validateRequiredFields();
    return this.getUpdates();
  }

  /**
   * Clear all updates and start fresh
   */
  public clear(): ListItemUpdater<T> {
    this.updates = [];
    return this;
  }

  // Private helper methods

  private validateField(fieldKey: string): void {
    const field = this.schema[fieldKey];
    if (!field) {
      const error = `Field '${fieldKey}' not found in schema`;
      throw new Error(error);
    }

    if (field.readonly) {
      const error = `Field '${fieldKey}' is readonly and cannot be updated`;
      throw new Error(error);
    }
  }

  private validateRequiredFields(): void {
    const requiredFields = Object.keys(this.schema).filter(key => this.schema[key].required);
    const updatedFields = this.updates
      .map(update => {
        // Find the field key that maps to this internal name
        return Object.keys(this.schema).find(
          key => this.schema[key].internalName === update.FieldName
        );
      })
      .filter((field): field is string => field !== undefined);

    const missingRequiredFields = requiredFields.filter(field => !updatedFields.includes(field));

    if (missingRequiredFields.length > 0) {
      const error = `Missing required fields: ${missingRequiredFields.join(', ')}`;
      throw new Error(error);
    }
  }

  private addUpdate(fieldKey: string, fieldValue: string): void {
    const field = this.schema[fieldKey];
    this.updates.push({
      FieldName: field.internalName,
      FieldValue: fieldValue,
    });
  }

  private getFieldKeyByInternalName(internalName: string): string | undefined {
    return Object.keys(this.schema).find(key => this.schema[key].internalName === internalName);
  }
}
