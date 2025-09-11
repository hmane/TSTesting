import { CSSProperties } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IPrincipal {
	id: string;
	title: string;
	email: string;
	loginName?: string;
	jobTitle?: string;
	department?: string;
}

export type ActivityVariant = 'compact' | 'detailed' | 'inline';

export interface ActivityItemProps {
	context: WebPartContext;

	/** Unique identifier for the item */
	itemId?: string;

	/** User who created the item */
	createdBy: IPrincipal;

	/** Date when item was created */
	createdDate: Date;

	/** User who last modified the item (optional) */
	modifiedBy?: IPrincipal;

	/** Date when item was last modified (optional) */
	modifiedDate?: Date;

	/** Visual variant of the component */
	variant?: ActivityVariant;

	/** Show relative time (e.g. "2 hours ago") instead of absolute time */
	showRelativeTime?: boolean;

	/** Show shared files in persona tooltip */
	showSharedFiles?: boolean;

	/** Custom CSS class */
	className?: string;

	/** Custom styles */
	style?: CSSProperties;

	/** Click handler for the entire activity item */
	onClick?: () => void;

	/** Click handler for created by persona */
	onCreatedByClick?: (user: IPrincipal) => void;

	/** Click handler for modified by persona */
	onModifiedByClick?: (user: IPrincipal) => void;
}
