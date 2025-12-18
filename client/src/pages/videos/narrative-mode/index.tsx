import { useState } from "react";
import { useParams, useSearch } from "wouter";
import { NarrativeWorkflow } from "@/components/narrative-workflow";
import { NarrativeModeSelector } from "@/components/narrative/narrative-mode-selector";
import { NarrativeStudioLayout } from "@/components/narrative/studio";
import { useWorkspace } from "@/contexts/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { NarrativeStepId } from "@/components/narrative/studio";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

export default function NarrativeMode() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const { toast } = useToast();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  
  const initialVideoId = params.id || urlParams.get("id") || "new";
  const workspaceId = currentWorkspace?.id || urlParams.get("workspace");
  const videoTitle = urlParams.get("title") || "Untitled Project";
  
  const [videoId, setVideoId] = useState<string>(initialVideoId);
  const [showModeSelector, setShowModeSelector] = useState(initialVideoId === "new");
  const [isCreating, setIsCreating] = useState(false);
  
  const [activeStep, setActiveStep] = useState<NarrativeStepId>("script");
  const [completedSteps, setCompletedSteps] = useState<NarrativeStepId[]>([]);
  const [direction, setDirection] = useState(1);
  const [narrativeMode, setNarrativeMode] = useState<"image-reference" | "start-end" | null>(null);
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [scriptModel, setScriptModel] = useState("gpt-4o");
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
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
    locations?: Array<{ id: string; name: string; description: string }>;
    imageInstructions?: string;
    videoInstructions?: string;
  }>({
    artStyle: "none",
    imageModel: "Flux",
    worldDescription: "",
    locations: [],
    imageInstructions: "",
    videoInstructions: "",
  });

  const handleStepClick = (step: NarrativeStepId) => {
    const steps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const newIndex = steps.indexOf(step);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveStep(step);
  };

  const handleNext = () => {
    const steps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < steps.length) {
      // Mark current step as completed
      if (!completedSteps.includes(activeStep)) {
        setCompletedSteps([...completedSteps, activeStep]);
      }
      setDirection(1);
      setActiveStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const steps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      setDirection(-1);
      setActiveStep(steps[prevIndex]);
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
    
    setIsCreating(true);
    
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
      setIsCreating(false);
    }
  };

  // Show loading while workspace is being loaded
  if (isWorkspaceLoading) {
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

  // Show mode selector if no mode selected
  if (showModeSelector || !narrativeMode) {
    return (
      <NarrativeModeSelector 
        onSelectMode={handleModeSelect}
        onBack={() => window.history.back()}
        isCreating={isCreating}
      />
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
        onScenesChange={setScenes}
        onShotsChange={setShots}
        onShotVersionsChange={setShotVersions}
        onCharactersChange={setCharacters}
        onReferenceImagesChange={setReferenceImages}
        onContinuityLockedChange={setContinuityLocked}
        onContinuityGroupsChange={setContinuityGroups}
        onWorldSettingsChange={setWorldSettings}
        onNext={handleNext}
      />
    </NarrativeStudioLayout>
  );
}
