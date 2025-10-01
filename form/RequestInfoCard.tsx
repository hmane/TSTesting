import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PrimaryButton, DefaultButton, Stack, MessageBar, MessageBarType } from '@fluentui/react';
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
  DevExtremeTextArea,
  DevExtremeSelectBox,
  DevExtremeDateBox,
  DevExtremeTagBox,
  PnPPeoplePicker,
} from '../../../components/spForm';
import { useRequestFormStore } from '../../../stores/requestFormStore';
import { useSubmissionItemsStore } from '../../../stores/submissionItemsStore';
import { requestInfoSchema } from '../../../schemas/requestInfoSchema';
import { SPContext } from '../../../utilities/context';
import type { Request, NewRequest } from '../../../types/Request';
import './RequestInfoCard.scss';

const RequestInfoSummary: React.FC<{ request: Request }> = ({ request }) => {
  const { submissionItems } = useSubmissionItemsStore();

  const getSubmissionItemTitle = (): string => {
    const item = submissionItems.find(si => si.id === request.submissionItemId);
    return item?.title || request.submissionItem || 'N/A';
  };

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getDistributionMethodsText = (): string => {
    if (!request.distributionMethod || request.distributionMethod.length === 0) return 'N/A';
    return request.distributionMethod.join(', ');
  };

  const getAdditionalPartyText = (): string => {
    if (!request.additionalParty || request.additionalParty.length === 0) return 'None';
    return request.additionalParty.map(p => p.title || p.text).join(', ');
  };

  return (
    <div className="request-info-summary">
      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--Info category-icon" />
          <h3 className="category-title">Basic Information</h3>
        </div>
        <div className="summary-grid">
          <div className="summary-field">
            <label>Request Title</label>
            <div className="summary-value">{request.requestTitle || 'N/A'}</div>
          </div>
          <div className="summary-field">
            <label>Purpose</label>
            <div className="summary-value purpose-text">{request.purpose || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--DocumentSet category-icon" />
          <h3 className="category-title">Submission Details</h3>
        </div>
        <div className="summary-grid">
          <div className="summary-field">
            <label>Submission Type</label>
            <div className="summary-value">{request.submissionType || 'N/A'}</div>
          </div>
          <div className="summary-field">
            <label>Submission Item</label>
            <div className="summary-value">{getSubmissionItemTitle()}</div>
          </div>
          <div className="summary-field full-width">
            <label>Distribution Method</label>
            <div className="summary-value">{getDistributionMethodsText()}</div>
          </div>
        </div>
      </div>

      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--DateTime category-icon" />
          <h3 className="category-title">Timeline</h3>
        </div>
        <div className="summary-grid">
          <div className="summary-field">
            <label>Target Return Date</label>
            <div className="summary-value">{formatDate(request.targetReturnDate)}</div>
          </div>
          {request.isRushRequest && (
            <>
              <div className="summary-field">
                <label>Rush Request</label>
                <div className="summary-value">
                  <span className="rush-badge">Yes</span>
                </div>
              </div>
              <div className="summary-field full-width">
                <label>Rush Rationale</label>
                <div className="summary-value">{request.rushRational || 'N/A'}</div>
              </div>
            </>
          )}
          {request.dateOfFirstUse && (
            <div className="summary-field">
              <label>Date of First Use</label>
              <div className="summary-value">{formatDate(request.dateOfFirstUse)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--ReviewSolid category-icon" />
          <h3 className="category-title">Review & Stakeholders</h3>
        </div>
        <div className="summary-grid">
          <div className="summary-field">
            <label>Review Audience</label>
            <div className="summary-value">{request.reviewAudience || 'N/A'}</div>
          </div>
          <div className="summary-field">
            <label>Additional Party</label>
            <div className="summary-value">{getAdditionalPartyText()}</div>
          </div>
          {request.priorSubmissionNotes && (
            <div className="summary-field full-width">
              <label>Prior Submission Notes</label>
              <div className="summary-value">{request.priorSubmissionNotes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RequestInfoEdit: React.FC<{
  control: any;
  errors: any;
  setValue: any;
}> = ({ control, errors, setValue }) => {
  const { submissionItems } = useSubmissionItemsStore();
  const { updateField } = useRequestFormStore();

  const submissionItemOptions = React.useMemo(() => {
    return submissionItems.map(item => ({
      id: item.id,
      title: item.title,
      turnAroundTimeInDays: item.turnAroundTimeInDays,
    }));
  }, [submissionItems]);

  const submissionTypeOptions = React.useMemo(() => ['New', 'Material Updates'], []);

  const distributionMethodOptions = React.useMemo(() => [
    'Dodge & Cox Website - U.S.',
    'Dodge & Cox Website - Non-U.S.',
    'Third Party Website',
    'Email / Mail',
    'Mobile App',
    'Display Card / Signage',
    'Hangout',
    'Live - Talking Points',
    'Social Media',
  ], []);

  const reviewAudienceOptions = React.useMemo(() => ['Legal', 'Compliance', 'Both'], []);

  const calculateBusinessDays = React.useCallback((startDate: Date, days: number): Date => {
    let businessDaysToAdd = days;
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (businessDaysToAdd > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDaysToAdd--;
      }
    }

    return currentDate;
  }, []);

  const calculateRushRequest = React.useCallback((
    submissionItemId: number,
    targetReturnDate: Date
  ): boolean => {
    if (!submissionItemId || !targetReturnDate) return false;

    const submissionItem = submissionItems.find(si => si.id === submissionItemId);
    if (!submissionItem) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expectedDate = calculateBusinessDays(today, submissionItem.turnAroundTimeInDays);

    const targetDate = new Date(targetReturnDate);
    targetDate.setHours(0, 0, 0, 0);

    return targetDate < expectedDate;
  }, [submissionItems, calculateBusinessDays]);

  const handleFieldChange = React.useCallback((fieldName: string, value: any) => {
    setValue(fieldName, value);
    updateField(fieldName as keyof Request, value);
  }, [setValue, updateField]);

  const handleSubmissionItemChange = React.useCallback((submissionItemId: number, targetReturnDate?: Date) => {
    handleFieldChange('submissionItemId', submissionItemId);

    const selectedItem = submissionItems.find(si => si.id === submissionItemId);
    if (selectedItem) {
      handleFieldChange('submissionItem', selectedItem.title);
    }

    if (targetReturnDate) {
      const isRush = calculateRushRequest(submissionItemId, targetReturnDate);
      handleFieldChange('isRushRequest', isRush);
    }
  }, [submissionItems, calculateRushRequest, handleFieldChange]);

  const handleTargetDateChange = React.useCallback((targetDate: Date, submissionItemId?: number) => {
    handleFieldChange('targetReturnDate', targetDate);

    if (submissionItemId) {
      const isRush = calculateRushRequest(submissionItemId, targetDate);
      handleFieldChange('isRushRequest', isRush);
    }
  }, [calculateRushRequest, handleFieldChange]);

  return (
    <div className="request-info-edit">
      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--Info category-icon" />
          <h3 className="category-title">Basic Information</h3>
        </div>
        <div className="category-fields">
          <FormItem>
            <FormLabel isRequired>Request Title</FormLabel>
            <FormValue>
              <DevExtremeTextBox
                name="requestTitle"
                control={control}
                placeholder="Enter a descriptive title for your request"
                maxLength={255}
                onValueChanged={(value) => handleFieldChange('requestTitle', value)}
              />
            </FormValue>
            <FormDescription>
              Provide a clear, concise title that describes your request (3-255 characters)
            </FormDescription>
            <FormError error={errors.requestTitle?.message} />
          </FormItem>

          <FormItem>
            <FormLabel isRequired>Purpose</FormLabel>
            <FormValue>
              <DevExtremeTextArea
                name="purpose"
                control={control}
                placeholder="Describe the purpose of this request in detail"
                height={120}
                maxLength={10000}
                onValueChanged={(value) => handleFieldChange('purpose', value)}
              />
            </FormValue>
            <FormDescription>
              Explain what you need reviewed and why (10-10,000 characters)
            </FormDescription>
            <FormError error={errors.purpose?.message} />
          </FormItem>
        </div>
      </div>

      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--DocumentSet category-icon" />
          <h3 className="category-title">Submission Details</h3>
        </div>
        <div className="category-fields">
          <FormItem>
            <FormLabel isRequired>Submission Type</FormLabel>
            <FormValue>
              <DevExtremeSelectBox
                name="submissionType"
                control={control}
                items={submissionTypeOptions}
                placeholder="Select submission type"
                onValueChanged={(value) => handleFieldChange('submissionType', value)}
              />
            </FormValue>
            <FormDescription>
              Is this a new submission or an update to existing material?
            </FormDescription>
            <FormError error={errors.submissionType?.message} />
          </FormItem>

          <FormItem>
            <FormLabel isRequired>Submission Item</FormLabel>
            <FormValue>
              <Controller
                name="submissionItemId"
                control={control}
                render={({ field }) => (
                  <DevExtremeSelectBox
                    name="submissionItemId"
                    control={control}
                    dataSource={submissionItemOptions}
                    displayExpr="title"
                    valueExpr="id"
                    placeholder="Select submission item type"
                    searchEnabled={true}
                    onValueChanged={(value) => {
                      const currentTargetDate = control._formValues.targetReturnDate;
                      handleSubmissionItemChange(value, currentTargetDate);
                    }}
                  />
                )}
              />
            </FormValue>
            <FormDescription>
              Select the type of document or material being submitted
            </FormDescription>
            <FormError error={errors.submissionItemId?.message} />
          </FormItem>

          <FormItem>
            <FormLabel>Distribution Method</FormLabel>
            <FormValue>
              <DevExtremeTagBox
                name="distributionMethod"
                control={control}
                items={distributionMethodOptions}
                placeholder="Select one or more distribution methods"
                searchEnabled={true}
                onValueChanged={(value) => handleFieldChange('distributionMethod', value)}
              />
            </FormValue>
            <FormDescription>
              How will this material be distributed? (Select all that apply)
            </FormDescription>
            <FormError error={errors.distributionMethod?.message} />
          </FormItem>
        </div>
      </div>

      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--DateTime category-icon" />
          <h3 className="category-title">Timeline</h3>
        </div>
        <div className="category-fields">
          <FormItem>
            <FormLabel isRequired>Target Return Date</FormLabel>
            <FormValue>
              <Controller
                name="targetReturnDate"
                control={control}
                render={({ field }) => (
                  <DevExtremeDateBox
                    name="targetReturnDate"
                    control={control}
                    type="date"
                    placeholder="Select target return date"
                    min={new Date()}
                    displayFormat="MM/dd/yyyy"
                    onValueChanged={(value) => {
                      const currentSubmissionItemId = control._formValues.submissionItemId;
                      handleTargetDateChange(value, currentSubmissionItemId);
                    }}
                  />
                )}
              />
            </FormValue>
            <FormDescription>
              When do you need this review completed?
            </FormDescription>
            <FormError error={errors.targetReturnDate?.message} />
          </FormItem>

          <Controller
            name="isRushRequest"
            control={control}
            render={({ field }) => (
              <>
                {field.value && (
                  <>
                    <MessageBar messageBarType={MessageBarType.warning}>
                      This is a rush request. Please provide justification below.
                    </MessageBar>
                    <FormItem>
                      <FormLabel isRequired>Rush Rationale</FormLabel>
                      <FormValue>
                        <DevExtremeTextArea
                          name="rushRational"
                          control={control}
                          placeholder="Explain why this is a rush request"
                          height={80}
                          maxLength={1000}
                          onValueChanged={(value) => handleFieldChange('rushRational', value)}
                        />
                      </FormValue>
                      <FormDescription>
                        Explain the business need for expedited review (minimum 10 characters)
                      </FormDescription>
                      <FormError error={errors.rushRational?.message} />
                    </FormItem>
                  </>
                )}
              </>
            )}
          />

          <FormItem>
            <FormLabel>Date of First Use</FormLabel>
            <FormValue>
              <DevExtremeDateBox
                name="dateOfFirstUse"
                control={control}
                type="date"
                placeholder="Select date of first use"
                min={new Date()}
                displayFormat="MM/dd/yyyy"
                onValueChanged={(value) => handleFieldChange('dateOfFirstUse', value)}
              />
            </FormValue>
            <FormDescription>
              When will this material first be used? (Optional)
            </FormDescription>
            <FormError error={errors.dateOfFirstUse?.message} />
          </FormItem>
        </div>
      </div>

      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--ReviewSolid category-icon" />
          <h3 className="category-title">Review & Stakeholders</h3>
        </div>
        <div className="category-fields">
          <FormItem>
            <FormLabel isRequired>Review Audience</FormLabel>
            <FormValue>
              <DevExtremeSelectBox
                name="reviewAudience"
                control={control}
                items={reviewAudienceOptions}
                placeholder="Select review audience"
                onValueChanged={(value) => handleFieldChange('reviewAudience', value)}
              />
            </FormValue>
            <FormDescription>
              Who should review this request?
            </FormDescription>
            <FormError error={errors.reviewAudience?.message} />
          </FormItem>

          <FormItem>
            <FormLabel>Additional Party</FormLabel>
            <FormValue>
              <PnPPeoplePicker
                name="additionalParty"
                control={control}
                context={SPContext.spContext}
                placeholder="Select stakeholders to notify"
                personSelectionLimit={10}
                onChange={(items) => handleFieldChange('additionalParty', items)}
              />
            </FormValue>
            <FormDescription>
              Select additional stakeholders who should be notified (Optional)
            </FormDescription>
            <FormError error={errors.additionalParty?.message} />
          </FormItem>

          <FormItem>
            <FormLabel>Prior Submission Notes</FormLabel>
            <FormValue>
              <DevExtremeTextArea
                name="priorSubmissionNotes"
                control={control}
                placeholder="Add notes about related prior submissions"
                height={80}
                onValueChanged={(value) => handleFieldChange('priorSubmissionNotes', value)}
              />
            </FormValue>
            <FormDescription>
              Provide context about any related prior submissions (Optional)
            </FormDescription>
            <FormError error={errors.priorSubmissionNotes?.message} />
          </FormItem>
        </div>
      </div>
    </div>
  );
};

const RequestInfoCard: React.FC = () => {
  const { request, isEditMode, setEditMode } = useRequestFormStore();
  const [isSaving, setIsSaving] = React.useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<Request | NewRequest>({
    mode: 'onChange',
    defaultValues: request,
    resolver: zodResolver(requestInfoSchema),
  });

  React.useEffect(() => {
    reset(request);
  }, [request.id, reset]);

  const canEdit = request.status === 'Draft' || !request.id;
  const showSummary = !canEdit && !isEditMode;

  const handleSave = async (data: Request | NewRequest): Promise<void> => {
    setIsSaving(true);
    try {
      SPContext.logger.success('Request information saved', {
        requestId: request.id,
        requestTitle: data.requestTitle,
      });

      setEditMode(false);
    } catch (error) {
      SPContext.logger.error('Failed to save request information', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (): void => {
    reset(request);
    setEditMode(false);
  };

  const handleEdit = (): void => {
    setEditMode(true);
  };

  return (
    <Card id="request-info-card" variant="default" allowExpand={true}>
      <Header>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <span>Request Information</span>
          {showSummary && (
            <DefaultButton
              text="Edit"
              iconProps={{ iconName: 'Edit' }}
              onClick={handleEdit}
            />
          )}
        </Stack>
      </Header>

      <Content>
        {showSummary ? (
          <RequestInfoSummary request={request as Request} />
        ) : (
          <form onSubmit={handleSubmit(handleSave)}>
            <RequestInfoEdit
              control={control}
              errors={errors}
              setValue={setValue}
            />
          </form>
        )}
      </Content>

      {(canEdit || isEditMode) && (
        <Footer>
          <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
            {isEditMode && (
              <DefaultButton
                text="Cancel"
                onClick={handleCancel}
                disabled={isSaving}
              />
            )}
            <PrimaryButton
              text={isSaving ? 'Saving...' : 'Save'}
              onClick={handleSubmit(handleSave)}
              disabled={isSaving || !isDirty}
            />
          </Stack>
        </Footer>
      )}
    </Card>
  );
};

export default RequestInfoCard;
