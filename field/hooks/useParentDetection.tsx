import { useCallback, RefObject } from 'react';

// Import the card controller (assuming it's available)
// import { cardController } from '../Card/services/CardController';

interface ParentInfo {
  type: 'card' | 'accordion';
  id: string;
  isExpanded: boolean;
  element: HTMLElement;
  accordionId?: string; // For accordion cards
}

/**
 * Hook for detecting and interacting with parent Card/Accordion components
 * This makes Field component smart about its container environment
 */
export const useParentDetection = () => {
  /**
   * Detect parent Card or Accordion containing the field
   */
  const detectParent = useCallback((fieldRef: RefObject<HTMLElement>): ParentInfo | null => {
    const element = fieldRef.current;
    if (!element) return null;
    
    // Walk up the DOM tree to find parent containers
    let parent = element.parentElement;
    while (parent) {
      // Check for Card component
      if (parent.hasAttribute('data-card-id')) {
        const cardId = parent.getAttribute('data-card-id')!;
        const isExpanded = parent.getAttribute('data-card-expanded') === 'true';
        const accordionId = parent.getAttribute('data-accordion-id');
        
        return {
          type: accordionId ? 'accordion' : 'card',
          id: cardId,
          isExpanded,
          element: parent,
          accordionId: accordionId || undefined
        };
      }
      
      // Check for Accordion component (if card is not found first)
      if (parent.hasAttribute('data-accordion-id')) {
        const accordionId = parent.getAttribute('data-accordion-id')!;
        
        // For accordion, we need to find the specific card within it
        const cardElement = element.closest('[data-card-id]');
        if (cardElement) {
          const cardId = cardElement.getAttribute('data-card-id')!;
          const isExpanded = cardElement.getAttribute('data-card-expanded') === 'true';
          
          return {
            type: 'accordion',
            id: cardId,
            isExpanded,
            element: cardElement as HTMLElement,
            accordionId
          };
        }
      }
      
      parent = parent.parentElement;
    }
    
    return null;
  }, []);

  /**
   * Expand a parent card using the card controller
   */
  const expandParentCard = useCallback(async (cardId: string): Promise<boolean> => {
    try {
      // Check if cardController is available globally
      if (typeof window !== 'undefined' && (window as any).cardController) {
        const controller = (window as any).cardController;
        return controller.expandCard(cardId, true); // true for highlight
      }
      
      // Alternative: Try to find and import the controller dynamically
      try {
        const { cardController } = await import('../Card/services/CardController');
        return cardController.expandCard(cardId, true);
      } catch (importError) {
        console.warn('Card controller not available for import:', importError);
      }
      
      // Fallback: Use DOM manipulation
      return expandCardViaDom(cardId);
    } catch (error) {
      console.warn(`Failed to expand parent card ${cardId}:`, error);
      return false;
    }
  }, []);

  /**
   * Expand a card within an accordion
   */
  const expandParentAccordion = useCallback(async (
    accordionId: string, 
    cardId: string
  ): Promise<boolean> => {
    try {
      // Try to use accordion controller if available
      if (typeof window !== 'undefined' && (window as any).cardController) {
        const controller = (window as any).cardController;
        return controller.expandCard(cardId, true);
      }
      
      // Try dynamic import
      try {
        const { cardController } = await import('../Card/services/CardController');
        return cardController.expandCard(cardId, true);
      } catch (importError) {
        console.warn('Card controller not available for accordion expansion:', importError);
      }
      
      // Fallback: DOM manipulation
      return expandCardViaDom(cardId);
    } catch (error) {
      console.warn(`Failed to expand accordion card ${cardId}:`, error);
      return false;
    }
  }, []);

  /**
   * Check if a parent card/accordion is currently expanded
   */
  const isParentExpanded = useCallback((fieldRef: RefObject<HTMLElement>): boolean => {
    const parentInfo = detectParent(fieldRef);
    return parentInfo?.isExpanded ?? true; // Default to true if no parent
  }, [detectParent]);

  /**
   * Get parent container information
   */
  const getParentInfo = useCallback((fieldRef: RefObject<HTMLElement>): ParentInfo | null => {
    return detectParent(fieldRef);
  }, [detectParent]);

  return {
    detectParent,
    expandParentCard,
    expandParentAccordion,
    isParentExpanded,
    getParentInfo,
  };
};

/**
 * Fallback DOM-based card expansion when controller is not available
 */
const expandCardViaDom = (cardId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const cardElement = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement;
      if (!cardElement) {
        resolve(false);
        return;
      }

      // Check if already expanded
      if (cardElement.getAttribute('data-card-expanded') === 'true') {
        resolve(true);
        return;
      }

      // Find the header (clickable element)
      const headerElement = cardElement.querySelector('.spfx-card-header[role="button"]') as HTMLElement;
      if (!headerElement) {
        // Try to find expand button
        const expandButton = cardElement.querySelector('.spfx-card-expand-btn') as HTMLElement;
        if (expandButton) {
          expandButton.click();
          
          // Wait for animation
          setTimeout(() => {
            const isExpanded = cardElement.getAttribute('data-card-expanded') === 'true';
            resolve(isExpanded);
          }, 400); // Wait for typical animation duration
          return;
        }
        
        resolve(false);
        return;
      }

      // Click the header to expand
      headerElement.click();
      
      // Wait for animation to complete
      setTimeout(() => {
        const isExpanded = cardElement.getAttribute('data-card-expanded') === 'true';
        resolve(isExpanded);
      }, 400); // Wait for typical animation duration
      
    } catch (error) {
      console.warn('DOM-based card expansion failed:', error);
      resolve(false);
    }
  });
};

/**
 * Utility hook for field components that need to know about their parent context
 */
export const useFieldParentContext = (fieldRef: RefObject<HTMLElement>) => {
  const { detectParent, isParentExpanded } = useParentDetection();
  
  const parentInfo = detectParent(fieldRef);
  const expanded = isParentExpanded(fieldRef);
  
  return {
    hasParent: !!parentInfo,
    parentType: parentInfo?.type,
    parentId: parentInfo?.id,
    isParentExpanded: expanded,
    parentElement: parentInfo?.element,
    isInAccordion: !!parentInfo?.accordionId,
    accordionId: parentInfo?.accordionId,
  };
};
