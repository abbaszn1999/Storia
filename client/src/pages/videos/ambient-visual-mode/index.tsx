import { useState, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AmbientVisualWorkflow } from "@/components/ambient-visual-workflow";
import { AmbientStudioLayout } from "@/components/ambient/studio";
import { AmbientOnboarding } from "@/components/ambient/onboarding";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";
import { Loader2 } from "lucide-react";
import type { AmbientStepId } from "@/components/ambient/studio";
import type { Video } from "@shared/schema";

export default function AmbientVisualModePage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const { toast } = useToast();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  
  const initialVideoId = params.id || urlParams.get("id") || "new";
  const isNewVideo = initialVideoId === "new";
  
  // Use workspace from context, fallback to URL param for backwards compatibility
  const workspaceId = currentWorkspace?.id || urlParams.get("workspace");
  const urlTitle = urlParams.get("title") || "Untitled Ambient Visual";
  
  // Fetch existing video data
  const { data: existingVideo, isLoading: isVideoLoading } = useQuery<Video>({
    queryKey: [`/api/videos/${initialVideoId}`],
    enabled: !isNewVideo,
  });
  
  // Video ID state (updated after creation)
  const [videoId, setVideoId] = useState<string>(initialVideoId);
  const [videoTitle, setVideoTitle] = useState<string>(urlTitle);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(isNewVideo);
  const [isCreating, setIsCreating] = useState(false);
  const [animationMode, setAnimationMode] = useState<'image-transitions' | 'video-animation'>('image-transitions');
  const [videoGenerationMode, setVideoGenerationMode] = useState<'image-reference' | 'start-end-frame' | undefined>(undefined);
  
  const [activeStep, setActiveStep] = useState<AmbientStepId>(1);
  const [completedSteps, setCompletedSteps] = useState<AmbientStepId[]>([]);
  const [direction, setDirection] = useState(1);

  // Restore state from existing video
  useEffect(() => {
    if (existingVideo) {
      setVideoTitle(existingVideo.title);
      
      // Restore current step
      if (existingVideo.currentStep !== null && existingVideo.currentStep !== undefined) {
        setActiveStep(existingVideo.currentStep as AmbientStepId);
      }
      
      // Restore completed steps
      if (existingVideo.completedSteps && Array.isArray(existingVideo.completedSteps)) {
        setCompletedSteps(existingVideo.completedSteps as AmbientStepId[]);
      }
      
      // Restore step1 data (animation mode, video generation mode)
      if (existingVideo.step1Data && typeof existingVideo.step1Data === 'object') {
        const step1 = existingVideo.step1Data as { animationMode?: string; videoGenerationMode?: string };
        if (step1.animationMode) {
          setAnimationMode(step1.animationMode as 'image-transitions' | 'video-animation');
        }
        if (step1.videoGenerationMode) {
          setVideoGenerationMode(step1.videoGenerationMode as 'image-reference' | 'start-end-frame');
        }
      }
    }
  }, [existingVideo]);

  // Show loading while workspace or video is being loaded
  if (isWorkspaceLoading || (!isNewVideo && isVideoLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  // Show error if no workspace
  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-red-500">No workspace selected</p>
          <p className="text-muted-foreground mt-2">Please select a workspace first.</p>
        </div>
      </div>
    );
  }

  const handleStepClick = (step: AmbientStepId) => {
    setDirection(step > activeStep ? 1 : -1);
    setActiveStep(step);
  };

  const handleNext = () => {
    const nextStep = (activeStep + 1) as AmbientStepId;
    if (nextStep <= 6) {
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
    if (prevStep >= 1) {
      setDirection(-1);
      setActiveStep(prevStep);
    }
  };

  const handleOnboardingComplete = async (config: {
    animationMode: 'image-transitions' | 'video-animation';
    videoGenerationMode?: 'image-reference' | 'start-end-frame';
  }) => {
    setAnimationMode(config.animationMode);
    setVideoGenerationMode(config.videoGenerationMode);
    setIsCreating(true);
    
    try {
      // Create video in database
      const response = await fetch('/api/ambient-visual/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workspaceId,
          title: videoTitle,
          animationMode: config.animationMode,
          videoGenerationMode: config.videoGenerationMode,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create video');
      }
      
      const video = await response.json();
      
      // Update state with new video ID
      setVideoId(video.id);
      
      // Update URL with new video ID (without page reload)
      window.history.replaceState(
        {},
        '',
        `/videos/ambient/${video.id}?workspace=${workspaceId}`
      );
      
      setShowOnboarding(false);
    } catch (error) {
      console.error('Failed to create video:', error);
      toast({
        title: "Error",
        description: "Failed to create video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Show onboarding first
  if (showOnboarding) {
    return (
      <AmbientOnboarding 
        projectName={videoTitle}
        onComplete={handleOnboardingComplete}
        isCreating={isCreating}
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
        videoId={videoId}
        initialAnimationMode={animationMode}
        initialVideoGenerationMode={videoGenerationMode}
      />
    </AmbientStudioLayout>
  );
}
