import * as React from 'react';
import { Stack } from '@fluentui/react';
import { Drawer } from 'devextreme-react/drawer';
import { ListItemComments } from '@pnp/spfx-controls-react/lib/ListItemComments';
import RequestHeader from './RequestHeader';
import RequestTypeSelector from './RequestTypeSelector';
import RequestInfoCard from './RequestForm/RequestInfoCard';
import ApprovalsCard from './RequestForm/ApprovalsCard';
import { useRequestFormStore } from '../../stores/requestFormStore';
import { SPContext } from '../../utilities/context';
import './RequestContainer.scss';

export interface IRequestContainerProps {
  listId: string;
}

const RequestContainer: React.FC<IRequestContainerProps> = ({ listId }) => {
  const { request } = useRequestFormStore();
  const [isCommentsExpanded, setIsCommentsExpanded] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = (): void => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showTypeSelector = !request.id && !request.requestType;
  const showForm = !!request.requestType;
  const showComments = request.status !== 'Draft' && !!request.id;

  const renderFormContent = (): JSX.Element => {
    return (
      <div className="request-form-content">
        {showTypeSelector && <RequestTypeSelector />}

        {showForm && (
          <>
            <RequestInfoCard />
            <ApprovalsCard />
          </>
        )}
      </div>
    );
  };

  const renderCommentsPanel = (): JSX.Element => {
    return (
      <div className="comments-panel-wrapper">
        <div className="comments-header">
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
            <span className="comments-title">Comments</span>
            <button
              className="comments-toggle"
              onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
              aria-label={isCommentsExpanded ? 'Collapse comments' : 'Expand comments'}
            >
              <i className={`ms-Icon ms-Icon--${isCommentsExpanded ? 'ChevronUp' : 'ChevronDown'}`} />
            </button>
          </Stack>
        </div>

        {isCommentsExpanded && (
          <div className="comments-content">
            <ListItemComments
              webUrl={SPContext.webAbsoluteUrl}
              listId={listId}
              itemId={request.id!}
              serviceScope={SPContext.spContext.serviceScope}
            />
          </div>
        )}
      </div>
    );
  };

  if (!showComments) {
    return (
      <div className="request-container">
        <RequestHeader />
        <div className="request-body-no-drawer">
          {renderFormContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="request-container">
      <RequestHeader />

      <div className="drawer-container">
        <Drawer
          opened={isCommentsExpanded}
          openedStateMode={isMobile ? 'overlap' : 'shrink'}
          position="right"
          revealMode={isMobile ? 'slide' : 'expand'}
          render={renderCommentsPanel}
          height="100%"
          minSize={isMobile ? 0 : 40}
          maxSize={isMobile ? 320 : 400}
          className="request-drawer"
        >
          <div className="request-body-with-drawer">
            {renderFormContent()}
          </div>
        </Drawer>
      </div>
    </div>
  );
};

export default RequestContainer;
