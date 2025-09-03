import React, { 
  useState, 
  useEffect, 
  useRef, 
  createContext, 
  useContext, 
  useCallback, 
  useMemo,
  memo 
} from 'react';
import { cardController } from '../services/CardController';
import { useMaximize } from '../hooks/useMaximize';
import { usePersistence } from '../hooks/usePersistence';
import { MaximizedView } from './MaximizedView';
import { 
  CardProps, 
  CardContextType, 
  CardEventData, 
  CardEventType,
  CardAction,
  CardRegistration 
} from '../types/Card.types';
import { 
  SIZE_CONFIG, 
  THEME_COLORS, 
  DEFAULT_ICONS, 
  Z_INDEX,
  ANIMATION 
} from '../utils/constants';
import { 
  initializeCardAnimations, 
  getAnimationDuration,
  animationScheduler 
} from '../utils/animations';

// Create Card Context
export const CardContext = createContext<CardContextType | null>(null);

// Custom hook to use Card context
export const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('Card components must be used within a Card component');
  }
  return context;
};

/**
 * Performance utilities
 */
const useDebounce = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, delay);
  }, [callback, delay]);
};

/**
 * Main Card Component
 */
export const Card: React.FC<CardProps> = memo(({
  id,
  size = 'regular',
  defaultExpanded = false,
  allowExpand = true,
  allowMaximize = false,
  maximizeIcon = DEFAULT_ICONS.MAXIMIZE,
  restoreIcon = DEFAULT_ICONS.RESTORE,
  variant = 'default',
  headerSize = 'regular',
  customHeaderColor,
  loading = false,
  loadingType = 'none',
  loadingMessage = 'Loading...',
  lazyLoad = false,
  persist = false,
  persistKey,
  highlightOnProgrammaticChange = true,
  highlightDuration = 600,
  highlightColor,
  animation = {},
  onExpand,
  onCollapse,
  onMaximize,
  onRestore,
  onDataLoaded,
  onContentLoad,
  onCardEvent,
  className = '',
  style,
  elevation = 2,
  disabled = false,
  theme,
  accessibility = {},
  performance = {},
  children
}) => {
  // State management
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasContentLoaded, setHasContentLoaded] = useState(!lazyLoad || defaultExpanded);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout>();
  const previousLoadingRef = useRef(loading);
  const renderCountRef = useRef(0);

  // Maximize hook
  const {
    isMaximized,
    isAnimating: isMaximizeAnimating,
    maximize,
    restore,
    toggle: toggleMaximize
  } = useMaximize(
    id,
    allowMaximize,
    animation,
    () => {
      const eventData: CardEventData = { 
        cardId: id, 
        isExpanded, 
        isMaximized: true, 
        timestamp: Date.now(), 
        source: 'user' 
      };
      onMaximize?.(eventData);
      onCardEvent?.('maximize', eventData);
    },
    () => {
      const eventData: CardEventData = { 
        cardId: id, 
        isExpanded, 
        isMaximized: false, 
        timestamp: Date.now(), 
        source: 'user' 
      };
      onRestore?.(eventData);
      onCardEvent?.('restore', eventData);
    }
  );

  // Persistence hook
  const { saveCardState, loadCardState } = usePersistence(id, persist, persistKey);

  // Performance tracking
  useEffect(() => {
    renderCountRef.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[SpfxCard] Card ${id} rendered ${renderCountRef.current} times`);
    }
  });

  // Initialize animations on mount
  useEffect(() => {
    initializeCardAnimations();
  }, []);

  // Highlight function
  const highlightCard = useCallback(() => {
    if (!highlightOnProgrammaticChange) return;
    
    setIsHighlighted(true);
    
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    highlightTimeoutRef.current = setTimeout(() => {
      setIsHighlighted(false);
    }, highlightDuration);
  }, [highlightOnProgrammaticChange, highlightDuration]);

  // Scroll to card function
  const scrollToCard = useCallback((options: { smooth?: boolean; block?: ScrollLogicalPosition; offset?: number } = {}) => {
    if (!cardRef.current) return;
    
    const { smooth = true, block = 'center', offset = 0 } = options;
    
    const rect = cardRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset + rect.top + offset;
    
    if (smooth && 'scrollTo' in window) {
      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, scrollTop);
    }
  }, []);

  // Debounced toggle function
  const debouncedToggle = useDebounce(() => {
    handleToggleExpand('user');
  }, performance.debounceToggle || 0);

  // Expand/Collapse functions
  const expandFn = useCallback((source: 'user' | 'programmatic' = 'programmatic') => {
    if (!isExpanded && allowExpand && !disabled) {
      setIsExpanded(true);
      if (lazyLoad && !hasContentLoaded) {
        setHasContentLoaded(true);
      }
      
      const eventData: CardEventData = { 
        cardId: id, 
        isExpanded: true, 
        isMaximized,
        timestamp: Date.now(), 
        source 
      };
      
      // Save state if persistence enabled
      if (persist) {
        saveCardState({
          id,
          isExpanded: true,
          isMaximized,
          hasContentLoaded: hasContentLoaded || lazyLoad,
          lastUpdated: Date.now()
        });
      }
      
      onExpand?.(eventData);
      onCardEvent?.('expand', eventData);
    }
  }, [
    isExpanded, 
    allowExpand, 
    disabled, 
    lazyLoad, 
    hasContentLoaded, 
    id, 
    isMaximized,
    persist,
    saveCardState,
    onExpand, 
    onCardEvent
  ]);

  const collapseFn = useCallback((source: 'user' | 'programmatic' = 'programmatic') => {
    if (isExpanded && allowExpand && !disabled) {
      setIsExpanded(false);
      
      const eventData: CardEventData = { 
        cardId: id, 
        isExpanded: false, 
        isMaximized,
        timestamp: Date.now(), 
        source 
      };
      
      // Save state if persistence enabled
      if (persist) {
        saveCardState({
          id,
          isExpanded: false,
          isMaximized,
          hasContentLoaded,
          lastUpdated: Date.now()
        });
      }
      
      onCollapse?.(eventData);
      onCardEvent?.('collapse', eventData);
    }
  }, [
    isExpanded, 
    allowExpand, 
    disabled, 
    id, 
    isMaximized,
    hasContentLoaded,
    persist,
    saveCardState,
    onCollapse, 
    onCardEvent
  ]);

  const toggleFn = useCallback((source: 'user' | 'programmatic' = 'programmatic') => {
    if (isExpanded) {
      collapseFn(source);
    } else {
      expandFn(source);
    }
  }, [isExpanded, expandFn, collapseFn]);

  // Maximize functions
  const maximizeFn = useCallback((source: 'user' | 'programmatic' = 'programmatic') => {
    if (allowMaximize && !isMaximized && !isMaximizeAnimating) {
      maximize();
    }
  }, [allowMaximize, isMaximized, isMaximizeAnimating, maximize]);

  const restoreFn = useCallback((source: 'user' | 'programmatic' = 'programmatic') => {
    if (allowMaximize && isMaximized && !isMaximizeAnimating) {
      restore();
    }
  }, [allowMaximize, isMaximized, isMaximizeAnimating, restore]);

  // Register card with controller
  useEffect(() => {
    const registration: CardRegistration = {
      id,
      isExpanded,
      isMaximized,
      hasContentLoaded,
      toggleFn,
      expandFn,
      collapseFn,
      maximizeFn: allowMaximize ? maximizeFn : undefined,
      restoreFn: allowMaximize ? restoreFn : undefined,
      scrollToFn: scrollToCard,
      highlightFn: highlightCard
    };

    cardController.registerCard(registration);

    return () => {
      cardController.unregisterCard(id);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [
    id, 
    isExpanded, 
    isMaximized,
    hasContentLoaded, 
    toggleFn, 
    expandFn, 
    collapseFn, 
    maximizeFn, 
    restoreFn,
    scrollToCard,
    highlightCard,
    allowMaximize
  ]);

  // Load persisted state on mount
  useEffect(() => {
    if (persist) {
      const savedState = loadCardState();
      if (savedState) {
        setIsExpanded(savedState.isExpanded);
        setHasContentLoaded(savedState.hasContentLoaded);
        // Note: maximize state is handled by useMaximize hook
      }
    }
  }, [persist, loadCardState]);

  // Handle loading state changes
  useEffect(() => {
    if (previousLoadingRef.current && !loading && !hasDataLoaded) {
      setHasDataLoaded(true);
      const eventData: CardEventData = { 
        cardId: id, 
        isExpanded, 
        isMaximized,
        timestamp: Date.now(), 
        source: 'user' 
      };
      onDataLoaded?.(eventData);
      onCardEvent?.('contentLoad', eventData);
    }
    previousLoadingRef.current = loading;
  }, [loading, hasDataLoaded, onDataLoaded, onCardEvent, id, isExpanded, isMaximized]);

  // Handle content loading for lazy loading
  useEffect(() => {
    if (lazyLoad && isExpanded && !hasContentLoaded) {
      setHasContentLoaded(true);
      const eventData: CardEventData = { 
        cardId: id, 
        isExpanded, 
        isMaximized,
        timestamp: Date.now(), 
        source: 'user' 
      };
      onContentLoad?.(eventData);
      onCardEvent?.('contentLoad', eventData);
    }
  }, [lazyLoad, isExpanded, hasContentLoaded, onContentLoad, onCardEvent, id, isMaximized]);

  // Handle expand/collapse
  const handleToggleExpand = useCallback((source: 'user' | 'programmatic' = 'user') => {
    if (!allowExpand || disabled) return;
    toggleFn(source);
  }, [allowExpand, disabled, toggleFn]);

  // Handle maximize/restore
  const handleToggleMaximize = useCallback((source: 'user' | 'programmatic' = 'user') => {
    if (!allowMaximize || disabled) return;
    
    if (isMaximized) {
      restoreFn(source);
    } else {
      maximizeFn(source);
    }
  }, [allowMaximize, disabled, isMaximized, maximizeFn, restoreFn]);

  // Handle action click
  const handleActionClick = useCallback((action: CardAction, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!action.disabled && !disabled) {
      action.onClick(id);
    }
  }, [disabled, id]);

  // Handle content load callback
  const handleContentLoad = useCallback(() => {
    if (!hasContentLoaded) {
      setHasContentLoaded(true);
    }
    const eventData: CardEventData = { 
      cardId: id, 
      isExpanded, 
      isMaximized,
      timestamp: Date.now(), 
      source: 'user' 
    };
    onContentLoad?.(eventData);
    onCardEvent?.('contentLoad', eventData);
  }, [id, isExpanded, isMaximized, hasContentLoaded, onContentLoad, onCardEvent]);

  // Memoized styles and classes
  const cardStyle = useMemo(() => {
    const sizeConfig = SIZE_CONFIG[size];
    const themeColors = THEME_COLORS[variant];
    
    return {
      ...sizeConfig,
      ...(theme?.backgroundColor && { backgroundColor: theme.backgroundColor }),
      ...(theme?.borderColor && { borderColor: theme.borderColor }),
      ...(theme?.textColor && { color: theme.textColor }),
      ...(highlightColor && isHighlighted && { 
        borderColor: highlightColor,
        boxShadow: `0 0 0 2px ${highlightColor}33`
      }),
      ...style
    };
  }, [size, variant, theme, highlightColor, isHighlighted, style]);

  const cardClasses = useMemo(() => [
    'spfx-card',
    `spfx-card-${size}`,
    `spfx-card-${variant}`,
    `elevation-${elevation}`,
    disabled ? 'disabled' : '',
    isHighlighted ? 'highlight' : '',
    isMaximized ? 'maximized' : '',
    loading ? 'loading' : '',
    className
  ].filter(Boolean).join(' '), [
    size, 
    variant, 
    elevation, 
    disabled, 
    isHighlighted, 
    isMaximized,
    loading,
    className
  ]);

  // Memoized context value
  const contextValue = useMemo((): CardContextType => ({
    id,
    isExpanded,
    isMaximized,
    allowExpand,
    allowMaximize,
    disabled,
    loading,
    loadingType,
    variant,
    size,
    customHeaderColor,
    lazyLoad,
    hasContentLoaded,
    headerSize,
    onToggleExpand: performance.debounceToggle ? debouncedToggle : () => handleToggleExpand('user'),
    onToggleMaximize: () => handleToggleMaximize('user'),
    onActionClick: handleActionClick,
    onContentLoad: handleContentLoad,
  }), [
    id, 
    isExpanded, 
    isMaximized,
    allowExpand, 
    allowMaximize,
    disabled, 
    loading, 
    loadingType,
    variant,
    size,
    customHeaderColor,
    lazyLoad, 
    hasContentLoaded, 
    headerSize, 
    performance.debounceToggle,
    debouncedToggle, 
    handleToggleExpand, 
    handleToggleMaximize,
    handleActionClick, 
    handleContentLoad
  ]);

  // Card props with data attributes for querying
  const cardProps = useMemo(() => ({
    className: cardClasses,
    style: cardStyle,
    ref: cardRef,
    'data-card-id': id,
    'data-card-expanded': isExpanded,
    'data-card-maximized': isMaximized,
    ...(accessibility.region && {
      role: "region",
      'aria-labelledby': accessibility.labelledBy || `card-header-${id}`,
      'aria-describedby': accessibility.describedBy,
    }),
  }), [
    cardClasses, 
    cardStyle, 
    id, 
    isExpanded, 
    isMaximized,
    accessibility
  ]);

  const cardContent = (
    <CardContext.Provider value={contextValue}>
      <div {...cardProps}>
        {children}
      </div>
    </CardContext.Provider>
  );

  // If maximized, render in maximized view
  if (isMaximized) {
    return (
      <>
        {/* Original card placeholder */}
        <div 
          className={`${cardClasses} maximized-placeholder`}
          style={{ 
            ...cardStyle, 
            opacity: 0.5, 
            pointerEvents: 'none' 
          }}
          data-card-id={`${id}-placeholder`}
        />
        
        {/* Maximized view */}
        <MaximizedView
          cardId={id}
          onRestore={() => handleToggleMaximize('user')}
          restoreIcon={restoreIcon}
        >
          {cardContent}
        </MaximizedView>
      </>
    );
  }

  return cardContent;
});

Card.displayName = 'SpfxCard';

/**
 * Card with built-in error boundary
 */
export const SafeCard: React.FC<CardProps & {
  errorFallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({ errorFallback, onError, ...cardProps }) => {
  return (
    <CardErrorBoundary fallback={errorFallback} onError={onError}>
      <Card {...cardProps} />
    </CardErrorBoundary>
  );
};

/**
 * Error boundary specifically for cards
 */
class CardErrorBoundary extends React.Component<
  { 
    children: React.ReactNode; 
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SpfxCard] Card Error Boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="spfx-card spfx-card-error">
          <div className="spfx-card-header error">
            <div className="spfx-card-header-content">
              <i className="ms-Icon ms-Icon--ErrorBadge" style={{ marginRight: '8px' }} />
              Card Error
            </div>
          </div>
          <div className="spfx-card-content expanded">
            <div className="spfx-card-body">
              <p>Something went wrong while loading this card.</p>
              {this.state.error && (
                <p style={{ 
                  fontSize: '12px', 
                  color: 'var(--neutralSecondary, #605e5c)',
                  marginBottom: '16px'
                }}>
                  {this.state.error.message}
                </p>
              )}
              <button 
                onClick={this.handleRetry}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--themePrimary, #0078d4)',
                  backgroundColor: 'var(--themePrimary, #0078d4)',
                  color: 'var(--white, #ffffff)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for class components to access card controller
 */
export interface WithCardControllerProps {
  cardController: typeof cardController;
}

export function withCardController<P extends WithCardControllerProps>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<Omit<P, keyof WithCardControllerProps>> {
  const ComponentWithCardController = (props: Omit<P, keyof WithCardControllerProps>) => {
    return (
      <WrappedComponent
        {...(props as P)}
        cardController={cardController}
      />
    );
  };

  ComponentWithCardController.displayName = `withCardController(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ComponentWithCardController;
}

/**
 * Base class component with card controller access
 */
export abstract class CardControllerComponent extends React.Component {
  protected cardController = cardController;
  private unsubscribers: (() => void)[] = [];

  /**
   * Subscribe to card events
   */
  protected subscribeToCard(cardId: string, callback: (action: string, data?: any) => void): void {
    const unsubscribe = this.cardController.subscribe(cardId, callback);
    this.unsubscribers.push(unsubscribe);
  }

  /**
   * Subscribe to all card events
   */
  protected subscribeToAllCards(callback: (action: string, cardId: string, data?: any) => void): void {
    const unsubscribe = this.cardController.subscribeGlobal(callback);
    this.unsubscribers.push(unsubscribe);
  }

  componentWillUnmount() {
    // Clean up subscriptions
    this.unsubscribers.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('[SpfxCard] Error during subscription cleanup:', error);
      }
    });
    this.unsubscribers = [];
  }
}

// Export the context for use in sub-components
export { CardContext };
