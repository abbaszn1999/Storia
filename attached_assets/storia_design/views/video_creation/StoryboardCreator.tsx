import React, { useState } from 'react';
import { CreatorHeader } from '../../components/video_creation/CreatorHeader';
import { Step1_Concept } from './steps/Step1_ScriptHook';
import { Step2_ScriptBreakdown } from './steps/Step2_ScriptBreakdown';
import { Step3_WorldAndCast } from './steps/Step2_Beats';
import { Step4_Storyboard } from './steps/Step5_Storyboard';
import { Step5_Edit } from './steps/Step6_Animatic';
import { CreationSuccess } from '../story_creation/CreationSuccess';
import { View } from '../../types';
import { Step6_Preview } from './steps/Step6_Preview';


const STEPS = [
    'Concept',
    'Breakdown',
    'World & Cast',
    'Storyboard',
    'Edit',
    'Preview'
];

interface StoryboardCreatorProps {
    onExit: () => void;
}

export const StoryboardCreator: React.FC<StoryboardCreatorProps> = ({ onExit }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const next = () => setCurrentStep(prev => (prev < STEPS.length ? prev + 1 : prev));
    const back = () => setCurrentStep(prev => (prev > 0 ? prev - 1 : prev));
    const goToStep = (stepIndex: number) => {
        if (stepIndex < currentStep) {
            setCurrentStep(stepIndex);
        }
    };
    
    const handleComplete = (view: View) => {
        onExit();
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0:
                return <Step1_Concept onNext={next} />;
            case 1:
                return <Step2_ScriptBreakdown onNext={next} onBack={back} />;
            case 2:
                return <Step3_WorldAndCast onNext={next} onBack={back} />;
            case 3:
                return <Step4_Storyboard onNext={next} onBack={back} />;
            case 4:
                return <Step5_Edit onBack={back} onNext={next} />;
            case 5:
                return <Step6_Preview onBack={back} onComplete={next} />;
            case 6:
                 return <CreationSuccess onComplete={handleComplete} />;
            default:
                return <Step1_Concept onNext={next} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950 text-white flex flex-col z-20">
            <CreatorHeader onExit={onExit} steps={STEPS} currentStep={currentStep} onStepClick={goToStep} />
            <main className="flex-1 overflow-y-auto">
                {renderCurrentStep()}
            </main>
        </div>
    );
};
