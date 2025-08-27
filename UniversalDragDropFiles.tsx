import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { makeStyles, shorthands, Spinner } from '@fluentui/react-components';
import { DocumentRegular, DismissRegular } from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-theme';
import { FileTypeIcon, IconType, ImageSize } from '@pnp/spfx-controls-react/lib/FileTypeIcon';

// ========================================
// INTERFACES
// ========================================

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

// ========================================
// STYLES
// ========================================

const useStyles = makeStyles({
  root: {
    position: 'relative',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.23, 1)',
  },
  
  dropZone: {
    ...shorthands.border('2px', 'dashed', tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusMedium,
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
    borderRadius: tokens.borderRadiusMedium,
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
    borderRadius: tokens.borderRadiusMedium,
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
    borderRadius: tokens.borderRadiusMedium,
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
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'center',
    boxShadow: tokens.shadow16,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
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
    border: 'none',
    borderRadius: tokens.borderRadiusMedium,
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
    borderRadius: '50%',
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
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
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
    border: `1px solid ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
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
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
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
    border: 'none',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.23, 1)',
    marginLeft: '8px',
    
    '&:hover': {
      backgroundColor: tokens.colorPaletteRedBackground1,
      color: tokens.colorPaletteRedForeground1,
    }
  }
});

// ========================================
// MAIN COMPONENT
// ========================================

const UniversalDragDropFiles = forwardRef<IUniversalDragDropFilesRef, IUniversalDragDropFilesProps>(
  (props, ref) => {
    // Props destructuring
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
    
    // ========================================
    // STATE & REFS
    // ========================================
    
    const [isDragOver, setIsDragOver] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [draggedItemsCount, setDraggedItemsCount] = useState(0);
    const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounterRef = useRef(0);
    const dragLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ========================================
    // PUBLIC METHODS (REF)
    // ========================================
    
    useImperativeHandle(ref, () => ({
      clearDroppedFiles: () => {
        setDroppedFiles([]);
        onFilesCleared?.();
      }
    }));

    // ========================================
    // FILE VALIDATION FUNCTIONS
    // ========================================
    
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

    const validateCustom = useCallback((file: File): IFileValidationResult => {
      if (!validateFile) return { isValid: true };
      
      try {
        const result = validateFile(file);
        
        if (typeof result === 'boolean') {
          const isValid = result;
          onFileValidation?.(file, isValid, isValid ? undefined : 'Custom validation failed');
          return { isValid, error: isValid ? undefined : 'Custom validation failed' };
        } else {
          const isValid = result === '';
          const error = result ? result : undefined;
          onFileValidation?.(file, isValid, error);
          return { isValid, error };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Validation error';
        onFileValidation?.(file, false, errorMsg);
        return { isValid: false, error: errorMsg };
      }
    }, [validateFile, onFileValidation]);

    const processFiles = useCallback((fileList: FileList | File[]): File[] => {
      const files = Array.from(fileList);
      const validFiles: File[] = [];
      const errors: string[] = [];

      if (maxFiles && files.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} file(s) allowed.`);
      } else if (!multiple && files.length > 1) {
        errors.push('Only one file is allowed.');
      } else {
        for (const file of files) {
          const validationErrors: string[] = [];
          
          if (!isValidFileType(file)) {
            validationErrors.push(`${file.name}: Invalid file type`);
          }
          
          const sizeValidation = isValidFileSize(file);
          if (!sizeValidation.isValid && sizeValidation.error) {
            validationErrors.push(`${file.name}: ${sizeValidation.error}`);
          }
          
          const customValidation = validateCustom(file);
          if (!customValidation.isValid && customValidation.error) {
            validationErrors.push(`${file.name}: ${customValidation.error}`);
          }
          
          if (validationErrors.length > 0) {
            errors.push(...validationErrors);
          } else {
            validFiles.push(file);
          }
        }
      }

      if (errors.length > 0) {
        onError?.(errors.join('\n'));
      }

      return validFiles;
    }, [maxFiles, multiple, isValidFileType, isValidFileSize, validateCustom, onError]);

    // ========================================
    // UNSUPPORTED CONTENT DETECTION & ATTACHMENT HANDLING
    // ========================================
    
    const isEmailAttachment = useCallback((dataTransfer: DataTransfer): boolean => {
      const types = Array.from(dataTransfer.types);
      
      // Email attachments typically come with Files and specific type indicators
      const hasFiles = dataTransfer.files && dataTransfer.files.length > 0;
      const hasFileDescriptor = types.includes('FileGroupDescriptor') || types.includes('FileGroupDescriptorW');
      const hasFileContents = types.includes('FileContents');
      
      // If we have actual files in the dataTransfer.files, it's likely an attachment
      if (hasFiles && (hasFileDescriptor || hasFileContents)) {
        return true;
      }
      
      // Additional check: if we have files and it's from Outlook context, it's probably an attachment
      if (hasFiles && types.some(type => type.includes('application/x-moz-file'))) {
        return true;
      }
      
      return false;
    }, []);

    const detectUnsupportedContent = useCallback((dataTransfer: DataTransfer): string | null => {
      const types = Array.from(dataTransfer.types);
      
      // First check if this might be an email attachment (supported)
      if (isEmailAttachment(dataTransfer)) {
        return null; // Attachments are supported
      }
      
      // Detect full Outlook messages (not attachments)
      const hasOutlookMessageIndicators = types.some(type => 
        type.includes('FileContents') ||
        type.includes('FileGroupDescriptor') ||
        type.includes('FileGroupDescriptorW') ||
        type.includes('CF_HDROP')
      ) || (types.includes('text/html') && types.includes('text/plain'));
      
      // If we have Outlook indicators but no actual files, it's likely a full message
      if (hasOutlookMessageIndicators && (!dataTransfer.files || dataTransfer.files.length === 0)) {
        return "Full Outlook messages are not supported. However, you can drag individual attachments from emails, or save the email as a .msg file to your desktop first.";
      }
      
      // Detect text/string only content (no files)
      if (types.length > 0 && !types.includes('Files') && 
          (types.includes('text/plain') || types.includes('text/html') || types.includes('text/uri-list')) &&
          (!dataTransfer.files || dataTransfer.files.length === 0)) {
        return "Text content and links are not supported. Please drag and drop files or email attachments instead.";
      }
      
      // Detect virtual files that aren't real files
      if (types.includes('application/x-moz-file') && (!dataTransfer.files || dataTransfer.files.length === 0)) {
        return "Virtual files or shortcuts are not supported. Please drag actual files or email attachments from your file system.";
      }
      
      return null;
    }, [isEmailAttachment]);

    // ========================================
    // FILE MANAGEMENT & EVENT HANDLERS
    // ========================================
    
    const handleValidFiles = useCallback((files: File[]) => {
      onDrop(files);

      if (showDroppedFiles) {
        setDroppedFiles(prev => clearFilesOnNewDrop ? files : [...prev, ...files]);
      } else if (clearFilesOnNewDrop) {
        setDroppedFiles([]);
      }
    }, [onDrop, showDroppedFiles, clearFilesOnNewDrop]);

    const clearDroppedFiles = useCallback(() => {
      setDroppedFiles([]);
      onFilesCleared?.();
    }, [onFilesCleared]);

    const removeFile = useCallback((indexToRemove: number) => {
      setDroppedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    }, []);
    
    const resetDragState = useCallback(() => {
      setIsDragOver(false);
      setIsDragActive(false);
      setDraggedItemsCount(0);
      dragCounterRef.current = 0;
      
      if (dragLeaveTimeoutRef.current) {
        clearTimeout(dragLeaveTimeoutRef.current);
        dragLeaveTimeoutRef.current = null;
      }
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (disabled) return;
      
      // Set effect allowed to enable drop
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copyMove';
      }
      
      // Clear any pending drag leave timeout
      if (dragLeaveTimeoutRef.current) {
        clearTimeout(dragLeaveTimeoutRef.current);
        dragLeaveTimeoutRef.current = null;
      }
      
      dragCounterRef.current++;
      
      // Only update state on the first drag enter
      if (dragCounterRef.current === 1) {
        const itemCount = e.dataTransfer.files?.length || 
                         (e.dataTransfer.items ? e.dataTransfer.items.length : 1);
        
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
      
      // Only reset state when all elements have been left
      if (dragCounterRef.current <= 0) {
        dragLeaveTimeoutRef.current = setTimeout(() => {
          resetDragState();
          onDragLeave?.();
        }, 50);
      }
    }, [disabled, onDragLeave, resetDragState]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (disabled) return;
      
      // Set the drop effect to indicate what operation is allowed
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = dropEffect;
        
        // For email attachments and other sources, ensure we accept the drop
        if (e.dataTransfer.effectAllowed === 'none') {
          e.dataTransfer.effectAllowed = 'copyMove';
        }
        
        // Force copy effect for better compatibility with email attachments
        e.dataTransfer.dropEffect = 'copy';
      }
    }, [disabled, dropEffect]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (disabled) {
        resetDragState();
        return;
      }

      // Immediately reset drag state to prevent UI getting stuck
      resetDragState();
      setIsProcessing(true);

      try {
        // Check if we have permission to access the dragged data
        if (!e.dataTransfer) {
          onError?.('No data transfer object available');
          return;
        }

        // Check for unsupported content first
        const unsupportedMessage = detectUnsupportedContent(e.dataTransfer);
        if (unsupportedMessage) {
          onError?.(unsupportedMessage);
          return;
        }

        // Process files
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const validFiles = processFiles(Array.from(e.dataTransfer.files));
          
          if (validFiles.length > 0) {
            handleValidFiles(validFiles);
          }
        } else {
          onError?.("No files were found in the drop. Please ensure you're dragging actual files.");
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Drop failed';
        onError?.(`Drop failed: ${errorMessage}`);
        console.error('Drop error:', error);
      } finally {
        setIsProcessing(false);
      }
    }, [disabled, detectUnsupportedContent, processFiles, handleValidFiles, onError, resetDragState]);
    
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
        e.target.value = '';
      }
    }, [processFiles, handleValidFiles]);

    const handlePaste = useCallback((e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData?.files || clipboardData.files.length === 0) return;

      const files = processFiles(Array.from(clipboardData.files));
      if (files.length > 0) {
        handleValidFiles(files);
      }
    }, [processFiles, handleValidFiles]);

    useEffect(() => {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (dragLeaveTimeoutRef.current) {
          clearTimeout(dragLeaveTimeoutRef.current);
        }
      };
    }, []);

    // ========================================
    // UTILITY & RENDER HELPERS
    // ========================================
    
    const getFileTypeIcon = useCallback((file: File, size: ImageSize = ImageSize.small) => {
      const dummyPath = `/${file.name}`;
      return <FileTypeIcon type={IconType.image} size={size} path={dummyPath} />;
    }, []);

    const formatFileSize = useCallback((bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }, []);
    
    const cssClasses = [
      styles.root,
      className,
      children ? styles.wrappedContent : styles.dropZone,
      disabled && styles.dropZoneDisabled,
      isDragActive && (children ? styles.wrappedContentActive : styles.dropZoneActive),
      isDragOver && !children && styles.dropZoneDragOver
    ].filter(Boolean).join(' ');
    
    const acceptAttribute = accept && accept.length > 0 ? accept.join(',') : undefined;
    const displayFiles = maxDisplayFiles ? droppedFiles.slice(0, maxDisplayFiles) : droppedFiles;

    // ========================================
    // RENDER COMPONENT
    // ========================================
    
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
          aria-label="Drag and drop zone for files and email attachments"
          title="Drop files or email attachments here"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptAttribute}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={disabled}
          />
          
          {children ? (
            <>
              {children}
              {showOverlay && (isDragActive || isDragOver) && (
                <div className={styles.overlay} style={overlayStyle}>
                  <div className={styles.overlayContent}>
                    <div className={styles.overlayIcon}><DocumentRegular /></div>
                    <div className={styles.overlayTitle}>{isDragActive ? 'Drop files now!' : overlayText}</div>
                    {draggedItemsCount > 0 && <div className={styles.overlaySubtitle}>{draggedItemsCount} item{draggedItemsCount > 1 ? 's' : ''}</div>}
                  </div>
                </div>
              )}
              {showBrowseButton && !disabled && (
                <button type="button" onClick={handleClick} className={styles.browseButton} style={browseButtonStyle} title="Browse files from your computer">Browse</button>
              )}
            </>
          ) : (
            <>
              <DocumentRegular style={{ fontSize: '48px', opacity: 0.7 }} />
              <div style={{ fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightSemibold, marginBottom: tokens.spacingVerticalXS, color: tokens.colorNeutralForeground1 }}>
                {isProcessing ? 'Processing files...' : isDragActive ? 'Drop files now!' : 'Drop files here'}
              </div>
              <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2, marginBottom: tokens.spacingVerticalXS }}>
                Drag files or email attachments here
              </div>
              {draggedItemsCount > 0 && (
                <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorBrandForeground1, fontWeight: tokens.fontWeightSemibold }}>
                  {draggedItemsCount} file{draggedItemsCount > 1 ? 's' : ''} ready
                </div>
              )}
              {!isProcessing && (
                <div style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalXS }}>
                  or click to browse
                </div>
              )}
            </>
          )}
          
          {isProcessing && (
            <div className={styles.processingIndicator}>
              <Spinner size="medium" />
            </div>
          )}
        </div>

        {showDroppedFiles && droppedFiles.length > 0 && (
          <div className={styles.fileList} style={fileListStyle}>
            <div className={styles.fileListHeader}>
              <div className={styles.fileListTitle}>Files ({droppedFiles.length})</div>
              <button type="button" onClick={clearDroppedFiles} className={styles.clearButton} title="Clear all files">Clear All</button>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {displayFiles.map((file, index) => (
                <div key={`${file.name}-${file.lastModified}-${index}`} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileIcon}>{getFileTypeIcon(file, ImageSize.small)}</div>
                    <div className={styles.fileDetails}>
                      <div className={styles.fileName}>{file.name}</div>
                      <div className={styles.fileSize}>{formatFileSize(file.size)} • {file.type || 'Unknown type'}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeFile(index)} className={styles.removeButton} title={`Remove ${file.name}`}>
                    <DismissRegular />
                  </button>
                </div>
              ))}
            </div>

            {maxDisplayFiles && droppedFiles.length > maxDisplayFiles && (
              <div style={{ textAlign: 'center', marginTop: tokens.spacingVerticalXS, padding: tokens.spacingVerticalXS, fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2, fontStyle: 'italic' }}>
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
