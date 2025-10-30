import React from 'react';

interface ProgressRailProps {
  steps: string[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

export const ProgressRail: React.FC<ProgressRailProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <nav className="w-64 bg-slate-800/50 border-r border-slate-700/50 p-6">
      <ul className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isClickable = isCompleted;

          return (
            <li key={step}>
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300'
                    : isClickable
                    ? 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  isActive ? 'bg-blue-600 border-blue-500 text-white' : isCompleted ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-600 text-slate-500'
                }`}>
                  {index + 1}
                </div>
                <span className="font-semibold">{step}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
