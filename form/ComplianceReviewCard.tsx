import * as React from 'react';
import { useForm } from 'react-hook-form';
import { PrimaryButton, Stack, MessageBar, MessageBarType } from '@fluentui/react';
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
  DevExtremeSelectBox,
  DevExtremeSwitch,
} from '../../../components/spForm';
import AppendingNotes from '../../../components/AppendingNotes/AppendingNotes';
import { useRequestFormStore } from '../../../stores/requestFormStore';
import { SPContext } from '../../../utilities/context';
import type { Request } from '../../../types/Request';
import './ComplianceReviewCard.scss';

const ComplianceReviewCard: React.FC = () => {
  const { request, updateField, submitComplianceReview } = useRequestFormStore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = React.useState<string>('');

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
      complianceReviewStatus: request.complianceReviewStatus || 'Not Started',
      complianceReviewOutcome: request.complianceReviewOutcome,
      isForesideReviewRequired: request.isForesideReviewRequired || false,
      isRetailUse: request.isRetailUse || false,
    },
  });

  React.useEffect(() => {
    reset({
      complianceReviewStatus: request.complianceReviewStatus || 'Not Started',
      complianceReviewOutcome: request.complianceReviewOutcome,
      isForesideReviewRequired: request.isForesideReviewRequired || false,
      isRetailUse: request.isRetailUse || false,
    });
  }, [request.id, reset]);

  const complianceStatusOptions = React.useMemo(() => [
    'Not Started',
    'In Progress',
    'Waiting On Submitter',
    'Waiting On Compliance Reviewer',
    'Completed'
  ], []);

  const complianceOutcomeOptions = React.useMemo(() => [
    'Approved',
    'Approved With Comments',
    'Respond To Comments And Resubmit',
    'Not Approved'
  ], []);

  const showCard = 
    (request.reviewAudience === 'Compliance' || request.reviewAudience === 'Both') &&
    request.status === 'In Review';

  const handleFieldChange = React.useCallback((fieldName: string, value: any) => {
    setValue(fieldName, value);
    updateField(fieldName as keyof Request, value);
  }, [setValue, updateField]);

  const watchedStatus = watch('complianceReviewStatus');
  const watchedOutcome = watch('complianceReviewOutcome');

  const canSubmitReview = 
    watchedStatus === 'Completed' && 
    watchedOutcome && 
    reviewNotes.trim().length >= 10;

  const handleSubmitReview = async (): Promise<void> => {
    if (!canSubmitReview) {
      setError('Please complete status, outcome, and provide review notes (minimum 10 characters)');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await submitComplianceReview({
        status: watchedStatus,
        outcome: watchedOutcome,
        notes: reviewNotes,
        isForesideReviewRequired: watch('isForesideReviewRequired'),
        isRetailUse: watch('isRetailUse'),
      });

      SPContext.logger.success('Compliance review submitted successfully', {
        requestId: request.id,
        outcome: watchedOutcome,
      });

      setReviewNotes('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit compliance review';
      setError(errorMessage);

      SPContext.logger.error('Failed to submit compliance review', err, {
        requestId: request.id,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!showCard) {
    return null;
  }

  return (
    <Card id="compliance-review-card" variant="default" allowExpand={true}>
      <Header>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <span>Compliance Review</span>
          {watchedStatus && (
            <span className={`status-badge ${watchedStatus.toLowerCase().replace(/\s+/g, '-')}`}>
              {watchedStatus}
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

        <div className="compliance-review-edit">
          <div className="field-category">
            <div className="category-header">
              <i className="ms-Icon ms-Icon--ComplianceAudit category-icon" />
              <h3 className="category-title">Review Status</h3>
            </div>
            <div className="category-fields">
              <FormItem>
                <FormLabel isRequired>Compliance Review Status</FormLabel>
                <FormValue>
                  <DevExtremeSelectBox
                    name="complianceReviewStatus"
                    control={control}
                    items={complianceStatusOptions}
                    placeholder="Select review status"
                    onValueChanged={(value) => handleFieldChange('complianceReviewStatus', value)}
                  />
                </FormValue>
                <FormDescription>
                  Update the current status of your compliance review
                </FormDescription>
                <FormError error={errors.complianceReviewStatus?.message} />
              </FormItem>

              {watchedStatus === 'Completed' && (
                <FormItem>
                  <FormLabel isRequired>Review Outcome</FormLabel>
                  <FormValue>
                    <DevExtremeSelectBox
                      name="complianceReviewOutcome"
                      control={control}
                      items={complianceOutcomeOptions}
                      placeholder="Select review outcome"
                      onValueChanged={(value) => handleFieldChange('complianceReviewOutcome', value)}
                    />
                  </FormValue>
                  <FormDescription>
                    Select the final outcome of your compliance review
                  </FormDescription>
                  <FormError error={errors.complianceReviewOutcome?.message} />
                </FormItem>
              )}
            </div>
          </div>

          <div className="field-category">
            <div className="category-header">
              <i className="ms-Icon ms-Icon--FlagSolid category-icon" />
              <h3 className="category-title">Compliance Flags</h3>
            </div>
            <div className="category-fields">
              <FormItem>
                <FormLabel>Foreside Review Required</FormLabel>
                <FormValue>
                  <DevExtremeSwitch
                    name="isForesideReviewRequired"
                    control={control}
                    onText="Yes"
                    offText="No"
                    onValueChanged={(value) => handleFieldChange('isForesideReviewRequired', value)}
                  />
                </FormValue>
                <FormDescription>
                  Indicate if Foreside review is required for this submission
                </FormDescription>
              </FormItem>

              <FormItem>
                <FormLabel>Retail Use</FormLabel>
                <FormValue>
                  <DevExtremeSwitch
                    name="isRetailUse"
                    control={control}
                    onText="Yes"
                    offText="No"
                    onValueChanged={(value) => handleFieldChange('isRetailUse', value)}
                  />
                </FormValue>
                <FormDescription>
                  Indicate if this material is intended for retail use
                </FormDescription>
              </FormItem>

              {(watch('isForesideReviewRequired') || watch('isRetailUse')) && (
                <MessageBar messageBarType={MessageBarType.warning}>
                  <strong>Tracking ID Required:</strong> A tracking ID will be required during closeout when either Foreside Review or Retail Use is indicated.
                </MessageBar>
              )}
            </div>
          </div>

          <div className="field-category">
            <div className="category-header">
              <i className="ms-Icon ms-Icon--EditNote category-icon" />
              <h3 className="category-title">Review Notes</h3>
            </div>
            <div className="category-fields">
              <FormItem>
                <FormLabel isRequired>Compliance Review Notes</FormLabel>
                <FormValue>
                  <AppendingNotes
                    listId={SPContext.listId!}
                    itemId={request.id}
                    fieldName="ComplianceReviewNotes"
                    value={reviewNotes}
                    onValueChanged={setReviewNotes}
                    placeholder="Add your compliance review notes here (minimum 10 characters)..."
                    height={120}
                    maxLength={2000}
                  />
                </FormValue>
                <FormDescription>
                  Provide detailed notes about your compliance review findings
                </FormDescription>
                {reviewNotes.length > 0 && reviewNotes.length < 10 && (
                  <FormError error="Review notes must be at least 10 characters" />
                )}
              </FormItem>
            </div>
          </div>
        </div>
      </Content>

      <Footer>
        <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
          <PrimaryButton
            text={isSaving ? 'Submitting...' : 'Submit Review'}
            iconProps={{ iconName: 'CheckMark' }}
            onClick={handleSubmitReview}
            disabled={isSaving || !canSubmitReview}
          />
        </Stack>
        {!canSubmitReview && watchedStatus === 'Completed' && (
          <MessageBar messageBarType={MessageBarType.info} className="submit-hint">
            To submit review: Set status to "Completed", select an outcome, and provide review notes (minimum 10 characters)
          </MessageBar>
        )}
      </Footer>
    </Card>
  );
};

export default ComplianceReviewCard;
