/**
 * SharePoint Value Utilities - Main Exports
 * File: index.ts
 */

// Export all types and interfaces
export type {
  IListItemFormUpdateValue, IPrincipal, SPImage, SPLocation, SPLookup,
  SPTaxonomy,
  SPUrl
} from './spTypes';

// Export utility functions
export { createSPExtractor } from './spExtractor';
export { createSPUpdater } from './spUpdater';

