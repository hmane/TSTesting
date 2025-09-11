import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldContext } from '../Field/Field';
import styles from './FormLabel.module.scss';
import { FormLabelProps } from './FormLabel.types';

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  required = false,
  info,
  infoPlacement = 'top',
  htmlFor,
  describedBy,
  ariaLabel,
  size = 'md',
  weight = 'semibold',
  color = 'default',
  inline = false,
  srOnly = false,
  disabled = false,
  className = '',
  labelClassName = '',
  requiredClassName = '',
  infoIconClassName = '',
  onInfoClick,
  onInfoHover,
  debug = false,
  ...rest
}) => {
  const fieldContext = useFieldContext();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const infoIconRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Determine the actual htmlFor value
  const actualHtmlFor = useMemo(() => {
    return htmlFor || fieldContext.fieldId;
  }, [htmlFor, fieldContext.fieldId]);

  // Build label classes
  const labelClasses = useMemo(() => {
    const classes = [styles.formLabel];

    // Add size class
    if (size !== 'md') {
      classes.push((styles as any)[`size${size.charAt(0).toUpperCase() + size.slice(1)}`]);
    }

    // Add weight class
    if (weight !== 'semibold') {
      classes.push((styles as any)[`weight${weight.charAt(0).toUpperCase() + weight.slice(1)}`]);
    }

    // Add color class
    if (color !== 'default') {
      classes.push((styles as any)[`color${color.charAt(0).toUpperCase() + color.slice(1)}`]);
    }

    // Add modifier classes
    if (inline) classes.push(styles.inline);
    if (srOnly) classes.push(styles.srOnly);
    if (disabled) classes.push(styles.disabled);
    if (debug) classes.push(styles.debug);

    // Add custom classes
    if (className) classes.push(className);
    if (labelClassName) classes.push(labelClassName);

    return classes.join(' ');
  }, [size, weight, color, inline, srOnly, disabled, debug, className, labelClassName]);

  // Build required classes
  const requiredClasses = useMemo(() => {
    const classes = [styles.required];
    if (requiredClassName) classes.push(requiredClassName);
    return classes.join(' ');
  }, [requiredClassName]);

  // Build info icon classes
  const infoIconClasses = useMemo(() => {
    const classes = [styles.infoIcon];
    if (infoIconClassName) classes.push(infoIconClassName);
    return classes.join(' ');
  }, [infoIconClassName]);

  // Build tooltip classes
  const tooltipClasses = useMemo(() => {
    const classes = [styles.tooltip];
    classes.push(
      (styles as any)[`tooltip${infoPlacement.charAt(0).toUpperCase() + infoPlacement.slice(1)}`]
    );
    if (showTooltip) classes.push(styles.show);
    return classes.join(' ');
  }, [infoPlacement, showTooltip]);

  // Handle info icon interactions
  const handleInfoMouseEnter = (event: React.MouseEvent) => {
    setShowTooltip(true);
    if (onInfoHover) {
      onInfoHover(event);
    }
  };

  const handleInfoMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleInfoClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setShowTooltip(!showTooltip);
    if (onInfoClick) {
      onInfoClick(event);
    }
  };

  const handleInfoKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setShowTooltip(!showTooltip);
    }
    if (event.key === 'Escape') {
      setShowTooltip(false);
    }
  };

  // Position tooltip when shown
  useEffect(() => {
    if (showTooltip && infoIconRef.current && tooltipRef.current) {
      const iconRect = infoIconRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (infoPlacement) {
        case 'top':
          top = -tooltipRect.height - 8;
          left = (iconRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = iconRect.height + 8;
          left = (iconRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = (iconRect.height - tooltipRect.height) / 2;
          left = -tooltipRect.width - 8;
          break;
        case 'right':
          top = (iconRect.height - tooltipRect.height) / 2;
          left = iconRect.width + 8;
          break;
      }

      setTooltipPosition({ top, left });
    }
  }, [showTooltip, infoPlacement, info]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showTooltip &&
        infoIconRef.current &&
        !infoIconRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <label
      className={labelClasses}
      htmlFor={actualHtmlFor}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      data-label-for={debug ? actualHtmlFor : undefined}
      {...rest}
    >
      <span className={styles.labelContent}>
        {children}

        {required && (
          <span className={requiredClasses} aria-label='required field' role='img'>
            *
          </span>
        )}

        {info && (
          <div className={styles.infoContainer}>
            <button
              ref={infoIconRef}
              type='button'
              className={infoIconClasses}
              aria-label='More information'
              aria-expanded={showTooltip}
              aria-describedby={`${actualHtmlFor}-info-tooltip`}
              onMouseEnter={handleInfoMouseEnter}
              onMouseLeave={handleInfoMouseLeave}
              onClick={handleInfoClick}
              onKeyDown={handleInfoKeyDown}
              tabIndex={0}
            >
              ?
            </button>

            {info && (
              <div
                ref={tooltipRef}
                id={`${actualHtmlFor}-info-tooltip`}
                className={tooltipClasses}
                role='tooltip'
                aria-hidden={!showTooltip}
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                }}
              >
                <div className={styles.tooltipContent}>
                  {typeof info === 'string' ? info : info}
                </div>
              </div>
            )}
          </div>
        )}
      </span>
    </label>
  );
};

FormLabel.displayName = 'FormLabel';

export default FormLabel;
