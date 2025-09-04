import { IListItemFormUpdateValue } from "@pnp/sp/lists";
import { Logger, LogLevel } from "@pnp/logging";
import { IPrincipal } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { isEqual } from "@microsoft/sp-lodash-subset";

/**
 * Interface for Taxonomy field values
 */
export interface TaxonomyFieldValue {
  Label: string;
  TermID: string;
}

/**
 * Enhanced utility for building SharePoint list item updates with validation and comparison
 */
export class ListItemUpdater {
  private updates: IListItemFormUpdateValue[] = [];
  private logger: Logger;

  constructor() {
    this.logger = Logger.subscribe("ListItemUpdater");
  }

  /**
   * Always update text field
   */
  public text(fieldName: string, value: string | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatTextValue(value), "text");
    return this;
  }

  /**
   * Update text field only if value has changed
   */
  public textIfChanged(fieldName: string, value: string | null | undefined, originalValue: string | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatTextValue(value), "text");
      this.logger.write(`Field '${fieldName}' changed from '${originalValue}' to '${value}'`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Always update number field
   */
  public number(fieldName: string, value: number | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatNumberValue(value), "number");
    return this;
  }

  /**
   * Update number field only if value has changed
   */
  public numberIfChanged(fieldName: string, value: number | null | undefined, originalValue: number | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatNumberValue(value), "number");
      this.logger.write(`Field '${fieldName}' changed from '${originalValue}' to '${value}'`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Always update choice field
   */
  public choice(fieldName: string, value: string | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatTextValue(value), "choice");
    return this;
  }

  /**
   * Update choice field only if value has changed
   */
  public choiceIfChanged(fieldName: string, value: string | null | undefined, originalValue: string | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatTextValue(value), "choice");
      this.logger.write(`Field '${fieldName}' changed from '${originalValue}' to '${value}'`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Always update multi-choice field
   */
  public multiChoice(fieldName: string, value: string[] | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatMultiChoiceValue(value), "multichoice");
    return this;
  }

  /**
   * Update multi-choice field only if value has changed
   */
  public multiChoiceIfChanged(fieldName: string, value: string[] | null | undefined, originalValue: string[] | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatMultiChoiceValue(value), "multichoice");
      this.logger.write(`Field '${fieldName}' changed from [${originalValue?.join(', ')}] to [${value?.join(', ')}]`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Always update person field
   */
  public person(fieldName: string, value: IPrincipal | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatPersonValue(value), "person");
    return this;
  }

  /**
   * Update person field only if value has changed
   */
  public personIfChanged(fieldName: string, value: IPrincipal | null | undefined, originalValue: IPrincipal | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatPersonValue(value), "person");
      this.logger.write(`Field '${fieldName}' changed from '${originalValue?.text}' to '${value?.text}'`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Always update multi-person field
   */
  public multiPerson(fieldName: string, value: IPrincipal[] | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatMultiPersonValue(value), "multiperson");
    return this;
  }

  /**
   * Update multi-person field only if value has changed
   */
  public multiPersonIfChanged(fieldName: string, value: IPrincipal[] | null | undefined, originalValue: IPrincipal[] | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatMultiPersonValue(value), "multiperson");
      this.logger.write(`Field '${fieldName}' changed from [${originalValue?.map(p => p.text).join(', ')}] to [${value?.map(p => p.text).join(', ')}]`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Always update lookup field
   */
  public lookup(fieldName: string, value: number | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatLookupValue(value), "lookup");
    return this;
  }

  /**
   * Update lookup field only if value has changed
   */
  public lookupIfChanged(fieldName: string, value: number | null | undefined, originalValue: number | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatLookupValue(value), "lookup");
      this.logger.write(`Field '${fieldName}' changed from '${originalValue}' to '${value}'`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Always update multi-lookup field
   */
  public multiLookup(fieldName: string, value: number[] | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatMultiLookupValue(value), "multilookup");
    return this;
  }

  /**
   * Update multi-lookup field only if value has changed
   */
  public multiLookupIfChanged(fieldName: string, value: number[] | null | undefined, originalValue: number[] | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatMultiLookupValue(value), "multilookup");
      this.logger.write(`Field '${fieldName}' changed from [${originalValue?.join(', ')}] to [${value?.join(', ')}]`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Always update taxonomy field
   */
  public taxonomy(fieldName: string, value: TaxonomyFieldValue | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatTaxonomyValue(value), "taxonomy");
    return this;
  }

  /**
   * Update taxonomy field only if value has changed
   */
  public taxonomyIfChanged(fieldName: string, value: TaxonomyFieldValue | null | undefined, originalValue: TaxonomyFieldValue | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatTaxonomyValue(value), "taxonomy");
      this.logger.write(`Field '${fieldName}' changed from '${originalValue?.Label}' to '${value?.Label}'`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Always update date field
   */
  public date(fieldName: string, value: Date | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatDateValue(value), "date");
    return this;
  }

  /**
   * Update date field only if value has changed
   */
  public dateIfChanged(fieldName: string, value: Date | null | undefined, originalValue: Date | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatDateValue(value), "date");
      this.logger.write(`Field '${fieldName}' changed from '${originalValue?.toISOString()}' to '${value?.toISOString()}'`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Always update boolean field
   */
  public boolean(fieldName: string, value: boolean | null | undefined): ListItemUpdater {
    this.addUpdate(fieldName, this.formatBooleanValue(value), "boolean");
    return this;
  }

  /**
   * Update boolean field only if value has changed
   */
  public booleanIfChanged(fieldName: string, value: boolean | null | undefined, originalValue: boolean | null | undefined): ListItemUpdater {
    if (!isEqual(value, originalValue)) {
      this.addUpdate(fieldName, this.formatBooleanValue(value), "boolean");
      this.logger.write(`Field '${fieldName}' changed from '${originalValue}' to '${value}'`, LogLevel.Verbose);
    } else {
      this.logger.write(`Field '${fieldName}' unchanged, skipping update`, LogLevel.Verbose);
    }
    return this;
  }

  /**
   * Get the final updates array
   */
  public getUpdates(): IListItemFormUpdateValue[] {
    this.logger.write(`Generated ${this.updates.length} field updates`, LogLevel.Verbose);
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

  // Private helper methods for formatting values

  private addUpdate(fieldName: string, fieldValue: string, fieldType: string): void {
    try {
      this.updates.push({
        FieldName: fieldName,
        FieldValue: fieldValue
      });
      this.logger.write(`Added ${fieldType} field update: ${fieldName} = ${fieldValue}`, LogLevel.Verbose);
    } catch (error) {
      this.logger.write(`Error adding update for field '${fieldName}': ${error}`, LogLevel.Error);
      throw error;
    }
  }

  private formatTextValue(value: string | null | undefined): string {
    return value === null || value === undefined ? "" : value;
  }

  private formatNumberValue(value: number | null | undefined): string {
    return value === null || value === undefined ? "" : value.toString();
  }

  private formatMultiChoiceValue(value: string[] | null | undefined): string {
    if (!value || value.length === 0) return "";
    return value.join(";#");
  }

  private formatPersonValue(value: IPrincipal | null | undefined): string {
    if (!value) return "";
    return `${value.id}`;
  }

  private formatMultiPersonValue(value: IPrincipal[] | null | undefined): string {
    if (!value || value.length === 0) return "";
    return value.map(person => person.id).join(";#");
  }

  private formatLookupValue(value: number | null | undefined): string {
    return value === null || value === undefined ? "" : value.toString();
  }

  private formatMultiLookupValue(value: number[] | null | undefined): string {
    if (!value || value.length === 0) return "";
    return value.join(";#");
  }

  private formatTaxonomyValue(value: TaxonomyFieldValue | null | undefined): string {
    if (!value) return "";
    return `${value.Label}|${value.TermID}`;
  }

  private formatDateValue(value: Date | null | undefined): string {
    if (!value) return "";
    return value.toISOString();
  }

  private formatBooleanValue(value: boolean | null | undefined): string {
    if (value === null || value === undefined) return "";
    return value ? "1" : "0";
  }
}

/**
 * Factory function to create a new ListItemUpdater instance
 */
export function createUpdater(): ListItemUpdater {
  return new ListItemUpdater();
}
