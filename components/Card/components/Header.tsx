import * as React from 'react';
import { memo, useCallback, useContext, useMemo } from 'react';
import { HeaderProps } from '../Card.types';
import { SIZE_CONFIG } from '../utils/constants';
import { HeaderLoadingShimmer } from './LoadingStates';

import { CardContext } from './Card';
/**
 * Card Header component with context integration
 */
export const Header = memo<HeaderProps>(
  ({ children, className = '', style, clickable = true, showLoadingShimmer = true, size }) => {
    // Get card context
    const cardContext = useContext(CardContext);
    if (!cardContext) {
      console.warn('[SpfxCard] Header must be used within a Card component');
      return null;
    }

    const {
      variant,
      customHeaderColor,
      allowExpand,
      disabled,
      loading,
      onToggleExpand,
      isExpanded,
      id,
      headerSize,
    } = cardContext;

    const effectiveSize = size || headerSize;
    const sizeConfig =
      SIZE_CONFIG[effectiveSize as keyof typeof SIZE_CONFIG] || SIZE_CONFIG.regular;

    // Memoized styles
    const headerStyle = useMemo(
      () => ({
        padding: sizeConfig.headerPadding,
        fontSize: sizeConfig.fontSize,
        minHeight: sizeConfig.minHeight,
        ...(customHeaderColor ? { background: customHeaderColor } : {}),
        ...style,
      }),
      [sizeConfig, customHeaderColor, style]
    );

    // Memoized class names
    const headerClasses = useMemo(
      () =>
        [
          'spfx-card-header',
          variant,
          `size-${effectiveSize}`,
          clickable && allowExpand && !disabled ? 'clickable' : '',
          loading ? 'loading' : '',
          className,
        ]
          .filter(Boolean)
          .join(' '),
      [variant, effectiveSize, clickable, allowExpand, disabled, loading, className]
    );

    // Click handler
    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();

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
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...accessibilityProps}
      >
        <div className='spfx-card-header-content'>
          {/* Loading shimmer */}
          {loading && showLoadingShimmer && <HeaderLoadingShimmer />}

          {/* Header text/content */}
          <div className='spfx-card-header-text'>{children}</div>
        </div>
      </div>
    );
  }
);

Header.displayName = 'CardHeader';

/**
 * Simple header without context dependency (for standalone use)
 */
export const SimpleHeader: React.FC<{
  children: React.ReactNode;
  variant?: string;
  size?: 'compact' | 'regular' | 'large';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  loading?: boolean;
}> = memo(
  ({
    children,
    variant = 'default',
    size = 'regular',
    className = '',
    style,
    onClick,
    loading = false,
  }) => {
    const sizeConfig = SIZE_CONFIG[size as keyof typeof SIZE_CONFIG] || SIZE_CONFIG.regular;

    const headerStyle = useMemo(
      () => ({
        padding: sizeConfig.headerPadding,
        fontSize: sizeConfig.fontSize,
        minHeight: sizeConfig.minHeight,
        ...style,
      }),
      [sizeConfig, style]
    );

    const headerClasses = useMemo(
      () =>
        [
          'spfx-card-header',
          variant,
          `size-${size}`,
          onClick ? 'clickable' : '',
          loading ? 'loading' : '',
          className,
        ]
          .filter(Boolean)
          .join(' '),
      [variant, size, onClick, loading, className]
    );

    const handleClick = useCallback(() => {
      if (onClick && !loading) {
        onClick();
      }
    }, [onClick, loading]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (onClick && !loading && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      },
      [onClick, loading]
    );

    return (
      <div
        className={headerClasses}
        style={headerStyle}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !loading ? 0 : undefined}
      >
        <div className='spfx-card-header-content'>
          {loading && <HeaderLoadingShimmer />}
          <div className='spfx-card-header-text'>{children}</div>
        </div>
      </div>
    );
  }
);

SimpleHeader.displayName = 'SimpleCardHeader';

/**
 * Header with icon support
 */
export const IconHeader: React.FC<{
  children: React.ReactNode;
  icon?: string; // Fluent UI icon name
  iconColor?: string;
  variant?: string;
  size?: 'compact' | 'regular' | 'large';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  loading?: boolean;
}> = memo(
  ({
    children,
    icon,
    iconColor,
    variant = 'default',
    size = 'regular',
    className = '',
    style,
    onClick,
    loading = false,
  }) => {
    // Icon size based on header size
    const iconSize = useMemo(() => {
      switch (size) {
        case 'compact':
          return 16;
        case 'large':
          return 24;
        default:
          return 20;
      }
    }, [size]);

    return (
      <SimpleHeader
        variant={variant}
        size={size}
        className={className}
        style={style}
        onClick={onClick}
        loading={loading}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon && (
            <i
              className={`ms-Icon ms-Icon--${icon}`}
              style={{
                fontSize: `${iconSize}px`,
                color: iconColor,
                flexShrink: 0,
              }}
              aria-hidden='true'
            />
          )}
          <span style={{ minWidth: 0, flex: 1 }}>{children}</span>
        </div>
      </SimpleHeader>
    );
  }
);

IconHeader.displayName = 'IconCardHeader';

/**
 * Header with badge/status indicator
 */
export const BadgeHeader: React.FC<{
  children: React.ReactNode;
  badge?: {
    text: string;
    color?: string;
    backgroundColor?: string;
  };
  variant?: string;
  size?: 'compact' | 'regular' | 'large';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  loading?: boolean;
}> = memo(
  ({
    children,
    badge,
    variant = 'default',
    size = 'regular',
    className = '',
    style,
    onClick,
    loading = false,
  }) => {
    const badgeStyle = useMemo(
      () => ({
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        color: badge?.color || 'var(--white, #ffffff)',
        backgroundColor: badge?.backgroundColor || 'var(--themePrimary, #0078d4)',
        marginLeft: '8px',
        flexShrink: 0,
      }),
      [badge]
    );

    return (
      <SimpleHeader
        variant={variant}
        size={size}
        className={className}
        style={style}
        onClick={onClick}
        loading={loading}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ minWidth: 0, flex: 1 }}>{children}</span>
          {badge && <span style={badgeStyle}>{badge.text}</span>}
        </div>
      </SimpleHeader>
    );
  }
);

BadgeHeader.displayName = 'BadgeCardHeader';

/**
 * Header with subtitle
 */
export const SubtitleHeader: React.FC<{
  title: React.ReactNode;
  subtitle: React.ReactNode;
  variant?: string;
  size?: 'compact' | 'regular' | 'large';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  loading?: boolean;
}> = memo(
  ({
    title,
    subtitle,
    variant = 'default',
    size = 'regular',
    className = '',
    style,
    onClick,
    loading = false,
  }) => {
    const subtitleStyle = useMemo(
      () => ({
        fontSize: '12px',
        color: 'var(--neutralSecondary, #605e5c)',
        marginTop: '2px',
        lineHeight: 1.2,
      }),
      []
    );

    return (
      <SimpleHeader
        variant={variant}
        size={size}
        className={className}
        style={style}
        onClick={onClick}
        loading={loading}
      >
        <div>
          <div style={{ fontWeight: 'inherit' }}>{title}</div>
          <div style={subtitleStyle}>{subtitle}</div>
        </div>
      </SimpleHeader>
    );
  }
);

SubtitleHeader.displayName = 'SubtitleCardHeader';
