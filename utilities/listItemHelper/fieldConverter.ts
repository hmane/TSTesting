import { IPrincipal, SPFieldType, TaxonomyFieldValue } from './types';

/**
 * Convert SharePoint field value to appropriate TypeScript type based on field type
 * Handles null/undefined/empty values gracefully with appropriate empty values
 */
export function convertFieldValue(value: any, fieldType: SPFieldType): any {
  // Handle null, undefined, empty string, or empty object
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'object' && value !== null && Object.keys(value).length === 0)
  ) {
    // Return appropriate empty value based on field type
    switch (fieldType) {
      case SPFieldType.Text:
      case SPFieldType.Note:
      case SPFieldType.Choice:
        return ''; // Empty string for text fields

      case SPFieldType.MultiChoice:
      case SPFieldType.UserMulti:
      case SPFieldType.LookupMulti:
      case SPFieldType.TaxonomyFieldTypeMulti:
        return []; // Empty array for multi-value fields

      case SPFieldType.Number:
      case SPFieldType.Currency:
      case SPFieldType.Counter:
      case SPFieldType.Integer:
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
      case SPFieldType.URL:
      case SPFieldType.Guid:
      case SPFieldType.ContentTypeId:
      case SPFieldType.WorkflowStatus:
        return value.toString();

      case SPFieldType.Number:
      case SPFieldType.Currency:
      case SPFieldType.Counter:
      case SPFieldType.Integer: {
        if (typeof value === 'number') return value;
        if (typeof value === 'string' && value.trim() === '') return undefined;

        const numValue = parseFloat(value);
        return isNaN(numValue) ? undefined : numValue;
      }

      case SPFieldType.Boolean:
      case SPFieldType.Attachments:
      case SPFieldType.AllDayEvent:
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase().trim();
          if (lowerValue === '' || lowerValue === 'false' || lowerValue === '0') return false;
          if (lowerValue === 'true' || lowerValue === '1') return true;
        }
        return Boolean(value);

      case SPFieldType.DateTime: {
        if (value instanceof Date) return value;
        if (typeof value === 'string' && value.trim() === '') return undefined;

        const dateValue = new Date(value);
        return isNaN(dateValue.getTime()) ? undefined : dateValue;
      }

      case SPFieldType.User:
        // SharePoint returns user fields as objects with various properties
        if (typeof value === 'object' && value !== null) {
          // Check if it has required properties for IPrincipal
          if (value.id !== undefined || value.ID !== undefined) {
            return {
              id: (value.id || value.ID || '').toString(),
              email: value.email || value.EMail || '',
              title: value.text || value.Title || '',
              value: value.loginName || value.Name || '',
              department: value.department || '',
              jobTitle: value.jobTitle || '',
              sip: value.sip || '',
              picture: value.picture || '',
            } as IPrincipal;
          }
        }
        return undefined;

      case SPFieldType.UserMulti:
        if (Array.isArray(value) && value.length > 0) {
          const users = value
            .map(user => {
              if (
                typeof user === 'object' &&
                user !== null &&
                (user.id !== undefined || user.ID !== undefined)
              ) {
                return {
                  id: (user.id || user.ID || '').toString(),
                  email: user.email || user.EMail || '',
                  title: user.text || user.Title || '',
                  value: user.loginName || user.Name || '',
                  department: user.department || '',
                  jobTitle: user.jobTitle || '',
                  sip: user.sip || '',
                  picture: user.picture || '',
                } as IPrincipal;
              }
              return undefined;
            })
            .filter((user): user is IPrincipal => user !== undefined);
          return users.length > 0 ? users : [];
        }
        return [];

      case SPFieldType.Lookup:
        // SharePoint returns lookup as object with ID and Title
        if (typeof value === 'object' && value !== null) {
          const lookupId = value.ID || value.id;
          return lookupId !== undefined
            ? typeof lookupId === 'number'
              ? lookupId
              : parseInt(lookupId, 10)
            : undefined;
        }
        if (typeof value === 'number') return value;
        if (typeof value === 'string' && value.trim() !== '') {
          const parsedId = parseInt(value, 10);
          return isNaN(parsedId) ? undefined : parsedId;
        }
        return undefined;

      case SPFieldType.LookupMulti:
        if (Array.isArray(value) && value.length > 0) {
          const lookupIds = value
            .map(lookup => {
              if (typeof lookup === 'object' && lookup !== null) {
                const lookupId = lookup.ID || lookup.id;
                return lookupId !== undefined
                  ? typeof lookupId === 'number'
                    ? lookupId
                    : parseInt(lookupId, 10)
                  : undefined;
              }
              if (typeof lookup === 'number') return lookup;
              if (typeof lookup === 'string' && lookup.trim() !== '') {
                const parsedId = parseInt(lookup, 10);
                return isNaN(parsedId) ? undefined : parsedId;
              }
              return undefined;
            })
            .filter((id): id is number => id !== undefined);
          return lookupIds.length > 0 ? lookupIds : [];
        }
        return [];

      case SPFieldType.MultiChoice:
        if (Array.isArray(value) && value.length > 0) {
          const choices = value.filter(
            choice => choice !== null && choice !== undefined && choice !== ''
          );
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
              TermID: termId,
            } as TaxonomyFieldValue;
          }
        }
        return undefined;

      case SPFieldType.TaxonomyFieldTypeMulti: {
        if (Array.isArray(value) && value.length > 0) {
          const taxonomyValues = value
            .map(item => {
              if (typeof item === 'object' && item !== null) {
                const label = item.Label;
                const termId = item.TermGuid || item.TermID;

                if (label && termId) {
                  return {
                    Label: label,
                    TermID: termId,
                  } as TaxonomyFieldValue;
                }
              }
              return undefined;
            })
            .filter((item): item is TaxonomyFieldValue => item !== undefined);
          return taxonomyValues.length > 0 ? taxonomyValues : [];
        }
        return [];
      }

      case SPFieldType.Calculated:
      case SPFieldType.Computed:
        // Calculated fields can return various types based on their formula
        // Return the raw value since we can't predict the type
        return value;

      default:
        // For unknown field types, return the raw value
        return value;
    }
  } catch (error) {
    // Return undefined instead of raw value on conversion error
    return undefined;
  }
}
