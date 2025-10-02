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
  DevExtremeDateBox,
  DevExtremeSelectBox,
  DevExtremeTextBox,
  DevExtremeCheckBox,
  PnPPeoplePicker,
} from '../../../components/spForm';
import ApprovalFileUpload from '../../ApprovalFileUpload/ApprovalFileUpload';
import { useRequestFormStore } from '../../../stores/requestFormStore';
import { saveAsDraftApprovalsSchema, submitApprovalsSchema } from '../../../schemas/approvalsSchema';
import { SPContext } from '../../../utilities/context';
import type { Request, NewRequest } from '../../../types/Request';
import type { IFileChangeState } from '../../ApprovalFileUpload/ApprovalFileUpload';
import './ApprovalsCard.scss';

type ApprovalType = 
  | 'portfolioManager'
  | 'researchAnalyst'
  | 'sme'
  | 'performance'
  | 'other';

interface IApprovalOption {
  key: ApprovalType;
  label: string;
  icon: string;
}

const approvalOptions: IApprovalOption[] = [
  { key: 'portfolioManager', label: 'Portfolio Manager Approval', icon: 'Financial' },
  { key: 'researchAnalyst', label: 'Research Analyst Approval', icon: 'DataManagementSettings' },
  { key: 'sme', label: 'Subject Matter Expert Approval', icon: 'WorkforceManagement' },
  { key: 'performance', label: 'Performance Approval', icon: 'BarChartVertical' },
  { key: 'other', label: 'Other Approval', icon: 'DocumentApproval' },
];

const ApprovalsSummary: React.FC<{ request: Request | NewRequest }> = ({ request }) => {
  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getPersonName = (person: any): string => {
    if (!person) return 'N/A';
    return person.title || person.text || 'N/A';
  };

  return (
    <div className="approvals-summary">
      {request.requiresCommunicationsApproval && (
        <div className="approval-summary-item">
          <div className="approval-summary-header">
            <i className="ms-Icon ms-Icon--MailCheck approval-icon" />
            <span className="approval-title">Communication Approval</span>
          </div>
          <div className="approval-summary-details">
            <div className="detail-row">
              <label>Approval Date:</label>
              <span>{formatDate(request.communicationsApprovalDate)}</span>
            </div>
            <div className="detail-row">
              <label>Approver:</label>
              <span>{getPersonName(request.communicationsApprover)}</span>
            </div>
          </div>
        </div>
      )}

      {request.hasPortfolioManagerApproval && (
        <div className="approval-summary-item">
          <div className="approval-summary-header">
            <i className="ms-Icon ms-Icon--Financial approval-icon" />
            <span className="approval-title">Portfolio Manager Approval</span>
          </div>
          <div className="approval-summary-details">
            <div className="detail-row">
              <label>Approval Date:</label>
              <span>{formatDate(request.portfolioManagerApprovalDate)}</span>
            </div>
            <div className="detail-row">
              <label>Approver:</label>
              <span>{getPersonName(request.portfolioManager)}</span>
            </div>
          </div>
        </div>
      )}

      {request.hasResearchAnalystApproval && (
        <div className="approval-summary-item">
          <div className="approval-summary-header">
            <i className="ms-Icon ms-Icon--DataManagementSettings approval-icon" />
            <span className="approval-title">Research Analyst Approval</span>
          </div>
          <div className="approval-summary-details">
            <div className="detail-row">
              <label>Approval Date:</label>
              <span>{formatDate(request.researchAnalystApprovalDate)}</span>
            </div>
            <div className="detail-row">
              <label>Approver:</label>
              <span>{getPersonName(request.researchAnalyst)}</span>
            </div>
          </div>
        </div>
      )}

      {request.hasSMEApproval && (
        <div className="approval-summary-item">
          <div className="approval-summary-header">
            <i className="ms-Icon ms-Icon--WorkforceManagement approval-icon" />
            <span className="approval-title">Subject Matter Expert Approval</span>
          </div>
          <div className="approval-summary-details">
            <div className="detail-row">
              <label>Approval Date:</label>
              <span>{formatDate(request.smeApprovalDate)}</span>
            </div>
            <div className="detail-row">
              <label>Approver:</label>
              <span>{getPersonName(request.subjectMatterExpert)}</span>
            </div>
          </div>
        </div>
      )}

      {request.hasPerformanceApproval && (
        <div className="approval-summary-item">
          <div className="approval-summary-header">
            <i className="ms-Icon ms-Icon--BarChartVertical approval-icon" />
            <span className="approval-title">Performance Approval</span>
          </div>
          <div className="approval-summary-details">
            <div className="detail-row">
              <label>Approval Date:</label>
              <span>{formatDate(request.performanceApprovalDate)}</span>
            </div>
            <div className="detail-row">
              <label>Approver:</label>
              <span>{getPersonName(request.performanceApprover)}</span>
            </div>
          </div>
        </div>
      )}

      {request.hasOtherApproval && (
        <div className="approval-summary-item">
          <div className="approval-summary-header">
            <i className="ms-Icon ms-Icon--DocumentApproval approval-icon" />
            <span className="approval-title">{request.otherApprovalTitle || 'Other Approval'}</span>
          </div>
          <div className="approval-summary-details">
            <div className="detail-row">
              <label>Approval Date:</label>
              <span>{formatDate(request.otherApprovalDate)}</span>
            </div>
            <div className="detail-row">
              <label>Approver:</label>
              <span>{getPersonName(request.otherApproval)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface IApprovalsEditProps {
  control: any;
  errors: any;
  setValue: any;
  request: Request | NewRequest;
  activeApprovals: ApprovalType[];
  onAddApproval: (type: ApprovalType) => void;
  onRemoveApproval: (type: ApprovalType) => void;
}

const ApprovalsEdit: React.FC<IApprovalsEditProps> = ({
  control,
  errors,
  setValue,
  request,
  activeApprovals,
  onAddApproval,
  onRemoveApproval,
}) => {
  const { updateField } = useRequestFormStore();
  const [fileStates, setFileStates] = React.useState<Map<string, IFileChangeState>>(new Map());

  const availableApprovals = React.useMemo(() => {
    return approvalOptions.filter(option => !activeApprovals.includes(option.key));
  }, [activeApprovals]);

  const handleFieldChange = React.useCallback((fieldName: string, value: any) => {
    setValue(fieldName, value);
    updateField(fieldName as keyof (Request | NewRequest), value);
  }, [setValue, updateField]);

  const handleAddApproval = (approvalType: ApprovalType | null): void => {
    if (approvalType) {
      onAddApproval(approvalType);

      switch (approvalType) {
        case 'portfolioManager':
          handleFieldChange('hasPortfolioManagerApproval', true);
          break;
        case 'researchAnalyst':
          handleFieldChange('hasResearchAnalystApproval', true);
          break;
        case 'sme':
          handleFieldChange('hasSMEApproval', true);
          break;
        case 'performance':
          handleFieldChange('hasPerformanceApproval', true);
          break;
        case 'other':
          handleFieldChange('hasOtherApproval', true);
          break;
      }
    }
  };

  const handleRemoveApproval = (approvalType: ApprovalType): void => {
    onRemoveApproval(approvalType);

    switch (approvalType) {
      case 'portfolioManager':
        handleFieldChange('hasPortfolioManagerApproval', false);
        handleFieldChange('portfolioManagerApprovalDate', null);
        handleFieldChange('portfolioManager', null);
        break;
      case 'researchAnalyst':
        handleFieldChange('hasResearchAnalystApproval', false);
        handleFieldChange('researchAnalystApprovalDate', null);
        handleFieldChange('researchAnalyst', null);
        break;
      case 'sme':
        handleFieldChange('hasSMEApproval', false);
        handleFieldChange('smeApprovalDate', null);
        handleFieldChange('subjectMatterExpert', null);
        break;
      case 'performance':
        handleFieldChange('hasPerformanceApproval', false);
        handleFieldChange('performanceApprovalDate', null);
        handleFieldChange('performanceApprover', null);
        break;
      case 'other':
        handleFieldChange('hasOtherApproval', false);
        handleFieldChange('otherApprovalTitle', null);
        handleFieldChange('otherApprovalDate', null);
        handleFieldChange('otherApproval', null);
        break;
    }

    setFileStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(approvalType);
      return newMap;
    });
  };

  const handleFileChange = (approvalType: string, state: IFileChangeState): void => {
    setFileStates(prev => new Map(prev.set(approvalType, state)));
  };

  return (
    <div className="approvals-edit">
      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--Completed category-icon" />
          <h3 className="category-title">Required Approvals</h3>
        </div>
        <div className="category-fields">
          <MessageBar messageBarType={MessageBarType.info}>
            At least one approval is required before submitting your request.
          </MessageBar>

          <FormItem>
            <FormLabel>Requires Communication Approval?</FormLabel>
            <FormValue>
              <DevExtremeCheckBox
                name="requiresCommunicationsApproval"
                control={control}
                text="Yes, communication approval is required"
                onValueChanged={(value) => handleFieldChange('requiresCommunicationsApproval', value)}
              />
            </FormValue>
            <FormDescription>
              Check this if your submission requires communication department approval
            </FormDescription>
            <FormError error={errors.requiresCommunicationsApproval?.message} />
          </FormItem>

          <Controller
            name="requiresCommunicationsApproval"
            control={control}
            render={({ field }) => (
              <>
                {field.value && (
                  <div className="approval-section">
                    <div className="approval-header">
                      <span className="approval-title">
                        <i className="ms-Icon ms-Icon--MailCheck" />
                        Communication Approval
                      </span>
                    </div>
                    <div className="approval-fields">
                      <FormItem>
                        <FormLabel isRequired>Approval Date</FormLabel>
                        <FormValue>
                          <DevExtremeDateBox
                            name="communicationsApprovalDate"
                            control={control}
                            type="date"
                            placeholder="Select approval date"
                            max={new Date()}
                            displayFormat="MM/dd/yyyy"
                            onValueChanged={(value) => handleFieldChange('communicationsApprovalDate', value)}
                          />
                        </FormValue>
                        <FormError error={errors.communicationsApprovalDate?.message} />
                      </FormItem>

                      <FormItem>
                        <FormLabel isRequired>Approver</FormLabel>
                        <FormValue>
                          <PnPPeoplePicker
                            name="communicationsApprover"
                            control={control}
                            context={SPContext.spContext}
                            placeholder="Select approver"
                            personSelectionLimit={1}
                            onChange={(items) => handleFieldChange('communicationsApprover', items[0])}
                          />
                        </FormValue>
                        <FormError error={errors.communicationsApprover?.message} />
                      </FormItem>

                      <FormItem>
                        <FormLabel isRequired>Approval Documents</FormLabel>
                        <FormValue>
                          <ApprovalFileUpload
                            documentType="Communication Approval"
                            onFilesChange={(state) => handleFileChange('communication', state)}
                            isNewRequest={!request.id}
                            siteUrl={SPContext.webAbsoluteUrl}
                            listId={SPContext.listId!}
                            itemId={request.id}
                            required={true}
                          />
                        </FormValue>
                        <FormDescription>
                          Upload proof of approval (email, signed document, etc.)
                        </FormDescription>
                      </FormItem>
                    </div>
                  </div>
                )}
              </>
            )}
          />
        </div>
      </div>

      <div className="field-category">
        <div className="category-header">
          <i className="ms-Icon ms-Icon--AddTo category-icon" />
          <h3 className="category-title">Additional Approvals</h3>
        </div>
        <div className="category-fields">
          {availableApprovals.length > 0 && (
            <FormItem>
              <FormLabel>Add Another Approval</FormLabel>
              <FormValue>
                <DevExtremeSelectBox
                  name="addApprovalSelect"
                  control={control}
                  dataSource={availableApprovals}
                  displayExpr="label"
                  valueExpr="key"
                  placeholder="Select approval type to add..."
                  searchEnabled={true}
                  onValueChanged={(value: ApprovalType) => {
                    if (value) {
                      handleAddApproval(value);
                      setValue('addApprovalSelect', null);
                    }
                  }}
                />
              </FormValue>
              <FormDescription>
                Add optional approvals as needed for your submission
              </FormDescription>
            </FormItem>
          )}

          {activeApprovals.includes('portfolioManager') && (
            <div className="approval-section">
              <div className="approval-header">
                <span className="approval-title">
                  <i className="ms-Icon ms-Icon--Financial" />
                  Portfolio Manager Approval
                </span>
                <button
                  type="button"
                  className="remove-approval-btn"
                  onClick={() => handleRemoveApproval('portfolioManager')}
                >
                  <i className="ms-Icon ms-Icon--Delete" />
                  Remove
                </button>
              </div>
              <div className="approval-fields">
                <FormItem>
                  <FormLabel isRequired>Approval Date</FormLabel>
                  <FormValue>
                    <DevExtremeDateBox
                      name="portfolioManagerApprovalDate"
                      control={control}
                      type="date"
                      placeholder="Select approval date"
                      max={new Date()}
                      displayFormat="MM/dd/yyyy"
                      onValueChanged={(value) => handleFieldChange('portfolioManagerApprovalDate', value)}
                    />
                  </FormValue>
                  <FormError error={errors.portfolioManagerApprovalDate?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approver</FormLabel>
                  <FormValue>
                    <PnPPeoplePicker
                      name="portfolioManager"
                      control={control}
                      context={SPContext.spContext}
                      placeholder="Select approver"
                      personSelectionLimit={1}
                      onChange={(items) => handleFieldChange('portfolioManager', items[0])}
                    />
                  </FormValue>
                  <FormError error={errors.portfolioManager?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approval Documents</FormLabel>
                  <FormValue>
                    <ApprovalFileUpload
                      documentType="Portfolio Manager Approval"
                      onFilesChange={(state) => handleFileChange('portfolioManager', state)}
                      isNewRequest={!request.id}
                      siteUrl={SPContext.webAbsoluteUrl}
                      listId={SPContext.listId!}
                      itemId={request.id}
                      required={true}
                    />
                  </FormValue>
                </FormItem>
              </div>
            </div>
          )}

          {activeApprovals.includes('researchAnalyst') && (
            <div className="approval-section">
              <div className="approval-header">
                <span className="approval-title">
                  <i className="ms-Icon ms-Icon--DataManagementSettings" />
                  Research Analyst Approval
                </span>
                <button
                  type="button"
                  className="remove-approval-btn"
                  onClick={() => handleRemoveApproval('researchAnalyst')}
                >
                  <i className="ms-Icon ms-Icon--Delete" />
                  Remove
                </button>
              </div>
              <div className="approval-fields">
                <FormItem>
                  <FormLabel isRequired>Approval Date</FormLabel>
                  <FormValue>
                    <DevExtremeDateBox
                      name="researchAnalystApprovalDate"
                      control={control}
                      type="date"
                      placeholder="Select approval date"
                      max={new Date()}
                      displayFormat="MM/dd/yyyy"
                      onValueChanged={(value) => handleFieldChange('researchAnalystApprovalDate', value)}
                    />
                  </FormValue>
                  <FormError error={errors.researchAnalystApprovalDate?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approver</FormLabel>
                  <FormValue>
                    <PnPPeoplePicker
                      name="researchAnalyst"
                      control={control}
                      context={SPContext.spContext}
                      placeholder="Select approver"
                      personSelectionLimit={1}
                      onChange={(items) => handleFieldChange('researchAnalyst', items[0])}
                    />
                  </FormValue>
                  <FormError error={errors.researchAnalyst?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approval Documents</FormLabel>
                  <FormValue>
                    <ApprovalFileUpload
                      documentType="Research Analyst Approval"
                      onFilesChange={(state) => handleFileChange('researchAnalyst', state)}
                      isNewRequest={!request.id}
                      siteUrl={SPContext.webAbsoluteUrl}
                      listId={SPContext.listId!}
                      itemId={request.id}
                      required={true}
                    />
                  </FormValue>
                </FormItem>
              </div>
            </div>
          )}

          {activeApprovals.includes('sme') && (
            <div className="approval-section">
              <div className="approval-header">
                <span className="approval-title">
                  <i className="ms-Icon ms-Icon--WorkforceManagement" />
                  Subject Matter Expert Approval
                </span>
                <button
                  type="button"
                  className="remove-approval-btn"
                  onClick={() => handleRemoveApproval('sme')}
                >
                  <i className="ms-Icon ms-Icon--Delete" />
                  Remove
                </button>
              </div>
              <div className="approval-fields">
                <FormItem>
                  <FormLabel isRequired>Approval Date</FormLabel>
                  <FormValue>
                    <DevExtremeDateBox
                      name="smeApprovalDate"
                      control={control}
                      type="date"
                      placeholder="Select approval date"
                      max={new Date()}
                      displayFormat="MM/dd/yyyy"
                      onValueChanged={(value) => handleFieldChange('smeApprovalDate', value)}
                    />
                  </FormValue>
                  <FormError error={errors.smeApprovalDate?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approver</FormLabel>
                  <FormValue>
                    <PnPPeoplePicker
                      name="subjectMatterExpert"
                      control={control}
                      context={SPContext.spContext}
                      placeholder="Select approver"
                      personSelectionLimit={1}
                      onChange={(items) => handleFieldChange('subjectMatterExpert', items[0])}
                    />
                  </FormValue>
                  <FormError error={errors.subjectMatterExpert?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approval Documents</FormLabel>
                  <FormValue>
                    <ApprovalFileUpload
                      documentType="Subject Matter Expert Approval"
                      onFilesChange={(state) => handleFileChange('sme', state)}
                      isNewRequest={!request.id}
                      siteUrl={SPContext.webAbsoluteUrl}
                      listId={SPContext.listId!}
                      itemId={request.id}
                      required={true}
                    />
                  </FormValue>
                </FormItem>
              </div>
            </div>
          )}

          {activeApprovals.includes('performance') && (
            <div className="approval-section">
              <div className="approval-header">
                <span className="approval-title">
                  <i className="ms-Icon ms-Icon--BarChartVertical" />
                  Performance Approval
                </span>
                <button
                  type="button"
                  className="remove-approval-btn"
                  onClick={() => handleRemoveApproval('performance')}
                >
                  <i className="ms-Icon ms-Icon--Delete" />
                  Remove
                </button>
              </div>
              <div className="approval-fields">
                <FormItem>
                  <FormLabel isRequired>Approval Date</FormLabel>
                  <FormValue>
                    <DevExtremeDateBox
                      name="performanceApprovalDate"
                      control={control}
                      type="date"
                      placeholder="Select approval date"
                      max={new Date()}
                      displayFormat="MM/dd/yyyy"
                      onValueChanged={(value) => handleFieldChange('performanceApprovalDate', value)}
                    />
                  </FormValue>
                  <FormError error={errors.performanceApprovalDate?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approver</FormLabel>
                  <FormValue>
                    <PnPPeoplePicker
                      name="performanceApprover"
                      control={control}
                      context={SPContext.spContext}
                      placeholder="Select approver"
                      personSelectionLimit={1}
                      onChange={(items) => handleFieldChange('performanceApprover', items[0])}
                    />
                  </FormValue>
                  <FormError error={errors.performanceApprover?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approval Documents</FormLabel>
                  <FormValue>
                    <ApprovalFileUpload
                      documentType="Performance Approval"
                      onFilesChange={(state) => handleFileChange('performance', state)}
                      isNewRequest={!request.id}
                      siteUrl={SPContext.webAbsoluteUrl}
                      listId={SPContext.listId!}
                      itemId={request.id}
                      required={true}
                    />
                  </FormValue>
                </FormItem>
              </div>
            </div>
          )}

          {activeApprovals.includes('other') && (
            <div className="approval-section">
              <div className="approval-header">
                <span className="approval-title">
                  <i className="ms-Icon ms-Icon--DocumentApproval" />
                  Other Approval
                </span>
                <button
                  type="button"
                  className="remove-approval-btn"
                  onClick={() => handleRemoveApproval('other')}
                >
                  <i className="ms-Icon ms-Icon--Delete" />
                  Remove
                </button>
              </div>
              <div className="approval-fields">
                <FormItem>
                  <FormLabel isRequired>Approval Title</FormLabel>
                  <FormValue>
                    <DevExtremeTextBox
                      name="otherApprovalTitle"
                      control={control}
                      placeholder="Enter approval type"
                      maxLength={255}
                      onValueChanged={(value) => handleFieldChange('otherApprovalTitle', value)}
                    />
                  </FormValue>
                  <FormDescription>
                    Specify what type of approval this is
                  </FormDescription>
                  <FormError error={errors.otherApprovalTitle?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approval Date</FormLabel>
                  <FormValue>
                    <DevExtremeDateBox
                      name="otherApprovalDate"
                      control={control}
                      type="date"
                      placeholder="Select approval date"
                      max={new Date()}
                      displayFormat="MM/dd/yyyy"
                      onValueChanged={(value) => handleFieldChange('otherApprovalDate', value)}
                    />
                  </FormValue>
                  <FormError error={errors.otherApprovalDate?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approver</FormLabel>
                  <FormValue>
                    <PnPPeoplePicker
                      name="otherApproval"
                      control={control}
                      context={SPContext.spContext}
                      placeholder="Select approver"
                      personSelectionLimit={1}
                      onChange={(items) => handleFieldChange('otherApproval', items[0])}
                    />
                  </FormValue>
                  <FormError error={errors.otherApproval?.message} />
                </FormItem>

                <FormItem>
                  <FormLabel isRequired>Approval Documents</FormLabel>
                  <FormValue>
                    <ApprovalFileUpload
                      documentType="Other Approval"
                      onFilesChange={(state) => handleFileChange('other', state)}
                      isNewRequest={!request.id}
                      siteUrl={SPContext.webAbsoluteUrl}
                      listId={SPContext.listId!}
                      itemId={request.id}
                      required={true}
                    />
                  </FormValue>
                </FormItem>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ApprovalsCard: React.FC = () => {
  const { request, updateField } = useRequestFormStore();
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeApprovals, setActiveApprovals] = React.useState<ApprovalType[]>([]);

  // Initialize active approvals from request
  React.useEffect(() => {
    if (request) {
      const approvals: ApprovalType[] = [];
      if (request.hasPortfolioManagerApproval) approvals.push('portfolioManager');
      if (request.hasResearchAnalystApproval) approvals.push('researchAnalyst');
      if (request.hasSMEApproval) approvals.push('sme');
      if (request.hasPerformanceApproval) approvals.push('performance');
      if (request.hasOtherApproval) approvals.push('other');
      setActiveApprovals(approvals);
    }
  }, [request?.id]);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<Request | NewRequest>({
    mode: 'onChange',
    defaultValues: request || {},
    resolver: zodResolver(saveAsDraftApprovalsSchema),
  });

  React.useEffect(() => {
    if (request) {
      reset(request);
    }
  }, [request?.id, reset]);

  const canEdit = request?.status === 'Draft' || !request?.id;
  const showSummary = !canEdit && !isEditMode;

  const handleAddApproval = (type: ApprovalType): void => {
    setActiveApprovals(prev => [...prev, type]);
  };

  const handleRemoveApproval = (type: ApprovalType): void => {
    setActiveApprovals(prev => prev.filter(a => a !== type));
  };

  const handleSave = async (data: Request | NewRequest): Promise<void> => {
    setIsSaving(true);
    try {
      SPContext.logger.success('Approvals saved', {
        requestId: request?.id,
      });

      setIsEditMode(false);
    } catch (error) {
      SPContext.logger.error('Failed to save approvals', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (): void => {
    if (request) {
      reset(request);
    }
    setIsEditMode(false);
  };

  const handleEdit = (): void => {
    setIsEditMode(true);
  };

  if (!request) {
    return null;
  }

  return (
    <Card id="approvals-card" variant="default" allowExpand={true}>
      <Header>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <span>Approvals</span>
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
          <ApprovalsSummary request={request} />
        ) : (
          <form onSubmit={handleSubmit(handleSave)}>
            <ApprovalsEdit
              control={control}
              errors={errors}
              setValue={setValue}
              request={request}
              activeApprovals={activeApprovals}
              onAddApproval={handleAddApproval}
              onRemoveApproval={handleRemoveApproval}
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

export default ApprovalsCard;
