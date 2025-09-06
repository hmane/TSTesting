import {
  MessageBar,
  MessageBarButton,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
} from '@fluentui/react';
import * as React from 'react';
import { ConflictInfo, ConflictResolutionAction } from './types';

interface ConflictNotificationBarProps {
  conflictInfo: ConflictInfo | null;
  isChecking: boolean;
  error: string | null;
  customMessage?: string;
  showDismiss?: boolean;
  onRefresh?: () => void;
  onOverwrite?: () => void;
  onDismiss?: () => void;
  onAction?: (action: ConflictResolutionAction) => void;
}

export const ConflictNotificationBar: React.FC<ConflictNotificationBarProps> = ({
  conflictInfo,
  isChecking,
  error,
  customMessage,
  showDismiss = true,
  onRefresh,
  onOverwrite,
  onDismiss,
  onAction,
}) => {
  // Don't render if no conflict, error, or checking state
  if (!conflictInfo?.hasConflict && !error && !isChecking) {
    return null;
  }

  const handleAction = (action: ConflictResolutionAction) => {
    if (onAction) {
      onAction(action);
    }

    // Execute specific handlers
    switch (action.type) {
      case 'refresh':
        onRefresh?.();
        break;
      case 'overwrite':
        onOverwrite?.();
        break;
      case 'cancel':
        onDismiss?.();
        break;
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Error state
  if (error) {
    return (
      <MessageBar
        messageBarType={MessageBarType.error}
        isMultiline={false}
        onDismiss={showDismiss ? onDismiss : undefined}
        dismissButtonAriaLabel='Close error message'
      >
        <Stack horizontal verticalAlign='center' tokens={{ childrenGap: 8 }}>
          <Text>
            <strong>Conflict Detection Error:</strong> {error}
          </Text>
        </Stack>
      </MessageBar>
    );
  }

  // Checking state
  if (isChecking) {
    return (
      <MessageBar messageBarType={MessageBarType.info} isMultiline={false}>
        <Stack horizontal verticalAlign='center' tokens={{ childrenGap: 8 }}>
          <Spinner size={SpinnerSize.xSmall} />
          <Text>Checking for conflicts...</Text>
        </Stack>
      </MessageBar>
    );
  }

  // Conflict detected state
  if (conflictInfo?.hasConflict) {
    const conflictMessage =
      customMessage ||
      `This record was modified by ${conflictInfo.lastModifiedBy} on ${formatDateTime(
        conflictInfo.lastModified
      )}. Your changes might overwrite their updates.`;

    const actions: MessageBarButton[] = [];

    // Add refresh action
    if (onRefresh || onAction) {
      actions.push({
        text: 'Refresh & Reload',
        onClick: () =>
          handleAction({
            type: 'refresh',
            message: 'User chose to refresh and reload the form',
          }),
      });
    }

    // Add overwrite action
    if (onOverwrite || onAction) {
      actions.push({
        text: 'Continue Anyway',
        onClick: () =>
          handleAction({
            type: 'overwrite',
            message: 'User chose to continue and overwrite changes',
          }),
      });
    }

    return (
      <MessageBar
        messageBarType={MessageBarType.warning}
        isMultiline={true}
        onDismiss={showDismiss ? onDismiss : undefined}
        dismissButtonAriaLabel='Dismiss conflict warning'
        actions={
          <div>
            {actions.map((action, index) => (
              <MessageBarButton key={index} onClick={action.onClick}>
                {action.text}
              </MessageBarButton>
            ))}
          </div>
        }
      >
        <Stack tokens={{ childrenGap: 4 }}>
          <Text>
            <strong>Conflict Detected:</strong> {conflictMessage}
          </Text>
          {conflictInfo.originalModified && (
            <Text variant='small' styles={{ root: { color: '#666' } }}>
              Your editing session started: {formatDateTime(conflictInfo.originalModified)}
            </Text>
          )}
        </Stack>
      </MessageBar>
    );
  }

  return null;
};

// Specialized notification for different positions
interface ConflictNotificationProps extends ConflictNotificationBarProps {
  position?: 'top' | 'bottom' | 'inline';
  style?: React.CSSProperties;
}

export const ConflictNotification: React.FC<ConflictNotificationProps> = ({
  position = 'top',
  style,
  ...props
}) => {
  const positionStyles: React.CSSProperties = {
    position: position === 'inline' ? 'relative' : 'fixed',
    left: position === 'inline' ? 'auto' : 0,
    right: position === 'inline' ? 'auto' : 0,
    top: position === 'top' ? 0 : 'auto',
    bottom: position === 'bottom' ? 0 : 'auto',
    zIndex: position === 'inline' ? 'auto' : 1000,
    ...style,
  };

  return (
    <div style={positionStyles}>
      <ConflictNotificationBar {...props} />
    </div>
  );
};

// Hook to manage notification state
export const useConflictNotification = () => {
  const [isDismissed, setIsDismissed] = React.useState(false);

  const resetDismissed = React.useCallback(() => {
    setIsDismissed(false);
  }, []);

  const dismiss = React.useCallback(() => {
    setIsDismissed(true);
  }, []);

  return {
    isDismissed,
    resetDismissed,
    dismiss,
  };
};
