import { DefaultButton, IconButton, PrimaryButton } from '@fluentui/react/lib/Button';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import { getId } from '@fluentui/react/lib/Utilities';
import * as React from 'react';
import { memo, useCallback, useContext, useMemo } from 'react';
import { ActionButtonsProps, CardAction } from '../Card.types';
import { DEFAULT_ICONS } from '../utils/constants';

// Card Context - this will be imported from Card.tsx in production
const CardContext = React.createContext<
  | {
      allowExpand: boolean;
      allowMaximize: boolean;
      isExpanded: boolean;
      isMaximized: boolean;
      onToggleExpand: (source?: 'user' | 'programmatic') => void;
      onToggleMaximize: (source?: 'user' | 'programmatic') => void;
      onActionClick: (action: CardAction, event: React.MouseEvent) => void;
      disabled: boolean;
      accessibility?: {
        expandButtonLabel?: string;
        collapseButtonLabel?: string;
        maximizeButtonLabel?: string;
        restoreButtonLabel?: string;
      };
    }
  | undefined
>(undefined);

/**
 * Action Buttons component for card headers
 */
export const ActionButtons = memo<ActionButtonsProps>(
  ({
    actions = [],
    className = '',
    style,
    hideExpandButton = false,
    hideMaximizeButton = false,
    position = 'right',
    stackOnMobile = false,
    showTooltips = true,
  }) => {
    // Get card context
    const cardContext = useContext(CardContext);

    if (!cardContext) {
      console.warn('[SpfxCard] ActionButtons must be used within a Card component');
      return null;
    }

    const {
      allowExpand,
      allowMaximize,
      isExpanded,
      isMaximized,
      onToggleExpand,
      onToggleMaximize,
      onActionClick,
      disabled,
      accessibility = {},
    } = cardContext;

    // Memoized class names
    const actionsClasses = useMemo(
      () =>
        [
          'spfx-card-actions',
          `position-${position}`,
          stackOnMobile ? 'stack-mobile' : '',
          className,
        ]
          .filter(Boolean)
          .join(' '),
      [position, stackOnMobile, className]
    );

    // Handle action button click
    const handleActionClick = useCallback(
      (action: CardAction) => (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!action.disabled && !disabled) {
          onActionClick(action, event);
        }
      },
      [disabled, onActionClick]
    );

    // Handle expand/collapse button click
    const handleExpandClick = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!disabled) {
          onToggleExpand('user');
        }
      },
      [disabled, onToggleExpand]
    );

    // Handle maximize/restore button click
    const handleMaximizeClick = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!disabled) {
          onToggleMaximize('user');
        }
      },
      [disabled, onToggleMaximize]
    );

    // Render individual action button
    const renderActionButton = useCallback(
      (action: CardAction) => {
        const buttonId = getId('card-action-button');
        const isDisabled = action.disabled || disabled;

        // Determine button component based on variant
        let ButtonComponent = DefaultButton;
        if (action.variant === 'primary') {
          ButtonComponent = PrimaryButton;
        }

        // Button styles
        const buttonStyles = useMemo(
          () => ({
            root: {
              minWidth: 'auto',
              padding: '6px 12px',
              height: '32px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: getButtonBackgroundColor(action.variant),
              color: getButtonTextColor(action.variant),
              ...(action.className && { className: action.className }),
            },
            rootHovered: {
              backgroundColor: getButtonHoverColor(action.variant),
              transform: 'translateY(-1px)',
            },
            rootPressed: {
              transform: 'translateY(0)',
            },
            rootDisabled: {
              opacity: 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }),
          [action.variant, action.className]
        );

        // Check if we're on mobile
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

        // Determine which icon to show
        const iconName = isMobile && action.mobileIcon ? action.mobileIcon : action.icon;

        const buttonContent = (
          <ButtonComponent
            key={action.id}
            id={buttonId}
            className={`spfx-card-action-btn ${action.variant || 'secondary'} ${
              action.hideOnMobile ? 'desktop-only' : ''
            }`}
            onClick={handleActionClick(action)}
            disabled={isDisabled}
            text={action.label}
            iconProps={iconName ? { iconName } : undefined}
            ariaLabel={action.ariaLabel || action.label}
            styles={buttonStyles}
            allowDisabledFocus={false}
          />
        );

        // Wrap with tooltip if enabled and tooltip provided
        if (showTooltips && action.tooltip && !isDisabled) {
          if (typeof action.tooltip === 'string') {
            return (
              <TooltipHost key={action.id} content={action.tooltip} id={getId('card-tooltip')}>
                {buttonContent}
              </TooltipHost>
            );
          } else {
            return (
              <TooltipHost key={action.id} {...action.tooltip}>
                {buttonContent}
              </TooltipHost>
            );
          }
        }

        return buttonContent;
      },
      [disabled, handleActionClick, showTooltips]
    );

    // Expand/Collapse button
    const expandButton = useMemo(() => {
      if (!allowExpand || hideExpandButton) return null;

      const expandIcon = isExpanded ? DEFAULT_ICONS.COLLAPSE : DEFAULT_ICONS.EXPAND;
      const expandLabel = isExpanded
        ? accessibility.collapseButtonLabel || 'Collapse card'
        : accessibility.expandButtonLabel || 'Expand card';

      const button = (
        <IconButton
          className='spfx-card-expand-btn'
          iconProps={{ iconName: expandIcon }}
          title={expandLabel}
          ariaLabel={expandLabel}
          onClick={handleExpandClick}
          disabled={disabled}
          styles={{
            root: {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'inherit',
            },
            rootHovered: {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              transform: 'scale(1.05)',
            },
            rootPressed: {
              transform: 'scale(0.95)',
            },
            icon: {
              transition: 'transform 0.3s ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            },
          }}
        />
      );

      if (showTooltips) {
        return (
          <TooltipHost key='expand-button' content={expandLabel} id={getId('card-expand-tooltip')}>
            {button}
          </TooltipHost>
        );
      }

      return button;
    }, [
      allowExpand,
      hideExpandButton,
      isExpanded,
      accessibility,
      handleExpandClick,
      disabled,
      showTooltips,
    ]);

    // Maximize/Restore button
    const maximizeButton = useMemo(() => {
      if (!allowMaximize || hideMaximizeButton) return null;

      const maximizeIcon = isMaximized ? DEFAULT_ICONS.RESTORE : DEFAULT_ICONS.MAXIMIZE;
      const maximizeLabel = isMaximized
        ? accessibility.restoreButtonLabel || 'Restore card'
        : accessibility.maximizeButtonLabel || 'Maximize card';

      const button = (
        <IconButton
          className='spfx-card-maximize-btn'
          iconProps={{ iconName: maximizeIcon }}
          title={maximizeLabel}
          ariaLabel={maximizeLabel}
          onClick={handleMaximizeClick}
          disabled={disabled}
          styles={{
            root: {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              width: '32px',
              height: '32px',
              color: 'inherit',
            },
            rootHovered: {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              transform: 'scale(1.05)',
            },
            rootPressed: {
              transform: 'scale(0.95)',
            },
          }}
        />
      );

      if (showTooltips) {
        return (
          <TooltipHost
            key='maximize-button'
            content={maximizeLabel}
            id={getId('card-maximize-tooltip')}
          >
            {button}
          </TooltipHost>
        );
      }

      return button;
    }, [
      allowMaximize,
      hideMaximizeButton,
      isMaximized,
      accessibility,
      handleMaximizeClick,
      disabled,
      showTooltips,
    ]);

    // Don't render if no actions and no expand/maximize buttons
    if (actions.length === 0 && !expandButton && !maximizeButton) {
      return null;
    }

    return (
      <div className={actionsClasses} style={style}>
        {/* Custom action buttons */}
        {actions.map(renderActionButton)}

        {/* Maximize button */}
        {maximizeButton}

        {/* Expand/Collapse button */}
        {expandButton}
      </div>
    );
  }
);

ActionButtons.displayName = 'CardActionButtons';

/**
 * Helper functions for button styling
 */
const getButtonBackgroundColor = (variant?: string): string => {
  switch (variant) {
    case 'primary':
      return 'var(--themePrimary, #0078d4)';
    case 'danger':
      return 'var(--red, #d13438)';
    case 'secondary':
    default:
      return 'rgba(255, 255, 255, 0.15)';
  }
};

const getButtonTextColor = (variant?: string): string => {
  switch (variant) {
    case 'primary':
    case 'danger':
      return 'var(--white, #ffffff)';
    case 'secondary':
    default:
      return 'inherit';
  }
};

const getButtonHoverColor = (variant?: string): string => {
  switch (variant) {
    case 'primary':
      return 'var(--themeDark, #106ebe)';
    case 'danger':
      return 'var(--redDark, #b52c31)';
    case 'secondary':
    default:
      return 'rgba(255, 255, 255, 0.25)';
  }
};

/**
 * Standalone action buttons component (without card context)
 */
export const StandaloneActionButtons: React.FC<{
  actions: CardAction[];
  onActionClick: (action: CardAction, event: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  showTooltips?: boolean;
  disabled?: boolean;
}> = memo(
  ({ actions, onActionClick, className = '', style, showTooltips = true, disabled = false }) => {
    const handleActionClick = useCallback(
      (action: CardAction) => (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!action.disabled && !disabled) {
          onActionClick(action, event);
        }
      },
      [disabled, onActionClick]
    );

    const renderActionButton = useCallback(
      (action: CardAction) => {
        const buttonId = getId('standalone-action-button');
        const isDisabled = action.disabled || disabled;

        let ButtonComponent = DefaultButton;
        if (action.variant === 'primary') {
          ButtonComponent = PrimaryButton;
        }

        const buttonStyles = {
          root: {
            minWidth: 'auto',
            padding: '6px 12px',
            height: '32px',
            marginLeft: '8px',
          },
        };

        const buttonContent = (
          <ButtonComponent
            key={action.id}
            id={buttonId}
            onClick={handleActionClick(action)}
            disabled={isDisabled}
            text={action.label}
            iconProps={action.icon ? { iconName: action.icon } : undefined}
            ariaLabel={action.ariaLabel || action.label}
            styles={buttonStyles}
          />
        );

        if (showTooltips && action.tooltip && !isDisabled) {
          if (typeof action.tooltip === 'string') {
            return (
              <TooltipHost
                key={action.id}
                content={action.tooltip}
                id={getId('standalone-tooltip')}
              >
                {buttonContent}
              </TooltipHost>
            );
          } else {
            return (
              <TooltipHost key={action.id} {...action.tooltip}>
                {buttonContent}
              </TooltipHost>
            );
          }
        }

        return buttonContent;
      },
      [disabled, handleActionClick, showTooltips]
    );

    if (actions.length === 0) {
      return null;
    }

    return (
      <div className={`spfx-standalone-actions ${className}`} style={style}>
        {actions.map(renderActionButton)}
      </div>
    );
  }
);

StandaloneActionButtons.displayName = 'StandaloneActionButtons';

/**
 * Compact action buttons for mobile/small spaces
 */
export const CompactActionButtons: React.FC<{
  actions: CardAction[];
  maxVisible?: number;
  onActionClick: (action: CardAction, event: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}> = memo(({ actions, maxVisible = 2, onActionClick, className = '', style, disabled = false }) => {
  const visibleActions = actions.slice(0, maxVisible);
  const overflowActions = actions.slice(maxVisible);

  const handleActionClick = useCallback(
    (action: CardAction) => (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!action.disabled && !disabled) {
        onActionClick(action, event);
      }
    },
    [disabled, onActionClick]
  );

  return (
    <div className={`spfx-compact-actions ${className}`} style={style}>
      {visibleActions.map(action => (
        <IconButton
          key={action.id}
          iconProps={{ iconName: action.icon }}
          title={action.label}
          ariaLabel={action.ariaLabel || action.label}
          onClick={handleActionClick(action)}
          disabled={action.disabled || disabled}
          styles={{
            root: {
              width: '24px',
              height: '24px',
              marginLeft: '4px',
            },
          }}
        />
      ))}

      {overflowActions.length > 0 && (
        <IconButton
          iconProps={{ iconName: 'More' }}
          title={`${overflowActions.length} more actions`}
          ariaLabel={`${overflowActions.length} more actions`}
          styles={{
            root: {
              width: '24px',
              height: '24px',
              marginLeft: '4px',
            },
          }}
          // TODO: Implement overflow menu
        />
      )}
    </div>
  );
});

CompactActionButtons.displayName = 'CompactActionButtons';
