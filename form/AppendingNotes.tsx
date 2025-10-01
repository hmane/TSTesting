import * as React from 'react';
import { Text, Spinner, SpinnerSize, Link } from '@fluentui/react';
import { LivePersona } from '@pnp/spfx-controls-react/lib/LivePersona';
import { SPContext } from '../../utilities/context';
import { TextArea } from 'devextreme-react/text-area';
import './AppendingNotes.scss';

export interface IAppendingNote {
  version: string;
  content: string;
  createdBy: string;
  createdByEmail?: string;
  createdDate: Date;
}

export interface IAppendingNotesProps {
  listId: string;
  itemId?: number;
  fieldName: string;
  value?: string;
  onValueChanged?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
  maxLength?: number;
  maxPreviousVisible?: number;
  className?: string;
}

const AppendingNotes: React.FC<IAppendingNotesProps> = ({
  listId,
  itemId,
  fieldName,
  value = '',
  onValueChanged,
  placeholder = 'Add your notes here...',
  disabled = false,
  height = 100,
  maxLength = 2000,
  maxPreviousVisible = 5,
  className = '',
}) => {
  const [previousNotes, setPreviousNotes] = React.useState<IAppendingNote[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (itemId) {
      loadPreviousNotes();
    }
  }, [itemId, listId, fieldName]);

  const loadPreviousNotes = async (): Promise<void> => {
    if (!itemId) return;

    setIsLoading(true);
    setError(null);

    try {
      const versions = await SPContext.sp.web.lists
        .getById(listId)
        .items.getById(itemId)
        .versions()
        .select('VersionLabel', fieldName, 'Created', 'Editor/Title', 'Editor/EMail')
        .expand('Editor')
        .orderBy('Created', false)
        .top(50)();

      const notes: IAppendingNote[] = versions
        .filter(v => v[fieldName] && v[fieldName].trim() !== '')
        .map(v => ({
          version: v.VersionLabel,
          content: v[fieldName],
          createdBy: v.Editor?.Title || 'Unknown User',
          createdByEmail: v.Editor?.EMail,
          createdDate: new Date(v.Created),
        }));

      setPreviousNotes(notes);

      SPContext.logger.info('Previous notes loaded', {
        fieldName,
        itemId,
        count: notes.length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load previous notes';
      setError(errorMessage);

      SPContext.logger.error('Failed to load previous notes', err, {
        fieldName,
        itemId,
        listId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleValueChanged = (e: any): void => {
    if (onValueChanged) {
      onValueChanged(e.value);
    }
  };

  const visibleNotes = showAll ? previousNotes : previousNotes.slice(0, maxPreviousVisible);
  const hasMoreNotes = previousNotes.length > maxPreviousVisible;
  const hasPreviousNotes = previousNotes.length > 0;

  return (
    <div className={`appending-notes ${className}`}>
      {!disabled && (
        <div className="current-note-section">
          <TextArea
            value={value}
            onValueChanged={handleValueChanged}
            placeholder={placeholder}
            height={height}
            maxLength={maxLength}
            disabled={disabled}
            stylingMode="outlined"
          />
          {maxLength && (
            <div className="character-count">
              <Text variant="small">
                {value.length} / {maxLength} characters
              </Text>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="loading-section">
          <Spinner size={SpinnerSize.small} label="Loading previous notes..." />
        </div>
      )}

      {error && (
        <div className="error-section">
          <Text variant="small" className="error-text">
            {error}
          </Text>
        </div>
      )}

      {!isLoading && !error && hasPreviousNotes && (
        <div className="previous-notes-section">
          <div className="previous-notes-header">
            <Text variant="mediumPlus" className="section-title">
              Previous Comments ({previousNotes.length})
            </Text>
          </div>

          <div className="notes-list">
            {visibleNotes.map((note, index) => (
              <div key={`${note.version}-${index}`} className="note-item">
                <div className="note-header">
                  <div className="note-author">
                    <LivePersona
                      upn={note.createdByEmail || note.createdBy}
                      serviceScope={SPContext.spContext.serviceScope}
                      disableHover={false}
                    />
                  </div>
                  <div className="note-metadata">
                    <Text variant="medium" className="author-name">
                      {note.createdBy}
                    </Text>
                    <Text variant="small" className="note-timestamp">
                      {formatDate(note.createdDate)}
                    </Text>
                  </div>
                </div>
                <div className="note-content">
                  <Text variant="small">{note.content}</Text>
                </div>
              </div>
            ))}
          </div>

          {hasMoreNotes && !showAll && (
            <div className="show-all-section">
              <Link onClick={() => setShowAll(true)} className="show-all-link">
                Show All ({previousNotes.length} comments)
              </Link>
            </div>
          )}

          {showAll && hasMoreNotes && (
            <div className="show-all-section">
              <Link onClick={() => setShowAll(false)} className="show-all-link">
                Show Less
              </Link>
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && !hasPreviousNotes && disabled && (
        <div className="no-comments-section">
          <div className="no-comments-content">
            <i className="ms-Icon ms-Icon--Comment no-comments-icon" />
            <Text variant="medium" className="no-comments-text">
              No previous comments
            </Text>
            <Text variant="small" className="no-comments-subtext">
              Comments will appear here once added
            </Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppendingNotes;
