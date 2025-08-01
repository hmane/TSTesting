 const accounts: string[] = this.parseAccountValues(event.fieldValue);
    const maxDisplayCount = this.properties.maxDisplayCount || 10;
    const maxLines = this.properties.maxLines || 3;
    const preferredSeparator = this.properties.preferredSeparator || ', ';

    const accountField: React.ReactElement<IAccountFieldProps> = React.createElement(AccountField, {
      accounts: accounts,
      maxDisplayCount: maxDisplayCount,
      context: this.context,
      maxLines: maxLines,
      preferredSeparator: preferredSeparator
    });

    ReactDOM.render(accountField, event.domElement);





import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { BaseComponentContext } from '@microsoft/sp-component-base';
import { TooltipHost, ITooltipHostStyles } from '@fluentui/react/lib/Tooltip';
import { Link } from '@fluentui/react/lib/Link';
import { DirectionalHint } from '@fluentui/react/lib/common/DirectionalHint';

export interface IAccountFieldProps {
  accounts: string[];
  maxDisplayCount: number;
  context: BaseComponentContext;
  maxLines?: number;           // Maximum lines before truncating
  preferredSeparator?: string; // Separator to use (default: ', ')
}

const AccountField: React.FC<IAccountFieldProps> = ({ 
  accounts, 
  maxDisplayCount, 
  context,
  maxLines = 3,
  preferredSeparator = ', '
}) => {
  const [showAll, setShowAll] = useState<boolean>(false);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!accounts || accounts.length === 0) {
    return <span>-</span>;
  }

  // Check if content is overflowing based on maxLines or width
  useEffect(() => {
    if (contentRef.current && !showAll) {
      const element = contentRef.current;
      const lineHeight = 1.4; // em
      const maxHeight = maxLines * lineHeight;
      const elementHeight = element.scrollHeight / parseFloat(getComputedStyle(element).fontSize);
      
      const isHeightOverflow = elementHeight > maxHeight;
      const isWidthOverflow = element.scrollWidth > element.clientWidth;
      
      setIsOverflowing(isHeightOverflow || isWidthOverflow);
    } else {
      setIsOverflowing(false);
    }
  }, [accounts, showAll, maxLines]);

  const displayAccounts = showAll ? accounts : accounts.slice(0, maxDisplayCount);
  const hasMore = accounts.length > maxDisplayCount;
  const shouldShowTooltip = !showAll && (hasMore || isOverflowing);

  const handleShowAllClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setShowAll(true);
  };

  const renderAccountsWithWrapping = (accountsToRender: string[]) => {
    if (showAll) {
      // When showing all, display in a more structured way with no line limits
      return (
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 0',
          lineHeight: '1.3'
        }}>
          {accountsToRender.map((account, index) => (
            <React.Fragment key={index}>
              <span style={{ 
                wordBreak: 'break-word',
                whiteSpace: 'nowrap'
              }}>
                {account.trim()}
              </span>
              {index < accountsToRender.length - 1 && (
                <span style={{ marginRight: '4px' }}>{preferredSeparator.trim()}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      );
    } else {
      // When showing limited accounts, use natural text flow with line clamping
      const accountText = accountsToRender.map(account => account.trim()).join(preferredSeparator);
      return (
        <div style={{ 
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical' as any,
          overflow: 'hidden'
        }}>
          {accountText}
        </div>
      );
    }
  };

  const renderTooltipContent = () => (
    <div style={{ 
      maxWidth: '320px', 
      maxHeight: '250px', 
      overflowY: 'auto',
      padding: '4px'
    }}>
      <div style={{ 
        fontWeight: '600', 
        marginBottom: '6px',
        fontSize: '13px'
      }}>
        All Accounts ({accounts.length}):
      </div>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '4px',
        fontSize: '12px',
        lineHeight: '1.4'
      }}>
        {accounts.map((account, index) => (
          <div 
            key={index} 
            style={{ 
              padding: '2px 4px',
              backgroundColor: '#f8f9fa',
              borderRadius: '3px',
              wordBreak: 'break-word'
            }}
          >
            {account.trim()}
          </div>
        ))}
      </div>
    </div>
  );

  const tooltipStyles: Partial<ITooltipHostStyles> = {
    root: {
      display: 'block',
      width: '100%',
      cursor: shouldShowTooltip ? 'help' : 'default'
    }
  };

  const mainContent = (
    <div style={{ width: '100%' }}>
      <div 
        ref={contentRef}
        style={{ 
          width: '100%'
        }}
      >
        {renderAccountsWithWrapping(displayAccounts)}
      </div>
      
      {hasMore && !showAll && (
        <div style={{ 
          marginTop: '6px',
          borderTop: '1px solid #edebe9',
          paddingTop: '4px'
        }}>
          <Link 
            onClick={handleShowAllClick}
            styles={{
              root: {
                fontSize: '11px',
                fontWeight: '600',
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
                color: '#0078d4',
                display: 'inline-block'
              }
            }}
          >
            + Show {accounts.length - maxDisplayCount} more
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      width: '100%',
      minHeight: '24px',
      padding: '4px 2px',
      fontSize: '13px',
      fontFamily: '"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif'
    }}>
      {shouldShowTooltip ? (
        <TooltipHost
          content={renderTooltipContent()}
          directionalHint={DirectionalHint.topLeftEdge}
          styles={tooltipStyles}
          delay={300}
          maxWidth={350}
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
