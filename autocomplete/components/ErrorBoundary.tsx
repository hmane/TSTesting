// components/ErrorBoundary.tsx
import * as React from 'react';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { Icon } from '@fluentui/react/lib/Icon';
import { Stack } from '@fluentui/react/lib/Stack';
import { Text } from '@fluentui/react/lib/Text';
import { DefaultButton } from '@fluentui/react/lib/Button';
import { AutocompleteError, AutocompleteErrorType } from '../types/AutocompleteTypes';
import './ErrorBoundary.scss';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      errorId: this.generateErrorId(),
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: ErrorBoundary.prototype.generateErrorId(),
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { onError, componentName = 'Autocomplete' } = this.props;
    
    // Log error details for debugging
    console.error(`${componentName} Error:`, {
      error,
      errorInfo,
      errorId: this.state.errorId,
      retryCount: this.retryCount,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  private generateErrorId(): string {
    return `autocomplete-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleRetry = (): void => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: undefined,
        errorId: this.generateErrorId(),
      });
    }
  };

  private getErrorMessage(error: Error): string {
    if (error instanceof AutocompleteError) {
      switch (error.type) {
        case AutocompleteErrorType.DATA_SOURCE_ERROR:
          return 'Failed to load data. Please check your data source configuration.';
        case AutocompleteErrorType.CACHE_ERROR:
          return 'There was an issue with recent selections cache.';
        case AutocompleteErrorType.VALIDATION_ERROR:
          return 'Invalid configuration or data provided.';
        default:
          return error.message;
      }
    }
    
    return 'An unexpected error occurred while loading the autocomplete component.';
  }

  private getErrorType(error: Error): MessageBarType {
    if (error instanceof AutocompleteError) {
      switch (error.type) {
        case AutocompleteErrorType.DATA_SOURCE_ERROR:
          return MessageBarType.error;
        case AutocompleteErrorType.CACHE_ERROR:
          return MessageBarType.warning;
        case AutocompleteErrorType.VALIDATION_ERROR:
          return MessageBarType.severeWarning;
        default:
          return MessageBarType.error;
      }
    }
    
    return MessageBarType.error;
  }

  public render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallbackComponent: FallbackComponent, componentName = 'Autocomplete' } = this.props;

    if (!hasError) {
      return children;
    }

    if (error && FallbackComponent) {
      return <FallbackComponent error={error} retry={this.handleRetry} />;
    }

    const canRetry = this.retryCount < this.maxRetries;
    const errorMessage = error ? this.getErrorMessage(error) : 'Unknown error occurred';
    const messageBarType = error ? this.getErrorType(error) : MessageBarType.error;

    return (
      <div className="autocomplete-error-boundary">
        <MessageBar
          messageBarType={messageBarType}
          isMultiline={true}
          onDismiss={canRetry ? this.handleRetry : undefined}
          dismissButtonAriaLabel="Retry"
        >
          <Stack tokens={{ childrenGap: 8 }}>
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Icon 
                iconName="ErrorBadge" 
                styles={{
                  root: {
                    color: 'var(--palette-red)',
                    fontSize: 16,
                  }
                }}
              />
              <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                {componentName} Error
              </Text>
            </Stack>
            
            <Text variant="small" styles={{ root: { color: 'var(--palette-neutralSecondary)' } }}>
              {errorMessage}
            </Text>

            {error && process.env.NODE_ENV === 'development' && (
              <details className="autocomplete-error-details">
                <summary>Technical Details (Development Mode)</summary>
                <Stack tokens={{ childrenGap: 4 }} styles={{ root: { marginTop: 8 } }}>
                  <Text variant="tiny" styles={{ root: { fontFamily: 'monospace' } }}>
                    Error ID: {this.state.errorId}
                  </Text>
                  <Text variant="tiny" styles={{ root: { fontFamily: 'monospace' } }}>
                    Type: {error.constructor.name}
                  </Text>
                  <Text variant="tiny" styles={{ root: { fontFamily: 'monospace' } }}>
                    Message: {error.message}
                  </Text>
                  {error.stack && (
                    <pre className="autocomplete-error-stack">
                      {error.stack}
                    </pre>
                  )}
                </Stack>
              </details>
            )}

            {canRetry && (
              <Stack horizontal tokens={{ childrenGap: 8 }}>
                <DefaultButton
                  iconProps={{ iconName: 'Refresh' }}
                  text={`Retry (${this.maxRetries - this.retryCount} attempts remaining)`}
                  onClick={this.handleRetry}
                  styles={{
                    root: {
                      minWidth: 'auto',
                    }
                  }}
                />
              </Stack>
            )}
          </Stack>
        </MessageBar>
      </div>
    );
  }
}
