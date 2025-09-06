/**
 * Core types and interfaces for SharePoint List Item Helper
 */

/**
 * Custom IPrincipal interface for user fields
 */
export interface IPrincipal {
  id: string;
  email: string;
  department: string;
  jobTitle: string;
  sip: string;
  title: string;
  value: string;
  picture: string;
}

/**
 * Interface for Taxonomy field values
 */
export interface TaxonomyFieldValue {
  Label: string;
  TermID: string;
}

/**
 * SharePoint Field Types enumeration
 * Based on PnP-JS-Core FieldTypes enum
 */
export enum SPFieldType {
  Invalid = 0,
  Integer = 1,
  Text = 2,
  Note = 3,
  DateTime = 4,
  Counter = 5,
  Choice = 6,
  Lookup = 7,
  Boolean = 8,
  Number = 9,
  Currency = 10,
  URL = 11,
  Computed = 12,
  Threading = 13,
  Guid = 14,
  MultiChoice = 15,
  GridChoice = 16,
  Calculated = 17,
  File = 18,
  Attachments = 19,
  User = 20,
  Recurrence = 21,
  CrossProjectLink = 22,
  ModStat = 23,
  Error = 24,
  ContentTypeId = 25,
  PageSeparator = 26,
  ThreadIndex = 27,
  WorkflowStatus = 28,
  AllDayEvent = 29,
  WorkflowEventType = 30,
  TaxonomyFieldType = 31, // Added for taxonomy fields
  TaxonomyFieldTypeMulti = 32, // Added for multi-value taxonomy fields
  UserMulti = 33, // Added for multi-user fields
  LookupMulti = 34, // Added for multi-lookup fields
}

/**
 * Schema definition for a SharePoint field
 */
export interface FieldSchema {
  internalName: string;
  type: SPFieldType;
  required?: boolean;
  readonly?: boolean;
  calculated?: boolean;
  defaultValue?: any;
  choices?: string[];
  lookupListId?: string;
  lookupField?: string;
  formula?: string;
  fieldRefs?: string[];
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
 * Form update value interface for PnP.js validate methods
 */
export interface IListItemFormUpdateValue {
  FieldName: string;
  FieldValue: string;
}
