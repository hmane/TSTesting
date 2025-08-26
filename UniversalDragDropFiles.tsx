import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { DocumentRegular, DismissRegular } from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-theme';
import { FileTypeIcon, IconType, ApplicationType, ImageSize } from '@pnp/spfx-controls-react/lib/FileTypeIcon';
import { Spinner } from "@fluentui/react-components";

// Interfaces
interface IUniversalDragDropFilesProps {
  // Core functionality
  onDrop: (files: File[]) => void;
  onError?: (error: string) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onFilesCleared?: () => void;
  
  // File restrictions
  accept?: string[];
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  minFileSize?: number;
  
  // Visual customization
  className?: string;
  disabled?: boolean;
  
  // Advanced options
  dropEffect?: 'copy' | 'move' | 'link';
  showBrowseButton?: boolean;
  showOverlay?: boolean;
  overlayText?: string;
  
  // File display and management
  showDroppedFiles?: boolean;
  clearFilesOnNewDrop?: boolean;
  maxDisplayFiles?: number;
  
  // Styling
  style?: React.CSSProperties;
  overlayStyle?: React.CSSProperties;
  browseButtonStyle?: React.CSSProperties;
  fileListStyle?: React.CSSProperties;
  
  // Content
  children?: React.ReactNode;
  
  // Validation callbacks
  validateFile?: (file: File) => boolean | string;
  onFileValidation?: (file: File, isValid: boolean, error?: string) => void;
}

interface IUniversalDragDropFilesRef {
  clearDroppedFiles: () => void;
}

interface IFileValidationResult {
  isValid: boolean;
  error?: string;
}

// Styles using Fluent UI
const useStyles = makeStyles({
  root: {
    position: 'relative',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.23, 1)',
  },
  
  dropZone: {
    ...shorthands.border('2px', 'dashed', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding('32px', '24px'),
    backgroundColor: tokens.colorNeutralBackground2,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.23, 1)',
    minHeight: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    fontFamily: tokens.fontFamilyBase,
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.border('2px', 'dashed', tokens.colorBrandStroke1),
    },
    
    '&:focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorBrandStroke1),
      outlineOffset: '2px',
    }
  },
  
  dropZoneDisabled: {
    cursor: 'not-allowed',
    opacity: '0.6',
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
      ...shorthands.border('2px', 'dashed', tokens.colorNeutralStroke2),
    }
  },
  
  dropZoneActive: {
    ...shorthands.border('2px', 'solid', tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
    transform: 'scale(1.02)',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: `0 4px 16px ${tokens.colorNeutralShadowAmbient}`
  },
  
  dropZoneDragOver: {
    ...shorthands.border('2px', 'solid', tokens.colorPaletteGreenBorder1),
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  
  wrappedContent: {
    position: 'relative',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.23, 1)',
  },
  
  wrappedContentActive: {
    boxShadow: `0 0 0 2px ${tokens.colorBrandStroke1}`,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: `${tokens.colorBrandBackground2}10`,
  },
  
  overlay: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: `${tokens.colorBrandBackground2}20`,
    ...shorthands.border('2px', 'dashed', tokens.colorBrandStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: '1000',
    backdropFilter: 'blur(2px)',
  },
  
  overlayContent: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding('24px', '32px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    textAlign: 'center',
    boxShadow: tokens.shadow16,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    fontFamily: tokens.fontFamilyBase,
  },
  
  overlayIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  
  overlayTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    marginBottom: '4px',
  },
  
  overlaySubtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  
  browseButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    ...shorthands.padding('8px', '16px'),
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    ...shorthands.border('none'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    cursor: 'pointer',
    zIndex: '999',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.23, 1)',
    boxShadow: tokens.shadow4,
    fontFamily: tokens.fontFamilyBase,
    
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
    
    '&:focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorStrokeFocus2),
    }
  },
  
  processingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: '1001',
    pointerEvents: 'none',
    backgroundColor: `${tokens.colorNeutralBackground1}e6`,
    ...shorthands.borderRadius('50%'),
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: tokens.shadow8,
  },
  
  fileList: {
    marginTop: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontFamily: tokens.fontFamilyBase,
  },
  
  fileListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  
  fileListTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  
  clearButton: {
    ...shorthands.padding('6px', '12px'),
    backgroundColor: 'transparent',
    color: tokens.colorBrandForeground1,
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.23, 1)',
    fontFamily: tokens.fontFamilyBase,
    
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorNeutralForegroundOnBrand,
    }
  },
  
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('12px'),
    ...shorthands.margin('4px', '0'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.23, 1)',
    
    '&:hover': {
      boxShadow: tokens.shadow4,
    }
  },
  
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    minWidth: '0',
  },
  
  fileIcon: {
    fontSize: '20px',
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    
    // Style for PnP FileTypeIcon
    '& img': {
      width: '20px',
      height: '20px',
    }
  },
  
  fileDetails: {
    flex: '1',
    minWidth: '0',
  },
  
  fileName: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  
  fileSize: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  
  removeButton: {
    ...shorthands.padding('6px'),
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground2,
    ...shorthands.border('none'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.23, 1)',
    marginLeft: '8px',
    
    '&:hover': {
      backgroundColor: tokens.colorPaletteRedBackground1,
      color: tokens.colorPaletteRedForeground1,
    }
  },
  
  spinAnimation: {
    animationName: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' }
    },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear'
  }
});

// Main Component
const UniversalDragDropFiles = forwardRef<IUniversalDragDropFilesRef, IUniversalDragDropFilesProps>(
  (props, ref) => {
    const {
      onDrop,
      onError,
      onDragEnter,
      onDragLeave,
      onFilesCleared,
      accept = [],
      multiple = true,
      maxFiles,
      maxFileSize,
      minFileSize,
      className,
      disabled = false,
      dropEffect = 'copy',
      showBrowseButton = false,
      showOverlay = true,
      overlayText = 'Drop files here',
      showDroppedFiles = false,
      clearFilesOnNewDrop = true,
      maxDisplayFiles = 10,
      style,
      overlayStyle,
      browseButtonStyle,
      fileListStyle,
      children,
      validateFile,
      onFileValidation
    } = props;

    const styles = useStyles();
    
    // State
    const [isDragOver, setIsDragOver] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [draggedItemsCount, setDraggedItemsCount] = useState(0);
    const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
    
    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounterRef = useRef(0);
    const dragLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Expose public methods
    useImperativeHandle(ref, () => ({
      clearDroppedFiles: () => {
        setDroppedFiles([]);
        onFilesCleared?.();
      }
    }));

    // Clear dropped files
    const clearDroppedFiles = useCallback(() => {
      setDroppedFiles([]);
      onFilesCleared?.();
    }, [onFilesCleared]);

    // Remove individual file
    const removeFile = useCallback((indexToRemove: number) => {
      setDroppedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    }, []);

    // Enhanced file type validation
    const isValidFileType = useCallback((file: File): boolean => {
      if (!accept || accept.length === 0) return true;
      
      return accept.some(acceptedType => {
        const type = acceptedType.toLowerCase();
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        
        if (type.startsWith('.')) {
          return fileName.endsWith(type);
        } else if (type.includes('/')) {
          if (type.endsWith('*')) {
            const baseType = type.slice(0, -1);
            return fileType.startsWith(baseType);
          }
          return fileType === type;
        } else {
          return fileName.includes(type) || fileType.includes(type);
        }
      });
    }, [accept]);

    // Enhanced file size validation
    const isValidFileSize = useCallback((file: File): IFileValidationResult => {
      if (minFileSize && file.size < minFileSize) {
        const minSizeMB = Math.round(minFileSize / 1024 / 1024 * 100) / 100;
        return { isValid: false, error: `File too small (min ${minSizeMB}MB)` };
      }
      
      if (maxFileSize && file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / 1024 / 1024 * 100) / 100;
        return { isValid: false, error: `File too large (max ${maxSizeMB}MB)` };
      }
      
      return { isValid: true };
    }, [maxFileSize, minFileSize]);

    // Custom file validation
    const validateCustom = useCallback((file: File): IFileValidationResult => {
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
    }, [validateFile, onFileValidation]);

    // Process and validate files
    const processFiles = useCallback((fileList: FileList | File[]): File[] => {
      const files = Array.from(fileList);
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
        if (!isValidFileType(file)) {
          validationErrors.push(`${file.name} - Invalid file type`);
        }
        
        // File size validation
        const sizeValidation = isValidFileSize(file);
        if (!sizeValidation.isValid && sizeValidation.error) {
          validationErrors.push(`${file.name} - ${sizeValidation.error}`);
        }
        
        // Custom validation
        const customValidation = validateCustom(file);
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
    }, [maxFiles, multiple, isValidFileType, isValidFileSize, validateCustom, onError]);

    // Handle valid files and manage state
    const handleValidFiles = useCallback((files: File[]) => {
      // Always call onDrop to give files to parent
      onDrop(files);

      // Only manage internal file state if showDroppedFiles is true
      if (showDroppedFiles) {
        setDroppedFiles(prev => clearFilesOnNewDrop ? files : [...prev, ...files]);
      } else if (clearFilesOnNewDrop) {
        // Clear internal state even if not showing files
        setDroppedFiles([]);
      }
    }, [onDrop, showDroppedFiles, clearFilesOnNewDrop]);

    // Enhanced drag-drop handling for multiple sources
    const handleUniversalDragDrop = useCallback(async (dataTransfer: DataTransfer): Promise<File[]> => {
      const files: File[] = [];

      try {
        // Handle regular files first (File Explorer, desktop files)
        if (dataTransfer.files && dataTransfer.files.length > 0) {
          files.push(...Array.from(dataTransfer.files));
        }

        // Handle drag from OneDrive/SharePoint (special handling)
        if (dataTransfer.items) {
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

        // Handle Outlook and other application drag-drop (files only)
        if (dataTransfer.items) {
          const items = Array.from(dataTransfer.items);
          
          for (const item of items) {
            try {
              if (item.kind === 'file' && !files.find(f => f.name === item.getAsFile()?.name)) {
                const file = item.getAsFile();
                if (file) {
                  files.push(file);
                }
              }
            } catch (itemError) {
              console.warn('Error processing drag item:', itemError);
            }
          }
        }

      } catch (error) {
        console.error('Error processing drag data:', error);
      }

      return files;
    }, []);

    // Handle paste events (files only, no text)
    const handlePaste = useCallback((e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Only handle files from clipboard, ignore text
      if (clipboardData.files && clipboardData.files.length > 0) {
        const files = processFiles(Array.from(clipboardData.files));
        if (files.length > 0) {
          handleValidFiles(files);
        }
      }
    }, [processFiles, handleValidFiles]);

    // Add paste event listener
    React.useEffect(() => {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    // Drag event handlers
    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (disabled) return;
      
      // Clear any pending drag leave timeout
      if (dragLeaveTimeoutRef.current) {
        clearTimeout(dragLeaveTimeoutRef.current);
        dragLeaveTimeoutRef.current = null;
      }
      
      dragCounterRef.current++;
      
      // Check if we have draggable items
      const hasItems = (e.dataTransfer.items && e.dataTransfer.items.length > 0) ||
                       (e.dataTransfer.files && e.dataTransfer.files.length > 0) ||
                       e.dataTransfer.types.includes('Files');
      
      if (hasItems) {
        const itemCount = e.dataTransfer.items ? e.dataTransfer.items.length : 
                         e.dataTransfer.files ? e.dataTransfer.files.length : 1;
        
        setIsDragOver(true);
        setIsDragActive(true);
        setDraggedItemsCount(itemCount);
        onDragEnter?.();
      }
    }, [disabled, onDragEnter]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (disabled) return;
      
      dragCounterRef.current--;
      
      // Use timeout to prevent flickering when dragging over child elements
      dragLeaveTimeoutRef.current = setTimeout(() => {
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0;
          setIsDragOver(false);
          setIsDragActive(false);
          setDraggedItemsCount(0);
          onDragLeave?.();
        }
      }, 50);
    }, [disabled, onDragLeave]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (disabled) return;
      
      // Set the drop effect
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = dropEffect;
      }
    }, [disabled, dropEffect]);

    const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Clear timeout and reset state
      if (dragLeaveTimeoutRef.current) {
        clearTimeout(dragLeaveTimeoutRef.current);
        dragLeaveTimeoutRef.current = null;
      }
      
      setIsDragOver(false);
      setIsDragActive(false);
      setIsProcessing(true);
      setDraggedItemsCount(0);
      dragCounterRef.current = 0;
      
      if (disabled) return;

      try {
        const droppedFiles = await handleUniversalDragDrop(e.dataTransfer);
        
        if (droppedFiles.length === 0) {
          onError?.('No valid files were dropped');
          return;
        }
        
        const validFiles = processFiles(droppedFiles);
        
        if (validFiles.length > 0) {
          handleValidFiles(validFiles);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Drop failed';
        onError?.(`Drop failed: ${errorMessage}`);
      } finally {
        setIsProcessing(false);
      }
    }, [disabled, handleUniversalDragDrop, processFiles, handleValidFiles, onError]);

    // Click to browse files
    const handleClick = useCallback(() => {
      if (!disabled && fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, [disabled]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = processFiles(Array.from(e.target.files));
        if (files.length > 0) {
          handleValidFiles(files);
        }
        // Reset input
        e.target.value = '';
      }
    }, [processFiles, handleValidFiles]);

    // Format file size for display
    const formatFileSize = useCallback((bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }, []);

    // Get file icon using PnP FileTypeIcon - it auto-detects from filename
    const getFileTypeIcon = useCallback((file: File, size: ImageSize = ImageSize.small) => {
      // Create a dummy path with the actual filename for FileTypeIcon to work with
      const dummyPath = `https://contoso.sharepoint.com/documents/${file.name}`;
      
      return (
        <FileTypeIcon
          type={IconType.image}
          size={size}
          path={dummyPath}
        />
      );
    }, []);

    // Build CSS classes
    const cssClasses = [
      styles.root,
      className,
      children ? styles.wrappedContent : styles.dropZone,
      disabled && styles.dropZoneDisabled,
      isDragActive && (children ? styles.wrappedContentActive : styles.dropZoneActive),
      isDragOver && !children && styles.dropZoneDragOver
    ].filter(Boolean).join(' ');

    // Build accept attribute for file input
    const acceptAttribute = accept && accept.length > 0 ? accept.join(',') : undefined;
    const displayFiles = maxDisplayFiles ? droppedFiles.slice(0, maxDisplayFiles) : droppedFiles;

    return (
      <div className={styles.root}>
        <div
          className={cssClasses}
          style={style}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={children ? undefined : handleClick}
          role={children ? undefined : "button"}
          tabIndex={children ? undefined : (disabled ? -1 : 0)}
          aria-disabled={disabled}
          aria-label="Universal drag and drop zone for files from any source"
          title="Drop files from File Explorer, Outlook, OneDrive, or any application"
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptAttribute}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={disabled}
          />
          
          {/* Content */}
          {children ? (
            <>
              {children}
              
              {/* Drag feedback overlay for wrapped content */}
              {showOverlay && (isDragActive || isDragOver) && (
                <div className={styles.overlay} style={overlayStyle}>
                  <div className={styles.overlayContent}>
                    <div className={styles.overlayIcon}>
                      <DocumentRegular />
                    </div>
                    <div className={styles.overlayTitle}>
                      {isDragActive ? 'Drop now!' : overlayText}
                    </div>
                    {draggedItemsCount > 0 && (
                      <div className={styles.overlaySubtitle}>
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
                  onClick={handleClick}
                  className={styles.browseButton}
                  style={browseButtonStyle}
                  title="Browse files from your computer"
                >
                  Browse
                </button>
              )}
            </>
          ) : (
            // Default standalone content (only if no children)
            !children && (
              <>
                <div style={{ 
                  fontSize: tokens.fontSizeBase500, 
                  fontWeight: tokens.fontWeightSemibold,
                  marginBottom: tokens.spacingVerticalXS, 
                  color: tokens.colorNeutralForeground1,
                }}>
                  {isProcessing ? 'Processing files...' : 
                   isDragActive ? 'Drop files now!' : 
                   'Drop files here'}
                </div>
                <div style={{ 
                  fontSize: tokens.fontSizeBase200, 
                  color: tokens.colorNeutralForeground2, 
                  marginBottom: tokens.spacingVerticalXS,
                }}>
                  Supports File Explorer, Outlook, OneDrive & more
                </div>
                {draggedItemsCount > 0 && (
                  <div style={{ 
                    fontSize: tokens.fontSizeBase200, 
                    color: tokens.colorBrandForeground1, 
                    fontWeight: tokens.fontWeightSemibold,
                  }}>
                    {draggedItemsCount} item{draggedItemsCount > 1 ? 's' : ''} ready
                  </div>
                )}
                {!isProcessing && (
                  <div style={{ 
                    fontSize: tokens.fontSizeBase100, 
                    color: tokens.colorNeutralForeground3, 
                    marginTop: tokens.spacingVerticalXS,
                  }}>
                    or click to browse
                  </div>
                )}
              </>
            )
          )}
          
          {/* Processing indicator */}
          {isProcessing && (
            <div className={styles.processingIndicator}>
              <Spinner size="medium" />
            </div>
          )}
        </div>

        {/* Dropped Files List */}
        {showDroppedFiles && droppedFiles.length > 0 && (
          <div className={styles.fileList} style={fileListStyle}>
            {/* Header with clear button */}
            <div className={styles.fileListHeader}>
              <div className={styles.fileListTitle}>
                Files ({droppedFiles.length})
              </div>
              <button
                type="button"
                onClick={clearDroppedFiles}
                className={styles.clearButton}
                title="Clear all files"
              >
                Clear All
              </button>
            </div>

            {/* File items */}
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {displayFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className={styles.fileItem}
                >
                  <div className={styles.fileInfo}>
                    <div className={styles.fileIcon}>
                      {getFileTypeIcon(file, ImageSize.small)}
                    </div>
                    <div className={styles.fileDetails}>
                      <div className={styles.fileName}>
                        {file.name}
                      </div>
                      <div className={styles.fileSize}>
                        {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className={styles.removeButton}
                    title={`Remove ${file.name}`}
                  >
                    <DismissRegular />
                  </button>
                </div>
              ))}
            </div>

            {/* Show more indicator */}
            {maxDisplayFiles && droppedFiles.length > maxDisplayFiles && (
              <div style={{
                textAlign: 'center',
                marginTop: tokens.spacingVerticalXS,
                padding: tokens.spacingVerticalXS,
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground2,
                fontStyle: 'italic'
              }}>
                ... and {droppedFiles.length - maxDisplayFiles} more file{droppedFiles.length - maxDisplayFiles > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

UniversalDragDropFiles.displayName = 'UniversalDragDropFiles';

export default UniversalDragDropFiles;
export type { IUniversalDragDropFilesProps, IUniversalDragDropFilesRef };
