import { useEffect, useState } from 'react';
import type { LayoutType } from '../Field.types';

interface UseResponsiveLayoutOptions {
  layout: LayoutType;
  breakpoint?: number;
}

interface UseResponsiveLayoutReturn {
  currentLayout: 'horizontal' | 'vertical';
  isMobile: boolean;
}

/**
 * Hook for responsive layout management
 * Handles auto layout switching based on screen size
 */
export const useResponsiveLayout = ({
  layout,
  breakpoint = 640,
}: UseResponsiveLayoutOptions): UseResponsiveLayoutReturn => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Only set up media query if using auto layout
    if (layout !== 'auto') {
      return;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

    // Set initial state
    setIsMobile(mediaQuery.matches);

    // Handle changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Modern way to add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [layout, breakpoint]);

  // Determine current layout
  const getCurrentLayout = (): 'horizontal' | 'vertical' => {
    switch (layout) {
      case 'auto':
        return isMobile ? 'vertical' : 'horizontal';
      case 'horizontal':
      case 'vertical':
        return layout;
      default:
        return 'horizontal';
    }
  };

  return {
    currentLayout: getCurrentLayout(),
    isMobile,
  };
};
