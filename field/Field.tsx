import React, { useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import type { FieldProps, FieldContextType, ValidationState } from './Field.types';
import { focusController } from './controller/FocusController';
import { useLazyField } from './hooks/useLazyField';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { 
	generateFieldClasses, 
	generateFieldStyles, 
	hasLabelComponent,
	focusFirstElement,
	scrollToElement,
	generateFieldId
} from './utils/fieldUtils';
import styles from './Field.module.scss';

// Field Context
const FieldContext = createContext<FieldContextType | null>(null);

export const useFieldContext = () => {
	const context = useContext(FieldContext);
	if (!context) {
		throw new Error('Field child components must be used within a Field component');
	}
	return context;
};

// Loading component for lazy fields
const DefaultLoadingComponent: React.FC = () => (
	<div className={styles.fieldLoading}>
		<div className={styles.loadingSpinner} />
		Loading...
	</div>
);

// Main Field Component
export const Field: React.FC<FieldProps> = ({
	id,
	name,
	layout = 'horizontal',
	disabled = false,
	isValid = true,
	error,
	labelWidth,
	backgroundColor,
	className = '',
	style,
	autoFocus = false,
	lazy = false,
	loadingComponent,
	onFocus,
	onLoad,
	children,
}) => {
	const fieldRef = useRef<HTMLDivElement>(null);
	const fieldId = id || name || generateFieldId();

	// Responsive layout hook
	const { currentLayout } = useResponsiveLayout({ layout });

	// Lazy loading hook
	const { isVisible, manualLoad, fieldRef: lazyRef } = useLazyField({
		lazy,
		onLoad,
	});

	// Merge refs for lazy loading
	const mergedRef = useCallback((node: HTMLDivElement | null) => {
		fieldRef.current = node;
		(lazyRef as any).current = node;
	}, [lazyRef]);

	// Validation state
	const validationState: ValidationState = useMemo(
		() => ({
			isValid,
			error,
			isDirty: false, // Not tracking dirty state without form library
			isTouched: false, // Not tracking touched state without form library
		}),
		[isValid, error]
	);

	// Focus function for controller
	const focusField = useCallback((): boolean => {
		if (fieldRef.current) {
			const success = focusFirstElement(fieldRef.current);
			if (success) {
				onFocus?.();
			}
			return success;
		}
		return false;
	}, [onFocus]);

	// Scroll function for controller
	const scrollToField = useCallback((): boolean => {
		if (fieldRef.current) {
			return scrollToElement(fieldRef.current, {
				behavior: 'smooth',
				block: 'center',
				inline: 'nearest',
			});
		}
		return false;
	}, []);

	// Register with focus controller
	useEffect(() => {
		focusController.registerField(fieldId, {
			element: fieldRef.current || undefined,
			focusFn: focusField,
			scrollFn: scrollToField,
		});

		return () => {
			focusController.unregisterField(fieldId);
		};
	}, [fieldId, focusField, scrollToField]);

	// Auto focus on mount
	useEffect(() => {
		if (autoFocus && isVisible) {
			const timer = setTimeout(() => {
				focusField();
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [autoFocus, isVisible, focusField]);

	// Detect if field has label
	const hasLabel = useMemo(() => hasLabelComponent(children), [children]);

	// Field classes
	const fieldClasses = useMemo(
		() => generateFieldClasses(
			styles.field,
			currentLayout,
			hasLabel,
			disabled,
			labelWidth,
			className
		),
		[currentLayout, hasLabel, disabled, labelWidth, className]
	);

	// Field styles
	const fieldStyles = useMemo(
		() => generateFieldStyles(labelWidth, backgroundColor, style),
		[labelWidth, backgroundColor, style]
	);

	// Context value for child components
	const fieldContext = useMemo(
		(): FieldContextType => ({
			fieldName: name || fieldId,
			fieldId,
			validationState,
			disabled,
			layout: currentLayout as 'horizontal' | 'vertical',
		}),
		[name, fieldId, validationState, disabled, currentLayout]
	);

	// Render loading state for lazy fields
	if (lazy && !isVisible) {
		return (
			<div
				ref={mergedRef}
				className={fieldClasses}
				style={fieldStyles}
				data-field-id={fieldId}
				data-field-loading="true"
			>
				{loadingComponent || <DefaultLoadingComponent />}
			</div>
		);
	}

	return (
		<FieldContext.Provider value={fieldContext}>
			<div
				ref={mergedRef}
				className={fieldClasses}
				style={fieldStyles}
				data-field-id={fieldId}
				data-is-valid={isValid}
				data-validation-message={error || ''}
			>
				<div className={styles.fieldContent}>
					{children}
				</div>
			</div>
		</FieldContext.Provider>
	);
};

Field.displayName = 'Field';

export { FieldContext };
