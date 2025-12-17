import { useState } from "react";
import { NarrativeWorkflow } from "@/components/narrative-workflow";
import { NarrativeModeSelector } from "@/components/narrative/narrative-mode-selector";
import { NarrativeStudioLayout } from "@/components/narrative/studio";
import type { NarrativeStepId } from "@/components/narrative/studio";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

export default function NarrativeMode() {
  const [videoTitle] = useState("Untitled Project");
  const [activeStep, setActiveStep] = useState<NarrativeStepId>("script");
  const [completedSteps, setCompletedSteps] = useState<NarrativeStepId[]>([]);
  const [direction, setDirection] = useState(1);
  const [narrativeMode, setNarrativeMode] = useState<"image-reference" | "start-end" | null>(null);
  
  const [videoId] = useState(`video-${Date.now()}`);
  const [workspaceId] = useState("workspace-1");
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

  // Show mode selector if no mode selected
  if (!narrativeMode) {
    return (
      <NarrativeModeSelector 
        onSelectMode={(mode) => setNarrativeMode(mode)}
        onBack={() => window.history.back()}
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
