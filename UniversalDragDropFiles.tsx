import React, { Component, createRef } from 'react';

interface IUniversalDragDropFilesProps {
  // Core functionality
  onDrop: (files: File[]) => void;
  onError?: (error: string) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  
  // File restrictions
  accept?: string[]; // e.g., ['.pdf', '.docx', '.jpg']
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  minFileSize?: number; // in bytes
  
  // Visual customization
  iconName?: string;
  labelMessage?: string;
  className?: string;
  disabled?: boolean;
  
  // Advanced options
  dropEffect?: 'copy' | 'move' | 'link';
  showBrowseButton?: boolean;
  showOverlay?: boolean;
  overlayText?: string;
  
  // Styling
  style?: React.CSSProperties;
  overlayStyle?: React.CSSProperties;
  browseButtonStyle?: React.CSSProperties;
  
  // Content
  children?: React.ReactNode;
  
  // Enable/disable specific sources
  allowOutlookDrop?: boolean;
  allowOneDriveDrop?: boolean;
  allowFileDrop?: boolean;
  allowTextDrop?: boolean;
  
  // Validation callbacks
  validateFile?: (file: File) => boolean | string;
  onFileValidation?: (file: File, isValid: boolean, error?: string) => void;
}

interface IUniversalDragDropFilesState {
  isDragOver: boolean;
  isDragActive: boolean;
  isProcessing: boolean;
  draggedItemsCount: number;
}

class UniversalDragDropFiles extends Component<IUniversalDragDropFilesProps, IUniversalDragDropFilesState> {
  private dragCounter: number = 0;
  private fileInputRef = createRef<HTMLInputElement>();
  private dragLeaveTimeoutRef: NodeJS.Timeout | null = null;

  static defaultProps: Partial<IUniversalDragDropFilesProps> = {
    multiple: true,
    disabled: false,
    dropEffect: 'copy',
    showBrowseButton: true,
    showOverlay: true,
    allowOutlookDrop: true,
    allowOneDriveDrop: true,
    allowFileDrop: true,
    allowTextDrop: true,
    accept: [],
    overlayText: 'Drop files here'
  };

  constructor(props: IUniversalDragDropFilesProps) {
    super(props);
    
    this.state = {
      isDragOver: false,
      isDragActive: false,
      isProcessing: false,
      draggedItemsCount: 0
    };

    // Bind methods for class component
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleFileInputChange = this.handleFileInputChange.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
  }

  componentDidMount(): void {
    // Add paste event listener for Outlook/OneDrive content
    if (this.props.allowTextDrop || this.props.allowOutlookDrop) {
      document.addEventListener('paste', this.handlePaste);
    }
  }

  componentWillUnmount(): void {
    if (this.dragLeaveTimeoutRef) {
      clearTimeout(this.dragLeaveTimeoutRef);
    }
    document.removeEventListener('paste', this.handlePaste);
  }

  // Handle paste events (useful for Outlook content)
  private handlePaste = (e: ClipboardEvent): void => {
    if (!this.props.allowTextDrop && !this.props.allowOutlookDrop) return;

    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const files: File[] = [];

    // Handle files from clipboard
    if (clipboardData.files && clipboardData.files.length > 0) {
      files.push(...Array.from(clipboardData.files));
    }

    // Handle text/HTML content from clipboard (Outlook emails)
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');

    if (htmlData && htmlData.trim()) {
      const htmlFile = new File([htmlData], 'pasted-content.html', {
        type: 'text/html',
        lastModified: Date.now()
      });
      files.push(htmlFile);
    } else if (textData && textData.trim()) {
      const textFile = new File([textData], 'pasted-content.txt', {
        type: 'text/plain',
        lastModified: Date.now()
      });
      files.push(textFile);
    }

    if (files.length > 0) {
      const validFiles = this.processFiles(files);
      if (validFiles.length > 0) {
        this.props.onDrop(validFiles);
      }
    }
  };

  // Enhanced file type validation
  private isValidFileType = (file: File): boolean => {
    const { accept } = this.props;
    if (!accept || accept.length === 0) return true;
    
    return accept.some(acceptedType => {
      const type = acceptedType.toLowerCase();
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      
      if (type.startsWith('.')) {
        // Extension check
        return fileName.endsWith(type);
      } else if (type.includes('/')) {
        // MIME type check (exact or wildcard)
        if (type.endsWith('*')) {
          const baseType = type.slice(0, -1);
          return fileType.startsWith(baseType);
        }
        return fileType === type;
      } else {
        // Flexible matching
        return fileName.includes(type) || fileType.includes(type);
      }
    });
  };

  // Enhanced file size validation
  private isValidFileSize = (file: File): { isValid: boolean; error?: string } => {
    const { maxFileSize, minFileSize } = this.props;
    
    if (minFileSize && file.size < minFileSize) {
      const minSizeMB = Math.round(minFileSize / 1024 / 1024 * 100) / 100;
      return { isValid: false, error: `File too small (min ${minSizeMB}MB)` };
    }
    
    if (maxFileSize && file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / 1024 / 1024 * 100) / 100;
      return { isValid: false, error: `File too large (max ${maxSizeMB}MB)` };
    }
    
    return { isValid: true };
  };

  // Custom file validation
  private validateCustom = (file: File): { isValid: boolean; error?: string } => {
    const { validateFile, onFileValidation } = this.props;
    
    if (!validateFile) return { isValid: true };
    
    try {
      const result = validateFile(file);
      
      if (typeof result === 'boolean') {
        const isValid = result;
        onFileValidation?.(file, isValid, isValid ? undefined : 'Custom validation failed');
        return { isValid, error: isValid ? undefined : 'Custom validation failed' };
      } else {
        const isValid = result === true || result === '';
        const error = typeof result === 'string' && result ? result : undefined;
        onFileValidation?.(file, isValid, error);
        return { isValid, error };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Validation error';
      onFileValidation?.(file, false, errorMsg);
      return { isValid: false, error: errorMsg };
    }
  };

  // Process and validate files
  private processFiles = (fileList: FileList | File[]): File[] => {
    const files = Array.from(fileList);
    const { maxFiles, multiple, onError } = this.props;
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Check file count
    if (maxFiles && files.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} file(s) allowed`);
      return [];
    }

    // Single file mode
    if (!multiple && files.length > 1) {
      onError?.('Only one file is allowed');
      return [];
    }

    // Validate each file
    for (const file of files) {
      const validationErrors: string[] = [];
      
      // File type validation
      if (!this.isValidFileType(file)) {
        validationErrors.push(`${file.name} - Invalid file type`);
      }
      
      // File size validation
      const sizeValidation = this.isValidFileSize(file);
      if (!sizeValidation.isValid && sizeValidation.error) {
        validationErrors.push(`${file.name} - ${sizeValidation.error}`);
      }
      
      // Custom validation
      const customValidation = this.validateCustom(file);
      if (!customValidation.isValid && customValidation.error) {
        validationErrors.push(`${file.name} - ${customValidation.error}`);
      }
      
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        continue;
      }

      validFiles.push(file);
    }

    // Report errors
    if (errors.length > 0) {
      onError?.(errors.join(', '));
    }

    return validFiles;
  };

  // Enhanced drag-drop handling for multiple sources
  private handleUniversalDragDrop = async (dataTransfer: DataTransfer): Promise<File[]> => {
    const files: File[] = [];
    const { allowFileDrop, allowOutlookDrop, allowOneDriveDrop, allowTextDrop } = this.props;

    try {
      // Handle regular files first (File Explorer, desktop files)
      if (allowFileDrop && dataTransfer.files && dataTransfer.files.length > 0) {
        files.push(...Array.from(dataTransfer.files));
      }

      // Handle drag from OneDrive/SharePoint (special handling)
      if (allowOneDriveDrop && dataTransfer.items) {
        for (const item of Array.from(dataTransfer.items)) {
          if (item.kind === 'string' && item.type.includes('text/uri-list')) {
            const url = await new Promise<string>(resolve => item.getAsString(resolve));
            if (url && (url.includes('sharepoint.com') || url.includes('onedrive'))) {
              // Create a URL file for OneDrive links
              const urlFile = new File([url], 'onedrive-link.url', {
                type: 'text/uri-list',
                lastModified: Date.now()
              });
              files.push(urlFile);
            }
          }
        }
      }

      // Handle Outlook and other application drag-drop
      if ((allowOutlookDrop || allowTextDrop) && dataTransfer.items) {
        const items = Array.from(dataTransfer.items);
        
        for (const item of items) {
          try {
            if (item.kind === 'file' && !files.find(f => f.name === item.getAsFile()?.name)) {
              const file = item.getAsFile();
              if (file) files.push(file);
            } else if (item.kind === 'string') {
              const stringData = await new Promise<string>(resolve => {
                item.getAsString(resolve);
              });
              
              if (stringData && stringData.trim()) {
                // Detect content type and create appropriate file
                if (item.type.includes('html') || stringData.includes('<html')) {
                  const htmlFile = new File([stringData], 'outlook-email.html', {
                    type: 'text/html',
                    lastModified: Date.now()
                  });
                  files.push(htmlFile);
                } else if (item.type.includes('text') || item.type === 'text/plain') {
                  // Skip if it's just a URL we already handled
                  if (!stringData.startsWith('http') || !allowOneDriveDrop) {
                    const textFile = new File([stringData], 'dropped-text.txt', {
                      type: 'text/plain',
                      lastModified: Date.now()
                    });
                    files.push(textFile);
                  }
                }
              }
            }
          } catch (itemError) {
            console.warn('Error processing drag item:', itemError);
          }
        }
      }

      // Fallback: Handle HTML/text data directly
      if (allowTextDrop || allowOutlookDrop) {
        const htmlData = dataTransfer.getData('text/html');
        const textData = dataTransfer.getData('text/plain');
        
        if (htmlData && htmlData.trim() && !files.some(f => f.type === 'text/html')) {
          const htmlFile = new File([htmlData], 'dropped-content.html', {
            type: 'text/html',
            lastModified: Date.now()
          });
          files.push(htmlFile);
        } else if (textData && textData.trim() && !files.some(f => f.type === 'text/plain') && !textData.startsWith('http')) {
          const textFile = new File([textData], 'dropped-text.txt', {
            type: 'text/plain',
            lastModified: Date.now()
          });
          files.push(textFile);
        }
      }

    } catch (error) {
      console.error('Error processing drag data:', error);
    }

    return files;
  };

  // Drag event handlers
  private handleDragEnter = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    if (this.props.disabled) return;
    
    // Clear any pending drag leave timeout
    if (this.dragLeaveTimeoutRef) {
      clearTimeout(this.dragLeaveTimeoutRef);
      this.dragLeaveTimeoutRef = null;
    }
    
    this.dragCounter++;
    
    // Check if we have draggable items
    const hasItems = (e.dataTransfer.items && e.dataTransfer.items.length > 0) ||
                     (e.dataTransfer.files && e.dataTransfer.files.length > 0) ||
                     e.dataTransfer.types.includes('Files') ||
                     e.dataTransfer.types.includes('text/html') ||
                     e.dataTransfer.types.includes('text/plain');
    
    if (hasItems) {
      const itemCount = e.dataTransfer.items ? e.dataTransfer.items.length : 
                       e.dataTransfer.files ? e.dataTransfer.files.length : 1;
      
      this.setState({
        isDragOver: true,
        isDragActive: true,
        draggedItemsCount: itemCount
      });
      
      this.props.onDragEnter?.();
    }
  };

  private handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    if (this.props.disabled) return;
    
    this.dragCounter--;
    
    // Use timeout to prevent flickering when dragging over child elements
    this.dragLeaveTimeoutRef = setTimeout(() => {
      if (this.dragCounter <= 0) {
        this.dragCounter = 0;
        this.setState({
          isDragOver: false,
          isDragActive: false,
          draggedItemsCount: 0
        });
        
        this.props.onDragLeave?.();
      }
    }, 50);
  };

  private handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    if (this.props.disabled) return;
    
    // Set the drop effect
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = this.props.dropEffect || 'copy';
    }
  };

  private handleDrop = async (e: React.DragEvent<HTMLDivElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear timeout and reset state
    if (this.dragLeaveTimeoutRef) {
      clearTimeout(this.dragLeaveTimeoutRef);
      this.dragLeaveTimeoutRef = null;
    }
    
    this.setState({
      isDragOver: false,
      isDragActive: false,
      isProcessing: true,
      draggedItemsCount: 0
    });
    
    this.dragCounter = 0;
    
    if (this.props.disabled) return;

    try {
      const droppedFiles = await this.handleUniversalDragDrop(e.dataTransfer);
      
      if (droppedFiles.length === 0) {
        this.props.onError?.('No valid files were dropped');
        return;
      }
      
      const validFiles = this.processFiles(droppedFiles);
      
      if (validFiles.length > 0) {
        this.props.onDrop(validFiles);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Drop failed';
      this.props.onError?.(`Drop failed: ${errorMessage}`);
    } finally {
      this.setState({ isProcessing: false });
    }
  };

  // Click to browse files
  private handleClick = (): void => {
    if (!this.props.disabled && this.fileInputRef.current) {
      this.fileInputRef.current.click();
    }
  };

  private handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const files = this.processFiles(Array.from(e.target.files));
      if (files.length > 0) {
        this.props.onDrop(files);
      }
      // Reset input
      e.target.value = '';
    }
  };

  private getDefaultStyles = (): React.CSSProperties => {
    const { children, style } = this.props;
    
    return children ? {
      position: 'relative',
      cursor: this.props.disabled ? 'not-allowed' : 'inherit',
      transition: 'all 0.3s ease',
      ...style
    } : {
      border: '2px dashed #d0d7de',
      borderRadius: '8px',
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: '#f6f8fa',
      cursor: this.props.disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      minHeight: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      position: 'relative',
      ...style
    };
  };

  private getDynamicStyles = (): React.CSSProperties => {
    const { children } = this.props;
    const { isDragActive, isDragOver, isProcessing } = this.state;
    const baseStyles = this.getDefaultStyles();
    
    if (children) {
      return {
        ...baseStyles,
        backgroundColor: isDragActive || isDragOver ? 'rgba(0, 122, 204, 0.05)' : 'transparent',
        outline: isDragActive || isDragOver ? '2px solid #0969da' : 'none',
        outlineOffset: '2px',
        opacity: this.props.disabled ? 0.6 : (isProcessing ? 0.8 : 1),
        pointerEvents: isProcessing ? 'none' : 'auto'
      };
    } else {
      return {
        ...baseStyles,
        borderColor: isDragActive ? '#0969da' : (isDragOver ? '#28a745' : '#d0d7de'),
        backgroundColor: isDragActive ? '#e6f3ff' : (isDragOver ? '#d4edda' : '#f6f8fa'),
        borderStyle: isDragActive || isDragOver ? 'solid' : 'dashed',
        transform: isDragActive ? 'scale(1.02)' : 'scale(1)',
        opacity: this.props.disabled ? 0.6 : (isProcessing ? 0.8 : 1),
        pointerEvents: isProcessing ? 'none' : 'auto'
      };
    }
  };

  render(): React.ReactElement<IUniversalDragDropFilesProps> {
    const {
      children,
      className,
      disabled,
      multiple,
      accept,
      showBrowseButton,
      showOverlay,
      overlayText,
      overlayStyle,
      browseButtonStyle,
      iconName,
      labelMessage
    } = this.props;
    
    const { isDragActive, isDragOver, isProcessing, draggedItemsCount } = this.state;

    // Build CSS classes
    const cssClasses = [
      'universal-drag-drop-files',
      className,
      isDragActive ? 'drag-active' : '',
      isDragOver ? 'drag-over' : '',
      isProcessing ? 'processing' : '',
      disabled ? 'disabled' : ''
    ].filter(Boolean).join(' ');

    // Build accept attribute for file input
    const acceptAttribute = accept && accept.length > 0 ? accept.join(',') : undefined;

    const dynamicStyles = this.getDynamicStyles();

    return (
      <div
        className={cssClasses}
        style={dynamicStyles}
        onDragEnter={this.handleDragEnter}
        onDragLeave={this.handleDragLeave}
        onDragOver={this.handleDragOver}
        onDrop={this.handleDrop}
        onClick={children ? undefined : this.handleClick}
        role={children ? undefined : "button"}
        tabIndex={children ? undefined : (disabled ? -1 : 0)}
        aria-disabled={disabled}
        aria-label="Universal drag and drop zone for files from any source"
        title="Drop files from File Explorer, Outlook, OneDrive, or any application"
      >
        {/* Hidden file input */}
        <input
          ref={this.fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptAttribute}
          onChange={this.handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        
        {/* Content */}
        {children ? (
          <>
            {children}
            
            {/* Drag feedback overlay for wrapped content */}
            {showOverlay && (isDragActive || isDragOver) && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(9, 105, 218, 0.1)',
                  border: '2px dashed #0969da',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  ...overlayStyle
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '20px 30px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                    📎
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#0969da', marginBottom: '4px' }}>
                    {isDragActive ? 'Drop now!' : overlayText}
                  </div>
                  {draggedItemsCount > 0 && (
                    <div style={{ fontSize: '14px', color: '#656d76' }}>
                      {draggedItemsCount} item{draggedItemsCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Browse button for wrapped content */}
            {showBrowseButton && !disabled && (
              <button
                type="button"
                onClick={this.handleClick}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '6px 12px',
                  backgroundColor: '#0969da',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  zIndex: 999,
                  opacity: 0.9,
                  transition: 'opacity 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  ...browseButtonStyle
                }}
                title="Browse files from your computer"
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.opacity = '0.9';
                }}
              >
                📂 Browse
              </button>
            )}
          </>
        ) : (
          // Standalone drop zone
          <>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.6 }}>
              {iconName ? iconName : '📎'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#24292f' }}>
              {isProcessing ? 'Processing files...' : 
               isDragActive ? 'Drop files now!' : 
               labelMessage || 'Drop files from anywhere'}
            </div>
            <div style={{ fontSize: '14px', color: '#656d76', marginBottom: '8px' }}>
              Supports File Explorer, Outlook, OneDrive, SharePoint & more
            </div>
            {draggedItemsCount > 0 && (
              <div style={{ fontSize: '13px', color: '#0969da', fontWeight: '500' }}>
                {draggedItemsCount} item{draggedItemsCount > 1 ? 's' : ''} ready to drop
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#8c959f', marginTop: '8px' }}>
              {isProcessing ? 'Please wait...' : 'or click to browse files'}
            </div>
          </>
        )}
        
        {/* Processing indicator */}
        {isProcessing && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1001,
              pointerEvents: 'none'
            }}
          >
            <div style={{ 
              animation: 'spin 1s linear infinite',
              fontSize: '24px'
            }}>
              ⏳
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default UniversalDragDropFiles;
export type { IUniversalDragDropFilesProps, IUniversalDragDropFilesState };

// CSS animation for processing indicator
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Usage examples:

/*
// Example 1: Class Component Usage
class MyClassComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { files: [] };
  }

  handleFileDrop = (files) => {
    console.log('Files dropped:', files);
    this.setState({ files });
  };

  handleError = (error) => {
    console.error('Drop error:', error);
    alert(error);
  };

  validateFile = (file) => {
    if (file.name.includes('temp')) {
      return 'Temporary files are not allowed';
    }
    return true;
  };

  render() {
    return (
      <UniversalDragDropFiles
        onDrop={this.handleFileDrop}
        onError={this.handleError}
        accept={['.pdf', '.docx', '.jpg', '.png', '.html', '.txt']}
        multiple={true}
        maxFiles={10}
        maxFileSize={25 * 1024 * 1024} // 25MB
        validateFile={this.validateFile}
        allowOutlookDrop={true}
        allowOneDriveDrop={true}
        allowFileDrop={true}
      >
        <table style={{ width: '100%', border: '1px solid #ddd' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>John Doe</td><td>john@example.com</td><td>Engineering</td></tr>
            <tr><td>Jane Smith</td><td>jane@example.com</td><td>Marketing</td></tr>
          </tbody>
        </table>
      </UniversalDragDropFiles>
    );
  }
}

// Example 2: Functional Component Usage
const MyFunctionalComponent = () => {
  const [files, setFiles] = useState([]);
  
  const handleFileDrop = useCallback((files) => {
    console.log('Files from all sources:', files);
    setFiles(files);
  }, []);

  return (
    <UniversalDragDropFiles
      onDrop={handleFileDrop}
      onError={(error) => console.error(error)}
      style={{ width: '100%', minHeight: '200px' }}
    />
  );
};

// Example 3: React Hook Form Integration
class FormWithDragDrop extends React.Component {
  constructor(props) {
    super(props);
    this.state = { formFiles: [] };
  }

  handleFormFileDrop = (files) => {
    this.setState({ formFiles: files });
    // You can also call a parent callback here
    if (this.props.onFilesChange) {
      this.props.onFilesChange(files);
    }
  };

  render() {
    return (
      <div>
        <UniversalDragDropFiles
          onDrop={this.handleFormFileDrop}
          onError={(error) => console.error('Form file error:', error)}
          accept={['.pdf', '.docx', '.xlsx']}
          maxFiles={5}
          showOverlay={true}
          overlayText="Drop documents here"
        >
          <form style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <div>
              <label>Name:</label>
              <input type="text" style={{ width: '100%', padding: '8px', margin: '8px 0' }} />
            </div>
            <div>
              <label>Email:</label>
              <input type="email" style={{ width: '100%', padding: '8px', margin: '8px 0' }} />
            </div>
            <div>
              <label>Files: {this.state.formFiles.length} selected</label>
              {this.state.formFiles.map((file, index) => (
                <div key={index} style={{ fontSize: '12px', color: '#666' }}>
                  {file.name} ({Math.round(file.size / 1024)}KB)
                </div>
              ))}
            </div>
            <button type="submit" style={{ padding: '10px 20px', marginTop: '10px' }}>
              Submit
            </button>
          </form>
        </UniversalDragDropFiles>
      </div>
    );
  }
}

// Example 4: Advanced Configuration with Custom Validation
class AdvancedDragDropExample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      validationErrors: [],
      isProcessing: false
    };
  }

  handleFileDrop = (files) => {
    console.log('Received files from multiple sources:', files);
    
    // Log file sources for debugging
    files.forEach(file => {
      console.log(`File: ${file.name}`);
      console.log(`Type: ${file.type}`);
      console.log(`Size: ${file.size} bytes`);
      console.log(`Source: ${this.detectFileSource(file)}`);
    });
    
    this.setState({ files });
  };

  handleError = (error) => {
    console.error('Drag drop error:', error);
    this.setState({ validationErrors: [error] });
  };

  handleDragEnter = () => {
    console.log('Drag entered');
    this.setState({ isProcessing: true });
  };

  handleDragLeave = () => {
    console.log('Drag left');
    this.setState({ isProcessing: false });
  };

  customFileValidation = (file) => {
    // Custom business logic validation
    if (file.name.toLowerCase().includes('confidential')) {
      return 'Confidential files are not allowed';
    }
    
    if (file.type === 'text/html' && file.size > 1024 * 1024) {
      return 'HTML files must be smaller than 1MB';
    }
    
    // Return true for valid files
    return true;
  };

  handleFileValidation = (file, isValid, error) => {
    console.log(`Validation for ${file.name}: ${isValid ? 'PASS' : 'FAIL'}`);
    if (error) {
      console.log(`Validation error: ${error}`);
    }
  };

  detectFileSource = (file) => {
    if (file.type === 'text/html' && file.name.includes('outlook')) {
      return 'Outlook Email';
    } else if (file.type === 'text/uri-list') {
      return 'OneDrive/SharePoint Link';
    } else if (file.name.includes('pasted-content')) {
      return 'Clipboard/Paste';
    } else {
      return 'File System';
    }
  };

  render() {
    const { files, validationErrors, isProcessing } = this.state;

    return (
      <div style={{ padding: '20px' }}>
        <h3>Universal Drag & Drop - All Sources Supported</h3>
        
        {/* Show validation errors */}
        {validationErrors.length > 0 && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb', 
            padding: '10px', 
            borderRadius: '4px',
            marginBottom: '20px',
            color: '#721c24'
          }}>
            {validationErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        <UniversalDragDropFiles
          // Core functionality
          onDrop={this.handleFileDrop}
          onError={this.handleError}
          onDragEnter={this.handleDragEnter}
          onDragLeave={this.handleDragLeave}
          
          // File restrictions
          accept={['.pdf', '.docx', '.jpg', '.png', '.html', '.txt', '.url']}
          multiple={true}
          maxFiles={10}
          maxFileSize={50 * 1024 * 1024} // 50MB
          minFileSize={100} // 100 bytes minimum
          
          // Source controls
          allowOutlookDrop={true}
          allowOneDriveDrop={true}
          allowFileDrop={true}
          allowTextDrop={true}
          
          // Custom validation
          validateFile={this.customFileValidation}
          onFileValidation={this.handleFileValidation}
          
          // UI customization
          showBrowseButton={true}
          showOverlay={true}
          overlayText="Drop files from any source"
          labelMessage="Universal Drop Zone"
          
          // Custom styling
          style={{
            minHeight: '200px',
            border: '3px dashed #007acc',
            backgroundColor: '#f0f8ff'
          }}
          overlayStyle={{
            backgroundColor: 'rgba(0, 122, 204, 0.2)'
          }}
          browseButtonStyle={{
            backgroundColor: '#28a745'
          }}
          
          className="my-custom-dropzone"
        >
          {/* Custom content inside the drop zone */}
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '8px',
            margin: '20px'
          }}>
            <h4>📋 Multi-Source File Drop Zone</h4>
            <p>Drop files from:</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
              <div>📁 File Explorer</div>
              <div>📧 Outlook</div>
              <div>☁️ OneDrive</div>
              <div>🌐 SharePoint</div>
            </div>
            
            {/* Show processing indicator */}
            {isProcessing && (
              <div style={{ marginTop: '20px', color: '#007acc' }}>
                Processing drag operation...
              </div>
            )}
            
            {/* Show dropped files */}
            {files.length > 0 && (
              <div style={{ marginTop: '20px', textAlign: 'left' }}>
                <h5>Dropped Files ({files.length}):</h5>
                {files.map((file, index) => (
                  <div key={index} style={{ 
                    padding: '8px', 
                    margin: '4px 0',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    <strong>{file.name}</strong> 
                    <span style={{ color: '#666' }}>
                      {' '}({Math.round(file.size / 1024)}KB, {file.type || 'unknown type'})
                    </span>
                    <br />
                    <small style={{ color: '#007acc' }}>
                      Source: {this.detectFileSource(file)}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </UniversalDragDropFiles>

        {/* Additional info */}
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <h4>Supported Sources:</h4>
          <ul>
            <li><strong>File Explorer:</strong> Drag files/folders directly</li>
            <li><strong>Outlook:</strong> Drag emails, attachments, embedded content</li>
            <li><strong>OneDrive/SharePoint:</strong> Drag files or share links</li>
            <li><strong>Other Apps:</strong> Most applications with drag-drop support</li>
            <li><strong>Clipboard:</strong> Paste (Ctrl+V) content from any source</li>
          </ul>
          
          <h4>Features:</h4>
          <ul>
            <li>✅ Works with Class and Functional components</li>
            <li>✅ Full TypeScript support</li>
            <li>✅ Advanced file validation</li>
            <li>✅ Custom error handling</li>
            <li>✅ Visual drag feedback</li>
            <li>✅ Accessibility compliant</li>
            <li>✅ Mobile-friendly</li>
            <li>✅ No external dependencies</li>
          </ul>
        </div>
      </div>
    );
  }
}

// Example 5: Simple Wrapper Component
class SimpleTableWrapper extends React.Component {
  handleFiles = (files) => {
    console.log('Files dropped on table:', files);
    // Process files here
  };

  render() {
    return (
      <UniversalDragDropFiles 
        onDrop={this.handleFiles}
        accept={['.csv', '.xlsx', '.xls']}
        overlayText="Drop spreadsheet files here"
      >
        <table style={{ 
          width: '100%', 
          border: '1px solid #ddd', 
          borderCollapse: 'collapse' 
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>ID</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Name</th>
              <th style={{ border: '1px solid #ddd', padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>1</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>John Doe</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>Active</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>2</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>Jane Smith</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>Inactive</td>
            </tr>
          </tbody>
        </table>
      </UniversalDragDropFiles>
    );
  }
}

// Export for use in other files
// export { UniversalDragDropFiles as default, IUniversalDragDropFilesProps, IUniversalDragDropFilesState };
*/
