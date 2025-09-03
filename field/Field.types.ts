import { ReactNode, CSSProperties } from 'react';

export interface ValidationState {
	isValid: boolean;
	error?: string;
	isDirty: boolean;
	isTouched: boolean;
}

export interface FieldContextType {
	fieldName: string;
	fieldId: string;
	validationState: ValidationState;
	disabled?: boolean;
	layout: LayoutType;
}

export type LayoutType = 'auto' | 'horizontal' | 'vertical';
export type LabelWidthType = number | 'auto' | 'compact' | 'normal' | 'wide';
export type SpacingType = 'compact' | 'normal' | 'relaxed';

export interface FieldProps {
	/** Field identifier for focus management */
	id?: string;

	/** Field name for form handling */
	name?: string;

	/** Layout direction */
	layout?: LayoutType;

	/** Whether field is disabled */
	disabled?: boolean;

	/** Validation state */
	isValid?: boolean;

	/** Error message to display */
	error?: string;

	/** Label width configuration */
	labelWidth?: LabelWidthType;

	/** Background color */
	backgroundColor?: string;

	/** Custom CSS class */
	className?: string;

	/** Custom styles */
	style?: CSSProperties;

	/** Auto focus on mount */
	autoFocus?: boolean;

	/** Lazy loading */
	lazy?: boolean;

	/** Loading component for lazy fields */
	loadingComponent?: ReactNode;

	/** Focus callback */
	onFocus?: () => void;

	/** Load callback for lazy fields */
	onLoad?: () => void;

	/** Children components */
	children: ReactNode;
}

export interface LabelProps {
	children: ReactNode;
	required?: boolean;
	htmlFor?: string;
	wrap?: 'normal' | 'break-word' | 'nowrap';
	className?: string;
	style?: CSSProperties;
}

export interface DescriptionProps {
	children: ReactNode;
	icon?: string; // Fluent UI icon name
	position?: 'inline' | 'end';
	delay?: number; // Tooltip delay
	className?: string;
	style?: CSSProperties;
}

export interface ErrorProps {
	children?: ReactNode;
	animation?: 'slide' | 'fade' | 'none';
	position?: 'below' | 'inline';
	className?: string;
	style?: CSSProperties;
}

export interface FieldGroupProps {
	id?: string;
	children: ReactNode;
	labelWidth?: LabelWidthType;
	className?: string;
	style?: CSSProperties;
	spacing?: SpacingType;
	layout?: LayoutType;
	disabled?: boolean;
}

export interface FieldGroupContextType {
	labelWidth: LabelWidthType;
	spacing: SpacingType;
	layout: LayoutType;
	disabled?: boolean;
}

// Focus Controller types
export interface FieldRegistration {
	element?: HTMLElement;
	focusFn: () => boolean;
	scrollFn: () => boolean;
}

export interface ValidationResult {
	isValid: boolean;
	errors: { [fieldId: string]: string };
	fieldCount: number;
}

export interface FieldValidationState {
	isValid: boolean;
	error: string;
	source: 'direct' | 'nested' | 'data-attribute' | 'default';
	element: HTMLElement;
}

export type FieldValidationMap = Map<string, FieldValidationState>;

// Render props for lazy loading
export interface FieldRenderProps {
	isLoaded: boolean;
	load: () => void;
}
