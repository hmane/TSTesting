import { ITheme, keyframes, mergeStyles, FontWeights } from '@fluentui/react';
import { StepStatus, StepperStyleProps, StepColors, StepperMode } from './types';

// Animation keyframes
const slideIn = keyframes({
  '0%': { opacity: 0, transform: 'translateY(10px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
});

const scrollHintPulse = keyframes({
  '0%': { opacity: 0.4, transform: 'translateX(0px)' },
  '50%': { opacity: 0.8, transform: 'translateX(3px)' },
  '100%': { opacity: 0.4, transform: 'translateX(0px)' },
});

export const getStepperStyles = (theme: ITheme, props: StepperStyleProps) => {
  const { fullWidth, minStepWidth, mode } = props;

  return {
    container: mergeStyles({
      width: '100%',
      fontFamily: theme.fonts.medium.fontFamily,
      fontSize: theme.fonts.medium.fontSize,
      color: theme.palette.neutralPrimary,
      position: 'relative',
      '@media print': {
        colorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      },
    }),

    stepsContainer: mergeStyles({
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      marginBottom: mode === 'compact' ? '8px' : '20px',
      overflowX: 'auto',
      overflowY: 'hidden',
      position: 'relative',

      // No gaps when fullWidth is true - steps should connect seamlessly
      gap: fullWidth ? '0px' : '2px',

      // Modern scrollbar styling for desktop
      '@media (min-width: 769px)': {
        scrollbarWidth: 'thin',
        scrollbarColor: `${theme.palette.neutralTertiary} ${theme.palette.neutralLighter}`,

        '::-webkit-scrollbar': {
          height: mode === 'compact' ? '6px' : '8px',
        },
        '::-webkit-scrollbar-track': {
          backgroundColor: theme.palette.neutralLighter,
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.neutralTertiary,
          borderRadius: '4px',
          transition: 'background-color 0.2s ease',
        },
        '::-webkit-scrollbar-thumb:hover': {
          backgroundColor: theme.palette.neutralSecondary,
        },
      },

      // Mobile: Stack vertically
      '@media (max-width: 768px)': {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: mode === 'compact' ? '4px' : '8px',
        overflowX: 'visible',
      },
    }),

    scrollHintLeft: mergeStyles({
      position: 'absolute',
      left: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '20px',
      height: '100%',
      background: `linear-gradient(to right, ${theme.palette.white}, transparent)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingLeft: '4px',
      zIndex: 10,
      pointerEvents: 'none',

      '@media (max-width: 768px)': {
        display: 'none',
      },
    }),

    scrollHintRight: mergeStyles({
      position: 'absolute',
      right: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '30px',
      height: '100%',
      background: `linear-gradient(to left, ${theme.palette.white}, transparent)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: '8px',
      zIndex: 10,
      pointerEvents: 'none',

      '@media (max-width: 768px)': {
        display: 'none',
      },
    }),

    scrollIcon: mergeStyles({
      fontSize: '14px',
      color: theme.palette.neutralSecondary,
      animation: scrollHintPulse,
      animationDuration: '2s',
      animationIterationCount: 'infinite',
    }),

    stepItem: mergeStyles({
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      // CRITICAL FIX: When fullWidth is true, don't set minWidth, let flex handle it
      minWidth: fullWidth
        ? 'auto'
        : minStepWidth
        ? `${minStepWidth}px`
        : mode === 'compact'
        ? '100px'
        : '150px',
      // When fullWidth is true, also set width to ensure equal distribution
      width: fullWidth ? '100%' : 'auto',
      height: mode === 'compact' ? '50px' : '70px',
      // CRITICAL FIX: Use flex grow/shrink/basis properly
      flex: fullWidth ? '1 1 0px' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      userSelect: 'none',

      // Mobile: Full width, normal rectangle
      '@media (max-width: 768px)': {
        minWidth: 'auto',
        width: '100%',
        height: 'auto',
        minHeight: mode === 'compact' ? '45px' : '60px',
        flex: 'none',
      },
    }),

    stepContent: mergeStyles({
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '100%',
      height: '100%',
      padding: mode === 'compact' ? '0 20px 0 15px' : '0 30px 0 20px',
      transition: 'all 0.3s ease',

      // Arrow shape for desktop - seamless connection
      '@media (min-width: 769px)': {
        clipPath:
          mode === 'compact'
            ? 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 12px 50%)'
            : 'polygon(0 0, calc(100% - 25px) 0, 100% 50%, calc(100% - 25px) 100%, 0 100%, 20px 50%)',
      },

      // Mobile: Normal rectangle with rounded corners
      '@media (max-width: 768px)': {
        borderRadius: mode === 'compact' ? '6px' : '8px',
        padding: mode === 'compact' ? '10px 14px' : '16px 20px',
        clipPath: 'none',
      },

      '@media print': {
        clipPath: 'none',
        borderRadius: '4px',
        border: '1px solid #000',
      },
    }),

    stepText: mergeStyles({
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
    }),

    stepTitle: mergeStyles({
      fontSize: mode === 'compact' ? theme.fonts.small.fontSize : theme.fonts.medium.fontSize,
      fontWeight: FontWeights.semibold,
      lineHeight: '1.2',
      marginBottom: '2px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',

      '@media (max-width: 768px)': {
        fontSize: theme.fonts.mediumPlus.fontSize,
        whiteSpace: 'normal',
        lineHeight: '1.3',
      },
    }),

    stepDescription1: mergeStyles({
      fontSize: mode === 'compact' ? theme.fonts.xSmall.fontSize : theme.fonts.small.fontSize,
      fontWeight: FontWeights.regular,
      lineHeight: '1.2',
      marginBottom: '1px',
      opacity: 0.9,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',

      '@media (max-width: 768px)': {
        fontSize: theme.fonts.small.fontSize,
        whiteSpace: 'normal',
        lineHeight: '1.3',
      },
    }),

    stepDescription2: mergeStyles({
      fontSize: theme.fonts.xSmall.fontSize,
      fontWeight: FontWeights.regular,
      lineHeight: '1.2',
      opacity: 0.8,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',

      '@media (max-width: 768px)': {
        fontSize: theme.fonts.xSmall.fontSize,
        whiteSpace: 'normal',
        lineHeight: '1.3',
      },
    }),

    contentArea: mergeStyles({
      minHeight: '120px',
      padding: '24px',
      backgroundColor: theme.palette.neutralLighterAlt,
      border: `1px solid ${theme.palette.neutralLight}`,
      borderRadius: '8px',
      animation: slideIn,
      animationDuration: '0.4s',
      animationFillMode: 'forwards',
      boxShadow: theme.effects.elevation4,

      '@media print': {
        border: `1px solid #000`,
        backgroundColor: '#f9f9f9',
        boxShadow: 'none',
      },
    }),

    contentHeader: mergeStyles({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: `1px solid ${theme.palette.neutralLight}`,
    }),

    contentTitle: mergeStyles({
      fontSize: theme.fonts.xLarge.fontSize,
      fontWeight: FontWeights.semibold,
      color: theme.palette.neutralPrimary,
      margin: 0,
      flex: 1,
    }),

    contentBody: mergeStyles({
      fontSize: theme.fonts.medium.fontSize,
      color: theme.palette.neutralSecondary,
      lineHeight: '1.6',

      '& h1, & h2, & h3, & h4, & h5, & h6': {
        color: theme.palette.neutralPrimary,
        marginTop: '16px',
        marginBottom: '8px',
      },
      '& p': {
        marginBottom: '12px',
      },
      '& ul, & ol': {
        paddingLeft: '20px',
        marginBottom: '12px',
      },
      '& li': {
        marginBottom: '4px',
      },
    }),

    // Mobile summary
    mobileSummary: mergeStyles({
      display: 'none',

      '@media (max-width: 768px)': {
        display: 'block',
        marginTop: '16px',
        padding: '12px 16px',
        backgroundColor: theme.palette.themeLighterAlt,
        border: `1px solid ${theme.palette.themeLight}`,
        borderRadius: '6px',
        fontSize: theme.fonts.small.fontSize,
        color: theme.palette.themeDark,
      },
    }),

    // Screen reader only content
    srOnly: mergeStyles({
      position: 'absolute',
      left: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
    }),
  };
};

export const getStepColors = (theme: ITheme): Record<StepStatus, StepColors> => {
  return {
    completed: {
      background: '#107c10', // Professional green
      selectedBackground: '#0e6b0e',
      text: theme.palette.white,
      selectedText: theme.palette.white,
      border: '#107c10',
      selectedBorder: '#0e6b0e',
    },
    current: {
      background: theme.palette.themePrimary,
      selectedBackground: theme.palette.themeDark,
      text: theme.palette.white,
      selectedText: theme.palette.white,
      border: theme.palette.themePrimary,
      selectedBorder: theme.palette.themeDark,
    },
    pending: {
      background: '#f3f2f1', // Light neutral
      selectedBackground: '#e1dfdd',
      text: '#605e5c', // Dark neutral
      selectedText: '#323130',
      border: '#d2d0ce',
      selectedBorder: '#c8c6c4',
    },
    warning: {
      background: '#ffb900', // Professional amber
      selectedBackground: '#f29000',
      text: '#323130', // Dark text for contrast
      selectedText: '#1b1a19',
      border: '#ffb900',
      selectedBorder: '#f29000',
    },
    error: {
      background: '#d13438', // Professional red
      selectedBackground: '#b02e32',
      text: theme.palette.white,
      selectedText: theme.palette.white,
      border: '#d13438',
      selectedBorder: '#b02e32',
    },
    blocked: {
      background: '#ff8c00', // Professional orange
      selectedBackground: '#e67e00',
      text: theme.palette.white,
      selectedText: theme.palette.white,
      border: '#ff8c00',
      selectedBorder: '#e67e00',
    },
  };
};

export const getStepItemStyles = (
  theme: ITheme,
  status: StepStatus,
  isSelected: boolean,
  isClickable: boolean,
  mode: StepperMode
) => {
  const colors = getStepColors(theme);
  const colorConfig = colors[status];

  const backgroundColor = isSelected ? colorConfig.selectedBackground : colorConfig.background;
  const textColor = isSelected ? colorConfig.selectedText : colorConfig.text;
  const borderColor = isSelected ? colorConfig.selectedBorder : colorConfig.border;

  const baseStyles = {
    backgroundColor,
    color: textColor,
    border: `1px solid ${borderColor}`,
    boxShadow: isSelected ? theme.effects.elevation8 : theme.effects.elevation4,
  };

  const cursorStyle = isClickable ? 'pointer' : 'not-allowed';

  const hoverStyles = isClickable
    ? {
        ':hover': {
          transform: mode === 'compact' ? 'scale(1.02)' : 'translateY(-2px)',
          boxShadow: theme.effects.elevation16,
          zIndex: 2,

          '@media (max-width: 768px)': {
            transform: 'none',
            boxShadow: theme.effects.elevation8,
          },
        },
      }
    : {
        ':hover': {
          // No hover effect for non-clickable steps
        },
      };

  const focusStyles = isClickable
    ? {
        ':focus': {
          outline: `2px solid ${theme.palette.themePrimary}`,
          outlineOffset: '2px',
          zIndex: 3,
        },
        ':focus-visible': {
          outline: `2px solid ${theme.palette.themePrimary}`,
          outlineOffset: '2px',
        },
      }
    : {};

  return mergeStyles({
    ...baseStyles,
    ...hoverStyles,
    ...focusStyles,
    cursor: cursorStyle,
  });
};
