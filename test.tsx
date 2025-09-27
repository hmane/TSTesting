// components/RequestForm/RequestTypeSelector.tsx
import React, { useState } from 'react';
import {
  Stack,
  Text,
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  Icon,
  useTheme
} from '@fluentui/react';
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
  const theme = useTheme();
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

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

  // Handle item selection - only allow selection of enabled items
  const handleItemClick = (item: RequestType) => {
    if (item.enabled) {
      setSelectedRequestType(prevSelected => 
        prevSelected?.id === item.id ? prevSelected : item
      );
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (selectedRequestType) {
      onRequestTypeSelected(selectedRequestType.id);
    }
  };

  // Render a single request type item
  const renderRequestTypeItem = (item: RequestType) => {
    const isSelected = selectedRequestType?.id === item.id;
    const isHovered = hoveredItemId === item.id;
    
    // Determine background color based on state
    let backgroundColor = theme.palette.white;
    if (isSelected && item.enabled) {
      backgroundColor = theme.palette.neutralLighter; // Selected background
    } else if (isHovered && item.enabled) {
      backgroundColor = theme.palette.neutralLighterAlt; // Hover background
    }
    
    // Determine border color based on state
    let borderColor = theme.palette.neutralLight;
    let borderWidth = '1px';
    if (isSelected && item.enabled) {
      borderColor = theme.palette.neutralTertiary;
      borderWidth = '2px';
    } else if (isHovered && item.enabled) {
      borderColor = theme.palette.neutralTertiary;
    }
    
    // Determine shadow based on state
    let boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
    if (isHovered && item.enabled) {
      boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12)';
    }
    
    return (
      <Stack
        key={item.id}
        onClick={() => handleItemClick(item)}
        onMouseEnter={() => item.enabled && setHoveredItemId(item.id)}
        onMouseLeave={() => setHoveredItemId(null)}
        style={{
          padding: '20px',
          margin: '8px 0',
          border: `${borderWidth} solid ${borderColor}`,
          borderRadius: '8px',
          backgroundColor,
          cursor: item.enabled ? 'pointer' : 'not-allowed',
          opacity: item.enabled ? 1 : 0.6,
          transition: 'all 0.2s ease',
          position: 'relative',
          boxShadow,
          transform: isHovered && item.enabled ? 'translateY(-1px)' : 'translateY(0)'
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

        {/* Header with Icon and Title */}
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="start">
          <Icon
            iconName={item.icon || 'Document'}
            style={{
              fontSize: '24px',
              color: item.enabled ? theme.palette.neutralPrimary : theme.palette.neutralSecondary,
              marginTop: '4px'
            }}
          />
          
          <Stack tokens={{ childrenGap: 8 }} style={{ flex: 1 }}>
            <Text
              variant="large"
              style={{
                fontWeight: 600,
                color: item.enabled ? theme.palette.neutralPrimary : theme.palette.neutralSecondary
              }}
            >
              {item.title}
            </Text>
            
            {item.estimatedTime && (
              <Text
                variant="small"
                style={{ 
                  color: 'var(--neutralSecondary)',
                  fontWeight: 500
                }}
              >
                Typical turnaround: {item.estimatedTime}
              </Text>
            )}
          </Stack>
        </Stack>

        {/* Description - aligned under the title */}
        <Stack style={{ marginLeft: '36px' }}>
          <Text
            variant="medium"
            style={{
              color: item.enabled ? 'var(--neutralPrimary)' : 'var(--neutralSecondary)',
              lineHeight: '1.4'
            }}
          >
            {item.description}
          </Text>
        </Stack>

        {/* Selection Indicator */}
        {isSelected && item.enabled && (
          <Stack 
            horizontal 
            verticalAlign="center" 
            tokens={{ childrenGap: 8 }}
            style={{ marginLeft: '36px' }}
          >
            <Icon
              iconName="CheckMark"
              style={{ 
                color: 'var(--neutralDark)', 
                fontSize: '16px' 
              }}
            />
            <Text
              variant="medium"
              style={{ 
                color: 'var(--neutralDark)', 
                fontWeight: 600 
              }}
            >
              Selected
            </Text>
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <Stack 
      tokens={{ childrenGap: 24 }} 
      style={{ 
        width: '100%', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '20px'
      }}
    >
      
      {/* Header */}
      <Stack horizontalAlign="center" tokens={{ childrenGap: 16 }}>
        <Text 
          variant="xxLarge" 
          style={{ 
            fontWeight: 600, 
            textAlign: 'center',
            marginTop: '20px'
          }}
        >
          Start a New Request
        </Text>
        <Text 
          variant="large" 
          style={{ 
            color: 'var(--neutralSecondary)', 
            textAlign: 'center', 
            maxWidth: '600px'
          }}
        >
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

        {/* Request Type Items - Card Container */}
        <Stack
          style={{
            background: 'var(--neutralLighterAlt)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid var(--neutralLight)'
          }}
          tokens={{ childrenGap: 8 }}
        >
          {requestTypes.map(item => renderRequestTypeItem(item))}
        </Stack>
      </Stack>

      {/* Selection Summary */}
      {selectedRequestType && (
        <Stack
          style={{
            background: 'var(--neutralLighter)',
            border: '1px solid var(--neutralLight)',
            borderRadius: '8px',
            padding: '20px'
          }}
          tokens={{ childrenGap: 12 }}
        >
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Icon 
              iconName="CheckMark" 
              style={{ color: 'var(--neutralDark)' }} 
            />
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
