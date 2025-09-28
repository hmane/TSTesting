// components/RequestForm/RequestContainer.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Stack,
  MessageBar,
  MessageBarType,
  Text,
  Icon,
  IconButton,
  Spinner,
  SpinnerSize,
  Panel,
  PanelType
} from '@fluentui/react';
import { useForm } from 'react-hook-form';
import { debounce, isEqual } from '@microsoft/sp-lodash-subset';
import { Request, NewRequest, RequestStatus } from '../../models/Request';
import { useRequestForm, useFormValidation } from '../../hooks';
import { WorkflowStepper, StepData } from '../WorkflowStepper';
import { ManageAccessComponent } from '../ManageAccess';
import { RequestTypeSelector } from './RequestTypeSelector';
import { RequestInfo } from './RequestInfo';

interface RequestContainerProps {
  itemId?: number;
  onSaveSuccess?: (savedRequest: Request) => void;
  onSubmitSuccess?: (submittedRequest: Request) => void;
  onCancel?: () => void;
}

export const RequestContainer: React.FC<RequestContainerProps> = ({
  itemId,
  onSaveSuccess,
  onSubmitSuccess,
  onCancel
}) => {
  // Hooks must be called before any early returns
  const requestForm = useRequestForm();
  const formValidation = useFormValidation();
  
  // State
  const [commentsExpanded, setCommentsExpanded] = useState(false); // Collapsed by default
  const [selectedRequestType, setSelectedRequestType] = useState<string | null>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // React Hook Form setup with proper default values
  const form = useForm<Request | NewRequest>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: useMemo(() => ({
      RequestTitle: '',
      Department: '',
      RequestType: 'Communication',
      Purpose: '',
      SubmissionType: 'New',
      SubmissionItem: '',
      DistributionMethod: [],
      TargetReturnDate: null,
      ReviewAudience: 'Legal',
      AdditionalParty: [],
      PriorSubmissionNotes: '',
      DateOfFirstUse: null,
      RushRational: '',
    }), [])
  });

  const { control, handleSubmit, reset, formState: { errors, isDirty }, getValues } = form;

  // Debounced auto-save function
  const debouncedAutoSave = useMemo(
    () => debounce((formData: Partial<Request | NewRequest>) => {
      if (isDirty && !requestForm.isSaving && isFormInitialized) {
        console.log('Auto-saving form data...');
        requestForm.updateFields(formData);
      }
    }, 2000), // 2 second debounce
    [requestForm, isDirty, isFormInitialized]
  );

  // Debounced comparison for form changes
  const debouncedFormCheck = useMemo(
    () => debounce((newFormData: any, currentStoreData: any) => {
      if (!isEqual(newFormData, currentStoreData)) {
        debouncedAutoSave(newFormData);
      }
    }, 1000),
    [debouncedAutoSave]
  );

  // Initialize form on mount
  useEffect(() => {
    let isMounted = true;

    const initializeForm = async () => {
      try {
        if (itemId) {
          // Existing request - load directly
          await requestForm.initializeForm(itemId);
          setSelectedRequestType('communication'); // Will be updated from loaded data
        }
        
        if (isMounted) {
          setIsFormInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize form:', error);
      }
    };

    initializeForm();

    return () => {
      isMounted = false;
      debouncedAutoSave.cancel();
    };
  }, [itemId, requestForm, debouncedAutoSave]);

  // Sync store data TO form (one direction only)
  useEffect(() => {
    if (requestForm.currentRequest && requestForm.isInitialized && isFormInitialized) {
      console.log('Syncing store data to form...');
      
      // Use isEqual to check if data actually changed
      const currentFormData = getValues();
      if (!isEqual(currentFormData, requestForm.currentRequest)) {
        reset(requestForm.currentRequest);
      }
    }
  }, [requestForm.currentRequest, requestForm.isInitialized, isFormInitialized, reset, getValues]);

  // Handle request type selection for new requests
  const handleRequestTypeSelected = useCallback(async (requestType: string) => {
    setSelectedRequestType(requestType);
    
    try {
      // Initialize new request with selected type
      await requestForm.initializeForm();
      
      // Set the request type in the form
      const requestTypeValue = requestType === 'communication' ? 'Communication' : requestType;
      
      // Update both form and store
      reset(prev => ({
        ...prev,
        RequestType: requestTypeValue
      }));
      
      requestForm.updateField('RequestType', requestTypeValue);
      setIsFormInitialized(true);
    } catch (error) {
      console.error('Failed to initialize new request:', error);
    }
  }, [requestForm, reset]);

  // Manual save handlers
  const handleSaveDraft = useCallback(async () => {
    const formData = getValues();
    requestForm.updateFields(formData);
    const success = await requestForm.saveAsDraft();
    
    if (success && onSaveSuccess) {
      onSaveSuccess(requestForm.currentRequest as Request);
    }
  }, [getValues, requestForm, onSaveSuccess]);

  const handleSubmitRequest = useCallback(async (data: Request | NewRequest) => {
    requestForm.updateFields(data);
    const success = await requestForm.submitRequest();
    
    if (success && onSubmitSuccess) {
      onSubmitSuccess(requestForm.currentRequest as Request);
    }
  }, [requestForm, onSubmitSuccess]);

  // Auto-save on form changes (debounced with isEqual check)
  const formValues = form.watch();
  useEffect(() => {
    if (isFormInitialized && isDirty && formValues && requestForm.currentRequest) {
      debouncedFormCheck(formValues, requestForm.currentRequest);
    }
    
    return () => {
      debouncedFormCheck.cancel();
    };
  }, [formValues, isDirty, isFormInitialized, requestForm.currentRequest, debouncedFormCheck]);

  // Workflow steps generator
  const workflowSteps = useMemo((): StepData[] => {
    const currentStatus = requestForm.getFieldValue('Status') || RequestStatus.Draft;
    
    const statusOrder = ['Draft', 'Legal Intake', 'Assign Attorney', 'In Review', 'Closeout', 'Completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    return [
      { 
        id: 'draft', 
        title: 'Draft', 
        status: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'current' : 'pending'
      },
      { 
        id: 'legal-intake', 
        title: 'Legal Intake', 
        status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'current' : 'pending'
      },
      { 
        id: 'assign-attorney', 
        title: 'Assign Attorney', 
        status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'current' : 'pending'
      },
      { 
        id: 'in-review', 
        title: 'In Review', 
        status: currentIndex > 3 ? 'completed' : currentIndex === 3 ? 'current' : 'pending'
      },
      { 
        id: 'closeout', 
        title: 'Closeout', 
        status: currentIndex > 4 ? 'completed' : currentIndex === 4 ? 'current' : 'pending'
      },
      { 
        id: 'completed', 
        title: 'Completed', 
        status: currentIndex === 5 ? 'completed' : 'pending'
      }
    ];
  }, [requestForm]);

  // Status banner component
  const StatusBanner = useMemo(() => {
    if (!requestForm.currentRequest || !('Status' in requestForm.currentRequest)) {
      return null;
    }
    
    const request = requestForm.currentRequest as Request;
    
    if (request.Status === RequestStatus.Cancelled) {
      return (
        <MessageBar messageBarType={MessageBarType.error} isMultiline>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <Icon iconName="StatusErrorFull" />
            <Stack tokens={{ childrenGap: 4 }}>
              <Text variant="medium" style={{ fontWeight: 600 }}>
                Request Cancelled
              </Text>
              <Text variant="small">
                Cancelled by {request.CancelledBy} on {new Date(request.CancelledOn).toLocaleDateString()}
              </Text>
              {request.CancelReason && (
                <Text variant="small">Reason: {request.CancelReason}</Text>
              )}
            </Stack>
          </Stack>
        </MessageBar>
      );
    }
    
    if (request.Status === RequestStatus.OnHold) {
      return (
        <MessageBar messageBarType={MessageBarType.warning} isMultiline>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <Icon iconName="StatusCircleBlock2" />
            <Stack tokens={{ childrenGap: 4 }}>
              <Text variant="medium" style={{ fontWeight: 600 }}>
                Request On Hold
              </Text>
              <Text variant="small">
                Put on hold by {request.OnHoldBy} on {new Date(request.OnHoldOn).toLocaleDateString()}
              </Text>
              {request.OnHoldReason && (
                <Text variant="small">Reason: {request.OnHoldReason}</Text>
              )}
            </Stack>
            {requestForm.canPerformAction('showResumeRequest') && (
              <IconButton
                iconProps={{ iconName: 'Play' }}
                title="Resume Request"
                onClick={() => requestForm.resumeRequest()}
                disabled={requestForm.isSaving}
              />
            )}
          </Stack>
        </MessageBar>
      );
    }

    return null;
  }, [requestForm]);

  // Permission change handler
  const handlePermissionChanged = useCallback(async (
    operation: 'add' | 'remove',
    principals: any[]
  ): Promise<boolean> => {
    try {
      // TODO: Implement permission change logic
      console.log('Permission change:', operation, principals);
      return true;
    } catch (error) {
      console.error('Permission change failed:', error);
      return false;
    }
  }, []);

  // Toggle comments handler - proper panel behavior
  const handleToggleComments = useCallback(() => {
    setCommentsExpanded(prev => !prev);
  }, []);

  // Show request type selector for new requests
  if (!itemId && !selectedRequestType) {
    return (
      <RequestTypeSelector
        onRequestTypeSelected={handleRequestTypeSelected}
        onCancel={onCancel}
      />
    );
  }

  // Loading state
  if (requestForm.isLoading || !isFormInitialized) {
    return (
      <Stack horizontalAlign="center" verticalAlign="center" style={{ height: '400px' }}>
        <Spinner size={SpinnerSize.large} label="Loading request..." />
      </Stack>
    );
  }

  // Error state
  if (requestForm.error) {
    return (
      <Stack tokens={{ childrenGap: 16 }} style={{ padding: '20px' }}>
        <MessageBar messageBarType={MessageBarType.error} isMultiline>
          <Text variant="medium" style={{ fontWeight: 600 }}>
            Error Loading Request
          </Text>
          <Text variant="small">{requestForm.error}</Text>
        </MessageBar>
        <IconButton
          iconProps={{ iconName: 'Refresh' }}
          text="Try Again"
          onClick={() => requestForm.clearErrors()}
        />
      </Stack>
    );
  }

  // Get display values
  const requestTitle = requestForm.getFieldValue('RequestTitle') || 'New Request';
  const requestId = requestForm.getFieldValue('Title');
  const requestType = requestForm.getFieldValue('RequestType') || 'Communication';
  const isSubmitted = requestForm.getFieldValue('Status') !== RequestStatus.Draft;

  return (
    <Stack tokens={{ childrenGap: 0 }} style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Status Banner */}
      {StatusBanner}

      {/* Header Section */}
      <Stack 
        tokens={{ childrenGap: 16 }} 
        style={{ 
          padding: '20px', 
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          marginBottom: '20px'
        }}
      >
        {/* Workflow Progress */}
        <WorkflowStepper
          steps={workflowSteps}
          mode="progress"
          minStepWidth={120}
        />
        
        {/* Request Info Bar */}
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Stack>
            <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
              <Text variant="xLarge" style={{ fontWeight: 600, color: 'var(--themePrimary)' }}>
                {requestType} Request
              </Text>
              {requestId && (
                <Text 
                  variant="large" 
                  style={{ 
                    color: 'var(--neutralSecondary)',
                    background: 'var(--neutralLighter)',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}
                >
                  #{requestId}
                </Text>
              )}
            </Stack>
            <Text variant="medium" style={{ color: 'var(--neutralSecondary)' }}>
              {requestTitle}
            </Text>
          </Stack>
          
          {/* Access Management */}
          {requestForm.itemId && (
            <ManageAccessComponent
              spContext={window.spContext}
              itemId={requestForm.itemId}
              listId="your-list-guid" // TODO: Get from config
              permissionTypes="both"
              onPermissionChanged={handlePermissionChanged}
              maxAvatars={4}
            />
          )}
        </Stack>
      </Stack>

      {/* Main Content Layout with responsive comments panel */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '24px',
          position: 'relative',
          transition: 'all 0.3s ease'
        }}
      >
        
        {/* Left Column - Form Content */}
        <div
          style={{
            flex: requestForm.itemId && commentsExpanded && !isMobile ? '0 0 calc(70% - 12px)' : '1 1 100%',
            transition: 'all 0.3s ease',
            minWidth: 0 // Important for flex child to shrink properly
          }}
        >
          <form onSubmit={handleSubmit(handleSubmitRequest)}>
            
            {/* Request Info Component */}
            <RequestInfo
              control={control}
              errors={errors}
              requestAccess={requestForm.requestAccess}
              isSubmitted={isSubmitted}
            />
            
            {/* TODO: Approvals Component */}
            <div style={{ 
              padding: '20px', 
              background: 'white', 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              marginTop: '16px'
            }}>
              <Text variant="medium" style={{ fontWeight: 600 }}>
                Approvals Component (Coming Soon)
              </Text>
            </div>
            
            {/* Conditional Components based on access */}
            {requestForm.requestAccess.enableLegalIntake && (
              <div style={{ 
                padding: '20px', 
                background: 'white', 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginTop: '16px'
              }}>
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  Legal Intake Component
                </Text>
              </div>
            )}
            
            {requestForm.requestAccess.enableLegalReview && (
              <div style={{ 
                padding: '20px', 
                background: 'white', 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginTop: '16px'
              }}>
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  Legal Review Component
                </Text>
              </div>
            )}
            
            {requestForm.requestAccess.enableComplianceReview && (
              <div style={{ 
                padding: '20px', 
                background: 'white', 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginTop: '16px'
              }}>
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  Compliance Review Component
                </Text>
              </div>
            )}
            
            {requestForm.requestAccess.enableCloseout && (
              <div style={{ 
                padding: '20px', 
                background: 'white', 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginTop: '16px'
              }}>
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  Closeout Component
                </Text>
              </div>
            )}
            
            {/* Validation Summary */}
            {formValidation.hasErrors && (
              <MessageBar messageBarType={MessageBarType.error} isMultiline>
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  Please correct the following errors:
                </Text>
                <Stack tokens={{ childrenGap: 4 }}>
                  {formValidation.validationState.errors.map((error, index) => (
                    <Text key={index} variant="small">• {error}</Text>
                  ))}
                </Stack>
              </MessageBar>
            )}
            
            {/* Save Error Display */}
            {requestForm.saveError && (
              <MessageBar 
                messageBarType={MessageBarType.error} 
                onDismiss={() => requestForm.clearErrors()}
              >
                <Text variant="medium" style={{ fontWeight: 600 }}>Save Error:</Text>
                <Text variant="small">{requestForm.saveError}</Text>
              </MessageBar>
            )}
            
            {/* Form Actions */}
            <Stack
              horizontal
              horizontalAlign="space-between"
              verticalAlign="center"
              style={{
                padding: '16px 20px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginTop: '16px'
              }}
            >
              <Stack horizontal tokens={{ childrenGap: 12 }}>
                {requestForm.requestAccess.formActions.showSaveAsDraft && (
                  <IconButton
                    iconProps={{ iconName: 'Save' }}
                    text="Save Draft"
                    onClick={handleSaveDraft}
                    disabled={requestForm.isSaving || !isDirty}
                  />
                )}
                
                {requestForm.requestAccess.formActions.showSubmit && (
                  <IconButton
                    iconProps={{ iconName: 'Send' }}
                    text="Submit Request"
                    onClick={handleSubmit(handleSubmitRequest)}
                    disabled={requestForm.isSaving}
                    primary
                  />
                )}
              </Stack>
              
              {/* Comments toggle button for existing requests */}
              {requestForm.itemId && (
                <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
                  {isDirty && (
                    <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
                      {requestForm.isSaving ? 'Saving...' : 'You have unsaved changes'}
                    </Text>
                  )}
                  
                  <IconButton
                    iconProps={{ iconName: commentsExpanded ? 'ChromeClose' : 'Comment' }}
                    text={commentsExpanded ? 'Close Comments' : 'Open Comments'}
                    onClick={handleToggleComments}
                    styles={{
                      root: {
                        backgroundColor: commentsExpanded ? 'var(--themePrimary)' : 'var(--neutralLighter)',
                        color: commentsExpanded ? 'white' : 'var(--themePrimary)'
                      },
                      rootHovered: {
                        backgroundColor: commentsExpanded ? 'var(--themeDark)' : 'var(--themeLight)',
                      }
                    }}
                  />
                </Stack>
              )}
              
              {!requestForm.itemId && isDirty && (
                <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
                  {requestForm.isSaving ? 'Saving...' : 'You have unsaved changes'}
                </Text>
              )}
            </Stack>
            
          </form>
        </div>

        {/* Right Column - Comments Panel (Desktop) */}
        {requestForm.itemId && !isMobile && commentsExpanded && (
          <div
            style={{
              flex: '0 0 calc(30% - 12px)',
              position: 'sticky',
              top: '20px',
              maxHeight: 'calc(100vh - 40px)',
              transition: 'all 0.3s ease'
            }}
          >
            <Stack
              style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                height: '600px',
                overflow: 'hidden'
              }}
            >
              {/* Comments Header */}
              <Stack 
                horizontal 
                horizontalAlign="space-between" 
                verticalAlign="center"
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--neutralLight)',
                  backgroundColor: 'var(--neutralLighterAlt)'
                }}
              >
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                  <Icon iconName="Comment" style={{ color: 'var(--themePrimary)' }} />
                  <Text variant="medium" style={{ fontWeight: 600 }}>
                    Conversation
                  </Text>
                </Stack>
                <IconButton
                  iconProps={{ iconName: 'ChromeClose' }}
                  title="Close Comments"
                  onClick={handleToggleComments}
                  styles={{
                    root: { color: 'var(--neutralPrimary)' },
                    rootHovered: { backgroundColor: 'var(--neutralLight)' }
                  }}
                />
              </Stack>
              
              {/* Comments Content */}
              <Stack 
                style={{ 
                  flex: 1, 
                  padding: '16px 20px',
                  overflowY: 'auto'
                }}
              >
                <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
                  Comments will be loaded here using PnP List Item Comments component
                </Text>
              </Stack>
            </Stack>
          </div>
        )}

      </div>

      {/* Mobile Comments Panel */}
      {requestForm.itemId && isMobile && (
        <Panel
          isOpen={commentsExpanded}
          onDismiss={handleToggleComments}
          type={PanelType.medium}
          headerText="Conversation"
          hasCloseButton={true}
          styles={{
            main: {
              top: '0 !important',
              height: '100vh !important'
            },
            content: {
              padding: 0
            },
            headerText: {
              fontSize: '16px',
              fontWeight: 600
            }
          }}
        >
          <Stack
            style={{
              height: '100%',
              padding: '20px'
            }}
          >
            <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
              Comments will be loaded here using PnP List Item Comments component
            </Text>
          </Stack>
        </Panel>
      )}

    </Stack>
  );
};
