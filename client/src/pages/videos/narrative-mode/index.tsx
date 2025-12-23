import { useState, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NarrativeWorkflow } from "@/components/narrative-workflow";
import { NarrativeModeSelector } from "@/components/narrative/narrative-mode-selector";
import { NarrativeStudioLayout } from "@/components/narrative/studio";
import { useWorkspace } from "@/contexts/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { NarrativeStepId } from "@/components/narrative/studio";
import type { Character, Video } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

export default function NarrativeMode() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const { toast } = useToast();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  
  const initialVideoId = params.id || urlParams.get("id") || "new";
  const isNewVideo = initialVideoId === "new";
  
  // Use workspace from context, fallback to URL param for backwards compatibility
  const workspaceId = currentWorkspace?.id || urlParams.get("workspace");
  const urlTitle = urlParams.get("title") || "Untitled Project";
  
  // Fetch existing video data
  const { data: existingVideo, isLoading: isVideoLoading } = useQuery<Video>({
    queryKey: [`/api/videos/${initialVideoId}`],
    enabled: !isNewVideo,
    staleTime: 0,  // Always refetch
    refetchOnMount: true,
  });
  
  // Debug: Log when video data changes
  useEffect(() => {
    console.log('[NarrativePage] existingVideo changed:', existingVideo?.id, 'narrativeMode:', existingVideo?.narrativeMode);
  }, [existingVideo]);
  
  const [videoId, setVideoId] = useState<string>(initialVideoId);
  const [videoTitle, setVideoTitle] = useState<string>(urlTitle);
  const [showModeSelector, setShowModeSelector] = useState(isNewVideo);
  const [creatingMode, setCreatingMode] = useState<"image-reference" | "start-end" | null>(null);
  
  const [activeStep, setActiveStep] = useState<NarrativeStepId>("script");
  const [completedSteps, setCompletedSteps] = useState<NarrativeStepId[]>([]);
  const [direction, setDirection] = useState(1);
  const [canContinue, setCanContinue] = useState(false);  // Validation state from workflow
  const [narrativeMode, setNarrativeMode] = useState<"image-reference" | "start-end" | null>(null);
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [scriptModel, setScriptModel] = useState("gpt-4o");
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  // Step 1 settings
  const [duration, setDuration] = useState("60");
  const [genres, setGenres] = useState<string[]>(["Adventure"]);
  const [tones, setTones] = useState<string[]>(["Dramatic"]);
  const [language, setLanguage] = useState("English");
  const [userIdea, setUserIdea] = useState("");
  const [numberOfScenes, setNumberOfScenes] = useState<number | 'auto'>('auto');
  const [shotsPerScene, setShotsPerScene] = useState<number | 'auto'>('auto');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [characters, setCharacters] = useState<Character[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: any[] }>({});
  const [worldSettings, setWorldSettings] = useState<{ 
    artStyle: string; 
    imageModel?: string;
    worldDescription?: string;
    locations?: Array<{ id: string; name: string; description: string; details?: string; imageUrl?: string | null }>;
    imageInstructions?: string;
    videoInstructions?: string;
    cinematicInspiration?: string;
  }>({
    artStyle: "none",
    imageModel: "flux-2-dev",
    worldDescription: "",
    locations: [],
    imageInstructions: "",
    videoInstructions: "",
    cinematicInspiration: "",
  });

  // Restore state from existing video
  useEffect(() => {
    if (existingVideo) {
      console.log('[NarrativePage] Restoring from existingVideo:', {
        id: existingVideo.id,
        title: existingVideo.title,
        narrativeMode: existingVideo.narrativeMode,
        currentStep: existingVideo.currentStep,
        step1Data: existingVideo.step1Data,
      });
      
      setVideoTitle(existingVideo.title);
      
      // Restore step1 data (narrativeMode is stored inside step1Data)
      if (existingVideo.step1Data && typeof existingVideo.step1Data === 'object') {
        const step1 = existingVideo.step1Data as { 
          narrativeMode?: string;
          script?: string; 
          aspectRatio?: string;
          scriptModel?: string;
          voiceActorId?: string;
          voiceOverEnabled?: boolean;
          duration?: number;
          genres?: string[];
          tones?: string[];
          language?: string;
          userIdea?: string;
        };
        
        // Restore narrative mode from step1Data (primary location) or top-level (fallback)
        if (step1.narrativeMode) {
          setNarrativeMode(step1.narrativeMode as "image-reference" | "start-end");
        } else if (existingVideo.narrativeMode) {
          setNarrativeMode(existingVideo.narrativeMode as "image-reference" | "start-end");
        }
        
        // Restore all step1 fields
        if (step1.script) setScript(step1.script);
        if (step1.aspectRatio) setAspectRatio(step1.aspectRatio);
        if (step1.scriptModel) setScriptModel(step1.scriptModel);
        if (step1.voiceActorId) setVoiceActorId(step1.voiceActorId);
        if (step1.voiceOverEnabled !== undefined) setVoiceOverEnabled(step1.voiceOverEnabled);
        
        // Restore settings
        if (step1.duration !== undefined) setDuration(String(step1.duration));
        if (step1.genres && step1.genres.length > 0) setGenres(step1.genres);
        if (step1.tones && step1.tones.length > 0) setTones(step1.tones);
        if (step1.language) setLanguage(step1.language);
        if (step1.userIdea) setUserIdea(step1.userIdea);
        
        console.log('[NarrativePage] Restored step1 data:', {
          hasScript: !!step1.script,
          scriptModel: step1.scriptModel,
          aspectRatio: step1.aspectRatio,
          duration: step1.duration,
          genres: step1.genres,
          tones: step1.tones,
          language: step1.language,
          userIdea: step1.userIdea,
        });
      } else if (existingVideo.narrativeMode) {
        // Fallback: try top-level narrativeMode if no step1Data
        setNarrativeMode(existingVideo.narrativeMode as "image-reference" | "start-end");
      }
      
      // Step ID mapping (numeric to string)
      const stepMap: { [key: number]: NarrativeStepId } = {
        1: "script",
        2: "world", 
        3: "breakdown",
        4: "storyboard",
        5: "animatic",
        6: "export"
      };
      const allSteps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
      
      // Restore completed steps (convert numeric to string if needed)
      let restoredCompletedSteps: NarrativeStepId[] = [];
      if (existingVideo.completedSteps && Array.isArray(existingVideo.completedSteps)) {
        restoredCompletedSteps = existingVideo.completedSteps.map(s => 
          typeof s === 'number' ? stepMap[s] : s
        ).filter(Boolean) as NarrativeStepId[];
        setCompletedSteps(restoredCompletedSteps);
      }
      
      // Find the first uncompleted step and navigate there
      // This ensures the user continues from where they left off
      const firstUncompletedStep = allSteps.find(step => !restoredCompletedSteps.includes(step));
      
      if (firstUncompletedStep) {
        console.log('[NarrativePage] Navigating to first uncompleted step:', firstUncompletedStep);
        setActiveStep(firstUncompletedStep);
      } else if (existingVideo.currentStep !== null && existingVideo.currentStep !== undefined) {
        // All steps completed - restore to the saved current step
        const step = typeof existingVideo.currentStep === 'number' 
          ? stepMap[existingVideo.currentStep] 
          : existingVideo.currentStep as NarrativeStepId;
        if (step) {
          console.log('[NarrativePage] All steps completed, restoring to:', step);
          setActiveStep(step);
        }
      }
      
      // Restore step2 data (world settings, characters, locations)
      if (existingVideo.step2Data && typeof existingVideo.step2Data === 'object') {
        const step2 = existingVideo.step2Data as {
          artStyle?: string;
          imageModel?: string;
          worldDescription?: string;
          locations?: Array<{ id: string; name: string; description: string; details?: string; imageUrl?: string | null }>;
          imageInstructions?: string;
          videoInstructions?: string;
          cinematicInspiration?: string;
          styleReference?: string[];
          characters?: Character[];
        };
        
        // Restore world settings
        setWorldSettings({
          artStyle: step2.artStyle || "none",
          imageModel: step2.imageModel || "flux-2-dev",
          worldDescription: step2.worldDescription || "",
          locations: step2.locations || [],
          imageInstructions: step2.imageInstructions || "",
          videoInstructions: step2.videoInstructions || "",
          cinematicInspiration: step2.cinematicInspiration || "",
        });

        // Restore characters from step2Data (preferred over step4Data)
        if (step2.characters && Array.isArray(step2.characters)) {
          setCharacters(step2.characters);
        }

        // Restore style reference images from step2Data.styleReference
        if (step2.styleReference && Array.isArray(step2.styleReference) && step2.styleReference.length > 0) {
          const styleRefImages: ReferenceImage[] = step2.styleReference.map((url, index) => ({
            id: `style-ref-${index}-${Date.now()}`,
            videoId: existingVideo.id,
            shotId: null,
            characterId: null,
            type: "style",
            imageUrl: url,
            description: null,
            createdAt: new Date(),
          }));
          
          // Merge with existing reference images (don't overwrite character references)
          setReferenceImages(prev => {
            const nonStyleRefs = prev.filter(r => r.type !== "style");
            return [...nonStyleRefs, ...styleRefImages];
          });
        }
      }
      
      // Restore step3 data (scenes, shots, continuity)
      if (existingVideo.step3Data && typeof existingVideo.step3Data === 'object') {
        const step3 = existingVideo.step3Data as { 
          scenes?: Scene[]; 
          shots?: { [sceneId: string]: Shot[] };
          continuityLocked?: boolean;
          continuityGroups?: { [sceneId: string]: any[] };
        };
        if (step3.scenes) setScenes(step3.scenes);
        if (step3.shots) setShots(step3.shots);
        if (step3.continuityLocked !== undefined) setContinuityLocked(step3.continuityLocked);
        if (step3.continuityGroups) setContinuityGroups(step3.continuityGroups);
      }
      
      // Restore step4 data (shot versions, reference images - only if not already restored from step2)
      if (existingVideo.step4Data && typeof existingVideo.step4Data === 'object') {
        const step4 = existingVideo.step4Data as { 
          shotVersions?: { [shotId: string]: ShotVersion[] };
          characters?: Character[];
          referenceImages?: ReferenceImage[];
        };
        if (step4.shotVersions) setShotVersions(step4.shotVersions);
        
        // Only restore characters from step4Data if not already restored from step2Data
        // Check if step2Data had characters to avoid overwriting
        const step2HadCharacters = existingVideo.step2Data && 
          typeof existingVideo.step2Data === 'object' && 
          (existingVideo.step2Data as any).characters && 
          Array.isArray((existingVideo.step2Data as any).characters);
        
        if (step4.characters && Array.isArray(step4.characters) && !step2HadCharacters) {
          setCharacters(step4.characters);
        }
        
        // Only restore reference images from step4Data if not already restored from step2Data
        // Check if step2Data had styleReference to avoid overwriting
        const step2HadStyleRefs = existingVideo.step2Data && 
          typeof existingVideo.step2Data === 'object' && 
          (existingVideo.step2Data as any).styleReference && 
          Array.isArray((existingVideo.step2Data as any).styleReference);
        
        if (step4.referenceImages && Array.isArray(step4.referenceImages) && !step2HadStyleRefs) {
          setReferenceImages(step4.referenceImages);
        }
      }
    }
  }, [existingVideo]);

  // Save step progress to database
  const saveStepProgress = async (newCurrentStep: NarrativeStepId, newCompletedSteps: NarrativeStepId[]) => {
    if (!videoId || videoId === 'new') {
      console.warn('[NarrativePage] Cannot save step progress - no valid videoId');
      return;
    }

    // Convert step IDs to numbers for storage (1, 2, 3, 4, 5, 6)
    const stepToNumberMap: { [key in NarrativeStepId]: number } = {
      "script": 1,
      "world": 2,
      "breakdown": 3,
      "storyboard": 4,
      "animatic": 5,
      "export": 6
    };

    const currentStepNumber = stepToNumberMap[newCurrentStep];
    const completedStepsNumbers = newCompletedSteps.map(step => stepToNumberMap[step]);

    console.log('[NarrativePage] Saving step progress:', { 
      videoId, 
      currentStep: currentStepNumber, 
      completedSteps: completedStepsNumbers 
    });

    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/step-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentStep: currentStepNumber,
          completedSteps: completedStepsNumbers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[NarrativePage] Step progress save failed:', errorData);
      } else {
        console.log('[NarrativePage] Step progress saved successfully');
      }
    } catch (error) {
      console.error('[NarrativePage] Step progress save error:', error);
    }
  };

  // Save Step 1 data to database
  const saveStep1Data = async (step1Data: {
    script: string;
    duration?: number;
    genres?: string[];
    tones?: string[];
    language?: string;
    aspectRatio?: string;
    scriptModel?: string;
    userIdea?: string;
  }) => {
    if (!videoId || videoId === 'new') {
      console.warn('[NarrativePage] Cannot save step1 data - no valid videoId');
      return;
    }

    console.log('[NarrativePage] Saving step1 data:', {
      videoId,
      hasScript: !!step1Data.script && step1Data.script.length > 0,
      duration: step1Data.duration,
      genresCount: step1Data.genres?.length || 0,
      tonesCount: step1Data.tones?.length || 0,
    });

    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/step1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(step1Data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[NarrativePage] Step1 data save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save step1 data');
      }

      const result = await response.json();
      console.log('[NarrativePage] Step1 data saved successfully');
      return result;
    } catch (error) {
      console.error('[NarrativePage] Step1 data save error:', error);
      throw error;
    }
  };

  // Save Step 2 data to database
  const saveStep2Data = async (step2Data: {
    imageModel: string;
    artStyle: string;
    styleReference?: string[];
    cinematicInspiration?: string;
    worldDescription: string;
    imageInstructions: string;
    videoInstructions: string;
    characters: Character[];
    locations: Array<{ id: string; name: string; description: string; details?: string; imageUrl?: string | null }>;
  }) => {
    if (!videoId || videoId === 'new') {
      console.warn('[NarrativePage] Cannot save step2 data - no valid videoId');
      return;
    }

    console.log('[NarrativePage] Saving step2 data:', {
      videoId,
      imageModel: step2Data.imageModel,
      artStyle: step2Data.artStyle,
      hasStyleReference: !!step2Data.styleReference && step2Data.styleReference.length > 0,
      charactersCount: step2Data.characters.length,
      locationsCount: step2Data.locations.length,
    });

    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/step2`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(step2Data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[NarrativePage] Step2 data save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save step2 data');
      }

      const result = await response.json();
      console.log('[NarrativePage] Step2 data saved successfully');
      return result;
    } catch (error) {
      console.error('[NarrativePage] Step2 data save error:', error);
      throw error;
    }
  };

  const handleStepClick = (step: NarrativeStepId) => {
    const steps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const newIndex = steps.indexOf(step);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveStep(step);
    
    // Save current step to database (without marking as completed)
    saveStepProgress(step, completedSteps);
  };

  const handleNext = async () => {
    const steps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < steps.length) {
      // If we're on the "script" step, save Step1Data before proceeding
      if (activeStep === "script") {
        try {
          // Build complete Step1Data object
          const step1Data = {
            script: script,
            duration: parseInt(duration),
            genres: genres,
            tones: tones,
            language: language,
            aspectRatio: aspectRatio,
            scriptModel: scriptModel,
            userIdea: userIdea,
            // narrativeMode is stored separately in video metadata, not in step1Data
          };

          // Save Step1Data before proceeding
          await saveStep1Data(step1Data);
        } catch (error) {
          toast({
            title: "Save Failed",
            description: error instanceof Error ? error.message : "Failed to save script settings. Please try again.",
            variant: "destructive",
          });
          // Don't proceed to next step if save failed
          return;
        }
      }

      // If we're on the "world" step, save Step2Data before proceeding
      if (activeStep === "world") {
        try {
          // Collect style reference URLs (filter by type === "style")
          const styleRefs = referenceImages.filter(r => r.type === "style");
          const styleReference = styleRefs.map(r => r.imageUrl);

          // Build complete Step2Data object
          const step2Data = {
            imageModel: worldSettings.imageModel || "flux-2-dev",
            artStyle: worldSettings.artStyle || "none",
            styleReference: styleReference.length > 0 ? styleReference : undefined,
            cinematicInspiration: worldSettings.cinematicInspiration || undefined,
            worldDescription: worldSettings.worldDescription || "",
            imageInstructions: worldSettings.imageInstructions || "",
            videoInstructions: worldSettings.videoInstructions || "",
            characters: characters,
            locations: worldSettings.locations || [],
          };

          // Save Step2Data before proceeding
          await saveStep2Data(step2Data);
        } catch (error) {
          toast({
            title: "Save Failed",
            description: error instanceof Error ? error.message : "Failed to save world settings. Please try again.",
            variant: "destructive",
          });
          // Don't proceed to next step if save failed
          return;
        }
      }

      // Mark current step as completed
      const newCompletedSteps = completedSteps.includes(activeStep) 
        ? completedSteps 
        : [...completedSteps, activeStep];
      
      const nextStep = steps[nextIndex];
      
      // Update local state
      setCompletedSteps(newCompletedSteps);
      setDirection(1);
      setActiveStep(nextStep);
      
      // Save to database
      await saveStepProgress(nextStep, newCompletedSteps);
    }
  };

  const handleBack = () => {
    const steps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      const prevStep = steps[prevIndex];
      setDirection(-1);
      setActiveStep(prevStep);
      
      // Save current step to database (don't modify completed steps when going back)
      saveStepProgress(prevStep, completedSteps);
    }
  };

  const handleModeSelect = async (mode: "image-reference" | "start-end") => {
    if (!workspaceId) {
      toast({
        title: "Error",
        description: "No workspace selected. Please select a workspace first.",
        variant: "destructive",
      });
      return;
    }
    
    setCreatingMode(mode);
    
    try {
      // Create video in database
      const response = await fetch('/api/narrative/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workspaceId,
          title: videoTitle,
          mode: 'narrative',
          narrativeMode: mode,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create video');
      }
      
      const video = await response.json();
      
      // Update state with new video ID
      setVideoId(video.id);
      setNarrativeMode(mode);
      
      // Update URL with new video ID (without page reload)
      window.history.replaceState(
        {},
        '',
        `/videos/narrative/${video.id}?workspace=${workspaceId}`
      );
      
      setShowModeSelector(false);
    } catch (error) {
      console.error('Failed to create video:', error);
      toast({
        title: "Error",
        description: "Failed to create video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingMode(null);
    }
  };

  // Show loading while workspace or video is being loaded
  if (isWorkspaceLoading || (!isNewVideo && isVideoLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  // Show mode selector only for new videos that haven't selected a mode yet
  if (showModeSelector) {
    return (
      <NarrativeModeSelector 
        onSelectMode={handleModeSelect}
        onBack={() => window.history.back()}
        creatingMode={creatingMode}
      />
    );
  }

  // For existing videos, wait until narrativeMode is restored from the database
  // This handles the timing gap between video loading and useEffect running
  if (!narrativeMode) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <NarrativeStudioLayout
      currentStep={activeStep}
      completedSteps={completedSteps}
      direction={direction}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      videoTitle={videoTitle}
      isNextDisabled={!canContinue}
    >
      <NarrativeWorkflow 
        activeStep={activeStep}
        videoId={videoId}
        workspaceId={workspaceId}
        narrativeMode={narrativeMode}
        script={script}
        aspectRatio={aspectRatio}
        scriptModel={scriptModel}
        voiceActorId={voiceActorId}
        voiceOverEnabled={voiceOverEnabled}
        duration={duration}
        genres={genres}
        tones={tones}
        language={language}
        userIdea={userIdea}
        numberOfScenes={numberOfScenes}
        shotsPerScene={shotsPerScene}
        scenes={scenes}
        shots={shots}
        shotVersions={shotVersions}
        characters={characters}
        referenceImages={referenceImages}
        continuityLocked={continuityLocked}
        continuityGroups={continuityGroups}
        worldSettings={worldSettings}
        onScriptChange={setScript}
        onAspectRatioChange={setAspectRatio}
        onScriptModelChange={setScriptModel}
        onVoiceActorChange={setVoiceActorId}
        onVoiceOverToggle={setVoiceOverEnabled}
        onNumberOfScenesChange={setNumberOfScenes}
        onShotsPerSceneChange={setShotsPerScene}
        onScenesChange={setScenes}
        onShotsChange={setShots}
        onShotVersionsChange={setShotVersions}
        onCharactersChange={setCharacters}
        onReferenceImagesChange={setReferenceImages}
        onContinuityLockedChange={setContinuityLocked}
        onContinuityGroupsChange={setContinuityGroups}
        onWorldSettingsChange={setWorldSettings}
        onValidationChange={setCanContinue}
        onNext={handleNext}
      />
    </NarrativeStudioLayout>
  );
}
