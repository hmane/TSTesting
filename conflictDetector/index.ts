// Core utilities
export { ConflictDetector } from './ConflictDetector';

// Types and interfaces
export type {
  ConflictDetectionOptions,
  ConflictInfo,
  ConflictDetectionState,
  ConflictDetectionResult,
  ConflictResolutionAction,
  SharePointListItem,
  SharePointApiResponse
} from './types';

export { DEFAULT_CONFLICT_OPTIONS } from './types';

// React hooks
export { 
  useConflictDetection, 
  usePreSaveConflictCheck 
} from './useConflictDetection';

// React context and provider
export { 
  ConflictDetectionProvider, 
  useConflictContext 
} from './ConflictContext';

// UI components
export { 
  ConflictNotificationBar,
  ConflictNotification,
  useConflictNotification
} from './ConflictNotificationBar';

export { 
  ConflictResolutionDialog,
  useConflictResolutionDialog,
  ConflictHandler
} from './ConflictResolutionDialog';

// Convenience exports for common patterns
export const ConflictDetectionUtils = {
  // Helper to create detector instance
  createDetector: (listId: string, itemId: number, options?: Partial<ConflictDetectionOptions>) => {
    return new ConflictDetector(listId, itemId, options);
  },

  // Helper to format dates consistently
  formatDateTime: (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Helper to check if conflict is recent (within last 5 minutes)
  isRecentConflict: (conflictInfo: ConflictInfo): boolean => {
    if (!conflictInfo.hasConflict) return false;
    const now = new Date().getTime();
    const conflictTime = new Date(conflictInfo.lastModified).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - conflictTime) < fiveMinutes;
  },

  // Helper to get conflict severity based on time difference
  getConflictSeverity: (conflictInfo: ConflictInfo): 'low' | 'medium' | 'high' => {
    if (!conflictInfo.hasConflict) return 'low';
    
    const now = new Date().getTime();
    const conflictTime = new Date(conflictInfo.lastModified).getTime();
    const timeDiff = now - conflictTime;
    
    const oneMinute = 60 * 1000;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeDiff < oneMinute) return 'high';
    if (timeDiff < fiveMinutes) return 'medium';
    return 'low';
  }
};

// Ready-to-use component combinations
export const ConflictDetectionComponents = {
  // Hook + Notification Bar (most common for function components)
  withNotificationBar: {
    useConflictDetection,
    ConflictNotificationBar
  },
  
  // Hook + Dialog (for advanced scenarios)
  withDialog: {
    useConflictDetection,
    ConflictResolutionDialog
  },
  
  // Provider + Context (best for class components)
  withProvider: {
    ConflictDetectionProvider,
    useConflictContext,
    ConflictHandler
  },
  
  // Complete solution with all UI elements
  complete: {
    ConflictDetectionProvider,
    useConflictDetection,
    ConflictHandler
  }
};

// Pre-configured options for common scenarios
export const ConflictDetectionPresets = {
  // Silent monitoring - just log conflicts
  silent: {
    checkOnSave: true,
    showNotification: false,
    blockSave: false,
    logConflicts: true,
    notificationPosition: 'top' as const
  },
  
  // Notification only - inform but don't block
  notify: {
    checkOnSave: true,
    showNotification: true,
    blockSave: false,
    logConflicts: true,
    notificationPosition: 'top' as const
  },
  
  // Strict mode - block saves on conflicts
  strict: {
    checkOnSave: true,
    showNotification: true,
    blockSave: true,
    logConflicts: true,
    notificationPosition: 'top' as const
  },
  
  // Real-time monitoring with polling
  realtime: {
    checkOnSave: true,
    checkInterval: 30000, // 30 seconds
    showNotification: true,
    blockSave: false,
    logConflicts: true,
    notificationPosition: 'top' as const
  },
  
  // Form customizer optimized
  formCustomizer: {
    checkOnSave: true,
    showNotification: true,
    blockSave: false,
    logConflicts: true,
    notificationPosition: 'inline' as const
  }
} satisfies Record<string, ConflictDetectionOptions>;

// Version info
export const version = '1.0.0';
export const name = 'spfx-conflict-detection';

// Default export for convenience
export default {
  ConflictDetector,
  useConflictDetection,
  ConflictDetectionProvider,
  ConflictHandler,
  ConflictDetectionUtils,
  ConflictDetectionPresets,
  version,
  name
};
