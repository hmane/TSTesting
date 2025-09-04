// hooks/useKeyboardShortcuts.ts
import { useEffect, useRef, useCallback } from 'react';
import { KeyboardShortcutConfig } from '../types/AutocompleteTypes';

interface KeyboardShortcuts {
  'Ctrl+A': () => void;
  'Ctrl+K': () => void;
  'Delete': () => void;
  'Backspace': () => void;
  'F2': () => void;
  'Escape': () => void;
}

interface UseKeyboardShortcutsOptions extends KeyboardShortcutConfig {
  onSelectAll?: () => void;
  onClearAll?: () => void;
  onRemoveLast?: () => void;
  onOpenDropdown?: () => void;
  onCloseDropdown?: () => void;
  onFocus?: () => void;
}

/**
 * Custom hook for handling keyboard shortcuts in autocomplete components
 * Supports multiple instances with scoped shortcuts
 */
export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions) => {
  const {
    enabled,
    scope,
    maxSelect,
    onValueChanged,
    currentValue,
    onSelectAll,
    onClearAll,
    onRemoveLast,
    onOpenDropdown,
    onCloseDropdown,
    onFocus
  } = options;

  const componentRef = useRef<HTMLElement>(null);
  const isFocusedRef = useRef<boolean>(false);
  const isMultiSelect = maxSelect > 1;

  // Track if component is focused
  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
  }, []);

  // Select all items (multi-select only)
  const handleSelectAll = useCallback(() => {
    if (!isMultiSelect || !onSelectAll) return;
    
    onSelectAll();
  }, [isMultiSelect, onSelectAll]);

  // Clear all selections
  const handleClearAll = useCallback(() => {
    if (onClearAll) {
      onClearAll();
    } else {
      const newValue = isMultiSelect ? [] : null;
      onValueChanged(newValue);
    }
  }, [isMultiSelect, onValueChanged, onClearAll]);

  // Remove last selected item
  const handleRemoveLast = useCallback(() => {
    if (!currentValue) return;

    if (isMultiSelect && Array.isArray(currentValue)) {
      if (currentValue.length > 0) {
        const newValue = currentValue.slice(0, -1);
        onValueChanged(newValue);
      }
    } else {
      // Single select - clear the value
      onValueChanged(null);
    }

    if (onRemoveLast) {
      onRemoveLast();
    }
  }, [currentValue, isMultiSelect, onValueChanged, onRemoveLast]);

  // Open dropdown
  const handleOpenDropdown = useCallback(() => {
    if (onOpenDropdown) {
      onOpenDropdown();
    }
    
    // Focus the component if not already focused
    if (componentRef.current && !isFocusedRef.current) {
      const input = componentRef.current.querySelector('input, [role="combobox"]') as HTMLElement;
      if (input && onFocus) {
        onFocus();
      }
    }
  }, [onOpenDropdown, onFocus]);

  // Close dropdown
  const handleCloseDropdown = useCallback(() => {
    if (onCloseDropdown) {
      onCloseDropdown();
    }
  }, [onCloseDropdown]);

  // Keyboard shortcuts mapping
  const shortcuts: KeyboardShortcuts = {
    'Ctrl+A': handleSelectAll,
    'Ctrl+K': handleClearAll,
    'Delete': handleRemoveLast,
    'Backspace': handleRemoveLast,
    'F2': handleOpenDropdown,
    'Escape': handleCloseDropdown
  };

  // Check if key combination matches
  const getKeyCombo = useCallback((event: KeyboardEvent): string | null => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    
    // Build key combination string
    let combo = '';
    
    if (ctrlKey || metaKey) combo += 'Ctrl+';
    if (shiftKey) combo += 'Shift+';
    if (altKey) combo += 'Alt+';
    
    // Normalize key names
    const normalizedKey = key === ' ' ? 'Space' : key;
    combo += normalizedKey;
    
    return combo;
  }, []);

  // Check if shortcut should be handled by this instance
  const shouldHandleShortcut = useCallback((event: KeyboardEvent): boolean => {
    // Don't handle if disabled
    if (!enabled) return false;

    // Don't handle if typing in input field (except for specific cases)
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    // Allow certain shortcuts even when typing
    const allowedInInput = ['Escape', 'F2'];
    const keyCombo = getKeyCombo(event);
    
    if (isInputField && keyCombo && !allowedInInput.includes(keyCombo.split('+').pop() || '')) {
      // Only handle Ctrl/Cmd combinations when in input field
      if (!event.ctrlKey && !event.metaKey) {
        return false;
      }
    }

    // Check if component is focused (for scoped shortcuts)
    if (scope) {
      return isFocusedRef.current;
    }

    // Global shortcuts - check if any autocomplete component should handle this
    const autoCompleteElements = document.querySelectorAll('[data-autocomplete-scope]');
    
    // If no scoped components exist, handle globally
    if (autoCompleteElements.length === 0) {
      return true;
    }

    // Check if any scoped component is focused
    let anyComponentFocused = false;
    autoCompleteElements.forEach(element => {
      if (element.contains(document.activeElement)) {
        anyComponentFocused = true;
      }
    });

    // If no scoped component is focused, allow global handling
    return !anyComponentFocused;
  }, [enabled, scope, getKeyCombo]);

  // Main keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!shouldHandleShortcut(event)) return;

    const keyCombo = getKeyCombo(event);
    if (!keyCombo) return;

    const shortcutHandler = shortcuts[keyCombo as keyof KeyboardShortcuts];
    
    if (shortcutHandler) {
      // Prevent default behavior and event bubbling
      event.preventDefault();
      event.stopPropagation();
      
      // Execute the shortcut
      try {
        shortcutHandler();
      } catch (error) {
        console.warn(`Failed to execute keyboard shortcut ${keyCombo}:`, error);
      }
    }
  }, [shouldHandleShortcut, getKeyCombo, shortcuts]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    // Add global keyboard listener
    document.addEventListener('keydown', handleKeyDown, true);

    // Add focus/blur listeners to component
    const element = componentRef.current;
    if (element) {
      element.addEventListener('focusin', handleFocus);
      element.addEventListener('focusout', handleBlur);
      
      // Set scope attribute for identification
      if (scope) {
        element.setAttribute('data-autocomplete-scope', scope);
      }
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      
      if (element) {
        element.removeEventListener('focusin', handleFocus);
        element.removeEventListener('focusout', handleBlur);
        
        if (scope) {
          element.removeAttribute('data-autocomplete-scope');
        }
      }
    };
  }, [enabled, handleKeyDown, handleFocus, handleBlur, scope]);

  // Return ref and helper functions
  return {
    componentRef,
    shortcuts: {
      selectAll: handleSelectAll,
      clearAll: handleClearAll,
      removeLast: handleRemoveLast,
      openDropdown: handleOpenDropdown,
      closeDropdown: handleCloseDropdown
    },
    isMultiSelect,
    isFocused: isFocusedRef.current
  };
};

/**
 * Helper hook for components that need to expose keyboard shortcut methods
 */
export const useKeyboardShortcutHelpers = (maxSelect: number, onValueChanged: (value: any) => void) => {
  const isMultiSelect = maxSelect > 1;

  const selectAll = useCallback(() => {
    // This would need to be implemented by the parent component
    // as it requires access to the full dataset
    console.warn('selectAll shortcut triggered - implement in parent component');
  }, []);

  const clearAll = useCallback(() => {
    const newValue = isMultiSelect ? [] : null;
    onValueChanged(newValue);
  }, [isMultiSelect, onValueChanged]);

  const removeLast = useCallback((currentValue: any) => {
    if (!currentValue) return;

    if (isMultiSelect && Array.isArray(currentValue)) {
      if (currentValue.length > 0) {
        const newValue = currentValue.slice(0, -1);
        onValueChanged(newValue);
      }
    } else {
      onValueChanged(null);
    }
  }, [isMultiSelect, onValueChanged]);

  return {
    selectAll,
    clearAll,
    removeLast,
    isMultiSelect
  };
};

/**
 * Get list of available keyboard shortcuts for documentation/help
 */
export const getAvailableShortcuts = (isMultiSelect: boolean): Array<{key: string, description: string, condition?: string}> => {
  const shortcuts = [
    { key: 'Ctrl+K', description: 'Clear all selections' },
    { key: 'Delete / Backspace', description: 'Remove last selected item' },
    { key: 'F2', description: 'Open dropdown and focus input' },
    { key: 'Escape', description: 'Close dropdown' }
  ];

  if (isMultiSelect) {
    shortcuts.unshift({ key: 'Ctrl+A', description: 'Select all available items', condition: 'Multi-select mode only' });
  }

  return shortcuts;
};
