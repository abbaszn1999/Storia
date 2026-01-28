import { useState, useCallback } from 'react';
import type { WizardState, WizardStep } from '../types';

export function useWizard(steps: WizardStep[], initialStep = 1) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const state: WizardState = {
    currentStep,
    completedSteps,
    canGoNext: currentStep < steps.length,
    canGoBack: currentStep > 1,
    isLastStep: currentStep === steps.length,
  };

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  const nextStep = useCallback(() => {
    if (state.canGoNext) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setCurrentStep(prev => prev + 1);
    }
  }, [state.canGoNext, currentStep]);

  const previousStep = useCallback(() => {
    if (state.canGoBack) {
      setCurrentStep(prev => prev - 1);
    }
  }, [state.canGoBack]);

  const markStepCompleted = useCallback((step: number) => {
    setCompletedSteps(prev => [...new Set([...prev, step])]);
  }, []);

  const validateStep = useCallback((step: number) => {
    // Override this in your wizard implementation
    return true;
  }, []);

  return {
    state,
    goToStep,
    nextStep,
    previousStep,
    markStepCompleted,
    validateStep,
  };
}
