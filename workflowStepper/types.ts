export type StepStatus = 'completed' | 'current' | 'pending' | 'warning' | 'error' | 'blocked';

export type StepperMode = 'fullSteps' | 'progress';

export interface StepData {
  id: string;
  title: string;
  description1?: string;
  description2?: string;
  status: StepStatus;
  content?: string | React.ReactNode;
  isClickable?: boolean;
}

export interface StepColorConfig {
  background: string;
  selectedBackground: string;
  text: string;
  selectedText: string;
  border?: string;
  selectedBorder?: string;
}

export interface CustomColors {
  completed?: StepColorConfig;
  current?: StepColorConfig;
  pending?: StepColorConfig;
  warning?: StepColorConfig;
  error?: StepColorConfig;
  blocked?: StepColorConfig;
}

export interface WorkflowStepperProps {
  steps: StepData[];
  mode: StepperMode;
  fullWidth?: boolean;
  showStepNumbers?: boolean;
  selectedStepId?: string;
  autoSelectCurrent?: boolean;
  customColors?: CustomColors;
  onStepClick?: (step: StepData) => void;
  className?: string;
}

export interface StepItemProps {
  step: StepData;
  stepNumber: number;
  isSelected: boolean;
  isClickable: boolean;
  showStepNumbers: boolean;
  customColors?: CustomColors;
  onStepClick: (step: StepData) => void;
}

export interface ContentAreaProps {
  selectedStep: StepData | null;
  isVisible: boolean;
}

export interface StepperStyleProps {
  fullWidth: boolean;
  stepCount: number;
}
