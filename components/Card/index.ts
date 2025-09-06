// ==================== Import All Dependencies ====================
import { Card, SafeCard, CardContext, useCardContext } from './components/Card';
import {
  Header,
  SimpleHeader,
  IconHeader,
  BadgeHeader,
  SubtitleHeader,
  type EnhancedHeaderProps,
} from './components/Header';
import {
  Content,
  ScrollableContent,
  TabbedContent,
  CollapsibleSection,
} from './components/Content';
import {
  Footer,
  ActionFooter,
  StatusFooter,
  ProgressFooter,
  ExpandableFooter,
  MultiColumnFooter,
} from './components/Footer';
import { ActionButtons } from './components/ActionButtons';
import { MaximizedView, CustomMaximizedView } from './components/MaximizedView';

// Accordion Components
import Accordion, {
  ControlledAccordion,
  SearchableAccordion,
  KeyboardAccordion,
  useAccordion,
  type AccordionHandle,
} from './Accordion';

// Loading Components
import {
  CardLoading,
  SpinnerLoading,
  SkeletonLoading,
  ShimmerLoading,
  OverlayLoading,
  HeaderLoadingShimmer,
  CustomLoading,
  ContentLoadingPlaceholder,
  LoadingDots,
  ProgressLoading,
  LoadingErrorBoundary,
} from './components/LoadingStates';

// Services
import { cardController } from './services/CardController';
import { StorageService } from './services/StorageService';

// Hooks
import {
  useCardController,
  useCardSubscription,
  useGlobalCardSubscription,
  useCardState,
  useAllCardStates,
  useCardControllerStats,
} from './hooks/useCardController';

import {
  usePersistence,
  useAccordionPersistence,
  useAutoPersistence,
  useStorageCleanup,
  useStorageStats,
  useBulkPersistence,
  useCrossTabSync,
  useValidatedPersistence,
} from './hooks/usePersistence';

import { useMaximize, useMaximizePortal } from './hooks/useMaximize';

// Utilities
import {
  initializeCardAnimations,
  getAnimationStyle,
  animateElement,
  getTransitionStyle,
  prefersReducedMotion,
  getAnimationDuration,
  getAnimationClassName,
  injectKeyframes,
  animationScheduler,
  debounceAnimation,
  createAnimationVariables,
  smoothHeightTransition,
  AnimationScheduler,
} from './utils/animations';

import {
  STORAGE_KEYS,
  ANIMATION,
  BREAKPOINTS,
  DEFAULT_ICONS,
  SIZE_CONFIG,
  PADDING_CONFIG,
  THEME_COLORS,
  Z_INDEX,
  LOADING_TEMPLATES,
  A11Y,
  PERFORMANCE,
  ERROR_MESSAGES,
  VALIDATION,
} from './utils/constants';

// Types
import type {
  CardProps,
  CardVariant,
  CardSize,
  HeaderSize,
  LoadingType,
  ContentPadding,
  HeaderProps,
  ContentProps,
  FooterProps,
  ActionButtonsProps,
  MaximizedViewProps,
  LoadingStateProps,
  AccordionProps,
  CardAction,
  CardEventData,
  CardEventType,
  CardState,
  CardRegistration,
  CardContextType,
  CardController,
  CardControllerHook,
  StorageConfig,
  PersistedCardState,
  AnimationConfig,
  ScrollOptions,
  CardError,
  WithCardControllerProps,
} from './Card.types';

import { CardControllerComponent, withCardController } from './components/Card';
import * as React from 'react';

// ==================== Re-Export All Components ====================
// Core Card Components
export { Card, SafeCard, CardContext, useCardContext };

// Header Components - Updated with all variants
export { Header, SimpleHeader, IconHeader, BadgeHeader, SubtitleHeader, type EnhancedHeaderProps };

export { Content, ScrollableContent, TabbedContent, CollapsibleSection };
export { Footer, ActionFooter, StatusFooter, ProgressFooter, ExpandableFooter, MultiColumnFooter };
export { ActionButtons };
export { MaximizedView, CustomMaximizedView };

// Accordion Components
export {
  Accordion,
  ControlledAccordion,
  SearchableAccordion,
  KeyboardAccordion,
  useAccordion,
  type AccordionHandle,
};

// Loading Components
export {
  CardLoading,
  SpinnerLoading,
  SkeletonLoading,
  ShimmerLoading,
  OverlayLoading,
  HeaderLoadingShimmer,
  CustomLoading,
  ContentLoadingPlaceholder,
  LoadingDots,
  ProgressLoading,
  LoadingErrorBoundary,
};

// Services
export { cardController, StorageService };

// Hooks
export {
  useCardController,
  useCardSubscription,
  useGlobalCardSubscription,
  useCardState,
  useAllCardStates,
  useCardControllerStats,
};

export {
  usePersistence,
  useAccordionPersistence,
  useAutoPersistence,
  useStorageCleanup,
  useStorageStats,
  useBulkPersistence,
  useCrossTabSync,
  useValidatedPersistence,
};

export { useMaximize, useMaximizePortal };

// Utilities
export {
  initializeCardAnimations,
  getAnimationStyle,
  animateElement,
  getTransitionStyle,
  prefersReducedMotion,
  getAnimationDuration,
  getAnimationClassName,
  injectKeyframes,
  animationScheduler,
  debounceAnimation,
  createAnimationVariables,
  smoothHeightTransition,
  AnimationScheduler,
};

export {
  STORAGE_KEYS,
  ANIMATION,
  BREAKPOINTS,
  DEFAULT_ICONS,
  SIZE_CONFIG,
  PADDING_CONFIG,
  THEME_COLORS,
  Z_INDEX,
  LOADING_TEMPLATES,
  A11Y,
  PERFORMANCE,
  ERROR_MESSAGES,
  VALIDATION,
};

// Types
export type {
  CardProps,
  CardVariant,
  CardSize,
  HeaderSize,
  LoadingType,
  ContentPadding,
  HeaderProps,
  ContentProps,
  FooterProps,
  ActionButtonsProps,
  MaximizedViewProps,
  LoadingStateProps,
  AccordionProps,
  CardAction,
  CardEventData,
  CardEventType,
  CardState,
  CardRegistration,
  CardContextType,
  CardController,
  CardControllerHook,
  StorageConfig,
  PersistedCardState,
  AnimationConfig,
  ScrollOptions,
  CardError,
  WithCardControllerProps,
};

// Class Component Support
export { CardControllerComponent, withCardController };

// ==================== Constants for External Use ====================
export const CARD_VERSION = '1.0.1'; // Updated version

export const CARD_DEFAULTS = {
  size: 'regular' as const,
  variant: 'default' as const,
  headerSize: 'regular' as const,
  loadingType: 'none' as const,
  contentPadding: 'comfortable' as const,
  elevation: 2 as const,
  allowExpand: true,
  allowMaximize: false,
  lazyLoad: false,
  persist: false,
  highlightOnProgrammaticChange: true,
  highlightDuration: 600,
  animation: {
    duration: 350,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    disabled: false,
  },
} as const;

// ==================== Utility Functions ====================

/**
 * Create a card configuration object with defaults
 */
export const createCardConfig = (overrides?: Partial<CardProps>) => ({
  ...CARD_DEFAULTS,
  ...overrides,
});

/**
 * Validate card ID format
 */
export const isValidCardId = (id: string): boolean => {
  return VALIDATION.CARD_ID.test(id);
};

/**
 * Generate a unique card ID
 */
export const generateCardId = (prefix: string = 'card'): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Check if browser supports required features
 */
export const checkBrowserSupport = (): {
  storage: boolean;
  animations: boolean;
  customProperties: boolean;
  intersectionObserver: boolean;
} => {
  const hasStorage = typeof Storage !== 'undefined';
  const hasAnimations = 'animate' in document.createElement('div');
  const hasCustomProperties =
    typeof CSS !== 'undefined' && CSS.supports && CSS.supports('--test', 'value');
  const hasIntersectionObserver = 'IntersectionObserver' in window;

  return {
    storage: hasStorage,
    animations: hasAnimations,
    customProperties: hasCustomProperties,
    intersectionObserver: hasIntersectionObserver,
  };
};

/**
 * Initialize the card system with global configuration
 */
export const initializeCardSystem = (config?: {
  globalAnimation?: boolean;
  storagePrefix?: string;
  debugMode?: boolean;
}) => {
  const { globalAnimation = true, storagePrefix = 'spfx-cards', debugMode = false } = config || {};

  // Initialize animations if enabled
  if (globalAnimation) {
    try {
      initializeCardAnimations();
    } catch (error) {
      console.warn('[SpfxCard] Animation initialization failed:', error);
    }
  }

  // Set global debug mode
  if (debugMode && typeof document !== 'undefined') {
    document.documentElement.classList.add('spfx-debug-animations');
  }

  // Log system status
  const support = checkBrowserSupport();
  if (debugMode) {
    console.log('[SpfxCard] System initialized with config:', config);
    console.log('[SpfxCard] Browser support:', support);
  }

  return {
    version: CARD_VERSION,
    support,
    config: {
      globalAnimation,
      storagePrefix,
      debugMode,
    },
  };
};

/**
 * Cleanup card system resources
 */
export const cleanupCardSystem = () => {
  try {
    // Clear animation scheduler
    animationScheduler.clear();

    // Cleanup card controller
    cardController.cleanup();

    // Remove debug classes
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('spfx-debug-animations');
    }

    console.log('[SpfxCard] System cleanup completed');
  } catch (error) {
    console.warn('[SpfxCard] Cleanup failed:', error);
  }
};

// ==================== Performance Monitoring ====================
export const getPerformanceMetrics = () => {
  try {
    const stats = cardController.getStats();
    const storageService = StorageService.getInstance();
    const storageStats = storageService.getStats();

    return {
      cards: stats,
      storage: storageStats,
      timestamp: Date.now(),
      memory:
        typeof performance !== 'undefined' && (performance as any).memory
          ? {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
              jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            }
          : null,
    };
  } catch (error) {
    console.warn('[SpfxCard] Performance metrics failed:', error);
    return {
      cards: {},
      storage: {},
      timestamp: Date.now(),
      memory: null,
    };
  }
};

// ==================== Error Reporting ====================
export const reportCardError = (error: CardError | Error, context?: string) => {
  const errorReport = {
    message: error.message || 'Unknown error',
    stack: error.stack || 'No stack trace',
    context: context || 'unknown',
    timestamp: Date.now(),
    cardId: 'cardId' in error ? error.cardId : null,
    operation: 'operation' in error ? error.operation : null,
    browserInfo: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...checkBrowserSupport(),
    },
    cardSystemInfo: {
      version: CARD_VERSION,
      ...getPerformanceMetrics(),
    },
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[SpfxCard] Error Report:', errorReport);
  }

  // Return report for custom error handling
  return errorReport;
};

// ==================== Version Information ====================
export const getVersionInfo = () => ({
  version: CARD_VERSION,
  buildDate: new Date().toISOString(),
  dependencies: {
    react: '>=16.8.0',
    fluentui: '>=8.0.0',
  },
  features: [
    'Card expand/collapse',
    'Card maximize/restore',
    'Accordion support',
    'Multiple loading states',
    'Persistence with localStorage',
    'Responsive design',
    'Accessibility support',
    'SharePoint theming',
    'TypeScript support',
    'Class component support',
    'Performance optimizations',
    'Animation system',
    'Error boundaries',
    'Integrated header actions', // NEW
    'Improved header sizing', // NEW
    'Smooth animations', // NEW
  ],
  browser: checkBrowserSupport(),
});

// ==================== Header Helper Functions (Simplified) ====================

/**
 * Simple helper to create header props with actions
 */
export const createHeaderProps = (
  actions: CardAction[],
  options?: {
    variant?: string;
    size?: 'compact' | 'regular' | 'large';
    hideExpandButton?: boolean;
    hideMaximizeButton?: boolean;
  }
) => {
  const { variant, size, hideExpandButton, hideMaximizeButton } = options || {};

  return {
    variant,
    size,
    actions,
    hideExpandButton,
    hideMaximizeButton,
  };
};

/**
 * Simple helper to create icon header props
 */
export const createIconHeaderProps = (
  icon: string,
  options?: {
    iconColor?: string;
    variant?: string;
    size?: 'compact' | 'regular' | 'large';
    actions?: CardAction[];
  }
) => {
  const { iconColor, variant, size, actions } = options || {};

  return {
    icon,
    iconColor,
    variant,
    size,
    actions,
  };
};

/**
 * Simple helper to create badge header props
 */
export const createBadgeHeaderProps = (
  badge: { text: string; color?: string; backgroundColor?: string },
  options?: {
    variant?: string;
    size?: 'compact' | 'regular' | 'large';
    actions?: CardAction[];
  }
) => {
  const { variant, size, actions } = options || {};

  return {
    badge,
    variant,
    size,
    actions,
  };
};

// ==================== Migration Helpers ====================

/**
 * Helper to migrate old ActionButtons usage to new Header props
 */
export const migrateActionButtonsToHeader = (
  headerElement: React.ReactElement,
  actionButtonsElement?: React.ReactElement
): React.ReactElement => {
  if (!actionButtonsElement) {
    return headerElement;
  }

  // Extract actions from ActionButtons props
  const actions = actionButtonsElement.props.actions || [];
  const hideExpandButton = actionButtonsElement.props.hideExpandButton;
  const hideMaximizeButton = actionButtonsElement.props.hideMaximizeButton;

  // Clone header with actions
  return React.cloneElement(headerElement, {
    ...headerElement.props,
    actions,
    hideExpandButton,
    hideMaximizeButton,
  });
};

/**
 * Backwards compatibility wrapper for old ActionButtons usage
 * @deprecated Use actions prop on Header instead
 */
export const LegacyActionButtons = ActionButtons;

// ==================== React DevTools Support ====================
if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (id: any, root: any) => {
    // Add card system info to React DevTools
    if (root && root._debugRootType) {
      root._debugInfo = {
        cardSystemVersion: CARD_VERSION,
        registeredCards: cardController.getRegisteredCardIds().length,
        improvements: [
          'Integrated header actions',
          'Improved header sizing',
          'Removed blue border on expand',
          'Smooth animations',
          'Better overflow handling',
        ],
        ...checkBrowserSupport(),
      };
    }
  };
}

// ==================== Default Export ====================
const SpfxCard = {
  // Core Components
  Card,
  SafeCard,

  // Header Components (all variants)
  Header,
  SimpleHeader,
  IconHeader,
  BadgeHeader,
  SubtitleHeader,

  // Other Components
  Content,
  Footer,
  ActionButtons,
  Accordion,

  // Hooks
  useCardController,
  useMaximize,
  usePersistence,

  // Services
  cardController,

  // Utilities
  initializeCardSystem,
  cleanupCardSystem,
  createCardConfig,
  generateCardId,
  isValidCardId,
  checkBrowserSupport,
  getPerformanceMetrics,
  getVersionInfo,
  reportCardError,

  // Header Helpers
  createHeaderProps,
  createIconHeaderProps,
  createBadgeHeaderProps,
  migrateActionButtonsToHeader,

  // Constants
  VERSION: CARD_VERSION,
  DEFAULTS: CARD_DEFAULTS,
};

export default SpfxCard;
