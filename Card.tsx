// src/components/Card/Card.types.ts
import { ReactNode, CSSProperties } from 'react';
import { ITooltipHostProps } from '@fluentui/react';

export type CardVariant = 'success' | 'error' | 'warning' | 'info' | 'default';
export type HeaderSize = 'compact' | 'regular' | 'large';

export interface CardAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (cardId?: string) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  tooltip?: string | ITooltipHostProps;
  hideOnMobile?: boolean;
  mobileIcon?: ReactNode;
  ariaLabel?: string;
}

export interface CardEventData {
  cardId: string;
  isExpanded: boolean;
  timestamp: number;
  source: 'user' | 'programmatic';
}

export type CardEventType = 'expand' | 'collapse' | 'contentLoad' | 'programmaticToggle';

export interface CardContextType {
  id: string;
  isExpanded: boolean;
  allowExpand: boolean;
  disabled: boolean;
  loading: boolean;
  variant: CardVariant;
  customHeaderColor?: string;
  lazyLoad: boolean;
  hasContentLoaded: boolean;
  headerSize: HeaderSize;
  onToggleExpand: (source?: 'user' | 'programmatic') => void;
  onActionClick: (action: CardAction, event: React.MouseEvent) => void;
  onContentLoad: () => void;
}

export interface CardControllerOptions {
  expandAll?: boolean;
  collapseAll?: boolean;
  toggleCard?: string;
  expandCard?: string;
  collapseCard?: string;
  getCardStates?: boolean;
  highlightOnProgrammaticChange?: boolean;
}

export interface CardState {
  id: string;
  isExpanded: boolean;
  hasContentLoaded: boolean;
}

export interface CardProps {
  /** Unique identifier for the card */
  id: string;
  
  /** Whether the card is expanded by default */
  defaultExpanded?: boolean;
  
  /** Whether the card can be collapsed/expanded */
  allowExpand?: boolean;
  
  /** Card header background variant */
  variant?: CardVariant;
  
  /** Header size - affects padding and font size */
  headerSize?: HeaderSize;
  
  /** Custom background color for header (overrides variant) */
  customHeaderColor?: string;
  
  /** Loading state */
  loading?: boolean;
  
  /** Loading message */
  loadingMessage?: string;
  
  /** Whether to show loading overlay */
  showLoadingOverlay?: boolean;
  
  /** Enable lazy loading - content loads only when expanded */
  lazyLoad?: boolean;
  
  /** Highlight border on programmatic changes */
  highlightOnProgrammaticChange?: boolean;
  
  /** Duration of highlight effect in milliseconds */
  highlightDuration?: number;
  
  /** Custom highlight color */
  highlightColor?: string;
  
  /** Callback when card is expanded */
  onExpand?: (data: CardEventData) => void;
  
  /** Callback when card is collapsed */
  onCollapse?: (data: CardEventData) => void;
  
  /** Callback when card data is loaded */
  onDataLoaded?: (data: CardEventData) => void;
  
  /** Callback when content is loaded for first time (lazy loading) */
  onContentLoad?: (data: CardEventData) => void;
  
  /** Global event listener for card events */
  onCardEvent?: (type: CardEventType, data: CardEventData) => void;
  
  /** Custom CSS class */
  className?: string;
  
  /** Custom styles */
  style?: CSSProperties;
  
  /** Disable animations */
  disableAnimation?: boolean;
  
  /** Card elevation/shadow level */
  elevation?: 1 | 2 | 3 | 4 | 5;
  
  /** Whether card is disabled */
  disabled?: boolean;
  
  /** Custom theme overrides */
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
  };
  
  /** Accessibility options */
  accessibility?: {
    expandButtonLabel?: string;
    collapseButtonLabel?: string;
    loadingLabel?: string;
    region?: boolean;
    labelledBy?: string;
    describedBy?: string;
  };
  
  /** Performance options */
  performance?: {
    debounceToggle?: number;
    virtualizeContent?: boolean;
    preloadThreshold?: number;
    memoizeContent?: boolean;
  };
  
  /** Children components */
  children: ReactNode;
}

export interface HeaderProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  clickable?: boolean;
  showLoadingShimmer?: boolean;
  size?: HeaderSize;
}

export interface ActionButtonsProps {
  actions: CardAction[];
  className?: string;
  style?: CSSProperties;
  hideExpandButton?: boolean;
  position?: 'left' | 'right' | 'center';
  stackOnMobile?: boolean;
  showTooltips?: boolean;
}

export interface ContentProps {
  children: ReactNode | (() => ReactNode);
  className?: string;
  style?: CSSProperties;
  padding?: 'none' | 'small' | 'medium' | 'large';
  loadingPlaceholder?: ReactNode;
  errorBoundary?: boolean;
}

export interface FooterProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  backgroundColor?: string;
  borderTop?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  textAlign?: 'left' | 'center' | 'right';
}

// src/components/Card/Card.scss (Enhanced)
export const cardScssContent = `
@import '~@fluentui/react/dist/sass/References';
@import '~office-ui-fabric-react/dist/sass/References';

// SharePoint theme variables
:root {
  --card-theme-primary: var(--themePrimary, #0078d4);
  --card-theme-primary-dark: var(--themeDark, #106ebe);
  --card-theme-primary-light: var(--themeLight, #c7e0f4);
  --card-theme-neutral-lighter: var(--neutralLighter, #f8f9fa);
  --card-theme-neutral-light: var(--neutralLight, #edebe9);
  --card-theme-neutral-tertiary: var(--neutralTertiary, #a19f9d);
  --card-theme-neutral-secondary: var(--neutralSecondary, #605e5c);
  --card-theme-neutral-primary: var(--neutralPrimary, #323130);
  --card-theme-white: var(--white, #ffffff);
  --card-theme-success: var(--green, #107c10);
  --card-theme-error: var(--red, #d13438);
  --card-theme-warning: var(--yellow, #ffb900);
  --card-theme-info: var(--themePrimary, #0078d4);
}

.spfx-card {
  background: var(--card-theme-white);
  border-radius: 8px;
  border: 2px solid var(--card-theme-neutral-light);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  font-family: $ms-font-family-base;
  isolation: isolate;
  will-change: transform, box-shadow, border-color; // Optimize for animations
  contain: layout style; // Performance optimization
  
  &:not(.disabled) {
    &:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
      border-color: var(--card-theme-neutral-tertiary);
    }
    
    &:focus-within {
      outline: 2px solid var(--card-theme-primary);
      outline-offset: 2px;
    }
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    * {
      pointer-events: none;
    }
  }

  // Highlight effect for programmatic changes
  &.highlight {
    border-color: var(--card-theme-primary);
    box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.3);
    animation: cardHighlight 0.6s ease-out;
  }

  @keyframes cardHighlight {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 120, 212, 0.4);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(0, 120, 212, 0.2);
      transform: scale(1.02);
    }
    100% {
      box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.3);
      transform: scale(1);
    }
  }

  // Elevation styles
  &.elevation-1 { @include ms-depth-4; }
  &.elevation-2 { @include ms-depth-8; }
  &.elevation-3 { @include ms-depth-16; }
  &.elevation-4 { @include ms-depth-64; }
  &.elevation-5 { 
    box-shadow: 0 25.6px 57.6px 0 rgba(0, 0, 0, 0.22), 0 4.8px 14.4px 0 rgba(0, 0, 0, 0.18);
  }

  // Header styles with size variants
  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    border-bottom: 1px solid var(--card-theme-neutral-light);
    position: relative;
    
    // Size variants
    &.size-compact {
      padding: 8px 16px;
      min-height: 40px;
      
      .spfx-card-header-content {
        font-size: $ms-font-size-s;
        font-weight: $ms-font-weight-regular;
      }
    }
    
    &.size-regular {
      padding: 16px 20px;
      min-height: 56px;
      
      .spfx-card-header-content {
        font-size: $ms-font-size-m;
        font-weight: $ms-font-weight-semibold;
      }
    }
    
    &.size-large {
      padding: 24px 28px;
      min-height: 72px;
      
      .spfx-card-header-content {
        font-size: $ms-font-size-l;
        font-weight: $ms-font-weight-semibold;
      }
    }
    
    &.clickable {
      cursor: pointer;
      user-select: none;
      
      &:hover {
        filter: brightness(0.96);
      }
      
      &:active {
        transform: scale(0.99);
      }
      
      &:focus {
        outline: 2px solid var(--card-theme-primary);
        outline-offset: -2px;
      }
    }

    // Header variants
    &.success { 
      background: var(--card-theme-success);
      color: var(--card-theme-white);
      border-bottom-color: rgba(255, 255, 255, 0.2);
    }
    &.error { 
      background: var(--card-theme-error);
      color: var(--card-theme-white);
      border-bottom-color: rgba(255, 255, 255, 0.2);
    }
    &.warning { 
      background: var(--card-theme-warning);
      color: var(--card-theme-neutral-primary);
      border-bottom-color: rgba(0, 0, 0, 0.1);
    }
    &.info { 
      background: var(--card-theme-info);
      color: var(--card-theme-white);
      border-bottom-color: rgba(255, 255, 255, 0.2);
    }
    &.default { 
      background: var(--card-theme-neutral-lighter);
      color: var(--card-theme-neutral-primary);
      border-bottom-color: var(--card-theme-neutral-light);
    }

    &-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    &-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // Action buttons
  &-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    z-index: 1;

    &.position-left {
      order: -1;
      margin-right: auto;
    }
    &.position-center {
      margin: 0 auto;
    }
    &.position-right {
      margin-left: auto;
    }
  }

  &-action-btn {
    @include ms-normalize;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: $ms-font-size-s;
    font-weight: $ms-font-weight-semibold;
    font-family: $ms-font-family-base;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    min-height: 32px;
    
    &:focus {
      outline: 2px solid var(--card-theme-primary);
      outline-offset: 1px;
    }

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.primary {
      background: var(--card-theme-primary);
      border-color: var(--card-theme-primary-dark);
      color: var(--card-theme-white);

      &:hover:not(:disabled) {
        background: var(--card-theme-primary-dark);
      }
    }

    &.secondary {
      background: var(--card-theme-neutral-tertiary);
      border-color: var(--card-theme-neutral-secondary);
      color: var(--card-theme-white);

      &:hover:not(:disabled) {
        background: var(--card-theme-neutral-secondary);
      }
    }

    &.danger {
      background: var(--card-theme-error);
      border-color: var(--card-theme-error);
      color: var(--card-theme-white);

      &:hover:not(:disabled) {
        background: var(--card-theme-error);
        filter: brightness(0.9);
      }
    }
  }

  // Expand/Collapse button
  &-expand-btn {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;

    &:focus {
      outline: 2px solid var(--card-theme-primary);
      outline-offset: 2px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &-expand-icon {
    transition: transform 0.3s ease;
    width: 16px;
    height: 16px;

    &.expanded {
      transform: rotate(180deg);
    }
  }

  // Content area with performance optimizations
  &-content {
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    contain: layout; // Performance optimization

    &.collapsed {
      max-height: 0;
      opacity: 0;
    }

    &.expanded {
      max-height: 2000px;
      opacity: 1;
    }

    &.no-animation {
      transition: none;
    }
  }

  &-body {
    padding: 20px;

    &.padding-none { padding: 0; }
    &.padding-small { padding: 12px; }
    &.padding-medium { padding: 20px; }
    &.padding-large { padding: 32px; }
  }

  // Footer styles
  &-footer {
    border-top: 1px solid var(--card-theme-neutral-light);
    background: var(--card-theme-neutral-lighter);
    transition: all 0.2s ease;
    
    &.padding-none { padding: 0; }
    &.padding-small { padding: 8px 12px; }
    &.padding-medium { padding: 12px 20px; }
    &.padding-large { padding: 16px 28px; }
    
    &.text-left { text-align: left; }
    &.text-center { text-align: center; }
    &.text-right { text-align: right; }
    
    &.no-border {
      border-top: none;
    }
  }

  // Loading states
  &-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    backdrop-filter: blur(2px);
    border-radius: 8px;
  }

  &-loading-spinner {
    @include ms-Spinner;
    margin-bottom: 12px;
  }

  &-loading-text {
    color: var(--card-theme-neutral-secondary);
    font-size: $ms-font-size-s;
    font-weight: $ms-font-weight-regular;
  }

  &-loading-shimmer {
    background: linear-gradient(90deg, 
      var(--card-theme-neutral-lighter) 25%, 
      var(--card-theme-neutral-light) 50%, 
      var(--card-theme-neutral-lighter) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  // Error boundary
  &-error-boundary {
    padding: 20px;
    text-align: center;
    color: var(--card-theme-error);
    background: var(--card-theme-neutral-lighter);
    border: 1px solid var(--card-theme-error);
    border-radius: 4px;
    margin: 16px;

    &-title {
      font-weight: $ms-font-weight-semibold;
      margin-bottom: 8px;
    }

    &-message {
      font-size: $ms-font-size-s;
      margin-bottom: 12px;
    }

    &-button {
      @include ms-Button;
      @include ms-Button--primary;
    }
  }

  // Responsive design
  @media (max-width: $ms-screen-md-max) {
    &-header {
      &.size-compact {
        padding: 6px 12px;
        min-height: 36px;
      }
      &.size-regular {
        padding: 12px 16px;
        min-height: 48px;
      }
      &.size-large {
        padding: 18px 20px;
        min-height: 60px;
      }
    }
    
    &-body {
      padding: 16px;
      
      &.padding-small { padding: 8px; }
      &.padding-medium { padding: 16px; }
      &.padding-large { padding: 24px; }
    }
    
    &-footer {
      &.padding-small { padding: 6px 8px; }
      &.padding-medium { padding: 8px 16px; }
      &.padding-large { padding: 12px 20px; }
    }
    
    &-actions {
      gap: 6px;

      &.stack-mobile {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
      }
    }
    
    &-action-btn {
      padding: 4px 8px;
      font-size: $ms-font-size-xs;
      min-height: 28px;

      &.mobile-only {
        display: flex;
      }

      &.desktop-only {
        display: none;
      }

      &.hide-text-mobile .spfx-card-action-text {
        display: none;
      }
    }
    
    &-expand-btn {
      width: 28px;
      height: 28px;
    }
  }

  @media (max-width: $ms-screen-sm-max) {
    border-radius: 6px;

    &-header {
      flex-wrap: wrap;
      gap: 8px;
      
      &.size-compact {
        padding: 6px 10px;
      }
      &.size-regular {
        padding: 10px 12px;
      }
      &.size-large {
        padding: 16px 16px;
      }
    }
    
    &-body {
      padding: 12px;
      
      &.padding-small { padding: 6px; }
      &.padding-medium { padding: 12px; }
      &.padding-large { padding: 16px; }
    }

    &-actions {
      &.stack-mobile {
        width: 100%;
        margin-top: 8px;
        order: 10;
      }
    }
  }

  // High contrast mode
  @media (forced-colors: active) {
    border: 2px solid ButtonBorder;
    
    &-header {
      border-bottom: 1px solid ButtonBorder;
      
      &.success,
      &.error,
      &.warning,
      &.info {
        background: ButtonFace;
        color: ButtonText;
      }
    }

    &-action-btn,
    &-expand-btn {
      border: 1px solid ButtonBorder;
      background: ButtonFace;
      color: ButtonText;

      &:hover {
        background: Highlight;
        color: HighlightText;
      }
    }

    &-footer {
      border-top: 1px solid ButtonBorder;
      background: ButtonFace;
    }
  }

  // Reduced motion
  @media (prefers-reduced-motion: reduce) {
    &,
    &-header,
    &-content,
    &-action-btn,
    &-expand-btn,
    &-expand-icon,
    &-footer {
      transition: none;
      animation: none;
    }

    &-loading-shimmer {
      animation: none;
      background: var(--card-theme-neutral-light);
    }

    &.highlight {
      animation: none;
      border-color: var(--card-theme-primary);
      box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.3);
    }
  }
}
`;

// src/components/Card/CardController.ts (Enhanced for Class Components)
interface CardControllerSubscription {
  cardId: string;
  callback: (action: string, data?: any) => void;
}

class CardController {
  private static instance: CardController;
  private cards: Map<string, {
    isExpanded: boolean;
    hasContentLoaded: boolean;
    toggleFn: (source?: 'user' | 'programmatic') => void;
    expandFn: (source?: 'user' | 'programmatic') => void;
    collapseFn: (source?: 'user' | 'programmatic') => void;
    highlightFn?: () => void;
  }> = new Map();
  
  private subscriptions: Map<string, CardControllerSubscription[]> = new Map();
  private globalSubscriptions: ((action: string, cardId: string, data?: any) => void)[] = [];

  private constructor() {}

  static getInstance(): CardController {
    if (!CardController.instance) {
      CardController.instance = new CardController();
    }
    return CardController.instance;
  }

  // Core registration methods
  registerCard(
    id: string, 
    isExpanded: boolean, 
    hasContentLoaded: boolean,
    toggleFn: (source?: 'user' | 'programmatic') => void,
    expandFn: (source?: 'user' | 'programmatic') => void,
    collapseFn: (source?: 'user' | 'programmatic') => void,
    highlightFn?: () => void
  ) {
    this.cards.set(id, { 
      isExpanded, 
      hasContentLoaded, 
      toggleFn, 
      expandFn, 
      collapseFn,
      highlightFn 
    });
  }

  unregisterCard(id: string) {
    this.cards.delete(id);
    this.subscriptions.delete(id);
  }

  updateCardState(id: string, isExpanded: boolean, hasContentLoaded: boolean) {
    const card = this.cards.get(id);
    if (card) {
      card.isExpanded = isExpanded;
      card.hasContentLoaded = hasContentLoaded;
    }
  }

  // Subscription methods for class components
  subscribe(cardId: string, callback: (action: string, data?: any) => void): () => void {
    if (!this.subscriptions.has(cardId)) {
      this.subscriptions.set(cardId, []);
    }
    
    const subscription: CardControllerSubscription = { cardId, callback };
    this.subscriptions.get(cardId)!.push(subscription);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(cardId);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  subscribeGlobal(callback: (action: string, cardId: string, data?: any) => void): () => void {
    this.globalSubscriptions.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.globalSubscriptions.indexOf(callback);
      if (index > -1) {
        this.globalSubscriptions.splice(index, 1);
      }
    };
  }

  private notifySubscribers(cardId: string, action: string, data?: any) {
    // Notify card-specific subscribers
    const cardSubs = this.subscriptions.get(cardId);
    if (cardSubs) {
      cardSubs.forEach(sub => sub.callback(action, data));
    }
    
    // Notify global subscribers
    this.globalSubscriptions.forEach(callback => callback(action, cardId, data));
  }

  // Public API methods with highlighting support
  expandAll(highlight: boolean = true): void {
    this.cards.forEach((card, id) => {
      if (!card.isExpanded) {
        card.expandFn('programmatic');
        if (highlight && card.highlightFn) {
          card.highlightFn();
        }
        this.notifySubscribers(id, 'expand', { source: 'programmatic' });
      }
    });
  }

  collapseAll(highlight: boolean = true): void {
    this.cards.forEach((card, id) => {
      if (card.isExpanded) {
        card.collapseFn('programmatic');
        if (highlight && card.highlightFn) {
          card.highlightFn();
        }
        this.notifySubscribers(id, 'collapse', { source: 'programmatic' });
      }
    });
  }

  toggleCard(id: string, highlight: boolean = true): boolean {
    const card = this.cards.get(id);
    if (card) {
      card.toggleFn('programmatic');
      if (highlight && card.highlightFn) {
        card.highlightFn();
      }
      this.notifySubscribers(id, 'toggle', { 
        source: 'programmatic',
        newState: !card.isExpanded 
      });
      return true;
    }
    return false;
  }

  expandCard(id: string, highlight: boolean = true): boolean {
    const card = this.cards.get(id);
    if (card && !card.isExpanded) {
      card.expandFn('programmatic');
      if (highlight && card.highlightFn) {
        card.highlightFn();
      }
      this.notifySubscribers(id, 'expand', { source: 'programmatic' });
      return true;
    }
    return false;
  }

  collapseCard(id: string, highlight: boolean = true): boolean {
    const card = this.cards.get(id);
    if (card && card.isExpanded) {
      card.collapseFn('programmatic');
      if (highlight && card.highlightFn) {
        card.highlightFn();
      }
      this.notifySubscribers(id, 'collapse', { source: 'programmatic' });
      return true;
    }
    return false;
  }

  highlightCard(id: string): boolean {
    const card = this.cards.get(id);
    if (card && card.highlightFn) {
      card.highlightFn();
      this.notifySubscribers(id, 'highlight');
      return true;
    }
    return false;
  }

  getCardStates(): CardState[] {
    return Array.from(this.cards.entries()).map(([id, card]) => ({
      id,
      isExpanded: card.isExpanded,
      hasContentLoaded: card.hasContentLoaded
    }));
  }

  getCardState(id: string): CardState | null {
    const card = this.cards.get(id);
    if (card) {
      return {
        id,
        isExpanded: card.isExpanded,
        hasContentLoaded: card.hasContentLoaded
      };
    }
    return null;
  }

  // Batch operations for performance
  batchOperation(operations: Array<{ cardId: string; action: 'expand' | 'collapse' | 'toggle' }>, highlight: boolean = true): void {
    operations.forEach(({ cardId, action }) => {
      switch (action) {
        case 'expand':
          this.expandCard(cardId, highlight);
          break;
        case 'collapse':
          this.collapseCard(cardId, highlight);
          break;
        case 'toggle':
          this.toggleCard(cardId, highlight);
          break;
      }
    });
  }
}

// Export singleton instance
export const cardController = CardController.getInstance();

// Class Component Helper - HOC for easy integration
export interface WithCardControllerProps {
  cardController: typeof cardController;
}

export function withCardController<P extends WithCardControllerProps>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<Omit<P, keyof WithCardControllerProps>> {
  return class extends React.Component<Omit<P, keyof WithCardControllerProps>> {
    render() {
      return (
        <WrappedComponent
          {...(this.props as P)}
          cardController={cardController}
        />
      );
    }
  };
}

// src/components/Card/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

class CardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Card Error Boundary:', error, errorInfo);
    this.setState({ errorInfo: errorInfo.componentStack });
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="spfx-card-error-boundary">
          <div className="spfx-card-error-boundary-title">
            Something went wrong
          </div>
          <div className="spfx-card-error-boundary-message">
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>
          <button 
            className="spfx-card-error-boundary-button"
            onClick={this.handleRetry}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// src/components/Card/Card.tsx
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
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import { getId } from '@fluentui/react/lib/Utilities';
import { cardController } from './CardController';
import { cardScssContent } from './Card.scss';

// Create context for card state
const CardContext = createContext<CardContextType | null>(null);

const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('Card components must be used within a Card component');
  }
  return context;
};

// Performance utilities
const useDebounce = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, delay);
  }, [callback, delay]);
};

const useMemoizedCallback = <T extends (...args: any[]) => any>(callback: T, deps: any[]): T => {
  return useCallback(callback, deps);
};

// Chevron Down Icon - Memoized for performance
const ChevronDownIcon = memo<{ className?: string }>(({ className }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
  </svg>
));

ChevronDownIcon.displayName = 'ChevronDownIcon';

// Main Card Component
export const Card: React.FC<CardProps> = ({
  id,
  defaultExpanded = false,
  allowExpand = true,
  variant = 'default',
  headerSize = 'regular',
  customHeaderColor,
  loading = false,
  loadingMessage = 'Loading...',
  showLoadingOverlay = false,
  lazyLoad = false,
  highlightOnProgrammaticChange = true,
  highlightDuration = 600,
  highlightColor,
  onExpand,
  onCollapse,
  onDataLoaded,
  onContentLoad,
  onCardEvent,
  className = '',
  style,
  disableAnimation = false,
  elevation = 2,
  disabled = false,
  theme,
  accessibility = {},
  performance = {},
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasContentLoaded, setHasContentLoaded] = useState(!lazyLoad || defaultExpanded);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  const previousLoadingRef = useRef(loading);
  const cardRef = useRef<HTMLDivElement>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout>();
  const renderCountRef = useRef(0);

  // Performance tracking
  useEffect(() => {
    renderCountRef.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Card ${id} rendered ${renderCountRef.current} times`);
    }
  });

  // Debounced toggle function
  const debouncedToggle = useDebounce(() => {
    handleToggleExpand('user');
  }, performance.debounceToggle || 0);

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

  // Inject SCSS styles (only once)
  useEffect(() => {
    const styleId = 'spfx-card-styles';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.setAttribute('type', 'text/css');
      styleElement.textContent = cardScssContent;
      document.head.appendChild(styleElement);
    }
  }, []);

  // Memoized expand/collapse functions
  const expandFn = useMemoizedCallback((source: 'user' | 'programmatic' = 'programmatic') => {
    if (!isExpanded && allowExpand && !disabled) {
      setIsExpanded(true);
      if (lazyLoad && !hasContentLoaded) {
        setHasContentLoaded(true);
      }
      const eventData: CardEventData = { cardId: id, isExpanded: true, timestamp: Date.now(), source };
      onExpand?.(eventData);
      onCardEvent?.('expand', eventData);
    }
  }, [isExpanded, allowExpand, disabled, lazyLoad, hasContentLoaded, id, onExpand, onCardEvent]);

  const collapseFn = useMemoizedCallback((source: 'user' | 'programmatic' = 'programmatic') => {
    if (isExpanded && allowExpand && !disabled) {
      setIsExpanded(false);
      const eventData: CardEventData = { cardId: id, isExpanded: false, timestamp: Date.now(), source };
      onCollapse?.(eventData);
      onCardEvent?.('collapse', eventData);
    }
  }, [isExpanded, allowExpand, disabled, id, onCollapse, onCardEvent]);

  const toggleFn = useMemoizedCallback((source: 'user' | 'programmatic' = 'programmatic') => {
    if (isExpanded) {
      collapseFn(source);
    } else {
      expandFn(source);
    }
  }, [isExpanded, expandFn, collapseFn]);

  // Register card with controller
  useEffect(() => {
    cardController.registerCard(
      id, 
      isExpanded, 
      hasContentLoaded, 
      toggleFn, 
      expandFn, 
      collapseFn,
      highlightCard
    );

    return () => {
      cardController.unregisterCard(id);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [id, isExpanded, hasContentLoaded, toggleFn, expandFn, collapseFn, highlightCard]);

  // Update controller when state changes
  useEffect(() => {
    cardController.updateCardState(id, isExpanded, hasContentLoaded);
  }, [id, isExpanded, hasContentLoaded]);

  // Handle loading state changes
  useEffect(() => {
    if (previousLoadingRef.current && !loading && !hasDataLoaded) {
      setHasDataLoaded(true);
      const eventData: CardEventData = { cardId: id, isExpanded, timestamp: Date.now(), source: 'user' };
      onDataLoaded?.(eventData);
      onCardEvent?.('contentLoad', eventData);
    }
    previousLoadingRef.current = loading;
  }, [loading, hasDataLoaded, onDataLoaded, onCardEvent, id, isExpanded]);

  // Handle content loading for lazy loading
  useEffect(() => {
    if (lazyLoad && isExpanded && !hasContentLoaded) {
      setHasContentLoaded(true);
      const eventData: CardEventData = { cardId: id, isExpanded, timestamp: Date.now(), source: 'user' };
      onContentLoad?.(eventData);
      onCardEvent?.('contentLoad', eventData);
    }
  }, [lazyLoad, isExpanded, hasContentLoaded, onContentLoad, onCardEvent, id]);

  // Handle expand/collapse
  const handleToggleExpand = useMemoizedCallback((source: 'user' | 'programmatic' = 'user') => {
    if (!allowExpand || disabled) return;

    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // Load content if lazy loading and expanding
    if (lazyLoad && newExpanded && !hasContentLoaded) {
      setHasContentLoaded(true);
    }

    const eventData: CardEventData = { cardId: id, isExpanded: newExpanded, timestamp: Date.now(), source };

    if (newExpanded) {
      onExpand?.(eventData);
      onCardEvent?.('expand', eventData);
    } else {
      onCollapse?.(eventData);
      onCardEvent?.('collapse', eventData);
    }
  }, [allowExpand, disabled, isExpanded, lazyLoad, hasContentLoaded, id, onExpand, onCollapse, onCardEvent]);

  // Handle action click
  const handleActionClick = useMemoizedCallback((action: CardAction, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!action.disabled && !disabled) {
      action.onClick(id);
    }
  }, [disabled, id]);

  // Handle content load callback
  const handleContentLoad = useMemoizedCallback(() => {
    const eventData: CardEventData = { cardId: id, isExpanded, timestamp: Date.now(), source: 'user' };
    onContentLoad?.(eventData);
    onCardEvent?.('contentLoad', eventData);
  }, [id, isExpanded, onContentLoad, onCardEvent]);

  // Memoized styles and classes
  const cardStyle = useMemo(() => ({
    ...style,
    ...(theme?.backgroundColor && { backgroundColor: theme.backgroundColor }),
    ...(theme?.borderColor && { borderColor: theme.borderColor }),
    ...(theme?.textColor && { color: theme.textColor }),
    ...(highlightColor && isHighlighted && { 
      borderColor: highlightColor,
      boxShadow: `0 0 0 2px ${highlightColor}33`
    }),
  }), [style, theme, highlightColor, isHighlighted]);

  const cardClasses = useMemo(() => [
    'spfx-card',
    `elevation-${elevation}`,
    disabled ? 'disabled' : '',
    isHighlighted ? 'highlight' : '',
    className
  ].filter(Boolean).join(' '), [elevation, disabled, isHighlighted, className]);

  // Memoized context value
  const contextValue = useMemo((): CardContextType => ({
    id,
    isExpanded,
    allowExpand,
    disabled,
    loading,
    variant,
    customHeaderColor,
    lazyLoad,
    hasContentLoaded,
    headerSize,
    onToggleExpand: performance.debounceToggle ? debouncedToggle : () => handleToggleExpand('user'),
    onActionClick: handleActionClick,
    onContentLoad: handleContentLoad,
  }), [
    id, isExpanded, allowExpand, disabled, loading, variant, customHeaderColor,
    lazyLoad, hasContentLoaded, headerSize, performance.debounceToggle,
    debouncedToggle, handleToggleExpand, handleActionClick, handleContentLoad
  ]);

  const cardProps = useMemo(() => ({
    className: cardClasses,
    style: cardStyle,
    ref: cardRef,
    ...(accessibility.region && {
      role: "region",
      'aria-labelledby': accessibility.labelledBy,
      'aria-describedby': accessibility.describedBy,
    }),
  }), [cardClasses, cardStyle, accessibility]);

  return (
    <CardContext.Provider value={contextValue}>
      <div {...cardProps}>
        {/* Loading Overlay */}
        {(loading && showLoadingOverlay) && (
          <div className="spfx-card-loading-overlay">
            <div 
              className="spfx-card-loading-spinner" 
              aria-label={accessibility.loadingLabel || loadingMessage}
            />
            <div className="spfx-card-loading-text">{loadingMessage}</div>
          </div>
        )}

        {children}
      </div>
    </CardContext.Provider>
  );
};

// Header Component - Memoized for performance
export const Header = memo<HeaderProps>(({
  children,
  className = '',
  style,
  clickable = true,
  showLoadingShimmer = true,
  size,
}) => {
  const { 
    variant, 
    customHeaderColor, 
    allowExpand, 
    disabled, 
    loading, 
    onToggleExpand, 
    isExpanded, 
    id,
    headerSize
  } = useCardContext();

  const effectiveSize = size || headerSize;

  const headerClasses = useMemo(() => [
    'spfx-card-header',
    variant,
    `size-${effectiveSize}`,
    clickable && allowExpand && !disabled ? 'clickable' : '',
    className
  ].filter(Boolean).join(' '), [variant, effectiveSize, clickable, allowExpand, disabled, className]);

  const headerStyle = useMemo(() => ({
    ...(customHeaderColor ? { background: customHeaderColor } : {}),
    ...style
  }), [customHeaderColor, style]);

  const handleClick = useMemoizedCallback(() => {
    if (clickable && allowExpand && !disabled) {
      onToggleExpand();
    }
  }, [clickable, allowExpand, disabled, onToggleExpand]);

  const handleKeyDown = useMemoizedCallback((e: React.KeyboardEvent) => {
    if (clickable && allowExpand && !disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onToggleExpand();
    }
  }, [clickable, allowExpand, disabled, onToggleExpand]);

  return (
    <div 
      className={headerClasses}
      style={headerStyle}
      onClick={handleClick}
      role={clickable && allowExpand ? "button" : undefined}
      tabIndex={clickable && allowExpand && !disabled ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-expanded={allowExpand ? isExpanded : undefined}
      aria-controls={allowExpand ? `card-content-${id}` : undefined}
    >
      <div className="spfx-card-header-content">
        {loading && showLoadingShimmer && (
          <div 
            className="spfx-card-loading-shimmer" 
            style={{ width: 20, height: 20, borderRadius: '50%', marginRight: 8 }}
            aria-hidden="true"
          />
        )}
        <div className="spfx-card-header-text">
          {children}
        </div>
      </div>
    </div>
  );
});

Header.displayName = 'Header';

// Action Buttons Component - Memoized for performance
export const ActionButtons = memo<ActionButtonsProps>(({
  actions = [],
  className = '',
  style,
  hideExpandButton = false,
  position = 'right',
  stackOnMobile = false,
  showTooltips = true,
}) => {
  const { 
    allowExpand, 
    isExpanded, 
    onToggleExpand, 
    onActionClick, 
    disabled,
    accessibility = {}
  } = useCardContext();

  const actionsClasses = useMemo(() => [
    'spfx-card-actions',
    `position-${position}`,
    stackOnMobile ? 'stack-mobile' : '',
    className
  ].filter(Boolean).join(' '), [position, stackOnMobile, className]);

  const renderActionButton = useMemoizedCallback((action: CardAction) => {
    const buttonClasses = [
      'spfx-card-action-btn',
      action.variant || 'primary',
      action.hideOnMobile ? 'desktop-only' : '',
    ].filter(Boolean).join(' ');

    const buttonId = getId('card-action-button');
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    const buttonContent = (
      <button
        key={action.id}
        id={buttonId}
        className={buttonClasses}
        onClick={(e) => onActionClick(action, e)}
        disabled={action.disabled || disabled}
        aria-label={action.ariaLabel || action.label}
      >
        {action.icon && (
          <span className="spfx-card-action-icon" aria-hidden="true">
            {isMobile && action.mobileIcon ? action.mobileIcon : action.icon}
          </span>
        )}
        <span className="spfx-card-action-text">{action.label}</span>
      </button>
    );

    // Use Fluent UI Tooltip if available and tooltips are enabled
    if (showTooltips && action.tooltip) {
      if (typeof action.tooltip === 'string') {
        return (
          <TooltipHost
            key={action.id}
            content={action.tooltip}
            id={getId('card-tooltip')}
          >
            {buttonContent}
          </TooltipHost>
        );
      } else {
        return (
          <TooltipHost
            key={action.id}
            {...action.tooltip}
          >
            {buttonContent}
          </TooltipHost>
        );
      }
    }

    return buttonContent;
  }, [onActionClick, disabled, showTooltips]);

  return (
    <div className={actionsClasses} style={style}>
      {actions.map(renderActionButton)}
      
      {allowExpand && !hideExpandButton && (
        <TooltipHost
          content={isExpanded 
            ? (accessibility.collapseButtonLabel || 'Collapse card')
            : (accessibility.expandButtonLabel || 'Expand card')
          }
          id={getId('card-expand-tooltip')}
        >
          <div 
            className="spfx-card-expand-btn"
            role="button"
            aria-label={isExpanded 
              ? (accessibility.collapseButtonLabel || 'Collapse card')
              : (accessibility.expandButtonLabel || 'Expand card')
            }
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onToggleExpand();
              }
            }}
          >
            <ChevronDownIcon 
              className={`spfx-card-expand-icon ${isExpanded ? 'expanded' : ''}`}
            />
          </div>
        </TooltipHost>
      )}
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

// Content Component - Memoized for performance
export const Content = memo<ContentProps>(({
  children,
  className = '',
  style,
  padding = 'medium',
  loadingPlaceholder,
  errorBoundary = true,
}) => {
  const { 
    isExpanded, 
    allowExpand, 
    id, 
    lazyLoad, 
    hasContentLoaded, 
    loading,
    onContentLoad 
  } = useCardContext();

  const contentClasses = useMemo(() => [
    'spfx-card-content',
    isExpanded ? 'expanded' : 'collapsed',
    className
  ].filter(Boolean).join(' '), [isExpanded, className]);

  const bodyClasses = useMemo(() => [
    'spfx-card-body',
    `padding-${padding}`
  ].filter(Boolean).join(' '), [padding]);

  // Handle lazy loading
  const shouldRenderContent = !lazyLoad || hasContentLoaded;
  const isContentFunction = typeof children === 'function';

  const contentToRender = useMemo(() => {
    if (!shouldRenderContent) {
      return loadingPlaceholder || (
        <div className="spfx-card-loading-shimmer" style={{ height: 100, borderRadius: 4 }} />
      );
    } else if (loading && !isContentFunction) {
      return loadingPlaceholder || (
        <div className="spfx-card-loading-shimmer" style={{ height: 100, borderRadius: 4 }} />
      );
    } else {
      return isContentFunction ? (children as () => ReactNode)() : children;
    }
  }, [shouldRenderContent, loading, isContentFunction, children, loadingPlaceholder]);

  // Notify when content loads for the first time
  useEffect(() => {
    if (shouldRenderContent && lazyLoad && isExpanded) {
      onContentLoad();
    }
  }, [shouldRenderContent, lazyLoad, isExpanded, onContentLoad]);

  const ContentWrapper = useMemoizedCallback(({ children: contentChildren }: { children: ReactNode }) => (
    <div 
      className={contentClasses}
      style={style}
      id={`card-content-${id}`}
      aria-hidden={!isExpanded}
    >
      <div className={bodyClasses}>
        {contentChildren}
      </div>
    </div>
  ), [contentClasses, style, id, isExpanded, bodyClasses]);

  if (errorBoundary) {
    return (
      <ContentWrapper>
        <CardErrorBoundary>
          {contentToRender}
        </CardErrorBoundary>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper>
      {contentToRender}
    </ContentWrapper>
  );
});

Content.displayName = 'Content';

// Footer Component - New Addition
export const Footer = memo<FooterProps>(({
  children,
  className = '',
  style,
  backgroundColor,
  borderTop = true,
  padding = 'medium',
  textAlign = 'left',
}) => {
  const footerClasses = useMemo(() => [
    'spfx-card-footer',
    `padding-${padding}`,
    `text-${textAlign}`,
    !borderTop ? 'no-border' : '',
    className
  ].filter(Boolean).join(' '), [padding, textAlign, borderTop, className]);

  const footerStyle = useMemo(() => ({
    ...(backgroundColor && { backgroundColor }),
    ...style
  }), [backgroundColor, style]);

  return (
    <div className={footerClasses} style={footerStyle}>
      {children}
    </div>
  );
});

Footer.displayName = 'Footer';

// Utility hooks for external use
export const useCardController = () => {
  return useMemo(() => ({
    expandAll: (highlight?: boolean) => cardController.expandAll(highlight),
    collapseAll: (highlight?: boolean) => cardController.collapseAll(highlight),
    toggleCard: (id: string, highlight?: boolean) => cardController.toggleCard(id, highlight),
    expandCard: (id: string, highlight?: boolean) => cardController.expandCard(id, highlight),
    collapseCard: (id: string, highlight?: boolean) => cardController.collapseCard(id, highlight),
    highlightCard: (id: string) => cardController.highlightCard(id),
    getCardStates: () => cardController.getCardStates(),
    getCardState: (id: string) => cardController.getCardState(id),
    subscribe: (cardId: string, callback: (action: string, data?: any) => void) => 
      cardController.subscribe(cardId, callback),
    subscribeGlobal: (callback: (action: string, cardId: string, data?: any) => void) => 
      cardController.subscribeGlobal(callback),
    batchOperation: (operations: Array<{ cardId: string; action: 'expand' | 'collapse' | 'toggle' }>, highlight?: boolean) =>
      cardController.batchOperation(operations, highlight),
  }), []);
};

// Class Component Base for easy integration
export class CardControllerComponent extends React.Component {
  protected cardController = cardController;
  private unsubscribers: (() => void)[] = [];

  // Subscribe to card events
  protected subscribeToCard(cardId: string, callback: (action: string, data?: any) => void): void {
    const unsubscribe = this.cardController.subscribe(cardId, callback);
    this.unsubscribers.push(unsubscribe);
  }

  // Subscribe to all card events
  protected subscribeToAllCards(callback: (action: string, cardId: string, data?: any) => void): void {
    const unsubscribe = this.cardController.subscribeGlobal(callback);
    this.unsubscribers.push(unsubscribe);
  }

  componentWillUnmount() {
    // Clean up subscriptions
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
  }
}

// Example Usage Components
export const CardExamples: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState<string[]>([]);
  const cardControllerHook = useCardController();

  const loadData = useMemoizedCallback(async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCardData(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']);
    setLoading(false);
  }, []);

  const handleRefresh = useMemoizedCallback(() => {
    setCardData([]);
    loadData();
  }, [loadData]);

  const handleExport = useMemoizedCallback(() => {
    console.log('Exporting data...', cardData);
    const dataStr = JSON.stringify(cardData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'card-data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [cardData]);

  const actions: CardAction[] = useMemo(() => [
  const actions: CardAction[] = useMemo(() => [
    {
      id: 'refresh',
      label: 'Refresh',
      icon: '🔄',
      onClick: handleRefresh,
      variant: 'secondary',
      tooltip: 'Refresh card data',
      ariaLabel: 'Refresh data'
    },
    {
      id: 'export',
      label: 'Export',
      icon: '📤',
      mobileIcon: '📤',
      onClick: handleExport,
      variant: 'primary',
      tooltip: {
        content: 'Export data to JSON file',
        delay: 500
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => alert('Settings clicked'),
      variant: 'secondary',
      hideOnMobile: true,
      disabled: loading
    }
  ], [handleRefresh, handleExport, loading]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Enhanced Card Component Examples</h2>
      
      {/* Global Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => cardControllerHook.expandAll(true)}>Expand All</button>
        <button onClick={() => cardControllerHook.collapseAll(true)}>Collapse All</button>
        <button onClick={() => cardControllerHook.toggleCard('success-card', true)}>Toggle Success Card</button>
        <button onClick={() => cardControllerHook.highlightCard('success-card')}>Highlight Success Card</button>
        <button onClick={() => console.log(cardControllerHook.getCardStates())}>Log Card States</button>
      </div>
      
      {/* Success Card with Lazy Loading - Compact Header */}
      <Card
        id="success-card"
        variant="success"
        headerSize="compact"
        defaultExpanded={false}
        lazyLoad={true}
        loading={loading}
        elevation={3}
        highlightOnProgrammaticChange={true}
        highlightDuration={800}
        onExpand={(data) => console.log('Expanded:', data)}
        onCollapse={(data) => console.log('Collapsed:', data)}
        onContentLoad={(data) => console.log('Content loaded:', data)}
        accessibility={{
          region: true,
          expandButtonLabel: 'Expand success card',
          collapseButtonLabel: 'Collapse success card'
        }}
        performance={{
          debounceToggle: 200,
          memoizeContent: true
        }}
      >
        <Header>✅ Success Card (Compact Header)</Header>
        <ActionButtons actions={actions} showTooltips={true} />
        <Content padding="medium" errorBoundary={true}>
          {() => (
            <div>
              <p>This content is loaded lazily when the card is first expanded!</p>
              {cardData.length > 0 ? (
                <ul>
                  {cardData.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No data loaded. Click refresh to load data.</p>
              )}
            </div>
          )}
        </Content>
        <Footer backgroundColor="#f0f8ff" padding="small" textAlign="center">
          <small>Last updated: {new Date().toLocaleTimeString()}</small>
        </Footer>
      </Card>

      <div style={{ height: '20px' }}></div>

      {/* Error Card - Regular Header */}
      <Card
        id="error-card"
        variant="error"
        headerSize="regular"
        defaultExpanded={false}
        elevation={2}
        theme={{
          primaryColor: '#d32f2f'
        }}
      >
        <Header>⚠️ Error Card (Regular Header)</Header>
        <ActionButtons 
          actions={[
            {
              id: 'resolve',
              label: 'Resolve',
              icon: '✓',
              onClick: () => alert('Error resolved!'),
              variant: 'primary',
              tooltip: 'Mark error as resolved'
            },
            {
              id: 'details',
              label: 'Details',
              icon: 'ℹ️',
              onClick: () => alert('Error details shown'),
              variant: 'secondary'
            }
          ]} 
        />
        <Content>
          <div>
            <p>This card shows error information with a red header.</p>
            <p>The error has been logged and the development team has been notified.</p>
            <div style={{ 
              backgroundColor: '#ffebee', 
              padding: '12px', 
              borderRadius: '4px',
              marginTop: '12px'
            }}>
              <strong>Error Code:</strong> ERR_001<br />
              <strong>Time:</strong> {new Date().toLocaleString()}
            </div>
          </div>
        </Content>
        <Footer 
          backgroundColor="#ffcdd2" 
          padding="small" 
          textAlign="right"
          style={{ color: '#c62828' }}
        >
          <strong>Priority: High</strong>
        </Footer>
      </Card>

      <div style={{ height: '20px' }}></div>

      {/* Info Card - Large Header, Non-expandable */}
      <Card
        id="info-card"
        variant="info"
        headerSize="large"
        allowExpand={false}
        elevation={1}
      >
        <Header clickable={false}>ℹ️ Info Card (Large Header, Always Visible)</Header>
        <Content>
          <div>
            <p>This card cannot be collapsed and is always visible.</p>
            <p>Perfect for important information that should always be shown.</p>
            <p>The large header makes it stand out more prominently.</p>
          </div>
        </Content>
        <Footer borderTop={false} backgroundColor="#e3f2fd" padding="medium">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📋 System Information</span>
            <button style={{ 
              padding: '4px 8px', 
              border: '1px solid #1976d2', 
              backgroundColor: 'transparent',
              color: '#1976d2',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              View More
            </button>
          </div>
        </Footer>
      </Card>

      <div style={{ height: '20px' }}></div>

      {/* Custom Theme Card */}
      <Card
        id="custom-card"
        customHeaderColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        headerSize="regular"
        defaultExpanded={true}
        elevation={4}
        theme={{
          borderColor: '#667eea'
        }}
        highlightColor="#667eea"
      >
        <Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎨</span>
            <span>Custom Theme Card</span>
          </div>
        </Header>
        <ActionButtons 
          actions={[
            {
              id: 'customize',
              label: 'Customize',
              icon: '🎨',
              onClick: () => cardControllerHook.highlightCard('custom-card'),
              variant: 'primary',
              tooltip: 'Highlight this card'
            },
            {
              id: 'share',
              label: 'Share',
              icon: '📤',
              onClick: () => alert('Share clicked'),
              variant: 'secondary'
            }
          ]}
          position="right"
          stackOnMobile={true}
        />
        <Content padding="large">
          <div>
            <p>This card uses a custom gradient background and theme colors.</p>
            <p>The card supports full SharePoint theming integration.</p>
            <p>Responsive design ensures it looks great on all devices.</p>
            <p>Click "Customize" to see the highlight effect in action!</p>
          </div>
        </Content>
        <Footer 
          style={{ 
            background: 'linear-gradient(135deg, #667eea22 0%, #764ba244 100%)',
            borderTop: '1px solid #667eea33'
          }}
          padding="medium"
          textAlign="center"
        >
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <span>🎯 Custom Styled</span>
            <span>📱 Responsive</span>
            <span>♿ Accessible</span>
          </div>
        </Footer>
      </Card>

      <div style={{ height: '20px' }}></div>

      {/* Performance Card with All Features */}
      <Card
        id="performance-card"
        variant="warning"
        headerSize="regular"
        defaultExpanded={false}
        loading={loading}
        showLoadingOverlay={true}
        loadingMessage="Processing performance data..."
        lazyLoad={true}
        highlightOnProgrammaticChange={true}
        highlightDuration={1000}
        performance={{
          debounceToggle: 300,
          memoizeContent: true
        }}
      >
        <Header showLoadingShimmer={true}>⚡ Performance Dashboard</Header>
        <ActionButtons 
          actions={[
            {
              id: 'analyze',
              label: 'Analyze',
              icon: '📊',
              onClick: () => setLoading(!loading),
              variant: 'primary',
              tooltip: 'Run performance analysis',
              disabled: loading
            },
            {
              id: 'benchmark',
              label: 'Benchmark',
              icon: '🏆',
              onClick: () => alert('Benchmark started'),
              variant: 'secondary',
              hideOnMobile: true
            }
          ]} 
        />
        <Content 
          padding="medium"
          loadingPlaceholder={
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
              <div>Loading performance metrics...</div>
            </div>
          }
        >
          {() => (
            <div>
              <p>Performance metrics and analytics dashboard.</p>
              <p>Click "Analyze" to simulate loading with overlay.</p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px', 
                marginTop: '16px' 
              }}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#fff3e0', 
                  borderRadius: '8px',
                  border: '1px solid #ffb74d'
                }}>
                  <strong>⚡ Load Time</strong><br />
                  <span style={{ fontSize: '24px', color: '#f57c00' }}>1.2s</span>
                </div>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#fff3e0', 
                  borderRadius: '8px',
                  border: '1px solid #ffb74d'
                }}>
                  <strong>📦 Bundle Size</strong><br />
                  <span style={{ fontSize: '24px', color: '#f57c00' }}>45KB</span>
                </div>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#fff3e0', 
                  borderRadius: '8px',
                  border: '1px solid #ffb74d'
                }}>
                  <strong>🧠 Memory Usage</strong><br />
                  <span style={{ fontSize: '24px', color: '#f57c00' }}>12MB</span>
                </div>
              </div>
            </div>
          )}
        </Content>
        <Footer backgroundColor="#fff8e1" padding="small">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '12px',
            color: '#e65100'
          }}>
            <span>📊 Real-time monitoring active</span>
            <span>Last scan: {loading ? 'In progress...' : 'Complete'}</span>
          </div>
        </Footer>
      </Card>
    </div>
  );
};

// Class Component Example for demonstrating integration
export class ClassComponentExample extends CardControllerComponent {
  private cardStates: { [key: string]: boolean } = {};

  componentDidMount() {
    // Subscribe to all card events
    this.subscribeToAllCards((action, cardId, data) => {
      console.log(`Class Component received: ${action} from ${cardId}`, data);
      
      if (action === 'expand' || action === 'collapse') {
        this.cardStates[cardId] = action === 'expand';
        this.forceUpdate(); // Re-render to show updated states
      }
    });

    // Subscribe to specific card
    this.subscribeToCard('class-demo-card', (action, data) => {
      console.log('Specific card event:', action, data);
    });
  }

  private handleExpandAll = () => {
    this.cardController.expandAll(true);
  };

  private handleCollapseAll = () => {
    this.cardController.collapseAll(true);
  };

  private handleToggleSpecific = () => {
    this.cardController.toggleCard('class-demo-card', true);
  };

  render() {
    const cardStates = this.cardController.getCardStates();
    
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>Class Component Integration Example</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <p>This is a class component that can control cards programmatically:</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button onClick={this.handleExpandAll}>Expand All Cards</button>
            <button onClick={this.handleCollapseAll}>Collapse All Cards</button>
            <button onClick={this.handleToggleSpecific}>Toggle Demo Card</button>
          </div>
          
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            <strong>Current Card States:</strong>
            <pre style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
              {JSON.stringify(cardStates, null, 2)}
            </pre>
          </div>
        </div>

        <Card
          id="class-demo-card"
          variant="info"
          headerSize="regular"
          defaultExpanded={false}
          highlightOnProgrammaticChange={true}
        >
          <Header>🏗️ Class Component Controlled Card</Header>
          <ActionButtons
            actions={[
              {
                id: 'log-state',
                label: 'Log State',
                icon: '📝',
                onClick: () => {
                  const state = this.cardController.getCardState('class-demo-card');
                  console.log('Card state:', state);
                  alert(`Card state: ${JSON.stringify(state, null, 2)}`);
                },
                variant: 'primary',
                tooltip: 'Log current card state to console'
              }
            ]}
          />
          <Content>
            <div>
              <p>This card is controlled by a class component!</p>
              <p>The class component can:</p>
              <ul>
                <li>Subscribe to card events</li>
                <li>Control cards programmatically</li>
                <li>Track card states</li>
                <li>Highlight cards on changes</li>
              </ul>
              <p>Check the console to see the event subscriptions in action.</p>
            </div>
          </Content>
          <Footer backgroundColor="#e3f2fd" padding="small" textAlign="center">
            <small>
              Controlled by: <code>ClassComponentExample</code>
            </small>
          </Footer>
        </Card>
      </div>
    );
  }
}

// Export all components and utilities
export { 
  cardController, 
  useCardController, 
  CardControllerComponent,
  withCardController,
  CardErrorBoundary 
};

export type { 
  CardProps, 
  HeaderProps, 
  ActionButtonsProps, 
  ContentProps, 
  FooterProps,
  CardAction, 
  CardEventData, 
  CardState,
  WithCardControllerProps 
};
