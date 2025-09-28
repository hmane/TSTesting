// components/RequestForm/Approvals.tsx
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import {
  Stack,
  Text,
  IconButton,
  Separator,
  Icon,
  TooltipHost,
  useTheme,
  MessageBar,
  MessageBarType,
  DefaultButton,
  PrimaryButton,
  Dropdown,
  IDropdownOption,
  Toggle,
  DocumentCard,
  DocumentCardTitle,
  DocumentCardDetails,
  DocumentCardActions,
} from '@fluentui/react';
import { Control, FieldErrors, useWatch } from 'react-hook-form';
import { Request, NewRequest } from '../../models/Request';
import { RequestAccess } from '../../models/RequestAccess';
import { Card, Header, Content } from 'spfx-toolkit/lib/components/Card';
import {
  FormItem,
  FormLabel,
  FormValue,
  FormError,
  FormDescription,
  DevExtremeDateBox,
  PnPPeoplePicker,
  DevExtremeTextBox,
} from 'spfx-toolkit/lib/components/spForm';

interface ApprovalsProps {
  control: Control<Request | NewRequest>;
  errors: FieldErrors<Request | NewRequest>;
  requestAccess: RequestAccess;
  isSubmitted: boolean;
}

// Available approval types
const APPROVAL_TYPES = [
  {
    key: 'portfolio',
    text: 'Portfolio Manager Approval',
    description: 'Required for investment-related materials',
    icon: 'Financial',
    fields: {
      dateField: 'PortfolioApprovalDate',
      approverField: 'PortfolioApprover',
      requiredField: 'RequirePortfolioApproval'
    }
  },
  {
    key: 'research',
    text: 'Research Analyst Approval',
    description: 'Required for research reports and analysis',
    icon: 'Research',
    fields: {
      dateField: 'ResearchAnalystApprovalDate',
      approverField: 'ResearchAnalyst',
      requiredField: 'RequireResearchAnalystApproval'
    }
  },
  {
    key: 'sme',
    text: 'Subject Matter Expert (SME) Approval',
    description: 'Required for technical or specialized content',
    icon: 'ContactCard',
    fields: {
      dateField: 'SMEApprovalDate',
      approverField: 'SME',
      requiredField: 'RequireSMEApproval'
    }
  },
  {
    key: 'performance',
    text: 'Performance Review Approval',
    description: 'Required for performance data and metrics',
    icon: 'BarChart4',
    fields: {
      dateField: 'PerformanceReviewApprovalDate',
      approverField: 'PerformanceReviewApprover',
      requiredField: 'RequirePerformanceApproval'
    }
  },
  {
    key: 'other',
    text: 'Other Approval',
    description: 'Custom approval type with specified title',
    icon: 'More',
    fields: {
      titleField: 'OtherApproverTitle',
      dateField: 'OtherApprovalDate',
      approverField: 'OtherApprover',
      requiredField: 'RequireOtherApproval'
    }
  }
];

const Approvals: React.FC<ApprovalsProps> = ({
  control,
  errors,
  requestAccess,
  isSubmitted,
}) => {
  const theme = useTheme();
  const [isEditMode, setIsEditMode] = useState(!isSubmitted);
  const [selectedApprovalType, setSelectedApprovalType] = useState<string>('');

  // Watch communication approval requirement
  const requireCommunicationApproval = useWatch({
    control,
    name: 'RequireCommunicationApproval'
  });

  // Watch all approval requirements to track which are selected
  const approvalRequirements = useWatch({
    control,
    name: [
      'RequireCommunicationApproval',
      'RequirePortfolioApproval',
      'RequireResearchAnalystApproval',
      'RequireSMEApproval',
      'RequirePerformanceApproval',
      'RequireOtherApproval'
    ]
  });

  // Calculate selected approvals
  const selectedApprovals = useMemo(() => {
    const approvals = [];
    
    if (requireCommunicationApproval) {
      approvals.push('communication');
    }
    
    APPROVAL_TYPES.forEach((type, index) => {
      if (approvalRequirements && approvalRequirements[index + 1]) {
        approvals.push(type.key);
      }
    });
    
    return approvals;
  }, [requireCommunicationApproval, approvalRequirements]);

  // Check if at least one approval is selected
  const hasRequiredApprovals = selectedApprovals.length > 0;

  // Available approval types for dropdown (exclude already selected)
  const availableApprovalTypes: IDropdownOption[] = useMemo(() => {
    return APPROVAL_TYPES
      .filter(type => !selectedApprovals.includes(type.key))
      .map(type => ({
        key: type.key,
        text: type.text,
        data: type
      }));
  }, [selectedApprovals]);

  // Handlers
  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  const handleAddApproval = useCallback(() => {
    if (selectedApprovalType) {
      const approvalType = APPROVAL_TYPES.find(type => type.key === selectedApprovalType);
      if (approvalType) {
        // Set the requirement field to true
        // This would be handled by the form control
        console.log('Adding approval:', approvalType);
        setSelectedApprovalType('');
      }
    }
  }, [selectedApprovalType]);

  const handleRemoveApproval = useCallback((approvalKey: string) => {
    // Remove the approval by setting requirement to false
    console.log('Removing approval:', approvalKey);
  }, []);

  // Only show if access is enabled
  if (!requestAccess.enableRequestInfo) {
    return null;
  }

  const canEdit = requestAccess.isCreator || requestAccess.isAdmin || requestAccess.isLegalAdmin;

  return (
    <Card
      id="approvals-card"
      variant={hasRequiredApprovals ? "default" : "warning"}
      size="large"
      allowExpand={true}
      persist={true}
    >
      <Header>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Icon 
              iconName="Permissions" 
              style={{ color: theme.palette.themePrimary, fontSize: 16 }} 
            />
            <Text variant="medium" style={{ fontWeight: 600 }}>
              Approvals Required
            </Text>
            {!hasRequiredApprovals && (
              <Icon 
                iconName="Warning" 
                style={{ color: theme.palette.yellow, fontSize: 14 }} 
              />
            )}
          </Stack>
          
          {/* Edit/View Toggle */}
          {isSubmitted && canEdit && (
            <TooltipHost content={isEditMode ? 'Switch to summary view' : 'Edit approvals'}>
              <IconButton
                iconProps={{ iconName: isEditMode ? 'ReadingMode' : 'Edit' }}
                title={isEditMode ? 'View Summary' : 'Edit Approvals'}
                onClick={handleToggleEditMode}
                styles={{
                  root: { 
                    color: theme.palette.themePrimary,
                    height: 32,
                    width: 32,
                  },
                  rootHovered: { 
                    backgroundColor: theme.palette.themeLighter,
                    color: theme.palette.themeDark,
                  }
                }}
              />
            </TooltipHost>
          )}
        </Stack>
      </Header>
      
      <Content padding="spacious">
        {isEditMode ? (
          <ApprovalsForm 
            control={control}
            errors={errors}
            selectedApprovals={selectedApprovals}
            availableApprovalTypes={availableApprovalTypes}
            selectedApprovalType={selectedApprovalType}
            onApprovalTypeChange={setSelectedApprovalType}
            onAddApproval={handleAddApproval}
            onRemoveApproval={handleRemoveApproval}
            canEdit={canEdit}
            theme={theme}
          />
        ) : (
          <ApprovalsSummary 
            selectedApprovals={selectedApprovals}
            control={control}
            theme={theme}
          />
        )}
        
        {/* Validation Message */}
        {!hasRequiredApprovals && (
          <MessageBar
            messageBarType={MessageBarType.warning}
            isMultiline={false}
            styles={{ root: { marginTop: 16 } }}
          >
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Icon iconName="Warning" />
              <Text variant="medium" style={{ fontWeight: 600 }}>
                At least one approval is required before submission
              </Text>
            </Stack>
          </MessageBar>
        )}
      </Content>
    </Card>
  );
};

// Edit Mode Component
interface ApprovalsFormProps {
  control: Control<Request | NewRequest>;
  errors: FieldErrors<Request | NewRequest>;
  selectedApprovals: string[];
  availableApprovalTypes: IDropdownOption[];
  selectedApprovalType: string;
  onApprovalTypeChange: (value: string) => void;
  onAddApproval: () => void;
  onRemoveApproval: (key: string) => void;
  canEdit: boolean;
  theme: any;
}

const ApprovalsForm: React.FC<ApprovalsFormProps> = React.memo(({
  control,
  errors,
  selectedApprovals,
  availableApprovalTypes,
  selectedApprovalType,
  onApprovalTypeChange,
  onAddApproval,
  onRemoveApproval,
  canEdit,
  theme,
}) => {
  return (
    <Stack tokens={{ childrenGap: 24 }}>
      
      {/* Communication Approval (Always Visible) */}
      <Stack tokens={{ childrenGap: 16 }}>
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
          <Icon 
            iconName="MegaphoneOutline" 
            style={{ color: theme.palette.themePrimary, fontSize: 20 }} 
          />
          <Text 
            variant="medium" 
            style={{ 
              fontWeight: 600, 
              color: theme.palette.themePrimary,
            }}
          >
            Communication Approval
          </Text>
        </Stack>
        
        <FormItem>
          <FormLabel>Is Communication Approval Required?</FormLabel>
          <FormValue>
            <Toggle
              onText="Yes"
              offText="No"
              // checked={requireCommunicationApproval}
              // onChange={(ev, checked) => setValue('RequireCommunicationApproval', checked)}
              disabled={!canEdit}
            />
          </FormValue>
          <FormDescription>
            Required for all marketing communications and promotional materials
          </FormDescription>
        </FormItem>

        {selectedApprovals.includes('communication') && (
          <CommunicationApprovalFields
            control={control}
            errors={errors}
            canEdit={canEdit}
            theme={theme}
          />
        )}
      </Stack>

      <Separator />

      {/* Additional Approvals Section */}
      <Stack tokens={{ childrenGap: 16 }}>
        <Text 
          variant="medium" 
          style={{ 
            fontWeight: 600, 
            color: theme.palette.themePrimary,
            borderBottom: `1px solid ${theme.palette.neutralLighter}`,
            paddingBottom: 8,
          }}
        >
          Additional Approvals
        </Text>

        {/* Selected Approvals List */}
        {selectedApprovals.filter(approval => approval !== 'communication').length > 0 && (
          <Stack tokens={{ childrenGap: 12 }}>
            {selectedApprovals
              .filter(approval => approval !== 'communication')
              .map(approvalKey => {
                const approvalType = APPROVAL_TYPES.find(type => type.key === approvalKey);
                if (!approvalType) return null;

                return (
                  <ApprovalCard
                    key={approvalKey}
                    approvalType={approvalType}
                    control={control}
                    errors={errors}
                    onRemove={() => onRemoveApproval(approvalKey)}
                    canEdit={canEdit}
                    theme={theme}
                  />
                );
              })}
          </Stack>
        )}

        {/* Add New Approval */}
        {availableApprovalTypes.length > 0 && canEdit && (
          <Stack 
            style={{
              padding: '16px',
              border: `2px dashed ${theme.palette.neutralTertiary}`,
              borderRadius: '8px',
              backgroundColor: theme.palette.neutralLighterAlt
            }}
            tokens={{ childrenGap: 12 }}
          >
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Icon 
                iconName="Add" 
                style={{ color: theme.palette.themePrimary, fontSize: 16 }} 
              />
              <Text variant="medium" style={{ fontWeight: 600 }}>
                Add Additional Approval
              </Text>
            </Stack>

            <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="end">
              <Stack style={{ flex: 1 }}>
                <Dropdown
                  placeholder="Select approval type"
                  options={availableApprovalTypes}
                  selectedKey={selectedApprovalType}
                  onChange={(ev, option) => onApprovalTypeChange(option?.key as string || '')}
                />
              </Stack>
              <PrimaryButton
                text="Add Approval"
                iconProps={{ iconName: 'Add' }}
                onClick={onAddApproval}
                disabled={!selectedApprovalType}
              />
            </Stack>

            {selectedApprovalType && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'white',
                borderRadius: '4px',
                border: `1px solid ${theme.palette.neutralLight}`
              }}>
                {(() => {
                  const selectedType = availableApprovalTypes.find(opt => opt.key === selectedApprovalType);
                  return selectedType?.data ? (
                    <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
                      <Icon 
                        iconName={selectedType.data.icon} 
                        style={{ color: theme.palette.themePrimary, fontSize: 16 }} 
                      />
                      <Stack>
                        <Text variant="small" style={{ fontWeight: 600 }}>
                          {selectedType.data.text}
                        </Text>
                        <Text variant="small" style={{ color: theme.palette.neutralSecondary }}>
                          {selectedType.data.description}
                        </Text>
                      </Stack>
                    </Stack>
                  ) : null;
                })()}
              </div>
            )}
          </Stack>
        )}

        {/* No more approvals available */}
        {availableApprovalTypes.length === 0 && (
          <Text variant="small" style={{ color: theme.palette.neutralSecondary, fontStyle: 'italic' }}>
            All available approval types have been added
          </Text>
        )}
      </Stack>

    </Stack>
  );
});

ApprovalsForm.displayName = 'ApprovalsForm';

// Communication Approval Fields Component
interface CommunicationApprovalFieldsProps {
  control: Control<Request | NewRequest>;
  errors: FieldErrors<Request | NewRequest>;
  canEdit: boolean;
  theme: any;
}

const CommunicationApprovalFields: React.FC<CommunicationApprovalFieldsProps> = React.memo(({
  control,
  errors,
  canEdit,
  theme
}) => {
  return (
    <Stack 
      tokens={{ childrenGap: 12 }}
      style={{
        padding: '16px',
        backgroundColor: theme.palette.neutralLighterAlt,
        borderRadius: '8px',
        border: `1px solid ${theme.palette.neutralLight}`
      }}
    >
      <FormItem>
        <FormLabel isRequired>Communication Approver</FormLabel>
        <FormValue>
          <PnPPeoplePicker
            // selectedItems={communicationApprover}
            // updatePeople={(people) => setValue('CommunicationApprover', people)}
            placeholder="Select the person who provided approval"
            personSelectionLimit={1}
            disabled={!canEdit}
          />
        </FormValue>
        <FormError error={errors.CommunicationApprover?.message} />
      </FormItem>

      <FormItem>
        <FormLabel isRequired>Approval Date</FormLabel>
        <FormValue>
          <DevExtremeDateBox
            // value={communicationApprovalDate}
            // onValueChanged={(value) => setValue('CommunicationApprovalDate', value)}
            type="date"
            max={new Date()}
            disabled={!canEdit}
          />
        </FormValue>
        <FormDescription>
          When was the approval provided?
        </FormDescription>
        <FormError error={errors.CommunicationApprovalDate?.message} />
      </FormItem>

      <FormItem>
        <FormLabel>Approval Documentation</FormLabel>
        <FormValue>
          <div style={{ 
            padding: '16px', 
            border: `1px dashed ${theme.palette.neutralTertiary}`, 
            borderRadius: '4px',
            textAlign: 'center',
            backgroundColor: 'white',
          }}>
            <Icon 
              iconName="CloudUpload" 
              style={{ 
                fontSize: 24, 
                color: theme.palette.neutralSecondary,
                marginBottom: 8 
              }} 
            />
            <Text variant="small" style={{ color: theme.palette.neutralSecondary, display: 'block' }}>
              Upload approval documentation (email, signed document, etc.)
            </Text>
          </div>
        </FormValue>
        <FormDescription>
          Upload supporting documentation for this approval
        </FormDescription>
      </FormItem>
    </Stack>
  );
});

CommunicationApprovalFields.displayName = 'CommunicationApprovalFields';

// Individual Approval Card Component
interface ApprovalCardProps {
  approvalType: any;
  control: Control<Request | NewRequest>;
  errors: FieldErrors<Request | NewRequest>;
  onRemove: () => void;
  canEdit: boolean;
  theme: any;
}

const ApprovalCard: React.FC<ApprovalCardProps> = React.memo(({
  approvalType,
  control,
  errors,
  onRemove,
  canEdit,
  theme
}) => {
  return (
    <div style={{
      border: `1px solid ${theme.palette.neutralLight}`,
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      {/* Card Header */}
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        style={{
          padding: '12px 16px',
          backgroundColor: theme.palette.neutralLighterAlt,
          borderBottom: `1px solid ${theme.palette.neutralLight}`
        }}
      >
        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
          <Icon 
            iconName={approvalType.icon} 
            style={{ color: theme.palette.themePrimary, fontSize: 16 }} 
          />
          <Text variant="medium" style={{ fontWeight: 600 }}>
            {approvalType.text}
          </Text>
        </Stack>
        
        {canEdit && (
          <TooltipHost content="Remove this approval requirement">
            <IconButton
              iconProps={{ iconName: 'Delete' }}
              onClick={onRemove}
              styles={{
                root: { color: theme.palette.redDark },
                rootHovered: { backgroundColor: theme.palette.red, color: 'white' }
              }}
            />
          </TooltipHost>
        )}
      </Stack>

      {/* Card Content */}
      <Stack tokens={{ childrenGap: 12 }} style={{ padding: '16px' }}>
        
        {/* Other Approval Title (if applicable) */}
        {approvalType.key === 'other' && (
          <FormItem>
            <FormLabel isRequired>Approval Title</FormLabel>
            <FormValue>
              <DevExtremeTextBox
                // value={otherApproverTitle}
                // onValueChanged={(value) => setValue('OtherApproverTitle', value)}
                placeholder="Enter custom approval title"
                disabled={!canEdit}
              />
            </FormValue>
            <FormError error={errors.OtherApproverTitle?.message} />
          </FormItem>
        )}

        <FormItem>
          <FormLabel isRequired>Approver</FormLabel>
          <FormValue>
            <PnPPeoplePicker
              // Handle with field name from approvalType.fields.approverField
              placeholder="Select the approver"
              personSelectionLimit={1}
              disabled={!canEdit}
            />
          </FormValue>
          <FormError error={errors[approvalType.fields.approverField as keyof (Request | NewRequest)]?.message} />
        </FormItem>

        <FormItem>
          <FormLabel isRequired>Approval Date</FormLabel>
          <FormValue>
            <DevExtremeDateBox
              // Handle with field name from approvalType.fields.dateField
              type="date"
              max={new Date()}
              disabled={!canEdit}
            />
          </FormValue>
          <FormError error={errors[approvalType.fields.dateField as keyof (Request | NewRequest)]?.message} />
        </FormItem>

        <FormItem>
          <FormLabel>Approval Documentation</FormLabel>
          <FormValue>
            <div style={{ 
              padding: '12px', 
              border: `1px dashed ${theme.palette.neutralTertiary}`, 
              borderRadius: '4px',
              textAlign: 'center',
              backgroundColor: theme.palette.neutralLighterAlt,
            }}>
              <Icon 
                iconName="CloudUpload" 
                style={{ 
                  fontSize: 20, 
                  color: theme.palette.neutralSecondary,
                  marginBottom: 4 
                }} 
              />
              <Text variant="small" style={{ color: theme.palette.neutralSecondary, display: 'block' }}>
                Upload approval documentation
              </Text>
            </div>
          </FormValue>
        </FormItem>
      </Stack>
    </div>
  );
});

ApprovalCard.displayName = 'ApprovalCard';

// Summary Mode Component
interface ApprovalsSummaryProps {
  selectedApprovals: string[];
  control: Control<Request | NewRequest>;
  theme: any;
}

const ApprovalsSummary: React.FC<ApprovalsSummaryProps> = React.memo(({
  selectedApprovals,
  control,
  theme,
}) => {
  return (
    <Stack tokens={{ childrenGap: 16 }}>
      
      {selectedApprovals.length > 0 ? (
        selectedApprovals.map(approvalKey => {
          if (approvalKey === 'communication') {
            return (
              <Stack key={approvalKey} tokens={{ childrenGap: 8 }}>
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                  <Icon iconName="MegaphoneOutline" style={{ color: theme.palette.themePrimary }} />
                  <Text variant="medium" style={{ fontWeight: 600 }}>
                    Communication Approval
                  </Text>
                  <Icon iconName="CheckMark" style={{ color: theme.palette.green }} />
                </Stack>
                {/* Show approval details here */}
                <Text variant="small" style={{ color: theme.palette.neutralSecondary, marginLeft: 32 }}>
                  Approved by [Approver Name] on [Date]
                </Text>
              </Stack>
            );
          }

          const approvalType = APPROVAL_TYPES.find(type => type.key === approvalKey);
          if (!approvalType) return null;

          return (
            <Stack key={approvalKey} tokens={{ childrenGap: 8 }}>
              <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                <Icon iconName={approvalType.icon} style={{ color: theme.palette.themePrimary }} />
                <Text variant="medium" style={{ fontWeight: 600 }}>
                  {approvalType.text}
                </Text>
                <Icon iconName="CheckMark" style={{ color: theme.palette.green }} />
              </Stack>
              {/* Show approval details here */}
              <Text variant="small" style={{ color: theme.palette.neutralSecondary, marginLeft: 32 }}>
                Approved by [Approver Name] on [Date]
              </Text>
            </Stack>
          );
        })
      ) : (
        <Stack horizontalAlign="center" tokens={{ childrenGap: 8 }}>
          <Icon 
            iconName="Warning" 
            style={{ color: theme.palette.yellow, fontSize: 24 }} 
          />
          <Text variant="medium" style={{ fontWeight: 600 }}>
            No approvals configured
          </Text>
          <Text variant="small" style={{ color: theme.palette.neutralSecondary }}>
            At least one approval is required before submission
          </Text>
        </Stack>
      )}

    </Stack>
  );
});

ApprovalsSummary.displayName = 'ApprovalsSummary';

export default Approvals;
