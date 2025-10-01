import * as React from 'react';
import { Stack, MessageBar, MessageBarType, PrimaryButton, DefaultButton } from '@fluentui/react';
import { Card, Header, Content, Footer } from '../../../components/Card';
import { LivePersona } from '@pnp/spfx-controls-react/lib/LivePersona';
import { useRequestFormStore } from '../../../stores/requestFormStore';
import { SPContext } from '../../../utilities/context';
import type { Request } from '../../../types/Request';
import './OnHoldCard.scss';

const OnHoldCard: React.FC = () => {
  const { request, resumeRequest } = useRequestFormStore();
  const [isResuming, setIsResuming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const showCard = request.status === 'On Hold';

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    if (diffDays === 0) {
      return `Today at ${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago - ${formattedDate}`;
    } else {
      return formattedDate;
    }
  };

  const handleResume = async (): Promise<void> => {
    setIsResuming(true);
    setError(null);

    try {
      await resumeRequest();

      SPContext.logger.success('Request resumed successfully', {
        requestId: request.id,
        previousStatus: request.previousStatus,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume request';
      setError(errorMessage);

      SPContext.logger.error('Failed to resume request', err, {
        requestId: request.id,
      });
    } finally {
      setIsResuming(false);
    }
  };

  if (!showCard) {
    return null;
  }

  return (
    <Card id="on-hold-card" variant="warning" allowExpand={false}>
      <Header>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <i className="ms-Icon ms-Icon--Pause hold-icon" />
          <span className="hold-title">Request On Hold</span>
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

        <div className="on-hold-content">
          <div className="hold-banner">
            <div className="banner-icon">
              <i className="ms-Icon ms-Icon--Pause" />
            </div>
            <div className="banner-text">
              <h3>This request has been temporarily paused</h3>
              <p>The request will remain on hold until it is manually resumed.</p>
            </div>
          </div>

          <div className="hold-details">
            <div className="detail-section">
              <div className="detail-header">
                <i className="ms-Icon ms-Icon--Contact" />
                <span>Put On Hold By</span>
              </div>
              <div className="detail-content">
                <div className="persona-wrapper">
                  <LivePersona
                    upn={request.onHoldBy}
                    serviceScope={SPContext.spContext.serviceScope}
                    disableHover={false}
                  />
                </div>
                <div className="detail-info">
                  <div className="detail-name">{request.onHoldBy}</div>
                  <div className="detail-date">{formatDate(request.onHoldSince)}</div>
                </div>
              </div>
            </div>

            {request.onHoldReason && (
              <div className="detail-section">
                <div className="detail-header">
                  <i className="ms-Icon ms-Icon--Message" />
                  <span>Reason</span>
                </div>
                <div className="reason-content">
                  <p>{request.onHoldReason}</p>
                </div>
              </div>
            )}

            {request.previousStatus && (
              <div className="detail-section">
                <div className="detail-header">
                  <i className="ms-Icon ms-Icon--Info" />
                  <span>Previous Status</span>
                </div>
                <div className="status-content">
                  <span className="previous-status-badge">{request.previousStatus}</span>
                  <span className="status-note">
                    The request will resume to this status when taken off hold
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Content>

      <Footer>
        <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="space-between">
          <div className="hold-duration">
            <i className="ms-Icon ms-Icon--Clock" />
            <span>
              On hold for{' '}
              {Math.floor((new Date().getTime() - new Date(request.onHoldSince!).getTime()) / 86400000)}{' '}
              days
            </span>
          </div>
          <PrimaryButton
            text={isResuming ? 'Resuming...' : 'Resume Request'}
            iconProps={{ iconName: 'Play' }}
            onClick={handleResume}
            disabled={isResuming}
          />
        </Stack>
      </Footer>
    </Card>
  );
};

export default OnHoldCard;
