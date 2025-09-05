import { useState, useEffect, useRef, useCallback } from 'react';
import { ConflictDetector } from './ConflictDetector';
import { 
  ConflictDetectionOptions, 
  ConflictDetectionState, 
  ConflictInfo,
  DEFAULT_CONFLICT_OPTIONS 
} from './types';

interface UseConflictDetectionProps {
  listId: string;
  itemId: number;
  options?: Partial<ConflictDetectionOptions>;
  enabled?: boolean;
}

interface UseConflictDetectionReturn {
  // State
  isChecking: boolean;
  hasConflict: boolean;
  conflictInfo: ConflictInfo | null;
  lastChecked: Date | null;
  error: string | null;
  
  // Actions
  checkForConflicts: () => Promise<boolean>;
  updateSnapshot: () => Promise<boolean>;
  initialize: () => Promise<boolean>;
  dispose: () => void;
  
  // Utilities
  getDetector: () => ConflictDetector | null;
  refreshState: () => ConflictDetectionState;
}

export const useConflictDetection = ({
  listId,
  itemId,
  options = {},
  enabled = true
}: UseConflictDetectionProps): UseConflictDetectionReturn => {
  const [state, setState] = useState<ConflictDetectionState>({
    isChecking: false,
    hasConflict: false,
    conflictInfo: null,
    lastChecked: null,
    error: null
  });

  const detectorRef = useRef<ConflictDetector | null>(null);
  const isInitializedRef = useRef(false);

  const mergedOptions: ConflictDetectionOptions = {
    ...DEFAULT_CONFLICT_OPTIONS,
    ...options
  };

  const updateState = useCallback((updates: Partial<ConflictDetectionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const initialize = useCallback(async (): Promise<boolean> => {
    if (!enabled || !listId || !itemId) {
      return false;
    }

    // Dispose existing detector if any
    if (detectorRef.current) {
      detectorRef.current.dispose();
    }

    // Create new detector
    detectorRef.current = new ConflictDetector(listId, itemId, mergedOptions);
    
    updateState({ isChecking: true, error: null });

    try {
      const result = await detectorRef.current.initialize();
      
      if (result.success) {
        updateState({
          isChecking: false,
          hasConflict: false,
          conflictInfo: result.conflictInfo,
          lastChecked: new Date(),
          error: null
        });
        isInitializedRef.current = true;
        return true;
      } else {
        updateState({
          isChecking: false,
          error: result.error || 'Failed to initialize conflict detection'
        });
        isInitializedRef.current = false;
        return false;
      }
    } catch (error) {
      console.error('useConflictDetection: Initialize failed', error);
      updateState({
        isChecking: false,
        error: `Initialize failed: ${error.message}`
      });
      isInitializedRef.current = false;
      return false;
    }
  }, [listId, itemId, enabled, JSON.stringify(mergedOptions), updateState]);

  const checkForConflicts = useCallback(async (): Promise<boolean> => {
    if (!detectorRef.current || !isInitializedRef.current) {
      console.warn('useConflictDetection: Not initialized. Call initialize() first.');
      return false;
    }

    updateState({ isChecking: true, error: null });

    try {
      const result = await detectorRef.current.checkForConflicts();
      
      if (result.success && result.conflictInfo) {
        updateState({
          isChecking: false,
          hasConflict: result.conflictInfo.hasConflict,
          conflictInfo: result.conflictInfo,
          lastChecked: new Date(),
          error: null
        });
        
        return result.conflictInfo.hasConflict;
      } else {
        updateState({
          isChecking: false,
          error: result.error || 'Failed to check for conflicts'
        });
        return false;
      }
    } catch (error) {
      console.error('useConflictDetection: Check failed', error);
      updateState({
        isChecking: false,
        error: `Conflict check failed: ${error.message}`
      });
      return false;
    }
  }, [updateState]);

  const updateSnapshot = useCallback(async (): Promise<boolean> => {
    if (!detectorRef.current || !isInitializedRef.current) {
      console.warn('useConflictDetection: Not initialized.');
      return false;
    }

    try {
      const result = await detectorRef.current.updateSnapshot();
      
      if (result.success && result.conflictInfo) {
        updateState({
          hasConflict: false,
          conflictInfo: result.conflictInfo,
          lastChecked: new Date(),
          error: null
        });
        return true;
      } else {
        updateState({
          error: result.error || 'Failed to update snapshot'
        });
        return false;
      }
    } catch (error) {
      console.error('useConflictDetection: Update snapshot failed', error);
      updateState({
        error: `Update snapshot failed: ${error.message}`
      });
      return false;
    }
  }, [updateState]);

  const dispose = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.dispose();
      detectorRef.current = null;
    }
    isInitializedRef.current = false;
    setState({
      isChecking: false,
      hasConflict: false,
      conflictInfo: null,
      lastChecked: null,
      error: null
    });
  }, []);

  const getDetector = useCallback((): ConflictDetector | null => {
    return detectorRef.current;
  }, []);

  const refreshState = useCallback((): ConflictDetectionState => {
    return { ...state };
  }, [state]);

  // Auto-initialize when parameters change
  useEffect(() => {
    if (enabled && listId && itemId) {
      initialize();
    }
    
    return () => {
      dispose();
    };
  }, [listId, itemId, enabled]);

  // Update options when they change
  useEffect(() => {
    if (detectorRef.current && isInitializedRef.current) {
      detectorRef.current.updateOptions(mergedOptions);
    }
  }, [JSON.stringify(mergedOptions)]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return {
    // State
    isChecking: state.isChecking,
    hasConflict: state.hasConflict,
    conflictInfo: state.conflictInfo,
    lastChecked: state.lastChecked,
    error: state.error,
    
    // Actions
    checkForConflicts,
    updateSnapshot,
    initialize,
    dispose,
    
    // Utilities
    getDetector,
    refreshState
  };
};

// Higher-order hook for pre-save conflict checking
export const usePreSaveConflictCheck = (
  listId: string,
  itemId: number,
  options: Partial<ConflictDetectionOptions> = {}
) => {
  const conflictDetection = useConflictDetection({
    listId,
    itemId,
    options: { ...options, checkOnSave: true }
  });

  const checkBeforeSave = useCallback(async (): Promise<{
    canSave: boolean;
    hasConflict: boolean;
    conflictInfo: ConflictInfo | null;
  }> => {
    const hasConflict = await conflictDetection.checkForConflicts();
    
    // If blocking is enabled and there's a conflict, don't allow save
    const canSave = options.blockSave ? !hasConflict : true;
    
    return {
      canSave,
      hasConflict,
      conflictInfo: conflictDetection.conflictInfo
    };
  }, [conflictDetection, options.blockSave]);

  return {
    ...conflictDetection,
    checkBeforeSave
  };
};
