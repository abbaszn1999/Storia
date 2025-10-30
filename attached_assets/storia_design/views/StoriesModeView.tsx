import React, { useState } from 'react';
import { View } from '../types';
import { StepIndicator } from '../components/story_creation/StepIndicator';
import { Step1_Template, TemplateType } from './story_creation/Step1_Template';
import { Step2_Script } from './story_creation/Step2_Script';
import { Step3_Scenes } from './story_creation/Step3_Scenes';
import { Step4_ShotEditor } from './story_creation/Step4_ShotEditor';
import { Step5_Audio } from './story_creation/Step5_Audio';
import { Step6_Preview } from './story_creation/Step6_Preview';
import { Step7_Export } from './story_creation/Step7_Export';
import { CreationSuccess } from './story_creation/CreationSuccess';
import { DirectToVideoGenerator } from './story_creation/DirectToVideoGenerator';
import { PlusIcon, StoriesIcon, XMarkIcon } from '../components/icons';

const NARRATIVE_STEPS = [
    'Template',
    'Script',
    'Scenes',
    'Shots',
    'Audio',
    'Preview',
    'Export'
];

interface StoriesModeViewProps {
    setActiveView: (view: View) => void;
    setInCreationFlow: (isCreating: boolean) => void;
}

export const StoriesModeView: React.FC<StoriesModeViewProps> = ({ setActiveView, setInCreationFlow }) => {
    const [creationModeActive, setCreationModeActive] = useState(false);
    const [creationFlowType, setCreationFlowType] = useState<TemplateType | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    const startCreationFlow = () => {
        setCreationModeActive(true);
        setInCreationFlow(true);
    };
    
    const exitCreationFlow = () => {
        setCreationModeActive(false);
        setInCreationFlow(false);
        setCreationFlowType(null);
        setCurrentStep(0);
    };

    const handleTemplateSelect = (type: TemplateType) => {
        setCreationFlowType(type);
        if (type === 'narrative') {
            setCurrentStep(1); // Move to the script step
        }
    };

    const handleComplete = (view: View) => {
        exitCreationFlow();
        setActiveView(view);
    };

    const next = () => setCurrentStep(prev => prev + 1);
    const back = () => setCurrentStep(prev => prev - 1);
    const goToStep = (stepIndex: number) => {
        if (stepIndex < currentStep) {
            setCurrentStep(stepIndex);
        }
    };

    if (!creationModeActive) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border-2 border-slate-700">
                    <StoriesIcon className="w-10 h-10 text-slate-400" />
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Create a New Story</h1>
                <p className="mt-4 text-lg text-slate-400 max-w-xl">
                    Select a story structure like "Tease & Reveal" for narrative videos, or a direct-to-video template like "ASMR" for simple clips.
                </p>
                <button
                    onClick={startCreationFlow}
                    className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Start New Story</span>
                </button>
            </div>
        );
    }

    const renderNarrativeStep = () => {
        switch(currentStep) {
            case 0: // This case is now handled by the main render logic
                return null;
            case 1:
                return <Step2_Script onNext={next} onBack={() => setCreationFlowType(null)} />;
            case 2:
                return <Step3_Scenes onNext={next} onBack={back} />;
            case 3:
                return <Step4_ShotEditor onNext={next} onBack={back} />;
            case 4:
                return <Step5_Audio onNext={next} onBack={back} />;
            case 5:
                return <Step6_Preview onNext={next} onBack={back} />;
            case 6:
                return <Step7_Export onNext={next} onBack={back} />;
            case 7:
                return <CreationSuccess onComplete={handleComplete} />;
            default:
                return null;
        }
    };

    const renderContent = () => {
        if (!creationFlowType) {
            return <Step1_Template onSelectTemplate={handleTemplateSelect} />;
        }
        if (creationFlowType === 'narrative') {
            return renderNarrativeStep();
        }
        if (creationFlowType === 'direct') {
            return <DirectToVideoGenerator onExit={() => setCreationFlowType(null)} onComplete={handleComplete} />;
        }
    };
    
    const showSteps = creationFlowType === 'narrative' && currentStep < NARRATIVE_STEPS.length;

    return (
        <div className="relative">
             <button 
                onClick={exitCreationFlow}
                className="absolute top-0 right-0 z-10 text-slate-500 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700"
                aria-label="Exit story creation"
            >
                <XMarkIcon className="w-7 h-7" />
            </button>
            <div className="space-y-8">
                {showSteps && (
                    <StepIndicator steps={NARRATIVE_STEPS} currentStep={currentStep} onStepClick={goToStep} />
                )}
                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};