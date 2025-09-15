import * as React from 'react';
import styles from './FormDescription.module.scss';

export interface IFormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const FormDescription: React.FC<IFormDescriptionProps> = ({ children, className = '' }) => {
  return <div className={`${styles.formDescription} ${className}`}>{children}</div>;
};

export default FormDescription;
