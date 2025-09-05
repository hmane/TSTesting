# Permission Helper Utility for SharePoint

A comprehensive TypeScript utility for checking SharePoint permissions and group memberships in SPFx applications. Provides an easy-to-use API for role-based access control with intelligent caching and detailed permission information.

## 🚀 Features

- **Permission Level Checks** - Verify user permissions on lists and items
- **Group Membership Validation** - Check if users belong to specific SharePoint groups
- **Multiple Group Checks** - Verify any/all group memberships in a single call
- **Intelligent Caching** - Automatic caching with configurable timeouts for better performance
- **Comprehensive Results** - Detailed permission information and error handling
- **Type Safety** - Full TypeScript support with proper interfaces
- **Flexible Configuration** - Customizable group mappings and cache settings

## 📦 Installation

```bash
npm install @pnp/sp @pnp/logging
```

## 🛠️ Setup

```typescript
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/security";
import "@pnp/sp/site-users";
import "@pnp/sp/site-groups";
import { createPermissionHelper } from './PermissionHelper';

// Initialize PnP.js (SPFx example)
const sp = spfi().using(SPFx(this.context));

// Create permission helper
const permissionHelper = createPermissionHelper(sp);
```

## 📖 Basic Usage

### Permission Level Checks

```typescript
import { SPPermissionLevel } from './PermissionHelper';

// Check if user can edit a list
const canEdit = await permissionHelper.userHasPermissionOnList("Tasks", SPPermissionLevel.Edit);
if (canEdit.hasPermission) {
  console.log("User can edit the Tasks list");
}

// Check if user can read a specific item
const canRead = await permissionHelper.userHasPermissionOnItem("Documents", 123, SPPermissionLevel.Read);
if (canRead.hasPermission) {
  console.log("User can read document item 123");
}

// Check for full control
const isAdmin = await permissionHelper.userHasPermissionOnList("Site Pages", SPPermissionLevel.FullControl);
```

### Group Membership Checks

```typescript
// Check single group membership (use your actual SharePoint group names)
const isApprover = await permissionHelper.userHasRole("Document Approvers");
if (isApprover.hasPermission) {
  console.log("User is in Document Approvers group");
}

// Check if user is in any of several groups
const hasAnyRole = await permissionHelper.userHasAnyRole([
  "Project Managers", 
  "Team Leads", 
  "Administrators"
]);
if (hasAnyRole.hasPermission) {
  console.log(`User has roles: ${hasAnyRole.roles?.join(', ')}`);
}

// Check if user has all required roles
const hasAllRoles = await permissionHelper.userHasAllRoles([
  "Finance Team",
  "Level 2 Approvers"
]);
if (hasAllRoles.hasPermission) {
  console.log("User has all required finance permissions");
}
```

## ⚙️ Configuration

### Basic Configuration

```typescript
const permissionHelper = createPermissionHelper(sp, {
  enableCaching: true,
  cacheTimeout: 300000, // 5 minutes
});
```

### Advanced Configuration with Custom Mappings

```typescript
const permissionHelper = createPermissionHelper(sp, {
  enableCaching: true,
  cacheTimeout: 600000, // 10 minutes
  
  // Map common group names to your actual SharePoint group names
  customGroupMappings: {
    "Admins": "Site Collection Administrators",
    "Editors": "Content Editors Group", 
    "Reviewers": "Document Review Team",
    "Finance": "Finance Department - Full Access"
  },
  
  // Map permission levels if you have custom ones
  permissionLevelMappings: {
    "CustomEdit": "Custom Edit Permission Level"
  }
});
```

## 📊 Available Permission Levels

Use the `SPPermissionLevel` enum for standard SharePoint permissions:

```typescript
enum SPPermissionLevel {
  FullControl = "Full Control",
  Design = "Design", 
  Edit = "Edit",
  Contribute = "Contribute",
  Read = "Read",
  LimitedAccess = "Limited Access",
  ViewOnly = "View Only",
  RestrictedRead = "Restricted Read"
}
```

## 👥 Group Name Management

### Using Actual SharePoint Group Names

Always use your actual SharePoint group names as strings:

```typescript
// ✅ Correct - Use your actual SharePoint group names
await permissionHelper.userHasRole("Human Resources Team");
await permissionHelper.userHasRole("Project Alpha - Contributors");
await permissionHelper.userHasRole("Finance Approvers Level 2");

// ✅ Use default SharePoint groups
await permissionHelper.userHasRole("Owners");
await permissionHelper.userHasRole("Members");
await permissionHelper.userHasRole("Visitors");
```

### Common Group Name Constants (Optional)

You can use the provided constants for reference, but replace with your actual group names:

```typescript
import { CommonGroupNames } from './PermissionHelper';

// These are just examples - replace with your actual group names
const isOwner = await permissionHelper.userHasRole(CommonGroupNames.Owners); // "Owners"
const isMember = await permissionHelper.userHasRole("My Custom Members Group");
```

### Finding Your SharePoint Group Names

To find your actual SharePoint group names:

1. **SharePoint UI**: Go to Site Settings → People and Groups
2. **PowerShell**: Use `Get-PnPGroup` command
3. **Browser Console**: Use this helper function:

```typescript
// Helper function to list all site groups
async function listSiteGroups(sp: SPFI): Promise<string[]> {
  const groups = await sp.web.siteGroups();
  const groupNames = groups.map(group => group.Title);
  console.log("Available SharePoint Groups:", groupNames);
  return groupNames;
}
```

## 🔍 Advanced Usage

### Comprehensive Permission Information

```typescript
// Get detailed permission information for current user
const userPermissions = await permissionHelper.getCurrentUserPermissions();
console.log("User ID:", userPermissions.userId);
console.log("Groups:", userPermissions.groups);
console.log("Permission Levels:", userPermissions.permissionLevels);

// Get list-specific permissions
const listPermissions = await permissionHelper.getCurrentUserPermissions("Tasks");
console.log("User permissions on Tasks list:", listPermissions);

// Get item-level permission details
const itemPermissions = await permissionHelper.getItemPermissions("Documents", 123);
console.log("Item has unique permissions:", itemPermissions.hasUniquePermissions);
console.log("User permissions:", itemPermissions.userPermissions);
console.log("Group permissions:", itemPermissions.groupPermissions);
```

### Error Handling

```typescript
const result = await permissionHelper.userHasRole("NonExistent Group");
if (!result.hasPermission) {
  if (result.error) {
    console.error("Permission check failed:", result.error);
  } else {
    console.log("User is not in the group");
  }
}
```

### Cache Management

```typescript
// Clear cache when needed (e.g., after permission changes)
permissionHelper.clearCache();

// Disable caching for real-time checks
const realtimeHelper = createPermissionHelper(sp, {
  enableCaching: false
});
```

## 🏗️ Practical Examples

### 1. Conditional UI Rendering

```typescript
// React component example
import React, { useEffect, useState } from 'react';

const TaskManager: React.FC = () => {
  const [canCreateTasks, setCanCreateTasks] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const permHelper = createPermissionHelper(sp);
      
      // Check multiple permissions in parallel
      const [createCheck, approveCheck] = await Promise.all([
        permHelper.userHasPermissionOnList("Tasks", SPPermissionLevel.Contribute),
        permHelper.userHasRole("Task Approvers")
      ]);
      
      setCanCreateTasks(createCheck.hasPermission);
      setCanApprove(approveCheck.hasPermission);
    } catch (error) {
      console.error("Permission check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading permissions...</div>;

  return (
    <div>
      {canCreateTasks && (
        <button onClick={createTask}>Create New Task</button>
      )}
      
      {canApprove && (
        <button onClick={approveTasks}>Approve Tasks</button>
      )}
      
      {!canCreateTasks && !canApprove && (
        <div>You don't have permission to manage tasks.</div>
      )}
    </div>
  );
};
```

### 2. Role-Based Function Access

```typescript
class TaskService {
  private permissionHelper: PermissionHelper;

  constructor(sp: SPFI) {
    this.permissionHelper = createPermissionHelper(sp);
  }

  async createTask(taskData: any): Promise<void> {
    // Check permissions before proceeding
    const canCreate = await this.permissionHelper.userHasPermissionOnList(
      "Tasks", 
      SPPermissionLevel.Contribute
    );

    if (!canCreate.hasPermission) {
      throw new Error("Insufficient permissions to create tasks");
    }

    // Proceed with task creation
    // ... task creation logic
  }

  async approveTask(taskId: number): Promise<void> {
    // Check both permission level and group membership
    const [canEdit, isApprover] = await Promise.all([
      this.permissionHelper.userHasPermissionOnItem("Tasks", taskId, SPPermissionLevel.Edit),
      this.permissionHelper.userHasRole("Task Approvers")
    ]);

    if (!canEdit.hasPermission) {
      throw new Error("Cannot edit this task");
    }

    if (!isApprover.hasPermission) {
      throw new Error("User is not authorized to approve tasks");
    }

    // Proceed with approval
    // ... approval logic
  }

  async deleteTask(taskId: number): Promise<void> {
    // Only site owners or task creators can delete
    const [canDelete, isOwner] = await Promise.all([
      this.permissionHelper.userHasPermissionOnItem("Tasks", taskId, SPPermissionLevel.FullControl),
      this.permissionHelper.userHasRole("Owners")
    ]);

    if (!canDelete.hasPermission && !isOwner.hasPermission) {
      throw new Error("Insufficient permissions to delete tasks");
    }

    // Proceed with deletion
    // ... deletion logic
  }
}
```

### 3. Multi-Level Approval Workflow

```typescript
class ApprovalWorkflow {
  private permissionHelper: PermissionHelper;

  constructor(sp: SPFI) {
    this.permissionHelper = createPermissionHelper(sp);
  }

  async processApproval(documentId: number): Promise<string> {
    // Check what level of approval the user can perform
    const approvalChecks = await Promise.all([
      this.permissionHelper.userHasRole("Level 1 Approvers"),
      this.permissionHelper.userHasRole("Level 2 Approvers"), 
      this.permissionHelper.userHasRole("Level 3 Approvers"),
      this.permissionHelper.userHasRole("Final Approvers")
    ]);

    const [isLevel1, isLevel2, isLevel3, isFinal] = approvalChecks.map(r => r.hasPermission);

    // Determine highest approval level
    if (isFinal) return "FINAL_APPROVAL";
    if (isLevel3) return "LEVEL_3_APPROVAL";
    if (isLevel2) return "LEVEL_2_APPROVAL"; 
    if (isLevel1) return "LEVEL_1_APPROVAL";
    
    throw new Error("User does not have approval permissions");
  }

  async canBypassApproval(documentId: number): Promise<boolean> {
    // Check if user can bypass normal approval process
    const bypassChecks = await this.permissionHelper.userHasAnyRole([
      "Document Owners",
      "Emergency Approvers", 
      "Site Collection Administrators"
    ]);

    return bypassChecks.hasPermission;
  }
}
```

### 4. Department-Based Access Control

```typescript
class DepartmentAccessControl {
  private permissionHelper: PermissionHelper;

  constructor(sp: SPFI) {
    this.permissionHelper = createPermissionHelper(sp, {
      customGroupMappings: {
        "Admins": "Site Collection Administrators",
        "Editors": "Content Editors Group", 
        "Reviewers": "Document Review Team"
      }
    });
  }

  async getDepartmentAccess(): Promise<string[]> {
    // Check specific groups your organization uses
    const groupsToCheck = ["Admins", "Editors", "Reviewers"];
    const accessChecks = await Promise.all(
      groupsToCheck.map(group => this.permissionHelper.userHasRole(group))
    );

    return groupsToCheck.filter((_, index) => accessChecks[index].hasPermission);
  }

  async canAccessSensitiveData(): Promise<boolean> {
    // Check if user has access to sensitive data
    const sensitiveAccessCheck = await this.permissionHelper.userHasAnyRole([
      "Site Collection Administrators",
      "Security Team",
      "Executive Team"
    ]);
    
    return sensitiveAccessCheck.hasPermission;
  }
}
```

## 🔍 API Reference

### PermissionHelper Class

#### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `userHasPermissionOnList` | `listName: string, permissionLevel: SPPermissionLevel` | `Promise<IPermissionResult>` | Check user permission on a list |
| `userHasPermissionOnItem` | `listName: string, itemId: number, permissionLevel: SPPermissionLevel` | `Promise<IPermissionResult>` | Check user permission on a list item |
| `userHasRole` | `groupName: string` | `Promise<IPermissionResult>` | Check if user belongs to a SharePoint group |
| `userHasAnyRole` | `groupNames: string[]` | `Promise<IPermissionResult>` | Check if user has any of the specified roles |
| `userHasAllRoles` | `groupNames: string[]` | `Promise<IPermissionResult>` | Check if user has all of the specified roles |
| `getCurrentUserPermissions` | `listName?: string` | `Promise<IUserPermissions>` | Get comprehensive user permission information |
| `getItemPermissions` | `listName: string, itemId: number` | `Promise<IItemPermissions>` | Get item-level permission information |
| `clearCache` | - | `void` | Clear the permission cache |

### Interfaces

#### IPermissionResult
```typescript
interface IPermissionResult {
  hasPermission: boolean;
  permissionLevel?: string;
  roles?: string[];
  error?: string;
}
```

#### IPermissionHelperConfig
```typescript
interface IPermissionHelperConfig {
  enableCaching?: boolean;
  cacheTimeout?: number; // milliseconds
  customGroupMappings?: { [key: string]: string };
  permissionLevelMappings?: { [key: string]: string };
}
```

#### IUserPermissions
```typescript
interface IUserPermissions {
  userId: number;
  loginName: string;
  email?: string;
  displayName?: string;
  groups: string[];
  permissionLevels: string[];
  directPermissions: boolean;
  inheritedPermissions: boolean;
}
```

## 🛡️ Security Best Practices

1. **Always Check Permissions** - Never assume user permissions
2. **Use Specific Permission Levels** - Use the most restrictive level needed
3. **Handle Errors Gracefully** - Always check for errors in permission results
4. **Cache Appropriately** - Use caching for performance but clear when permissions change
5. **Validate Group Names** - Ensure SharePoint group names are correct
6. **Use HTTPS** - Always connect to SharePoint over HTTPS
7. **Audit Permission Checks** - Log permission decisions for security auditing

## 🔧 Troubleshooting

### Common Issues

1. **"Group not found" errors**
   ```typescript
   // Solution: Verify the exact SharePoint group name
   const groups = await sp.web.siteGroups();
   console.log(groups.map(g => g.Title));
   ```

2. **Permission checks return false unexpectedly**
   ```typescript
   // Solution: Check inherited vs unique permissions
   const itemPerms = await permissionHelper.getItemPermissions("ListName", itemId);
   console.log("Has unique permissions:", itemPerms.hasUniquePermissions);
   ```

3. **Slow performance**
   ```typescript
   // Solution: Enable caching and batch permission checks
   const permHelper = createPermissionHelper(sp, {
     enableCaching: true,
     cacheTimeout: 300000 // 5 minutes
   });
   ```

### Debug Mode

```typescript
// Enable detailed logging
import { Logger, LogLevel } from "@pnp/logging";

Logger.subscribe((entry) => {
  console.log(`[${LogLevel[entry.level]}] ${entry.message}`);
});

Logger.activeLogLevel = LogLevel.Verbose;
```

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

Contributions welcome! Please ensure:
- TypeScript compilation passes
- All tests pass  
- Follow existing code style
- Add tests for new features
- Update documentation

## 🔗 Related Documentation

- [SharePoint Permissions Overview](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/add-in-permissions-in-sharepoint)
- [PnP.js Security Documentation](https://pnp.github.io/pnpjs/sp/security/)
- [SharePoint Group Management](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/create-and-use-sharepoint-groups)
