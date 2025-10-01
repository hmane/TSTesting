import * as React from 'react';
import { Stack, Text } from '@fluentui/react';
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
