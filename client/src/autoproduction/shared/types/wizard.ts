// Wizard step configuration
export interface WizardStep {
  number: number;
  title: string;
  description: string;
  icon: any; // Lucide icon
  isOptional?: boolean;
}

// Wizard state
export interface WizardState {
  currentStep: number;
  completedSteps: number[];
  canGoNext: boolean;
  canGoBack: boolean;
  isLastStep: boolean;
}

// Wizard context type
export interface WizardContextType {
  state: WizardState;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  markStepCompleted: (step: number) => void;
  validateStep: (step: number) => boolean;
}
