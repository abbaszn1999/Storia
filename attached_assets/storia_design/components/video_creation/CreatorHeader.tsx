import React from 'react';
import { XMarkIcon, LogoIcon } from '../icons';

interface CreatorHeaderProps {
  onExit: () => void;
  steps: string[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

export const CreatorHeader: React.FC<CreatorHeaderProps> = ({ onExit, steps, currentStep, onStepClick }) => {
  return (
    <header className="flex-shrink-0 bg-slate-900 border-b border-slate-700 h-16 flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-3">
        <LogoIcon className="w-8 h-8 text-white"/>
        <span className="font-bold text-xl text-white tracking-tight">Kalema</span>
      </div>
      
      <div className="flex items-center gap-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isClickable = isCompleted;

          return (
            <button
              key={step}
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                isActive
                  ? 'text-white'
                  : isClickable
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors border-2 ${
                  isActive
                    ? 'bg-white text-slate-900 border-white'
                    : isCompleted
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'border-slate-700 text-slate-500'
                }`}
              >
                {index + 1}
              </div>
              <span>{step}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center">
        <button 
            className="border border-blue-500 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full text-sm transition-colors">
            Generate
        </button>
        <button 
          onClick={onExit}
          className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700/50 ml-4"
          aria-label="Exit video creator"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};
