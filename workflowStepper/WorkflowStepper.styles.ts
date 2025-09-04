import { ITheme, mergeStyles, keyframes } from '@fluentui/react';
import { StepStatus, CustomColors, StepperStyleProps } from './types';

// Animation keyframes
const slideIn = keyframes({
  '0%': { opacity: 0, transform: 'translateY(10px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' }
});

const stepTransition = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.02)' },
  '100%': { transform: 'scale(1)' }
});

export const getStepperStyles = (theme: ITheme, props: StepperStyleProps) => {
  return {
    container: mergeStyles({
      width: '100%',
      fontFamily: theme.fonts.medium.fontFamily,
      fontSize: theme.fonts.medium.fontSize,
      color: theme.palette.neutralPrimary,
      '@media print': {
        colorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact'
      }
    }),

    stepsContainer: mergeStyles({
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: props.fullWidth ? 'space-between' : 'flex-start',
      width: '100%',
      marginBottom: '20px',
      overflow: 'hidden',
      '@media (max-width: 768px)': {
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'thin',
        '::-webkit-scrollbar': {
          height: '4px'
        },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.neutralTertiary,
          borderRadius: '2px'
        }
      }
    }),

    contentArea: mergeStyles({
      minHeight: '100px',
      padding: '20px',
      backgroundColor: theme.palette.neutralLighter,
      border: `1px solid ${theme.palette.neutralLight}`,
      borderRadius: '4px',
      animation: slideIn,
      animationDuration: '0.3s',
      animationFillMode: 'forwards',
      '@media print': {
        border: `1px solid #000`,
        backgroundColor: '#f9f9f9'
      }
    }),

    contentTitle: mergeStyles({
      fontSize: theme.fonts.large.fontSize,
      fontWeight: theme.fonts.large.fontWeight,
      color: theme.palette.neutralPrimary,
      marginBottom: '12px'
    }),

    contentText: mergeStyles({
      fontSize: theme.fonts.medium.fontSize,
      color: theme.palette.neutralSecondary,
      lineHeight: '1.5'
    })
  };
};

export const getDefaultStepColors = (theme: ITheme) => {
  return {
    completed: {
      background: theme.palette.green,
      selectedBackground: theme.palette.greenDark,
      text: theme.palette.white,
      selectedText: theme.palette.white,
      border: theme.palette.greenDark
    },
    current: {
      background: theme.palette.themePrimary,
      selectedBackground: theme.palette.themeDark,
      text: theme.palette.white,
      selectedText: theme.palette.white,
      border: theme.palette.themeDark
    },
    pending: {
      background: theme.palette.neutralLight,
      selectedBackground: theme.palette.neutralTertiary,
      text: theme.palette.neutralSecondary,
      selectedText: theme.palette.neutralPrimary,
      border: theme.palette.neutralTertiary
    },
    warning: {
      background: theme.palette.yellow,
      selectedBackground: theme.palette.yellowDark,
      text: theme.palette.neutralPrimary,
      selectedText: theme.palette.neutralPrimary,
      border: theme.palette.yellowDark
    },
    error: {
      background: theme.palette.red,
      selectedBackground: theme.palette.redDark,
      text: theme.palette.white,
      selectedText: theme.palette.white,
      border: theme.palette.redDark
    },
    blocked: {
      background: theme.palette.orange,
      selectedBackground: theme.palette.orangeDark,
      text: theme.palette.white,
      selectedText: theme.palette.white,
      border: theme.palette.orangeDark
    }
  };
};

export const getStepItemStyles = (
  theme: ITheme,
  status: StepStatus,
  isSelected: boolean,
  isClickable: boolean,
  customColors?: CustomColors
) => {
  const defaultColors = getDefaultStepColors(theme);
  const colorConfig = customColors?.[status] || defaultColors[status];
  
  const backgroundColor = isSelected ? colorConfig.selectedBackground : colorConfig.background;
  const textColor = isSelected ? colorConfig.selectedText : colorConfig.text;
  const borderColor = isSelected ? colorConfig.selectedBorder || colorConfig.border : colorConfig.border;

  return {
    stepWrapper: mergeStyles({
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      minWidth: '120px',
      height: '60px',
      cursor: isClickable ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      outline: 'none',
      ':hover': isClickable ? {
        transform: 'translateY(-1px)',
        boxShadow: theme.effects.elevation4
      } : {},
      ':focus': isClickable ? {
        outline: `2px solid ${theme.palette.themePrimary}`,
        outlineOffset: '2px'
      } : {},
      ':focus-visible': isClickable ? {
        outline: `2px solid ${theme.palette.themePrimary}`,
        outlineOffset: '2px'
      } : {},
      '@media (max-width: 768px)': {
        minWidth: '100px',
        height: '50px'
      }
    }),

    stepContent: mergeStyles({
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: backgroundColor,
      color: textColor,
      border: borderColor ? `1px solid ${borderColor}` : 'none',
      clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%, 20px 50%)',
      padding: '0 30px 0 25px',
      animation: isSelected ? stepTransition : 'none',
      animationDuration: '0.4s',
      '@media (max-width: 768px)': {
        clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%)',
        padding: '0 25px 0 20px'
      },
      '@media print': {
        clipPath: 'none',
        border: '1px solid #000',
        borderRadius: '4px'
      }
    }),

    stepNumber: mergeStyles({
      fontSize: theme.fonts.medium.fontSize,
      fontWeight: theme.fonts.semibold.fontWeight,
      marginRight: '8px',
      minWidth: '20px',
      textAlign: 'center',
      '@media (max-width: 768px)': {
        fontSize: theme.fonts.small.fontSize,
        marginRight: '6px',
        minWidth: '16px'
      }
    }),

    stepDetails: mergeStyles({
      flex: 1,
      overflow: 'hidden'
    }),

    stepTitle: mergeStyles({
      fontSize: theme.fonts.medium.fontSize,
      fontWeight: theme.fonts.semibold.fontWeight,
      marginBottom: '2px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      '@media (max-width: 768px)': {
        fontSize: theme.fonts.small.fontSize
      }
    }),

    stepDescription: mergeStyles({
      fontSize: theme.fonts.small.fontSize,
      opacity: 0.9,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      '@media (max-width: 768px)': {
        fontSize: theme.fonts.xSmall.fontSize
      }
    }),

    stepDescriptionLine: mergeStyles({
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    })
  };
};
