import * as React from 'react';
import {
  IconButton,
  DefaultButton,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  MessageBar,
  MessageBarType,
  Stack,
  Text,
  TooltipHost,
  DirectionalHint,
  Spinner,
  SpinnerSize,
} from '@fluentui/react';
import { FileTypeIcon, IconType } from '@pnp/spfx-controls-react/lib/FileTypeIcon';
import './ApprovalFileUpload.scss';

export interface IExistingFile {
  name: string;
  url: string;
  size: number;
  timeCreated: string;
  timeLastModified?: string;
  createdBy?: string;
  modifiedBy?: string;
  uniqueId: string;
  version?: string;
}

export interface IFileChangeState {
  addedFiles: File[];
  removedFiles: IExistingFile[];
  currentFiles: (File | IExistingFile)[];
}

export interface IApprovalFileUploadProps {
  documentType: string;
  existingFiles?: IExistingFile[];
  onFilesChange: (state: IFileChangeState) => void;
  isNewRequest: boolean;
  required?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
  siteUrl: string;
  listId: string;
  itemId?: number;
}

interface IFileItem {
  file: File | IExistingFile;
  isExisting: boolean;
}

const ApprovalFileUpload: React.FC<IApprovalFileUploadProps> = ({
  documentType,
  existingFiles = [],
  onFilesChange,
  isNewRequest,
  required = false,
  maxFiles,
  maxFileSize,
  disabled = false,
  siteUrl,
  listId,
  itemId,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);

  const [addedFiles, setAddedFiles] = React.useState<File[]>([]);
  const [removedFiles, setRemovedFiles] = React.useState<IExistingFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false);
  const [fileToRemove, setFileToRemove] = React.useState<IExistingFile | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [showVersionModal, setShowVersionModal] = React.useState(false);
  const [versionFileUrl, setVersionFileUrl] = React.useState<string>('');

  const currentFiles = React.useMemo(() => {
    const existing = existingFiles.filter(ef => !removedFiles.some(rf => rf.uniqueId === ef.uniqueId));
    return [...existing, ...addedFiles];
  }, [existingFiles, addedFiles, removedFiles]);

  React.useEffect(() => {
    onFilesChange({
      addedFiles,
      removedFiles,
      currentFiles: currentFiles as (File | IExistingFile)[],
    });
  }, [addedFiles, removedFiles, currentFiles]);

  const isExistingFile = (file: File | IExistingFile): file is IExistingFile => {
    return 'url' in file && 'uniqueId' in file;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (maxFileSize && file.size > maxFileSize) {
        errors.push(`${file.name} exceeds maximum file size of ${formatFileSize(maxFileSize)}`);
        return;
      }

      if (maxFiles && currentFiles.length + valid.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} file(s) allowed`);
        return;
      }

      const isDuplicate = currentFiles.some(cf => {
        if (cf instanceof File) {
          return cf.name === file.name && cf.size === file.size;
        }
        return cf.name === file.name;
      });

      if (isDuplicate) {
        errors.push(`${file.name} already exists`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setErrorMessage(errors.join('; '));
      setTimeout(() => setErrorMessage(''), 5000);
    }

    if (valid.length > 0) {
      setAddedFiles(prev => [...prev, ...valid]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setErrorMessage(errors.join('; '));
      setTimeout(() => setErrorMessage(''), 5000);
    }

    if (valid.length > 0) {
      setAddedFiles(prev => [...prev, ...valid]);
    }
  };

  const handleRemoveFile = (file: File | IExistingFile): void => {
    if (isExistingFile(file)) {
      if (isNewRequest) {
        setRemovedFiles(prev => [...prev, file]);
      } else {
        setFileToRemove(file);
        setShowRemoveDialog(true);
      }
    } else {
      setAddedFiles(prev => prev.filter(f => f !== file));
    }
  };

  const confirmRemoveFile = (): void => {
    if (fileToRemove) {
      setRemovedFiles(prev => [...prev, fileToRemove]);
      setFileToRemove(null);
    }
    setShowRemoveDialog(false);
  };

  const cancelRemoveFile = (): void => {
    setFileToRemove(null);
    setShowRemoveDialog(false);
  };

  const handleFileClick = (file: File | IExistingFile): void => {
    if (isExistingFile(file)) {
      const viewUrl = `${siteUrl}/_layouts/15/WopiFrame.aspx?sourcedoc=${file.uniqueId}&action=view`;
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVersionClick = (e: React.MouseEvent, file: IExistingFile): void => {
    e.stopPropagation();
    const versionUrl = `${siteUrl}/_layouts/15/Versions.aspx?list=${listId}&ID=${itemId}&FileName=${encodeURIComponent(file.name)}`;
    setVersionFileUrl(versionUrl);
    setShowVersionModal(true);
  };

  const renderFileTooltip = (file: IExistingFile): JSX.Element => {
    return (
      <div className="file-tooltip-content">
        <Text variant="small" block><strong>Created:</strong> {new Date(file.timeCreated).toLocaleString()}</Text>
        {file.createdBy && <Text variant="small" block><strong>Created by:</strong> {file.createdBy}</Text>}
        {file.timeLastModified && (
          <Text variant="small" block><strong>Modified:</strong> {new Date(file.timeLastModified).toLocaleString()}</Text>
        )}
        {file.modifiedBy && <Text variant="small" block><strong>Modified by:</strong> {file.modifiedBy}</Text>}
        {file.version && (
          <Text variant="small" block>
            <strong>Version:</strong> {file.version}{' '}
            
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleVersionClick(e as any, file);
              }}
              className="version-link"
            >
              (View history)
            </a>
          </Text>
        )}
      </div>
    );
  };

  const renderFileItem = (item: IFileItem): JSX.Element => {
    const { file, isExisting } = item;
    const fileName = file.name;
    const fileSize = file.size;
    const extension = getFileExtension(fileName);

    const fileElement = (
      <div
        className={`file-item ${isExisting ? 'existing-file' : 'new-file'}`}
        key={isExisting ? (file as IExistingFile).uniqueId : fileName}
      >
        <div className="file-info">
          <div className="file-icon">
            <FileTypeIcon
              type={IconType.image}
              path={fileName}
              size={20}
            />
          </div>
          <div className="file-details">
            <Text
              variant="medium"
              className={`file-name ${isExisting ? 'clickable' : ''}`}
              onClick={() => isExisting && handleFileClick(file)}
            >
              {fileName}
            </Text>
            <Text variant="small" className="file-size">
              {formatFileSize(fileSize)}
            </Text>
          </div>
        </div>
        <div className="file-actions">
          <IconButton
            iconProps={{ iconName: 'Delete' }}
            title="Remove file"
            ariaLabel="Remove file"
            disabled={disabled}
            onClick={() => handleRemoveFile(file)}
            className="remove-file-btn"
          />
        </div>
      </div>
    );

    if (isExisting) {
      return (
        <TooltipHost
          content={renderFileTooltip(file as IExistingFile)}
          directionalHint={DirectionalHint.topCenter}
          key={(file as IExistingFile).uniqueId}
        >
          {fileElement}
        </TooltipHost>
      );
    }

    return fileElement;
  };

  const fileItems: IFileItem[] = currentFiles.map(file => ({
    file,
    isExisting: isExistingFile(file),
  }));

  return (
    <div className="approval-file-upload">
      {errorMessage && (
        <MessageBar
          messageBarType={MessageBarType.error}
          onDismiss={() => setErrorMessage('')}
          dismissButtonAriaLabel="Close"
        >
          {errorMessage}
        </MessageBar>
      )}

      <div
        ref={dropZoneRef}
        className={`compact-drop-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Text variant="medium" className="drop-zone-text">
            Drop files or
          </Text>
          <DefaultButton
            text="Select Files"
            iconProps={{ iconName: 'Attach' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || (maxFiles !== undefined && currentFiles.length >= maxFiles)}
          />
          {maxFileSize && (
            <Text variant="small" className="file-limit-text">
              (Max: {formatFileSize(maxFileSize)})
            </Text>
          )}
          {maxFiles && (
            <Text variant="small" className="file-limit-text">
              ({currentFiles.length}/{maxFiles} files)
            </Text>
          )}
        </Stack>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </div>

      {fileItems.length > 0 && (
        <div className="file-list">
          <Text variant="mediumPlus" className="file-list-title">
            Uploaded Files ({fileItems.length})
          </Text>
          <div className="file-items">
            {fileItems.map(item => renderFileItem(item))}
          </div>
        </div>
      )}

      {!isNewRequest && (
        <Dialog
          hidden={!showRemoveDialog}
          onDismiss={cancelRemoveFile}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Remove File?',
            subText: fileToRemove
              ? `Are you sure you want to remove "${fileToRemove.name}"? This file will be deleted when you save the request.`
              : '',
          }}
          modalProps={{
            isBlocking: true,
          }}
        >
          <DialogFooter>
            <PrimaryButton onClick={confirmRemoveFile} text="Remove File" />
            <DefaultButton onClick={cancelRemoveFile} text="Cancel" />
          </DialogFooter>
        </Dialog>
      )}

      <Dialog
        hidden={!showVersionModal}
        onDismiss={() => setShowVersionModal(false)}
        modalProps={{
          isBlocking: false,
          styles: { main: { maxWidth: 800, minHeight: 600 } },
        }}
        dialogContentProps={{
          type: DialogType.close,
          title: 'Version History',
        }}
      >
        {showVersionModal && (
          <iframe
            src={versionFileUrl}
            style={{ width: '100%', height: '500px', border: 'none' }}
            title="Version History"
          />
        )}
        <DialogFooter>
          <DefaultButton onClick={() => setShowVersionModal(false)} text="Close" />
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ApprovalFileUpload;
