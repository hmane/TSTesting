import React, { memo, useMemo, useCallback } from 'react';
import { LivePersona } from '@pnp/spfx-controls-react/lib/LivePersona';
import { PersonaSize } from '@fluentui/react/lib/Persona';
import { Icon } from '@fluentui/react/lib/Icon';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';
import type { ActivityItemProps, IPrincipal } from './ActivityItem.types';
import styles from './ActivityItem.module.scss';

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

// Main ActivityItem Component
export const ActivityItem = memo<ActivityItemProps>(({
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
	// Memoized time formatting
	const timeInfo = useMemo(() => {
		const createdTime = showRelativeTime 
			? getRelativeTime(createdDate) 
			: getAbsoluteTime(createdDate);
		
		const modifiedTime = modifiedDate 
			? (showRelativeTime ? getRelativeTime(modifiedDate) : getAbsoluteTime(modifiedDate))
			: null;
		
		return {
			created: {
				relative: getRelativeTime(createdDate),
				absolute: getAbsoluteTime(createdDate),
				display: createdTime,
			},
			modified: modifiedTime ? {
				relative: getRelativeTime(modifiedDate!),
				absolute: getAbsoluteTime(modifiedDate!),
				display: modifiedTime,
			} : null,
		};
	}, [createdDate, modifiedDate, showRelativeTime]);

	// Click handlers
	const handleCreatedByClick = useCallback(() => {
		onCreatedByClick?.(createdBy);
	}, [createdBy, onCreatedByClick]);

	const handleModifiedByClick = useCallback(() => {
		if (modifiedBy) {
			onModifiedByClick?.(modifiedBy);
		}
	}, [modifiedBy, onModifiedByClick]);

	const handleItemClick = useCallback(() => {
		onClick?.();
	}, [onClick]);

	// Component classes
	const componentClasses = useMemo(() => {
		const classes = [styles.activityItem];
		
		// Add variant class
		classes.push(styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`]);
		
		// Add clickable class if onClick handler provided
		if (onClick) {
			classes.push(styles.clickable);
		}
		
		if (className) {
			classes.push(className);
		}
		
		return classes.join(' ');
	}, [variant, onClick, className]);

	// Render LivePersona component
	const renderPersona = useCallback((
		user: IPrincipal,
		size: PersonaSize = PersonaSize.size32,
		onClickHandler?: () => void
	) => (
		<LivePersona
			upn={user.email}
			serviceScope={undefined} // Will be provided by SPFx context
			clickAction={onClickHandler}
			size={size}
			showInitialsOnly={false}
			showUnknownPersonaCoin={true}
			disableHover={false}
			template={showSharedFiles ? undefined : '{{DisplayName}}'}
		/>
	), [showSharedFiles]);

	// Render time with tooltip
	const renderTimeWithTooltip = useCallback((timeData: typeof timeInfo.created, label: string) => (
		<TooltipHost content={`${label}: ${timeData.absolute}`}>
			<span className={styles.timeText} title={timeData.absolute}>
				{timeData.display}
			</span>
		</TooltipHost>
	), []);

	// Render variants
	const renderCompactVariant = () => (
		<div className={componentClasses} style={style} onClick={handleItemClick}>
			<div className={styles.activityContent}>
				<div className={styles.personaSection}>
					{renderPersona(createdBy, PersonaSize.size24, handleCreatedByClick)}
					<span className={styles.personaName}>{createdBy.title}</span>
					<span className={styles.activityText}>created</span>
				</div>
				
				{modifiedBy && modifiedDate && (
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
				{timeInfo.modified ? (
					renderTimeWithTooltip(timeInfo.modified, 'Last modified')
				) : (
					renderTimeWithTooltip(timeInfo.created, 'Created')
				)}
			</div>
		</div>
	);

	const renderDetailedVariant = () => (
		<div className={componentClasses} style={style} onClick={handleItemClick}>
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
			
			{modifiedBy && modifiedDate && timeInfo.modified && (
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
				<div className={styles.timelineContent} onClick={handleItemClick}>
					<div className={styles.timelineHeader}>
						<div className={styles.personaInfo}>
							{renderPersona(createdBy, PersonaSize.size32, handleCreatedByClick)}
							<span className={styles.personaName}>{createdBy.title}</span>
						</div>
						<span className={styles.timeInfo}>{timeInfo.created.display}</span>
					</div>
					<div className={styles.activityLabel}>
						<Icon iconName="Add" style={{ marginRight: 4 }} />
						Created this item
					</div>
				</div>
			</div>
			
			{modifiedBy && modifiedDate && timeInfo.modified && (
				<div className={`${styles.timelineItem} ${styles.modified}`}>
					<div className={styles.timelineContent} onClick={handleItemClick}>
						<div className={styles.timelineHeader}>
							<div className={styles.personaInfo}>
								{renderPersona(modifiedBy, PersonaSize.size32, handleModifiedByClick)}
								<span className={styles.personaName}>{modifiedBy.title}</span>
							</div>
							<span className={styles.timeInfo}>{timeInfo.modified.display}</span>
						</div>
						<div className={styles.activityLabel}>
							<Icon iconName="Edit" style={{ marginRight: 4 }} />
							Modified this item
						</div>
					</div>
				</div>
			)}
		</div>
	);

	const renderInlineVariant = () => (
		<div className={componentClasses} style={style} onClick={handleItemClick}>
			<span className={styles.inlineText}>Created by</span>
			<div className={styles.inlinePersona}>
				{renderPersona(createdBy, PersonaSize.size24, handleCreatedByClick)}
				<span className={styles.personaName}>{createdBy.title}</span>
			</div>
			<span className={styles.inlineTime}>
				{timeInfo.created.display}
			</span>
			
			{modifiedBy && modifiedDate && timeInfo.modified && (
				<>
					<span className={styles.inlineText}>, modified by</span>
					<div className={styles.inlinePersona}>
						{renderPersona(modifiedBy, PersonaSize.size24, handleModifiedByClick)}
						<span className={styles.personaName}>{modifiedBy.title}</span>
					</div>
					<span className={styles.inlineTime}>
						{timeInfo.modified.display}
					</span>
				</>
			)}
		</div>
	);

	// Render based on variant
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
});

ActivityItem.displayName = 'ActivityItem';
