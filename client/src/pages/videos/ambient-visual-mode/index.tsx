import { useState, useEffect, useRef } from "react";
import { useParams, useSearch, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AmbientVisualWorkflow, type AmbientVisualWorkflowRef } from "@/components/ambient/ambient-visual-workflow";
import { AmbientStudioLayout } from "@/components/ambient/studio";
import { AmbientOnboarding } from "@/components/ambient/onboarding";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AmbientStepId } from "@/components/ambient/studio";
import type { Video } from "@shared/schema";

export default function AmbientVisualModePage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const { toast } = useToast();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  const [, navigate] = useLocation();
  
  const initialVideoId = params.id || urlParams.get("id") || "new";
  const isNewVideo = initialVideoId === "new";
  
  // Use workspace from context, fallback to URL param for backwards compatibility
  const workspaceId = currentWorkspace?.id || urlParams.get("workspace");
  const urlTitle = urlParams.get("title") || "Untitled Ambient Visual";
  
  // Fetch existing video data
  const { data: existingVideo, isLoading: isVideoLoading, refetch } = useQuery<Video>({
    queryKey: [`/api/videos/${initialVideoId}`],
    enabled: !isNewVideo,
    staleTime: 0,  // Always refetch
    refetchOnMount: true,
  });
  
  // Debug: Log when video data changes
  useEffect(() => {
    console.log('[AmbientPage] existingVideo changed:', {
      id: existingVideo?.id,
      step1Data: existingVideo?.step1Data,
      step2Data: existingVideo?.step2Data,
      step3Data: existingVideo?.step3Data,
      step4Data: existingVideo?.step4Data,
      step5Data: existingVideo?.step5Data,
    });
  }, [existingVideo]);
  
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
  const [isSaving, setIsSaving] = useState(false);
  const [canContinue, setCanContinue] = useState(false);  // Validation state from workflow
  const [isGeneratingFlowDesign, setIsGeneratingFlowDesign] = useState(false);  // Flow design generation state
  
  // Export confirmation dialog state
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Ref to access workflow's save function
  const workflowRef = useRef<AmbientVisualWorkflowRef>(null);

  // Restore state from existing video
  useEffect(() => {
    if (existingVideo) {
      console.log('[AmbientPage] Restoring from existingVideo:', {
        id: existingVideo.id,
        title: existingVideo.title,
        currentStep: existingVideo.currentStep,
        step1Data: existingVideo.step1Data,
      });
      
      setVideoTitle(existingVideo.title);
      
      // Restore current step
      if (existingVideo.currentStep !== null && existingVideo.currentStep !== undefined) {
        let restoredStep = existingVideo.currentStep as AmbientStepId;
        
        // Safety check: if on step 7 but step7Data doesn't exist, go back to step 6
        // This can happen if the export process was interrupted
        if (restoredStep === 7 && !existingVideo.step7Data) {
          console.log('[AmbientPage] Step 7 but no step7Data, reverting to step 6');
          restoredStep = 6;
        }
        
        setActiveStep(restoredStep);
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
    // Prevent going back from step 7 (export)
    if (activeStep === 7 && step < 7) {
      toast({
        title: "Cannot go back",
        description: "Export has started. You cannot go back to previous steps.",
        variant: "destructive",
      });
      return;
    }
    setDirection(step > activeStep ? 1 : -1);
    setActiveStep(step);
  };

  // Handle export confirmation and transition to step 7
  const handleExportConfirm = async () => {
    setIsExporting(true);
    
    try {
      // Get current volumes from workflow/preview tab
      let volumes = null;
      if (workflowRef.current) {
        volumes = await workflowRef.current.getCurrentVolumes?.();
      }

      console.log('[AmbientPage] Starting export with volumes:', volumes);

      // Call continue-to-7 endpoint
      const response = await fetch(
        `/api/ambient-visual/videos/${videoId}/step/6/continue-to-7`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ volumes }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to start export');
      }

      // Close dialog
      setShowExportConfirm(false);

      // Start the actual render
      const renderResponse = await fetch(
        `/api/ambient-visual/videos/${videoId}/export/start-render`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!renderResponse.ok) {
        console.error('[AmbientPage] Failed to start render, but continuing to export page');
      }

      // Update local state
      if (!completedSteps.includes(6)) {
        setCompletedSteps([...completedSteps, 6]);
      }
      setDirection(1);
      setActiveStep(7);

      // Refetch video data to get updated step7Data
      refetch();

      toast({
        title: 'Export started',
        description: 'Your video is being rendered. This may take a few minutes.',
      });
    } catch (error) {
      console.error('[AmbientPage] Export error:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to start export',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleNext = async () => {
    const nextStep = (activeStep + 1) as AmbientStepId;
    if (nextStep <= 7) {
      // Special handling for Step 6 -> Step 7 (export)
      if (activeStep === 6) {
        // Show confirmation dialog instead of directly advancing
        setShowExportConfirm(true);
        return;
      }

      // For steps that need special transition handling (2, 4 and 5), use goToNextStep
      // Step 2: Auto-generates flow design before navigating
      // Step 4: Generates prompts before navigating (for video-animation mode)
      // Step 5: Special handling for soundscape
      if ((activeStep === 2 || activeStep === 4 || activeStep === 5) && workflowRef.current) {
        setIsSaving(true);
        try {
          await workflowRef.current.goToNextStep();
          // The workflow's goToNextStep will call onStepChange to update the step
          // and update the database, so we don't need to do it here
          // Also mark current step as completed
          if (!completedSteps.includes(activeStep)) {
            setCompletedSteps([...completedSteps, activeStep]);
          }
          // CRITICAL: Refetch video data after step 4->5 transition to get updated step5Data
          if (activeStep === 4) {
            console.log('[AmbientPage] Refetching video data after step 4->5 transition to get step5Data');
            await refetch();
          }
        } catch (error) {
          console.error(`Failed to continue from step ${activeStep}:`, error);
          // Error is already shown by the workflow component
        } finally {
          setIsSaving(false);
        }
        return;
      }
      
      // For other steps, save current step data before advancing
      if (workflowRef.current) {
        setIsSaving(true);
        const success = await workflowRef.current.saveCurrentStep();
        setIsSaving(false);
        
        if (!success) {
          // Save failed, don't advance
          return;
        }
      }
      
      // Mark current step as completed
      if (!completedSteps.includes(activeStep)) {
        setCompletedSteps([...completedSteps, activeStep]);
      }
      setDirection(1);
      setActiveStep(nextStep);
    }
  };

  const handleBack = () => {
    // Prevent going back from step 7
    if (activeStep === 7) {
      toast({
        title: "Cannot go back",
        description: "Export has started. You cannot go back to previous steps.",
        variant: "destructive",
      });
      return;
    }
    
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
    <>
      <AmbientStudioLayout
        currentStep={activeStep}
        completedSteps={completedSteps}
        direction={direction}
        onStepClick={handleStepClick}
        onNext={handleNext}
        onBack={handleBack}
        videoTitle={videoTitle}
        isNextDisabled={isSaving || !canContinue || isExporting || isGeneratingFlowDesign}
        nextLabel={
          isExporting ? "Exporting..." :
          isSaving ? "Saving..." : 
          activeStep === 6 ? "Export Video" :
          activeStep === 7 ? undefined : // No button on step 7
          undefined
        }
        hideNextButton={activeStep === 7}
        hideBackButton={activeStep === 7}
        disableMainScroll={activeStep === 7}
      >
        <AmbientVisualWorkflow 
          ref={workflowRef}
          activeStep={activeStep}
          onStepChange={(step) => {
            setDirection(step > activeStep ? 1 : -1);
            // Mark previous steps as completed
            if (!completedSteps.includes(activeStep)) {
              setCompletedSteps([...completedSteps, activeStep]);
            }
            setActiveStep(step as AmbientStepId);
          }}
          onSaveStateChange={setIsSaving}
          onValidationChange={setCanContinue}
          onGeneratingFlowDesignChange={setIsGeneratingFlowDesign}
          projectName={videoTitle}
          videoId={videoId}
          initialStep1Data={existingVideo?.step1Data as Record<string, unknown> | undefined}
          initialStep2Data={existingVideo?.step2Data as Record<string, unknown> | undefined}
          initialStep3Data={existingVideo?.step3Data as Record<string, unknown> | undefined}
          initialStep4Data={existingVideo?.step4Data as Record<string, unknown> | undefined}
          initialStep5Data={existingVideo?.step5Data as Record<string, unknown> | undefined}
          initialAnimationMode={animationMode}
          initialVideoGenerationMode={videoGenerationMode}
        />
      </AmbientStudioLayout>

      {/* Export Confirmation Dialog */}
      <AlertDialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
        <AlertDialogContent className="bg-[#1a1a1a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Ready to Export?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will start rendering your final video. Once export begins, you will not be able to go back and make changes to your video.
              <br /><br />
              <span className="text-white/80">
                Make sure you're happy with your preview before continuing.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              disabled={isExporting}
            >
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExportConfirm}
              disabled={isExporting}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:opacity-90 text-white border-0"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Export...
                </>
              ) : (
                'Yes, Export Video'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
