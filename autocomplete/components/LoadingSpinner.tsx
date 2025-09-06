// components/LoadingSpinner.tsx
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { Stack } from '@fluentui/react/lib/Stack';
import { Text } from '@fluentui/react/lib/Text';
import { useTheme } from '@fluentui/react/lib/Theme';
import * as React from 'react';
import './LoadingSpinner.scss';

interface LoadingSpinnerProps {
  visible?: boolean;
  position?: 'right' | 'overlay' | 'inline';
  size?: 'small' | 'medium' | 'large';
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  delay?: number;
}

/**
 * Loading spinner component optimized for autocomplete scenarios
 * Integrates with SharePoint theme and provides smooth animations
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(
  ({
    visible = true,
    position = 'right',
    size = 'small',
    label,
    className = '',
    style,
    ariaLabel,
    delay = 0,
  }) => {
    const theme = useTheme();
    const [shouldShow, setShouldShow] = React.useState(delay === 0 ? visible : false);
    const delayTimeoutRef = React.useRef<number | null>(null);

    // Handle delayed visibility
    React.useEffect(() => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }

      if (visible && delay > 0) {
        delayTimeoutRef.current = setTimeout(() => {
          setShouldShow(true);
        }, delay);
      } else {
        setShouldShow(visible);
      }

      return () => {
        if (delayTimeoutRef.current) {
          clearTimeout(delayTimeoutRef.current);
        }
      };
    }, [visible, delay]);

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (delayTimeoutRef.current) {
          clearTimeout(delayTimeoutRef.current);
        }
      };
    }, []);

    // Get Fluent UI spinner size
    const getSpinnerSize = (): SpinnerSize => {
      switch (size) {
        case 'small':
          return SpinnerSize.small;
        case 'medium':
          return SpinnerSize.medium;
        case 'large':
          return SpinnerSize.large;
        default:
          return SpinnerSize.small;
      }
    };

    // Get container classes
    const getContainerClasses = (): string => {
      const baseClass = 'autocomplete-loading-spinner';
      const positionClass = `${baseClass}--${position}`;
      const sizeClass = `${baseClass}--${size}`;
      const visibilityClass = shouldShow ? `${baseClass}--visible` : `${baseClass}--hidden`;

      return [baseClass, positionClass, sizeClass, visibilityClass, className]
        .filter(Boolean)
        .join(' ');
    };

    // Get aria attributes
    const getAriaAttributes = () => ({
      'aria-label': ariaLabel || label || 'Loading...',
      'aria-live': 'polite' as const,
      'aria-hidden': !shouldShow,
      role: 'status' as const,
    });

    // Render based on position
    const renderSpinnerContent = () => {
      const spinnerElement = (
        <Spinner
          size={getSpinnerSize()}
          label={label}
          ariaLabel={ariaLabel || label}
          styles={{
            root: {
              margin: 0,
            },
            circle: {
              borderColor: `${theme.palette.themePrimary} transparent transparent transparent`,
              animation: 'autocomplete-spinner-rotate 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
            },
            label: {
              color: theme.palette.neutralSecondary,
              fontSize: theme.fonts.xSmall.fontSize,
              fontWeight: theme.fonts.xSmall.fontWeight,
              margin: '4px 0 0 0',
            },
          }}
        />
      );

      if (position === 'inline' && label) {
        return (
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign='center'>
            {spinnerElement}
            <Text
              variant='small'
              styles={{
                root: {
                  color: theme.palette.neutralSecondary,
                  fontWeight: 400,
                },
              }}
            >
              {label}
            </Text>
          </Stack>
        );
      }

      return spinnerElement;
    };

    if (!shouldShow) {
      return null;
    }

    return (
      <div className={getContainerClasses()} style={style} {...getAriaAttributes()}>
        <div className='autocomplete-loading-spinner__content'>{renderSpinnerContent()}</div>

        {position === 'overlay' && <div className='autocomplete-loading-spinner__backdrop' />}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Pulse loading indicator for minimal space scenarios
 */
export const PulseSpinner: React.FC<{
  visible?: boolean;
  color?: string;
  size?: number;
  className?: string;
}> = React.memo(({ visible = true, color, size = 16, className = '' }) => {
  const theme = useTheme();
  const spinnerColor = color || theme.palette.themePrimary;

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`autocomplete-pulse-spinner ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: spinnerColor,
      }}
      aria-label='Loading'
      role='status'
      aria-live='polite'
    />
  );
});

PulseSpinner.displayName = 'PulseSpinner';

/**
 * Dots loading indicator for text-based scenarios
 */
export const DotsSpinner: React.FC<{
  visible?: boolean;
  color?: string;
  className?: string;
  text?: string;
}> = React.memo(({ visible = true, color, className = '', text = 'Loading' }) => {
  const theme = useTheme();
  const textColor = color || theme.palette.neutralSecondary;

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`autocomplete-dots-spinner ${className}`}
      style={{ color: textColor }}
      aria-label={`${text}...`}
      role='status'
      aria-live='polite'
    >
      <span className='autocomplete-dots-spinner__text'>{text}</span>
      <span className='autocomplete-dots-spinner__dots'>
        <span className='autocomplete-dots-spinner__dot'>.</span>
        <span className='autocomplete-dots-spinner__dot'>.</span>
        <span className='autocomplete-dots-spinner__dot'>.</span>
      </span>
    </div>
  );
});

DotsSpinner.displayName = 'DotsSpinner';

/**
 * Skeleton loading placeholder for list items
 */
export const SkeletonLoader: React.FC<{
  visible?: boolean;
  itemCount?: number;
  showAvatar?: boolean;
  className?: string;
}> = React.memo(({ visible = true, itemCount = 3, showAvatar = false, className = '' }) => {
  const theme = useTheme();

  if (!visible) {
    return null;
  }

  const skeletonItems = Array.from({ length: itemCount }, (_, index) => (
    <div key={index} className='autocomplete-skeleton-item'>
      {showAvatar && <div className='autocomplete-skeleton-avatar' />}
      <div className='autocomplete-skeleton-content'>
        <div
          className='autocomplete-skeleton-line autocomplete-skeleton-line--title'
          style={{ backgroundColor: theme.palette.neutralLight }}
        />
        <div
          className='autocomplete-skeleton-line autocomplete-skeleton-line--subtitle'
          style={{ backgroundColor: theme.palette.neutralLighter }}
        />
      </div>
    </div>
  ));

  return (
    <div
      className={`autocomplete-skeleton-loader ${className}`}
      aria-label='Loading content'
      role='status'
      aria-live='polite'
    >
      {skeletonItems}
    </div>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';
