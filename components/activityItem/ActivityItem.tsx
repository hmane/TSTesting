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

  // Recent if modified within 24 hours OR if modified more than 1 hour after creation
  return (
    timeSinceModified < 24 * 60 * 60 * 1000 ||
    modifiedDate.getTime() - createdDate.getTime() > 60 * 60 * 1000
  );
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

      // Don't show if modified by same person within 5 minutes of creation
      const timeDiff = modifiedDate.getTime() - createdDate.getTime();
      const isSamePerson = modifiedBy.email === createdBy.email;

      return !(isSamePerson && timeDiff < 5 * 60 * 1000);
    }, [modifiedBy, modifiedDate, createdBy, createdDate]);

    // Memoized time formatting
    const timeInfo = useMemo(() => {
      const createdTime = showRelativeTime
        ? getRelativeTime(createdDate)
        : getAbsoluteTime(createdDate);

      const modifiedTime =
        modifiedDate && shouldShowModification
          ? showRelativeTime
            ? getRelativeTime(modifiedDate)
            : getAbsoluteTime(modifiedDate)
          : null;

      return {
        created: {
          relative: getRelativeTime(createdDate),
          absolute: getAbsoluteTime(createdDate),
          display: createdTime,
        },
        modified: modifiedTime
          ? {
              relative: getRelativeTime(modifiedDate!),
              absolute: getAbsoluteTime(modifiedDate!),
              display: modifiedTime,
              isRecent: isRecentModification(modifiedDate!, createdDate),
            }
          : null,
      };
    }, [createdDate, modifiedDate, showRelativeTime, shouldShowModification]);

    // Click handlers with proper event handling
    const handleCreatedByClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onCreatedByClick?.(createdBy);
      },
      [createdBy, onCreatedByClick]
    );

    const handleModifiedByClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (modifiedBy) {
          onModifiedByClick?.(modifiedBy);
        }
      },
      [modifiedBy, onModifiedByClick]
    );

    const handleItemClick = useCallback(
      (e: React.MouseEvent) => {
        // Only trigger if clicking on the container, not on interactive elements
        if (onClick && e.target === e.currentTarget) {
          onClick();
        }
      },
      [onClick]
    );

    // Component classes with proper type safety
    const componentClasses = useMemo(() => {
      const classes = [styles.activityItem];

      // Add variant class with explicit type checking
      switch (variant) {
        case 'compact':
          classes.push(styles.variantCompact);
          break;
        case 'detailed':
          classes.push(styles.variantDetailed);
          break;
        case 'timeline':
          classes.push(styles.variantTimeline);
          break;
        case 'inline':
          classes.push(styles.variantInline);
          break;
        default:
          console.warn(`ActivityItem: Unknown variant "${variant}", defaulting to compact`);
          classes.push(styles.variantCompact);
      }

      // Add clickable class if onClick handler provided
      if (onClick) {
        classes.push(styles.clickable);
      }

      // Add recent modification class for styling
      if (timeInfo.modified?.isRecent) {
        classes.push(styles.recentlyModified);
      }

      if (className) {
        classes.push(className);
      }

      return classes.join(' ');
    }, [variant, onClick, className, timeInfo.modified?.isRecent]);

    // Render LivePersona component with correct props only
    const renderPersona = useCallback(
      (
        user: IPrincipal,
        size: PersonaSize = PersonaSize.size32,
        onClickHandler?: (e: React.MouseEvent) => void
      ) => {
        // Fallback for missing user data
        const displayName = user.title || user.email || 'Unknown User';
        const secondaryText = user.jobTitle || user.email || '';

        return (
          <div
            onClick={onClickHandler}
            style={{
              cursor: onClickHandler ? 'pointer' : 'default',
              display: 'inline-block',
            }}
            role={onClickHandler ? 'button' : undefined}
            tabIndex={onClickHandler ? 0 : undefined}
            onKeyDown={
              onClickHandler
                ? e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onClickHandler(e as any);
                    }
                  }
                : undefined
            }
            aria-label={onClickHandler ? `View ${displayName}'s profile` : undefined}
          >
            <LivePersona
              upn={user.email}
              serviceScope={context.serviceScope}
              disableHover={false}
              template={
                <Persona
                  text={displayName}
                  secondaryText={secondaryText}
                  size={size}
                  imageUrl={undefined} // Let LivePersona handle the image
                />
              }
            />
          </div>
        );
      },
      [context]
    );

    // Render time with tooltip and enhanced accessibility
    const renderTimeWithTooltip = useCallback(
      (timeData: typeof timeInfo.created | typeof timeInfo.modified, label: string) => {
        if (!timeData) return null;

        return (
          <TooltipHost content={`${label}: ${timeData.absolute}`}>
            <span
              className={styles.timeText}
              title={timeData.absolute}
              aria-label={`${label}: ${timeData.absolute}`}
            >
              {timeData.display}
            </span>
          </TooltipHost>
        );
      },
      []
    );

    // Enhanced icon rendering with activity type
    const renderActivityIcon = useCallback((activityType: 'created' | 'modified') => {
      const iconName = activityType === 'created' ? 'Add' : 'Edit';
      const iconColor =
        activityType === 'created'
          ? 'var(--activity-theme-primary)'
          : 'var(--activity-theme-success)';

      return (
        <Icon
          iconName={iconName}
          style={{
            marginRight: 4,
            color: iconColor,
            fontSize: '12px',
          }}
          aria-hidden='true'
        />
      );
    }, []);

    // Render variants with enhanced functionality
    const renderCompactVariant = () => (
      <div
        className={componentClasses}
        style={style}
        onClick={handleItemClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemClick(e as any);
                }
              }
            : undefined
        }
      >
        <div className={styles.activityContent}>
          <div className={styles.personaSection}>
            {renderPersona(createdBy, PersonaSize.size24, handleCreatedByClick)}
            <span className={styles.personaName}>{createdBy.title}</span>
            <span className={styles.activityText}>created</span>
          </div>

          {shouldShowModification && modifiedBy && modifiedDate && (
            <>
              <span className={styles.separator}>•</span>
              <div className={styles.personaSection}>
                {renderPersona(modifiedBy, PersonaSize.size24, handleModifiedByClick)}
                <span className={styles.personaName}>{modifiedBy.title}</span>
                <span className={styles.activityText}>modified</span>
              </div>
            </>
          )}
        </div>

        <div className={styles.timeSection}>
          {timeInfo.modified
            ? renderTimeWithTooltip(timeInfo.modified, 'Last modified')
            : renderTimeWithTooltip(timeInfo.created, 'Created')}
        </div>
      </div>
    );

    const renderDetailedVariant = () => (
      <div
        className={componentClasses}
        style={style}
        onClick={handleItemClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className={styles.activitySection}>
          <div className={styles.personaContainer}>
            {renderPersona(createdBy, PersonaSize.size40, handleCreatedByClick)}
            <div className={styles.activityDetails}>
              <span className={styles.personaName}>{createdBy.title}</span>
              <span className={styles.activityText}>Created this item</span>
            </div>
          </div>
          <div className={styles.timeDetails}>
            {renderTimeWithTooltip(timeInfo.created, 'Created')}
            {showRelativeTime && (
              <span className={styles.relativeTime}>{timeInfo.created.relative}</span>
            )}
          </div>
        </div>

        {shouldShowModification && modifiedBy && modifiedDate && timeInfo.modified && (
          <>
            <div className={styles.divider} />
            <div className={styles.activitySection}>
              <div className={styles.personaContainer}>
                {renderPersona(modifiedBy, PersonaSize.size40, handleModifiedByClick)}
                <div className={styles.activityDetails}>
                  <span className={styles.personaName}>{modifiedBy.title}</span>
                  <span className={styles.activityText}>Last modified</span>
                </div>
              </div>
              <div className={styles.timeDetails}>
                {renderTimeWithTooltip(timeInfo.modified, 'Last modified')}
                {showRelativeTime && (
                  <span className={styles.relativeTime}>{timeInfo.modified.relative}</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );

    const renderTimelineVariant = () => (
      <div className={componentClasses} style={style}>
        <div className={styles.timelineItem}>
          <div
            className={styles.timelineContent}
            onClick={handleItemClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
          >
            <div className={styles.timelineHeader}>
              <div className={styles.personaInfo}>
                {renderPersona(createdBy, PersonaSize.size32, handleCreatedByClick)}
                <span className={styles.personaName}>{createdBy.title}</span>
              </div>
              <span className={styles.timeInfo}>{timeInfo.created.display}</span>
            </div>
            <div className={styles.activityLabel}>
              {renderActivityIcon('created')}
              Created this item
            </div>
          </div>
        </div>

        {shouldShowModification && modifiedBy && modifiedDate && timeInfo.modified && (
          <div className={`${styles.timelineItem} ${styles.modified}`}>
            <div
              className={styles.timelineContent}
              onClick={handleItemClick}
              role={onClick ? 'button' : undefined}
              tabIndex={onClick ? 0 : undefined}
            >
              <div className={styles.timelineHeader}>
                <div className={styles.personaInfo}>
                  {renderPersona(modifiedBy, PersonaSize.size32, handleModifiedByClick)}
                  <span className={styles.personaName}>{modifiedBy.title}</span>
                </div>
                <span className={styles.timeInfo}>{timeInfo.modified.display}</span>
              </div>
              <div className={styles.activityLabel}>
                {renderActivityIcon('modified')}
                Modified this item
              </div>
            </div>
          </div>
        )}
      </div>
    );

    const renderInlineVariant = () => (
      <span
        className={componentClasses}
        style={style}
        onClick={handleItemClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <span className={styles.inlineText}>Created by </span>
        <span className={styles.inlinePersona}>
          {renderPersona(createdBy, PersonaSize.size24, handleCreatedByClick)}
          <span className={styles.personaName}>{createdBy.title}</span>
        </span>
        <span className={styles.inlineTime}> {timeInfo.created.display}</span>

        {shouldShowModification && modifiedBy && modifiedDate && timeInfo.modified && (
          <>
            <span className={styles.inlineText}>, modified by </span>
            <span className={styles.inlinePersona}>
              {renderPersona(modifiedBy, PersonaSize.size24, handleModifiedByClick)}
              <span className={styles.personaName}>{modifiedBy.title}</span>
            </span>
            <span className={styles.inlineTime}> {timeInfo.modified.display}</span>
          </>
        )}
      </span>
    );

    // Render based on variant with error boundary
    try {
      switch (variant) {
        case 'detailed':
          return renderDetailedVariant();
        case 'timeline':
          return renderTimelineVariant();
        case 'inline':
          return renderInlineVariant();
        case 'compact':
        default:
          return renderCompactVariant();
      }
    } catch (error) {
      console.error('ActivityItem: Error rendering component', error);
      return (
        <div className={styles.activityItem} style={{ color: 'red', padding: '8px' }}>
          Error rendering activity item
        </div>
      );
    }
  }
);

ActivityItem.displayName = 'ActivityItem';
