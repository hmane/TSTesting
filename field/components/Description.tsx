import * as React from 'react';
import { memo, useMemo } from 'react';
import { TooltipHost, Icon } from '@fluentui/react';
import type { ITooltipHostStyles } from '@fluentui/react/lib/Tooltip';
import type { DescriptionProps } from '../Field.types';
import styles from '../Field.module.scss';

const tooltipStyles: Partial<ITooltipHostStyles> = {
	root: {
		display: 'inline-flex',
		alignItems: 'center',
	},
};

export const Description = memo<DescriptionProps>(({
	children,
	icon = 'Info',
	position = 'end',
	delay = 300,
	className = '',
	style,
}) => {
	const descriptionClasses = useMemo(() => {
		const classes = [styles.description];

		// Add position class if needed
		if (position === 'inline') {
			classes.push(styles.descriptionInline);
		}

		if (className) {
			classes.push(className);
		}

		return classes.join(' ');
	}, [position, className]);

	const tooltipProps = useMemo(() => ({
		content: children,
		delay,
		styles: tooltipStyles,
	}), [children, delay]);

	return (
		<div className={descriptionClasses} style={style}>
			<TooltipHost {...tooltipProps}>
				<button
					type="button"
					className={styles.descriptionIcon}
					aria-label="Additional information"
					tabIndex={0}
				>
					<Icon iconName={icon} />
				</button>
			</TooltipHost>
		</div>
	);
});

Description.displayName = 'Description';
