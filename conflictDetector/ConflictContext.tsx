import * as React from 'react';
import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';
import { ConflictDetector } from './ConflictDetector';
import {
  ConflictDetectionOptions,
  ConflictDetectionState,
  DEFAULT_CONFLICT_OPTIONS,
} from './types';

interface ConflictContextValue {
  detector: ConflictDetector | null;
  checkForConflicts: () => Promise<void>;
  updateSnapshot: () => Promise<void>;
  getState: () => ConflictDetectionState;
}

interface ConflictProviderProps {
  listId: string;
  itemId: number;
  options?: Partial<ConflictDetectionOptions>;
  children: ReactNode;
  onStateChange?: (state: ConflictDetectionState) => void;
}

const ConflictContext = createContext<ConflictContextValue | null>(null);

export const ConflictDetectionProvider: React.FC<ConflictProviderProps> = ({
  listId,
  itemId,
  options = {},
  children,
  onStateChange,
}) => {
  const detectorRef = useRef<ConflictDetector | null>(null);
  const stateRef = useRef<ConflictDetectionState>({
    isChecking: false,
    hasConflict: false,
    conflictInfo: null,
    lastChecked: null,
    error: null,
  });

  const mergedOptions: ConflictDetectionOptions = {
    ...DEFAULT_CONFLICT_OPTIONS,
    ...options,
  };

  // Initialize detector
  useEffect(() => {
    const initializeDetector = async () => {
      if (!listId || !itemId) {
        console.warn('ConflictDetectionProvider: listId and itemId are required');
        return;
      }

      // Create new detector instance
      detectorRef.current = new ConflictDetector(listId, itemId, mergedOptions);

      // Update state to checking
      updateState({ isChecking: true, error: null });

      try {
        const result = await detectorRef.current.initialize();

        if (result.success) {
          updateState({
            isChecking: false,
            hasConflict: false,
            conflictInfo: result.conflictInfo,
            lastChecked: new Date(),
            error: null,
          });
        } else {
          updateState({
            isChecking: false,
            hasConflict: false,
            conflictInfo: null,
            lastChecked: new Date(),
            error: result.error || 'Failed to initialize conflict detection',
          });
        }
      } catch (error) {
        console.error('ConflictDetectionProvider: Failed to initialize', error);
        updateState({
          isChecking: false,
          hasConflict: false,
          conflictInfo: null,
          lastChecked: new Date(),
          error: `Initialization failed: ${error.message}`,
        });
      }
    };

    initializeDetector();

    // Cleanup function
    return () => {
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
    };
  }, [listId, itemId]);

  // Update options when they change
  useEffect(() => {
    if (detectorRef.current) {
      detectorRef.current.updateOptions(mergedOptions);
    }
  }, [JSON.stringify(mergedOptions)]);

  const updateState = (updates: Partial<ConflictDetectionState>) => {
    stateRef.current = { ...stateRef.current, ...updates };
    if (onStateChange) {
      onStateChange(stateRef.current);
    }
  };

  const checkForConflicts = async (): Promise<void> => {
    if (!detectorRef.current) {
      console.warn('ConflictDetectionProvider: Detector not initialized');
      return;
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
          error: null,
        });
      } else {
        updateState({
          isChecking: false,
          error: result.error || 'Failed to check for conflicts',
        });
      }
    } catch (error) {
      console.error('ConflictDetectionProvider: Failed to check conflicts', error);
      updateState({
        isChecking: false,
        error: `Conflict check failed: ${error.message}`,
      });
    }
  };

  const updateSnapshot = async (): Promise<void> => {
    if (!detectorRef.current) {
      console.warn('ConflictDetectionProvider: Detector not initialized');
      return;
    }

    try {
      const result = await detectorRef.current.updateSnapshot();

      if (result.success && result.conflictInfo) {
        updateState({
          hasConflict: false,
          conflictInfo: result.conflictInfo,
          lastChecked: new Date(),
          error: null,
        });
      } else {
        updateState({
          error: result.error || 'Failed to update snapshot',
        });
      }
    } catch (error) {
      console.error('ConflictDetectionProvider: Failed to update snapshot', error);
      updateState({
        error: `Snapshot update failed: ${error.message}`,
      });
    }
  };

  const getState = (): ConflictDetectionState => {
    return { ...stateRef.current };
  };

  const contextValue: ConflictContextValue = {
    detector: detectorRef.current,
    checkForConflicts,
    updateSnapshot,
    getState,
  };

  return <ConflictContext.Provider value={contextValue}>{children}</ConflictContext.Provider>;
};

// Custom hook to use the conflict context
export const useConflictContext = (): ConflictContextValue => {
  const context = useContext(ConflictContext);
  if (!context) {
    throw new Error('useConflictContext must be used within a ConflictDetectionProvider');
  }
  return context;
};
