import { useState } from "react";
import { ArrowLeft, Check, User } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CharacterVlogWorkflow } from "@/components/character-vlog";
import { NarrativeModeSelector } from "@/components/narrative/narrative-mode-selector";
import type { Scene, Shot, ShotVersion, Character, ReferenceImage } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const steps = [
  { id: "script", label: "Script" },
  { id: "world", label: "Character & World" },
  { id: "breakdown", label: "Breakdown" },
  { id: "storyboard", label: "Storyboard" },
  { id: "animatic", label: "Animatic" },
  { id: "export", label: "Export" },
];

export default function CharacterVlogMode() {
  const [videoTitle] = useState("Untitled Character Vlog");
  const [activeStep, setActiveStep] = useState("script");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [narrativeMode, setNarrativeMode] = useState<"image-reference" | "start-end" | null>(null);
  
  const [videoId] = useState(`vlog-${Date.now()}`);
  const [workspaceId] = useState("workspace-1");
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [scriptModel, setScriptModel] = useState("gpt-4o");
  const [narrationStyle, setNarrationStyle] = useState<"third-person" | "first-person">("third-person");
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [characters, setCharacters] = useState<Character[]>([]);
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

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  const currentStepIndex = steps.findIndex((s) => s.id === activeStep);

  const handleNext = () => {
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setActiveStep(steps[nextIndex].id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild data-testid="button-back">
                <Link href="/videos">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <User className="h-3 w-3" />
                  Character Vlog
                </Badge>
                <h1 className="text-sm font-semibold truncate max-w-[200px]">{videoTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all hover-elevate ${
                    activeStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : isStepCompleted(step.id)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground"
                  }`}
                  data-testid={`button-step-${step.id}`}
                >
                  {isStepCompleted(step.id) && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span className="whitespace-nowrap">{step.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {!narrativeMode ? (
            <div className="flex items-center justify-center min-h-[600px]">
              <NarrativeModeSelector 
                onSelectMode={(mode) => setNarrativeMode(mode)} 
                title="Choose Your Character Vlog Style"
                description="Select how you want to create visuals for your character's story"
              />
            </div>
          ) : (
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
              scenes={scenes}
              shots={shots}
              shotVersions={shotVersions}
              characters={characters}
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
              onScenesChange={setScenes}
              onShotsChange={setShots}
              onShotVersionsChange={setShotVersions}
              onCharactersChange={setCharacters}
              onReferenceImagesChange={setReferenceImages}
              onContinuityLockedChange={setContinuityLocked}
              onContinuityGroupsChange={setContinuityGroups}
              onMainCharacterChange={setMainCharacter}
              onWorldSettingsChange={setWorldSettings}
              onNext={handleNext}
            />
          )}
        </div>
      </main>
    </div>
  );
}
