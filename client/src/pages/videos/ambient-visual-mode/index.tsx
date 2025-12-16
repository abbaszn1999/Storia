import { useState } from "react";
import { useParams, useSearch } from "wouter";
import { AmbientVisualWorkflow } from "@/components/ambient-visual-workflow";
import { AmbientStudioLayout } from "@/components/ambient/studio";
import { AmbientOnboarding } from "@/components/ambient/onboarding";
import type { AmbientStepId } from "@/components/ambient/studio";

export default function AmbientVisualModePage() {
  const params = useParams<{ videoId?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  
  const videoId = params.videoId || urlParams.get("id") || "new";
  const workspaceId = urlParams.get("workspace") || "default";
  const videoTitle = urlParams.get("title") || "Untitled Ambient Visual";
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [animationMode, setAnimationMode] = useState<'image-transitions' | 'video-animation'>('image-transitions');
  const [videoGenerationMode, setVideoGenerationMode] = useState<'image-reference' | 'start-end-frame' | undefined>(undefined);
  
  const [activeStep, setActiveStep] = useState<AmbientStepId>(0);
  const [completedSteps, setCompletedSteps] = useState<AmbientStepId[]>([]);
  const [direction, setDirection] = useState(1);

  const handleStepClick = (step: AmbientStepId) => {
    setDirection(step > activeStep ? 1 : -1);
    setActiveStep(step);
  };

  const handleNext = () => {
    const nextStep = (activeStep + 1) as AmbientStepId;
    if (nextStep <= 5) {
      // Mark current step as completed
      if (!completedSteps.includes(activeStep)) {
        setCompletedSteps([...completedSteps, activeStep]);
      }
      setDirection(1);
      setActiveStep(nextStep);
    }
  };

  const handleBack = () => {
    const prevStep = (activeStep - 1) as AmbientStepId;
    if (prevStep >= 0) {
      setDirection(-1);
      setActiveStep(prevStep);
    }
  };

  const handleOnboardingComplete = (config: {
    animationMode: 'image-transitions' | 'video-animation';
    videoGenerationMode?: 'image-reference' | 'start-end-frame';
  }) => {
    setAnimationMode(config.animationMode);
    setVideoGenerationMode(config.videoGenerationMode);
    setShowOnboarding(false);
  };

  // Show onboarding first
  if (showOnboarding) {
    return (
      <AmbientOnboarding 
        projectName={videoTitle}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <AmbientStudioLayout
      currentStep={activeStep}
      completedSteps={completedSteps}
      direction={direction}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      videoTitle={videoTitle}
    >
      <AmbientVisualWorkflow 
        activeStep={activeStep}
        onStepChange={(step) => {
          setDirection(step > activeStep ? 1 : -1);
          // Mark previous steps as completed
          if (!completedSteps.includes(activeStep)) {
            setCompletedSteps([...completedSteps, activeStep]);
          }
          setActiveStep(step as AmbientStepId);
        }}
        projectName={videoTitle}
        initialAnimationMode={animationMode}
        initialVideoGenerationMode={videoGenerationMode}
      />
    </AmbientStudioLayout>
  );
}
