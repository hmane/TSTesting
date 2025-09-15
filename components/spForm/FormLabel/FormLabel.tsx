import { DirectionalHint } from '@fluentui/react';
import { Icon } from '@fluentui/react/lib/Icon';
import { ITooltipHostStyles, TooltipHost } from '@fluentui/react/lib/Tooltip';
import { getId } from '@fluentui/react/lib/Utilities';
import * as React from 'react';
import styles from './FormLabel.module.scss';

export interface IFormLabelProps {
  children: React.ReactNode;
  isRequired?: boolean;
  infoText?: string;
  infoContent?: React.ReactNode;
  infoPosition?: DirectionalHint;
  className?: string;
}

const FormLabel: React.FC<IFormLabelProps> = ({
  children,
  isRequired = false,
  infoText,
  infoContent,
  infoPosition = DirectionalHint.rightCenter,
  className = '',
}) => {
  const tooltipId = getId('tooltip');
  const hasInfo = !!(infoText || infoContent);

  const infoDisplayContent: string | JSX.Element = React.useMemo(() => {
    if (infoContent) {
      return typeof infoContent === 'string' ? infoContent : (infoContent as JSX.Element);
    }
    return infoText || '';
  }, [infoContent, infoText]);

  const tooltipStyles: Partial<ITooltipHostStyles> = {
    root: { display: 'inline-block' },
  };

  return (
    <div className={`${styles.formLabel} ${className}`}>
      <div className={styles.labelText}>
        <span className={styles.labelContent}>{children}</span>
        <span className={styles.labelSuffix}>
          {isRequired && <span className={styles.required}>*</span>}
          {hasInfo && (
            <TooltipHost
              content={infoDisplayContent}
              id={tooltipId}
              directionalHint={infoPosition}
              styles={tooltipStyles}
              delay={0}
            >
              <Icon iconName='Info' className={styles.infoIcon} aria-describedby={tooltipId} />
            </TooltipHost>
          )}
        </span>
      </div>
    </div>
  );
};

export default FormLabel;
