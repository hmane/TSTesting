```
// stores/requestFormStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { isEqual } from '@microsoft/sp-lodash-subset';
import { Request, NewRequest, RequestStatus, FormDisplayMode, getDefaultNewRequest } from '../models/Request';
import { RequestAccess } from '../models/RequestAccess';
import { SiteGroupInfo } from '../models/Common';

interface RequestFormState {
  // Core state
  currentRequest: Request | NewRequest | null;
  originalRequest: Request | NewRequest | null;
  requestAccess: RequestAccess;
  formMode: FormDisplayMode;
  itemId: number | undefined;
  userGroups: SiteGroupInfo[];

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  isSaving: boolean;

  // Error handling
  error: string | null;
  saveError: string | null;

  // Form state
  isDirty: boolean;
  lastSaveTime: Date | undefined;

  // Actions
  initializeForm: (itemId?: number) => Promise<void>;
  loadRequest: (itemId: number) => Promise<void>;
  loadUserGroups: () => Promise<void>;
  calculateRequestAccess: () => RequestAccess;
  createNewRequest: () => void;
  updateField: <K extends keyof (Request | NewRequest)>(field: K, value: (Request | NewRequest)[K]) => void;
  updateFields: (fields: Partial<Request | NewRequest>) => void;
  checkIsDirty: () => boolean;
  
  // Workflow actions
  saveAsDraft: () => Promise<boolean>;
  submitRequest: () => Promise<boolean>;
  assignAttorney: (attorneyId: string, notes?: string) => Promise<boolean>;
  submitToAssignAttorney: (notes?: string) => Promise<boolean>;
  submitLegalReview: (outcome: string, notes: string) => Promise<boolean>;
  submitComplianceReview: (outcome: string, notes: string, isFiresideRequired?: boolean, isRetailUse?: boolean) => Promise<boolean>;
  closeoutRequest: (trackingId: string) => Promise<boolean>;
  cancelRequest: (reason?: string) => Promise<boolean>;
  holdRequest: (reason?: string) => Promise<boolean>;
  resumeRequest: () => Promise<boolean>;

  // Utility actions
  resetForm: () => void;
  clearErrors: () => void;

  // Helper methods
  isNewRequest: () => boolean;
  canEdit: () => boolean;
  canPerformAction: (action: string) => boolean;
}

const initialState = {
  currentRequest: null,
  originalRequest: null,
  requestAccess: {} as RequestAccess,
  formMode: FormDisplayMode.New,
  itemId: undefined,
  userGroups: [],
  isLoading: false,
  isInitialized: false,
  isSaving: false,
  error: null,
  saveError: null,
  isDirty: false,
  lastSaveTime: undefined,
};

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const useRequestFormStore = create<RequestFormState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      initializeForm: async (itemId?: number) => {
        const { isLoading } = get();
        if (isLoading) return;

        try {
          set({ 
            isLoading: true, 
            error: null, 
            itemId,
            formMode: itemId ? FormDisplayMode.Edit : FormDisplayMode.New 
          });

          if (itemId) {
            await get().loadUserGroups();
            await get().loadRequest(itemId);
          } else {
            get().createNewRequest();
          }

          const requestAccess = get().calculateRequestAccess();
          
          set({ 
            requestAccess,
            isInitialized: true, 
            isLoading: false 
          });

        } catch (error) {
          console.error('Failed to initialize form:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize form',
            isInitialized: false
          });
        }
      },

      loadRequest: async (itemId: number) => {
        try {
          // TODO: Replace with your actual SharePoint data loading
          const request: Request = {} as Request;
          
          const originalRequest = deepClone(request);

          set({
            currentRequest: request,
            originalRequest: originalRequest,
            formMode: FormDisplayMode.Edit,
            isDirty: false
          });

        } catch (error) {
          console.error(`Failed to load request ${itemId}:`, error);
          throw error;
        }
      },

      loadUserGroups: async () => {
        try {
          // TODO: Replace with your actual group loading logic
          const userGroups: SiteGroupInfo[] = [];
          
          set({ userGroups });

        } catch (error) {
          console.error('Failed to load user groups:', error);
          throw error;
        }
      },

      calculateRequestAccess: () => {
        const { currentRequest, userGroups } = get();
        
        // TODO: Implement access calculation based on user groups and request status
        const requestAccess: RequestAccess = {
          isCreator: false,
          isStakeholder: false,
          isAdmin: false,
          isLegalAdmin: false,
          isComplianceUser: false,
          isSubmitter: false,
          isAttorneyAssigner: false,
          isAttorney: false,
          
          enableRequestInfo: true,
          enableLegalIntake: false,
          enableAssignAttorneys: false,
          enableLegalReview: false,
          enableComplianceReview: false,
          enableCloseout: false,
          
          formActions: {
            showSaveAsDraft: false,
            showSubmit: false,
            showAssignAttorney: false,
            showSubmitToAssignAttorney: false,
            showSubmitLegalReview: false,
            showSubmitComplianceReview: false,
            showCloseout: false,
            showHoldRequest: false,
            showCancelRequest: false,
            showResumeRequest: false,
          }
        };

        return requestAccess;
      },

      createNewRequest: () => {
        const newRequest = getDefaultNewRequest();
        const originalRequest = deepClone(newRequest);

        set({
          currentRequest: newRequest,
          originalRequest: originalRequest,
          formMode: FormDisplayMode.New,
          isDirty: false
        });
      },

      updateField: (field, value) => {
        const { currentRequest } = get();
        if (!currentRequest) return;

        const updatedRequest = { ...currentRequest, [field]: value };
        const isDirty = !isEqual(updatedRequest, get().originalRequest);
        
        set({
          currentRequest: updatedRequest,
          isDirty
        });
      },

      updateFields: (fields) => {
        const { currentRequest } = get();
        if (!currentRequest) return;

        const updatedRequest = { ...currentRequest, ...fields };
        const isDirty = !isEqual(updatedRequest, get().originalRequest);
        
        set({
          currentRequest: updatedRequest,
          isDirty
        });
      },

      checkIsDirty: () => {
        const { currentRequest, originalRequest } = get();
        if (!currentRequest || !originalRequest) return false;
        
        const isDirty = !isEqual(currentRequest, originalRequest);
        set({ isDirty });
        return isDirty;
      },

      saveAsDraft: async () => {
        const { currentRequest } = get();
        if (!currentRequest) return false;

        try {
          set({ isSaving: true, saveError: null });

          // TODO: Implement save logic
          const savedRequest: Request = currentRequest as Request;
          const originalRequest = deepClone(savedRequest);

          set({
            currentRequest: savedRequest,
            originalRequest: originalRequest,
            formMode: FormDisplayMode.Edit,
            isDirty: false,
            isSaving: false,
            lastSaveTime: new Date(),
            itemId: savedRequest.Id
          });

          return true;
        } catch (error) {
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to save as draft'
          });
          return false;
        }
      },

      submitRequest: async () => {
        const { currentRequest } = get();
        if (!currentRequest) return false;

        try {
          set({ isSaving: true, saveError: null });

          // TODO: Implement submit logic
          const savedRequest: Request = currentRequest as Request;
          const originalRequest = deepClone(savedRequest);

          set({
            currentRequest: savedRequest,
            originalRequest: originalRequest,
            formMode: FormDisplayMode.View,
            isDirty: false,
            isSaving: false,
            lastSaveTime: new Date(),
          });

          return true;
        } catch (error) {
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to submit request'
          });
          return false;
        }
      },

      assignAttorney: async (attorneyId: string, notes?: string) => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;

        try {
          set({ isSaving: true, saveError: null });

          // TODO: Implement assign attorney logic
          
          return true;
        } catch (error) {
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to assign attorney'
          });
          return false;
        }
      },

      submitToAssignAttorney: async (notes?: string) => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;

        try {
          set({ isSaving: true, saveError: null });

          // TODO: Implement submit to assign attorney logic
          
          return true;
        } catch (error) {
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to submit to assign attorney'
          });
          return false;
        }
      },

      submitLegalReview: async (outcome: string, notes: string) => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;

        try {
          set({ isSaving: true, saveError: null });

          // TODO: Implement submit legal review logic
          
          return true;
        } catch (error) {
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to submit legal review'
          });
          return false;
        }
      },

      submitComplianceReview: async (outcome: string, notes: string, isFiresideRequired?: boolean, isRetailUse?: boolean) => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;

        try {
          set({ isSaving: true, saveError: null });

          // TODO: Implement submit compliance review logic
          
          return true;
        } catch (error) {
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to submit compliance review'
          });
          return false;
        }
      },

      closeoutRequest: async (trackingId: string) => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;

        try {
          set({ isSaving: true, saveError: null });

          // TODO: Implement closeout logic
          
          return true;
        } catch (error) {
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to closeout request'
          });
          return false;
        }
      },

      cancelRequest: async (reason?: string) => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;

        try {
          set({ isSaving: true, saveError: null });

          // TODO: Implement cancel logic
          
          return true;
        } catch (error) {
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to cancel request'
          });
          return false;
        }
      },

      holdRequest: async (reason?: string) => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;

        try {
          set({ isSaving: true, saveError: null });

          // TODO: Implement hold logic
          
          return true;
        } catch (error) {
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to hold request'
          });
          return false;
        }
      },

      resumeRequest: async () => {
        const { currentRequest } = get();
        if (!currentRequest || !('Id' in currentRequest)) return false;

        try {
          set({ isSaving: true, saveError: null });

          // TODO: Implement resume logic
          
          return true;
        } catch (error) {
          set({
            isSaving: false,
            saveError: error instanceof Error ? error.message : 'Failed to resume request'
          });
          return false;
        }
      },

      resetForm: () => {
        set({ ...initialState, userGroups: [] });
      },

      clearErrors: () => {
        set({ error: null, saveError: null });
      },

      isNewRequest: () => {
        const { formMode, currentRequest } = get();
        return formMode === FormDisplayMode.New || !currentRequest || !('Id' in currentRequest);
      },

      canEdit: () => {
        const { requestAccess } = get();
        // TODO: Implement based on requestAccess flags
        return false;
      },

      canPerformAction: (action: string) => {
        const { requestAccess } = get();
        // TODO: Implement based on requestAccess.formActions
        return false;
      }
    }),
    { name: 'request-form-store' }
  )
);
```


```
// components/RequestForm/RequestContainer.tsx
import React, { useEffect, useState } from 'react';
import {
  Stack,
  MessageBar,
  MessageBarType,
  Text,
  Icon,
  IconButton,
  Persona,
  PersonaSize,
  Spinner,
  SpinnerSize
} from '@fluentui/react';
import { useForm } from 'react-hook-form';
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
  const requestForm = useRequestForm();
  const formValidation = useFormValidation();
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [selectedRequestType, setSelectedRequestType] = useState<string | null>(null);

  // React Hook Form setup
  const form = useForm<Request | NewRequest>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: requestForm.getDefaultNewRequest?.() || {}
  });

  // Initialize form
  useEffect(() => {
    if (itemId) {
      // Existing request - load directly
      requestForm.initializeForm(itemId);
      setSelectedRequestType('communication'); // Will be loaded from request data
    }
    // For new requests, wait for type selection
  }, [itemId]);

  // Handle request type selection for new requests
  const handleRequestTypeSelected = (requestType: string) => {
    setSelectedRequestType(requestType);
    // Initialize new request with selected type
    requestForm.initializeForm();
    // Set the request type in the form
    setTimeout(() => {
      requestForm.updateField('RequestType', requestType === 'communication' ? 'Communication' : requestType);
    }, 100);
  };

  // Show request type selector for new requests
  if (!itemId && !selectedRequestType) {
    return (
      <RequestTypeSelector
        onRequestTypeSelected={handleRequestTypeSelected}
        onCancel={onCancel}
      />
    );
  }

  // Sync form with store
  useEffect(() => {
    if (requestForm.currentRequest && requestForm.isInitialized) {
      form.reset(requestForm.currentRequest);
    }
  }, [requestForm.currentRequest, requestForm.isInitialized, form]);

  // Form change handler
  const watchedValues = form.watch();
  useEffect(() => {
    if (requestForm.currentRequest && watchedValues) {
      const hasChanges = Object.entries(watchedValues).some(([key, value]) => {
        const storeValue = requestForm.currentRequest![key as keyof (Request | NewRequest)];
        return JSON.stringify(storeValue) !== JSON.stringify(value);
      });

      if (hasChanges) {
        requestForm.updateFields(watchedValues);
      }
    }
  }, [watchedValues, requestForm.currentRequest]);

  // Workflow steps for header
  const getWorkflowSteps = (): StepData[] => {
    const currentStatus = requestForm.getFieldValue('Status') || RequestStatus.Draft;
    
    const steps = [
      { id: 'draft', title: 'Draft', status: getStepStatus('Draft', currentStatus) },
      { id: 'legal-intake', title: 'Legal Intake', status: getStepStatus('Legal Intake', currentStatus) },
      { id: 'assign-attorney', title: 'Assign Attorney', status: getStepStatus('Assign Attorney', currentStatus) },
      { id: 'in-review', title: 'In Review', status: getStepStatus('In Review', currentStatus) },
      { id: 'closeout', title: 'Closeout', status: getStepStatus('Closeout', currentStatus) },
      { id: 'completed', title: 'Completed', status: getStepStatus('Completed', currentStatus) }
    ];

    return steps;
  };

  const getStepStatus = (stepStatus: string, currentStatus: RequestStatus) => {
    const statusOrder = ['Draft', 'Legal Intake', 'Assign Attorney', 'In Review', 'Closeout', 'Completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  // Status banner helpers
  const getStatusBanner = () => {
    if (!requestForm.currentRequest || !('Status' in requestForm.currentRequest)) return null;
    
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
                <Text variant="small">
                  Reason: {request.CancelReason}
                </Text>
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
                <Text variant="small">
                  Reason: {request.OnHoldReason}
                </Text>
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
  };

  // Permission change handler for ManageAccess
  const handlePermissionChanged = async (
    operation: 'add' | 'remove',
    principals: any[]
  ): Promise<boolean> => {
    try {
      // TODO: Implement permission change logic
      return true;
    } catch (error) {
      console.error('Permission change failed:', error);
      return false;
    }
  };

  // Loading state
  if (requestForm.isLoading) {
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

  const requestTitle = requestForm.getFieldValue('RequestTitle') || 'New Request';
  const requestId = requestForm.getFieldValue('Title');
  const requestType = requestForm.getFieldValue('RequestType') || 'Communication';

  return (
    <Stack tokens={{ childrenGap: 0 }} style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Status Banner (Cancelled/On Hold) */}
      {getStatusBanner()}

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
          steps={getWorkflowSteps()}
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
              spContext={window.spContext} // TODO: Pass actual context
              itemId={requestForm.itemId}
              listId="your-list-guid" // TODO: Get from config
              permissionTypes="both"
              onPermissionChanged={handlePermissionChanged}
              maxAvatars={4}
            />
          )}
        </Stack>
      </Stack>

      {/* Main Content Layout */}
      <Stack 
        horizontal 
        tokens={{ childrenGap: 24 }} 
        style={{ alignItems: 'flex-start' }}
        styles={{
          root: {
            '@media (max-width: 1024px)': {
              flexDirection: 'column',
              gap: '16px'
            }
          }
        }}
      >
        
        {/* Left Column - Form Content (70%) */}
        <Stack 
          style={{ flex: '0 0 70%' }}
          tokens={{ childrenGap: 16 }}
          styles={{
            root: {
              '@media (max-width: 1024px)': {
                flex: '1 1 100%'
              }
            }
          }}
        >
          <form onSubmit={form.handleSubmit(() => {})}>
            
            {/* Request Info Component */}
            <RequestInfo
              control={form.control}
              errors={form.formState.errors}
              requestAccess={requestForm.requestAccess}
              isSubmitted={requestForm.getFieldValue('Status') !== RequestStatus.Draft}
            />
            
            {/* TODO: Approvals Component */}
            <div>Approvals Component</div>
            
            {/* TODO: Legal Intake Component */}
            {requestForm.requestAccess.enableLegalIntake && (
              <div>Legal Intake Component</div>
            )}
            
            {/* TODO: Legal Review Component */}
            {requestForm.requestAccess.enableLegalReview && (
              <div>Legal Review Component</div>
            )}
            
            {/* TODO: Compliance Review Component */}
            {requestForm.requestAccess.enableComplianceReview && (
              <div>Compliance Review Component</div>
            )}
            
            {/* TODO: Closeout Component */}
            {requestForm.requestAccess.enableCloseout && (
              <div>Closeout Component</div>
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
            
            {/* TODO: Form Actions Component */}
            <div>Form Actions Component</div>
            
          </form>
        </Stack>

        {/* Right Column - Comments (30%) */}
        <Stack 
          style={{ 
            flex: '0 0 30%',
            position: 'sticky',
            top: '20px',
            maxHeight: 'calc(100vh - 40px)'
          }}
          styles={{
            root: {
              '@media (max-width: 1024px)': {
                flex: '1 1 100%',
                position: 'static',
                maxHeight: 'none',
                order: -1
              }
            }
          }}
        >
          
          {/* Comments Container with Collapse/Expand */}
          <Stack
            style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              height: commentsExpanded ? '600px' : '60px',
              transition: 'height 0.3s ease',
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
                borderBottom: commentsExpanded ? '1px solid var(--neutralLight)' : 'none',
                cursor: 'pointer'
              }}
              onClick={() => setCommentsExpanded(!commentsExpanded)}
            >
              <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                <Icon iconName="Comment" style={{ color: 'var(--themePrimary)' }} />
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  Conversation
                </Text>
              </Stack>
              <IconButton
                iconProps={{ iconName: commentsExpanded ? 'ChevronUp' : 'ChevronDown' }}
                title={commentsExpanded ? 'Collapse Comments' : 'Expand Comments'}
              />
            </Stack>
            
            {/* Comments Content */}
            {commentsExpanded && (
              <Stack 
                style={{ 
                  flex: 1, 
                  padding: '16px 20px',
                  overflowY: 'auto'
                }}
              >
                {requestForm.itemId ? (
                  <div>
                    {/* TODO: Integrate PnP List Item Comments */}
                    <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
                      Comments will be loaded here using PnP List Item Comments component
                    </Text>
                  </div>
                ) : (
                  <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
                    Save the request to enable comments
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
          
        </Stack>

      </Stack>

    </Stack>
  );
};
```


```
// components/RequestForm/RequestTypeSelector.tsx
import React, { useState } from 'react';
import {
  Stack,
  Text,
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  Icon
} from '@fluentui/react';
import { List } from 'devextreme-react/list';
import { WorkflowStepper, StepData } from '../WorkflowStepper';

interface RequestType {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  comingSoon?: boolean;
  icon?: string;
  estimatedTime?: string;
}

interface RequestTypeSelectorProps {
  onRequestTypeSelected: (requestType: string) => void;
  onCancel?: () => void;
}

export const RequestTypeSelector: React.FC<RequestTypeSelectorProps> = ({
  onRequestTypeSelected,
  onCancel
}) => {
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | null>(null);

  // Available request types
  const requestTypes: RequestType[] = [
    {
      id: 'communication',
      title: 'Communication Request',
      description: 'Submit marketing materials, communications, and promotional content for legal and compliance review. Includes white papers, brochures, presentations, and digital content.',
      enabled: true,
      icon: 'MegaphoneOutline',
      estimatedTime: '5-7 business days'
    },
    {
      id: 'general-review',
      title: 'General Review',
      description: 'Submit general documents and materials for legal review that don\'t fall under specific communication or IMA categories.',
      enabled: false,
      comingSoon: true,
      icon: 'DocumentSearch',
      estimatedTime: '3-5 business days'
    },
    {
      id: 'ima-review',
      title: 'IMA Review',
      description: 'Submit Investment Management Agreement documents and related materials for specialized legal review and compliance checking.',
      enabled: false,
      comingSoon: true,
      icon: 'Financial',
      estimatedTime: '7-10 business days'
    }
  ];

  // Workflow steps to show the complete process
  const getWorkflowSteps = (): StepData[] => [
    {
      id: 'draft',
      title: 'Draft',
      description1: 'Create request',
      description2: 'Add details & documents',
      status: 'pending'
    },
    {
      id: 'legal-intake',
      title: 'Legal Intake',
      description1: 'Attorney assignment',
      description2: 'Initial review',
      status: 'pending'
    },
    {
      id: 'assign-attorney',
      title: 'Assign Attorney',
      description1: 'Committee review',
      description2: 'Attorney selection',
      status: 'pending'
    },
    {
      id: 'in-review',
      title: 'In Review',
      description1: 'Legal & compliance',
      description2: 'Detailed analysis',
      status: 'pending'
    },
    {
      id: 'closeout',
      title: 'Closeout',
      description1: 'Final tracking',
      description2: 'Documentation',
      status: 'pending'
    },
    {
      id: 'completed',
      title: 'Completed',
      description1: 'Ready for use',
      description2: 'Process complete',
      status: 'pending'
    }
  ];

  // DevExtreme List item template
  const renderRequestTypeItem = (item: RequestType) => {
    const isSelected = selectedRequestType?.id === item.id;
    
    return (
      <Stack
        style={{
          padding: '20px',
          border: isSelected ? '2px solid var(--themePrimary)' : '2px solid var(--neutralLight)',
          borderRadius: '8px',
          backgroundColor: isSelected ? 'var(--themeLighterAlt)' : 'white',
          cursor: item.enabled ? 'pointer' : 'not-allowed',
          opacity: item.enabled ? 1 : 0.6,
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
        tokens={{ childrenGap: 12 }}
      >
        {/* Coming Soon Badge */}
        {item.comingSoon && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'var(--yellow)',
              color: 'var(--yellowDark)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Coming Soon
          </div>
        )}

        {/* Header */}
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
          <Icon
            iconName={item.icon || 'Document'}
            style={{
              fontSize: '24px',
              color: item.enabled ? 'var(--themePrimary)' : 'var(--neutralSecondary)'
            }}
          />
          <Stack>
            <Text
              variant="large"
              style={{
                fontWeight: 600,
                color: item.enabled ? 'var(--neutralPrimary)' : 'var(--neutralSecondary)'
              }}
            >
              {item.title}
            </Text>
            {item.estimatedTime && (
              <Text
                variant="small"
                style={{ color: 'var(--neutralSecondary)' }}
              >
                Typical turnaround: {item.estimatedTime}
              </Text>
            )}
          </Stack>
        </Stack>

        {/* Description */}
        <Text
          variant="medium"
          style={{
            color: item.enabled ? 'var(--neutralPrimary)' : 'var(--neutralSecondary)',
            lineHeight: '1.4'
          }}
        >
          {item.description}
        </Text>

        {/* Selection Indicator */}
        {isSelected && item.enabled && (
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <Icon
              iconName="CheckMark"
              style={{ color: 'var(--themePrimary)', fontSize: '16px' }}
            />
            <Text
              variant="medium"
              style={{ color: 'var(--themePrimary)', fontWeight: 600 }}
            >
              Selected
            </Text>
          </Stack>
        )}
      </Stack>
    );
  };

  // Handle item selection
  const handleItemClick = (item: RequestType) => {
    if (item.enabled) {
      setSelectedRequestType(item);
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (selectedRequestType) {
      onRequestTypeSelected(selectedRequestType.id);
    }
  };

  return (
    <Stack tokens={{ childrenGap: 24 }} style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* Header */}
      <Stack horizontalAlign="center" tokens={{ childrenGap: 16 }}>
        <Text variant="xxLarge" style={{ fontWeight: 600, textAlign: 'center' }}>
          Start a New Request
        </Text>
        <Text variant="large" style={{ color: 'var(--neutralSecondary)', textAlign: 'center', maxWidth: '600px' }}>
          Choose the type of request you'd like to submit. Each request type follows a specific workflow designed for optimal review and approval.
        </Text>
      </Stack>

      {/* Workflow Preview */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="large" style={{ fontWeight: 600, textAlign: 'center' }}>
          Review Process Overview
        </Text>
        <div
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <WorkflowStepper
            steps={getWorkflowSteps()}
            mode="fullSteps"
            minStepWidth={160}
            selectedStepId="draft"
          />
        </div>
        <Text variant="medium" style={{ color: 'var(--neutralSecondary)', textAlign: 'center' }}>
          This is the standard workflow for all request types. Some steps may be skipped based on your request details.
        </Text>
      </Stack>

      {/* Request Type Selection */}
      <Stack tokens={{ childrenGap: 16 }}>
        <Text variant="large" style={{ fontWeight: 600 }}>
          Select Request Type
        </Text>
        
        {/* Info Message */}
        <MessageBar messageBarType={MessageBarType.info}>
          <Text variant="medium">
            <strong>Communication Request</strong> is currently available. Additional request types are coming soon and will provide specialized workflows for different document types.
          </Text>
        </MessageBar>

        {/* DevExtreme List */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '8px' }}>
          <List
            dataSource={requestTypes}
            itemRender={renderRequestTypeItem}
            onItemClick={(e) => handleItemClick(e.itemData)}
            searchEnabled={false}
            style={{
              border: 'none',
              borderRadius: '8px'
            }}
          />
        </div>
      </Stack>

      {/* Selection Summary */}
      {selectedRequestType && (
        <Stack
          style={{
            background: 'var(--themeLighterAlt)',
            border: '1px solid var(--themeLight)',
            borderRadius: '8px',
            padding: '20px'
          }}
          tokens={{ childrenGap: 12 }}
        >
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Icon iconName="CheckMark" style={{ color: 'var(--themePrimary)' }} />
            <Text variant="large" style={{ fontWeight: 600 }}>
              Ready to Continue
            </Text>
          </Stack>
          <Text variant="medium">
            You've selected <strong>{selectedRequestType.title}</strong>. 
            Click Continue to start creating your request with the information and documents needed for review.
          </Text>
          <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
            Estimated processing time: {selectedRequestType.estimatedTime}
          </Text>
        </Stack>
      )}

      {/* Action Buttons */}
      <Stack horizontal horizontalAlign="center" tokens={{ childrenGap: 16 }}>
        {onCancel && (
          <DefaultButton
            text="Cancel"
            iconProps={{ iconName: 'Cancel' }}
            onClick={onCancel}
          />
        )}
        <PrimaryButton
          text="Continue"
          iconProps={{ iconName: 'ChevronRight' }}
          onClick={handleContinue}
          disabled={!selectedRequestType}
          style={{
            minWidth: '120px'
          }}
        />
      </Stack>

      {/* Help Text */}
      <Stack horizontalAlign="center">
        <Text variant="small" style={{ color: 'var(--neutralSecondary)', textAlign: 'center' }}>
          Need help choosing the right request type? Contact the Legal team for guidance.
        </Text>
      </Stack>

    </Stack>
  );
};
```



```
// components/RequestForm/RequestInfo.tsx
import React, { useState } from 'react';
import {
  Stack,
  Text,
  IconButton,
  Label,
  Separator,
  PersonaSize,
  Persona,
  Icon,
  TooltipHost
} from '@fluentui/react';
import { Control, FieldErrors } from 'react-hook-form';
import { Request, NewRequest } from '../../models/Request';
import { RequestAccess } from '../../models/RequestAccess';
import { Card, Header, Content } from '../Card';
import {
  FormItem,
  FormLabel,
  FormValue,
  FormError,
  FormDescription,
  DevExtremeTextBox,
  DevExtremeSelectBox,
  DevExtremeDateBox,
  DevExtremeTagBox,
  PnPPeoplePicker
} from '../spForm';
import { useFieldChoices, useRequestForm } from '../../hooks';

interface RequestInfoProps {
  control: Control<Request | NewRequest>;
  errors: FieldErrors<Request | NewRequest>;
  requestAccess: RequestAccess;
  isSubmitted: boolean;
}

export const RequestInfo: React.FC<RequestInfoProps> = ({
  control,
  errors,
  requestAccess,
  isSubmitted
}) => {
  const [isEditMode, setIsEditMode] = useState(!isSubmitted);
  const { getSelectOptions } = useFieldChoices();
  const requestForm = useRequestForm();

  // Get field choices
  const submissionTypeOptions = [
    { label: 'New', value: 'New' },
    { label: 'Material Updates', value: 'Material Updates' }
  ];

  const distributionMethodOptions = getSelectOptions('DistributionMethod');
  const reviewAudienceOptions = [
    { label: 'Legal', value: 'Legal' },
    { label: 'Compliance', value: 'Compliance' },
    { label: 'Both', value: 'Both' }
  ];

  // Summary view component
  const RequestInfoSummary = () => (
    <Stack tokens={{ childrenGap: 20 }}>
      
      {/* Basic Information Section */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" style={{ fontWeight: 600, color: 'var(--themePrimary)' }}>
          Basic Information
        </Text>
        <Stack tokens={{ childrenGap: 8 }}>
          <SummaryField 
            label="Request Title" 
            value={requestForm.getFieldValue('RequestTitle')} 
          />
          <SummaryField 
            label="Department" 
            value={requestForm.getFieldValue('Department')} 
          />
          <SummaryField 
            label="Request Type" 
            value={requestForm.getFieldValue('RequestType')} 
          />
          <SummaryField 
            label="Purpose" 
            value={requestForm.getFieldValue('Purpose')} 
            multiline 
          />
        </Stack>
      </Stack>

      <Separator />

      {/* Submission Details Section */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" style={{ fontWeight: 600, color: 'var(--themePrimary)' }}>
          Submission Details
        </Text>
        <Stack tokens={{ childrenGap: 8 }}>
          <SummaryField 
            label="Submission Type" 
            value={requestForm.getFieldValue('SubmissionType')} 
          />
          <SummaryField 
            label="Submission Item" 
            value={requestForm.getFieldValue('SubmissionItem')} 
          />
          <SummaryField 
            label="Distribution Method" 
            value={Array.isArray(requestForm.getFieldValue('DistributionMethod')) 
              ? (requestForm.getFieldValue('DistributionMethod') as string[]).join(', ')
              : requestForm.getFieldValue('DistributionMethod')} 
          />
        </Stack>
      </Stack>

      <Separator />

      {/* Timeline Section */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" style={{ fontWeight: 600, color: 'var(--themePrimary)' }}>
          Timeline & Dates
        </Text>
        <Stack tokens={{ childrenGap: 8 }}>
          <SummaryField 
            label="Target Return Date" 
            value={requestForm.getDisplayValue('TargetReturnDate')} 
          />
          {requestForm.isRushRequest() && (
            <SummaryField 
              label="Rush Request" 
              value="Yes" 
              icon="Warning"
              iconColor="var(--yellow)"
            />
          )}
          {requestForm.getRushReason() && (
            <SummaryField 
              label="Rush Rationale" 
              value={requestForm.getRushReason()} 
              multiline 
            />
          )}
          <SummaryField 
            label="Date of First Use" 
            value={requestForm.getDisplayValue('DateOfFirstUse')} 
          />
        </Stack>
      </Stack>

      <Separator />

      {/* Review & Collaboration Section */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" style={{ fontWeight: 600, color: 'var(--themePrimary)' }}>
          Review & Collaboration
        </Text>
        <Stack tokens={{ childrenGap: 8 }}>
          <SummaryField 
            label="Review Audience" 
            value={requestForm.getFieldValue('ReviewAudience')} 
          />
          <SummaryField 
            label="Additional Parties" 
            value={requestForm.getDisplayValue('AdditionalParty')} 
          />
          {requestForm.getFieldValue('PriorSubmissions')?.length > 0 && (
            <SummaryField 
              label="Prior Submissions" 
              value={`${requestForm.getFieldValue('PriorSubmissions')?.length} related requests`} 
            />
          )}
          {requestForm.getFieldValue('PriorSubmissionNotes') && (
            <SummaryField 
              label="Prior Submission Notes" 
              value={requestForm.getFieldValue('PriorSubmissionNotes')} 
              multiline 
            />
          )}
        </Stack>
      </Stack>

    </Stack>
  );

  // Edit form component
  const RequestInfoForm = () => (
    <Stack tokens={{ childrenGap: 16 }}>
      
      {/* Basic Information */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" style={{ fontWeight: 600, color: 'var(--themePrimary)' }}>
          Basic Information
        </Text>
        
        <FormItem>
          <FormLabel isRequired>Request Title</FormLabel>
          <FormValue>
            <DevExtremeTextBox
              name="RequestTitle"
              control={control}
              placeholder="Enter a descriptive title for your request"
              disabled={!requestForm.canEdit()}
              rules={{
                required: 'Request title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' },
                maxLength: { value: 255, message: 'Title cannot exceed 255 characters' }
              }}
            />
          </FormValue>
          <FormError error={errors.RequestTitle?.message} />
        </FormItem>

        <FormItem>
          <FormLabel>Department</FormLabel>
          <FormValue>
            <DevExtremeTextBox
              name="Department"
              control={control}
              disabled={true}
              placeholder="Auto-populated from user profile"
            />
          </FormValue>
          <FormDescription>
            Department is automatically set from your user profile
          </FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel isRequired>Request Type</FormLabel>
          <FormValue>
            <DevExtremeTextBox
              name="RequestType"
              control={control}
              disabled={true}
              placeholder="Selected during request creation"
            />
          </FormValue>
          <FormDescription>
            Request type was selected when creating this request
          </FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel isRequired>Purpose</FormLabel>
          <FormValue>
            <DevExtremeTextBox
              name="Purpose"
              control={control}
              mode="text"
              height={100}
              placeholder="Describe the purpose and intended use of this material"
              disabled={!requestForm.canEdit()}
              rules={{
                required: 'Purpose is required',
                minLength: { value: 10, message: 'Purpose must be at least 10 characters' }
              }}
            />
          </FormValue>
          <FormDescription>
            Provide detailed information about how this material will be used
          </FormDescription>
          <FormError error={errors.Purpose?.message} />
        </FormItem>
      </Stack>

      <Separator />

      {/* Submission Details */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" style={{ fontWeight: 600, color: 'var(--themePrimary)' }}>
          Submission Details
        </Text>

        <FormItem>
          <FormLabel isRequired>Submission Type</FormLabel>
          <FormValue>
            <DevExtremeSelectBox
              name="SubmissionType"
              control={control}
              items={submissionTypeOptions}
              placeholder="Select submission type"
              disabled={!requestForm.canEdit()}
              rules={{ required: 'Submission type is required' }}
            />
          </FormValue>
          <FormError error={errors.SubmissionType?.message} />
        </FormItem>

        <FormItem>
          <FormLabel isRequired>Submission Item</FormLabel>
          <FormValue>
            <DevExtremeSelectBox
              name="SubmissionItem"
              control={control}
              dataSource="SubmissionItems" // Will be loaded from list
              displayExpr="Title"
              valueExpr="Title"
              placeholder="Select submission item type"
              disabled={!requestForm.canEdit()}
              rules={{ required: 'Submission item is required' }}
            />
          </FormValue>
          <FormDescription>
            This determines the standard turnaround time for your request
          </FormDescription>
          <FormError error={errors.SubmissionItem?.message} />
        </FormItem>

        <FormItem>
          <FormLabel isRequired>Distribution Method</FormLabel>
          <FormValue>
            <DevExtremeTagBox
              name="DistributionMethod"
              control={control}
              items={distributionMethodOptions}
              placeholder="Select distribution methods"
              disabled={!requestForm.canEdit()}
              rules={{ required: 'At least one distribution method is required' }}
            />
          </FormValue>
          <FormError error={errors.DistributionMethod?.message} />
        </FormItem>
      </Stack>

      <Separator />

      {/* Timeline */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" style={{ fontWeight: 600, color: 'var(--themePrimary)' }}>
          Timeline & Dates
        </Text>

        <FormItem>
          <FormLabel isRequired>Target Return Date</FormLabel>
          <FormValue>
            <DevExtremeDateBox
              name="TargetReturnDate"
              control={control}
              type="date"
              min={new Date()}
              disabled={!requestForm.canEdit()}
              rules={{
                required: 'Target return date is required',
                validate: (value: Date) => 
                  value >= new Date() || 'Target return date cannot be in the past'
              }}
            />
          </FormValue>
          <FormDescription>
            When do you need this material approved and ready for use?
          </FormDescription>
          <FormError error={errors.TargetReturnDate?.message} />
        </FormItem>

        {/* Rush Request Detection Component would go here */}
        
        <FormItem>
          <FormLabel>Date of First Use</FormLabel>
          <FormValue>
            <DevExtremeDateBox
              name="DateOfFirstUse"
              control={control}
              type="date"
              min={new Date()}
              disabled={!requestForm.canEdit()}
            />
          </FormValue>
          <FormDescription>
            When will this material first be used or published?
          </FormDescription>
          <FormError error={errors.DateOfFirstUse?.message} />
        </FormItem>
      </Stack>

      <Separator />

      {/* Review & Collaboration */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text variant="medium" style={{ fontWeight: 600, color: 'var(--themePrimary)' }}>
          Review & Collaboration
        </Text>

        <FormItem>
          <FormLabel isRequired>Review Audience</FormLabel>
          <FormValue>
            <DevExtremeSelectBox
              name="ReviewAudience"
              control={control}
              items={reviewAudienceOptions}
              placeholder="Select review audience"
              disabled={!requestForm.canEdit()}
              rules={{ required: 'Review audience is required' }}
            />
          </FormValue>
          <FormDescription>
            Legal Admin can override this selection during intake
          </FormDescription>
          <FormError error={errors.ReviewAudience?.message} />
        </FormItem>

        <FormItem>
          <FormLabel>Additional Parties</FormLabel>
          <FormValue>
            <PnPPeoplePicker
              name="AdditionalParty"
              control={control}
              context={window.spContext}
              placeholder="Add stakeholders who should be notified"
              personSelectionLimit={10}
              disabled={!requestForm.canEdit()}
            />
          </FormValue>
          <FormDescription>
            These users will receive notifications and can view the request
          </FormDescription>
          <FormError error={errors.AdditionalParty?.message} />
        </FormItem>

        <FormItem>
          <FormLabel>Prior Submissions</FormLabel>
          <FormValue>
            {/* TODO: Implement lookup to same list filtered by department */}
            <div style={{ 
              padding: '12px', 
              border: '1px dashed var(--neutralTertiary)', 
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
                Prior submission lookup will be implemented here
              </Text>
            </div>
          </FormValue>
          <FormDescription>
            Link to related requests from your department
          </FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel>Prior Submission Notes</FormLabel>
          <FormValue>
            <DevExtremeTextBox
              name="PriorSubmissionNotes"
              control={control}
              mode="text"
              height={80}
              placeholder="Notes about related prior submissions"
              disabled={!requestForm.canEdit()}
            />
          </FormValue>
          <FormError error={errors.PriorSubmissionNotes?.message} />
        </FormItem>
      </Stack>

    </Stack>
  );

  // Summary field component
  const SummaryField: React.FC<{
    label: string;
    value?: string | number;
    multiline?: boolean;
    icon?: string;
    iconColor?: string;
  }> = ({ label, value, multiline, icon, iconColor }) => {
    if (!value && value !== 0) return null;

    return (
      <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="start">
        <Text 
          variant="small" 
          style={{ 
            minWidth: '140px', 
            fontWeight: 500,
            color: 'var(--neutralSecondary)'
          }}
        >
          {label}:
        </Text>
        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center" style={{ flex: 1 }}>
          {icon && (
            <Icon 
              iconName={icon} 
              style={{ color: iconColor || 'var(--neutralPrimary)' }} 
            />
          )}
          <Text 
            variant="small"
            style={{ 
              color: 'var(--neutralPrimary)',
              whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
              wordBreak: multiline ? 'break-word' : 'normal'
            }}
          >
            {value}
          </Text>
        </Stack>
      </Stack>
    );
  };

  // Only show if access is enabled
  if (!requestAccess.enableRequestInfo) {
    return null;
  }

  return (
    <Card
      id="request-info-card"
      variant="default"
      size="large"
      allowExpand={true}
      persist={true}
    >
      <Header>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Icon iconName="DocumentReply" style={{ color: 'var(--themePrimary)' }} />
            <Text variant="medium" style={{ fontWeight: 600 }}>
              Request Information
            </Text>
          </Stack>
          
          {/* Edit/View Toggle */}
          {isSubmitted && requestForm.canEdit() && (
            <TooltipHost content={isEditMode ? 'Switch to summary view' : 'Edit request information'}>
              <IconButton
                iconProps={{ iconName: isEditMode ? 'ReadingMode' : 'Edit' }}
                title={isEditMode ? 'View Summary' : 'Edit Information'}
                onClick={() => setIsEditMode(!isEditMode)}
                styles={{
                  root: { color: 'var(--themePrimary)' },
                  rootHovered: { backgroundColor: 'var(--themeLighter)' }
                }}
              />
            </TooltipHost>
          )}
        </Stack>
      </Header>
      
      <Content padding="spacious">
        {isEditMode ? <RequestInfoForm /> : <RequestInfoSummary />}
      </Content>
    </Card>
  );
};
```

```
// components/RequestForm/Approvals.tsx
import React, { useState, useCallback } from 'react';
import {
  Stack,
  Text,
  IconButton,
  Checkbox,
  DatePicker,
  MessageBar,
  MessageBarType,
  Icon,
  TooltipHost,
  DefaultButton,
  PrimaryButton,
  Panel,
  PanelType,
  Separator,
  ProgressIndicator,
  PersonaSize,
  Persona,
  Link,
  ActionButton
} from '@fluentui/react';
import { Control, FieldErrors, useWatch } from 'react-hook-form';
import { Request, NewRequest } from '../../models/Request';
import { RequestAccess } from '../../models/RequestAccess';
import { Card, Header, Content } from '../Card';
import {
  FormItem,
  FormLabel,
  FormValue,
  FormError,
  FormDescription,
  PnPPeoplePicker
} from '../spForm';
import { useRequestForm } from '../../hooks';

interface ApprovalsProps {
  control: Control<Request | NewRequest>;
  errors: FieldErrors<Request | NewRequest>;
  requestAccess: RequestAccess;
  isSubmitted: boolean;
}

interface ApprovalType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  required?: boolean;
  dateField: string;
  approverField: string;
  helpText?: string;
  examples?: string[];
}

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  approvalType: string;
  url?: string;
}

export const Approvals: React.FC<ApprovalsProps> = ({
  control,
  errors,
  requestAccess,
  isSubmitted
}) => {
  const [isEditMode, setIsEditMode] = useState(!isSubmitted);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [selectedApprovalType, setSelectedApprovalType] = useState<string>('');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const requestForm = useRequestForm();

  // Watch approval checkboxes to show/hide related fields
  const watchedValues = useWatch({ control });

  // Available approval types
  const approvalTypes: ApprovalType[] = [
    {
      id: 'communication',
      title: 'Communication Approval',
      description: 'Required for external communications and marketing materials',
      icon: 'MegaphoneOutline',
      color: '#0078d4',
      required: true,
      dateField: 'CommunicationApprovalDate',
      approverField: 'CommunicationApprover',
      helpText: 'All external communications must be approved by the Communications team',
      examples: ['Email approval screenshots', 'Signed approval forms', 'Approval meeting notes']
    },
    {
      id: 'portfolio',
      title: 'Portfolio Approval',
      description: 'Required for investment-related content and portfolio materials',
      icon: 'Financial',
      color: '#107c10',
      dateField: 'PortfolioApprovalDate',
      approverField: 'PortfolioApprover',
      helpText: 'Portfolio managers must approve content related to investment strategies',
      examples: ['Portfolio manager signatures', 'Investment committee minutes', 'Strategy approval emails']
    },
    {
      id: 'research',
      title: 'Research Analyst Approval',
      description: 'Required for research reports and analytical content',
      icon: 'AnalyticsReport',
      color: '#8764b8',
      dateField: 'ResearchAnalystApprovalDate',
      approverField: 'ResearchAnalyst',
      helpText: 'Senior research analysts must review all research-related materials',
      examples: ['Research director approval', 'Analyst sign-off documents', 'Research review emails']
    },
    {
      id: 'sme',
      title: 'Subject Matter Expert (SME) Approval',
      description: 'Required for technical or specialized content',
      icon: 'ExpertIcon',
      color: '#d83b01',
      dateField: 'SMEApprovalDate',
      approverField: 'SME',
      helpText: 'Technical experts must validate specialized content accuracy',
      examples: ['Technical review documents', 'Expert validation emails', 'SME approval forms']
    },
    {
      id: 'performance',
      title: 'Performance Review Approval',
      description: 'Required for performance-related claims and statistics',
      icon: 'Chart',
      color: '#ca5010',
      dateField: 'PerformanceReviewApprovalDate',
      approverField: 'PerformanceReviewApprover',
      helpText: 'Performance data must be verified by the Performance team',
      examples: ['Performance team validation', 'Data accuracy confirmations', 'Statistical reviews']
    },
    {
      id: 'other',
      title: 'Other Approval',
      description: 'Additional approvals as required by your organization',
      icon: 'MoreVertical',
      color: '#486991',
      dateField: 'OtherApprovalDate',
      approverField: 'OtherApprover',
      helpText: 'Any other internal approvals required for your specific use case'
    }
  ];

  // Get selected approval types
  const getSelectedApprovals = () => {
    return approvalTypes.filter(approval => {
      if (approval.id === 'communication') {
        return watchedValues?.RequireCommunicationApproval;
      }
      return watchedValues?.[approval.dateField];
    });
  };

  // Check if at least one approval is selected
  const hasSelectedApprovals = () => {
    return getSelectedApprovals().length > 0;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList, approvalType: string) => {
    if (!files.length) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Simulate upload progress
        const uploadInterval = setInterval(() => {
          setUploadProgress(prev => {
            const increment = Math.random() * 30 + 10;
            const newProgress = Math.min(prev + increment, 95);
            return newProgress;
          });
        }, 200);

        // Simulate actual upload to SharePoint
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        clearInterval(uploadInterval);
        setUploadProgress(100);

        // Add to uploaded documents
        const newDoc: UploadedDocument = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          uploadDate: new Date(),
          approvalType,
          url: `#` // Would be actual SharePoint URL
        };

        setUploadedDocuments(prev => [...prev, newDoc]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setShowUploadPanel(false);
    }
  }, []);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get documents for approval type
  const getDocumentsForApproval = (approvalType: string) => {
    return uploadedDocuments.filter(doc => doc.approvalType === approvalType);
  };

  // Summary view component
  const ApprovalsSummary = () => {
    const selectedApprovals = getSelectedApprovals();

    if (selectedApprovals.length === 0) {
      return (
        <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }}>
          <Icon iconName="WarningSolid" style={{ fontSize: '24px', color: 'var(--yellow)' }} />
          <Text variant="medium" style={{ color: 'var(--neutralSecondary)' }}>
            No approvals have been added yet
          </Text>
        </Stack>
      );
    }

    return (
      <Stack tokens={{ childrenGap: 20 }}>
        {selectedApprovals.map((approval) => {
          const approverValue = requestForm.getFieldValue(approval.approverField);
          const dateValue = requestForm.getFieldValue(approval.dateField);
          const documents = getDocumentsForApproval(approval.id);

          return (
            <Stack
              key={approval.id}
              style={{
                padding: '16px',
                border: `2px solid ${approval.color}20`,
                borderLeft: `4px solid ${approval.color}`,
                borderRadius: '8px',
                backgroundColor: `${approval.color}08`
              }}
              tokens={{ childrenGap: 12 }}
            >
              {/* Approval Header */}
              <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
                <Icon 
                  iconName={approval.icon} 
                  style={{ fontSize: '20px', color: approval.color }} 
                />
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  {approval.title}
                </Text>
                <Icon 
                  iconName="CheckMark" 
                  style={{ fontSize: '16px', color: '#107c10' }} 
                />
              </Stack>

              {/* Approval Details */}
              <Stack tokens={{ childrenGap: 8 }}>
                {approverValue && (
                  <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                    <Text variant="small" style={{ minWidth: '80px', color: 'var(--neutralSecondary)' }}>
                      Approved by:
                    </Text>
                    <Persona
                      text={approverValue.title || approverValue}
                      size={PersonaSize.size24}
                      hidePersonaDetails={false}
                    />
                  </Stack>
                )}
                
                {dateValue && (
                  <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                    <Text variant="small" style={{ minWidth: '80px', color: 'var(--neutralSecondary)' }}>
                      Date:
                    </Text>
                    <Text variant="small">
                      {new Date(dateValue).toLocaleDateString()}
                    </Text>
                  </Stack>
                )}

                {documents.length > 0 && (
                  <Stack tokens={{ childrenGap: 4 }}>
                    <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
                      Supporting Documents:
                    </Text>
                    <Stack tokens={{ childrenGap: 4 }}>
                      {documents.map(doc => (
                        <Stack key={doc.id} horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                          <Icon iconName="Attach" style={{ fontSize: '12px', color: 'var(--themePrimary)' }} />
                          <Link href={doc.url} style={{ fontSize: '12px' }}>
                            {doc.name}
                          </Link>
                          <Text variant="tiny" style={{ color: 'var(--neutralSecondary)' }}>
                            ({formatFileSize(doc.size)})
                          </Text>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Stack>
          );
        })}

        {/* Summary Stats */}
        <Stack
          horizontal
          horizontalAlign="space-between"
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--neutralLighter)',
            borderRadius: '6px'
          }}
        >
          <Text variant="small" style={{ fontWeight: 500 }}>
            Total Approvals: {selectedApprovals.length}
          </Text>
          <Text variant="small" style={{ fontWeight: 500 }}>
            Documents: {uploadedDocuments.length}
          </Text>
        </Stack>
      </Stack>
    );
  };

  // Edit form component
  const ApprovalsForm = () => (
    <Stack tokens={{ childrenGap: 24 }}>
      
      {/* Instructions */}
      <MessageBar messageBarType={MessageBarType.info}>
        <Text variant="medium" style={{ fontWeight: 600 }}>
          Select Required Approvals
        </Text>
        <Text variant="small">
          Choose at least one approval type and provide the approval details and supporting documentation. 
          All approvals must be obtained before submitting your request.
        </Text>
      </MessageBar>

      {/* Approval Types Grid */}
      <Stack tokens={{ childrenGap: 16 }}>
        <Text variant="medium" style={{ fontWeight: 600 }}>
          Available Approval Types
        </Text>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {approvalTypes.map((approval) => {
            const isSelected = approval.id === 'communication' 
              ? watchedValues?.RequireCommunicationApproval
              : !!watchedValues?.[approval.dateField];

            return (
              <Stack
                key={approval.id}
                style={{
                  padding: '16px',
                  border: isSelected ? `2px solid ${approval.color}` : '2px solid var(--neutralLight)',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? `${approval.color}08` : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                tokens={{ childrenGap: 12 }}
                onClick={() => {
                  if (approval.id === 'communication') {
                    // Toggle communication approval
                    const currentValue = watchedValues?.RequireCommunicationApproval;
                    requestForm.updateField('RequireCommunicationApproval', !currentValue);
                  } else {
                    // Toggle date field (if has date, remove it, otherwise set to today)
                    const currentValue = watchedValues?.[approval.dateField];
                    requestForm.updateField(approval.dateField, currentValue ? null : new Date());
                  }
                }}
              >
                {/* Selection Indicator */}
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <Checkbox
                    checked={isSelected}
                    styles={{
                      checkbox: {
                        borderColor: approval.color,
                        backgroundColor: isSelected ? approval.color : 'transparent'
                      }
                    }}
                  />
                </div>

                {/* Approval Type Header */}
                <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
                  <Icon
                    iconName={approval.icon}
                    style={{
                      fontSize: '24px',
                      color: approval.color,
                      padding: '8px',
                      backgroundColor: `${approval.color}20`,
                      borderRadius: '6px'
                    }}
                  />
                  <Stack>
                    <Text variant="medium" style={{ fontWeight: 600 }}>
                      {approval.title}
                    </Text>
                    {approval.required && (
                      <Text variant="tiny" style={{ color: 'var(--red)', fontWeight: 600 }}>
                        RECOMMENDED
                      </Text>
                    )}
                  </Stack>
                </Stack>

                {/* Description */}
                <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
                  {approval.description}
                </Text>

                {/* Help Text */}
                {approval.helpText && (
                  <Text variant="tiny" style={{ 
                    color: 'var(--neutralTertiary)', 
                    fontStyle: 'italic',
                    lineHeight: '1.3'
                  }}>
                    {approval.helpText}
                  </Text>
                )}

                {/* Examples */}
                {approval.examples && isSelected && (
                  <Stack tokens={{ childrenGap: 4 }}>
                    <Text variant="tiny" style={{ fontWeight: 500, color: approval.color }}>
                      Document Examples:
                    </Text>
                    <Stack tokens={{ childrenGap: 2 }}>
                      {approval.examples.map((example, index) => (
                        <Text key={index} variant="tiny" style={{ color: 'var(--neutralSecondary)' }}>
                          • {example}
                        </Text>
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            );
          })}
        </div>
      </Stack>

      {/* Selected Approvals Details */}
      {hasSelectedApprovals() && (
        <Stack tokens={{ childrenGap: 20 }}>
          <Separator />
          <Text variant="medium" style={{ fontWeight: 600 }}>
            Approval Details
          </Text>

          {getSelectedApprovals().map((approval) => (
            <Stack
              key={approval.id}
              style={{
                padding: '20px',
                border: `1px solid ${approval.color}40`,
                borderRadius: '8px',
                backgroundColor: `${approval.color}05`
              }}
              tokens={{ childrenGap: 16 }}
            >
              {/* Section Header */}
              <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
                <Icon iconName={approval.icon} style={{ color: approval.color, fontSize: '20px' }} />
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  {approval.title} Details
                </Text>
              </Stack>

              {/* Form Fields */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                {/* Approval Date */}
                <FormItem>
                  <FormLabel isRequired>Approval Date</FormLabel>
                  <FormValue>
                    <DatePicker
                      value={watchedValues?.[approval.dateField] ? new Date(watchedValues[approval.dateField]) : undefined}
                      onSelectDate={(date) => date && requestForm.updateField(approval.dateField, date)}
                      placeholder="Select approval date"
                      maxDate={new Date()}
                      disabled={!requestForm.canEdit()}
                      styles={{
                        textField: {
                          borderColor: approval.color
                        }
                      }}
                    />
                  </FormValue>
                  <FormError error={errors[approval.dateField]?.message} />
                </FormItem>

                {/* Approver */}
                <FormItem>
                  <FormLabel isRequired>Approver</FormLabel>
                  <FormValue>
                    <PnPPeoplePicker
                      name={approval.approverField}
                      control={control}
                      context={window.spContext}
                      placeholder={`Select ${approval.title.toLowerCase()} approver`}
                      personSelectionLimit={1}
                      disabled={!requestForm.canEdit()}
                      rules={{ required: `${approval.title} approver is required` }}
                    />
                  </FormValue>
                  <FormError error={errors[approval.approverField]?.message} />
                </FormItem>
              </div>

              {/* Other Approval Title (for Other type) */}
              {approval.id === 'other' && (
                <FormItem>
                  <FormLabel isRequired>Approval Type</FormLabel>
                  <FormValue>
                    <input
                      type="text"
                      placeholder="e.g., CEO Approval, Board Approval, etc."
                      value={watchedValues?.OtherApproverTitle || ''}
                      onChange={(e) => requestForm.updateField('OtherApproverTitle', e.target.value)}
                      disabled={!requestForm.canEdit()}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${approval.color}`,
                        borderRadius: '4px'
                      }}
                    />
                  </FormValue>
                  <FormError error={errors.OtherApproverTitle?.message} />
                </FormItem>
              )}

              {/* Document Upload Section */}
              <Stack tokens={{ childrenGap: 12 }}>
                <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                  <Text variant="small" style={{ fontWeight: 600 }}>
                    Supporting Documents
                  </Text>
                  <DefaultButton
                    text="Upload Documents"
                    iconProps={{ iconName: 'CloudUpload' }}
                    onClick={() => {
                      setSelectedApprovalType(approval.id);
                      setShowUploadPanel(true);
                    }}
                    disabled={!requestForm.canEdit()}
                    styles={{
                      root: { borderColor: approval.color },
                      label: { color: approval.color }
                    }}
                  />
                </Stack>

                {/* Uploaded Documents List */}
                {getDocumentsForApproval(approval.id).length > 0 && (
                  <Stack 
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid var(--neutralLight)',
                      borderRadius: '4px',
                      padding: '12px'
                    }}
                    tokens={{ childrenGap: 8 }}
                  >
                    {getDocumentsForApproval(approval.id).map(doc => (
                      <Stack key={doc.id} horizontal horizontalAlign="space-between" verticalAlign="center">
                        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                          <Icon iconName="Attach" style={{ color: 'var(--themePrimary)' }} />
                          <Link href={doc.url}>{doc.name}</Link>
                          <Text variant="tiny" style={{ color: 'var(--neutralSecondary)' }}>
                            ({formatFileSize(doc.size)})
                          </Text>
                        </Stack>
                        <Text variant="tiny" style={{ color: 'var(--neutralSecondary)' }}>
                          {doc.uploadDate.toLocaleDateString()}
                        </Text>
                      </Stack>
                    ))}
                  </Stack>
                )}

                <Text variant="tiny" style={{ color: 'var(--neutralSecondary)', fontStyle: 'italic' }}>
                  Upload documents that prove this approval was obtained (emails, signed forms, meeting notes, etc.)
                </Text>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}

      {/* Validation Message */}
      {!hasSelectedApprovals() && (
        <MessageBar messageBarType={MessageBarType.warning}>
          <Text variant="medium" style={{ fontWeight: 600 }}>
            At least one approval is required
          </Text>
          <Text variant="small">
            Please select and complete at least one approval type before submitting your request.
          </Text>
        </MessageBar>
      )}

    </Stack>
  );

  return (
    <>
      <Card
        id="approvals-card"
        variant="default"
        size="large"
        allowExpand={true}
        persist={true}
      >
        <Header>
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Icon iconName="Completed" style={{ color: 'var(--green)' }} />
              <Text variant="medium" style={{ fontWeight: 600 }}>
                Approvals Required
              </Text>
              {hasSelectedApprovals() && (
                <Text 
                  variant="small" 
                  style={{ 
                    backgroundColor: 'var(--green)', 
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px'
                  }}
                >
                  {getSelectedApprovals().length} Selected
                </Text>
              )}
            </Stack>
            
            {/* Edit/View Toggle */}
            {isSubmitted && requestForm.canEdit() && (
              <TooltipHost content={isEditMode ? 'Switch to summary view' : 'Edit approvals'}>
                <IconButton
                  iconProps={{ iconName: isEditMode ? 'ReadingMode' : 'Edit' }}
                  title={isEditMode ? 'View Summary' : 'Edit Approvals'}
                  onClick={() => setIsEditMode(!isEditMode)}
                  styles={{
                    root: { color: 'var(--themePrimary)' },
                    rootHovered: { backgroundColor: 'var(--themeLighter)' }
                  }}
                />
              </TooltipHost>
            )}
          </Stack>
        </Header>
        
        <Content padding="spacious">
          {isEditMode ? <ApprovalsForm /> : <ApprovalsSummary />}
        </Content>
      </Card>

      {/* Upload Panel */}
      <Panel
        isOpen={showUploadPanel}
        onDismiss={() => setShowUploadPanel(false)}
        type={PanelType.medium}
        headerText="Upload Approval Documents"
        closeButtonAriaLabel="Close"
      >
        <Stack tokens={{ childrenGap: 20 }}>
          {selectedApprovalType && (
            <>
              <Stack tokens={{ childrenGap: 12 }}>
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  {approvalTypes.find(a => a.id === selectedApprovalType)?.title}
                </Text>
                <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
                  Upload documents that prove this approval was obtained
                </Text>
              </Stack>

              {/* File Upload Area */}
              <Stack
                style={{
                  border: '2px dashed var(--themePrimary)',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--themeLighterAlt)',
                  cursor: 'pointer'
                }}
                tokens={{ childrenGap: 12 }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Icon iconName="CloudUpload" style={{ fontSize: '48px', color: 'var(--themePrimary)' }} />
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  Drop files here or click to browse
                </Text>
                <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
                  Supported formats: PDF, DOC, DOCX, PNG, JPG (Max 10MB each)
                </Text>
                
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files, selectedApprovalType)}
                />
              </Stack>

              {/* Upload Progress */}
              {isUploading && (
                <Stack tokens={{ childrenGap: 8 }}>
                  <Text variant="small">Uploading documents...</Text>
                  <ProgressIndicator percentComplete={uploadProgress / 100} />
                </Stack>
              )}

              {/* Action Buttons */}
              <Stack horizontal tokens={{ childrenGap: 12 }}>
                <PrimaryButton
                  text="Done"
                  onClick={() => setShowUploadPanel(false)}
                  disabled={isUploading}
                />
                <DefaultButton
                  text="Cancel"
                  onClick={() => setShowUploadPanel(false)}
                  disabled={isUploading}
                />
              </Stack>
            </>
          )}
        </Stack>
      </Panel>
    </>
  );
};
```


```
// components/RequestForm/FormActions.tsx
import React, { useState } from 'react';
import {
  Stack,
  PrimaryButton,
  DefaultButton,
  CompoundButton,
  IconButton,
  Text,
  Icon,
  TooltipHost,
  Dialog,
  DialogType,
  DialogFooter,
  TextField,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Separator,
  ProgressIndicator
} from '@fluentui/react';
import { RequestAccess } from '../../models/RequestAccess';
import { useRequestForm, useFormValidation } from '../../hooks';
import { RequestStatus } from '../../models/Request';

interface FormActionsProps {
  onSaveSuccess?: () => void;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

interface ConfirmationDialogState {
  isOpen: boolean;
  type: 'cancel' | 'hold' | 'resume' | null;
  title: string;
  message: string;
  requiresReason: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onSaveSuccess,
  onSubmitSuccess,
  onCancel
}) => {
  const requestForm = useRequestForm();
  const formValidation = useFormValidation();
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogState>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    requiresReason: false
  });
  const [reason, setReason] = useState('');
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // Get current status for action availability
  const currentStatus = requestForm.getFieldValue('Status') || RequestStatus.Draft;
  const requestAccess = requestForm.requestAccess;

  // Action handlers
  const handleSaveAsDraft = async () => {
    const success = await requestForm.saveAsDraft();
    if (success && onSaveSuccess) {
      onSaveSuccess();
    }
  };

  const handleSubmit = async () => {
    // Validate form first
    const validation = formValidation.validateForSubmission();
    if (!validation.isValid) {
      setShowValidationSummary(true);
      return;
    }

    const success = await requestForm.submitRequest();
    if (success && onSubmitSuccess) {
      onSubmitSuccess();
    }
  };

  const handleAssignAttorney = async () => {
    // TODO: Open attorney selection dialog
    const success = await requestForm.assignAttorney('attorney-id', 'Assignment notes');
    if (success) {
      // Refresh or show success message
    }
  };

  const handleSubmitToAssignAttorney = async () => {
    const success = await requestForm.submitToAssignAttorney('Needs committee review');
    if (success) {
      // Refresh or show success message
    }
  };

  const handleSubmitLegalReview = async () => {
    // TODO: Get review outcome and notes from form
    const success = await requestForm.submitLegalReview('Approved', 'Review completed successfully');
    if (success) {
      // Refresh or show success message
    }
  };

  const handleSubmitComplianceReview = async () => {
    // TODO: Get review outcome and notes from form
    const success = await requestForm.submitComplianceReview('Approved', 'Compliance review completed', false, false);
    if (success) {
      // Refresh or show success message
    }
  };

  const handleCloseout = async () => {
    // TODO: Get tracking ID from form
    const success = await requestForm.closeoutRequest('TRK-2024-001');
    if (success) {
      // Refresh or show success message
    }
  };

  // Confirmation dialog handlers
  const openConfirmationDialog = (
    type: 'cancel' | 'hold' | 'resume',
    title: string,
    message: string,
    requiresReason: boolean = true
  ) => {
    setConfirmationDialog({
      isOpen: true,
      type,
      title,
      message,
      requiresReason
    });
    setReason('');
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog({
      isOpen: false,
      type: null,
      title: '',
      message: '',
      requiresReason: false
    });
    setReason('');
  };

  const executeConfirmedAction = async () => {
    let success = false;

    switch (confirmationDialog.type) {
      case 'cancel':
        success = await requestForm.cancelRequest(reason);
        break;
      case 'hold':
        success = await requestForm.holdRequest(reason);
        break;
      case 'resume':
        success = await requestForm.resumeRequest();
        break;
    }

    if (success) {
      closeConfirmationDialog();
      if (confirmationDialog.type === 'cancel' && onCancel) {
        onCancel();
      }
    }
  };

  // Get action button style based on importance
  const getActionButtonProps = (actionType: 'primary' | 'secondary' | 'danger' | 'warning') => {
    const baseStyles = {
      root: { 
        minWidth: '120px',
        height: '36px'
      }
    };

    switch (actionType) {
      case 'primary':
        return {
          ...baseStyles,
          styles: {
            ...baseStyles,
            root: {
              ...baseStyles.root,
              backgroundColor: 'var(--themePrimary)',
              borderColor: 'var(--themePrimary)'
            }
          }
        };
      case 'danger':
        return {
          ...baseStyles,
          styles: {
            ...baseStyles,
            root: {
              ...baseStyles.root,
              backgroundColor: 'var(--red)',
              borderColor: 'var(--red)',
              color: 'white'
            },
            rootHovered: {
              backgroundColor: 'var(--redDark)',
              borderColor: 'var(--redDark)'
            }
          }
        };
      case 'warning':
        return {
          ...baseStyles,
          styles: {
            ...baseStyles,
            root: {
              ...baseStyles.root,
              backgroundColor: 'var(--yellow)',
              borderColor: 'var(--yellow)',
              color: 'var(--neutralPrimary)'
            },
            rootHovered: {
              backgroundColor: 'var(--yellowDark)',
              borderColor: 'var(--yellowDark)'
            }
          }
        };
      default:
        return baseStyles;
    }
  };

  // Progress indicator for current stage
  const getProgressInfo = () => {
    const statusOrder = ['Draft', 'Legal Intake', 'Assign Attorney', 'In Review', 'Closeout', 'Completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const progress = ((currentIndex + 1) / statusOrder.length) * 100;

    return {
      progress,
      currentStage: currentStatus,
      nextStage: statusOrder[currentIndex + 1] || 'Completed'
    };
  };

  const progressInfo = getProgressInfo();

  return (
    <>
      <Stack
        style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          position: 'sticky',
          bottom: '20px',
          zIndex: 10
        }}
        tokens={{ childrenGap: 20 }}
      >
        {/* Progress Indicator */}
        <Stack tokens={{ childrenGap: 8 }}>
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
            <Text variant="small" style={{ fontWeight: 600 }}>
              Request Progress
            </Text>
            <Text variant="small" style={{ color: 'var(--neutralSecondary)' }}>
              {progressInfo.currentStage} → {progressInfo.nextStage}
            </Text>
          </Stack>
          <ProgressIndicator
            percentComplete={progressInfo.progress / 100}
            styles={{
              progressBar: {
                backgroundColor: 'var(--themePrimary)'
              }
            }}
          />
        </Stack>

        <Separator />

        {/* Primary Actions */}
        <Stack tokens={{ childrenGap: 16 }}>
          <Text variant="medium" style={{ fontWeight: 600 }}>
            Available Actions
          </Text>

          {/* Action Buttons Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px'
          }}>
            
            {/* Save as Draft */}
            {requestAccess.formActions.showSaveAsDraft && (
              <TooltipHost content="Save your progress without submitting">
                <PrimaryButton
                  text="Save as Draft"
                  iconProps={{ iconName: 'Save' }}
                  onClick={handleSaveAsDraft}
                  disabled={requestForm.isSaving || !requestForm.isDirty}
                  {...getActionButtonProps('secondary')}
                />
              </TooltipHost>
            )}

            {/* Submit Request */}
            {requestAccess.formActions.showSubmit && (
              <TooltipHost content="Submit request for review">
                <PrimaryButton
                  text="Submit Request"
                  iconProps={{ iconName: 'Forward' }}
                  onClick={handleSubmit}
                  disabled={requestForm.isSaving || !formValidation.isFormValid}
                  {...getActionButtonProps('primary')}
                />
              </TooltipHost>
            )}

            {/* Assign Attorney */}
            {requestAccess.formActions.showAssignAttorney && (
              <TooltipHost content="Assign attorney directly">
                <CompoundButton
                  text="Assign Attorney"
                  secondaryText="Direct assignment"
                  iconProps={{ iconName: 'People' }}
                  onClick={handleAssignAttorney}
                  disabled={requestForm.isSaving}
                  {...getActionButtonProps('primary')}
                />
              </TooltipHost>
            )}

            {/* Submit to Assign Attorney */}
            {requestAccess.formActions.showSubmitToAssignAttorney && (
              <TooltipHost content="Send to committee for attorney assignment">
                <CompoundButton
                  text="Send to Committee"
                  secondaryText="For attorney assignment"
                  iconProps={{ iconName: 'PeopleAdd' }}
                  onClick={handleSubmitToAssignAttorney}
                  disabled={requestForm.isSaving}
                  {...getActionButtonProps('secondary')}
                />
              </TooltipHost>
            )}

            {/* Submit Legal Review */}
            {requestAccess.formActions.showSubmitLegalReview && (
              <TooltipHost content="Complete legal review">
                <PrimaryButton
                  text="Submit Legal Review"
                  iconProps={{ iconName: 'ComplianceAudit' }}
                  onClick={handleSubmitLegalReview}
                  disabled={requestForm.isSaving}
                  {...getActionButtonProps('primary')}
                />
              </TooltipHost>
            )}

            {/* Submit Compliance Review */}
            {requestAccess.formActions.showSubmitComplianceReview && (
              <TooltipHost content="Complete compliance review">
                <PrimaryButton
                  text="Submit Compliance Review"
                  iconProps={{ iconName: 'Shield' }}
                  onClick={handleSubmitComplianceReview}
                  disabled={requestForm.isSaving}
                  {...getActionButtonProps('primary')}
                />
              </TooltipHost>
            )}

            {/* Closeout Request */}
            {requestAccess.formActions.showCloseout && (
              <TooltipHost content="Close out completed request">
                <PrimaryButton
                  text="Closeout Request"
                  iconProps={{ iconName: 'Completed' }}
                  onClick={handleCloseout}
                  disabled={requestForm.isSaving}
                  {...getActionButtonProps('primary')}
                />
              </TooltipHost>
            )}

          </div>
        </Stack>

        {/* Secondary Actions */}
        {(requestAccess.formActions.showHoldRequest || 
          requestAccess.formActions.showCancelRequest || 
          requestAccess.formActions.showResumeRequest) && (
          <>
            <Separator />
            <Stack tokens={{ childrenGap: 12 }}>
              <Text variant="small" style={{ fontWeight: 600, color: 'var(--neutralSecondary)' }}>
                Request Management
              </Text>
              
              <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
                
                {/* Hold Request */}
                {requestAccess.formActions.showHoldRequest && (
                  <DefaultButton
                    text="Put on Hold"
                    iconProps={{ iconName: 'Pause' }}
                    onClick={() => openConfirmationDialog(
                      'hold',
                      'Put Request on Hold',
                      'This will pause the request workflow. You can resume it later.',
                      true
                    )}
                    disabled={requestForm.isSaving}
                    {...getActionButtonProps('warning')}
                  />
                )}

                {/* Resume Request */}
                {requestAccess.formActions.showResumeRequest && (
                  <DefaultButton
                    text="Resume Request"
                    iconProps={{ iconName: 'Play' }}
                    onClick={() => openConfirmationDialog(
                      'resume',
                      'Resume Request',
                      'This will continue the request workflow from where it was paused.',
                      false
                    )}
                    disabled={requestForm.isSaving}
                    {...getActionButtonProps('primary')}
                  />
                )}

                {/* Cancel Request */}
                {requestAccess.formActions.showCancelRequest && (
                  <DefaultButton
                    text="Cancel Request"
                    iconProps={{ iconName: 'Cancel' }}
                    onClick={() => openConfirmationDialog(
                      'cancel',
                      'Cancel Request',
                      'This action cannot be undone. The request will be permanently cancelled.',
                      true
                    )}
                    disabled={requestForm.isSaving}
                    {...getActionButtonProps('danger')}
                  />
                )}

              </Stack>
            </Stack>
          </>
        )}

        {/* Loading Indicator */}
        {requestForm.isSaving && (
          <>
            <Separator />
            <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
              <Spinner size={SpinnerSize.small} />
              <Text variant="small">Processing request...</Text>
            </Stack>
          </>
        )}

        {/* Form Status Summary */}
        <Stack
          horizontal
          horizontalAlign="space-between"
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--neutralLighter)',
            borderRadius: '6px'
          }}
        >
          <Stack horizontal tokens={{ childrenGap: 16 }} verticalAlign="center">
            <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
              <Icon 
                iconName={requestForm.isDirty ? 'Edit' : 'CheckMark'} 
                style={{ 
                  color: requestForm.isDirty ? 'var(--yellow)' : 'var(--green)',
                  fontSize: '12px'
                }} 
              />
              <Text variant="tiny">
                {requestForm.isDirty ? 'Unsaved changes' : 'All changes saved'}
              </Text>
            </Stack>
            
            <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
              <Icon 
                iconName={formValidation.isFormValid ? 'CheckMark' : 'Warning'} 
                style={{ 
                  color: formValidation.isFormValid ? 'var(--green)' : 'var(--red)',
                  fontSize: '12px'
                }} 
              />
              <Text variant="tiny">
                {formValidation.isFormValid ? 'Validation passed' : `${formValidation.validationState.errors.length} errors`}
              </Text>
            </Stack>
          </Stack>

          {requestForm.lastSaveTime && (
            <Text variant="tiny" style={{ color: 'var(--neutralSecondary)' }}>
              Last saved: {new Date(requestForm.lastSaveTime).toLocaleString()}
            </Text>
          )}
        </Stack>

        {/* Validation Summary Toggle */}
        {!formValidation.isFormValid && (
          <Stack>
            <DefaultButton
              text={`Show Validation Issues (${formValidation.validationState.errors.length})`}
              iconProps={{ iconName: showValidationSummary ? 'ChevronUp' : 'ChevronDown' }}
              onClick={() => setShowValidationSummary(!showValidationSummary)}
              styles={{ root: { alignSelf: 'flex-start' } }}
            />
            
            {showValidationSummary && (
              <MessageBar messageBarType={MessageBarType.error} isMultiline>
                <Text variant="small" style={{ fontWeight: 600 }}>
                  Please resolve the following issues:
                </Text>
                <Stack tokens={{ childrenGap: 4 }}>
                  {formValidation.validationState.errors.map((error, index) => (
                    <Text key={index} variant="small">• {error}</Text>
                  ))}
                </Stack>
              </MessageBar>
            )}
          </Stack>
        )}

      </Stack>

      {/* Confirmation Dialog */}
      <Dialog
        hidden={!confirmationDialog.isOpen}
        onDismiss={closeConfirmationDialog}
        dialogContentProps={{
          type: DialogType.normal,
          title: confirmationDialog.title,
          subText: confirmationDialog.message
        }}
        maxWidth={480}
      >
        {confirmationDialog.requiresReason && (
          <Stack tokens={{ childrenGap: 12 }}>
            <TextField
              label="Reason (Required)"
              multiline
              rows={3}
              value={reason}
              onChange={(_, newValue) => setReason(newValue || '')}
              placeholder="Please provide a reason for this action..."
              required
            />
          </Stack>
        )}

        <DialogFooter>
          <PrimaryButton
            text="Confirm"
            onClick={executeConfirmedAction}
            disabled={confirmationDialog.requiresReason && !reason.trim()}
          />
          <DefaultButton
            text="Cancel"
            onClick={closeConfirmationDialog}
          />
        </DialogFooter>
      </Dialog>
    </>
  );
};
```

```
/* Enhanced PnP List Item Comments Styling */
/* Place this in your global CSS or component-specific SCSS file */

/* ==================== COMMENTS CONTAINER ==================== */
.ms-CommentsWrapper {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif !important;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}

/* ==================== COMMENT INPUT AREA ==================== */
.ms-CommentBox {
  background: white !important;
  border: 2px solid var(--neutralLight, #edebe9) !important;
  border-radius: 8px !important;
  margin-bottom: 16px !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}

.ms-CommentBox:hover {
  border-color: var(--themePrimary, #0078d4) !important;
  box-shadow: 0 2px 8px rgba(0, 120, 212, 0.15) !important;
}

.ms-CommentBox:focus-within {
  border-color: var(--themePrimary, #0078d4) !important;
  box-shadow: 0 0 0 1px var(--themePrimary, #0078d4) !important;
}

/* Comment Input Text Area */
.ms-CommentBox textarea,
.ms-CommentBox .ms-TextField-field {
  border: none !important;
  background: transparent !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  padding: 12px 16px !important;
  resize: vertical !important;
  min-height: 80px !important;
  font-family: inherit !important;
}

.ms-CommentBox textarea:focus,
.ms-CommentBox .ms-TextField-field:focus {
  outline: none !important;
  box-shadow: none !important;
}

.ms-CommentBox textarea::placeholder,
.ms-CommentBox .ms-TextField-field::placeholder {
  color: var(--neutralSecondary, #605e5c) !important;
  font-style: normal !important;
}

/* Comment Input Actions */
.ms-CommentBox-actions {
  padding: 8px 16px 12px !important;
  border-top: 1px solid var(--neutralLighter, #f3f2f1) !important;
  background: var(--neutralLighterAlt, #faf9f8) !important;
  border-radius: 0 0 8px 8px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

/* Comment Submit Button */
.ms-CommentBox .ms-Button--primary {
  background: var(--themePrimary, #0078d4) !important;
  border: none !important;
  border-radius: 4px !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  height: 32px !important;
  padding: 0 16px !important;
  transition: all 0.2s ease !important;
}

.ms-CommentBox .ms-Button--primary:hover {
  background: var(--themeDarkAlt, #106ebe) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 120, 212, 0.3) !important;
}

.ms-CommentBox .ms-Button--primary:disabled {
  background: var(--neutralTertiary, #a19f9d) !important;
  transform: none !important;
  box-shadow: none !important;
}

/* Cancel Button */
.ms-CommentBox .ms-Button--default {
  border: 1px solid var(--neutralTertiary, #a19f9d) !important;
  background: white !important;
  border-radius: 4px !important;
  font-size: 13px !important;
  height: 32px !important;
  margin-right: 8px !important;
  transition: all 0.2s ease !important;
}

.ms-CommentBox .ms-Button--default:hover {
  border-color: var(--themePrimary, #0078d4) !important;
  color: var(--themePrimary, #0078d4) !important;
  background: var(--themeLighterAlt, #eff6fc) !important;
}

/* ==================== COMMENTS LIST ==================== */
.ms-CommentsList {
  background: transparent !important;
  padding: 0 !important;
}

/* Individual Comment */
.ms-CommentItem {
  background: white !important;
  border: 1px solid var(--neutralLight, #edebe9) !important;
  border-radius: 12px !important;
  margin-bottom: 12px !important;
  padding: 16px !important;
  transition: all 0.2s ease !important;
  position: relative !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}

.ms-CommentItem:hover {
  border-color: var(--neutralTertiaryAlt, #c8c6c4) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  transform: translateY(-1px) !important;
}

/* Comment Header */
.ms-CommentItem-header {
  display: flex !important;
  align-items: center !important;
  margin-bottom: 8px !important;
  padding-bottom: 8px !important;
  border-bottom: 1px solid var(--neutralLighter, #f3f2f1) !important;
}

/* Author Information */
.ms-CommentItem .ms-Persona {
  margin-right: 12px !important;
}

.ms-CommentItem .ms-Persona-primaryText {
  font-weight: 600 !important;
  font-size: 14px !important;
  color: var(--neutralPrimary, #323130) !important;
}

.ms-CommentItem .ms-Persona-secondaryText {
  font-size: 12px !important;
  color: var(--neutralSecondary, #605e5c) !important;
}

/* Comment Timestamp */
.ms-CommentItem-timestamp {
  font-size: 12px !important;
  color: var(--neutralSecondary, #605e5c) !important;
  margin-left: auto !important;
  font-weight: 400 !important;
}

.ms-CommentItem-timestamp::before {
  content: "•" !important;
  margin: 0 8px !important;
  color: var(--neutralTertiary, #a19f9d) !important;
}

/* Comment Content */
.ms-CommentItem-content {
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: var(--neutralPrimary, #323130) !important;
  margin: 12px 0 !important;
  word-wrap: break-word !important;
}

/* Preserve line breaks and formatting */
.ms-CommentItem-content p {
  margin: 0 0 8px 0 !important;
}

.ms-CommentItem-content p:last-child {
  margin-bottom: 0 !important;
}

/* ==================== COMMENT ACTIONS ==================== */
.ms-CommentItem-actions {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin-top: 8px !important;
  padding-top: 8px !important;
  border-top: 1px solid var(--neutralLighter, #f3f2f1) !important;
}

/* Like Button */
.ms-CommentItem .ms-Button--action {
  background: transparent !important;
  border: none !important;
  color: var(--neutralSecondary, #605e5c) !important;
  font-size: 12px !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  transition: all 0.2s ease !important;
  min-width: auto !important;
  height: auto !important;
}

.ms-CommentItem .ms-Button--action:hover {
  background: var(--neutralLighter, #f3f2f1) !important;
  color: var(--themePrimary, #0078d4) !important;
}

.ms-CommentItem .ms-Button--action.is-liked {
  color: var(--red, #d13438) !important;
}

/* Reply Button */
.ms-CommentItem .ms-Button--reply {
  background: transparent !important;
  border: none !important;
  color: var(--themePrimary, #0078d4) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  transition: all 0.2s ease !important;
}

.ms-CommentItem .ms-Button--reply:hover {
  background: var(--themeLighterAlt, #eff6fc) !important;
  color: var(--themeDarkAlt, #106ebe) !important;
}

/* ==================== THREADED REPLIES ==================== */
.ms-CommentItem-replies {
  margin-top: 12px !important;
  padding-left: 32px !important;
  border-left: 2px solid var(--neutralLighter, #f3f2f1) !important;
  position: relative !important;
}

.ms-CommentItem-replies::before {
  content: '' !important;
  position: absolute !important;
  left: -2px !important;
  top: 0 !important;
  width: 2px !important;
  height: 20px !important;
  background: var(--themePrimary, #0078d4) !important;
  border-radius: 1px !important;
}

/* Nested Reply */
.ms-CommentItem-replies .ms-CommentItem {
  background: var(--neutralLighterAlt, #faf9f8) !important;
  border: 1px solid var(--neutralLighter, #f3f2f1) !important;
  margin-bottom: 8px !important;
  padding: 12px !important;
}

/* ==================== MENTIONS ==================== */
.ms-CommentItem .ms-Mention {
  background: var(--themeLighterAlt, #eff6fc) !important;
  color: var(--themePrimary, #0078d4) !important;
  border: 1px solid var(--themeLight, #c7e0f4) !important;
  border-radius: 3px !important;
  padding: 2px 4px !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  transition: all 0.2s ease !important;
}

.ms-CommentItem .ms-Mention:hover {
  background: var(--themeLighter, #deecf9) !important;
  color: var(--themeDarkAlt, #106ebe) !important;
}

/* ==================== LOADING AND EMPTY STATES ==================== */
.ms-CommentsLoading {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 40px 20px !important;
  color: var(--neutralSecondary, #605e5c) !important;
}

.ms-CommentsEmpty {
  text-align: center !important;
  padding: 40px 20px !important;
  color: var(--neutralSecondary, #605e5c) !important;
  background: var(--neutralLighterAlt, #faf9f8) !important;
  border-radius: 8px !important;
  border: 2px dashed var(--neutralTertiary, #a19f9d) !important;
}

.ms-CommentsEmpty::before {
  content: "💬" !important;
  display: block !important;
  font-size: 32px !important;
  margin-bottom: 12px !important;
  opacity: 0.5 !important;
}

/* ==================== RESPONSIVE DESIGN ==================== */
@media (max-width: 768px) {
  .ms-CommentItem {
    padding: 12px !important;
    margin-bottom: 8px !important;
  }
  
  .ms-CommentItem-replies {
    padding-left: 20px !important;
  }
  
  .ms-CommentBox textarea,
  .ms-CommentBox .ms-TextField-field {
    min-height: 60px !important;
    font-size: 16px !important; /* Prevents zoom on iOS */
  }
  
  .ms-CommentBox-actions {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
  }
  
  .ms-CommentBox .ms-Button--primary,
  .ms-CommentBox .ms-Button--default {
    width: 100% !important;
    margin: 0 !important;
  }
}

/* ==================== DARK MODE SUPPORT ==================== */
@media (prefers-color-scheme: dark) {
  .ms-CommentItem {
    background: #2d2d30 !important;
    border-color: #3e3e42 !important;
    color: #cccccc !important;
  }
  
  .ms-CommentItem-content {
    color: #cccccc !important;
  }
  
  .ms-CommentBox {
    background: #2d2d30 !important;
    border-color: #3e3e42 !important;
  }
  
  .ms-CommentBox textarea,
  .ms-CommentBox .ms-TextField-field {
    color: #cccccc !important;
    background: transparent !important;
  }
}

/* ==================== ACCESSIBILITY ENHANCEMENTS ==================== */
.ms-CommentItem:focus-within {
  outline: 2px solid var(--themePrimary, #0078d4) !important;
  outline-offset: 2px !important;
}

.ms-CommentBox:focus-within {
  outline: none !important; /* We handle this with border */
}

/* High contrast mode support */
@media (forced-colors: active) {
  .ms-CommentItem {
    border: 1px solid ButtonBorder !important;
    background: ButtonFace !important;
  }
  
  .ms-CommentBox {
    border: 2px solid ButtonBorder !important;
    background: ButtonFace !important;
  }
  
  .ms-CommentBox .ms-Button--primary {
    background: Highlight !important;
    color: HighlightText !important;
    border: 1px solid ButtonBorder !important;
  }
}

/* ==================== CUSTOM ANIMATIONS ==================== */
.ms-CommentItem {
  animation: commentSlideIn 0.3s ease-out !important;
}

@keyframes commentSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth transitions for hover effects */
.ms-CommentItem,
.ms-CommentBox,
.ms-CommentBox .ms-Button--primary,
.ms-CommentBox .ms-Button--default {
  transition: all 0.2s ease !important;
}

/* ==================== SCROLL IMPROVEMENTS ==================== */
.ms-CommentsList {
  max-height: 500px !important;
  overflow-y: auto !important;
  scrollbar-width: thin !important;
  scrollbar-color: var(--neutralTertiary, #a19f9d) var(--neutralLighter, #f3f2f1) !important;
}

.ms-CommentsList::-webkit-scrollbar {
  width: 6px !important;
}

.ms-CommentsList::-webkit-scrollbar-track {
  background: var(--neutralLighter, #f3f2f1) !important;
  border-radius: 3px !important;
}

.ms-CommentsList::-webkit-scrollbar-thumb {
  background: var(--neutralTertiary, #a19f9d) !important;
  border-radius: 3px !important;
}

.ms-CommentsList::-webkit-scrollbar-thumb:hover {
  background: var(--neutralSecondary, #605e5c) !important;
}
```
