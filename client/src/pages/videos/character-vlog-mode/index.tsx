import { useState } from "react";
import { CharacterVlogStudioLayout, type VlogStepId } from "@/components/character-vlog/studio";
import { CharacterVlogWorkflow } from "@/components/character-vlog/workflow";
import type { Character, Location } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

export default function CharacterVlogMode() {
  const [videoTitle] = useState("Untitled Character Vlog");
  const [activeStep, setActiveStep] = useState<VlogStepId>("script");
  const [completedSteps, setCompletedSteps] = useState<VlogStepId[]>([]);
  const [direction, setDirection] = useState(1);
  const [canContinue, setCanContinue] = useState(false);
  // Character vlog mode uses start-end where AI agent decides per-shot generation method
  const [narrativeMode] = useState<"image-reference" | "start-end">("start-end");
  
  const [videoId] = useState(`vlog-${Date.now()}`);
  const [workspaceId] = useState("workspace-1");
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [scriptModel, setScriptModel] = useState("gpt-4o");
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
              script={script}
              aspectRatio={aspectRatio}
              scriptModel={scriptModel}
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
