import * as React from 'react';
import { useState } from 'react';
import { BaseComponentContext } from '@microsoft/sp-component-base';
import { TooltipHost, ITooltipHostStyles } from '@fluentui/react/lib/Tooltip';
import { Link } from '@fluentui/react/lib/Link';
import { DirectionalHint } from '@fluentui/react/lib/common/DirectionalHint';

export interface IAccountFieldProps {
  accounts: string[];
  maxDisplayCount: number;
  context: BaseComponentContext;
}

const AccountField: React.FC<IAccountFieldProps> = ({ accounts, maxDisplayCount, context }) => {
  const [showAll, setShowAll] = useState<boolean>(false);

  if (!accounts || accounts.length === 0) {
    return <span>-</span>;
  }

  const displayAccounts = showAll ? accounts : accounts.slice(0, maxDisplayCount);
  const hasMore = accounts.length > maxDisplayCount;
  const shouldShowTooltip = !showAll && hasMore;

  const handleShowAllClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setShowAll(true);
  };

  const renderAccountList = (accountsToRender: string[], withLineBreaks: boolean = false) => {
    if (withLineBreaks) {
      return (
        <div>
          {accountsToRender.map((account, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              {account.trim()}
            </div>
          ))}
        </div>
      );
    } else {
      return accountsToRender.join(', ');
    }
  };

  const tooltipContent = shouldShowTooltip ? (
    <div style={{ maxWidth: '300px', maxHeight: '200px', overflowY: 'auto' }}>
      <strong>All Accounts ({accounts.length}):</strong>
      <div style={{ marginTop: '4px' }}>
        {renderAccountList(accounts, true)}
      </div>
    </div>
  ) : null;

  const tooltipStyles: Partial<ITooltipHostStyles> = {
    root: {
      display: 'inline-block',
      cursor: shouldShowTooltip ? 'help' : 'default'
    }
  };

  const mainContent = (
    <span>
      {renderAccountList(displayAccounts)}
      {hasMore && !showAll && (
        <>
          {' '}
          <Link 
            onClick={handleShowAllClick}
            styles={{
              root: {
                fontSize: '12px',
                fontWeight: '600',
                textDecoration: 'underline'
              }
            }}
          >
            Show all ({accounts.length})
          </Link>
        </>
      )}
    </span>
  );

  return (
    <div style={{ 
      lineHeight: '1.4',
      wordBreak: 'break-word',
      maxWidth: '100%'
    }}>
      {shouldShowTooltip ? (
        <TooltipHost
          content={tooltipContent}
          directionalHint={DirectionalHint.topLeftEdge}
          styles={tooltipStyles}
          delay={0}
        >
          {mainContent}
        </TooltipHost>
      ) : (
        mainContent
      )}
    </div>
  );
};

export { AccountField };
