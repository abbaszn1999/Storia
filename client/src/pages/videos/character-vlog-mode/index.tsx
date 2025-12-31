import { useState } from "react";
import { CharacterVlogStudioLayout, type VlogStepId } from "@/components/character-vlog/studio";
import { CharacterVlogWorkflow } from "@/components/character-vlog/workflow";
import { CharacterVlogModeSelector } from "@/components/character-vlog/reference-mode-selector";
import { getDefaultVideoModel } from "@/constants/video-models";
import type { Character, Location } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

export default function CharacterVlogMode() {
  // Reference mode selection state - user must choose first
  const [referenceMode, setReferenceMode] = useState<"1F" | "2F" | "AI" | null>(null);
  
  const [videoTitle] = useState("Untitled Character Vlog");
  const [activeStep, setActiveStep] = useState<VlogStepId>("script");
  const [completedSteps, setCompletedSteps] = useState<VlogStepId[]>([]);
  const [direction, setDirection] = useState(1);
  const [canContinue, setCanContinue] = useState(false);
  
  const [videoId] = useState(`vlog-${Date.now()}`);
  const [workspaceId] = useState("workspace-1");
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [scriptModel, setScriptModel] = useState("gpt-4o");
  const [videoModel, setVideoModel] = useState(getDefaultVideoModel().value);
  const [narrationStyle, setNarrationStyle] = useState<"third-person" | "first-person">("first-person");
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  const [theme, setTheme] = useState("urban");
  const [numberOfScenes, setNumberOfScenes] = useState<number | 'auto'>('auto');
  const [shotsPerScene, setShotsPerScene] = useState<number | 'auto'>('auto');
  const [characterPersonality, setCharacterPersonality] = useState("energetic");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: any[] }>({});
  const [mainCharacter, setMainCharacter] = useState<Character | null>(null);
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

  const handleNext = () => {
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
    const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    setDirection(1);
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCanContinue(false);
      setActiveStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    setDirection(-1);
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setActiveStep(steps[prevIndex]);
    }
  };

  const handleStepClick = (stepId: VlogStepId) => {
    const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const targetIndex = steps.indexOf(stepId);
    setDirection(targetIndex > currentIndex ? 1 : -1);
    setActiveStep(stepId);
  };

  const handleReferenceModeSelect = (mode: "1F" | "2F" | "AI") => {
    setReferenceMode(mode);
  };

  // Show reference mode selector if no mode is selected yet
  if (!referenceMode) {
    return (
      <CharacterVlogModeSelector 
        onSelectMode={handleReferenceModeSelect}
        title="Narrative Mode"
        description="Choose how to generate your video animations"
      />
    );
  }

  // Convert reference mode to narrative mode format for backward compatibility
  // 1F -> "image-reference", 2F -> "start-end", AI -> "start-end" (AI decides per shot)
  const narrativeMode = referenceMode === "1F" ? "image-reference" : "start-end";

  return (
    <CharacterVlogStudioLayout
      currentStep={activeStep}
      completedSteps={completedSteps}
      direction={direction}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      videoTitle={videoTitle}
      isNextDisabled={!canContinue && activeStep !== "script"}
    >
            <CharacterVlogWorkflow 
              activeStep={activeStep}
              videoId={videoId}
              workspaceId={workspaceId}
              narrativeMode={narrativeMode}
              referenceMode={referenceMode}
              script={script}
              aspectRatio={aspectRatio}
              scriptModel={scriptModel}
              videoModel={videoModel}
              narrationStyle={narrationStyle}
              voiceActorId={voiceActorId}
              voiceOverEnabled={voiceOverEnabled}
        theme={theme}
        numberOfScenes={numberOfScenes}
        shotsPerScene={shotsPerScene}
        characterPersonality={characterPersonality}
              scenes={scenes}
              shots={shots}
              shotVersions={shotVersions}
              characters={characters}
        locations={locations}
              referenceImages={referenceImages}
              continuityLocked={continuityLocked}
              continuityGroups={continuityGroups}
              mainCharacter={mainCharacter}
              worldSettings={worldSettings}
              onScriptChange={setScript}
              onAspectRatioChange={setAspectRatio}
              onScriptModelChange={setScriptModel}
              onVideoModelChange={setVideoModel}
              onNarrationStyleChange={setNarrationStyle}
              onVoiceActorChange={setVoiceActorId}
              onVoiceOverToggle={setVoiceOverEnabled}
        onThemeChange={setTheme}
        onNumberOfScenesChange={setNumberOfScenes}
        onShotsPerSceneChange={setShotsPerScene}
        onCharacterPersonalityChange={setCharacterPersonality}
              onScenesChange={setScenes}
              onShotsChange={setShots}
              onShotVersionsChange={setShotVersions}
              onCharactersChange={setCharacters}
        onLocationsChange={setLocations}
              onReferenceImagesChange={setReferenceImages}
              onContinuityLockedChange={setContinuityLocked}
              onContinuityGroupsChange={setContinuityGroups}
              onMainCharacterChange={setMainCharacter}
              onWorldSettingsChange={setWorldSettings}
              onNext={handleNext}
            />
    </CharacterVlogStudioLayout>
  );
}
