export interface ConflictDetectionOptions {
  // Detection settings
  checkOnSave: boolean;
  checkInterval?: number; // milliseconds for polling (optional)
  
  // UI behavior
  showNotification: boolean;
  blockSave: boolean;
  logConflicts: boolean;
  
  // Customization
  notificationPosition: 'top' | 'bottom' | 'inline';
  customMessage?: string;
  onConflictDetected?: (conflict: ConflictInfo) => void;
  onConflictResolved?: () => void;
}

export interface ConflictInfo {
  hasConflict: boolean;
  originalVersion: string;
  currentVersion: string;
  lastModifiedBy: string;
  lastModified: Date;
  originalModified: Date;
  itemId: number;
  listId: string;
}

export interface ConflictDetectionState {
  isChecking: boolean;
  hasConflict: boolean;
  conflictInfo: ConflictInfo | null;
  lastChecked: Date | null;
  error: string | null;
}

export interface ConflictDetectionResult {
  success: boolean;
  conflictInfo: ConflictInfo | null;
  error?: string;
}

export interface ConflictResolutionAction {
  type: 'refresh' | 'overwrite' | 'cancel';
  message: string;
}

// Default options
export const DEFAULT_CONFLICT_OPTIONS: ConflictDetectionOptions = {
  checkOnSave: true,
  showNotification: true,
  blockSave: false,
  logConflicts: true,
  notificationPosition: 'top'
};

// SharePoint API interfaces
export interface SharePointListItem {
  Id: number;
  Modified: string;
  Editor: {
    Title: string;
    Email: string;
  };
  __metadata: {
    etag: string;
  };
}

export interface SharePointApiResponse {
  d: SharePointListItem;
}
