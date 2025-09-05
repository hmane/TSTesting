import { sp } from '@pnp/sp/presets/all';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import { 
  ConflictDetectionOptions, 
  ConflictInfo, 
  ConflictDetectionResult,
  SharePointListItem,
  DEFAULT_CONFLICT_OPTIONS 
} from './types';

export class ConflictDetector {
  private listId: string;
  private itemId: number;
  private options: ConflictDetectionOptions;
  private originalSnapshot: ConflictInfo | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(listId: string, itemId: number, options: Partial<ConflictDetectionOptions> = {}) {
    this.listId = listId;
    this.itemId = itemId;
    this.options = { ...DEFAULT_CONFLICT_OPTIONS, ...options };
    
    if (this.options.logConflicts) {
      console.log(`ConflictDetector initialized for List: ${listId}, Item: ${itemId}`);
    }
  }

  /**
   * Initialize conflict detection by taking a snapshot of current state
   */
  public async initialize(): Promise<ConflictDetectionResult> {
    try {
      const currentItem = await this.getCurrentItemInfo();
      if (!currentItem.success || !currentItem.conflictInfo) {
        return {
          success: false,
          conflictInfo: null,
          error: currentItem.error || 'Failed to get current item info'
        };
      }

      this.originalSnapshot = currentItem.conflictInfo;
      
      // Start polling if enabled
      if (this.options.checkInterval && this.options.checkInterval > 0) {
        this.startPolling();
      }

      if (this.options.logConflicts) {
        console.log('ConflictDetector initialized with snapshot:', this.originalSnapshot);
      }

      return {
        success: true,
        conflictInfo: this.originalSnapshot
      };
    } catch (error) {
      const errorMessage = `Failed to initialize ConflictDetector: ${error.message}`;
      console.error(errorMessage, error);
      return {
        success: false,
        conflictInfo: null,
        error: errorMessage
      };
    }
  }

  /**
   * Check for conflicts against the original snapshot
   */
  public async checkForConflicts(): Promise<ConflictDetectionResult> {
    if (!this.originalSnapshot) {
      return {
        success: false,
        conflictInfo: null,
        error: 'ConflictDetector not initialized. Call initialize() first.'
      };
    }

    try {
      const currentItem = await this.getCurrentItemInfo();
      if (!currentItem.success || !currentItem.conflictInfo) {
        return {
          success: false,
          conflictInfo: null,
          error: currentItem.error || 'Failed to get current item info'
        };
      }

      const hasConflict = this.detectConflict(this.originalSnapshot, currentItem.conflictInfo);
      
      const conflictInfo: ConflictInfo = {
        ...currentItem.conflictInfo,
        hasConflict,
        originalVersion: this.originalSnapshot.currentVersion,
        originalModified: this.originalSnapshot.lastModified
      };

      if (hasConflict) {
        if (this.options.logConflicts) {
          console.warn('Conflict detected:', {
            original: this.originalSnapshot,
            current: currentItem.conflictInfo
          });
        }

        // Trigger custom callback if provided
        if (this.options.onConflictDetected) {
          this.options.onConflictDetected(conflictInfo);
        }
      }

      return {
        success: true,
        conflictInfo
      };
    } catch (error) {
      const errorMessage = `Failed to check for conflicts: ${error.message}`;
      console.error(errorMessage, error);
      return {
        success: false,
        conflictInfo: null,
        error: errorMessage
      };
    }
  }

  /**
   * Update the original snapshot (call after successful save)
   */
  public async updateSnapshot(): Promise<ConflictDetectionResult> {
    const result = await this.getCurrentItemInfo();
    if (result.success && result.conflictInfo) {
      this.originalSnapshot = result.conflictInfo;
      
      if (this.options.logConflicts) {
        console.log('Snapshot updated:', this.originalSnapshot);
      }

      if (this.options.onConflictResolved) {
        this.options.onConflictResolved();
      }
    }
    return result;
  }

  /**
   * Start polling for conflicts
   */
  public startPolling(): void {
    if (!this.options.checkInterval || this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      const result = await this.checkForConflicts();
      if (result.success && result.conflictInfo?.hasConflict) {
        // Conflict detected during polling - let the UI components handle it
        if (this.options.logConflicts) {
          console.log('Polling detected conflict');
        }
      }
    }, this.options.checkInterval);

    if (this.options.logConflicts) {
      console.log(`Started polling every ${this.options.checkInterval}ms`);
    }
  }

  /**
   * Stop polling
   */
  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      
      if (this.options.logConflicts) {
        console.log('Stopped polling');
      }
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stopPolling();
    this.originalSnapshot = null;
    
    if (this.options.logConflicts) {
      console.log('ConflictDetector disposed');
    }
  }

  /**
   * Get current item information from SharePoint
   */
  private async getCurrentItemInfo(): Promise<ConflictDetectionResult> {
    try {
      const item: SharePointListItem = await sp.web.lists.getById(this.listId)
        .items.getById(this.itemId)
        .select('Id', 'Modified', 'Editor/Title', 'Editor/Email')
        .expand('Editor')
        .get();

      const conflictInfo: ConflictInfo = {
        hasConflict: false,
        originalVersion: item.__metadata.etag,
        currentVersion: item.__metadata.etag,
        lastModifiedBy: item.Editor?.Title || 'Unknown',
        lastModified: new Date(item.Modified),
        originalModified: new Date(item.Modified),
        itemId: this.itemId,
        listId: this.listId
      };

      return {
        success: true,
        conflictInfo
      };
    } catch (error) {
      const errorMessage = `Failed to get item info from SharePoint: ${error.message}`;
      return {
        success: false,
        conflictInfo: null,
        error: errorMessage
      };
    }
  }

  /**
   * Detect if there's a conflict between original and current state
   */
  private detectConflict(original: ConflictInfo, current: ConflictInfo): boolean {
    // Compare ETags (most reliable)
    if (original.currentVersion !== current.currentVersion) {
      return true;
    }

    // Fallback: Compare modified timestamps
    const originalTime = new Date(original.lastModified).getTime();
    const currentTime = new Date(current.lastModified).getTime();
    
    return currentTime > originalTime;
  }

  /**
   * Convert SharePoint item to ConflictInfo format
   */
  private convertItemToConflictInfo(item: SharePointListItem): ConflictInfo {
    return {
      hasConflict: false,
      originalVersion: item.__metadata.etag,
      currentVersion: item.__metadata.etag,
      lastModifiedBy: item.Editor?.Title || 'Unknown',
      lastModified: new Date(item.Modified),
      originalModified: new Date(item.Modified),
      itemId: this.itemId,
      listId: this.listId
    };
  }

  /**
   * Get current options
   */
  public getOptions(): ConflictDetectionOptions {
    return { ...this.options };
  }

  /**
   * Update options
   */
  public updateOptions(newOptions: Partial<ConflictDetectionOptions>): void {
    const oldInterval = this.options.checkInterval;
    this.options = { ...this.options, ...newOptions };

    // Handle polling interval changes
    if (oldInterval !== this.options.checkInterval) {
      this.stopPolling();
      if (this.options.checkInterval && this.options.checkInterval > 0) {
        this.startPolling();
      }
    }

    if (this.options.logConflicts) {
      console.log('ConflictDetector options updated:', this.options);
    }
  }
}
