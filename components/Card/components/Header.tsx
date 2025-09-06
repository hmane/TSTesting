import * as React from 'react';
import { memo, useCallback, useContext, useMemo } from 'react';
import { HeaderProps, CardAction } from '../Card.types';
import { HeaderLoadingShimmer } from './LoadingStates';
import { CardContext } from './Card';
import { IconButton } from '@fluentui/react/lib/Button';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import { getId } from '@fluentui/react/lib/Utilities';
import { DEFAULT_ICONS } from '../utils/constants';

/**
 * Enhanced Header Props that includes action buttons
 */
export interface EnhancedHeaderProps extends HeaderProps {
  actions?: CardAction[];
  hideExpandButton?: boolean;
  hideMaximizeButton?: boolean;
  showTooltips?: boolean;
  variant?: string;
}

/**
 * Fixed Header component with properly integrated action buttons
 */
export const Header = memo<EnhancedHeaderProps>(
  ({
    children,
    className = '',
    style,
    clickable = true,
    showLoadingShimmer = true,
    size,
    actions = [],
    hideExpandButton = false,
    hideMaximizeButton = false,
    showTooltips = true,
    variant,
  }) => {
    // Get card context
    const cardContext = useContext(CardContext);
    if (!cardContext) {
      console.warn('[SpfxCard] Header must be used within a Card component');
      return null;
    }

    const {
      variant: contextVariant,
      customHeaderColor,
      allowExpand,
      allowMaximize,
      disabled,
      loading,
      onToggleExpand,
      onToggleMaximize,
      onActionClick,
      isExpanded,
      isMaximized,
      id,
      headerSize,
      accessibility = {},
    } = cardContext;

    const effectiveSize = size || headerSize;
    const effectiveVariant = variant || contextVariant;

    // Improved size configurations
    const sizeConfig = useMemo(() => {
      switch (effectiveSize) {
        case 'compact':
          return {
            padding: '6px 12px',
            minHeight: '32px',
            fontSize: '13px',
            buttonSize: 24,
            iconSize: 12,
          };
        case 'large':
          return {
            padding: '20px 24px',
            minHeight: '64px',
            fontSize: '18px',
            buttonSize: 36,
            iconSize: 18,
          };
        default: // regular
          return {
            padding: '12px 16px',
            minHeight: '48px',
            fontSize: '16px',
            buttonSize: 32,
            iconSize: 16,
          };
      }
    }, [effectiveSize]);

    // Header styles
    const headerStyle = useMemo(
      () => ({
        padding: sizeConfig.padding,
        fontSize: sizeConfig.fontSize,
        minHeight: sizeConfig.minHeight,
        ...(customHeaderColor ? { background: customHeaderColor } : {}),
        ...style,
      }),
      [sizeConfig, customHeaderColor, style]
    );

    // Header classes
    const headerClasses = useMemo(
      () =>
        [
          'spfx-card-header-fixed', // New fixed class
          effectiveVariant || 'default',
          `size-${effectiveSize}`,
          clickable && allowExpand && !disabled ? 'clickable' : '',
          loading ? 'loading' : '',
          className,
        ]
          .filter(Boolean)
          .join(' '),
      [effectiveVariant, effectiveSize, clickable, allowExpand, disabled, loading, className]
    );

    // Click handler for header
    const handleHeaderClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        // Don't trigger if clicking on buttons
        if ((event.target as HTMLElement).closest('.spfx-header-buttons')) {
          return;
        }

        if (clickable && allowExpand && !disabled && !loading) {
          onToggleExpand('user');
        }
      },
      [clickable, allowExpand, disabled, loading, onToggleExpand]
    );

    // Keyboard handler
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (clickable && allowExpand && !disabled && !loading) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggleExpand('user');
          }
        }
      },
      [clickable, allowExpand, disabled, loading, onToggleExpand]
    );

    // Action button click handler
    const handleActionClick = useCallback(
      (action: CardAction) => (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (!action.disabled && !disabled) {
          onActionClick(action, event);
        }
      },
      [disabled, onActionClick]
    );

    // Expand button click handler
    const handleExpandClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (!disabled) {
          onToggleExpand('user');
        }
      },
      [disabled, onToggleExpand]
    );

    // Maximize button click handler
    const handleMaximizeClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (!disabled) {
          onToggleMaximize('user');
        }
      },
      [disabled, onToggleMaximize]
    );

    // Button styles
    const buttonStyles = useMemo(
      () => ({
        root: {
          width: `${sizeConfig.buttonSize}px`,
          height: `${sizeConfig.buttonSize}px`,
          minWidth: `${sizeConfig.buttonSize}px`,
          padding: '0',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'inherit',
          borderRadius: '4px',
          marginLeft: '4px',
        },
        rootHovered: {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        rootPressed: {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        },
        icon: {
          fontSize: `${sizeConfig.iconSize}px`,
          color: 'inherit',
        },
      }),
      [sizeConfig]
    );

    // Render action buttons
    const renderActionButtons = useMemo(() => {
      if (actions.length === 0) return null;

      return actions.map(action => {
        const button = (
          <IconButton
            key={action.id}
            className='spfx-header-action-btn'
            iconProps={action.icon ? { iconName: action.icon } : undefined}
            onClick={handleActionClick(action)}
            disabled={action.disabled || disabled}
            ariaLabel={action.ariaLabel || action.label}
            styles={buttonStyles}
          />
        );

        if (showTooltips && action.tooltip) {
          return (
            <TooltipHost key={action.id} content={action.tooltip as string} id={getId()}>
              {button}
            </TooltipHost>
          );
        }

        return button;
      });
    }, [actions, handleActionClick, disabled, showTooltips, buttonStyles]);

    // Render maximize button
    const renderMaximizeButton = useMemo(() => {
      if (!allowMaximize || hideMaximizeButton) return null;

      const maximizeIcon = isMaximized ? DEFAULT_ICONS.RESTORE : DEFAULT_ICONS.MAXIMIZE;
      const maximizeLabel = isMaximized
        ? accessibility.restoreButtonLabel || 'Restore'
        : accessibility.maximizeButtonLabel || 'Maximize';

      const button = (
        <IconButton
          className='spfx-header-maximize-btn'
          iconProps={{ iconName: maximizeIcon }}
          onClick={handleMaximizeClick}
          disabled={disabled}
          ariaLabel={maximizeLabel}
          styles={buttonStyles}
        />
      );

      if (showTooltips) {
        return (
          <TooltipHost content={maximizeLabel} id={getId()}>
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
      buttonStyles,
    ]);

    // Render expand button
    const renderExpandButton = useMemo(() => {
      if (!allowExpand || hideExpandButton) return null;

      const expandIcon = isExpanded ? DEFAULT_ICONS.COLLAPSE : DEFAULT_ICONS.EXPAND;
      const expandLabel = isExpanded
        ? accessibility.collapseButtonLabel || 'Collapse'
        : accessibility.expandButtonLabel || 'Expand';

      const expandButtonStyles = {
        ...buttonStyles,
        icon: {
          ...buttonStyles.icon,
          transition: 'transform 0.2s ease',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        },
      };

      const button = (
        <IconButton
          className='spfx-header-expand-btn'
          iconProps={{ iconName: expandIcon }}
          onClick={handleExpandClick}
          disabled={disabled}
          ariaLabel={expandLabel}
          styles={expandButtonStyles}
        />
      );

      if (showTooltips) {
        return (
          <TooltipHost content={expandLabel} id={getId()}>
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
      buttonStyles,
    ]);

    // Accessibility props
    const accessibilityProps = useMemo(() => {
      if (!clickable || !allowExpand) {
        return {};
      }

      return {
        role: 'button',
        tabIndex: disabled ? -1 : 0,
        'aria-expanded': isExpanded,
        'aria-controls': `card-content-${id}`,
        'aria-disabled': disabled || loading,
        'aria-label': `${isExpanded ? 'Collapse' : 'Expand'} card`,
      };
    }, [clickable, allowExpand, isExpanded, id, disabled, loading]);

    return (
      <div
        className={headerClasses}
        style={headerStyle}
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        {...accessibilityProps}
      >
        {/* Loading shimmer */}
        {loading && showLoadingShimmer && <HeaderLoadingShimmer style={{ marginRight: '8px' }} />}

        {/* Header content */}
        <div className='spfx-header-content'>{children}</div>

        {/* Header buttons container */}
        <div className='spfx-header-buttons'>
          {renderActionButtons}
          {renderMaximizeButton}
          {renderExpandButton}
        </div>
      </div>
    );
  }
);

Header.displayName = 'FixedCardHeader';

// Keep all other header variants for compatibility
export const SimpleHeader = Header;
export const IconHeader = Header;
export const BadgeHeader = Header;
export const SubtitleHeader = Header;
