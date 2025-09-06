import * as React from 'react';
import { createContext, memo, useContext, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import styles from '../Field.module.scss';
import type { FieldGroupContextType, FieldGroupProps } from '../Field.types';

// FieldGroup Context
const FieldGroupContext = createContext<FieldGroupContextType | null>(null);

export const useFieldGroupContext = () => {
  const context = useContext(FieldGroupContext);
  return context; // Can be null, it's optional
};

export const FieldGroup = memo<FieldGroupProps>(
  ({
    id,
    children,
    labelWidth = 'normal',
    className = '',
    style,
    spacing = 'normal',
    layout = 'horizontal',
    disabled = false,
    control, // ADD: Accept the control prop
  }) => {
    // ADD: Try to get form context to find a control object if not passed directly
    const formContext = useFormContext();
    const activeControl = control || formContext?.control;

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
        const labelWidthClass = `labelWidth${
          labelWidth.charAt(0).toUpperCase() + labelWidth.slice(1)
        }`;
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
        (baseStyle as React.CSSProperties & Record<string, string>)['--field-label-width-global'] = `${labelWidth}px`;
      }

      return baseStyle;
    }, [style, labelWidth]);

    const contextValue = useMemo(
      (): FieldGroupContextType => ({
        labelWidth,
        spacing,
        layout,
        disabled,
        control: activeControl, // ADD: Pass the active control object through context
      }),
      [labelWidth, spacing, layout, disabled, activeControl]
    );

    return (
      <FieldGroupContext.Provider value={contextValue}>
        <div className={groupClasses} style={groupStyle} data-field-group-id={id}>
          {children}
        </div>
      </FieldGroupContext.Provider>
    );
  }
);

FieldGroup.displayName = 'FieldGroup';
