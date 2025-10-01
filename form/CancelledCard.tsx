import * as React from 'react';
import { Stack, MessageBar, MessageBarType } from '@fluentui/react';
import { Card, Header, Content } from '../../../components/Card';
import { LivePersona } from '@pnp/spfx-controls-react/lib/LivePersona';
import { useRequestFormStore } from '../../../stores/requestFormStore';
import { SPContext } from '../../../utilities/context';
import type { Request } from '../../../types/Request';
import './CancelledCard.scss';

const CancelledCard: React.FC = () => {
  const { request } = useRequestFormStore();

  const showCard = request.status === 'Cancelled';

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

  if (!showCard) {
    return null;
  }

  return (
    <Card id="cancelled-card" variant="error" allowExpand={false}>
      <Header>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <i className="ms-Icon ms-Icon--StatusErrorFull cancelled-icon" />
          <span className="cancelled-title">Request Cancelled</span>
        </Stack>
      </Header>

      <Content>
        <div className="cancelled-content">
          <div className="cancelled-banner">
            <div className="banner-icon">
              <i className="ms-Icon ms-Icon--Cancel" />
            </div>
            <div className="banner-text">
              <h3>This request has been cancelled</h3>
              <p>
                This request will not proceed further and cannot be reopened. All progress has been
                stopped.
              </p>
            </div>
          </div>

          <div className="cancelled-details">
            <div className="detail-section">
              <div className="detail-header">
                <i className="ms-Icon ms-Icon--Contact" />
                <span>Cancelled By</span>
              </div>
              <div className="detail-content">
                <div className="persona-wrapper">
                  <LivePersona
                    upn={request.cancelledBy}
                    serviceScope={SPContext.spContext.serviceScope}
                    disableHover={false}
                  />
                </div>
                <div className="detail-info">
                  <div className="detail-name">{request.cancelledBy}</div>
                  <div className="detail-date">{formatDate(request.cancelledOn)}</div>
                </div>
              </div>
            </div>

            {request.cancelReason && (
              <div className="detail-section">
                <div className="detail-header">
                  <i className="ms-Icon ms-Icon--Message" />
                  <span>Cancellation Reason</span>
                </div>
                <div className="reason-content">
                  <p>{request.cancelReason}</p>
                </div>
              </div>
            )}

            <div className="detail-section info-section">
              <div className="detail-header">
                <i className="ms-Icon ms-Icon--Info" />
                <span>Additional Information</span>
              </div>
              <div className="info-content">
                <div className="info-item">
                  <i className="ms-Icon ms-Icon--RemoveLink" />
                  <span>This request cannot be reopened or resumed</span>
                </div>
                <div className="info-item">
                  <i className="ms-Icon ms-Icon--Archive" />
                  <span>All data and history are preserved for audit purposes</span>
                </div>
                <div className="info-item">
                  <i className="ms-Icon ms-Icon--Refresh" />
                  <span>Submit a new request if needed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Content>
    </Card>
  );
};

export default CancelledCard;
