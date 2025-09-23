```
// components/AppInitializer.tsx
import React, { useEffect, useState } from 'react';
import {
  Stack,
  Spinner,
  SpinnerSize,
  Text,
  ProgressIndicator,
  MessageBar,
  MessageBarType,
  Icon,
  DefaultButton,
  PrimaryButton
} from '@fluentui/react';
import { useConfigStore } from '../stores/configStore';
import { useFieldChoicesStore } from '../stores/fieldChoicesStore';
import { useRequestFormStore } from '../stores/requestFormStore';

interface AppInitializerProps {
  children: React.ReactNode;
  spContext: any; // SPFx context
  itemId?: number; // Optional request ID for editing existing requests
}

interface InitializationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface InitializationState {
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  hasErrors: boolean;
  steps: InitializationStep[];
}

export const AppInitializer: React.FC<AppInitializerProps> = ({
  children,
  spContext,
  itemId
}) => {
  const configStore = useConfigStore();
  const fieldChoicesStore = useFieldChoicesStore();
  const requestFormStore = useRequestFormStore();

  const [initState, setInitState] = useState<InitializationState>({
    currentStep: 0,
    totalSteps: 6,
    isComplete: false,
    hasErrors: false,
    steps: [
      {
        id: 'spcontext',
        name: 'SharePoint Context',
        description: 'Initializing SharePoint connection and user context',
        status: 'pending'
      },
      {
        id: 'usergroups',
        name: 'User Groups',
        description: 'Loading user group memberships and permissions',
        status: 'pending'
      },
      {
        id: 'config',
        name: 'Application Configuration',
        description: 'Loading application settings and configuration',
        status: 'pending'
      },
      {
        id: 'fieldchoices',
        name: 'Field Choices',
        description: 'Loading dropdown options and field metadata',
        status: 'pending'
      },
      {
        id: 'submissionitems',
        name: 'Submission Items',
        description: 'Loading submission types and turnaround times',
        status: 'pending'
      },
      {
        id: 'requestdata',
        name: 'Request Data',
        description: itemId ? 'Loading existing request data' : 'Preparing new request form',
        status: 'pending'
      }
    ]
  });

  // Update step status helper
  const updateStepStatus = (stepId: string, status: InitializationStep['status'], error?: string) => {
    setInitState(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, status, error }
          : step
      ),
      currentStep: status === 'completed' ? prev.currentStep + 1 : prev.currentStep,
      hasErrors: status === 'error' || prev.hasErrors
    }));
  };

  // Main initialization sequence
  useEffect(() => {
    const initializeApplication = async () => {
      try {
        // Step 1: Initialize SharePoint Context
        updateStepStatus('spcontext', 'loading');
        await initializeSharePointContext();
        updateStepStatus('spcontext', 'completed');

        // Step 2: Load User Groups (only for existing requests)
        updateStepStatus('usergroups', 'loading');
        if (itemId) {
          await loadUserGroups();
        }
        updateStepStatus('usergroups', 'completed');

        // Step 3: Load Application Configuration
        updateStepStatus('config', 'loading');
        await loadApplicationConfig();
        updateStepStatus('config', 'completed');

        // Step 4: Load Field Choices
        updateStepStatus('fieldchoices', 'loading');
        await loadFieldChoices();
        updateStepStatus('fieldchoices', 'completed');

        // Step 5: Load Submission Items
        updateStepStatus('submissionitems', 'loading');
        await loadSubmissionItems();
        updateStepStatus('submissionitems', 'completed');

        // Step 6: Initialize Request Data
        updateStepStatus('requestdata', 'loading');
        await initializeRequestData();
        updateStepStatus('requestdata', 'completed');

        // Mark initialization as complete
        setInitState(prev => ({
          ...prev,
          isComplete: true,
          currentStep: prev.totalSteps
        }));

      } catch (error) {
        console.error('Application initialization failed:', error);
        setInitState(prev => ({
          ...prev,
          hasErrors: true
        }));
      }
    };

    initializeApplication();
  }, [itemId]);

  // Initialization functions
  const initializeSharePointContext = async (): Promise<void> => {
    try {
      // Initialize SPContext if not already done
      if (!window.SPContext?.isInitialized) {
        await window.SPContext?.smart(spContext, 'LegalReviewApp');
      }
      
      // Verify connection
      const webInfo = await window.SPContext?.sp.web.select('Title', 'Url')();
      if (!webInfo) {
        throw new Error('Failed to connect to SharePoint');
      }

      console.log('SharePoint context initialized:', webInfo.Title);
    } catch (error) {
      console.error('SharePoint context initialization failed:', error);
      updateStepStatus('spcontext', 'error', error instanceof Error ? error.message : 'SharePoint connection failed');
      throw error;
    }
  };

  const loadUserGroups = async (): Promise<void> => {
    try {
      if (!requestFormStore.loadUserGroups) {
        throw new Error('User groups loading method not available');
      }
      
      await requestFormStore.loadUserGroups();
      
      console.log('User groups loaded:', requestFormStore.userGroups?.length || 0);
    } catch (error) {
      console.error('User groups loading failed:', error);
      updateStepStatus('usergroups', 'error', error instanceof Error ? error.message : 'Failed to load user groups');
      throw error;
    }
  };

  const loadApplicationConfig = async (): Promise<void> => {
    try {
      if (configStore.isInitialized) {
        console.log('Configuration already loaded');
        return;
      }

      await configStore.loadConfigs();
      
      if (!configStore.isInitialized) {
        throw new Error('Configuration loading failed');
      }

      console.log('Application configuration loaded:', configStore.configs?.length || 0, 'items');
    } catch (error) {
      console.error('Configuration loading failed:', error);
      updateStepStatus('config', 'error', error instanceof Error ? error.message : 'Failed to load configuration');
      throw error;
    }
  };

  const loadFieldChoices = async (): Promise<void> => {
    try {
      if (fieldChoicesStore.isInitialized) {
        console.log('Field choices already loaded');
        return;
      }

      await fieldChoicesStore.loadAllFieldChoices();
      
      if (!fieldChoicesStore.isInitialized) {
        throw new Error('Field choices loading failed');
      }

      const fieldCount = Object.keys(fieldChoicesStore.fieldChoices || {}).length;
      console.log('Field choices loaded:', fieldCount, 'fields');
    } catch (error) {
      console.error('Field choices loading failed:', error);
      updateStepStatus('fieldchoices', 'error', error instanceof Error ? error.message : 'Failed to load field choices');
      throw error;
    }
  };

  const loadSubmissionItems = async (): Promise<void> => {
    try {
      // Load submission items from SharePoint list
      const submissionItems = await window.SPContext?.sp.web.lists
        .getByTitle('SubmissionItems')
        .items
        .select('Title', 'TurnAroundTimeInDays', 'Description')
        .orderBy('Title')();

      if (!submissionItems || submissionItems.length === 0) {
        console.warn('No submission items found');
        return;
      }

      // Store in session storage or state management for quick access
      sessionStorage.setItem('submissionItems', JSON.stringify(submissionItems));
      
      console.log('Submission items loaded:', submissionItems.length, 'items');
    } catch (error) {
      console.error('Submission items loading failed:', error);
      updateStepStatus('submissionitems', 'error', error instanceof Error ? error.message : 'Failed to load submission items');
      throw error;
    }
  };

  const initializeRequestData = async (): Promise<void> => {
    try {
      if (!requestFormStore.initializeForm) {
        throw new Error('Request form initialization method not available');
      }

      // Initialize the request form (new or existing)
      await requestFormStore.initializeForm(itemId);
      
      if (!requestFormStore.isInitialized) {
        throw new Error('Request form initialization failed');
      }

      const requestType = itemId ? 'existing' : 'new';
      console.log(`Request form initialized for ${requestType} request`);
    } catch (error) {
      console.error('Request data initialization failed:', error);
      updateStepStatus('requestdata', 'error', error instanceof Error ? error.message : 'Failed to initialize request data');
      throw error;
    }
  };

  // Retry failed initialization
  const retryInitialization = () => {
    // Reset all steps to pending
    setInitState(prev => ({
      ...prev,
      currentStep: 0,
      isComplete: false,
      hasErrors: false,
      steps: prev.steps.map(step => ({
        ...step,
        status: 'pending',
        error: undefined
      }))
    }));

    // Restart initialization
    window.location.reload(); // Simple approach for full reset
  };

  // Calculate progress percentage
  const progressPercentage = (initState.currentStep / initState.totalSteps) * 100;

  // Show loading screen while initializing
  if (!initState.isComplete) {
    return (
      <Stack
        horizontalAlign="center"
        verticalAlign="center"
        style={{
          minHeight: '100vh',
          background: 'var(--neutralLighterAlt, #faf9f8)',
          padding: '20px'
        }}
      >
        <Stack
          style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '100%'
          }}
          tokens={{ childrenGap: 24 }}
          horizontalAlign="center"
        >
          
          {/* Header */}
          <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }}>
            <Icon 
              iconName="DocumentReply" 
              style={{ 
                fontSize: '48px', 
                color: 'var(--themePrimary, #0078d4)' 
              }} 
            />
            <Text variant="xLarge" style={{ fontWeight: 600 }}>
              Legal Review System
            </Text>
            <Text variant="medium" style={{ color: 'var(--neutralSecondary)', textAlign: 'center' }}>
              {initState.hasErrors 
                ? 'Initialization encountered errors' 
                : 'Loading application components...'}
            </Text>
          </Stack>

          {/* Progress Indicator */}
          {!initState.hasErrors && (
            <Stack style={{ width: '100%' }} tokens={{ childrenGap: 12 }}>
              <ProgressIndicator
                percentComplete={progressPercentage / 100}
                description={`Step ${initState.currentStep} of ${initState.totalSteps}`}
                styles={{
                  progressBar: {
                    backgroundColor: 'var(--themePrimary, #0078d4)'
                  }
                }}
              />
              <Text variant="small" style={{ textAlign: 'center', color: 'var(--neutralSecondary)' }}>
                {Math.round(progressPercentage)}% Complete
              </Text>
            </Stack>
          )}

          {/* Current Step Details */}
          <Stack style={{ width: '100%' }} tokens={{ childrenGap: 16 }}>
            {initState.steps.map((step, index) => {
              let iconName = 'StatusCircleOuter';
              let iconColor = 'var(--neutralTertiary)';

              switch (step.status) {
                case 'loading':
                  iconName = 'Loading';
                  iconColor = 'var(--themePrimary)';
                  break;
                case 'completed':
                  iconName = 'StatusCircleCheckmark';
                  iconColor = 'var(--green)';
                  break;
                case 'error':
                  iconName = 'StatusErrorFull';
                  iconColor = 'var(--red)';
                  break;
              }

              return (
                <Stack
                  key={step.id}
                  horizontal
                  verticalAlign="center"
                  tokens={{ childrenGap: 12 }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: step.status === 'loading' 
                      ? 'var(--themeLighterAlt)' 
                      : 'transparent'
                  }}
                >
                  <Icon 
                    iconName={iconName} 
                    style={{ 
                      color: iconColor,
                      fontSize: '16px',
                      ...(step.status === 'loading' && {
                        animation: 'spin 1s linear infinite'
                      })
                    }} 
                  />
                  <Stack style={{ flex: 1 }}>
                    <Text 
                      variant="small" 
                      style={{ 
                        fontWeight: step.status === 'loading' ? 600 : 400,
                        color: step.status === 'error' ? 'var(--red)' : 'var(--neutralPrimary)'
                      }}
                    >
                      {step.name}
                    </Text>
                    <Text 
                      variant="tiny" 
                      style={{ 
                        color: step.status === 'error' ? 'var(--red)' : 'var(--neutralSecondary)' 
                      }}
                    >
                      {step.error || step.description}
                    </Text>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>

          {/* Error State Actions */}
          {initState.hasErrors && (
            <Stack horizontal tokens={{ childrenGap: 12 }}>
              <DefaultButton
                text="Retry"
                iconProps={{ iconName: 'Refresh' }}
                onClick={retryInitialization}
              />
              <PrimaryButton
                text="Continue Anyway"
                iconProps={{ iconName: 'Forward' }}
                onClick={() => setInitState(prev => ({ ...prev, isComplete: true }))}
              />
            </Stack>
          )}

          {/* Loading Animation */}
          {!initState.hasErrors && (
            <Spinner 
              size={SpinnerSize.medium} 
              styles={{
                root: {
                  color: 'var(--themePrimary, #0078d4)'
                }
              }}
            />
          )}

        </Stack>
      </Stack>
    );
  }

  // Show error boundary if critical errors occurred
  if (initState.hasErrors) {
    const criticalErrors = initState.steps.filter(step => 
      step.status === 'error' && ['spcontext', 'config'].includes(step.id)
    );

    if (criticalErrors.length > 0) {
      return (
        <Stack
          horizontalAlign="center"
          verticalAlign="center"
          style={{ minHeight: '100vh', padding: '20px' }}
        >
          <MessageBar
            messageBarType={MessageBarType.error}
            isMultiline
            styles={{ root: { maxWidth: '600px' } }}
          >
            <Text variant="medium" style={{ fontWeight: 600 }}>
              Critical Initialization Error
            </Text>
            <Text variant="small">
              The application failed to initialize properly. Please check your network connection 
              and ensure you have the necessary permissions to access SharePoint.
            </Text>
            <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: '12px' }}>
              <DefaultButton
                text="Retry"
                iconProps={{ iconName: 'Refresh' }}
                onClick={retryInitialization}
              />
              <DefaultButton
                text="Contact Support"
                iconProps={{ iconName: 'Help' }}
                onClick={() => window.open('mailto:support@company.com', '_blank')}
              />
            </Stack>
          </MessageBar>
        </Stack>
      );
    }
  }

  // Render children when initialization is complete
  return <>{children}</>;
};

// CSS for loading animation
const styles = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('app-initializer-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'app-initializer-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
```


```
/* Request Container - Responsive & Enhanced Styles */
/* Place this in RequestContainer.module.scss or global CSS */

/* ==================== MAIN CONTAINER ==================== */
.request-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: var(--neutralLighterAlt, #faf9f8);
  min-height: 100vh;
  
  /* CSS Grid for better layout control */
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 20px;
  
  /* Smooth scrolling */
  scroll-behavior: smooth;
}

/* ==================== STATUS BANNER ==================== */
.status-banner {
  grid-column: 1 / -1;
  margin-bottom: 0;
  animation: slideInFromTop 0.4s ease-out;
}

.status-banner .ms-MessageBar {
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  padding: 16px 20px !important;
}

/* Banner animation */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== HEADER SECTION ==================== */
.request-header {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
  border: 1px solid var(--neutralLight, #edebe9);
  position: relative;
  overflow: hidden;
}

/* Header background pattern */
.request-header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 100%;
  background: linear-gradient(135deg, var(--themeLighterAlt, #eff6fc) 0%, transparent 50%);
  opacity: 0.5;
  pointer-events: none;
}

.request-header-content {
  position: relative;
  z-index: 1;
}

/* Workflow section */
.workflow-section {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--neutralLighterAlt, #faf9f8);
  border-radius: 8px;
  border: 1px solid var(--neutralLighter, #f3f2f1);
}

/* Request info bar */
.request-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.request-details h2 {
  margin: 0 0 8px 0;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.request-type {
  font-size: clamp(20px, 4vw, 28px);
  font-weight: 600;
  color: var(--themePrimary, #0078d4);
  text-decoration: none;
}

.request-id {
  font-size: clamp(14px, 3vw, 18px);
  font-weight: 500;
  color: var(--neutralSecondary, #605e5c);
  background: var(--neutralLighter, #f3f2f1);
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid var(--neutralTertiaryAlt, #c8c6c4);
  white-space: nowrap;
}

.request-title {
  font-size: clamp(14px, 2.5vw, 16px);
  color: var(--neutralSecondary, #605e5c);
  margin: 0;
  font-weight: 400;
}

/* Access management positioning */
.access-management {
  flex-shrink: 0;
}

/* ==================== MAIN LAYOUT ==================== */
.request-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  align-items: start;
  min-height: 0; /* Important for proper grid behavior */
}

/* Form column */
.form-column {
  min-width: 0; /* Prevents overflow in grid */
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Comments column */
.comments-column {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  min-width: 0; /* Prevents overflow */
}

/* ==================== COMMENTS CONTAINER ==================== */
.comments-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--neutralLight, #edebe9);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.comments-container.expanded {
  height: 600px;
}

.comments-container.collapsed {
  height: 64px;
}

/* Comments header */
.comments-header {
  padding: 16px 20px;
  background: var(--neutralLighterAlt, #faf9f8);
  border-bottom: 1px solid var(--neutralLighter, #f3f2f1);
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.comments-header:hover {
  background: var(--neutralLighter, #f3f2f1);
}

.comments-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--neutralPrimary, #323130);
}

.comments-header-icon {
  color: var(--themePrimary, #0078d4);
  font-size: 16px;
}

/* Comments content */
.comments-content {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  overflow-x: hidden;
  background: white;
}

.comments-content::-webkit-scrollbar {
  width: 6px;
}

.comments-content::-webkit-scrollbar-track {
  background: var(--neutralLighter, #f3f2f1);
}

.comments-content::-webkit-scrollbar-thumb {
  background: var(--neutralTertiary, #a19f9d);
  border-radius: 3px;
}

.comments-content::-webkit-scrollbar-thumb:hover {
  background: var(--neutralSecondary, #605e5c);
}

/* ==================== RESPONSIVE BREAKPOINTS ==================== */

/* Large Desktop (1400px+) */
@media (min-width: 1400px) {
  .request-container {
    padding: 32px;
  }
  
  .request-layout {
    gap: 32px;
  }
  
  .form-column {
    gap: 20px;
  }
}

/* Desktop/Laptop (1024px - 1399px) */
@media (max-width: 1399px) and (min-width: 1024px) {
  .request-layout {
    grid-template-columns: 1fr 350px;
    gap: 20px;
  }
  
  .comments-container.expanded {
    height: 500px;
  }
}

/* Tablet (768px - 1023px) */
@media (max-width: 1023px) and (min-width: 768px) {
  .request-container {
    padding: 16px;
    gap: 16px;
  }
  
  .request-layout {
    grid-template-columns: 1fr 300px;
    gap: 16px;
  }
  
  .request-header {
    padding: 20px;
  }
  
  .workflow-section {
    padding: 12px;
  }
  
  .comments-container.expanded {
    height: 400px;
  }
  
  .comments-column {
    position: static;
    max-height: none;
  }
}

/* Mobile Large (480px - 767px) */
@media (max-width: 767px) {
  .request-container {
    padding: 12px;
    gap: 12px;
  }
  
  .request-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .comments-column {
    order: -1; /* Move comments to top */
    position: static;
    max-height: none;
  }
  
  .request-header {
    padding: 16px;
  }
  
  .request-info-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .request-details h2 {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .access-management {
    align-self: stretch;
  }
  
  .workflow-section {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .comments-container.expanded {
    height: 300px;
  }
  
  .form-column {
    gap: 12px;
  }
}

/* Mobile Small (320px - 479px) */
@media (max-width: 479px) {
  .request-container {
    padding: 8px;
  }
  
  .request-header {
    padding: 12px;
    border-radius: 8px;
  }
  
  .workflow-section {
    padding: 8px;
    margin-bottom: 8px;
  }
  
  .request-info-bar {
    gap: 8px;
  }
  
  .comments-header {
    padding: 12px 16px;
  }
  
  .comments-content {
    padding: 12px 16px;
  }
  
  .comments-container.expanded {
    height: 250px;
  }
}

/* ==================== FORM ENHANCEMENTS ==================== */
.form-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--neutralLight, #edebe9);
  margin-bottom: 16px;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.form-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-section:focus-within {
  box-shadow: 0 0 0 2px var(--themePrimary, #0078d4);
}

/* ==================== LOADING STATES ==================== */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin: 20px 0;
}

.loading-text {
  margin-top: 16px;
  color: var(--neutralSecondary, #605e5c);
  font-size: 14px;
}

/* ==================== ERROR STATES ==================== */
.error-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 24px;
  margin: 20px 0;
  text-align: center;
}

.error-container .ms-MessageBar {
  margin-bottom: 16px;
}

/* ==================== ACCESSIBILITY IMPROVEMENTS ==================== */
@media (prefers-reduced-motion: reduce) {
  .request-container,
  .comments-container,
  .form-section,
  .status-banner {
    animation: none !important;
    transition: none !important;
  }
}

@media (forced-colors: active) {
  .request-header,
  .comments-container,
  .form-section {
    border: 1px solid ButtonBorder !important;
    background: ButtonFace !important;
  }
  
  .request-type {
    color: LinkText !important;
  }
}

/* Focus indicators for keyboard navigation */
.request-header:focus-within,
.comments-header:focus,
.form-section:focus-within {
  outline: 2px solid var(--themePrimary, #0078d4);
  outline-offset: 2px;
}

/* ==================== PRINT STYLES ==================== */
@media print {
  .request-container {
    box-shadow: none;
    background: white;
    padding: 0;
  }
  
  .comments-column {
    display: none; /* Hide comments when printing */
  }
  
  .request-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .form-section {
    box-shadow: none;
    border: 1px solid #ccc;
    break-inside: avoid;
  }
  
  .status-banner {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
}

/* ==================== PERFORMANCE OPTIMIZATIONS ==================== */
.request-container * {
  box-sizing: border-box;
}

/* Optimize repaints for animations */
.comments-container,
.form-section {
  will-change: transform, opacity;
}

.comments-container:not(:hover):not(:focus-within) {
  will-change: auto;
}

/* ==================== DARK MODE SUPPORT ==================== */
@media (prefers-color-scheme: dark) {
  .request-container {
    background: #1e1e1e;
    color: #ffffff;
  }
  
  .request-header,
  .comments-container,
  .form-section {
    background: #2d2d30;
    border-color: #3e3e42;
    color: #ffffff;
  }
  
  .workflow-section,
  .comments-header {
    background: #252526;
  }
  
  .request-id {
    background: #3e3e42;
    border-color: #505053;
    color: #cccccc;
  }
  
  .request-type {
    color: #569cd6;
  }
}

/* ==================== UTILITY CLASSES ==================== */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

```
   import styles from './RequestContainer.module.scss';


 <div className={styles.requestContainer}>
     <div className={styles.requestHeader}>
       // Header content
     </div>
     <div className={styles.requestLayout}>
       // Form and comments
     </div>
   </div>
```
