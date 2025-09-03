import React, { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { ContentProps, ContentPadding } from '../types/Card.types';
import { CardLoading, ContentLoadingPlaceholder } from './LoadingStates';
import { PADDING_CONFIG } from '../utils/constants';

/**
 * Error Boundary for Content component
 */
class ContentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onError?: (error: Error) => void },
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
    console.error('[SpfxCard] Content Error Boundary:', error, errorInfo);
    this.props.onError?.(error);
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
        <div className="spfx-card-error-boundary">
          <div className="spfx-card-error-boundary-title">
            Content Error
          </div>
          <div className="spfx-card-error-boundary-message">
            {this.state.error?.message || 'An error occurred while loading content'}
          </div>
          <button 
            className="spfx-card-error-boundary-button"
            onClick={this.handleRetry}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--themePrimary, #0078d4)',
              backgroundColor: 'var(--themePrimary, #0078d4)',
              color: 'var(--white, #ffffff)',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Helper function to convert padding value to CSS string
 */
const getPaddingValue = (padding: ContentPadding): string => {
  if (typeof padding === 'string') {
    return PADDING_CONFIG[padding as keyof typeof PADDING_CONFIG] || padding;
  }
  
  if (typeof padding === 'object') {
    const { top = 0, right = 0, bottom = 0, left = 0 } = padding;
    return `${top}px ${right}px ${bottom}px ${left}px`;
  }
  
  return PADDING_CONFIG.comfortable; // Default
};

/**
 * Card Content component with lazy loading and error boundary support
 */
export const Content = memo<ContentProps>(({
  children,
  className = '',
  style,
  padding = 'comfortable',
  loadingPlaceholder,
  errorBoundary = true
}) => {
  // Get card context
  const cardContext = React.useContext(CardContext);
  const contentRef = useRef<HTMLDivElement>(null);
  
  if (!cardContext) {
    console.warn('[SpfxCard] Content must be used within a Card component');
    return null;
  }

  const { 
    isExpanded, 
    allowExpand, 
    id, 
    lazyLoad, 
    hasContentLoaded, 
    loading,
    loadingType,
    onContentLoad,
    size
  } = cardContext;

  // Memoized padding styles
  const paddingStyle = useMemo(() => ({
    padding: getPaddingValue(padding)
  }), [padding]);

  // Memoized content classes
  const contentClasses = useMemo(() => [
    'spfx-card-content',
    isExpanded ? 'expanded' : 'collapsed',
    loading ? 'loading' : '',
    `size-${size}`,
    className
  ].filter(Boolean).join(' '), [isExpanded, loading, size, className]);

  // Memoized body classes
  const bodyClasses = useMemo(() => [
    'spfx-card-body',
    typeof padding === 'string' ? `padding-${padding}` : 'padding-custom'
  ].filter(Boolean).join(' '), [padding]);

  // Handle lazy loading content notification
  useEffect(() => {
    if (lazyLoad && isExpanded && !hasContentLoaded) {
      // Notify that content should be loaded
      onContentLoad();
    }
  }, [lazyLoad, isExpanded, hasContentLoaded, onContentLoad]);

  // Determine what content to render
  const shouldRenderContent = !lazyLoad || hasContentLoaded || isExpanded;
  const isContentFunction = typeof children === 'function';

  // Memoized content to render
  const contentToRender = useMemo(() => {
    // If lazy loading and content not loaded, show placeholder
    if (lazyLoad && !hasContentLoaded && !isExpanded) {
      return loadingPlaceholder || (
        <ContentLoadingPlaceholder height={100} lines={3} />
      );
    }

    // If loading, show loading state or placeholder
    if (loading && loadingType !== 'none') {
      return loadingPlaceholder || (
        <CardLoading type={loadingType} message="Loading content..." />
      );
    }

    // If content should be rendered
    if (shouldRenderContent) {
      return isContentFunction ? (children as () => React.ReactNode)() : children;
    }

    // Fallback placeholder
    return loadingPlaceholder || (
      <ContentLoadingPlaceholder height={100} lines={3} />
    );
  }, [
    lazyLoad,
    hasContentLoaded,
    isExpanded,
    loading,
    loadingType,
    shouldRenderContent,
    isContentFunction,
    children,
    loadingPlaceholder
  ]);

  // Error boundary handler
  const handleError = useCallback((error: Error) => {
    console.error(`[SpfxCard] Content error in card ${id}:`, error);
  }, [id]);

  // Content wrapper component
  const ContentWrapper = useCallback(({ children: contentChildren }: { children: React.ReactNode }) => (
    <div 
      ref={contentRef}
      className={contentClasses}
      style={style}
      id={`card-content-${id}`}
      aria-hidden={!isExpanded && allowExpand}
      role={allowExpand ? 'region' : undefined}
      aria-labelledby={allowExpand ? `card-header-${id}` : undefined}
    >
      <div 
        className={bodyClasses} 
        style={typeof padding === 'object' ? paddingStyle : undefined}
      >
        {contentChildren}
      </div>
    </div>
  ), [contentClasses, style, id, isExpanded, allowExpand, bodyClasses, padding, paddingStyle]);

  // Render with or without error boundary
  if (errorBoundary) {
    return (
      <ContentWrapper>
        <ContentErrorBoundary onError={handleError}>
          {contentToRender}
        </ContentErrorBoundary>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper>
      {contentToRender}
    </ContentWrapper>
  );
});

Content.displayName = 'CardContent';

/**
 * Scrollable content variant
 */
export const ScrollableContent = memo<ContentProps & {
  maxHeight?: number | string;
  showScrollbar?: boolean;
}>(({
  children,
  className = '',
  style,
  padding = 'comfortable',
  loadingPlaceholder,
  errorBoundary = true,
  maxHeight = 300,
  showScrollbar = true
}) => {
  const scrollStyle = useMemo(() => ({
    maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    scrollbarWidth: showScrollbar ? 'thin' : 'none',
    msOverflowStyle: showScrollbar ? 'auto' : 'none',
    '&::-webkit-scrollbar': {
      width: showScrollbar ? '6px' : '0px'
    },
    '&::-webkit-scrollbar-track': {
      background: showScrollbar ? 'var(--neutralLighter, #f8f9fa)' : 'transparent'
    },
    '&::-webkit-scrollbar-thumb': {
      background: showScrollbar ? 'var(--neutralTertiary, #a19f9d)' : 'transparent',
      borderRadius: '3px'
    },
    ...style
  }), [maxHeight, showScrollbar, style]);

  return (
    <Content
      className={`spfx-scrollable-content ${className}`}
      style={scrollStyle}
      padding={padding}
      loadingPlaceholder={loadingPlaceholder}
      errorBoundary={errorBoundary}
    >
      {children}
    </Content>
  );
});

ScrollableContent.displayName = 'ScrollableCardContent';

/**
 * Tabbed content variant
 */
export const TabbedContent = memo<{
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    disabled?: boolean;
  }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  style?: React.CSSProperties;
  padding?: ContentPadding;
}>(({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  style,
  padding = 'comfortable'
}) => {
  const [currentTab, setCurrentTab] = React.useState(activeTab || tabs[0]?.id);

  const handleTabChange = useCallback((tabId: string) => {
    if (currentTab !== tabId) {
      setCurrentTab(tabId);
      onTabChange?.(tabId);
    }
  }, [currentTab, onTabChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, tabId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabChange(tabId);
    }
  }, [handleTabChange]);

  const activeTabContent = useMemo(() => {
    return tabs.find(tab => tab.id === currentTab)?.content;
  }, [tabs, currentTab]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={`spfx-tabbed-content ${className}`} style={style}>
      {/* Tab Headers */}
      <div 
        className="spfx-tab-headers" 
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--neutralLight, #edebe9)',
          marginBottom: '16px'
        }}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`spfx-tab-header ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            disabled={tab.disabled}
            role="tab"
            aria-selected={currentTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={currentTab === tab.id ? 0 : -1}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: currentTab === tab.id ? '2px solid var(--themePrimary, #0078d4)' : '2px solid transparent',
              color: currentTab === tab.id ? 'var(--themePrimary, #0078d4)' : 'var(--neutralPrimary, #323130)',
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              opacity: tab.disabled ? 0.5 : 1,
              fontWeight: currentTab === tab.id ? 600 : 400,
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div 
        role="tabpanel"
        id={`tabpanel-${currentTab}`}
        aria-labelledby={`tab-${currentTab}`}
        style={{ padding: getPaddingValue(padding) }}
      >
        {activeTabContent}
      </div>
    </div>
  );
});

TabbedContent.displayName = 'TabbedCardContent';

/**
 * Collapsible sections within content
 */
export const CollapsibleSection = memo<{
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  style?: React.CSSProperties;
}>(({
  title,
  children,
  defaultExpanded = false,
  className = '',
  style
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  return (
    <div className={`spfx-collapsible-section ${className}`} style={style}>
      <button
        className="spfx-collapsible-header"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${title.replace(/\s+/g, '-')}`}
        style={{
          width: '100%',
          padding: '12px 0',
          border: 'none',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--neutralPrimary, #323130)'
        }}
      >
        <span>{title}</span>
        <i 
          className={`ms-Icon ms-Icon--ChevronDown`}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            fontSize: '12px'
          }}
        />
      </button>
      <div
        ref={contentRef}
        id={`section-content-${title.replace(/\s+/g, '-')}`}
        className={`spfx-collapsible-content ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={{
          maxHeight: isExpanded ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.3s ease',
          opacity: isExpanded ? 1 : 0
        }}
      >
        <div style={{ padding: '8px 0 16px 0' }}>
          {children}
        </div>
      </div>
    </div>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';

// Create CardContext placeholder - this will be imported from Card component later
const CardContext = React.createContext<any>(null);
