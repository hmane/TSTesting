import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './FormError.module.scss';

export interface IFormErrorProps {
  error?: string | string[];
  showIcon?: boolean;
  className?: string;
}

const FormError: React.FC<IFormErrorProps> = ({ error, showIcon = false, className = '' }) => {
  if (!error) {
    return null;
  }

  const errors = Array.isArray(error) ? error : [error];
  const hasMultipleErrors = errors.length > 1;

  return (
    <div className={`${styles.formError} ${className}`}>
      {hasMultipleErrors ? (
        <ul className={styles.errorList}>
          {errors.map((err, index) => (
            <li key={index} className={styles.errorItem}>
              {showIcon && <Icon iconName='ErrorBadge' className={styles.errorIcon} />}
              <span className={styles.errorText}>{err}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.errorItem}>
          {showIcon && <Icon iconName='ErrorBadge' className={styles.errorIcon} />}
          <span className={styles.errorText}>{errors[0]}</span>
        </div>
      )}
    </div>
  );
};

export default FormError;
