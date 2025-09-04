import React, { useMemo } from 'react';
import { useTheme } from '@fluentui/react';
import { ContentAreaProps } from './types';
import { getStepperStyles } from './WorkflowStepper.styles';

export const ContentArea: React.FC<ContentAreaProps> = ({
  selectedStep,
  isVisible
}) => {
  const theme = useTheme();
  
  const styles = useMemo(() => 
    getStepperStyles(theme, { fullWidth: false, stepCount: 0 }), 
    [theme]
  );

  if (!isVisible || !selectedStep) {
    return null;
  }

  const renderContent = () => {
    if (!selectedStep.content) {
      return (
        <div className={styles.contentText}>
          No additional information available for this step.
        </div>
      );
    }

    // Handle React node content
    if (React.isValidElement(selectedStep.content)) {
      return selectedStep.content;
    }

    // Handle string content
    if (typeof selectedStep.content === 'string') {
      return (
        <div 
          className={styles.contentText}
          dangerouslySetInnerHTML={{ __html: selectedStep.content }}
        />
      );
    }

    // Fallback for other content types
    return (
      <div className={styles.contentText}>
        {String(selectedStep.content)}
      </div>
    );
  };

  const getStatusText = () => {
    switch (selectedStep.status) {
      case 'completed':
        return 'Completed';
      case 'current':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'warning':
        return 'Needs Attention';
      case 'error':
        return 'Error';
      case 'blocked':
        return 'Blocked';
      default:
        return '';
    }
  };

  return (
    <div 
      className={styles.contentArea}
      role="region"
      aria-label={`Content for ${selectedStep.title}`}
      aria-live="polite"
    >
      <div className={styles.contentTitle}>
        {selectedStep.title}
        {selectedStep.status && (
          <span 
            style={{ 
              marginLeft: '12px', 
              fontSize: theme.fonts.small.fontSize,
              color: theme.palette.neutralSecondary,
              fontWeight: 'normal'
            }}
          >
            ({getStatusText()})
          </span>
        )}
      </div>
      
      {(selectedStep.description1 || selectedStep.description2) && (
        <div style={{ marginBottom: '16px' }}>
          {selectedStep.description1 && (
            <div 
              style={{ 
                fontSize: theme.fonts.medium.fontSize,
                color: theme.palette.neutralSecondary,
                marginBottom: '4px'
              }}
            >
              {selectedStep.description1}
            </div>
          )}
          {selectedStep.description2 && (
            <div 
              style={{ 
                fontSize: theme.fonts.small.fontSize,
                color: theme.palette.neutralTertiary
              }}
            >
              {selectedStep.description2}
            </div>
          )}
        </div>
      )}
      
      {renderContent()}
    </div>
  );
};

export default ContentArea;
