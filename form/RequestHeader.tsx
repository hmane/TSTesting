import * as React from 'react';
import { Stack, Text, TooltipHost, DirectionalHint } from '@fluentui/react';
import { ManageAccessComponent } from '../ManageAccess';
import { useRequestFormStore } from '../../stores/requestFormStore';
import { SPContext } from '../../utilities/context';
import './RequestHeader.scss';

const RequestHeader: React.FC = () => {
  const { request } = useRequestFormStore();

  const getRequestTypeTitle = (): string => {
    if (!request.requestType) return 'New Request';
    return request.requestType;
  };

  const getRequestTypeIcon = (): string => {
    switch (request.requestType) {
      case 'Communication':
        return 'Mail';
      case 'General Review':
        return 'DocumentSearch';
      case 'IMA Review':
        return 'Financial';
      default:
        return 'DocumentManagement';
    }
  };

  const showManageAccess = !!request.id && request.status !== 'Draft';

  const handlePermissionChanged = async (
    operation: 'add' | 'remove',
    principals: any[]
  ): Promise<boolean> => {
    try {
      SPContext.logger.info('Permission change requested', {
        operation,
        principalCount: principals.length,
        requestId: request.id,
      });

      return true;
    } catch (error) {
      SPContext.logger.error('Permission change failed', error, {
        operation,
        requestId: request.id,
      });
      return false;
    }
  };

  const formatRushTooltip = (): JSX.Element => {
    return (
      <div className="rush-tooltip-content">
        <div className="rush-tooltip-header">
          <i className="ms-Icon ms-Icon--LightningBolt" />
          <strong>Rush Request</strong>
        </div>
        <div className="rush-tooltip-body">
          <p>This request requires expedited review.</p>
          {request.targetReturnDate && (
            <div className="rush-detail">
              <span className="rush-label">Target Date:</span>
              <span className="rush-value">
                {new Date(request.targetReturnDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
          {request.rushRational && (
            <div className="rush-detail">
              <span className="rush-label">Reason:</span>
              <span className="rush-value">{request.rushRational}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="request-header">
      <div className="request-type-title">
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
          <i className={`ms-Icon ms-Icon--${getRequestTypeIcon()} type-icon`} />
          <Text variant="xxLarge" className="title-text">
            {getRequestTypeTitle()}
          </Text>
          {request.id && (
            <div className="request-id-badge">
              {request.title || `CRR-${new Date().getFullYear()}-${request.id}`}
            </div>
          )}
          {request.isRushRequest && (
            <TooltipHost
              content={formatRushTooltip()}
              directionalHint={DirectionalHint.bottomCenter}
              styles={{
                root: { display: 'inline-block' },
              }}
              tooltipProps={{
                styles: {
                  root: {
                    maxWidth: 320,
                  },
                },
              }}
            >
              <div className="rush-indicator">
                <i className="ms-Icon ms-Icon--LightningBolt rush-icon" />
                <span className="rush-text">Rush</span>
              </div>
            </TooltipHost>
          )}
        </Stack>
      </div>

      <div className="header-actions">
        {showManageAccess && (
          <ManageAccessComponent
            spContext={SPContext.spContext}
            itemId={request.id!}
            listId={SPContext.listId!}
            permissionTypes="both"
            onPermissionChanged={handlePermissionChanged}
            maxAvatars={5}
          />
        )}
      </div>
    </div>
  );
};

export default RequestHeader;
