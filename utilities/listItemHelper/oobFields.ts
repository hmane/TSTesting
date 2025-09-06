import { FieldSchema, SPFieldType } from './types';

/**
 * Out-of-the-box SharePoint fields that are commonly used
 */
export const OOBFields = {
  Id: {
    internalName: 'ID',
    type: SPFieldType.Counter,
    readonly: true,
  } as FieldSchema,

  Title: {
    internalName: 'Title',
    type: SPFieldType.Text,
  } as FieldSchema,

  CreatedBy: {
    internalName: 'Author',
    type: SPFieldType.User,
    readonly: true,
  } as FieldSchema,

  ModifiedBy: {
    internalName: 'Editor',
    type: SPFieldType.User,
    readonly: true,
  } as FieldSchema,

  Created: {
    internalName: 'Created',
    type: SPFieldType.DateTime,
    readonly: true,
  } as FieldSchema,

  Modified: {
    internalName: 'Modified',
    type: SPFieldType.DateTime,
    readonly: true,
  } as FieldSchema,

  Version: {
    internalName: '_UIVersionString',
    type: SPFieldType.Text,
    readonly: true,
  } as FieldSchema,

  ContentType: {
    internalName: 'ContentType',
    type: SPFieldType.Text,
    readonly: true,
  } as FieldSchema,

  FileRef: {
    internalName: 'FileRef',
    type: SPFieldType.Text,
    readonly: true,
  } as FieldSchema,

  Attachments: {
    internalName: 'Attachments',
    type: SPFieldType.Attachments,
    readonly: true,
  } as FieldSchema,

  GUID: {
    internalName: 'GUID',
    type: SPFieldType.Guid,
    readonly: true,
  } as FieldSchema,

  WorkflowVersion: {
    internalName: 'WorkflowVersion',
    type: SPFieldType.Integer,
    readonly: true,
  } as FieldSchema,

  WorkflowInstanceID: {
    internalName: 'WorkflowInstanceID',
    type: SPFieldType.Guid,
    readonly: true,
  } as FieldSchema,
} as const;
