import React from 'react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="flex items-center justify-center space-x-2 md:space-x-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isClickable = isCompleted;

        return (
          <React.Fragment key={step}>
            <button
              onClick={() => isClickable && onStepClick(index)}
              className={`flex items-center gap-2 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              disabled={!isClickable}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-800 border-2 border-slate-700 text-slate-500'
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`hidden md:block font-semibold transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`}
              >
                {step}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-slate-700"></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
