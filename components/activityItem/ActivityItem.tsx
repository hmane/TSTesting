import { Icon } from '@fluentui/react/lib/Icon';
import { Persona, PersonaSize } from '@fluentui/react/lib/Persona';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import { LivePersona } from '@pnp/spfx-controls-react/lib/LivePersona';
import * as React from 'react';
import { memo, useCallback, useMemo } from 'react';
import styles from './ActivityItem.module.scss';
import type { ActivityItemProps, IPrincipal } from './ActivityItem.types';

// Helper function to format relative time
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};

// Helper function to format absolute time
const getAbsoluteTime = (date: Date, showTime: boolean = true): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(showTime && {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  return date.toLocaleDateString('en-US', options);
};

// Helper function to determine if modification is recent (within last 24 hours)
const isRecentModification = (modifiedDate: Date, createdDate: Date): boolean => {
  const now = new Date();
  const timeSinceModified = now.getTime() - modifiedDate.getTime();
  return timeSinceModified < 24 * 60 * 60 * 1000;
};

// Main ActivityItem Component
export const ActivityItem = memo<ActivityItemProps>(
  ({
    context,
    itemId,
    createdBy,
    createdDate,
    modifiedBy,
    modifiedDate,
    variant = 'compact',
    showRelativeTime = true,
    showSharedFiles = true,
    className = '',
    style,
    onClick,
    onCreatedByClick,
    onModifiedByClick,
  }) => {
    // Input validation
    if (!context || !createdBy || !createdDate) {
      console.warn('ActivityItem: Missing required props (context, createdBy, or createdDate)');
      return null;
    }

    // Validate dates
    const isValidDate = (date: Date): boolean => date instanceof Date && !isNaN(date.getTime());

    if (!isValidDate(createdDate)) {
      console.warn('ActivityItem: Invalid createdDate provided');
      return null;
    }

    if (modifiedDate && !isValidDate(modifiedDate)) {
      console.warn('ActivityItem: Invalid modifiedDate provided, ignoring modification info');
      modifiedDate = undefined;
      modifiedBy = undefined;
    }

    // Determine if we should show modification info
    const shouldShowModification = useMemo(() => {
      if (!modifiedBy || !modifiedDate) return false;
      const timeDiff = modifiedDate.getTime() - createdDate.getTime();
      const isSamePerson = modifiedBy.email === createdBy.email;
      return !(isSamePerson && timeDiff < 5 * 60 * 1000);
    }, [modifiedBy, modifiedDate, createdBy, createdDate]);

    // Use the most recent activity for display
    const displayUser = shouldShowModification && modifiedBy ? modifiedBy : createdBy;
    const displayDate = shouldShowModification && modifiedDate ? modifiedDate : createdDate;
    const displayAction = shouldShowModification && modifiedBy ? 'modified' : 'created';
    const isRecent =
      shouldShowModification && modifiedDate
        ? isRecentModification(modifiedDate, createdDate)
        : false;

    // Memoized time formatting
    const timeInfo = useMemo(() => {
      const displayTime = showRelativeTime
        ? getRelativeTime(displayDate)
        : getAbsoluteTime(displayDate);

      return {
        relative: getRelativeTime(displayDate),
        absolute: getAbsoluteTime(displayDate),
        display: displayTime,
      };
    }, [displayDate, showRelativeTime]);

    // Click handlers
    const handleUserClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (displayAction === 'created') {
          onCreatedByClick?.(displayUser);
        } else {
          onModifiedByClick?.(displayUser);
        }
      },
      [displayUser, displayAction, onCreatedByClick, onModifiedByClick]
    );

    const handleItemClick = useCallback(
      (e: React.MouseEvent) => {
        if (onClick && e.target === e.currentTarget) {
          onClick();
        }
      },
      [onClick]
    );

    // Component classes
    const componentClasses = useMemo(() => {
      const classes = [styles.activityItem];

      switch (variant) {
        case 'compact':
          classes.push(styles.compact);
          break;
        case 'detailed':
          classes.push(styles.detailed);
          break;
        case 'inline':
          classes.push(styles.inline);
          break;
        default:
          classes.push(styles.compact);
      }

      if (onClick) {
        classes.push(styles.clickable);
      }

      if (isRecent) {
        classes.push(styles.recent);
      }

      if (className) {
        classes.push(className);
      }

      return classes.join(' ');
    }, [variant, onClick, className, isRecent]);

    // Render persona
    const renderPersona = useCallback(
      (user: IPrincipal, size: PersonaSize = PersonaSize.size32) => {
        const displayName = user.title || user.email || 'Unknown User';
        const secondaryText = user.jobTitle || user.email || '';

        return (
          <div
            onClick={handleUserClick}
            className={styles.persona}
            role='button'
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleUserClick(e as any);
              }
            }}
            aria-label={`View ${displayName}'s profile`}
          >
            <LivePersona
              upn={user.email}
              serviceScope={context.serviceScope}
              disableHover={!showSharedFiles}
              template={
                <Persona
                  text={displayName}
                  secondaryText={secondaryText}
                  size={size}
                  imageUrl={undefined}
                />
              }
            />
          </div>
        );
      },
      [context, handleUserClick, showSharedFiles]
    );

    // Render time
    const renderTime = useCallback(() => {
      const label = displayAction === 'created' ? 'Created' : 'Last modified';
      return (
        <TooltipHost content={`${label}: ${timeInfo.absolute}`}>
          <span className={styles.time} title={timeInfo.absolute}>
            {timeInfo.display}
          </span>
        </TooltipHost>
      );
    }, [displayAction, timeInfo]);

    // Render variants
    if (variant === 'inline') {
      return (
        <span className={componentClasses} style={style}>
          <span className={styles.inlineText}>
            {displayAction === 'created' ? 'Created' : 'Modified'} by{' '}
            <span
              className={styles.inlineUser}
              onClick={handleUserClick}
              role='button'
              tabIndex={0}
            >
              {displayUser.title}
            </span>{' '}
            {timeInfo.display}
          </span>
        </span>
      );
    }

    return (
      <div
        className={componentClasses}
        style={style}
        onClick={handleItemClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className={styles.avatar}>
          {renderPersona(
            displayUser,
            variant === 'detailed' ? PersonaSize.size40 : PersonaSize.size32
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.main}>
            <Icon
              iconName={displayAction === 'created' ? 'Add' : 'Edit'}
              className={displayAction === 'created' ? styles.iconCreated : styles.iconModified}
            />
            <span className={styles.action}>
              {displayAction === 'created' ? 'created' : 'modified'} this item
            </span>
          </div>

          {variant === 'detailed' && (
            <div className={styles.metadata}>
              {displayUser.jobTitle && (
                <span className={styles.jobTitle}>{displayUser.jobTitle}</span>
              )}
              {displayUser.department && (
                <span className={styles.department}>{displayUser.department}</span>
              )}
            </div>
          )}

          {shouldShowModification && (
            <div className={styles.original}>Originally created {getRelativeTime(createdDate)}</div>
          )}
        </div>

        <div className={styles.timestamp}>{renderTime()}</div>
      </div>
    );
  }
);

ActivityItem.displayName = 'ActivityItem';
