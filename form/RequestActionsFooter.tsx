import * as React from 'react';
import {
  PrimaryButton,
  DefaultButton,
  IconButton,
  Stack,
  TooltipHost,
  DirectionalHint,
  Spinner,
  SpinnerSize,
  Dialog,
  DialogType,
  DialogFooter,
  MessageBar,
  MessageBarType,
  TextField,
} from '@fluentui/react';
import { useRequestFormStore } from '../../stores/requestFormStore';
import { SPContext } from '../../utilities/context';
import type { Request } from '../../types/Request';
import './RequestActionsFooter.scss';

export interface IRequestActionsFooterProps {
  onClose: () => void;
}

const RequestActionsFooter: React.FC<IRequestActionsFooterProps> = ({ onClose }) => {
  const { request, saveAsDraft, submitRequest, holdRequest, resumeRequest, cancelRequest } = useRequestFormStore();
  
  const [isSaving, setIsSaving] = React.useState(false);
  const [showHoldDialog, setShowHoldDialog] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [holdReason, setHoldReason] = React.useState('');
  const [cancelReason, setCancelReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const isDraft = request.status === 'Draft' || !request.id;
  const isOnHold = request.status === 'On Hold';
  const isCompleted = request.status === 'Completed';
  const isCancelled = request.status === 'Cancelled';
  const isReadOnly = isCompleted || isCancelled;

  const canSave = isDraft;
  const canSubmit = isDraft;
  const canHold = !isDraft && !isOnHold && !isReadOnly;
  const canResume = isOnHold;
  const canCancel = !isReadOnly;

  const handleSaveAsDraft = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);

    try {
      await saveAsDraft();

      SPContext.logger.success('Request saved as draft', {
        requestId: request.id,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save request';
      setError(errorMessage);

      SPContext.logger.error('Failed to save request', err, {
        requestId: request.id,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);

    try {
      await submitRequest();

      SPContext.logger.success('Request submitted successfully', {
        requestId: request.id,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit request';
      setError(errorMessage);

      SPContext.logger.error('Failed to submit request', err, {
        requestId: request.id,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleHold = (): void => {
    setHoldReason('');
    setShowHoldDialog(true);
  };

  const confirmHold = async (): Promise<void> => {
    if (holdReason.trim().length < 10) {
      setError('Hold reason must be at least 10 characters');
      return;
    }

    setShowHoldDialog(false);
    setIsSaving(true);
    setError(null);

    try {
      await holdRequest(holdReason);

      SPContext.logger.success('Request put on hold', {
        requestId: request.id,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to put request on hold';
      setError(errorMessage);

      SPContext.logger.error('Failed to hold request', err, {
        requestId: request.id,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResume = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);

    try {
      await resumeRequest();

      SPContext.logger.success('Request resumed', {
        requestId: request.id,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume request';
      setError(errorMessage);

      SPContext.logger.error('Failed to resume request', err, {
        requestId: request.id,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (): void => {
    setCancelReason('');
    setShowCancelDialog(true);
  };

  const confirmCancel = async (): Promise<void> => {
    if (cancelReason.trim().length < 10) {
      setError('Cancel reason must be at least 10 characters');
      return;
    }

    setShowCancelDialog(false);
    setIsSaving(true);
    setError(null);

    try {
      await cancelRequest(cancelReason);

      SPContext.logger.success('Request cancelled', {
        requestId: request.id,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel request';
      setError(errorMessage);

      SPContext.logger.error('Failed to cancel request', err, {
        requestId: request.id,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="request-actions-footer">
        {error && (
          <div className="footer-error">
            <MessageBar
              messageBarType={MessageBarType.error}
              onDismiss={() => setError(null)}
              dismissButtonAriaLabel="Close"
            >
              {error}
            </MessageBar>
          </div>
        )}

        <div className="footer-content">
          <div className="footer-left-actions">
            {canCancel && (
              <TooltipHost
                content="Cancel this request permanently. This action cannot be undone."
                directionalHint={DirectionalHint.topCenter}
              >
                <DefaultButton
                  text="Cancel Request"
                  iconProps={{ iconName: 'Cancel' }}
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="cancel-button"
                />
              </TooltipHost>
            )}

            {canHold && (
              <TooltipHost
                content="Temporarily pause this request. You can resume it later."
                directionalHint={DirectionalHint.topCenter}
              >
                <DefaultButton
                  text="Put On Hold"
                  iconProps={{ iconName: 'Pause' }}
                  onClick={handleHold}
                  disabled={isSaving}
                  className="hold-button"
                />
              </TooltipHost>
            )}

            {canResume && (
              <TooltipHost
                content="Resume this request from where it was paused."
                directionalHint={DirectionalHint.topCenter}
              >
                <DefaultButton
                  text="Resume Request"
                  iconProps={{ iconName: 'Play' }}
                  onClick={handleResume}
                  disabled={isSaving}
                  className="resume-button"
                />
              </TooltipHost>
            )}
          </div>

          <div className="footer-center">
            {isSaving && (
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <Spinner size={SpinnerSize.small} />
                <span className="saving-text">Processing...</span>
              </Stack>
            )}
          </div>

          <div className="footer-right-actions">
            {canSave && (
              <TooltipHost
                content="Save your progress without submitting. You can continue editing later."
                directionalHint={DirectionalHint.topCenter}
              >
                <DefaultButton
                  text="Save as Draft"
                  iconProps={{ iconName: 'Save' }}
                  onClick={handleSaveAsDraft}
                  disabled={isSaving}
                />
              </TooltipHost>
            )}

            {canSubmit && (
              <TooltipHost
                content="Submit this request for legal review. Make sure all required fields are completed."
                directionalHint={DirectionalHint.topCenter}
              >
                <PrimaryButton
                  text="Submit Request"
                  iconProps={{ iconName: 'Send' }}
                  onClick={handleSubmit}
                  disabled={isSaving}
                />
              </TooltipHost>
            )}

            <TooltipHost
              content="Close and return to the previous page."
              directionalHint={DirectionalHint.topCenter}
            >
              <IconButton
                iconProps={{ iconName: 'ChromeClose' }}
                title="Close"
                ariaLabel="Close"
                onClick={onClose}
                disabled={isSaving}
                className="close-button"
              />
            </TooltipHost>
          </div>
        </div>
      </div>

      <Dialog
        hidden={!showHoldDialog}
        onDismiss={() => setShowHoldDialog(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Put Request On Hold',
          subText: 'Please provide a reason for putting this request on hold. You can resume it at any time.',
        }}
        modalProps={{
          isBlocking: true,
        }}
      >
        <TextField
          label="Hold Reason"
          multiline
          rows={4}
          value={holdReason}
          onChange={(e, value) => setHoldReason(value || '')}
          placeholder="Enter the reason for putting this request on hold (minimum 10 characters)..."
          required
        />
        {holdReason.length > 0 && holdReason.length < 10 && (
          <MessageBar messageBarType={MessageBarType.warning}>
            Hold reason must be at least 10 characters ({holdReason.length}/10)
          </MessageBar>
        )}
        <DialogFooter>
          <PrimaryButton
            onClick={confirmHold}
            text="Put On Hold"
            disabled={holdReason.trim().length < 10}
          />
          <DefaultButton onClick={() => setShowHoldDialog(false)} text="Cancel" />
        </DialogFooter>
      </Dialog>

      <Dialog
        hidden={!showCancelDialog}
        onDismiss={() => setShowCancelDialog(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Cancel Request',
          subText: 'Are you sure you want to cancel this request? This action cannot be undone.',
        }}
        modalProps={{
          isBlocking: true,
        }}
      >
        <MessageBar messageBarType={MessageBarType.warning}>
          <strong>Warning:</strong> Cancelling this request will permanently stop all progress. This action cannot be reversed.
        </MessageBar>
        <TextField
          label="Cancellation Reason"
          multiline
          rows={4}
          value={cancelReason}
          onChange={(e, value) => setCancelReason(value || '')}
          placeholder="Enter the reason for cancelling this request (minimum 10 characters)..."
          required
        />
        {cancelReason.length > 0 && cancelReason.length < 10 && (
          <MessageBar messageBarType={MessageBarType.warning}>
            Cancel reason must be at least 10 characters ({cancelReason.length}/10)
          </MessageBar>
        )}
        <DialogFooter>
          <PrimaryButton
            onClick={confirmCancel}
            text="Cancel Request"
            disabled={cancelReason.trim().length < 10}
            className="danger-button"
          />
          <DefaultButton onClick={() => setShowCancelDialog(false)} text="Keep Request" />
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default RequestActionsFooter;
