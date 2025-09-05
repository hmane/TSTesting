import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/security";
import "@pnp/sp/site-users";
import "@pnp/sp/site-groups";
import { Logger, LogLevel } from "@pnp/logging";

/**
 * Standard SharePoint permission levels
 */
export enum SPPermissionLevel {
  FullControl = "Full Control",
  Design = "Design", 
  Edit = "Edit",
  Contribute = "Contribute",
  Read = "Read",
  LimitedAccess = "Limited Access",
  ViewOnly = "View Only",
  RestrictedRead = "Restricted Read"
}

/**
 * Standard SharePoint group names
 * These are the default groups available in all SharePoint sites
 */
export const CommonGroupNames = {
  Owners: "Owners",
  Members: "Members", 
  Visitors: "Visitors"
} as const;

/**
 * Permission check result interface
 */
export interface IPermissionResult {
  hasPermission: boolean;
  permissionLevel?: string;
  roles?: string[];
  error?: string;
}

/**
 * User permission information
 */
export interface IUserPermissions {
  userId: number;
  loginName: string;
  email?: string;
  displayName?: string;
  groups: string[];
  permissionLevels: string[];
  directPermissions: boolean;
  inheritedPermissions: boolean;
}

/**
 * Item-level permission information
 */
export interface IItemPermissions {
  itemId: number;
  hasUniquePermissions: boolean;
  userPermissions: IUserPermissions[];
  groupPermissions: Array<{
    groupName: string;
    permissionLevels: string[];
  }>;
}

/**
 * Configuration for permission helper
 */
export interface IPermissionHelperConfig {
  enableCaching?: boolean;
  cacheTimeout?: number; // in milliseconds
  customGroupMappings?: { [key: string]: string }; // Map custom group names to standard roles
  permissionLevelMappings?: { [key: string]: string }; // Map custom permission levels
}

/**
 * Cached permission data
 */
interface ICachedPermission {
  data: any;
  timestamp: number;
  expiresAt: number;
}

/**
 * Permission Helper Utility for SharePoint
 * Provides easy-to-use methods for checking permissions and roles using string-based group names
 */
export class PermissionHelper {
  private sp: SPFI;
  private logger: Logger;
  private config: IPermissionHelperConfig;
  private cache: Map<string, ICachedPermission> = new Map();
  private currentUserCache?: any;

  constructor(sp: SPFI, config: IPermissionHelperConfig = {}) {
    this.sp = sp;
    this.logger = Logger.subscribe("PermissionHelper");
    this.config = {
      enableCaching: true,
      cacheTimeout: 300000, // 5 minutes default
      customGroupMappings: {},
      permissionLevelMappings: {},
      ...config
    };
    
    this.logger.write("PermissionHelper initialized", LogLevel.Verbose);
  }

  /**
   * Check if current user has specific permission level on a list
   * @param listName - Title of the SharePoint list
   * @param permissionLevel - Required permission level
   * @returns Promise<IPermissionResult>
   */
  public async userHasPermissionOnList(
    listName: string, 
    permissionLevel: SPPermissionLevel
  ): Promise<IPermissionResult> {
    try {
      this.logger.write(`Checking if user has '${permissionLevel}' permission on list '${listName}'`, LogLevel.Verbose);
      
      const cacheKey = `list_permission_${listName}_${permissionLevel}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.logger.write("Returning cached permission result", LogLevel.Verbose);
        return cached;
      }

      const list = this.sp.web.lists.getByTitle(listName);
      const userPermissions = await list.currentUserHasPermissions(this.mapPermissionLevel(permissionLevel));
      
      const result: IPermissionResult = {
        hasPermission: userPermissions,
        permissionLevel: permissionLevel
      };

      this.setCachedData(cacheKey, result);
      this.logger.write(`User ${userPermissions ? 'has' : 'does not have'} '${permissionLevel}' permission on list '${listName}'`, LogLevel.Verbose);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.write(`Error checking list permission: ${errorMessage}`, LogLevel.Error);
      
      return {
        hasPermission: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check if current user has specific permission level on a list item
   * @param listName - Title of the SharePoint list
   * @param itemId - ID of the list item
   * @param permissionLevel - Required permission level
   * @returns Promise<IPermissionResult>
   */
  public async userHasPermissionOnItem(
    listName: string, 
    itemId: number, 
    permissionLevel: SPPermissionLevel
  ): Promise<IPermissionResult> {
    try {
      this.logger.write(`Checking if user has '${permissionLevel}' permission on item ${itemId} in list '${listName}'`, LogLevel.Verbose);
      
      const cacheKey = `item_permission_${listName}_${itemId}_${permissionLevel}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.logger.write("Returning cached item permission result", LogLevel.Verbose);
        return cached;
      }

      const item = this.sp.web.lists.getByTitle(listName).items.getById(itemId);
      const userPermissions = await item.currentUserHasPermissions(this.mapPermissionLevel(permissionLevel));
      
      const result: IPermissionResult = {
        hasPermission: userPermissions,
        permissionLevel: permissionLevel
      };

      this.setCachedData(cacheKey, result);
      this.logger.write(`User ${userPermissions ? 'has' : 'does not have'} '${permissionLevel}' permission on item ${itemId}`, LogLevel.Verbose);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.write(`Error checking item permission: ${errorMessage}`, LogLevel.Error);
      
      return {
        hasPermission: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check if current user belongs to a specific SharePoint group
   * @param groupName - SharePoint group name (as string)
   * @returns Promise<IPermissionResult>
   */
  public async userHasRole(groupName: string): Promise<IPermissionResult> {
    try {
      this.logger.write(`Checking if user has role '${groupName}'`, LogLevel.Verbose);
      
      const cacheKey = `user_role_${groupName}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.logger.write("Returning cached role result", LogLevel.Verbose);
        return cached;
      }

      const currentUser = await this.getCurrentUser();
      const userGroups = await this.getUserGroups(currentUser.Id);
      
      // Map role to actual group name if needed
      const actualGroupName = this.mapRoleToGroupName(groupName);
      const hasRole = userGroups.some(group => 
        group.Title === actualGroupName || 
        group.Title.includes(actualGroupName) ||
        this.isRoleMatch(group.Title, actualGroupName)
      );
      
      const result: IPermissionResult = {
        hasPermission: hasRole,
        roles: userGroups.map(g => g.Title)
      };

      this.setCachedData(cacheKey, result);
      this.logger.write(`User ${hasRole ? 'has' : 'does not have'} role '${groupName}'`, LogLevel.Verbose);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.write(`Error checking user role: ${errorMessage}`, LogLevel.Error);
      
      return {
        hasPermission: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check if current user has any of the specified group names
   * @param groupNames - Array of SharePoint group names to check
   * @returns Promise<IPermissionResult>
   */
  public async userHasAnyRole(groupNames: string[]): Promise<IPermissionResult> {
    try {
      this.logger.write(`Checking if user has any of roles: ${groupNames.join(', ')}`, LogLevel.Verbose);
      
      const cacheKey = `user_any_roles_${groupNames.join('_')}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.logger.write("Returning cached any-role result", LogLevel.Verbose);
        return cached;
      }

      const currentUser = await this.getCurrentUser();
      const userGroups = await this.getUserGroups(currentUser.Id);
      const userGroupNames = userGroups.map(g => g.Title);
      
      const matchedRoles: string[] = [];
      
      for (const groupName of groupNames) {
        const actualGroupName = this.mapRoleToGroupName(groupName);
        const hasRole = userGroupNames.some(userGroupName => 
          userGroupName === actualGroupName || 
          userGroupName.includes(actualGroupName) ||
          this.isRoleMatch(userGroupName, actualGroupName)
        );
        
        if (hasRole) {
          matchedRoles.push(groupName);
        }
      }
      
      const result: IPermissionResult = {
        hasPermission: matchedRoles.length > 0,
        roles: matchedRoles
      };

      this.setCachedData(cacheKey, result);
      this.logger.write(`User has ${matchedRoles.length} matching roles: ${matchedRoles.join(', ')}`, LogLevel.Verbose);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.write(`Error checking any roles: ${errorMessage}`, LogLevel.Error);
      
      return {
        hasPermission: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check if current user has all of the specified group names
   * @param groupNames - Array of SharePoint group names that user must have all of
   * @returns Promise<IPermissionResult>
   */
  public async userHasAllRoles(groupNames: string[]): Promise<IPermissionResult> {
    try {
      this.logger.write(`Checking if user has all roles: ${groupNames.join(', ')}`, LogLevel.Verbose);
      
      const cacheKey = `user_all_roles_${groupNames.join('_')}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.logger.write("Returning cached all-roles result", LogLevel.Verbose);
        return cached;
      }

      const currentUser = await this.getCurrentUser();
      const userGroups = await this.getUserGroups(currentUser.Id);
      const userGroupNames = userGroups.map(g => g.Title);
      
      const matchedRoles: string[] = [];
      
      for (const groupName of groupNames) {
        const actualGroupName = this.mapRoleToGroupName(groupName);
        const hasRole = userGroupNames.some(userGroupName => 
          userGroupName === actualGroupName || 
          userGroupName.includes(actualGroupName) ||
          this.isRoleMatch(userGroupName, actualGroupName)
        );
        
        if (hasRole) {
          matchedRoles.push(groupName);
        }
      }
      
      const hasAllRoles = matchedRoles.length === groupNames.length;
      
      const result: IPermissionResult = {
        hasPermission: hasAllRoles,
        roles: matchedRoles
      };

      this.setCachedData(cacheKey, result);
      this.logger.write(`User has ${matchedRoles.length}/${groupNames.length} required roles`, LogLevel.Verbose);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.write(`Error checking all roles: ${errorMessage}`, LogLevel.Error);
      
      return {
        hasPermission: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get comprehensive permission information for current user
   * @param listName - Optional list name to check list-specific permissions
   * @returns Promise<IUserPermissions>
   */
  public async getCurrentUserPermissions(listName?: string): Promise<IUserPermissions> {
    try {
      this.logger.write(`Getting comprehensive permissions for current user${listName ? ` on list '${listName}'` : ''}`, LogLevel.Verbose);
      
      const cacheKey = `user_permissions_${listName || 'web'}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.logger.write("Returning cached user permissions", LogLevel.Verbose);
        return cached;
      }

      const currentUser = await this.getCurrentUser();
      const userGroups = await this.getUserGroups(currentUser.Id);
      
      let permissionLevels: string[] = [];
      
      if (listName) {
        // Get list-specific permissions
        const list = this.sp.web.lists.getByTitle(listName);
        const listPermissions = await list.getCurrentUserEffectivePermissions();
        permissionLevels = this.parsePermissionMask(listPermissions);
      } else {
        // Get web-level permissions
        const webPermissions = await this.sp.web.getCurrentUserEffectivePermissions();
        permissionLevels = this.parsePermissionMask(webPermissions);
      }
      
      const result: IUserPermissions = {
        userId: currentUser.Id,
        loginName: currentUser.LoginName,
        email: currentUser.Email,
        displayName: currentUser.Title,
        groups: userGroups.map(g => g.Title),
        permissionLevels,
        directPermissions: true, // Would need additional logic to determine this
        inheritedPermissions: true // Would need additional logic to determine this
      };

      this.setCachedData(cacheKey, result);
      this.logger.write(`Retrieved permissions for user '${currentUser.Title}' with ${userGroups.length} groups`, LogLevel.Verbose);
      
      return result;
    } catch (error) {
      this.logger.write(`Error getting user permissions: ${error}`, LogLevel.Error);
      throw error;
    }
  }

  /**
   * Get item-level permission information
   * @param listName - Title of the SharePoint list
   * @param itemId - ID of the list item
   * @returns Promise<IItemPermissions>
   */
  public async getItemPermissions(listName: string, itemId: number): Promise<IItemPermissions> {
    try {
      this.logger.write(`Getting permissions for item ${itemId} in list '${listName}'`, LogLevel.Verbose);
      
      const cacheKey = `item_permissions_${listName}_${itemId}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.logger.write("Returning cached item permissions", LogLevel.Verbose);
        return cached;
      }

      const item = this.sp.web.lists.getByTitle(listName).items.getById(itemId);
      
      // Check if item has unique permissions
      const hasUniquePermissions = await item.hasUniqueRoleAssignments();
      
      // Get role assignments
      const roleAssignments = await item.roleAssignments.expand("Member", "RoleDefinitionBindings")();
      
      const userPermissions: IUserPermissions[] = [];
      const groupPermissions: Array<{ groupName: string; permissionLevels: string[] }> = [];
      
      for (const assignment of roleAssignments) {
        const member = assignment.Member;
        const permissionLevels = assignment.RoleDefinitionBindings.map((role: any) => role.Name);
        
        if (member.PrincipalType === 1) { // User
          userPermissions.push({
            userId: member.Id,
            loginName: member.LoginName,
            email: member.Email,
            displayName: member.Title,
            groups: [], // Would need additional call to get user groups
            permissionLevels,
            directPermissions: true,
            inheritedPermissions: !hasUniquePermissions
          });
        } else if (member.PrincipalType === 8) { // Group
          groupPermissions.push({
            groupName: member.Title,
            permissionLevels
          });
        }
      }
      
      const result: IItemPermissions = {
        itemId,
        hasUniquePermissions,
        userPermissions,
        groupPermissions
      };

      this.setCachedData(cacheKey, result);
      this.logger.write(`Retrieved permissions for item ${itemId}: ${userPermissions.length} users, ${groupPermissions.length} groups`, LogLevel.Verbose);
      
      return result;
    } catch (error) {
      this.logger.write(`Error getting item permissions: ${error}`, LogLevel.Error);
      throw error;
    }
  }

  /**
   * Clear permission cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.currentUserCache = undefined;
    this.logger.write("Permission cache cleared", LogLevel.Verbose);
  }

  // Private helper methods

  private async getCurrentUser(): Promise<any> {
    if (this.currentUserCache) {
      return this.currentUserCache;
    }
    
    this.currentUserCache = await this.sp.web.currentUser();
    return this.currentUserCache;
  }

  private async getUserGroups(userId: number): Promise<any[]> {
    const cacheKey = `user_groups_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
    
    const groups = await this.sp.web.siteUsers.getById(userId).groups();
    this.setCachedData(cacheKey, groups);
    
    return groups;
  }

  private mapPermissionLevel(level: SPPermissionLevel): any {
    // Map to actual SharePoint permission mask values
    // This would need to be implemented based on PnP.js permission constants
    const mappings = this.config.permissionLevelMappings || {};
    return mappings[level] || level;
  }

  private mapRoleToGroupName(groupName: string): string {
    // Check custom mappings first
    const customMappings = this.config.customGroupMappings || {};
    if (customMappings[groupName]) {
      return customMappings[groupName];
    }
    
    // Default mapping for standard groups
    const defaultMappings: { [key: string]: string } = {
      "Owners": "Owners",
      "Members": "Members", 
      "Visitors": "Visitors"
    };
    
    return defaultMappings[groupName] || groupName;
  }

  private isRoleMatch(groupName: string, roleName: string): boolean {
    // Flexible matching - handles variations in group naming
    const normalizedGroup = groupName.toLowerCase().replace(/\s+/g, '');
    const normalizedRole = roleName.toLowerCase().replace(/\s+/g, '');
    
    return normalizedGroup.includes(normalizedRole) || normalizedRole.includes(normalizedGroup);
  }

  private parsePermissionMask(permissionMask: any): string[] {
    // This would need to be implemented to parse SharePoint permission masks
    // into readable permission level names
    // Placeholder implementation
    return ["Read", "Edit"]; // Would be replaced with actual parsing logic
  }

  private getCachedData(key: string): any {
    if (!this.config.enableCaching) {
      return null;
    }
    
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    
    return null;
  }

  private setCachedData(key: string, data: any): void {
    if (!this.config.enableCaching) {
      return;
    }
    
    const timeout = this.config.cacheTimeout || 300000;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + timeout
    });
  }
}

/**
 * Factory function to create a new PermissionHelper instance
 * @param sp - PnP.js SP instance
 * @param config - Optional configuration
 * @returns PermissionHelper instance
 */
export function createPermissionHelper(sp: SPFI, config?: IPermissionHelperConfig): PermissionHelper {
  return new PermissionHelper(sp, config);
}
