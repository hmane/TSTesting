import * as React from 'react';
import { memo, useMemo } from 'react';
import { useFieldContext } from '../Field';
import styles from '../Field.module.scss';
import type { LabelProps } from '../Field.types';

export const Label = memo<LabelProps>(
  ({ children, required = false, htmlFor, wrap = 'normal', className = '', style }) => {
    const { fieldId, fieldName } = useFieldContext();

    const labelClasses = useMemo(() => {
      const classes = [styles.fieldLabel];

      // Add wrap class
      const wrapClass = `wrap${wrap.charAt(0).toUpperCase() + wrap.slice(1)}`;
      if (styles[wrapClass as keyof typeof styles]) {
        classes.push(styles[wrapClass as keyof typeof styles]);
      }

      if (className) {
        classes.push(className);
      }

      return classes.join(' ');
    }, [wrap, className]);

    const labelFor = htmlFor || fieldId || fieldName;

    return (
      <label className={labelClasses} style={style} htmlFor={labelFor}>
        <span className={styles.labelText}>{children}</span>
        {required && (
          <span
            className={styles.requiredIndicator}
            aria-label='required'
            title='This field is required'
          >
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = 'Label';
