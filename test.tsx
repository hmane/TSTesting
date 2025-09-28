// components/RequestForm/RequestInfo.tsx
import React, { useState, useMemo, useCallback } from 'react';
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
  DevExtremeTextBox,
  DevExtremeSelectBox,
  DevExtremeDateBox,
  DevExtremeTagBox,
  PnPPeoplePicker,
} from '../spForm';
import { useRequestFormStore } from '../../stores/requestFormStore';

interface RequestInfoProps {
  control: Control<Request | NewRequest>;
  errors: FieldErrors<Request | NewRequest>;
  requestAccess: RequestAccess;
  isSubmitted: boolean;
}

// Static options to prevent re-renders
const SUBMISSION_TYPE_OPTIONS = [
  { label: 'New', value: 'New' },
  { label: 'Material Updates', value: 'Material Updates' },
] as const;

const REVIEW_AUDIENCE_OPTIONS = [
  { label: 'Legal', value: 'Legal' },
  { label: 'Compliance', value: 'Compliance' },
  { label: 'Both', value: 'Both' },
] as const;

const DISTRIBUTION_METHOD_OPTIONS = [
  { label: 'Email', value: 'Email' },
  { label: 'Website', value: 'Website' },
  { label: 'Print', value: 'Print' },
  { label: 'Social Media', value: 'Social Media' },
  { label: 'Presentation', value: 'Presentation' },
  { label: 'Direct Mail', value: 'Direct Mail' },
] as const;

// Sample submission items - in real app, this would come from SharePoint list
const SUBMISSION_ITEMS = [
  { Title: 'White Papers', TurnAroundTimeInDays: 5 },
  { Title: 'Marketing Brochures', TurnAroundTimeInDays: 3 },
  { Title: 'Website Content', TurnAroundTimeInDays: 7 },
  { Title: 'Social Media Posts', TurnAroundTimeInDays: 2 },
  { Title: 'Research Reports', TurnAroundTimeInDays: 10 },
  { Title: 'Email Campaigns', TurnAroundTimeInDays: 4 },
  { Title: 'Presentations', TurnAroundTimeInDays: 6 },
];

const RequestInfo: React.FC<RequestInfoProps> = ({
  control,
  errors,
  requestAccess,
  isSubmitted,
}) => {
  const theme = useTheme();
  const [isEditMode, setIsEditMode] = useState(!isSubmitted);
  const { currentRequest } = useRequestFormStore();

  // Watch specific fields for rush calculation
  const watchedValues = useWatch({
    control,
    name: ['TargetReturnDate', 'SubmissionItem'],
  });

  // Calculate if request is rush
  const isRushRequest = useMemo(() => {
    const [targetDate, submissionItem] = watchedValues;
    if (!targetDate || !submissionItem) return false;

    const item = SUBMISSION_ITEMS.find(item => item.Title === submissionItem);
    if (!item) return false;

    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays < item.TurnAroundTimeInDays;
  }, [watchedValues]);

  // Memoized handlers
  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  // Only show if access is enabled
  if (!requestAccess.enableRequestInfo) {
    return null;
  }

  // Can edit if user has permissions and it's not completed
  const canEdit = requestAccess.isCreator || requestAccess.isAdmin || requestAccess.isLegalAdmin;

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
            <Icon 
              iconName="DocumentReply" 
              style={{ color: theme.palette.themePrimary, fontSize: 16 }} 
            />
            <Text variant="medium" style={{ fontWeight: 600 }}>
              Request Information
            </Text>
          </Stack>
          
          {/* Edit/View Toggle */}
          {isSubmitted && canEdit && (
            <TooltipHost content={isEditMode ? 'Switch to summary view' : 'Edit request information'}>
              <IconButton
                iconProps={{ iconName: isEditMode ? 'ReadingMode' : 'Edit' }}
                title={isEditMode ? 'View Summary' : 'Edit Information'}
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
          <RequestInfoForm 
            control={control}
            errors={errors}
            isRushRequest={isRushRequest}
            canEdit={canEdit}
            theme={theme}
          />
        ) : (
          <RequestInfoSummary 
            currentRequest={currentRequest}
            isRushRequest={isRushRequest}
            theme={theme}
          />
        )}
      </Content>
    </Card>
  );
};

// Edit Mode Component
interface RequestInfoFormProps {
  control: Control<Request | NewRequest>;
  errors: FieldErrors<Request | NewRequest>;
  isRushRequest: boolean;
  canEdit: boolean;
  theme: any;
}

const RequestInfoForm: React.FC<RequestInfoFormProps> = React.memo(({
  control,
  errors,
  isRushRequest,
  canEdit,
  theme,
}) => {
  return (
    <Stack tokens={{ childrenGap: 24 }}>
      
      {/* Basic Information Section */}
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
          Basic Information
        </Text>
        
        <FormItem>
          <FormLabel isRequired>Request Title</FormLabel>
          <FormValue>
            <DevExtremeTextBox
              name="RequestTitle"
              control={control}
              placeholder="Enter a descriptive title for your request"
              disabled={!canEdit}
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
              disabled={!canEdit}
            />
          </FormValue>
          <FormDescription>
            Provide detailed information about how this material will be used
          </FormDescription>
          <FormError error={errors.Purpose?.message} />
        </FormItem>
      </Stack>

      <Separator />

      {/* Submission Details Section */}
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
          Submission Details
        </Text>

        <FormItem>
          <FormLabel isRequired>Submission Type</FormLabel>
          <FormValue>
            <DevExtremeSelectBox
              name="SubmissionType"
              control={control}
              items={SUBMISSION_TYPE_OPTIONS}
              placeholder="Select submission type"
              disabled={!canEdit}
            />
          </FormValue>
          <FormError error={errors.SubmissionType?.message} />
        </FormItem>

        <FormItem>
          <FormLabel 
            isRequired
            infoText="This determines the standard turnaround time for your request"
          >
            Submission Item
          </FormLabel>
          <FormValue>
            <DevExtremeSelectBox
              name="SubmissionItem"
              control={control}
              items={SUBMISSION_ITEMS.map(item => ({
                label: `${item.Title} (${item.TurnAroundTimeInDays} business days)`,
                value: item.Title
              }))}
              placeholder="Select submission item type"
              disabled={!canEdit}
            />
          </FormValue>
          <FormError error={errors.SubmissionItem?.message} />
        </FormItem>

        <FormItem>
          <FormLabel isRequired>Distribution Method</FormLabel>
          <FormValue>
            <DevExtremeTagBox
              name="DistributionMethod"
              control={control}
              items={DISTRIBUTION_METHOD_OPTIONS}
              placeholder="Select distribution methods"
              disabled={!canEdit}
              acceptCustomValue={false}
            />
          </FormValue>
          <FormDescription>
            Select all methods where this material will be distributed
          </FormDescription>
          <FormError error={errors.DistributionMethod?.message} />
        </FormItem>
      </Stack>

      <Separator />

      {/* Timeline Section */}
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
              disabled={!canEdit}
            />
          </FormValue>
          <FormDescription>
            When do you need this material approved and ready for use?
          </FormDescription>
          <FormError error={errors.TargetReturnDate?.message} />
        </FormItem>

        {/* Rush Request Indicator */}
        {isRushRequest && (
          <MessageBar
            messageBarType={MessageBarType.warning}
            isMultiline={false}
          >
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Icon iconName="Warning" />
              <Text variant="medium" style={{ fontWeight: 600 }}>
                Rush Request Detected
              </Text>
            </Stack>
          </MessageBar>
        )}

        {isRushRequest && (
          <FormItem>
            <FormLabel isRequired>Rush Rationale</FormLabel>
            <FormValue>
              <DevExtremeTextBox
                name="RushRational"
                control={control}
                mode="text"
                height={80}
                placeholder="Explain why this request needs expedited processing"
                disabled={!canEdit}
              />
            </FormValue>
            <FormDescription>
              Please provide a detailed explanation for the expedited timeline
            </FormDescription>
            <FormError error={errors.RushRational?.message} />
          </FormItem>
        )}
        
        <FormItem>
          <FormLabel>Date of First Use</FormLabel>
          <FormValue>
            <DevExtremeDateBox
              name="DateOfFirstUse"
              control={control}
              type="date"
              min={new Date()}
              disabled={!canEdit}
            />
          </FormValue>
          <FormDescription>
            When will this material first be used or published?
          </FormDescription>
          <FormError error={errors.DateOfFirstUse?.message} />
        </FormItem>
      </Stack>

      <Separator />

      {/* Review Settings Section */}
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
          Review & Collaboration
        </Text>

        <FormItem>
          <FormLabel 
            isRequired
            infoText="Legal Admin can override this selection during intake"
          >
            Review Audience
          </FormLabel>
          <FormValue>
            <DevExtremeSelectBox
              name="ReviewAudience"
              control={control}
              items={REVIEW_AUDIENCE_OPTIONS}
              placeholder="Select review audience"
              disabled={!canEdit}
            />
          </FormValue>
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
              disabled={!canEdit}
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
            <div style={{ 
              padding: '16px', 
              border: `1px dashed ${theme.palette.neutralTertiary}`, 
              borderRadius: '4px',
              textAlign: 'center',
              backgroundColor: theme.palette.neutralLighterAlt,
            }}>
              <Icon 
                iconName="Search" 
                style={{ 
                  fontSize: 20, 
                  color: theme.palette.neutralSecondary,
                  marginBottom: 8 
                }} 
              />
              <Text variant="small" style={{ color: theme.palette.neutralSecondary, display: 'block' }}>
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
              disabled={!canEdit}
            />
          </FormValue>
          <FormError error={errors.PriorSubmissionNotes?.message} />
        </FormItem>
      </Stack>

    </Stack>
  );
});

RequestInfoForm.displayName = 'RequestInfoForm';

// Summary Mode Component
interface RequestInfoSummaryProps {
  currentRequest: Request | NewRequest | null;
  isRushRequest: boolean;
  theme: any;
}

const RequestInfoSummary: React.FC<RequestInfoSummaryProps> = React.memo(({
  currentRequest,
  isRushRequest,
  theme,
}) => {
  if (!currentRequest) return null;

  return (
    <Stack tokens={{ childrenGap: 20 }}>
      
      {/* Basic Information Section */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text 
          variant="medium" 
          style={{ 
            fontWeight: 600, 
            color: theme.palette.themePrimary,
            borderBottom: `1px solid ${theme.palette.neutralLighter}`,
            paddingBottom: 8,
          }}
        >
          Basic Information
        </Text>
        <Stack tokens={{ childrenGap: 8 }}>
          <SummaryField 
            label="Request Title" 
            value={currentRequest.RequestTitle} 
            theme={theme}
          />
          <SummaryField 
            label="Department" 
            value={currentRequest.Department} 
            theme={theme}
          />
          <SummaryField 
            label="Request Type" 
            value={currentRequest.RequestType} 
            theme={theme}
          />
          <SummaryField 
            label="Purpose" 
            value={currentRequest.Purpose} 
            multiline 
            theme={theme}
          />
        </Stack>
      </Stack>

      <Separator />

      {/* Submission Details Section */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text 
          variant="medium" 
          style={{ 
            fontWeight: 600, 
            color: theme.palette.themePrimary,
            borderBottom: `1px solid ${theme.palette.neutralLighter}`,
            paddingBottom: 8,
          }}
        >
          Submission Details
        </Text>
        <Stack tokens={{ childrenGap: 8 }}>
          <SummaryField 
            label="Submission Type" 
            value={currentRequest.SubmissionType} 
            theme={theme}
          />
          <SummaryField 
            label="Submission Item" 
            value={currentRequest.SubmissionItem} 
            theme={theme}
          />
          <SummaryField 
            label="Distribution Method" 
            value={Array.isArray(currentRequest.DistributionMethod) 
              ? currentRequest.DistributionMethod.join(', ')
              : currentRequest.DistributionMethod} 
            theme={theme}
          />
        </Stack>
      </Stack>

      <Separator />

      {/* Timeline Section */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text 
          variant="medium" 
          style={{ 
            fontWeight: 600, 
            color: theme.palette.themePrimary,
            borderBottom: `1px solid ${theme.palette.neutralLighter}`,
            paddingBottom: 8,
          }}
        >
          Timeline & Dates
        </Text>
        <Stack tokens={{ childrenGap: 8 }}>
          <SummaryField 
            label="Target Return Date" 
            value={currentRequest.TargetReturnDate ? new Date(currentRequest.TargetReturnDate).toLocaleDateString() : undefined} 
            theme={theme}
          />
          {isRushRequest && (
            <SummaryField 
              label="Rush Request" 
              value="Yes" 
              icon="Warning"
              iconColor={theme.palette.yellow}
              theme={theme}
            />
          )}
          {currentRequest.RushRational && (
            <SummaryField 
              label="Rush Rationale" 
              value={currentRequest.RushRational} 
              multiline 
              theme={theme}
            />
          )}
          <SummaryField 
            label="Date of First Use" 
            value={currentRequest.DateOfFirstUse ? new Date(currentRequest.DateOfFirstUse).toLocaleDateString() : undefined} 
            theme={theme}
          />
        </Stack>
      </Stack>

      <Separator />

      {/* Review & Collaboration Section */}
      <Stack tokens={{ childrenGap: 12 }}>
        <Text 
          variant="medium" 
          style={{ 
            fontWeight: 600, 
            color: theme.palette.themePrimary,
            borderBottom: `1px solid ${theme.palette.neutralLighter}`,
            paddingBottom: 8,
          }}
        >
          Review & Collaboration
        </Text>
        <Stack tokens={{ childrenGap: 8 }}>
          <SummaryField 
            label="Review Audience" 
            value={currentRequest.ReviewAudience} 
            theme={theme}
          />
          <SummaryField 
            label="Additional Parties" 
            value={currentRequest.AdditionalParty?.length ? `${currentRequest.AdditionalParty.length} people selected` : 'None'} 
            theme={theme}
          />
          {currentRequest.PriorSubmissions && currentRequest.PriorSubmissions.length > 0 && (
            <SummaryField 
              label="Prior Submissions" 
              value={`${currentRequest.PriorSubmissions.length} related requests`} 
              theme={theme}
            />
          )}
          {currentRequest.PriorSubmissionNotes && (
            <SummaryField 
              label="Prior Submission Notes" 
              value={currentRequest.PriorSubmissionNotes} 
              multiline 
              theme={theme}
            />
          )}
        </Stack>
      </Stack>

    </Stack>
  );
});

RequestInfoSummary.displayName = 'RequestInfoSummary';

// Summary field component
interface SummaryFieldProps {
  label: string;
  value?: string | number;
  multiline?: boolean;
  icon?: string;
  iconColor?: string;
  theme: any;
}

const SummaryField: React.FC<SummaryFieldProps> = React.memo(({ 
  label, 
  value, 
  multiline, 
  icon, 
  iconColor,
  theme 
}) => {
  if (!value && value !== 0) return null;

  return (
    <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="start">
      <Text 
        variant="small" 
        style={{ 
          minWidth: '160px', 
          fontWeight: 500,
          color: theme.palette.neutralSecondary
        }}
      >
        {label}:
      </Text>
      <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center" style={{ flex: 1 }}>
        {icon && (
          <Icon 
            iconName={icon} 
            style={{ color: iconColor || theme.palette.neutralPrimary, fontSize: 14 }} 
          />
        )}
        <Text 
          variant="small"
          style={{ 
            color: theme.palette.neutralPrimary,
            whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
            wordBreak: multiline ? 'break-word' : 'normal',
            lineHeight: multiline ? 1.4 : 1.2,
          }}
        >
          {value}
        </Text>
      </Stack>
    </Stack>
  );
});

SummaryField.displayName = 'SummaryField';

export default RequestInfo;
