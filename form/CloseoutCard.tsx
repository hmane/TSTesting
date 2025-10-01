import * as React from 'react';
import { useForm } from 'react-hook-form';
import { PrimaryButton, Stack, MessageBar, MessageBarType, Dialog, DialogType, DialogFooter, DefaultButton } from '@fluentui/react';
import {
  Card,
  Header,
  Content,
  Footer,
} from '../../../components/Card';
import {
  FormItem,
  FormLabel,
  FormValue,
  FormDescription,
  FormError,
  DevExtremeTextBox,
} from '../../../components/spForm';
import { useRequestFormStore } from '../../../stores/requestFormStore';
import { SPContext } from '../../../utilities/context';
import type { Request } from '../../../types/Request';
import './CloseoutCard.scss';

const CloseoutSummary: React.FC<{ request: Request }> = ({ request }) => {
  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getOutcomeIcon = (outcome?: string): string => {
    switch (outcome) {
      case 'Approved':
        return 'CheckMark';
      case 'Approved With Comments':
        return 'CompletedSolid';
      case 'Respond To Comments And Resubmit':
        return 'Reply';
      case 'Not Approved':
        return 'Cancel';
      default:
        return 'Unknown';
    }
  };

  const getOutcomeClass = (outcome?: string): string => {
    switch (outcome) {
      case 'Approved':
        return 'outcome-approved';
      case 'Approved With Comments':
        return 'outcome-approved-comments';
      case 'Respond To Comments And Resubmit':
        return 'outcome-respond';
      case 'Not Approved':
        return 'outcome-rejected';
      default:
        return '';
    }
  };

  const showLegalReview = request.reviewAudience === 'Legal' || request.reviewAudience === 'Both';
  const showComplianceReview = request.reviewAudience === 'Compliance' || request.reviewAudience === 'Both';

  return (
    <div className="closeout-summary">
      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--CompletedSolid category-icon" />
          <h3 className="category-title">Review Summary</h3>
        </div>
        <div className="review-summary-grid">
          {showLegalReview && (
            <div className="review-summary-item">
              <div className="review-header">
                <i className="ms-Icon ms-Icon--Scale review-icon" />
                <span className="review-title">Legal Review</span>
              </div>
              <div className={`review-outcome ${getOutcomeClass(request.legalReviewOutcome)}`}>
                <i className={`ms-Icon ms-Icon--${getOutcomeIcon(request.legalReviewOutcome)} outcome-icon`} />
                <span className="outcome-text">{request.legalReviewOutcome || 'Pending'}</span>
              </div>
              {request.attorney && (
                <div className="review-detail">
                  <label>Reviewed by:</label>
                  <span>{request.attorney}</span>
                </div>
              )}
              {request.legalStatusUpdatedOn && (
                <div className="review-detail">
                  <label>Completed:</label>
                  <span>{formatDate(request.legalStatusUpdatedOn)}</span>
                </div>
              )}
            </div>
          )}

          {showComplianceReview && (
            <div className="review-summary-item">
              <div className="review-header">
                <i className="ms-Icon ms-Icon--ComplianceAudit review-icon" />
                <span className="review-title">Compliance Review</span>
              </div>
              <div className={`review-outcome ${getOutcomeClass(request.complianceReviewOutcome)}`}>
                <i className={`ms-Icon ms-Icon--${getOutcomeIcon(request.complianceReviewOutcome)} outcome-icon`} />
                <span className="outcome-text">{request.complianceReviewOutcome || 'Pending'}</span>
              </div>
              {request.complianceStatusUpdatedBy && (
                <div className="review-detail">
                  <label>Reviewed by:</label>
                  <span>{request.complianceStatusUpdatedBy}</span>
                </div>
              )}
              {request.complianceStatusUpdatedOn && (
                <div className="review-detail">
                  <label>Completed:</label>
                  <span>{formatDate(request.complianceStatusUpdatedOn)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {request.trackingId && (
        <div className="field-category">
          <div className="category-header">
            <i className="ms-Icon ms-Icon--NumberedList category-icon" />
            <h3 className="category-title">Tracking Information</h3>
          </div>
          <div className="summary-grid">
            <div className="summary-field">
              <label>Tracking ID</label>
              <div className="summary-value">{request.trackingId}</div>
            </div>
            {request.isForesideReviewRequired && (
              <div className="summary-field">
                <label>Foreside Review</label>
                <div className="summary-value">
                  <span className="flag-badge">Required</span>
                </div>
              </div>
            )}
            {request.isRetailUse && (
              <div className="summary-field">
                <label>Retail Use</label>
                <div className="summary-value">
                  <span className="flag-badge">Yes</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {request.closeoutBy && request.closeoutOn && (
        <div className="closeout-info">
          <i className="ms-Icon ms-Icon--Info" />
          <span>
            Closed by <strong>{request.closeoutBy}</strong> on {formatDate(request.closeoutOn)}
          </span>
        </div>
      )}
    </div>
  );
};

const CloseoutEdit: React.FC<{
  control: any;
  errors: any;
  setValue: any;
}> = ({ control, errors, setValue }) => {
  const { request, updateField } = useRequestFormStore();

  const trackingIdRequired = request.isForesideReviewRequired || request.isRetailUse;

  const handleFieldChange = React.useCallback((fieldName: string, value: any) => {
    setValue(fieldName, value);
    updateField(fieldName as keyof Request, value);
  }, [setValue, updateField]);

  const showLegalReview = request.reviewAudience === 'Legal' || request.reviewAudience === 'Both';
  const showComplianceReview = request.reviewAudience === 'Compliance' || request.reviewAudience === 'Both';

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="closeout-edit">
      <MessageBar messageBarType={MessageBarType.success}>
        <strong>All reviews completed!</strong> Please provide any required tracking information and close this request.
      </MessageBar>

      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--CompletedSolid category-icon" />
          <h3 className="category-title">Review Summary</h3>
        </div>
        <div className="review-summary-list">
          {showLegalReview && (
            <div className="review-summary-compact">
              <i className="ms-Icon ms-Icon--CheckMark success-icon" />
              <span>
                <strong>Legal Review:</strong> {request.legalReviewOutcome || 'Completed'}
              </span>
            </div>
          )}
          {showComplianceReview && (
            <div className="review-summary-compact">
              <i className="ms-Icon ms-Icon--CheckMark success-icon" />
              <span>
                <strong>Compliance Review:</strong> {request.complianceReviewOutcome || 'Completed'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--NumberedList category-icon" />
          <h3 className="category-title">Tracking Information</h3>
        </div>
        <div className="category-fields">
          {trackingIdRequired && (
            <MessageBar messageBarType={MessageBarType.warning}>
              <strong>Tracking ID Required:</strong> This request requires a tracking ID because{' '}
              {request.isForesideReviewRequired && request.isRetailUse
                ? 'both Foreside Review and Retail Use are indicated'
                : request.isForesideReviewRequired
                ? 'Foreside Review is required'
                : 'Retail Use is indicated'}
              .
            </MessageBar>
          )}

          <FormItem>
            <FormLabel isRequired={trackingIdRequired}>Tracking ID</FormLabel>
            <FormValue>
              <DevExtremeTextBox
                name="trackingId"
                control={control}
                placeholder={trackingIdRequired ? 'Enter tracking ID (required)' : 'Enter tracking ID (optional)'}
                maxLength={100}
                onValueChanged={(value) => handleFieldChange('trackingId', value)}
              />
            </FormValue>
            <FormDescription>
              {trackingIdRequired
                ? 'Provide the tracking ID for this submission (required)'
                : 'Optionally provide a tracking ID for future reference'}
            </FormDescription>
            <FormError error={errors.trackingId?.message} />
          </FormItem>

          {(request.isForesideReviewRequired || request.isRetailUse) && (
            <div className="compliance-flags-summary">
              {request.isForesideReviewRequired && (
                <div className="flag-item">
                  <i className="ms-Icon ms-Icon--FlagSolid" />
                  <span>Foreside Review Required</span>
                </div>
              )}
              {request.isRetailUse && (
                <div className="flag-item">
                  <i className="ms-Icon ms-Icon--FlagSolid" />
                  <span>Retail Use</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CloseoutCard: React.FC = () => {
  const { request, closeRequest } = useRequestFormStore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    mode: 'onChange',
    defaultValues: {
      trackingId: request.trackingId || '',
    },
  });

  React.useEffect(() => {
    reset({
      trackingId: request.trackingId || '',
    });
  }, [request.id, reset]);

  const showCard = request.status === 'Closeout' || request.status === 'Completed';
  const isReadOnly = request.status === 'Completed';

  const trackingId = watch('trackingId');
  const trackingIdRequired = request.isForesideReviewRequired || request.isRetailUse;
  const canClose = trackingIdRequired ? trackingId?.trim().length > 0 : true;

  const handleCloseRequest = (): void => {
    if (!canClose) {
      setError('Please provide a tracking ID before closing this request');
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmClose = async (): Promise<void> => {
    setShowConfirmDialog(false);
    setIsSaving(true);
    setError(null);

    try {
      await closeRequest(trackingId);

      SPContext.logger.success('Request closed successfully', {
        requestId: request.id,
        trackingId: trackingId || 'N/A',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close request';
      setError(errorMessage);

      SPContext.logger.error('Failed to close request', err, {
        requestId: request.id,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelClose = (): void => {
    setShowConfirmDialog(false);
  };

  if (!showCard) {
    return null;
  }

  return (
    <Card id="closeout-card" variant="default" allowExpand={true}>
      <Header>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <span>Closeout</span>
          {isReadOnly && (
            <span className="status-badge completed">
              <i className="ms-Icon ms-Icon--CheckMark" />
              Completed
            </span>
          )}
        </Stack>
      </Header>

      <Content>
        {error && (
          <MessageBar
            messageBarType={MessageBarType.error}
            onDismiss={() => setError(null)}
            dismissButtonAriaLabel="Close"
          >
            {error}
          </MessageBar>
        )}

        {isReadOnly ? (
          <CloseoutSummary request={request as Request} />
        ) : (
          <CloseoutEdit
            control={control}
            errors={errors}
            setValue={setValue}
          />
        )}
      </Content>

      {!isReadOnly && (
        <Footer>
          <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
            <PrimaryButton
              text={isSaving ? 'Closing...' : 'Close Request'}
              iconProps={{ iconName: 'CompletedSolid' }}
              onClick={handleCloseRequest}
              disabled={isSaving || !canClose}
            />
          </Stack>
          {trackingIdRequired && !trackingId?.trim() && (
            <MessageBar messageBarType={MessageBarType.info} className="close-hint">
              Please provide a tracking ID to close this request
            </MessageBar>
          )}
        </Footer>
      )}

      <Dialog
        hidden={!showConfirmDialog}
        onDismiss={cancelClose}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Close Request',
          subText: 'Are you sure you want to close this request? This action will mark the request as completed and it cannot be reopened.',
        }}
        modalProps={{
          isBlocking: true,
        }}
      >
        <DialogFooter>
          <PrimaryButton onClick={confirmClose} text="Close Request" />
          <DefaultButton onClick={cancelClose} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </Card>
  );
};

export default CloseoutCard;
