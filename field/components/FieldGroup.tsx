import React, { memo, useMemo, createContext, useContext } from 'react';
import type { FieldGroupProps, FieldGroupContextType } from '../Field.types';
import styles from '../Field.module.scss';

// FieldGroup Context
const FieldGroupContext = createContext<FieldGroupContextType | null>(null);

export const useFieldGroupContext = () => {
	const context = useContext(FieldGroupContext);
	return context; // Can be null, it's optional
};

export const FieldGroup = memo<FieldGroupProps>(({
	id,
	children,
	labelWidth = 'normal',
	className = '',
	style,
	spacing = 'normal',
	layout = 'horizontal',
	disabled = false,
}) => {
	const groupClasses = useMemo(() => {
		const classes = [styles.fieldGroup];
		
		// Add spacing class
		const spacingClass = `spacing${spacing.charAt(0).toUpperCase() + spacing.slice(1)}`;
		if (styles[spacingClass as keyof typeof styles]) {
			classes.push(styles[spacingClass as keyof typeof styles]);
		}
		
		// Add layout class
		const layoutClass = `layout${layout.charAt(0).toUpperCase() + layout.slice(1)}`;
		if (styles[layoutClass as keyof typeof styles]) {
			classes.push(styles[layoutClass as keyof typeof styles]);
		}
		
		// Add label width class
		if (typeof labelWidth === 'string' && labelWidth !== 'auto') {
			const labelWidthClass = `labelWidth${labelWidth.charAt(0).toUpperCase() + labelWidth.slice(1)}`;
			if (styles[labelWidthClass as keyof typeof styles]) {
				classes.push(styles[labelWidthClass as keyof typeof styles]);
			}
		}
		
		if (disabled) {
			classes.push(styles.disabled);
		}
		
		if (className) {
			classes.push(className);
		}
		
		return classes.join(' ');
	}, [spacing, layout, labelWidth, disabled, className]);

	const groupStyle = useMemo(() => {
		const baseStyle = { ...style };
		
		// Handle numeric label width
		if (typeof labelWidth === 'number') {
			baseStyle['--field-label-width-global' as any] = `${labelWidth}px`;
		}
		
		return baseStyle;
	}, [style, labelWidth]);

	const contextValue = useMemo(
		(): FieldGroupContextType => ({
			labelWidth,
			spacing,
			layout,
			disabled,
		}),
		[labelWidth, spacing, layout, disabled]
	);

	return (
		<FieldGroupContext.Provider value={contextValue}>
			<div 
				className={groupClasses} 
				style={groupStyle} 
				data-field-group-id={id}
			>
				{children}
			</div>
		</FieldGroupContext.Provider>
	);
});

FieldGroup.displayName = 'FieldGroup';
