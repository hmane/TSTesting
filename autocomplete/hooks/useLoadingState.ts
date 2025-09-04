// hooks/useLoadingState.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { DataSource, CustomStore } from 'devextreme/data';
import { AUTOCOMPLETE_CONSTANTS } from '../types/AutocompleteTypes';

interface UseLoadingStateOptions {
  dataSource: DataSource | CustomStore | any[];
  showSpinner?: boolean;
  minimumLoadingTime?: number;
  debounceDelay?: number;
}

interface LoadingStateResult {
  isLoading: boolean;
  isInitialLoad: boolean;
  hasLoadedOnce: boolean;
  loadingSpinnerProps: {
    visible: boolean;
    position: 'right' | 'overlay';
    size: 'small' | 'medium';
  };
  setManualLoading: (loading: boolean) => void;
  resetLoadingState: () => void;
}

/**
 * Hook for managing loading states with proper timing and debouncing
 * Handles both automatic DataSource loading detection and manual control
 */
export const useLoadingState = (options: UseLoadingStateOptions): LoadingStateResult => {
  const {
    dataSource,
    showSpinner = true,
    minimumLoadingTime = AUTOCOMPLETE_CONSTANTS.LOADING_SPINNER_DELAY,
    debounceDelay = 100
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  const loadingStartTimeRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingOperationRef = useRef(false);

  // Set manual loading state
  const setManualLoadingState = useCallback((loading: boolean) => {
    setManualLoading(loading);
    
    if (loading) {
      handleLoadingStart();
    } else {
      handleLoadingEnd();
    }
  }, []);

  // Reset all loading states
  const resetLoadingState = useCallback(() => {
    setIsLoading(false);
    setIsInitialLoad(true);
    setHasLoadedOnce(false);
    setManualLoading(false);
    
    // Clear any pending timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    loadingStartTimeRef.current = null;
    isLoadingOperationRef.current = false;
  }, []);

  // Handle loading start with debouncing
  const handleLoadingStart = useCallback(() => {
    // Clear any existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce rapid loading calls
    debounceTimeoutRef.current = setTimeout(() => {
      if (!isLoadingOperationRef.current) {
        isLoadingOperationRef.current = true;
        loadingStartTimeRef.current = Date.now();
        setIsLoading(true);
      }
    }, debounceDelay);
  }, [debounceDelay]);

  // Handle loading end with minimum time enforcement
  const handleLoadingEnd = useCallback(() => {
    // Clear debounce if loading is ending before it started
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    const endLoading = () => {
      isLoadingOperationRef.current = false;
      setIsLoading(false);
      setIsInitialLoad(false);
      setHasLoadedOnce(true);
      loadingStartTimeRef.current = null;
    };

    // If we're not actually loading, end immediately
    if (!isLoadingOperationRef.current) {
      endLoading();
      return;
    }

    // Calculate remaining time to meet minimum loading duration
    const loadingDuration = loadingStartTimeRef.current 
      ? Date.now() - loadingStartTimeRef.current 
      : minimumLoadingTime;

    const remainingTime = Math.max(0, minimumLoadingTime - loadingDuration);

    if (remainingTime > 0) {
      // Wait for minimum time before ending loading
      loadingTimeoutRef.current = setTimeout(endLoading, remainingTime);
    } else {
      // End loading immediately
      endLoading();
    }
  }, [minimumLoadingTime]);

  // Monitor DataSource loading events
  useEffect(() => {
    if (!dataSource || Array.isArray(dataSource)) {
      // Static array - no loading events to monitor
      return;
    }

    let currentDataSource: DataSource;

    // Ensure we have a DataSource instance
    if (dataSource instanceof DataSource) {
      currentDataSource = dataSource;
    } else if (dataSource instanceof CustomStore) {
      currentDataSource = new DataSource({ store: dataSource });
    } else {
      return;
    }

    // Loading start handler
    const onLoadingChanged = (isLoading: boolean) => {
      if (isLoading) {
        handleLoadingStart();
      } else {
        handleLoadingEnd();
      }
    };

    // Load error handler
    const onLoadError = (error: any) => {
      console.warn('DataSource load error:', error);
      handleLoadingEnd();
    };

    // Monitor loading state changes
    let loadingMonitorInterval: NodeJS.Timeout | null = null;
    let lastLoadingState = false;

    const startLoadingMonitor = () => {
      loadingMonitorInterval = setInterval(() => {
        try {
          const currentLoadingState = currentDataSource.isLoading && currentDataSource.isLoading();
          
          if (currentLoadingState !== lastLoadingState) {
            lastLoadingState = currentLoadingState;
            onLoadingChanged(currentLoadingState);
          }
        } catch (error) {
          // Ignore errors from checking loading state
        }
      }, 50); // Check every 50ms
    };

    // Set up event listeners if available
    try {
      if (currentDataSource.on) {
        currentDataSource.on('loadingChanged', onLoadingChanged);
        currentDataSource.on('loadError', onLoadError);
      } else {
        // Fallback to polling if events aren't available
        startLoadingMonitor();
      }
    } catch (error) {
      // If event binding fails, use polling
      startLoadingMonitor();
    }

    // Cleanup
    return () => {
      try {
        if (currentDataSource.off) {
          currentDataSource.off('loadingChanged', onLoadingChanged);
          currentDataSource.off('loadError', onLoadError);
        }
      } catch (error) {
        // Ignore cleanup errors
      }

      if (loadingMonitorInterval) {
        clearInterval(loadingMonitorInterval);
      }
    };
  }, [dataSource, handleLoadingStart, handleLoadingEnd]);

  // Handle manual loading state
  useEffect(() => {
    if (manualLoading) {
      handleLoadingStart();
    } else if (!manualLoading && isLoadingOperationRef.current) {
      handleLoadingEnd();
    }
  }, [manualLoading, handleLoadingStart, handleLoadingEnd]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Calculate loading spinner properties
  const loadingSpinnerProps = {
    visible: showSpinner && (isLoading || manualLoading),
    position: 'right' as const,
    size: isInitialLoad ? 'medium' as const : 'small' as const
  };

  return {
    isLoading: isLoading || manualLoading,
    isInitialLoad,
    hasLoadedOnce,
    loadingSpinnerProps,
    setManualLoading: setManualLoadingState,
    resetLoadingState
  };
};

/**
 * Simplified loading hook for manual control only
 */
export const useManualLoadingState = (
  initialLoading = false,
  minimumLoadingTime = AUTOCOMPLETE_CONSTANTS.LOADING_SPINNER_DELAY
) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const loadingStartTimeRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    loadingStartTimeRef.current = Date.now();
    setIsLoading(true);
  }, []);

  const endLoading = useCallback(() => {
    const endLoadingImmediately = () => {
      setIsLoading(false);
      loadingStartTimeRef.current = null;
    };

    if (!loadingStartTimeRef.current) {
      endLoadingImmediately();
      return;
    }

    const loadingDuration = Date.now() - loadingStartTimeRef.current;
    const remainingTime = Math.max(0, minimumLoadingTime - loadingDuration);

    if (remainingTime > 0) {
      loadingTimeoutRef.current = setTimeout(endLoadingImmediately, remainingTime);
    } else {
      endLoadingImmediately();
    }
  }, [minimumLoadingTime]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    startLoading,
    endLoading,
    setLoading: setIsLoading
  };
};
