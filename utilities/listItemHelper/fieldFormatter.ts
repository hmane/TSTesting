import { SPFieldType, IPrincipal, TaxonomyFieldValue } from './types';

/**
 * Format values for SharePoint update operations
 * Converts TypeScript values to string format expected by SharePoint validate methods
 */
export function formatValueByType(value: any, fieldType: SPFieldType): string {
  // Handle null/undefined values - clear the field in SharePoint
  if (value === null || value === undefined) {
    return '';
  }

  try {
    switch (fieldType) {
      case SPFieldType.Text:
      case SPFieldType.Note:
      case SPFieldType.Choice:
      case SPFieldType.URL:
      case SPFieldType.Guid:
      case SPFieldType.ContentTypeId:
      case SPFieldType.WorkflowStatus:
        return value.toString();

      case SPFieldType.Number:
      case SPFieldType.Currency:
      case SPFieldType.Counter:
      case SPFieldType.Integer:
        return typeof value === 'number' ? value.toString() : parseFloat(value).toString();

      case SPFieldType.Boolean:
      case SPFieldType.Attachments:
      case SPFieldType.AllDayEvent:
        return value ? '1' : '0';

      case SPFieldType.DateTime:
        if (value instanceof Date) {
          return value.toISOString();
        }
        return new Date(value).toISOString();

      case SPFieldType.User:
        if (typeof value === 'object' && value !== null && 'id' in value) {
          return (value as IPrincipal).id.toString();
        }
        throw new Error('User field requires IPrincipal object with id property');

      case SPFieldType.UserMulti:
        if (Array.isArray(value)) {
          return value.map(person => (person as IPrincipal).id).join(';#');
        }
        throw new Error('Multi-user field requires array of IPrincipal objects');

      case SPFieldType.Lookup:
        return typeof value === 'number' ? value.toString() : parseInt(value, 10).toString();

      case SPFieldType.LookupMulti:
        if (Array.isArray(value)) {
          return value.map(id => (typeof id === 'number' ? id : parseInt(id, 10))).join(';#');
        }
        throw new Error('Multi-lookup field requires array of numbers');

      case SPFieldType.MultiChoice:
        if (Array.isArray(value)) {
          return value.join(';#');
        }
        throw new Error('Multi-choice field requires array of strings');

      case SPFieldType.TaxonomyFieldType:
        if (typeof value === 'object' && value !== null && 'Label' in value && 'TermID' in value) {
          const taxValue = value as TaxonomyFieldValue;
          return `${taxValue.Label}|${taxValue.TermID}`;
        }
        throw new Error(
          'Taxonomy field requires TaxonomyFieldValue object with Label and TermID properties'
        );

      case SPFieldType.TaxonomyFieldTypeMulti:
        if (Array.isArray(value)) {
          return value
            .map(item => {
              if (
                typeof item === 'object' &&
                item !== null &&
                'Label' in item &&
                'TermID' in item
              ) {
                const taxValue = item as TaxonomyFieldValue;
                return `${taxValue.Label}|${taxValue.TermID}`;
              }
              throw new Error('Multi-taxonomy field requires array of TaxonomyFieldValue objects');
            })
            .join(';#');
        }
        throw new Error('Multi-taxonomy field requires array of TaxonomyFieldValue objects');

      default:
        return value.toString();
    }
  } catch (error) {
    const errorMsg = `Error formatting value for field type '${SPFieldType[fieldType]}': ${error}`;
    throw new Error(errorMsg);
  }
}

/**
 * Add direct update value for PnP.js update methods
 * Handles complex field types that need different formatting for direct updates vs validate methods
 */
export function addDirectUpdateValue(
  updates: Record<string, any>,
  internalName: string,
  formattedValue: string,
  fieldType: SPFieldType
): void {
  if (formattedValue === '') {
    // Handle empty values appropriately for each field type
    switch (fieldType) {
      case SPFieldType.Text:
      case SPFieldType.Note:
      case SPFieldType.Choice:
      case SPFieldType.URL:
      case SPFieldType.Guid:
      case SPFieldType.ContentTypeId:
      case SPFieldType.WorkflowStatus:
        updates[internalName] = '';
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

      case SPFieldType.TaxonomyFieldTypeMulti:
        updates[internalName] = { results: [] };
        updates[`${internalName}_0`] = { results: [] };
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
      case SPFieldType.URL:
      case SPFieldType.Guid:
      case SPFieldType.ContentTypeId:
      case SPFieldType.WorkflowStatus:
        updates[internalName] = formattedValue;
        break;

      case SPFieldType.Number:
      case SPFieldType.Currency:
      case SPFieldType.Counter:
      case SPFieldType.Integer:
        updates[internalName] = parseFloat(formattedValue);
        break;

      case SPFieldType.Boolean:
      case SPFieldType.Attachments:
      case SPFieldType.AllDayEvent:
        updates[internalName] = formattedValue === '1';
        break;

      case SPFieldType.DateTime:
        updates[internalName] = new Date(formattedValue);
        break;

      case SPFieldType.User:
        // For single user, PnP.js expects FieldNameId
        updates[`${internalName}Id`] = parseInt(formattedValue, 10);
        break;

      case SPFieldType.UserMulti:
        // For multi-user, PnP.js expects FieldNameId with results array
        if (formattedValue.includes(';#')) {
          const userIds = formattedValue.split(';#').map(id => parseInt(id, 10));
          updates[`${internalName}Id`] = { results: userIds };
        } else {
          updates[`${internalName}Id`] = { results: [parseInt(formattedValue, 10)] };
        }
        break;

      case SPFieldType.Lookup:
        // For single lookup, PnP.js expects FieldNameId
        updates[`${internalName}Id`] = parseInt(formattedValue, 10);
        break;

      case SPFieldType.LookupMulti:
        // For multi-lookup, PnP.js expects FieldNameId with results array
        if (formattedValue.includes(';#')) {
          const lookupIds = formattedValue.split(';#').map(id => parseInt(id, 10));
          updates[`${internalName}Id`] = { results: lookupIds };
        } else {
          updates[`${internalName}Id`] = { results: [parseInt(formattedValue, 10)] };
        }
        break;

      case SPFieldType.MultiChoice:
        // For multi-choice, PnP.js expects results array
        if (formattedValue.includes(';#')) {
          updates[internalName] = { results: formattedValue.split(';#') };
        } else {
          updates[internalName] = { results: [formattedValue] };
        }
        break;

      case SPFieldType.TaxonomyFieldType:
        // For taxonomy, we need to handle both the main field and hidden field
        // Format: "Label|TermID"
        if (formattedValue.includes('|')) {
          const [label, termId] = formattedValue.split('|');

          // Set the main taxonomy field
          updates[internalName] = {
            Label: label,
            TermGuid: termId,
            WssId: -1, // Let SharePoint assign the WssId
          };

          // Set the hidden taxonomy field (typically FieldName_0)
          updates[`${internalName}_0`] = `${label}|${termId}`;
        } else {
          updates[internalName] = formattedValue;
        }
        break;

      case SPFieldType.TaxonomyFieldTypeMulti:
        // For multi-taxonomy, handle multiple values
        if (formattedValue.includes(';#')) {
          const taxonomyItems = formattedValue.split(';#').map(item => {
            const [label, termId] = item.split('|');
            return {
              Label: label,
              TermGuid: termId,
              WssId: -1,
            };
          });

          updates[internalName] = { results: taxonomyItems };
          updates[`${internalName}_0`] = { results: formattedValue.split(';#') };
        } else if (formattedValue.includes('|')) {
          const [label, termId] = formattedValue.split('|');
          updates[internalName] = {
            results: [
              {
                Label: label,
                TermGuid: termId,
                WssId: -1,
              },
            ],
          };
          updates[`${internalName}_0`] = { results: [formattedValue] };
        } else {
          updates[internalName] = { results: [formattedValue] };
        }
        break;

      default:
        updates[internalName] = formattedValue;
    }
  } catch (error) {
    // Return as-is if conversion fails
    updates[internalName] = formattedValue;
  }
}
