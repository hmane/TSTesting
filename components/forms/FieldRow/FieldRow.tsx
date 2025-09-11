import * as React from 'react';
import { useMemo } from 'react';
import styles from './FieldRow.module.scss';
import { FieldRowProps } from './FieldRow.types';

export const FieldRow: React.FC<FieldRowProps> = ({
  children,
  noGutters = false,
  alignItems = 'stretch',
  justifyContent = 'start',
  direction = 'row',
  wrap = 'wrap',
  gutterSize = 'md',
  debug = false,
  className = '',
  showWhen,
  ...rest
}) => {
  // Determine if row should be shown based on conditional logic
  const shouldShow = useMemo(() => {
    if (showWhen && typeof showWhen === 'function') {
      // In a real implementation, you'd get form values from react-hook-form context
      // For now, we'll assume the row should be shown
      return true;
    }
    return true;
  }, [showWhen]);

  // Build CSS classes
  const rowClasses = useMemo(() => {
    const classes = [styles.fieldRow];

    // Add gutter classes
    if (noGutters) {
      classes.push(styles.noGutters);
    } else if (gutterSize !== 'md') {
      classes.push(styles[`gutter${gutterSize.charAt(0).toUpperCase() + gutterSize.slice(1)}` as keyof typeof styles]);
    }

    // Add flex direction classes
    if (direction !== 'row') {
      const directionClass = direction
        .split('-')
        .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join('');
      classes.push(
        styles[`direction${directionClass.charAt(0).toUpperCase() + directionClass.slice(1)}` as keyof typeof styles]
      );
    }

    // Add flex wrap classes
    if (wrap !== 'wrap') {
      const wrapClass = wrap
        .split('-')
        .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join('');
      classes.push(styles[`wrap${wrapClass.charAt(0).toUpperCase() + wrapClass.slice(1)}` as keyof typeof styles]);
    }

    // Add align items classes
    if (alignItems !== 'stretch') {
      classes.push(styles[`alignItems${alignItems.charAt(0).toUpperCase() + alignItems.slice(1)}` as keyof typeof styles]);
    }

    // Add justify content classes
    if (justifyContent !== 'start') {
      classes.push(
        styles[`justifyContent${justifyContent.charAt(0).toUpperCase() + justifyContent.slice(1)}` as keyof typeof styles]
      );
    }

    // Add debug class
    if (debug) {
      classes.push(styles.debug);
    }

    // Add custom className
    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  }, [noGutters, gutterSize, direction, wrap, alignItems, justifyContent, debug, className]);

  // Don't render if conditional logic says to hide
  if (!shouldShow) {
    return null;
  }

  return (
    <div className={rowClasses} data-testid='fieldrow-container' role='group' {...rest}>
      {children}
    </div>
  );
};

FieldRow.displayName = 'FieldRow';

export default FieldRow;
