import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  Icon,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Separator,
  Spinner,
  Stack,
  Text,
} from '@fluentui/react';
import * as React from 'react';
import { useState } from 'react';
import { ConflictInfo, ConflictResolutionAction } from './types';
import { ConflictNotificationBar } from './ConflictNotificationBar';

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  conflictInfo: ConflictInfo | null;
  isProcessing?: boolean;
  customTitle?: string;
  customMessage?: string;
  showOverwriteOption?: boolean;
  showRefreshOption?: boolean;
  onResolve: (action: ConflictResolutionAction) => void;
  onDismiss: () => void;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  isOpen,
  conflictInfo,
  isProcessing = false,
  customTitle,
  customMessage,
  showOverwriteOption = true,
  showRefreshOption = true,
  onResolve,
  onDismiss,
}) => {
  const [selectedAction, setSelectedAction] = useState<ConflictResolutionAction['type'] | null>(
    null
  );

  if (!conflictInfo?.hasConflict) {
    return null;
  }

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleResolve = (actionType: ConflictResolutionAction['type']) => {
    let message = '';

    switch (actionType) {
      case 'refresh':
        message = 'User chose to refresh and reload the current data';
        break;
      case 'overwrite':
        message = 'User chose to continue and overwrite the existing changes';
        break;
      case 'cancel':
        message = 'User cancelled the operation';
        break;
    }

    setSelectedAction(actionType);

    onResolve({
      type: actionType,
      message,
    });
  };

  const title = customTitle || 'Conflict Detected';

  const defaultMessage = `This record has been modified by another user while you were editing it.
    You can refresh to see the latest changes, or continue to overwrite them with your changes.`;

  const message = customMessage || defaultMessage;

  const dialogStyles = {
    main: {
      minWidth: '500px',
      maxWidth: '600px',
    },
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.normal,
        title: title,
        styles: dialogStyles,
      }}
      modalProps={{
        isBlocking: true,
        dragOptions: undefined,
      }}
    >
      <Stack tokens={{ childrenGap: 16 }}>
        {/* Warning icon and message */}
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign='start'>
          <Icon
            iconName='Warning'
            styles={{
              root: {
                fontSize: 24,
                color: '#ff8c00',
                marginTop: 2,
              },
            }}
          />
          <Stack tokens={{ childrenGap: 8 }} styles={{ root: { flex: 1 } }}>
            <Text variant='medium'>{message}</Text>
          </Stack>
        </Stack>

        <Separator />

        {/* Conflict details */}
        <Stack tokens={{ childrenGap: 12 }}>
          <Text variant='mediumPlus' styles={{ root: { fontWeight: 600 } }}>
            Conflict Details:
          </Text>

          <Stack tokens={{ childrenGap: 8 }}>
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <Text variant='small' styles={{ root: { fontWeight: 600, minWidth: '120px' } }}>
                Modified by:
              </Text>
              <Text variant='small'>{conflictInfo.lastModifiedBy}</Text>
            </Stack>

            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <Text variant='small' styles={{ root: { fontWeight: 600, minWidth: '120px' } }}>
                Modified on:
              </Text>
              <Text variant='small'>{formatDateTime(conflictInfo.lastModified)}</Text>
            </Stack>

            {conflictInfo.originalModified && (
              <Stack horizontal tokens={{ childrenGap: 8 }}>
                <Text variant='small' styles={{ root: { fontWeight: 600, minWidth: '120px' } }}>
                  You started editing:
                </Text>
                <Text variant='small'>{formatDateTime(conflictInfo.originalModified)}</Text>
              </Stack>
            )}
          </Stack>
        </Stack>

        {/* Processing indicator */}
        {isProcessing && (
          <MessageBar messageBarType={MessageBarType.info}>
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign='center'>
              <Spinner size={1} />
              <Text>Processing your request...</Text>
            </Stack>
          </MessageBar>
        )}

        {/* Action warning */}
        {selectedAction === 'overwrite' && !isProcessing && (
          <MessageBar messageBarType={MessageBarType.warning}>
            <Text>
              <strong>Warning:</strong> Continuing will overwrite changes made by{' '}
              {conflictInfo.lastModifiedBy}. This action cannot be undone.
            </Text>
          </MessageBar>
        )}
      </Stack>

      <DialogFooter>
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          {/* Refresh button */}
          {showRefreshOption && (
            <PrimaryButton
              onClick={() => handleResolve('refresh')}
              disabled={isProcessing}
              iconProps={{ iconName: 'Refresh' }}
            >
              Refresh & Reload
            </PrimaryButton>
          )}

          {/* Overwrite button */}
          {showOverwriteOption && (
            <DefaultButton
              onClick={() => handleResolve('overwrite')}
              disabled={isProcessing}
              iconProps={{ iconName: 'Warning' }}
              styles={{
                root: {
                  borderColor: '#ff8c00',
                },
                rootHovered: {
                  borderColor: '#ff8c00',
                  backgroundColor: '#fff4e6',
                },
              }}
            >
              Continue Anyway
            </DefaultButton>
          )}

          {/* Cancel button */}
          <DefaultButton onClick={() => handleResolve('cancel')} disabled={isProcessing}>
            Cancel
          </DefaultButton>
        </Stack>
      </DialogFooter>
    </Dialog>
  );
};

// Hook for managing dialog state
export const useConflictResolutionDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const openDialog = React.useCallback(() => {
    setIsOpen(true);
    setIsProcessing(false);
  }, []);

  const closeDialog = React.useCallback(() => {
    setIsOpen(false);
    setIsProcessing(false);
  }, []);

  const setProcessing = React.useCallback((processing: boolean) => {
    setIsProcessing(processing);
  }, []);

  return {
    isOpen,
    isProcessing,
    openDialog,
    closeDialog,
    setProcessing,
  };
};

// Combined notification and dialog component
interface ConflictHandlerProps {
  conflictInfo: ConflictInfo | null;
  isChecking: boolean;
  error: string | null;
  showDialog?: boolean;
  showNotification?: boolean;
  onRefresh?: () => void;
  onOverwrite?: () => void;
  onDismiss?: () => void;
  onAction?: (action: ConflictResolutionAction) => void;
}

export const ConflictHandler: React.FC<ConflictHandlerProps> = ({
  conflictInfo,
  isChecking,
  error,
  showDialog = false,
  showNotification = true,
  onRefresh,
  onOverwrite,
  onDismiss,
  onAction,
}) => {
  const { isOpen, isProcessing, openDialog, closeDialog, setProcessing } =
    useConflictResolutionDialog();

  React.useEffect(() => {
    if (conflictInfo?.hasConflict && showDialog && !isOpen) {
      openDialog();
    }
  }, [conflictInfo?.hasConflict, showDialog, isOpen, openDialog]);

  const handleAction = async (action: ConflictResolutionAction) => {
    setProcessing(true);

    try {
      if (onAction) {
        await onAction(action);
      }

      // Execute specific handlers
      switch (action.type) {
        case 'refresh':
          await onRefresh?.();
          break;
        case 'overwrite':
          await onOverwrite?.();
          break;
        case 'cancel':
          onDismiss?.();
          break;
      }
    } finally {
      setProcessing(false);
      if (showDialog) {
        closeDialog();
      }
    }
  };

  return (
    <>
      {/* Notification Bar */}
      {showNotification && (
        <ConflictNotificationBar
          conflictInfo={conflictInfo}
          isChecking={isChecking}
          error={error}
          onRefresh={onRefresh}
          onOverwrite={onOverwrite}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      )}

      {/* Resolution Dialog */}
      {showDialog && (
        <ConflictResolutionDialog
          isOpen={isOpen}
          conflictInfo={conflictInfo}
          isProcessing={isProcessing}
          onResolve={handleAction}
          onDismiss={closeDialog}
        />
      )}
    </>
  );
};
