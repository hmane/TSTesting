// Export main classes
export { PermissionHelper } from './PermissionHelper';
export { BatchPermissionChecker } from './BatchPermissionChecker';
export { PermissionError } from './PermissionError';

// Export types and interfaces
export type {
  SPPermissionLevel,
  IPermissionResult,
  IUserPermissions,
  IItemPermissions,
  IPermissionHelperConfig,
  IPermissionMask,
  ICachedPermission,
  ISPUser,
  ISPGroup,
  ISPRoleAssignment,
  ISPItemWithPermissions,
  IBatchListRequest,
  IBatchItemRequest,
  PermissionErrorCode,
} from './types';

// Export constants from types
export { PermissionErrorCodes } from './types';

// Export constants
export {
  CommonGroupNames,
  PermissionOperations,
  PermissionHierarchy,
  DefaultPermissionMappings,
  DefaultGroupMappings,
  PermissionLevelHierarchy,
} from './constants';

// Export utility functions
export {
  getAllSiteGroups,
  permissionLevelIncludes,
  getPermissionNames,
  hasRequiredPermissions,
  getHighestPermissionLevel,
  isSPUser,
  isSPGroup,
  getErrorMessage,
  normalizeGroupName,
  isGroupNameMatch,
} from './utils';

// Export main factory function
import { SPFI } from '@pnp/sp';
import { PermissionHelper } from './PermissionHelper';
import { IPermissionHelperConfig } from './types';

/**
 * Factory function to create a new PermissionHelper instance
 * @param sp - PnP.js SP instance
 * @param config - Optional configuration
 * @returns PermissionHelper instance
 */
export function createPermissionHelper(
  sp: SPFI,
  config?: IPermissionHelperConfig
): PermissionHelper {
  return new PermissionHelper(sp, config);
}
