import { IconButton } from '@fluentui/react/lib/Button';
import * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MaximizedViewProps } from '../Card.types';
import { getAnimationDuration } from '../utils/animations';
import { DEFAULT_ICONS, Z_INDEX } from '../utils/constants';

/**
 * Maximized view component that renders card content in a full-screen overlay
 */
export const MaximizedView: React.FC<MaximizedViewProps> = ({
  cardId,
  children,
  onRestore,
  className = '',
  style,
  backdrop = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  restoreIcon = DEFAULT_ICONS.RESTORE,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus element
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;

    return () => {
      // Restore focus when unmounting
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        onRestore();
      }
    },
    [closeOnEscape, onRestore]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (closeOnBackdropClick && event.target === backdropRef.current) {
        onRestore();
      }
    },
    [closeOnBackdropClick, onRestore]
  );

  // Set up event listeners
  useEffect(() => {
    if (closeOnEscape) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus management
    if (contentRef.current) {
      contentRef.current.focus();
    }

    return () => {
      if (closeOnEscape) {
        document.removeEventListener('keydown', handleKeyDown);
      }

      // Restore body scroll
      document.body.style.overflow = originalOverflow;
    };
  }, [closeOnEscape, handleKeyDown]);

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: Z_INDEX.MAXIMIZED_CARD,
    backgroundColor: backdrop ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    backdropFilter: backdrop ? 'blur(2px)' : 'none',
    animation: `fadeIn ${getAnimationDuration(300)}ms ease-out`,
  };

  const contentStyle: React.CSSProperties = {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'var(--white, #ffffff)',
    borderRadius: '0',
    boxShadow: '0 25.6px 57.6px 0 rgba(0, 0, 0, 0.22), 0 4.8px 14.4px 0 rgba(0, 0, 0, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    outline: 'none',
    animation: `maximizeIn ${getAnimationDuration(350)}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    ...style,
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: Z_INDEX.MAXIMIZED_CARD + 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    border: '1px solid var(--neutralLight, #edebe9)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  const maximizedContent = (
    <div
      ref={backdropRef}
      className={`spfx-card-maximized-backdrop ${className}`}
      style={backdropStyle}
      onClick={handleBackdropClick}
      role='dialog'
      aria-modal='true'
      aria-labelledby={`card-header-${cardId}`}
      aria-describedby={`card-content-${cardId}`}
    >
      <div
        ref={contentRef}
        className='spfx-card-maximized-content'
        style={contentStyle}
        tabIndex={-1}
        onClick={e => e.stopPropagation()} // Prevent backdrop click when clicking content
      >
        {/* Close Button */}
        <IconButton
          iconProps={{ iconName: restoreIcon }}
          title='Restore card'
          ariaLabel='Restore card to normal size'
          onClick={onRestore}
          style={closeButtonStyle}
          styles={{
            root: {
              selectors: {
                ':hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  transform: 'scale(1.05)',
                },
                ':active': {
                  transform: 'scale(0.95)',
                },
              },
            },
          }}
        />

        {/* Card Content */}
        <div className='spfx-card-maximized-body' style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );

  // Render into portal
  return createPortal(maximizedContent, document.body);
};

/**
 * Alternative maximized view with custom positioning
 */
export const CustomMaximizedView: React.FC<
  MaximizedViewProps & {
    width?: string | number;
    height?: string | number;
    maxWidth?: string | number;
    maxHeight?: string | number;
    centered?: boolean;
  }
> = ({
  cardId,
  children,
  onRestore,
  className = '',
  style,
  backdrop = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  restoreIcon = DEFAULT_ICONS.RESTORE,
  width = '90vw',
  height = '90vh',
  maxWidth = '1200px',
  maxHeight = '800px',
  centered = true,
}) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        onRestore();
      }
    },
    [closeOnEscape, onRestore]
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (closeOnBackdropClick && event.currentTarget === event.target) {
        onRestore();
      }
    },
    [closeOnBackdropClick, onRestore]
  );

  useEffect(() => {
    if (closeOnEscape) {
      document.addEventListener('keydown', handleKeyDown);
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      if (closeOnEscape) {
        document.removeEventListener('keydown', handleKeyDown);
      }
      document.body.style.overflow = originalOverflow;
    };
  }, [closeOnEscape, handleKeyDown]);

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: Z_INDEX.MAXIMIZED_CARD,
    backgroundColor: backdrop ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
    display: 'flex',
    alignItems: centered ? 'center' : 'flex-start',
    justifyContent: centered ? 'center' : 'flex-start',
    padding: '20px',
    backdropFilter: backdrop ? 'blur(2px)' : 'none',
  };

  const contentStyle: React.CSSProperties = {
    position: 'relative',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
    backgroundColor: 'var(--white, #ffffff)',
    borderRadius: '8px',
    boxShadow: '0 25.6px 57.6px 0 rgba(0, 0, 0, 0.22), 0 4.8px 14.4px 0 rgba(0, 0, 0, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    outline: 'none',
    ...style,
  };

  const maximizedContent = (
    <div
      className={`spfx-card-custom-maximized-backdrop ${className}`}
      style={backdropStyle}
      onClick={handleBackdropClick}
      role='dialog'
      aria-modal='true'
      aria-labelledby={`card-header-${cardId}`}
    >
      <div
        className='spfx-card-custom-maximized-content'
        style={contentStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1,
          }}
        >
          <IconButton
            iconProps={{ iconName: restoreIcon }}
            title='Restore card'
            ariaLabel='Restore card to normal size'
            onClick={onRestore}
            styles={{
              root: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid var(--neutralLight, #edebe9)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
              },
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );

  return createPortal(maximizedContent, document.body);
};

/**
 * Inject required CSS animations
 */
const injectMaximizedAnimations = () => {
  const styleId = 'spfx-maximized-animations';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes maximizeIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes maximizeOut {
      from {
        transform: scale(1);
        opacity: 1;
      }
      to {
        transform: scale(0.9);
        opacity: 0;
      }
    }

    /* Focus styles for maximized content */
    .spfx-card-maximized-content:focus {
      outline: none;
    }

    /* Responsive styles */
    @media (max-width: 768px) {
      .spfx-card-maximized-content,
      .spfx-card-custom-maximized-content {
        margin: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        border-radius: 0 !important;
      }

      .spfx-card-maximized-backdrop,
      .spfx-card-custom-maximized-backdrop {
        padding: 0 !important;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .spfx-card-maximized-backdrop,
      .spfx-card-maximized-content,
      .spfx-card-custom-maximized-content {
        animation: none !important;
      }
    }

    /* High contrast mode */
    @media (forced-colors: active) {
      .spfx-card-maximized-content,
      .spfx-card-custom-maximized-content {
        border: 2px solid ButtonBorder;
        background: ButtonFace;
      }

      .spfx-card-maximized-backdrop,
      .spfx-card-custom-maximized-backdrop {
        background: rgba(0, 0, 0, 0.8);
      }
    }
  `;

  document.head.appendChild(style);
};

// Initialize animations when module loads
if (typeof document !== 'undefined') {
  injectMaximizedAnimations();
}
