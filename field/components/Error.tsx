import React, { memo, useMemo } from 'react';
import { Icon } from '@fluentui/react';
import type { ErrorProps } from '../Field.types';
import { useFieldContext } from '../Field';
import styles from '../Field.module.scss';

export const Error = memo<ErrorProps>(({
	children,
	animation = 'slide',
	position = 'below',
	className = '',
	style,
}) => {
	const { validationState } = useFieldContext();

	const errorClasses = useMemo(() => {
		const classes = [styles.fieldError];
		
		// Add animation class
		if (animation !== 'none') {
			const animationClass = `animation${animation.charAt(0).toUpperCase() + animation.slice(1)}`;
			if (styles[animationClass as keyof typeof styles]) {
				classes.push(styles[animationClass as keyof typeof styles]);
			}
		}
		
		// Add position class
		if (position === 'inline') {
			classes.push(styles.positionInline);
		}
		
		if (className) {
			classes.push(className);
		}
		
		return classes.join(' ');
	}, [animation, position, className]);

	// Determine what error message to show
	const errorMessage = children || validationState.error;
	
	// Show error if validation failed
	const showError = !validationState.isValid && errorMessage;

	if (!showError) {
		return null;
	}

	return (
		<div 
			className={errorClasses} 
			style={style} 
			role="alert" 
			aria-live="polite"
			data-field-error="true"
		>
			<Icon 
				iconName="ErrorBadge" 
				className={styles.errorIcon}
				aria-hidden="true"
			/>
			<span>{errorMessage}</span>
		</div>
	);
});

Error.displayName = 'Error';
