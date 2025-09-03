// ==================== Main Component Exports ====================
// Core Card Components
export { Card, SafeCard, CardContext, useCardContext } from './components/Card';
export { Header, SimpleHeader, IconHeader, BadgeHeader, SubtitleHeader } from './components/Header';
export { Content, ScrollableContent, TabbedContent, CollapsibleSection } from './components/Content';
export { Footer, ActionFooter, StatusFooter, ProgressFooter, ExpandableFooter, MultiColumnFooter } from './components/Footer';
export { ActionButtons, StandaloneActionButtons, CompactActionButtons } from './components/ActionButtons';
export { MaximizedView, CustomMaximizedView } from './components/MaximizedView';

// Accordion Components
export { 
  default as Accordion, 
  ControlledAccordion, 
  SearchableAccordion, 
  KeyboardAccordion, 
  useAccordion 
} from './Accordion';

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
  LoadingErrorBoundary 
} from './components/LoadingStates';

// ==================== Services ====================
export { cardController } from './services/CardController';
export { StorageService } from './services/StorageService';

// ==================== Hooks ====================
export { 
  useCardController, 
  useCardSubscription, 
  useGlobalCardSubscription, 
  useCardState, 
  useAllCardStates, 
  useCardControllerStats 
} from './hooks/useCardController';

export { 
  usePersistence, 
  useAccordionPersistence, 
  useAutoPersistence, 
  useStorageCleanup, 
  useStorageStats, 
  useBulkPersistence, 
  useCrossTabSync, 
  useValidatedPersistence 
} from './hooks/usePersistence';

export { useMaximize, useMaximizePortal } from './hooks/useMaximize';

// ==================== Utilities ====================
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
  AnimationScheduler 
} from './utils/animations';

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
  VALIDATION 
} from './utils/constants';

// ==================== Types ====================
export type { 
  // Core types
  CardProps, 
  CardVariant, 
  CardSize, 
  HeaderSize, 
  LoadingType, 
  ContentPadding,
  
  // Component props
  HeaderProps, 
  ContentProps, 
  FooterProps, 
  ActionButtonsProps, 
  MaximizedViewProps, 
  LoadingStateProps,
  
  // Accordion types
  AccordionProps,
  
  // Action and event types
  CardAction, 
  CardEventData, 
  CardEventType,
  
  // State and context types
  CardState, 
  CardRegistration, 
  CardContextType,
  
  // Controller types
  CardController, 
  CardControllerHook,
  
  // Storage types
  StorageConfig, 
  PersistedCardState,
  
  // Animation types
  AnimationConfig, 
  ScrollOptions,
  
  // Utility types
  CardError, 
  WithCardControllerProps 
} from './types/Card.types';

// ==================== Class Component Support ====================
export { 
  CardControllerComponent, 
  withCardController 
} from './components/Card';

// ==================== Constants for External Use ====================
export const CARD_VERSION = '1.0.0';

export const CARD_DEFAULTS = {
  size: 'regular' as CardSize,
  variant: 'default' as CardVariant,
  headerSize: 'regular' as HeaderSize,
  loadingType: 'none' as LoadingType,
  contentPadding: 'comfortable' as ContentPadding,
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
    disabled: false
  }
} as const;

// ==================== Utility Functions ====================

/**
 * Create a card configuration object with defaults
 */
export const createCardConfig = (overrides?: Partial<CardProps>) => ({
  ...CARD_DEFAULTS,
  ...overrides
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
  const hasCustomProperties = CSS.supports('--test', 'value');
  const hasIntersectionObserver = 'IntersectionObserver' in window;

  return {
    storage: hasStorage,
    animations: hasAnimations,
    customProperties: hasCustomProperties,
    intersectionObserver: hasIntersectionObserver
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
  const { 
    globalAnimation = true, 
    storagePrefix = 'spfx-cards',
    debugMode = false 
  } = config || {};

  // Initialize animations if enabled
  if (globalAnimation) {
    initializeCardAnimations();
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
      debugMode
    }
  };
};

/**
 * Cleanup card system resources
 */
export const cleanupCardSystem = () => {
  // Clear animation scheduler
  animationScheduler.clear();
  
  // Cleanup card controller
  cardController.cleanup();
  
  // Remove debug classes
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('spfx-debug-animations');
  }
  
  console.log('[SpfxCard] System cleanup completed');
};

// ==================== React DevTools Support ====================
if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (id, root) => {
    // Add card system info to React DevTools
    if (root && root._debugRootType) {
      root._debugInfo = {
        cardSystemVersion: CARD_VERSION,
        registeredCards: cardController.getRegisteredCardIds().length,
        ...checkBrowserSupport()
      };
    }
  };
}

// ==================== Performance Monitoring ====================
export const getPerformanceMetrics = () => {
  const stats = cardController.getStats();
  const storageService = StorageService.getInstance();
  const storageStats = storageService.getStats();
  
  return {
    cards: stats,
    storage: storageStats,
    timestamp: Date.now(),
    memory: typeof performance !== 'undefined' && performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    } : null
  };
};

// ==================== Error Reporting ====================
export const reportCardError = (error: CardError | Error, context?: string) => {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    context: context || 'unknown',
    timestamp: Date.now(),
    cardId: 'cardId' in error ? error.cardId : null,
    operation: 'operation' in error ? error.operation : null,
    browserInfo: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...checkBrowserSupport()
    },
    cardSystemInfo: {
      version: CARD_VERSION,
      ...getPerformanceMetrics()
    }
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
    fluentui: '>=8.0.0'
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
    'Error boundaries'
  ],
  browser: checkBrowserSupport()
});

// ==================== Default Export ====================
const SpfxCard = {
  // Components
  Card,
  SafeCard,
  Header,
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
  
  // Constants
  VERSION: CARD_VERSION,
  DEFAULTS: CARD_DEFAULTS
};

export default SpfxCard;
